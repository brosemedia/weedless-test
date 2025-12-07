import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { StepScreen } from '../components/StepScreen';
import { useOnboardingStore } from '../store';
import { useOnboardingStep } from '../hooks';
import { useTheme } from '../../../src/theme/useTheme';
import { spacing, radius, typography, shadows } from '../../../src/design/tokens';

const APP_PLANS = [
  'Konsum besser verstehen',
  'Pausen planen',
  'Komplett aufhören',
  'Geld & Zeit im Blick behalten',
  'Schlaf/Alltag beobachten',
];

export const AppPlanScreen: React.FC = () => {
  const { stepNumber, totalSteps, goNext, goBack } = useOnboardingStep('AppPlan');
  const appPlans = useOnboardingStore((state) => state.profile.appPlans);
  const mergeProfile = useOnboardingStore((state) => state.mergeProfile);
  const { theme } = useTheme();
  const colors = theme.colors;

  const togglePlan = (plan: string) => {
    const current = appPlans || [];
    if (current.includes(plan)) {
      mergeProfile({ appPlans: current.filter((p) => p !== plan) });
    } else {
      mergeProfile({ appPlans: [...current, plan] });
    }
  };

  return (
    <StepScreen
      title="Wie möchtest du Hazeless nutzen?"
      subtitle="Wähle alles aus, was für dich passt."
      step={stepNumber}
      total={totalSteps}
      onNext={goNext}
      onBack={goBack}
    >
      <View style={styles.list}>
        {APP_PLANS.map((plan) => {
          const isSelected = appPlans.includes(plan);
          return (
            <Pressable
              key={plan}
              style={({ pressed }) => [
                styles.planCard,
                {
                  backgroundColor: isSelected ? colors.primaryMuted : colors.surface,
                  borderColor: isSelected ? colors.primary : colors.border,
                  transform: [{ scale: pressed ? 0.97 : 1 }],
                },
              ]}
              onPress={() => togglePlan(plan)}
            >
              <Text
                style={[
                  styles.planText,
                  {
                    color: isSelected ? colors.primary : colors.text,
                  },
                ]}
              >
                {plan}
              </Text>
              {isSelected && (
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
  planCard: {
    borderWidth: 2,
    borderRadius: radius.l,
    padding: spacing.l,
    minHeight: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    ...shadows.sm,
  },
  planText: {
    ...typography.variants.body,
    fontSize: 16,
    fontWeight: '500',
    flex: 1,
  },
  checkmark: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: spacing.m,
  },
  checkmarkText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
});
