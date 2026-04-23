import { Module } from '@nestjs/common';
import { SegmentEvaluatorService } from './segment-evaluator.service';
import { SegmentEvaluatorController } from './segment-evaluator.controller';
import { SegmentRecomputeConsumer } from '../../workers/segment-recompute.consumer';
import { UiNotificationConsumer } from '../../workers/ui-notification.consumer';
import { CampaignConsumer } from '../../workers/campaign.consumer';
import { WebsocketModule } from '../../websocket/websocket.module';

@Module({
  imports: [WebsocketModule],
  providers: [SegmentEvaluatorService],
  controllers: [
    SegmentEvaluatorController,
    SegmentRecomputeConsumer,
    UiNotificationConsumer,
    CampaignConsumer,
  ],
})
export class SegmentEvaluatorModule {}