import { addDays, differenceInCalendarDays, eachDayOfInterval, format, isAfter, isBefore, isSameDay, parseISO } from 'date-fns';
import type { Pause } from '../types/pause';
import type { Profile } from '../types/profile';
import { GRAMS_PER_JOINT_DEFAULT } from './tasks';

export const toDateKey = (date: Date) => format(date, 'yyyy-MM-dd');

export const parseDateKey = (key: string) => {
  const [year, month, day] = key.split('-').map((part) => parseInt(part, 10));
  if (!Number.isFinite(year) || !Number.isFinite(month) || !Number.isFinite(day)) {
    return new Date();
  }
  return new Date(year, month - 1, day, 12, 0, 0, 0);
};

export const dayKeysBetween = (startKey: string, endKey: string) => {
  const start = parseDateKey(startKey);
  const end = parseDateKey(endKey);
  if (isAfter(start, end)) return [] as string[];
  return eachDayOfInterval({ start, end }).map(toDateKey);
};

export const isDateKeyWithinPause = (pause: Pause, dateKey: string) => {
  const date = parseDateKey(dateKey);
  const start = parseDateKey(pause.startDate);
  const end = parseDateKey(pause.endDate);
  if (isAfter(start, end)) return false;
  return (!isBefore(date, start) && !isAfter(date, end)) || isSameDay(date, start) || isSameDay(date, end);
};

export const remainingDaysForPause = (pause: Pause, now: Date) => {
  if (pause.status !== 'aktiv') return 0;
  const todayKey = toDateKey(now);
  if (todayKey > pause.endDate) return 0;
  const today = parseDateKey(todayKey);
  const end = parseDateKey(pause.endDate);
  return Math.max(0, differenceInCalendarDays(end, today));
};

export const pauseDurationInDays = (pause: Pause, endKey?: string) => {
  const start = parseDateKey(pause.startDate);
  const end = parseDateKey(endKey ?? pause.endDate);
  const diff = differenceInCalendarDays(end, start);
  return Math.max(0, diff) + 1;
};

const gramsPerJoint = (profile: Profile) => {
  if (profile.gramsPerDayBaseline && profile.jointsPerDayBaseline) {
    const ratio = profile.gramsPerDayBaseline / Math.max(1, profile.jointsPerDayBaseline);
    if (Number.isFinite(ratio) && ratio > 0) return ratio;
  }
  return GRAMS_PER_JOINT_DEFAULT;
};

export const calculatePauseStats = (pause: Pause, profile: Profile, endKey?: string) => {
  const pricePerGram = profile.pricePerGram ?? 0;
  const gramsPerDay = profile.gramsPerDayBaseline ?? 0;
  const jointsBaseline = profile.jointsPerDayBaseline ?? 0;
  const gramsPerJointValue = gramsPerJoint(profile);
  const derivedGramsPerDay = gramsPerDay > 0 ? gramsPerDay : jointsBaseline * gramsPerJointValue;
  const avgSessionMinutes = profile.avgSessionMinutes ?? 12;
  const totalDays = pauseDurationInDays(pause, endKey);
  const savedGrams = Math.max(0, derivedGramsPerDay * totalDays);
  const savedMoney = Math.max(0, savedGrams * pricePerGram);
  const savedTimeHours = Math.max(0, (avgSessionMinutes * totalDays) / 60);
  return {
    savedMoney,
    savedGrams,
    savedTimeHours,
  };
};

export const eligibleXpDaysForPause = (pause: Pause, now: Date) => {
  if (pause.status !== 'aktiv') return [] as string[];
  const today = parseDateKey(toDateKey(now));
  const lastFullDay = addDays(today, -1);
  const start = parseDateKey(pause.startDate);
  const plannedEnd = parseDateKey(pause.endDate);
  const xpEnd = isBefore(plannedEnd, lastFullDay) ? plannedEnd : lastFullDay;
  if (isBefore(xpEnd, start)) return [] as string[];
  return eachDayOfInterval({ start, end: xpEnd }).map(toDateKey);
};
