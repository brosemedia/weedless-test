import React from 'react';
import { View, StyleSheet } from 'react-native';
import { StepScreen } from '../components/StepScreen';
import { Card } from '../components/Card';
import { Chip } from '../components/Chip';
import { useOnboardingStore } from '../store';
import { strings } from '../i18n/de';
import { spacing } from '../theme';
import { onboardingSchemas } from '../utils/validators';
import { useOnboardingStep } from '../hooks';

export const ConsumptionFormsScreen: React.FC = () => {
  const { stepNumber, totalSteps, goNext, goBack } = useOnboardingStep('ConsumptionForms');
  const forms = useOnboardingStore((state) => state.profile.consumption.forms);
  const mergeProfile = useOnboardingStore((state) => state.mergeProfile);

  const toggleForm = (value: string) => {
    const exists = forms.includes(value);
    const nextForms = exists ? forms.filter((item) => item !== value) : [...forms, value];
    mergeProfile({
      consumption: {
        ...useOnboardingStore.getState().profile.consumption,
        forms: nextForms,
      },
    });
  };

  const valid = onboardingSchemas.forms.safeParse({ forms }).success;

  return (
    <StepScreen
      title={strings.forms.title}
      subtitle={strings.forms.subtitle}
      step={stepNumber}
      total={totalSteps}
      onNext={goNext}
      onBack={goBack}
      nextDisabled={!valid}
    >
      <Card>
        <View style={styles.chipContainer}>
          {strings.forms.options.map((option) => (
            <Chip
              key={option.value}
              label={option.label}
              active={forms.includes(option.value)}
              onPress={() => toggleForm(option.value)}
            />
          ))}
        </View>
      </Card>
    </StepScreen>
  );
};

const styles = StyleSheet.create({
  chipContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -spacing.sm,
  },
});
