/** Radio medio de la Tierra en metros. */
export const EARTH_RADIUS_METERS = 6_371_000;

/** Umbrales de radios sugeridos (spec: 1/5/10/25/50/100 km). */
export const SUGGESTED_RADII_METERS = [1_000, 5_000, 10_000, 25_000, 50_000, 100_000] as const;
