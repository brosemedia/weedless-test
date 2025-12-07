import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { StepScreen } from '../components/StepScreen';
import { Card } from '../components/Card';
import { Chip } from '../components/Chip';
import { Checkbox } from '../components/Checkbox';
import { DateTimeField } from '../components/DateTimeField';
import { useOnboardingStore } from '../store';
import { useStrings } from '../i18n/useStrings';
import { useOnboardingStep } from '../hooks';
import { onboardingSchemas } from '../utils/validators';
import { colors, spacing, typography } from '../theme';
import { timeStringToDate } from '../utils/format';
import { track } from '../services/analytics';

export const RemindersScreen: React.FC = () => {
  const { stepNumber, totalSteps, goNext, goBack } = useOnboardingStep('Reminders');
  const reminders = useOnboardingStore((state) => state.profile.reminders);
  const mergeProfile = useOnboardingStore((state) => state.mergeProfile);
  const strings = useStrings();
  const [tracked, setTracked] = useState(false);

  const timeValue = useMemo(
    () => timeStringToDate(reminders.checkInTimeLocal ?? '20:30'),
    [reminders.checkInTimeLocal]
  );

  const update = (patch: Partial<typeof reminders>) => {
    mergeProfile({
      reminders: {
        ...reminders,
        ...patch,
      },
    });
  };

  const handleNext = () => {
    if (!tracked) {
      track('reminders_set', {
        time: reminders.checkInTimeLocal,
        nudge_level: reminders.nudgeLevel,
        relapse_support: reminders.relapseSupport,
      });
      setTracked(true);
    }
    goNext();
  };

  const valid = onboardingSchemas.reminders.safeParse(reminders).success;

  return (
    <StepScreen
      title={strings.reminders.title}
      subtitle={strings.reminders.subtitle}
      step={stepNumber}
      total={totalSteps}
      onNext={handleNext}
      onBack={goBack}
      nextDisabled={!valid}
    >
      <Card>
        <DateTimeField
          label={strings.reminders.timeLabel}
          mode="time"
          value={timeValue}
          onChange={(date) =>
            update({
              checkInTimeLocal: `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(
                2,
                '0'
              )}`,
            })
          }
        />
        <Text style={styles.label}>{strings.reminders.nudgeLabel}</Text>
        <View style={styles.row}>
          <Chip
            label={strings.reminders.nudgeLow}
            active={reminders.nudgeLevel === 'low'}
            onPress={() => update({ nudgeLevel: 'low' })}
          />
          <Chip
            label={strings.reminders.nudgeMedium}
            active={reminders.nudgeLevel === 'medium'}
            onPress={() => update({ nudgeLevel: 'medium' })}
          />
          <Chip
            label={strings.reminders.nudgeHigh}
            active={reminders.nudgeLevel === 'high'}
            onPress={() => update({ nudgeLevel: 'high' })}
          />
        </View>
        <Checkbox
          label={strings.reminders.relapseSupport}
          value={reminders.relapseSupport}
          onChange={(value) => update({ relapseSupport: value })}
        />
      </Card>
    </StepScreen>
  );
};

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    marginBottom: spacing.lg,
  },
  label: {
    ...typography.body,
    fontWeight: '600',
    fontFamily: 'Inter-SemiBold',
    marginBottom: spacing.sm,
  },
});
