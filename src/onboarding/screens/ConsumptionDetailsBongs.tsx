import React, { useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { StepScreen } from '../components/StepScreen';
import { Card } from '../components/Card';
import { HapticSlider } from '../components/HapticSlider';
import { useOnboardingStore } from '../store';
import { useOnboardingStep } from '../hooks';
import { colors, spacing, typography } from '../theme';

export const ConsumptionDetailsBongsScreen: React.FC = () => {
  const { stepNumber, totalSteps, goNext, goBack } = useOnboardingStep('ConsumptionDetailsBongs');
  const profile = useOnboardingStore((state) => state.profile);
  const mergeProfile = useOnboardingStore((state) => state.mergeProfile);
  
  const details = profile.consumptionDetails?.bongs || {};
  const [sessionsPerWeek, setSessionsPerWeek] = useState(details.sessionsPerWeek || 0);
  const [gramsPerSession, setGramsPerSession] = useState(details.gramsPerSession || 0.5);

  const handleSessionsChange = (value: number) => {
    setSessionsPerWeek(value);
    mergeProfile({
      consumptionDetails: {
        ...profile.consumptionDetails,
        bongs: { ...details, sessionsPerWeek: value, gramsPerSession },
      },
    });
  };

  const handleGramsChange = (value: number) => {
    setGramsPerSession(value);
    mergeProfile({
      consumptionDetails: {
        ...profile.consumptionDetails,
        bongs: { ...details, sessionsPerWeek, gramsPerSession: value },
      },
    });
  };

  return (
    <StepScreen
      title="Deine Bong-Details"
      subtitle="Sessions pro Woche und Gramm pro Session"
      step={stepNumber}
      total={totalSteps}
      onNext={goNext}
      onBack={goBack}
      nextDisabled={sessionsPerWeek === 0 || gramsPerSession === 0}
    >
      <Card>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Sessions pro Woche</Text>
          <HapticSlider
            value={sessionsPerWeek}
            onValueChange={handleSessionsChange}
            minimumValue={0}
            maximumValue={50}
            step={1}
            formatValue={(v) => `${v} Sessions`}
          />
        </View>
        <View style={styles.divider} />
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Gramm pro Session</Text>
          <HapticSlider
            value={gramsPerSession}
            onValueChange={handleGramsChange}
            minimumValue={0.1}
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

