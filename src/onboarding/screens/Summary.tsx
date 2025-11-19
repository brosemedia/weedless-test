import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { StepScreen } from '../components/StepScreen';
import { Card } from '../components/Card';
import { useOnboardingStore } from '../store';
import { strings } from '../i18n/de';
import { useOnboardingStep } from '../hooks';
import { colors, spacing, typography } from '../theme';
import { costPerDay, gramsPerDay, pauseEndDate, savingsSinceQuit, thcMgPerDay } from '../utils/calculations';
import { formatCurrency, formatDate, formatTimeString } from '../utils/format';
import { scheduleAllOnboardingNotifications } from '../services/notifications';
import { track } from '../services/analytics';
import { useApp } from '../../store/app';
import { onboardingProfileToAppProfile } from '../utils/toAppProfile';
import { useStore } from '../../store/useStore';

export const SummaryScreen: React.FC = () => {
  const { stepNumber, totalSteps, goBack, mode } = useOnboardingStep('Summary');
  const profile = useOnboardingStore((state) => state.profile);
  const markCompleted = useOnboardingStore((state) => state.markCompleted);
  const replaceProfile = useApp((state) => state.replaceProfile);
  const legacyUpdateProfile = useStore((s) => s.updateProfile);
  const [pending, setPending] = useState(false);

  const cost = useMemo(() => costPerDay(profile), [profile]);
  const grams = useMemo(() => gramsPerDay(profile), [profile]);
  const thc = useMemo(() => thcMgPerDay(profile), [profile]);
  const savings = useMemo(() => savingsSinceQuit(profile), [profile]);
  const pauseEnd = useMemo(() => pauseEndDate(profile), [profile]);

  const handleSubmit = async () => {
    if (pending) return;
    setPending(true);
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
    replaceProfile(mapped);
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
    markCompleted();
    setPending(false);
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
});
