import React, { useEffect, useMemo, useRef } from 'react';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { View, Text, StyleSheet, Pressable, Dimensions } from 'react-native';
import ConfettiCannon from 'react-native-confetti-cannon';
import type { MinigameStackParamList } from './MinigamesHub';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { HEADER_TOTAL_HEIGHT } from '../../components/AppHeader';
import { useApp } from '../../store/app';
import { TASK_XP } from '../../lib/tasks';
import { useHeaderTransparency } from '../../hooks/useHeaderTransparency';
import { useUiStore } from '../../store/ui';
import { useQuickActionsVisibility } from '../../hooks/useQuickActionsVisibility';

type Props = NativeStackScreenProps<MinigameStackParamList, 'TapResults'>;

const todayProgressKey = () => {
  const now = new Date();
  const yyyy = now.getFullYear();
  const mm = `${now.getMonth() + 1}`.padStart(2, '0');
  const dd = `${now.getDate()}`.padStart(2, '0');
  return `miniProgress:${yyyy}-${mm}-${dd}`;
};

const storeResults = async (payload: {
  times: number[];
  hits: number;
  misses: number;
  attempts: number;
  round: number;
  medianRT: number | null;
  bestRT: number | null;
  accuracy: number;
}) => {
  const now = new Date();
  const sessionKey = `session:tap:${now.toISOString()}`;
  const progressKey = todayProgressKey();
  const record = JSON.stringify({
    ...payload,
    recordedAt: now.toISOString(),
  });
  try {
    await AsyncStorage.setItem(sessionKey, record);
    await AsyncStorage.setItem(progressKey, JSON.stringify({ tapDone: true }));
  } catch {
    // ignore storage errors for now
  }
};

const formatMs = (value: number | null) =>
  value !== null ? `${Math.round(value)} ms` : '–';

export default function TapResults({ navigation, route }: Props) {
  const insets = useSafeAreaInsets();
  const headerAccessoryHeight = useUiStore((s) => s.headerAccessoryHeight);
  useHeaderTransparency();
  useQuickActionsVisibility('tap-results', true);
  const { times, hits, misses, attempts, round } = route.params;
  const confettiRef = useRef<ConfettiCannon | null>(null);
  const upsertDayLog = useApp((s) => s.upsertDayLog);
  const markTaskDone = useApp((s) => s.markTaskDone);

  const { sortedTimes, medianRT, bestRT, accuracy } = useMemo(() => {
    const sorted = [...times].sort((a, b) => a - b);
    let median: number | null = null;
    if (sorted.length > 0) {
      const mid = Math.floor(sorted.length / 2);
      median =
        sorted.length % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid];
    }
    const best = sorted.length > 0 ? sorted[0] : null;
    const acc = attempts > 0 ? Math.round((hits / attempts) * 100) : 0;
    return {
      sortedTimes: sorted,
      medianRT: median,
      bestRT: best,
      accuracy: acc,
    };
  }, [attempts, hits, times]);

  useEffect(() => {
    confettiRef.current?.start?.();
  }, []);

  useEffect(() => {
    storeResults({
      times: sortedTimes,
      hits,
      misses,
      attempts,
      round,
      medianRT,
      bestRT,
      accuracy,
    });
  }, [accuracy, attempts, bestRT, hits, medianRT, misses, round, sortedTimes]);

  useEffect(() => {
    if (medianRT == null) return;
    const key = new Date().toISOString().slice(0, 10);
    upsertDayLog({
      date: key,
      tests: { reactionMs: medianRT },
    });
    markTaskDone(key, 'reaction-test', TASK_XP['reaction-test'] ?? 0);
  }, [markTaskDone, medianRT, upsertDayLog]);

  return (
    <View
      style={[
        styles.screen,
        { paddingTop: 28 + insets.top + HEADER_TOTAL_HEIGHT + headerAccessoryHeight },
      ]}
    >
      <ConfettiCannon
        ref={confettiRef}
        count={120}
        fadeOut
        autoStart={false}
        origin={{ x: Dimensions.get('window').width / 2, y: 0 }}
      />
      <Text style={styles.title}>Ergebnis</Text>
      <View style={styles.metricsRow}>
        <View style={styles.metricCard}>
          <Text style={styles.metricLabel}>Median</Text>
          <Text style={styles.metricValue}>{formatMs(medianRT)}</Text>
        </View>
        <View style={styles.metricCard}>
          <Text style={styles.metricLabel}>Bestzeit</Text>
          <Text style={styles.metricValue}>{formatMs(bestRT)}</Text>
        </View>
      </View>
      <View style={styles.metricsRow}>
        <View style={styles.metricCard}>
          <Text style={styles.metricLabel}>Treffsicherheit</Text>
          <Text style={styles.metricValue}>{`${accuracy}%`}</Text>
        </View>
        <View style={styles.metricCard}>
          <Text style={styles.metricLabel}>Treffer</Text>
          <Text style={styles.metricValueSmall}>
            {hits} / {attempts}
          </Text>
        </View>
      </View>
      <View style={styles.details}>
        <Text style={styles.detailText}>Gültige Reaktionszeiten: {sortedTimes.length}</Text>
        <Text style={styles.detailText}>Durchgänge insgesamt: {round}</Text>
        <Text style={styles.detailText}>Fehlversuche: {misses}</Text>
      </View>
      <View style={styles.buttonRow}>
        <Pressable style={[styles.button, styles.secondary]} onPress={() => navigation.goBack()}>
          <Text style={styles.secondaryLabel}>Nochmal</Text>
        </Pressable>
        <Pressable
          style={[styles.button, styles.primary]}
          onPress={() => navigation.navigate('MinigamesHub')}
        >
          <Text style={styles.primaryLabel}>Zur Übersicht</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#0f172a',
    paddingHorizontal: 24,
    paddingBottom: 28,
    justifyContent: 'flex-start',
  },
  title: {
    fontSize: 30,
    fontWeight: '700',
    fontFamily: 'Inter-Bold',
    color: '#f8fafc',
    marginBottom: 24,
    textAlign: 'center',
  },
  metricsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
    gap: 16,
  },
  metricCard: {
    flex: 1,
    backgroundColor: '#132345',
    borderRadius: 18,
    paddingVertical: 20,
    paddingHorizontal: 12,
    alignItems: 'center',
    gap: 6,
  },
  metricLabel: {
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
    color: '#cbd5f5',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  metricValue: {
    fontSize: 28,
    fontWeight: '700',
    fontFamily: 'Inter-Bold',
    color: '#f0f9ff',
  },
  metricValueSmall: {
    fontSize: 22,
    fontWeight: '600',
    fontFamily: 'Inter-SemiBold',
    color: '#f0f9ff',
  },
  details: {
    marginTop: 24,
    gap: 8,
    alignItems: 'center',
  },
  detailText: {
    fontSize: 15,
    fontFamily: 'Inter-Regular',
    color: '#e2e8f0',
  },
  buttonRow: {
    marginTop: 'auto',
    flexDirection: 'row',
    gap: 16,
  },
  button: {
    flex: 1,
    borderRadius: 999,
    paddingVertical: 16,
    alignItems: 'center',
  },
  primary: {
    backgroundColor: '#38bdf8',
  },
  primaryLabel: {
    fontSize: 16,
    fontWeight: '700',
    fontFamily: 'Inter-SemiBold',
    color: '#082f49',
  },
  secondary: {
    borderWidth: 2,
    borderColor: '#38bdf8',
    backgroundColor: 'transparent',
  },
  secondaryLabel: {
    fontSize: 16,
    fontWeight: '700',
    fontFamily: 'Inter-SemiBold',
    color: '#e0f2fe',
  },
});
