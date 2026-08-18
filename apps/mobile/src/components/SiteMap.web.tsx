import { StyleSheet, Text, View } from 'react-native';
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

/**
 * Placeholder web para el mapa.
 * react-native-maps es un módulo nativo (ADR-004): en web se muestra un resumen
 * hasta migrar a MapLibre con dev client. Mantiene la app utilizable en el navegador.
 */
export function SiteMap({ latitude, longitude, markers = [], style }: SiteMapProps) {
  return (
    <View style={[styles.container, style]}>
      <Text style={styles.emoji}>🗺️</Text>
      <Text style={styles.text}>
        {markers.length > 0 ? `Mapa disponible en la app (${markers.length} ${markers.length === 1 ? 'lugar' : 'lugares'})` : 'Mapa disponible en la app'}
      </Text>
      <Text style={styles.coords}>
        {latitude.toFixed(4)}, {longitude.toFixed(4)}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { alignItems: 'center', justifyContent: 'center', gap: 6, backgroundColor: '#e9edf2' },
  emoji: { fontSize: 32 },
  text: { color: '#0f766e', fontWeight: '600', textAlign: 'center', paddingHorizontal: 12 },
  coords: { color: '#6b7480', fontSize: 12 },
});
