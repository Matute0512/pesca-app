/**
 * Punto de entrada para TypeScript: Metro resuelve el archivo por plataforma
 * (SiteMap.native.tsx en iOS/Android, SiteMap.web.tsx en web) y este base solo
 * existe para que `tsc` encuentre el módulo.
 */
export { SiteMap } from './SiteMap.native';
export type { SiteMapMarker, SiteMapProps } from './SiteMap.native';
