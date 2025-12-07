/**
 * GlassSurface – iOS 26 „Liquid Glass" Container
 *
 * Diese Komponente erstellt eine glasartige Oberfläche mit:
 * - Blur-Effekt (expo-blur)
 * - Halbtransparentem Hintergrund
 * - Subtilen Borders und Highlights
 * - Automatischer Dark/Light Mode Anpassung
 *
 * Verwendung:
 * ```tsx
 * <GlassSurface padding={20} borderRadius={24}>
 *   <Text>Inhalt auf Glas</Text>
 * </GlassSurface>
 * ```
 */

import React from 'react';
import {
  View,
  StyleSheet,
  Platform,
  type ViewStyle,
  type StyleProp,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../../theme/useTheme';

export type GlassSurfaceProps = {
  children: React.ReactNode;
  /** Innenabstand (Standard: 16) */
  padding?: number;
  /** Eckenradius (Standard: 20) */
  borderRadius?: number;
  /** Blur-Intensität 0-100 (Standard: 80) */
  blurIntensity?: number;
  /** Zusätzliche Styles für den Container */
  style?: StyleProp<ViewStyle>;
  /** Deaktiviert den Schatten */
  noShadow?: boolean;
  /** Variante: 'default' | 'elevated' | 'subtle' */
  variant?: 'default' | 'elevated' | 'subtle';
};

export function GlassSurface({
  children,
  padding = 16,
  borderRadius = 20,
  blurIntensity = 80,
  style,
  noShadow = false,
  variant = 'default',
}: GlassSurfaceProps) {
  const { mode, theme } = useTheme();
  const isDark = mode === 'dark';

  // Dynamische Glas-Farben basierend auf Theme und Variante
  const glassColors = React.useMemo(() => {
    const base = isDark
      ? {
          // Dark Mode – tiefes, grünliches Glas passend zu Hazeless
          blur: 'systemMaterialDark' as const,
          background: 'rgba(26, 40, 31, 0.7)',
          backgroundSubtle: 'rgba(26, 40, 31, 0.5)',
          backgroundElevated: 'rgba(26, 40, 31, 0.85)',
          border: 'rgba(120, 200, 120, 0.2)',
          borderHighlight: 'rgba(255, 255, 255, 0.08)',
          topHighlight: 'rgba(255, 255, 255, 0.12)',
          gradientStart: 'rgba(100, 180, 100, 0.1)',
          gradientEnd: 'rgba(100, 180, 100, 0.02)',
        }
      : {
          // Light Mode – helles, freundliches Glas
          blur: 'systemMaterial' as const,
          background: 'rgba(255, 255, 255, 0.78)',
          backgroundSubtle: 'rgba(255, 255, 255, 0.6)',
          backgroundElevated: 'rgba(255, 255, 255, 0.92)',
          border: 'rgba(0, 0, 0, 0.08)',
          borderHighlight: 'rgba(255, 255, 255, 0.5)',
          topHighlight: 'rgba(255, 255, 255, 0.8)',
          gradientStart: 'rgba(255, 255, 255, 0.5)',
          gradientEnd: 'rgba(255, 255, 255, 0.1)',
        };

    return base;
  }, [isDark]);

  // Varianten-spezifische Anpassungen
  const variantStyles = React.useMemo((): ViewStyle => {
    switch (variant) {
      case 'elevated':
        return {
          backgroundColor: glassColors.backgroundElevated,
        };
      case 'subtle':
        return {
          backgroundColor: glassColors.backgroundSubtle,
        };
      default:
        return {
          backgroundColor: glassColors.background,
        };
    }
  }, [variant, glassColors]);

  // Schatten-Styles
  const shadowStyles = React.useMemo((): ViewStyle => {
    if (noShadow) return {};
    return {
      shadowColor: isDark ? '#000' : theme.colors.primary,
      shadowOffset: { width: 0, height: variant === 'elevated' ? 12 : 8 },
      shadowOpacity: isDark ? 0.4 : 0.15,
      shadowRadius: variant === 'elevated' ? 24 : 16,
      elevation: variant === 'elevated' ? 8 : 4,
    };
  }, [noShadow, isDark, theme.colors.primary, variant]);

  const supportsBlur = Platform.OS === 'ios';

  return (
    <View
      style={[
        styles.container,
        {
          borderRadius,
          borderColor: glassColors.border,
        },
        shadowStyles,
        style,
      ]}
    >
      {/* Blur-Hintergrund (nur iOS) */}
      {supportsBlur && (
        <BlurView
          intensity={blurIntensity}
          tint={glassColors.blur}
          style={[StyleSheet.absoluteFill, { borderRadius }]}
        />
      )}

      {/* Halbtransparenter Hintergrund mit Variante */}
      <View
        style={[
          StyleSheet.absoluteFill,
          variantStyles,
          { borderRadius },
        ]}
      />

      {/* Gradient-Overlay für Tiefe */}
      <LinearGradient
        colors={[glassColors.gradientStart, 'transparent', glassColors.gradientEnd]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[StyleSheet.absoluteFill, { borderRadius }]}
        pointerEvents="none"
      />

      {/* Top-Highlight (Lichtreflex) */}
      <View
        style={[
          styles.topHighlight,
          {
            backgroundColor: glassColors.topHighlight,
            borderTopLeftRadius: borderRadius,
            borderTopRightRadius: borderRadius,
          },
        ]}
        pointerEvents="none"
      />

      {/* Inner Border Highlight */}
      <View
        style={[
          styles.innerBorder,
          {
            borderRadius: borderRadius - 1,
            borderColor: glassColors.borderHighlight,
          },
        ]}
        pointerEvents="none"
      />

      {/* Content */}
      <View style={[styles.content, { padding }]}>
        {children}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden',
    borderWidth: 1,
  },
  topHighlight: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 1,
  },
  innerBorder: {
    position: 'absolute',
    top: 1,
    left: 1,
    right: 1,
    bottom: 1,
    borderWidth: 0.5,
  },
  content: {
    position: 'relative',
    zIndex: 1,
  },
});

export default GlassSurface;

