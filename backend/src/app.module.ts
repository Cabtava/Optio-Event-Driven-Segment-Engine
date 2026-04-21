import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module';
import { CustomersModule } from './modules/customers/customers.module';
import { SegmentsModule } from './modules/segments/segments.module';
import { SegmentEvaluatorModule } from './modules/segment-evaluator/segment-evaluator.module';
import { SimulationModule } from './modules/simulation/simulation.module';
import { MessagingModule } from './messaging/messaging.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    PrismaModule,
    CustomersModule,
    SegmentsModule,
    SegmentEvaluatorModule,
    SimulationModule,
    MessagingModule,
  ],
})
export class AppModule {}