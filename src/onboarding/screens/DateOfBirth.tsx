import React, { useState } from 'react';
import { Text, TextInput, StyleSheet, Keyboard } from 'react-native';
import { StepScreen } from '../components/StepScreen';
import { Card } from '../components/Card';
import { useOnboardingStore } from '../store';
import { colors, spacing, typography } from '../theme';
import { useOnboardingStep } from '../hooks';

export const DateOfBirthScreen: React.FC = () => {
  const { stepNumber, totalSteps, goNext, goBack } = useOnboardingStep('DateOfBirth');
  const profile = useOnboardingStore((state) => state.profile);
  const mergeProfile = useOnboardingStore((state) => state.mergeProfile);
  const [inputValue, setInputValue] = useState(
    profile.dateOfBirth ? profile.dateOfBirth.substring(0, 4) : ''
  );

  const handleChange = (text: string) => {
    const numericText = text.replace(/[^0-9]/g, '');
    setInputValue(numericText);
    
    if (numericText.length === 4) {
      const year = parseInt(numericText, 10);
      const currentYear = new Date().getFullYear();
      if (year >= 1900 && year <= currentYear) {
        // Erstelle ISO-Date (1. Januar des Jahres)
        const isoDate = `${year}-01-01`;
        mergeProfile({ dateOfBirth: isoDate });
        Keyboard.dismiss();
      }
    } else {
      mergeProfile({ dateOfBirth: null });
    }
  };

  const valid = profile.dateOfBirth !== null && profile.dateOfBirth !== undefined;

  return (
    <StepScreen
      title="Wann bist du geboren?"
      subtitle="Wir nutzen dein Alter nur, um dir passende Infos anzuzeigen."
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
          placeholder="YYYY"
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

