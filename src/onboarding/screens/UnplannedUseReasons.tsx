import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { StepScreen } from '../components/StepScreen';
import { useOnboardingStore } from '../store';
import { useOnboardingStep } from '../hooks';
import { useTheme } from '../../../src/theme/useTheme';
import { spacing, radius, typography, shadows } from '../../../src/design/tokens';

const UNPLANNED_REASONS = [
  'Meine Freunde',
  'Schmerzen lindern',
  'Einfach high sein',
  'Einschlafen',
  'Langeweile reduzieren',
  'Mein Partner/Freund',
  'Kreativität steigern',
  'Stress/Entspannung',
  'Entzugserscheinungen reduzieren',
  'Negativen Gedanken/Gefühlen entfliehen',
  'Aus Gewohnheit',
  'Es ist verfügbar',
  'Dinge verbessern (Shows, Musik, Filme)',
];

export const UnplannedUseReasonsScreen: React.FC = () => {
  const { stepNumber, totalSteps, goNext, goBack } = useOnboardingStep('UnplannedUseReasons');
  const unplannedUseReasons = useOnboardingStore((state) => state.profile.unplannedUseReasons);
  const mergeProfile = useOnboardingStore((state) => state.mergeProfile);
  const { theme } = useTheme();
  const colors = theme.colors;

  const toggleReason = (reason: string) => {
    const current = unplannedUseReasons || [];
    if (current.includes(reason)) {
      mergeProfile({ unplannedUseReasons: current.filter((r) => r !== reason) });
    } else {
      mergeProfile({ unplannedUseReasons: [...current, reason] });
    }
  };

  return (
    <StepScreen
      title="Warum konsumierst du manchmal, obwohl du es nicht geplant hast?"
      subtitle="Wähle alle zutreffenden Gründe aus."
      step={stepNumber}
      total={totalSteps}
      onNext={goNext}
      onBack={goBack}
    >
      <View style={styles.list}>
        {UNPLANNED_REASONS.map((reason) => {
          const isSelected = unplannedUseReasons.includes(reason);
          return (
            <Pressable
              key={reason}
              style={({ pressed }) => [
                styles.reasonCard,
                {
                  backgroundColor: isSelected ? colors.primaryMuted : colors.surface,
                  borderColor: isSelected ? colors.primary : colors.border,
                  transform: [{ scale: pressed ? 0.97 : 1 }],
                },
              ]}
              onPress={() => toggleReason(reason)}
            >
              <Text
                style={[
                  styles.reasonText,
                  {
                    color: isSelected ? colors.primary : colors.text,
                  },
                ]}
              >
                {reason}
              </Text>
              {isSelected && (
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
  reasonCard: {
    borderWidth: 2,
    borderRadius: radius.l,
    padding: spacing.l,
    minHeight: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    ...shadows.sm,
  },
  reasonText: {
    ...typography.variants.body,
    fontSize: 16,
    fontWeight: '500',
    flex: 1,
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
