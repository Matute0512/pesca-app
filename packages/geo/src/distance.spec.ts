import { haversineDistanceMeters, isPointInRadius, boundingBox } from './distance';

describe('haversineDistanceMeters', () => {
  it('devuelve 0 para el mismo punto', () => {
    expect(haversineDistanceMeters(-34.92, -57.95, -34.92, -57.95)).toBe(0);
  });

  it('aproxima la distancia Buenos Aires → La Plata (~52 km)', () => {
    const distance = haversineDistanceMeters(-34.6037, -58.3816, -34.9215, -57.9545);
    expect(distance).toBeGreaterThan(45_000);
    expect(distance).toBeLessThan(60_000);
  });

  it('es simétrica', () => {
    const a = haversineDistanceMeters(0, 0, 10, 10);
    const b = haversineDistanceMeters(10, 10, 0, 0);
    expect(a).toBeCloseTo(b, 5);
  });
});

describe('isPointInRadius', () => {
  it('incluye puntos dentro del radio y excluye los de afuera', () => {
    // ~0,9 km al sur de La Plata.
    expect(isPointInRadius(-34.93, -57.95, -34.92, -57.95, 2_000)).toBe(true);
    // ~55 km: fuera de un radio de 10 km.
    expect(isPointInRadius(-35.4, -57.95, -34.92, -57.95, 10_000)).toBe(false);
  });
});

describe('boundingBox', () => {
  it('genera un bbox centrado', () => {
    const box = boundingBox(0, 0, 100_000);
    expect(box.minLat).toBeLessThan(0);
    expect(box.maxLat).toBeGreaterThan(0);
    expect(box.minLng).toBeLessThan(0);
    expect(box.maxLng).toBeGreaterThan(0);
    expect(box.maxLat - box.minLat).toBeGreaterThan(box.maxLng - box.minLng); // lat es más "ancha"
  });
});
