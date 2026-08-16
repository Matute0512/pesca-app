/** Cliente HTTP del panel admin contra la API PescaBA (/v1). */

const API_BASE: string = (import.meta.env.VITE_API_URL as string | undefined) ?? '/v1';
const ACCESS_KEY = 'pescaba_admin_access';
const REFRESH_KEY = 'pescaba_admin_refresh';

export function getTokens(): { access: string | null; refresh: string | null } {
  return {
    access: localStorage.getItem(ACCESS_KEY),
    refresh: localStorage.getItem(REFRESH_KEY),
  };
}

export function setTokens(access: string, refresh: string): void {
  localStorage.setItem(ACCESS_KEY, access);
  localStorage.setItem(REFRESH_KEY, refresh);
}

export function clearTokens(): void {
  localStorage.removeItem(ACCESS_KEY);
  localStorage.removeItem(REFRESH_KEY);
}

export function isAuthed(): boolean {
  return Boolean(getTokens().access);
}

export class ApiError extends Error {
  code: string;
  status: number;

  constructor(message: string, code: string, status: number) {
    super(message);
    this.code = code;
    this.status = status;
  }
}

interface RequestOptions {
  method?: string;
  body?: unknown;
  headers?: Record<string, string>;
  formData?: FormData;
}

async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { access, refresh } = getTokens();

  const headers: Record<string, string> = { ...(options.headers ?? {}) };
  if (options.body !== undefined) {
    headers['Content-Type'] = 'application/json';
  }
  if (access) {
    headers['Authorization'] = `Bearer ${access}`;
  }

  const res = await fetch(`${API_BASE}${path}`, {
    method: options.method ?? 'GET',
    headers,
    body: options.formData ?? (options.body !== undefined ? JSON.stringify(options.body) : undefined),
  });

  if (res.status === 401 && refresh && !path.startsWith('/auth/')) {
    const refreshed = await tryRefresh(refresh);
    if (refreshed) {
      return request<T>(path, options);
    }
    clearTokens();
    window.location.href = '/login';
    throw new ApiError('Sesión expirada', 'UNAUTHORIZED', 401);
  }

  const text = await res.text();
  const body = text ? JSON.parse(text) : null;

  if (!res.ok) {
    throw new ApiError(
      body?.error?.message ?? `Error ${res.status}`,
      body?.error?.code ?? 'UNKNOWN',
      res.status,
    );
  }
  return (body?.data ?? body) as T;
}

async function tryRefresh(refreshToken: string): Promise<boolean> {
  try {
    const res = await fetch(`${API_BASE}/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken }),
    });
    const body = await res.json();
    if (res.ok && body?.data?.accessToken) {
      setTokens(body.data.accessToken, body.data.refreshToken);
      return true;
    }
    return false;
  } catch {
    return false;
  }
}

export const api = {
  get: <T>(path: string) => request<T>(path),
  post: <T>(path: string, body?: unknown) => request<T>(path, { method: 'POST', body }),
  patch: <T>(path: string, body?: unknown) => request<T>(path, { method: 'PATCH', body }),
  del: <T>(path: string) => request<T>(path, { method: 'DELETE' }),
  upload: <T>(path: string, file: File, query = '') =>
    {
      const formData = new FormData();
      formData.append('file', file);
      return request<T>(`${path}${query}`, { method: 'POST', formData });
    },
};

export { API_BASE };
