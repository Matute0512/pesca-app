import { z } from 'zod';
import { SITE_TYPES } from '../constants';
import { latitudeSchema, longitudeSchema } from './geo';

/** Formulario de sugerencia de nuevo lugar. */
export const createSuggestionSchema = z.object({
  name: z.string().min(2, 'El nombre es obligatorio').max(120),
  siteType: z.enum(SITE_TYPES),
  latitude: latitudeSchema,
  longitude: longitudeSchema,
  addressLine: z.string().max(255).nullish(),
  locality: z.string().max(120).nullish(),
  municipality: z.string().max(120).nullish(),
  province: z.string().max(120).nullish(),
  countryCode: z.string().length(2, 'Código de país de 2 letras').default('ar'),
  phone: z.string().max(40).nullish(),
  website: z.string().url('URL inválida').max(255).nullish(),
  description: z.string().max(2000).nullish(),
  accessNotes: z.string().max(1000).nullish(),
  amenities: z.array(z.string()).max(20).default([]),
  speciesSlugs: z.array(z.string()).max(20).default([]),
  /** Declaración: la información es correcta según el usuario. */
  infoAccurate: z.literal(true, {
    invalid_type_error: 'Debés declarar que la información es correcta',
  }),
});

export type CreateSuggestionInput = z.infer<typeof createSuggestionSchema>;
