import { api, clearTokens, getTokens, isAuthed, setTokens } from './api/client';

export interface SessionUser {
  id: string;
  email: string;
  username: string | null;
  fullName: string | null;
  role: 'user' | 'moderator' | 'editor' | 'admin';
}

const USER_KEY = 'pescaba_admin_user';

export function getUser(): SessionUser | null {
  const raw = localStorage.getItem(USER_KEY);
  return raw ? (JSON.parse(raw) as SessionUser) : null;
}

export function setUser(user: SessionUser): void {
  localStorage.setItem(USER_KEY, JSON.stringify(user));
}

export function logout(): void {
  clearTokens();
  localStorage.removeItem(USER_KEY);
  window.location.href = '/login';
}

export async function login(email: string, password: string): Promise<SessionUser> {
  const data = await api.post<{ accessToken: string; refreshToken: string }>('/auth/login', {
    email,
    password,
  });
  setTokens(data.accessToken, data.refreshToken);

  const me = await api.get<SessionUser>('/auth/me');
  setUser(me);
  return me;
}

export function hasStaffRole(role: string | undefined): boolean {
  return role === 'admin' || role === 'editor' || role === 'moderator';
}

export { isAuthed, getTokens };
