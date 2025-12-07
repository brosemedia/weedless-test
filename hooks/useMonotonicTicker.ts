import { useEffect, useRef, useState } from 'react';

// Stabiler Ticker via requestAnimationFrame mit Drosselung (~12 FPS)
// Optional abschaltbar (enabled = false) für Screens/Modi, in denen kein stetiger Re-Render nötig ist.
export function useMonotonicTicker(fps = 12, enabled = true) {
  const [now, setNow] = useState<number>(Date.now());
  const rafRef = useRef<number | null>(null);
  const lastEmitRef = useRef<number>(0);
  const interval = fps > 0 ? 1000 / fps : Infinity;

  useEffect(() => {
    let mounted = true;
    if (!enabled || !Number.isFinite(interval) || interval === Infinity) {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
      return () => {};
    }

    lastEmitRef.current = 0;
    const loop = (t: number) => {
      if (!mounted) return;
      if (lastEmitRef.current === 0) {
        lastEmitRef.current = t - interval;
      }
      if (t - lastEmitRef.current >= interval) {
        lastEmitRef.current = t;
        setNow(Date.now());
      }
      rafRef.current = requestAnimationFrame(loop);
    };
    rafRef.current = requestAnimationFrame(loop);
    return () => {
      mounted = false;
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [enabled, interval]);

  return now; // ms
}
