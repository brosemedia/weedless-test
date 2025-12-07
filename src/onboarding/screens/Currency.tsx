import React, { useMemo } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { StepScreen } from '../components/StepScreen';
import { useOnboardingStore } from '../store';
import { useOnboardingStep } from '../hooks';
import { useTheme } from '../../../src/theme/useTheme';
import { spacing, radius, typography, shadows } from '../../../src/design/tokens';

const CURRENCIES = [
  { code: 'EUR', name: 'Euro (EUR)', symbol: '€' },
  { code: 'USD', name: 'US Dollar (USD)', symbol: '$' },
  { code: 'GBP', name: 'Britisches Pfund (GBP)', symbol: '£' },
  { code: 'CHF', name: 'Schweizer Franken (CHF)', symbol: 'CHF' },
  { code: 'CAD', name: 'Kanadischer Dollar (CAD)', symbol: 'C$' },
  { code: 'AUD', name: 'Australischer Dollar (AUD)', symbol: 'A$' },
  { code: 'INR', name: 'Indische Rupie (INR)', symbol: '₹' },
  { code: 'ILS', name: 'Neuer Israelischer Shekel (ILS)', symbol: '₪' },
  { code: 'ZAR', name: 'Südafrikanischer Rand (ZAR)', symbol: 'R' },
  { code: 'ARS', name: 'Argentinischer Peso (ARS)', symbol: '$' },
];

export const CurrencyScreen: React.FC = () => {
  const { stepNumber, totalSteps, goNext, goBack } = useOnboardingStep('Currency');
  const currency = useOnboardingStore((state) => state.profile.currency);
  const mergeProfile = useOnboardingStore((state) => state.mergeProfile);
  const { theme } = useTheme();
  const colors = theme.colors;

  const valid = currency !== undefined && currency !== '';

  return (
    <StepScreen
      title="In welcher Währung rechnest du?"
      subtitle="Damit wir dir deine Ersparnisse korrekt anzeigen können."
      step={stepNumber}
      total={totalSteps}
      onNext={goNext}
      onBack={goBack}
      nextDisabled={!valid}
    >
      <View style={styles.list}>
        {CURRENCIES.map((curr) => {
          const isActive = currency === curr.code;
          return (
            <Pressable
              key={curr.code}
              style={({ pressed }) => [
                styles.currencyCard,
                {
                  backgroundColor: isActive ? colors.primaryMuted : colors.surface,
                  borderColor: isActive ? colors.primary : colors.border,
                  transform: [{ scale: pressed ? 0.97 : 1 }],
                },
              ]}
              onPress={() => mergeProfile({ currency: curr.code })}
            >
              <Text
                style={[
                  styles.currencyText,
                  {
                    color: isActive ? colors.primary : colors.text,
                  },
                ]}
              >
                {curr.name}
              </Text>
              {isActive && (
                <View style={[styles.checkmark, { backgroundColor: colors.primary }]}>
                  <Text style={styles.checkmarkText}>✓</Text>
                </View>
              )}
            </Pressable>
          );
        })}
      </View>
    </StepScreen>
  );
};

const styles = StyleSheet.create({
  list: {
    gap: spacing.m,
  },
  currencyCard: {
    borderWidth: 2,
    borderRadius: radius.l,
    padding: spacing.l,
    minHeight: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    ...shadows.sm,
  },
  currencyText: {
    ...typography.variants.body,
    fontSize: 16,
    fontWeight: '500',
  },
  checkmark: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: spacing.m,
  },
  checkmarkText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
});
