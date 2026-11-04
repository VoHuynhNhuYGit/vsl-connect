import { useCallback, useEffect, useState } from 'react';

export type Role = 'learner' | 'admin';

export type AdminUser = {
  id: number;
  email: string;
  display_name: string;
  role: Role;
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

export class ApiError extends Error {
  constructor(public readonly status: number, message: string) {
    super(message);
  }
}

type RequestOptions = { method?: 'GET' | 'POST' | 'PUT' | 'DELETE'; body?: unknown; csrfToken?: string };

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
  if (!response.ok) throw new ApiError(response.status, typeof payload?.detail === 'string' ? payload.detail : 'Dữ liệu chưa hợp lệ hoặc không thể hoàn tất yêu cầu.');
  return payload as T;
}

export const getSession = () => apiRequest<AuthSession>('/auth/me');
export const login = (email: string, password: string) => apiRequest<AuthSession>('/auth/login', { method: 'POST', body: { email, password } });
export const logout = (csrfToken: string) => apiRequest<void>('/auth/logout', { method: 'POST', csrfToken });

type ResourceState<T> = { data: T | null; loading: boolean; error: string | null; refresh: () => void };

export function useAdminResource<T>(path: string, enabled = true): ResourceState<T> {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(enabled);
  const [error, setError] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);
  const refresh = useCallback(() => setAttempt((value) => value + 1), []);

  useEffect(() => {
    if (!enabled) return;
    const controller = new AbortController();
    setLoading(true);
    setError(null);
    apiRequest<T>(path)
      .then((result) => { if (!controller.signal.aborted) setData(result); })
      .catch((requestError: unknown) => { if (!controller.signal.aborted) setError(requestError instanceof Error ? requestError.message : 'Không thể tải dữ liệu.'); })
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
