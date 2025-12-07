import React from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { themes, type ThemeMode, type AppTheme } from './themes';
import { applyThemeToLegacyColors } from '../design/tokens';

const STORAGE_KEY = 'hazeless_theme_mode';

type ThemeContextValue = {
  mode: ThemeMode;
  theme: AppTheme;
  setMode: (mode: ThemeMode) => void;
  toggleMode: () => void;
};

const ThemeContext = React.createContext<ThemeContextValue>({
  mode: 'light',
  theme: themes.light,
  setMode: () => {},
  toggleMode: () => {},
});

const loadStoredMode = async (): Promise<ThemeMode | null> => {
  try {
    const stored = await AsyncStorage.getItem(STORAGE_KEY);
    if (stored === 'light' || stored === 'dark') {
      return stored;
    }
  } catch (error) {
    console.warn('Failed to load theme mode', error);
  }
  return null;
};

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [mode, setModeState] = React.useState<ThemeMode>('light');

  React.useEffect(() => {
    let mounted = true;
    loadStoredMode().then((stored) => {
      if (mounted && stored) {
        setModeState(stored);
      }
    });
    return () => {
      mounted = false;
    };
  }, []);

  const setMode = React.useCallback((next: ThemeMode) => {
    setModeState(next);
    AsyncStorage.setItem(STORAGE_KEY, next).catch((error) => {
      console.warn('Failed to persist theme mode', error);
    });
  }, []);

  const toggleMode = React.useCallback(() => {
    setMode(mode === 'light' ? 'dark' : 'light');
  }, [mode, setMode]);

  const theme = themes[mode];
  applyThemeToLegacyColors(theme.colors as any);

  const value = React.useMemo(
    () => ({
      mode,
      theme,
      setMode,
      toggleMode,
    }),
    [mode, theme, setMode, toggleMode]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
};

export const useThemeContext = () => React.useContext(ThemeContext);
