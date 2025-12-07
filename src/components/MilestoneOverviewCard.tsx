import React, { useCallback, useMemo, useRef, useState } from 'react';
import {
  View,
  Image,
  ScrollView,
  StyleSheet,
  NativeSyntheticEvent,
  NativeScrollEvent,
  LayoutChangeEvent,
  Animated,
  Pressable,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { ThemedText } from '../design/theme';
import { FrostedSurface } from '../design/FrostedSurface';
import { spacing, radius } from '../design/tokens';
import { useTheme } from '../theme/useTheme';
import { resolveMilestoneIcon } from '../data/milestones';
import ProgressDial from './ProgressDial';
import type { Milestone } from '../types/milestone';
import { formatXp } from '../lib/xp';
import type { ThemeColors } from '../theme/themes';

type MilestoneOverviewCardProps = {
  milestones: Milestone[];
  milestoneProgress: (m: Milestone) => number;
  onViewAll: () => void;
};

const formatDays = (value: number) => `${value} ${value === 1 ? 'Tag' : 'Tage'}`;
const clampValue = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value));

const CARD_WIDTH = 240;
const CARD_HEIGHT = 300;
const CARD_GAP = 18;
const CARD_SPACING = CARD_WIDTH + CARD_GAP;
const EDGE_PEEK = 12;
const EDGE_FADE_WIDTH = 22;
const EDGE_FADE_MARGIN = spacing.l as number;
const SCALED_CARD_HEIGHT = CARD_HEIGHT;
const CARD_VERTICAL_PADDING = spacing.l;
const ARROW_VERTICAL_OFFSET = CARD_VERTICAL_PADDING + SCALED_CARD_HEIGHT / 2 - 23;

const formatGoal = (milestone: Milestone) => {
  if (milestone.kind === 'streak') return `Ziel: ${formatDays(milestone.threshold || 0)}`;
  if (milestone.kind === 'count') return `Ziel: ${milestone.threshold} Tracken`;
  if (milestone.kind === 'money') return `Ziel: ${milestone.threshold.toLocaleString('de-DE')} € sparen`;
  return 'Ziel: Pause erfolgreich abschließen';
};

const formatRemaining = (milestone: Milestone, progressValue: number) => {
  const rawRemaining = Math.max(0, (milestone.threshold ?? 0) - progressValue);
  if (rawRemaining <= 0) return 'Bereit für XP';
  if (milestone.kind === 'money') return `Noch ${rawRemaining.toLocaleString('de-DE', { maximumFractionDigits: 0 })} €`;
  const remaining = Math.ceil(rawRemaining);
  if (milestone.kind === 'count') return `Noch ${remaining} Trackings`;
  if (milestone.kind === 'streak') return remaining === 1 ? 'Noch 1 Tag' : `Noch ${remaining} Tage`;
  return 'Pause abschließen';
};

const formatAchievementDate = (iso?: string | null) => {
  if (!iso) return 'Gerade erreicht';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return 'Gerade erreicht';
  const day = date.getDate().toString().padStart(2, '0');
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const year = date.getFullYear();
  return `Am ${day}.${month}.${year}`;
};

export function MilestoneOverviewCard({
  milestones,
  milestoneProgress,
  onViewAll,
}: MilestoneOverviewCardProps) {
  const { mode, theme } = useTheme();
  const palette = theme.colors;
  const styles = useMemo(() => createStyles(palette), [palette]);
  const [scrollOffset, setScrollOffset] = useState(0);
  const [scrollContentWidth, setScrollContentWidth] = useState(0);
  const [viewportWidth, setViewportWidth] = useState(0);
  const [currentIndex, setCurrentIndex] = useState(0);
  const scrollViewRef = useRef<Animated.ScrollView | null>(null);
  const scrollX = useRef(new Animated.Value(0)).current;
  const scrollLockRef = useRef(false);
  const horizontalInset = useMemo(() => {
    const sideBuffer = (spacing.xl as number) - CARD_GAP / 2;
    if (!viewportWidth) return Math.max(sideBuffer, spacing.l as number);
    const centerPadding = Math.max(0, (viewportWidth - CARD_WIDTH) / 2);
    return Math.max(sideBuffer, centerPadding);
  }, [viewportWidth]);
  const fadeStartColor = mode === 'dark' ? 'rgba(15,26,20,0.5)' : 'rgba(255,255,255,0.95)';
  const fadeEndColor = mode === 'dark' ? 'rgba(15,26,20,0)' : 'rgba(255,255,255,0)';

  const orderedMilestones = useMemo(() => {
    const achieved = milestones.filter((m) => !!m.achievedAt);
    const pending = milestones.filter((m) => !m.achievedAt);
    return achieved.concat(pending);
  }, [milestones]);

  const handleScroll = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      const { contentOffset, contentSize, layoutMeasurement } = event.nativeEvent;
      setScrollOffset(contentOffset.x);
      setScrollContentWidth(contentSize.width);
      setViewportWidth(layoutMeasurement.width);
      const approxIndex = Math.round(contentOffset.x / CARD_SPACING);
      const clampedIndex = clampValue(approxIndex, 0, Math.max(0, milestones.length - 1));
      setCurrentIndex(clampedIndex);
    },
    [milestones.length],
  );

  const handleContentSizeChange = useCallback((width: number) => {
    setScrollContentWidth(width);
  }, []);

  const handleLayout = useCallback((event: LayoutChangeEvent) => {
    setViewportWidth(event.nativeEvent.layout.width);
  }, []);

  const showLeftFade = scrollOffset > 12;
  const showRightFade = scrollContentWidth - (scrollOffset + viewportWidth) > 12;
  const showPrevArrow = milestones.length > 1 && currentIndex > 0;
  const showNextArrow = milestones.length > 1 && currentIndex < milestones.length - 1;

  const scrollToIndex = useCallback(
    (targetIndex: number) => {
      const clamped = clampValue(targetIndex, 0, Math.max(0, milestones.length - 1));
      const x = clamped * CARD_SPACING;
      scrollLockRef.current = true;
      scrollViewRef.current?.scrollTo({ x, animated: true });
    },
    [milestones.length],
  );

  const handleArrowPress = useCallback(
    (direction: 'prev' | 'next') => {
      const delta = direction === 'next' ? 1 : -1;
      scrollToIndex(currentIndex + delta);
    },
    [currentIndex, scrollToIndex],
  );

  const handleSnapToNearest = useCallback(
    (offsetX: number) => {
      const approxIndex = Math.round(offsetX / CARD_SPACING);
      scrollToIndex(approxIndex);
    },
    [scrollToIndex],
  );

  const handleMomentumEnd = useCallback(
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

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <ThemedText kind="h2">Meilensteine</ThemedText>
        <Pressable onPress={onViewAll} hitSlop={10}>
          <ThemedText kind="label" style={{ color: palette.primary }}>
            Alle anzeigen
          </ThemedText>
        </Pressable>
      </View>
      <View style={styles.carouselWrapper}>
        {milestones.length === 0 ? (
          <ThemedText muted>Keine Meilensteine vorhanden.</ThemedText>
        ) : (
          <Animated.ScrollView
            ref={scrollViewRef}
            horizontal
            decelerationRate="fast"
            showsHorizontalScrollIndicator={false}
            style={{ height: SCALED_CARD_HEIGHT, overflow: 'visible' }}
            contentContainerStyle={[
              styles.carouselContent,
              {
                paddingHorizontal: horizontalInset,
                paddingVertical: CARD_VERTICAL_PADDING,
                alignItems: 'center',
                minHeight: SCALED_CARD_HEIGHT,
              },
            ]}
            onScroll={Animated.event(
              [{ nativeEvent: { contentOffset: { x: scrollX } } }],
              {
                useNativeDriver: true,
                listener: handleScroll,
              },
            )}
            onContentSizeChange={handleContentSizeChange}
            onLayout={handleLayout}
            scrollEventThrottle={16}
            onMomentumScrollEnd={handleMomentumEnd}
            onScrollEndDrag={handleScrollEndDrag}
          >
            {orderedMilestones.map((m, index) => {
              const achieved = !!m.achievedAt;
              const progressValue = milestoneProgress(m);
              const target = m.threshold || 1;
              const completion = Math.max(0, Math.min(1, target ? progressValue / target : 1));
              const cardKey = `${m.id}-${achieved ? 'done' : 'next'}`;
              const cardCenter = index * CARD_SPACING;
              const inputRange = [cardCenter - CARD_SPACING, cardCenter, cardCenter + CARD_SPACING];
              const scale = scrollX.interpolate({
                inputRange,
                outputRange: [0.95, 1.07, 0.95],
                extrapolate: 'clamp',
              });
              const elevationOpacity = scrollX.interpolate({
                inputRange,
                outputRange: [0.7, 1, 0.7],
                extrapolate: 'clamp',
              });

              return (
                <View key={cardKey} style={styles.cardShell}>
                  <Animated.View
                    style={[
                      styles.cardAnimated,
                      { opacity: elevationOpacity, transform: [{ scale }] },
                    ]}
                  >
                    {achieved ? (
                    <View style={[styles.cardBase, styles.achievedCard]}>
                      <View style={styles.cardTopRow}>
                        {resolveMilestoneIcon(m.icon) ? (
                          <Image
                            source={resolveMilestoneIcon(m.icon)}
                            style={styles.cardIcon}
                            resizeMode="contain"
                          />
                        ) : (
                          <ThemedText kind="h2" style={styles.iconFallback}>
                            ⭐
                          </ThemedText>
                        )}
                        <View style={styles.xpBadge}>
                          <ThemedText kind="label" style={styles.xpBadgeTextDark}>
                            +{formatXp(m.xpReward ?? 0)} XP
                          </ThemedText>
                        </View>
                      </View>
                      <View style={styles.cardBody}>
                        <ThemedText kind="label" style={styles.reachedLabel}>
                          Meilenstein erreicht
                        </ThemedText>
                        <ThemedText kind="h2" style={styles.achievedTitle} numberOfLines={2}>
                          {m.title}
                        </ThemedText>
                        {m.description ? (
                          <ThemedText style={styles.achievedSubtitle} numberOfLines={2} muted>
                            {m.description}
                          </ThemedText>
                        ) : null}
                      </View>
                      <ThemedText kind="label" style={styles.reachedDate}>
                        {formatAchievementDate(m.achievedAt)}
                      </ThemedText>
                    </View>
                  ) : (
                    <FrostedSurface
                      borderRadius={radius.xl}
                      intensity={80}
                      fallbackColor="rgba(255,255,255,0.04)"
                      overlayColor="rgba(255,255,255,0.18)"
                      style={[styles.cardBase, styles.upcomingCard]}
                    >
                      <View style={styles.cardTopRow}>
                        {resolveMilestoneIcon(m.icon) ? (
                          <Image
                            source={resolveMilestoneIcon(m.icon)}
                            style={styles.cardIcon}
                            resizeMode="contain"
                          />
                        ) : (
                          <ThemedText kind="h2">⭐</ThemedText>
                        )}
                        <ProgressDial
                          value={completion}
                          size={60}
                          stroke={8}
                          color={palette.primary}
                          track={palette.border}
                          hideLabel
                          percentSize={16}
                          percentTextStyle={{ color: palette.primary }}
                        />
                      </View>
                      <View style={styles.cardBody}>
                        <ThemedText kind="label" style={styles.goalText}>
                          {formatGoal(m)}
                        </ThemedText>
                        <ThemedText kind="h2" numberOfLines={2}>
                          {m.title}
                        </ThemedText>
                        {m.description ? (
                          <ThemedText style={styles.bodyText} numberOfLines={2}>
                            {m.description}
                          </ThemedText>
                        ) : null}
                      </View>
                      <View>
                        <View style={styles.progressTrack}>
                          <View
                            style={[
                              styles.progressFill,
                              { width: `${Math.max(8, completion * 100)}%` },
                            ]}
                          />
                        </View>
                        <View style={styles.footerRow}>
                          <ThemedText kind="label" style={styles.remainingText} numberOfLines={1}>
                            {formatRemaining(m, progressValue)}
                          </ThemedText>
                          <View style={styles.xpBadge}>
                            <ThemedText kind="label" style={styles.xpBadgeText}>
                              +{formatXp(m.xpReward ?? 0)} XP
                            </ThemedText>
                          </View>
                        </View>
                      </View>
                    </FrostedSurface>
                  )}
                  </Animated.View>
                </View>
              );
            })}
          </Animated.ScrollView>
        )}
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
            <ThemedText kind="h2" style={styles.arrowLabel}>
              ‹
            </ThemedText>
          </Pressable>
        ) : null}
        {showNextArrow ? (
          <Pressable style={[styles.arrowButton, styles.arrowRight]} onPress={() => handleArrowPress('next')}>
            <ThemedText kind="h2" style={styles.arrowLabel}>
              ›
            </ThemedText>
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    container: {
      width: '100%',
      gap: spacing.m as any,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    carouselWrapper: {
      minHeight: SCALED_CARD_HEIGHT + CARD_VERTICAL_PADDING * 2,
      position: 'relative',
      paddingVertical: CARD_VERTICAL_PADDING,
      justifyContent: 'center',
      overflow: 'visible',
    },
    carouselContent: {
      paddingHorizontal: EDGE_PEEK,
      paddingBottom: spacing.s,
      alignItems: 'center',
      overflow: 'visible',
    },
    cardShell: {
      width: CARD_SPACING,
      height: SCALED_CARD_HEIGHT,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: CARD_GAP / 2,
    },
    cardAnimated: {
      width: CARD_WIDTH,
      height: '100%',
    },
  cardBase: {
    flex: 1,
    borderRadius: radius.xl,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.xl,
    borderWidth: 2,
    justifyContent: 'space-between',
    gap: spacing.s,
  },
    achievedCard: {
      borderColor: 'rgba(255,255,255,0.35)',
      backgroundColor: colors.primary,
    },
    upcomingCard: {
      borderColor: colors.primary,
    },
    cardTopRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    cardIcon: {
      width: 48,
      height: 48,
    },
    iconFallback: {
      color: '#FFFFFF',
    },
    cardBody: {
      gap: spacing.xs,
    },
    goalText: {
      fontSize: 12,
      letterSpacing: 0.3,
      textTransform: 'uppercase',
      color: colors.text,
      opacity: 0.8,
    },
    bodyText: {
      color: colors.text,
      opacity: 0.9,
    },
    reachedLabel: {
      color: 'rgba(255,255,255,0.85)',
    },
    achievedTitle: {
      color: '#FFFFFF',
    },
    achievedSubtitle: {
      color: 'rgba(255,255,255,0.85)',
    },
    reachedDate: {
      color: 'rgba(255,255,255,0.85)',
      textTransform: 'uppercase',
      letterSpacing: 1,
    },
    progressTrack: {
      height: 6,
      borderRadius: radius.pill,
      backgroundColor: colors.border,
    },
    progressFill: {
      height: 6,
      borderRadius: radius.pill,
      backgroundColor: colors.primary,
    },
    footerRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginTop: spacing.xs,
      gap: spacing.xs,
    },
    remainingText: {
      flex: 1,
      fontSize: 12,
      letterSpacing: 0.2,
      textTransform: 'uppercase',
      color: colors.text,
      opacity: 0.9,
    },
    xpBadge: {
      flexShrink: 0,
      borderRadius: radius.pill,
      paddingHorizontal: spacing.m,
      paddingVertical: spacing.xs,
      backgroundColor: colors.surface,
    },
    xpBadgeText: {
      color: colors.primary,
    },
    xpBadgeTextDark: {
      color: '#1F2937',
    },
  edgeFade: {
    position: 'absolute',
    width: EDGE_FADE_WIDTH + EDGE_FADE_MARGIN,
    top: 0,
    bottom: 0,
  },
    edgeFadeLeft: {
      left: -EDGE_FADE_MARGIN,
    },
    edgeFadeRight: {
      right: -EDGE_FADE_MARGIN,
    },
    arrowButton: {
      position: 'absolute',
      width: 46,
      height: 46,
      borderRadius: 23,
      backgroundColor: colors.surface,
      justifyContent: 'center',
      alignItems: 'center',
      shadowColor: 'rgba(0,0,0,0.4)',
      shadowOpacity: 0.25,
      shadowRadius: 8,
      shadowOffset: { width: 0, height: 4 },
      elevation: 4,
    },
    arrowLeft: {
      left: spacing.m as any,
      top: ARROW_VERTICAL_OFFSET,
    },
    arrowRight: {
      right: spacing.m as any,
      top: ARROW_VERTICAL_OFFSET,
    },
    arrowLabel: {
      color: colors.text,
    },
  });
