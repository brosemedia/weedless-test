import React, { useState } from 'react';
import { Text, TextInput, StyleSheet, Keyboard } from 'react-native';
import { StepScreen } from '../components/StepScreen';
import { Card } from '../components/Card';
import { useOnboardingStore } from '../store';
import { useStrings } from '../i18n/useStrings';
import { colors, spacing, typography } from '../theme';
import { onboardingSchemas } from '../utils/validators';
import { useOnboardingStep } from '../hooks';

export const BirthYearScreen: React.FC = () => {
  const { stepNumber, totalSteps, goNext, goBack } = useOnboardingStep('BirthYear');
  const profile = useOnboardingStore((state) => state.profile);
  const mergeProfile = useOnboardingStore((state) => state.mergeProfile);
  const strings = useStrings();
  const [inputValue, setInputValue] = useState(profile.birthYear?.toString() || '');

  const handleChange = (text: string) => {
    const numericText = text.replace(/[^0-9]/g, '');
    setInputValue(numericText);
    if (numericText.length === 4) {
      const year = parseInt(numericText, 10);
      if (year >= 1900 && year <= new Date().getFullYear()) {
        mergeProfile({ birthYear: year });
        Keyboard.dismiss();
      }
    } else {
      mergeProfile({ birthYear: undefined });
    }
  };

  const birthYear = profile.birthYear;
  const valid = onboardingSchemas.birthYear.safeParse({ birthYear }).success;

  return (
    <StepScreen
      title={strings.birthYear.title}
      subtitle={strings.birthYear.subtitle}
      step={stepNumber}
      total={totalSteps}
      onNext={goNext}
      onBack={goBack}
      nextDisabled={!valid}
    >
      <Card>
        <TextInput
          value={inputValue}
          onChangeText={handleChange}
          placeholder="1990"
          keyboardType="number-pad"
          maxLength={4}
          style={styles.input}
          autoFocus
        />
      </Card>
    </StepScreen>
  );
};

const styles = StyleSheet.create({
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.lg,
    marginTop: spacing.sm,
    ...typography.body,
    fontSize: 24,
    textAlign: 'center',
    backgroundColor: colors.surface,
    fontWeight: '600',
    fontFamily: 'Inter-SemiBold',
  },
});

