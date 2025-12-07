import { useApp } from '../store/app';

/**
 * Hook, der true zurückgibt, wenn aktuell eine aktive Pause existiert
 */
export function useHasActivePause(): boolean {
  return useApp((state) => state.pauses.some((pause) => pause.status === 'aktiv'));
}

