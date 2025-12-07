import type { OnboardingStepId, Goal, ConsumptionMethod } from './types';

// Basis-Schritte (immer)
const BASE_STEPS: OnboardingStepId[] = [
  'Welcome',
  'DateOfBirth',
  'Goal',
  'Frequency',
  'Currency',
  'WeeklySpend',
  'ConsumptionMethods',
];

// Konsum-Details (dynamisch basierend auf Auswahl)
const CONSUMPTION_DETAIL_STEPS: Record<ConsumptionMethod, OnboardingStepId> = {
  joints: 'ConsumptionDetailsJoints',
  bongs: 'ConsumptionDetailsBongs',
  edibles: 'ConsumptionDetailsEdibles',
  vapes: 'ConsumptionDetailsVapes',
  blunts: 'ConsumptionDetailsBlunts',
  capsules: 'ConsumptionDetailsCapsules',
  oils: 'ConsumptionDetailsOils',
  pipes: 'ConsumptionDetailsBongs', // Pipes nutzen Bongs-Screen
  dabs: 'ConsumptionDetailsOils', // Dabs nutzen Oils-Screen
};

// Schritte nach Konsum-Details
const POST_CONSUMPTION_STEPS: OnboardingStepId[] = [
  'THCPotency',
  'Gender',
  'Impact',
  'QuitDate',
  'FirstUseTime',
  'AppPlan',
  'UnplannedUseReasons',
];

// Pause-Plan (nur wenn goal = 'pause')
const PAUSE_PLAN_STEP: OnboardingStepId = 'PausePlan';

// Abschluss-Schritte
const PRE_FINAL_STEPS: OnboardingStepId[] = ['Payment', 'CloudConsent'];

// Finaler Schritt
const FINAL_STEP: OnboardingStepId = 'FinalSetup';

/**
 * Gibt die Schritt-Reihenfolge für ein bestimmtes Ziel zurück.
 * Die Reihenfolge ist dynamisch basierend auf:
 * - Dem gewählten Ziel (goal)
 * - Den ausgewählten Konsumformen (consumptionMethods)
 */
export const getStepIdsForGoal = (
  goal: Goal,
  consumptionMethods: ConsumptionMethod[] = []
): OnboardingStepId[] => {
  const steps: OnboardingStepId[] = [...BASE_STEPS];
  
  // Konsum-Details für jede ausgewählte Methode hinzufügen
  const uniqueDetailSteps = new Set<OnboardingStepId>();
  consumptionMethods.forEach((method) => {
    const detailStep = CONSUMPTION_DETAIL_STEPS[method];
    if (detailStep) {
      uniqueDetailSteps.add(detailStep);
    }
  });
  steps.push(...Array.from(uniqueDetailSteps));
  
  // Post-Consumption Schritte
  steps.push(...POST_CONSUMPTION_STEPS);
  
  // Pause-Plan nur wenn goal = 'pause'
  if (goal === 'pause') {
    steps.push(PAUSE_PLAN_STEP);
  }

  // Abschluss-Schritte vor FinalSetup
  steps.push(...PRE_FINAL_STEPS);
  
  // Finaler Schritt
  steps.push(FINAL_STEP);
  
  return steps;
};

// Legacy-Export für Kompatibilität (wird später entfernt)
export const ONBOARDING_STEP_IDS: OnboardingStepId[] = getStepIdsForGoal('track', []);
export const QUICK_MODE_STEP_IDS: OnboardingStepId[] = getStepIdsForGoal('track', []);
