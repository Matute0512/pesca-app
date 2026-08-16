import type { Job } from 'bullmq';
import sharp from 'sharp';

export interface ImageProcessingJobData {
  /** Ruta local de origen (dev). En producción: bucket/key en S3. */
  sourcePath: string;
  /** Ruta local de salida del thumbnail. */
  thumbPath: string;
  /** Ancho del thumbnail (por defecto 640). */
  thumbWidth?: number;
}

/**
 * Procesa imágenes con Sharp.
 * En el MVP opera sobre rutas locales para desarrollo; en producción se conecta
 * con StorageService (S3) para descargar el original y subir el thumbnail.
 */
export async function imageProcessingProcessor(job: Job<ImageProcessingJobData>): Promise<{ ok: true; thumbPath: string }> {
  const { sourcePath, thumbPath, thumbWidth = 640 } = job.data;

  await sharp(sourcePath)
    .resize({ width: thumbWidth, withoutEnlargement: true })
    .jpeg({ quality: 80 })
    .toFile(thumbPath);

  return { ok: true, thumbPath };
}
