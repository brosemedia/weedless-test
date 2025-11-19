import React, { useMemo } from 'react';
import { View, Text, StyleSheet, Switch } from 'react-native';
import { StepScreen } from '../components/StepScreen';
import { Card } from '../components/Card';
import { Chip } from '../components/Chip';
import { useOnboardingStore } from '../store';
import type { Goal } from '../types';
import { strings } from '../i18n/de';
import { colors, spacing, typography } from '../theme';
import { onboardingSchemas } from '../utils/validators';
import { useOnboardingStep } from '../hooks';

const goalOrder: Goal[] = ['pause', 'reduce', 'quit', 'track'];

export const WelcomeGoalsScreen: React.FC = () => {
  const { stepNumber, totalSteps, goNext } = useOnboardingStep('WelcomeGoals');
  const goal = useOnboardingStore((state) => state.profile.goal);
  const update = useOnboardingStore((state) => state.update);
  const mode = useOnboardingStore((state) => state.mode);
  const setMode = useOnboardingStore((state) => state.setMode);

  const goalOptions = useMemo(
    () =>
      goalOrder.map((value) => ({
        value,
        title: strings.welcome.goals[value].title,
        description: strings.welcome.goals[value].description,
      })),
    []
  );

  const valid = onboardingSchemas.goals.safeParse({ goal }).success;

  return (
    <StepScreen
      title={strings.welcome.title}
      subtitle={strings.welcome.subtitle}
      step={stepNumber}
      total={totalSteps}
      onNext={goNext}
      showBack={false}
      nextDisabled={!valid}
    >
      <Card>
        <View style={styles.toggleRow}>
          <Text style={styles.quickTitle}>{strings.common.quickMode}</Text>
          <Switch value={mode === 'quick'} onValueChange={(value) => setMode(value ? 'quick' : 'full')} />
        </View>
        <Text style={styles.quickDescription}>{strings.common.quickModeHint}</Text>
      </Card>
      <View style={styles.list}>
        {goalOptions.map((item) => (
          <Card key={item.value} style={[styles.goalCard, goal === item.value && styles.goalCardActive]}>
            <View style={styles.goalHeader}>
              <Chip
                label={item.title}
                active={goal === item.value}
                onPress={() => update('goal', item.value)}
              />
            </View>
            <Text style={styles.goalDescription}>{item.description}</Text>
          </Card>
        ))}
      </View>
    </StepScreen>
  );
};

const styles = StyleSheet.create({
  list: {
    marginTop: spacing.xl,
    gap: spacing.md,
  },
  goalCard: {
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  goalCardActive: {
    borderColor: colors.primary,
  },
  goalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  goalDescription: {
    ...typography.body,
    color: colors.muted,
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  quickTitle: {
    ...typography.body,
    fontWeight: '600',
    fontFamily: 'Inter-SemiBold',
  },
  quickDescription: {
    ...typography.subheading,
    marginTop: spacing.sm,
  },
});
