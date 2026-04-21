import { Controller, Param, Post, Query } from '@nestjs/common';
import { SegmentEvaluatorService } from './segment-evaluator.service';

@Controller('segments')
export class SegmentEvaluatorController {
  constructor(
    private readonly segmentEvaluatorService: SegmentEvaluatorService,
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
}