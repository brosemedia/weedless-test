import { useCallback, useEffect, useMemo } from 'react';
import { useFocusEffect, useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { track } from './services/analytics';
import { useOnboardingStore, getStepIdsForMode } from './store';
import type { OnboardingMode, OnboardingStepId } from './types';
import type { OnboardingStackParamList } from './steps';

export const useOnboardingStep = (stepId: OnboardingStepId) => {
  const navigation = useNavigation<NativeStackNavigationProp<OnboardingStackParamList>>();
  const route = useRoute();
  const mode = useOnboardingStore((state) => state.mode);
  const hydrated = useOnboardingStore((state) => state.hydrated);
  const setCurrentStepIndex = useOnboardingStore((state) => state.setCurrentStepIndex);
  const steps = useMemo(() => getStepIdsForMode(mode), [mode]);
  const currentIndex = steps.indexOf(stepId);

  useEffect(() => {
    if (!hydrated || currentIndex < 0) return;
    setCurrentStepIndex(currentIndex);
  }, [hydrated, currentIndex, setCurrentStepIndex]);

  const goToIndex = useCallback(
    (index: number) => {
      const targetIndex = Math.min(Math.max(index, 0), steps.length - 1);
      const targetId = steps[targetIndex];
      if (!targetId) return;
      setCurrentStepIndex(targetIndex);
      if (route.name !== targetId) {
        navigation.navigate(targetId);
      }
    },
    [navigation, route.name, setCurrentStepIndex, steps]
  );

  const goNext = useCallback(() => goToIndex(currentIndex + 1), [currentIndex, goToIndex]);
  const goBack = useCallback(() => goToIndex(currentIndex - 1), [currentIndex, goToIndex]);

  useFocusEffect(
    useCallback(() => {
      track('onboarding_step_viewed', { step_id: stepId, mode });
    }, [mode, stepId])
  );

  return {
    goNext,
    goBack,
    stepIndex: currentIndex,
    stepNumber: currentIndex + 1,
    totalSteps: steps.length,
    isFirstStep: currentIndex <= 0,
    isLastStep: currentIndex >= steps.length - 1,
    mode,
  };
};

export const useStepIds = (mode: OnboardingMode) => useMemo(() => getStepIdsForMode(mode), [mode]);
