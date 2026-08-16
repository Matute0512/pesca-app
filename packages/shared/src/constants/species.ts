/**
 * Categorías de especies (según interés de pesca).
 */
export const SPECIES_CATEGORIES = ['baitfish', 'sport', 'predator', 'commercial'] as const;

export type SpeciesCategory = (typeof SPECIES_CATEGORIES)[number];

export const SPECIES_CATEGORY_LABELS: Record<SpeciesCategory, { es: string; en: string }> = {
  baitfish: { es: 'Carnada', en: 'Baitfish' },
  sport: { es: 'Deportiva', en: 'Sport' },
  predator: { es: 'Predadora', en: 'Predator' },
  commercial: { es: 'Comercial', en: 'Commercial' },
};

/**
 * Catálogo base de especies comunes de Argentina (seed).
 * Cada entrada: slug único, nombre común en español/inglés y nombre científico.
 */
export interface SpeciesSeed {
  slug: string;
  commonNameEs: string;
  commonNameEn: string;
  scientificName: string;
  category: SpeciesCategory;
}

export const SPECIES_SEED: SpeciesSeed[] = [
  { slug: 'pejerrey', commonNameEs: 'Pejerrey', commonNameEn: 'Silverside', scientificName: 'Odontesthes bonariensis', category: 'sport' },
  { slug: 'corvina-rubia', commonNameEs: 'Corvina rubia', commonNameEn: 'Striped croaker', scientificName: 'Micropogonias furnieri', category: 'sport' },
  { slug: 'corvina-negra', commonNameEs: 'Corvina negra', commonNameEn: 'Black drum', scientificName: 'Pogonias courbina', category: 'sport' },
  { slug: 'lisa', commonNameEs: 'Lisa', commonNameEn: 'Mullet', scientificName: 'Mugil liza', category: 'sport' },
  { slug: 'bagre-rio', commonNameEs: 'Bagre de río', commonNameEn: 'River catfish', scientificName: 'Pimelodus maculatus', category: 'sport' },
  { slug: 'carpa', commonNameEs: 'Carpa', commonNameEn: 'Carp', scientificName: 'Cyprinus carpio', category: 'sport' },
  { slug: 'tararira', commonNameEs: 'Tararira', commonNameEn: 'Wolf fish', scientificName: 'Hoplias argentinensis', category: 'predator' },
  { slug: 'dientudo', commonNameEs: 'Dientudo', commonNameEn: 'Freshwater dogfish', scientificName: 'Oligosarcus jenynsii', category: 'sport' },
  { slug: 'boga', commonNameEs: 'Boga', commonNameEn: 'Boga', scientificName: 'Leporinus obtusidens', category: 'sport' },
  { slug: 'dorado', commonNameEs: 'Dorado', commonNameEn: 'Golden dorado', scientificName: 'Salminus brasiliensis', category: 'sport' },
  { slug: 'lenguado', commonNameEs: 'Lenguado', commonNameEn: 'Flatfish', scientificName: 'Paralichthys orbignyanus', category: 'sport' },
  { slug: 'pescadilla', commonNameEs: 'Pescadilla', commonNameEn: 'Striped weakfish', scientificName: 'Cynoscion guatucupa', category: 'sport' },
  { slug: 'besugo', commonNameEs: 'Besugo', commonNameEn: 'Red porgy', scientificName: 'Pagrus pagrus', category: 'sport' },
  { slug: 'sabalo', commonNameEs: 'Sábalo', commonNameEn: 'Sabalo', scientificName: 'Prochilodus lineatus', category: 'commercial' },
  { slug: 'mojarra', commonNameEs: 'Mojarra', commonNameEn: 'Mojarra', scientificName: 'Astyanax spp.', category: 'baitfish' },
  { slug: 'palometa', commonNameEs: 'Palometa', commonNameEn: 'Piranha', scientificName: 'Serrasalmus maculatus', category: 'sport' },
  { slug: 'surubi', commonNameEs: 'Surubí', commonNameEn: 'Spoited sorubim', scientificName: 'Pseudoplatystoma corruscans', category: 'sport' },
  { slug: 'pati', commonNameEs: 'Patí', commonNameEn: 'Patí', scientificName: 'Luciopimelodus pati', category: 'sport' },
  { slug: 'mandure', commonNameEs: 'Manduré', commonNameEn: 'Manduré', scientificName: 'Ageneiosus inermis', category: 'sport' },
  { slug: 'trucha', commonNameEs: 'Trucha', commonNameEn: 'Trout', scientificName: 'Salmo trutta / Oncorhynchus mykiss', category: 'sport' },
];

export const SPECIES_SLUGS = SPECIES_SEED.map((s) => s.slug);
