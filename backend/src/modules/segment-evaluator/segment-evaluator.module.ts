import { Module } from '@nestjs/common';
import { SegmentEvaluatorService } from './segment-evaluator.service';
import { SegmentEvaluatorController } from './segment-evaluator.controller';

@Module({
  providers: [SegmentEvaluatorService],
  controllers: [SegmentEvaluatorController],
  exports: [SegmentEvaluatorService],
})
export class SegmentEvaluatorModule {}