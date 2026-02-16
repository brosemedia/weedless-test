import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Profile, DiaryEntry, Baseline, SavingGoal, GoalMode } from '../types';
import type { Milestone } from '../types/milestone';
import {
  DEFAULT_AVG_SESSION_MINUTES,
  DEFAULT_CURRENCY,
  DEFAULT_GRAMS_PER_JOINT,
  DEFAULT_LOCALE,
  DEFAULT_PRICE_PER_GRAM,
  createInitialProfile,
  mergeProfile,
  normalizeProfile,
  nowISO,
} from './profileUtils';
import { useApp } from './app';
import { toDateKey } from '../lib/pause';
export type Checkin = import('../lib/scales').Checkin;

export type Mission = {
  id: string;
  title: string;
  description: string;
  points: number;
  icon?: string;
  imageUri?: string;
  completedAt?: string;
};

type Store = {
  profile: Profile;
  diary: DiaryEntry[];
  checkins: Checkin[];
  missions: Mission[];
  milestones: Milestone[];
  taskCompletions: Record<string, string[]>;

  addEntry: (e: Omit<DiaryEntry, 'id'>) => void;
  removeEntry: (id: string) => void;
  setBaseline: (b: Partial<Baseline>) => void;
  updateProfile: (patch: Partial<Profile>) => void;
  setGoalMode: (m: GoalMode) => void;
  setSavingGoal: (g?: SavingGoal) => void;
  clearAll: () => void;

  addCheckin: (c: Omit<Checkin, 'dateISO'> & { dateISO?: string }) => void;
  setMissions: (items: Mission[]) => void;
  completeMission: (id: string) => void;
  setMilestones: (items: Milestone[]) => void;
  awardMilestone: (id: string) => void;
  markTaskCompleted: (taskId: string, dateISO?: string) => void;
};

const initialProfile = createInitialProfile();

export const useStore = create<Store>()(
  persist(
    (set, get) => ({
      profile: initialProfile,
      diary: [],
      checkins: [],
      missions: [],
      milestones: [],
      taskCompletions: {},

      addEntry: (e) =>
        set((s) => {
          const next = [
            ...s.diary,
            { id: Math.random().toString(36).slice(2), ...e },
          ].sort((a, b) => +new Date(b.date) - +new Date(a.date));
          return { diary: next };
        }),

      removeEntry: (id) => set((s) => ({ diary: s.diary.filter((d) => d.id !== id) })),

      setBaseline: (b) =>
        set((s) => ({
          profile: mergeProfile(s.profile, {
            baseline: { ...s.profile.baseline, ...b } as Baseline,
          }),
        })),

      updateProfile: (patch) =>
        set((s) => ({
          profile: mergeProfile(s.profile, patch),
        })),

      setGoalMode: (m) =>
        set((s) => ({
          profile: mergeProfile(s.profile, { goalMode: m }),
        })),

      setSavingGoal: (g) =>
        set((s) => ({
          profile: mergeProfile(s.profile, { savingGoal: g }),
        })),

      clearAll: () =>
        set({
          profile: createInitialProfile(),
          diary: [],
          checkins: [],
          missions: [],
          milestones: [],
          taskCompletions: {},
        }),

      addCheckin: (c) =>
        set((s) => ({
          checkins: [...s.checkins, { dateISO: c.dateISO ?? new Date().toISOString(), ...c }].sort(
            (a, b) => +new Date(b.dateISO) - +new Date(a.dateISO)
          ),
        })),

      setMissions: (items) => set({ missions: items }),
      completeMission: (id) =>
        set((s) => {
          const idx = s.missions.findIndex((m) => m.id === id);
          if (idx === -1) return {} as any;
          const m = s.missions[idx];
          if (m.completedAt) return {} as any;
          const updated = [...s.missions];
          updated[idx] = { ...m, completedAt: new Date().toISOString() };
          if (m.points && m.points > 0) {
            const addXp = useApp.getState().addXp;
            addXp(toDateKey(new Date()), m.points, 'mission', { label: m.title });
          }
          return { missions: updated };
        }),

      setMilestones: (items) => set({ milestones: items }),
      awardMilestone: (id) =>
        set((s) => {
          const idx = s.milestones.findIndex((m) => m.id === id);
          if (idx === -1) return {} as any;
          const m = s.milestones[idx];
          if (m.achievedAt) return {} as any;
          const updated = [...s.milestones];
          updated[idx] = { ...m, achievedAt: new Date().toISOString() };
          const reward = m.xpReward ?? 0;
          if (reward > 0) {
            const addXp = useApp.getState().addXp;
            addXp(toDateKey(new Date()), reward, 'milestone', {
              milestoneId: m.id,
              milestoneTitle: m.title,
              label: m.title,
            });
          }
          return { milestones: updated };
        }),
      markTaskCompleted: (taskId, dateISO) =>
        set((s) => {
          const source = dateISO ?? new Date().toISOString();
          const key = source.length >= 10 ? source.slice(0, 10) : source;
          const existing = s.taskCompletions[key] ?? [];
          if (existing.includes(taskId)) return {} as any;
          return {
            taskCompletions: {
              ...s.taskCompletions,
              [key]: [...existing, taskId],
            },
          };
        }),
    }),
    {
      name: 'hazeless-store',
      storage: createJSONStorage(() => AsyncStorage),
      version: 2,
      migrate: (persistedState: any, version) => {
        if (!persistedState) return persistedState;
        if (version >= 2) {
          return persistedState;
        }
        if (persistedState.profile) {
          return {
            ...persistedState,
            profile: normalizeProfile({
              ...persistedState.profile,
              locale: persistedState.profile.locale ?? DEFAULT_LOCALE,
              pauseStartISO: persistedState.profile.pauseStartISO ?? persistedState.profile.startedAt ?? nowISO(),
              pricePerGram:
                persistedState.profile.pricePerGram ??
                (persistedState.profile.baseline?.unit === 'g'
                  ? persistedState.profile.baseline.pricePerUnit
                  : persistedState.profile.baseline.pricePerUnit / DEFAULT_GRAMS_PER_JOINT),
              gramsPerDayBaseline:
                persistedState.profile.gramsPerDayBaseline ??
                (persistedState.profile.baseline?.unit === 'g'
                  ? persistedState.profile.baseline.amountPerDay
                  : persistedState.profile.baseline.amountPerDay * DEFAULT_GRAMS_PER_JOINT),
              jointsPerDayBaseline:
                persistedState.profile.jointsPerDayBaseline ??
                (persistedState.profile.baseline?.unit === 'joint'
                  ? persistedState.profile.baseline.amountPerDay
                  : (persistedState.profile.baseline?.amountPerDay ?? 0) / DEFAULT_GRAMS_PER_JOINT),
              gramsPerJoint: persistedState.profile.gramsPerJoint ?? DEFAULT_GRAMS_PER_JOINT,
              avgSessionMinutes: persistedState.profile.avgSessionMinutes ?? DEFAULT_AVG_SESSION_MINUTES,
            }),
          };
        }
        return persistedState;
      },
      partialize: (state) => ({
        profile: state.profile,
        diary: state.diary,
        checkins: state.checkins,
        missions: state.missions,
        milestones: state.milestones,
        taskCompletions: state.taskCompletions,
      }),
    }
  )
);

export type { Store };
export type { Milestone } from '../types/milestone';
