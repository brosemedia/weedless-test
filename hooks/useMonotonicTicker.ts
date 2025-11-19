import { useEffect, useRef, useState } from 'react';

// Stabiler Ticker via requestAnimationFrame mit Drosselung (~12 FPS)
export function useMonotonicTicker(fps = 12) {
  const [now, setNow] = useState<number>(Date.now());
  const rafRef = useRef<number | null>(null);
  const lastEmitRef = useRef<number>(0);
  const interval = 1000 / fps;

  useEffect(() => {
    let mounted = true;
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
  }, [fps]);

  return now; // ms
}
