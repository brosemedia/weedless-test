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
  // Neue Felder verwenden, falls vorhanden
  if (profile.consumptionMethods && profile.consumptionMethods.length > 0 && profile.consumptionDetails) {
    let totalGramsPerWeek = 0;
    
    // Berechne aus consumptionDetails
    profile.consumptionMethods.forEach((method) => {
      const details = profile.consumptionDetails[method];
      if (!details) return;
      
      switch (method) {
        case 'joints':
        case 'blunts':
          if (details.jointsPerWeek && details.gramsPerJoint) {
            totalGramsPerWeek += details.jointsPerWeek * details.gramsPerJoint;
          }
          break;
        case 'bongs':
        case 'pipes':
          if (details.sessionsPerWeek && details.gramsPerSession) {
            totalGramsPerWeek += details.sessionsPerWeek * details.gramsPerSession;
          }
          break;
        case 'edibles':
          if (details.ediblesPerWeek && details.mgTHCPerPortion) {
            // Konvertiere mg THC zu Gramm (ungefähr, da wir die Potenz nicht genau kennen)
            // Verwende einen Schätzwert: 1g = ~100mg THC bei 10% Potenz
            totalGramsPerWeek += (details.ediblesPerWeek * details.mgTHCPerPortion) / 100;
          }
          break;
        case 'vapes':
          if (details.vapeSessionsPerWeek) {
            // Schätzung: ~0.1g pro Vape-Session
            totalGramsPerWeek += details.vapeSessionsPerWeek * 0.1;
          }
          break;
        case 'capsules':
          if (details.capsulesPerWeek && details.mgTHCPerCapsule) {
            // Konvertiere mg THC zu Gramm
            totalGramsPerWeek += (details.capsulesPerWeek * details.mgTHCPerCapsule) / 100;
          }
          break;
        case 'oils':
        case 'dabs':
          if (details.oilSessionsPerWeek) {
            // Schätzung: ~0.05g pro Oil/Dab-Session
            totalGramsPerWeek += details.oilSessionsPerWeek * 0.05;
          }
          break;
      }
    });
    
    if (totalGramsPerWeek > 0) {
      return totalGramsPerWeek / 7; // Konvertiere von Woche zu Tag
    }
  }
  
  // Fallback: Legacy-Felder verwenden
  if (!profile.consumption || !profile.consumption.frequency) {
    return 0;
  }
  
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
  // Neue Felder verwenden, falls vorhanden
  if (profile.weeklySpend && profile.weeklySpend > 0) {
    return {
      value: profile.weeklySpend / 7,
      confidence: 'high',
      source: 'user',
    };
  }
  
  // Fallback: Legacy-Felder verwenden
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
