import { z } from 'zod';

/** Latitud válida: -90 a 90. */
export const latitudeSchema = z.coerce
  .number({ invalid_type_error: 'lat debe ser un número' })
  .min(-90)
  .max(90);

/** Longitud válida: -180 a 180. */
export const longitudeSchema = z.coerce
  .number({ invalid_type_error: 'lng debe ser un número' })
  .min(-180)
  .max(180);

/** Radio de búsqueda en metros, entre 100 m y 200 km. */
export const radiusSchema = z.coerce.number().int().min(100).max(200_000).default(10_000);

/** Query de búsqueda por cercanía. */
export const nearbyQuerySchema = z.object({
  lat: latitudeSchema,
  lng: longitudeSchema,
  radiusMeters: radiusSchema,
});

export type NearbyQuery = z.infer<typeof nearbyQuerySchema>;
