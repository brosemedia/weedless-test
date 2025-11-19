import React from 'react';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { OnboardingStepId } from './types';
import { QUICK_MODE_STEP_IDS } from './stepOrder';
import { WelcomeGoalsScreen } from './screens/WelcomeGoals';
import { RegionCurrencyScreen } from './screens/RegionCurrency';
import { ConsumptionFormsScreen } from './screens/ConsumptionForms';
import { FrequencyQuantityScreen } from './screens/FrequencyQuantity';
import { PotencyOptionalScreen } from './screens/PotencyOptional';
import { SpendBudgetScreen } from './screens/SpendBudget';
import { QuitDateScreen } from './screens/QuitDate';
import { TriggersScreen } from './screens/Triggers';
import { BaselineScreen } from './screens/Baseline';
import { ConnectionsScreen } from './screens/Connections';
import { RemindersScreen } from './screens/Reminders';
import { MotivationScreen } from './screens/Motivation';
import { LegalScreen } from './screens/Legal';
import { AccountScreen } from './screens/Account';
import { SummaryScreen } from './screens/Summary';

export type OnboardingStackParamList = {
  [K in OnboardingStepId]: undefined;
};

export interface OnboardingStepConfig {
  id: OnboardingStepId;
  component: React.ComponentType<NativeStackScreenProps<OnboardingStackParamList, OnboardingStepId>>;
  quick?: boolean;
}

const quickSet = new Set<OnboardingStepId>(QUICK_MODE_STEP_IDS);

const rawConfigs: ReadonlyArray<{
  id: OnboardingStepId;
  component: React.ComponentType<NativeStackScreenProps<OnboardingStackParamList, OnboardingStepId>>;
}> = [
  { id: 'WelcomeGoals', component: WelcomeGoalsScreen },
  { id: 'RegionCurrency', component: RegionCurrencyScreen },
  { id: 'ConsumptionForms', component: ConsumptionFormsScreen },
  { id: 'FrequencyQuantity', component: FrequencyQuantityScreen },
  { id: 'PotencyOptional', component: PotencyOptionalScreen },
  { id: 'SpendBudget', component: SpendBudgetScreen },
  { id: 'QuitDate', component: QuitDateScreen },
  { id: 'Triggers', component: TriggersScreen },
  { id: 'Baseline', component: BaselineScreen },
  { id: 'Connections', component: ConnectionsScreen },
  { id: 'Reminders', component: RemindersScreen },
  { id: 'Motivation', component: MotivationScreen },
  { id: 'Legal', component: LegalScreen },
  { id: 'Account', component: AccountScreen },
  { id: 'Summary', component: SummaryScreen },
];

export const ONBOARDING_STEP_CONFIGS: OnboardingStepConfig[] = rawConfigs.map((config) => ({
  ...config,
  quick: quickSet.has(config.id),
}));
