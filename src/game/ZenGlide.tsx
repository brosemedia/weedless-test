import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  AccessibilityInfo,
  ImageBackground,
  LayoutChangeEvent,
  Image,
  Pressable,
  StatusBar,
  Text,
  useWindowDimensions,
  View,
  StyleSheet,
  Platform,
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, { useAnimatedStyle, runOnJS, type SharedValue } from 'react-native-reanimated';
import { Asset } from 'expo-asset';
import ConfettiCannon from 'react-native-confetti-cannon';
import { colors, spacing, radius, fontSizes, fontWeights } from '../design/tokens';
import Plane from './components/Plane';
import { useZenGlideEngine } from './hooks/useZenGlideEngine';
import { makeStepper, MAX_FRAME_DT, HITBOX_SHRINK } from './physics';
import type { SessionResult, Obstacle } from './types';
import { saveZenGlideResult, getZenGlideHistory } from '../storage/zenGlide';
import { track } from '../onboarding/services/analytics';
import { useApp } from '../store/app';
import { TASK_XP } from '../lib/tasks';
import { useUiStore } from '../store/ui';
import { haptics } from '../services/haptics';

const OBSTACLE_ASSET = require('../../assets/zenglide/obstacle.webp');
const BACKGROUND_ASSET = require('../../assets/game_bg1.png');

const AnimatedImage = Animated.createAnimatedComponent(Image);

type Area = { width: number; height: number };


const formatDuration = (seconds: number) => {
  const whole = Math.max(0, Math.floor(seconds));
  const mins = Math.floor(whole / 60);
  const secs = whole % 60;
  return mins > 0 ? `${mins}m ${secs}s` : `${secs}s`;
};

type ObstaclePairProps = {
  index: number;
  obstacles: SharedValue<Obstacle[]>;
  useFallback?: boolean;
};

const ObstaclePair: React.FC<ObstaclePairProps> = ({ index, obstacles, useFallback }) => {
  const topStyle = useAnimatedStyle(() => {
    'worklet';
    const data = obstacles.value[index];
    if (!data || !data.active) {
      return { opacity: 0 };
    }
    if (data.topRect.h <= 0) {
      return { opacity: 0 };
    }
    return {
      opacity: 0.95,
      left: data.topRect.x,
      top: 0, // Immer ganz oben
      width: data.topRect.w,
      height: data.topRect.h, // Volle Höhe
    };
  });

  const bottomStyle = useAnimatedStyle(() => {
    'worklet';
    const data = obstacles.value[index];
    if (!data || !data.active) {
      return { opacity: 0 };
    }
    if (data.bottomRect.h <= 0) {
      return { opacity: 0 };
    }
    return {
      opacity: 0.95,
      left: data.bottomRect.x,
      top: data.bottomRect.y, // Startet bei gapBottomEdge
      width: data.bottomRect.w,
      height: data.bottomRect.h, // Volle Höhe bis ganz nach unten
    };
  });

  return (
    <>
      {useFallback ? (
        <>
          <Animated.View
            style={[
              styles.obstacle,
              styles.obstacleTop,
              styles.obstacleFallback,
              topStyle,
            ]}
          />
          <Animated.View
            style={[
              styles.obstacle,
              styles.obstacleBottom,
              styles.obstacleFallback,
              bottomStyle,
            ]}
          />
        </>
      ) : (
        <>
          <AnimatedImage
            source={OBSTACLE_ASSET}
            style={[
              styles.obstacle,
              styles.obstacleTop,
              topStyle,
            ]}
            resizeMode="stretch"
          />
          <AnimatedImage
            source={OBSTACLE_ASSET}
            style={[
              styles.obstacle,
              styles.obstacleBottom,
              bottomStyle,
            ]}
            resizeMode="stretch"
          />
        </>
      )}
    </>
  );
};

type ObstacleHitboxPairProps = {
  index: number;
  obstacles: SharedValue<Obstacle[]>;
};

const ObstacleHitboxPair: React.FC<ObstacleHitboxPairProps> = ({ index, obstacles }) => {
  const topStyle = useAnimatedStyle(() => {
    'worklet';
    const data = obstacles.value[index];
    if (!data || !data.active) {
      return { opacity: 0 };
    }
    if (data.topRect.h <= 0) {
      return { opacity: 0 };
    }
    // Hitbox genau so groß wie visuelles Objekt
    return {
      opacity: 0.9,
      left: data.topRect.x,
      top: 0, // Immer ganz oben für Hitbox
      width: data.topRect.w,
      height: data.topRect.h, // Volle Höhe
    };
  });

  const bottomStyle = useAnimatedStyle(() => {
    'worklet';
    const data = obstacles.value[index];
    if (!data || !data.active) {
      return { opacity: 0 };
    }
    if (data.bottomRect.h <= 0) {
      return { opacity: 0 };
    }
    // Hitbox genau so groß wie visuelles Objekt
    return {
      opacity: 0.9,
      left: data.bottomRect.x,
      top: data.bottomRect.y,
      width: data.bottomRect.w,
      height: data.bottomRect.h, // Volle Höhe
    };
  });

  return (
    <>
      <Animated.View pointerEvents="none" style={[styles.hitboxRect, topStyle]} />
      <Animated.View pointerEvents="none" style={[styles.hitboxRect, bottomStyle]} />
    </>
  );
};

export default function ZenGlide() {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const win = useWindowDimensions();
  const markTaskDone = useApp((s) => s.markTaskDone);

  const [assetsLoaded, setAssetsLoaded] = useState(false);
  const [reduceMotion, setReduceMotion] = useState(false);
  const [feedbackEnabled, setFeedbackEnabled] = useState(true);
  const [lastResult, setLastResult] = useState<SessionResult | null>(null);
  const [useFallbackSprites, setUseFallbackSprites] = useState(false);
  const [topRuns, setTopRuns] = useState<SessionResult[]>([]);
  const [showConfetti, setShowConfetti] = useState(false);
  const [isNewHighScore, setIsNewHighScore] = useState(false);
  const [showHitboxes, setShowHitboxes] = useState(__DEV__);

  const areaRef = useRef<Area>({ width: win.width, height: win.height });
  const [area, setArea] = useState<Area>({ width: win.width, height: win.height });
  const [hasLayout, setHasLayout] = useState(false);

  const scoreRef = useRef(0);
  const [awaitingStart, setAwaitingStart] = useState(true);
  const physicsStepper = useRef(makeStepper()).current;
  const rafRef = useRef<number | null>(null);
  const lastFrameTimeRef = useRef<number | null>(null);
  const hideQuickActions = useUiStore((s) => s.hideQuickActions);
  const showQuickActions = useUiStore((s) => s.showQuickActions);

  const refreshLeaderboard = useCallback(async () => {
    try {
      const history = await getZenGlideHistory();
      if (!history.length) {
        setTopRuns([]);
        return;
      }
      const sorted = [...history].sort((a, b) => {
        if (b.score !== a.score) return b.score - a.score;
        return a.durationSec - b.durationSec;
      });
      setTopRuns(sorted.slice(0, 3));
    } catch (error) {
      console.warn('[ZenGlide] leaderboard load failed', error);
    }
  }, []);

  useEffect(() => {
    refreshLeaderboard();
  }, [refreshLeaderboard]);

  const {
    config,
    start,
    stop,
    reset,
    flap,
    step,
    playerY,
    velocity,
    obstacles,
    playerCircle,
    score,
    isRunning,
  } = useZenGlideEngine({
    width: area.width,
    height: area.height,
    reduceMotion,
    onGameOver: useCallback(
      async (result: SessionResult) => {
        if (feedbackEnabled) haptics.trigger('game', 'error');
        const bestScore = topRuns.length > 0 ? topRuns[0].score : 0;
        const achievedHighScore = result.score > bestScore;
        setIsNewHighScore(achievedHighScore);
        if (achievedHighScore) {
          setShowConfetti(true);
        }
        setLastResult(result);
        setAwaitingStart(true);
        scoreRef.current = 0;
        try {
          await saveZenGlideResult(result);
          await refreshLeaderboard();
        } catch (error) {
          console.warn('[ZenGlide] persist failed', error);
        }
        track('zenglide_finished', { score: result.score, durationSec: result.durationSec });
        const key = new Date().toISOString().slice(0, 10);
        markTaskDone(key, 'zen-glide', TASK_XP['zen-glide'] ?? 0);
      },
      [feedbackEnabled, markTaskDone, refreshLeaderboard, setAwaitingStart, topRuns]
    ),
  });

  const obstacleIndices = useMemo(() => Array.from({ length: config.poolSize }, (_, i) => i), [config.poolSize]);

  const onFrame = useCallback(
    (timestamp: number) => {
      if (!isRunning) {
        rafRef.current = requestAnimationFrame(onFrame);
        return;
      }
      if (lastFrameTimeRef.current == null) {
        lastFrameTimeRef.current = timestamp;
        rafRef.current = requestAnimationFrame(onFrame);
        return;
      }
      const deltaMs = Math.max(0, timestamp - (lastFrameTimeRef.current ?? timestamp));
      lastFrameTimeRef.current = timestamp;
      
      // Cap delta time für stabile Frame-Rate
      const frameDt = Math.min(deltaMs / 1000, MAX_FRAME_DT);
      
      // Verwende requestAnimationFrame für bessere Performance
      physicsStepper(frameDt, (dt) => {
        step(dt);
      });
      
      rafRef.current = requestAnimationFrame(onFrame);
    },
    [physicsStepper, step, isRunning]
  );

  useEffect(() => {
    rafRef.current = requestAnimationFrame(onFrame);
    return () => {
      if (rafRef.current != null) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
    };
  }, [onFrame]);

  useEffect(() => {
    if (!isRunning) {
      lastFrameTimeRef.current = null;
    }
  }, [isRunning]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const obstacleAsset = Asset.fromModule(OBSTACLE_ASSET);
      const backgroundAsset = Asset.fromModule(BACKGROUND_ASSET);
      try {
        await Promise.all([
          obstacleAsset.downloadAsync(),
          backgroundAsset.downloadAsync(),
        ]);
        const shouldFallback =
          (obstacleAsset.width ?? 0) <= 4 ||
          (obstacleAsset.height ?? 0) <= 4;
        if (!cancelled && shouldFallback) {
          setUseFallbackSprites(true);
        }
      } catch (error) {
        console.warn('[ZenGlide] asset preload failed', error);
        if (!cancelled) {
          setUseFallbackSprites(true);
        }
      } finally {
        if (!cancelled) setAssetsLoaded(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    AccessibilityInfo.isReduceMotionEnabled().then((enabled) => {
      if (!cancelled) setReduceMotion(enabled);
    });
    const sub = AccessibilityInfo.addEventListener('reduceMotionChanged', setReduceMotion);
    return () => {
      cancelled = true;
      sub.remove();
    };
  }, []);

  useFocusEffect(
    useCallback(() => {
      StatusBar.setHidden(true, 'fade');
      hideQuickActions('zenglide');
      return () => {
        StatusBar.setHidden(false, 'fade');
        showQuickActions('zenglide');
      };
    }, [hideQuickActions, showQuickActions])
  );

  useEffect(() => {
    scoreRef.current = score;
  }, [score]);

  useEffect(() => {
    if (!assetsLoaded || !hasLayout) return;
    if (isRunning) return;
    if (lastResult) return;
    reset();
    scoreRef.current = 0;
    setAwaitingStart(true);
  }, [assetsLoaded, hasLayout, isRunning, lastResult, reset]);

  useEffect(() => {
    return () => {
      stop();
      StatusBar.setHidden(false, 'fade');
    };
  }, [stop]);

  useEffect(() => {
    if (!hasLayout) return;
    reset();
    scoreRef.current = 0;
    setAwaitingStart(true);
  }, [config.width, config.height, reset, hasLayout]);


  const onLayout = useCallback(
    (event: LayoutChangeEvent) => {
      const { width, height } = event.nativeEvent.layout;
      if (!width || !height) return;
      const roundedWidth = Math.round(width);
      const roundedHeight = Math.round(height);
      if (roundedWidth > 0 && roundedHeight > 0) {
        setHasLayout(true);
      }
      if (areaRef.current.width === roundedWidth && areaRef.current.height === roundedHeight) {
        return;
      }
      areaRef.current = { width: roundedWidth, height: roundedHeight };
      setArea(areaRef.current);
    },
    []
  );


  const beginSession = useCallback(() => {
    setAwaitingStart(false);
    setLastResult(null);
    scoreRef.current = 0;
    start();
    flap();
    track('zenglide_opened');
  }, [flap, start]);

  const handlePlayAgain = useCallback(() => {
    beginSession();
  }, [beginSession]);

  const handleClose = useCallback(() => {
    stop();
    setAwaitingStart(true);
    navigation.goBack();
  }, [navigation, stop]);

  const handleTap = useCallback(() => {
    if (awaitingStart) {
      beginSession();
      return;
    }
    flap();
  }, [awaitingStart, beginSession, flap]);

  const toggleHitboxes = useCallback(() => {
    setShowHitboxes((current) => !current);
  }, []);

  const tapGesture = useMemo(
    () =>
      Gesture.Tap()
        .maxDuration(220)
        .onStart(() => {
          'worklet';
          runOnJS(handleTap)();
        }),
    [handleTap]
  );

  const playerStyle = useAnimatedStyle(() => {
    'worklet';
    return {
      top: playerY.value,
      left: config.playerX,
    };
  });

  const playerHitboxStyle = useAnimatedStyle(() => {
    'worklet';
    const circle = playerCircle.value;
    const diameter = circle.r * 2;
    return {
      left: circle.x - circle.r,
      top: circle.y - circle.r,
      width: diameter,
      height: diameter,
      borderRadius: circle.r,
      opacity: 0.9,
    };
  });

  return (
    <View style={styles.root} onLayout={onLayout}>
      {showConfetti ? (
        <ConfettiCannon
          count={160}
          fadeOut
          autoStart
          explosionSpeed={320}
          fallSpeed={2600}
          origin={{ x: win.width / 2, y: -16 }}
          onAnimationEnd={() => setShowConfetti(false)}
        />
      ) : null}
      <ImageBackground source={BACKGROUND_ASSET} resizeMode="cover" style={styles.background}>
        <GestureDetector gesture={tapGesture}>
          <View style={styles.canvas}>
            {!assetsLoaded ? (
              <View style={styles.loader}>
                <ActivityIndicator color={colors.light.primary} size="large" />
                <Text style={styles.loaderLabel}>Einen Moment…</Text>
              </View>
            ) : (
              <>
                <Animated.View
                  style={[
                    styles.player,
                    styles.playerSprite,
                    playerStyle,
                    {
                      width: config.playerSize,
                      height: config.playerSize,
                    },
                  ]}
                  pointerEvents="none"
                  accessible
                  accessibilityRole="image"
                  accessibilityLabel="ZenGlide Spieler"
                >
                  <Plane
                    x={config.playerSize / 2}
                    y={config.playerSize / 2}
                    size={config.playerSize}
                    velY={velocity}
                  />
                </Animated.View>
                {obstacleIndices.map((index) => (
                  <ObstaclePair
                    key={index}
                    index={index}
                    obstacles={obstacles}
                    useFallback={useFallbackSprites}
                  />
                ))}
                {showHitboxes ? (
                  <>
                    <Animated.View
                      pointerEvents="none"
                      style={[styles.hitboxPlayer, playerHitboxStyle]}
                    />
                    {obstacleIndices.map((index) => (
                      <ObstacleHitboxPair key={`hitbox-${index}`} index={index} obstacles={obstacles} />
                    ))}
                  </>
                ) : null}
                <View style={[styles.hud, { paddingTop: insets.top + spacing.m }]}>
                  <Pressable
                    style={styles.closeButton}
                    onPress={handleClose}
                    accessibilityRole="button"
                    accessibilityLabel="Zurück"
                  >
                    <Text style={styles.closeLabel}>←</Text>
                  </Pressable>
                  <View style={styles.hudRight}>
                    <Pressable
                      style={[
                        styles.muteButton,
                        !feedbackEnabled && styles.muteButtonInactive,
                      ]}
                      onPress={() => setFeedbackEnabled((value) => !value)}
                      accessibilityRole="switch"
                      accessibilityLabel={feedbackEnabled ? 'Feedback stummschalten' : 'Feedback aktivieren'}
                      accessibilityState={{ checked: feedbackEnabled }}
                    >
                      <Text style={[styles.muteLabel, !feedbackEnabled && styles.muteLabelInactive]}>
                        {feedbackEnabled ? 'Klicks an' : 'Klicks aus'}
                      </Text>
                    </Pressable>
                    {__DEV__ ? (
                      <Pressable
                        style={[
                          styles.hitboxToggle,
                          showHitboxes && styles.hitboxToggleActive,
                        ]}
                        onPress={toggleHitboxes}
                        accessibilityRole="switch"
                        accessibilityLabel="Hitbox Overlay"
                        accessibilityState={{ checked: showHitboxes }}
                      >
                        <Text
                          style={[
                            styles.hitboxToggleLabel,
                            showHitboxes && styles.hitboxToggleLabelActive,
                          ]}
                        >
                          Hitbox {showHitboxes ? 'an' : 'aus'}
                        </Text>
                      </Pressable>
                    ) : null}
                    <View accessibilityRole="text" style={styles.scoreChip}>
                      <Text style={styles.scoreLabel}>Score</Text>
                      <Text style={styles.scoreValue}>{score}</Text>
                    </View>
                  </View>
                </View>
              </>
            )}
          </View>
        </GestureDetector>
        {awaitingStart && assetsLoaded && !lastResult ? (
          <View style={styles.readyPrompt} pointerEvents="none">
            <Text style={styles.readyTitle}>Tippe zum Start</Text>
            <Text style={styles.readySub}>Sanfte Taps halten dich in der Luft.</Text>
          </View>
        ) : null}
        {lastResult ? (
          <View style={[styles.overlay, { paddingTop: insets.top + spacing.xl, paddingBottom: insets.bottom + spacing.xl }]}>
            <View style={styles.overlayCard} accessible accessibilityRole="summary">
              <Text style={styles.overlayTitle}>{isNewHighScore ? 'Neuer Highscore!' : 'Runde vorbei'}</Text>
              <View style={styles.overlayScoreRow}>
                <Text style={styles.overlayScore}>{lastResult.score} Punkte</Text>
                {isNewHighScore ? (
                  <View style={styles.highscoreBadge}>
                    <Text style={styles.highscoreBadgeLabel}>NEU</Text>
                  </View>
                ) : null}
              </View>
              <Text style={styles.overlaySub}>Dauer: {formatDuration(lastResult.durationSec)}</Text>
              {topRuns.length > 0 ? (
                <View style={styles.leaderboard} accessibilityRole="list">
                  <Text style={styles.leaderboardTitle}>Beste Läufe</Text>
                  {topRuns.map((run, index) => (
                    <View key={`${run.dateISO}-${index}`} style={styles.leaderboardRow} accessibilityRole="text">
                      <Text style={styles.leaderboardRank}>{index + 1}.</Text>
                      <Text style={styles.leaderboardScore}>{run.score} Punkte</Text>
                      <Text style={styles.leaderboardDuration}>{formatDuration(run.durationSec)}</Text>
                    </View>
                  ))}
                </View>
              ) : null}
              <View style={styles.overlayActions}>
                <Pressable
                  style={[styles.overlayButton, styles.overlayButtonPrimary]}
                  onPress={handlePlayAgain}
                  accessibilityRole="button"
                  accessibilityLabel="Nochmal spielen"
                >
                  <Text style={styles.overlayButtonPrimaryLabel}>Nochmal</Text>
                </Pressable>
                <Pressable
                  style={[styles.overlayButton, styles.overlayButtonGhost]}
                  onPress={handleClose}
                  accessibilityRole="button"
                  accessibilityLabel="Zurück zur Übersicht"
                >
                  <Text style={styles.overlayButtonGhostLabel}>Zurück</Text>
                </Pressable>
              </View>
            </View>
          </View>
        ) : null}
      </ImageBackground>
    </View>
  );
}

const styles = {
  root: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  background: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  canvas: {
    flex: 1,
  },
  loader: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing.m,
  } as const,
  loaderLabel: {
    fontSize: fontSizes.md,
    color: colors.light.text,
    fontWeight: fontWeights.medium as any,
  },
  player: {
    position: 'absolute',
  } as const,
  playerSprite: {
    alignItems: 'center',
    justifyContent: 'center',
  } as const,
  playerFallbackBody: {
    position: 'absolute',
    width: '78%',
    height: '56%',
    borderRadius: radius.l,
    backgroundColor: '#F2A65A',
  } as const,
  playerFallbackWingTop: {
    position: 'absolute',
    top: '22%',
    width: '68%',
    height: '26%',
    borderRadius: radius.m,
    backgroundColor: '#E68A4B',
    transform: [{ rotate: '-12deg' }],
  } as const,
  playerFallbackWingBottom: {
    position: 'absolute',
    bottom: '22%',
    width: '68%',
    height: '26%',
    borderRadius: radius.m,
    backgroundColor: '#E68A4B',
    transform: [{ rotate: '12deg' }],
  } as const,
  playerFallbackCabin: {
    position: 'absolute',
    right: '18%',
    top: '28%',
    width: '28%',
    height: '32%',
    borderRadius: radius.m,
    backgroundColor: '#FFFFFFCC',
  } as const,
  obstacle: {
    position: 'absolute',
    left: 0,
  } as const,
  obstacleTop: {
    borderTopLeftRadius: 0,
    borderTopRightRadius: 0,
    borderBottomLeftRadius: radius.l,
    borderBottomRightRadius: radius.l,
  } as const,
  obstacleBottom: {
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
    borderTopLeftRadius: radius.l,
    borderTopRightRadius: radius.l,
  } as const,
  obstacleFallback: {
    backgroundColor: 'rgba(224,140,85,0.92)',
  } as const,
  hud: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    paddingHorizontal: spacing.l,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  } as const,
  closeButton: {
    width: 44,
    height: 44,
    borderRadius: radius.pill,
    backgroundColor: colors.light.overlay,
    justifyContent: 'center',
    alignItems: 'center',
  } as const,
  closeLabel: {
    fontSize: 22,
    color: colors.light.surface,
    fontWeight: fontWeights.bold as any,
  },
  hudRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.m,
  } as const,
  scoreChip: {
    backgroundColor: colors.light.overlay,
    paddingHorizontal: spacing.m,
    paddingVertical: spacing.s,
    borderRadius: radius.l,
    alignItems: 'center',
    justifyContent: 'center',
  } as const,
  scoreLabel: {
    fontSize: fontSizes.sm,
    color: colors.light.surface,
    fontWeight: fontWeights.medium as any,
  },
  scoreValue: {
    fontSize: fontSizes.lg,
    color: colors.light.surface,
    fontWeight: fontWeights.bold as any,
  },
  muteButton: {
    paddingHorizontal: spacing.m,
    paddingVertical: spacing.s,
    borderRadius: radius.l,
    backgroundColor: colors.light.overlay,
  } as const,
  muteButtonInactive: {
    backgroundColor: 'rgba(74,42,22,0.25)',
  },
  muteLabel: {
    fontSize: fontSizes.sm,
    color: colors.light.surface,
    fontWeight: fontWeights.medium as any,
  },
  muteLabelInactive: {
    color: colors.light.text,
    opacity: 0.7,
  },
  hitboxPlayer: {
    position: 'absolute',
    borderWidth: 1,
    borderColor: 'rgba(255,0,0,0.9)',
    backgroundColor: 'transparent',
  } as const,
  hitboxRect: {
    position: 'absolute',
    borderWidth: 1,
    borderColor: 'rgba(0,255,128,0.85)',
    backgroundColor: 'transparent',
  } as const,
  hitboxToggle: {
    paddingHorizontal: spacing.s,
    paddingVertical: spacing.xs,
    borderRadius: radius.m,
    borderWidth: 1,
    borderColor: colors.light.overlay,
  } as const,
  hitboxToggleActive: {
    backgroundColor: 'rgba(255,255,255,0.24)',
    borderColor: colors.light.primary,
  } as const,
  hitboxToggleLabel: {
    fontSize: fontSizes.sm,
    color: colors.light.surface,
    fontWeight: fontWeights.medium as any,
  },
  hitboxToggleLabelActive: {
    color: colors.light.primary,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.light.overlay,
  },
  readyPrompt: {
    position: 'absolute',
    top: '45%',
    left: '10%',
    right: '10%',
    alignItems: 'center',
    paddingVertical: spacing.l,
    paddingHorizontal: spacing.xl,
    borderRadius: radius.xl,
    backgroundColor: 'rgba(255,244,223,0.85)',
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 4,
  } as const,
  readyTitle: {
    fontSize: fontSizes.xl,
    color: colors.light.text,
    fontWeight: fontWeights.bold as any,
  },
  readySub: {
    marginTop: spacing.s,
    fontSize: fontSizes.md,
    color: colors.light.textMuted,
    textAlign: 'center' as const,
    fontWeight: fontWeights.medium as any,
  },
  overlayCard: {
    marginHorizontal: spacing.l,
    borderRadius: radius.xl,
    padding: spacing.xl,
    gap: spacing.m,
    backgroundColor: 'rgba(255,244,223,0.92)',
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 10 },
    elevation: 6,
    width: '92%',
    maxWidth: 420,
    alignSelf: 'center',
  } as const,
  overlayTitle: {
    fontSize: fontSizes.xl,
    color: colors.light.text,
    fontWeight: fontWeights.bold as any,
  },
  overlayScore: {
    fontSize: fontSizes.display,
    color: colors.light.primary,
    fontWeight: fontWeights.bold as any,
  },
  overlayScoreRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.m,
  } as const,
  overlaySub: {
    fontSize: fontSizes.md,
    color: colors.light.textMuted,
    fontWeight: fontWeights.medium as any,
  },
  overlayActions: {
    flexDirection: 'row',
    gap: spacing.m,
    flexWrap: 'wrap',
    marginTop: spacing.m,
  } as const,
  overlayButton: {
    flex: 1,
    flexBasis: '48%',
    minWidth: 140,
    borderRadius: radius.l,
    paddingVertical: spacing.m,
    paddingHorizontal: spacing.m,
    alignItems: 'center',
  } as const,
  overlayButtonPrimary: {
    backgroundColor: colors.light.primary,
  } as const,
  overlayButtonGhost: {
    borderWidth: 1,
    borderColor: colors.light.primary,
    backgroundColor: 'transparent',
  } as const,
  overlayButtonPrimaryLabel: {
    color: '#FFFFFF',
    fontSize: fontSizes.md,
    fontWeight: fontWeights.bold as any,
  },
  overlayButtonGhostLabel: {
    color: colors.light.primary,
    fontSize: fontSizes.md,
    fontWeight: fontWeights.bold as any,
  },
  highscoreBadge: {
    paddingHorizontal: spacing.s,
    paddingVertical: spacing.xs,
    borderRadius: radius.pill,
    backgroundColor: colors.light.success,
  } as const,
  highscoreBadgeLabel: {
    fontSize: fontSizes.sm,
    fontWeight: fontWeights.bold as any,
    color: '#FFFFFF',
    textTransform: 'uppercase' as const,
  },
  leaderboard: {
    marginTop: spacing.s,
    paddingVertical: spacing.s,
    borderRadius: radius.l,
    backgroundColor: 'rgba(255,255,255,0.65)',
    gap: spacing.xs,
  } as const,
  leaderboardTitle: {
    fontSize: fontSizes.md,
    fontWeight: fontWeights.semibold as any,
    color: colors.light.text,
    paddingHorizontal: spacing.m,
  },
  leaderboardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.m,
    paddingVertical: spacing.xs,
  } as const,
  leaderboardRank: {
    fontSize: fontSizes.md,
    fontWeight: fontWeights.bold as any,
    color: colors.light.primary,
    width: 28,
  },
  leaderboardScore: {
    fontSize: fontSizes.md,
    fontWeight: fontWeights.semibold as any,
    color: colors.light.text,
    flex: 1,
  },
  leaderboardDuration: {
    fontSize: fontSizes.sm,
    color: colors.light.textMuted,
  },
} as const;
