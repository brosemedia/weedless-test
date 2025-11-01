import { addDays, differenceInCalendarDays, eachDayOfInterval, isSameDay } from 'date-fns';
import type { DiaryEntry, Profile } from '../types';

export function daysSince(startISO: string): number {
  const s = new Date(startISO);
  const now = new Date();
  return Math.max(1, differenceInCalendarDays(now, s) + 1);
}

export function totalAmountForDate(entries: DiaryEntry[], isoDate: string): number {
  const d = new Date(isoDate);
  return (entries || []).reduce((sum, e) => (isSameDay(new Date(e.date), d) ? sum + e.amount : sum), 0);
}

export function dailySeries(entries: DiaryEntry[], startISO: string, endISO: string): { date: string; amount: number }[] {
  const start = new Date(startISO);
  const end = new Date(endISO);
  const days = eachDayOfInterval({ start, end });
  return days.map((day) => {
    const amount = (entries || []).reduce((sum, e) => (isSameDay(new Date(e.date), day) ? sum + e.amount : sum), 0);
    return { date: day.toISOString().slice(0, 10), amount };
  });
}

export function rangeDays(startISO: string, endISO: string): number {
  return Math.max(1, differenceInCalendarDays(new Date(endISO), new Date(startISO)) + 1);
}

export function spendForRange(entries: DiaryEntry[], profile: Profile, startISO: string, endISO: string): number {
  const price = profile?.baseline?.pricePerUnit ?? 0;
  return dailySeries(entries, startISO, endISO).reduce((sum, d) => sum + d.amount * price, 0);
}

export function savedAgainstBaseline(
  profile: Profile,
  entries: DiaryEntry[],
  startISO: string,
  endISO: string
): { days: number; expectedUnits: number; actualUnits: number; savedUnits: number; savedMoney: number } {
  const days = rangeDays(startISO, endISO);
  const baselinePerDay = profile?.baseline?.amountPerDay ?? 0;
  const price = profile?.baseline?.pricePerUnit ?? 0;
  const expectedUnits = baselinePerDay * days;
  const actualUnits = dailySeries(entries, startISO, endISO).reduce((sum, d) => sum + d.amount, 0);
  const savedUnits = expectedUnits - actualUnits;
  const savedMoney = savedUnits * price;
  return { days, expectedUnits, actualUnits, savedUnits, savedMoney };
}

export function currentZeroDayStreak(entries: DiaryEntry[], todayISO: string = new Date().toISOString()): number {
  const today = new Date(todayISO);
  let streak = 0;
  let cursor = today;
  // Count today and go backwards while amount is 0
  while (true) {
    const total = (entries || []).reduce((sum, e) => (isSameDay(new Date(e.date), cursor) ? sum + e.amount : sum), 0);
    if (total > 0) break;
    streak += 1;
    cursor = addDays(cursor, -1);
  }
  return streak;
}

export function longestZeroDayStreak(entries: DiaryEntry[]): number {
  if (!entries || entries.length === 0) return 0;
  const minDate = entries.reduce((min, e) => (new Date(e.date) < min ? new Date(e.date) : min), new Date(entries[0].date));
  const maxDate = new Date();
  const days = eachDayOfInterval({ start: minDate, end: maxDate });
  let longest = 0;
  let current = 0;
  for (const day of days) {
    const total = entries.reduce((sum, e) => (isSameDay(new Date(e.date), day) ? sum + e.amount : sum), 0);
    if (total === 0) {
      current += 1;
      longest = Math.max(longest, current);
    } else {
      current = 0;
    }
  }
  return longest;
}

export function lastUseAt(entries: DiaryEntry[], fallbackISO: string): string {
  const used = (entries || [])
    .filter((e) => e.amount > 0)
    .sort((a, b) => +new Date(b.date) - +new Date(a.date));
  return used[0]?.date ?? fallbackISO;
}

export function formatDurationSince(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diffMs / 60000);
  const d = Math.floor(m / (60 * 24));
  const h = Math.floor((m - d * 60 * 24) / 60);
  const min = m % 60;
  return `${d}d ${h}h ${min}m`;
}

export function aggregate(
  profile: Profile,
  entries: DiaryEntry[],
  days: number | 'all'
): {
  startISO: string;
  endISO: string;
  days: number;
  baselineTotal: number;
  actualTotal: number;
  avoided: number;
  moneySaved: number;
  spend: number;
  avgPerDay: number;
  baselinePerDay: number;
} {
  const end = new Date();
  const endISO = end.toISOString().slice(0, 10);
  const totalDays = days === 'all' ? daysSince(profile.startedAt) : (days as number);
  const start = addDays(new Date(), -(totalDays - 1));
  const startISO = start.toISOString().slice(0, 10);
  const period = eachDayOfInterval({ start, end: new Date() });

  const actualTotal = period.reduce((sum, day) => {
    const daySum = (entries || [])
      .filter((e) => isSameDay(new Date(e.date), day))
      .reduce((s, e) => s + e.amount, 0);
    return sum + daySum;
  }, 0);

  const baselinePerDay = profile.baseline.amountPerDay;
  const baselineTotal = baselinePerDay * totalDays;
  const avoided = Math.max(0, baselineTotal - actualTotal);
  const price = profile.baseline.pricePerUnit;
  const moneySaved = avoided * price;
  const spend = actualTotal * price;
  const avgPerDay = totalDays > 0 ? actualTotal / totalDays : 0;

  return {
    startISO,
    endISO,
    days: totalDays,
    baselineTotal,
    actualTotal,
    avoided,
    moneySaved,
    spend,
    avgPerDay,
    baselinePerDay,
  };
}

export function goalProgress(profile: Profile, moneySaved: number): number {
  if (!profile.savingGoal) return 0;
  return Math.max(0, Math.min(1, moneySaved / profile.savingGoal.targetAmount));
}
