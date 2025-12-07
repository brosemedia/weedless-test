/**
 * GlassButton – iOS 26 „Liquid Glass" Button
 *
 * Interaktiver Button mit Glas-Optik. Pill-förmig mit hohem Kontrast.
 *
 * Verwendung:
 * ```tsx
 * <GlassButton
 *   label="Weiter"
 *   onPress={() => console.log('Pressed!')}
 * />
 *
 * <GlassButton
 *   label="Mit Icon"
 *   onPress={handlePress}
 *   icon={<MaterialCommunityIcons name="arrow-right" size={20} color="#FFF" />}
 *   variant="primary"
 * />
 *
 * <GlassButton
 *   label="Kompakt"
 *   onPress={handlePress}
 *   compact
 *   variant="secondary"
 * />
 * ```
 */

import React from 'react';
import {
  Pressable,
  Text,
  View,
  StyleSheet,
  Platform,
  type ViewStyle,
  type StyleProp,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { useTheme } from '../../theme/useTheme';
import { fonts } from '../../design/tokens';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export type GlassButtonVariant = 'primary' | 'secondary' | 'ghost';

export type GlassButtonProps = {
  /** Button-Label */
  label: string;
  /** Press-Handler */
  onPress: () => void;
  /** Optional: Icon links vom Label (React-Element) */
  icon?: React.ReactNode;
  /** Optional: Icon rechts vom Label */
  iconRight?: React.ReactNode;
  /** Variante: 'primary' | 'secondary' | 'ghost' (Standard: 'primary') */
  variant?: GlassButtonVariant;
  /** Kompakte Größe */
  compact?: boolean;
  /** Deaktiviert */
  disabled?: boolean;
  /** Volle Breite */
  fullWidth?: boolean;
  /** Zusätzliche Container-Styles */
  style?: StyleProp<ViewStyle>;
};

export function GlassButton({
  label,
  onPress,
  icon,
  iconRight,
  variant = 'primary',
  compact = false,
  disabled = false,
  fullWidth = false,
  style,
}: GlassButtonProps) {
  const { mode, theme } = useTheme();
  const isDark = mode === 'dark';
  const scale = useSharedValue(1);

  // Farben basierend auf Variante und Theme
  const buttonColors = React.useMemo(() => {
    const primary = theme.colors.primary;
    
    if (variant === 'primary') {
      return {
        blur: isDark ? 'systemThickMaterialDark' as const : 'systemThickMaterial' as const,
        background: primary,
        backgroundPressed: isDark ? 'rgba(100, 160, 50, 0.9)' : 'rgba(140, 180, 40, 0.9)',
        border: isDark ? 'rgba(180, 220, 100, 0.4)' : 'rgba(255, 255, 255, 0.5)',
        text: '#FFFFFF',
        highlight: 'rgba(255, 255, 255, 0.3)',
      };
    }
    
    if (variant === 'secondary') {
      return {
        blur: isDark ? 'systemMaterialDark' as const : 'systemMaterial' as const,
        background: isDark ? 'rgba(60, 100, 60, 0.5)' : 'rgba(255, 255, 255, 0.7)',
        backgroundPressed: isDark ? 'rgba(60, 100, 60, 0.7)' : 'rgba(255, 255, 255, 0.9)',
        border: isDark ? 'rgba(120, 180, 120, 0.3)' : 'rgba(0, 0, 0, 0.1)',
        text: isDark ? '#FFFFFF' : theme.colors.text,
        highlight: isDark ? 'rgba(255, 255, 255, 0.15)' : 'rgba(255, 255, 255, 0.5)',
      };
    }
    
    // Ghost
    return {
      blur: isDark ? 'systemThinMaterialDark' as const : 'systemThinMaterial' as const,
      background: 'transparent',
      backgroundPressed: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)',
      border: 'transparent',
      text: isDark ? theme.colors.primary : theme.colors.text,
      highlight: 'transparent',
    };
  }, [variant, isDark, theme.colors]);

  // Animated press style
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const { haptics } = require('../../services/haptics');

  const handlePressIn = () => {
    scale.value = withSpring(0.96, { damping: 15, stiffness: 400 });
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 15, stiffness: 400 });
  };

  const handlePress = () => {
    haptics.trigger('general', 'selection');
    onPress();
  };

  const supportsBlur = Platform.OS === 'ios';
  const paddingVertical = compact ? 10 : 14;
  const paddingHorizontal = compact ? 18 : 24;
  const borderRadius = compact ? 16 : 20;
  const fontSize = compact ? 14 : 16;

  return (
    <AnimatedPressable
      onPress={handlePress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      disabled={disabled}
      style={[
        styles.container,
        {
          borderRadius,
          borderColor: buttonColors.border,
          opacity: disabled ? 0.5 : 1,
          alignSelf: fullWidth ? 'stretch' : 'flex-start',
        },
        animatedStyle,
        style,
      ]}
      accessibilityRole="button"
      accessibilityLabel={label}
    >
      {/* Blur-Hintergrund (nur iOS, nur bei nicht-primary) */}
      {supportsBlur && variant !== 'primary' && (
        <BlurView
          intensity={60}
          tint={buttonColors.blur}
          style={[StyleSheet.absoluteFill, { borderRadius }]}
        />
      )}

      {/* Farbiger Hintergrund */}
      {variant === 'primary' ? (
        <LinearGradient
          colors={[
            buttonColors.background,
            isDark ? 'rgba(80, 140, 40, 0.95)' : 'rgba(140, 170, 40, 0.95)',
          ]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[StyleSheet.absoluteFill, { borderRadius }]}
        />
      ) : (
        <View
          style={[
            StyleSheet.absoluteFill,
            { backgroundColor: buttonColors.background, borderRadius },
          ]}
        />
      )}

      {/* Top-Highlight */}
      {variant !== 'ghost' && (
        <View
          style={[
            styles.topHighlight,
            {
              backgroundColor: buttonColors.highlight,
              borderTopLeftRadius: borderRadius,
              borderTopRightRadius: borderRadius,
            },
          ]}
          pointerEvents="none"
        />
      )}

      {/* Content */}
      <View
        style={[
          styles.content,
          {
            paddingVertical,
            paddingHorizontal,
          },
        ]}
      >
        {icon && <View style={styles.iconLeft}>{icon}</View>}
        <Text
          style={[
            styles.label,
            {
              color: buttonColors.text,
              fontSize,
            },
          ]}
          numberOfLines={1}
        >
          {label}
        </Text>
        {iconRight && <View style={styles.iconRight}>{iconRight}</View>}
      </View>
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden',
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  topHighlight: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 1,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  iconLeft: {
    marginRight: 2,
  },
  iconRight: {
    marginLeft: 2,
  },
  label: {
    fontFamily: fonts.semibold,
    fontWeight: '600',
    textAlign: 'center',
  },
});

export default GlassButton;

