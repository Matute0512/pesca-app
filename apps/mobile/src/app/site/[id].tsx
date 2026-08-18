import { ScrollView, StyleSheet, Text, View, Pressable, Linking, Share } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { formatCoordinates } from '@pescaba/geo';
import type { SiteDetail } from '@pescaba/shared';
import { api } from '@/lib/api';
import { useAuthStore } from '@/store/auth';
import { SiteMap } from '@/components/SiteMap';

export default function SiteDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { t } = useTranslation();
  const router = useRouter();
  const queryClient = useQueryClient();
  const status = useAuthStore((s) => s.status);

  const { data: site, isLoading } = useQuery({
    queryKey: ['site', id],
    queryFn: () => api.get<SiteDetail>(`/sites/${id}`),
  });

  const favorite = useMutation({
    mutationFn: () => api.post(`/favorites/${id}`, { listName: 'favorites' }),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ['site', id] }),
  });

  if (isLoading || !site) {
    return <Text style={styles.hint}>{t('common.loading')}</Text>;
  }

  // Alias no-null: `site` ya fue verificado por el guard anterior.
  const s = site;

  async function call() {
    if (s.phone) {
      await Linking.openURL(`tel:${s.phone.replace(/\s/g, '')}`);
    }
  }

  async function share() {
    await Share.share({
      message: `${s.name}\n${formatCoordinates(s.latitude, s.longitude)}\n${s.locality ?? ''}`,
    });
  }

  async function directions() {
    await Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${s.latitude},${s.longitude}`);
  }

  async function addFavorite() {
    if (status !== 'authenticated') {
      router.push('/login');
      return;
    }
    favorite.mutate();
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.name}>
        {s.name} {s.isVerified ? '✓' : ''}
      </Text>
      <Text style={styles.type}>{s.siteType}</Text>
      <Text style={styles.status}>
        {s.isVerified ? t('detail.verified') : t('detail.notVerified')}
      </Text>

      <SiteMap
        style={styles.map}
        latitude={s.latitude}
        longitude={s.longitude}
        latitudeDelta={0.05}
        longitudeDelta={0.05}
        markers={[{ latitude: s.latitude, longitude: s.longitude, title: s.name }]}
      />

      <Text style={styles.coords}>{formatCoordinates(s.latitude, s.longitude)}</Text>

      <View style={styles.actions}>
        <Pressable style={styles.btn} onPress={() => void directions()}>
          <Text style={styles.btnText}>{t('detail.howToGet')}</Text>
        </Pressable>
        {s.phone && (
          <Pressable style={styles.btn} onPress={() => void call()}>
            <Text style={styles.btnText}>{t('detail.call')}</Text>
          </Pressable>
        )}
        <Pressable style={styles.btn} onPress={() => void share()}>
          <Text style={styles.btnText}>{t('detail.share')}</Text>
        </Pressable>
      </View>

      <View style={styles.actions}>
        <Pressable
          style={[styles.btn, styles.btnPrimary]}
          onPress={() => void addFavorite()}
        >
          <Text style={[styles.btnText, styles.btnTextPrimary]}>
            {s.isFavorite ? t('detail.favorited') : t('detail.favorite')}
          </Text>
        </Pressable>
        <Pressable style={styles.btn} onPress={() => router.push(`/report/${s.id}`)}>
          <Text style={styles.btnText}>{t('detail.report')}</Text>
        </Pressable>
      </View>

      {s.descriptionLong && <Text style={styles.body}>{s.descriptionLong}</Text>}

      {s.addressLine && <DetailRow label="Dirección" value={s.addressLine} />}
      {(s.locality || s.municipality || s.province) && (
        <DetailRow
          label="Ubicación"
          value={[s.locality, s.municipality, s.province].filter(Boolean).join(', ')}
        />
      )}
      {s.phone && <DetailRow label="Teléfono" value={s.phone} />}
      {s.whatsapp && <DetailRow label="WhatsApp" value={s.whatsapp} />}
      {s.website && <DetailRow label="Web" value={s.website} />}
      {s.openingHours && <DetailRow label={t('detail.opening')} value={s.openingHours} />}
      {s.entryFee && <DetailRow label={t('detail.price')} value={s.entryFee} />}
      {s.bestSeason && <DetailRow label={t('detail.season')} value={s.bestSeason} />}

      {s.amenities.length > 0 && (
        <>
          <Text style={styles.sectionTitle}>{t('detail.services')}</Text>
          <View style={styles.chips}>
            {s.amenities.map((a) => (
              <Text key={a} style={styles.chip}>
                {a}
              </Text>
            ))}
          </View>
        </>
      )}

      {s.species.length > 0 && (
        <>
          <Text style={styles.sectionTitle}>{t('detail.species')}</Text>
          <View style={styles.chips}>
            {s.species.map((sp) => (
              <Text key={sp.speciesSlug} style={styles.chip}>
                {sp.commonNameEs}
              </Text>
            ))}
          </View>
        </>
      )}

      <Text style={styles.footer}>
        {t('detail.lastUpdated')}: {new Date(s.updatedAt).toLocaleDateString('es-AR')}
      </Text>
      <Text style={styles.footer}>{t('home.demoWarning')}</Text>
    </ScrollView>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={styles.rowValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f6f7f9' },
  content: { padding: 16, gap: 8 },
  name: { fontSize: 24, fontWeight: '800' },
  type: { fontSize: 14, color: '#0f766e', textTransform: 'uppercase', fontWeight: '700' },
  status: { fontSize: 13, color: '#15803d' },
  map: { height: 180, borderRadius: 12, marginVertical: 8 },
  coords: { fontSize: 13, color: '#6b7480', textAlign: 'center' },
  actions: { flexDirection: 'row', gap: 8, marginTop: 4 },
  btn: {
    flex: 1,
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#cbd5e1',
    backgroundColor: '#fff',
    alignItems: 'center',
  },
  btnPrimary: { backgroundColor: '#0f766e', borderColor: '#0f766e' },
  btnText: { fontWeight: '600' },
  btnTextPrimary: { color: '#fff' },
  body: { fontSize: 15, lineHeight: 22, marginTop: 8 },
  row: { flexDirection: 'row', justifyContent: 'space-between', gap: 12, paddingVertical: 6 },
  rowLabel: { color: '#6b7480', fontWeight: '600' },
  rowValue: { flex: 1, textAlign: 'right' },
  sectionTitle: { fontSize: 15, fontWeight: '700', marginTop: 12 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  chip: { backgroundColor: '#e9edf2', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 999, fontSize: 12 },
  footer: { fontSize: 12, color: '#9aa3ad', textAlign: 'center', marginTop: 12 },
  hint: { textAlign: 'center', padding: 40, color: '#6b7480' },
});
