import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Profile, DiaryEntry, Baseline, SavingGoal, GoalMode } from '../types';
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

export type Milestone = {
  id: string;
  title: string;
  description?: string;
  points: number;
  icon?: string;
  achievedAt?: string;
  kind: 'streak' | 'count' | 'money';
  threshold: number; // e.g., streak days or total check-ins
};

type Store = {
  profile: Profile;
  diary: DiaryEntry[];
  checkins: Checkin[];
  missions: Mission[];
  milestones: Milestone[];
  points: number;

  addEntry: (e: Omit<DiaryEntry, 'id'>) => void;
  removeEntry: (id: string) => void;
  setBaseline: (b: Partial<Baseline>) => void;
  setGoalMode: (m: GoalMode) => void;
  setSavingGoal: (g?: SavingGoal) => void;
  clearAll: () => void;

  addCheckin: (c: Omit<Checkin, 'dateISO'> & { dateISO?: string }) => void;
  setMissions: (items: Mission[]) => void;
  completeMission: (id: string) => void;
  setMilestones: (items: Milestone[]) => void;
  awardMilestone: (id: string) => void;
};

const initialProfile: Profile = {
  startedAt: new Date().toISOString(),
  goalMode: 'quit',
  baseline: { unit: 'g', amountPerDay: 0.6, pricePerUnit: 10 },
  savingGoal: undefined,
  currency: 'EUR',
};

export const useStore = create<Store>()(
  persist(
    (set, get) => ({
      profile: initialProfile,
      diary: [],
      checkins: [],
      missions: [],
      milestones: [],
      points: 0,

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
          profile: { ...s.profile, baseline: { ...s.profile.baseline, ...b } as Baseline },
        })),

      setGoalMode: (m) => set((s) => ({ profile: { ...s.profile, goalMode: m } })),

      setSavingGoal: (g) => set((s) => ({ profile: { ...s.profile, savingGoal: g } })),

      clearAll: () => set({ profile: initialProfile, diary: [] }),

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
          return { missions: updated, points: s.points + (m.points || 0) };
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
          return { milestones: updated, points: s.points + (m.points || 0) };
        }),
    }),
    {
      name: 'weedless-store',
      storage: createJSONStorage(() => AsyncStorage),
      version: 1,
      partialize: (state) => ({
        profile: state.profile,
        diary: state.diary,
        checkins: state.checkins,
        missions: state.missions,
        milestones: state.milestones,
        points: state.points,
      }),
    }
  )
);

export type { Store };

