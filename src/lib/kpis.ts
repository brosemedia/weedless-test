import { GRAMS_PER_JOINT_DEFAULT } from './tasks';
import { parseDateKey, toDateKey } from './pause';
import type { KpiType } from '../store/ui';
import type { DayLog, Profile } from '../types/profile';
import type { Pause } from '../types/pause';
import type { XpState } from '../types/xp';
import { getKpiColorByIndex, type KpiColor } from '../design/tokens';

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

/**
 * Fortschritt, der an die gerundete Anzeige gekoppelt ist:
 * - Nutzt eine Halb-Schritt-Korrektur (step/2), damit Balken und Zahl gleichzeitig umspringen.
 * - Vermeidet Floating-Point-Drift mit kleinem Epsilon.
 */
function progressAlignedToRounded(current: number, step: number): number {
  if (!Number.isFinite(current) || !Number.isFinite(step) || step <= 0) {
    return 0;
  }
  const epsilon = step * 1e-6;
  const halfStep = step / 2;
  const adjusted = Math.max(0, current + halfStep + epsilon);
  const bucket = Math.floor(adjusted / step) * step;
  const remainder = adjusted - bucket;
  return safeProgress(remainder / step);
}

// Legacy-Wrapper für bestehende Aufrufer
export const progressModulo = progressAlignedToRounded;

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
    getProgress: (d) => progressAlignedToRounded(d.totalXp, 100),
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
    getProgress: (d) => progressAlignedToRounded(d.savedMoney, 0.01),
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
    getProgress: (d) => progressAlignedToRounded(d.savedGrams, 0.001),
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
    getProgress: (d) => progressAlignedToRounded(d.savedJoints, 1),
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
    getProgress: (d) => progressAlignedToRounded(d.minutesSaved, 1),
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

type KpiPalette = {
  base: KpiColor;
  border: string;
  gradient: [string, string, string];
  text: string;
  track: string;
};

const clampChannel = (value: number) => Math.max(0, Math.min(255, value));

function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const normalized = hex.replace('#', '');
  const int = parseInt(normalized, 16);
  return {
    r: (int >> 16) & 255,
    g: (int >> 8) & 255,
    b: int & 255,
  };
}

function rgbToHex({ r, g, b }: { r: number; g: number; b: number }): string {
  const toHex = (v: number) => Math.round(clampChannel(v)).toString(16).padStart(2, '0');
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

/**
 * Hellt eine Farbe auf oder dunkelt sie ab. amount: -1..1
 */
function adjustHex(hex: string, amount: number): string {
  const { r, g, b } = hexToRgb(hex);
  const adjust = (channel: number) =>
    amount >= 0
      ? Math.round(channel + (255 - channel) * amount)
      : Math.round(channel * (1 + amount));
  return rgbToHex({
    r: adjust(r),
    g: adjust(g),
    b: adjust(b),
  });
}

function relativeLuminance({ r, g, b }: { r: number; g: number; b: number }) {
  const srgb = [r, g, b].map((v) => {
    const channel = v / 255;
    return channel <= 0.03928 ? channel / 12.92 : Math.pow((channel + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * srgb[0] + 0.7152 * srgb[1] + 0.0722 * srgb[2];
}

function getContrastingTextColor(hex: string): string {
  const lum = relativeLuminance(hexToRgb(hex));
  // Schwellenwert grob bei mittlerem Helligkeitsbereich
  return lum > 0.55 ? '#1F1A0E' : '#FFFFFF';
}

export function getKpiPaletteByIndex(index: number, options?: { dark?: boolean }): KpiPalette {
  const base = getKpiColorByIndex(index);
  const isDark = options?.dark ?? false;
  const border = adjustHex(base, isDark ? -0.25 : 0.25);
  const gradient: [string, string, string] = [
    adjustHex(base, isDark ? -0.15 : -0.1),
    base,
    adjustHex(base, isDark ? 0.12 : 0.18),
  ];
  const text = getContrastingTextColor(base);
  // Track für Fortschritt: heller bei dunklen Karten, dunkler bei hellen Karten
  const track = isDark ? adjustHex(base, 0.28) : adjustHex(base, -0.28);

  return { base, border, gradient, text, track };
}

export function buildKpiData({
  stats,
  dayLogs,
  pauses,
  profile,
  xp,
}: BuildKpiDataParams): KpiData {
  const dayLogValues = Object.values(dayLogs);
  const dayLogEntries = Object.entries(dayLogs);
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

  const totalXp = xp?.totalXp ?? dayLogValues.reduce((sum, log) => sum + (log.xpEarned ?? 0), 0);
  const currentLevel = xp?.currentLevel ?? 1;

  const daysSinceConsumption = (() => {
    const now = Date.now();
    const dayMs = 24 * 60 * 60 * 1000;
    const lastFromProfile = profile?.lastConsumptionAt ?? statsProfile.lastConsumptionAt;
    let lastTimestamp = Number.isFinite(lastFromProfile) ? Number(lastFromProfile) : null;

    const consumptionDates = dayLogEntries
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
    const moods = dayLogValues
      .map((log) => log.checkin?.mood1to5)
      .filter((m): m is number => typeof m === 'number' && m >= 1 && m <= 5);
    if (moods.length === 0) return { avgMood: 0, moodCheckinCount: 0 };
    const avg = moods.reduce((sum, m) => sum + m, 0) / moods.length;
    return { avgMood: avg, moodCheckinCount: moods.length };
  })();

  const { avgSleep, sleepCheckinCount } = (() => {
    const sleeps = dayLogValues
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
    dayLogEntries.forEach(([key, log]) => {
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

  const totalMoneySpent = dayLogValues.reduce(
    (sum, log) => sum + (log.moneySpentEUR ?? 0),
    0
  );

  const consumedGramsSinceStart = (() => {
    const gramsPerJoint =
      statsProfile.gramsPerDayBaseline && statsProfile.jointsPerDayBaseline
        ? statsProfile.gramsPerDayBaseline / Math.max(1, statsProfile.jointsPerDayBaseline)
        : GRAMS_PER_JOINT_DEFAULT;
    const startTimestamp =
      typeof statsProfile.startTimestamp === 'number' && Number.isFinite(statsProfile.startTimestamp)
        ? statsProfile.startTimestamp
        : 0;
    return dayLogValues.reduce((sum, log) => {
      const dayTimestamp = parseDateKey(log.date).getTime();
      if (dayTimestamp < startTimestamp) return sum;
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

    dayLogValues.forEach((log) => {
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
