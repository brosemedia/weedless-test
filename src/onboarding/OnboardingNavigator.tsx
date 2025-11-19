import React, { useEffect, useState } from 'react';
import { NavigationContainer, useNavigationContainerRef } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { ActivityIndicator, View } from 'react-native';
import { useOnboardingStore, getStepIdsForMode } from './store';
import { ONBOARDING_STEP_CONFIGS, OnboardingStackParamList } from './steps';
import { colors } from './theme';

const Stack = createNativeStackNavigator<OnboardingStackParamList>();

export const OnboardingNavigator: React.FC = () => {
  const navigationRef = useNavigationContainerRef<OnboardingStackParamList>();
  const mode = useOnboardingStore((state) => state.mode);
  const currentStepIndex = useOnboardingStore((state) => state.currentStepIndex);
  const hydrated = useOnboardingStore((state) => state.hydrated);
  const [ready, setReady] = useState(false);

  const steps = getStepIdsForMode(mode);
  const target = steps[currentStepIndex] ?? steps[0];

  useEffect(() => {
    if (!ready || !hydrated || !target) {
      return;
    }
    const currentRoute = navigationRef.getCurrentRoute()?.name;
    if (currentRoute !== target) {
      navigationRef.navigate(target);
    }
  }, [ready, hydrated, target, navigationRef]);

  if (!hydrated) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.background, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <NavigationContainer ref={navigationRef} onReady={() => setReady(true)}>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {ONBOARDING_STEP_CONFIGS.map((step) => (
          <Stack.Screen key={step.id} name={step.id} component={step.component} />
        ))}
      </Stack.Navigator>
    </NavigationContainer>
  );
};
