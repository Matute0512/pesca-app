import { nearbyQuerySchema, latitudeSchema } from './geo';
import { createSuggestionSchema } from './suggestions';

describe('nearbyQuerySchema', () => {
  it('parsea lat/lng/radius', () => {
    const result = nearbyQuerySchema.parse({ lat: '-34.92', lng: '-57.95', radiusMeters: '10000' });
    expect(result.lat).toBeCloseTo(-34.92);
    expect(result.lng).toBeCloseTo(-57.95);
    expect(result.radiusMeters).toBe(10_000);
  });

  it('aplica el radio por defecto de 10 km', () => {
    const result = nearbyQuerySchema.parse({ lat: -34.92, lng: -57.95 });
    expect(result.radiusMeters).toBe(10_000);
  });

  it('rechaza latitud inválida y radio fuera de rango', () => {
    expect(() => nearbyQuerySchema.parse({ lat: 120, lng: 0, radiusMeters: 500 })).toThrow();
    expect(() => nearbyQuerySchema.parse({ lat: 0, lng: 0, radiusMeters: 1 })).toThrow();
    expect(() => nearbyQuerySchema.parse({ lat: 0, lng: 0, radiusMeters: 999_999 })).toThrow();
  });
});

describe('latitudeSchema', () => {
  it('convierte strings a número', () => {
    expect(latitudeSchema.parse('10.5')).toBe(10.5);
  });
});

describe('createSuggestionSchema', () => {
  it('requiere declarar que la información es correcta', () => {
    const base = {
      name: 'Laguna Demo',
      siteType: 'lagoon',
      latitude: -34.92,
      longitude: -57.95,
    };
    expect(() => createSuggestionSchema.parse(base)).toThrow();
    expect(() =>
      createSuggestionSchema.parse({ ...base, infoAccurate: true }),
    ).not.toThrow();
  });

  it('rechaza tipos de lugar inexistentes', () => {
    expect(() =>
      createSuggestionSchema.parse({
        name: 'X',
        siteType: 'volcan',
        latitude: 0,
        longitude: 0,
        infoAccurate: true,
      }),
    ).toThrow();
  });
});
