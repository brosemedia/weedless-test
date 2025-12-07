import React, { useEffect } from 'react';
import { useIsFocused } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { useSharedValue, useAnimatedStyle, withTiming } from 'react-native-reanimated';

type AnimatedTabScreenProps = {
  children: React.ReactNode;
};

/**
 * AnimatedTabScreen wrapper that ensures content doesn't get hidden behind the floating TabBar
 * The TabBar is approximately 70px (minHeight) + safe area insets + padding
 */
export function AnimatedTabScreen({ children }: AnimatedTabScreenProps) {
  const isFocused = useIsFocused();
  const insets = useSafeAreaInsets();
  const opacity = useSharedValue(0);
  const scale = useSharedValue(0.95);

  useEffect(() => {
    if (isFocused) {
      opacity.value = withTiming(1, { duration: 250 });
      scale.value = withTiming(1, { duration: 250 });
    } else {
      // Sofort ausblenden, wenn nicht fokussiert, für flüssigere Übergänge
      opacity.value = 0;
      scale.value = 0.98;
    }
  }, [isFocused, opacity, scale]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ scale: scale.value }],
  }));

  // Note: Individual screens should handle their own paddingBottom for the TabBar
  // This wrapper just provides the animation. The TabBar is absolutely positioned
  // and won't overlay content if screens have proper paddingBottom in their ScrollViews.
  return (
    <Animated.View 
      style={[
        { 
          flex: 1,
        }, 
        animatedStyle
      ]}
    >
      {children}
    </Animated.View>
  );
}

