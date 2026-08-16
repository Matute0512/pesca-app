import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import type { FavoriteListName, SiteSummary } from '@pescaba/shared';
import { FAVORITE_LISTS } from '@pescaba/shared';
import { api } from '@/lib/api';
import { useAuthStore } from '@/store/auth';
import { SiteList } from '@/components/SiteList';
import { EmptyState } from '@/components/EmptyState';

export default function FavoritesScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { status } = useAuthStore();
  const [listName, setListName] = useState<FavoriteListName>('favorites');

  const { data, refetch, isLoading } = useQuery({
    queryKey: ['favorites', listName],
    queryFn: () =>
      api.get<{ data: SiteSummary[] }>('/favorites', { listName }).then((r) => r.data),
    enabled: status === 'authenticated',
  });

  if (status !== 'authenticated') {
    return (
      <EmptyState
        message={t('favorites.loginRequired')}
        onRetry={() => router.push('/login')}
      />
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.tabs}>
        {FAVORITE_LISTS.map((list) => (
          <Pressable
            key={list}
            style={[styles.tab, listName === list && styles.tabActive]}
            onPress={() => setListName(list)}
          >
            <Text style={listName === list ? styles.tabTextActive : undefined}>
              {t(`favorites.tabs.${list}`)}
            </Text>
          </Pressable>
        ))}
      </View>
      {isLoading ? (
        <Text style={styles.hint}>{t('common.loading')}</Text>
      ) : (
        <SiteList sites={data ?? []} onRetry={() => void refetch()} emptyMessage={t('favorites.empty')} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  tabs: { flexDirection: 'row', padding: 10, gap: 8 },
  tab: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#e2e6ec',
  },
  tabActive: { backgroundColor: '#0f766e', borderColor: '#0f766e' },
  tabTextActive: { color: '#fff', fontWeight: '600' },
  hint: { textAlign: 'center', padding: 20, color: '#6b7480' },
});
