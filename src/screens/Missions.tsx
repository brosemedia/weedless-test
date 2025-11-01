import React, { useMemo, useState, useRef, useEffect } from 'react';
import { View, FlatList, Pressable, Modal, Animated, Easing } from 'react-native';
import ReAnimated, { useSharedValue, useAnimatedProps, withRepeat, withTiming, Easing as ReEasing, cancelAnimation } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ThemedView, ThemedText, PrimaryButton, SectionHeader, Card } from '../design/theme';
import { spacing, radius } from '../design/tokens';
import Svg, { Defs, LinearGradient, Stop, Rect, Rect as SvgRect } from 'react-native-svg';
import { useStore, type Mission as MissionType } from '../store/useStore';

export default function Missions({ navigation, route }: any) {
  const insets = useSafeAreaInsets();
  const focus: 'craving' | 'withdrawal' | 'sleep' | undefined = route?.params?.focus;
  const missions = useStore((s) => s.missions);
  const setMissions = useStore((s) => s.setMissions);
  const completeMission = useStore((s) => s.completeMission);
  const points = useStore((s) => s.points);
  const [selected, setSelected] = useState<MissionType | null>(null);
  const maxPoints = (missions ?? []).reduce((sum, m) => sum + (m.points || 0), 0);

  function content(k: 'craving' | 'withdrawal' | 'sleep') {
    if (k === 'craving')
      return {
        title: 'Urge Surfing (3× 1 Min)',
        body:
          'Wenn Verlangen auftritt: Welle bemerken, benennen, bewusst atmen, ziehen lassen. Ziel: 3 kurze Durchgänge heute.',
      };
    if (k === 'withdrawal')
      return {
        title: '4-7-8 Atmen (×3)',
        body:
          '4s ein, 7s halten, 8s aus – 3 Durchgänge, beruhigt vegetatives Nervensystem und Entzugssymptome.',
      };
    return {
      title: 'Schlaf-Mini-Reset',
      body:
        '30 Min früher ins Bett, Bildschirm 60 Min vorher aus, Schlafzimmer kühl & dunkel.',
    };
  }
  const c = focus ? content(focus) : content('craving');
  // Seed some default missions if empty
  const defaults: MissionType[] = useMemo(
    () => [
      { id: 'm1', title: 'Urge Surfing', description: c.body, points: 10, icon: '🌊' },
      { id: 'm2', title: '4-7-8 Atmen', description: '3 Durchgänge bewusst atmen.', points: 8, icon: '🫁' },
      { id: 'm3', title: 'Schlaf Reset', description: 'Heute 30 Min früher ins Bett.', points: 7, icon: '🛌' },
      { id: 'm4', title: '10-Min Delay', description: 'Verzögere einen Impuls um 10 Min.', points: 5, icon: '⏳' },
      { id: 'm5', title: '5-Min Walk', description: 'Kurzer Spaziergang bei Trigger.', points: 5, icon: '🚶' },
      { id: 'm6', title: 'Tagebuch', description: '1 Trigger + Coping notieren.', points: 6, icon: '📝' },
    ],
    [c.body]
  );
  if (!missions || missions.length === 0) setMissions(defaults);

  function roundedRectPerimeter(w: number, h: number, r: number) {
    const straight = 2 * (w - 2 * r) + 2 * (h - 2 * r);
    const arcs = 2 * Math.PI * r;
    return straight + arcs;
  }

  // Karte mit Status-Darstellung und Puls-Animation für erledigte Missionen
  function MissionTile({ item, index, onPress }: { item: MissionType; index: number; onPress: () => void }) {
    const isDone = !!item.completedAt;
    // Pulsierender Rand (Gold) für erledigte Missionen
    const badgeScale = useRef(new Animated.Value(isDone ? 1 : 0)).current;
    const prevDoneRef = useRef(isDone);
    const breathe = useRef(new Animated.Value(0)).current;
    const [box, setBox] = useState<{ w: number; h: number }>({ w: 0, h: 150 });
    const stripeOffset = useSharedValue(0);
    const stripeOpacity = useSharedValue(0);
    const pulse = useSharedValue(0);
    const perimeter = useMemo(() => (box.w ? roundedRectPerimeter(box.w - 6, 150 - 6, (radius.l as number) - 3) : 0), [box.w]);
    const palette = useMemo(
      () => [
        ['#FDE2E4', '#FAD2E1'],
        ['#E0F2FE', '#BAE6FD'],
        ['#E9D5FF', '#DDD6FE'],
        ['#D1FAE5', '#A7F3D0'],
        ['#FEF3C7', '#FDE68A'],
        ['#E0E7FF', '#C7D2FE'],
        ['#DCFCE7', '#BBF7D0'],
        ['#FFE4E6', '#FBCFE8'],
      ],
      []
    );
    const idx = palette.length ? ((index * 3) % palette.length) : 0;
    const [c1, c2] = palette[idx] ?? ['#E0F2FE', '#BAE6FD'];
    const animatedLight = useAnimatedProps(() => ({ strokeOpacity: 0.3 + 0.5 * pulse.value }));
    const animatedDark = useAnimatedProps(() => ({ strokeOpacity: 0.7 - 0.5 * pulse.value }));

    useEffect(() => {
      // Pulsierender Gold-Rand (kein Schlange-Laufen)
      cancelAnimation(pulse);
      if (!isDone) return;
      pulse.value = 0;
      pulse.value = withRepeat(
        withTiming(1, { duration: 1400, easing: ReEasing.inOut(ReEasing.quad) }),
        -1,
        true
      );
      return () => cancelAnimation(pulse);
    }, [isDone]);

    useEffect(() => {
      if (isDone && !prevDoneRef.current) {
        Animated.spring(badgeScale, {
          toValue: 1,
          useNativeDriver: true,
          damping: 12,
          stiffness: 140,
          mass: 0.6,
        }).start();
      } else if (!isDone) {
        badgeScale.setValue(0);
      }
      prevDoneRef.current = isDone;
    }, [isDone, badgeScale]);

    useEffect(() => {
      // Grauer Pulsrand bei offenen Karten
      if (!isDone) {
        const loop = Animated.loop(
          Animated.sequence([
            Animated.timing(breathe, { toValue: 1, duration: 1600, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
            Animated.timing(breathe, { toValue: 0, duration: 1600, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
          ])
        );
        loop.start();
        return () => loop.stop();
      }
    }, [isDone]);

    return (
      <Pressable onPress={onPress} style={{ flex: 1 }} accessibilityRole="button">
        <View
          style={{
            borderRadius: radius.l,
            overflow: 'hidden',
            // Glow for completed
            ...(isDone
              ? {
                  shadowColor: '#22c55e',
                  shadowOpacity: 0.5,
                  shadowRadius: 18,
                  shadowOffset: { width: 0, height: 0 },
                  elevation: 8,
                }
              : {
                  shadowColor: '#000',
                  shadowOpacity: 0.08,
                  shadowRadius: 8,
                  shadowOffset: { width: 0, height: 2 },
                  elevation: 2,
                }),
          }}
          onLayout={(e) => setBox({ w: e.nativeEvent.layout.width, h: 150 })}
        >
          {isDone ? (
            <View>
              <Svg width="100%" height="150">
                <Defs>
                  {/* Cannabis-inspirierter Grünton-Verlauf */}
                  <LinearGradient id={'pastel-' + item.id} x1="0" y1="0" x2="1" y2="1">
                    <Stop offset="0%" stopColor={c1} />
                    <Stop offset="100%" stopColor={c2} />
                  </LinearGradient>
                </Defs>
                <Rect x="0" y="0" width="100%" height="100%" fill={'url(#pastel-' + item.id + ')'} />
              </Svg>
              {/* Pulsierender Gold-Rand in zwei Tönen */}
              <Svg width="100%" height="150" style={{ position: 'absolute', top: 0, left: 0 }} pointerEvents="none">
                {(() => {
                  const AnimatedRect = ReAnimated.createAnimatedComponent(SvgRect as any);
                  return (
                    <>
                      <SvgRect
                        x={0}
                        y={0}
                        width={box.w}
                        height={150}
                        rx={radius.l as number}
                        ry={radius.l as number}
                        stroke="#D4AF37"
                        strokeOpacity={0.4}
                        strokeWidth={3}
                        fill="transparent"
                      />
                      <AnimatedRect
                        animatedProps={animatedLight as any}
                        x={0}
                        y={0}
                        width={box.w}
                        height={150}
                        rx={radius.l as number}
                        ry={radius.l as number}
                        stroke="#FFE08A"
                        strokeWidth={4}
                        fill="transparent"
                      />
                      <AnimatedRect
                        animatedProps={animatedDark as any}
                        x={0}
                        y={0}
                        width={box.w}
                        height={150}
                        rx={radius.l as number}
                        ry={radius.l as number}
                        stroke="#CFA63A"
                        strokeWidth={4}
                        fill="transparent"
                      />
                    </>
                  );
                })()}
              </Svg>
            </View>
          ) : (
            <View style={{ width: '100%', height: 150, backgroundColor: '#E5E7EB' }}>
              </View>
          )}
          <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, paddingHorizontal: 14, paddingTop: 12, paddingBottom: 26 }}>
            {/* Icon in eigene obere Zeile */}
            <ThemedText kind="h2" style={{ marginBottom: 4, color: isDone ? '#0F172A' : '#111827' }}>
              {item.icon ? item.icon : '🍃'}
            </ThemedText>
            <ThemedText kind="h2" style={!isDone ? { color: '#111827' } : { color: '#0F172A' }}>
              {item.title}
            </ThemedText>
            <ThemedText muted style={{ marginTop: 4, ...(isDone ? { color: '#334155' } : { color: '#374151' }) }}>
              {(isDone ? (item.points || 0) : 0)}/{item.points || 0} Punkte
            </ThemedText>
            {isDone ? (
              <Animated.View
                style={{
                  marginTop: 8,
                  alignSelf: 'flex-start',
                  backgroundColor: '#D4AF37',
                  paddingHorizontal: 8,
                  paddingVertical: 4,
                  borderRadius: 999,
                  transform: [{ scale: badgeScale }],
                }}
              >
                <ThemedText kind="label" style={{ color: '#1F2937' }}>Abgeschlossen</ThemedText>
              </Animated.View>
            ) : (
              <View
                style={{
                  marginTop: 8,
                  alignSelf: 'flex-start',
                  backgroundColor: '#9CA3AF',
                  paddingHorizontal: 8,
                  paddingVertical: 4,
                  borderRadius: 999,
                }}
              >
                <ThemedText kind="label" style={{ color: 'white' }}>Offen</ThemedText>
              </View>
            )}
          </View>
          {!isDone ? (
            <Animated.View
              pointerEvents="none"
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                borderRadius: radius.l,
                borderWidth: 3,
                borderColor: '#9CA3AF',
                opacity: breathe.interpolate({ inputRange: [0, 1], outputRange: [0.35, 0.85] }),
                transform: [{ scale: breathe.interpolate({ inputRange: [0, 1], outputRange: [1, 1.03] }) }],
              }}
            />
          ) : null}
        </View>
      </Pressable>
    );
  }

  return (
    <ThemedView style={{ flex: 1 }}>
      <View
        style={{
          flex: 1,
          paddingHorizontal: spacing.xl as any,
          paddingTop: insets.top + (spacing.m as any),
          paddingBottom: Math.max(spacing.l as any, insets.bottom),
          gap: spacing.l as any,
        }}
      >
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <ThemedText kind="h2">Missionen</ThemedText>
                    <Card style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 6, paddingHorizontal: 10 }}>
            <ThemedText kind="h1" style={{ color: '#D4AF37', marginRight: 6 }}>{String.fromCodePoint(0x1F451)}</ThemedText>
            <ThemedText kind="h1" style={{ color: '#D4AF37' }}>{points}/{maxPoints}</ThemedText>
          </Card>
        </View>

        <FlatList
          data={missions}
          keyExtractor={(item) => item.id}
          numColumns={2}
          columnWrapperStyle={{ gap: spacing.m as any, marginBottom: spacing.m as any }}
          renderItem={({ item, index }) => (
            <MissionTile item={item} index={index} onPress={() => setSelected(item)} />
          )}
        />

        <PrimaryButton title="Zum Check-in" onPress={() => navigation?.navigate('Check-in')} />

        <Modal visible={!!selected} transparent animationType="fade" onRequestClose={() => setSelected(null)}>
          <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.25)', justifyContent: 'center', padding: spacing.xl }}>
            <View style={{ backgroundColor: 'white', borderRadius: radius.l, padding: spacing.l }}>
              <ThemedText kind="h2">{selected?.title}</ThemedText>
              <ThemedText style={{ marginTop: 8 }}>{selected?.description}</ThemedText>
              <View style={{ height: spacing.m as any }} />
              {selected?.completedAt ? (
                <ThemedText kind="label" muted>Bereits abgeschlossen</ThemedText>
              ) : (
                <PrimaryButton
                  title={`Abschließen +${selected?.points ?? 0} Punkte`}
                  onPress={() => {
                    if (selected) completeMission(selected.id);
                    setSelected(null);
                  }}
                />
              )}
              <View style={{ height: spacing.m as any }} />
              <PrimaryButton title="Schließen" onPress={() => setSelected(null)} />
            </View>
          </View>
        </Modal>
      </View>
    </ThemedView>
  );
}

