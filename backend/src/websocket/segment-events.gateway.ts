import {
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Logger } from '@nestjs/common';
import { Server, Socket } from 'socket.io';

@WebSocketGateway({
  cors: {
    origin: 'http://localhost:4200',
    credentials: true,
  },
})
export class SegmentEventsGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server!: Server;

  private readonly logger = new Logger(SegmentEventsGateway.name);

  afterInit() {
    this.logger.log('WebSocket gateway initialized');
  }

  handleConnection(client: Socket) {
    this.logger.log(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);
  }

  emitSegmentUpdated(payload: {
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
  }) {
    this.logger.log(
      `Emitting websocket event segment.updated for ${payload.segmentName}`,
    );

    this.server.emit('segment.updated', payload);
  }

  @SubscribeMessage('ping')
  handlePing(@MessageBody() body: any) {
    return {
      event: 'pong',
      data: body ?? 'pong',
    };
  }
}