import AsyncStorage from '@react-native-async-storage/async-storage';
import { SessionResult } from '../game/types';

const STORAGE_KEY = 'zenglide:history';
const MAX_HISTORY = 50;

export async function saveZenGlideResult(result: SessionResult): Promise<void> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    const history: SessionResult[] = raw ? JSON.parse(raw) : [];
    const next = [result, ...history].slice(0, MAX_HISTORY);
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch (error) {
    console.warn('[ZenGlide] Failed to persist result', error);
  }
}

export async function getZenGlideHistory(): Promise<SessionResult[]> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      return parsed.filter(
        (item): item is SessionResult =>
          typeof item === 'object' &&
          !!item &&
          typeof item.dateISO === 'string' &&
          typeof item.durationSec === 'number' &&
          typeof item.score === 'number'
      );
    }
    return [];
  } catch {
    return [];
  }
}
