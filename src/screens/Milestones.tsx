import React, { useEffect, useMemo } from 'react';
import { View, ScrollView, Image } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useStore } from '../store/useStore';
import { spacing, radius, colors } from '../design/tokens';
import { HEADER_TOTAL_HEIGHT } from '../components/AppHeader';
import { Card, ThemedText } from '../design/theme';
import { FrostedSurface } from '../design/FrostedSurface';
import ProgressDial from '../components/ProgressDial';
import { aggregate } from '../lib/stats';
import { mergeMilestonesWithDefaults, milestonesDiffer, resolveMilestoneIcon } from '../data/milestones';
import type { Milestone as MilestoneType } from '../types/milestone';
import { useHeaderTransparency } from '../hooks/useHeaderTransparency';

const formatDays = (value: number) => `${value} ${value === 1 ? 'Tag' : 'Tage'}`;

export default function Milestones() {
  const insets = useSafeAreaInsets();
  const milestones = useStore((s) => s.milestones);
  const setMilestones = useStore((s) => s.setMilestones);
  const awardMilestone = useStore((s) => s.awardMilestone);
  const checkins = useStore((s) => s.checkins);
  const profile = useStore((s) => s.profile);
  const diary = useStore((s) => s.diary);
  const points = useStore((s) => s.points);
  const { handleScroll } = useHeaderTransparency();

  // Seed defaults (and merge with persisted data)
  useEffect(() => {
    const merged = mergeMilestonesWithDefaults(milestones);
    if (milestonesDiffer(milestones, merged)) {
      setMilestones(merged);
    }
  }, [milestones, setMilestones]);

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

  const progressFor = (m: MilestoneType) => {
    const totalNow = m.kind === 'streak' ? currentStreak : m.kind === 'count' ? checkins.length : agg.moneySaved;
    const th = m.threshold || 1;
    return Math.max(0, Math.min(1, totalNow / th));
  };
  const remainingFor = (m: MilestoneType) => {
    const totalNow = m.kind === 'streak' ? currentStreak : m.kind === 'count' ? checkins.length : agg.moneySaved;
    return Math.max(0, (m.threshold || 0) - totalNow);
  };
  const remainingLabel = (m: MilestoneType) => {
    const remaining = Math.max(0, remainingFor(m));
    if (remaining <= 0) return 'geschafft!';
    if (m.kind === 'money') {
      return `noch ${Math.round(remaining).toLocaleString('de-DE')} €`;
    }
    const value = Math.ceil(remaining);
    if (m.kind === 'count') return `noch ${value} Tracken`;
    return `noch ${formatDays(value)}`;
  };

  return (
    <ScrollView
      contentContainerStyle={{
        paddingHorizontal: spacing.xl as any,
        paddingTop: insets.top + HEADER_TOTAL_HEIGHT + (spacing.l as any),
        paddingBottom: Math.max(spacing.l as any, insets.bottom),
        gap: spacing.m as any,
      }}
      onScroll={handleScroll}
      scrollEventThrottle={16}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <ThemedText kind="h2">Meilensteine</ThemedText>
        <Card
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            paddingVertical: 6,
            paddingHorizontal: 14,
            backgroundColor: colors.light.surface,
            borderColor: colors.light.primary,
            borderWidth: 2,
          }}
        >
          <ThemedText kind="h2" style={{ color: colors.light.primary }}>🏆 {points}</ThemedText>
        </Card>
      </View>

      <View style={{ gap: spacing.m as any }}>
        {(milestones || []).map((m) => {
          const completed = Boolean(m.achievedAt);
          const subtitle =
            m.kind === 'streak'
              ? `Ziel: ${formatDays(m.threshold || 0)}`
              : m.kind === 'count'
              ? `Ziel: ${m.threshold} Tracken`
              : `Ziel: ${(m.threshold || 0).toLocaleString('de-DE')} €`;
          const statusNode = completed ? (
            <View style={{ alignItems: 'center', marginTop: spacing.m as any }}>
              <View style={{ backgroundColor: 'rgba(255,255,255,0.25)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: radius.pill, marginBottom: 8 }}>
                <ThemedText kind="label" style={{ color: colors.light.surface, letterSpacing: 0.6 }}>ERREICHT</ThemedText>
              </View>
              <View style={{ backgroundColor: '#D4AF37', paddingHorizontal: 14, paddingVertical: 8, borderRadius: radius.pill }}>
                <ThemedText kind="label" style={{ color: '#4A2A16' }}>🏆 {m.points}</ThemedText>
              </View>
            </View>
          ) : (
            <View style={{ alignItems: 'center', marginTop: spacing.m as any }}>
              <ProgressDial
                value={progressFor(m)}
                label={remainingLabel(m)}
                size={64}
                stroke={7}
                color={colors.light.primary}
                track={colors.light.border}
              />
            </View>
          );

          return (
            <FrostedSurface
              key={m.id}
              borderRadius={radius.l}
              intensity={completed ? 95 : 70}
              fallbackColor={completed ? 'rgba(161,166,31,0.28)' : 'rgba(255,255,255,0.05)'}
              overlayColor={completed ? 'rgba(161,166,31,0.42)' : 'rgba(255,255,255,0.18)'}
              style={{
                borderWidth: 2,
                borderColor: colors.light.primary,
                paddingVertical: spacing.l as any,
                paddingHorizontal: spacing.l as any,
                minHeight: 200,
              }}
            >
              <View style={{ alignItems: 'center', marginBottom: spacing.m as any }}>
                {resolveMilestoneIcon(m.icon) ? (
                  <Image source={resolveMilestoneIcon(m.icon)} style={{ width: 64, height: 64 }} resizeMode="contain" />
                ) : (
                  <ThemedText kind="h1" style={{ color: completed ? colors.light.surface : colors.light.text }}>
                    ⭐
                  </ThemedText>
                )}
              </View>
              <View style={{ flexShrink: 1 }}>
                <ThemedText kind="h2" style={{ color: completed ? colors.light.surface : colors.light.text, textAlign: 'center' }}>{m.title}</ThemedText>
                {m.description ? (
                  <ThemedText style={{ color: completed ? 'rgba(255,255,255,0.85)' : colors.light.textMuted, textAlign: 'center', marginTop: 4 }}>{m.description}</ThemedText>
                ) : null}
                {completed ? (
                  <ThemedText style={{ color: 'rgba(255,255,255,0.85)', marginTop: 6, textAlign: 'center' }}>{subtitle}</ThemedText>
                ) : (
                  <ThemedText muted style={{ marginTop: 6, textAlign: 'center' }}>{subtitle}</ThemedText>
                )}
              </View>
              {statusNode}
            </FrostedSurface>
          );
        })}
      </View>
    </ScrollView>
  );
}
