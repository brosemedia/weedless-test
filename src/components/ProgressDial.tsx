import React from 'react';
import { View, Text, type TextStyle } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { useTheme } from '../design/theme';

export default function ProgressDial({
  value,
  label,
  size = 96,
  stroke = 10,
  color,
  track,
  hideLabel = false,
  percentSize,
  percentTextStyle,
  labelTextStyle,
}: {
  value: number;
  label?: string;
  size?: number;
  stroke?: number;
  color?: string;
  track?: string;
  hideLabel?: boolean;
  percentSize?: number;
  percentTextStyle?: TextStyle;
  labelTextStyle?: TextStyle;
}) {
  const theme = useTheme();
  const strokeColor = color ?? theme.colors.primary;
  const trackColor = track ?? theme.colors.primaryMuted;
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
            stroke={trackColor}
            strokeWidth={stroke}
            fill="none"
            transform={`rotate(-90 ${size / 2} ${size / 2})`}
          />
          <Circle
            cx={size / 2}
            cy={size / 2}
            r={r}
            stroke={strokeColor}
            strokeWidth={stroke}
            fill="none"
            strokeDasharray={`${dash}, ${c - dash}`}
            strokeLinecap="round"
            transform={`rotate(-90 ${size / 2} ${size / 2})`}
          />
        </Svg>
        <Text
          style={[
            {
              position: 'absolute',
              left: 0,
              right: 0,
              top: '50%',
              textAlign: 'center',
              color: theme.colors.text,
              transform: [
                {
                  translateY:
                    -((percentSize ?? (theme.typography.variants.h2 as any)?.fontSize ?? 24) * 0.55),
                },
              ],
            },
            theme.typography.variants.h2 as any,
            percentSize != null ? { fontSize: percentSize, lineHeight: percentSize * 1.05 } : null,
            percentTextStyle,
          ]}
        >
          {percent}%
        </Text>
      </View>
      {!hideLabel && label != null ? (
        <Text
          style={[
            { marginTop: 6, color: theme.colors.textMuted, textAlign: 'center' },
            theme.typography.variants.caption as any,
            labelTextStyle,
          ]}
        >
          {label}
        </Text>
      ) : null}
    </View>
  );
}
