import { loadAppProfile, loadDayLogs, loadPauses } from './sync';
import type { Profile } from '../types/profile';
import type { DayLog } from '../types/profile';
import type { Pause } from '../types/pause';

/**
 * Loads all synced data from Supabase and returns it.
 * This should be called on app start if the user has consented to server storage.
 * 
 * @returns Object with profile, dayLogs, and pauses, or null if consent not given
 */
export async function loadAllSyncData(): Promise<{
  profile: Profile | null;
  dayLogs: Record<string, DayLog>;
  pauses: Pause[];
} | null> {
  try {
    const profile = await loadAppProfile();
    const dayLogs = await loadDayLogs();
    const pauses = await loadPauses();

    return {
      profile,
      dayLogs,
      pauses,
    };
  } catch (error) {
    console.error('Error loading sync data:', error);
    return null;
  }
}

