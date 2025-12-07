import React, { useMemo } from 'react';
import { View, Text, StyleSheet, Switch, Pressable } from 'react-native';
import { StepScreen } from '../components/StepScreen';
import { Card } from '../components/Card';
import { Chip } from '../components/Chip';
import { useOnboardingStore } from '../store';
import type { Goal } from '../types';
import { useStrings } from '../i18n/useStrings';
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
  const strings = useStrings();

  const goalOptions = useMemo(
    () =>
      goalOrder.map((value) => ({
        value,
        title: strings.welcome.goals[value].title,
        description: strings.welcome.goals[value].description,
      })),
    [strings]
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
        {goalOptions.map((item) => {
          const isActive = goal === item.value;
          const isReduce = item.value === 'reduce';
          const isQuit = item.value === 'quit';
          return (
            <Pressable
              key={item.value}
              style={({ pressed }) => [
                styles.goalCard,
                isActive && styles.goalCardActive,
                pressed && styles.goalCardPressed,
              ]}
              onPress={() => update('goal', item.value)}
            >
              <View style={styles.goalHeader}>
                {isReduce && (
                  <Text style={[styles.goalBadge, isActive && styles.goalBadgeActive]}>
                    {strings.welcome.goals.reduce.title.toUpperCase()}
                  </Text>
                )}
                {isQuit && (
                  <Text style={[styles.goalBadge, isActive && styles.goalBadgeActive]}>
                    {strings.welcome.goals.quit.title.toUpperCase()}
                  </Text>
                )}
                {!isReduce && !isQuit && (
                  <Text style={[styles.goalBadge, isActive && styles.goalBadgeActive]}>
                    {item.title.toUpperCase()}
                  </Text>
                )}
              </View>
              <Text style={styles.goalDescription}>{item.description}</Text>
            </Pressable>
          );
        })}
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
    borderRadius: 12,
    padding: spacing.lg,
    backgroundColor: colors.surface,
    marginBottom: spacing.md,
  },
  goalCardActive: {
    borderColor: colors.primary,
    borderWidth: 2,
    backgroundColor: '#E8F5E9',
  },
  goalCardPressed: {
    opacity: 0.7,
  },
  goalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  goalBadge: {
    ...typography.body,
    fontSize: 14,
    fontWeight: '700',
    fontFamily: 'Inter-SemiBold',
    color: colors.muted,
    letterSpacing: 0.5,
  },
  goalBadgeActive: {
    color: colors.primary,
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
