import React from 'react';
import { View, StyleSheet } from 'react-native';
import { StepScreen } from '../components/StepScreen';
import { Card } from '../components/Card';
import { HapticSlider } from '../components/HapticSlider';
import { useOnboardingStore } from '../store';
import { useOnboardingStep } from '../hooks';
import { colors, spacing } from '../theme';

export const THCPotencyScreen: React.FC = () => {
  const { stepNumber, totalSteps, goNext, goBack } = useOnboardingStep('THCPotency');
  const thcPotencyPercent = useOnboardingStore((state) => state.profile.thcPotencyPercent);
  const mergeProfile = useOnboardingStore((state) => state.mergeProfile);

  const handleValueChange = (value: number) => {
    mergeProfile({ thcPotencyPercent: value });
  };

  const formatValue = (value: number) => {
    return `${value}%`;
  };

  return (
    <StepScreen
      title="THC-Stärke"
      subtitle="Wie stark ist dein Cannabis typischerweise? (Optional, kannst du auch überspringen)"
      step={stepNumber}
      total={totalSteps}
      onNext={goNext}
      onBack={goBack}
    >
      <Card>
        <HapticSlider
          value={thcPotencyPercent}
          onValueChange={handleValueChange}
          minimumValue={5}
          maximumValue={40}
          step={1}
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

