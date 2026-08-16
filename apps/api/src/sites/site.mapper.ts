import type { AccessType, AmenityType, FavoriteListName, OwnershipType, SiteDetail, SiteSummary, SiteType } from '@pescaba/shared';

/**
 * Estructura mínima de un sitio (Prisma con relaciones incluidas o fila enriquecida).
 */
export interface SiteMapperInput {
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
  amenities: Array<{ amenityType: AmenityType }>;
  species: Array<{ species: { slug: string; commonNameEs: string }; abundance?: string | null }>;
  photos: Array<{ url: string; thumbnailUrl: string | null; caption: string | null; isCover: boolean }>;
}

export interface SiteSummaryOptions {
  distanceMeters?: number | null;
  relevance?: number | null;
}

export function toSiteSummary(site: SiteMapperInput, opts: SiteSummaryOptions = {}): SiteSummary {
  const cover = site.photos.find((p) => p.isCover) ?? site.photos[0];
  return {
    id: site.id,
    slug: site.slug,
    name: site.name,
    siteType: site.siteType,
    locality: site.locality,
    municipality: site.municipality,
    province: site.province,
    countryCode: site.countryCode,
    latitude: site.latitude,
    longitude: site.longitude,
    distanceMeters: opts.distanceMeters ?? null,
    relevance: opts.relevance ?? undefined,
    isVerified: site.isVerified,
    coverPhotoUrl: cover ? (cover.thumbnailUrl ?? cover.url) : null,
    speciesSlugs: site.species.map((s) => s.species.slug),
  };
}

export interface SiteDetailOptions {
  favoriteList?: FavoriteListName | null;
}

export function toSiteDetail(site: SiteMapperInput, opts: SiteDetailOptions = {}): SiteDetail {
  return {
    id: site.id,
    slug: site.slug,
    name: site.name,
    alternativeName: site.alternativeName,
    descriptionShort: site.descriptionShort,
    descriptionLong: site.descriptionLong,
    siteType: site.siteType,
    accessType: site.accessType,
    ownershipType: site.ownershipType,
    isPublic: site.isPublic,
    isVerified: site.isVerified,
    latitude: site.latitude,
    longitude: site.longitude,
    geomPrecisionMeters: site.geomPrecisionMeters,
    addressLine: site.addressLine,
    addressNotes: site.addressNotes,
    locality: site.locality,
    municipality: site.municipality,
    province: site.province,
    region: site.region,
    countryCode: site.countryCode,
    postalCode: site.postalCode,
    phone: site.phone,
    whatsapp: site.whatsapp,
    email: site.email,
    website: site.website,
    openingHours: site.openingHours,
    entryFee: site.entryFee,
    bestSeason: site.bestSeason,
    difficultyLevel: site.difficultyLevel,
    allowsBoats: site.allowsBoats,
    allowsNightFishing: site.allowsNightFishing,
    allowsCamping: site.allowsCamping,
    source: site.source,
    verifiedAt: site.verifiedAt,
    lastCheckedAt: site.lastCheckedAt,
    updatedAt: site.updatedAt,
    amenities: site.amenities.filter((a) => a.amenityType).map((a) => a.amenityType),
    species: site.species.map((s) => ({
      speciesSlug: s.species.slug,
      commonNameEs: s.species.commonNameEs,
      abundance: s.abundance ?? null,
    })),
    photos: site.photos.map((p) => ({
      url: p.url,
      thumbnailUrl: p.thumbnailUrl,
      caption: p.caption,
      isCover: p.isCover,
    })),
    isFavorite: opts.favoriteList ? true : undefined,
    favoriteList: opts.favoriteList ?? undefined,
  };
}
