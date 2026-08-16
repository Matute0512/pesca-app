/**
 * Servicios/amenities que puede tener un lugar.
 */
export const AMENITY_TYPES = [
  'parking', // estacionamiento
  'restrooms', // baños
  'camping', // camping
  'grills', // parrillas
  'store', // proveeduría
  'boat_ramp', // bajada de lancha
  'boat_rental', // alquiler de botes
  'guides', // guías
  'cell_signal', // señal celular
] as const;

export type AmenityType = (typeof AMENITY_TYPES)[number];

export const AMENITY_TYPE_LABELS: Record<AmenityType, { es: string; en: string }> = {
  parking: { es: 'Estacionamiento', en: 'Parking' },
  restrooms: { es: 'Baños', en: 'Restrooms' },
  camping: { es: 'Camping', en: 'Camping' },
  grills: { es: 'Parrillas', en: 'Grills' },
  store: { es: 'Proveeduría', en: 'Store' },
  boat_ramp: { es: 'Bajada de lancha', en: 'Boat ramp' },
  boat_rental: { es: 'Alquiler de botes', en: 'Boat rental' },
  guides: { es: 'Guías', en: 'Guides' },
  cell_signal: { es: 'Señal celular', en: 'Cell signal' },
};

export function isAmenityType(value: string): value is AmenityType {
  return (AMENITY_TYPES as readonly string[]).includes(value);
}
