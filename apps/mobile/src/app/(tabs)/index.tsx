import { useCallback, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import * as Location from 'expo-location';
import MapView, { Marker } from 'react-native-maps';
import { useTranslation } from 'react-i18next';
import type { SiteSummary } from '@pescaba/shared';
import { SUGGESTED_RADII_METERS } from '@pescaba/geo';
import { api } from '@/lib/api';
import { useFiltersStore } from '@/store/filters';
import { SiteList } from '@/components/SiteList';
import { EmptyState } from '@/components/EmptyState';

export default function HomeScreen() {
  const { t } = useTranslation();
  const { lat, lng, radiusMeters, setLocation, setRadius } = useFiltersStore();
  const [mode, setMode] = useState<'list' | 'map'>('list');
  const [, setLocating] = useState(false);

  const hasLocation = lat != null && lng != null;

  const enableLocation = useCallback(async () => {
    setLocating(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        return;
      }
      const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      setLocation(pos.coords.latitude, pos.coords.longitude);
    } finally {
      setLocating(false);
    }
  }, [setLocation]);

  const { data: sites, isLoading, refetch, isError } = useQuery({
    queryKey: ['nearby', lat, lng, radiusMeters],
    queryFn: () =>
      api.get<SiteSummary[]>('/sites/nearby', { lat: lat!, lng: lng!, radiusMeters }),
    enabled: hasLocation,
  });

  return (
    <View style={styles.container}>
      <View style={styles.toolbar}>
        <View style={styles.modeSwitch}>
          {(['list', 'map'] as const).map((m) => (
            <Pressable
              key={m}
              style={[styles.modeBtn, mode === m && styles.modeBtnActive]}
              onPress={() => setMode(m)}
            >
              <Text style={[styles.modeText, mode === m && styles.modeTextActive]}>{t(`home.${m}`)}</Text>
            </Pressable>
          ))}
        </View>

        {hasLocation && (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.radii}>
            {SUGGESTED_RADII_METERS.map((r) => (
              <Pressable
                key={r}
                style={[styles.radiusChip, radiusMeters === r && styles.radiusChipActive]}
                onPress={() => setRadius(r)}
              >
                <Text style={radiusMeters === r ? styles.radiusTextActive : undefined}>
                  {r >= 1000 ? `${r / 1000} km` : `${r} m`}
                </Text>
              </Pressable>
            ))}
          </ScrollView>
        )}
      </View>

      {!hasLocation ? (
        <EmptyState
          message={t('home.noLocation')}
          onRetry={() => void enableLocation()}
        />
      ) : mode === 'list' ? (
        <SiteList
          sites={sites ?? []}
          onRetry={() => void refetch()}
          emptyMessage={t('home.empty')}
        />
      ) : (
        <MapView
          style={styles.map}
          initialRegion={{
            latitude: lat!,
            longitude: lng!,
            latitudeDelta: 0.15,
            longitudeDelta: 0.15,
          }}
        >
          {(sites ?? []).map((site) => (
            <Marker
              key={site.id}
              coordinate={{ latitude: site.latitude, longitude: site.longitude }}
              title={site.name}
            />
          ))}
        </MapView>
      )}

      {isLoading && <Text style={styles.hint}>{t('common.loading')}</Text>}
      {isError && hasLocation && <Text style={styles.error}>{t('common.error')}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f6f7f9' },
  toolbar: { padding: 10, gap: 8 },
  modeSwitch: { flexDirection: 'row', backgroundColor: '#e9edf2', borderRadius: 10, overflow: 'hidden' },
  modeBtn: { flex: 1, paddingVertical: 8, alignItems: 'center' },
  modeBtnActive: { backgroundColor: '#0f766e' },
  modeText: { color: '#6b7480', fontWeight: '600' },
  modeTextActive: { color: '#fff' },
  radii: { flexGrow: 0 },
  radiusChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#fff',
    borderRadius: 999,
    marginRight: 6,
    borderWidth: 1,
    borderColor: '#e2e6ec',
  },
  radiusChipActive: { backgroundColor: '#0f766e', borderColor: '#0f766e' },
  radiusTextActive: { color: '#fff', fontWeight: '600' },
  map: { flex: 1 },
  hint: { textAlign: 'center', padding: 8, color: '#6b7480' },
  error: { textAlign: 'center', padding: 8, color: '#b91c1c' },
});
