import { validateCoordinates, isValidCoordinate } from './validate';

describe('validateCoordinates', () => {
  it('acepta coordenadas válidas', () => {
    expect(validateCoordinates(-34.92, -57.95).valid).toBe(true);
    expect(validateCoordinates(0, 0).valid).toBe(true);
    expect(validateCoordinates(90, 180).valid).toBe(true);
    expect(validateCoordinates(-90, -180).valid).toBe(true);
  });

  it('rechaza latitud fuera de rango', () => {
    expect(validateCoordinates(91, 0).valid).toBe(false);
    expect(validateCoordinates(-91, 0).valid).toBe(false);
  });

  it('rechaza longitud fuera de rango', () => {
    expect(validateCoordinates(0, 181).valid).toBe(false);
    expect(validateCoordinates(0, -181).valid).toBe(false);
  });

  it('rechaza valores no finitos', () => {
    expect(validateCoordinates(Number.NaN, 0).valid).toBe(false);
    expect(validateCoordinates(0, Number.POSITIVE_INFINITY).valid).toBe(false);
  });

  it('isValidCoordinate es consistente', () => {
    expect(isValidCoordinate(-34.92, -57.95)).toBe(true);
    expect(isValidCoordinate(999, 0)).toBe(false);
  });
});
