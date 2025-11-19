import React from 'react';
import { View, StyleSheet, Platform, type ViewProps } from 'react-native';
import { BlurView, type BlurTint } from 'expo-blur';

type Props = ViewProps & {
  intensity?: number;
  tint?: BlurTint;
  fallbackColor?: string;
  overlayColor?: string;
  borderRadius?: number;
};

const SUPPORTS_BLUR = Platform.OS === 'ios' || Platform.OS === 'android';

export function FrostedSurface({
  children,
  style,
  intensity = 65,
  tint = 'light',
  fallbackColor = 'rgba(255,255,255,0.08)',
  overlayColor = 'rgba(255,255,255,0.22)',
  borderRadius = 24,
  ...rest
}: Props) {
  if (!SUPPORTS_BLUR) {
    return (
      <View
        style={[
          { backgroundColor: overlayColor ?? fallbackColor, borderRadius },
          style,
        ]}
        {...rest}
      >
        {children}
      </View>
    );
  }
  return (
    <View
      style={[
        {
          borderRadius,
          overflow: 'hidden',
          backgroundColor: fallbackColor,
        },
        style,
      ]}
      {...rest}
    >
      <BlurView
        pointerEvents="none"
        intensity={intensity}
        tint={tint}
        style={StyleSheet.absoluteFill}
      />
      {overlayColor ? (
        <View pointerEvents="none" style={[StyleSheet.absoluteFill, { backgroundColor: overlayColor }]} />
      ) : null}
      {children}
    </View>
  );
}
