import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { StepScreen } from '../components/StepScreen';
import { Card } from '../components/Card';
import { useOnboardingStore } from '../store';
import { useStrings } from '../i18n/useStrings';
import { useOnboardingStep } from '../hooks';
import { onboardingSchemas } from '../utils/validators';
import { colors, spacing, typography } from '../theme';

export const AccountScreen: React.FC = () => {
  const { stepNumber, totalSteps, goNext, goBack } = useOnboardingStep('Account');
  const account = useOnboardingStore((state) => state.profile.account);
  const mergeProfile = useOnboardingStore((state) => state.mergeProfile);
  const strings = useStrings();

  const setMethod = (method: 'anonymous' | 'apple' | 'google') => {
    mergeProfile({ account: { method } });
  };

  const valid = onboardingSchemas.account.safeParse(account).success;

  return (
    <StepScreen
      title={strings.account.title}
      subtitle={strings.account.subtitle}
      step={stepNumber}
      total={totalSteps}
      onNext={goNext}
      onBack={goBack}
      nextDisabled={!valid}
    >
      <Card>
        <View style={styles.list}>
          <TouchableOpacity
            style={[styles.item, account.method === 'anonymous' && styles.active]}
            onPress={() => setMethod('anonymous')}
          >
            <Text style={styles.text}>{strings.account.anonymous}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.item, account.method === 'apple' && styles.active]}
            onPress={() => setMethod('apple')}
          >
            <Text style={styles.text}>{strings.account.apple}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.item, account.method === 'google' && styles.active]}
            onPress={() => setMethod('google')}
          >
            <Text style={styles.text}>{strings.account.google}</Text>
          </TouchableOpacity>
        </View>
      </Card>
    </StepScreen>
  );
};

const styles = StyleSheet.create({
  list: {
    gap: spacing.md,
  },
  item: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    backgroundColor: colors.surface,
  },
  active: {
    borderColor: colors.primary,
    backgroundColor: '#E8F5E9',
  },
  text: {
    ...typography.body,
  },
});
