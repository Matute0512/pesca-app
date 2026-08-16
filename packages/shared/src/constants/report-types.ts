/**
 * Tipos de reporte de problema sobre un lugar.
 */
export const REPORT_TYPES = [
  'wrong_coordinates', // coordenadas incorrectas
  'place_closed', // lugar cerrado
  'restricted_access', // acceso restringido
  'false_information', // información falsa
  'wrong_phone', // teléfono incorrecto
  'dangerous_place', // lugar peligroso
  'garbage', // basura
  'turbid_water', // agua turbia
  'fishing_prohibited', // pesca prohibida
  'duplicate', // duplicado
  'inappropriate_content', // contenido inapropiado
] as const;

export type ReportType = (typeof REPORT_TYPES)[number];

export const REPORT_TYPE_LABELS: Record<ReportType, { es: string; en: string }> = {
  wrong_coordinates: { es: 'Coordenadas incorrectas', en: 'Wrong coordinates' },
  place_closed: { es: 'Lugar cerrado', en: 'Place closed' },
  restricted_access: { es: 'Acceso restringido', en: 'Restricted access' },
  false_information: { es: 'Información falsa', en: 'False information' },
  wrong_phone: { es: 'Teléfono incorrecto', en: 'Wrong phone' },
  dangerous_place: { es: 'Lugar peligroso', en: 'Dangerous place' },
  garbage: { es: 'Basura', en: 'Garbage' },
  turbid_water: { es: 'Agua turbia', en: 'Turbid water' },
  fishing_prohibited: { es: 'Pesca prohibida', en: 'Fishing prohibited' },
  duplicate: { es: 'Duplicado', en: 'Duplicate' },
  inappropriate_content: { es: 'Contenido inapropiado', en: 'Inappropriate content' },
};
