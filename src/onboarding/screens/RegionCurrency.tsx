import React, { useEffect, useState } from 'react';
import { TextInput, Text, StyleSheet } from 'react-native';
import { StepScreen } from '../components/StepScreen';
import { Card } from '../components/Card';
import { useOnboardingStore } from '../store';
import { strings } from '../i18n/de';
import { onboardingSchemas } from '../utils/validators';
import { getLocaleDefaults } from '../utils/format';
import { colors, spacing, typography } from '../theme';
import { useOnboardingStep } from '../hooks';

export const RegionCurrencyScreen: React.FC = () => {
  const { stepNumber, totalSteps, goNext, goBack } = useOnboardingStep('RegionCurrency');
  const profile = useOnboardingStore((state) => state.profile);
  const mergeProfile = useOnboardingStore((state) => state.mergeProfile);
  const defaults = getLocaleDefaults();
  const [region, setRegion] = useState(profile.region || defaults.region);
  const [currency, setCurrency] = useState(profile.currency || defaults.currency);

  useEffect(() => {
    if (!profile.region) {
      mergeProfile({ region: defaults.region });
    }
    if (!profile.currency) {
      mergeProfile({ currency: defaults.currency });
    }
  }, []);

  useEffect(() => {
    mergeProfile({ region: region.toUpperCase() });
  }, [region, mergeProfile]);

  useEffect(() => {
    mergeProfile({ currency: currency.toUpperCase() });
  }, [currency, mergeProfile]);

  const valid = onboardingSchemas.regionCurrency.safeParse({ region, currency }).success;

  return (
    <StepScreen
      title={strings.region.title}
      subtitle={strings.region.subtitle}
      step={stepNumber}
      total={totalSteps}
      onNext={goNext}
      onBack={goBack}
      nextDisabled={!valid}
    >
      <Card>
        <Text style={styles.label}>{strings.region.regionLabel}</Text>
        <TextInput
          value={region}
          onChangeText={(text) => setRegion(text.toUpperCase())}
          autoCapitalize="characters"
          style={styles.input}
        />
        <Text style={styles.label}>{strings.region.currencyLabel}</Text>
        <TextInput
          value={currency}
          onChangeText={(text) => setCurrency(text.toUpperCase())}
          autoCapitalize="characters"
          style={styles.input}
        />
        <Text style={styles.helper}>{strings.region.helper}</Text>
      </Card>
    </StepScreen>
  );
};

const styles = StyleSheet.create({
  label: {
    ...typography.body,
    fontWeight: '600',
    fontFamily: 'Inter-SemiBold',
    marginTop: spacing.md,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    marginTop: spacing.xs,
    ...typography.body,
    backgroundColor: colors.surface,
  },
  helper: {
    ...typography.subheading,
    marginTop: spacing.lg,
  },
});
