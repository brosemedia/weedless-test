import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Animated, LayoutChangeEvent, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { colors } from '../design/tokens';
import { FrostedSurface } from '../design/FrostedSurface';

// SOURCES summary: CB1 normalization (~2d start, ~4w normal); withdrawal peak 2–6d, most resolve by 1–3w;
// sleep issues can persist ~45d; respiratory symptoms improve over months after stopping smoking/vaping.

const palette = colors.light;
const CARD_BORDER = palette.primary;
const CARD_TEXT = palette.text;
const CARD_TEXT_REACHED = palette.surface;
const CARD_TEXT_MUTED = palette.textMuted;
const CARD_TEXT_MUTED_REACHED = 'rgba(255,255,255,0.9)';

const theme = {
  bg: palette.bg,
  card: palette.surface,
  text: palette.text,
  subtext: palette.textMuted,
  accent: palette.primary,
  line: 'rgba(161,166,31,0.25)',
};

const CARD_ANIM_DELAY = 90;
const CONNECTOR_HEIGHT = 8;
const CARD_GAP = 18;
const BASE_PADDING = 28;
const CARD_HEIGHT = 260;
const EDGE_PEEK = 16;

const MILESTONES = [
  { id: 'd2', day: 2, tag: 'Tag 2', icon: '🧠', title: 'CB1-Reset startet', note: 'Deine Rezeptoren wachen auf – System-Kaffee ist serviert.' },
  { id: 'w1', day: 7, tag: 'Woche 1', icon: '🌊', title: 'Peak? Fast geschafft', note: 'Tag 2–6 am stärksten. Du packst das – Tee, Luft & Ablenkung helfen.' },
  { id: 'w2', day: 14, tag: 'Woche 2', icon: '🗂️', title: 'Deutlich stabiler', note: 'Weniger Nervosität, mehr Klarheit – der Kopf sortiert Tabs.' },
  { id: 'w4', day: 28, tag: 'Woche 4', icon: '✨', title: 'CB1 ≈ normal, Kopf klarer', note: 'Viele Tests wieder im Normbereich. Brain-Fog auf dem Rückzug.' },
  { id: 'w6', day: 42, tag: 'Woche 6', icon: '😴', title: 'Schlaf wird dein Freund', note: 'Weniger Wachliegen, mehr Zzz – Snooze-Profi im Anflug.' },
  { id: 'm3', day: 90, tag: '3+ Monate', icon: '💨', title: 'Luft wird besser', note: 'Bei Ex-Rauchenden weniger Husten/Schleim. Treppen werden zahmer.' },
] as const;

type Milestone = (typeof MILESTONES)[number];

type Props = {
  sinceStartDays?: number;
  onCardPress?: (milestone: Milestone) => void;
};

const useCardAnimations = (count: number) => {
  const [animated] = useState(() => Array.from({ length: count }, () => new Animated.Value(0)));
  useEffect(() => {
    Animated.stagger(
      CARD_ANIM_DELAY,
      animated.map((anim) =>
        Animated.timing(anim, {
          toValue: 1,
          duration: 420,
          useNativeDriver: true,
        }),
      ),
    ).start();
  }, [animated]);
  return animated;
};

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

const reachedStyles = {
  connector: (reached: boolean) => ({
    backgroundColor: reached ? palette.primary : theme.line,
  }),
  axisDot: (reached: boolean) => ({
    borderColor: reached ? palette.primary : 'rgba(51,89,40,0.2)',
    backgroundColor: reached ? palette.primary : '#FFFFFF',
    opacity: reached ? 1 : 0.7,
  }),
};

export default function RecoveryTimeline({ sinceStartDays = 0, onCardPress }: Props) {
  const [viewportWidth, setViewportWidth] = useState(0);
  const cardGap = CARD_GAP;
  const basePadding = BASE_PADDING;
  const cardWidth = useMemo(() => {
    if (!viewportWidth) return 180;
    const available = viewportWidth - basePadding * 2 - cardGap * 2;
    const width = available / 3;
    if (!Number.isFinite(width) || width <= 0) return 180;
    return clamp(width, 150, 240);
  }, [viewportWidth, cardGap, basePadding]);
  const cardAnimations = useCardAnimations(MILESTONES.length);

  const handleLayout = useCallback((event: LayoutChangeEvent) => {
    setViewportWidth(event.nativeEvent.layout.width);
  }, []);

  const contentWidth = useMemo(
    () => MILESTONES.length * cardWidth + (MILESTONES.length - 1) * cardGap,
    [cardWidth, cardGap],
  );

  const paddedContentWidth = contentWidth + EDGE_PEEK * 2;

  const milestoneCenters = useMemo(
    () => MILESTONES.map((_, index) => index * (cardWidth + cardGap) + cardWidth / 2),
    [cardWidth, cardGap],
  );

  const paddedCenters = useMemo(() => milestoneCenters.map((c) => c + EDGE_PEEK), [milestoneCenters]);

  const progressRatio = useMemo(() => {
    if (MILESTONES.length <= 1) return 0;
    const clampedValue = clamp(sinceStartDays, 0, MILESTONES[MILESTONES.length - 1].day);
    for (let i = 0; i < MILESTONES.length - 1; i++) {
      const start = MILESTONES[i].day;
      const end = MILESTONES[i + 1].day;
      if (clampedValue <= end) {
        const span = Math.max(1, end - start);
        const frac = (clampedValue - start) / span;
        return (i + frac) / (MILESTONES.length - 1);
      }
    }
    return 1;
  }, [sinceStartDays]);

  const progressWidthRaw = EDGE_PEEK + progressRatio * contentWidth;
  const progressWidth = clamp(progressWidthRaw, EDGE_PEEK, paddedContentWidth);

  return (
    <View style={styles.wrapper} onLayout={handleLayout}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{
          paddingBottom: 16,
        }}
        decelerationRate="fast"
      >
        <View style={{ width: paddedContentWidth }}>
          <View style={[styles.cardsRow, { paddingHorizontal: EDGE_PEEK }]}>
            {MILESTONES.map((milestone, idx) => {
              const anim = cardAnimations[idx];
              const translateY = anim.interpolate({ inputRange: [0, 1], outputRange: [18, 0] });
              const reached = sinceStartDays >= milestone.day;
              return (
                <View
                  key={milestone.id}
                  style={{ width: cardWidth, marginRight: idx === MILESTONES.length - 1 ? 0 : cardGap }}
                >
                  <Animated.View style={{ opacity: anim, transform: [{ translateY }] }}>
                    <Pressable
                      accessibilityRole="button"
                      accessibilityLabel={`${milestone.tag}: ${milestone.title}`}
                      onPress={() => onCardPress?.(milestone)}
                      style={styles.cardShell}
                    >
                      <FrostedSurface
                        borderRadius={22}
                        intensity={reached ? 85 : 65}
                        fallbackColor={reached ? 'rgba(161,166,31,0.12)' : 'rgba(255,255,255,0.04)'}
                        overlayColor={reached ? 'rgba(161,166,31,0.32)' : 'rgba(255,255,255,0.18)'}
                        style={[
                          styles.card,
                          reached && styles.cardReached,
                        ]}
                      >
                        <Text style={[styles.tag, reached && styles.tagReached]}>
                          {milestone.tag.toUpperCase()}
                        </Text>
                        <Text style={styles.icon}>{milestone.icon}</Text>
                        <Text style={[styles.title, reached && styles.titleReached]}>{milestone.title}</Text>
                        <Text style={[styles.note, reached && styles.noteReached]}>{milestone.note}</Text>
                      </FrostedSurface>
                    </Pressable>
                  </Animated.View>
                  <View style={styles.connectorWrapper}>
                    <View style={[styles.connector, reachedStyles.connector(reached)]} />
                  </View>
                </View>
              );
            })}
          </View>

          <View style={[styles.axisContainer, { width: paddedContentWidth }]}>
            <View style={styles.axisTrack} />
            <View style={[styles.axisProgress, { width: progressWidth }]} />
            {paddedCenters.map((left, idx) => (
              <View key={MILESTONES[idx].id} style={[styles.axisTick, { left: left - 32 }]}>
                <View style={styles.axisTickMark} />
                <View style={[styles.axisDot, reachedStyles.axisDot(sinceStartDays >= MILESTONES[idx].day)]} />
                <Text style={styles.tickLabel}>{MILESTONES[idx].tag}</Text>
              </View>
            ))}
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <View style={styles.section}>
    <Text style={styles.sectionTitle}>{title}</Text>
    {children}
  </View>
);

export const DashboardSection = () => (
  <Section title="Erholung im Verlauf">
    <RecoveryTimeline sinceStartDays={0} />
  </Section>
);

// import { DashboardSection } from './RecoveryTimeline';
// <DashboardSection />

const styles = StyleSheet.create({
  wrapper: {
    paddingVertical: 2,
  },
  cardsRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    flexWrap: 'nowrap',
  },
  connectorWrapper: {
    alignItems: 'center',
    marginTop: 0,
  },
  connector: {
    width: 2,
    height: CONNECTOR_HEIGHT,
    backgroundColor: theme.line,
  },
  axisContainer: {
    marginTop: 4,
    height: 64,
    position: 'relative',
    justifyContent: 'flex-end',
  },
  axisTrack: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    height: 4,
    backgroundColor: theme.line,
  },
  axisProgress: {
    position: 'absolute',
    left: 0,
    top: 0,
    height: 4,
    borderRadius: 4,
    backgroundColor: theme.accent,
  },
  axisTick: {
    position: 'absolute',
    top: 0,
    alignItems: 'center',
    width: 64,
  },
  axisTickMark: {
    width: 2,
    height: 10,
    backgroundColor: theme.line,
  },
  axisDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    borderWidth: 2,
    marginTop: 4,
  },
  tickLabel: {
    marginTop: 4,
    fontSize: 11,
    color: palette.text,
    textAlign: 'center',
  },
  cardShell: {
    borderRadius: 22,
    height: CARD_HEIGHT,
    width: '100%',
    shadowColor: 'rgba(51, 89, 40, 0.18)',
    shadowOpacity: 1,
    shadowOffset: { width: 0, height: 8 },
    shadowRadius: 18,
    elevation: 4,
    backgroundColor: 'transparent',
    overflow: 'hidden',
  },
  card: {
    flex: 1,
    borderRadius: 22,
    borderWidth: 2,
    borderColor: palette.primary,
    paddingVertical: 20,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  cardReached: {
    borderColor: 'rgba(161,166,31,0.85)',
  },
  tag: {
    fontSize: 12,
    letterSpacing: 1,
    color: CARD_BORDER,
    marginBottom: 2,
    textAlign: 'center',
  },
  tagReached: {
    color: CARD_TEXT_REACHED,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: CARD_TEXT,
    textAlign: 'center',
  },
  titleReached: {
    color: CARD_TEXT_REACHED,
  },
  icon: {
    fontSize: 38,
    marginBottom: 4,
  },
  note: {
    fontSize: 13,
    lineHeight: 18,
    color: CARD_TEXT_MUTED,
    textAlign: 'center',
  },
  noteReached: {
    color: CARD_TEXT_MUTED_REACHED,
  },
  section: {
    backgroundColor: theme.bg,
    borderRadius: 18,
    padding: 16,
    gap: 12,
  },
  sectionTitle: {
    color: theme.text,
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
  },
});
