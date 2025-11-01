import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, useWindowDimensions } from 'react-native';
import {
  Canvas,
  Circle,
  useTouchHandler,
  useValue,
  runTiming,
} from '@shopify/react-native-skia';
import { useGameStore } from '../store/gameStore';

const CIRCLE_RADIUS = 32;

export default function GameScreen() {
  const { width: screenW, height: screenH } = useWindowDimensions();
  const [score, setScore] = useState(0);
  const addGameResult = useGameStore((s) => s.addGameResult);

  // Animated positions for Skia circle
  const cx = useValue(screenW / 2);
  const cy = useValue(screenH / 3);

  const bounds = useMemo(() => {
    const padding = CIRCLE_RADIUS + 8;
    return {
      minX: padding,
      maxX: Math.max(padding, screenW - padding),
      minY: padding,
      maxY: Math.max(padding, screenH - padding),
    };
  }, [screenW, screenH]);

  const randomInRange = (min: number, max: number) => min + Math.random() * (max - min);

  const moveCircle = useCallback(() => {
    const nx = randomInRange(bounds.minX, bounds.maxX);
    const ny = randomInRange(bounds.minY, bounds.maxY);
    runTiming(cx, nx, { duration: 120 });
    runTiming(cy, ny, { duration: 120 });
  }, [bounds, cx, cy]);

  const isInside = useCallback(
    (x: number, y: number) => {
      const dx = x - cx.current;
      const dy = y - cy.current;
      return dx * dx + dy * dy <= CIRCLE_RADIUS * CIRCLE_RADIUS;
    },
    [cx, cy]
  );

  const touchHandler = useTouchHandler(
    {
      onStart: (t) => {
        if (isInside(t.x, t.y)) {
          setScore((s) => s + 1);
          moveCircle();
        }
      },
    },
    [isInside, moveCircle]
  );

  useEffect(() => {
    // Save result when leaving the screen
    return () => {
      if (score > 0) addGameResult(score, 'craving-tap');
    };
  }, [score, addGameResult]);

  return (
    <View style={styles.container}>
      <Canvas style={styles.canvas} onTouch={touchHandler}>
        <Circle cx={cx} cy={cy} r={CIRCLE_RADIUS} color="#4F46E5" />
      </Canvas>
      <View style={styles.hud} pointerEvents="none">
        <Text style={styles.score}>Score: {score}</Text>
        <Text style={styles.help}>Tippe den Kreis!</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: 'transparent' },
  canvas: { flex: 1 },
  hud: {
    position: 'absolute',
    top: 24,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  score: {
    fontSize: 24,
    fontWeight: '800',
    color: '#111827',
  },
  help: {
    marginTop: 4,
    fontSize: 14,
    color: '#6B7280',
  },
});

