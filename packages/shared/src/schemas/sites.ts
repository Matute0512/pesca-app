import { z } from 'zod';
import { ACCESS_TYPES, AMENITY_TYPES, OWNERSHIP_TYPES, SITE_TYPES } from '../constants';
import { paginationSchema } from './pagination';
import { latitudeSchema, longitudeSchema } from './geo';

/** Convierte un string "a,b,c" (o array) en un array de valores válidos. */
function csvArray(values: readonly [string, ...string[]]) {
  return z.preprocess(
    (v) => (Array.isArray(v) ? v : v === undefined || v === '' ? [] : String(v).split(',')),
    z.array(z.enum(values)).optional(),
  );
}

/** Igual que csvArray pero sin validar contra un enum (strings libres). */
function csvStrings() {
  return z.preprocess(
    (v) => (Array.isArray(v) ? v : v === undefined || v === '' ? [] : String(v).split(',')),
    z.array(z.string()).optional(),
  );
}

/** Filtros para listado/búsqueda de sitios. */
export const siteListQuerySchema = z.object({
  lat: latitudeSchema.optional(),
  lng: longitudeSchema.optional(),
  radiusMeters: z.coerce.number().int().min(100).max(200_000).optional(),
  siteTypes: csvArray(SITE_TYPES),
  accessTypes: csvArray(ACCESS_TYPES),
  amenities: csvArray(AMENITY_TYPES),
  species: csvStrings(),
  status: csvStrings(),
  q: z.string().max(120).optional(),
  sort: z.enum(['distance', 'name', 'relevance', 'newest']).default('name'),
  ...paginationSchema.shape,
});

export type SiteListQuery = z.infer<typeof siteListQuerySchema>;

/** Query de búsqueda de texto. */
export const searchQuerySchema = siteListQuerySchema.extend({
  q: z.string().min(1).max(120),
});

export type SearchQuery = z.infer<typeof searchQuerySchema>;

/** Query de autocompletado. */
export const autocompleteQuerySchema = z.object({
  q: z.string().min(1).max(120),
  limit: z.coerce.number().int().min(1).max(20).default(8),
});

export type AutocompleteQuery = z.infer<typeof autocompleteQuerySchema>;

/** Creación de un lugar (admin/editor). */
export const createSiteSchema = z.object({
  name: z.string().min(2, 'El nombre es obligatorio').max(120),
  siteType: z.enum(SITE_TYPES),
  latitude: latitudeSchema,
  longitude: longitudeSchema,
  descriptionShort: z.string().max(300).nullish(),
  descriptionLong: z.string().max(5000).nullish(),
  locality: z.string().max(120).nullish(),
  municipality: z.string().max(120).nullish(),
  province: z.string().max(120).nullish(),
  countryCode: z.string().length(2, 'Código de país de 2 letras').default('ar'),
  addressLine: z.string().max(255).nullish(),
  phone: z.string().max(40).nullish(),
  whatsapp: z.string().max(40).nullish(),
  website: z.string().url('URL inválida').max(255).nullish(),
  accessType: z.enum(ACCESS_TYPES).nullish(),
  ownershipType: z.enum(OWNERSHIP_TYPES).nullish(),
  isPublic: z.boolean().default(true),
  allowsBoats: z.boolean().default(false),
  allowsNightFishing: z.boolean().default(false),
  allowsCamping: z.boolean().default(false),
  speciesIds: z.array(z.string().uuid()).default([]),
  amenities: z.array(z.enum(AMENITY_TYPES)).default([]),
});

export type CreateSiteInput = z.infer<typeof createSiteSchema>;

/** Actualización de un lugar (admin/editor). Todos los campos opcionales. */
export const updateSiteSchema = createSiteSchema.partial();

export type UpdateSiteInput = z.infer<typeof updateSiteSchema>;
