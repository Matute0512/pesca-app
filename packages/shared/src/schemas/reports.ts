import { z } from 'zod';
import { REPORT_TYPES } from '../constants';

/** Formulario de reporte de problema sobre un lugar. */
export const createReportSchema = z.object({
  reportType: z.enum(REPORT_TYPES, { invalid_type_error: 'Tipo de reporte inválido' }),
  description: z.string().max(1000).nullish(),
});

export type CreateReportInput = z.infer<typeof createReportSchema>;

/** Query de listado de reportes (filtro por estado). */
export const listReportsQuerySchema = z.object({
  status: z.enum(['open', 'in_review', 'resolved', 'rejected']).optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
});

export type ListReportsQuery = z.infer<typeof listReportsQuerySchema>;
