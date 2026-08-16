/** Configuración del worker, desde variables de entorno. */
export interface WorkerConfig {
  redisUrl: string;
  concurrency: number;
  logLevel: string;
}

export function loadWorkerConfig(env = process.env): WorkerConfig {
  return {
    redisUrl: env['REDIS_URL'] ?? 'redis://localhost:6379',
    concurrency: Number(env['WORKER_CONCURRENCY'] ?? '2'),
    logLevel: env['LOG_LEVEL'] ?? 'info',
  };
}
