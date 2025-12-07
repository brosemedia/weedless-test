import { strings as deStrings } from './de';
import { strings as enStrings } from './en';
import { getLocaleFromString, type Locale } from '../onboarding/i18n';

export const translations = {
  de: deStrings,
  en: enStrings,
};

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

