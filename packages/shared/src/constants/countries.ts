/** Países iniciales (ISO 3166-1 alpha-2). */
export interface CountryInfo {
  code: string;
  nameEs: string;
  nameEn: string;
}

export const COUNTRIES_SEED: CountryInfo[] = [
  { code: 'ar', nameEs: 'Argentina', nameEn: 'Argentina' },
  { code: 'uy', nameEs: 'Uruguay', nameEn: 'Uruguay' },
  { code: 'br', nameEs: 'Brasil', nameEn: 'Brazil' },
  { code: 'cl', nameEs: 'Chile', nameEn: 'Chile' },
  { code: 'py', nameEs: 'Paraguay', nameEn: 'Paraguay' },
  { code: 'bo', nameEs: 'Bolivia', nameEn: 'Bolivia' },
  { code: 'us', nameEs: 'Estados Unidos', nameEn: 'United States' },
  { code: 'es', nameEs: 'España', nameEn: 'Spain' },
  { code: 'mx', nameEs: 'México', nameEn: 'Mexico' },
];
