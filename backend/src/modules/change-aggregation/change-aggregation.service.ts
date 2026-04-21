import { Injectable, Logger } from '@nestjs/common';
import { MessagingService } from '../../messaging/messaging.service';
import { RedisService } from '../../redis/redis.service';

@Injectable()
export class ChangeAggregationService {
  private readonly logger = new Logger(ChangeAggregationService.name);
  private readonly debounceSeconds = 5;
  private readonly chunkSize = 1000;

  constructor(
    private readonly redisService: RedisService,
    private readonly messagingService: MessagingService,
  ) {}

  async registerSegmentImpact(params: {
    segmentId: string;
    triggerType: string;
    customerIds?: string[];
  }) {
    const redis = this.redisService.getClient();
    const pendingSetKey = `segment:${params.segmentId}:pending-customers`;
    const scheduledKey = `segment:${params.segmentId}:scheduled`;

    if (params.customerIds && params.customerIds.length > 0) {
      await redis.sadd(pendingSetKey, ...params.customerIds);
      await redis.expire(pendingSetKey, 60 * 30);
    }

    const wasScheduled = await redis.set(
      scheduledKey,
      '1',
      'EX',
      this.debounceSeconds,
      'NX',
    );

    if (wasScheduled) {
      this.logger.log(
        `Scheduled debounced recompute for segment ${params.segmentId} in ${this.debounceSeconds}s`,
      );

      setTimeout(async () => {
        try {
          await this.flushSegmentImpact(params.segmentId, params.triggerType);
        } catch (error) {
          this.logger.error(
            `Failed to flush debounced segment ${params.segmentId}`,
            error instanceof Error ? error.stack : String(error),
          );
        }
      }, this.debounceSeconds * 1000);
    } else {
      this.logger.log(
        `Segment ${params.segmentId} already scheduled, appended new changes to batch`,
      );
    }

    return {
      queued: true,
      segmentId: params.segmentId,
      debounceSeconds: this.debounceSeconds,
    };
  }

  async flushSegmentImpact(segmentId: string, triggerType: string) {
    const redis = this.redisService.getClient();
    const pendingSetKey = `segment:${segmentId}:pending-customers`;
    const scheduledKey = `segment:${segmentId}:scheduled`;

    const customerIds = await redis.smembers(pendingSetKey);

    await redis.del(pendingSetKey);
    await redis.del(scheduledKey);

    const chunks = this.chunkArray(customerIds, this.chunkSize);

    if (chunks.length === 0) {
      await this.messagingService.publishSegmentRecompute({
        segmentId,
        triggerType,
      });

      this.logger.log(
        `Flushed segment ${segmentId} with no specific customer ids, published one recompute message`,
      );

      return {
        segmentId,
        totalCustomers: 0,
        totalChunks: 0,
        publishedMessages: 1,
      };
    }

    for (const chunk of chunks) {
      await this.messagingService.publishSegmentRecompute({
        segmentId,
        triggerType,
      });

      this.logger.log(
        `Published recompute for segment ${segmentId} with chunk size ${chunk.length}`,
      );
    }

    return {
      segmentId,
      totalCustomers: customerIds.length,
      totalChunks: chunks.length,
      publishedMessages: chunks.length,
    };
  }

  private chunkArray<T>(items: T[], size: number): T[][] {
    const result: T[][] = [];

    for (let i = 0; i < items.length; i += size) {
      result.push(items.slice(i, i + size));
    }

    return result;
  }
}