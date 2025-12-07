import React from 'react';
import { View, StyleSheet } from 'react-native';
import { StepScreen } from '../components/StepScreen';
import { Card } from '../components/Card';
import { Chip } from '../components/Chip';
import { useOnboardingStore } from '../store';
import { useStrings } from '../i18n/useStrings';
import { useOnboardingStep } from '../hooks';
import { spacing } from '../theme';
import { onboardingSchemas } from '../utils/validators';

export const TriggersScreen: React.FC = () => {
  const { stepNumber, totalSteps, goNext, goBack } = useOnboardingStep('Triggers');
  const triggers = useOnboardingStore((state) => state.profile.triggers);
  const mergeProfile = useOnboardingStore((state) => state.mergeProfile);
  const strings = useStrings();

  const toggle = (value: string) => {
    const exists = triggers.includes(value);
    if (exists) {
      mergeProfile({ triggers: triggers.filter((item) => item !== value) });
    } else if (triggers.length < 5) {
      mergeProfile({ triggers: [...triggers, value] });
    }
  };

  const triggerOptions = strings.triggers.options;

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
          {triggerOptions.map((option) => {
            const iconName = strings.triggers.icons[option.value as keyof typeof strings.triggers.icons];
            return (
              <Chip
                key={option.value}
                label={option.label}
                active={triggers.includes(option.value)}
                onPress={() => toggle(option.value)}
                icon={iconName}
              />
            );
          })}
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
