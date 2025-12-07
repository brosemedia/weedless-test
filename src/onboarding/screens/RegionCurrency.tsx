import React, { useEffect, useState } from 'react';
import { Text, TextInput, StyleSheet, ScrollView, View, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { StepScreen } from '../components/StepScreen';
import { Card } from '../components/Card';
import { useOnboardingStore } from '../store';
import { useStrings } from '../i18n/useStrings';
import { onboardingSchemas } from '../utils/validators';
import { getLocaleDefaults } from '../utils/format';
import { colors, spacing, typography } from '../theme';
import { useOnboardingStep } from '../hooks';

interface CurrencyOption {
  code: string;
  symbol: string;
  name: string;
  icon: keyof typeof Ionicons.glyphMap;
}

const CURRENCIES: CurrencyOption[] = [
  { code: 'USD', symbol: '$', name: 'US Dollar', icon: 'cash-outline' },
  { code: 'EUR', symbol: '€', name: 'Euro', icon: 'cash-outline' },
  { code: 'GBP', symbol: '£', name: 'British Pound', icon: 'cash-outline' },
  { code: 'CAD', symbol: '$', name: 'Canadian Dollar', icon: 'cash-outline' },
  { code: 'AUD', symbol: '$', name: 'Australian Dollar', icon: 'cash-outline' },
  { code: 'CHF', symbol: 'Fr', name: 'Switzerland Franc', icon: 'cash-outline' },
  { code: 'CZK', symbol: 'Kč', name: 'Czech Koruna', icon: 'cash-outline' },
  { code: 'ILS', symbol: '₪', name: 'Israeli Shekel', icon: 'cash-outline' },
  { code: 'ZAR', symbol: 'R', name: 'South Africa Rand', icon: 'cash-outline' },
  { code: 'BRL', symbol: 'R$', name: 'Brazil Real', icon: 'cash-outline' },
  { code: 'BGN', symbol: 'лв', name: 'Bulgarian Lev', icon: 'cash-outline' },
  { code: 'PLN', symbol: 'zł', name: 'Poland Zloty', icon: 'cash-outline' },
  { code: 'INR', symbol: '₹', name: 'India Rupee', icon: 'cash-outline' },
  { code: 'ARS', symbol: '₱', name: 'Argentina Peso', icon: 'cash-outline' },
];

export const RegionCurrencyScreen: React.FC = () => {
  const { stepNumber, totalSteps, goNext, goBack } = useOnboardingStep('RegionCurrency');
  const profile = useOnboardingStore((state) => state.profile);
  const mergeProfile = useOnboardingStore((state) => state.mergeProfile);
  const strings = useStrings();
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

  const handleCurrencySelect = (code: string) => {
    setCurrency(code);
    mergeProfile({ currency: code.toUpperCase() });
  };

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
      </Card>
      <Card style={styles.currencyCard}>
        <Text style={styles.label}>{strings.region.currencyLabel}</Text>
        <ScrollView style={styles.currencyList} showsVerticalScrollIndicator={false}>
          {CURRENCIES.map((curr) => {
            const isSelected = currency.toUpperCase() === curr.code;
            return (
              <View
                key={curr.code}
                style={[styles.currencyOption, isSelected && styles.currencyOptionActive]}
              >
                <Pressable
                  style={styles.currencyPressable}
                  onPress={() => handleCurrencySelect(curr.code)}
                >
                  <View style={styles.currencyLeft}>
                    <Ionicons
                      name={curr.icon}
                      size={24}
                      color={isSelected ? colors.primary : colors.text}
                    />
                    <View style={styles.currencyInfo}>
                      <Text style={[styles.currencySymbol, isSelected && styles.currencySymbolActive]}>
                        {curr.symbol} {curr.name}
                      </Text>
                      <Text style={[styles.currencyCode, isSelected && styles.currencyCodeActive]}>
                        {curr.code}
                      </Text>
                    </View>
                  </View>
                  {isSelected && (
                    <Ionicons name="checkmark-circle" size={24} color={colors.primary} />
                  )}
                </Pressable>
              </View>
            );
          })}
        </ScrollView>
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
    marginBottom: spacing.sm,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    ...typography.body,
    backgroundColor: colors.surface,
  },
  currencyCard: {
    marginTop: spacing.lg,
  },
  currencyList: {
    maxHeight: 400,
  },
  currencyOption: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    marginBottom: spacing.sm,
    backgroundColor: colors.surface,
  },
  currencyOptionActive: {
    borderColor: colors.primary,
    backgroundColor: '#E8F5E9',
  },
  currencyPressable: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.md,
  },
  currencyLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  currencyInfo: {
    marginLeft: spacing.md,
    flex: 1,
  },
  currencySymbol: {
    ...typography.body,
    fontWeight: '600',
    fontFamily: 'Inter-SemiBold',
    color: colors.text,
  },
  currencySymbolActive: {
    color: colors.primary,
  },
  currencyCode: {
    ...typography.subheading,
    fontSize: 12,
    color: colors.muted,
    marginTop: 2,
  },
  currencyCodeActive: {
    color: colors.primary,
  },
  helper: {
    ...typography.subheading,
    marginTop: spacing.lg,
  },
});
