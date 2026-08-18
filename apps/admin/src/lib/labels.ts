/**
 * Labels en español para el panel admin.
 * Se mantienen locales (no se importan desde @pescaba/shared) porque el build de
 * Vite/rollup no resuelve los re-exports CJS del paquete compartido (`__exportStar`
 * anidado). Los slugs coinciden con el contrato de la API (SITE_TYPES en shared).
 */
export const SITE_TYPES = [
  'beach',
  'lagoon',
  'lake',
  'river',
  'stream',
  'pier',
  'jetty',
  'harbor',
  'club',
  'boat_launch',
  'public_access',
  'dam',
  'wetland',
] as const;

export const SITE_TYPE_LABELS_ES: Record<string, string> = {
  beach: 'Playa',
  lagoon: 'Laguna',
  lake: 'Lago',
  river: 'Río',
  stream: 'Arroyo',
  pier: 'Muelle',
  jetty: 'Espigón',
  harbor: 'Puerto',
  club: 'Club de pesca',
  boat_launch: 'Bajada de embarcación',
  public_access: 'Acceso público',
  dam: 'Represa',
  wetland: 'Humedal',
};

/** Label en español de un tipo de lugar. Fallback al slug si el valor es desconocido. */
export function siteTypeLabel(value: string): string {
  return SITE_TYPE_LABELS_ES[value] ?? value;
}
