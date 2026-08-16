/**
 * PescaBA — Seed de datos demo.
 *
 * ⚠️ Todos los lugares son FICTICIOS/DEMO: `source = 'demo'`, `is_verified = false`.
 * No representan lugares reales ni datos verificados.
 *
 * Crea:
 * - 10 usuarios demo (roles user/moderator/editor/admin).
 * - 20 especies comunes de Argentina.
 * - Regiones básicas de la Provincia de Buenos Aires.
 * - N lugares demo (por defecto 20) con coordenadas genéricas en PBA.
 */
import { PrismaClient } from '@prisma/client';
import * as argon2 from 'argon2';
import {
  AMENITY_TYPES,
  SITE_TYPES,
  SPECIES_SEED,
  type AmenityType,
  type SiteType,
} from '@pescaba/shared';

const prisma = new PrismaClient();

const DEMO_PASSWORD = 'PescaDemo123!';

/** Puntos de referencia en PBA donde se generan lugares demo (genéricos, no reales). */
const PBA_ANCHORS: Array<{ lat: number; lng: number; label: string }> = [
  { lat: -34.92, lng: -57.95, label: 'La Plata' },
  { lat: -38.0, lng: -57.55, label: 'Mar del Plata' },
  { lat: -35.58, lng: -58.02, label: 'Chascomús' },
  { lat: -38.72, lng: -62.27, label: 'Bahía Blanca' },
  { lat: -33.33, lng: -60.22, label: 'San Nicolás' },
];

function demoUsers(): Array<{ email: string; username: string; role: 'USER' | 'MODERATOR' | 'EDITOR' | 'ADMIN' }> {
  const users = [];
  for (let i = 1; i <= 7; i += 1) {
    users.push({ email: `demo.user${i}@pescaba.dev`, username: `demo_user_${i}`, role: 'USER' });
  }
  users.push({ email: 'demo.moderator@pescaba.dev', username: 'demo_moderator', role: 'MODERATOR' });
  users.push({ email: 'demo.editor@pescaba.dev', username: 'demo_editor', role: 'EDITOR' });
  users.push({ email: 'demo.admin@pescaba.dev', username: 'demo_admin', role: 'ADMIN' });
  return users;
}

function deterministicOffset(index: number, modulus: number): number {
  // Desplazamiento pseudo-aleatorio determinístico basado en el índice.
  return (index * 37 + 11) % modulus;
}

async function seedUsers(): Promise<void> {
  const passwordHash = await argon2.hash(DEMO_PASSWORD);
  for (const u of demoUsers()) {
    await prisma.user.upsert({
      where: { email: u.email },
      update: {},
      create: {
        email: u.email,
        username: u.username,
        passwordHash,
        role: u.role,
        emailVerified: true,
        fullName: u.username.replace(/_/g, ' '),
      },
    });
  }
  console.log(`✓ Usuarios demo (${demoUsers().length}) — password: ${DEMO_PASSWORD}`);
}

async function seedSpecies(): Promise<void> {
  for (const s of SPECIES_SEED) {
    await prisma.species.upsert({
      where: { slug: s.slug },
      update: { commonNameEs: s.commonNameEs, commonNameEn: s.commonNameEn, scientificName: s.scientificName, category: s.category },
      create: {
        slug: s.slug,
        commonNameEs: s.commonNameEs,
        commonNameEn: s.commonNameEn,
        scientificName: s.scientificName,
        category: s.category,
      },
    });
  }
  console.log(`✓ Especies (${SPECIES_SEED.length})`);
}

async function seedRegions(): Promise<void> {
  const regions = [
    { countryCode: 'ar', adminLevel1: 'Buenos Aires', name: 'Buenos Aires', slug: 'buenos-aires' },
    { countryCode: 'ar', adminLevel1: 'Buenos Aires', adminLevel2: 'La Plata', name: 'La Plata', slug: 'la-plata' },
    { countryCode: 'ar', adminLevel1: 'Buenos Aires', adminLevel2: 'General Pueyrredón', name: 'General Pueyrredón', slug: 'general-pueyrredon' },
    { countryCode: 'ar', adminLevel1: 'Buenos Aires', adminLevel2: 'Chascomús', name: 'Chascomús', slug: 'chascomus' },
    { countryCode: 'ar', adminLevel1: 'Buenos Aires', adminLevel2: 'Bahía Blanca', name: 'Bahía Blanca', slug: 'bahia-blanca' },
  ];
  for (const r of regions) {
    await prisma.region.upsert({
      where: { countryCode_slug: { countryCode: r.countryCode, slug: r.slug } },
      update: { name: r.name, adminLevel1: r.adminLevel1, adminLevel2: r.adminLevel2 },
      create: r,
    });
  }
  console.log(`✓ Regiones (${regions.length})`);
}

async function seedDemoSites(count: number): Promise<void> {
  // Limpia lugares demo previos para hacer el seed idempotente.
  await prisma.fishingSiteSpecies.deleteMany({ where: { site: { source: 'demo' } } });
  await prisma.siteAmenity.deleteMany({ where: { site: { source: 'demo' } } });
  await prisma.fishingSite.deleteMany({ where: { source: 'demo' } });

  const species = await prisma.species.findMany({ select: { id: true, slug: true } });
  const speciesBySlug = new Map(species.map((s) => [s.slug, s.id]));

  for (let i = 1; i <= count; i += 1) {
    const anchor = PBA_ANCHORS[i % PBA_ANCHORS.length];
    const siteType = SITE_TYPES[i % SITE_TYPES.length] as SiteType;
    const name = `${siteTypeLabel(siteType)} Demo ${i} (${anchor.label})`;
    const slug = `lugar-demo-${i}`;

    const lat = anchor.lat + (deterministicOffset(i, 100) - 50) / 1000;
    const lng = anchor.lng + (deterministicOffset(i, 90) - 45) / 1000;

    // Especies y amenities pseudo-aleatorias determinísticas (sin duplicados por sitio).
    const siteSpecies = Array.from(
      new Set([
        speciesBySlug.get(SPECIES_SEED[i % SPECIES_SEED.length].slug),
        speciesBySlug.get(SPECIES_SEED[(i * 3) % SPECIES_SEED.length].slug),
      ]),
    ).filter((id): id is string => Boolean(id));

    const amenityCount = 2 + (i % 3);
    const amenities: AmenityType[] = [];
    for (let a = 0; a < amenityCount; a += 1) {
      amenities.push(AMENITY_TYPES[(i + a * 5) % AMENITY_TYPES.length]);
    }

    await prisma.fishingSite.create({
      data: {
        slug,
        name,
        siteType,
        latitude: lat,
        longitude: lng,
        descriptionShort: `Lugar de pesca DEMO y ficticio cerca de ${anchor.label}. Este dato no es real.`,
        descriptionLong:
          'Dato de demostración generado por el seed. No corresponde a un lugar real verificado. ' +
          'Usado para probar la aplicación: búsqueda cercana, filtros y fichas.',
        locality: `${anchor.label} (demo)`,
        municipality: anchor.label,
        province: 'Buenos Aires',
        region: 'Buenos Aires',
        countryCode: 'ar',
        isPublic: true,
        isVerified: false,
        isActive: true,
        accessType: i % 2 === 0 ? 'public' : 'free',
        ownershipType: 'public',
        allowsBoats: i % 3 === 0,
        allowsNightFishing: i % 4 === 0,
        allowsCamping: i % 5 === 0,
        source: 'demo',
        bestSeason: i % 2 === 0 ? 'primavera-otoño' : 'todo el año',
        species: { create: siteSpecies.map((speciesId) => ({ speciesId })) },
        amenities: {
          create: amenities.map((amenityType) => ({ amenityType, isAvailable: true })),
        },
      },
    });
  }
  console.log(`✓ Lugares demo (${count}) — todos FICTICIOS, source=demo`);
}

function siteTypeLabel(type: SiteType): string {
  const labels: Record<string, string> = {
    beach: 'Playa',
    lagoon: 'Laguna',
    lake: 'Lago',
    river: 'Río',
    stream: 'Arroyo',
    pier: 'Muelle',
    jetty: 'Espigón',
    harbor: 'Puerto',
    club: 'Club',
    boat_launch: 'Bajada',
    public_access: 'Acceso público',
    dam: 'Represa',
    wetland: 'Humedal',
  };
  return labels[type] ?? 'Lugar';
}

async function main(): Promise<void> {
  console.log('🌱 PescaBA — seed de datos demo');
  await seedUsers();
  await seedSpecies();
  await seedRegions();
  const count = Number(process.env['SEED_DEMO_SITES'] ?? '20');
  await seedDemoSites(count);
  console.log('✅ Seed completado');
}

main()
  .catch((error) => {
    console.error('❌ Error en el seed:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
