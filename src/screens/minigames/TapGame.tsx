import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useFocusEffect } from '@react-navigation/native';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  LayoutChangeEvent,
  GestureResponderEvent,
  Dimensions,
  Animated,
} from 'react-native';
import type { MinigameStackParamList } from './MinigamesHub';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { HEADER_TOTAL_HEIGHT } from '../../components/AppHeader';
import { useHeaderTransparency } from '../../hooks/useHeaderTransparency';

type Props = NativeStackScreenProps<MinigameStackParamList, 'TapGame'>;

type Phase = 'idle' | 'running' | 'results';

type Metrics = {
  hits: number;
  misses: number;
  attempts: number;
  round: number;
  times: number[];
};

type TargetState = {
  id: number;
  x: number;
  y: number;
  shownAt: number;
};

const TOTAL_TRIALS = 30;
const MIN_DELAY_MS = 300;
const MAX_DELAY_MS = 1500;
const MAX_REACTION_MS = 2200;
const TARGET_RADIUS = 36;
const MIN_RT_MS = 120;
const MAX_RT_MS = 2000;

const initialMetrics: Metrics = {
  hits: 0,
  misses: 0,
  attempts: 0,
  round: 0,
  times: [],
};

const perfNow = () =>
  typeof performance !== 'undefined' && typeof performance.now === 'function'
    ? performance.now()
    : Date.now();

export default function TapGame({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  useHeaderTransparency();
  const [phase, setPhase] = useState<Phase>('idle');
  const [metrics, setMetrics] = useState<Metrics>(initialMetrics);
  const [target, setTarget] = useState<TargetState | null>(null);
  const [area, setArea] = useState(() => ({
    width: Dimensions.get('window').width,
    height: Dimensions.get('window').height * 0.7,
  }));
  const [introVisible, setIntroVisible] = useState(true);

  const popAnim = useRef(new Animated.Value(1)).current;

  const showTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const missTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hitFeedbackTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const targetRef = useRef<TargetState | null>(null);
  const metricsRef = useRef<Metrics>(initialMetrics);
  const phaseRef = useRef<Phase>('idle');
  const finishedRef = useRef(false);
  const targetIdRef = useRef(0);

  useEffect(() => {
    metricsRef.current = metrics;
  }, [metrics]);

  useEffect(() => {
    phaseRef.current = phase;
  }, [phase]);

  const clearShowTimer = useCallback(() => {
    if (showTimerRef.current) {
      clearTimeout(showTimerRef.current);
      showTimerRef.current = null;
    }
  }, []);

  const clearMissTimer = useCallback(() => {
    if (missTimerRef.current) {
      clearTimeout(missTimerRef.current);
      missTimerRef.current = null;
    }
  }, []);

  const clearHitTimer = useCallback(() => {
    if (hitFeedbackTimerRef.current) {
      clearTimeout(hitFeedbackTimerRef.current);
      hitFeedbackTimerRef.current = null;
    }
  }, []);

  const clearAllTimers = useCallback(() => {
    clearShowTimer();
    clearMissTimer();
    clearHitTimer();
  }, [clearHitTimer, clearMissTimer, clearShowTimer]);

  const handleLayout = useCallback(
    (event: LayoutChangeEvent) => {
      const { width, height } = event.nativeEvent.layout;
      setArea({ width, height });
    },
    [setArea]
  );

  const randomBetween = useCallback((min: number, max: number) => min + Math.random() * (max - min), []);

  const finishGame = useCallback(
    (finalMetrics?: Metrics) => {
      const resultMetrics = finalMetrics ?? metricsRef.current;
      if (finishedRef.current) return;
      finishedRef.current = true;
      clearAllTimers();
      setTarget(null);
      targetRef.current = null;
      phaseRef.current = 'results';
      setPhase('results');
      setMetrics(resultMetrics);
      navigation.navigate('TapResults', {
        times: resultMetrics.times,
        hits: resultMetrics.hits,
        misses: resultMetrics.misses,
        attempts: resultMetrics.attempts,
        round: resultMetrics.round,
      });
    },
    [clearAllTimers, navigation]
  );

  const scheduleNextTarget = useCallback(() => {
    if (phaseRef.current !== 'running') return;
    if (metricsRef.current.round >= TOTAL_TRIALS) {
      finishGame();
      return;
    }
    const delay = randomBetween(MIN_DELAY_MS, MAX_DELAY_MS);
    clearShowTimer();
    showTimerRef.current = setTimeout(() => {
      const { width, height } = area;
      const x =
        width > TARGET_RADIUS * 2
          ? randomBetween(TARGET_RADIUS, width - TARGET_RADIUS)
          : width / 2;
      const y =
        height > TARGET_RADIUS * 2
          ? randomBetween(TARGET_RADIUS, height - TARGET_RADIUS)
          : height / 2;
      const shownAt = perfNow();
      const id = ++targetIdRef.current;
      const nextTarget: TargetState = { id, x, y, shownAt };
      targetRef.current = nextTarget;
      setTarget(nextTarget);
      setIntroVisible(false);
      const current = metricsRef.current;
      const updated: Metrics = {
        ...current,
        round: current.round + 1,
      };
      metricsRef.current = updated;
      setMetrics(updated);
      popAnim.setValue(0.92);
      Animated.spring(popAnim, {
        toValue: 1,
        useNativeDriver: true,
        damping: 10,
        stiffness: 120,
      }).start();

      clearMissTimer();
      missTimerRef.current = setTimeout(() => {
        if (targetRef.current?.id !== id) return;
        targetRef.current = null;
        setTarget(null);
        const base = metricsRef.current;
        const updatedMiss: Metrics = {
          ...base,
          attempts: base.attempts + 1,
          misses: base.misses + 1,
        };
        metricsRef.current = updatedMiss;
        setMetrics(updatedMiss);
        if (updatedMiss.round >= TOTAL_TRIALS) {
          finishGame(updatedMiss);
        } else {
          scheduleNextTarget();
        }
      }, MAX_REACTION_MS);
    }, delay);
  }, [area, clearMissTimer, clearShowTimer, finishGame, popAnim, randomBetween]);

  useEffect(() => {
    return () => {
      clearAllTimers();
    };
  }, [clearAllTimers]);

  const startGame = useCallback(() => {
    finishedRef.current = false;
    targetIdRef.current = 0;
    clearAllTimers();
    const fresh = { ...initialMetrics };
    metricsRef.current = fresh;
    setMetrics(fresh);
    targetRef.current = null;
    setTarget(null);
    setIntroVisible(true);
    phaseRef.current = 'running';
    setPhase('running');
    scheduleNextTarget();
  }, [clearAllTimers, scheduleNextTarget]);

  const resetToIdle = useCallback(() => {
    clearAllTimers();
    finishedRef.current = false;
    targetRef.current = null;
    setTarget(null);
    const fresh = { ...initialMetrics };
    metricsRef.current = fresh;
    setMetrics(fresh);
    setIntroVisible(true);
    phaseRef.current = 'idle';
    setPhase('idle');
  }, [clearAllTimers]);

  useFocusEffect(
    useCallback(() => {
      resetToIdle();
      return () => {
        clearAllTimers();
      };
    }, [clearAllTimers, resetToIdle])
  );

  const handleTap = useCallback(
    (event: GestureResponderEvent) => {
      if (phaseRef.current !== 'running') return;
      const active = targetRef.current;
      if (!active) return;

      clearMissTimer();
      targetRef.current = null;

      const { locationX, locationY } = event.nativeEvent;
      const dx = locationX - active.x;
      const dy = locationY - active.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      const isHit = distance <= TARGET_RADIUS;
      const tapStamp = perfNow();
      const rt = tapStamp - active.shownAt;
      const base = metricsRef.current;

      const timesInRange =
        isHit && rt >= MIN_RT_MS && rt <= MAX_RT_MS ? [...base.times, rt] : base.times;

      const updated: Metrics = {
        hits: isHit ? base.hits + 1 : base.hits,
        misses: isHit ? base.misses : base.misses + 1,
        attempts: base.attempts + 1,
        round: base.round,
        times: timesInRange,
      };

      metricsRef.current = updated;
      setMetrics(updated);

      if (isHit) {
        Animated.sequence([
          Animated.timing(popAnim, {
            toValue: 0.6,
            duration: 90,
            useNativeDriver: true,
          }),
          Animated.spring(popAnim, {
            toValue: 1,
            useNativeDriver: true,
            speed: 12,
            bounciness: 14,
          }),
        ]).start();
        clearHitTimer();
        hitFeedbackTimerRef.current = setTimeout(() => {
          hitFeedbackTimerRef.current = null;
          setTarget(null);
        }, 180);
      } else {
        setTarget(null);
      }

      if (updated.round >= TOTAL_TRIALS) {
        finishGame(updated);
      } else {
        scheduleNextTarget();
      }
    },
    [clearHitTimer, clearMissTimer, finishGame, popAnim, scheduleNextTarget]
  );

  const stats = useMemo(
    () => ({
      attempts: metrics.attempts,
      hits: metrics.hits,
      misses: metrics.misses,
      round: metrics.round,
    }),
    [metrics.attempts, metrics.hits, metrics.misses, metrics.round]
  );

  return (
    <View
      style={[
        styles.screen,
        { paddingTop: 24 + insets.top + HEADER_TOTAL_HEIGHT },
      ]}
    >
      <View style={styles.header}>
        <Text style={styles.title}>Tap Game</Text>
        <Text style={styles.subtitle}>
          Reagiere schnell auf den Kreis. 30 Durchgänge mit zufälligen Pausen.
        </Text>
      </View>

      <View style={styles.statusRow}>
        <Text style={styles.statusText}>Phase: {phase}</Text>
        <Text style={styles.statusText}>
          Runde: {Math.min(stats.round, TOTAL_TRIALS)} / {TOTAL_TRIALS}
        </Text>
      </View>

      <View style={styles.statsRow}>
        <Text style={styles.stat}>Treffer: {stats.hits}</Text>
        <Text style={styles.stat}>Fehler: {stats.misses}</Text>
        <Text style={styles.stat}>Versuche: {stats.attempts}</Text>
      </View>

      <View style={styles.gameWrapper}>
        {phase === 'running' ? (
          <Pressable style={styles.gameArea} onLayout={handleLayout} onPressIn={handleTap}>
            {target ? (
              <Animated.View
                style={[
                  styles.target,
                  {
                    left: target.x - TARGET_RADIUS,
                    top: target.y - TARGET_RADIUS,
                    transform: [{ scale: popAnim }],
                  },
                ]}
                pointerEvents="none"
              />
            ) : introVisible ? (
              <Text style={styles.waitingText}>Bereite dich auf den nächsten Kreis vor…</Text>
            ) : null}
          </Pressable>
        ) : (
          <View style={styles.idleBox} onLayout={handleLayout}>
            <Text style={styles.idleText}>
              Tippe auf „Test starten“, sobald du bereit bist. Der Kreis erscheint nach einer
              zufälligen Wartezeit in verschiedenen Positionen.
            </Text>
            <Pressable style={styles.primaryButton} onPress={startGame}>
              <Text style={styles.primaryLabel}>Test starten</Text>
            </Pressable>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    paddingHorizontal: 20,
    paddingBottom: 24,
    backgroundColor: '#0f172a',
  },
  header: {
    gap: 8,
    marginBottom: 12,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    fontFamily: 'Inter-Bold',
    color: '#f8fafc',
  },
  subtitle: {
    fontSize: 15,
    lineHeight: 20,
    fontFamily: 'Inter-Regular',
    color: '#cbd5f5',
  },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  statusText: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#cbd5f5',
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  stat: {
    fontSize: 15,
    fontWeight: '600',
    fontFamily: 'Inter-SemiBold',
    color: '#f1f5f9',
  },
  gameWrapper: {
    flex: 1,
  },
  gameArea: {
    flex: 1,
    borderRadius: 20,
    backgroundColor: '#111c3a',
    borderWidth: 1,
    borderColor: '#1e2a50',
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
  },
  idleBox: {
    flex: 1,
    borderRadius: 20,
    backgroundColor: '#111c3a',
    borderWidth: 1,
    borderColor: '#1e2a50',
    padding: 24,
    justifyContent: 'space-between',
  },
  idleText: {
    fontSize: 16,
    lineHeight: 22,
    fontFamily: 'Inter-Regular',
    color: '#e2e8f0',
  },
  primaryButton: {
    alignSelf: 'center',
    paddingHorizontal: 28,
    paddingVertical: 14,
    borderRadius: 999,
    backgroundColor: '#38bdf8',
  },
  primaryLabel: {
    fontSize: 16,
    fontWeight: '700',
    fontFamily: 'Inter-SemiBold',
    color: '#0f172a',
  },
  waitingText: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: '#93c5fd',
  },
  target: {
    position: 'absolute',
    width: TARGET_RADIUS * 2,
    height: TARGET_RADIUS * 2,
    borderRadius: TARGET_RADIUS,
    backgroundColor: '#22d3ee',
  },
});
