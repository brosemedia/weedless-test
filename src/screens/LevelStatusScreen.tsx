import React, { useMemo, useCallback, useRef } from 'react';
import { View, ScrollView, StyleSheet, Image, Pressable, Text, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import ViewShot, { captureRef } from 'react-native-view-shot';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import AppBackground from '../components/AppBackground';
import { HEADER_TOTAL_HEIGHT } from '../components/AppHeader';
import { Card, ThemedText } from '../design/theme';
import { spacing, radius } from '../design/tokens';
import { useUiStore } from '../store/ui';
import { useApp } from '../store/app';
import { useStore } from '../store/useStore';
import { aggregate } from '../lib/stats';
import { formatXp, labelForXpReason } from '../lib/xp';
import { resolveMilestoneIcon } from '../data/milestones';
import type { Milestone } from '../types/milestone';
import { useTheme } from '../theme/useTheme';
import { useQuickActionsVisibility } from '../hooks/useQuickActionsVisibility';
import { computeMilestoneCompletion } from '../lib/milestoneProgress';

const HAZELESS_LOGO = require('../../assets/hazeless_logo.png');

const EVENT_LIMIT = 20;

const formatDateLabel = (value: string) => {
  try {
    return format(new Date(value), 'dd.MM.yyyy HH:mm', { locale: de });
  } catch {
    return value;
  }
};

const formatDays = (value: number) => `${value} ${value === 1 ? 'Tag' : 'Tage'}`;

export default function LevelStatusScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();
  const headerAccessoryHeight = useUiStore((s) => s.headerAccessoryHeight);
  const xpState = useApp((s) => s.xp);
  const xpEvents = xpState.xpEvents.slice(0, EVENT_LIMIT);
  const milestones = useStore((s) => s.milestones);
  const profile = useStore((s) => s.profile);
  const diary = useStore((s) => s.diary);
  const checkins = useStore((s) => s.checkins);
  const { theme } = useTheme();
  useQuickActionsVisibility('level-status-screen', true);
  const palette = theme.colors;
  const xpRange = Math.max(1, xpState.xpForNextLevel - xpState.xpForCurrentLevel);
  const xpWithinLevel = Math.max(0, xpState.totalXp - xpState.xpForCurrentLevel);
  const levelProgress = Math.max(0, Math.min(1, xpWithinLevel / xpRange));
  const levelPercent = Math.round(levelProgress * 100);
  const xpToNext = Math.max(0, xpState.xpForNextLevel - xpState.totalXp);
  const heroShotRef = useRef<ViewShot | null>(null);
  const agg = useMemo(() => aggregate(profile, diary, 'all'), [profile, diary]);
  const currentStreak = useMemo(() => {
    let streak = 0;
    const today = new Date();
    for (let i = 0; i < 365; i++) {
      const candidate = new Date(today.getFullYear(), today.getMonth(), today.getDate() - i)
        .toISOString()
        .slice(0, 10);
      if (checkins.some((c) => c.dateISO.slice(0, 10) === candidate)) {
        streak += 1;
      } else {
        break;
      }
    }
    return streak;
  }, [checkins]);

  const progressFor = (m: Milestone) => {
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

  const remainingLabel = (m: Milestone) => {
    const remaining = Math.max(0, (m.threshold || 0) - (m.kind === 'streak' ? currentStreak : m.kind === 'count' ? checkins.length : agg.moneySaved));
    if (m.kind === 'pause') return m.achievedAt ? 'abgeschlossen' : 'Pause abschließen';
    if (remaining <= 0) return 'geschafft';
    if (m.kind === 'money') return `noch ${Math.round(remaining).toLocaleString('de-DE')} €`;
    if (m.kind === 'count') return `noch ${Math.ceil(remaining)} Tracken`;
    return `noch ${formatDays(Math.ceil(remaining))}`;
  };

  const sortedMilestones = useMemo(() => {
    return [...(milestones ?? [])].sort((a, b) => {
      if (!!a.achievedAt !== !!b.achievedAt) {
        return a.achievedAt ? 1 : -1;
      }
      return (a.threshold || 0) - (b.threshold || 0);
    });
  }, [milestones]);

  const shareLevelCard = useCallback(async () => {
    if (!heroShotRef.current) return;
    try {
      const uri = await captureRef(heroShotRef.current, {
        format: 'png',
        quality: 0.98,
        result: 'tmpfile',
      });
      const canShare = await Sharing.isAvailableAsync();
      if (!canShare) {
        Alert.alert('Teilen nicht möglich', 'Auf diesem Gerät ist kein Teilen verfügbar.');
        return;
      }
      await Sharing.shareAsync(uri, { dialogTitle: 'Level & XP teilen' });
      setTimeout(() => FileSystem.deleteAsync(uri, { idempotent: true }).catch(() => {}), 4000);
    } catch (error) {
      Alert.alert('Fehler', 'Karte konnte nicht geteilt werden.');
    }
  }, []);

  return (
    <AppBackground>
      <ScrollView
        contentContainerStyle={{
          paddingTop: insets.top + HEADER_TOTAL_HEIGHT + headerAccessoryHeight + (spacing.l as number),
          paddingBottom: Math.max(insets.bottom, spacing.xl as number),
          paddingHorizontal: spacing.xl as number,
          gap: spacing.l as number,
        }}
      >
        <View style={styles.heroCardWrapper}>
          <ViewShot ref={heroShotRef} options={{ format: 'png', quality: 0.98, result: 'tmpfile' }} style={styles.heroShot}>
            <View style={[styles.heroCard, { backgroundColor: palette.surface, borderColor: palette.border }]}>
              <View style={styles.heroHeader}>
                <View style={{ flex: 1 }}>
                  <ThemedText kind="label" style={{ color: palette.textMuted }}>
                    Aktuelles Level
                  </ThemedText>
                  <View style={styles.heroLevelRow}>
                    <ThemedText style={[styles.heroLevelValue, { color: palette.text }]}>
                      Lvl {xpState.currentLevel}
                    </ThemedText>
                    <View style={[styles.heroPercentPill, { borderColor: palette.primary }]}>
                      <ThemedText kind="label" style={{ color: palette.primary }}>
                        {levelPercent}%
                      </ThemedText>
                    </View>
                  </View>
                </View>
                <Image source={HAZELESS_LOGO} style={styles.heroLogo} resizeMode="contain" />
              </View>
              <View
                style={[
                  styles.heroProgressTrack,
                  {
                    backgroundColor:
                      theme.mode === 'light' ? 'rgba(0,0,0,0.08)' : 'rgba(255,255,255,0.12)',
                  },
                ]}
              >
                <View
                  style={[
                    styles.heroProgressThumb,
                    { width: `${Math.round(levelProgress * 100)}%`, backgroundColor: palette.primary },
                  ]}
                />
              </View>
              <View style={styles.heroStatsRow}>
                <View style={styles.heroStatBox}>
                  <ThemedText kind="label" style={{ color: palette.textMuted }}>
                    Gesamt-XP
                  </ThemedText>
                  <ThemedText style={[styles.heroStatValue, { color: palette.text }]}>
                    {formatXp(xpState.totalXp)}
                  </ThemedText>
                  <ThemedText kind="label" style={{ color: palette.textMuted }}>
                    {formatXp(xpWithinLevel)} / {formatXp(xpRange)} im Level
                  </ThemedText>
                </View>
                <View style={styles.heroStatDivider} />
                <View style={styles.heroStatBox}>
                  <ThemedText kind="label" style={{ color: palette.textMuted }}>
                    Bis Level {xpState.currentLevel + 1}
                  </ThemedText>
                  <ThemedText style={[styles.heroStatValue, { color: palette.primary }]}>
                    {xpToNext > 0 ? `${formatXp(xpToNext)} XP` : 'Erreicht'}
                  </ThemedText>
                  <ThemedText kind="label" style={{ color: palette.textMuted }}>
                    nächste Schwelle: {formatXp(xpState.xpForNextLevel)} XP
                  </ThemedText>
                </View>
              </View>
            </View>
          </ViewShot>
          <Pressable
            onPress={shareLevelCard}
            style={({ pressed }) => [
              styles.shareButton,
              { backgroundColor: palette.surface, borderColor: palette.border },
              pressed && { opacity: 0.85 },
            ]}
            accessibilityRole="button"
            accessibilityLabel="Level-Karte teilen"
          >
            <Ionicons name="share-social-outline" size={16} color={palette.text} />
          </Pressable>
        </View>

        <Card style={styles.sectionCard}>
          <View style={styles.sectionHeading}>
            <ThemedText kind="h2" style={{ color: palette.text }}>
              Letzte XP-Aktionen
            </ThemedText>
            <ThemedText kind="label" style={{ color: palette.textMuted }}>
              {xpEvents.length} Einträge
            </ThemedText>
          </View>
          {xpEvents.length === 0 ? (
            <ThemedText muted style={{ color: palette.textMuted }}>
              Noch keine XP gesammelt – starte mit einer Atemübung oder einem Check-in.
            </ThemedText>
          ) : (
            <View style={{ gap: spacing.s as number }}>
              {xpEvents.map((event) => {
                const label = event.meta?.label ?? labelForXpReason(event.reason);
                return (
                  <View key={event.id} style={styles.eventRow}>
                    <View style={{ flex: 1 }}>
                      <ThemedText style={{ color: palette.text }}>{label}</ThemedText>
                      <ThemedText kind="label" style={{ color: palette.textMuted, marginTop: 2 }}>
                        {formatDateLabel(event.dateISO)}
                      </ThemedText>
                    </View>
                    <ThemedText kind="label" style={{ color: palette.primary }}>
                      +{formatXp(event.amount)} XP
                    </ThemedText>
                  </View>
                );
              })}
            </View>
          )}
        </Card>

        <Card style={styles.sectionCard}>
          <View style={styles.sectionHeading}>
            <ThemedText kind="h2" style={{ color: palette.text }}>
              Meilenstein-Belohnungen
            </ThemedText>
            <ThemedText kind="label" style={{ color: palette.textMuted }}>
              {sortedMilestones.length} Ziele
            </ThemedText>
          </View>
          {sortedMilestones.map((m) => {
            const progress = progressFor(m);
            const icon = resolveMilestoneIcon(m.icon);
            return (
              <View key={m.id} style={[styles.milestoneRow, { borderColor: palette.border }]}>
                {icon ? (
                  <Image source={icon} style={styles.milestoneIcon} resizeMode="contain" />
                ) : (
                  <ThemedText kind="h2">⭐</ThemedText>
                )}
                <View style={{ flex: 1, marginHorizontal: spacing.s as number }}>
                  <ThemedText style={{ color: palette.text }}>{m.title}</ThemedText>
                  {m.description ? (
                    <ThemedText kind="label" style={{ color: palette.textMuted }}>
                      {m.description}
                    </ThemedText>
                  ) : null}
                  <ThemedText kind="label" style={{ color: palette.textMuted, marginTop: 4 }}>
                    {remainingLabel(m)}
                  </ThemedText>
                  <View
                    style={[
                      styles.progressTrack,
                      {
                        backgroundColor:
                          theme.mode === 'light' ? 'rgba(0,0,0,0.08)' : 'rgba(255,255,255,0.15)',
                      },
                    ]}
                  >
                    <View
                      style={[
                        styles.progressThumb,
                        { width: `${Math.round(progress * 100)}%`, backgroundColor: m.achievedAt ? '#8BC34A' : palette.primary },
                      ]}
                    />
                  </View>
                </View>
                <View style={{ alignItems: 'flex-end', gap: 4 }}>
                  <ThemedText kind="label" style={{ color: palette.text }}>
                    +{formatXp(m.xpReward ?? 0)} XP
                  </ThemedText>
                  <ThemedText kind="label" style={{ color: m.achievedAt ? '#8BC34A' : palette.textMuted }}>
                    {m.achievedAt ? 'erreicht' : 'offen'}
                  </ThemedText>
                </View>
              </View>
            );
          })}
        </Card>
      </ScrollView>
    </AppBackground>
  );
}

const styles = StyleSheet.create({
  heroCardWrapper: {
    position: 'relative',
  },
  heroShot: {
    borderRadius: radius.xl,
  },
  heroCard: {
    borderRadius: radius.xl,
    paddingVertical: (spacing.l as number) * 1.1,
    paddingHorizontal: spacing.l as number,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    gap: spacing.m as number,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 4,
  },
  heroHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.m as number,
  },
  heroLevelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.s as number,
  },
  heroLevelValue: {
    fontSize: 48,
    lineHeight: 52,
    fontWeight: '700',
    fontFamily: 'Inter-Bold',
  },
  heroPercentPill: {
    paddingHorizontal: spacing.s as number,
    paddingVertical: 4,
    borderRadius: radius.pill,
    borderWidth: 1,
  },
  heroLogo: {
    width: 64,
    height: 64,
    opacity: 0.9,
  },
  heroProgressTrack: {
    height: 10,
    borderRadius: radius.pill,
    overflow: 'hidden',
  },
  heroProgressThumb: {
    height: '100%',
    borderRadius: radius.pill,
  },
  heroStatsRow: {
    flexDirection: 'row',
    alignItems: 'stretch',
    gap: spacing.m as number,
  },
  heroStatBox: {
    flex: 1,
    gap: spacing.xs as number,
  },
  heroStatValue: {
    fontSize: 28,
    lineHeight: 32,
    fontWeight: '700',
    fontFamily: 'Inter-Bold',
  },
  heroStatDivider: {
    width: StyleSheet.hairlineWidth,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  shareButton: {
    position: 'absolute',
    top: spacing.s as number,
    right: spacing.s as number,
    padding: spacing.xs as number,
    borderRadius: radius.l,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
  },
  sectionCard: {
    padding: spacing.l as number,
    borderRadius: radius.xl,
    gap: spacing.s as number,
  },
  sectionHeading: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.s as number,
  },
  progressTrack: {
    marginTop: spacing.xs as number,
    height: 8,
    borderRadius: radius.pill,
    overflow: 'hidden',
  },
  progressThumb: {
    height: '100%',
    borderRadius: radius.pill,
  },
  eventRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    paddingVertical: spacing.xs as number,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  milestoneRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.s as number,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  milestoneIcon: {
    width: 44,
    height: 44,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: spacing.m as number,
    paddingVertical: spacing.xs as number,
    borderRadius: radius.pill,
    borderWidth: 1,
    marginBottom: spacing.m as number,
    gap: spacing.xs as number,
  },
  backLabel: {
    fontSize: 14,
    fontWeight: '600',
    fontFamily: 'Inter-SemiBold',
  },
});
