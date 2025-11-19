import React, { useState } from 'react';
import { Text, StyleSheet } from 'react-native';
import { StepScreen } from '../components/StepScreen';
import { Card } from '../components/Card';
import { Checkbox } from '../components/Checkbox';
import { useOnboardingStore } from '../store';
import { strings } from '../i18n/de';
import { useOnboardingStep } from '../hooks';
import { onboardingSchemas } from '../utils/validators';
import { colors, spacing, typography } from '../theme';
import { track } from '../services/analytics';

export const ConnectionsScreen: React.FC = () => {
  const { stepNumber, totalSteps, goNext, goBack } = useOnboardingStep('Connections');
  const connections = useOnboardingStore((state) => state.profile.connections);
  const mergeProfile = useOnboardingStore((state) => state.mergeProfile);
  const [tracked, setTracked] = useState(false);

  const update = (key: keyof typeof connections, value: boolean) => {
    mergeProfile({
      connections: {
        ...connections,
        [key]: value,
      },
    });
  };

  const handleNext = () => {
    if (!tracked && (connections.healthKit || connections.screenTime || connections.calendar)) {
      track('connections_opt_in', connections);
      setTracked(true);
    }
    goNext();
  };

  const valid = onboardingSchemas.connections.safeParse(connections).success;

  return (
    <StepScreen
      title={strings.connections.title}
      subtitle={strings.connections.subtitle}
      step={stepNumber}
      total={totalSteps}
      onNext={handleNext}
      onBack={goBack}
      nextDisabled={!valid}
    >
      <Card>
        <Checkbox
          label={strings.connections.healthKit}
          value={connections.healthKit}
          onChange={(value) => update('healthKit', value)}
        />
        <Checkbox
          label={strings.connections.screenTime}
          value={connections.screenTime}
          onChange={(value) => update('screenTime', value)}
        />
        <Checkbox
          label={strings.connections.calendar}
          value={connections.calendar}
          onChange={(value) => update('calendar', value)}
        />
        <Text style={styles.note}>{strings.connections.note}</Text>
      </Card>
    </StepScreen>
  );
};

const styles = StyleSheet.create({
  note: {
    ...typography.subheading,
    color: colors.muted,
    marginTop: spacing.md,
  },
});
