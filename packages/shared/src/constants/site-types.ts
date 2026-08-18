/**
 * Tipos de lugar de pesca.
 * Código en inglés (slug), label en español e inglés para i18n.
 */
export const SITE_TYPES = [
  'beach', // playa
  'lagoon', // laguna
  'lake', // lago
  'river', // río
  'stream', // arroyo
  'pier', // muelle
  'jetty', // espigón
  'harbor', // puerto
  'club', // club
  'boat_launch', // bajada de embarcación
  'public_access', // acceso público
  'dam', // represa
  'wetland', // humedal
] as const;

export type SiteType = (typeof SITE_TYPES)[number];

export const SITE_TYPE_LABELS: Record<SiteType, { es: string; en: string }> = {
  beach: { es: 'Playa', en: 'Beach' },
  lagoon: { es: 'Laguna', en: 'Lagoon' },
  lake: { es: 'Lago', en: 'Lake' },
  river: { es: 'Río', en: 'River' },
  stream: { es: 'Arroyo', en: 'Stream' },
  pier: { es: 'Muelle', en: 'Pier' },
  jetty: { es: 'Espigón', en: 'Jetty' },
  harbor: { es: 'Puerto', en: 'Harbor' },
  club: { es: 'Club de pesca', en: 'Fishing club' },
  boat_launch: { es: 'Bajada de embarcación', en: 'Boat launch' },
  public_access: { es: 'Acceso público', en: 'Public access' },
  dam: { es: 'Represa', en: 'Dam' },
  wetland: { es: 'Humedal', en: 'Wetland' },
};

export function isSiteType(value: string): value is SiteType {
  return (SITE_TYPES as readonly string[]).includes(value);
}
