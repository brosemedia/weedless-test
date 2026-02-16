export type Goal = 'pause' | 'reduce' | 'quit' | 'track';
export type Unit = 'day' | 'week' | 'month';
export type ReminderNudgeLevel = 'low' | 'medium' | 'high';
export type Gender = 'male' | 'female' | 'diverse' | 'none';
export type OnboardingMode = 'quick' | 'full';

export type ConsumptionMethod = 'joints' | 'bongs' | 'edibles' | 'vapes' | 'blunts' | 'capsules' | 'oils' | 'pipes' | 'dabs';

export interface ConsumptionDetails {
  // Für Joints/Blunts
  jointsPerWeek?: number;
  gramsPerJoint?: number;
  // Für Bongs/Pipes
  sessionsPerWeek?: number;
  gramsPerSession?: number;
  // Für Edibles
  ediblesPerWeek?: number;
  mgTHCPerPortion?: number;
  // Für Vapes
  vapeSessionsPerWeek?: number;
  estimatedMgTHCPerSession?: number;
  // Für Capsules
  capsulesPerWeek?: number;
  mgTHCPerCapsule?: number;
  // Für Oils/Dabs
  oilSessionsPerWeek?: number;
  estimatedMgTHCPerOilSession?: number;
}

export interface PausePlan {
  startDate: string; // ISO date string
  durationDays: number;
  reason?: string;
  active: boolean;
}

export interface OnboardingProfile {
  // Basis-Informationen
  gender?: Gender;
  dateOfBirth?: string | null; // ISO date string
  goal: Goal;
  
  // Konsum-Häufigkeit
  frequencyPerWeek: number; // 0-7
  
  // Währung & Ausgaben
  currency: string; // 'EUR' | 'USD' | 'GBP' | etc.
  weeklySpend: number; // Betrag in der gewählten Währung
  
  // Konsumformen & Details
  consumptionMethods: ConsumptionMethod[];
  consumptionDetails: Record<ConsumptionMethod, ConsumptionDetails>;
  
  // THC-Potenz
  thcPotencyPercent: number; // 5-40% (oder höher für Wax etc.)
  
  // Impact & Timing
  impactLevel: number; // 0-10 (0 = gar nicht, 10 = sehr stark)
  firstUseTimeMinutes: number; // Minuten ab 0:00 (z.B. 720 = 12:00)
  
  // App-Nutzung
  appPlans: string[]; // Multi-Select
  unplannedUseReasons: string[]; // Multi-Select
  
  // Pause-Plan (nur wenn goal = 'pause')
  pausePlan?: PausePlan;
  cloudSyncConsent?: boolean;
  subscriptionPlan?: 'monthly' | 'yearly' | 'none';
  
  // Legacy-Felder (für Kompatibilität, werden nach und nach entfernt)
  birthYear?: number;
  region?: string;
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
  lastConsumptionISO?: string;
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

export type OnboardingStepId =
  | 'Welcome'
  | 'DateOfBirth'
  | 'Goal'
  | 'Frequency'
  | 'Currency'
  | 'WeeklySpend'
  | 'ConsumptionMethods'
  | 'ConsumptionDetailsJoints'
  | 'ConsumptionDetailsBongs'
  | 'ConsumptionDetailsEdibles'
  | 'ConsumptionDetailsVapes'
  | 'ConsumptionDetailsBlunts'
  | 'ConsumptionDetailsCapsules'
  | 'ConsumptionDetailsOils'
  | 'THCPotency'
  | 'Gender'
  | 'Impact'
  | 'QuitDate'
  | 'FirstUseTime'
  | 'AppPlan'
  | 'UnplannedUseReasons'
  | 'PausePlan'
  | 'Payment'
  | 'CloudConsent'
  | 'FinalSetup'
  // Legacy onboarding screens that still exist in codebase
  | 'WelcomeGoals'
  | 'Account'
  | 'Legal'
  | 'RegionCurrency'
  | 'ConsumptionForms'
  | 'FrequencyQuantity'
  | 'PotencyOptional'
  | 'SpendBudget'
  | 'Summary'
  | 'Motivation'
  | 'Triggers'
  | 'Baseline'
  | 'Connections'
  | 'Reminders'
  | 'BirthYear';

export interface CostEstimateResult {
  value: number;
  confidence: 'low' | 'mid' | 'high';
  source: 'user' | 'estimate';
}

export interface SavingsResult {
  amount: number;
  days: number;
}
