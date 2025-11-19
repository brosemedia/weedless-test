import { useEffect } from 'react';
import { useUiStore } from '../store/ui';

export function useQuickActionsVisibility(key: string, hidden: boolean) {
  const hideQuickActions = useUiStore((state) => state.hideQuickActions);
  const showQuickActions = useUiStore((state) => state.showQuickActions);

  useEffect(() => {
    if (hidden) {
      hideQuickActions(key);
    } else {
      showQuickActions(key);
    }
    return () => {
      showQuickActions(key);
    };
  }, [hidden, key, hideQuickActions, showQuickActions]);
}
