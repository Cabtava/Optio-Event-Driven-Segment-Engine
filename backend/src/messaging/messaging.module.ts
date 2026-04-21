import { Global, Module } from '@nestjs/common';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MessagingService } from './messaging.service';
import {
  CAMPAIGN_TRIGGER_QUEUE,
  SEGMENT_RECOMPUTE_QUEUE,
  UI_NOTIFICATION_QUEUE,
} from './messaging.constants';

@Global()
@Module({
  imports: [
    ConfigModule,
    ClientsModule.registerAsync([
      {
        name: 'RABBITMQ_RECOMPUTE_CLIENT',
        imports: [ConfigModule],
        inject: [ConfigService],
        useFactory: (configService: ConfigService) => {
          const rabbitmqUrl = configService.get<string>('RABBITMQ_URL');

          return {
            transport: Transport.RMQ,
            options: {
              urls: [rabbitmqUrl ?? 'amqp://guest:guest@localhost:5672'],
              queue: SEGMENT_RECOMPUTE_QUEUE,
              queueOptions: { durable: true },
            },
          };
        },
      },
      {
        name: 'RABBITMQ_UI_CLIENT',
        imports: [ConfigModule],
        inject: [ConfigService],
        useFactory: (configService: ConfigService) => {
          const rabbitmqUrl = configService.get<string>('RABBITMQ_URL');

          return {
            transport: Transport.RMQ,
            options: {
              urls: [rabbitmqUrl ?? 'amqp://guest:guest@localhost:5672'],
              queue: UI_NOTIFICATION_QUEUE,
              queueOptions: { durable: true },
            },
          };
        },
      },
      {
        name: 'RABBITMQ_CAMPAIGN_CLIENT',
        imports: [ConfigModule],
        inject: [ConfigService],
        useFactory: (configService: ConfigService) => {
          const rabbitmqUrl = configService.get<string>('RABBITMQ_URL');

          return {
            transport: Transport.RMQ,
            options: {
              urls: [rabbitmqUrl ?? 'amqp://guest:guest@localhost:5672'],
              queue: CAMPAIGN_TRIGGER_QUEUE,
              queueOptions: { durable: true },
            },
          };
        },
      },
    ]),
  ],
  providers: [MessagingService],
  exports: [MessagingService],
})
export class MessagingModule {}