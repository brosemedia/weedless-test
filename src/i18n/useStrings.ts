import { useMemo } from 'react';
import { useStore } from '../store/useStore';
import { getStrings } from './index';
import { getDeviceLocaleString } from '../store/profileUtils';

/**
 * Hook to get translated strings for the main app (not onboarding)
 */
export function useAppStrings() {
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

