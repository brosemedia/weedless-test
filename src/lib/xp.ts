import type { XpEventReason } from '../types/xp';

const LEVEL_BASE = 420;
const LEVEL_EXPONENT = 1.32;
const LEVEL_STEP = 260;

export type LevelProgress = {
  level: number;
  xpForCurrentLevel: number;
  xpForNextLevel: number;
};

const clampLevel = (value: number) => Math.max(1, Math.floor(value));

export const totalXpForLevel = (level: number): number => {
  if (level <= 1) return 0;
  const normalized = level - 1;
  const curve = LEVEL_BASE * Math.pow(normalized, LEVEL_EXPONENT) + LEVEL_STEP * normalized;
  return Math.round(curve);
};

export const levelFromXp = (totalXp: number): LevelProgress => {
  let level = 1;
  let nextLevel = 2;
  const LEVEL_CAP = 500;
  while (totalXp >= totalXpForLevel(nextLevel) && nextLevel <= LEVEL_CAP) {
    level = nextLevel;
    nextLevel += 1;
  }
  if (nextLevel > LEVEL_CAP) {
    nextLevel = LEVEL_CAP;
  }
  const xpForCurrentLevel = totalXpForLevel(level);
  const xpForNextLevel = totalXpForLevel(nextLevel);
  return {
    level: clampLevel(level),
    xpForCurrentLevel,
    xpForNextLevel,
  };
};

export const XP_REASON_LABELS: Record<XpEventReason, string> = {
  'daily-check-in': 'Daily Check-in',
  'breathing-session': 'Atemübung',
  'reaction-test': 'Reaktionstest',
  'stroop-focus': 'Stroop Focus',
  'zen-glide': 'Zen Glide',
  'mind-house': 'Mind House',
  'number-flow': 'Number Flow',
  'pause-daily-bonus': 'Pause-Bonus',
  milestone: 'Meilenstein',
  mission: 'Mission',
  manual: 'Bonus',
};

export const labelForXpReason = (reason: string, fallback?: string) => {
  return XP_REASON_LABELS[reason as XpEventReason] ?? fallback ?? reason;
};

export const formatXp = (value: number) => {
  return Math.max(0, Math.round(value)).toLocaleString('de-DE');
};

