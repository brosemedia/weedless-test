import { strings as deStrings } from './de';
import { strings as enStrings } from './en';

export type Locale = 'de' | 'en';

export const translations = {
  de: deStrings,
  en: enStrings,
};

/**
 * Gets the locale from a locale string (e.g., 'de-DE' -> 'de', 'en-US' -> 'en')
 */
export function getLocaleFromString(locale: string): Locale {
  const lang = locale.split('-')[0].toLowerCase();
  return lang === 'en' ? 'en' : 'de'; // Default to German if not English
}

/**
 * Gets the device locale
 */
export function getDeviceLocale(): Locale {
  try {
    const deviceLocale = Intl.DateTimeFormat().resolvedOptions().locale;
    return getLocaleFromString(deviceLocale);
  } catch {
    return 'de'; // Default to German
  }
}

/**
 * Gets the strings for a given locale
 */
export function getStrings(locale?: string | Locale) {
  if (!locale) {
    return translations.de; // Default
  }
  
  const lang = typeof locale === 'string' ? getLocaleFromString(locale) : locale;
  return translations[lang] || translations.de;
}

export { strings } from './de'; // Default export for backward compatibility

