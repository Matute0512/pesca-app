import { z } from 'zod';
import { FAVORITE_LISTS } from '../constants';

/** Body para agregar un lugar a favoritos. */
export const addFavoriteSchema = z.object({
  listName: z.enum(FAVORITE_LISTS).default('favorites'),
});

export type AddFavoriteInput = z.infer<typeof addFavoriteSchema>;

/** Query de listado de favoritos (filtro por lista + paginación). */
export const favoritesListQuerySchema = z.object({
  listName: z.enum(FAVORITE_LISTS).optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
});

export type FavoritesListQuery = z.infer<typeof favoritesListQuerySchema>;
