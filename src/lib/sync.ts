import { supabase } from './supabase';
import { fetchCurrentProfile } from '../api/profile';
import type { DayLog } from '../types/profile';
import type { Pause } from '../types/pause';
import type { Profile } from '../types/profile';

/**
 * Checks if the user has consented to server-side storage.
 * 
 * @returns true if consent_server_storage is true, false otherwise
 */
export async function hasServerStorageConsent(): Promise<boolean> {
  try {
    const profile = await fetchCurrentProfile();
    return profile?.consent_server_storage === true;
  } catch (error) {
    console.error('Error checking server storage consent:', error);
    return false;
  }
}

/**
 * Syncs a day log entry to Supabase if consent is given.
 * 
 * Note: This function requires a 'day_logs' table in Supabase.
 * The table should have columns matching the DayLog structure.
 * 
 * @param dayLog - The day log entry to sync
 * @returns true if synced successfully, false if consent not given or error occurred
 */
export async function syncDayLog(dayLog: DayLog): Promise<boolean> {
  try {
    const hasConsent = await hasServerStorageConsent();
    if (!hasConsent) {
      // No consent - don't sync, but this is not an error
      return false;
    }

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError) {
      console.error('Error getting user for sync:', userError);
      return false;
    }
    if (!user) {
      return false;
    }

    // Convert JSON objects to JSONB format for Supabase
    const checkinJson = dayLog.checkin ? (typeof dayLog.checkin === 'string' ? dayLog.checkin : JSON.stringify(dayLog.checkin)) : null;
    const consumptionEntriesJson = dayLog.consumptionEntries ? (Array.isArray(dayLog.consumptionEntries) ? JSON.stringify(dayLog.consumptionEntries) : dayLog.consumptionEntries) : null;
    const testsJson = dayLog.tests ? (typeof dayLog.tests === 'object' ? JSON.stringify(dayLog.tests) : dayLog.tests) : null;

    const { error } = await supabase
      .from('day_logs')
      .upsert({
        user_id: user.id,
        date: dayLog.date,
        consumed_grams: dayLog.consumedGrams ?? null,
        consumed_joints: dayLog.consumedJoints != null ? Math.round(dayLog.consumedJoints) : null,
        money_spent_eur: dayLog.moneySpentEUR ?? null,
        session_minutes: dayLog.sessionMinutes != null ? Math.round(dayLog.sessionMinutes) : null,
        checkin: checkinJson,
        consumption_entries: consumptionEntriesJson,
        tests: testsJson,
        tasks_done: dayLog.tasksDone ?? [],
        xp_earned: dayLog.xpEarned ?? 0,
        notes: dayLog.notes ?? null,
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'user_id,date'
      });

    if (error) {
      console.error('Error syncing day log:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Unexpected error syncing day log:', error);
    return false;
  }
}

/**
 * Syncs a pause entry to Supabase if consent is given.
 * 
 * Note: This function requires a 'pauses' table in Supabase.
 * 
 * @param pause - The pause entry to sync
 * @returns true if synced successfully, false if consent not given or error occurred
 */
export async function syncPause(pause: Pause): Promise<boolean> {
  try {
    const hasConsent = await hasServerStorageConsent();
    if (!hasConsent) {
      return false;
    }

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError) {
      console.error('Error getting user for pause sync:', userError);
      return false;
    }
    if (!user) {
      return false;
    }

    // Convert stats to JSONB format
    const statsJson = pause.stats ? (typeof pause.stats === 'object' ? JSON.stringify(pause.stats) : pause.stats) : null;

    const { error } = await supabase
      .from('pauses')
      .upsert({
        id: pause.id,
        user_id: user.id,
        start_date: pause.startDate,
        end_date: pause.endDate,
        status: pause.status,
        completed_status: pause.completedStatus ?? null,
        created_at: pause.createdAt,
        start_timestamp: pause.startTimestamp ?? null,
        end_timestamp: pause.endTimestamp ?? null,
        completed_at: pause.completedAt ?? null,
        stats: statsJson,
        xp_awarded_days: pause.xpAwardedDays ?? [],
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'id'
      });

    if (error) {
      console.error('Error syncing pause:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Unexpected error syncing pause:', error);
    return false;
  }
}

/**
 * Creates or updates app_profiles in Supabase.
 * This is used during onboarding and doesn't require consent (only basic profile data).
 * 
 * @param profile - The app profile to create/update
 * @returns true if created/updated successfully, false if error occurred
 */
export async function createOrUpdateAppProfile(profile: Profile): Promise<boolean> {
  try {
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError) {
      console.error('Error getting user for app profile creation:', userError);
      return false;
    }
    if (!user) {
      return false;
    }

    const { error } = await supabase
      .from('app_profiles')
      .upsert({
        user_id: user.id,
        price_per_gram: profile.pricePerGram ?? null,
        cost_per_joint: profile.costPerJoint ?? null,
        grams_per_day_baseline: profile.gramsPerDayBaseline ?? null,
        joints_per_day_baseline: profile.jointsPerDayBaseline ?? null,
        avg_session_minutes: profile.avgSessionMinutes ?? null,
        start_timestamp: profile.startTimestamp,
        money_calculation_start_timestamp: profile.moneyCalculationStartTimestamp ?? profile.startTimestamp,
        last_consumption_at: profile.lastConsumptionAt ?? null,
        longest_streak_hours: profile.longestStreakHours ?? null,
        consumption_methods: profile.consumptionMethods ?? null,
        locale: profile.locale ?? 'de-DE',
        version: profile.version ?? 2,
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'user_id'
      });

    if (error) {
      console.error('Error creating/updating app profile:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Unexpected error creating/updating app profile:', error);
    return false;
  }
}

/**
 * Syncs the app profile to Supabase if consent is given.
 * This is used for ongoing syncs and requires consent.
 * 
 * @param profile - The app profile to sync
 * @returns true if synced successfully, false if consent not given or error occurred
 */
export async function syncAppProfile(profile: Profile): Promise<boolean> {
  try {
    const hasConsent = await hasServerStorageConsent();
    if (!hasConsent) {
      return false;
    }

    // Use the same function to create/update, but only if consent is given
    return await createOrUpdateAppProfile(profile);
  } catch (error) {
    console.error('Unexpected error syncing app profile:', error);
    return false;
  }
}

/**
 * Loads the app profile from Supabase.
 * 
 * @returns The app profile or null if not found or error occurred
 */
export async function loadAppProfile(): Promise<Profile | null> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return null;
    }

    const { data, error } = await supabase
      .from('app_profiles')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle();

    if (error) {
      console.error('Error loading app profile:', error);
      return null;
    }

    if (!data) {
      return null;
    }

    return {
      pricePerGram: data.price_per_gram ? Number(data.price_per_gram) : undefined,
      costPerJoint: data.cost_per_joint ? Number(data.cost_per_joint) : undefined,
      gramsPerDayBaseline: data.grams_per_day_baseline ? Number(data.grams_per_day_baseline) : undefined,
      jointsPerDayBaseline: data.joints_per_day_baseline ? Number(data.joints_per_day_baseline) : undefined,
      avgSessionMinutes: data.avg_session_minutes ?? undefined,
      startTimestamp: Number(data.start_timestamp),
      moneyCalculationStartTimestamp: data.money_calculation_start_timestamp
        ? Number(data.money_calculation_start_timestamp)
        : Number(data.start_timestamp),
      lastConsumptionAt: data.last_consumption_at ? Number(data.last_consumption_at) : undefined,
      longestStreakHours: data.longest_streak_hours ? Number(data.longest_streak_hours) : undefined,
      consumptionMethods: (data as any).consumption_methods ?? undefined,
      locale: data.locale ?? 'de-DE',
      version: data.version ?? 2,
    };
  } catch (error) {
    console.error('Unexpected error loading app profile:', error);
    return null;
  }
}

/**
 * Loads all day logs from Supabase.
 * 
 * @returns Record of day logs keyed by date (YYYY-MM-DD) or empty object if error
 */
export async function loadDayLogs(): Promise<Record<string, DayLog>> {
  const hasConsent = await hasServerStorageConsent();
  if (!hasConsent) {
    return {};
  }

  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return {};
    }

    const { data, error } = await supabase
      .from('day_logs')
      .select('*')
      .eq('user_id', user.id)
      .order('date', { ascending: false });

    if (error) {
      console.error('Error loading day logs:', error);
      return {};
    }

    if (!data || data.length === 0) {
      return {};
    }

    const dayLogs: Record<string, DayLog> = {};
    for (const row of data) {
      dayLogs[row.date] = {
        date: row.date,
        consumedGrams: row.consumed_grams ? Number(row.consumed_grams) : undefined,
        consumedJoints: row.consumed_joints ?? undefined,
        moneySpentEUR: row.money_spent_eur ? Number(row.money_spent_eur) : undefined,
        sessionMinutes: row.session_minutes ?? undefined,
        checkin: row.checkin || undefined,
        consumptionEntries: row.consumption_entries || undefined,
        tests: row.tests || undefined,
        tasksDone: row.tasks_done ?? [],
        xpEarned: row.xp_earned ?? 0,
        notes: row.notes ?? undefined,
      };
    }

    return dayLogs;
  } catch (error) {
    console.error('Unexpected error loading day logs:', error);
    return {};
  }
}

/**
 * Loads all pauses from Supabase.
 * 
 * @returns Array of pauses or empty array if error
 */
export async function loadPauses(): Promise<Pause[]> {
  const hasConsent = await hasServerStorageConsent();
  if (!hasConsent) {
    return [];
  }

  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return [];
    }

    const { data, error } = await supabase
      .from('pauses')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error loading pauses:', error);
      return [];
    }

    if (!data || data.length === 0) {
      return [];
    }

    return data.map((row) => ({
      id: row.id,
      startDate: row.start_date,
      endDate: row.end_date,
      status: row.status as Pause['status'],
      createdAt: Number(row.created_at),
      startTimestamp: row.start_timestamp ? Number(row.start_timestamp) : undefined,
      endTimestamp: row.end_timestamp ? Number(row.end_timestamp) : undefined,
      completedAt: row.completed_at ? Number(row.completed_at) : undefined,
      completedStatus: row.completed_status as Pause['completedStatus'] | undefined,
      stats: row.stats || undefined,
      xpAwardedDays: row.xp_awarded_days ?? [],
    }));
  } catch (error) {
    console.error('Unexpected error loading pauses:', error);
    return [];
  }
}

/**
 * Syncs all local data to Supabase if consent is given.
 * This is a convenience function that can be called periodically or on app start.
 * 
 * @param profile - The app profile
 * @param dayLogs - Record of all day logs
 * @param pauses - Array of all pauses
 */
export async function syncAllData(
  profile: Profile | null,
  dayLogs: Record<string, DayLog>,
  pauses: Pause[]
): Promise<void> {
  const hasConsent = await hasServerStorageConsent();
  if (!hasConsent) {
    return;
  }

  // Sync app profile
  if (profile) {
    await syncAppProfile(profile);
  }

  // Sync all day logs
  for (const dayLog of Object.values(dayLogs)) {
    await syncDayLog(dayLog);
  }

  // Sync all pauses
  for (const pause of pauses) {
    await syncPause(pause);
  }
}
