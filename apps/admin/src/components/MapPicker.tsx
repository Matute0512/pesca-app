import { useCallback } from 'react';
import Map, { Marker } from 'react-map-gl/maplibre';
import 'maplibre-gl/dist/maplibre-gl.css';

/**
 * Selector de coordenadas sobre un mapa MapLibre (OSM demo tiles, sin token).
 * Al hacer clic sobre el mapa actualiza lat/lng.
 */
export function MapPicker({
  latitude,
  longitude,
  onChange,
  height = 320,
}: {
  latitude: number;
  longitude: number;
  onChange: (lat: number, lng: number) => void;
  height?: number;
}) {
  const handleClick = useCallback(
    (event: { lngLat: { lat: number; lng: number } }) => {
      onChange(Number(event.lngLat.lat.toFixed(6)), Number(event.lngLat.lng.toFixed(6)));
    },
    [onChange],
  );

  return (
    <div style={{ height, borderRadius: 8, overflow: 'hidden' }}>
      <Map
        mapStyle="https://demotiles.maplibre.org/style.json"
        initialViewState={{
          latitude: latitude || -34.92,
          longitude: longitude || -57.95,
          zoom: 9,
        }}
        onClick={handleClick}
      >
        {latitude && longitude && <Marker latitude={latitude} longitude={longitude} />}
      </Map>
    </div>
  );
}
