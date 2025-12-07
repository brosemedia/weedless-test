import React from 'react';
import { View, StyleSheet, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { StepScreen } from '../components/StepScreen';
import { Card } from '../components/Card';
import { Chip } from '../components/Chip';
import { useOnboardingStore } from '../store';
import { useStrings } from '../i18n/useStrings';
import { spacing, colors } from '../theme';
import { onboardingSchemas } from '../utils/validators';
import { useOnboardingStep } from '../hooks';

export const ConsumptionFormsScreen: React.FC = () => {
  const { stepNumber, totalSteps, goNext, goBack } = useOnboardingStep('ConsumptionForms');
  const forms = useOnboardingStore((state) => state.profile.consumption.forms);
  const mergeProfile = useOnboardingStore((state) => state.mergeProfile);
  const strings = useStrings();

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
          {strings.forms.options.map((option) => {
            const isActive = forms.includes(option.value);
            const iconName = strings.forms.icons[option.value as keyof typeof strings.forms.icons];
            return (
              <View key={option.value} style={styles.chipWrapper}>
                <Chip
                  label={option.label}
                  active={isActive}
                  onPress={() => toggleForm(option.value)}
                  icon={iconName}
                />
              </View>
            );
          })}
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
  chipWrapper: {
    marginRight: spacing.sm,
    marginBottom: spacing.sm,
  },
});
