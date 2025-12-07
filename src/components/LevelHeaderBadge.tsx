import React, { useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { NavigationContainerRefWithCurrent } from '@react-navigation/native';
import { useApp } from '../store/app';
import { spacing, radius } from '../design/tokens';
import { useTheme } from '../theme/useTheme';
import Svg, { Circle } from 'react-native-svg';

type Props = {
  navRef?: NavigationContainerRefWithCurrent<any>;
};

export default function LevelHeaderBadge({ navRef }: Props) {
  const xp = useApp((s) => s.xp);
  const { theme } = useTheme();
  const palette = theme.colors;
  const { progress, percent } = useMemo(() => {
    const range = Math.max(1, xp.xpForNextLevel - xp.xpForCurrentLevel);
    const within = Math.max(0, xp.totalXp - xp.xpForCurrentLevel);
    return {
      progress: Math.max(0, Math.min(1, within / range)),
      percent: Math.round((Math.max(0, Math.min(1, within / range))) * 100),
    };
  }, [xp]);

  return (
    <Pressable
      onPress={() => navRef?.current?.navigate('LevelStatus')}
      accessibilityRole="button"
      accessibilityLabel={`Level ${xp.currentLevel}, ${percent}%`}
      style={({ pressed }) => [
        styles.container,
        { borderColor: LEVEL_COLOR, backgroundColor: palette.surface, shadowColor: LEVEL_COLOR },
        pressed && styles.pressed,
      ]}
    >
      <View style={styles.row}>
        <Text style={[styles.label, { color: palette.text }]}>Lvl {xp.currentLevel}</Text>
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
              stroke={LEVEL_COLOR}
              strokeWidth={STROKE}
              strokeDasharray={`${CIRCUMFERENCE} ${CIRCUMFERENCE}`}
              strokeDashoffset={CIRCUMFERENCE * (1 - progress)}
              strokeLinecap="round"
              fill="none"
              rotation={-90}
              originX={HALF}
              originY={HALF}
            />
          </Svg>
          <Text style={[styles.percent, { color: palette.text }]}>{percent}%</Text>
        </View>
      </View>
    </Pressable>
  );
}

const LEVEL_COLOR = '#fbbf24';
const CIRCLE_SIZE = 28;
const STROKE = 3;
const HALF = CIRCLE_SIZE / 2;
const RADIUS = HALF - STROKE / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

const styles = StyleSheet.create({
  container: {
    minWidth: 98,
    maxWidth: 130,
    minHeight: 36,
    flexShrink: 1,
    paddingHorizontal: spacing.s,
    paddingVertical: spacing.xs,
    borderRadius: radius.xl,
    borderWidth: 1,
    marginTop: spacing.xs,
    marginBottom: spacing.xs,
    marginRight: 0,
    shadowOpacity: 0.15,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  pressed: {
    opacity: 0.85,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  label: {
    fontSize: 11,
    fontWeight: '700',
    fontFamily: 'Inter-SemiBold',
    letterSpacing: 0.4,
  },
  percent: {
    position: 'absolute',
    fontSize: 8,
    fontWeight: '700',
    fontFamily: 'Inter-SemiBold',
  },
  circleWrap: {
    width: CIRCLE_SIZE,
    height: CIRCLE_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
