import AsyncStorage from '@react-native-async-storage/async-storage';

export type SessionSummary = {
  totalTrials: number;
  correct: number;
  accuracy: number;
  meanRTAll: number;
  meanRTCongruent: number;
  meanRTIncongruent: number;
  stroopInterferenceMs: number;
  cannabisBiasMs?: number;
  mode: 'INK' | 'WORD';
  useCannabisStroop: boolean;
  timestamp: number;
};

const KEY = 'hazeless.stroop.sessions';
const MAX_SESSIONS = 50;

const isSessionSummary = (value: unknown): value is SessionSummary => {
  if (!value || typeof value !== 'object') return false;
  const candidate = value as Record<string, unknown>;
  const isMode = candidate.mode === 'INK' || candidate.mode === 'WORD';
  const hasNumbers =
    typeof candidate.totalTrials === 'number' &&
    typeof candidate.correct === 'number' &&
    typeof candidate.accuracy === 'number' &&
    typeof candidate.meanRTAll === 'number' &&
    typeof candidate.meanRTCongruent === 'number' &&
    typeof candidate.meanRTIncongruent === 'number' &&
    typeof candidate.stroopInterferenceMs === 'number' &&
    typeof candidate.timestamp === 'number';
  const hasBool = typeof candidate.useCannabisStroop === 'boolean';
  const cannabisOk =
    typeof candidate.cannabisBiasMs === 'undefined' || typeof candidate.cannabisBiasMs === 'number';
  return isMode && hasNumbers && hasBool && cannabisOk;
};

const parseHistory = (raw: string | null): SessionSummary[] => {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(isSessionSummary);
  } catch {
    return [];
  }
};

export async function getStroopHistory(): Promise<SessionSummary[]> {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    return parseHistory(raw);
  } catch {
    return [];
  }
}

export async function getLastStroopSummary(): Promise<SessionSummary | null> {
  const history = await getStroopHistory();
  if (!history.length) return null;
  return history[history.length - 1];
}

export async function saveStroopSession(summary: SessionSummary): Promise<void> {
  const history = await getStroopHistory();
  history.push(summary);
  const trimmed = history.slice(-MAX_SESSIONS);
  try {
    await AsyncStorage.setItem(KEY, JSON.stringify(trimmed));
  } catch {
    // ignore write errors to keep gameplay responsive
  }
}
