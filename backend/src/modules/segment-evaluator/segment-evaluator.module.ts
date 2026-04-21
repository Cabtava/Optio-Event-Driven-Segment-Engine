import { Module } from '@nestjs/common';
import { SegmentEvaluatorService } from './segment-evaluator.service';
import { SegmentEvaluatorController } from './segment-evaluator.controller';
import { SegmentRecomputeConsumer } from '../../workers/segment-recompute.consumer';

@Module({
  providers: [SegmentEvaluatorService, SegmentRecomputeConsumer],
  controllers: [SegmentEvaluatorController],
  exports: [SegmentEvaluatorService],
})
export class SegmentEvaluatorModule {}