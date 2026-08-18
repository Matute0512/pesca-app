import MapView, { Marker } from 'react-native-maps';
import type { StyleProp, ViewStyle } from 'react-native';

export interface SiteMapMarker {
  latitude: number;
  longitude: number;
  title?: string;
}

export interface SiteMapProps {
  latitude: number;
  longitude: number;
  latitudeDelta: number;
  longitudeDelta: number;
  markers?: SiteMapMarker[];
  style?: StyleProp<ViewStyle>;
}

/** Mapa nativo (react-native-maps) para iOS/Android. */
export function SiteMap({
  latitude,
  longitude,
  latitudeDelta,
  longitudeDelta,
  markers = [],
  style,
}: SiteMapProps) {
  return (
    <MapView
      style={style}
      initialRegion={{ latitude, longitude, latitudeDelta, longitudeDelta }}
    >
      {markers.map((m) => (
        <Marker
          key={`${m.latitude}-${m.longitude}-${m.title ?? ''}`}
          coordinate={{ latitude: m.latitude, longitude: m.longitude }}
          title={m.title}
        />
      ))}
    </MapView>
  );
}
