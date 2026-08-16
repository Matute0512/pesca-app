import type { Job } from 'bullmq';

export interface SiteImportJobData {
  /** Ruta del archivo CSV/GeoJSON a importar. */
  filePath: string;
  dryRun: boolean;
  actorId?: string;
}

/**
 * Importación de lugares en segundo plano.
 * En el MVP el pipeline vive en el API (ImportService) y este worker queda como
 * punto de entrada para importaciones largas. Devuelve un informe por fila.
 */
export async function siteImportProcessor(job: Job<SiteImportJobData>): Promise<{ status: 'queued' }> {
  const { filePath, dryRun, actorId } = job.data;
  // TODO(import): delegar a un paquete compartido o API job que ejecute el pipeline.
  job.log(`Import pendiente: ${filePath} (dryRun=${dryRun}, actor=${actorId ?? 'anon'})`);
  return { status: 'queued' };
}
