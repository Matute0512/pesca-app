export type DistanceUnit = 'metric' | 'imperial';

/** Formatea una distancia en metros a una cadena legible. */
export function formatDistance(meters: number, unit: DistanceUnit = 'metric', lang = 'es'): string {
  const safe = Math.max(0, meters);
  if (unit === 'imperial') {
    const feet = safe * 3.28084;
    if (feet < 528) {
      return `${Math.round(feet)} ft`;
    }
    return `${(feet / 5280).toFixed(1)} mi`;
  }
  if (safe < 1000) {
    return `${Math.round(safe)} m`;
  }
  return `${(safe / 1000).toFixed(lang === 'es' ? 1 : 1).replace('.', ',')} km`;
}

/** Formatea lat/lng decimales a cadena (5 decimales ≈ 1 m de precisión). */
export function formatCoordinates(latitude: number, longitude: number): string {
  return `${latitude.toFixed(5)}, ${longitude.toFixed(5)}`;
}

/** Convierte decimales a grados/minutos/segundos con hemisferio. */
export function toDMS(latitude: number, longitude: number): { lat: string; lng: string } {
  const dms = (value: number, pos: string, neg: string): string => {
    const abs = Math.abs(value);
    const degrees = Math.floor(abs);
    const minutesFloat = (abs - degrees) * 60;
    const minutes = Math.floor(minutesFloat);
    const seconds = ((minutesFloat - minutes) * 60).toFixed(1);
    const hemi = value >= 0 ? pos : neg;
    return `${degrees}° ${minutes}' ${seconds}" ${hemi}`;
  };
  return { lat: dms(latitude, 'N', 'S'), lng: dms(longitude, 'E', 'O') };
}
