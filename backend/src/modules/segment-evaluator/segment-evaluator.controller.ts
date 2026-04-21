import { Controller, Param, Post, Query } from '@nestjs/common';
import { SegmentEvaluatorService } from './segment-evaluator.service';
import { MessagingService } from '../../messaging/messaging.service';

@Controller('segments')
export class SegmentEvaluatorController {
  constructor(
    private readonly segmentEvaluatorService: SegmentEvaluatorService,
    private readonly messagingService: MessagingService,
  ) {}

  @Post(':id/recompute')
  recompute(
    @Param('id') segmentId: string,
    @Query('triggerType') triggerType?: string,
  ) {
    return this.segmentEvaluatorService.recomputeSegment(
      segmentId,
      triggerType ?? 'MANUAL_REFRESH',
    );
  }

  @Post(':id/recompute-async')
  async recomputeAsync(
    @Param('id') segmentId: string,
    @Query('triggerType') triggerType?: string,
  ) {
    await this.messagingService.publishSegmentRecompute({
      segmentId,
      triggerType: triggerType ?? 'MANUAL_REFRESH',
    });

    return {
      queued: true,
      segmentId,
      triggerType: triggerType ?? 'MANUAL_REFRESH',
      queue: 'segment.recompute',
    };
  }
}