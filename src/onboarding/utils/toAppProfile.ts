import { costPerDay, gramsPerDay } from './calculations';
import type { OnboardingProfile, Unit } from '../types';
import type { Profile } from '../../types/profile';
import { CURRENT_VERSION } from '../../store/app';
import { getDeviceLocaleString } from '../../store/profileUtils';

const UNIT_DIVISOR: Record<Unit, number> = {
  day: 1,
  week: 7,
  month: 30,
};

const DEFAULT_GRAMS_PER_JOINT = 0.25;
const DEFAULT_AVG_SESSION_MINUTES = 12;

const sanitize = (value?: number | null) =>
  Number.isFinite(value as number) && (value as number) > 0 ? (value as number) : undefined;

export function onboardingProfileToAppProfile(profile: OnboardingProfile): Profile {
  const gramsRaw = gramsPerDay(profile);
  const grams = sanitize(gramsRaw);
  
  // Debug: Log if grams is 0 or undefined
  if (!grams || grams === 0) {
    console.warn('gramsPerDay is 0 or undefined:', {
      gramsRaw,
      consumptionMethods: profile.consumptionMethods,
      consumptionDetails: profile.consumptionDetails,
      legacyFrequency: profile.consumption?.frequency,
    });
  }
  
  // Berechne jointsPerDay aus neuen Feldern oder Legacy-Feldern
  let jointsPerDay: number | undefined;
  let gramsPerJoint: number;
  
  // Neue Felder verwenden
  if (profile.consumptionMethods && profile.consumptionMethods.length > 0 && profile.consumptionDetails) {
    let totalJointsPerWeek = 0;
    let totalGramsPerWeek = 0;
    
    profile.consumptionMethods.forEach((method) => {
      const details = profile.consumptionDetails[method];
      if (!details) return;
      
      switch (method) {
        case 'joints':
        case 'blunts':
          if (details.jointsPerWeek) {
            totalJointsPerWeek += details.jointsPerWeek;
            if (details.gramsPerJoint) {
              totalGramsPerWeek += details.jointsPerWeek * details.gramsPerJoint;
            }
          }
          break;
        case 'bongs':
        case 'pipes':
          if (details.sessionsPerWeek && details.gramsPerSession) {
            // Konvertiere Sessions zu Joints (ungefähr)
            const gramsPerSession = details.gramsPerSession;
            const estimatedJoints = gramsPerSession / DEFAULT_GRAMS_PER_JOINT;
            totalJointsPerWeek += details.sessionsPerWeek * estimatedJoints;
            totalGramsPerWeek += details.sessionsPerWeek * gramsPerSession;
          }
          break;
      }
    });
    
    if (totalJointsPerWeek > 0) {
      jointsPerDay = totalJointsPerWeek / 7;
    }
    
    if (totalGramsPerWeek > 0 && totalJointsPerWeek > 0) {
      gramsPerJoint = totalGramsPerWeek / totalJointsPerWeek;
    } else {
      gramsPerJoint = DEFAULT_GRAMS_PER_JOINT;
    }
  } else {
    // Fallback: Legacy-Felder verwenden
    const divisor = UNIT_DIVISOR[profile.consumption?.frequency?.unit ?? 'week'] ?? 7;
    const jointsPerUnit = sanitize(profile.consumption?.frequency?.jointsPerUnit);
    jointsPerDay = jointsPerUnit != null ? jointsPerUnit / divisor : undefined;
    gramsPerJoint = sanitize(profile.consumption?.frequency?.gramsPerJoint) ?? DEFAULT_GRAMS_PER_JOINT;
  }

  const cost = costPerDay(profile).value;
  const pricePerGram = grams && grams > 0 ? cost / grams : undefined;
  const costPerJoint = pricePerGram ? pricePerGram * gramsPerJoint : undefined;

  const startIso = profile.quitDateISO ?? profile.lastConsumptionISO;
  const startTimestampRaw = startIso ? Date.parse(startIso) : Date.now();
  const startTimestamp = Number.isFinite(startTimestampRaw) ? startTimestampRaw : Date.now();
  const moneyCalculationStartTimestamp = startTimestamp;

  // Letzter Konsum: Verwende lastConsumptionISO falls vorhanden, sonst startTimestamp (falls kein Konsum seit Start)
  const lastConsumptionRaw = profile.lastConsumptionISO
    ? Date.parse(profile.lastConsumptionISO)
    : startTimestamp;
  const lastConsumptionAt = Number.isFinite(lastConsumptionRaw) ? lastConsumptionRaw : startTimestamp;

  const hoursSinceStart = Math.max(0, Math.floor((Date.now() - startTimestamp) / 3_600_000));
  const longestStreakHours = hoursSinceStart;

  // Determine locale: use device locale if region suggests English, otherwise use German
  // This is a simple heuristic - the actual locale should be set in the profile
  const deviceLocale = getDeviceLocaleString();
  const locale = deviceLocale.startsWith('en') ? 'en-US' : 'de-DE';

  return {
    pricePerGram,
    costPerJoint,
    gramsPerDayBaseline: grams,
    jointsPerDayBaseline: jointsPerDay,
    avgSessionMinutes: DEFAULT_AVG_SESSION_MINUTES,
    startTimestamp,
    moneyCalculationStartTimestamp,
    longestStreakHours,
    lastConsumptionAt,
    locale,
    consumptionMethods: profile.consumptionMethods,
    cloudSyncConsent: profile.cloudSyncConsent ?? false,
    subscriptionPlan: profile.subscriptionPlan ?? 'none',
    version: CURRENT_VERSION,
  };
}
