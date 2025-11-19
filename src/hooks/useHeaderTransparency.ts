import React from 'react';
import type { NativeSyntheticEvent, NativeScrollEvent } from 'react-native';
import { useUiStore } from '../store/ui';

export function useHeaderTransparency(threshold: number = 6) {
  const setHeaderAtTop = useUiStore((s) => s.setHeaderAtTop);
  const stateRef = React.useRef(true);

  const updateState = React.useCallback(
    (next: boolean) => {
      if (stateRef.current === next) {
        return;
      }
      stateRef.current = next;
      setHeaderAtTop(next);
    },
    [setHeaderAtTop]
  );

  const handleScroll = React.useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      const offsetY = event.nativeEvent?.contentOffset?.y ?? 0;
      updateState(offsetY <= threshold);
    },
    [threshold, updateState]
  );

  const setIsAtTop = React.useCallback(
    (value: boolean) => {
      updateState(value);
    },
    [updateState]
  );

  React.useEffect(() => {
    stateRef.current = true;
    setHeaderAtTop(true);
    return () => {
      stateRef.current = false;
      setHeaderAtTop(false);
    };
  }, [setHeaderAtTop]);

  return { handleScroll, setIsAtTop };
}
