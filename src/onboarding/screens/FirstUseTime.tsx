import React from 'react';
import { View, StyleSheet } from 'react-native';
import { StepScreen } from '../components/StepScreen';
import { Card } from '../components/Card';
import { HapticSlider } from '../components/HapticSlider';
import { useOnboardingStore } from '../store';
import { useOnboardingStep } from '../hooks';
import { colors, spacing } from '../theme';

const minutesToTimeString = (minutes: number): string => {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  const period = hours >= 12 ? 'PM' : 'AM';
  const displayHours = hours > 12 ? hours - 12 : hours === 0 ? 12 : hours;
  return `${displayHours}:${mins.toString().padStart(2, '0')} ${period}`;
};

export const FirstUseTimeScreen: React.FC = () => {
  const { stepNumber, totalSteps, goNext, goBack } = useOnboardingStep('FirstUseTime');
  const firstUseTimeMinutes = useOnboardingStore((state) => state.profile.firstUseTimeMinutes);
  const mergeProfile = useOnboardingStore((state) => state.mergeProfile);

  const handleValueChange = (value: number) => {
    mergeProfile({ firstUseTimeMinutes: value });
  };

  const formatValue = (value: number) => {
    return minutesToTimeString(value);
  };

  return (
    <StepScreen
      title="Wann konsumierst du meistens zum ersten Mal am Tag?"
      subtitle="Wir nutzen das, um dir gezielte Unterstützung zu bieten."
      step={stepNumber}
      total={totalSteps}
      onNext={goNext}
      onBack={goBack}
    >
      <Card>
        <HapticSlider
          value={firstUseTimeMinutes}
          onValueChange={handleValueChange}
          minimumValue={300} // 5:00 AM
          maximumValue={1380} // 11:00 PM (23:00)
          step={30} // 30-Minuten-Schritte
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

