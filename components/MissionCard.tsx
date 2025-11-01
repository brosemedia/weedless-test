import React, { useEffect, useMemo, useState } from 'react';
import { ImageBackground, View, Text, StyleSheet, AccessibilityInfo, Platform } from 'react-native';
import Svg, { Rect as SvgRect } from 'react-native-svg';
import Animated, { Easing, cancelAnimation, useAnimatedProps, useSharedValue, withRepeat, withTiming } from 'react-native-reanimated';

type MissionCardProps = {
  title: string;
  points: number;
  image: any;
  completed?: boolean;
};

const CARD_WIDTH = 320;
const CARD_HEIGHT = 160;
const BORDER_RADIUS = 18;
const STROKE_WIDTH = 3;

const AnimatedRect = Animated.createAnimatedComponent(SvgRect);

function roundedRectPerimeter(w: number, h: number, r: number) {
  const straight = 2 * (w - 2 * r) + 2 * (h - 2 * r);
  const arcs = 2 * Math.PI * r;
  return straight + arcs;
}

export default function MissionCard({ title, points, image, completed = false }: MissionCardProps) {
  const [reduceMotion, setReduceMotion] = useState(false);

  useEffect(() => {
    if (Platform.OS !== 'ios') return;
    let sub: any;
    AccessibilityInfo.isReduceMotionEnabled()
      .then(setReduceMotion)
      .catch(() => {});
    // @ts-expect-error RN typing differs by version
    sub = AccessibilityInfo.addEventListener?.('reduceMotionChanged', (v: boolean) => setReduceMotion(!!v));
    return () => {
      // @ts-expect-error RN typing differs by version
      sub?.remove?.();
    };
  }, []);

  const w = CARD_WIDTH;
  const h = CARD_HEIGHT;
  const perimeter = useMemo(
    () => roundedRectPerimeter(w - STROKE_WIDTH, h - STROKE_WIDTH, BORDER_RADIUS - STROKE_WIDTH / 2),
    [w, h]
  );
  const dash = useMemo(() => perimeter * 0.22, [perimeter]);
  const gap = useMemo(() => perimeter - dash, [perimeter]);

  const offset = useSharedValue(0);

  useEffect(() => {
    if (completed || reduceMotion) {
      cancelAnimation(offset);
      offset.value = 0;
      return;
    }
    offset.value = 0;
    offset.value = withRepeat(withTiming(perimeter, { duration: 4500, easing: Easing.linear }), -1, false);
  }, [completed, reduceMotion, perimeter]);

  const animatedProps = useAnimatedProps(() => ({
    strokeDashoffset: offset.value,
  }));

  return (
    <View style={styles.shadowWrap}>
      <View style={styles.container}>
        <ImageBackground source={image} imageStyle={styles.image} style={styles.imageBg} resizeMode="cover">
          <View style={styles.overlay} />
          <View style={styles.content}>
            <Text style={styles.title} numberOfLines={2}>
              {title}
            </Text>
            <View style={styles.pointsPill}>
              <Text style={styles.pointsText}>+{points} Punkte</Text>
            </View>
          </View>
        </ImageBackground>

        <Svg width={w} height={h} style={styles.svgOverlay} pointerEvents="none">
          {completed ? (
            <SvgRect
              x={STROKE_WIDTH / 2}
              y={STROKE_WIDTH / 2}
              width={w - STROKE_WIDTH}
              height={h - STROKE_WIDTH}
              rx={BORDER_RADIUS}
              ry={BORDER_RADIUS}
              stroke="#22c55e"
              strokeWidth={STROKE_WIDTH}
              fill="transparent"
            />
          ) : (
            <>
              <SvgRect
                x={STROKE_WIDTH / 2}
                y={STROKE_WIDTH / 2}
                width={w - STROKE_WIDTH}
                height={h - STROKE_WIDTH}
                rx={BORDER_RADIUS}
                ry={BORDER_RADIUS}
                stroke="rgba(255,255,255,0.25)"
                strokeWidth={STROKE_WIDTH}
                fill="transparent"
              />
              <AnimatedRect
                animatedProps={animatedProps}
                x={STROKE_WIDTH / 2}
                y={STROKE_WIDTH / 2}
                width={w - STROKE_WIDTH}
                height={h - STROKE_WIDTH}
                rx={BORDER_RADIUS}
                ry={BORDER_RADIUS}
                stroke="#7dd3fc"
                strokeWidth={STROKE_WIDTH}
                strokeDasharray={[dash, gap]}
                strokeLinecap="round"
                fill="transparent"
              />
            </>
          )}
        </Svg>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  shadowWrap: {
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
    borderRadius: BORDER_RADIUS,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 6,
  },
  container: {
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
    borderRadius: BORDER_RADIUS,
    overflow: 'hidden',
    backgroundColor: '#111827',
  },
  imageBg: {
    flex: 1,
  },
  image: {
    borderRadius: BORDER_RADIUS,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.2)',
  },
  content: {
    flex: 1,
    padding: 16,
    justifyContent: 'space-between',
  },
  title: {
    color: 'white',
    fontSize: 20,
    fontWeight: '700',
  },
  pointsPill: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(0,0,0,0.35)',
    borderColor: 'rgba(255,255,255,0.35)',
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
  },
  pointsText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 14,
    letterSpacing: 0.3,
  },
  svgOverlay: {
    position: 'absolute',
    left: 0,
    top: 0,
  },
});

