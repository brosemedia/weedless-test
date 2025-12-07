import { useEffect, useRef } from 'react';
import { useApp } from '../store/app';
import { useAuth } from '../contexts/AuthContext';
import { useLoading } from '../contexts/LoadingContext';
import { loadAllSyncData } from '../lib/loadSyncData';
import { syncAllData } from '../lib/sync';

/**
 * Hook to load and sync data from Supabase on app start.
 * 
 * - Loads data from Supabase when user is logged in and has consented
 * - Merges with local data (local takes precedence for conflicts)
 * - Syncs local changes back to Supabase
 */
export function useSyncData() {
  const { user, profile: supabaseProfile } = useAuth();
  const hydrated = useApp((s) => s.hydrated);
  const profile = useApp((s) => s.profile);
  const dayLogs = useApp((s) => s.dayLogs);
  const pauses = useApp((s) => s.pauses);
  const replaceProfile = useApp((s) => s.replaceProfile);
  const setDayLogs = useApp((s) => s.setDayLogs);
  const { showLoading, hideLoading } = useLoading();
  const hasLoadedRef = useRef(false);

  useEffect(() => {
    // Only load once after hydration and if user is logged in
    if (!hydrated) {
      return;
    }

    // Reset loader when user signs out so we reload on next sign-in
    if (!user) {
      hasLoadedRef.current = false;
      return;
    }

    if (hasLoadedRef.current) {
      return;
    }

    const loadData = async () => {
      try {
        showLoading('Daten werden geladen...');

        // Always load the base app profile (app_profiles) even without consent
        const syncData = await loadAllSyncData();
        if (syncData?.profile) {
          if (!profile) {
            replaceProfile(syncData.profile);
          } else {
            const serverNewer =
              (syncData.profile.lastConsumptionAt ?? 0) > (profile.lastConsumptionAt ?? 0) ||
              syncData.profile.startTimestamp > profile.startTimestamp;
            if (serverNewer) {
              replaceProfile(syncData.profile);
            }
          }

          // Normalize KPI selection based on consumption methods
          try {
            const { useUiStore } = await import('../store/ui');
            const methods = syncData.profile.consumptionMethods ?? [];
            const hasJoints = methods.some((m) => m === 'joints' || m === 'blunts');
            const hasSessions = methods.some((m) => m === 'bongs' || m === 'pipes');
            const { selectedKpis, setSelectedKpis } = useUiStore.getState();
            let next = [...selectedKpis];
            if (!hasJoints && hasSessions) {
              next = next.map((kpi) => (kpi === 'joints' ? 'time' : kpi));
              if (!next.includes('time')) next.push('time');
              next = Array.from(new Set(next));
            } else if (!hasJoints && !hasSessions) {
              next = next.filter((kpi) => kpi !== 'joints');
            }
            if (next.length === 0) next = ['money', 'time', 'grams', 'streak'].slice(0, selectedKpis.length || 4);
            if (next.join('|') !== selectedKpis.join('|')) {
              setSelectedKpis(next.slice(0, 4));
            }
          } catch (uiError) {
            console.warn('Could not normalize KPIs:', uiError);
          }
        }

        // Only load and sync usage data when consent is granted
        if (supabaseProfile?.consent_server_storage === true && syncData) {
          // Merge day logs - server data fills gaps, but local takes precedence
          const mergedDayLogs = { ...syncData.dayLogs, ...dayLogs };
          setDayLogs(mergedDayLogs);

          const localPauseIds = new Set(pauses.map((p) => p.id));
          const serverPauses = syncData.pauses.filter((p) => !localPauseIds.has(p.id));
          void serverPauses; // placeholder until setPauses exists

          if (profile) {
            showLoading('Daten werden synchronisiert...');
            await syncAllData(profile, dayLogs, pauses);
          }
        }

        hasLoadedRef.current = true;
        hideLoading();
      } catch (error) {
        console.error('Error loading sync data:', error);
        hasLoadedRef.current = true;
        hideLoading();
      }
    };

    loadData();
  }, [hydrated, user, supabaseProfile, profile, dayLogs, pauses, replaceProfile]);
}
