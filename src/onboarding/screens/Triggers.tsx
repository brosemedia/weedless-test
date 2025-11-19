import React from 'react';
import { View, StyleSheet } from 'react-native';
import { StepScreen } from '../components/StepScreen';
import { Card } from '../components/Card';
import { Chip } from '../components/Chip';
import { useOnboardingStore } from '../store';
import { strings } from '../i18n/de';
import { useOnboardingStep } from '../hooks';
import { spacing } from '../theme';
import { onboardingSchemas } from '../utils/validators';

export const TriggersScreen: React.FC = () => {
  const { stepNumber, totalSteps, goNext, goBack } = useOnboardingStep('Triggers');
  const triggers = useOnboardingStore((state) => state.profile.triggers);
  const mergeProfile = useOnboardingStore((state) => state.mergeProfile);

  const toggle = (value: string) => {
    const exists = triggers.includes(value);
    if (exists) {
      mergeProfile({ triggers: triggers.filter((item) => item !== value) });
    } else if (triggers.length < 5) {
      mergeProfile({ triggers: [...triggers, value] });
    }
  };

  const valid = onboardingSchemas.triggers.safeParse({ triggers }).success;

  return (
    <StepScreen
      title={strings.triggers.title}
      subtitle={strings.triggers.subtitle}
      step={stepNumber}
      total={totalSteps}
      onNext={goNext}
      onBack={goBack}
      nextDisabled={!valid}
    >
      <Card>
        <View style={styles.grid}>
          {strings.triggers.options.map((option) => (
            <Chip
              key={option}
              label={option}
              active={triggers.includes(option)}
              onPress={() => toggle(option)}
            />
          ))}
        </View>
      </Card>
    </StepScreen>
  );
};

const styles = StyleSheet.create({
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -spacing.sm,
  },
});
