import * as React from 'react';
import type { ImageStyle, TextStyle, ViewStyle } from 'react-native';
import { useTheme } from './useTheme';
import type { ThemeColors } from './themes';

type NamedStyles<T> = { [P in keyof T]: ViewStyle | TextStyle | ImageStyle };

export function useThemedStyles<T extends NamedStyles<T>>(
  factory: (colors: ThemeColors) => T
): T {
  const {
    theme: { colors },
  } = useTheme();
  return React.useMemo(() => factory(colors), [factory, colors]);
}
