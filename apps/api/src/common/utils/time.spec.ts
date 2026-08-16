import { parseDurationToSeconds } from './time';

describe('parseDurationToSeconds', () => {
  it('parsea unidades simples', () => {
    expect(parseDurationToSeconds('15m')).toBe(900);
    expect(parseDurationToSeconds('1h')).toBe(3600);
    expect(parseDurationToSeconds('30d')).toBe(2_592_000);
    expect(parseDurationToSeconds('45s')).toBe(45);
  });

  it('lanza error con duraciones inválidas', () => {
    expect(() => parseDurationToSeconds('abc')).toThrow();
    expect(() => parseDurationToSeconds('10')).toThrow();
    expect(() => parseDurationToSeconds('-5m')).toThrow();
  });
});
