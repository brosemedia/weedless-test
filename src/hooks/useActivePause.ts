import { useApp } from '../store/app';
import type { Pause } from '../types/pause';

export function useActivePause(): Pause | undefined {
  return useApp((state) => state.pauses.find((pause) => pause.status === 'aktiv'));
}
