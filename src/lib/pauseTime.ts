import { parseDateKey, toDateKey } from './pause';
import type { Pause } from '../types/pause';

const MS_PER_MINUTE = 60 * 1000;
const MS_PER_HOUR = 60 * MS_PER_MINUTE;
const MS_PER_DAY = 24 * MS_PER_HOUR;

export type PauseTimeInfo = {
  remainingMs: number;
  remainingDaysDecimal: number;
  displayLabel: string;
};

export type PauseTimeInfoOptions = {
  startTimestamp?: number | null;
  endTimestamp?: number | null;
};

export type PauseProgressInfo = {
  progress: number;
  percent: number;
  displayPercent: number;
};

const ISO_DATETIME_REGEX = /\dT\d/;

const parsePauseDate = (value?: string) => {
  if (!value) return null;
  if (ISO_DATETIME_REGEX.test(value)) {
    const parsed = new Date(value);
    if (!Number.isNaN(parsed.getTime())) {
      return parsed;
    }
  }
  try {
    return parseDateKey(value);
  } catch {
    return null;
  }
};

export const getPauseStartTimestamp = (pause: Pause) => {
  if (typeof pause.startTimestamp === 'number' && Number.isFinite(pause.startTimestamp)) {
    return pause.startTimestamp;
  }
  if (pause.startDate) {
    if (pause.createdAt) {
      const createdKey = toDateKey(new Date(pause.createdAt));
      const startKey = pause.startDate.slice(0, 10);
      if (createdKey === startKey) {
        return pause.createdAt;
      }
    }
    const parsed = parsePauseDate(pause.startDate);
    if (parsed) {
      return parsed.getTime();
    }
  }
  return pause.createdAt ?? null;
};

export const getPauseEndTimestamp = (pause: Pause) => {
  if (typeof pause.endTimestamp === 'number' && Number.isFinite(pause.endTimestamp)) {
    return pause.endTimestamp;
  }
  const parsed = parsePauseDate(pause.endDate);
  if (parsed) {
    if (!ISO_DATETIME_REGEX.test(pause.endDate)) {
      parsed.setHours(23, 59, 59, 999);
    }
    return parsed.getTime();
  }
  if (typeof pause.startTimestamp === 'number' && Number.isFinite(pause.startTimestamp)) {
    return pause.startTimestamp + 86_400_000;
  }
  return null;
};

const resolveTimestamp = (value: string, fallback?: number | null, isEnd?: boolean) => {
  if (typeof fallback === 'number' && Number.isFinite(fallback)) {
    return fallback;
  }
  const parsed = parsePauseDate(value);
  if (!parsed) return NaN;
  if (isEnd && !ISO_DATETIME_REGEX.test(value)) {
    parsed.setHours(23, 59, 59, 999);
  }
  return parsed.getTime();
};

export function getPauseTimeInfo(
  startDateISO: string,
  endDateISO: string,
  nowDate: Date = new Date(),
  options?: PauseTimeInfoOptions
): PauseTimeInfo {
  const startMs = resolveTimestamp(startDateISO, options?.startTimestamp);
  const endMs = resolveTimestamp(endDateISO, options?.endTimestamp, true);
  const nowMs = nowDate.getTime();
  const totalMs = Number.isFinite(startMs) && Number.isFinite(endMs) ? endMs - startMs : NaN;
  const rawRemainingMs = Number.isFinite(endMs) ? endMs - nowMs : NaN;
  const remainingMs = Number.isFinite(rawRemainingMs) ? Math.max(0, rawRemainingMs) : 0;
  const remainingDaysDecimal = remainingMs / MS_PER_DAY;
  let displayLabel = 'Pause beendet';

  if (Number.isFinite(totalMs) && totalMs > 0 && remainingMs > 0) {
    if (remainingDaysDecimal >= 1) {
      const value = Math.floor(remainingDaysDecimal * 10) / 10;
      const german = value.toFixed(1).replace('.', ',');
      displayLabel = `Noch ${german} Tage`;
    } else {
      const hours = Math.floor(remainingMs / MS_PER_HOUR);
      const minutes = Math.floor((remainingMs % MS_PER_HOUR) / MS_PER_MINUTE);
      displayLabel = `Noch ${hours}h ${minutes}m`;
    }
  }

  return {
    remainingMs,
    remainingDaysDecimal,
    displayLabel,
  };
}

export function getPauseProgress(
  startDateISO: string,
  endDateISO: string,
  nowDate: Date = new Date(),
  options?: PauseTimeInfoOptions
): PauseProgressInfo | null {
  const startMs = resolveTimestamp(startDateISO, options?.startTimestamp);
  const endMs = resolveTimestamp(endDateISO, options?.endTimestamp, true);
  if (!Number.isFinite(startMs) || !Number.isFinite(endMs) || !(endMs > startMs)) {
    return null;
  }
  const totalMs = endMs - startMs;
  const elapsedMs = nowDate.getTime() - startMs;
  const rawProgress = elapsedMs / totalMs;
  const progress = Math.min(1, Math.max(0, rawProgress));
  const percent = Math.round(progress * 100);
  const displayPercent = progress > 0 ? Math.max(1, percent) : 0;
  return {
    progress,
    percent,
    displayPercent,
  };
}
