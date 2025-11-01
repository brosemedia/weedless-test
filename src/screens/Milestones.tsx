import React, { useEffect, useMemo } from 'react';
import { View, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useStore } from '../store/useStore';
import { spacing, radius, colors } from '../design/tokens';
import { Card, ThemedText } from '../design/theme';
import ProgressDial from '../components/ProgressDial';
import { aggregate } from '../lib/stats';

export default function Milestones() {
  const insets = useSafeAreaInsets();
  const milestones = useStore((s) => s.milestones);
  const setMilestones = useStore((s) => s.setMilestones);
  const awardMilestone = useStore((s) => s.awardMilestone);
  const checkins = useStore((s) => s.checkins);
  const profile = useStore((s) => s.profile);
  const diary = useStore((s) => s.diary);
  const points = useStore((s) => s.points);

  // Seed defaults (including a money milestone)
  useEffect(() => {
    if (!milestones || milestones.length === 0) {
      setMilestones([
        { id: 'streak1',  title: '1 Tag am Stueck',  points: 5,  kind: 'streak', threshold: 1 },
        { id: 'streak3',  title: '3 Tage am Stueck', points: 10, kind: 'streak', threshold: 3 },
        { id: 'streak7',  title: '7 Tage am Stueck', points: 20, kind: 'streak', threshold: 7 },
        { id: 'streak14', title: '14 Tage am Stueck', points: 35, kind: 'streak', threshold: 14 },
        { id: 'streak30', title: '30 Tage am Stueck', points: 60, kind: 'streak', threshold: 30 },
        { id: 'count10',  title: '10 Check-ins gesamt', points: 10, kind: 'count', threshold: 10 },
        { id: 'count25',  title: '25 Check-ins gesamt', points: 25, kind: 'count', threshold: 25 },
        { id: 'count50',  title: '50 Check-ins gesamt', points: 50, kind: 'count', threshold: 50 },
        { id: 'money1000', title: '1.000 EUR gespart', points: 120, kind: 'money', threshold: 1000 },
      ]);
    }
  }, []);

  // Derived values
  const currentStreak = useMemo(() => {
    let streak = 0;
    const d = new Date();
    for (let i = 0; i < 365; i++) {
      const iso = new Date(d.getFullYear(), d.getMonth(), d.getDate() - i)
        .toISOString()
        .slice(0, 10);
      if (checkins.some((c) => c.dateISO.slice(0, 10) === iso)) streak++;
      else break;
    }
    return streak;
  }, [checkins]);

  const agg = useMemo(() => aggregate(profile, diary, 'all'), [profile, diary, checkins]);

  // Auto-award reached milestones (idempotent)
  useEffect(() => {
    const total = checkins.length;
    (milestones || []).forEach((m) => {
      if (m.achievedAt) return;
      if (m.kind === 'streak' && currentStreak >= (m.threshold || 0)) awardMilestone(m.id);
      else if (m.kind === 'count' && total >= (m.threshold || 0)) awardMilestone(m.id);
      else if (m.kind === 'money' && agg.moneySaved >= (m.threshold || 0)) awardMilestone(m.id);
    });
  }, [checkins, milestones, currentStreak, agg]);

  const progressFor = (m: any) => {
    const totalNow = m.kind === 'streak' ? currentStreak : m.kind === 'count' ? checkins.length : agg.moneySaved;
    const th = m.threshold || 1;
    return Math.max(0, Math.min(1, totalNow / th));
  };
  const remainingFor = (m: any) => {
    const totalNow = m.kind === 'streak' ? currentStreak : m.kind === 'count' ? checkins.length : agg.moneySaved;
    return Math.max(0, (m.threshold || 0) - totalNow);
  };

  return (
    <ScrollView
      contentContainerStyle={{
        paddingHorizontal: spacing.xl as any,
        paddingTop: (insets.top + (spacing.l as any)) as any,
        paddingBottom: Math.max(spacing.l as any, insets.bottom),
        gap: spacing.m as any,
      }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <ThemedText kind="h2">Meilensteine</ThemedText>
        <Card style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 6, paddingHorizontal: 10 }}>
          <ThemedText kind="h2" style={{ color: '#D4AF37', marginRight: 6 }}>*</ThemedText>
          <ThemedText kind="h2" style={{ color: '#D4AF37' }}>{points}</ThemedText>
        </Card>
      </View>

      {(milestones || []).map((m) => (
        <Card key={m.id}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              <ThemedText kind="h2">*</ThemedText>
              <View>
                <ThemedText kind="h2">{m.title}</ThemedText>
                <ThemedText muted>
                  {m.kind === 'streak'
                    ? `Ziel: ${m.threshold} Tage`
                    : m.kind === 'count'
                    ? `Ziel: ${m.threshold} Check-ins`
                    : `Ziel: ${m.threshold} EUR`}
                </ThemedText>
              </View>
            </View>
            {m.achievedAt ? (
              <View style={{ backgroundColor: '#D4AF37', paddingHorizontal: 10, paddingVertical: 6, borderRadius: radius.pill }}>
                <ThemedText kind="label" style={{ color: '#1F2937' }}>+{m.points}</ThemedText>
              </View>
            ) : (
              <ProgressDial
                value={progressFor(m)}
                label={`noch ${Math.max(0, Math.round(remainingFor(m)))}`}
                size={64}
                stroke={8}
                color={colors.light.primary}
                track={colors.light.border}
              />
            )}
          </View>
        </Card>
      ))}
    </ScrollView>
  );
}
