import { useEffect, useState } from 'react';
import type { Sign } from '../../services/api';

export function useReviewSigns() {
  const [data, setData] = useState<Sign[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError(false);
    async function load() {
      const signs = new Map<number, Sign>();
      for (let offset = 0; ; offset += 100) {
        const response = await fetch(`/api/v1/signs?limit=100&offset=${offset}`, { signal: controller.signal });
        if (!response.ok) throw new Error('Could not load review signs');
        const page = await response.json() as Sign[];
        page.forEach(sign => signs.set(sign.id, sign));
        if (page.length < 100) break;
      }
      if (!controller.signal.aborted) setData([...signs.values()]);
    }
    void load().catch(() => { if (!controller.signal.aborted) setError(true); })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [attempt]);
  return { data, loading, error, retry: () => setAttempt(value => value + 1) };
}
