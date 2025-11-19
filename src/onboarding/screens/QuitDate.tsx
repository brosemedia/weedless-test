import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { StepScreen } from '../components/StepScreen';
import { Card } from '../components/Card';
import { Chip } from '../components/Chip';
import { DateTimeField } from '../components/DateTimeField';
import { useOnboardingStore } from '../store';
import { strings } from '../i18n/de';
import { onboardingSchemas } from '../utils/validators';
import { colors, spacing, typography } from '../theme';
import { useOnboardingStep } from '../hooks';

export const QuitDateScreen: React.FC = () => {
  const { stepNumber, totalSteps, goNext, goBack } = useOnboardingStep('QuitDate');
  const profile = useOnboardingStore((state) => state.profile);
  const mergeProfile = useOnboardingStore((state) => state.mergeProfile);
  const [customPause, setCustomPause] = useState<number | null>(profile.pauseLengthDays ?? null);

  const goal = profile.goal;
  const now = useMemo(() => new Date(), []);
  const quitDate = profile.quitDateISO ? new Date(profile.quitDateISO) : now;

  const selectNow = () => mergeProfile({ quitDateISO: new Date().toISOString() });
  const selectToday = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    mergeProfile({ quitDateISO: today.toISOString() });
  };

  const setPause = (days: number | null) => {
    setCustomPause(days);
    mergeProfile({ pauseLengthDays: days });
  };

  const valid = onboardingSchemas.quit.safeParse({
    quitDateISO: profile.quitDateISO,
    pauseLengthDays: profile.pauseLengthDays,
  }).success;

  return (
    <StepScreen
      title={strings.quit.title}
      subtitle={strings.quit.subtitle}
      step={stepNumber}
      total={totalSteps}
      onNext={goNext}
      onBack={goBack}
      nextDisabled={!valid}
    >
      <Card>
        <View style={styles.row}>
          <Chip label={strings.quit.now} active={false} onPress={selectNow} />
          <Chip label={strings.quit.today} active={false} onPress={selectToday} />
        </View>
        <DateTimeField
          label={strings.quit.pick}
          mode="date"
          value={quitDate}
          onChange={(date) => mergeProfile({ quitDateISO: date.toISOString() })}
        />
      </Card>
      {goal === 'pause' ? (
        <Card style={styles.pauseCard}>
          <Text style={styles.pauseTitle}>{strings.quit.pauseTitle}</Text>
          <Text style={styles.pauseSubtitle}>{strings.quit.pauseSubtitle}</Text>
          <View style={styles.row}>
            <Chip
              label={strings.quit.preset7}
              active={profile.pauseLengthDays === 7}
              onPress={() => setPause(7)}
            />
            <Chip
              label={strings.quit.preset14}
              active={profile.pauseLengthDays === 14}
              onPress={() => setPause(14)}
            />
            <Chip
              label={strings.quit.preset30}
              active={profile.pauseLengthDays === 30}
              onPress={() => setPause(30)}
            />
            <Chip
              label={strings.quit.custom}
              active={customPause != null && ![7, 14, 30].includes(customPause)}
              onPress={() => setPause(customPause ?? 21)}
            />
          </View>
        </Card>
      ) : null}
    </StepScreen>
  );
};

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: spacing.md,
  },
  pauseCard: {
    marginTop: spacing.xl,
  },
  pauseTitle: {
    ...typography.body,
    fontWeight: '600',
    fontFamily: 'Inter-SemiBold',
    marginBottom: spacing.xs,
  },
  pauseSubtitle: {
    ...typography.subheading,
    marginBottom: spacing.sm,
  },
});
