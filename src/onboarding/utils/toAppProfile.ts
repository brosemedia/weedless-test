import { costPerDay, gramsPerDay } from './calculations';
import type { OnboardingProfile, Unit } from '../types';
import type { Profile } from '../../types/profile';
import { CURRENT_VERSION } from '../../store/app';

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
  const grams = sanitize(gramsPerDay(profile));
  const divisor = UNIT_DIVISOR[profile.consumption.frequency.unit ?? 'week'] ?? 7;
  const jointsPerUnit = sanitize(profile.consumption.frequency.jointsPerUnit);
  const jointsPerDay = jointsPerUnit != null ? jointsPerUnit / divisor : undefined;

  const gramsPerJoint = sanitize(profile.consumption.frequency.gramsPerJoint) ?? DEFAULT_GRAMS_PER_JOINT;
  const cost = costPerDay(profile).value;
  const pricePerGram = grams && grams > 0 ? cost / grams : undefined;
  const costPerJoint = pricePerGram ? pricePerGram * gramsPerJoint : undefined;

  const startTimestampRaw = profile.quitDateISO ? Date.parse(profile.quitDateISO) : Date.now();
  const startTimestamp = Number.isFinite(startTimestampRaw) ? startTimestampRaw : Date.now();

  const locale = profile.region?.toLowerCase().startsWith('de') ? 'de-DE' : 'de-DE';

  return {
    pricePerGram,
    costPerJoint,
    gramsPerDayBaseline: grams,
    jointsPerDayBaseline: jointsPerDay,
    avgSessionMinutes: DEFAULT_AVG_SESSION_MINUTES,
    startTimestamp,
    lastConsumptionAt: startTimestamp,
    locale,
    version: CURRENT_VERSION,
  };
}
