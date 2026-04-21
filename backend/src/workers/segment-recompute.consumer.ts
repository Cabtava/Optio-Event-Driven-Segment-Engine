import { Controller, Logger } from '@nestjs/common';
import { Ctx, EventPattern, Payload, RmqContext } from '@nestjs/microservices';
import { SEGMENT_RECOMPUTE_QUEUE } from '../messaging/messaging.constants';
import { SegmentEvaluatorService } from '../modules/segment-evaluator/segment-evaluator.service';

@Controller()
export class SegmentRecomputeConsumer {
  private readonly logger = new Logger(SegmentRecomputeConsumer.name);

  constructor(
    private readonly segmentEvaluatorService: SegmentEvaluatorService,
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

      const result = await this.segmentEvaluatorService.recomputeSegment(
        payload.segmentId,
        payload.triggerType,
      );

      this.logger.log(
        `Recompute completed for segment ${payload.segmentId}: ${JSON.stringify(result)}`,
      );

      channel.ack(originalMessage);
    } catch (error) {
      this.logger.error(
        `Recompute failed for segment ${payload.segmentId}`,
        error instanceof Error ? error.stack : String(error),
      );

      channel.nack(originalMessage, false, false);
    }
  }
}