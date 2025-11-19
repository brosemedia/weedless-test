import { useEffect } from 'react';
import { useApp } from '../store/app';

export const usePauseEngine = () => {
  const syncPauseProgress = useApp((s) => s.syncPauseProgress);

  useEffect(() => {
    syncPauseProgress();
  }, [syncPauseProgress]);
};
