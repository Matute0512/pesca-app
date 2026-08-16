/**
 * Formas de acceso/usufructo de un lugar, usadas como filtros.
 */
export const ACCESS_TYPES = [
  'public', // público
  'permit_required', // privado con permiso
  'paid', // pago
  'free', // gratuito
  'car', // en auto
  'offroad', // 4x4
  'walking', // a pie
  'boat', // en embarcación
] as const;

export type AccessType = (typeof ACCESS_TYPES)[number];

export const ACCESS_TYPE_LABELS: Record<AccessType, { es: string; en: string }> = {
  public: { es: 'Público', en: 'Public' },
  permit_required: { es: 'Privado con permiso', en: 'Permit required' },
  paid: { es: 'Pago', en: 'Paid' },
  free: { es: 'Gratuito', en: 'Free' },
  car: { es: 'En auto', en: 'By car' },
  offroad: { es: '4x4', en: '4x4' },
  walking: { es: 'A pie', en: 'On foot' },
  boat: { es: 'En embarcación', en: 'By boat' },
};

/**
 * Régimen de propiedad para la ficha del lugar.
 */
export const OWNERSHIP_TYPES = [
  'public',
  'private',
  'club',
  'municipal',
  'provincial',
  'national',
  'cooperative',
  'unknown',
] as const;

export type OwnershipType = (typeof OWNERSHIP_TYPES)[number];

export function isAccessType(value: string): value is AccessType {
  return (ACCESS_TYPES as readonly string[]).includes(value);
}
