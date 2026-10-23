import { useEffect, useState } from 'react';

export type Course = { id: number; slug: string; title: string; description: string; difficulty: string };
export type Lesson = { id: number; title: string; description: string; position: number; video_url: string | null; captions_url: string | null };
export type Sign = { id: number; label: string; topic: string; region: string; description: string; video_url: string | null; source: string | null };

type ApiState<T> = { data: T | null; loading: boolean; error: boolean };

export function useApi<T>(url: string) {
  const [state, setState] = useState<ApiState<T>>({ data: null, loading: true, error: false });
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    setState({ data: null, loading: true, error: false });
    fetch(url, { signal: controller.signal })
      .then((response) => {
        if (!response.ok) throw new Error('API request failed');
        return response.json() as Promise<T>;
      })
      .then((data) => setState({ data, loading: false, error: false }))
      .catch(() => {
        if (!controller.signal.aborted) setState({ data: null, loading: false, error: true });
      });
    return () => controller.abort();
  }, [url, attempt]);

  return { ...state, retry: () => setAttempt((value) => value + 1) };
}
