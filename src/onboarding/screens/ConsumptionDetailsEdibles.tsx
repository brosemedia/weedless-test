import React, { useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { StepScreen } from '../components/StepScreen';
import { Card } from '../components/Card';
import { HapticSlider } from '../components/HapticSlider';
import { useOnboardingStore } from '../store';
import { useOnboardingStep } from '../hooks';
import { colors, spacing, typography } from '../theme';

export const ConsumptionDetailsEdiblesScreen: React.FC = () => {
  const { stepNumber, totalSteps, goNext, goBack } = useOnboardingStep('ConsumptionDetailsEdibles');
  const profile = useOnboardingStore((state) => state.profile);
  const mergeProfile = useOnboardingStore((state) => state.mergeProfile);
  
  const details = profile.consumptionDetails?.edibles || {};
  const [ediblesPerWeek, setEdiblesPerWeek] = useState(details.ediblesPerWeek || 0);
  const [mgTHCPerPortion, setMgTHCPerPortion] = useState(details.mgTHCPerPortion || 10);

  const handleEdiblesChange = (value: number) => {
    setEdiblesPerWeek(value);
    mergeProfile({
      consumptionDetails: {
        ...profile.consumptionDetails,
        edibles: { ...details, ediblesPerWeek: value, mgTHCPerPortion },
      },
    });
  };

  const handleMgChange = (value: number) => {
    setMgTHCPerPortion(value);
    mergeProfile({
      consumptionDetails: {
        ...profile.consumptionDetails,
        edibles: { ...details, ediblesPerWeek, mgTHCPerPortion: value },
      },
    });
  };

  return (
    <StepScreen
      title="Deine Edible-Details"
      subtitle="Edibles pro Woche und mg THC pro Portion"
      step={stepNumber}
      total={totalSteps}
      onNext={goNext}
      onBack={goBack}
      nextDisabled={ediblesPerWeek === 0 || mgTHCPerPortion === 0}
    >
      <Card>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Edibles pro Woche</Text>
          <HapticSlider
            value={ediblesPerWeek}
            onValueChange={handleEdiblesChange}
            minimumValue={0}
            maximumValue={50}
            step={1}
            formatValue={(v) => `${v} Edibles`}
          />
        </View>
        <View style={styles.divider} />
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>mg THC pro Portion</Text>
          <HapticSlider
            value={mgTHCPerPortion}
            onValueChange={handleMgChange}
            minimumValue={1}
            maximumValue={100}
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

