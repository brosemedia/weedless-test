import { addDays, differenceInCalendarDays, parseISO, isValid, startOfDay } from 'date-fns';
import type { OnboardingProfile, Unit, CostEstimateResult, SavingsResult } from '../types';
import { DEFAULT_GRAMS_PER_JOINT, DEFAULT_POTENCY_THC } from './validators';

const UNIT_DIVISOR: Record<Unit, number> = {
  day: 1,
  week: 7,
  month: 30,
};

const SESSION_GRAM_ESTIMATE = 0.25;
const HIT_GRAM_ESTIMATE = 0.1;

const REGION_PRICE_PER_GRAM: Record<string, number> = {
  EUR: 10,
  USD: 12,
  CHF: 11,
  GBP: 11,
};

const normalizeValue = (value?: number | null) => (value && Number.isFinite(value) ? value : 0);

export const gramsPerDay = (profile: OnboardingProfile): number => {
  const { frequency } = profile.consumption;
  const divisor = UNIT_DIVISOR[frequency.unit ?? 'week'];
  const joints =
    normalizeValue(frequency.jointsPerUnit) *
    (frequency.gramsPerJoint ?? DEFAULT_GRAMS_PER_JOINT);
  const sessions = normalizeValue(frequency.sessionsPerUnit) * SESSION_GRAM_ESTIMATE;
  const hits = normalizeValue(frequency.hitsPerUnit) * HIT_GRAM_ESTIMATE;
  const portions =
    normalizeValue(frequency.portionsPerUnit) *
    (normalizeValue(frequency.mgPerPortion) / 1000);
  const total = joints + sessions + hits + portions;
  return total / divisor;
};

export const thcMgPerDay = (profile: OnboardingProfile): number => {
  const grams = gramsPerDay(profile);
  const potency = profile.consumption.frequency.potencyTHC ?? DEFAULT_POTENCY_THC;
  const primary = grams * (potency / 100) * 1000;
  const divisor = UNIT_DIVISOR[profile.consumption.frequency.unit ?? 'week'];
  const edibles =
    normalizeValue(profile.consumption.frequency.portionsPerUnit) *
    normalizeValue(profile.consumption.frequency.mgPerPortion);
  return primary + edibles / divisor;
};

export const costPerDay = (profile: OnboardingProfile): CostEstimateResult => {
  const spend = profile.spend;
  if (spend?.amount != null) {
    const divisor = UNIT_DIVISOR[spend.unit ?? 'week'];
    return {
      value: spend.amount / divisor,
      confidence: 'high',
      source: 'user',
    };
  }
  const grams = gramsPerDay(profile);
  if (grams <= 0) {
    return { value: 0, confidence: 'low', source: 'estimate' };
  }
  const price = REGION_PRICE_PER_GRAM[profile.currency] ?? 10;
  return {
    value: grams * price,
    confidence: grams > 1 ? 'mid' : 'low',
    source: 'estimate',
  };
};

export const savingsSinceQuit = (
  profile: OnboardingProfile,
  now: Date = new Date()
): SavingsResult => {
  if (!profile.quitDateISO) {
    return { amount: 0, days: 0 };
  }
  const quitDate = parseISO(profile.quitDateISO);
  if (!isValid(quitDate)) {
    return { amount: 0, days: 0 };
  }
  const days = Math.max(
    0,
    differenceInCalendarDays(startOfDay(now), startOfDay(quitDate))
  );
  const cost = costPerDay(profile).value;
  return { amount: Number((cost * days).toFixed(2)), days };
};

export const pauseEndDate = (profile: OnboardingProfile): Date | undefined => {
  if (profile.goal !== 'pause' || profile.pauseLengthDays == null) {
    return undefined;
  }
  const base = profile.quitDateISO ? parseISO(profile.quitDateISO) : new Date();
  if (!isValid(base)) {
    return undefined;
  }
  return addDays(base, profile.pauseLengthDays);
};
