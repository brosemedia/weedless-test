import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { StepScreen } from '../components/StepScreen';
import { Card } from '../components/Card';
import { useOnboardingStore } from '../store';
import { useOnboardingStep } from '../hooks';
import { syncOnboardingToSupabase } from '../services/supabaseSync';
import { colors, spacing, typography } from '../theme';
import { useApp } from '../../store/app';
import { onboardingProfileToAppProfile } from '../utils/toAppProfile';
import { scheduleAllOnboardingNotifications } from '../services/notifications';
import { updateProfileConsents } from '../../api/profile';
import { createOrUpdateAppProfile, syncAppProfile } from '../../lib/sync';
import { useStore } from '../../store/useStore';
import { KpiType, DEFAULT_KPIS, useUiStore } from '../../store/ui';
import type { ConsumptionMethod } from '../types';
import { track } from '../services/analytics';

const deriveKpisForMethods = (methods: ConsumptionMethod[]): KpiType[] => {
  const picked: KpiType[] = [];
  const add = (kpi: KpiType) => {
    if (!picked.includes(kpi)) {
      picked.push(kpi);
    }
  };

  // Always keep money first so users see monetary impact
  add('money');

  const hasJoints = methods.some((m) => m === 'joints' || m === 'blunts');
  const hasSessions = methods.some((m) => m === 'bongs' || m === 'pipes');
  const hasOtherConsumption = methods.some((m) =>
    ['edibles', 'vapes', 'capsules', 'oils', 'dabs'].includes(m)
  );

  if (hasJoints) {
    add('joints');
  } else if (hasSessions) {
    add('time'); // session-focused users see time instead of joints
  }
  if (hasSessions && hasJoints) {
    add('time');
  }
  if (hasOtherConsumption) add('grams');

  // Fill up to 4 with sensible defaults to keep grid populated
  DEFAULT_KPIS.forEach((kpi) => {
    if (picked.length < 4) {
      add(kpi);
    }
  });

  return picked.slice(0, 4);
};

export const FinalSetupScreen: React.FC = () => {
  const { stepNumber, totalSteps, goNext } = useOnboardingStep('FinalSetup');
  const profile = useOnboardingStore((state) => state.profile);
  const markCompleted = useOnboardingStore((state) => state.markCompleted);
  const startPause = useApp((state) => state.startPause);
  const replaceProfile = useApp((state) => state.replaceProfile);
  const legacyUpdateProfile = useStore((s) => s.updateProfile);
  const setSelectedKpis = useUiStore((s) => s.setSelectedKpis);
  const [status, setStatus] = useState<string>('Wir richten Hazeless für dich ein…');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const setup = async () => {
      try {
        setStatus('Deine Daten werden gespeichert…');
        track('onboarding_completed', { goal: profile.goal });

        const mappedProfile = onboardingProfileToAppProfile(profile);
        replaceProfile(mappedProfile);
        const storedProfile = useApp.getState().profile;
        if (!storedProfile) {
          console.warn('Profile was not yet in app store after replace - retrying set.');
          replaceProfile(mappedProfile);
        }

        // Legacy store for backward compatibility (old dashboards/stats)
        const startIso = new Date(mappedProfile.startTimestamp).toISOString();
        legacyUpdateProfile({
          pricePerGram: mappedProfile.pricePerGram ?? undefined,
          gramsPerDayBaseline: mappedProfile.gramsPerDayBaseline ?? undefined,
          jointsPerDayBaseline: mappedProfile.jointsPerDayBaseline ?? undefined,
          avgSessionMinutes: mappedProfile.avgSessionMinutes ?? undefined,
          pauseStartISO: startIso,
          startedAt: startIso,
          baseline: {
            unit: 'g',
            amountPerDay: mappedProfile.gramsPerDayBaseline ?? 0,
            pricePerUnit: mappedProfile.pricePerGram ?? 0,
          },
        });

        // Personalise KPI grid based on chosen consumption methods
        setSelectedKpis(deriveKpisForMethods(profile.consumptionMethods));

        // 2. Daten zu Supabase synchronisieren
        setStatus('Daten werden synchronisiert…');
        const syncResult = await syncOnboardingToSupabase(profile);
        if (!syncResult.success) {
          console.warn('Supabase sync failed (non-critical):', syncResult.error);
        }

        const appProfileCreated = await createOrUpdateAppProfile(mappedProfile);
        if (!appProfileCreated) {
          console.warn('App profile could not be saved to Supabase (will retry on sync).');
        }

        // Persist consent choice (required even when opting out)
        try {
          await updateProfileConsents({ consent_server_storage: profile.cloudSyncConsent ?? false });
        } catch (consentError) {
          console.error('Failed to save consent choice:', consentError);
        }

        if (profile.cloudSyncConsent) {
          await syncAppProfile(mappedProfile);
        }

        // Notifications based on quit/last consumption date
        setStatus('Erinnerungen werden eingerichtet…');
        await scheduleAllOnboardingNotifications(profile);

        // 3. Pause aktivieren, falls gewünscht
        if (profile.goal === 'pause' && profile.pausePlan?.active) {
          setStatus('Pause wird aktiviert…');
          const pausePlan = profile.pausePlan;
          const startDate = pausePlan.startDate;
          const startDateObj = new Date(startDate);
          const endDateObj = new Date(startDateObj);
          endDateObj.setDate(endDateObj.getDate() + pausePlan.durationDays);
          const endDate = endDateObj.toISOString().split('T')[0];

          const result = startPause({
            startDate,
            endDate,
            startTimestamp: startDateObj.getTime(),
            endTimestamp: endDateObj.getTime(),
          });

          if (!result.ok) {
            console.warn('Failed to start pause:', result.reason);
          }
        }

        setStatus('Dashboard wird vorbereitet…');

        // 5. Onboarding als abgeschlossen markieren
        markCompleted();

        // 6. Navigation zum Dashboard
        setStatus('Fertig!');
        await new Promise((resolve) => setTimeout(resolve, 500));
        
        // Navigation erfolgt automatisch durch OnboardingNavigator
        // nach markCompleted()
      } catch (error) {
        console.error('Error during final setup:', error);
        setStatus('Ein Fehler ist aufgetreten. Du kannst trotzdem fortfahren.');
      } finally {
        setLoading(false);
        // Navigiere nach kurzer Verzögerung
        setTimeout(() => {
          goNext();
        }, 1000);
      }
    };

    setup();
  }, [profile, markCompleted, startPause, goNext, replaceProfile, legacyUpdateProfile, setSelectedKpis]);

  return (
    <StepScreen
      title="Wir richten Hazeless für dich ein…"
      subtitle="Einen Moment – wir speichern deine Daten und bereiten dein Dashboard vor."
      step={stepNumber}
      total={totalSteps}
      onNext={() => {}}
      showBack={false}
      nextDisabled={true}
    >
      <Card>
        <View style={styles.container}>
          {loading && <ActivityIndicator size="large" color={colors.primary} />}
          <Text style={styles.statusText}>{status}</Text>
        </View>
      </Card>
    </StepScreen>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xxl,
    minHeight: 200,
  },
  statusText: {
    ...typography.body,
    textAlign: 'center',
    marginTop: spacing.lg,
    color: colors.muted,
  },
});
