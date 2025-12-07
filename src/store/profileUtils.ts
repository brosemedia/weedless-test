import type { Baseline, Profile } from '../types';
import { getDeviceLocale } from '../onboarding/i18n';

export const DEFAULT_GRAMS_PER_JOINT = 0.35;
export const DEFAULT_PRICE_PER_GRAM = 10;
export const DEFAULT_LOCALE = 'de-DE';
export const DEFAULT_CURRENCY = 'EUR';
export const DEFAULT_AVG_SESSION_MINUTES = 12;

export const nowISO = () => new Date().toISOString();

/**
 * Gets the device locale string (e.g., 'en-US', 'de-DE')
 */
export function getDeviceLocaleString(): string {
  try {
    const deviceLocale = Intl.DateTimeFormat().resolvedOptions().locale;
    const lang = deviceLocale.split('-')[0].toLowerCase();
    const region = deviceLocale.split('-')[1]?.toUpperCase() || (lang === 'en' ? 'US' : 'DE');
    return `${lang}-${region}`;
  } catch {
    return DEFAULT_LOCALE;
  }
}

export const normalizeProfile = (profile: Profile): Profile => {
  // If no locale is set, detect device locale
  // Only override if locale is explicitly empty/null/undefined, not if it's already set
  // Preserve the locale if it's already set (even if it's an empty string, we want to keep user's choice)
  const locale = (profile.locale && profile.locale.trim()) ? profile.locale : getDeviceLocaleString();
  const currency = profile.currency || DEFAULT_CURRENCY;
  const pauseStartISO = profile.pauseStartISO || profile.startedAt || nowISO();
  const baselineUnit = profile.baseline?.unit ?? 'g';
  const gramsPerJoint =
    Number.isFinite(profile.gramsPerJoint) && (profile.gramsPerJoint as number) > 0
      ? (profile.gramsPerJoint as number)
      : DEFAULT_GRAMS_PER_JOINT;
  const baselinePricePerUnit =
    Number.isFinite(profile.baseline?.pricePerUnit) && profile.baseline.pricePerUnit > 0
      ? profile.baseline.pricePerUnit
      : DEFAULT_PRICE_PER_GRAM;
  const baselineAmount =
    Number.isFinite(profile.baseline?.amountPerDay) && profile.baseline.amountPerDay >= 0
      ? profile.baseline.amountPerDay
      : 0;

  const derivedPricePerGram =
    Number.isFinite(profile.pricePerGram) && (profile.pricePerGram as number) > 0
      ? (profile.pricePerGram as number)
      : baselineUnit === 'g'
      ? baselinePricePerUnit
      : baselinePricePerUnit / Math.max(gramsPerJoint, 0.0001);

  const derivedGramsPerDay =
    Number.isFinite(profile.gramsPerDayBaseline) && (profile.gramsPerDayBaseline as number) >= 0
      ? (profile.gramsPerDayBaseline as number)
      : baselineUnit === 'g'
      ? baselineAmount
      : baselineAmount * gramsPerJoint;

  const derivedJointsPerDay =
    Number.isFinite(profile.jointsPerDayBaseline) && (profile.jointsPerDayBaseline as number) >= 0
      ? (profile.jointsPerDayBaseline as number)
      : gramsPerJoint > 0
      ? derivedGramsPerDay / gramsPerJoint
      : 0;

  const avgSessionMinutes =
    Number.isFinite(profile.avgSessionMinutes) && (profile.avgSessionMinutes as number) > 0
      ? (profile.avgSessionMinutes as number)
      : DEFAULT_AVG_SESSION_MINUTES;

  const normalizedBaseline: Baseline = {
    unit: baselineUnit,
    amountPerDay: baselineUnit === 'g' ? derivedGramsPerDay : derivedJointsPerDay,
    pricePerUnit: baselineUnit === 'g' ? derivedPricePerGram : derivedPricePerGram * gramsPerJoint,
  };

  return {
    ...profile,
    locale,
    currency,
    pauseStartISO,
    gramsPerJoint,
    pricePerGram: derivedPricePerGram,
    gramsPerDayBaseline: derivedGramsPerDay,
    jointsPerDayBaseline: derivedJointsPerDay,
    avgSessionMinutes,
    baseline: normalizedBaseline,
  };
};

export const mergeProfile = (current: Profile, patch: Partial<Profile>): Profile => {
  const next: Profile = {
    ...current,
    ...patch,
    baseline: patch.baseline ? { ...current.baseline, ...patch.baseline } : current.baseline,
  };
  return normalizeProfile(next);
};

export const createInitialProfile = (): Profile =>
  normalizeProfile({
    startedAt: nowISO(),
    goalMode: 'quit',
    baseline: { unit: 'g', amountPerDay: 0.6, pricePerUnit: DEFAULT_PRICE_PER_GRAM },
    savingGoal: undefined,
    currency: DEFAULT_CURRENCY,
    locale: DEFAULT_LOCALE,
    pauseStartISO: nowISO(),
    pricePerGram: DEFAULT_PRICE_PER_GRAM,
    gramsPerDayBaseline: 0.6,
    jointsPerDayBaseline: 2,
    gramsPerJoint: DEFAULT_GRAMS_PER_JOINT,
    avgSessionMinutes: DEFAULT_AVG_SESSION_MINUTES,
  } as Profile);
