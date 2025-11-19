import { useApp } from '../store/app';
import { DayLog, Profile } from '../types/profile';
import { GRAMS_PER_JOINT_DEFAULT } from './tasks';

const HOUR = 3_600_000;

const gramsPerHour = (p: Profile) => {
  if (p.gramsPerDayBaseline) return p.gramsPerDayBaseline / 24;
  if (p.jointsPerDayBaseline) return (p.jointsPerDayBaseline * GRAMS_PER_JOINT_DEFAULT) / 24;
  return 0;
};

const gramsPerJoint = (profile: Profile) => {
  if (profile.gramsPerDayBaseline && profile.jointsPerDayBaseline) {
    const ratio = profile.gramsPerDayBaseline / Math.max(1, profile.jointsPerDayBaseline);
    if (Number.isFinite(ratio) && ratio > 0) return ratio;
  }
  return GRAMS_PER_JOINT_DEFAULT;
};

const consumedGramsFromLog = (log: DayLog, gramsPerJointValue: number) => {
  if (typeof log.consumedGrams === 'number') return log.consumedGrams;
  if (typeof log.consumedJoints === 'number') return log.consumedJoints * gramsPerJointValue;
  return 0;
};

const consumedJointsFromLog = (log: DayLog, gramsPerJointValue: number) => {
  if (typeof log.consumedJoints === 'number') return log.consumedJoints;
  if (typeof log.consumedGrams === 'number' && gramsPerJointValue > 0) {
    return log.consumedGrams / gramsPerJointValue;
  }
  return 0;
};

const aggregateLogTotals = (logs: Record<string, DayLog>, gramsPerJointValue: number) =>
  Object.values(logs).reduce(
    (acc, log) => {
      acc.grams += consumedGramsFromLog(log, gramsPerJointValue);
      acc.joints += consumedJointsFromLog(log, gramsPerJointValue);
      acc.minutes += log.sessionMinutes ?? 0;
      acc.moneySpent += log.moneySpentEUR ?? 0;
      return acc;
    },
    { grams: 0, joints: 0, minutes: 0, moneySpent: 0 }
  );

export const useStats = () => {
  const profile = useApp((s) => s.profile);
  const logs = useApp((s) => s.dayLogs);
  if (!profile) return null;

  const now = Date.now();
  const hours = (now - profile.startTimestamp) / HOUR;
  const gramsPerJointValue = gramsPerJoint(profile);
  const totals = aggregateLogTotals(logs, gramsPerJointValue);

  const expectedGrams = hours * gramsPerHour(profile);
  const savedGrams = Math.max(0, expectedGrams - totals.grams);
  const jointsPerDayBaseline =
    profile.jointsPerDayBaseline ??
    (profile.gramsPerDayBaseline && gramsPerJointValue > 0
      ? profile.gramsPerDayBaseline / gramsPerJointValue
      : 0);
  const expectedJoints = jointsPerDayBaseline ? hours * (jointsPerDayBaseline / 24) : 0;
  const savedJoints = Math.max(0, expectedJoints - totals.joints);

  const pricePerGram =
    profile.pricePerGram ??
    (profile.costPerJoint ? profile.costPerJoint / GRAMS_PER_JOINT_DEFAULT : 0);

  const savedMoney = Math.max(0, savedGrams * pricePerGram - totals.moneySpent);

  const expectedSessionMinutes =
    jointsPerDayBaseline > 0 && (profile.avgSessionMinutes ?? 0) > 0
      ? hours * ((jointsPerDayBaseline / 24) * profile.avgSessionMinutes!)
      : 0;
  const minutesSaved = Math.max(0, expectedSessionMinutes - totals.minutes);

  const locale = profile.locale ?? 'de-DE';
  return {
    profile,
    hours,
    savedMoney,
    savedGrams,
    savedJoints,
    minutesSaved,
    fmtEUR: (v: number) =>
      new Intl.NumberFormat(locale, {
        style: 'currency',
        currency: 'EUR',
        maximumFractionDigits: 2,
      }).format(v),
    fmtG: (g: number) => (g < 1 ? g.toFixed(3) : g.toFixed(1)),
    fmtJ: (j: number) => (j < 10 ? j.toFixed(1) : Math.round(j).toString()),
    fmtMM: (m: number) => {
      const total = Math.floor(m);
      const hh = Math.floor(total / 60)
        .toString()
        .padStart(2, '0');
      const mm = (total % 60).toString().padStart(2, '0');
      return `${hh}:${mm}`;
    },
  };
};
