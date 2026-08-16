import { z } from 'zod';
import { ROLES } from '../constants';

/** Decisión de moderación sobre una sugerencia. */
export const reviewSuggestionSchema = z.object({
  decision: z.enum(['approved', 'rejected']),
  rejectionReason: z.string().max(500).nullish(),
});

export type ReviewSuggestionInput = z.infer<typeof reviewSuggestionSchema>;

/** Decisión de moderación sobre un reporte. */
export const reviewReportSchema = z.object({
  decision: z.enum(['in_review', 'resolved', 'rejected']),
});

export type ReviewReportInput = z.infer<typeof reviewReportSchema>;

/** Actualización de un usuario (admin). */
export const updateUserAdminSchema = z.object({
  role: z.enum(ROLES).optional(),
  fullName: z.string().max(120).nullish(),
  emailVerified: z.boolean().optional(),
  preferredLanguage: z.string().min(2).max(8).optional(),
});

export type UpdateUserAdminInput = z.infer<typeof updateUserAdminSchema>;
