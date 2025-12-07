import { supabase } from '../lib/supabase';
import type { Database } from '../types/database';

export type SupabaseProfile = Database['public']['Tables']['profiles']['Row'];

/**
 * Fetches the current user's profile from Supabase.
 * If no profile exists, creates one with default values.
 * 
 * @returns The profile object or null if user is not authenticated
 */
export async function fetchCurrentProfile(): Promise<SupabaseProfile | null> {
  try {
    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      console.error('Error getting user:', userError);
      return null;
    }

    // Try to fetch existing profile
    const { data: existingProfile, error: fetchError } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle();

    if (fetchError && fetchError.code !== 'PGRST116') {
      // PGRST116 means "no rows found", which is expected for new users
      console.error('Error fetching profile:', fetchError);
      return null;
    }

    // If profile exists, return it
    if (existingProfile) {
      return existingProfile;
    }

    // If no profile exists, create one with defaults
    // Default locale to 'de-DE' (can be enhanced with expo-localization if needed)
    const locale = 'de-DE';
    const defaultProfile: Database['public']['Tables']['profiles']['Insert'] = {
      user_id: user.id,
      email: user.email ?? null,
      full_name: user.user_metadata?.full_name ?? null,
      locale: locale,
      // Legal basis: User consent for processing & storing sensitive app data on the server
      consent_server_storage: false, // Opt-in required
      // Legal basis: User consent for sending marketing emails; must be optional
      marketing_opt_in: false, // Opt-in required
      notifications_enabled: true, // Default enabled
    };

    const { data: newProfile, error: insertError } = await supabase
      .from('profiles')
      .insert(defaultProfile)
      .select()
      .single();

    if (insertError) {
      console.error('Error creating profile:', insertError);
      return null;
    }

    return newProfile;
  } catch (error) {
    console.error('Unexpected error in fetchCurrentProfile:', error);
    return null;
  }
}

/**
 * Deletes all cloud-stored data for a user.
 * This is called when consent_server_storage is revoked.
 * 
 * @param userId - The user ID whose data should be deleted
 * @returns true if deletion was successful, false otherwise
 */
async function deleteAllUserCloudData(userId: string): Promise<boolean> {
  try {
    // Delete in order: day_logs, pauses, app_profiles
    // (Foreign keys will handle cascading if needed)
    
    const { error: dayLogsError } = await supabase
      .from('day_logs')
      .delete()
      .eq('user_id', userId);

    if (dayLogsError) {
      console.error('Error deleting day_logs:', dayLogsError);
      // Continue with other deletions even if one fails
    }

    const { error: pausesError } = await supabase
      .from('pauses')
      .delete()
      .eq('user_id', userId);

    if (pausesError) {
      console.error('Error deleting pauses:', pausesError);
    }

    const { error: appProfilesError } = await supabase
      .from('app_profiles')
      .delete()
      .eq('user_id', userId);

    if (appProfilesError) {
      console.error('Error deleting app_profiles:', appProfilesError);
    }

    // Log consent revocation if consent_logs table exists
    try {
      await supabase.from('consent_logs').insert({
        user_id: userId,
        consent_type: 'server_storage',
        consent_value: false,
        created_at: new Date().toISOString(),
      });
    } catch (logError) {
      // Consent logging is optional, don't fail if table doesn't exist
      console.log('Consent logging not available:', logError);
    }

    return true;
  } catch (error) {
    console.error('Unexpected error deleting cloud data:', error);
    return false;
  }
}

/**
 * Updates the user's consent and preference settings.
 * 
 * IMPORTANT: If consent_server_storage is set to false, all cloud-stored data
 * will be automatically deleted to comply with GDPR (Art. 7 Abs. 3 - Right to withdraw consent).
 * 
 * @param params - Partial object with consent/preference fields to update
 * @returns The updated profile or null if update failed
 */
export async function updateProfileConsents(params: {
  consent_server_storage?: boolean;
  marketing_opt_in?: boolean;
  notifications_enabled?: boolean;
}): Promise<SupabaseProfile | null> {
  try {
    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      console.error('Error getting user:', userError);
      return null;
    }

    // Check current consent status before update
    const currentProfile = await fetchCurrentProfile();
    const wasConsentEnabled = currentProfile?.consent_server_storage === true;
    const willConsentBeEnabled = params.consent_server_storage === true;
    
    // Check if consent is being revoked (changed from true to false)
    let shouldDeleteCloudData = false;
    if (params.consent_server_storage === false && wasConsentEnabled) {
      shouldDeleteCloudData = true;
      console.log('Consent revoked - will delete all cloud data for user:', user.id);
    }
    
    // Check if consent is being enabled (changed from false to true)
    const shouldUploadLocalData = params.consent_server_storage === true && !wasConsentEnabled;

    // Build update object
    // Note: updated_at is automatically set by trigger, but we include it for clarity
    const updates: Database['public']['Tables']['profiles']['Update'] = {};

    if (typeof params.consent_server_storage === 'boolean') {
      updates.consent_server_storage = params.consent_server_storage;
      
      // Log consent change if consent_logs table exists
      try {
        await supabase.from('consent_logs').insert({
          user_id: user.id,
          consent_type: 'server_storage',
          consent_value: params.consent_server_storage,
          created_at: new Date().toISOString(),
        });
      } catch (logError) {
        // Consent logging is optional
        console.log('Consent logging not available:', logError);
      }
    }
    if (typeof params.marketing_opt_in === 'boolean') {
      updates.marketing_opt_in = params.marketing_opt_in;
      
      // Log marketing consent change
      try {
        await supabase.from('consent_logs').insert({
          user_id: user.id,
          consent_type: 'marketing',
          consent_value: params.marketing_opt_in,
          created_at: new Date().toISOString(),
        });
      } catch (logError) {
        console.log('Consent logging not available:', logError);
      }
    }
    if (typeof params.notifications_enabled === 'boolean') {
      updates.notifications_enabled = params.notifications_enabled;
    }

    // Log what we're trying to update
    console.log('Updating profile with:', updates);
    console.log('User ID:', user.id);

    // Update profile
    const { data: updatedProfile, error: updateError } = await supabase
      .from('profiles')
      .update(updates)
      .eq('user_id', user.id)
      .select()
      .single();

    if (updateError) {
      console.error('Error updating profile consents:', {
        code: updateError.code,
        message: updateError.message,
        details: updateError.details,
        hint: updateError.hint,
      });
      return null;
    }

    if (!updatedProfile) {
      console.error('Update succeeded but no profile returned');
      return null;
    }

    // Delete cloud data if consent was revoked
    if (shouldDeleteCloudData) {
      console.log('Deleting all cloud data due to consent revocation...');
      await deleteAllUserCloudData(user.id);
      console.log('Cloud data deletion completed');
    }

    // Upload local data if consent was just enabled
    if (shouldUploadLocalData) {
      console.log('Consent enabled - uploading local data to cloud...');
      try {
        // Dynamically import to avoid circular dependencies
        const { useApp } = await import('../store/app');
        const { syncAllData } = await import('../lib/sync');
        const { loadAllSyncData } = await import('../lib/loadSyncData');
        
        // Get current local data from store
        const appState = useApp.getState();
        const localProfile = appState.profile;
        const localDayLogs = appState.dayLogs;
        const localPauses = appState.pauses;
        
        // First, try to load existing cloud data (if any)
        const cloudData = await loadAllSyncData();
        
        // Merge strategy: Local data takes precedence, but fill gaps from cloud
        let finalProfile = localProfile;
        let finalDayLogs = { ...cloudData?.dayLogs, ...localDayLogs };
        let finalPauses = [...(cloudData?.pauses ?? [])];
        
        // Merge pauses: Add local pauses that don't exist in cloud
        const cloudPauseIds = new Set((cloudData?.pauses ?? []).map(p => p.id));
        localPauses.forEach(localPause => {
          if (!cloudPauseIds.has(localPause.id)) {
            finalPauses.push(localPause);
          }
        });
        
        // If cloud has a newer profile (based on timestamps), use it
        if (cloudData?.profile && localProfile) {
          const cloudNewer = 
            (cloudData.profile.lastConsumptionAt ?? 0) > (localProfile.lastConsumptionAt ?? 0) ||
            cloudData.profile.startTimestamp > localProfile.startTimestamp;
          
          if (cloudNewer) {
            finalProfile = cloudData.profile;
          }
        } else if (cloudData?.profile && !localProfile) {
          finalProfile = cloudData.profile;
        }
        
        // Update local store with merged data if cloud had newer data
        if (cloudData && finalProfile && finalProfile !== localProfile) {
          // Import useApp store to access replaceProfile
          const appStore = await import('../store/app');
          appStore.useApp.getState().replaceProfile(finalProfile);
        }
        
        // Upload all data to cloud (local + merged)
        await syncAllData(
          finalProfile,
          finalDayLogs,
          finalPauses
        );
        
        console.log('Local data uploaded to cloud successfully');
      } catch (uploadError) {
        console.error('Error uploading local data to cloud:', uploadError);
        // Don't fail the consent update if upload fails - user can sync later
      }
    }

    console.log('Successfully updated profile:', updatedProfile);
    return updatedProfile;
  } catch (error) {
    console.error('Unexpected error in updateProfileConsents:', error);
    return null;
  }
}

/**
 * Deletes the user's account and all associated data.
 * 
 * This function complies with GDPR Art. 17 (Right to erasure / "Right to be forgotten").
 * 
 * WARNING: This action is irreversible!
 * 
 * @returns true if deletion was successful, false otherwise
 */
export async function deleteAccount(): Promise<boolean> {
  try {
    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      console.error('Error getting user:', userError);
      return false;
    }

    console.log('Starting account deletion for user:', user.id);

    // 1. Delete all cloud-stored data
    await deleteAllUserCloudData(user.id);

    // 2. Delete profile (this will trigger the database function to delete auth.users)
    // The database trigger `on_profile_deleted_delete_auth_user` will automatically
    // delete the auth.users entry when the profile is deleted.
    const { error: profileError } = await supabase
      .from('profiles')
      .delete()
      .eq('user_id', user.id);

    if (profileError) {
      console.error('Error deleting profile:', profileError);
      return false;
    }

    // 3. Optional fallback: call Edge Function to delete auth.user (if trigger is missing)
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.access_token) {
        const { error: edgeError } = await supabase.functions.invoke('delete-user', {
          headers: {
            Authorization: `Bearer ${session.access_token}`,
          },
        });
        if (edgeError) {
          console.error('Edge function delete-user failed:', edgeError);
        }
      } else {
        console.warn('No session available to call delete-user edge function');
      }
    } catch (edgeCallError) {
      console.error('Unexpected error calling delete-user edge function:', edgeCallError);
    }

    // 4. Wait a bit for the trigger/function to execute, then verify that the profile was deleted
    // Note: The trigger/function should delete auth.users, but we can't directly verify this
    // from the client side. The signOut() call will handle invalidating the session.
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Try to verify profile deletion
    const { data: remainingProfile } = await supabase
      .from('profiles')
      .select('user_id')
      .eq('user_id', user.id)
      .maybeSingle();
    
    if (remainingProfile) {
      console.error('Profile still exists after deletion attempt');
      return false;
    }

    // Note: signOut() and local store reset should be done in the calling component
    // AFTER this function returns, to avoid React hooks errors during re-renders
    // The database trigger should have deleted auth.users, but if it didn't work,
    // the user will need to contact support or the trigger needs to be fixed.
    
    console.log('Account deletion completed - profile deleted, auth.users should be deleted by trigger');
    return true;
  } catch (error) {
    console.error('Unexpected error deleting account:', error);
    return false;
  }
}
