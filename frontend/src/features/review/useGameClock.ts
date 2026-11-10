import { useEffect, useRef, useState } from 'react';
import type { RoundResult } from './gameLogic';

export function useGameClock(running: boolean) {
  const [milliseconds, setMilliseconds] = useState(0);
  const base = useRef(0);
  useEffect(() => {
    if (!running) return;
    const started = performance.now();
    const previous = base.current;
    const timer = window.setInterval(() => setMilliseconds(previous + performance.now() - started), 200);
    return () => {
      base.current = previous + performance.now() - started;
      window.clearInterval(timer);
    };
  }, [running]);
  return Math.floor(milliseconds / 1000);
}

export function useGamePause() {
  const [paused, setPaused] = useState(false);
  useEffect(() => {
    const onVisibility = () => { if (document.hidden) setPaused(true); };
    document.addEventListener('visibilitychange', onVisibility);
    return () => document.removeEventListener('visibilitychange', onVisibility);
  }, []);
  return { paused, setPaused };
}

export function useReportResult(result: RoundResult | null, onComplete: (result: RoundResult) => void) {
  const reported = useRef(false);
  useEffect(() => {
    if (result && !reported.current) { reported.current = true; onComplete(result); }
  }, [result, onComplete]);
}
