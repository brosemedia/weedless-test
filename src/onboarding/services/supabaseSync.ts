import { supabase } from '../../lib/supabase';
import type { OnboardingProfile } from '../types';

/**
 * Synchronisiert Onboarding-Daten zu Supabase.
 * Erstellt oder aktualisiert ein onboarding_profiles-Eintrag.
 */
export async function syncOnboardingToSupabase(
  profile: OnboardingProfile
): Promise<{ success: boolean; error?: string }> {
  try {
    // Hole aktuelle User-ID
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      // Wenn kein User, verwende anonyme ID oder erstelle temporären Eintrag
      console.warn('No authenticated user for onboarding sync, skipping');
      return { success: false, error: 'No authenticated user' };
    }

    // Bereite Daten für Supabase vor
    const onboardingData = {
      user_id: user.id,
      date_of_birth: profile.dateOfBirth,
      goal: profile.goal,
      frequency_per_week: profile.frequencyPerWeek,
      currency: profile.currency,
      weekly_spend: profile.weeklySpend,
      consumption_methods: profile.consumptionMethods,
      consumption_details: profile.consumptionDetails,
      thc_potency_percent: profile.thcPotencyPercent,
      gender: profile.gender,
      impact_level: profile.impactLevel,
      first_use_time_minutes: profile.firstUseTimeMinutes,
      app_plans: profile.appPlans,
      unplanned_use_reasons: profile.unplannedUseReasons,
      pause_plan: profile.pausePlan,
      updated_at: new Date().toISOString(),
    };

    // Upsert in onboarding_profiles Tabelle
    const { error } = await supabase
      .from('onboarding_profiles')
      .upsert(onboardingData, {
        onConflict: 'user_id',
      });

    if (error) {
      console.error('Error syncing onboarding to Supabase:', error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error) {
    console.error('Unexpected error syncing onboarding:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

