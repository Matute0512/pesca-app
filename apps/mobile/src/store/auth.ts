import { create } from 'zustand';
import { api, clearTokens, setTokens } from '../lib/api';

export interface AuthUser {
  id: string;
  email: string;
  username: string | null;
  fullName: string | null;
  role: string;
  preferredLanguage: string;
}

interface AuthState {
  user: AuthUser | null;
  status: 'idle' | 'loading' | 'authenticated' | 'guest';
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, username: string) => Promise<void>;
  loadMe: () => Promise<void>;
  logout: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  status: 'idle',

  login: async (email, password) => {
    set({ status: 'loading' });
    const data = await api.post<{ accessToken: string; refreshToken: string }>('/auth/login', {
      email,
      password,
    });
    await setTokens(data.accessToken, data.refreshToken);
    const me = await api.get<AuthUser>('/auth/me');
    set({ user: me, status: 'authenticated' });
  },

  register: async (email, password, username) => {
    set({ status: 'loading' });
    const data = await api.post<{ accessToken: string; refreshToken: string }>('/auth/register', {
      email,
      password,
      username,
    });
    await setTokens(data.accessToken, data.refreshToken);
    const me = await api.get<AuthUser>('/auth/me');
    set({ user: me, status: 'authenticated' });
  },

  loadMe: async () => {
    try {
      const me = await api.get<AuthUser>('/auth/me');
      set({ user: me, status: 'authenticated' });
    } catch {
      await clearTokens();
      set({ user: null, status: 'guest' });
    }
  },

  logout: async () => {
    await clearTokens();
    set({ user: null, status: 'guest' });
  },
}));
