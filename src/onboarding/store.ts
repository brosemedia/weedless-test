import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Goal, OnboardingMode, OnboardingProfile, Unit } from './types';
import { DEFAULT_GRAMS_PER_JOINT, DEFAULT_REMINDER_TIME, ensureGoal, ensureUnit } from './utils/validators';
import { getStepIdsForMode } from './stepOrder';

const createDefaultProfile = (): OnboardingProfile => ({
  goal: 'track',
  region: '',
  currency: 'EUR',
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
  mode: OnboardingMode;
  currentStepIndex: number;
  hasCompletedOnboarding: boolean;
  hydrated: boolean;
  update: <K extends keyof OnboardingProfile>(key: K, value: OnboardingProfile[K]) => void;
  mergeProfile: (patch: Partial<OnboardingProfile>) => void;
  setMode: (mode: OnboardingMode) => void;
  setCurrentStepIndex: (index: number) => void;
  reset: () => void;
  markCompleted: () => void;
};

export const useOnboardingStore = create<OnboardingState>()(
  persist(
    (set, get) => ({
      profile: createDefaultProfile(),
      mode: 'full',
      currentStepIndex: 0,
      hasCompletedOnboarding: false,
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
      setMode: (mode) =>
        set(() => ({
          mode,
          currentStepIndex: 0,
        })),
      setCurrentStepIndex: (index) =>
        set((state) => {
          const steps = getStepIdsForMode(state.mode);
          const next = Math.min(Math.max(index, 0), steps.length - 1);
          if (state.currentStepIndex === next) {
            return {};
          }
          return { currentStepIndex: next };
        }),
      reset: () =>
        set(() => ({
          profile: createDefaultProfile(),
          mode: 'full',
          currentStepIndex: 0,
          hasCompletedOnboarding: false,
        })),
      markCompleted: () =>
        set(() => ({
          hasCompletedOnboarding: true,
        })),
    }),
    {
      name: 'weedless-onboarding',
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
        mode: state.mode,
        currentStepIndex: state.currentStepIndex,
        hasCompletedOnboarding: state.hasCompletedOnboarding,
      }),
    }
  )
);

export { getStepIdsForMode } from './stepOrder';
export { ONBOARDING_STEP_IDS, QUICK_MODE_STEP_IDS } from './stepOrder';

useOnboardingStore.persist.onFinishHydration((state) => {
  useOnboardingStore.setState((current) => ({
    hydrated: true,
    profile: {
      ...current.profile,
      goal: ensureGoal((state?.profile?.goal ?? current.profile.goal) as Goal),
      region: state?.profile?.region ?? current.profile.region,
      currency: state?.profile?.currency ?? current.profile.currency,
      consumption: {
        ...(state?.profile?.consumption ?? current.profile.consumption),
        frequency: {
          ...(state?.profile?.consumption.frequency ?? current.profile.consumption.frequency),
          unit: ensureUnit(
            (state?.profile?.consumption.frequency.unit ?? current.profile.consumption.frequency.unit) as Unit
          ),
          gramsPerJoint:
            state?.profile?.consumption.frequency.gramsPerJoint ??
            current.profile.consumption.frequency.gramsPerJoint ??
            DEFAULT_GRAMS_PER_JOINT,
        },
      },
    },
  }));
});
