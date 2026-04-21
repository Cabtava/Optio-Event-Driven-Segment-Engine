import { Controller, Logger } from '@nestjs/common';
import { Ctx, EventPattern, Payload, RmqContext } from '@nestjs/microservices';
import { CAMPAIGN_TRIGGER_QUEUE } from '../messaging/messaging.constants';

@Controller()
export class CampaignConsumer {
  private readonly logger = new Logger(CampaignConsumer.name);

  @EventPattern(CAMPAIGN_TRIGGER_QUEUE)
  async handleDeltaForCampaign(
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
      if (payload.added.length > 0) {
        for (const customerId of payload.added) {
          this.logger.log(
            `[Campaign] Sending campaign to new member ${customerId} for segment "${payload.segmentName}"`,
          );
        }
      }

      if (payload.removed.length > 0) {
        for (const customerId of payload.removed) {
          this.logger.log(
            `[Campaign] Stopping campaign for removed member ${customerId} from segment "${payload.segmentName}"`,
          );
        }
      }

      if (!payload.hasChanges) {
        this.logger.log(
          `[Campaign] No delta for "${payload.segmentName}", skipping`,
        );
      }

      channel.ack(originalMessage);
    } catch (error) {
      this.logger.error(
        `[Campaign] Failed to process campaign delta for segment ${payload.segmentId}`,
        error instanceof Error ? error.stack : String(error),
      );

      channel.nack(originalMessage, false, false);
    }
  }
}