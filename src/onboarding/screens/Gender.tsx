import React, { useMemo } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { StepScreen } from '../components/StepScreen';
import { Card } from '../components/Card';
import { useOnboardingStore } from '../store';
import type { Gender } from '../types';
import { useStrings } from '../i18n/useStrings';
import { colors, spacing, typography } from '../theme';
import { onboardingSchemas } from '../utils/validators';
import { useOnboardingStep } from '../hooks';

export const GenderScreen: React.FC = () => {
  const { stepNumber, totalSteps, goNext, goBack } = useOnboardingStep('Gender');
  const gender = useOnboardingStore((state) => state.profile.gender);
  const mergeProfile = useOnboardingStore((state) => state.mergeProfile);
  const strings = useStrings();

  const genderOptions: { value: Gender; label: string }[] = useMemo(() => [
    { value: 'male', label: strings.gender.options.male || 'Mann' },
    { value: 'female', label: strings.gender.options.female || 'Frau' },
    { value: 'diverse', label: 'Divers' },
    { value: 'none', label: 'Keine Angabe' },
  ], [strings]);

  const valid = onboardingSchemas.gender.safeParse({ gender }).success;

  return (
    <StepScreen
      title={strings.gender.title}
      subtitle={strings.gender.subtitle}
      step={stepNumber}
      total={totalSteps}
      onNext={goNext}
      onBack={goBack}
      showBack={false}
      nextDisabled={!valid}
    >
      <Card>
        <View style={styles.optionsContainer}>
          {genderOptions.map((option) => (
            <Pressable
              key={option.value}
              style={({ pressed }) => [
                styles.optionCard,
                gender === option.value && styles.optionCardActive,
                pressed && styles.optionCardPressed,
              ]}
              onPress={() => mergeProfile({ gender: option.value })}
            >
              <Text style={[styles.optionText, gender === option.value && styles.optionTextActive]}>
                {option.label}
              </Text>
            </Pressable>
          ))}
        </View>
      </Card>
    </StepScreen>
  );
};

const styles = StyleSheet.create({
  optionsContainer: {
    gap: spacing.md,
  },
  optionCard: {
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.xl,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    alignItems: 'center',
    backgroundColor: colors.surface,
  },
  optionCardActive: {
    borderColor: colors.primary,
    backgroundColor: '#E8F5E9',
  },
  optionCardPressed: {
    opacity: 0.7,
  },
  optionText: {
    ...typography.body,
    fontSize: 16,
  },
  optionTextActive: {
    color: colors.primary,
    fontWeight: '600',
    fontFamily: 'Inter-SemiBold',
  },
});

