import { FlatList, StyleSheet } from 'react-native';
import type { SiteSummary } from '@pescaba/shared';
import { SiteCard } from './SiteCard';
import { EmptyState } from './EmptyState';

export function SiteList({
  sites,
  onRetry,
  emptyMessage,
}: {
  sites: SiteSummary[];
  onRetry?: () => void;
  emptyMessage?: string;
}) {
  if (sites.length === 0) {
    return <EmptyState message={emptyMessage ?? 'Sin resultados'} onRetry={onRetry} />;
  }
  return (
    <FlatList
      data={sites}
      keyExtractor={(item) => item.id}
      renderItem={({ item }) => <SiteCard site={item} />}
      contentContainerStyle={styles.list}
    />
  );
}

const styles = StyleSheet.create({
  list: { padding: 12 },
});
