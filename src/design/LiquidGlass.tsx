import React from 'react';
import { View, StyleSheet, Platform, type ViewProps } from 'react-native';
import { BlurView, type BlurTint } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';

/**
 * Moderne iOS-inspirierte Glasmorphismus-Komponente
 * 
 * Nutzt native iOS-Blur-Effekte für ein authentisches Apple-Design.
 * Auf iOS wird der native UIVisualEffectView verwendet.
 * 
 * @example
 * // Standard Glass-Card
 * <LiquidGlass borderRadius={20} style={{ padding: 16 }}>
 *   <Text>Content</Text>
 * </LiquidGlass>
 * 
 * @example
 * // Navigation Bar Style (systemMaterial)
 * <LiquidGlass 
 *   variant="navigationBar"
 *   tint="systemMaterial"
 * >
 *   <Text>Nav Content</Text>
 * </LiquidGlass>
 */

type GlassVariant = 'default' | 'card' | 'navigationBar' | 'prominent';

type Props = ViewProps & {
  /** Blur-Intensität (0-100). Höhere Werte = mehr Blur */
  intensity?: number;
  /** 
   * Blur-Tint für iOS. Empfohlen für iOS 17+:
   * - 'systemMaterial' / 'systemMaterialDark' - Standard iOS Material
   * - 'systemThinMaterial' / 'systemThinMaterialDark' - Dünneres Material
   * - 'systemUltraThinMaterial' - Sehr transparent
   * - 'systemThickMaterial' - Dickeres Material
   * - 'systemChromeMaterial' - Chrome-artiger Effekt
   */
  tint?: BlurTint;
  /** Fallback-Farbe für Plattformen ohne Blur-Support */
  fallbackColor?: string;
  /** Semi-transparente Overlay-Farbe */
  overlayColor?: string;
  /** Eckenradius */
  borderRadius?: number;
  /** Rahmenbreite */
  borderWidth?: number;
  /** Rahmenfarbe (semi-transparent für Glass-Effekt) */
  borderColor?: string;
  /** Schatten aktivieren */
  shadow?: boolean;
  /** Gradient-Overlay für extra Glanz */
  gradientOverlay?: boolean;
  /** Vordefinierte Varianten für schnelle Nutzung */
  variant?: GlassVariant;
};

const SUPPORTS_BLUR = Platform.OS === 'ios' || Platform.OS === 'android';

// Vordefinierte Varianten-Konfigurationen
const VARIANT_CONFIGS: Record<GlassVariant, Partial<Props>> = {
  default: {},
  card: {
    borderRadius: 20,
    borderWidth: 0.5,
    borderColor: 'rgba(255,255,255,0.18)',
    intensity: 80,
    shadow: true,
    gradientOverlay: true,
  },
  navigationBar: {
    borderRadius: 0,
    borderWidth: 0,
    intensity: 100,
    shadow: false,
    gradientOverlay: false,
    tint: 'systemMaterial',
  },
  prominent: {
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
    intensity: 90,
    shadow: true,
    gradientOverlay: true,
  },
};

export function LiquidGlass({
  children,
  style,
  intensity = 80,
  tint = 'systemThinMaterial',
  fallbackColor = 'rgba(255,255,255,0.12)',
  overlayColor = 'rgba(255,255,255,0.08)',
  borderRadius = 0,
  borderWidth = 0.5,
  borderColor = 'rgba(255,255,255,0.18)',
  shadow = true,
  gradientOverlay = true,
  variant = 'default',
  ...rest
}: Props) {
  // Merge variant config mit props (props überschreiben variant defaults)
  const variantConfig = VARIANT_CONFIGS[variant];
  const finalIntensity = intensity ?? variantConfig.intensity ?? 80;
  const finalTint = tint ?? variantConfig.tint ?? 'systemThinMaterial';
  const finalBorderRadius = borderRadius ?? variantConfig.borderRadius ?? 0;
  const finalBorderWidth = borderWidth ?? variantConfig.borderWidth ?? 0.5;
  const finalBorderColor = borderColor ?? variantConfig.borderColor ?? 'rgba(255,255,255,0.18)';
  const finalShadow = shadow ?? variantConfig.shadow ?? true;
  const finalGradientOverlay = gradientOverlay ?? variantConfig.gradientOverlay ?? true;

  // iOS-spezifische Schatten für authentischen Look
  const shadowStyle = finalShadow ? {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: Platform.OS === 'ios' ? 0.12 : 0.2,
    shadowRadius: 24,
    elevation: 12,
  } : {};

  if (!SUPPORTS_BLUR) {
    return (
      <View
        style={[
          {
            backgroundColor: overlayColor ?? fallbackColor,
            borderRadius: finalBorderRadius,
            borderWidth: finalBorderWidth,
            borderColor: finalBorderColor,
          },
          shadowStyle,
          style,
        ]}
        {...rest}
      >
        {children}
      </View>
    );
  }

  // Bestimme Gradient-Farben basierend auf Tint
  const isDarkTint = finalTint.includes('dark') || finalTint.includes('Dark');
  const gradientColors = isDarkTint
    ? ['rgba(255,255,255,0.08)', 'rgba(255,255,255,0.02)', 'rgba(255,255,255,0.06)']
    : ['rgba(255,255,255,0.25)', 'rgba(255,255,255,0.1)', 'rgba(255,255,255,0.2)'];

  return (
    <View
      style={[
        {
          borderRadius: finalBorderRadius,
          overflow: 'hidden',
          backgroundColor: fallbackColor,
          borderWidth: finalBorderWidth,
          borderColor: finalBorderColor,
        },
        shadowStyle,
        style,
      ]}
      {...rest}
    >
      <BlurView
        pointerEvents="none"
        intensity={finalIntensity}
        tint={finalTint}
        style={StyleSheet.absoluteFill}
      />
      {finalGradientOverlay && (
        <LinearGradient
          pointerEvents="none"
          colors={gradientColors}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
      )}
      {overlayColor && !finalGradientOverlay ? (
        <View 
          pointerEvents="none" 
          style={[StyleSheet.absoluteFill, { backgroundColor: overlayColor }]} 
        />
      ) : null}
      {children}
    </View>
  );
}

/**
 * Vorkonfigurierte Glass-Card für schnelle Nutzung
 */
export function GlassCard(props: Omit<Props, 'variant'>) {
  return <LiquidGlass variant="card" {...props} />;
}

/**
 * Glass-Container für Navigation Bars
 */
export function GlassNavigationBar(props: Omit<Props, 'variant'>) {
  return <LiquidGlass variant="navigationBar" {...props} />;
}

