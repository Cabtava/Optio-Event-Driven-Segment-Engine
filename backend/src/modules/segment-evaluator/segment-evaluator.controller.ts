import {
  Controller,
  NotFoundException,
  Param,
  Post,
  Query,
} from '@nestjs/common';
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
    const existingSegment =
      await this.segmentEvaluatorService.getSegmentById(segmentId);

    if (!existingSegment) {
      throw new NotFoundException(`Segment with id ${segmentId} not found`);
    }

    await this.messagingService.publishSegmentRecompute({
      segmentId,
      triggerType: triggerType ?? 'MANUAL_REFRESH',
    });

    return {
      queued: true,
      segmentId,
      segmentName: existingSegment.name,
      triggerType: triggerType ?? 'MANUAL_REFRESH',
      queue: 'segment.recompute',
    };
  }
}
