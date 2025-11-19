import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  useWindowDimensions,
  Pressable,
  GestureResponderEvent,
  StatusBar,
  LayoutChangeEvent,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useGameStore } from '../store/gameStore';
import { colors, radius, spacing } from '../design/tokens';

const CIRCLE_RADIUS = 32;
const GAME_DURATION_MS = 20_000;
const MAX_ROUNDS = 20;
const MIN_SPAWN_DELAY = 450;
const MAX_SPAWN_DELAY = 1200;
const MIN_LIFETIME = 650;
const MAX_LIFETIME = 1500;
const COUNTDOWN_MS = 3000;
const TARGET_SIDE_OFFSET = 24;
const TARGET_TOP_OFFSET = 120;
const TARGET_BOTTOM_OFFSET = 96;

type GamePhase = 'idle' | 'running' | 'results';

type GameState = {
  phase: GamePhase;
  hits: number;
  attempts: number;
  misses: number;
  times: number[];
  round: number;
};

type Target = {
  id: number;
  x: number;
  y: number;
  showStamp: number;
};

type TimeoutHandle = ReturnType<typeof setTimeout>;
type IntervalHandle = ReturnType<typeof setInterval>;

const initialState: GameState = {
  phase: 'idle',
  hits: 0,
  attempts: 0,
  misses: 0,
  times: [],
  round: 0,
};

const nowPerf = () =>
  typeof performance !== 'undefined' && typeof performance.now === 'function'
    ? performance.now()
    : Date.now();

export default function GameScreen() {
  const { width: screenW, height: screenH } = useWindowDimensions();
  const navigation = useNavigation<any>();
  const [game, setGame] = useState<GameState>(initialState);
  const [areaSize, setAreaSize] = useState({ width: screenW, height: screenH });
  const [target, setTarget] = useState<Target | null>(null);
  const [timeLeft, setTimeLeft] = useState(0);
  const [countdownLeft, setCountdownLeft] = useState(0);

  const idRef = useRef(0);
  const startTimeRef = useRef(0);
  const endTimeRef = useRef(0);
  const spawnTimeoutRef = useRef<TimeoutHandle | null>(null);
  const targetTimeoutRef = useRef<TimeoutHandle | null>(null);
  const timerIntervalRef = useRef<IntervalHandle | null>(null);
  const runningRef = useRef(false);
  const gameRef = useRef<GameState>(initialState);
  const targetRef = useRef<Target | null>(null);
  const submittedRef = useRef(false);
  const countdownRef = useRef(0);

  const addGameResult = useGameStore((s) => s.addGameResult);

  const bounds = useMemo(() => {
    const horizontalPadding = Math.max(CIRCLE_RADIUS, TARGET_SIDE_OFFSET + CIRCLE_RADIUS);
    const topPadding = Math.max(CIRCLE_RADIUS, TARGET_TOP_OFFSET + CIRCLE_RADIUS);
    const bottomPadding = Math.max(CIRCLE_RADIUS, TARGET_BOTTOM_OFFSET + CIRCLE_RADIUS);
    const width = areaSize.width;
    const height = areaSize.height;
    return {
      minX: horizontalPadding,
      maxX: Math.max(horizontalPadding, width - horizontalPadding),
      minY: topPadding,
      maxY: Math.max(topPadding, height - bottomPadding),
    };
  }, [areaSize.width, areaSize.height]);

  const randomInRange = (min: number, max: number) => min + Math.random() * (max - min);

  const clearSpawnTimer = useCallback(() => {
    if (spawnTimeoutRef.current) {
      clearTimeout(spawnTimeoutRef.current);
      spawnTimeoutRef.current = null;
    }
  }, []);

  const clearTargetTimer = useCallback(() => {
    if (targetTimeoutRef.current) {
      clearTimeout(targetTimeoutRef.current);
      targetTimeoutRef.current = null;
    }
  }, []);

  const clearTicker = useCallback(() => {
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }
  }, []);

  const stopAllTimers = useCallback(() => {
    clearSpawnTimer();
    clearTargetTimer();
    clearTicker();
  }, [clearSpawnTimer, clearTargetTimer, clearTicker]);

  const finishGame = useCallback(() => {
    if (gameRef.current.phase !== 'running') return;
    runningRef.current = false;
    stopAllTimers();
    setTarget(null);
    targetRef.current = null;
    countdownRef.current = 0;
    setCountdownLeft(0);
    setGame((prev) => {
      if (prev.phase === 'results') return prev;
      const misses = prev.attempts - prev.hits;
      return { ...prev, phase: 'results', misses };
    });
    setTimeLeft(0);
    if (!submittedRef.current) {
      submittedRef.current = true;
      if (gameRef.current.hits > 0) {
        addGameResult(gameRef.current.hits, 'craving-tap');
      }
    }
  }, [stopAllTimers, addGameResult]);

  const spawnTarget = useCallback(() => {
    if (!runningRef.current) return;
    if (countdownRef.current > 0) return;
    if (gameRef.current.round >= MAX_ROUNDS) {
      finishGame();
      return;
    }
    const showStamp = nowPerf();
    const nextTarget: Target = {
      id: ++idRef.current,
      x: randomInRange(bounds.minX, bounds.maxX),
      y: randomInRange(bounds.minY, bounds.maxY),
      showStamp,
    };
    setTarget(nextTarget);
    targetRef.current = nextTarget;
    setGame((prev) => ({ ...prev, round: prev.round + 1 }));
    clearTargetTimer();
    const lifetime = randomInRange(MIN_LIFETIME, MAX_LIFETIME);
    targetTimeoutRef.current = setTimeout(() => {
      targetTimeoutRef.current = null;
      if (!runningRef.current) return;
      const active = targetRef.current;
      if (active && active.id === nextTarget.id) {
        targetRef.current = null;
        setTarget(null);
      }
    }, lifetime);
  }, [bounds, clearTargetTimer, finishGame]);

  const scheduleNextTarget = useCallback(
    (delay?: number) => {
      if (!runningRef.current) return;
      if (countdownRef.current > 0) return;
      const nextDelay = delay ?? randomInRange(MIN_SPAWN_DELAY, MAX_SPAWN_DELAY);
      clearSpawnTimer();
      spawnTimeoutRef.current = setTimeout(() => {
        spawnTimeoutRef.current = null;
        spawnTarget();
      }, nextDelay);
    },
    [spawnTarget, clearSpawnTimer]
  );

  const resetGameState = useCallback(
    (phase: GamePhase) => {
      stopAllTimers();
      const snapshot: GameState = {
        phase,
        hits: 0,
        attempts: 0,
        misses: 0,
        times: [],
        round: 0,
      };
      setGame(snapshot);
      gameRef.current = snapshot;
      submittedRef.current = false;
      idRef.current = 0;
      setTarget(null);
      targetRef.current = null;
      if (phase === 'running') {
        runningRef.current = true;
        const start = Date.now();
        startTimeRef.current = start;
        endTimeRef.current = start + GAME_DURATION_MS;
        setTimeLeft(GAME_DURATION_MS);
        countdownRef.current = COUNTDOWN_MS;
        setCountdownLeft(COUNTDOWN_MS);
        clearTicker();
        timerIntervalRef.current = setInterval(() => {
          const now = Date.now();
          const countdown = Math.max(0, COUNTDOWN_MS - (now - start));
          countdownRef.current = countdown;
          setCountdownLeft(countdown);
          if (countdown <= 0) {
            clearTicker();
            const begin = Date.now();
            startTimeRef.current = begin;
            endTimeRef.current = begin + GAME_DURATION_MS;
            setTimeLeft(GAME_DURATION_MS);
            countdownRef.current = 0;
            scheduleNextTarget(350);
            timerIntervalRef.current = setInterval(() => {
              const remaining = Math.max(0, endTimeRef.current - Date.now());
              setTimeLeft(remaining);
              if (remaining <= 0) {
                finishGame();
              }
            }, 100);
          }
        }, 50);
      } else {
        runningRef.current = false;
        setTimeLeft(0);
        setCountdownLeft(0);
        countdownRef.current = 0;
      }
    },
    [stopAllTimers, scheduleNextTarget, clearTicker, finishGame]
  );

  const startGame = useCallback(() => resetGameState('running'), [resetGameState]);

  const handleTap = useCallback(
    (event: GestureResponderEvent) => {
      if (gameRef.current.phase !== 'running') return;
      const currentTarget = targetRef.current;
      if (!currentTarget || countdownRef.current > 0) return;
      const { locationX, locationY } = event.nativeEvent;
      const stamp = nowPerf();
      const hit =
        currentTarget != null &&
        Math.hypot(locationX - currentTarget.x, locationY - currentTarget.y) <= CIRCLE_RADIUS;

      setGame((prev) => {
        if (prev.phase !== 'running') return prev;
        const attempts = prev.attempts + 1;
        const hits = hit ? prev.hits + 1 : prev.hits;
        const times =
          hit && currentTarget
            ? [...prev.times, stamp - currentTarget.showStamp]
            : prev.times;
        return {
          ...prev,
          attempts,
          hits,
          misses: attempts - hits,
          times,
        };
      });

      if (hit && currentTarget) {
        clearTargetTimer();
        targetRef.current = null;
        setTarget((prev) => (prev && prev.id === currentTarget.id ? null : prev));
      }
    },
    [clearTargetTimer]
  );

  const handleLayout = useCallback(
    ({ nativeEvent: { layout } }: LayoutChangeEvent) => {
      setAreaSize({ width: layout.width, height: layout.height });
    },
    []
  );

  useEffect(() => {
    setAreaSize({ width: screenW, height: screenH });
  }, [screenW, screenH]);

  useEffect(() => {
    gameRef.current = game;
  }, [game]);

  useEffect(() => {
    targetRef.current = target;
  }, [target]);

  useEffect(() => {
    if (game.phase !== 'running') {
      clearSpawnTimer();
      return;
    }
    if (!target) {
      if (countdownRef.current > 0) return;
      if (spawnTimeoutRef.current) return;
      if (game.round >= MAX_ROUNDS) {
        finishGame();
      } else {
        scheduleNextTarget();
      }
    }
  }, [
    game.phase,
    target,
    game.round,
    finishGame,
    scheduleNextTarget,
    clearSpawnTimer,
    countdownLeft,
  ]);

  useEffect(() => {
    return () => {
      stopAllTimers();
      if (gameRef.current.hits > 0 && !submittedRef.current) {
        addGameResult(gameRef.current.hits, 'craving-tap');
      }
    };
  }, [stopAllTimers, addGameResult]);

  const accuracy =
    game.attempts > 0 ? Math.round((game.hits / game.attempts) * 100) : 0;
  const avgTime =
    game.times.length > 0
      ? game.times.reduce((sum, value) => sum + value, 0) / game.times.length
      : null;
  const bestTime = game.times.length > 0 ? Math.min(...game.times) : null;
  const worstTime = game.times.length > 0 ? Math.max(...game.times) : null;

  if (game.phase === 'idle') {
    return (
      <View style={styles.container}>
        <StatusBar hidden animated backgroundColor="transparent" barStyle="dark-content" />
        <View style={styles.centered}>
          <Text style={styles.title}>Craving Tap</Text>
          <Text style={styles.subtitle}>
            Teste deine Reaktionszeit. Tippe die Ziele so schnell und genau wie möglich.
          </Text>
          <Pressable style={styles.primaryButton} onPress={startGame}>
            <Text style={styles.primaryButtonText}>Test starten</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  if (game.phase === 'results') {
    return (
      <View style={styles.container}>
        <StatusBar hidden animated backgroundColor="transparent" barStyle="dark-content" />
        <View style={styles.centered}>
          <Text style={styles.title}>Ergebnis</Text>
          <View style={styles.resultsBox}>
            <Text style={styles.resultLine}>Treffer: {game.hits}</Text>
            <Text style={styles.resultLine}>Fehltreffer: {game.misses}</Text>
            <Text style={styles.resultLine}>Genauigkeit: {accuracy}%</Text>
            <Text style={styles.resultLine}>
              Durchschnitt: {avgTime != null ? `${Math.round(avgTime)} ms` : '–'}
            </Text>
            <Text style={styles.resultLine}>
              Schnellste Reaktion: {bestTime != null ? `${Math.round(bestTime)} ms` : '–'}
            </Text>
            <Text style={styles.resultLine}>
              Langsamste Reaktion: {worstTime != null ? `${Math.round(worstTime)} ms` : '–'}
            </Text>
            <Text style={styles.resultLine}>Runden: {game.round}</Text>
          </View>
          <View style={styles.resultsActions}>
            <Pressable style={styles.primaryButton} onPress={startGame}>
              <Text style={styles.primaryButtonText}>Nochmal</Text>
            </Pressable>
            <Pressable
              style={[styles.primaryButton, styles.secondaryButton]}
              onPress={() => {
                resetGameState('idle');
                navigation.goBack();
              }}
            >
              <Text style={[styles.primaryButtonText, styles.secondaryText]}>Beenden</Text>
            </Pressable>
          </View>
        </View>
      </View>
    );
  }

  const showCountdown = countdownLeft > 0;
  return (
    <View
      style={styles.container}
      onStartShouldSetResponder={() => true}
      onResponderRelease={handleTap}
    >
      <StatusBar hidden animated backgroundColor="transparent" barStyle="dark-content" />
      <View style={styles.canvas} onLayout={handleLayout}>
        {showCountdown ? (
          <View style={styles.overlay}>
            <Text style={styles.countdownText}>{Math.ceil(countdownLeft / 1000)}</Text>
          </View>
        ) : (
          target && (
            <View
              pointerEvents="none"
              style={[
                styles.circle,
                {
                  left: target.x - CIRCLE_RADIUS,
                  top: target.y - CIRCLE_RADIUS,
                },
              ]}
            />
          )
        )}
      </View>
      {!showCountdown ? (
        <View style={styles.hud} pointerEvents="none">
          <Text style={styles.timer}>{(timeLeft / 1000).toFixed(1)}s</Text>
        </View>
      ) : null}
    </View>
  );
}

const palette = colors.light;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: 'transparent' },
  canvas: { flex: 1, backgroundColor: palette.surfaceMuted, position: 'relative' },
  circle: {
    position: 'absolute',
    width: CIRCLE_RADIUS * 2,
    height: CIRCLE_RADIUS * 2,
    borderRadius: CIRCLE_RADIUS,
    backgroundColor: palette.primary,
    borderWidth: 2,
    borderColor: palette.primaryRing,
  },
  hud: {
    position: 'absolute',
    top: spacing.xl,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  timer: {
    fontSize: 36,
    fontWeight: '700',
    fontFamily: 'Inter-Bold',
    color: palette.navy,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
    gap: spacing.l,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    fontFamily: 'Inter-Bold',
    color: palette.navy,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: palette.textMuted,
    textAlign: 'center',
  },
  primaryButton: {
    backgroundColor: palette.primary,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.m,
    borderRadius: radius.pill,
    minWidth: 180,
    alignItems: 'center',
  },
  primaryButtonText: {
    color: '#FFF7EC',
    fontWeight: '700',
    fontFamily: 'Inter-SemiBold',
    fontSize: 16,
  },
  secondaryButton: {
    backgroundColor: palette.surface,
    borderWidth: 1,
    borderColor: palette.border,
  },
  secondaryText: {
    color: palette.navy,
    fontFamily: 'Inter-SemiBold',
  },
  resultsBox: {
    width: '100%',
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: palette.border,
    backgroundColor: palette.surface,
    padding: spacing.l,
    gap: spacing.s,
  },
  resultLine: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: palette.text,
  },
  resultsActions: {
    flexDirection: 'row',
    gap: spacing.m,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: palette.overlay,
  },
  countdownText: {
    fontSize: 64,
    fontWeight: '800',
    fontFamily: 'Inter-Bold',
    color: palette.navy,
  },
});
