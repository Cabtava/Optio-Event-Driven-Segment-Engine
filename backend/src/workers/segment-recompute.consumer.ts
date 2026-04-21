import { Controller, Logger } from '@nestjs/common';
import { Ctx, EventPattern, Payload, RmqContext } from '@nestjs/microservices';
import { EvaluationTriggerType } from '@prisma/client';
import { SEGMENT_RECOMPUTE_QUEUE } from '../messaging/messaging.constants';
import { MessagingService } from '../messaging/messaging.service';
import { SegmentEvaluatorService } from '../modules/segment-evaluator/segment-evaluator.service';

type SegmentRecomputeSkippedResult = {
  skipped: true;
  reason: string;
  segmentId: string;
};

type SegmentRecomputeSuccessResult = {
  segmentId: string;
  segmentName: string;
  triggerType: EvaluationTriggerType;
  previousVersion: number;
  nextVersion: number;
  oldCount: number;
  newCount: number;
  addedCount: number;
  removedCount: number;
  added: string[];
  removed: string[];
  hasChanges: boolean;
  cascadedSegments: Array<{
    segmentId: string;
    segmentName: string;
    result: any;
  }>;
};

type SegmentRecomputeResult =
  | SegmentRecomputeSkippedResult
  | SegmentRecomputeSuccessResult;

@Controller()
export class SegmentRecomputeConsumer {
  private readonly logger = new Logger(SegmentRecomputeConsumer.name);

  constructor(
    private readonly segmentEvaluatorService: SegmentEvaluatorService,
    private readonly messagingService: MessagingService,
  ) {}

  @EventPattern(SEGMENT_RECOMPUTE_QUEUE)
  async handleSegmentRecompute(
    @Payload() payload: { segmentId: string; triggerType: string },
    @Ctx() context: RmqContext,
  ) {
    const channel = context.getChannelRef();
    const originalMessage = context.getMessage();

    try {
      this.logger.log(
        `Received recompute event for segment ${payload.segmentId} with trigger ${payload.triggerType}`,
      );

      const result = (await this.segmentEvaluatorService.recomputeSegment(
        payload.segmentId,
        payload.triggerType,
      )) as SegmentRecomputeResult;

      this.logger.log(
        `Recompute completed for segment ${payload.segmentId}: ${JSON.stringify(result)}`,
      );

      if (!this.isSuccessResult(result)) {
        this.logger.log(
          `Skipping delta publish for segment ${payload.segmentId} because it was already processed in cascade`,
        );

        channel.ack(originalMessage);
        return;
      }

      const deltaPayload = {
        segmentId: result.segmentId,
        segmentName: result.segmentName,
        triggerType: result.triggerType,
        previousVersion: result.previousVersion,
        nextVersion: result.nextVersion,
        oldCount: result.oldCount,
        newCount: result.newCount,
        addedCount: result.addedCount,
        removedCount: result.removedCount,
        added: result.added,
        removed: result.removed,
        hasChanges: result.hasChanges,
        cascadedSegments: result.cascadedSegments,
      };

      await this.messagingService.publishSegmentDeltaToUi(deltaPayload);
      await this.messagingService.publishSegmentDeltaToCampaign(deltaPayload);

      channel.ack(originalMessage);
    } catch (error) {
      this.logger.error(
        `Recompute failed for segment ${payload.segmentId}`,
        error instanceof Error ? error.stack : String(error),
      );

      channel.nack(originalMessage, false, false);
    }
  }

  private isSuccessResult(
    result: SegmentRecomputeResult,
  ): result is SegmentRecomputeSuccessResult {
    return !('skipped' in result);
  }
}