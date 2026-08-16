/**
 * Estados de un lugar derivados para filtros ("Estado" del requisito de filtros).
 * - verified: moderadores lo verificaron.
 * - popular: tiene muchos favoritos (definido en backend).
 * - recent_reports: tiene reportes recientes (definido en backend).
 */
export const SITE_STATUS_FILTERS = ['verified', 'popular', 'recent_reports'] as const;

export type SiteStatusFilter = (typeof SITE_STATUS_FILTERS)[number];
