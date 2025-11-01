import React, { useState } from 'react';
import { ScrollView, View, ImageBackground } from 'react-native';
import Svg, { Defs, LinearGradient, Stop, Rect } from 'react-native-svg';
// Import the hero image so Metro can resolve it at build time
// If the file is missing, the onError fallback will be used.
// @ts-ignore
import HeroImage from '../../assets/Hero_1.png';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useStore } from '../store/useStore';
import { aggregate, formatDurationSince, lastUseAt } from '../lib/stats';
import { ThemedText, Card, PrimaryButton } from '../design/theme';
import { colors, spacing, radius } from '../design/tokens';
import ProgressDial from '../components/ProgressDial';
import { normCravingPercent, normSleepPercent, normWithdrawalPercent, weakestMetric } from '../lib/scales';

export default function Dashboard({ navigation }: any) {
  const profile = useStore((s) => s.profile);
  const diary = useStore((s) => s.diary);
  const checkins = useStore((s) => s.checkins);
  const insets = useSafeAreaInsets();
  const milestones = useStore((s) => s.milestones);
  const points = useStore((s) => s.points);

  const currentStreak = React.useMemo(() => {
    let streak = 0;
    const d = new Date();
    for (let i = 0; i < 365; i++) {
      const iso = new Date(d.getFullYear(), d.getMonth(), d.getDate() - i).toISOString().slice(0,10);
      if (checkins.some((c) => c.dateISO.slice(0,10) === iso)) streak++; else break;
    }
    return streak;
  }, [checkins]);

  const milestoneProgress = (m: any) => (m.kind === 'streak' ? currentStreak : checkins.length);
  const remainingFor = (m: any) => Math.max(0, (m.threshold ?? 0) - milestoneProgress(m));

  const recent = React.useMemo(() => (milestones || []).filter((m: any) => !!m.achievedAt).sort((a: any,b: any) => +new Date(b.achievedAt!) - +new Date(a.achievedAt!)), [milestones]);
  const upcoming = React.useMemo(() => (milestones || []).filter((m: any) => !m.achievedAt).sort((a: any,b: any) => remainingFor(a) - remainingFor(b)), [milestones, checkins, currentStreak]);

  const list = [...recent.slice(0,2), ...upcoming.slice(0,3)].slice(0,3);

  const last = lastUseAt(diary, profile.startedAt);
  const duration = formatDurationSince(last);
  const total = aggregate(profile, diary, 'all');

  const latest = checkins[0];
  const vals = {
    craving: normCravingPercent(latest?.mcq0_10),
    withdrawal: normWithdrawalPercent(latest?.cws0_50),
    sleep: normSleepPercent(latest?.isi2_0_8),
  };
  const weakest = weakestMetric(vals).key;

  function missionTitle(key: 'craving' | 'withdrawal' | 'sleep') {
    if (key === 'craving') return 'Urge Surfing: 3× 1 Minute';
    if (key === 'withdrawal') return 'Körper beruhigen: 4-7-8 Atmen ×3';
    return 'Schlafhygiene: Heute 30 Min früher ins Bett';
  }

  const heroHeight = 200;
  const [heroError, setHeroError] = useState(false);
  return (
    <ScrollView
      contentContainerStyle={{
        paddingHorizontal: spacing.xl as any,
        paddingTop: (insets.top || 0) + (spacing.l as any),
        paddingBottom: Math.max(spacing.l as any, insets.bottom || 0),
        gap: spacing.l as any,
      }}
    >
      <View style={{ borderRadius: radius.xl, overflow: 'hidden', height: heroHeight }}>
        {heroError ? (
          <View style={{ flex: 1, backgroundColor: colors.light.surface, justifyContent: 'flex-end' }}>
            {/* gradient overlay for readability */}
            <View style={{ position: 'absolute', left: 0, right: 0, top: 0, bottom: 0 }}>
              <Svg width="100%" height="100%">
                <Defs>
                  <LinearGradient id="heroGrad" x1="0" y1="0" x2="0" y2="1">
                    <Stop offset="0%" stopColor="#000" stopOpacity={0} />
                    <Stop offset="70%" stopColor="#000" stopOpacity={0} />
                    <Stop offset="100%" stopColor="#000" stopOpacity={0.15} />
                  </LinearGradient>
                </Defs>
                <Rect x="0" y="0" width="100%" height="100%" fill="url(#heroGrad)" />
              </Svg>
            </View>
            <View style={{ padding: 16 }}>
              <ThemedText kind="label">Rauchfreie Zeit</ThemedText>
              <ThemedText kind="h1" style={{ marginTop: 4 }}>{duration}</ThemedText>
            </View>
          </View>
        ) : (
          <ImageBackground
            source={HeroImage}
            resizeMode="cover"
            style={{ flex: 1, justifyContent: 'flex-end' }}
            onError={() => setHeroError(true)}
          >
            {/* gradient overlay for readability */}
            <View style={{ position: 'absolute', left: 0, right: 0, top: 0, bottom: 0 }}>
              <Svg width="100%" height="100%">
                <Defs>
                  <LinearGradient id="heroGrad" x1="0" y1="0" x2="0" y2="1">
                    <Stop offset="0%" stopColor="#000" stopOpacity={0} />
                    <Stop offset="70%" stopColor="#000" stopOpacity={0} />
                    <Stop offset="100%" stopColor="#000" stopOpacity={0.35} />
                  </LinearGradient>
                </Defs>
                <Rect x="0" y="0" width="100%" height="100%" fill="url(#heroGrad)" />
              </Svg>
            </View>
            <View style={{ padding: 16 }}>
              <ThemedText kind="label" style={{ color: 'white' }}>Rauchfreie Zeit</ThemedText>
              <ThemedText kind="h1" style={{ color: 'white', marginTop: 4 }}>{duration}</ThemedText>
            </View>
          </ImageBackground>
        )}
      </View>

      {/* Drei evidenzbasierte Kreise */}
      <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
        <ProgressDial value={vals.craving} label="Verlangen" />
        <ProgressDial value={vals.withdrawal} label="Entzug" />
        <ProgressDial value={vals.sleep} label="Schlaf" />
      </View>


      <Card>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <ThemedText kind="label" muted>Meilensteine</ThemedText>
          <PrimaryButton title="Alle anzeigen" onPress={() => navigation.getParent()?.navigate('Meilensteine')} />
        </View>
        <View style={{ marginTop: 8, gap: 10 }}>
          {list.length === 0 ? (
            <ThemedText muted>Keine Meilensteine vorhanden.</ThemedText>
          ) : (
            list.map((m: any) => (
              <View key={m.id} style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                  <ThemedText kind="h2">{m.icon ?? '🏅'}</ThemedText>
                  <View>
                    <ThemedText>{m.title}</ThemedText>
                    <ThemedText muted>{m.kind === 'streak' ? `Ziel: ${m.threshold} Tage` : `Ziel: ${m.threshold} Check-ins`}</ThemedText>
                  </View>
                </View>
                {m.achievedAt ? (
                  <View style={{ backgroundColor: '#D4AF37', paddingHorizontal: 10, paddingVertical: 6, borderRadius: radius.pill }}>
                    <ThemedText kind=\"label\" style={{ color: '#1F2937' }}>+{m.points}</ThemedText>
                  </View>
                ) : (
                  <View style={{ alignItems: 'center', justifyContent: 'center' }}>
                    <ProgressDial
                      value={Math.max(0, Math.min(1, ((m.kind==='streak'?currentStreak:(m.kind==='count'?checkins.length:total.moneySaved)) / (m.threshold || 1))))}
                      label={
och }
                      size={56}
                      stroke={6}
                      color={colors.light.primary}
                      track={colors.light.border}
                    />
                  </View>
                )}
              </View>
            ))
          )}
        </View>
      </Card>
 
      <Card>
        <ThemedText kind="label" muted>
          Gespartes Geld
        </ThemedText>
        <ThemedText kind="h1" style={{ marginTop: 6 }}>
          {`${total.moneySaved.toFixed(2)} ${profile.currency}`}
        </ThemedText>
      </Card>

      {/* Daily Check-in CTA (pastel color, larger, placed below) */}
      <Card
        style={{
          backgroundColor: colors.light.primaryMuted,
          borderColor: 'transparent',
          padding: (spacing.xl as any),
          minHeight: 140,
          justifyContent: 'center',
        }}
      >
        <ThemedText kind="label" muted>
          Daily Check-in
        </ThemedText>
        <ThemedText kind="h2" style={{ marginTop: 8 }}>
          Wie geht's dir heute?
        </ThemedText>
        <View style={{ height: 12 }} />
        <PrimaryButton
          title="Daily Check beginnen"
          onPress={() => navigation.getParent()?.navigate('Check-in')}
        />
      </Card>

      {/* Mini-Spiel Link */}
      <Card>
        <ThemedText kind="label" muted>
          Mini-Spiel
        </ThemedText>
        <ThemedText kind="h2" style={{ marginTop: 6 }}>
          Craving Tap
        </ThemedText>
        <View style={{ height: 12 }} />
        <PrimaryButton title="Jetzt spielen" onPress={() => navigation.navigate('Game')} />
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
          Die Mission für heute
        </ThemedText>
        <ThemedText style={{ color: 'white' }}>{missionTitle(weakest)}</ThemedText>
        <PrimaryButton
          title="Erkunden"
          onPress={() => navigation.getParent()?.navigate('Missionen', { focus: weakest })}
        />
      </View>
    </ScrollView>
  );
}





