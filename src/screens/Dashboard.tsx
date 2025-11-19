import React from 'react';
import { ScrollView, View, Image, Platform, UIManager, ImageBackground } from 'react-native';
import LottieView from 'lottie-react-native';
const ICON_SMOKE_FREE = require('../../assets/045-Marijuana.png');
const CLOCK_TIME_ANIMATION = require('../../assets/clock time.json');
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { HEADER_TOTAL_HEIGHT } from '../components/AppHeader';
import { useStore } from '../store/useStore';
import { aggregate, formatDurationSince } from '../lib/stats';
import { ThemedText, Card, PrimaryButton } from '../design/theme';
import { colors, spacing, radius } from '../design/tokens';
import ProgressDial from '../components/ProgressDial';
import { normCravingPercent, normSleepPercent, normWithdrawalPercent, weakestMetric } from '../lib/scales';
import LiveKpiGrid from '../../components/LiveKpiGrid';
import type { Milestone as MilestoneType } from '../types/milestone';
import { resolveMilestoneIcon } from '../data/milestones';
import { useApp } from '../store/app';
import { useStats } from '../lib/selectors';
import { isProfileComplete } from '../lib/profileGuard';
import { useOnboardingStore } from '../onboarding/store';
import RecoveryTimeline from '../components/RecoveryTimeline';
import { FrostedSurface } from '../design/FrostedSurface';
import { useHeaderTransparency } from '../hooks/useHeaderTransparency';
import { usePauseEngine } from '../hooks/usePauseEngine';
import { pauseDurationInDays } from '../lib/pause';
import { getPauseEndTimestamp, getPauseStartTimestamp } from '../lib/pauseTime';
import { useUiStore } from '../store/ui';

const MONTHS_DE = ['Januar', 'Februar', 'März', 'April', 'Mai', 'Juni', 'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember'];
const formatDays = (value: number) => `${value} ${value === 1 ? 'Tag' : 'Tage'}`;

const dateKeyToTimestamp = (key: string) => {
  const [year, month, day] = key.split('-').map((part) => parseInt(part, 10));
  if (!Number.isFinite(year) || !Number.isFinite(month) || !Number.isFinite(day)) {
    return null;
  }
  return new Date(year, month - 1, day, 23, 59, 59, 999).getTime();
};

const hasNativeLottieSupport = (() => {
  if (Platform.OS !== 'ios' && Platform.OS !== 'android') {
    return false;
  }
  try {
    if (typeof UIManager.getViewManagerConfig === 'function') {
      return !!UIManager.getViewManagerConfig('LottieAnimationView');
    }
    return false;
  } catch {
    return false;
  }
})();

function SmokeFreeBadge({ duration, since }: { duration: string; since?: string | null }) {
  return (
    <View
      style={{
        alignSelf: 'stretch',
        width: '100%',
        backgroundColor: colors.light.primary,
        borderRadius: radius.xl,
        paddingVertical: spacing.m as any,
        paddingHorizontal: spacing.l as any,
        borderWidth: 1,
        borderColor: colors.light.primaryRing,
        shadowColor: colors.light.primary,
        shadowOpacity: 0.35,
        shadowRadius: 14,
        shadowOffset: { width: 0, height: 8 },
        elevation: 4,
      }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.m as any }}>
        <View style={{ flex: 1 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <ThemedText kind="label" style={{ color: colors.light.surface, textTransform: 'uppercase', letterSpacing: 1 }}>Konsumfreie Zeit</ThemedText>
            <Image source={ICON_SMOKE_FREE} style={{ width: 24, height: 24, tintColor: colors.light.surface }} resizeMode="contain" />
          </View>
          <ThemedText kind="h1" style={{ color: colors.light.surface, marginTop: 6, fontSize: 30 }}>{duration}</ThemedText>
          {since ? (
            <View style={{ marginTop: 6, flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <ThemedText kind="label" style={{ color: 'rgba(255,255,255,0.8)', textTransform: 'uppercase' }}>seit</ThemedText>
              <ThemedText style={{ color: colors.light.surface, fontWeight: '600' }}>{since}</ThemedText>
            </View>
          ) : null}
        </View>
        {hasNativeLottieSupport ? (
          <LottieView
            source={CLOCK_TIME_ANIMATION}
            autoPlay
            loop
            style={{ width: 110, height: 110 }}
            resizeMode="contain"
            pointerEvents="none"
          />
        ) : (
          <Image source={ICON_SMOKE_FREE} style={{ width: 90, height: 90, tintColor: colors.light.surface }} resizeMode="contain" />
        )}
      </View>
    </View>
  );
}

export default function Dashboard({ navigation }: any) {
  const profile = useStore((s) => s.profile);
  const diary = useStore((s) => s.diary);
  const checkins = useStore((s) => s.checkins);
  const insets = useSafeAreaInsets();
  const headerAccessoryHeight = useUiStore((s) => s.headerAccessoryHeight);
  const milestones = useStore((s) => s.milestones);
  const points = useStore((s) => s.points);
  const appHydrated = useApp((s) => s.hydrated);
  const appProfile = useApp((s) => s.profile);
  const dayLogs = useApp((s) => s.dayLogs);
  const pauses = useApp((s) => s.pauses);
  const restartOnboarding = useOnboardingStore((state) => state.reset);
  const stats = useStats();
  const { handleScroll } = useHeaderTransparency(6);
  const openPausePlanner = React.useCallback(() => {
    const parent = navigation.getParent()?.getParent() ?? navigation.getParent() ?? navigation;
    parent?.navigate('PausePlan');
  }, [navigation]);
  usePauseEngine();
  const activePause = pauses.find((pause) => pause.status === 'aktiv');

  if (!appHydrated) {
    return null;
  }

  if (!isProfileComplete(appProfile)) {
    return (
      <View style={{ flex: 1, padding: spacing.xl, justifyContent: 'center', alignItems: 'center', gap: spacing.l }}>
        <ThemedText kind="h2" style={{ textAlign: 'center' }}>
          Profil unvollständig – ergänze deine Angaben im Onboarding.
        </ThemedText>
        <PrimaryButton title="Onboarding starten" onPress={restartOnboarding} />
      </View>
    );
  }

  if (!stats) {
    return null;
  }

  const pauseCard = (() => {
    if (!activePause) {
      return (
        <FrostedSurface
          borderRadius={radius.xl}
          intensity={85}
          fallbackColor="rgba(255,255,255,0.08)"
          overlayColor="rgba(255,255,255,0.18)"
          style={{ padding: spacing.l as any, gap: spacing.s as any }}
        >
          <ThemedText kind="label" style={{ color: colors.light.primary }}>
            Pause planen
          </ThemedText>
          <ThemedText kind="h2" style={{ color: colors.light.text }}>
            Lust auf eine Pause?
          </ThemedText>
          <ThemedText style={{ color: colors.light.textMuted }}>
            Mit drei Voreinstellungen oder eigenen Daten bist du in Sekunden startklar.
          </ThemedText>
          <PrimaryButton title="Pause einlegen" onPress={openPausePlanner} />
        </FrostedSurface>
      );
    }
    const totalDays = pauseDurationInDays(activePause);
    const doneDays = Math.min(totalDays, activePause.xpAwardedDays.length);
    const startMs = getPauseStartTimestamp(activePause);
    const endMs = getPauseEndTimestamp(activePause);
    let remainingDaysDecimal: number;
    if (typeof startMs === 'number' && Number.isFinite(startMs) && typeof endMs === 'number' && Number.isFinite(endMs)) {
      const durationMs = Math.max(1, endMs - startMs);
      const elapsedMs = Math.max(0, Date.now() - startMs);
      let progressTime = durationMs <= 0 ? 1 : elapsedMs / durationMs;
      progressTime = Math.min(1, Math.max(0, progressTime));
      remainingDaysDecimal = Math.max(0, (1 - progressTime) * totalDays);
    } else {
      const fallbackDiff = Math.max(0, endMs ? endMs - Date.now() : 0);
      remainingDaysDecimal = fallbackDiff / 86_400_000;
    }
    const formattedDays = new Intl.NumberFormat('de-DE', { minimumFractionDigits: 1, maximumFractionDigits: 1 }).format(
      remainingDaysDecimal
    );
    const timeLabel = `${formattedDays} Tage`;
    const progress = Math.min(1, doneDays / Math.max(1, totalDays));
    return (
      <FrostedSurface
        borderRadius={radius.xl}
        intensity={95}
        fallbackColor="rgba(16,104,74,0.2)"
        overlayColor="rgba(255,255,255,0.08)"
        style={{ padding: spacing.l as any, gap: spacing.m as any }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <View>
            <ThemedText kind="label" style={{ color: colors.light.surface }}>
              Pause aktiv
            </ThemedText>
            <ThemedText kind="h2" style={{ color: colors.light.surface }}>
              Noch {timeLabel}
            </ThemedText>
            <ThemedText style={{ color: 'rgba(255,255,255,0.9)', marginTop: 4 }}>
              {doneDays} von {totalDays} Tagen geschafft
            </ThemedText>
          </View>
          <PrimaryButton title="Details" onPress={openPausePlanner} />
        </View>
        <View style={{ height: 10, borderRadius: radius.pill, backgroundColor: 'rgba(255,255,255,0.2)' }}>
          <View
            style={{
              height: 10,
              borderRadius: radius.pill,
              backgroundColor: colors.light.surface,
              width: `${Math.round(progress * 100)}%`,
            }}
          />
        </View>
      </FrostedSurface>
    );
  })();
  const lastConsumptionTimestamp = React.useMemo(() => {
    if (appProfile?.lastConsumptionAt) return appProfile.lastConsumptionAt;
    const entries = Object.values(dayLogs);
    if (!entries.length) return null;
    const consumedEntries = entries
      .filter((log) => (log.consumedGrams ?? 0) > 0 || (log.consumedJoints ?? 0) > 0)
      .map((log) => ({ log, ts: dateKeyToTimestamp(log.date) }))
      .filter((item): item is { log: typeof entries[number]; ts: number } => item.ts != null)
      .sort((a, b) => b.ts - a.ts);
    return consumedEntries[0]?.ts ?? null;
  }, [appProfile?.lastConsumptionAt, dayLogs]);

  const fallbackStartIso = profile.startedAt
    ? profile.startedAt
    : appProfile
    ? new Date(appProfile.startTimestamp).toISOString()
    : new Date().toISOString();
  const pauseStartIso = lastConsumptionTimestamp
    ? new Date(lastConsumptionTimestamp).toISOString()
    : fallbackStartIso;

  const currentStreak = React.useMemo(() => {
    let streak = 0;
    const d = new Date();
    for (let i = 0; i < 365; i++) {
      const iso = new Date(d.getFullYear(), d.getMonth(), d.getDate() - i).toISOString().slice(0,10);
      if (checkins.some((c) => c.dateISO.slice(0,10) === iso)) streak++; else break;
    }
    return streak;
  }, [checkins]);

  const total = aggregate(profile, diary, 'all');

  const milestoneProgress = (m: MilestoneType) =>
    m.kind === 'streak'
      ? currentStreak
      : m.kind === 'count'
      ? checkins.length
      : m.kind === 'money'
      ? total.moneySaved
      : m.achievedAt
      ? m.threshold || 1
      : 0;
  const remainingFor = (m: MilestoneType) => Math.max(0, (m.threshold ?? 0) - milestoneProgress(m));
  const recent = React.useMemo(
    () =>
      (milestones || [])
        .filter((m: MilestoneType) => !!m.achievedAt)
        .sort((a, b) => +new Date(b.achievedAt!) - +new Date(a.achievedAt!)),
    [milestones]
  );
  const upcoming = React.useMemo(
    () =>
      (milestones || [])
        .filter((m: MilestoneType) => !m.achievedAt)
        .sort((a, b) => remainingFor(a) - remainingFor(b)),
    [milestones, checkins, currentStreak]
  );

  const list = [...recent.slice(0,2), ...upcoming.slice(0,3)].slice(0,3);

  const daysSinceStart = React.useMemo(() => {
    const recoveryStartTs = lastConsumptionTimestamp ?? appProfile?.startTimestamp ?? null;
    if (!recoveryStartTs) return 0;
    const now = Date.now();
    return Math.max(0, Math.floor((now - recoveryStartTs) / (24 * 60 * 60 * 1000)));
  }, [lastConsumptionTimestamp, appProfile?.startTimestamp]);

  const duration = formatDurationSince(pauseStartIso);
  const sinceDate = pauseStartIso ? new Date(pauseStartIso) : null;
  const sinceLabel = sinceDate && !Number.isNaN(sinceDate.getTime())
    ? `${sinceDate.getDate().toString().padStart(2, '0')}. ${MONTHS_DE[sinceDate.getMonth()]} ${sinceDate.getFullYear()}`
    : null;

  const latest = checkins[0];
  const vals = {
    craving: normCravingPercent(latest?.mcq0_10),
    withdrawal: normWithdrawalPercent(latest?.cws0_50),
    sleep: normSleepPercent(latest?.isi2_0_8),
  };
  const weakest = weakestMetric(vals).key;

  function missionTitle(key: 'craving' | 'withdrawal' | 'sleep') {
    if (key === 'craving') return 'Suchtverlagerungen verstehen & bekämpfen';
    if (key === 'withdrawal') return 'THC-Abbau im Körper: Was passiert wann?';
    return 'Entzugssymptome leichter durchstehen';
  }

  return (
    <ImageBackground
      source={require('../../assets/bg1.png')}
      style={{ flex: 1 }}
      resizeMode="cover"
    >
      <ScrollView
        style={{ flex: 1, backgroundColor: 'transparent' }}
        contentContainerStyle={{
          paddingHorizontal: spacing.xl as any,
          paddingTop: insets.top + HEADER_TOTAL_HEIGHT + headerAccessoryHeight + (spacing.l as any),
          paddingBottom: Math.max(spacing.xl as any, insets.bottom || 0),
          gap: spacing.l as any,
        }}
        onScroll={handleScroll}
        scrollEventThrottle={16}
      >
        <SmokeFreeBadge duration={duration} since={sinceLabel} />

        {pauseCard}

        <LiveKpiGrid />

        <View style={{ width: '100%', gap: spacing.s as any }}>
          <ThemedText kind="label" style={{ color: colors.light.textMuted }}>
            Erholung im Verlauf
          </ThemedText>
          <View style={{ marginHorizontal: -(spacing.xl as any) }}>
            <RecoveryTimeline sinceStartDays={daysSinceStart} />
          </View>
        </View>

        <Card
          style={{
            borderWidth: 2,
            borderColor: colors.light.primary,
          }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <ThemedText kind="h2" style={{ color: colors.light.primary }}>Meilensteine</ThemedText>
            <PrimaryButton title="Alle anzeigen" onPress={() => navigation.getParent()?.navigate('Meilensteine')} />
          </View>
          <View style={{ marginTop: 8, gap: spacing.m as any }}>
            {list.length === 0 ? (
              <ThemedText muted>Keine Meilensteine vorhanden.</ThemedText>
            ) : (
              list.map((m: MilestoneType) => (
                <FrostedSurface
                  key={m.id}
                  borderRadius={radius.l}
                  intensity={80}
                  fallbackColor="rgba(255,255,255,0.04)"
                  overlayColor="rgba(255,255,255,0.22)"
                  style={{
                    borderWidth: 2,
                    borderColor: colors.light.primary,
                    paddingVertical: spacing.m as any,
                    paddingHorizontal: spacing.l as any,
                    minHeight: 92,
                  }}
                >
                  <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, flexShrink: 1 }}>
                      {resolveMilestoneIcon(m.icon) ? (
                        <Image source={resolveMilestoneIcon(m.icon)} style={{ width: 38, height: 38, flexShrink: 0 }} resizeMode="contain" />
                      ) : (
                        <ThemedText kind="h2">⭐</ThemedText>
                      )}
                      <View style={{ flexShrink: 1 }}>
                        <ThemedText>{m.title}</ThemedText>
                        {m.description ? <ThemedText muted>{m.description}</ThemedText> : null}
                        <ThemedText muted>
                          {m.kind === 'streak'
                            ? `Ziel: ${formatDays(m.threshold || 0)}`
                            : m.kind === 'count'
                            ? `Ziel: ${m.threshold} Tracken`
                            : m.kind === 'money'
                            ? `Ziel: ${m.threshold.toLocaleString('de-DE')} €`
                            : 'Ziel: Pause erfolgreich abschließen'}
                        </ThemedText>
                      </View>
                    </View>
                    {m.achievedAt ? (
                      <View style={{ width: 64, alignItems: 'center' }}>
                        <View style={{ backgroundColor: '#D4AF37', paddingHorizontal: 10, paddingVertical: 6, borderRadius: radius.pill, minWidth: 52, alignItems: 'center' }}>
                          <ThemedText kind="label" style={{ color: '#1F2937' }}>🏆 {m.points}</ThemedText>
                        </View>
                      </View>
                    ) : (
                      <View style={{ width: 76, alignItems: 'center', justifyContent: 'center' }}>
                        <ProgressDial
                          value={Math.max(0, Math.min(1, milestoneProgress(m) / (m.threshold || 1)))}
                          size={72}
                          stroke={9}
                          color={colors.light.primary}
                          track={colors.light.border}
                          hideLabel
                          percentSize={18}
                          percentTextStyle={{ color: colors.light.primary }}
                        />
                      </View>
                    )}
                  </View>
                </FrostedSurface>
              ))
            )}
          </View>
        </Card>

        {/* Daily Tracken CTA (pastel color, larger, placed below) */}
        <Card
          style={{
            borderWidth: 2,
            borderColor: colors.light.primary,
            padding: (spacing.xl as any),
            minHeight: 140,
            justifyContent: 'center',
            gap: spacing.m as any,
          }}
        >
          <ThemedText kind="label" style={{ color: colors.light.primary }}>
            Daily Tracken
          </ThemedText>
          <ThemedText kind="h2" style={{ color: colors.light.text }}>
            Wie geht's dir heute?
          </ThemedText>
          <PrimaryButton
            title="Tracken starten"
            onPress={() => navigation.getParent()?.navigate('Tracken')}
          />
        </Card>

        {/* Mini-Spiel Link */}
        <Card
          style={{
            borderWidth: 2,
            borderColor: colors.light.primary,
            gap: spacing.m as any,
          }}
        >
          <ThemedText kind="label" style={{ color: colors.light.primary }}>
            Mini-Spiel
          </ThemedText>
          <ThemedText kind="h2">Craving Tap</ThemedText>
          <PrimaryButton
            title="Jetzt spielen"
            onPress={() => navigation.getParent()?.getParent()?.navigate('MinigamesHub')}
          />
        </Card>

        {/* CTA-Band basierend auf schwächster Metrik */}
        <View
          style={{
            backgroundColor: colors.light.navy,
            borderRadius: radius.l,
            padding: spacing.xl,
            gap: spacing.m as any,
          }}
        >
          <ThemedText kind="h2" style={{ color: 'white' }}>
            Lesetipp für heute
          </ThemedText>
          <ThemedText style={{ color: 'white' }}>{missionTitle(weakest)}</ThemedText>
          <PrimaryButton
            title="Zum Wissen"
            onPress={() => navigation.getParent()?.navigate('Wissen', { focus: weakest })}
          />
        </View>
      </ScrollView>
    </ImageBackground>
  );
}
