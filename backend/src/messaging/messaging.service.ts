import { Inject, Injectable, OnModuleInit } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { firstValueFrom } from 'rxjs';
import { SEGMENT_RECOMPUTE_QUEUE } from './messaging.constants';

@Injectable()
export class MessagingService implements OnModuleInit {
  constructor(
    @Inject('RABBITMQ_SERVICE')
    private readonly rabbitClient: ClientProxy,
  ) {}

  async onModuleInit() {
    await this.rabbitClient.connect();
  }

  async publishSegmentRecompute(payload: {
    segmentId: string;
    triggerType: string;
  }) {
    return firstValueFrom(
      this.rabbitClient.emit(SEGMENT_RECOMPUTE_QUEUE, payload),
    );
  }
}