export interface CoordinateValidationResult {
  valid: boolean;
  error?: string;
}

/** Valida un par de coordenadas (WGS84, EPSG:4326). */
export function validateCoordinates(latitude: number, longitude: number): CoordinateValidationResult {
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
    return { valid: false, error: 'Coordenadas no numéricas' };
  }
  if (latitude < -90 || latitude > 90) {
    return { valid: false, error: `Latitud fuera de rango: ${latitude}` };
  }
  if (longitude < -180 || longitude > 180) {
    return { valid: false, error: `Longitud fuera de rango: ${longitude}` };
  }
  return { valid: true };
}

/** ¿Latitud y longitud son finitas y están en rango? */
export function isValidCoordinate(latitude: number, longitude: number): boolean {
  return validateCoordinates(latitude, longitude).valid;
}
