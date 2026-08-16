/** Convierte una duración tipo "15m", "30d", "1h" a segundos. */
export function parseDurationToSeconds(duration: string): number {
  const match = /^(\d+)(s|m|h|d)$/.exec(duration.trim());
  if (!match) {
    throw new Error(`Duración inválida: ${duration}`);
  }
  const value = Number.parseInt(match[1], 10);
  switch (match[2]) {
    case 's':
      return value;
    case 'm':
      return value * 60;
    case 'h':
      return value * 3600;
    case 'd':
      return value * 86400;
    default:
      throw new Error(`Duración inválida: ${duration}`);
  }
}
