import { Injectable } from '@nestjs/common';
import {
  AMENITY_TYPES,
  AMENITY_TYPE_LABELS,
  COUNTRIES_SEED,
  SITE_TYPES,
  SITE_TYPE_LABELS,
} from '@pescaba/shared';
import { PrismaService } from '../prisma/prisma.service';

/** Catálogos de metadata (especies, tipos, servicios, regiones, países). */
@Injectable()
export class MetadataService {
  constructor(private readonly prisma: PrismaService) {}

  async species() {
    return this.prisma.species.findMany({
      where: { isActive: true },
      orderBy: { commonNameEs: 'asc' },
      select: {
        id: true,
        slug: true,
        commonNameEs: true,
        commonNameEn: true,
        scientificName: true,
        category: true,
      },
    });
  }

  siteTypes() {
    return SITE_TYPES.map((value) => ({
      value,
      labelEs: SITE_TYPE_LABELS[value].es,
      labelEn: SITE_TYPE_LABELS[value].en,
    }));
  }

  amenities() {
    return AMENITY_TYPES.map((value) => ({
      value,
      labelEs: AMENITY_TYPE_LABELS[value].es,
      labelEn: AMENITY_TYPE_LABELS[value].en,
    }));
  }

  async regions() {
    return this.prisma.region.findMany({
      where: { isActive: true },
      orderBy: { name: 'asc' },
      select: {
        id: true,
        countryCode: true,
        adminLevel1: true,
        adminLevel2: true,
        adminLevel3: true,
        name: true,
        slug: true,
      },
    });
  }

  countries() {
    return COUNTRIES_SEED;
  }
}
