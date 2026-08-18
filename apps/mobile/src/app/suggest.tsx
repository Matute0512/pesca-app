import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { SITE_TYPE_LABELS, SITE_TYPES } from '@pescaba/shared';
import { api } from '@/lib/api';
import { useFiltersStore } from '@/store/filters';

export default function SuggestScreen() {
  const { t } = useTranslation();
  const { lat, lng } = useFiltersStore();

  const [name, setName] = useState('');
  const [siteType, setSiteType] = useState('lagoon');
  const [description, setDescription] = useState('');
  const [locality, setLocality] = useState('');
  const [infoAccurate, setInfoAccurate] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit() {
    if (!infoAccurate) {
      setError(t('suggest.infoAccurate'));
      return;
    }
    if (!lat || !lng) {
      setError('Activá la ubicación en la pantalla principal para poder sugerir un punto.');
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await api.post('/sites/suggestions', {
        name,
        siteType,
        latitude: lat,
        longitude: lng,
        locality: locality || null,
        description: description || null,
        countryCode: 'ar',
        infoAccurate: true,
      });
      setSent(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : t('common.error'));
    } finally {
      setBusy(false);
    }
  }

  if (sent) {
    return <Text style={styles.success}>{t('suggest.success')} 🎉</Text>;
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <TextInput style={styles.input} placeholder="Nombre del lugar" value={name} onChangeText={setName} />
      <TextInput
        style={styles.input}
        placeholder="Localidad"
        value={locality}
        onChangeText={setLocality}
      />

      <View style={styles.chips}>
        {SITE_TYPES.map((type) => (
          <Pressable
            key={type}
            style={[styles.chip, siteType === type && styles.chipActive]}
            onPress={() => setSiteType(type)}
          >
            <Text style={siteType === type ? styles.chipTextActive : undefined}>{SITE_TYPE_LABELS[type].es}</Text>
          </Pressable>
        ))}
      </View>

      <TextInput
        style={[styles.input, styles.textarea]}
        placeholder="Descripción"
        value={description}
        onChangeText={setDescription}
        multiline
        numberOfLines={4}
      />

      {lat && lng ? (
        <Text style={styles.meta}>📍 {lat.toFixed(5)}, {lng.toFixed(5)}</Text>
      ) : (
        <Text style={styles.error}>{t('home.noLocation')}</Text>
      )}

      <Pressable style={styles.check} onPress={() => setInfoAccurate((v) => !v)}>
        <Text style={styles.checkBox}>{infoAccurate ? '☑' : '☐'}</Text>
        <Text style={styles.checkLabel}>{t('suggest.infoAccurate')}</Text>
      </Pressable>

      {error && <Text style={styles.error}>{error}</Text>}

      <Pressable style={styles.btn} onPress={() => void submit()} disabled={busy}>
        <Text style={styles.btnText}>{busy ? t('common.loading') : t('common.save')}</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f6f7f9' },
  content: { padding: 16, gap: 12 },
  input: {
    backgroundColor: '#fff',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#e2e6ec',
  },
  textarea: { minHeight: 90, textAlignVertical: 'top' },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  chip: { paddingHorizontal: 10, paddingVertical: 6, backgroundColor: '#fff', borderRadius: 999, borderWidth: 1, borderColor: '#e2e6ec' },
  chipActive: { backgroundColor: '#0f766e', borderColor: '#0f766e' },
  chipTextActive: { color: '#fff', fontWeight: '600' },
  check: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  checkBox: { fontSize: 18 },
  checkLabel: { flex: 1 },
  btn: { backgroundColor: '#0f766e', padding: 14, borderRadius: 10, alignItems: 'center' },
  btnText: { color: '#fff', fontWeight: '700' },
  meta: { color: '#6b7480' },
  error: { color: '#b91c1c' },
  success: { textAlign: 'center', padding: 40, fontSize: 16, color: '#15803d' },
});
