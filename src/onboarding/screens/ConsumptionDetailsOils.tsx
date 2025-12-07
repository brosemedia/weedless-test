import React, { useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { StepScreen } from '../components/StepScreen';
import { Card } from '../components/Card';
import { HapticSlider } from '../components/HapticSlider';
import { useOnboardingStore } from '../store';
import { useOnboardingStep } from '../hooks';
import { colors, spacing, typography } from '../theme';

export const ConsumptionDetailsOilsScreen: React.FC = () => {
  const { stepNumber, totalSteps, goNext, goBack } = useOnboardingStep('ConsumptionDetailsOils');
  const profile = useOnboardingStore((state) => state.profile);
  const mergeProfile = useOnboardingStore((state) => state.mergeProfile);
  
  const details = profile.consumptionDetails?.oils || {};
  const [sessionsPerWeek, setSessionsPerWeek] = useState(details.oilSessionsPerWeek || 0);
  const [mgTHCPerSession, setMgTHCPerSession] = useState(details.estimatedMgTHCPerOilSession || 10);

  const handleSessionsChange = (value: number) => {
    setSessionsPerWeek(value);
    mergeProfile({
      consumptionDetails: {
        ...profile.consumptionDetails,
        oils: { ...details, oilSessionsPerWeek: value, estimatedMgTHCPerOilSession: mgTHCPerSession },
      },
    });
  };

  const handleMgChange = (value: number) => {
    setMgTHCPerSession(value);
    mergeProfile({
      consumptionDetails: {
        ...profile.consumptionDetails,
        oils: { ...details, oilSessionsPerWeek: sessionsPerWeek, estimatedMgTHCPerOilSession: value },
      },
    });
  };

  return (
    <StepScreen
      title="Deine Öl/Dab-Details"
      subtitle="Sessions pro Woche und geschätzte mg THC pro Session"
      step={stepNumber}
      total={totalSteps}
      onNext={goNext}
      onBack={goBack}
      nextDisabled={sessionsPerWeek === 0 || mgTHCPerSession === 0}
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
          <Text style={styles.sectionTitle}>Geschätzte mg THC pro Session</Text>
          <HapticSlider
            value={mgTHCPerSession}
            onValueChange={handleMgChange}
            minimumValue={1}
            maximumValue={200}
            step={1}
            formatValue={(v) => `${v} mg`}
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

