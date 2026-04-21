import { Module } from '@nestjs/common';
import { SimulationController } from './simulation.controller';
import { SimulationService } from './simulation.service';
import { ChangeAggregationModule } from '../change-aggregation/change-aggregation.module';

@Module({
  imports: [ChangeAggregationModule],
  controllers: [SimulationController],
  providers: [SimulationService],
})
export class SimulationModule {}