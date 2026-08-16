import { EARTH_RADIUS_METERS } from './constants';

const toRadians = (degrees: number): number => (degrees * Math.PI) / 180;

/**
 * Distancia en metros entre dos puntos usando la fórmula de haversine.
 * Usada como fallback en el cliente y en tests; en producción la distancia
 * la calcula PostGIS (ST_Distance sobre geography).
 */
export function haversineDistanceMeters(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number,
): number {
  const dLat = toRadians(lat2 - lat1);
  const dLng = toRadians(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) * Math.sin(dLng / 2) ** 2;
  return 2 * EARTH_RADIUS_METERS * Math.asin(Math.sqrt(a));
}

/** ¿Está el punto dentro del radio (metros) alrededor del centro? */
export function isPointInRadius(
  lat: number,
  lng: number,
  centerLat: number,
  centerLng: number,
  radiusMeters: number,
): boolean {
  return haversineDistanceMeters(lat, lng, centerLat, centerLng) <= radiusMeters;
}

/**
 * Aproximación de kilómetros a grados de latitud.
 * Útil para pre-filtrar en el cliente sin la base de datos.
 */
export function kmToLatDegrees(km: number): number {
  return km / 111.32;
}

/**
 * Aproximación de kilómetros a grados de longitud a una latitud dada.
 */
export function kmToLngDegrees(km: number, latitude: number): number {
  const latRad = toRadians(latitude);
  const latDegPerKm = 1 / 111.32;
  return km / (latDegPerKm * EARTH_RADIUS_METERS * Math.cos(latRad) * (Math.PI / 180));
}

/** Rango de búsqueda aproximado (bounding box) para un radio dado. */
export function boundingBox(
  centerLat: number,
  centerLng: number,
  radiusMeters: number,
): { minLat: number; maxLat: number; minLng: number; maxLng: number } {
  const km = radiusMeters / 1000;
  const dLat = kmToLatDegrees(km);
  const dLng = kmToLngDegrees(km, centerLat);
  return {
    minLat: centerLat - dLat,
    maxLat: centerLat + dLat,
    minLng: centerLng - dLng,
    maxLng: centerLng + dLng,
  };
}
