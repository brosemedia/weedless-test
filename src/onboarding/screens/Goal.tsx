import React, { useMemo } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { StepScreen } from '../components/StepScreen';
import { useOnboardingStore } from '../store';
import type { Goal } from '../types';
import { useOnboardingStep } from '../hooks';
import { useTheme } from '../../../src/theme/useTheme';
import { spacing, radius, typography, shadows } from '../../../src/design/tokens';

const goalOrder: Goal[] = ['pause', 'reduce', 'quit', 'track'];

const goalLabels: Record<Goal, { title: string; description: string }> = {
  pause: {
    title: 'Ich möchte eine Pause machen',
    description: 'Eine geplante Pause vom Konsum einlegen',
  },
  reduce: {
    title: 'Ich möchte meinen Konsum reduzieren',
    description: 'Weniger und bewusster konsumieren',
  },
  quit: {
    title: 'Ich möchte komplett aufhören',
    description: 'Den Konsum vollständig beenden',
  },
  track: {
    title: 'Ich möchte meinen Konsum tracken',
    description: 'Meinen Konsum beobachten und verstehen',
  },
};

export const GoalScreen: React.FC = () => {
  const { stepNumber, totalSteps, goNext, goBack } = useOnboardingStep('Goal');
  const goal = useOnboardingStore((state) => state.profile.goal);
  const update = useOnboardingStore((state) => state.update);
  const { theme } = useTheme();
  const colors = theme.colors;

  const goalOptions = useMemo(() => goalOrder.map((value) => ({
    value,
    ...goalLabels[value],
  })), []);

  const valid = goal !== undefined;

  return (
    <StepScreen
      title="Was ist dein Ziel mit Hazeless?"
      subtitle="Wähle das Ziel, das am besten zu dir passt."
      step={stepNumber}
      total={totalSteps}
      onNext={goNext}
      onBack={goBack}
      nextDisabled={!valid}
    >
      <View style={styles.list}>
        {goalOptions.map((item) => {
          const isActive = goal === item.value;
          return (
            <Pressable
              key={item.value}
              style={({ pressed }) => [
                styles.goalCard,
                {
                  backgroundColor: isActive ? colors.primaryMuted : colors.surface,
                  borderColor: isActive ? colors.primary : colors.border,
                  transform: [{ scale: pressed ? 0.97 : 1 }],
                },
              ]}
              onPress={() => update('goal', item.value)}
            >
              <View style={styles.goalContent}>
                <Text
                  style={[
                    styles.goalTitle,
                    {
                      color: isActive ? colors.primary : colors.text,
                    },
                  ]}
                >
                  {item.title}
                </Text>
                <Text
                  style={[
                    styles.goalDescription,
                    {
                      color: isActive ? colors.text : colors.textMuted,
                    },
                  ]}
                >
                  {item.description}
                </Text>
              </View>
              {isActive && (
                <View style={[styles.checkmark, { backgroundColor: colors.primary }]}>
                  <Text style={styles.checkmarkText}>✓</Text>
                </View>
              )}
            </Pressable>
          );
        })}
      </View>
    </StepScreen>
  );
};

const styles = StyleSheet.create({
  list: {
    gap: spacing.m,
  },
  goalCard: {
    borderWidth: 2,
    borderRadius: radius.l,
    padding: spacing.l,
    minHeight: 80,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    ...shadows.sm,
  },
  goalContent: {
    flex: 1,
  },
  goalTitle: {
    ...typography.variants.h2,
    marginBottom: spacing.xs,
    fontSize: 18,
  },
  goalDescription: {
    ...typography.variants.body,
    fontSize: 14,
    lineHeight: 20,
  },
  checkmark: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: spacing.m,
  },
  checkmarkText: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: 'bold',
  },
});
