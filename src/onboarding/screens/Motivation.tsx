import React from 'react';
import { View, Text, TextInput, StyleSheet } from 'react-native';
import { StepScreen } from '../components/StepScreen';
import { Card } from '../components/Card';
import { Chip } from '../components/Chip';
import { useOnboardingStore } from '../store';
import { useStrings } from '../i18n/useStrings';
import { useOnboardingStep } from '../hooks';
import { onboardingSchemas } from '../utils/validators';
import { colors, spacing, typography } from '../theme';

export const MotivationScreen: React.FC = () => {
  const { stepNumber, totalSteps, goNext, goBack } = useOnboardingStep('Motivation');
  const profile = useOnboardingStore((state) => state.profile);
  const mergeProfile = useOnboardingStore((state) => state.mergeProfile);
  const strings = useStrings();

  const toggleMotivation = (value: string) => {
    const exists = profile.motivations.includes(value);
    if (exists) {
      mergeProfile({ motivations: profile.motivations.filter((item) => item !== value) });
    } else if (profile.motivations.length < 3) {
      mergeProfile({ motivations: [...profile.motivations, value] });
    }
  };

  const motivationOptions = strings.motivation.options;

  const updateCommitment = (text: string) => {
    mergeProfile({
      legal: {
        ...profile.legal,
        regionNote: text,
      },
    });
  };

  const valid = onboardingSchemas.motivation.safeParse({
    motivations: profile.motivations,
    commitment: profile.legal.regionNote,
  }).success;

  return (
    <StepScreen
      title={strings.motivation.title}
      subtitle={strings.motivation.subtitle}
      step={stepNumber}
      total={totalSteps}
      onNext={goNext}
      onBack={goBack}
      nextDisabled={!valid}
    >
      <Card>
        <View style={styles.chipRow}>
          {motivationOptions.map((option) => {
            const iconName = strings.motivation.icons[option.value as keyof typeof strings.motivation.icons];
            return (
              <Chip
                key={option.value}
                label={option.label}
                active={profile.motivations.includes(option.value)}
                onPress={() => toggleMotivation(option.value)}
                icon={iconName}
              />
            );
          })}
        </View>
        <Text style={styles.label}>{strings.motivation.commitment}</Text>
        <TextInput
          value={profile.legal.regionNote ?? ''}
          onChangeText={updateCommitment}
          placeholder={strings.common.optional}
          style={styles.input}
          multiline
        />
      </Card>
    </StepScreen>
  );
};

const styles = StyleSheet.create({
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: spacing.lg,
  },
  label: {
    ...typography.body,
    fontWeight: '600',
    fontFamily: 'Inter-SemiBold',
    marginBottom: spacing.sm,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    minHeight: 80,
    textAlignVertical: 'top',
    backgroundColor: colors.surface,
    ...typography.body,
  },
});
