import React from 'react';
import { View, Text } from 'react-native';
import Svg, { Circle, G } from 'react-native-svg';

export default function ProgressDial({
  value,
  label,
  size = 96,
  stroke = 10,
  color = '#4F7A1F',
  track = '#E5E7EB',
}: {
  value: number;
  label: string;
  size?: number;
  stroke?: number;
  color?: string;
  track?: string;
}) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const pct = Math.max(0, Math.min(1, value ?? 0));
  const dash = c * pct;
  const percent = Math.round(pct * 100);

  return (
    <View
      accessible
      accessibilityRole="progressbar"
      accessibilityValue={{ now: percent, min: 0, max: 100 }}
      style={{ alignItems: 'center' }}
    >
      <View style={{ width: size, height: size }}>
        <Svg width={size} height={size}>
          <Circle
            cx={size / 2}
            cy={size / 2}
            r={r}
            stroke={track}
            strokeWidth={stroke}
            fill="none"
            transform={`rotate(-90 ${size / 2} ${size / 2})`}
          />
          <Circle
            cx={size / 2}
            cy={size / 2}
            r={r}
            stroke={color}
            strokeWidth={stroke}
            fill="none"
            strokeDasharray={`${dash}, ${c - dash}`}
            strokeLinecap="round"
            transform={`rotate(-90 ${size / 2} ${size / 2})`}
          />
        </Svg>
        <Text
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            top: size / 2 - 10,
            textAlign: 'center',
            fontWeight: '700',
          }}
        >
          {percent}%
        </Text>
      </View>
      <Text style={{ marginTop: 6, color: '#4B5563' }}>{label}</Text>
    </View>
  );
}
