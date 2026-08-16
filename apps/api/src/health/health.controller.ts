import { Controller, Get, ServiceUnavailableException } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Public } from '../common/decorators/public.decorator';
import { PrismaService } from '../prisma/prisma.service';
import { RedisService } from '../redis/redis.service';

interface HealthResponse {
  status: 'ok';
  version: string;
  uptimeSeconds: number;
  timestamp: string;
}

interface ReadinessResponse {
  status: 'ok' | 'error';
  checks: {
    database: 'up' | 'down';
    redis: 'up' | 'down';
  };
}

@ApiTags('health')
@Controller('health')
export class HealthController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
  ) {}

  @Public()
  @Get()
  @ApiOperation({ summary: 'Liveness: la API responde' })
  check(): HealthResponse {
    return {
      status: 'ok',
      version: process.env['npm_package_version'] ?? '0.1.0',
      uptimeSeconds: Math.round(process.uptime()),
      timestamp: new Date().toISOString(),
    };
  }

  @Public()
  @Get('ready')
  @ApiOperation({ summary: 'Readiness: DB y Redis disponibles' })
  async ready(): Promise<ReadinessResponse> {
    let database: 'up' | 'down' = 'down';
    let redis: 'up' | 'down' = 'down';

    try {
      await this.prisma.$queryRaw`SELECT 1`;
      database = 'up';
    } catch {
      database = 'down';
    }

    try {
      await this.redis.getClient().ping();
      redis = 'up';
    } catch {
      redis = 'down';
    }

    const ready = database === 'up' && redis === 'up';
    if (!ready) {
      throw new ServiceUnavailableException({
        statusCode: 503,
        message: 'Dependencias no disponibles',
        details: [{ database, redis }],
      });
    }
    return { status: 'ok', checks: { database, redis } };
  }
}
