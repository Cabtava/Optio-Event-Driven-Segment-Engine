import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { PrismaService } from './prisma/prisma.service';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.enableCors({
    origin: 'http://localhost:4200',
    credentials: true,
  });

  const rabbitmqUrl =
    process.env.RABBITMQ_URL ?? 'amqp://guest:guest@localhost:5672';

  app.connectMicroservice<MicroserviceOptions>({
    transport: Transport.RMQ,
    options: {
      urls: [rabbitmqUrl],
      queue: 'segment.recompute',
      queueOptions: {
        durable: true,
      },
      noAck: false,
    },
  });

  const prismaService = app.get(PrismaService);
  await prismaService.enableShutdownHooks(app);

  await app.startAllMicroservices();
  await app.listen(process.env.PORT ?? 3000);

  console.log(`Backend running on http://localhost:${process.env.PORT ?? 3000}`);
  console.log(`RabbitMQ consumer connected to queue: segment.recompute`);
}

bootstrap();