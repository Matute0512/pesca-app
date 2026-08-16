import type {
  AccessType,
  AmenityType,
  OwnershipType,
  ReportType,
  Role,
  SiteType,
  SpeciesCategory,
} from '../constants';

/** Envoltorio de respuesta exitosa de la API. */
export interface ApiResponse<T> {
  success: true;
  data: T;
  meta?: Record<string, unknown>;
}

/** Envoltorio de respuesta de error de la API. */
export interface ApiErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: unknown[];
  };
}

/** Metadatos de paginación. */
export interface PaginationMeta {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

/** Elemento de un listado de lugares. */
export interface SiteSummary {
  id: string;
  slug: string;
  name: string;
  siteType: SiteType;
  locality: string | null;
  municipality: string | null;
  province: string | null;
  countryCode: string;
  latitude: number;
  longitude: number;
  distanceMeters: number | null;
  isVerified: boolean;
  /** Relevancia de búsqueda (solo en /search). */
  relevance?: number;
  coverPhotoUrl: string | null;
  speciesSlugs: string[];
}

/** Detalle completo de un lugar (ficha). */
export interface SiteDetail {
  id: string;
  slug: string;
  name: string;
  alternativeName: string | null;
  descriptionShort: string | null;
  descriptionLong: string | null;
  siteType: SiteType;
  accessType: AccessType | null;
  ownershipType: OwnershipType | null;
  isPublic: boolean;
  isVerified: boolean;
  latitude: number;
  longitude: number;
  geomPrecisionMeters: number | null;
  addressLine: string | null;
  addressNotes: string | null;
  locality: string | null;
  municipality: string | null;
  province: string | null;
  region: string | null;
  countryCode: string;
  postalCode: string | null;
  phone: string | null;
  whatsapp: string | null;
  email: string | null;
  website: string | null;
  openingHours: string | null;
  entryFee: string | null;
  bestSeason: string | null;
  difficultyLevel: number | null;
  allowsBoats: boolean;
  allowsNightFishing: boolean;
  allowsCamping: boolean;
  source: string | null;
  verifiedAt: Date | null;
  lastCheckedAt: Date | null;
  updatedAt: Date;
  amenities: AmenityType[];
  species: { speciesSlug: string; commonNameEs: string; abundance: string | null }[];
  photos: { url: string; thumbnailUrl: string | null; caption: string | null; isCover: boolean }[];
  isFavorite?: boolean;
  favoriteList?: string;
}

/** Usuario público (propio perfil o administración). */
export interface PublicUser {
  id: string;
  email: string;
  username: string | null;
  fullName: string | null;
  avatarUrl: string | null;
  role: Role;
  emailVerified: boolean;
  preferredLanguage: string;
  preferredUnits: string;
  createdAt: Date;
}

/** Especie del catálogo. */
export interface Species {
  id: string;
  slug: string;
  commonNameEs: string;
  commonNameEn: string;
  scientificName: string;
  category: SpeciesCategory;
}

/** Reporte de problema. */
export interface SiteReport {
  id: string;
  siteId: string;
  reportType: ReportType;
  description: string | null;
  status: ReportStatus;
  createdAt: Date;
}

export type ReportStatus = 'open' | 'in_review' | 'resolved' | 'rejected';

/** Sugerencia de nuevo lugar. */
export interface SiteSuggestion {
  id: string;
  name: string;
  siteType: SiteType;
  latitude: number;
  longitude: number;
  addressLine: string | null;
  locality: string | null;
  municipality: string | null;
  province: string | null;
  countryCode: string;
  phone: string | null;
  description: string | null;
  status: SuggestionStatus;
  createdAt: Date;
}

export type SuggestionStatus = 'pending' | 'approved' | 'rejected';

/**
 * Opciones de filtro usadas por listados de sitios.
 * El shape canónico validado por la API está en schemas/sites.ts (`SiteListQuery`).
 */
export interface SiteListFilters {
  lat?: number;
  lng?: number;
  radiusMeters?: number;
  siteTypes?: SiteType[];
  accessTypes?: AccessType[];
  amenities?: AmenityType[];
  speciesSlugs?: string[];
  status?: string[];
  q?: string;
  page?: number;
  pageSize?: number;
  sort?: 'distance' | 'name' | 'relevance' | 'newest';
}
