import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

/** Cliente HTTP de la app móvil. Tokens en AsyncStorage, refresh automático. */

/**
 * URL base por defecto según plataforma:
 * - Android emulador: 10.0.2.2 (alias del host de la máquina de desarrollo).
 * - Web / iOS / otros: localhost.
 * Se sobreescribe con EXPO_PUBLIC_API_URL (apps/mobile/.env), p. ej. para un
 * celular físico con Expo Go, donde hay que usar la IP LAN de la máquina.
 */
const DEFAULT_API_BASE =
  Platform.select({ android: 'http://10.0.2.2:3000/v1', default: 'http://localhost:3000/v1' }) ??
  'http://localhost:3000/v1';

export const API_BASE: string = process.env.EXPO_PUBLIC_API_URL ?? DEFAULT_API_BASE;

const ACCESS_KEY = 'pescaba_access';
const REFRESH_KEY = 'pescaba_refresh';

export class ApiClientError extends Error {
  code: string;
  status: number;

  constructor(message: string, code: string, status = 0) {
    super(message);
    this.code = code;
    this.status = status;
  }
}

export async function getAccessToken(): Promise<string | null> {
  return AsyncStorage.getItem(ACCESS_KEY);
}

export async function setTokens(access: string, refresh: string): Promise<void> {
  await AsyncStorage.multiSet([
    [ACCESS_KEY, access],
    [REFRESH_KEY, refresh],
  ]);
}

export async function clearTokens(): Promise<void> {
  await AsyncStorage.multiRemove([ACCESS_KEY, REFRESH_KEY]);
}

async function tryRefresh(): Promise<boolean> {
  const refresh = await AsyncStorage.getItem(REFRESH_KEY);
  if (!refresh) {
    return false;
  }
  try {
    const res = await fetch(`${API_BASE}/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken: refresh }),
    });
    const body = await res.json();
    if (res.ok && body?.data?.accessToken) {
      await setTokens(body.data.accessToken, body.data.refreshToken);
      return true;
    }
    await clearTokens();
    return false;
  } catch {
    return false;
  }
}

export async function apiRequest<T>(path: string, options: RequestInit = {}): Promise<T> {
  const access = await getAccessToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(access ? { Authorization: `Bearer ${access}` } : {}),
    ...(options.headers as Record<string, string> | undefined),
  };

  const res = await fetch(`${API_BASE}${path}`, { ...options, headers });

  if (res.status === 401 && !path.startsWith('/auth/')) {
    const refreshed = await tryRefresh();
    if (refreshed) {
      return apiRequest<T>(path, options);
    }
    throw new ApiClientError('Sesión expirada. Volvé a iniciar sesión.', 'UNAUTHORIZED', 401);
  }

  const text = await res.text();
  const body = text ? JSON.parse(text) : null;
  if (!res.ok) {
    throw new ApiClientError(
      body?.error?.message ?? `Error ${res.status}`,
      body?.error?.code ?? 'UNKNOWN',
      res.status,
    );
  }
  return (body?.data ?? body) as T;
}

export const api = {
  get: <T>(path: string, params?: Record<string, string | number | undefined>) => {
    const qs = params
      ? Object.entries(params)
          .filter(([, v]) => v !== undefined && v !== '')
          .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`)
          .join('&')
      : '';
    return apiRequest<T>(`${path}${qs ? `?${qs}` : ''}`);
  },
  post: <T>(path: string, body?: unknown) => apiRequest<T>(path, { method: 'POST', body: JSON.stringify(body) }),
  patch: <T>(path: string, body?: unknown) => apiRequest<T>(path, { method: 'PATCH', body: JSON.stringify(body) }),
  del: <T>(path: string) => apiRequest<T>(path, { method: 'DELETE' }),
};
