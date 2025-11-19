import { format, addDays, isBefore } from 'date-fns';
import { de as deLocale } from 'date-fns/locale';

const regionCurrencyFallback: Record<string, string> = {
  DE: 'EUR',
  AT: 'EUR',
  CH: 'CHF',
  US: 'USD',
  CA: 'CAD',
  GB: 'GBP',
  AU: 'AUD',
};

export const formatCurrency = (value: number, currency: string, locale = 'de-DE') => {
  try {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency,
      maximumFractionDigits: 2,
      minimumFractionDigits: 2,
    }).format(value);
  } catch {
    return `${value.toFixed(2)} ${currency}`;
  }
};

export const formatDate = (date: Date) => format(date, 'PPP', { locale: deLocale });

export const formatTime = (date: Date) => format(date, 'HH:mm');

export const formatTimeString = (time?: string) => time ?? '';

export const timeStringToDate = (time: string, base: Date = new Date()) => {
  const [hour, minute] = time.split(':').map((part) => Number(part));
  const target = new Date(base);
  target.setHours(hour || 0, minute || 0, 0, 0);
  return target;
};

export const nextOccurrenceFromTime = (time: string, base: Date = new Date()) => {
  const target = timeStringToDate(time, base);
  if (isBefore(target, base)) {
    return addDays(target, 1);
  }
  return target;
};

export const getLocaleDefaults = () => {
  const resolved = Intl.DateTimeFormat().resolvedOptions().locale ?? 'de-DE';
  const parts = resolved.split('-');
  const region = (parts.length > 1 ? parts[1] : 'DE').toUpperCase();
  const currency = regionCurrencyFallback[region] ?? 'EUR';
  return { region, currency };
};

export const unitLabels: Record<string, string> = {
  day: 'Tag',
  week: 'Woche',
  month: 'Monat',
};
