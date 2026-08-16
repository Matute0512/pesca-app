import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { BullModule } from '@nestjs/bullmq';

/**
 * Colas BullMQ para jobs en segundo plano.
 * Opcional: solo se importa cuando QUEUE_ENABLED=true.
 */
@Module({
  imports: [
    BullModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        connection: { url: config.getOrThrow<string>('redisUrl') },
      }),
    }),
    BullModule.registerQueue(
      { name: 'image-processing' },
      { name: 'site-import' },
      { name: 'duplicate-detection' },
    ),
  ],
})
export class QueueModule {}
