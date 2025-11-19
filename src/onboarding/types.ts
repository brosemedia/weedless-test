export type Goal = 'pause' | 'reduce' | 'quit' | 'track';
export type Unit = 'day' | 'week' | 'month';
export type ReminderNudgeLevel = 'low' | 'medium' | 'high';

export interface OnboardingProfile {
  goal: Goal;
  region: string;
  currency: string;
  consumption: {
    forms: string[];
    frequency: {
      unit: Unit;
      jointsPerUnit?: number;
      sessionsPerUnit?: number;
      hitsPerUnit?: number;
      portionsPerUnit?: number;
      gramsPerJoint?: number | null;
      mgPerPortion?: number | null;
      potencyTHC?: number | null;
    };
  };
  spend?: { unit: Unit; amount: number | null; goalNote?: string | null };
  quitDateISO?: string;
  pauseLengthDays?: number | null;
  reductionTargetPct?: number | null;
  triggers: string[];
  motivations: string[];
  baseline: { sleepQ?: number; mood?: number; stress?: number };
  connections: { healthKit: boolean; screenTime: boolean; calendar: boolean };
  reminders: { checkInTimeLocal?: string; nudgeLevel: ReminderNudgeLevel; relapseSupport: boolean };
  account: { method: 'anonymous' | 'apple' | 'google' };
  legal: { ageConfirmed: boolean; disclaimerAccepted: boolean; regionNote?: string };
}

export type OnboardingMode = 'quick' | 'full';

export type OnboardingStepId =
  | 'WelcomeGoals'
  | 'RegionCurrency'
  | 'ConsumptionForms'
  | 'FrequencyQuantity'
  | 'PotencyOptional'
  | 'SpendBudget'
  | 'QuitDate'
  | 'Triggers'
  | 'Baseline'
  | 'Connections'
  | 'Reminders'
  | 'Motivation'
  | 'Legal'
  | 'Account'
  | 'Summary';

export interface CostEstimateResult {
  value: number;
  confidence: 'low' | 'mid' | 'high';
  source: 'user' | 'estimate';
}

export interface SavingsResult {
  amount: number;
  days: number;
}
