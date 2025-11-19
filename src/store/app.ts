import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Profile, DayLog } from '../types/profile';
import type { Pause, PauseStatus } from '../types/pause';
import { calculatePauseStats, eligibleXpDaysForPause, parseDateKey, toDateKey } from '../lib/pause';
import { PAUSE_DAILY_XP_BONUS } from '../lib/tasks';

type AppState = {
  profile: Profile | null;
  dayLogs: Record<string, DayLog>;
  hydrated: boolean;
  pauses: Pause[];
  pauseCelebrationId: string | null;
};

type AppActions = {
  setProfile: (partial: Partial<Profile>) => void;
  replaceProfile: (p: Profile) => void;
  upsertDayLog: (log: Partial<DayLog> & { date: string; lastConsumptionAt?: number }) => void;
  markTaskDone: (date: string, taskId: string, xp?: number) => void;
  addXpToDay: (date: string, amount: number) => void;
  startPause: (input: { startDate: string; endDate: string; startTimestamp?: number; endTimestamp?: number }) => { ok: true; pause: Pause } | { ok: false; reason: 'date-order' | 'active-exists'; activePause?: Pause };
  endPause: (status: PauseStatus, endDate?: string) => void;
  syncPauseProgress: (now?: number | Date) => void;
  acknowledgePauseCelebration: (pauseId: string) => void;
  resetAll: () => void;
};

const STORAGE_KEY = 'weedless/app';
export const CURRENT_VERSION = 2;

const randomId = () => Math.random().toString(36).slice(2, 10);
const ISO_DATETIME_REGEX = /\dT\d/;
const resolveEndTimestamp = (value?: string, fallbackStart?: number) => {
  if (value && ISO_DATETIME_REGEX.test(value)) {
    const parsed = Date.parse(value);
    if (Number.isFinite(parsed)) {
      return parsed;
    }
  }
  if (value) {
    const end = parseDateKey(value);
    const normalized = new Date(end);
    normalized.setHours(23, 59, 59, 999);
    return normalized.getTime();
  }
  return fallbackStart ?? Date.now();
};

export const useApp = create<AppState & AppActions>()(
  persist(
    (set, get) => ({
      profile: null,
      dayLogs: {},
      hydrated: false,
      pauses: [],
      pauseCelebrationId: null,

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
            const activePause = s.pauses.find((pause) => pause.status === 'aktiv');
            if (activePause) {
              const profile = nextState.profile ?? base;
              const stats = profile ? calculatePauseStats(activePause, profile, rest.date) : activePause.stats;
            nextState.pauses = s.pauses.map((pause) =>
              pause.id === activePause.id
                ? {
                    ...pause,
                    endDate: rest.date,
                    status: 'abgebrochen',
                    completedStatus: 'abgebrochen',
                    completedAt: Date.now(),
                    endTimestamp: Date.now(),
                    stats,
                  }
                : pause
            );
            }
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

      addXpToDay(date, amount) {
        if (!Number.isFinite(amount) || amount <= 0) return;
        set((s) => {
          const existing = s.dayLogs[date] ?? { date, tasksDone: [], xpEarned: 0 };
          const xpEarned = (existing.xpEarned ?? 0) + amount;
          return { dayLogs: { ...s.dayLogs, [date]: { ...existing, xpEarned } } };
        });
      },

      startPause({ startDate, endDate, startTimestamp, endTimestamp }) {
        if (!startDate || !endDate || parseDateKey(startDate) > parseDateKey(endDate)) {
          return { ok: false, reason: 'date-order' } as const;
        }
        const activePause = get().pauses.find((pause) => pause.status === 'aktiv');
        if (activePause) {
          return { ok: false, reason: 'active-exists', activePause } as const;
        }
        const createdAt = Date.now();
        const startTs = Number.isFinite(startTimestamp) ? Number(startTimestamp) : createdAt;
        const resolvedEnd = Number.isFinite(endTimestamp)
          ? Number(endTimestamp)
          : resolveEndTimestamp(endDate, startTs);
        const endTs = resolvedEnd > startTs ? resolvedEnd : startTs + 60_000;
        const pause: Pause = {
          id: `pause_${randomId()}`,
          startDate,
          endDate,
          status: 'aktiv',
          createdAt,
          startTimestamp: startTs,
          endTimestamp: endTs,
          xpAwardedDays: [],
        };
        set((s) => ({ pauses: [...s.pauses, pause] }));
        return { ok: true, pause } as const;
      },

      endPause(status, endDate) {
        const pauses = get().pauses;
        const activePause = pauses.find((pause) => pause.status === 'aktiv');
        if (!activePause) return;
        const profile = get().profile;
        const appliedEndDate = endDate ?? toDateKey(new Date());
        const stats = profile ? calculatePauseStats(activePause, profile, appliedEndDate) : activePause.stats;
        const completionTs = Date.now();
        set({
          pauses: pauses.map((pause) =>
            pause.id === activePause.id
              ? {
                  ...pause,
                  endDate: appliedEndDate,
                  status,
                  completedStatus: status,
                  completedAt: completionTs,
                  endTimestamp: completionTs,
                  stats,
                }
              : pause
          ),
        });
      },

      syncPauseProgress(nowInput) {
        const now = nowInput ? new Date(nowInput) : new Date();
        const pauses = get().pauses;
        if (!pauses.length) return;
        let changed = false;
        let celebrationId: string | null = null;
        const profile = get().profile;
        const addXp = get().addXpToDay;
        const updated = pauses.map((pause) => {
          if (pause.status !== 'aktiv') return pause;
          let working = pause;
          const xpDays = eligibleXpDaysForPause(working, now);
          const missing = xpDays.filter((day) => !working.xpAwardedDays.includes(day));
          if (missing.length) {
            missing.forEach((day) => addXp(day, PAUSE_DAILY_XP_BONUS));
            working = { ...working, xpAwardedDays: [...working.xpAwardedDays, ...missing] };
            changed = true;
          }
          const todayKey = toDateKey(now);
          if (todayKey > working.endDate) {
            const stats = profile ? calculatePauseStats(working, profile) : working.stats;
            const completionTs = working.endTimestamp ?? resolveEndTimestamp(working.endDate, now.getTime());
            working = {
              ...working,
              status: 'abgeschlossen',
              completedStatus: 'abgeschlossen',
              completedAt: completionTs,
              endTimestamp: completionTs,
              stats,
            };
            celebrationId = working.id;
            changed = true;
          }
          return working;
        });
        if (changed) {
          set((s) => ({
            pauses: updated,
            pauseCelebrationId: celebrationId ?? s.pauseCelebrationId,
          }));
        }
      },

      acknowledgePauseCelebration(pauseId) {
        set((s) => (s.pauseCelebrationId === pauseId ? { pauseCelebrationId: null } : s));
      },

      resetAll() {
        set({ profile: null, dayLogs: {}, pauses: [], pauseCelebrationId: null });
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
        if (!Array.isArray(state.pauses)) {
          state.pauses = [];
        }
        if (typeof state.pauseCelebrationId === 'undefined') {
          state.pauseCelebrationId = null;
        }
        return state;
      },
      onRehydrateStorage: () => (s) => {
        if (s) s.hydrated = true;
      },
    }
  )
);
