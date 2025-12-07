import React from 'react';
import { Text, StyleSheet } from 'react-native';
import { StepScreen } from '../components/StepScreen';
import { Card } from '../components/Card';
import { Checkbox } from '../components/Checkbox';
import { useOnboardingStore } from '../store';
import { useStrings } from '../i18n/useStrings';
import { useOnboardingStep } from '../hooks';
import { onboardingSchemas } from '../utils/validators';
import { colors, spacing, typography } from '../theme';

export const LegalScreen: React.FC = () => {
  const { stepNumber, totalSteps, goNext, goBack } = useOnboardingStep('Legal');
  const legal = useOnboardingStore((state) => state.profile.legal);
  const mergeProfile = useOnboardingStore((state) => state.mergeProfile);
  const strings = useStrings();

  const update = (patch: Partial<typeof legal>) => {
    mergeProfile({
      legal: {
        ...legal,
        ...patch,
      },
    });
  };

  const valid = onboardingSchemas.legal.safeParse(legal).success;

  return (
    <StepScreen
      title={strings.legal.title}
      subtitle={strings.legal.subtitle}
      step={stepNumber}
      total={totalSteps}
      onNext={goNext}
      onBack={goBack}
      nextDisabled={!valid}
    >
      <Card>
        <Text style={styles.note}>{strings.legal.subtitle}</Text>
        <Checkbox
          label={strings.legal.ageConfirmed}
          value={legal.ageConfirmed}
          onChange={(value) => update({ ageConfirmed: value })}
        />
        <Checkbox
          label={strings.legal.disclaimer}
          value={legal.disclaimerAccepted}
          onChange={(value) => update({ disclaimerAccepted: value })}
        />
      </Card>
    </StepScreen>
  );
};

const styles = StyleSheet.create({
  note: {
    ...typography.subheading,
    color: colors.muted,
    marginBottom: spacing.lg,
  },
});
