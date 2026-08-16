import { z } from 'zod';

/** Esquema zod de variables de entorno. Todo configuración sale de acá. */
const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  HOST: z.string().default('0.0.0.0'),
  PORT: z.coerce.number().default(3000),
  PUBLIC_API_URL: z.string().url().default('http://localhost:3000'),
  DATABASE_URL: z.string().min(1, 'DATABASE_URL es obligatoria'),
  REDIS_URL: z.string().default('redis://localhost:6379'),
  JWT_ACCESS_SECRET: z.string().min(16, 'JWT_ACCESS_SECRET muy corta'),
  JWT_REFRESH_SECRET: z.string().min(16, 'JWT_REFRESH_SECRET muy corta'),
  JWT_ACCESS_TTL: z.string().default('15m'),
  JWT_REFRESH_TTL: z.string().default('30d'),
  CORS_ORIGINS: z.string().default('http://localhost:5173,http://localhost:8081'),
  S3_ENDPOINT: z.string().url().default('http://localhost:9000'),
  S3_REGION: z.string().default('us-east-1'),
  S3_BUCKET: z.string().default('pesca-ba'),
  S3_ACCESS_KEY: z.string().default('minioadmin'),
  S3_SECRET_KEY: z.string().default('minioadmin'),
  S3_FORCE_PATH_STYLE: z
    .string()
    .default('true')
    .transform((v) => v === 'true'),
  S3_PUBLIC_URL: z.string().url().default('http://localhost:9000/pesca-ba'),
  RATE_LIMIT_WINDOW_MS: z.coerce.number().default(60_000),
  RATE_LIMIT_MAX: z.coerce.number().default(100),
  LOG_LEVEL: z.string().default('info'),
  SENTRY_DSN: z.string().optional(),
  MEILISEARCH_URL: z.string().optional(),
  GEOCODING_PROVIDER: z.enum(['none', 'nominatim', 'mapbox', 'maptiler']).default('none'),
  GEOCODING_API_KEY: z.string().optional(),
  NOMINATIM_URL: z.string().url().optional(),
  SEED_DEMO_SITES: z.coerce.number().default(20),
  QUEUE_ENABLED: z
    .string()
    .default('false')
    .transform((v) => v === 'true'),
});

export type Env = z.infer<typeof envSchema>;

export interface AppConfig {
  env: Env['NODE_ENV'];
  host: string;
  port: number;
  publicApiUrl: string;
  corsOrigins: string[];
  databaseUrl: string;
  redisUrl: string;
  jwt: {
    accessSecret: string;
    refreshSecret: string;
    accessTtl: string;
    refreshTtl: string;
  };
  s3: {
    endpoint: string;
    region: string;
    bucket: string;
    accessKey: string;
    secretKey: string;
    forcePathStyle: boolean;
    publicUrl: string;
  };
  rateLimit: { windowMs: number; max: number };
  logLevel: string;
  sentryDsn?: string;
  geocoding: { provider: Env['GEOCODING_PROVIDER']; apiKey?: string; nominatimUrl?: string };
  seedDemoSites: number;
  queueEnabled: boolean;
}

/** Valida las variables de entorno y las normaliza a AppConfig. */
export function loadConfig(env = process.env): AppConfig {
  const parsed = envSchema.parse(env);
  return {
    env: parsed.NODE_ENV,
    host: parsed.HOST,
    port: parsed.PORT,
    publicApiUrl: parsed.PUBLIC_API_URL,
    corsOrigins: parsed.CORS_ORIGINS.split(',').map((o) => o.trim()),
    databaseUrl: parsed.DATABASE_URL,
    redisUrl: parsed.REDIS_URL,
    jwt: {
      accessSecret: parsed.JWT_ACCESS_SECRET,
      refreshSecret: parsed.JWT_REFRESH_SECRET,
      accessTtl: parsed.JWT_ACCESS_TTL,
      refreshTtl: parsed.JWT_REFRESH_TTL,
    },
    s3: {
      endpoint: parsed.S3_ENDPOINT,
      region: parsed.S3_REGION,
      bucket: parsed.S3_BUCKET,
      accessKey: parsed.S3_ACCESS_KEY,
      secretKey: parsed.S3_SECRET_KEY,
      forcePathStyle: parsed.S3_FORCE_PATH_STYLE,
      publicUrl: parsed.S3_PUBLIC_URL,
    },
    rateLimit: { windowMs: parsed.RATE_LIMIT_WINDOW_MS, max: parsed.RATE_LIMIT_MAX },
    logLevel: parsed.LOG_LEVEL,
    sentryDsn: parsed.SENTRY_DSN,
    geocoding: {
      provider: parsed.GEOCODING_PROVIDER,
      apiKey: parsed.GEOCODING_API_KEY,
      nominatimUrl: parsed.NOMINATIM_URL,
    },
    seedDemoSites: parsed.SEED_DEMO_SITES,
    queueEnabled: parsed.QUEUE_ENABLED,
  };
}
