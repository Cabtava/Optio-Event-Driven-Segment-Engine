import { Controller, Logger } from '@nestjs/common';
import { Ctx, EventPattern, Payload, RmqContext } from '@nestjs/microservices';
import { UI_NOTIFICATION_QUEUE } from '../messaging/messaging.constants';

@Controller()
export class UiNotificationConsumer {
  private readonly logger = new Logger(UiNotificationConsumer.name);

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