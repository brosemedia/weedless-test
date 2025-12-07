import { useEffect, useRef } from 'react';
import type { NavigationContainerRefWithCurrent } from '@react-navigation/native';
import { fetchCurrentProfile } from '../api/profile';
import { getCloudConsentShown, setCloudConsentShown } from '../storage/localFlags';
import { useAuth } from '../contexts/AuthContext';

/**
 * Hook to check if cloud consent screen should be shown after login/signup.
 * 
 * Shows the consent screen if:
 * - User is logged in
 * - Profile exists
 * - consent_server_storage is false
 * - User hasn't explicitly dismissed it before (via "Nicht jetzt")
 */
export function useConsentCheck(navRef: NavigationContainerRefWithCurrent<any> | null) {
  const { user, profile, loading } = useAuth();
  const hasCheckedRef = useRef(false);

  useEffect(() => {
    const checkAndShowConsent = async () => {
      // Don't check if still loading, no user, or already checked
      if (loading || !user || !navRef?.isReady?.() || hasCheckedRef.current) {
        return;
      }

      // Don't check if user is on auth screens
      const currentRoute = navRef.getCurrentRoute()?.name;
      if (currentRoute === 'Login' || currentRoute === 'Register' || currentRoute === 'ResetPassword' || currentRoute === 'CloudConsent') {
        return;
      }

      hasCheckedRef.current = true;

      try {
        // Check if we've already shown the consent screen
        const consentShown = await getCloudConsentShown();
        if (consentShown) {
          // User already dismissed it, don't show again
          return;
        }

        // Fetch current profile to check consent status
        const currentProfile = await fetchCurrentProfile();
        
        if (currentProfile && !currentProfile.consent_server_storage) {
          // Profile exists but consent is false - show consent screen
          // Only show if user hasn't explicitly dismissed it
          navRef.navigate('CloudConsent');
        } else if (!currentProfile) {
          // Profile doesn't exist yet - wait a bit and try again
          // This can happen right after signup before the profile is created
          setTimeout(async () => {
            const retryProfile = await fetchCurrentProfile();
            if (retryProfile && !retryProfile.consent_server_storage) {
              const retryConsentShown = await getCloudConsentShown();
              if (!retryConsentShown) {
                navRef.navigate('CloudConsent');
              }
            }
          }, 1500);
        }
      } catch (error) {
        console.error('Error checking consent:', error);
      }
    };

    // Small delay to ensure navigation is ready
    const timeoutId = setTimeout(checkAndShowConsent, 500);
    return () => clearTimeout(timeoutId);
  }, [user, profile, loading, navRef]);
}

