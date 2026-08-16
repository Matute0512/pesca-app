/** Nombres de listas de favoritos por usuario. */
export const FAVORITE_LISTS = ['favorites', 'pending', 'visited'] as const;

export type FavoriteListName = (typeof FAVORITE_LISTS)[number];

export const FAVORITE_LIST_LABELS: Record<FavoriteListName, { es: string; en: string }> = {
  favorites: { es: 'Favoritos', en: 'Favorites' },
  pending: { es: 'Pendientes', en: 'Pending' },
  visited: { es: 'Visitados', en: 'Visited' },
};
