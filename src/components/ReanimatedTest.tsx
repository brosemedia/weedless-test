import React from 'react';
import { View } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withRepeat, withTiming } from 'react-native-reanimated';

export default function ReanimatedTest() {
  const scale = useSharedValue(1);

  React.useEffect(() => {
    scale.value = withRepeat(withTiming(1.2, { duration: 600 }), -1, true);
    return () => {
      // Optional: reset on unmount
      scale.value = 1;
    };
  }, []);

  const aStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#F7F8F5' }}>
      <Animated.View style={[{ width: 100, height: 100, borderRadius: 16, backgroundColor: '#4F7A1F' }, aStyle]} />
    </View>
  );
}
