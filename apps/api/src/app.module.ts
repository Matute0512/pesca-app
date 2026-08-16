import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { loadConfig } from './config/configuration';
import { PrismaModule } from './prisma/prisma.module';
import { RedisModule } from './redis/redis.module';
import { AuditModule } from './audit/audit.module';
import { StorageModule } from './storage/storage.module';
import { HealthModule } from './health/health.module';
import { JwtAuthGuard } from './common/guards/jwt-auth.guard';
import { RolesGuard } from './common/guards/roles.guard';

import { AuthModule } from './auth/auth.module';
import { SitesModule } from './sites/sites.module';
import { FavoritesModule } from './favorites/favorites.module';
import { ReportsModule } from './reports/reports.module';
import { SuggestionsModule } from './suggestions/suggestions.module';
import { MetadataModule } from './metadata/metadata.module';
import { AdminModule } from './admin/admin.module';
import { QueueModule } from './queue/queue.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [loadConfig],
      // .env en raíz del monorepo (cuando se corre con `pnpm --filter api` el cwd es apps/api).
      envFilePath: ['../../.env', '.env'],
    }),
    ThrottlerModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => [
        {
          ttl: config.get<number>('rateLimit.windowMs') ?? 60_000,
          limit: config.get<number>('rateLimit.max') ?? 100,
        },
      ],
    }),

    PrismaModule,
    RedisModule,
    AuditModule,
    StorageModule,

    HealthModule,
    AuthModule,
    SitesModule,
    FavoritesModule,
    ReportsModule,
    SuggestionsModule,
    MetadataModule,
    AdminModule,
    ...(process.env['QUEUE_ENABLED'] === 'true' ? [QueueModule] : []),
  ],
  providers: [
    { provide: APP_GUARD, useClass: ThrottlerGuard },
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_GUARD, useClass: RolesGuard },
  ],
})
export class AppModule {}
