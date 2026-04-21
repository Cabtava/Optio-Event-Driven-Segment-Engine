import { Module } from '@nestjs/common';
import { SegmentEvaluatorService } from './segment-evaluator.service';
import { SegmentEvaluatorController } from './segment-evaluator.controller';
import { SegmentRecomputeConsumer } from '../../workers/segment-recompute.consumer';
import { UiNotificationConsumer } from '../../workers/ui-notification.consumer';
import { CampaignConsumer } from '../../workers/campaign.consumer';

@Module({
  providers: [
    SegmentEvaluatorService,
    SegmentRecomputeConsumer,
    UiNotificationConsumer,
    CampaignConsumer,
  ],
  controllers: [SegmentEvaluatorController],
  exports: [SegmentEvaluatorService],
})
export class SegmentEvaluatorModule {}