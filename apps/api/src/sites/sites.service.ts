import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import type { Prisma} from '@prisma/client';
import { type AccessType, type AmenityType, type OwnershipType, type SiteType } from '@prisma/client';
import { haversineDistanceMeters } from '@pescaba/geo';
import { slugify, type FavoriteListName, type SiteListQuery, type SiteSummary } from '@pescaba/shared';
import { ErrorCode } from '../common/error-codes';
import { PrismaService } from '../prisma/prisma.service';
import { StorageService } from '../storage/storage.service';
import { toSiteDetail, toSiteSummary } from './site.mapper';
import { SiteSearchService } from './site-search.service';

const DEFAULT_PAGE_SIZE = 20;
const MAX_PAGE_SIZE = 100;
const ALLOWED_IMAGE_MIME = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/heic']);
const MAX_IMAGE_BYTES = 8 * 1024 * 1024; // 8 MB

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  meta: { page: number; pageSize: number; total: number; totalPages: number };
}

export interface CreateSiteInput {
  name: string;
  siteType: SiteType;
  latitude: number;
  longitude: number;
  descriptionShort?: string | null;
  descriptionLong?: string | null;
  locality?: string | null;
  municipality?: string | null;
  province?: string | null;
  countryCode?: string;
  addressLine?: string | null;
  phone?: string | null;
  whatsapp?: string | null;
  website?: string | null;
  accessType?: AccessType | null;
  ownershipType?: OwnershipType | null;
  isPublic?: boolean;
  allowsBoats?: boolean;
  allowsNightFishing?: boolean;
  allowsCamping?: boolean;
  speciesIds?: string[];
  amenities?: string[];
  source?: string;
}

@Injectable()
export class SitesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly search: SiteSearchService,
    private readonly storage: StorageService,
  ) {}

  /** Listado con filtros, paginación y orden (distancias vía haversine si lat/lng). */
  async list(query: SiteListQuery): Promise<PaginatedResult<SiteSummary>> {
    const page = query.page ?? 1;
    const pageSize = Math.min(query.pageSize ?? DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE);

    if (query.q) {
      return this.listByText(query, page, pageSize);
    }

    const where = this.buildWhere(query);
    const [sites, total] = await Promise.all([
      this.prisma.fishingSite.findMany({
        where,
        include: this.includeForSummary(),
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: this.buildOrderBy(query),
      }),
      this.prisma.fishingSite.count({ where }),
    ]);

    let data = sites.map((s) => toSiteSummary(s));

    if (query.lat != null && query.lng != null) {
      data = data.map((s) => ({
        ...s,
        distanceMeters: Math.round(
          haversineDistanceMeters(s.latitude, s.longitude, query.lat!, query.lng!),
        ),
      }));
      if (query.sort === 'distance') {
        data.sort((a, b) => (a.distanceMeters ?? Infinity) - (b.distanceMeters ?? Infinity));
      }
    }

    return {
      data,
      total,
      meta: { page, pageSize, total, totalPages: Math.ceil(total / pageSize) },
    };
  }

  /** Detalle completo de un lugar, con estado de favorito si el usuario está logueado. */
  async detail(id: string, userId?: string) {
    const site = await this.prisma.fishingSite.findFirst({
      where: { id, isActive: true, deletedAt: null },
      include: {
        species: { include: { species: true } },
        amenities: true,
        photos: {
          where: { moderationStatus: 'approved' },
          orderBy: { isCover: 'desc' },
        },
      },
    });
    if (!site) {
      throw new NotFoundException({
        statusCode: 404,
        message: 'Lugar no encontrado',
        code: ErrorCode.SITE_NOT_FOUND,
      });
    }

    let favoriteList: FavoriteListName | null = null;
    if (userId) {
      const fav = await this.prisma.favorite.findUnique({
        where: { userId_siteId: { userId, siteId: id } },
      });
      favoriteList = fav?.listName ?? null;
    }

    return toSiteDetail(site, { favoriteList });
  }

  async getSpecies(siteId: string) {
    await this.assertExists(siteId);
    const rows = await this.prisma.fishingSiteSpecies.findMany({
      where: { siteId },
      include: { species: true },
      orderBy: { species: { commonNameEs: 'asc' } },
    });
    return rows.map((r) => ({
      speciesSlug: r.species.slug,
      commonNameEs: r.species.commonNameEs,
      commonNameEn: r.species.commonNameEn,
      scientificName: r.species.scientificName,
      abundance: r.abundance,
      season: r.season,
    }));
  }

  async getAmenities(siteId: string) {
    await this.assertExists(siteId);
    const rows = await this.prisma.siteAmenity.findMany({
      where: { siteId },
      orderBy: { amenityType: 'asc' },
    });
    return rows.map((r) => ({
      amenityType: r.amenityType,
      isAvailable: r.isAvailable,
      notes: r.notes,
    }));
  }

  async getPhotos(siteId: string) {
    await this.assertExists(siteId);
    return this.prisma.sitePhoto.findMany({
      where: { siteId, moderationStatus: 'approved' },
      orderBy: [{ isCover: 'desc' }, { createdAt: 'desc' }],
      select: { id: true, url: true, thumbnailUrl: true, caption: true, isCover: true, createdAt: true },
    });
  }

  /** Sube una foto de lugar (queda pendiente de moderación). */
  async uploadPhoto(siteId: string, userId: string, file: Express.Multer.File) {
    await this.assertExists(siteId);
    if (!ALLOWED_IMAGE_MIME.has(file.mimetype)) {
      throw new BadRequestException({
        statusCode: 400,
        message: 'Formato de imagen no permitido (JPEG, PNG, WebP, HEIC)',
        code: ErrorCode.VALIDATION_FAILED,
      });
    }
    if (file.size > MAX_IMAGE_BYTES) {
      throw new BadRequestException({
        statusCode: 400,
        message: 'La imagen supera el tamaño máximo de 8 MB',
        code: ErrorCode.VALIDATION_FAILED,
      });
    }

    const key = this.storage.buildKey(`sites/${siteId}`, file.originalname || 'photo.jpg');
    const { url } = await this.storage.putObject(key, file.buffer, file.mimetype);

    return this.prisma.sitePhoto.create({
      data: {
        siteId,
        userId,
        storageKey: key,
        url,
        mimeType: file.mimetype,
        moderationStatus: 'pending',
      },
      select: { id: true, url: true, moderationStatus: true, createdAt: true },
    });
  }

  /** Crea un lugar (admin/editor). Genera slug único. */
  async create(data: CreateSiteInput, actorId: string) {
    const slug = await this.uniqueSlug(data.name);
    return this.prisma.fishingSite.create({
      data: {
        slug,
        name: data.name.trim(),
        siteType: data.siteType,
        latitude: data.latitude,
        longitude: data.longitude,
        descriptionShort: data.descriptionShort,
        descriptionLong: data.descriptionLong,
        locality: data.locality,
        municipality: data.municipality,
        province: data.province,
        countryCode: data.countryCode ?? 'ar',
        addressLine: data.addressLine,
        phone: data.phone,
        whatsapp: data.whatsapp,
        website: data.website,
        accessType: data.accessType,
        ownershipType: data.ownershipType,
        isPublic: data.isPublic ?? true,
        allowsBoats: data.allowsBoats ?? false,
        allowsNightFishing: data.allowsNightFishing ?? false,
        allowsCamping: data.allowsCamping ?? false,
        createdBy: actorId,
        updatedBy: actorId,
        source: data.source ?? 'admin',
        species: {
          create: (data.speciesIds ?? []).map((speciesId) => ({ speciesId })),
        },
        amenities: {
          create: (data.amenities ?? []).map((amenityType) => ({
            amenityType: amenityType as AmenityType,
          })),
        },
      },
      include: this.includeForSummary(),
    });
  }

  /** Actualiza un lugar (admin/editor). */
  async update(id: string, data: Partial<CreateSiteInput>, actorId: string) {
    await this.assertExists(id);
    return this.prisma.$transaction(async (tx) => {
      await tx.fishingSite.update({
        where: { id },
        data: {
          name: data.name?.trim(),
          siteType: data.siteType,
          latitude: data.latitude,
          longitude: data.longitude,
          descriptionShort: data.descriptionShort,
          descriptionLong: data.descriptionLong,
          locality: data.locality,
          municipality: data.municipality,
          province: data.province,
          countryCode: data.countryCode,
          addressLine: data.addressLine,
          phone: data.phone,
          whatsapp: data.whatsapp,
          website: data.website,
          isPublic: data.isPublic,
          allowsBoats: data.allowsBoats,
          allowsNightFishing: data.allowsNightFishing,
          allowsCamping: data.allowsCamping,
          updatedBy: actorId,
        },
      });

      if (data.speciesIds) {
        await tx.fishingSiteSpecies.deleteMany({ where: { siteId: id } });
        await tx.fishingSiteSpecies.createMany({
          data: data.speciesIds.map((speciesId) => ({ siteId: id, speciesId })),
        });
      }
      if (data.amenities) {
        await tx.siteAmenity.deleteMany({ where: { siteId: id } });
        await tx.siteAmenity.createMany({
          data: data.amenities.map((amenityType) => ({
            siteId: id,
            amenityType: amenityType as AmenityType,
          })),
        });
      }
      return tx.fishingSite.findUnique({ where: { id }, include: this.includeForSummary() });
    });
  }

  /** Marca un lugar como verificado. */
  async verify(id: string, actorId: string) {
    await this.assertExists(id);
    return this.prisma.fishingSite.update({
      where: { id },
      data: { isVerified: true, verifiedBy: actorId, verifiedAt: new Date(), lastCheckedAt: new Date() },
      include: this.includeForSummary(),
    });
  }

  /** Soft delete de un lugar. */
  async remove(id: string, actorId: string): Promise<void> {
    await this.assertExists(id);
    await this.prisma.fishingSite.update({
      where: { id },
      data: { isActive: false, deletedAt: new Date(), updatedBy: actorId },
    });
  }

  async assertExists(id: string): Promise<void> {
    const count = await this.prisma.fishingSite.count({ where: { id, deletedAt: null } });
    if (count === 0) {
      throw new NotFoundException({
        statusCode: 404,
        message: 'Lugar no encontrado',
        code: ErrorCode.SITE_NOT_FOUND,
      });
    }
  }

  // ────────────────────────────────────────────── Helpers

  private async listByText(
    query: SiteListQuery,
    page: number,
    pageSize: number,
  ): Promise<PaginatedResult<SiteSummary>> {
    const q = query.q ?? '';

    let restrictIds: string[] | undefined;
    if (query.species?.length || query.amenities?.length) {
      const filtered = await this.prisma.fishingSite.findMany({
        where: this.buildWhere(query),
        select: { id: true },
      });
      restrictIds = filtered.map((f) => f.id);
    }

    const rows = await this.search.search(q, pageSize * 10, restrictIds);
    const total = rows.length;
    const paginated = rows.slice((page - 1) * pageSize, page * pageSize);
    const data = await this.search.enrichSummaries(paginated);

    return { data, total, meta: { page, pageSize, total, totalPages: Math.ceil(total / pageSize) } };
  }

  private buildWhere(query: SiteListQuery): Prisma.FishingSiteWhereInput {
    const where: Prisma.FishingSiteWhereInput = {
      isActive: true,
      isPublic: true,
      deletedAt: null,
    };

    if (query.siteTypes?.length) {
      where.siteType = { in: query.siteTypes as SiteType[] };
    }
    if (query.accessTypes?.length) {
      where.accessType = { in: query.accessTypes as never[] };
    }
    if (query.amenities?.length) {
      where.amenities = { some: { amenityType: { in: query.amenities as never[] } } };
    }
    if (query.species?.length) {
      where.species = { some: { species: { slug: { in: query.species } } } };
    }
    if (query.status?.length) {
      where.AND = [
        ...(where.AND as Prisma.FishingSiteWhereInput[] | undefined) ?? [],
        ...this.buildStatusFilters(query.status),
      ];
    }
    return where;
  }

  private buildStatusFilters(statuses: string[]): Prisma.FishingSiteWhereInput[] {
    const filters: Prisma.FishingSiteWhereInput[] = [];
    if (statuses.includes('verified')) {
      filters.push({ isVerified: true });
    }
    // Aproximación MVP: "popular" = tiene al menos un favorito.
    if (statuses.includes('popular')) {
      filters.push({ favorites: { some: {} } });
    }
    // Aproximación MVP: "con reportes recientes" = reportes en los últimos 30 días.
    if (statuses.includes('recent_reports')) {
      filters.push({
        reports: { some: { createdAt: { gte: new Date(Date.now() - 30 * 86400_000) } } },
      });
    }
    return filters;
  }

  private buildOrderBy(query: SiteListQuery): Prisma.FishingSiteOrderByWithRelationInput[] {
    switch (query.sort) {
      case 'newest':
        return [{ createdAt: 'desc' }];
      case 'name':
      default:
        return [{ name: 'asc' }];
    }
  }

  private includeForSummary() {
    return {
      species: { select: { species: { select: { slug: true, commonNameEs: true } } } },
      amenities: true,
      photos: {
        where: { isCover: true, moderationStatus: 'approved' },
        select: { url: true, thumbnailUrl: true, caption: true, isCover: true },
        take: 1,
      },
    } satisfies Prisma.FishingSiteInclude;
  }

  private async uniqueSlug(name: string): Promise<string> {
    const base = slugify(name);
    const existing = await this.prisma.fishingSite.findUnique({ where: { slug: base } });
    if (!existing) {
      return base;
    }
    let i = 2;
    while (await this.prisma.fishingSite.findUnique({ where: { slug: `${base}-${i}` } })) {
      i += 1;
    }
    return `${base}-${i}`;
  }
}
