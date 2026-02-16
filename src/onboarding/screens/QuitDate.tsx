import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { StepScreen } from '../components/StepScreen';
import { Card } from '../components/Card';
import { Chip } from '../components/Chip';
import { DateTimeField } from '../components/DateTimeField';
import { useOnboardingStore } from '../store';
import { useStrings } from '../i18n/useStrings';
import { onboardingSchemas } from '../utils/validators';
import { colors, spacing, typography } from '../theme';
import { useOnboardingStep } from '../hooks';

export const QuitDateScreen: React.FC = () => {
  const { stepNumber, totalSteps, goNext, goBack } = useOnboardingStep('QuitDate');
  const profile = useOnboardingStore((state) => state.profile);
  const mergeProfile = useOnboardingStore((state) => state.mergeProfile);
  const strings = useStrings();
  const [customPause, setCustomPause] = useState<number | null>(profile.pauseLengthDays ?? null);

  const goal = profile.goal;
  const now = useMemo(() => new Date(), []);
  const quitDate = profile.quitDateISO ? new Date(profile.quitDateISO) : now;
  const lastConsumption = profile.lastConsumptionISO ? new Date(profile.lastConsumptionISO) : now;

  // Check if "now" is selected (within 1 minute tolerance)
  const isQuitDateNow =
    !!profile.quitDateISO && Math.abs(new Date(profile.quitDateISO).getTime() - now.getTime()) < 60000;
  // Check if "today" is selected (same day, time set to 00:00:00)
  const isQuitDateToday = !!profile.quitDateISO && (() => {
    const quitDateObj = new Date(profile.quitDateISO);
    const today = new Date();
    return quitDateObj.getFullYear() === today.getFullYear() &&
           quitDateObj.getMonth() === today.getMonth() &&
           quitDateObj.getDate() === today.getDate() &&
           quitDateObj.getHours() === 0 &&
           quitDateObj.getMinutes() === 0 &&
           quitDateObj.getSeconds() === 0;
  })();

  const isLastConsumptionNow =
    !!profile.lastConsumptionISO &&
    Math.abs(new Date(profile.lastConsumptionISO).getTime() - now.getTime()) < 60000;
  const isLastConsumptionToday = !!profile.lastConsumptionISO && (() => {
    const lastConsumptionObj = new Date(profile.lastConsumptionISO);
    const today = new Date();
    return lastConsumptionObj.getFullYear() === today.getFullYear() &&
           lastConsumptionObj.getMonth() === today.getMonth() &&
           lastConsumptionObj.getDate() === today.getDate() &&
           lastConsumptionObj.getHours() === 0 &&
           lastConsumptionObj.getMinutes() === 0 &&
           lastConsumptionObj.getSeconds() === 0;
  })();

  const selectNow = () => mergeProfile({ quitDateISO: new Date().toISOString() });
  const selectToday = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    mergeProfile({ quitDateISO: today.toISOString() });
  };

  const selectLastConsumptionNow = () => mergeProfile({ lastConsumptionISO: new Date().toISOString() });
  const selectLastConsumptionToday = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    mergeProfile({ lastConsumptionISO: today.toISOString() });
  };

  const setPause = (days: number | null) => {
    setCustomPause(days);
    mergeProfile({ pauseLengthDays: days });
  };

  const valid = (() => {
    const parseResult = onboardingSchemas.quit.safeParse({
      quitDateISO: profile.quitDateISO,
      lastConsumptionISO: profile.lastConsumptionISO,
      pauseLengthDays: profile.pauseLengthDays,
    });
    if (!parseResult.success) return false;
    // At least one field must be filled
    return !!(profile.quitDateISO || profile.lastConsumptionISO || (goal === 'pause' && profile.pauseLengthDays != null));
  })();

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
          <Chip label={strings.quit.now} active={isQuitDateNow} onPress={selectNow} />
          <Chip label={strings.quit.today} active={isQuitDateToday && !isQuitDateNow} onPress={selectToday} />
        </View>
        <DateTimeField
          label={strings.quit.pick}
          mode="date"
          value={quitDate}
          onChange={(date) => mergeProfile({ quitDateISO: date.toISOString() })}
        />
      </Card>
      <Card>
        <Text style={styles.sectionTitle}>{strings.quit.lastConsumptionTitle}</Text>
        <Text style={styles.sectionSubtitle}>{strings.quit.lastConsumptionSubtitle}</Text>
        <View style={styles.row}>
          <Chip label={strings.quit.lastConsumptionNow} active={isLastConsumptionNow} onPress={selectLastConsumptionNow} />
          <Chip label={strings.quit.lastConsumptionToday} active={isLastConsumptionToday && !isLastConsumptionNow} onPress={selectLastConsumptionToday} />
        </View>
        <DateTimeField
          label={strings.quit.lastConsumptionPick}
          mode="datetime"
          value={lastConsumption}
          onChange={(date) => mergeProfile({ lastConsumptionISO: date.toISOString() })}
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
  sectionTitle: {
    ...typography.body,
    fontWeight: '600',
    fontFamily: 'Inter-SemiBold',
    marginBottom: spacing.xs,
  },
  sectionSubtitle: {
    ...typography.subheading,
    marginBottom: spacing.sm,
  },
});
