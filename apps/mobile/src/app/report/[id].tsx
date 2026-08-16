import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { REPORT_TYPES, type ReportType } from '@pescaba/shared';
import { api } from '@/lib/api';

export default function ReportScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { t } = useTranslation();
  const [reportType, setReportType] = useState<ReportType>(REPORT_TYPES[0]);
  const [description, setDescription] = useState('');
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit() {
    setBusy(true);
    setError(null);
    try {
      await api.post(`/sites/${id}/reports`, {
        reportType,
        description: description || null,
      });
      setSent(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : t('common.error'));
    } finally {
      setBusy(false);
    }
  }

  if (sent) {
    return <Text style={styles.success}>{t('report.sent')} 🎉</Text>;
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.section}>{t('report.title')}</Text>
      <View style={styles.chips}>
        {REPORT_TYPES.map((type) => (
          <Pressable
            key={type}
            style={[styles.chip, reportType === type && styles.chipActive]}
            onPress={() => setReportType(type)}
          >
            <Text style={reportType === type ? styles.chipTextActive : undefined}>{type}</Text>
          </Pressable>
        ))}
      </View>

      <TextInput
        style={[styles.input, styles.textarea]}
        placeholder="Descripción (opcional)"
        value={description}
        onChangeText={setDescription}
        multiline
        numberOfLines={4}
      />

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
  section: { fontSize: 15, fontWeight: '700', color: '#6b7480', textTransform: 'uppercase' },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  chip: { paddingHorizontal: 10, paddingVertical: 6, backgroundColor: '#fff', borderRadius: 999, borderWidth: 1, borderColor: '#e2e6ec' },
  chipActive: { backgroundColor: '#0f766e', borderColor: '#0f766e' },
  chipTextActive: { color: '#fff', fontWeight: '600' },
  input: {
    backgroundColor: '#fff',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#e2e6ec',
  },
  textarea: { minHeight: 90, textAlignVertical: 'top' },
  btn: { backgroundColor: '#0f766e', padding: 14, borderRadius: 10, alignItems: 'center' },
  btnText: { color: '#fff', fontWeight: '700' },
  error: { color: '#b91c1c' },
  success: { textAlign: 'center', padding: 40, fontSize: 16, color: '#15803d' },
});
