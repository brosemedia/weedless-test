import React, { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { useTheme } from '../../../src/theme/useTheme';
import { radius } from '../../../src/design/tokens';

interface Props {
  progress: number; // 0-1
}

export const OnboardingProgressBar: React.FC<Props> = ({ progress }) => {
  const { theme } = useTheme();
  const colors = theme.colors;
  const clamped = Math.min(Math.max(progress, 0), 1);
  const animatedWidth = useSharedValue(clamped);

  useEffect(() => {
    animatedWidth.value = withTiming(clamped, {
      duration: 400,
      easing: Easing.out(Easing.cubic),
    });
  }, [clamped, animatedWidth]);

  const animatedStyle = useAnimatedStyle(() => ({
    width: `${animatedWidth.value * 100}%`,
  }));

  return (
    <View style={[styles.container, { backgroundColor: colors.border }]}>
      <Animated.View
        style={[
          styles.bar,
          {
            backgroundColor: colors.primary,
          },
          animatedStyle,
        ]}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    height: 4,
    width: '100%',
    borderRadius: radius.pill,
    overflow: 'hidden',
  },
  bar: {
    height: '100%',
    borderRadius: radius.pill,
  },
});

// Legacy-Export für Kompatibilität
export const ProgressBar = OnboardingProgressBar;
