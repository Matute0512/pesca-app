import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { toSiteSummary } from './site.mapper';

export interface NearbyRow {
  id: string;
  slug: string;
  name: string;
  siteType: string;
  isVerified: boolean;
  latitude: number;
  longitude: number;
  locality: string | null;
  municipality: string | null;
  province: string | null;
  countryCode: string;
  distanceMeters: number;
}

export interface SearchRow extends Omit<NearbyRow, 'distanceMeters'> {
  relevance: number;
}

export interface AutocompleteItem {
  id: string;
  slug: string;
  name: string;
  locality: string | null;
  municipality: string | null;
  province: string | null;
  countryCode: string;
  siteType: string;
  isVerified: boolean;
  latitude: number;
  longitude: number;
}

const ACTIVE_SITE = Prisma.sql`s."isActive" = true AND s."isPublic" = true AND s."deletedAt" IS NULL`;

/**
 * Búsqueda geoespacial y de texto sobre PostgreSQL + PostGIS + pg_trgm + unaccent.
 * Abstracción: esta implementación puede reemplazarse por Meilisearch/Typesense
 * sin tocar los controladores (ADR-003).
 */
@Injectable()
export class SiteSearchService {
  constructor(private readonly prisma: PrismaService) {}

  /** Busca lugares dentro de un radio, ordenados por distancia (ST_DWithin + ST_Distance). */
  async nearby(
    lat: number,
    lng: number,
    radiusMeters: number,
    limit: number,
  ): Promise<NearbyRow[]> {
    return this.prisma.$queryRaw<NearbyRow[]>`
      SELECT
        id, slug, name,
        "siteType"::text AS "siteType",
        "isVerified",
        latitude, longitude, locality, municipality, province, "countryCode",
        ST_Distance(
          ST_SetSRID(ST_MakePoint(longitude, latitude), 4326)::geography,
          ST_SetSRID(ST_MakePoint(${lng}, ${lat}), 4326)::geography
        ) AS "distanceMeters"
      FROM "fishing_sites"
      WHERE "isActive" = true AND "isPublic" = true AND "deletedAt" IS NULL
        AND ST_DWithin(
          ST_SetSRID(ST_MakePoint(longitude, latitude), 4326)::geography,
          ST_SetSRID(ST_MakePoint(${lng}, ${lat}), 4326)::geography,
          ${radiusMeters}
        )
      ORDER BY "distanceMeters" ASC
      LIMIT ${limit};
    `;
  }

  /**
   * Búsqueda por texto con ranking de relevancia:
   * - ILIKE difuso con f_unaccent (tolerancia a acentos y errores tipográficos simples).
   * - Full-text search en español como boost de relevancia.
   * Opcional: restringe a un set de ids (para combinar con filtros de especies/amenities).
   */
  async search(q: string, limit: number, restrictToIds?: string[]): Promise<SearchRow[]> {
    const conditions = [ACTIVE_SITE];
    if (restrictToIds && restrictToIds.length > 0) {
      conditions.push(Prisma.sql`s.id = ANY(${restrictToIds})`);
    }
    const where = Prisma.sql`WHERE ${Prisma.join(conditions, ' AND ')}`;

    return this.prisma.$queryRaw<SearchRow[]>`
      SELECT
        s.id, s.slug, s.name,
        s."siteType"::text AS "siteType",
        s."isVerified",
        s.latitude, s.longitude, s.locality, s.municipality, s.province, s."countryCode",
        COALESCE(ts_rank(
          setweight(to_tsvector('spanish', COALESCE(s.name, '')), 'A') ||
          setweight(to_tsvector('spanish', COALESCE(s."alternativeName", '')), 'B') ||
          setweight(to_tsvector('spanish', COALESCE(s.locality, '')), 'B') ||
          setweight(to_tsvector('spanish', COALESCE(s.municipality, '')), 'C'),
          q.query
        ), 0) AS relevance
      FROM "fishing_sites" s
      CROSS JOIN (SELECT websearch_to_tsquery('spanish', ${q}) AS query) q
      ${where}
        AND (
          public.f_unaccent(concat_ws(' ', s.name, s."alternativeName", s.locality, s.municipality))
            ILIKE ('%' || public.f_unaccent(${q}) || '%')
          OR (q.query IS NOT NULL AND (
            to_tsvector('spanish', COALESCE(s.name, '')) ||
            to_tsvector('spanish', COALESCE(s."alternativeName", '')) ||
            to_tsvector('spanish', COALESCE(s.locality, '')) ||
            to_tsvector('spanish', COALESCE(s.municipality, ''))
          ) @@ q.query)
        )
      ORDER BY relevance DESC, s.name ASC
      LIMIT ${limit};
    `;
  }

  /** Autocompletado: prioriza prefijos y luego similitud de nombre/localidad. */
  async autocomplete(q: string, limit: number): Promise<AutocompleteItem[]> {
    return this.prisma.$queryRaw<AutocompleteItem[]>`
      SELECT
        id, slug, name, locality, municipality, province, "countryCode",
        "siteType"::text AS "siteType",
        "isVerified", latitude, longitude,
        CASE WHEN public.f_unaccent(name) LIKE (public.f_unaccent(${q}) || '%') THEN 0 ELSE 1 END AS prefix_rank
      FROM "fishing_sites"
      WHERE "isActive" = true AND "isPublic" = true AND "deletedAt" IS NULL
        AND public.f_unaccent(concat_ws(' ', name, "alternativeName", locality, municipality))
            ILIKE ('%' || public.f_unaccent(${q}) || '%')
      ORDER BY prefix_rank ASC,
               similarity(public.f_unaccent(name), public.f_unaccent(${q})) DESC,
               name ASC
      LIMIT ${limit};
    `;
  }

  /** Enriquece un set de filas (ids + distancia/relevancia) con especies y cover photo. */
  async enrichSummaries(
    rows: Array<{ id: string; distanceMeters?: number; relevance?: number }>,
  ): Promise<ReturnType<typeof toSiteSummary>[]> {
    if (rows.length === 0) {
      return [];
    }
    const ids = rows.map((r) => r.id);
    const sites = await this.prisma.fishingSite.findMany({
      where: { id: { in: ids } },
      include: {
        species: { select: { species: { select: { slug: true, commonNameEs: true } } } },
        amenities: true,
        photos: {
          where: { isCover: true, moderationStatus: 'approved' },
          select: { url: true, thumbnailUrl: true, caption: true, isCover: true },
          take: 1,
        },
      },
    });
    const byId = new Map(sites.map((s) => [s.id, s]));
    return rows.flatMap((row) => {
      const site = byId.get(row.id);
      if (!site) {
        return [];
      }
      return [toSiteSummary(site, { distanceMeters: row.distanceMeters, relevance: row.relevance })];
    });
  }
}
