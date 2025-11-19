import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Dimensions, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import ConfettiCannon from 'react-native-confetti-cannon';
import BreathingCircle from '../components/BreathingCircle';
import { colors, spacing, radius } from '../design/tokens';
import { useMonotonicTicker } from '../../hooks/useMonotonicTicker';
import { useApp } from '../store/app';
import { TASK_XP } from '../lib/tasks';

export default function BreathScreen() {
  const insets = useSafeAreaInsets();
  const ticker = useMonotonicTicker(4);
  const top = Math.max(spacing.s, insets.top - spacing.xxl);
  const bottom = Math.max(insets.bottom, spacing.l);
  const todayKey = useMemo(() => {
    const now = new Date();
    return now.toISOString().slice(0, 10);
  }, []);

  const dayLog = useApp((s) => s.dayLogs[todayKey]);
  const markTaskDone = useApp((s) => s.markTaskDone);
  const isCompleted = Boolean(dayLog?.tasksDone?.includes('breathing-session'));

  const [isRunning, setIsRunning] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const hasCelebratedRef = useRef(false);
  const startRef = useRef<number | null>(null);
  const accumulatedRef = useRef(0);
  const confettiRef = useRef<ConfettiCannon | null>(null);

  useEffect(() => {
    if (!isRunning) return;
    if (startRef.current === null) {
      startRef.current = Date.now();
    }
    const total = accumulatedRef.current + (Date.now() - startRef.current);
    setElapsed(total);
  }, [ticker, isRunning]);

  const toggleTimer = useCallback(() => {
    if (isRunning) {
      if (startRef.current !== null) {
        accumulatedRef.current += Date.now() - startRef.current;
      }
      startRef.current = null;
      setElapsed(accumulatedRef.current);
      setIsRunning(false);
    } else {
      if (startRef.current === null) {
        startRef.current = Date.now();
      }
      setIsRunning(true);
    }
  }, [isRunning]);

  const handleReset = useCallback(() => {
    setIsRunning(false);
    accumulatedRef.current = 0;
    startRef.current = null;
    setElapsed(0);
    hasCelebratedRef.current = false;
  }, []);

  const formattedTime = useMemo(() => {
    const totalSeconds = Math.floor(elapsed / 1000);
    const minutes = Math.floor(totalSeconds / 60)
      .toString()
      .padStart(2, '0');
    const seconds = (totalSeconds % 60).toString().padStart(2, '0');
    return `${minutes}:${seconds}`;
  }, [elapsed]);

  useEffect(() => {
    const FIVE_MINUTES_MS = 5 * 60 * 1000;
    if (elapsed < FIVE_MINUTES_MS) return;
    if (hasCelebratedRef.current) return;
    hasCelebratedRef.current = true;
    confettiRef.current?.start?.();
    if (!isCompleted) {
      markTaskDone(todayKey, 'breathing-session', TASK_XP['breathing-session'] ?? 0);
    }
  }, [elapsed, isCompleted, markTaskDone, todayKey]);

  const statusLabel = isCompleted || hasCelebratedRef.current ? 'Erledigt' : 'Offen';
  const statusStyle = isCompleted || hasCelebratedRef.current ? styles.statusDone : styles.statusOpen;

  return (
    <SafeAreaView style={[styles.safeArea, { paddingTop: top, paddingBottom: bottom }]}>
      <ConfettiCannon
        ref={confettiRef}
        count={150}
        fadeOut
        autoStart={false}
        origin={{ x: Dimensions.get('window').width / 2, y: 0 }}
      />
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        <View style={styles.timerRow}>
          <View style={styles.timerColumn}>
            <Text style={styles.title}>Atemübung</Text>
            <Text style={styles.timerValue} accessibilityLiveRegion="polite">
              {formattedTime}
            </Text>
          </View>
          <View style={styles.timerButtons}>
            <Pressable
              onPress={toggleTimer}
              style={[styles.circleButton, isRunning ? styles.buttonActive : undefined]}
              accessibilityRole="button"
              accessibilityLabel={isRunning ? 'Stopp' : 'Start Atemübung'}
            >
              <Text style={[styles.buttonLabel, isRunning ? styles.buttonLabelActive : undefined]}>
                {isRunning ? '❚❚' : '▶'}
              </Text>
            </Pressable>
            <Pressable
              onPress={handleReset}
              style={styles.circleButton}
              accessibilityRole="button"
              accessibilityLabel="Timer zurücksetzen"
            >
              <Text style={styles.buttonLabel}>↺</Text>
            </Pressable>
          </View>
        </View>
        <View style={[styles.statusBadge, statusStyle]}>
          <Text style={styles.statusText}>{statusLabel}</Text>
        </View>
        <View style={styles.header}>
          <Text style={styles.subtitle}>4 Sekunden einatmen, 2 halten, 6 ausatmen, 2 entspannen.</Text>
        </View>
        <View accessible accessibilityLabel="Animierter Atemkreis" accessibilityRole="image">
          <BreathingCircle />
        </View>
        <View style={styles.instructions}>
          <Text style={styles.stepLabel}>{"So funktioniert's"}</Text>
          <Text style={styles.stepText}>- Atme ein, wenn der Kreis größer wird.</Text>
          <Text style={styles.stepText}>- Halte kurz inne.</Text>
          <Text style={styles.stepText}>- Atme langsam aus, wenn der Kreis kleiner wird.</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  container: {
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
    gap: spacing.m,
  },
  timerRow: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.l,
  },
  timerColumn: {
    flex: 1,
    gap: spacing.s / 2,
  },
  timerValue: {
    fontSize: 42,
    fontWeight: '700',
    color: colors.light.text,
    letterSpacing: 1,
  },
  timerButtons: {
    flexDirection: 'row',
    gap: spacing.s,
  },
  circleButton: {
    width: 54,
    height: 54,
    borderRadius: radius.pill,
    backgroundColor: colors.light.surface,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 12,
    elevation: 3,
  },
  buttonActive: {
    backgroundColor: colors.light.primary,
  },
  buttonLabel: {
    fontSize: 24,
    fontWeight: '600',
    color: colors.light.text,
  },
  buttonLabelActive: {
    color: colors.light.surface,
  },
  statusBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: spacing.m,
    paddingVertical: spacing.s / 1.5,
    borderRadius: radius.pill,
  },
  statusText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.light.text,
  },
  statusDone: {
    backgroundColor: colors.light.primaryMuted,
  },
  statusOpen: {
    backgroundColor: colors.light.surface,
  },
  header: {
    width: '100%',
    backgroundColor: colors.light.surface,
    borderRadius: radius.xl,
    padding: spacing.xl,
    gap: spacing.s,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 8 },
    shadowRadius: 20,
    elevation: 4,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: colors.light.text,
  },
  subtitle: {
    fontSize: 16,
    color: colors.light.textMuted,
  },
  instructions: {
    width: '100%',
    backgroundColor: colors.light.surface,
    borderRadius: radius.xl,
    padding: spacing.l,
    gap: spacing.s,
  },
  stepLabel: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.light.text,
  },
  stepText: {
    fontSize: 15,
    color: colors.light.text,
  },
});
