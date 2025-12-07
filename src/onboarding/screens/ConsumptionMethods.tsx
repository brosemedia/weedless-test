import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { StepScreen } from '../components/StepScreen';
import { useOnboardingStore } from '../store';
import type { ConsumptionMethod } from '../types';
import { useOnboardingStep } from '../hooks';
import { useTheme } from '../../../src/theme/useTheme';
import { spacing, radius, typography, shadows } from '../../../src/design/tokens';

const CONSUMPTION_METHODS: { value: ConsumptionMethod; label: string }[] = [
  { value: 'joints', label: 'Joints' },
  { value: 'bongs', label: 'Bongs' },
  { value: 'edibles', label: 'Edibles' },
  { value: 'vapes', label: 'Vaporizer (Flower)' },
  { value: 'oils', label: 'Vaporizer (Oil)' },
  { value: 'blunts', label: 'Blunts' },
  { value: 'capsules', label: 'Kapseln' },
  { value: 'pipes', label: 'Pipes' },
  { value: 'dabs', label: 'Dabs' },
];

export const ConsumptionMethodsScreen: React.FC = () => {
  const { stepNumber, totalSteps, goNext, goBack } = useOnboardingStep('ConsumptionMethods');
  const consumptionMethods = useOnboardingStore((state) => state.profile.consumptionMethods);
  const mergeProfile = useOnboardingStore((state) => state.mergeProfile);
  const { theme } = useTheme();
  const colors = theme.colors;

  const toggleMethod = (method: ConsumptionMethod) => {
    const current = consumptionMethods || [];
    if (current.includes(method)) {
      mergeProfile({ consumptionMethods: current.filter((m) => m !== method) });
    } else {
      mergeProfile({ consumptionMethods: [...current, method] });
    }
  };

  const valid = consumptionMethods.length > 0;

  return (
    <StepScreen
      title="Wie konsumierst du Cannabis?"
      subtitle="Wähle alle zutreffenden Optionen aus."
      step={stepNumber}
      total={totalSteps}
      onNext={goNext}
      onBack={goBack}
      nextDisabled={!valid}
    >
      <View style={styles.list}>
        {CONSUMPTION_METHODS.map((item) => {
          const isSelected = consumptionMethods.includes(item.value);
          return (
            <Pressable
              key={item.value}
              style={({ pressed }) => [
                styles.methodCard,
                {
                  backgroundColor: isSelected ? colors.primaryMuted : colors.surface,
                  borderColor: isSelected ? colors.primary : colors.border,
                  transform: [{ scale: pressed ? 0.97 : 1 }],
                },
              ]}
              onPress={() => toggleMethod(item.value)}
            >
              <Text
                style={[
                  styles.methodText,
                  {
                    color: isSelected ? colors.primary : colors.text,
                  },
                ]}
              >
                {item.label}
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
  methodCard: {
    borderWidth: 2,
    borderRadius: radius.l,
    padding: spacing.l,
    minHeight: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    ...shadows.sm,
  },
  methodText: {
    ...typography.variants.body,
    fontSize: 16,
    fontWeight: '500',
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
