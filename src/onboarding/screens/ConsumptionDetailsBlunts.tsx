import React, { useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { StepScreen } from '../components/StepScreen';
import { Card } from '../components/Card';
import { HapticSlider } from '../components/HapticSlider';
import { useOnboardingStore } from '../store';
import { useOnboardingStep } from '../hooks';
import { colors, spacing, typography } from '../theme';

export const ConsumptionDetailsBluntsScreen: React.FC = () => {
  const { stepNumber, totalSteps, goNext, goBack } = useOnboardingStep('ConsumptionDetailsBlunts');
  const profile = useOnboardingStore((state) => state.profile);
  const mergeProfile = useOnboardingStore((state) => state.mergeProfile);
  
  const details = profile.consumptionDetails?.blunts || {};
  const [jointsPerWeek, setJointsPerWeek] = useState(details.jointsPerWeek || 0);
  const [gramsPerJoint, setGramsPerJoint] = useState(details.gramsPerJoint || 1);

  const handleJointsChange = (value: number) => {
    setJointsPerWeek(value);
    mergeProfile({
      consumptionDetails: {
        ...profile.consumptionDetails,
        blunts: { ...details, jointsPerWeek: value, gramsPerJoint },
      },
    });
  };

  const handleGramsChange = (value: number) => {
    setGramsPerJoint(value);
    mergeProfile({
      consumptionDetails: {
        ...profile.consumptionDetails,
        blunts: { ...details, jointsPerWeek, gramsPerJoint: value },
      },
    });
  };

  return (
    <StepScreen
      title="Deine Blunt-Details"
      subtitle="Blunts pro Woche und Gramm pro Blunt"
      step={stepNumber}
      total={totalSteps}
      onNext={goNext}
      onBack={goBack}
      nextDisabled={jointsPerWeek === 0 || gramsPerJoint === 0}
    >
      <Card>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Blunts pro Woche</Text>
          <HapticSlider
            value={jointsPerWeek}
            onValueChange={handleJointsChange}
            minimumValue={0}
            maximumValue={50}
            step={1}
            formatValue={(v) => `${v} Blunts`}
          />
        </View>
        <View style={styles.divider} />
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Gramm pro Blunt</Text>
          <HapticSlider
            value={gramsPerJoint}
            onValueChange={handleGramsChange}
            minimumValue={0.5}
            maximumValue={5}
            step={0.1}
            formatValue={(v) => `${v.toFixed(1)} g`}
          />
        </View>
      </Card>
    </StepScreen>
  );
};

const styles = StyleSheet.create({
  section: { paddingVertical: spacing.md },
  sectionTitle: {
    ...typography.body,
    fontWeight: '600',
    fontFamily: 'Inter-SemiBold',
    marginBottom: spacing.md,
    textAlign: 'center',
  },
  divider: { height: 1, backgroundColor: colors.border, marginVertical: spacing.lg },
});

