import type { Job } from 'bullmq';

export interface DuplicateDetectionJobData {
  /** Slug o id del lugar a chequear contra el resto. */
  siteId: string;
}

/**
 * Detección de duplicados (nombre similar + cercanía geográfica).
 * En producción corre la misma query que ImportService.isDuplicate pero sobre
 * todos los lugares, y registra los candidatos. Aquí queda el contrato del job.
 */
export async function duplicateDetectionProcessor(
  job: Job<DuplicateDetectionJobData>,
): Promise<{ siteId: string; candidates: unknown[] }> {
  const { siteId } = job.data;
  // TODO(import): consultar candidatos por nombre + ST_DWithin y loguearlos.
  job.log(`Detección de duplicados para ${siteId}`);
  return { siteId, candidates: [] };
}
