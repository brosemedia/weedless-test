import React from 'react';
import { View, StyleSheet } from 'react-native';
import { StepScreen } from '../components/StepScreen';
import { Card } from '../components/Card';
import { HapticSlider } from '../components/HapticSlider';
import { useOnboardingStore } from '../store';
import { useOnboardingStep } from '../hooks';
import { colors, spacing } from '../theme';

export const FrequencyScreen: React.FC = () => {
  const { stepNumber, totalSteps, goNext, goBack } = useOnboardingStep('Frequency');
  const frequencyPerWeek = useOnboardingStore((state) => state.profile.frequencyPerWeek);
  const mergeProfile = useOnboardingStore((state) => state.mergeProfile);

  const handleValueChange = (value: number) => {
    mergeProfile({ frequencyPerWeek: value });
  };

  const formatValue = (value: number) => {
    if (value === 0) return 'Gar nicht';
    if (value === 1) return '1-mal pro Woche';
    return `${value}-mal pro Woche`;
  };

  const valid = frequencyPerWeek >= 0;

  return (
    <StepScreen
      title="Wie oft konsumierst du aktuell pro Woche?"
      subtitle="Wähle die Anzahl der Tage, an denen du typischerweise konsumierst."
      step={stepNumber}
      total={totalSteps}
      onNext={goNext}
      onBack={goBack}
      nextDisabled={!valid}
    >
      <Card>
        <HapticSlider
          value={frequencyPerWeek}
          onValueChange={handleValueChange}
          minimumValue={0}
          maximumValue={7}
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

