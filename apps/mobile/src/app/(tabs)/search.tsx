import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import type { SiteSummary } from '@pescaba/shared';
import { SITE_TYPE_LABELS, SITE_TYPES } from '@pescaba/shared';
import { api } from '@/lib/api';
import { SiteList } from '@/components/SiteList';

interface AutocompleteItem {
  id: string;
  name: string;
  locality: string | null;
}

export default function SearchScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const [q, setQ] = useState('');
  const [submitted, setSubmitted] = useState<string | null>(null);
  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);

  const { data: suggestions } = useQuery({
    queryKey: ['autocomplete', q],
    queryFn: () => api.get<AutocompleteItem[]>('/sites/autocomplete', { q, limit: 8 }),
    enabled: q.trim().length >= 2,
  });

  const { data: results, refetch } = useQuery({
    queryKey: ['search', submitted, selectedTypes],
    queryFn: () => {
      const params: Record<string, string | number> = { q: submitted ?? '' };
      if (selectedTypes.length) params.siteTypes = selectedTypes.join(',');
      return api.get<SiteSummary[]>('/sites/search', params);
    },
    enabled: submitted !== null && submitted.length > 0,
  });

  function toggleType(type: string) {
    setSelectedTypes((prev) =>
      prev.includes(type) ? prev.filter((x) => x !== type) : [...prev, type],
    );
  }

  return (
    <View style={styles.container}>
      <TextInput
        style={styles.input}
        placeholder={t('search.placeholder')}
        value={q}
        onChangeText={setQ}
        onSubmitEditing={() => setSubmitted(q.trim())}
        returnKeyType="search"
      />

      {submitted === null && suggestions && suggestions.length > 0 && (
        <View style={styles.suggestions}>
          {suggestions.map((s) => (
            <Pressable
              key={s.id}
              style={styles.suggestion}
              onPress={() => router.push(`/site/${s.id}`)}
            >
              <Text style={styles.suggestionName}>{s.name}</Text>
              {s.locality && <Text style={styles.suggestionMeta}>{s.locality}</Text>}
            </Pressable>
          ))}
        </View>
      )}

      <Text style={styles.section}>{t('search.filters')}</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chips}>
        {SITE_TYPES.map((type) => (
          <Pressable
            key={type}
            style={[styles.chip, selectedTypes.includes(type) && styles.chipActive]}
            onPress={() => toggleType(type)}
          >
            <Text style={selectedTypes.includes(type) ? styles.chipTextActive : undefined}>{SITE_TYPE_LABELS[type].es}</Text>
          </Pressable>
        ))}
      </ScrollView>

      {submitted !== null && (
        <View style={styles.results}>
          <Text style={styles.section}>
            {t('search.results')} — «{submitted}»
          </Text>
          <SiteList sites={results ?? []} onRetry={() => void refetch()} />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 12, gap: 10 },
  input: {
    backgroundColor: '#fff',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#e2e6ec',
  },
  suggestions: { backgroundColor: '#fff', borderRadius: 10, borderWidth: 1, borderColor: '#e2e6ec' },
  suggestion: { padding: 12, borderBottomWidth: 1, borderBottomColor: '#eef1f5' },
  suggestionName: { fontSize: 15, fontWeight: '600' },
  suggestionMeta: { fontSize: 12, color: '#6b7480' },
  section: { fontSize: 13, fontWeight: '700', color: '#6b7480', textTransform: 'uppercase' },
  chips: { flexGrow: 0 },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    backgroundColor: '#fff',
    borderRadius: 999,
    marginRight: 6,
    borderWidth: 1,
    borderColor: '#e2e6ec',
  },
  chipActive: { backgroundColor: '#0f766e', borderColor: '#0f766e' },
  chipTextActive: { color: '#fff', fontWeight: '600' },
  results: { flex: 1 },
});
