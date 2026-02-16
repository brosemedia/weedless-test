import { useMemo } from 'react';

import { useApp } from '../store/app';
import { DayLog, Profile } from '../types/profile';
import { GRAMS_PER_JOINT_DEFAULT } from './tasks';

const HOUR = 3_600_000;

const gramsPerHour = (p: Profile) => {
  if (p.gramsPerDayBaseline != null && p.gramsPerDayBaseline > 0) {
    const result = p.gramsPerDayBaseline / 24;
    return result;
  }
  if (p.jointsPerDayBaseline != null && p.jointsPerDayBaseline > 0) {
    const result = (p.jointsPerDayBaseline * GRAMS_PER_JOINT_DEFAULT) / 24;
    return result;
  }
  // Debug: Log if both are missing
  if (!p.gramsPerDayBaseline && !p.jointsPerDayBaseline) {
    console.warn('gramsPerHour: Both baseline values are missing', {
      gramsPerDayBaseline: p.gramsPerDayBaseline,
      jointsPerDayBaseline: p.jointsPerDayBaseline,
      profileKeys: Object.keys(p),
    });
  }
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

const dateKeyToTimestamp = (key: string): number | null => {
  const [year, month, day] = key.split('-').map((part) => parseInt(part, 10));
  if (!Number.isFinite(year) || !Number.isFinite(month) || !Number.isFinite(day)) {
    return null;
  }
  // Verwende Ende des Tages (23:59:59.999) als Timestamp
  return new Date(year, month - 1, day, 23, 59, 59, 999).getTime();
};

const aggregateLogTotals = (
  logs: Record<string, DayLog>,
  gramsPerJointValue: number,
  startTimestamp: number
) =>
  Object.values(logs).reduce(
    (acc, log) => {
      // Nur Logs berücksichtigen, die nach startTimestamp liegen
      const logTimestamp = dateKeyToTimestamp(log.date);
      if (logTimestamp === null || logTimestamp < startTimestamp) {
        return acc;
      }
      
      acc.grams += consumedGramsFromLog(log, gramsPerJointValue);
      acc.joints += consumedJointsFromLog(log, gramsPerJointValue);
      acc.minutes += log.sessionMinutes ?? 0;
      acc.moneySpent += log.moneySpentEUR ?? 0;
      return acc;
    },
    { grams: 0, joints: 0, minutes: 0, moneySpent: 0 }
  );

export const useStats = (nowOverride?: number) => {
  const profile = useApp((s) => s.profile);
  const logs = useApp((s) => s.dayLogs);
  const now = nowOverride ?? Date.now();

  return useMemo(() => {
    if (!profile) return null;

    const startTimestamp = Number.isFinite(profile.startTimestamp) ? profile.startTimestamp : now;
    const moneyStartTimestamp = Number.isFinite(profile.moneyCalculationStartTimestamp)
      ? (profile.moneyCalculationStartTimestamp as number)
      : startTimestamp;

    const hoursSinceStart = (now - startTimestamp) / HOUR;
    const hours = Math.max(0, hoursSinceStart);
    const hoursSinceMoneyStart = (now - moneyStartTimestamp) / HOUR;
    const hoursMoney = Math.max(0, hoursSinceMoneyStart);
    const gramsPerJointValue = gramsPerJoint(profile);
    const gramsPerHourValue = gramsPerHour(profile);

    const totals = aggregateLogTotals(logs, gramsPerJointValue, startTimestamp);
    const moneyTotals = aggregateLogTotals(logs, gramsPerJointValue, moneyStartTimestamp);

    const debugKey = `kpi-debug-${Math.floor(hours * 60)}`;
    if (hours > 0.001 && gramsPerHourValue > 0 && !(global as any)[debugKey]) {
      (global as any)[debugKey] = true;
      const expectedGrams = hours * gramsPerHourValue;
      const savedGrams = Math.max(0, expectedGrams - totals.grams);
      if (savedGrams === 0 && expectedGrams > 0) {
        console.warn('KPI-Debug: savedGrams ist 0, obwohl expectedGrams > 0:', {
          hours,
          gramsPerHourValue,
          expectedGrams,
          totalsGrams: totals.grams,
          savedGrams,
          startTimestamp: profile.startTimestamp,
          now,
          diff: now - profile.startTimestamp,
        });
      }
    }

    if (gramsPerHourValue === 0 && hours > 0.01 && !(global as any)['baseline-warning-logged']) {
      (global as any)['baseline-warning-logged'] = true;
      console.warn('KPI-Berechnung: Baseline-Werte fehlen!', {
        gramsPerDayBaseline: profile.gramsPerDayBaseline,
        jointsPerDayBaseline: profile.jointsPerDayBaseline,
        startTimestamp: profile.startTimestamp,
        hours,
      });
    }

    const expectedGrams = hours * gramsPerHourValue;
    const expectedGramsMoney = hoursMoney * gramsPerHourValue;
    const savedGrams = Math.max(0, expectedGramsMoney - moneyTotals.grams);

    const jointsPerDayBaseline =
      profile.jointsPerDayBaseline ??
      (profile.gramsPerDayBaseline && gramsPerJointValue > 0
        ? profile.gramsPerDayBaseline / gramsPerJointValue
        : 0);
    const expectedJoints = jointsPerDayBaseline ? hours * (jointsPerDayBaseline / 24) : 0;
    const expectedJointsMoney = jointsPerDayBaseline ? hoursMoney * (jointsPerDayBaseline / 24) : 0;
    const savedJoints = Math.max(0, expectedJointsMoney - moneyTotals.joints);

    const pricePerGram =
      profile.pricePerGram ??
      (profile.costPerJoint ? profile.costPerJoint / GRAMS_PER_JOINT_DEFAULT : 0);

    const savedMoney = Math.max(0, savedGrams * pricePerGram - moneyTotals.moneySpent);

    const expectedSessionMinutes =
      jointsPerDayBaseline > 0 && (profile.avgSessionMinutes ?? 0) > 0
        ? hours * ((jointsPerDayBaseline / 24) * profile.avgSessionMinutes!)
        : 0;
    const minutesSaved = Math.max(0, expectedSessionMinutes - totals.minutes);

    const allZeroKey = 'kpi-all-zero-debug';
    if (
      savedGrams === 0 &&
      savedJoints === 0 &&
      savedMoney === 0 &&
      hours > 0.001 &&
      gramsPerHourValue > 0 &&
      !(global as any)[allZeroKey]
    ) {
      (global as any)[allZeroKey] = true;
      console.warn('🔍 KPI-Debug: Alle Werte sind 0, obwohl Baseline vorhanden ist:', {
        hours,
        hoursSinceStart,
        gramsPerHourValue,
        expectedGrams,
        totalsGrams: totals.grams,
        savedGrams,
        startTimestamp: profile.startTimestamp,
        now,
        diffMs: now - profile.startTimestamp,
        diffHours: hoursSinceStart,
        isFuture: hoursSinceStart < 0,
        gramsPerDayBaseline: profile.gramsPerDayBaseline,
        jointsPerDayBaseline: profile.jointsPerDayBaseline,
        pricePerGram: profile.pricePerGram,
      });
    }

    const locale = profile.locale ?? 'de-DE';
    const fmtEUR = (v: number) =>
      new Intl.NumberFormat(locale, {
        style: 'currency',
        currency: 'EUR',
        maximumFractionDigits: 2,
      }).format(v);
    const fmtG = (g: number) => {
      const fractionDigits = g < 1 ? 3 : 1;
      return new Intl.NumberFormat(locale, {
        minimumFractionDigits: fractionDigits,
        maximumFractionDigits: fractionDigits,
      }).format(g);
    };
    const fmtJ = (j: number) => {
      if (j < 10) {
        return new Intl.NumberFormat(locale, {
          minimumFractionDigits: 1,
          maximumFractionDigits: 1,
        }).format(j);
      }
      return new Intl.NumberFormat(locale, {
        maximumFractionDigits: 0,
      }).format(j);
    };
    const fmtMM = (m: number) => {
      const total = Math.floor(m);
      const hh = Math.floor(total / 60)
        .toString()
        .padStart(2, '0');
      const mm = (total % 60).toString().padStart(2, '0');
      return `${hh}:${mm}`;
    };

    return {
      profile,
      hours,
      savedMoney,
      savedGrams,
      savedJoints,
      minutesSaved,
      fmtEUR,
      fmtG,
      fmtJ,
      fmtMM,
    };
  }, [logs, now, profile]);
};
