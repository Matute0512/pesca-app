import { BadRequestException, Injectable } from '@nestjs/common';
import { parse } from 'csv-parse/sync';
import { AMENITY_TYPES, createSiteSchema } from '@pescaba/shared';
import { ErrorCode } from '../common/error-codes';
import { PrismaService } from '../prisma/prisma.service';
import { SitesService } from '../sites/sites.service';

const DUPLICATE_DISTANCE_METERS = 500;

export interface NormalizedImportRow {
  name: string;
  siteType: string;
  latitude: number;
  longitude: number;
  locality?: string | null;
  municipality?: string | null;
  province?: string | null;
  countryCode?: string;
  addressLine?: string | null;
  phone?: string | null;
  website?: string | null;
  description?: string | null;
  accessType?: string | null;
  ownershipType?: string | null;
  species?: string[];
  amenities?: string[];
}

export interface ImportError {
  row: number;
  name?: string;
  error: string;
}

export interface ImportSummary {
  total: number;
  created: number;
  duplicates: number;
  errors: ImportError[];
  dryRun: boolean;
}

/**
 * Pipeline de importación: CSV o GeoJSON → normalizar → validar →
 * detectar duplicados (nombre similar + cercanía) → crear o reportar.
 * Soporta dry-run: no escribe nada y devuelve el informe.
 */
@Injectable()
export class ImportService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly sites: SitesService,
  ) {}

  async importFile(file: Express.Multer.File, dryRun: boolean, actorId: string): Promise<ImportSummary> {
    const raw = file.buffer.toString('utf-8');
    const isCsv =
      file.mimetype.includes('csv') || file.originalname.toLowerCase().endsWith('.csv');
    const isGeoJson =
      file.mimetype.includes('json') || file.originalname.toLowerCase().endsWith('.geojson');

    let rows: Array<NormalizedImportRow & { row: number }>;
    try {
      rows = isCsv ? this.parseCsv(raw) : isGeoJson ? this.parseGeoJson(raw) : [];
    } catch (error) {
      throw new BadRequestException({
        statusCode: 400,
        message: `No se pudo interpretar el archivo: ${(error as Error).message}`,
        code: ErrorCode.IMPORT_PARSE_ERROR,
      });
    }

    if (rows.length === 0) {
      throw new BadRequestException({
        statusCode: 400,
        message: 'El archivo no contiene filas válidas',
        code: ErrorCode.IMPORT_PARSE_ERROR,
      });
    }

    return this.processRows(rows, dryRun, actorId);
  }

  // ────────────────────────────────────────────── Parsers

  private parseCsv(raw: string): Array<NormalizedImportRow & { row: number }> {
    const records = parse(raw, { columns: true, skip_empty_lines: true, trim: true });
    return records.map((record: Record<string, string>, index: number) => {
      const row = this.normalize(record) as NormalizedImportRow & { row: number };
      row.row = index + 2; // header = fila 1
      return row;
    });
  }

  private parseGeoJson(raw: string): Array<NormalizedImportRow & { row: number }> {
    const data = JSON.parse(raw) as {
      type?: string;
      features?: Array<{
        type: string;
        geometry?: { type: string; coordinates?: number[] };
        properties?: Record<string, unknown>;
      }>;
    };
    const features = data.features ?? [];
    if (data.type !== 'FeatureCollection' && data.type !== 'Feature') {
      throw new Error('El GeoJSON debe ser Feature o FeatureCollection');
    }
    return features.map((feature, index) => {
      if (feature.geometry?.type !== 'Point' || !feature.geometry.coordinates) {
        throw new Error(`Feature ${index + 1}: se espera un Point`);
      }
      const [lng, lat] = feature.geometry.coordinates;
      const props = feature.properties ?? {};
      const row = this.normalize({
        ...props,
        longitude: lng,
        latitude: lat,
      } as Record<string, unknown>) as NormalizedImportRow & { row: number };
      row.row = index + 1;
      return row;
    });
  }

  /** Normaliza campos del archivo (tolerante a sinónimos y casos). */
  private normalize(record: Record<string, unknown>): NormalizedImportRow {
    const get = (...keys: string[]): string | undefined => {
      for (const key of keys) {
        const value = record[key];
        if (value !== undefined && value !== null && String(value).trim() !== '') {
          return String(value).trim();
        }
        const lowerKey = Object.keys(record).find(
          (k) => k.toLowerCase().replace(/[^a-z]/g, '') === key.toLowerCase().replace(/[^a-z]/g, ''),
        );
        if (lowerKey) {
          const v = record[lowerKey];
          if (v !== undefined && v !== null && String(v).trim() !== '') {
            return String(v).trim();
          }
        }
      }
      return undefined;
    };

    const splitList = (value?: string): string[] =>
      value ? value.split(',').map((s) => s.trim()).filter(Boolean) : [];

    const latStr = get('latitude', 'lat');
    const lngStr = get('longitude', 'lng', 'lon');

    return {
      name: get('name') ?? '',
      siteType: get('site_type', 'siteType', 'type') ?? '',
      latitude: latStr ? Number(latStr) : NaN,
      longitude: lngStr ? Number(lngStr) : NaN,
      locality: get('locality') ?? null,
      municipality: get('municipality') ?? null,
      province: get('province') ?? null,
      countryCode: get('country_code', 'countryCode', 'country')?.toLowerCase() ?? 'ar',
      addressLine: get('address', 'address_line', 'addressLine') ?? null,
      phone: get('phone') ?? null,
      website: get('website') ?? null,
      description: get('description') ?? null,
      accessType: get('access_type', 'accessType') ?? null,
      ownershipType: get('ownership_type', 'ownershipType') ?? null,
      species: splitList(get('species')),
      amenities: splitList(get('amenities')),
    };
  }

  // ────────────────────────────────────────────── Procesamiento

  private async processRows(
    rows: Array<NormalizedImportRow & { row: number }>,
    dryRun: boolean,
    actorId: string,
  ): Promise<ImportSummary> {
    const summary: ImportSummary = { total: rows.length, created: 0, duplicates: 0, errors: [], dryRun };

    for (const row of rows) {
      const rowNumber = row.row ?? summary.errors.length + 1;
      const name = row.name || '(sin nombre)';

      const parsed = createSiteSchema.safeParse({
        name: row.name,
        siteType: row.siteType,
        latitude: row.latitude,
        longitude: row.longitude,
        locality: row.locality,
        municipality: row.municipality,
        province: row.province,
        countryCode: row.countryCode,
        addressLine: row.addressLine,
        phone: row.phone,
        website: row.website,
        accessType: row.accessType,
        ownershipType: row.ownershipType,
        speciesIds: [],
        amenities: row.amenities?.filter((a) => (AMENITY_TYPES as readonly string[]).includes(a)) ?? [],
      });

      if (!parsed.success) {
        summary.errors.push({ row: rowNumber, name, error: parsed.error.issues.map((i) => i.message).join('; ') });
        continue;
      }

      // Detección de duplicados: nombre similar + cercanía.
      const isDuplicate = await this.isDuplicate(row.name, row.latitude, row.longitude);
      if (isDuplicate) {
        summary.duplicates += 1;
        summary.errors.push({ row: rowNumber, name, error: 'Posible duplicado (nombre similar a menos de 500 m)' });
        continue;
      }

      // Resolver species slugs → ids (solo especies conocidas).
      const speciesIds = await this.resolveSpecies(row.species ?? []);

      if (!dryRun) {
        try {
          await this.sites.create(
            {
              name: row.name,
              siteType: parsed.data.siteType,
              latitude: parsed.data.latitude,
              longitude: parsed.data.longitude,
              locality: parsed.data.locality,
              municipality: parsed.data.municipality,
              province: parsed.data.province,
              countryCode: parsed.data.countryCode,
              addressLine: parsed.data.addressLine,
              phone: parsed.data.phone,
              website: parsed.data.website,
              accessType: parsed.data.accessType,
              ownershipType: parsed.data.ownershipType,
              speciesIds,
              amenities: parsed.data.amenities,
              source: 'import',
            },
            actorId,
          );
          summary.created += 1;
        } catch (error) {
          summary.errors.push({ row: rowNumber, name, error: (error as Error).message });
        }
      } else {
        summary.created += 1; // dry-run: la fila es "creable"
      }
    }

    return summary;
  }

  private async isDuplicate(name: string, lat: number, lng: number): Promise<boolean> {
    const rows = await this.prisma.$queryRaw<Array<{ count: number }>>`
      SELECT COUNT(*)::int AS count
      FROM "fishing_sites"
      WHERE "deletedAt" IS NULL
        AND ST_DWithin(
          ST_SetSRID(ST_MakePoint("longitude", "latitude"), 4326)::geography,
          ST_SetSRID(ST_MakePoint(${lng}, ${lat}), 4326)::geography,
          ${DUPLICATE_DISTANCE_METERS}
        )
        AND public.f_unaccent("name") ILIKE ('%' || public.f_unaccent(${name}) || '%');
    `;
    return rows[0]?.count ? rows[0].count > 0 : false;
  }

  private async resolveSpecies(slugs: string[]): Promise<string[]> {
    if (slugs.length === 0) {
      return [];
    }
    const species = await this.prisma.species.findMany({
      where: { slug: { in: slugs }, isActive: true },
      select: { id: true },
    });
    return species.map((s) => s.id);
  }
}
