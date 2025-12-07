import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Profile, DayLog } from '../types/profile';
import type { Pause, PauseStatus } from '../types/pause';
import { calculatePauseStats, eligibleXpDaysForPause, parseDateKey, toDateKey } from '../lib/pause';
import { PAUSE_DAILY_XP_BONUS, getTaskLabel } from '../lib/tasks';
import { levelFromXp, labelForXpReason } from '../lib/xp';
import type { XpEvent, XpEventMeta, XpEventReason, XpState } from '../types/xp';

type AppState = {
  profile: Profile | null;
  dayLogs: Record<string, DayLog>;
  hydrated: boolean;
  pauses: Pause[];
  pauseCelebrationId: string | null;
  xp: XpState;
};

type AppActions = {
  setProfile: (partial: Partial<Profile>) => void;
  replaceProfile: (p: Profile) => void;
  setDayLogs: (logs: Record<string, DayLog>) => void;
  upsertDayLog: (log: Partial<DayLog> & { date: string; lastConsumptionAt?: number }) => void;
  markTaskDone: (date: string, taskId: XpEventReason, xp?: number, labelOverride?: string) => void;
  addXp: (date: string, amount: number, reason: XpEventReason, meta?: XpEventMeta) => void;
  startPause: (input: { startDate: string; endDate: string; startTimestamp?: number; endTimestamp?: number }) => { ok: true; pause: Pause } | { ok: false; reason: 'date-order' | 'active-exists'; activePause?: Pause };
  endPause: (status: PauseStatus, endDate?: string) => void;
  syncPauseProgress: (now?: number | Date) => void;
  acknowledgePauseCelebration: (pauseId: string) => void;
  addDailyCheckIn: (date: string, consumedToday: boolean) => void;
  resetAll: () => void;
};

const STORAGE_KEY = 'hazeless/app';
export const CURRENT_VERSION = 3;

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

const XP_EVENT_LIMIT = 40;

const createInitialXpState = (): XpState => {
  const base = levelFromXp(0);
  return {
    totalXp: 0,
    currentLevel: base.level,
    xpForCurrentLevel: base.xpForCurrentLevel,
    xpForNextLevel: base.xpForNextLevel,
    xpEvents: [],
  };
};

const normalizeDateKey = (dateKey?: string) => {
  if (dateKey && /^\d{4}-\d{2}-\d{2}$/.test(dateKey)) {
    return dateKey;
  }
  return toDateKey(new Date());
};

const isoFromDateKey = (dateKey: string) => parseDateKey(dateKey).toISOString();

const applyXpGain = (
  prev: XpState,
  amount: number,
  reason: XpEventReason,
  dateISO: string,
  meta?: XpEventMeta
): XpState => {
  const totalXp = Math.max(0, prev.totalXp + amount);
  const progress = levelFromXp(totalXp);
  const nextEvent: XpEvent = {
    id: `xp_${randomId()}`,
    amount: Math.round(amount),
    dateISO,
    reason,
    meta: meta && Object.keys(meta).length ? meta : undefined,
  };
  const xpEvents = [nextEvent, ...prev.xpEvents].slice(0, XP_EVENT_LIMIT);
  return {
    totalXp,
    currentLevel: progress.level,
    xpForCurrentLevel: progress.xpForCurrentLevel,
    xpForNextLevel: progress.xpForNextLevel,
    xpEvents,
  };
};

const hydrateXpState = (existing?: XpState, logs?: Record<string, DayLog>): XpState => {
  if (existing && typeof existing.totalXp === 'number') {
    const progress = levelFromXp(existing.totalXp);
    return {
      totalXp: existing.totalXp,
      currentLevel: progress.level,
      xpForCurrentLevel: progress.xpForCurrentLevel,
      xpForNextLevel: progress.xpForNextLevel,
      xpEvents: existing.xpEvents ?? [],
    };
  }
  const totalFromLogs = Object.values(logs ?? {}).reduce((sum, log) => sum + (log?.xpEarned ?? 0), 0);
  const progress = levelFromXp(totalFromLogs);
  return {
    totalXp: totalFromLogs,
    currentLevel: progress.level,
    xpForCurrentLevel: progress.xpForCurrentLevel,
    xpForNextLevel: progress.xpForNextLevel,
    xpEvents: [],
  };
};

export const useApp = create<AppState & AppActions>()(
  persist(
    (set, get) => ({
      profile: null,
      dayLogs: {},
      hydrated: false,
      pauses: [],
      pauseCelebrationId: null,
      xp: createInitialXpState(),

      setProfile(partial) {
        const prev = get().profile ?? { startTimestamp: Date.now(), version: CURRENT_VERSION };
        const nextProfile = { ...prev, ...partial };
        set({ profile: nextProfile });
        
        // Sync to Supabase if consent is given (non-blocking)
        // Legal basis: Only sync if user has explicitly consented (consent_server_storage = true)
        import('../lib/sync').then(({ syncAppProfile }) => {
          syncAppProfile(nextProfile).catch((err) => {
            console.error('Error syncing app profile (non-critical):', err);
          });
        });
      },

      replaceProfile(p) {
        const profile = { ...p, version: CURRENT_VERSION };
        set({ profile });
        
        // Sync to Supabase if consent is given (non-blocking)
        import('../lib/sync').then(({ syncAppProfile }) => {
          syncAppProfile(profile).catch((err) => {
            console.error('Error syncing app profile (non-critical):', err);
          });
        });
      },

      setDayLogs(logs) {
        set((s) => ({
          dayLogs: logs,
          xp: hydrateXpState(undefined, logs),
        }));
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
              const cancelledPause = {
                ...activePause,
                endDate: rest.date,
                status: 'abgebrochen' as const,
                completedStatus: 'abgebrochen' as const,
                completedAt: Date.now(),
                endTimestamp: Date.now(),
                stats,
              };
              nextState.pauses = s.pauses.map((pause) =>
                pause.id === activePause.id ? cancelledPause : pause
              );
              
              // Sync cancelled pause to Supabase if consent is given (non-blocking)
              import('../lib/sync').then(({ syncPause }) => {
                syncPause(cancelledPause).catch((err) => {
                  console.error('Error syncing cancelled pause (non-critical):', err);
                });
              });
            }
          }
          
          // Sync to Supabase if consent is given (non-blocking)
          // Legal basis: Only sync if user has explicitly consented (consent_server_storage = true)
          import('../lib/sync').then(({ syncDayLog }) => {
            syncDayLog(nextLog).catch((err) => {
              console.error('Error syncing day log (non-critical):', err);
            });
          });
          
          return nextState;
        });
      },

      markTaskDone(date, taskId, xp = 0, labelOverride) {
        const dateKey = normalizeDateKey(date);
        set((s) => {
          const existing = s.dayLogs[dateKey] ?? { date: dateKey, tasksDone: [], xpEarned: 0 };
          if (existing.tasksDone?.includes(taskId)) return s;
          const tasksDone = [...(existing.tasksDone ?? []), taskId];
          const xpEarned = (existing.xpEarned ?? 0) + Math.max(0, xp);
          const updatedLog = { ...existing, tasksDone, xpEarned };
          const nextState: Partial<AppState> = {
            dayLogs: { ...s.dayLogs, [dateKey]: updatedLog },
          };

          if (xp > 0) {
            const meta: XpEventMeta = {
              taskId,
              label: labelOverride ?? getTaskLabel(taskId),
            };
            nextState.xp = applyXpGain(s.xp, xp, taskId, isoFromDateKey(dateKey), meta);
          }

          // Sync to Supabase if consent is given (non-blocking)
          import('../lib/sync').then(({ syncDayLog }) => {
            syncDayLog(updatedLog).catch((err) => {
              console.error('Error syncing day log after task (non-critical):', err);
            });
          });

          return nextState;
        });
      },

      addXp(date, amount, reason, meta) {
        if (!Number.isFinite(amount) || amount <= 0) return;
        const dateKey = normalizeDateKey(date);
        set((s) => {
          const existing = s.dayLogs[dateKey] ?? { date: dateKey, tasksDone: [], xpEarned: 0 };
          const xpEarned = (existing.xpEarned ?? 0) + amount;
          const updatedLog = { ...existing, xpEarned };
          const nextState: Partial<AppState> = {
            dayLogs: { ...s.dayLogs, [dateKey]: updatedLog },
            xp: applyXpGain(s.xp, amount, reason, isoFromDateKey(dateKey), {
              ...meta,
              label: meta?.label ?? labelForXpReason(reason),
            }),
          };

          // Sync to Supabase if consent is given (non-blocking)
          import('../lib/sync').then(({ syncDayLog }) => {
            syncDayLog(updatedLog).catch((err) => {
              console.error('Error syncing day log after XP (non-critical):', err);
            });
          });

          return nextState;
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
        
        // Sync to Supabase if consent is given (non-blocking)
        // Legal basis: Only sync if user has explicitly consented (consent_server_storage = true)
        import('../lib/sync').then(({ syncPause }) => {
          syncPause(pause).catch((err) => {
            console.error('Error syncing pause (non-critical):', err);
          });
        });
        
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
        const updatedPause = {
          ...activePause,
          endDate: appliedEndDate,
          status,
          completedStatus: status,
          completedAt: completionTs,
          endTimestamp: completionTs,
          stats,
        };
        set({
          pauses: pauses.map((pause) =>
            pause.id === activePause.id ? updatedPause : pause
          ),
        });
        
        // Sync to Supabase if consent is given (non-blocking)
        import('../lib/sync').then(({ syncPause }) => {
          syncPause(updatedPause).catch((err) => {
            console.error('Error syncing pause update (non-critical):', err);
          });
        });
      },

      syncPauseProgress(nowInput) {
        const now = nowInput ? new Date(nowInput) : new Date();
        const pauses = get().pauses;
        if (!pauses.length) return;
        let changed = false;
        let celebrationId: string | null = null;
        const profile = get().profile;
        const addXp = get().addXp;
        const updated = pauses.map((pause) => {
          if (pause.status !== 'aktiv') return pause;
          let working = pause;
          const xpDays = eligibleXpDaysForPause(working, now);
          const missing = xpDays.filter((day) => !working.xpAwardedDays.includes(day));
          if (missing.length) {
            missing.forEach((day) =>
              addXp(day, PAUSE_DAILY_XP_BONUS, 'pause-daily-bonus', {
                pauseId: working.id,
                label: 'Pause-Bonus',
              })
            );
            working = { ...working, xpAwardedDays: [...working.xpAwardedDays, ...missing] };
            changed = true;
          }
          const endTs = working.endTimestamp ?? resolveEndTimestamp(working.endDate, working.startTimestamp);
          if (now.getTime() >= endTs) {
            const stats = profile ? calculatePauseStats(working, profile) : working.stats;
            const completionTs = endTs;
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
          
          // Sync updated pauses to Supabase if consent is given (non-blocking)
          const changedPauses = updated.filter((p, i) => p !== pauses[i]);
          if (changedPauses.length > 0) {
            import('../lib/sync').then(({ syncPause }) => {
              changedPauses.forEach((pause) => {
                syncPause(pause).catch((err) => {
                  console.error('Error syncing pause progress (non-critical):', err);
                });
              });
            });
          }
        }
      },

      acknowledgePauseCelebration(pauseId) {
        set((s) => (s.pauseCelebrationId === pauseId ? { pauseCelebrationId: null } : s));
      },

      addDailyCheckIn(date, consumedToday) {
        const dateKey = normalizeDateKey(date);
        set((s) => {
          const existing = s.dayLogs[dateKey] ?? { date: dateKey, tasksDone: [], xpEarned: 0 };
          const updatedLog: DayLog = {
            ...existing,
            checkin: {
              usedToday: consumedToday,
              amountGrams: consumedToday ? (existing.checkin?.amountGrams ?? 0) : 0,
              cravings0to10: existing.checkin?.cravings0to10 ?? 0,
              mood1to5: existing.checkin?.mood1to5 ?? 3,
              sleepHours: existing.checkin?.sleepHours ?? 0,
              notes: existing.checkin?.notes,
              recordedAt: Date.now(),
            },
          };
          
          // Sync to Supabase if consent is given (non-blocking)
          import('../lib/sync').then(({ syncDayLog }) => {
            syncDayLog(updatedLog).catch((err) => {
              console.error('Error syncing day log after check-in (non-critical):', err);
            });
          });
          
          return {
            dayLogs: {
              ...s.dayLogs,
              [dateKey]: updatedLog,
            },
          };
        });
      },

      resetAll() {
        set({ profile: null, dayLogs: {}, pauses: [], pauseCelebrationId: null, xp: createInitialXpState() });
      },
    }),
    {
      name: STORAGE_KEY,
      storage: createJSONStorage(() => AsyncStorage),
      version: CURRENT_VERSION,
      migrate: (state: any, version) => {
        if (!state) return state;
        if (state.profile && (!state.profile.version || state.profile.version < CURRENT_VERSION)) {
          state.profile.version = CURRENT_VERSION;
        }
        if (!Array.isArray(state.pauses)) {
          state.pauses = [];
        }
        if (typeof state.pauseCelebrationId === 'undefined') {
          state.pauseCelebrationId = null;
        }
        state.xp = hydrateXpState(state.xp, state.dayLogs);
        return state;
      },
      onRehydrateStorage: () => (s) => {
        if (s) s.hydrated = true;
      },
    }
  )
);
