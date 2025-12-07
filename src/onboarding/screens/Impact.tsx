import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { StepScreen } from '../components/StepScreen';
import { Card } from '../components/Card';
import { HapticSlider } from '../components/HapticSlider';
import { useOnboardingStore } from '../store';
import { useOnboardingStep } from '../hooks';
import { useTheme } from '../../../src/theme/useTheme';
import { spacing, typography } from '../../../src/design/tokens';

const getImpactEmoji = (level: number): string => {
  if (level <= 2) return '😊';
  if (level <= 4) return '🙂';
  if (level <= 6) return '😐';
  if (level <= 8) return '😟';
  return '😰';
};

export const ImpactScreen: React.FC = () => {
  const { stepNumber, totalSteps, goNext, goBack } = useOnboardingStep('Impact');
  const impactLevel = useOnboardingStore((state) => state.profile.impactLevel);
  const mergeProfile = useOnboardingStore((state) => state.mergeProfile);
  const { theme } = useTheme();
  const colors = theme.colors;

  const handleValueChange = (value: number) => {
    mergeProfile({ impactLevel: value });
  };

  const formatValue = (value: number) => {
    if (value <= 2) return 'Kaum';
    if (value <= 4) return 'Wenig';
    if (value <= 6) return 'Mittel';
    if (value <= 8) return 'Stark';
    return 'Sehr stark';
  };

  const emoji = useMemo(() => getImpactEmoji(impactLevel), [impactLevel]);

  return (
    <StepScreen
      title="Wie stark beeinflusst Cannabis dein Leben gerade?"
      subtitle="Von gar nicht bis sehr stark"
      step={stepNumber}
      total={totalSteps}
      onNext={goNext}
      onBack={goBack}
    >
      <Card>
        <View style={styles.emojiContainer}>
          <Text style={styles.emoji}>{emoji}</Text>
        </View>
        <HapticSlider
          value={impactLevel}
          onValueChange={handleValueChange}
          minimumValue={0}
          maximumValue={10}
          step={1}
          formatValue={formatValue}
        />
      </Card>
    </StepScreen>
  );
};

const styles = StyleSheet.create({
  emojiContainer: {
    alignItems: 'center',
    marginBottom: spacing.l,
  },
  emoji: {
    fontSize: 72,
  },
});
