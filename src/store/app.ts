import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Profile, DayLog } from '../types/profile';

type AppState = {
  profile: Profile | null;
  dayLogs: Record<string, DayLog>;
  hydrated: boolean;
};

type AppActions = {
  setProfile: (partial: Partial<Profile>) => void;
  replaceProfile: (p: Profile) => void;
  upsertDayLog: (log: Partial<DayLog> & { date: string; lastConsumptionAt?: number }) => void;
  markTaskDone: (date: string, taskId: string, xp?: number) => void;
  resetAll: () => void;
};

const STORAGE_KEY = 'weedless/app';
export const CURRENT_VERSION = 1;

export const useApp = create<AppState & AppActions>()(
  persist(
    (set, get) => ({
      profile: null,
      dayLogs: {},
      hydrated: false,

      setProfile(partial) {
        const prev = get().profile ?? { startTimestamp: Date.now(), version: CURRENT_VERSION };
        set({ profile: { ...prev, ...partial } });
      },

      replaceProfile(p) {
        set({ profile: { ...p, version: CURRENT_VERSION } });
      },

      upsertDayLog(log) {
        set((s) => {
          const { lastConsumptionAt, ...rest } = log;
          const prev = s.dayLogs[rest.date] ?? { date: rest.date, tasksDone: [], xpEarned: 0 };
          const mergedTests =
            rest.tests || prev.tests ? { ...(prev.tests ?? {}), ...(rest.tests ?? {}) } : undefined;
          const nextLog = { ...prev, ...rest, tests: mergedTests };
          const hasConsumption =
            (nextLog.consumedGrams ?? 0) > 0 || (nextLog.consumedJoints ?? 0) > 0;
          const nextState: Partial<AppState> = {
            dayLogs: {
              ...s.dayLogs,
              [rest.date]: nextLog,
            },
          };
          if (hasConsumption) {
            const base = s.profile ?? { startTimestamp: Date.now(), version: CURRENT_VERSION };
            const timestamp = Math.max(base.lastConsumptionAt ?? 0, lastConsumptionAt ?? Date.now());
            nextState.profile = { ...base, lastConsumptionAt: timestamp };
          }
          return nextState;
        });
      },

      markTaskDone(date, taskId, xp = 0) {
        set((s) => {
          const d = s.dayLogs[date] ?? { date, tasksDone: [], xpEarned: 0 };
          if (d.tasksDone?.includes(taskId)) return s;
          const tasksDone = [...(d.tasksDone ?? []), taskId];
          const xpEarned = (d.xpEarned ?? 0) + xp;
          return { dayLogs: { ...s.dayLogs, [date]: { ...d, tasksDone, xpEarned } } };
        });
      },

      resetAll() {
        set({ profile: null, dayLogs: {} });
      },
    }),
    {
      name: STORAGE_KEY,
      storage: createJSONStorage(() => AsyncStorage),
      version: CURRENT_VERSION,
      migrate: (state: any) => {
        if (!state) return state;
        if (state.profile && !state.profile.version) {
          state.profile.version = CURRENT_VERSION;
        }
        return state;
      },
      onRehydrateStorage: () => (s) => {
        if (s) s.hydrated = true;
      },
    }
  )
);
