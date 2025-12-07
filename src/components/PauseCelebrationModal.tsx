import React, { useEffect, useMemo, useState } from 'react';
import { Modal, Pressable, Text, View, useWindowDimensions } from 'react-native';
import type { NavigationContainerRefWithCurrent } from '@react-navigation/native';
import ConfettiCannon from 'react-native-confetti-cannon';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';

import { radius, spacing } from '../design/tokens';
import { useApp } from '../store/app';
import { calculatePauseStats, parseDateKey, pauseDurationInDays } from '../lib/pause';
import { useStore } from '../store/useStore';
import { useTheme } from '../theme/useTheme';

const formatDateLabel = (key: string) => format(parseDateKey(key), 'dd.MM.yyyy', { locale: de });

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(
    Math.round(value)
  );

const formatNumber = (value: number) =>
  new Intl.NumberFormat('de-DE', { maximumFractionDigits: 1 }).format(value);

type Props = {
  navRef: NavigationContainerRefWithCurrent<any> | null;
};

export default function PauseCelebrationModal({ navRef }: Props) {
  const celebrationId = useApp((s) => s.pauseCelebrationId);
  const pauses = useApp((s) => s.pauses);
  const profile = useApp((s) => s.profile);
  const acknowledge = useApp((s) => s.acknowledgePauseCelebration);
  const awardMilestone = useStore((s) => s.awardMilestone);
  const celebrationPause = celebrationId ? pauses.find((pause) => pause.id === celebrationId) : undefined;
  const [awardedId, setAwardedId] = useState<string | null>(null);
  const [confettiKey, setConfettiKey] = useState(0);
  const { width } = useWindowDimensions();
  const { theme } = useTheme();
  const palette = theme.colors;

  useEffect(() => {
    if (celebrationPause) {
      setConfettiKey((prev) => prev + 1);
    }
  }, [celebrationPause?.id]);

  useEffect(() => {
    if (celebrationPause && awardedId !== celebrationPause.id) {
      awardMilestone('pause-achieved');
      setAwardedId(celebrationPause.id);
    }
    if (!celebrationPause && awardedId) {
      setAwardedId(null);
    }
  }, [celebrationPause, awardedId, awardMilestone]);

  const stats = useMemo(() => {
    if (!celebrationPause) return null;
    return celebrationPause.stats || (profile ? calculatePauseStats(celebrationPause, profile) : null);
  }, [celebrationPause, profile]);

  const closeModal = () => {
    if (celebrationPause) {
      acknowledge(celebrationPause.id);
    }
  };

  const goToHistory = () => {
    if (celebrationPause) {
      acknowledge(celebrationPause.id);
      navRef?.current?.navigate('PauseHistory');
    }
  };

  if (!celebrationPause) {
    return null;
  }

  return (
    <Modal animationType="fade" transparent visible>
      <View
        style={{
          flex: 1,
          backgroundColor: 'rgba(0,0,0,0.5)',
          alignItems: 'center',
          justifyContent: 'center',
          padding: spacing.l,
        }}
      >
        <View
          style={{
            width: '100%',
            borderRadius: radius.xl,
            backgroundColor: palette.surface,
            padding: spacing.l,
            gap: spacing.m,
          }}
        >
          <View>
            <Text style={{ fontSize: 24, fontWeight: '700', color: palette.text }}>🎉 Herzlichen Glückwunsch!</Text>
            <Text style={{ color: palette.textMuted, marginTop: spacing.xs }}>
              {formatDateLabel(celebrationPause.startDate)} – {formatDateLabel(celebrationPause.endDate)} ({pauseDurationLabel(celebrationPause)})
            </Text>
          </View>
          <Text style={{ color: palette.text }}>
            Du hast deine geplante Pause ohne Konsum beendet – großartige Leistung!
          </Text>
          {stats ? (
            <View
              style={{
                backgroundColor: palette.surfaceMuted,
                borderRadius: radius.l,
                padding: spacing.m,
                gap: spacing.xs,
              }}
            >
              <Text style={{ fontWeight: '600', color: palette.text }}>Deine Bilanz</Text>
              <Text style={{ color: palette.textMuted }}>{formatCurrency(stats.savedMoney)} gespart</Text>
              <Text style={{ color: palette.textMuted }}>{formatNumber(stats.savedGrams)} g nicht konsumiert</Text>
              <Text style={{ color: palette.textMuted }}>{formatNumber(stats.savedTimeHours)} h Freizeit gewonnen</Text>
            </View>
          ) : null}
          <View style={{ flexDirection: 'row', gap: spacing.s }}>
            <Pressable
              onPress={goToHistory}
              style={({ pressed }) => [
                {
                  flex: 1,
                  paddingVertical: spacing.m,
                  borderRadius: radius.pill,
                  backgroundColor: palette.primary,
                  alignItems: 'center',
                },
                pressed && { opacity: 0.85 },
              ]}
            >
              <Text style={{ fontWeight: '700', color: palette.surface }}>Zur Historie</Text>
            </Pressable>
            <Pressable
              onPress={closeModal}
              style={({ pressed }) => [
                {
                  flex: 1,
                  paddingVertical: spacing.m,
                  borderRadius: radius.pill,
                  borderWidth: 1,
                  borderColor: palette.primary,
                  alignItems: 'center',
                },
                pressed && { opacity: 0.85 },
              ]}
            >
              <Text style={{ fontWeight: '700', color: palette.primary }}>Weiter</Text>
            </Pressable>
          </View>
        </View>
        <ConfettiCannon
          key={confettiKey}
          count={180}
          fadeOut
          explosionSpeed={350}
          fallSpeed={2400}
          origin={{ x: width / 2, y: -20 }}
        />
      </View>
    </Modal>
  );
}

const pauseDurationLabel = (pause: { startDate: string; endDate: string }) => {
  return `${pauseDurationInDays(pause)} Tage`;
};
