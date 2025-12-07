import React from 'react';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { OnboardingStepId } from './types';
import { WelcomeScreen } from './screens/Welcome';
import { DateOfBirthScreen } from './screens/DateOfBirth';
import { GoalScreen } from './screens/Goal';
import { FrequencyScreen } from './screens/Frequency';
import { CurrencyScreen } from './screens/Currency';
import { WeeklySpendScreen } from './screens/WeeklySpend';
import { ConsumptionMethodsScreen } from './screens/ConsumptionMethods';
import { ConsumptionDetailsJointsScreen } from './screens/ConsumptionDetailsJoints';
import { ConsumptionDetailsBongsScreen } from './screens/ConsumptionDetailsBongs';
import { ConsumptionDetailsEdiblesScreen } from './screens/ConsumptionDetailsEdibles';
import { ConsumptionDetailsVapesScreen } from './screens/ConsumptionDetailsVapes';
import { ConsumptionDetailsBluntsScreen } from './screens/ConsumptionDetailsBlunts';
import { ConsumptionDetailsCapsulesScreen } from './screens/ConsumptionDetailsCapsules';
import { ConsumptionDetailsOilsScreen } from './screens/ConsumptionDetailsOils';
import { THCPotencyScreen } from './screens/THCPotency';
import { GenderScreen } from './screens/Gender';
import { ImpactScreen } from './screens/Impact';
import { FirstUseTimeScreen } from './screens/FirstUseTime';
import { QuitDateScreen } from './screens/QuitDate';
import { AppPlanScreen } from './screens/AppPlan';
import { UnplannedUseReasonsScreen } from './screens/UnplannedUseReasons';
import { PausePlanScreen } from './screens/PausePlan';
import { PaymentScreen } from './screens/Payment';
import { CloudConsentOnboardingScreen } from './screens/CloudConsent';
import { FinalSetupScreen } from './screens/FinalSetup';

export type OnboardingStackParamList = {
  [K in OnboardingStepId]: undefined;
};

export interface OnboardingStepConfig {
  id: OnboardingStepId;
  component: React.ComponentType<NativeStackScreenProps<OnboardingStackParamList, OnboardingStepId>>;
}

const rawConfigs: ReadonlyArray<{
  id: OnboardingStepId;
  component: React.ComponentType<NativeStackScreenProps<OnboardingStackParamList, OnboardingStepId>>;
}> = [
  { id: 'Welcome', component: WelcomeScreen },
  { id: 'DateOfBirth', component: DateOfBirthScreen },
  { id: 'Goal', component: GoalScreen },
  { id: 'Frequency', component: FrequencyScreen },
  { id: 'Currency', component: CurrencyScreen },
  { id: 'WeeklySpend', component: WeeklySpendScreen },
  { id: 'ConsumptionMethods', component: ConsumptionMethodsScreen },
  { id: 'ConsumptionDetailsJoints', component: ConsumptionDetailsJointsScreen },
  { id: 'ConsumptionDetailsBongs', component: ConsumptionDetailsBongsScreen },
  { id: 'ConsumptionDetailsEdibles', component: ConsumptionDetailsEdiblesScreen },
  { id: 'ConsumptionDetailsVapes', component: ConsumptionDetailsVapesScreen },
  { id: 'ConsumptionDetailsBlunts', component: ConsumptionDetailsBluntsScreen },
  { id: 'ConsumptionDetailsCapsules', component: ConsumptionDetailsCapsulesScreen },
  { id: 'ConsumptionDetailsOils', component: ConsumptionDetailsOilsScreen },
  { id: 'THCPotency', component: THCPotencyScreen },
  { id: 'Gender', component: GenderScreen },
  { id: 'Impact', component: ImpactScreen },
  { id: 'QuitDate', component: QuitDateScreen },
  { id: 'FirstUseTime', component: FirstUseTimeScreen },
  { id: 'AppPlan', component: AppPlanScreen },
  { id: 'UnplannedUseReasons', component: UnplannedUseReasonsScreen },
  { id: 'PausePlan', component: PausePlanScreen },
  { id: 'Payment', component: PaymentScreen },
  { id: 'CloudConsent', component: CloudConsentOnboardingScreen },
  { id: 'FinalSetup', component: FinalSetupScreen },
];

export const ONBOARDING_STEP_CONFIGS: OnboardingStepConfig[] = rawConfigs;
