import { useCallback, useEffect, useState } from 'react';

export type Role = 'learner' | 'admin';

export type AdminUser = {
  id: number;
  email: string;
  display_name: string;
  gender?: 'male' | 'female' | 'other' | 'prefer_not_to_say' | null;
  phone_number?: string | null;
  google_email?: string | null;
  password_enabled?: boolean;
  role: Role;
  is_google_linked?: boolean;
  avatar_url?: string | null;
  created_at: string;
};

export type AuthSession = { user: AdminUser; csrf_token: string };
export type AdminOverview = { courses: number; lessons: number; signs: number; users: number };

export type AdminCourse = {
  id: number;
  slug: string;
  title: string;
  description: string;
  difficulty: string;
  is_published: boolean;
  created_at: string;
};

export type AdminLesson = {
  id: number;
  course_id: number;
  title: string;
  description: string;
  position: number;
  video_url: string | null;
  captions_url: string | null;
  is_published: boolean;
};

export type AdminSign = {
  id: number;
  label: string;
  topic: string;
  region: string;
  description: string;
  video_url: string | null;
  source: string | null;
  is_published: boolean;
};

export type AdminAuditLog = {
  id: number;
  actor_id: number;
  actor_name: string;
  action: 'created' | 'updated' | 'deleted';
  resource_type: string;
  resource_id: number;
  resource_label: string;
  created_at: string;
};

export class ApiError extends Error {
  constructor(public readonly status: number, message: string) {
    super(message);
  }
}

type RequestOptions = { method?: 'GET' | 'POST' | 'PUT' | 'DELETE'; body?: unknown; csrfToken?: string };
const SESSION_EVENT = 'vsl-session-changed';
const AUTH_CHANGE_KEY = 'vsl-connect-auth-change';

function notifySessionChanged(session?: AuthSession | null) {
  window.dispatchEvent(new CustomEvent(SESSION_EVENT, { detail: { session } }));
  if (session !== undefined) {
    try { localStorage.setItem(AUTH_CHANGE_KEY, `${Date.now()}-${Math.random()}`); } catch { /* Same-tab notifications still work. */ }
  }
}

export async function apiRequest<T>(path: string, { method = 'GET', body, csrfToken }: RequestOptions = {}): Promise<T> {
  const headers: Record<string, string> = {};
  if (body !== undefined) headers['Content-Type'] = 'application/json';
  if (csrfToken) headers['X-CSRF-Token'] = csrfToken;
  const response = await fetch(`/api/v1${path}`, {
    method,
    headers,
    credentials: 'same-origin',
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  if (response.status === 204) return undefined as T;
  const payload = await response.json().catch(() => null) as { detail?: unknown } | null;
  if (response.status === 401 && path !== '/auth/me') notifySessionChanged(null);
  if (!response.ok) throw new ApiError(response.status, typeof payload?.detail === 'string' ? payload.detail : 'Dữ liệu chưa hợp lệ hoặc không thể hoàn tất yêu cầu.');
  return payload as T;
}

export const getSession = () => apiRequest<AuthSession>('/auth/me');
export async function login(email: string, password: string) {
  const session = await apiRequest<AuthSession>('/auth/login', { method: 'POST', body: { email, password } });
  notifySessionChanged(session);
  return session;
}
export const register = (display_name: string, email: string, password: string) => apiRequest<{ detail: string }>('/auth/register', { method: 'POST', body: { display_name, email, password } });
export async function logout(csrfToken: string) {
  await apiRequest<void>('/auth/logout', { method: 'POST', csrfToken });
  notifySessionChanged(null);
}
export async function uploadAvatar(image: Blob, csrfToken: string, signal?: AbortSignal): Promise<AdminUser> {
  const response = await fetch('/api/v1/profile/avatar', { method: 'PUT', credentials: 'same-origin', headers: { 'Content-Type': image.type, 'X-CSRF-Token': csrfToken }, body: image, signal });
  const payload = await response.json().catch(() => null);
  if (response.status === 401) notifySessionChanged(null);
  if (!response.ok) throw new ApiError(response.status, typeof payload?.detail === 'string' ? payload.detail : 'Không thể lưu ảnh đại diện. Vui lòng thử lại.');
  notifySessionChanged();
  return payload as AdminUser;
}
export async function removeAvatar(csrfToken: string): Promise<AdminUser> {
  const user = await apiRequest<AdminUser>('/profile/avatar', { method: 'DELETE', csrfToken });
  notifySessionChanged();
  return user;
}
export const unlinkGoogle = (csrfToken: string, currentPassword: string) => apiRequest<{ detail: string }>('/auth/google/unlink', { method: 'POST', csrfToken, body: { current_password: currentPassword } });
export async function saveProfile(body: { display_name: string; gender: AdminUser['gender']; phone_number: string | null }, csrfToken: string) {
  const user = await apiRequest<AdminUser>('/profile', { method: 'PUT', body, csrfToken });
  notifySessionChanged();
  return user;
}
export async function changePassword(body: { current_password?: string; new_password: string; code?: string }, csrfToken: string) {
  const session = await apiRequest<AuthSession>('/profile/password', { method: 'POST', body, csrfToken });
  notifySessionChanged(session);
  return session;
}
export async function verifyGoogle(body: { code: string; google_code?: string }, csrfToken: string) {
  const session = await apiRequest<AuthSession>('/auth/google/verify', { method: 'POST', body, csrfToken });
  notifySessionChanged(session);
  return session;
}

type ResourceState<T> = { data: T | null; loading: boolean; error: string | null; refresh: () => void };

export function useAdminResource<T>(path: string, enabled = true): ResourceState<T> {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(enabled);
  const [error, setError] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);
  const refresh = useCallback(() => setAttempt((value) => value + 1), []);

  useEffect(() => {
    if (!enabled || path !== '/auth/me') return;
    function onSessionChange(event: Event) {
      const session = (event as CustomEvent<{ session?: AuthSession | null }>).detail?.session;
      if (session !== undefined) setData(session as T | null);
      refresh();
    }
    function onAuthStorage(event: StorageEvent) {
      if (event.key !== AUTH_CHANGE_KEY) return;
      setData(null);
      refresh();
    }
    window.addEventListener(SESSION_EVENT, onSessionChange);
    window.addEventListener('storage', onAuthStorage);
    return () => {
      window.removeEventListener(SESSION_EVENT, onSessionChange);
      window.removeEventListener('storage', onAuthStorage);
    };
  }, [enabled, path, refresh]);

  useEffect(() => {
    if (!enabled) return;
    const controller = new AbortController();
    setLoading(true);
    setError(null);
    apiRequest<T>(path)
      .then((result) => { if (!controller.signal.aborted) setData(result); })
      .catch((requestError: unknown) => { if (!controller.signal.aborted) { if (path === '/auth/me') setData(null); setError(requestError instanceof Error ? requestError.message : 'Không thể tải dữ liệu.'); } })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [attempt, enabled, path]);

  return { data, loading, error, refresh };
}

export function usePagedAdminResource<T>(path: string) {
  const [offset, setOffset] = useState(0);
  const pageSize = 50;
  const resource = useAdminResource<T[]>(`${path}?limit=${pageSize}&offset=${offset}`);
  return { ...resource, offset, setOffset, pageSize };
}

export function useAdminCourses() {
  const [data, setData] = useState<AdminCourse[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    let cancelled = false;
    async function loadCourses() {
      const courses: AdminCourse[] = [];
      for (let offset = 0; ; offset += 100) {
        const page = await apiRequest<AdminCourse[]>(`/admin/courses?limit=100&offset=${offset}`);
        courses.push(...page);
        if (page.length < 100) break;
      }
      return courses;
    }
    setError(null);
    loadCourses().then((courses) => { if (!cancelled) setData(courses); })
      .catch((error: unknown) => { if (!cancelled) setError(error instanceof Error ? error.message : 'Không thể tải khóa học.'); });
    return () => { cancelled = true; };
  }, [attempt]);
  return { data, error, retry: () => setAttempt((value) => value + 1) };
}
