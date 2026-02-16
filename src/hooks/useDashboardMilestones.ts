import { useEffect, useMemo } from 'react';
import { useStore } from '../store/useStore';
import { aggregate } from '../lib/stats';
import type { Milestone } from '../types/milestone';
import { mergeMilestonesWithDefaults, milestonesDiffer } from '../data/milestones';

/**
 * Hook to get milestones data for the dashboard.
 * Returns recent achievements and upcoming milestones.
 */
export function useDashboardMilestones() {
  const milestones = useStore((s) => s.milestones);
  const setMilestones = useStore((s) => s.setMilestones);
  const checkins = useStore((s) => s.checkins);
  const profile = useStore((s) => s.profile);
  const diary = useStore((s) => s.diary);

  useEffect(() => {
    // Stelle sicher, dass Standard-Meilensteine auch ohne vorherigen Besuch des Meilenstein-Screens geladen werden.
    const merged = mergeMilestonesWithDefaults(milestones);
    if (milestonesDiffer(milestones, merged)) {
      setMilestones(merged);
    }
  }, [milestones, setMilestones]);
  const currentStreak = useMemo(() => {
    let streak = 0;
    const d = new Date();
    for (let i = 0; i < 365; i++) {
      const iso = new Date(d.getFullYear(), d.getMonth(), d.getDate() - i).toISOString().slice(0, 10);
      if (checkins.some((c) => c.dateISO.slice(0, 10) === iso)) streak++;
      else break;
    }
    return streak;
  }, [checkins]);

  const total = useMemo(() => aggregate(profile, diary, 'all'), [profile, diary]);

  const milestoneProgress = (m: Milestone) => {
    if (m.kind === 'streak') return currentStreak;
    if (m.kind === 'count') return checkins.length;
    if (m.kind === 'money') return total.moneySaved;
    return m.achievedAt ? m.threshold || 1 : 0;
  };

  const remainingFor = (m: Milestone) => Math.max(0, (m.threshold ?? 0) - milestoneProgress(m));

  const recent = useMemo(
    () =>
      (milestones || [])
        .filter((m) => !!m.achievedAt)
        .sort((a, b) => +new Date(b.achievedAt!) - +new Date(a.achievedAt!)),
    [milestones]
  );

  const upcoming = useMemo(
    () =>
      (milestones || [])
        .filter((m) => !m.achievedAt)
        .sort((a, b) => remainingFor(a) - remainingFor(b)),
    [milestones, checkins, currentStreak, total]
  );

  const MAX_VISIBLE = 5;
  const list = useMemo(() => {
    const hasRecent = recent.length > 0;
    const upcomingLimit = hasRecent ? Math.max(0, MAX_VISIBLE - 1) : MAX_VISIBLE;
    const result: Milestone[] = [];
    result.push(...upcoming.slice(0, upcomingLimit));
    let upcomingIndex = upcomingLimit;

    if (hasRecent) {
      result.push(recent[0]);
    }

    while (result.length < MAX_VISIBLE && upcomingIndex < upcoming.length) {
      result.push(upcoming[upcomingIndex]);
      upcomingIndex += 1;
    }

    let recentIndex = hasRecent ? 1 : 0;
    while (result.length < MAX_VISIBLE && recentIndex < recent.length) {
      result.push(recent[recentIndex]);
      recentIndex += 1;
    }

    return result.slice(0, MAX_VISIBLE);
  }, [recent, upcoming]);

  return {
    list,
    recent,
    upcoming,
    milestoneProgress,
    remainingFor,
  };
}

