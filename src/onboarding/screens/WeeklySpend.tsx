import React, { useMemo } from 'react';
import { View, StyleSheet } from 'react-native';
import { StepScreen } from '../components/StepScreen';
import { Card } from '../components/Card';
import { HapticSlider } from '../components/HapticSlider';
import { useOnboardingStore } from '../store';
import { useOnboardingStep } from '../hooks';
import { colors, spacing } from '../theme';

const CURRENCY_SYMBOLS: Record<string, string> = {
  EUR: '€',
  USD: '$',
  GBP: '£',
  CHF: 'CHF',
  CAD: 'C$',
  AUD: 'A$',
  INR: '₹',
  ILS: '₪',
  ZAR: 'R',
  ARS: '$',
};

export const WeeklySpendScreen: React.FC = () => {
  const { stepNumber, totalSteps, goNext, goBack } = useOnboardingStep('WeeklySpend');
  const weeklySpend = useOnboardingStore((state) => state.profile.weeklySpend);
  const currency = useOnboardingStore((state) => state.profile.currency);
  const mergeProfile = useOnboardingStore((state) => state.mergeProfile);

  const symbol = CURRENCY_SYMBOLS[currency] || currency;

  const handleValueChange = (value: number) => {
    mergeProfile({ weeklySpend: value });
  };

  const formatValue = (value: number) => {
    return `${symbol}${Math.round(value)}`;
  };

  const valid = weeklySpend >= 0;

  return (
    <StepScreen
      title="Wie viel gibst du pro Woche ungefähr für Cannabis aus?"
      subtitle="Ein ungefährer Wert reicht völlig aus."
      step={stepNumber}
      total={totalSteps}
      onNext={goNext}
      onBack={goBack}
      nextDisabled={!valid}
    >
      <Card>
        <HapticSlider
          value={weeklySpend}
          onValueChange={handleValueChange}
          minimumValue={0}
          maximumValue={500}
          step={5}
          formatValue={formatValue}
        />
      </Card>
    </StepScreen>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
  },
});

