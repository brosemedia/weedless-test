import { parseDateKey, toDateKey } from './pause';
import type { Pause } from '../types/pause';

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
