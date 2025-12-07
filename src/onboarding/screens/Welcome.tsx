import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { StepScreen } from '../components/StepScreen';
import { Card } from '../components/Card';
import { useOnboardingStep } from '../hooks';
import { colors, spacing, typography } from '../theme';

export const WelcomeScreen: React.FC = () => {
  const { stepNumber, totalSteps, goNext } = useOnboardingStep('Welcome');

  return (
    <StepScreen
      title="Willkommen bei Hazeless"
      subtitle="Lass uns die App kurz auf dich einstellen, damit sie perfekt zu dir passt."
      step={stepNumber}
      total={totalSteps}
      onNext={goNext}
      showBack={false}
      nextLabel="Jetzt starten"
    >
      <View style={styles.content}>
        <Card>
          <Text style={styles.description}>
            Wir stellen dir ein paar Fragen, um dir ein personalisiertes Erlebnis zu bieten.
          </Text>
        </Card>
      </View>
    </StepScreen>
  );
};

const styles = StyleSheet.create({
  content: {
    flex: 1,
    justifyContent: 'center',
  },
  description: {
    ...typography.body,
    textAlign: 'center',
    color: colors.muted,
    lineHeight: 24,
  },
});

