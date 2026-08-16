import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import type { SiteSummary } from '@pescaba/shared';
import { formatDistance } from '@pescaba/geo';
import { useTranslation } from 'react-i18next';

export function SiteCard({ site }: { site: SiteSummary }) {
  const router = useRouter();
  const { t } = useTranslation();

  return (
    <Pressable
      style={({ pressed }) => [styles.card, pressed && styles.pressed]}
      onPress={() => router.push(`/site/${site.id}`)}
      accessibilityRole="button"
      accessibilityLabel={`${site.name}`}
    >
      <View style={styles.header}>
        <Text style={styles.name} numberOfLines={1}>
          {site.name}
        </Text>
        {site.isVerified && <Text style={styles.badge}>✓</Text>}
      </View>
      <Text style={styles.meta}>
        {site.siteType}
        {site.locality ? ` · ${site.locality}` : ''}
      </Text>
      {site.distanceMeters != null && (
        <Text style={styles.distance}>{formatDistance(site.distanceMeters, 'metric')}</Text>
      )}
      <Text style={styles.species}>
        {site.speciesSlugs.slice(0, 4).join(' · ') || t('common.search')}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#e2e6ec',
  },
  pressed: { opacity: 0.7 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  name: { fontSize: 16, fontWeight: '700', flex: 1 },
  badge: { color: '#15803d', fontWeight: '800' },
  meta: { fontSize: 13, color: '#6b7480', marginTop: 2 },
  distance: { fontSize: 13, fontWeight: '600', color: '#0f766e', marginTop: 4 },
  species: { fontSize: 12, color: '#6b7480', marginTop: 4 },
});
