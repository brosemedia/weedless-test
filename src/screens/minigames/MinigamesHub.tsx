import React, { useCallback, useState } from 'react';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useFocusEffect } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { View, Text, StyleSheet, Pressable, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { HEADER_TOTAL_HEIGHT } from '../../components/AppHeader';
import { useHeaderTransparency } from '../../hooks/useHeaderTransparency';
const CARD_COLOR = '#D99A25';

export type TapResultsParams = {
  times: number[];
  hits: number;
  misses: number;
  attempts: number;
  round: number;
};

export type MinigameStackParamList = {
  MinigamesHub: undefined;
  TapGame: undefined;
  TapResults: TapResultsParams;
};

type Props = NativeStackScreenProps<MinigameStackParamList, 'MinigamesHub'>;

const todayKey = () => {
  const now = new Date();
  const yyyy = now.getFullYear();
  const mm = `${now.getMonth() + 1}`.padStart(2, '0');
  const dd = `${now.getDate()}`.padStart(2, '0');
  return `miniProgress:${yyyy}-${mm}-${dd}`;
};

async function readTodayProgress(): Promise<boolean> {
  try {
    const raw = await AsyncStorage.getItem(todayKey());
    if (!raw) return false;
    const parsed = JSON.parse(raw);
    return Boolean(parsed?.tapDone);
  } catch {
    return false;
  }
}

export default function MinigamesHub({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const [tapDone, setTapDone] = useState(false);
  const { handleScroll } = useHeaderTransparency();

  useFocusEffect(
    useCallback(() => {
      let mounted = true;
      (async () => {
        const done = await readTodayProgress();
        if (mounted) setTapDone(done);
      })();
      return () => {
        mounted = false;
      };
    }, [])
  );

  const badgeLabel = tapDone ? 'Heute erledigt' : 'Offen';
  const badgeStyle = tapDone ? styles.badgeDone : styles.badgeOpen;

  const contentStyle = {
    paddingTop: insets.top + HEADER_TOTAL_HEIGHT + 12,
  };

  return (
    <ScrollView
      contentContainerStyle={[styles.container, contentStyle]}
      onScroll={handleScroll}
      scrollEventThrottle={16}
    >
      <Text style={styles.title}>Minigames</Text>
      <Pressable style={styles.card} onPress={() => navigation.navigate('TapGame')}>
        <View style={styles.cardInner}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>Tap Game</Text>
            <View style={[styles.badge, badgeStyle]}>
              <Text style={styles.badgeText}>{badgeLabel}</Text>
            </View>
          </View>
          <Text style={styles.cardDescription}>
            Reaktionszeit-Test mit 30 Taps. Triff so schnell und präzise wie möglich.
          </Text>
        </View>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    gap: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#0f172a',
  },
  card: {
    borderRadius: 16,
    shadowColor: 'rgba(166, 90, 46, 0.35)',
    shadowOpacity: 1,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 8 },
    elevation: 4,
    backgroundColor: 'transparent',
  },
  cardInner: {
    borderRadius: 16,
    padding: 20,
    gap: 12,
    backgroundColor: CARD_COLOR,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: '600',
    fontFamily: 'Inter-SemiBold',
    color: '#FFFFFF',
  },
  cardDescription: {
    fontSize: 15,
    fontFamily: 'Inter-Regular',
    color: 'rgba(255,255,255,0.85)',
    lineHeight: 20,
  },
  badge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 999,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '600',
    fontFamily: 'Inter-SemiBold',
    color: '#FFFFFF',
  },
  badgeDone: {
    backgroundColor: 'rgba(255,255,255,0.25)',
  },
  badgeOpen: {
    backgroundColor: 'rgba(255,255,255,0.15)',
  },
});
