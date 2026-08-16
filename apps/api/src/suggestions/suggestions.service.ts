import { Injectable } from '@nestjs/common';
import type { SiteType } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

export interface CreateSuggestionInput {
  name: string;
  siteType: SiteType;
  latitude: number;
  longitude: number;
  addressLine?: string | null;
  locality?: string | null;
  municipality?: string | null;
  province?: string | null;
  countryCode?: string;
  phone?: string | null;
  website?: string | null;
  description?: string | null;
  accessNotes?: string | null;
  amenities?: string[];
  speciesSlugs?: string[];
}

@Injectable()
export class SuggestionsService {
  constructor(private readonly prisma: PrismaService) {}

  /** Crea una sugerencia de nuevo lugar. Queda pendiente de moderación. */
  async create(input: CreateSuggestionInput, userId?: string) {
    return this.prisma.siteSuggestion.create({
      data: {
        userId,
        name: input.name.trim(),
        siteType: input.siteType,
        latitude: input.latitude,
        longitude: input.longitude,
        addressLine: input.addressLine,
        locality: input.locality,
        municipality: input.municipality,
        province: input.province,
        countryCode: input.countryCode ?? 'ar',
        phone: input.phone,
        website: input.website,
        description: input.description,
        accessNotes: input.accessNotes,
        amenities: input.amenities ?? [],
        speciesSlugs: input.speciesSlugs ?? [],
        source: 'user_suggestion',
        status: 'pending',
      },
    });
  }
}
