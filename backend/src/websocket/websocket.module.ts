import { Module } from '@nestjs/common';
import { SegmentEventsGateway } from './segment-events.gateway';

@Module({
  providers: [SegmentEventsGateway],
  exports: [SegmentEventsGateway],
})
export class WebsocketModule {}