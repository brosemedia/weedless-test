import React, { useEffect, useMemo } from 'react';
import { View, ScrollView, Image, Pressable, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useStore } from '../store/useStore';
import { spacing, radius, colors } from '../design/tokens';
import { HEADER_TOTAL_HEIGHT } from '../components/AppHeader';
import { Card, ThemedText, useTheme } from '../design/theme';
import { FrostedSurface } from '../design/FrostedSurface';
import ProgressDial from '../components/ProgressDial';
import { aggregate } from '../lib/stats';
import { mergeMilestonesWithDefaults, milestonesDiffer, resolveMilestoneIcon } from '../data/milestones';
import type { Milestone as MilestoneType } from '../types/milestone';
import { useHeaderTransparency } from '../hooks/useHeaderTransparency';
import { useUiStore } from '../store/ui';
import { useApp } from '../store/app';
import { formatXp } from '../lib/xp';
import { computeMilestoneCompletion } from '../lib/milestoneProgress';

const formatDays = (value: number) => `${value} ${value === 1 ? 'Tag' : 'Tage'}`;

export default function Milestones() {
  const insets = useSafeAreaInsets();
  const headerAccessoryHeight = useUiStore((s) => s.headerAccessoryHeight);
  const milestones = useStore((s) => s.milestones);
  const setMilestones = useStore((s) => s.setMilestones);
  const awardMilestone = useStore((s) => s.awardMilestone);
  const checkins = useStore((s) => s.checkins);
  const profile = useStore((s) => s.profile);
  const diary = useStore((s) => s.diary);
  const xpState = useApp((s) => s.xp);
  const navigation = useNavigation<any>();
  const { handleScroll } = useHeaderTransparency();
  const { mode, colors: themeColors } = useTheme();
  const isDark = mode === 'dark';
  const xpRange = Math.max(1, xpState.xpForNextLevel - xpState.xpForCurrentLevel);
  const xpWithinLevel = Math.max(0, xpState.totalXp - xpState.xpForCurrentLevel);
  const levelProgress = Math.max(0, Math.min(1, xpWithinLevel / xpRange));
  const xpToNext = Math.max(0, xpState.xpForNextLevel - xpState.totalXp);
  const goToLevelStatus = () => navigation.navigate('LevelStatus');

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
      if (m.kind === 'pause') return;
      if (m.kind === 'streak' && currentStreak >= (m.threshold || 0)) awardMilestone(m.id);
      else if (m.kind === 'count' && total >= (m.threshold || 0)) awardMilestone(m.id);
      else if (m.kind === 'money' && agg.moneySaved >= (m.threshold || 0)) awardMilestone(m.id);
    });
  }, [checkins, milestones, currentStreak, agg]);

  const progressFor = (m: MilestoneType) => {
    const totalNow =
      m.kind === 'streak'
        ? currentStreak
        : m.kind === 'count'
        ? checkins.length
        : m.kind === 'money'
        ? agg.moneySaved
        : m.achievedAt
        ? m.threshold || 1
        : 0;
    return computeMilestoneCompletion(totalNow, m);
  };
  const remainingFor = (m: MilestoneType) => {
    if (m.kind === 'pause') return m.achievedAt ? 0 : m.threshold || 1;
    const totalNow = m.kind === 'streak' ? currentStreak : m.kind === 'count' ? checkins.length : agg.moneySaved;
    return Math.max(0, (m.threshold || 0) - totalNow);
  };
  const remainingLabel = (m: MilestoneType) => {
    const remaining = Math.max(0, remainingFor(m));
    if (remaining <= 0) return 'geschafft!';
    if (m.kind === 'pause') return 'Pause abschließen';
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
        paddingTop: insets.top + HEADER_TOTAL_HEIGHT + headerAccessoryHeight + (spacing.l as any),
        paddingBottom: Math.max(spacing.l as any, insets.bottom) + 100, // Extra Padding für TabBar
        gap: spacing.m as any,
      }}
      onScroll={handleScroll}
      scrollEventThrottle={16}
    >
      <View style={[styles.summaryFrame, { borderColor: colors.light.border }]}>
        <Card
          style={{
            paddingHorizontal: spacing.l,
            paddingVertical: spacing.m,
            backgroundColor: 'rgba(255,255,255,0.08)',
            borderColor: colors.light.primary,
            borderWidth: 1,
            borderRadius: radius.xl,
          }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: spacing.s as number }}>
            <View style={{ flex: 1 }}>
              <ThemedText kind="label" style={{ color: colors.light.textMuted, marginBottom: 4 }}>
                Aktuelles Level
              </ThemedText>
              <ThemedText kind="h1" style={{ color: colors.light.text }}>
                Lvl {xpState.currentLevel}
              </ThemedText>
              <ThemedText style={{ color: colors.light.textMuted, marginTop: 4 }}>
                {formatXp(xpWithinLevel)} / {formatXp(xpRange)} XP
              </ThemedText>
              <ThemedText kind="label" style={{ color: colors.light.primary, marginTop: 4 }}>
                {xpToNext > 0
                  ? `${formatXp(xpToNext)} XP bis Lvl ${xpState.currentLevel + 1}`
                  : 'Nächstes Level erreicht'}
              </ThemedText>
            </View>
            <Pressable
              onPress={goToLevelStatus}
              style={({ pressed }) => [
                {
                  paddingVertical: 6,
                  paddingHorizontal: 14,
                  borderRadius: radius.pill,
                  borderWidth: 1,
                  borderColor: colors.light.primary,
                  backgroundColor: 'rgba(255,255,255,0.08)',
                },
                pressed && { opacity: 0.85 },
              ]}
              accessibilityRole="button"
            >
              <ThemedText kind="label" style={{ color: colors.light.primary }}>Level-Status</ThemedText>
            </Pressable>
          </View>
          <View style={{ marginTop: spacing.m as number }}>
            <View
              style={{
                height: 8,
                borderRadius: radius.pill,
                backgroundColor: colors.light.border,
                overflow: 'hidden',
              }}
            >
              <View
                style={{
                  height: '100%',
                  width: `${Math.round(levelProgress * 100)}%`,
                  backgroundColor: colors.light.primary,
                }}
              />
            </View>
          </View>
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
              : m.kind === 'money'
              ? `Ziel: ${(m.threshold || 0).toLocaleString('de-DE')} €`
              : 'Ziel: Pause erfolgreich abschließen';
          const rewardLabel = `+${formatXp(m.xpReward ?? 0)} XP`;
          const statusNode = completed ? (
            <View style={{ alignItems: 'center', marginTop: spacing.m as any }}>
              <View style={{ backgroundColor: 'rgba(255,255,255,0.25)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: radius.pill, marginBottom: 8 }}>
                <ThemedText kind="label" style={{ color: colors.light.surface, letterSpacing: 0.6 }}>ERREICHT</ThemedText>
              </View>
              <View
                style={{
                  backgroundColor: '#DAE97B',
                  paddingHorizontal: 16,
                  paddingVertical: 10,
                  borderRadius: radius.pill,
                }}
              >
                <ThemedText kind="label" style={{ color: '#1F2A10' }}>{rewardLabel}</ThemedText>
              </View>
            </View>
          ) : (
            <View style={{ alignItems: 'center', marginTop: spacing.m as any, gap: spacing.s as number }}>
              <ProgressDial
                value={progressFor(m)}
                label={remainingLabel(m)}
                size={64}
                stroke={7}
                color={colors.light.primary}
                track={colors.light.border}
              />
              <View
                style={{
                  backgroundColor: 'rgba(255,255,255,0.12)',
                  paddingHorizontal: 12,
                  paddingVertical: 6,
                  borderRadius: radius.pill,
                }}
              >
                <ThemedText kind="label" style={{ color: isDark ? '#FFFFFF' : colors.light.text }}>
                  Belohnung {rewardLabel}
                </ThemedText>
              </View>
            </View>
          );

          return (
            <View key={m.id} style={[styles.milestoneFrame, { borderColor: colors.light.border }]}>
              <FrostedSurface
                borderRadius={radius.l}
                intensity={completed ? 95 : 70}
                fallbackColor={completed ? 'rgba(161,166,31,0.28)' : 'rgba(255,255,255,0.05)'}
                overlayColor={completed ? 'rgba(161,166,31,0.42)' : 'rgba(255,255,255,0.18)'}
                style={[styles.milestoneCard, { borderColor: colors.light.primary }]}
              >
                <View style={{ alignItems: 'center', marginBottom: spacing.m as any }}>
                  {resolveMilestoneIcon(m.icon) ? (
                    <Image source={resolveMilestoneIcon(m.icon)} style={{ width: 64, height: 64 }} resizeMode="contain" />
                  ) : (
                    <ThemedText kind="h1" style={{ color: completed ? colors.light.surface : isDark ? '#FFFFFF' : colors.light.text }}>
                      ⭐
                    </ThemedText>
                  )}
                </View>
                <View style={{ flexShrink: 1 }}>
                  <ThemedText kind="h2" style={{ color: completed ? colors.light.surface : isDark ? '#FFFFFF' : colors.light.text, textAlign: 'center' }}>{m.title}</ThemedText>
                  {m.description ? (
                    <ThemedText style={{ color: completed ? 'rgba(255,255,255,0.85)' : isDark ? '#FFFFFF' : colors.light.textMuted, textAlign: 'center', marginTop: 4 }}>{m.description}</ThemedText>
                  ) : null}
                  {completed ? (
                    <ThemedText style={{ color: 'rgba(255,255,255,0.85)', marginTop: 6, textAlign: 'center' }}>{subtitle}</ThemedText>
                  ) : (
                    <ThemedText style={{ color: isDark ? '#FFFFFF' : undefined, marginTop: 6, textAlign: 'center' }} muted={!isDark}>{subtitle}</ThemedText>
                  )}
                </View>
                {statusNode}
              </FrostedSurface>
            </View>
          );
        })}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  summaryFrame: {
    width: '100%',
    borderWidth: 1,
    borderRadius: radius.xl + 6,
    padding: spacing.s,
    backgroundColor: 'rgba(0,0,0,0.02)',
  },
  milestoneFrame: {
    width: '100%',
    borderWidth: 1,
    borderRadius: radius.l + 6,
    padding: spacing.s,
    backgroundColor: 'rgba(0,0,0,0.02)',
  },
  milestoneCard: {
    borderWidth: 2,
    paddingVertical: spacing.l,
    paddingHorizontal: spacing.l,
    minHeight: 200,
  },
});
