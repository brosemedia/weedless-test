import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, Switch } from 'react-native';
import { StepScreen } from '../components/StepScreen';
import { Card } from '../components/Card';
import { useOnboardingStore } from '../store';
import { useStrings } from '../i18n/useStrings';
import { useOnboardingStep } from '../hooks';
import { colors, spacing, typography } from '../theme';
import { costPerDay, gramsPerDay, pauseEndDate, savingsSinceQuit, thcMgPerDay } from '../utils/calculations';
import { formatCurrency, formatDate, formatTimeString } from '../utils/format';
import { scheduleAllOnboardingNotifications } from '../services/notifications';
import { track } from '../services/analytics';
import { useApp } from '../../store/app';
import { onboardingProfileToAppProfile } from '../utils/toAppProfile';
import { useStore } from '../../store/useStore';
import { syncAppProfile } from '../../lib/sync';
import { updateProfileConsents } from '../../api/profile';

export const SummaryScreen: React.FC = () => {
  const { stepNumber, totalSteps, goBack, mode } = useOnboardingStep('Summary');
  const profile = useOnboardingStore((state) => state.profile);
  const markCompleted = useOnboardingStore((state) => state.markCompleted);
  const mergeProfile = useOnboardingStore((state) => state.mergeProfile);
  const replaceProfile = useApp((state) => state.replaceProfile);
  const legacyUpdateProfile = useStore((s) => s.updateProfile);
  const strings = useStrings();
  const [pending, setPending] = useState(false);
  const cloudConsent = profile.cloudSyncConsent ?? false;

  const cost = useMemo(() => costPerDay(profile), [profile]);
  const grams = useMemo(() => gramsPerDay(profile), [profile]);
  const thc = useMemo(() => thcMgPerDay(profile), [profile]);
  const savings = useMemo(() => savingsSinceQuit(profile), [profile]);
  const pauseEnd = useMemo(() => pauseEndDate(profile), [profile]);

  const handleSubmit = async () => {
    if (pending) return;
    setPending(true);
    try {
      track('onboarding_completed', { mode });
      track('estimate_confidence', { ...cost });
      track('profile_created', {
        goal: profile.goal,
        region: profile.region,
        baseline: profile.baseline,
        grams_per_day: grams,
        thc_mg_per_day: thc,
      });
      await scheduleAllOnboardingNotifications(profile);
      const mapped = onboardingProfileToAppProfile(profile);
      
      // Log the mapped profile to debug
      console.log('Onboarding completed - mapped profile:', {
        startTimestamp: mapped.startTimestamp,
        gramsPerDayBaseline: mapped.gramsPerDayBaseline,
        jointsPerDayBaseline: mapped.jointsPerDayBaseline,
        pricePerGram: mapped.pricePerGram,
        avgSessionMinutes: mapped.avgSessionMinutes,
      });
      
      // Replace profile in app store (this is the main store for statistics)
      replaceProfile(mapped);
      
      // Verify profile was set correctly
      const { useApp } = await import('../../store/app');
      const profileAfterSet = useApp.getState().profile;
      if (!profileAfterSet) {
        console.error('Profile was not set correctly in app store!');
        // Try again
        replaceProfile(mapped);
      } else {
        console.log('Profile set in app store successfully:', {
          hasGramsPerDay: !!profileAfterSet.gramsPerDayBaseline,
          hasJointsPerDay: !!profileAfterSet.jointsPerDayBaseline,
          hasStartTimestamp: !!profileAfterSet.startTimestamp,
        });
      }
      
      // Also update legacy store for compatibility
      const startIso = new Date(mapped.startTimestamp).toISOString();
      legacyUpdateProfile({
        pricePerGram: mapped.pricePerGram ?? undefined,
        gramsPerDayBaseline: mapped.gramsPerDayBaseline ?? undefined,
        jointsPerDayBaseline: mapped.jointsPerDayBaseline ?? undefined,
        avgSessionMinutes: mapped.avgSessionMinutes ?? undefined,
        pauseStartISO: startIso,
        startedAt: startIso,
        baseline: {
          unit: 'g',
          amountPerDay: mapped.gramsPerDayBaseline ?? 0,
          pricePerUnit: mapped.pricePerGram ?? 0,
        },
      });
      
      // Update consent if user opted in
      if (cloudConsent) {
        try {
          await updateProfileConsents({ consent_server_storage: true });
          console.log('Cloud sync consent saved');
        } catch (error) {
          console.error('Error saving consent:', error);
        }
      }
      
      // Always create app_profiles entry (doesn't require consent - only basic profile data)
      const { createOrUpdateAppProfile } = await import('../../lib/sync');
      const appProfileCreated = await createOrUpdateAppProfile(mapped);
      if (appProfileCreated) {
        console.log('App profile created in Supabase successfully');
      } else {
        console.warn('Failed to create app profile in Supabase');
      }
      
      // Also sync if consent is given (for full sync of tracking data)
      if (cloudConsent) {
        const { syncAppProfile } = await import('../../lib/sync');
        const synced = await syncAppProfile(mapped);
        if (synced) {
          console.log('Profile fully synced to Supabase (with consent)');
        }
      }
      
      // Wait a bit to ensure profile is persisted before marking as completed
      // This gives AsyncStorage time to save the profile
      await new Promise(resolve => setTimeout(resolve, 200));
      
      // Verify profile is still there before marking as completed
      const finalProfileCheck = useApp.getState().profile;
      if (!finalProfileCheck) {
        console.error('Profile disappeared from app store! Setting again...');
        replaceProfile(mapped);
        // Wait again after setting
        await new Promise(resolve => setTimeout(resolve, 200));
        
        // Final check - if still not there, log error but continue
        const finalCheck2 = useApp.getState().profile;
        if (!finalCheck2) {
          console.error('CRITICAL: Profile still not in app store after retry!', {
            mappedProfile: mapped,
            storeState: useApp.getState(),
          });
        } else {
          console.log('Profile successfully set after retry');
        }
      } else {
        console.log('Profile confirmed in app store before marking completed');
      }
      
      markCompleted();
      console.log('Onboarding marked as completed');
    } catch (error) {
      console.error('Error completing onboarding:', error);
    } finally {
      setPending(false);
    }
  };

  return (
    <StepScreen
      title={strings.summary.title}
      subtitle={strings.summary.subtitle}
      step={stepNumber}
      total={totalSteps}
      onNext={handleSubmit}
      onBack={goBack}
      nextDisabled={pending}
      nextLabel={strings.summary.completeCta}
    >
      <View style={styles.badgeRow}>
        {mode === 'quick' ? <Text style={styles.badge}>{strings.summary.quickModeBadge}</Text> : null}
      </View>
      <Card>
        <Text style={styles.cardTitle}>{strings.summary.planCard}</Text>
        <Text style={styles.cardValue}>{profile.goal.toUpperCase()}</Text>
        {pauseEnd ? <Text style={styles.cardDetail}>{`Ende der Pause: ${formatDate(pauseEnd)}`}</Text> : null}
        <Text style={styles.cardDetail}>{`Formen: ${profile.consumption.forms.join(', ') || '–'}`}</Text>
      </Card>
      <Card style={styles.cardSpacing}>
        <Text style={styles.cardTitle}>{strings.summary.costCard}</Text>
        <Text style={styles.cardValue}>
          {formatCurrency(cost.value * 7, profile.currency)} / Woche ({cost.confidence})
        </Text>
        <Text style={styles.cardDetail}>{`Täglicher Konsum: ${grams.toFixed(2)} g (~${thc.toFixed(0)} mg THC)`}</Text>
        <Text style={styles.cardDetail}>{`Gesparte Summe: ${formatCurrency(savings.amount, profile.currency)}`}</Text>
      </Card>
      <Card>
        <Text style={styles.cardTitle}>{strings.summary.reminderCard}</Text>
        <Text style={styles.cardValue}>{formatTimeString(profile.reminders.checkInTimeLocal)}</Text>
        <Text style={styles.cardDetail}>{`Nudging: ${profile.reminders.nudgeLevel}`}</Text>
        <Text style={styles.cardDetail}>{strings.summary.resumeHint}</Text>
      </Card>
      <Card style={styles.cardSpacing}>
        <View style={styles.consentRow}>
          <View style={styles.consentContent}>
            <Text style={styles.cardTitle}>Cloud-Sync aktivieren</Text>
            <Text style={styles.consentDescription}>
              Deine Daten werden verschlüsselt auf Servern in der EU gespeichert, um Cloud-Sync & Backup zu ermöglichen. Du kannst dies jederzeit in den Einstellungen ändern.
            </Text>
          </View>
          <Switch
            value={cloudConsent}
            onValueChange={(value) => mergeProfile({ cloudSyncConsent: value })}
            trackColor={{ false: '#767577', true: colors.primary }}
            thumbColor={cloudConsent ? '#FFFFFF' : '#f4f3f4'}
          />
        </View>
      </Card>
    </StepScreen>
  );
};

const styles = StyleSheet.create({
  badgeRow: {
    marginBottom: spacing.md,
  },
  badge: {
    alignSelf: 'flex-start',
    backgroundColor: '#E8F5E9',
    color: colors.primary,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: 999,
    fontWeight: '600',
    fontFamily: 'Inter-SemiBold',
  },
  cardSpacing: {
    marginVertical: spacing.lg,
  },
  cardTitle: {
    ...typography.subheading,
    marginBottom: spacing.xs,
    fontWeight: '600',
    fontFamily: 'Inter-SemiBold',
  },
  cardValue: {
    ...typography.heading,
    marginBottom: spacing.xs,
  },
  cardDetail: {
    ...typography.subheading,
    color: colors.muted,
  },
  consentRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
  },
  consentContent: {
    flex: 1,
  },
  consentDescription: {
    ...typography.subheading,
    color: colors.muted,
    marginTop: spacing.xs,
  },
});
