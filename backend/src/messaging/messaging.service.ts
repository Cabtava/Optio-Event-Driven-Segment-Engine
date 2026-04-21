import { Inject, Injectable, OnModuleInit } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { firstValueFrom } from 'rxjs';
import {
  CAMPAIGN_TRIGGER_QUEUE,
  SEGMENT_RECOMPUTE_QUEUE,
  UI_NOTIFICATION_QUEUE,
} from './messaging.constants';

type SegmentDeltaPayload = {
  segmentId: string;
  segmentName: string;
  triggerType: string;
  previousVersion: number;
  nextVersion: number;
  oldCount: number;
  newCount: number;
  addedCount: number;
  removedCount: number;
  added: string[];
  removed: string[];
  hasChanges: boolean;
  cascadedSegments?: Array<{
    segmentId: string;
    segmentName: string;
    result: any;
  }>;
};

@Injectable()
export class MessagingService implements OnModuleInit {
  constructor(
    @Inject('RABBITMQ_RECOMPUTE_CLIENT')
    private readonly recomputeClient: ClientProxy,
    @Inject('RABBITMQ_UI_CLIENT')
    private readonly uiClient: ClientProxy,
    @Inject('RABBITMQ_CAMPAIGN_CLIENT')
    private readonly campaignClient: ClientProxy,
  ) {}

  async onModuleInit() {
    await this.recomputeClient.connect();
    await this.uiClient.connect();
    await this.campaignClient.connect();
  }

  async publishSegmentRecompute(payload: {
    segmentId: string;
    triggerType: string;
  }) {
    return firstValueFrom(
      this.recomputeClient.emit(SEGMENT_RECOMPUTE_QUEUE, payload),
    );
  }

  async publishSegmentDeltaToUi(payload: SegmentDeltaPayload) {
    return firstValueFrom(this.uiClient.emit(UI_NOTIFICATION_QUEUE, payload));
  }

  async publishSegmentDeltaToCampaign(payload: SegmentDeltaPayload) {
    return firstValueFrom(
      this.campaignClient.emit(CAMPAIGN_TRIGGER_QUEUE, payload),
    );
  }
}