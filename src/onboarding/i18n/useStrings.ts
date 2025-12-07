import { useMemo } from 'react';
import { useStore } from '../../store/useStore';
import { getStrings, getDeviceLocale, getLocaleFromString, type Locale } from './index';
import { getDeviceLocaleString } from '../../store/profileUtils';

/**
 * Hook to get translated strings based on the current profile locale or device locale
 */
export function useStrings() {
  const profileLocale = useStore((state) => state.profile.locale);
  
  const strings = useMemo(() => {
    // If profile has a locale, use it; otherwise use device locale string
    if (profileLocale) {
      return getStrings(profileLocale);
    }
    // Fallback to device locale
    const deviceLocaleString = getDeviceLocaleString();
    return getStrings(deviceLocaleString);
  }, [profileLocale]);

  return strings;
}

/**
 * Hook to get the current locale
 */
export function useLocale(): Locale {
  const profileLocale = useStore((state) => state.profile.locale);
  const { getLocaleFromString } = require('./index');
  
  return useMemo(() => {
    if (profileLocale) {
      return getLocaleFromString(profileLocale);
    }
    return getDeviceLocale();
  }, [profileLocale]);
}

