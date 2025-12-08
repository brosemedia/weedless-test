import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Animated, LayoutChangeEvent, NativeScrollEvent, NativeSyntheticEvent, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { FrostedSurface } from '../design/FrostedSurface';
import { useTheme } from '../theme/useTheme';
import { useThemedStyles } from '../theme/useThemedStyles';
import type { ThemeColors } from '../theme/themes';
import { recoveryMilestonesDe } from '../data/recoveryMilestones.de';
import { RecoveryMilestoneModal } from './RecoveryMilestoneModal';
import type { RecoveryMilestone } from '../types/recoveryMilestone';
import { spacing } from '../design/tokens';

const CARD_ANIM_DELAY = 90;
const CONNECTOR_HEIGHT = 8;
const CARD_GAP = 28;
const BASE_PADDING = 28;
const CARD_HEIGHT = 300;
const EDGE_PEEK = 16;
const EDGE_FADE_WIDTH = 28;
const CARD_SCALE_MAX = 1.06;
const ACTIVE_CARD_EXTRA_WIDTH = 34;
const SCALED_CARD_HEIGHT = CARD_HEIGHT * CARD_SCALE_MAX;
const CARD_VERTICAL_PADDING = (SCALED_CARD_HEIGHT - CARD_HEIGHT) / 2 + 8;
const ARROW_VERTICAL_OFFSET = CARD_VERTICAL_PADDING + SCALED_CARD_HEIGHT / 2 - 22;
const MIN_SIDE_PADDING = spacing.l;
const EDGE_FADE_MARGIN = spacing.l;
// Gradient colors from login screen
const GRADIENT_START = '#1B5E20';
const GRADIENT_END = '#4CAF50';

type Props = {
  sinceStartDays?: number;
  onCardPress?: (milestone: RecoveryMilestone) => void;
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

export default function RecoveryTimeline({ sinceStartDays = 0, onCardPress }: Props) {
  const [selectedMilestone, setSelectedMilestone] = useState<RecoveryMilestone | null>(null);
  const milestones = recoveryMilestonesDe;
  const { theme } = useTheme();
  const palette = theme.colors;
  const styles = useThemedStyles(createStyles);
  const reachedStyles = useMemo(() => createReachedStyles(palette), [palette]);
  const frostedTint = theme.mode === 'dark' ? 'dark' : 'light';
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
  const expandedCardWidth = cardWidth + ACTIVE_CARD_EXTRA_WIDTH;
  const cardSpacing = cardWidth + cardGap + ACTIVE_CARD_EXTRA_WIDTH;
  const horizontalInset = useMemo(
    () => Math.max((viewportWidth - cardSpacing) / 2, EDGE_PEEK),
    [viewportWidth, cardSpacing],
  );
  const outerPadding = Math.max(horizontalInset - EDGE_PEEK, MIN_SIDE_PADDING);
  const fadeStartColor = theme.mode === 'dark' ? 'rgba(15,26,20,0.5)' : 'rgba(255,255,255,0.96)';
  const fadeEndColor = theme.mode === 'dark' ? 'rgba(15,26,20,0)' : 'rgba(255,255,255,0)';
  const cardAnimations = useCardAnimations(milestones.length);
  const reachedCardBackground = theme.mode === 'dark' ? 'rgba(143,177,58,0.18)' : 'rgba(161,166,31,0.12)';
  const baseCardBackground = theme.mode === 'dark' ? 'rgba(26,40,31,0.9)' : 'rgba(255,255,255,0.06)';
  const reachedOverlay = theme.mode === 'dark' ? 'rgba(143,177,58,0.28)' : 'rgba(161,166,31,0.32)';
  const baseOverlay = theme.mode === 'dark' ? 'rgba(15,26,20,0.7)' : 'rgba(255,255,255,0.18)';
  const scrollX = useRef(new Animated.Value(0)).current;
  const scrollViewRef = useRef<ScrollView | null>(null);
  const scrollLockRef = useRef(false);
  const [currentIndex, setCurrentIndex] = useState(0);

  const handleLayout = useCallback((event: LayoutChangeEvent) => {
    setViewportWidth(event.nativeEvent.layout.width);
  }, []);

  const scrollToIndex = useCallback(
    (targetIndex: number) => {
      const clampedIndex = clamp(targetIndex, 0, Math.max(0, milestones.length - 1));
      const x = clampedIndex * cardSpacing;
      scrollLockRef.current = true;
      scrollViewRef.current?.scrollTo({ x, animated: true });
      setCurrentIndex(clampedIndex);
    },
    [cardSpacing, milestones.length],
  );

  const handleScrollEvent = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      const offset = event.nativeEvent.contentOffset.x;
      const approxIndex = Math.round(offset / cardSpacing);
      setCurrentIndex(clamp(approxIndex, 0, Math.max(0, milestones.length - 1)));
    },
    [cardSpacing, milestones.length],
  );

  const handleSnapToNearest = useCallback(
    (offsetX: number) => {
      const approxIndex = Math.round(offsetX / cardSpacing);
      scrollToIndex(approxIndex);
    },
    [cardSpacing, scrollToIndex],
  );

  const handleMomentumScrollEnd = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      const offset = event.nativeEvent.contentOffset.x;
      if (scrollLockRef.current) {
        scrollLockRef.current = false;
        return;
      }
      handleSnapToNearest(offset);
    },
    [handleSnapToNearest],
  );

  const handleScrollEndDrag = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      const velocityX = event.nativeEvent.velocity?.x ?? 0;
      const offset = event.nativeEvent.contentOffset.x;
      if (Math.abs(velocityX) > 0.05) {
        const direction = velocityX > 0 ? 1 : -1;
        scrollToIndex(currentIndex + direction);
        return;
      }
      handleSnapToNearest(offset);
    },
    [currentIndex, handleSnapToNearest, scrollToIndex],
  );

  const showLeftFade = currentIndex > 0;
  const showRightFade = currentIndex < milestones.length - 1;
  const showPrevArrow = milestones.length > 1 && currentIndex > 0;
  const showNextArrow = milestones.length > 1 && currentIndex < milestones.length - 1;
  const handleArrowPress = useCallback(
    (direction: 'prev' | 'next') => {
      const delta = direction === 'next' ? 1 : -1;
      scrollToIndex(currentIndex + delta);
    },
    [currentIndex, scrollToIndex],
  );

  const contentWidth = useMemo(
    () => milestones.length * cardSpacing,
    [milestones.length, cardSpacing],
  );

  const paddedContentWidth = contentWidth + EDGE_PEEK * 2;
  const axisWidth = paddedContentWidth + outerPadding * 2;

  const milestoneCenters = useMemo(
    () => milestones.map((_, index) => index * cardSpacing + cardSpacing / 2),
    [milestones.length, cardSpacing],
  );

  const paddedCenters = useMemo(
    () => milestoneCenters.map((c) => c + EDGE_PEEK + outerPadding),
    [milestoneCenters, outerPadding],
  );

  const progressRatio = useMemo(() => {
    if (milestones.length <= 1 || contentWidth === 0) return 0;
    const clampedValue = clamp(sinceStartDays, 0, milestones[milestones.length - 1].day);
    
    // Finde den Bereich, in dem sich der aktuelle Tag befindet
    for (let i = 0; i < milestones.length - 1; i++) {
      const startDay = milestones[i].day;
      const endDay = milestones[i + 1].day;
      
      if (clampedValue <= endDay) {
        const span = Math.max(1, endDay - startDay);
        const progress = clampedValue - startDay;
        const frac = Math.min(1, Math.max(0, progress / span));
        
        // Verwende die tatsächlichen visuellen Positionen der Meilensteine
        const startCenter = milestoneCenters[i];
        const endCenter = milestoneCenters[i + 1];
        const currentCenter = startCenter + frac * (endCenter - startCenter);
        
        // Konvertiere die Pixel-Position in ein Verhältnis
        return currentCenter / contentWidth;
      }
    }
    
    // Wenn wir über dem letzten Meilenstein sind, zeige 100%
    return 1;
  }, [sinceStartDays, contentWidth, milestoneCenters, milestones]);

  const progressWidthRaw = EDGE_PEEK + outerPadding + progressRatio * contentWidth;
  const progressWidth = clamp(progressWidthRaw, EDGE_PEEK + outerPadding, axisWidth);

  const handleCardPress = useCallback((milestone: RecoveryMilestone) => {
    setSelectedMilestone(milestone);
    onCardPress?.(milestone);
  }, [onCardPress]);

  const handleCloseModal = useCallback(() => {
    setSelectedMilestone(null);
  }, []);

  return (
    <>
      <View style={styles.wrapper} onLayout={handleLayout}>
      <Animated.ScrollView
        ref={scrollViewRef as any}
        horizontal
        showsHorizontalScrollIndicator={false}
        style={{ minHeight: SCALED_CARD_HEIGHT + CARD_VERTICAL_PADDING * 2 + 12, overflow: 'visible' }}
        contentContainerStyle={{
          paddingBottom: 16,
          paddingHorizontal: outerPadding,
          paddingVertical: CARD_VERTICAL_PADDING,
          minHeight: SCALED_CARD_HEIGHT + 16,
          alignItems: 'center',
        }}
        decelerationRate="fast"
        onScroll={Animated.event([{ nativeEvent: { contentOffset: { x: scrollX } } }], {
          useNativeDriver: true,
          listener: handleScrollEvent,
        })}
        onScrollEndDrag={handleScrollEndDrag}
        onMomentumScrollEnd={handleMomentumScrollEnd}
        scrollEventThrottle={16}
      >
        <View style={{ width: paddedContentWidth }}>
          <View style={[styles.cardsRow, { paddingHorizontal: EDGE_PEEK }]}>
            {milestones.map((milestone, idx) => {
              const anim = cardAnimations[idx];
              const translateY = anim.interpolate({ inputRange: [0, 1], outputRange: [18, 0] });
              const reached = sinceStartDays >= milestone.day;
              const cardOffset = idx * cardSpacing;
              const inputRange = [cardOffset - cardSpacing, cardOffset, cardOffset + cardSpacing];
              const scale = scrollX.interpolate({
                inputRange,
                outputRange: [0.9, CARD_SCALE_MAX, 0.9],
                extrapolate: 'clamp',
              });
              const rotateY = scrollX.interpolate({
                inputRange,
                outputRange: ['8deg', '0deg', '-8deg'],
                extrapolate: 'clamp',
              });
              const baseWidth = cardWidth + ACTIVE_CARD_EXTRA_WIDTH;
              const baseScaleX = cardWidth / baseWidth;
              const widthScale = scrollX.interpolate({
                inputRange,
                outputRange: [baseScaleX, 1, baseScaleX],
                extrapolate: 'clamp',
              });
              const halfGap = cardGap / 2;
              return (
                <View
                  key={milestone.id}
                  style={{
                    width: cardSpacing,
                    alignItems: 'center',
                    paddingHorizontal: cardGap / 2,
                  }}
                >
                  <Animated.View
                    style={{
                      opacity: anim,
                      transform: [
                        { perspective: 900 },
                        { translateY },
                        { scaleY: scale },
                        { rotateY },
                        { scaleX: widthScale },
                      ],
                      width: expandedCardWidth,
                    }}
                  >
                    <Pressable
                      accessibilityRole="button"
                      accessibilityLabel={`${milestone.timeLabel}: ${milestone.title}`}
                      onPress={() => handleCardPress(milestone)}
                      style={styles.cardShell}
                    >
                      {reached ? (
                        <LinearGradient
                          colors={[GRADIENT_END, GRADIENT_START]}
                          start={{ x: 0, y: 0 }}
                          end={{ x: 0, y: 1 }}
                          style={[styles.card, styles.cardReached]}
                        >
                          <View style={styles.cardHeader}>
                            <Text style={[styles.tag, styles.tagReached]}>
                              {milestone.timeLabel.toUpperCase()}
                            </Text>
                          </View>
                          {milestone.emoji ? (
                            <Text style={styles.icon}>{milestone.emoji}</Text>
                          ) : null}
                          <Text style={[styles.title, styles.titleReached]} numberOfLines={5} ellipsizeMode="tail">
                            {milestone.title}
                          </Text>
                          <Text style={[styles.note, styles.noteReached]} numberOfLines={5} ellipsizeMode="tail">
                            {milestone.subtitle}
                          </Text>
                          <Pressable onPress={() => handleCardPress(milestone)} style={[styles.readMoreButton, styles.readMoreButtonReached]}>
                            <Text style={[styles.readMoreLabel, styles.readMoreLabelReached]}>Mehr lesen</Text>
                          </Pressable>
                        </LinearGradient>
                      ) : (
                        <FrostedSurface
                          borderRadius={22}
                          intensity={65}
                          fallbackColor={baseCardBackground}
                          overlayColor={baseOverlay}
                          tint={frostedTint}
                          style={styles.card}
                        >
                          <View style={styles.cardHeader}>
                            <Text style={styles.tag}>
                              {milestone.timeLabel.toUpperCase()}
                            </Text>
                          </View>
                          {milestone.emoji ? (
                            <Text style={styles.icon}>{milestone.emoji}</Text>
                          ) : null}
                          <Text style={styles.title} numberOfLines={5} ellipsizeMode="tail">
                            {milestone.title}
                          </Text>
                          <Text style={styles.note} numberOfLines={5} ellipsizeMode="tail">
                            {milestone.subtitle}
                          </Text>
                          <Pressable onPress={() => handleCardPress(milestone)} style={styles.readMoreButton}>
                            <Text style={styles.readMoreLabel}>Mehr lesen</Text>
                          </Pressable>
                        </FrostedSurface>
                      )}
                    </Pressable>
                  </Animated.View>
                  <View style={styles.connectorWrapper}>
                    <View style={[styles.connector, reachedStyles.connector(reached)]} />
                  </View>
                </View>
              );
            })}
          </View>

          <View
            style={[
              styles.axisContainer,
              {
                width: axisWidth,
                marginLeft: -outerPadding,
                marginRight: -outerPadding,
              },
            ]}
          >
            <View style={styles.axisTrack} />
            <View style={[styles.axisProgress, { width: progressWidth }]} />
            {paddedCenters.map((left, idx) => (
              <View key={milestones[idx].id} style={[styles.axisTick, { left: left - 32 }]}>
                <View style={styles.axisTickMark} />
                <View style={[styles.axisDot, reachedStyles.axisDot(sinceStartDays >= milestones[idx].day)]} />
                <Text style={styles.tickLabel}>{milestones[idx].timeLabel}</Text>
              </View>
            ))}
          </View>
        </View>
      </Animated.ScrollView>
      {showLeftFade ? (
        <LinearGradient
          pointerEvents="none"
          colors={[fadeStartColor, fadeEndColor]}
          start={{ x: 0, y: 0.5 }}
          end={{ x: 1, y: 0.5 }}
          style={[styles.edgeFade, styles.edgeFadeLeft]}
        />
      ) : null}
      {showRightFade ? (
        <LinearGradient
          pointerEvents="none"
          colors={[fadeEndColor, fadeStartColor]}
          start={{ x: 0, y: 0.5 }}
          end={{ x: 1, y: 0.5 }}
          style={[styles.edgeFade, styles.edgeFadeRight]}
        />
      ) : null}
      {showPrevArrow ? (
        <Pressable style={[styles.arrowButton, styles.arrowLeft]} onPress={() => handleArrowPress('prev')}>
          <Text style={styles.arrowLabel}>‹</Text>
        </Pressable>
      ) : null}
      {showNextArrow ? (
        <Pressable style={[styles.arrowButton, styles.arrowRight]} onPress={() => handleArrowPress('next')}>
          <Text style={styles.arrowLabel}>›</Text>
        </Pressable>
      ) : null}
      </View>
      <RecoveryMilestoneModal
        visible={selectedMilestone !== null}
        milestone={selectedMilestone}
        onClose={handleCloseModal}
      />
    </>
  );
}

const Section = ({ title, children }: { title: string; children: React.ReactNode }) => {
  const sectionStyles = useThemedStyles(createSectionStyles);
  return (
    <View style={sectionStyles.section}>
      <Text style={sectionStyles.sectionTitle}>{title}</Text>
      {children}
    </View>
  );
};

export const DashboardSection = () => (
  <Section title="Erholung im Verlauf">
    <RecoveryTimeline sinceStartDays={0} />
  </Section>
);

// import { DashboardSection } from './RecoveryTimeline';
// <DashboardSection />

const createSectionStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    section: {
      backgroundColor: colors.cardBg,
      borderRadius: 18,
      padding: 16,
      gap: 12,
    },
    sectionTitle: {
      color: colors.text,
      fontSize: 18,
      fontWeight: '600',
      marginBottom: 8,
    },
  });

const createReachedStyles = (colors: ThemeColors) => ({
  connector: (reached: boolean) => ({
    backgroundColor: reached ? colors.primary : colors.border,
  }),
  axisDot: (reached: boolean) => ({
    borderColor: reached ? colors.primary : colors.border,
    backgroundColor: reached ? colors.primary : colors.surface,
    opacity: reached ? 1 : 0.7,
  }),
});

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    wrapper: {
      paddingVertical: CARD_VERTICAL_PADDING,
      position: 'relative',
      overflow: 'visible',
    },
    cardsRow: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      flexWrap: 'nowrap',
      paddingVertical: CARD_VERTICAL_PADDING - 2,
      minHeight: SCALED_CARD_HEIGHT + CARD_VERTICAL_PADDING * 2,
    },
    connectorWrapper: {
      alignItems: 'center',
      marginTop: 0,
    },
    connector: {
      width: 2,
      height: CONNECTOR_HEIGHT,
      backgroundColor: colors.border,
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
      backgroundColor: colors.border,
    },
    axisProgress: {
      position: 'absolute',
      left: 0,
      top: 0,
      height: 4,
      borderRadius: 4,
      backgroundColor: colors.primary,
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
      backgroundColor: colors.border,
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
      color: colors.text,
      textAlign: 'center',
    },
    cardShell: {
      borderRadius: 22,
      minHeight: SCALED_CARD_HEIGHT,
      width: '100%',
      shadowColor: colors.primary,
      shadowOpacity: 0.25,
      shadowOffset: { width: 0, height: 8 },
      shadowRadius: 18,
      elevation: 4,
      backgroundColor: 'transparent',
      overflow: 'visible',
    },
    card: {
      flex: 1,
      borderRadius: 22,
      borderWidth: 2,
      borderColor: colors.primary,
      paddingVertical: 20,
      paddingHorizontal: 16,
      alignItems: 'center',
      justifyContent: 'center',
      gap: 10,
      minHeight: SCALED_CARD_HEIGHT - 20,
    },
    cardHeader: {
      width: '100%',
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingTop: 0,
      marginBottom: 2,
    },
    cardReached: {
      borderColor: 'rgba(255, 255, 255, 0.3)',
    },
    tag: {
      fontSize: 12,
      letterSpacing: 1,
      color: colors.primary,
      marginBottom: 2,
      textAlign: 'center',
    },
    tagReached: {
      color: 'rgba(255, 255, 255, 0.9)',
    },
    title: {
      fontSize: 16,
      lineHeight: 20,
      fontWeight: '700',
      color: colors.text,
      textAlign: 'center',
    },
    titleReached: {
      color: '#FFFFFF',
    },
    icon: {
      fontSize: 38,
      marginBottom: 4,
    },
    note: {
      fontSize: 13,
      lineHeight: 18,
      color: colors.text,
      textAlign: 'center',
    },
    noteReached: {
      color: 'rgba(255, 255, 255, 0.95)',
    },
    readMoreButton: {
      marginTop: 8,
      paddingHorizontal: 14,
      paddingVertical: 8,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.primary,
      backgroundColor: colors.surface,
    },
    readMoreButtonReached: {
      borderColor: '#FFFFFF',
      backgroundColor: 'rgba(255,255,255,0.14)',
    },
    readMoreLabel: {
      fontSize: 13,
      fontWeight: '600',
      color: colors.text,
    },
    readMoreLabelReached: {
      color: '#FFFFFF',
    },
    edgeFade: {
      position: 'absolute',
      top: 0,
      bottom: 0,
      width: EDGE_FADE_WIDTH + EDGE_FADE_MARGIN,
      zIndex: 2,
    },
    edgeFadeLeft: {
      left: -EDGE_FADE_MARGIN,
    },
    edgeFadeRight: {
      right: -EDGE_FADE_MARGIN,
    },
    arrowButton: {
      position: 'absolute',
      width: 44,
      height: 44,
      borderRadius: 22,
      backgroundColor: colors.surface,
      justifyContent: 'center',
      alignItems: 'center',
      shadowColor: 'rgba(0,0,0,0.35)',
      shadowOpacity: 0.3,
      shadowRadius: 10,
      shadowOffset: { width: 0, height: 6 },
      elevation: 5,
      top: ARROW_VERTICAL_OFFSET,
      zIndex: 3,
    },
    arrowLeft: {
      left: 4,
    },
    arrowRight: {
      right: 4,
    },
    arrowLabel: {
      color: colors.text,
      fontSize: 26,
      fontWeight: '700',
    },
  });
