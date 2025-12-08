import React from 'react';
import { View, Animated, Easing } from 'react-native';
import { FrostedSurface } from '../design/FrostedSurface';
import { ThemedText, PrimaryButton } from '../design/theme';
import { spacing, radius } from '../design/tokens';
import { useTheme } from '../theme/useTheme';
import { pauseDurationInDays } from '../lib/pause';
import { getPauseTimeInfo } from '../lib/pauseTime';
import type { Pause } from '../types/pause';

type PauseCardProps = {
  activePause: Pause | null;
  onPressDetails: () => void;
  onPressPlan: () => void;
  now?: Date;
};

export function PauseCard({ activePause, onPressDetails, onPressPlan, now = new Date() }: PauseCardProps) {
  const { theme } = useTheme();
  const palette = theme.colors;
  const isDark = theme.mode === 'dark';
  const pulseAnim = React.useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    if (!activePause) return;
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 900,
          easing: Easing.out(Easing.circle),
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 0,
          duration: 900,
          easing: Easing.in(Easing.circle),
          useNativeDriver: true,
        }),
      ])
    );
    loop.start();
    return () => {
      loop.stop();
    };
  }, [activePause, pulseAnim]);

  if (!activePause) {
    return (
      <FrostedSurface
        borderRadius={radius.xl}
        intensity={85}
        fallbackColor="rgba(255,255,255,0.08)"
        overlayColor="rgba(255,255,255,0.18)"
        style={{
          padding: spacing.l as any,
          gap: spacing.s as any,
          borderWidth: 2,
          borderColor: palette.primary,
        }}
      >
        <ThemedText kind="label" style={{ color: palette.text }}>
          Pause planen
        </ThemedText>
        <ThemedText kind="h2" style={{ color: palette.text }}>
          Lust auf eine Pause?
        </ThemedText>
        <ThemedText style={{ color: palette.textMuted }}>
          Mit drei Voreinstellungen oder eigenen Daten bist du in Sekunden startklar.
        </ThemedText>
        <PrimaryButton title="Pause einlegen" onPress={onPressPlan} />
      </FrostedSurface>
    );
  }

  const totalDays = pauseDurationInDays(activePause);
  const doneDays = Math.min(totalDays, activePause.xpAwardedDays.length);
  const pauseInfo = getPauseTimeInfo(activePause.startDate, activePause.endDate, now, {
    startTimestamp: activePause.startTimestamp,
    endTimestamp: activePause.endTimestamp,
  });
  const timeLabel = pauseInfo?.displayLabel ?? 'Pause beendet';
  const progress = Math.min(1, doneDays / Math.max(1, totalDays));
  const pulseScale = pulseAnim.interpolate({ inputRange: [0, 1], outputRange: [0.9, 1.4] });
  const pulseOpacity = pulseAnim.interpolate({ inputRange: [0, 1], outputRange: [0.6, 0] });

  return (
    <FrostedSurface
      borderRadius={radius.xl}
      intensity={95}
      fallbackColor={palette.info}
      overlayColor="rgba(0,0,0,0.1)"
      style={{
        position: 'relative',
        padding: spacing.l as any,
        gap: spacing.m as any,
        shadowColor: palette.primary,
        shadowOpacity: 0.3,
        shadowRadius: 14,
        shadowOffset: { width: 0, height: 8 },
        elevation: 4,
      }}
    >
      <View
        pointerEvents="none"
        style={{
          position: 'absolute',
          top: spacing.s,
          right: spacing.s,
          width: 22,
          height: 22,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Animated.View
          style={{
            position: 'absolute',
            width: 22,
            height: 22,
            borderRadius: 11,
            backgroundColor: palette.primary,
            opacity: pulseOpacity,
            transform: [{ scale: pulseScale }],
          }}
        />
        <View
          style={{
            width: 12,
            height: 12,
            borderRadius: 6,
            backgroundColor: palette.primary,
            shadowColor: palette.primary,
            shadowOpacity: isDark ? 0.85 : 0.55,
            shadowRadius: isDark ? 12 : 8,
            shadowOffset: { width: 0, height: 0 },
          }}
        />
      </View>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <View style={{ flex: 1 }}>
          <ThemedText kind="label" style={{ color: palette.surface, fontWeight: '600' }}>
            Pause aktiv
          </ThemedText>
          <ThemedText kind="h2" style={{ color: palette.surface, fontWeight: '700' }}>
            {timeLabel}
          </ThemedText>
          <ThemedText style={{ color: palette.surface, marginTop: 4, opacity: 0.95 }}>
            {doneDays} von {totalDays} Tagen geschafft
          </ThemedText>
        </View>
        <PrimaryButton title="Details" onPress={onPressDetails} />
      </View>
      <View style={{ height: 10, borderRadius: radius.pill, backgroundColor: 'rgba(255,255,255,0.3)' }}>
        <View
          style={{
            height: 10,
            borderRadius: radius.pill,
            backgroundColor: palette.surface,
            width: `${Math.round(progress * 100)}%`,
          }}
        />
      </View>
    </FrostedSurface>
  );
}

