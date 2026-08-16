import { Worker } from 'bullmq';
import { loadWorkerConfig } from './config';
import { duplicateDetectionProcessor } from './processors/duplicate-detection.processor';
import { imageProcessingProcessor } from './processors/image-processing.processor';
import { siteImportProcessor } from './processors/site-import.processor';

/** Conecta cada cola con su procesador. */
function startWorkers(redisUrl: string, concurrency: number): Worker[] {
  const connection = { url: redisUrl };

  const workers = [
    new Worker('image-processing', imageProcessingProcessor, { connection, concurrency }),
    new Worker('site-import', siteImportProcessor, { connection, concurrency }),
    new Worker('duplicate-detection', duplicateDetectionProcessor, { connection, concurrency }),
  ];

  workers.forEach((worker) => {
    worker.on('completed', (job) => {
      console.log(`[worker] ✓ ${job.name}#${job.id} completado`);
    });
    worker.on('failed', (job, error) => {
      console.error(`[worker] ✗ ${job?.name}#${job?.id} falló: ${error.message}`);
    });
    worker.on('error', (error) => {
      console.error('[worker] error de conexión:', error.message);
    });
  });

  return workers;
}

const config = loadWorkerConfig();
console.log(`[worker] iniciando con ${config.concurrency} concurrencia (Redis: ${config.redisUrl})`);
const workers = startWorkers(config.redisUrl, config.concurrency);

// Graceful shutdown.
function shutdown(signal: string): void {
  console.log(`[worker] ${signal} recibido, cerrando...`);
  Promise.all(workers.map((w) => w.close()))
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));
