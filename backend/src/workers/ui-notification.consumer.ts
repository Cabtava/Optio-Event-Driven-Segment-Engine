import { Controller, Logger, OnModuleInit } from '@nestjs/common';
import { Ctx, EventPattern, Payload, RmqContext } from '@nestjs/microservices';
import { UI_NOTIFICATION_QUEUE } from '../messaging/messaging.constants';
import { SegmentEventsGateway } from '../websocket/segment-events.gateway';

@Controller()
export class UiNotificationConsumer implements OnModuleInit {
  private readonly logger = new Logger(UiNotificationConsumer.name);

  constructor(private readonly segmentEventsGateway: SegmentEventsGateway) {}

  onModuleInit() {
    this.logger.log('UiNotificationConsumer initialized');
  }

  @EventPattern(UI_NOTIFICATION_QUEUE)
  async handleDeltaForUi(
    @Payload()
    payload: {
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
    },
    @Ctx() context: RmqContext,
  ) {
    const channel = context.getChannelRef();
    const originalMessage = context.getMessage();

    try {
      this.logger.log(
        `[UI] Segment "${payload.segmentName}" updated. version ${payload.previousVersion} -> ${payload.nextVersion}. +${payload.addedCount} / -${payload.removedCount}`,
      );

      this.segmentEventsGateway.emitSegmentUpdated(payload);

      channel.ack(originalMessage);
    } catch (error) {
      this.logger.error(
        `[UI] Failed to process notification for segment ${payload.segmentId}`,
        error instanceof Error ? error.stack : String(error),
      );

      channel.nack(originalMessage, false, false);
    }
  }
}
