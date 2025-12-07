import { GRAMS_PER_JOINT_DEFAULT } from './tasks';
import { parseDateKey, toDateKey } from './pause';
import type { KpiType } from '../store/ui';
import type { DayLog, Profile } from '../types/profile';
import type { Pause } from '../types/pause';
import type { XpState } from '../types/xp';

export type KpiConfig = {
  type: KpiType;
  icon: string;
  label: string;
  getValue: (data: KpiData) => string;
  getSubline: (data: KpiData) => string;
  getProgress: (data: KpiData) => number;
};

export type KpiData = {
  savedMoney: number;
  savedGrams: number;
  savedJoints: number;
  minutesSaved: number;
  fmtEUR: (v: number) => string;
  fmtG: (g: number) => string;
  fmtJ: (j: number) => string;
  fmtMM: (m: number) => string;
  moneyPerHour: number;
  gramsPerHour: number;
  jointsPerHour: number;
  minutesPerHour: number;
  longestStreakHours: number;
  totalMoneySpent: number;
  consumedGramsSinceStart: number;
  pausesCompleted: number;
  pausesAborted: number;
  totalXp: number;
  currentLevel: number;
  daysSinceConsumption: number;
  avgMood: number;
  moodCheckinCount: number;
  avgSleep: number;
  sleepCheckinCount: number;
  reactionChangePercent: number | null;
  reactionBaselineMs: number | null;
  reactionCurrentMs: number | null;
  hasReactionData: boolean;
  currentMood: number | null;
  locale: string;
};

type StatsLike = {
  savedMoney: number;
  savedGrams: number;
  savedJoints: number;
  minutesSaved: number;
  fmtEUR: (v: number) => string;
  fmtG: (g: number) => string;
  fmtJ: (j: number) => string;
  fmtMM: (m: number) => string;
  profile: Profile;
};

export type BuildKpiDataParams = {
  stats: StatsLike | null;
  dayLogs: Record<string, DayLog>;
  pauses: Pause[];
  profile: Profile | null;
  xp: XpState | null;
};

export function safeProgress(value: number): number {
  if (!Number.isFinite(value)) return 0;
  if (value <= 0) return 0;
  if (value >= 1) return 1;
  return value;
}

function progressModulo(current: number, step: number): number {
  if (!Number.isFinite(current) || !Number.isFinite(step) || step <= 0) {
    return 0;
  }
  const remainder = ((current % step) + step) % step;
  return safeProgress(remainder / step);
}

export function getResponsiveFontSize(value: string): number {
  const len = value.length;
  if (len <= 5) return 32;
  if (len <= 7) return 26;
  if (len <= 9) return 22;
  if (len <= 11) return 19;
  return 16;
}

const getMoodEmoji = (value: number): string => {
  if (value <= 1.5) return '😢';
  if (value <= 2.5) return '😔';
  if (value <= 3.5) return '😐';
  if (value <= 4.5) return '🙂';
  return '😊';
};

export const KPI_CONFIGS: KpiConfig[] = [
  {
    type: 'xp',
    icon: 'star',
    label: 'XP verdient',
    getValue: (d) => {
      const nf = new Intl.NumberFormat(d.locale, { maximumFractionDigits: 0 });
      return `${nf.format(d.totalXp)} XP`;
    },
    getSubline: (d) => `Level ${d.currentLevel}`,
    getProgress: (d) => progressModulo(d.totalXp, 100),
  },
  {
    type: 'daysSinceConsumption',
    icon: 'calendar-clock',
    label: 'Tage konsumfrei',
    getValue: (d) => {
      const days = d.daysSinceConsumption;
      return `${days} ${days === 1 ? 'Tag' : 'Tage'}`;
    },
    getSubline: () => 'Aktueller Streak',
    getProgress: (d) => Math.min(1, d.daysSinceConsumption / 30),
  },
  {
    type: 'avgMood',
    icon: 'emoticon-happy',
    label: 'Durchschnittliche Stimmung',
    getValue: (d) => {
      if (d.moodCheckinCount === 0) return 'Keine Daten';
      const nf = new Intl.NumberFormat(d.locale, { maximumFractionDigits: 1 });
      return `${nf.format(d.avgMood)}/5`;
    },
    getSubline: (d) =>
      d.moodCheckinCount > 0 ? `Aus ${d.moodCheckinCount} Check-ins` : 'Keine Daten',
    getProgress: (d) => (d.moodCheckinCount > 0 ? d.avgMood / 5 : 0),
  },
  {
    type: 'avgSleep',
    icon: 'weather-night',
    label: 'Durchschnittlicher Schlaf',
    getValue: (d) => {
      if (d.sleepCheckinCount === 0) return 'Keine Daten';
      const nf = new Intl.NumberFormat(d.locale, { maximumFractionDigits: 1 });
      return `${nf.format(d.avgSleep)} h`;
    },
    getSubline: (d) =>
      d.sleepCheckinCount > 0 ? `Aus ${d.sleepCheckinCount} Check-ins` : 'Keine Daten',
    getProgress: (d) => (d.sleepCheckinCount > 0 ? Math.min(1, d.avgSleep / 10) : 0),
  },
  {
    type: 'reactionChange',
    icon: 'speedometer',
    label: 'Reaktionszeit',
    getValue: (d) => {
      if (!d.hasReactionData || d.reactionChangePercent === null) return 'Keine Daten';
      const nf = new Intl.NumberFormat(d.locale, {
        maximumFractionDigits: 1,
        signDisplay: 'exceptZero',
      });
      return `${nf.format(d.reactionChangePercent)}%`;
    },
    getSubline: (d) => {
      if (!d.hasReactionData) return 'Nicht genug Tests';
      if (d.reactionChangePercent === null) return 'Keine Daten';
      const direction = d.reactionChangePercent > 0 ? 'Verbesserung' : 'Verschlechterung';
      const baseline = d.reactionBaselineMs ? Math.round(d.reactionBaselineMs) : '?';
      return `${direction} • Baseline: ${baseline} ms`;
    },
    getProgress: (d) => {
      if (!d.hasReactionData || d.reactionChangePercent === null) return 0;
      return Math.min(1, Math.max(0, (d.reactionChangePercent + 50) / 100));
    },
  },
  {
    type: 'currentMood',
    icon: 'emoticon',
    label: 'Heutige Stimmung',
    getValue: (d) => {
      if (d.currentMood == null) return 'Keine Daten';
      const nf = new Intl.NumberFormat(d.locale, { maximumFractionDigits: 0 });
      return `${getMoodEmoji(d.currentMood)} ${nf.format(d.currentMood)}/5`;
    },
    getSubline: (d) => (d.currentMood == null ? 'Noch nicht eingetragen' : 'Heute'),
    getProgress: (d) => (d.currentMood == null ? 0 : d.currentMood / 5),
  },
  {
    type: 'money',
    icon: 'cash-multiple',
    label: 'Geld gespart',
    getValue: (d) => d.fmtEUR(d.savedMoney),
    getSubline: (d) => `≈ ${d.fmtEUR(d.moneyPerHour)} /h`,
    getProgress: (d) => progressModulo(d.savedMoney, 0.01),
  },
  {
    type: 'grams',
    icon: 'leaf',
    label: 'Gramm vermieden',
    getValue: (d) => `${d.fmtG(d.savedGrams)} g`,
    getSubline: (d) => {
      const nf = new Intl.NumberFormat(d.locale, { maximumFractionDigits: 2 });
      return `≈ ${nf.format(d.gramsPerHour)} g/h`;
    },
    getProgress: (d) => progressModulo(d.savedGrams, 0.001),
  },
  {
    type: 'joints',
    icon: 'smoking-off',
    label: 'Joints vermieden',
    getValue: (d) => d.fmtJ(d.savedJoints),
    getSubline: (d) => {
      const nf = new Intl.NumberFormat(d.locale, { maximumFractionDigits: 2 });
      return `≈ ${nf.format(d.jointsPerHour)} /h`;
    },
    getProgress: (d) => progressModulo(d.savedJoints, 1),
  },
  {
    type: 'time',
    icon: 'clock-check',
    label: 'Zeit zurückgewonnen',
    getValue: (d) => d.fmtMM(d.minutesSaved),
    getSubline: (d) => {
      const nf = new Intl.NumberFormat(d.locale, { maximumFractionDigits: 2 });
      return `≈ ${nf.format(d.minutesPerHour)} min/h`;
    },
    getProgress: (d) => progressModulo(d.minutesSaved, 1),
  },
  {
    type: 'streak',
    icon: 'trophy',
    label: 'Längste konsumfreie Zeit',
    getValue: (d) => {
      const hours = d.longestStreakHours;
      if (hours >= 24) {
        const days = Math.floor(hours / 24);
        return `${days} ${days === 1 ? 'Tag' : 'Tage'}`;
      }
      return `${hours} ${hours === 1 ? 'Std' : 'Std'}`;
    },
    getSubline: () => 'Dein Rekord',
    getProgress: (d) => Math.min(1, d.longestStreakHours / (24 * 30)),
  },
  {
    type: 'spent',
    icon: 'cash-minus',
    label: 'Geld ausgegeben',
    getValue: (d) => d.fmtEUR(d.totalMoneySpent),
    getSubline: () => 'Gesamtausgaben',
    getProgress: () => 0,
  },
  {
    type: 'consumed',
    icon: 'cannabis',
    label: 'Gramm konsumiert',
    getValue: (d) => `${d.fmtG(d.consumedGramsSinceStart)} g`,
    getSubline: () => 'Seit Start',
    getProgress: () => 0,
  },
  {
    type: 'pauses',
    icon: 'pause-circle',
    label: 'Pausen',
    getValue: (d) => `${d.pausesCompleted}/${d.pausesCompleted + d.pausesAborted}`,
    getSubline: (d) => `${d.pausesCompleted} geschafft`,
    getProgress: (d) => {
      const total = d.pausesCompleted + d.pausesAborted;
      if (total === 0) return 0;
      return d.pausesCompleted / total;
    },
  },
];

export function getKpiIconColor(type: KpiType): string {
  const colorMap: Record<KpiType, string> = {
    money: '#10B981',
    grams: '#34D399',
    joints: '#F59E0B',
    time: '#3B82F6',
    streak: '#FBBF24',
    spent: '#EF4444',
    consumed: '#A78BFA',
    pauses: '#06B6D4',
    xp: '#FBBF24',
    daysSinceConsumption: '#10B981',
    avgMood: '#EC4899',
    avgSleep: '#6366F1',
    reactionChange: '#3B82F6',
    currentMood: '#F59E0B',
  };
  return colorMap[type] || '#3B82F6';
}

export function getKpiCardColor(
  type: KpiType,
  options?: { dark?: boolean }
): { border: string; gradient: [string, string, string] } {
  const isDark = options?.dark ?? false;
  if (!isDark) {
    const colorMap: Record<KpiType, { border: string; gradient: [string, string, string] }> = {
      money: {
        border: '#A7F3D0',
        gradient: ['#047857', '#059669', '#10B981'], // Dunkelgrün
      },
      grams: {
        border: '#86EFAC',
        gradient: ['#065F46', '#047857', '#059669'], // Dunkelgrün
      },
      joints: {
        border: '#FCD34D',
        gradient: ['#92400E', '#B45309', '#D97706'], // Dunkelorange/Braun
      },
      time: {
        border: '#93C5FD',
        gradient: ['#1E40AF', '#2563EB', '#3B82F6'], // Dunkelblau
      },
      streak: {
        border: '#FDE047',
        gradient: ['#92400E', '#B45309', '#D97706'], // Dunkelorange/Braun
      },
      spent: {
        border: '#FCA5A5',
        gradient: ['#991B1B', '#DC2626', '#EF4444'], // Dunkelrot
      },
      consumed: {
        border: '#C4B5FD',
        gradient: ['#5B21B6', '#6D28D9', '#7C3AED'], // Dunkelviolett
      },
      pauses: {
        border: '#67E8F9',
        gradient: ['#155E75', '#0891B2', '#06B6D4'], // Dunkeltürkis
      },
      xp: {
        border: '#FDE047',
        gradient: ['#92400E', '#B45309', '#D97706'], // Dunkelorange/Braun
      },
      daysSinceConsumption: {
        border: '#A7F3D0',
        gradient: ['#047857', '#059669', '#10B981'], // Dunkelgrün
      },
      avgMood: {
        border: '#F9A8D4',
        gradient: ['#9F1239', '#BE185D', '#EC4899'], // Dunkelrosa
      },
      avgSleep: {
        border: '#C7D2FE',
        gradient: ['#3730A3', '#4338CA', '#4F46E5'], // Dunkelindigo
      },
      reactionChange: {
        border: '#93C5FD',
        gradient: ['#1E40AF', '#2563EB', '#3B82F6'], // Dunkelblau
      },
      currentMood: {
        border: '#FCD34D',
        gradient: ['#92400E', '#B45309', '#D97706'], // Dunkelorange/Braun
      },
    };
    return (
      colorMap[type] || { border: '#93C5FD', gradient: ['#1E40AF', '#2563EB', '#3B82F6'] }
    );
  }

  const darkMap: Record<KpiType, { border: string; gradient: [string, string, string] }> = {
    money: {
      border: '#0FA56B',
      gradient: ['#022C22', '#064E3B', '#065F46'], // Sehr dunkelgrün
    },
    grams: {
      border: '#10A15A',
      gradient: ['#022C22', '#064E3B', '#065F46'], // Sehr dunkelgrün
    },
    joints: {
      border: '#BD8A00',
      gradient: ['#451A03', '#78350F', '#92400E'], // Sehr dunkelorange/Braun
    },
    time: {
      border: '#1D6FDB',
      gradient: ['#1E3A8A', '#1E40AF', '#2563EB'], // Sehr dunkelblau
    },
    streak: {
      border: '#BD9800',
      gradient: ['#451A03', '#78350F', '#92400E'], // Sehr dunkelorange/Braun
    },
    spent: {
      border: '#C53030',
      gradient: ['#7F1D1D', '#991B1B', '#B91C1C'], // Sehr dunkelrot
    },
    consumed: {
      border: '#7A5AD9',
      gradient: ['#3B1F5C', '#4C1D95', '#5B21B6'], // Sehr dunkelviolett
    },
    pauses: {
      border: '#0E8CAF',
      gradient: ['#0C4A6E', '#164E63', '#155E75'], // Sehr dunkeltürkis
    },
    xp: {
      border: '#BD9800',
      gradient: ['#451A03', '#78350F', '#92400E'], // Sehr dunkelorange/Braun
    },
    daysSinceConsumption: {
      border: '#0FA56B',
      gradient: ['#022C22', '#064E3B', '#065F46'], // Sehr dunkelgrün
    },
    avgMood: {
      border: '#B93173',
      gradient: ['#701A30', '#831843', '#9F1239'], // Sehr dunkelrosa
    },
    avgSleep: {
      border: '#454CCF',
      gradient: ['#1E1B4B', '#312E81', '#3730A3'], // Sehr dunkelindigo
    },
    reactionChange: {
      border: '#2B6FD4',
      gradient: ['#1E3A8A', '#1E40AF', '#2563EB'], // Sehr dunkelblau
    },
    currentMood: {
      border: '#BD8A00',
      gradient: ['#451A03', '#78350F', '#92400E'], // Sehr dunkelorange/Braun
    },
  };

  return darkMap[type] || { border: '#1444A0', gradient: ['#1444A0', '#1B5BCF', 'transparent'] };
}

export function buildKpiData({
  stats,
  dayLogs,
  pauses,
  profile,
  xp,
}: BuildKpiDataParams): KpiData {
  const fallbackProfile: Profile = profile ?? stats?.profile ?? {
    startTimestamp: Date.now(),
    version: 1,
    locale: 'de-DE',
  };

  const statsProfile = stats?.profile ?? fallbackProfile;
  const locale = statsProfile.locale ?? 'de-DE';

  const savedMoney = stats?.savedMoney ?? 0;
  const savedGrams = stats?.savedGrams ?? 0;
  const savedJoints = stats?.savedJoints ?? 0;
  const minutesSaved = stats?.minutesSaved ?? 0;

  const fmtEUR =
    stats?.fmtEUR ??
    ((v: number) =>
      new Intl.NumberFormat(locale, {
        style: 'currency',
        currency: 'EUR',
        maximumFractionDigits: 2,
      }).format(v));

  const fmtG =
    stats?.fmtG ??
    ((g: number) => {
      const fractionDigits = g < 1 ? 3 : 1;
      return new Intl.NumberFormat(locale, {
        minimumFractionDigits: fractionDigits,
        maximumFractionDigits: fractionDigits,
      }).format(g);
    });

  const fmtJ =
    stats?.fmtJ ??
    ((j: number) => {
      if (j < 10) {
        return new Intl.NumberFormat(locale, {
          minimumFractionDigits: 1,
          maximumFractionDigits: 1,
        }).format(j);
      }
      return new Intl.NumberFormat(locale, {
        maximumFractionDigits: 0,
      }).format(j);
    });

  const fmtMM =
    stats?.fmtMM ??
    ((m: number) => {
      const total = Math.floor(m);
      const hh = Math.floor(total / 60)
        .toString()
        .padStart(2, '0');
      const mm = (total % 60).toString().padStart(2, '0');
      return `${hh}:${mm}`;
    });

  const gramsPerDay =
    statsProfile.gramsPerDayBaseline ??
    (statsProfile.jointsPerDayBaseline != null
      ? statsProfile.jointsPerDayBaseline * GRAMS_PER_JOINT_DEFAULT
      : 0);
  const jointsPerDay =
    statsProfile.jointsPerDayBaseline ??
    (statsProfile.gramsPerDayBaseline != null
      ? statsProfile.gramsPerDayBaseline / GRAMS_PER_JOINT_DEFAULT
      : 0);
  const gramsPerHour = gramsPerDay / 24;
  const jointsPerHour = jointsPerDay / 24;
  const pricePerGram =
    statsProfile.pricePerGram ??
    (statsProfile.costPerJoint ? statsProfile.costPerJoint / GRAMS_PER_JOINT_DEFAULT : 0);
  const moneyPerHour = gramsPerHour * pricePerGram;
  const minutesPerHour = (statsProfile.avgSessionMinutes ?? 0) * jointsPerHour;

  const totalXp =
    xp?.totalXp ??
    Object.values(dayLogs).reduce((sum, log) => sum + (log.xpEarned ?? 0), 0);
  const currentLevel = xp?.currentLevel ?? 1;

  const daysSinceConsumption = (() => {
    const now = Date.now();
    const dayMs = 24 * 60 * 60 * 1000;
    const lastFromProfile = profile?.lastConsumptionAt ?? statsProfile.lastConsumptionAt;
    let lastTimestamp = Number.isFinite(lastFromProfile) ? Number(lastFromProfile) : null;

    const consumptionDates = Object.entries(dayLogs)
      .filter(([, log]) => (log.consumedGrams ?? 0) > 0 || (log.consumedJoints ?? 0) > 0)
      .map(([key, log]) => log.date ?? key);

    if (consumptionDates.length) {
      const lastKey = consumptionDates.sort((a, b) => b.localeCompare(a))[0];
      const parsed = parseDateKey(lastKey);
      lastTimestamp = Math.max(lastTimestamp ?? 0, parsed.getTime());
    }

    if (lastTimestamp != null) {
      const diff = Math.floor((now - lastTimestamp) / dayMs);
      return diff >= 0 ? diff : 0;
    }

    if (statsProfile.startTimestamp) {
      return Math.max(0, Math.floor((now - statsProfile.startTimestamp) / dayMs));
    }

    return 0;
  })();

  const { avgMood, moodCheckinCount } = (() => {
    const moods = Object.values(dayLogs)
      .map((log) => log.checkin?.mood1to5)
      .filter((m): m is number => typeof m === 'number' && m >= 1 && m <= 5);
    if (moods.length === 0) return { avgMood: 0, moodCheckinCount: 0 };
    const avg = moods.reduce((sum, m) => sum + m, 0) / moods.length;
    return { avgMood: avg, moodCheckinCount: moods.length };
  })();

  const { avgSleep, sleepCheckinCount } = (() => {
    const sleeps = Object.values(dayLogs)
      .map((log) => log.checkin?.sleepHours)
      .filter((s): s is number => typeof s === 'number' && s > 0 && s <= 24);
    if (sleeps.length === 0) return { avgSleep: 0, sleepCheckinCount: 0 };
    const avg = sleeps.reduce((sum, s) => sum + s, 0) / sleeps.length;
    return { avgSleep: avg, sleepCheckinCount: sleeps.length };
  })();

  const todayKey = toDateKey(new Date());
  const currentMoodValue = dayLogs[todayKey]?.checkin?.mood1to5;
  const currentMood =
    typeof currentMoodValue === 'number' && currentMoodValue >= 1 && currentMoodValue <= 5
      ? currentMoodValue
      : null;

  const reactionData = (() => {
    const reactions: Array<{ ms: number; date: string }> = [];
    Object.entries(dayLogs).forEach(([key, log]) => {
      const ms = log.tests?.reactionMs;
      if (typeof ms === 'number' && ms > 0) {
        const dateKey = log.date ?? key;
        reactions.push({ ms, date: dateKey });
      }
    });

    reactions.sort((a, b) => a.date.localeCompare(b.date));

    if (reactions.length < 3) {
      return {
        reactionChangePercent: null,
        reactionBaselineMs: null,
        reactionCurrentMs: null,
        hasReactionData: false,
      };
    }

    const baselineSamples = reactions.slice(0, 3);
    const currentSamples = reactions.slice(-3);
    const baseline =
      baselineSamples.reduce((sum, entry) => sum + entry.ms, 0) / baselineSamples.length;
    const current =
      currentSamples.reduce((sum, entry) => sum + entry.ms, 0) / currentSamples.length;

    if (!Number.isFinite(baseline) || baseline <= 0 || !Number.isFinite(current)) {
      return {
        reactionChangePercent: null,
        reactionBaselineMs: null,
        reactionCurrentMs: null,
        hasReactionData: false,
      };
    }

    const changePercent = ((baseline - current) / baseline) * 100;

    return {
      reactionChangePercent: changePercent,
      reactionBaselineMs: baseline,
      reactionCurrentMs: current,
      hasReactionData: true,
    };
  })();

  const totalMoneySpent = Object.values(dayLogs).reduce(
    (sum, log) => sum + (log.moneySpentEUR ?? 0),
    0
  );

  const consumedGramsSinceStart = (() => {
    const gramsPerJoint =
      statsProfile.gramsPerDayBaseline && statsProfile.jointsPerDayBaseline
        ? statsProfile.gramsPerDayBaseline / Math.max(1, statsProfile.jointsPerDayBaseline)
        : GRAMS_PER_JOINT_DEFAULT;
    return Object.values(dayLogs).reduce((sum, log) => {
      if (typeof log.consumedGrams === 'number') return sum + log.consumedGrams;
      if (typeof log.consumedJoints === 'number') return sum + log.consumedJoints * gramsPerJoint;
      return sum;
    }, 0);
  })();

  const computedLongestStreakHours = (() => {
    if (!statsProfile?.startTimestamp) return 0;
    const startTs = statsProfile.startTimestamp;
    const now = Date.now();

    const consumptionTimestamps: number[] = [];
    if (statsProfile.lastConsumptionAt && statsProfile.lastConsumptionAt !== startTs) {
      consumptionTimestamps.push(statsProfile.lastConsumptionAt);
    }

    Object.values(dayLogs).forEach((log) => {
      if ((log.consumedGrams ?? 0) > 0 || (log.consumedJoints ?? 0) > 0) {
        const [year, month, day] = log.date.split('-').map((part) => parseInt(part, 10));
        if (Number.isFinite(year) && Number.isFinite(month) && Number.isFinite(day)) {
          consumptionTimestamps.push(
            new Date(year, month - 1, day, 23, 59, 59, 999).getTime()
          );
        }
      }
    });

    const uniqueTimestamps = Array.from(
      new Set(
        consumptionTimestamps.map(
          (ts) => Math.floor(ts / (60 * 60 * 1000)) * (60 * 60 * 1000)
        )
      )
    ).sort((a, b) => a - b);

    if (uniqueTimestamps.length === 0) {
      return Math.floor((now - startTs) / (60 * 60 * 1000));
    }

    let longestHours = 0;
    if (uniqueTimestamps[0] > startTs) {
      longestHours = Math.max(
        longestHours,
        Math.floor((uniqueTimestamps[0] - startTs) / (60 * 60 * 1000))
      );
    }
    for (let i = 0; i < uniqueTimestamps.length - 1; i++) {
      longestHours = Math.max(
        longestHours,
        Math.floor((uniqueTimestamps[i + 1] - uniqueTimestamps[i]) / (60 * 60 * 1000))
      );
    }
    const lastConsumption = uniqueTimestamps[uniqueTimestamps.length - 1];
    if (lastConsumption < now) {
      longestHours = Math.max(
        longestHours,
        Math.floor((now - lastConsumption) / (60 * 60 * 1000))
      );
    }
    return longestHours;
  })();

  const pausesCompleted = pauses.filter((p) => p.status === 'abgeschlossen').length;
  const pausesAborted = pauses.filter((p) => p.status === 'abgebrochen').length;

  const longestStreakHours = Math.max(
    profile?.longestStreakHours ?? 0,
    computedLongestStreakHours
  );

  return {
    savedMoney,
    savedGrams,
    savedJoints,
    minutesSaved,
    fmtEUR,
    fmtG,
    fmtJ,
    fmtMM,
    moneyPerHour,
    gramsPerHour,
    jointsPerHour,
    minutesPerHour,
    longestStreakHours,
    totalMoneySpent,
    consumedGramsSinceStart,
    pausesCompleted,
    pausesAborted,
    totalXp,
    currentLevel,
    daysSinceConsumption,
    avgMood,
    moodCheckinCount,
    avgSleep,
    sleepCheckinCount,
    reactionChangePercent: reactionData.reactionChangePercent,
    reactionBaselineMs: reactionData.reactionBaselineMs,
    reactionCurrentMs: reactionData.reactionCurrentMs,
    hasReactionData: reactionData.hasReactionData,
    currentMood,
    locale,
  };
}
