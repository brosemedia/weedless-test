import React from 'react';
import Slider from '@react-native-community/slider';
import { View, Text, StyleSheet } from 'react-native';
import { StepScreen } from '../components/StepScreen';
import { Card } from '../components/Card';
import { useOnboardingStore } from '../store';
import { strings } from '../i18n/de';
import { useOnboardingStep } from '../hooks';
import { colors, spacing, typography } from '../theme';
import { onboardingSchemas } from '../utils/validators';

export const BaselineScreen: React.FC = () => {
  const { stepNumber, totalSteps, goNext, goBack } = useOnboardingStep('Baseline');
  const baseline = useOnboardingStore((state) => state.profile.baseline);
  const mergeProfile = useOnboardingStore((state) => state.mergeProfile);

  const update = (key: 'sleepQ' | 'mood' | 'stress', value: number) => {
    mergeProfile({
      baseline: {
        ...baseline,
        [key]: value,
      },
    });
  };

  const valid = onboardingSchemas.baseline.safeParse(baseline).success;

  return (
    <StepScreen
      title={strings.baseline.title}
      subtitle={strings.baseline.subtitle}
      step={stepNumber}
      total={totalSteps}
      onNext={goNext}
      onBack={goBack}
      nextDisabled={!valid}
    >
      <Card>
        <View style={styles.row}>
          <Text style={styles.label}>{strings.baseline.sleep}</Text>
          <Slider
            minimumValue={1}
            maximumValue={5}
            step={1}
            value={baseline.sleepQ ?? 3}
            onValueChange={(value) => update('sleepQ', value)}
            minimumTrackTintColor={colors.primary}
          />
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>{strings.baseline.mood}</Text>
          <Slider
            minimumValue={1}
            maximumValue={5}
            step={1}
            value={baseline.mood ?? 3}
            onValueChange={(value) => update('mood', value)}
            minimumTrackTintColor={colors.primary}
          />
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>{strings.baseline.stress}</Text>
          <Slider
            minimumValue={1}
            maximumValue={5}
            step={1}
            value={baseline.stress ?? 3}
            onValueChange={(value) => update('stress', value)}
            minimumTrackTintColor={colors.primary}
          />
        </View>
      </Card>
    </StepScreen>
  );
};

const styles = StyleSheet.create({
  row: {
    marginBottom: spacing.xl,
  },
  label: {
    ...typography.body,
    fontWeight: '600',
    fontFamily: 'Inter-SemiBold',
    marginBottom: spacing.sm,
  },
});
