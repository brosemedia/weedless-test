import React, { useEffect, useRef } from 'react';
import { Animated, Easing, StyleSheet, View } from 'react-native';
import { useThemedStyles } from '../theme/useThemedStyles';
import type { ThemeColors } from '../theme/themes';

type BreathingCircleProps = {
  size?: number;
};

export default function BreathingCircle({ size = 240 }: BreathingCircleProps) {
  const scale = useRef(new Animated.Value(0.8)).current;
  const styles = useThemedStyles(createStyles);

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(scale, {
          toValue: 1.1,
          duration: 4200,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(scale, {
          toValue: 0.8,
          duration: 4200,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
      ])
    );
    animation.start();
    return () => {
      animation.stop();
      scale.stopAnimation();
    };
  }, [scale]);

  return (
    <View style={[styles.wrapper, { width: size, height: size }]}>
      <Animated.View style={[styles.circle, { transform: [{ scale }] }]} />
      <Animated.View
        pointerEvents="none"
        style={[
          styles.ring,
          {
            width: size,
            height: size,
            borderRadius: size / 2,
            transform: [{ scale }],
          },
        ]}
      />
    </View>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    wrapper: {
      alignItems: 'center',
      justifyContent: 'center',
    },
    circle: {
      width: '65%',
      aspectRatio: 1,
      borderRadius: 999,
      backgroundColor: colors.primary,
      opacity: 0.85,
    },
    ring: {
      position: 'absolute',
      borderWidth: 10,
      borderColor: colors.primaryMuted,
      opacity: 0.35,
    },
  });
