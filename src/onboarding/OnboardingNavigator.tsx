import React, { useEffect, useState } from 'react';
import { NavigationContainer, useNavigationContainerRef } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { ActivityIndicator, View, StyleSheet } from 'react-native';
import { useOnboardingStore, getStepIdsForGoal } from './store';
import { ONBOARDING_STEP_CONFIGS, OnboardingStackParamList } from './steps';
import { useTheme } from '../theme/useTheme';

const Stack = createNativeStackNavigator<OnboardingStackParamList>();

export const OnboardingNavigator: React.FC = () => {
  const navigationRef = useNavigationContainerRef<OnboardingStackParamList>();
  const goal = useOnboardingStore((state) => state.profile.goal);
  const consumptionMethods = useOnboardingStore((state) => state.profile.consumptionMethods);
  const currentStepIndex = useOnboardingStore((state) => state.currentStepIndex);
  const hydrated = useOnboardingStore((state) => state.hydrated);
  const hasCompletedOnboarding = useOnboardingStore((state) => state.hasCompletedOnboarding);
  const [ready, setReady] = useState(false);
  const { theme } = useTheme();
  const colors = theme.colors;

  const steps = getStepIdsForGoal(goal, consumptionMethods);
  const target = steps[currentStepIndex] ?? steps[0];

  useEffect(() => {
    // Don't navigate if onboarding is completed
    if (hasCompletedOnboarding) {
      return;
    }
    if (!ready || !hydrated || !target) {
      return;
    }
    const currentRoute = navigationRef.getCurrentRoute()?.name;
    if (currentRoute !== target) {
      navigationRef.navigate(target);
    }
  }, [ready, hydrated, target, navigationRef, hasCompletedOnboarding, goal, consumptionMethods]);

  if (!hydrated) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.bg }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <NavigationContainer ref={navigationRef} onReady={() => setReady(true)}>
      <Stack.Navigator
        screenOptions={{
          headerShown: false,
          animation: 'slide_from_right',
          animationDuration: 300,
          contentStyle: {
            backgroundColor: colors.bg,
          },
        }}
      >
        {ONBOARDING_STEP_CONFIGS.map((step) => (
          <Stack.Screen key={step.id} name={step.id} component={step.component} />
        ))}
      </Stack.Navigator>
    </NavigationContainer>
  );
};

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
