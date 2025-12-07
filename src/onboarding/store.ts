import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Goal, OnboardingProfile, ConsumptionMethod } from './types';
import { DEFAULT_GRAMS_PER_JOINT, DEFAULT_REMINDER_TIME, ensureGoal } from './utils/validators';
import { getStepIdsForGoal } from './stepOrder';

const createDefaultProfile = (): OnboardingProfile => ({
  // Neue Felder
  gender: undefined,
  dateOfBirth: null,
  goal: 'track',
  frequencyPerWeek: 0,
  currency: 'EUR',
  weeklySpend: 0,
  consumptionMethods: [],
  consumptionDetails: {} as Record<ConsumptionMethod, any>,
  thcPotencyPercent: 15, // Default 15%
  impactLevel: 5, // Default mittel
  firstUseTimeMinutes: 720, // Default 12:00
  appPlans: [],
  unplannedUseReasons: [],
  pausePlan: undefined,
  cloudSyncConsent: false,
  subscriptionPlan: 'none',
  
  // Legacy-Felder (für Kompatibilität)
  birthYear: undefined,
  region: '',
  consumption: {
    forms: [],
    frequency: {
      unit: 'week',
      gramsPerJoint: DEFAULT_GRAMS_PER_JOINT,
      potencyTHC: null,
    },
  },
  spend: { unit: 'week', amount: null, goalNote: null },
  quitDateISO: undefined,
  pauseLengthDays: null,
  reductionTargetPct: null,
  triggers: [],
  motivations: [],
  baseline: {},
  connections: { healthKit: false, screenTime: false, calendar: false },
  reminders: { checkInTimeLocal: DEFAULT_REMINDER_TIME, nudgeLevel: 'medium', relapseSupport: false },
  account: { method: 'anonymous' },
  legal: { ageConfirmed: false, disclaimerAccepted: false, regionNote: undefined },
});

type OnboardingState = {
  profile: OnboardingProfile;
  currentStepIndex: number;
  hasCompletedOnboarding: boolean;
  forceOnboarding: boolean;
  hydrated: boolean;
  update: <K extends keyof OnboardingProfile>(key: K, value: OnboardingProfile[K]) => void;
  mergeProfile: (patch: Partial<OnboardingProfile>) => void;
  setCurrentStepIndex: (index: number) => void;
  reset: () => void;
  markCompleted: () => void;
  requestOnboarding: () => void;
  clearForceOnboarding: () => void;
};

export const useOnboardingStore = create<OnboardingState>()(
  persist(
    (set, get) => ({
      profile: createDefaultProfile(),
      currentStepIndex: 0,
      hasCompletedOnboarding: false,
       forceOnboarding: false,
      hydrated: false,
      update: (key, value) =>
        set((state) => ({
          profile: {
            ...state.profile,
            [key]: value,
          },
        })),
      mergeProfile: (patch) =>
        set((state) => ({
          profile: {
            ...state.profile,
            ...patch,
          },
        })),
      setCurrentStepIndex: (index) =>
        set((state) => {
          const goal = state.profile.goal;
          const steps = getStepIdsForGoal(goal);
          const next = Math.min(Math.max(index, 0), steps.length - 1);
          if (state.currentStepIndex === next) {
            return {};
          }
          return { currentStepIndex: next };
        }),
      reset: () =>
        set(() => ({
          profile: createDefaultProfile(),
          currentStepIndex: 0,
          hasCompletedOnboarding: false,
          forceOnboarding: false,
        })),
      markCompleted: () =>
        set(() => ({
          hasCompletedOnboarding: true,
          forceOnboarding: false,
        })),
      requestOnboarding: () =>
        set(() => ({
          hasCompletedOnboarding: false,
          forceOnboarding: true,
        })),
      clearForceOnboarding: () =>
        set(() => ({
          forceOnboarding: false,
        })),
    }),
    {
      name: 'hazeless-onboarding',
      storage: createJSONStorage(() => AsyncStorage),
      onRehydrateStorage: () => {
        return (_state, error) => {
          if (error) {
            console.warn('Failed to rehydrate onboarding store', error);
          }
        };
      },
      partialize: (state) => ({
        profile: state.profile,
        currentStepIndex: state.currentStepIndex,
        hasCompletedOnboarding: state.hasCompletedOnboarding,
        forceOnboarding: state.forceOnboarding,
      }),
    }
  )
);

export { getStepIdsForGoal } from './stepOrder';

useOnboardingStore.persist.onFinishHydration((state) => {
  useOnboardingStore.setState((current) => ({
    hydrated: true,
    forceOnboarding: state?.forceOnboarding ?? current.forceOnboarding ?? false,
    profile: {
      ...current.profile,
      goal: ensureGoal((state?.profile?.goal ?? current.profile.goal) as Goal),
      currency: state?.profile?.currency ?? current.profile.currency ?? 'EUR',
      // Migriere alte Felder zu neuen
      frequencyPerWeek: current.profile.frequencyPerWeek ?? 0,
      weeklySpend: current.profile.weeklySpend ?? 0,
      thcPotencyPercent: current.profile.thcPotencyPercent ?? 15,
      impactLevel: current.profile.impactLevel ?? 5,
      firstUseTimeMinutes: current.profile.firstUseTimeMinutes ?? 720,
      consumptionMethods: current.profile.consumptionMethods ?? [],
      consumptionDetails: current.profile.consumptionDetails ?? ({} as Record<ConsumptionMethod, any>),
      appPlans: current.profile.appPlans ?? [],
      unplannedUseReasons: current.profile.unplannedUseReasons ?? [],
      cloudSyncConsent: state?.profile?.cloudSyncConsent ?? current.profile.cloudSyncConsent ?? false,
      subscriptionPlan: state?.profile?.subscriptionPlan ?? current.profile.subscriptionPlan ?? 'none',
    },
  }));
});
