import React from 'react';
import Animated, { useAnimatedStyle, SharedValue } from 'react-native-reanimated';

import HeroFigure from '../../../assets/1900_81.svg';

type PlaneProps = {
  x: number;                 // Center-X in px
  y: number;                 // Center-Y in px
  size?: number;             // default 96
  velY: SharedValue<number>; // px/s, - nach oben, + nach unten
};

export default function Plane({ x, y, size = 96, velY: _velY }: PlaneProps) {
  const style = useAnimatedStyle(() => ({
    position: 'absolute',
    left: x - size / 2,
    top:  y - size / 2,
    width: size,
    height: size,
    transform: [
      { scaleX: -1 },
    ],
  }));

  return (
    <Animated.View style={style}>
      <HeroFigure width={size} height={size} />
    </Animated.View>
  );
}
