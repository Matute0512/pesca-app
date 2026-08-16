import { create } from 'zustand';
import { SUGGESTED_RADII_METERS } from '@pescaba/geo';

interface FiltersState {
  lat: number | null;
  lng: number | null;
  radiusMeters: number;
  siteTypes: string[];
  status: string[];
  sort: string;
  setLocation: (lat: number | null, lng: number | null) => void;
  setRadius: (radiusMeters: number) => void;
  toggleSiteType: (type: string) => void;
  toggleStatus: (status: string) => void;
  setSort: (sort: string) => void;
  clear: () => void;
}

/** Estado global de filtros de búsqueda. */
export const useFiltersStore = create<FiltersState>((set) => ({
  lat: null,
  lng: null,
  radiusMeters: SUGGESTED_RADII_METERS[2], // 10 km
  siteTypes: [],
  status: [],
  sort: 'name',

  setLocation: (lat, lng) => set({ lat, lng }),
  setRadius: (radiusMeters) => set({ radiusMeters }),
  toggleSiteType: (type) =>
    set((s) => ({
      siteTypes: s.siteTypes.includes(type) ? s.siteTypes.filter((t) => t !== type) : [...s.siteTypes, type],
    })),
  toggleStatus: (status) =>
    set((s) => ({
      status: s.status.includes(status) ? s.status.filter((t) => t !== status) : [...s.status, status],
    })),
  setSort: (sort) => set({ sort }),
  clear: () => set({ siteTypes: [], status: [], sort: 'name' }),
}));
