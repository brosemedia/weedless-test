import React from 'react';
import { View, Text, StyleSheet, Switch } from 'react-native';
import { StepScreen } from '../components/StepScreen';
import { Card } from '../components/Card';
import { useOnboardingStore } from '../store';
import { useOnboardingStep } from '../hooks';
import { useStrings } from '../i18n/useStrings';
import { colors, spacing, typography } from '../theme';

export const CloudConsentOnboardingScreen: React.FC = () => {
  const { stepNumber, totalSteps, goNext, goBack } = useOnboardingStep('CloudConsent');
  const consent = useOnboardingStore((state) => state.profile.cloudSyncConsent ?? false);
  const mergeProfile = useOnboardingStore((state) => state.mergeProfile);
  const strings = useStrings();

  return (
    <StepScreen
      title={strings.cloudConsent.title}
      subtitle={strings.cloudConsent.subtitle}
      step={stepNumber}
      total={totalSteps}
      onNext={goNext}
      onBack={goBack}
      nextLabel={strings.cloudConsent.cta}
    >
      <Card>
        <Text style={styles.heading}>{strings.cloudConsent.heading}</Text>
        <Text style={styles.body}>{strings.cloudConsent.description}</Text>
        <View style={styles.switchRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.switchLabel}>{strings.cloudConsent.label}</Text>
            <Text style={styles.helper}>{strings.cloudConsent.helper}</Text>
          </View>
          <Switch
            value={consent}
            onValueChange={(value) => mergeProfile({ cloudSyncConsent: value })}
            trackColor={{ false: '#9BA3AE', true: colors.primary }}
            thumbColor={consent ? '#FFFFFF' : '#f4f3f4'}
          />
        </View>
        <Text style={styles.note}>{strings.cloudConsent.note}</Text>
      </Card>
    </StepScreen>
  );
};

const styles = StyleSheet.create({
  heading: {
    ...typography.subheading,
    fontWeight: '600',
    fontFamily: 'Inter-SemiBold',
    marginBottom: spacing.sm,
  },
  body: {
    ...typography.body,
    color: colors.muted,
    marginBottom: spacing.lg,
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.m,
    marginBottom: spacing.sm,
  },
  switchLabel: {
    ...typography.subheading,
    fontWeight: '600',
    fontFamily: 'Inter-SemiBold',
  },
  helper: {
    ...typography.body,
    color: colors.muted,
    marginTop: spacing.xs,
  },
  note: {
    ...typography.body,
    color: colors.muted,
    fontSize: 13,
  },
});
