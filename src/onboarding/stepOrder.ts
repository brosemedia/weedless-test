import type { OnboardingMode, OnboardingStepId } from './types';

export const ONBOARDING_STEP_IDS: OnboardingStepId[] = [
  'WelcomeGoals',
  'RegionCurrency',
  'ConsumptionForms',
  'FrequencyQuantity',
  'PotencyOptional',
  'SpendBudget',
  'QuitDate',
  'Triggers',
  'Baseline',
  'Connections',
  'Reminders',
  'Motivation',
  'Legal',
  'Account',
  'Summary',
];

export const QUICK_MODE_STEP_IDS: OnboardingStepId[] = [
  'WelcomeGoals',
  'ConsumptionForms',
  'FrequencyQuantity',
  'QuitDate',
  'Reminders',
  'Summary',
];

export const getStepIdsForMode = (mode: OnboardingMode): OnboardingStepId[] =>
  mode === 'quick' ? QUICK_MODE_STEP_IDS : ONBOARDING_STEP_IDS;
