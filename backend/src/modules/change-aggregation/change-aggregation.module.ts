import { Module } from '@nestjs/common';
import { ChangeAggregationService } from './change-aggregation.service';

@Module({
  providers: [ChangeAggregationService],
  exports: [ChangeAggregationService],
})
export class ChangeAggregationModule {}