import React, { useEffect, useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { NavigationContainerRefWithCurrent } from '@react-navigation/native';
import { radius, spacing } from '../design/tokens';
import { getPauseProgress, getPauseTimeInfo } from '../lib/pauseTime';
import { useTheme } from '../theme/useTheme';
import { useThemedStyles } from '../theme/useThemedStyles';
import type { ThemeColors } from '../theme/themes';
import { useActivePause } from '../hooks/useActivePause';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import Svg, { Circle } from 'react-native-svg';

const REFRESH_INTERVAL_MS = 60_000;
type Props = {
  navRef?: NavigationContainerRefWithCurrent<any>;
  fullWidth?: boolean;
};

export default function PauseHeaderBadge({ navRef, fullWidth = false }: Props) {
  const activePause = useActivePause();
  const [now, setNow] = useState(() => new Date());
  const { theme } = useTheme();
  const palette = theme.colors;
  const styles = useThemedStyles(createStyles);

  useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), REFRESH_INTERVAL_MS);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    setNow(new Date());
  }, [activePause?.id]);

  const pauseInfo = useMemo(
    () =>
      activePause
        ? getPauseTimeInfo(activePause.startDate, activePause.endDate, now, {
            startTimestamp: activePause.startTimestamp,
            endTimestamp: activePause.endTimestamp,
          })
        : null,
    [activePause, now]
  );

  const progressInfo = useMemo(() => {
    if (!activePause) return null;
    return getPauseProgress(activePause.startDate, activePause.endDate, now, {
      startTimestamp: activePause.startTimestamp,
      endTimestamp: activePause.endTimestamp,
    });
  }, [activePause, now]);

  if (!activePause || !progressInfo || !pauseInfo) {
    return null;
  }

  return (
    <Pressable
      onPress={() => navRef?.current?.navigate('PausePlan')}
      style={({ pressed }) => [
        styles.badge,
        fullWidth && styles.badgeFullWidth,
        { backgroundColor: palette.surface, shadowColor: palette.primary },
        pressed && { opacity: 0.8 },
      ]}
      accessibilityRole="button"
      accessibilityLabel={`Aktive Pause: ${progressInfo.displayPercent}% geschafft – ${pauseInfo.displayLabel}`}
    >
      <View style={styles.row}>
        <MaterialCommunityIcons name="pause-circle-outline" size={18} color={palette.primary} />
        <View style={styles.circleWrap}>
          <Svg height={CIRCLE_SIZE} width={CIRCLE_SIZE} viewBox={`0 0 ${CIRCLE_SIZE} ${CIRCLE_SIZE}`}>
            <Circle
              cx={HALF}
              cy={HALF}
              r={RADIUS}
              stroke={palette.overlay}
              strokeWidth={STROKE}
              fill="none"
            />
            <Circle
              cx={HALF}
              cy={HALF}
              r={RADIUS}
              stroke={palette.primary}
              strokeWidth={STROKE}
              strokeDasharray={`${CIRCUMFERENCE} ${CIRCUMFERENCE}`}
              strokeDashoffset={CIRCUMFERENCE * (1 - progressInfo.progress)}
              strokeLinecap="round"
              fill="none"
              rotation={-90}
              originX={HALF}
              originY={HALF}
            />
          </Svg>
          <Text style={styles.badgePercent}>{progressInfo.displayPercent}%</Text>
        </View>
      </View>
    </Pressable>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    badge: {
      paddingHorizontal: spacing.s - 4,
      paddingVertical: spacing.xs,
      backgroundColor: 'transparent',
      borderRadius: radius.xl,
      borderWidth: 1,
      borderColor: colors.primary,
      marginLeft: spacing.xs,
      marginTop: spacing.xs,
      marginBottom: spacing.xs,
      minWidth: 70,
      maxWidth: 90,
      minHeight: 36,
      flexShrink: 1,
      alignSelf: 'center',
      shadowOpacity: 0.15,
      shadowRadius: 10,
      shadowOffset: { width: 0, height: 4 },
      elevation: 4,
    },
    badgeFullWidth: {
      width: '100%',
      maxWidth: '100%',
      marginLeft: 0,
      marginTop: 0,
      alignSelf: 'stretch',
    },
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    badgeLabel: {
      fontSize: 11,
      fontWeight: '700',
      color: colors.surface,
      letterSpacing: 0.6,
      textTransform: 'uppercase',
    },
    badgePercent: {
      position: 'absolute',
      fontSize: 8,
      fontWeight: '700',
      color: colors.primary,
      textAlign: 'center',
      minWidth: 24,
    },
    circleWrap: {
      width: CIRCLE_SIZE,
      height: CIRCLE_SIZE,
      alignItems: 'center',
      justifyContent: 'center',
    },
  });

const CIRCLE_SIZE = 28;
const STROKE = 3;
const HALF = CIRCLE_SIZE / 2;
const RADIUS = HALF - STROKE / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;
