import React, { useEffect, useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { NavigationContainerRefWithCurrent } from '@react-navigation/native';
import { colors, radius, spacing } from '../design/tokens';
import { useApp } from '../store/app';
import { getPauseEndTimestamp, getPauseStartTimestamp } from '../lib/pauseTime';

const REFRESH_INTERVAL_MS = 60_000;
type Props = {
  navRef?: NavigationContainerRefWithCurrent<any>;
};

export default function PauseHeaderBadge({ navRef }: Props) {
  const activePause = useApp((s) => s.pauses.find((pause) => pause.status === 'aktiv'));
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (!activePause) return;
    const interval = setInterval(() => setNow(Date.now()), REFRESH_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [activePause]);

  const info = useMemo(() => {
    if (!activePause) return null;
    const startMs = getPauseStartTimestamp(activePause);
    const endMs = getPauseEndTimestamp(activePause);
    if (
      typeof startMs !== 'number' ||
      !Number.isFinite(startMs) ||
      typeof endMs !== 'number' ||
      !Number.isFinite(endMs)
    ) {
      return { percent: 0, progress: 0 };
    }
    const totalMs = endMs - startMs;
    const elapsedMs = Math.max(0, now - startMs);
    let progress = totalMs <= 0 ? 1 : elapsedMs / Math.max(1, totalMs);
    progress = Math.min(1, Math.max(0, progress));
    const percent = Math.round(progress * 100);
    const displayPercent = progress > 0 ? Math.max(1, percent) : 0;
    return { percent: displayPercent, progress };
  }, [activePause, now]);

  if (!info) return <View style={{ width: spacing.xl }} />;

  return (
    <Pressable
      onPress={() => navRef?.current?.navigate('PausePlan')}
      style={({ pressed }) => [
        styles.badge,
        pressed && { opacity: 0.8 },
      ]}
      accessibilityRole="button"
      accessibilityLabel="Pause planen"
    >
      <View style={styles.row}>
        <Text style={styles.badgeLabel}>Pause</Text>
        <Text style={styles.badgePercent}>{info.percent}%</Text>
      </View>
      <View style={styles.progressTrack}>
        <View style={[styles.progressThumb, { width: `${Math.round(info.progress * 100)}%` }]} />
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: spacing.l,
    paddingVertical: spacing.xs,
    backgroundColor: colors.light.primary,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.light.primaryRing,
    marginLeft: spacing.s,
    marginTop: spacing.xs,
    marginBottom: spacing.m,
    minWidth: 180,
    minHeight: 34,
    alignSelf: 'center',
    marginRight: spacing.xs,
    shadowColor: colors.light.primary,
    shadowOpacity: 0.25,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  badgeLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.light.surface,
    letterSpacing: 0.6,
    textTransform: 'uppercase',
  },
  badgePercent: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.light.surface,
    textAlign: 'right',
    minWidth: 42,
  },
  progressTrack: {
    marginTop: 4,
    height: 4,
    borderRadius: radius.pill,
    backgroundColor: 'rgba(255,255,255,0.35)',
    overflow: 'hidden',
  },
  progressThumb: {
    height: '100%',
    borderRadius: radius.pill,
    backgroundColor: colors.light.surface,
  },
});
