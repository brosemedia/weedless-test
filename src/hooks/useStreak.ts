import { useMemo } from 'react';
import { useStore } from '../store/useStore';

/**
 * Hook to calculate the current streak based on checkins.
 * A streak is a consecutive series of days with checkins.
 */
export function useStreak(): number {
  const checkins = useStore((s) => s.checkins);

  return useMemo(() => {
    let streak = 0;
    const d = new Date();
    for (let i = 0; i < 365; i++) {
      const iso = new Date(d.getFullYear(), d.getMonth(), d.getDate() - i).toISOString().slice(0, 10);
      if (checkins.some((c) => c.dateISO.slice(0, 10) === iso)) {
        streak++;
      } else {
        break;
      }
    }
    return streak;
  }, [checkins]);
}

