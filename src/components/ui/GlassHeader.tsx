/**
 * GlassHeader – iOS 26 „Liquid Glass" Navigation Header
 *
 * Navigationsleiste im iOS-Stil mit Blur-Hintergrund und optionalem Back-Button.
 * Integriert sich automatisch mit React Navigation.
 *
 * Verwendung:
 * ```tsx
 * // Einfacher Header mit Titel
 * <GlassHeader title="Einstellungen" />
 *
 * // Header ohne Back-Button
 * <GlassHeader title="Dashboard" showBackButton={false} />
 *
 * // Header mit Custom Back-Handler
 * <GlassHeader
 *   title="Formular"
 *   onBackPress={() => {
 *     // Bestätigung vor dem Zurückgehen
 *     Alert.alert('Wirklich zurück?', '', [
 *       { text: 'Abbrechen' },
 *       { text: 'Ja', onPress: () => navigation.goBack() },
 *     ]);
 *   }}
 * />
 *
 * // Header mit rechtem Zusatz-Element
 * <GlassHeader
 *   title="Profil"
 *   rightElement={<SettingsIcon />}
 * />
 * ```
 */

import React from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  Platform,
  type ViewStyle,
  type StyleProp,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  interpolate,
  Extrapolation,
} from 'react-native-reanimated';
import { useTheme } from '../../theme/useTheme';
import { fonts, spacing } from '../../design/tokens';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

/** Höhe des Header-Inhaltsbereichs (ohne Safe Area) */
export const GLASS_HEADER_HEIGHT = 52;

export type GlassHeaderProps = {
  /** Titel in der Mitte/links des Headers */
  title?: string;
  /** Zeigt Back-Button an (Standard: true) */
  showBackButton?: boolean;
  /** Custom Back-Handler. Falls nicht gesetzt, wird navigation.goBack() verwendet */
  onBackPress?: () => void;
  /** Back-Button Label (Standard: keins, nur Icon) */
  backLabel?: string;
  /** Element auf der rechten Seite (z.B. Action-Button) */
  rightElement?: React.ReactNode;
  /** Blur-Intensität (Standard: 80) */
  blurIntensity?: number;
  /** Zusätzliche Container-Styles */
  style?: StyleProp<ViewStyle>;
  /** Ob der Header „schwebend" sein soll (mit Abstand zu den Rändern) */
  floating?: boolean;
  /** Transparenter Modus (kein Blur, nur für spezielle Screens) */
  transparent?: boolean;
};

export function GlassHeader({
  title,
  showBackButton = true,
  onBackPress,
  backLabel,
  rightElement,
  blurIntensity = 80,
  style,
  floating = false,
  transparent = false,
}: GlassHeaderProps) {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const { mode, theme } = useTheme();
  const isDark = mode === 'dark';

  // Animation für den Back-Button
  const backButtonScale = useSharedValue(1);

  // Glas-Farben basierend auf Theme
  const glassColors = React.useMemo(() => {
    return isDark
      ? {
          blur: 'systemMaterialDark' as const,
          background: 'rgba(26, 40, 31, 0.75)',
          border: 'rgba(120, 200, 120, 0.2)',
          borderBottom: 'rgba(120, 200, 120, 0.15)',
          topHighlight: 'rgba(255, 255, 255, 0.1)',
          text: '#FFFFFF',
          textMuted: 'rgba(255, 255, 255, 0.7)',
          backButtonBg: 'rgba(255, 255, 255, 0.12)',
          backButtonBgPressed: 'rgba(255, 255, 255, 0.2)',
          gradientStart: 'rgba(80, 140, 80, 0.15)',
          gradientEnd: 'transparent',
        }
      : {
          blur: 'systemMaterial' as const,
          background: 'rgba(255, 255, 255, 0.82)',
          border: 'rgba(0, 0, 0, 0.06)',
          borderBottom: 'rgba(0, 0, 0, 0.08)',
          topHighlight: 'rgba(255, 255, 255, 0.9)',
          text: theme.colors.text,
          textMuted: theme.colors.textMuted,
          backButtonBg: 'rgba(0, 0, 0, 0.06)',
          backButtonBgPressed: 'rgba(0, 0, 0, 0.12)',
          gradientStart: 'rgba(255, 255, 255, 0.5)',
          gradientEnd: 'transparent',
        };
  }, [isDark, theme.colors]);

  // Back-Button Animation
  const backButtonAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: backButtonScale.value }],
    opacity: interpolate(
      backButtonScale.value,
      [0.9, 1],
      [0.8, 1],
      Extrapolation.CLAMP
    ),
  }));

  const handleBackPressIn = () => {
    backButtonScale.value = withSpring(0.9, { damping: 15, stiffness: 400 });
  };

  const handleBackPressOut = () => {
    backButtonScale.value = withSpring(1, { damping: 15, stiffness: 400 });
  };

  const handleBackPress = () => {
    if (onBackPress) {
      onBackPress();
    } else if (navigation.canGoBack()) {
      navigation.goBack();
    }
  };

  const supportsBlur = Platform.OS === 'ios';
  const paddingTop = insets.top + (floating ? 8 : 0);
  const borderRadius = floating ? 20 : 0;
  const horizontalMargin = floating ? spacing.m : 0;

  // Prüfe ob wir zurückgehen können
  const canGoBack = navigation.canGoBack();
  const shouldShowBack = showBackButton && canGoBack;

  if (transparent) {
    return (
      <View
        style={[
          styles.container,
          {
            paddingTop,
            marginHorizontal: horizontalMargin,
            marginTop: floating ? spacing.s : 0,
          },
          style,
        ]}
      >
        <View style={styles.content}>
          {/* Back Button */}
          {shouldShowBack && (
            <AnimatedPressable
              onPress={handleBackPress}
              onPressIn={handleBackPressIn}
              onPressOut={handleBackPressOut}
              style={[styles.backButton, backButtonAnimatedStyle]}
              accessibilityRole="button"
              accessibilityLabel="Zurück"
            >
              <MaterialCommunityIcons
                name="chevron-left"
                size={28}
                color={glassColors.text}
              />
              {backLabel && (
                <Text style={[styles.backLabel, { color: glassColors.text }]}>
                  {backLabel}
                </Text>
              )}
            </AnimatedPressable>
          )}

          {/* Spacer wenn kein Back-Button */}
          {!shouldShowBack && <View style={styles.spacer} />}

          {/* Title */}
          <View style={styles.titleContainer}>
            {title && (
              <Text
                style={[styles.title, { color: glassColors.text }]}
                numberOfLines={1}
              >
                {title}
              </Text>
            )}
          </View>

          {/* Right Element oder Spacer */}
          {rightElement ? (
            <View style={styles.rightElement}>{rightElement}</View>
          ) : (
            <View style={styles.spacer} />
          )}
        </View>
      </View>
    );
  }

  return (
    <View
      style={[
        styles.container,
        {
          paddingTop,
          marginHorizontal: horizontalMargin,
          marginTop: floating ? spacing.s : 0,
          borderRadius,
          borderColor: glassColors.border,
          borderWidth: floating ? 1 : 0,
          borderBottomWidth: floating ? 1 : StyleSheet.hairlineWidth,
          borderBottomColor: glassColors.borderBottom,
          overflow: 'hidden',
        },
        !floating && styles.containerShadow,
        style,
      ]}
    >
      {/* Blur-Hintergrund */}
      {supportsBlur && (
        <BlurView
          intensity={blurIntensity}
          tint={glassColors.blur}
          style={[StyleSheet.absoluteFill, { borderRadius }]}
        />
      )}

      {/* Halbtransparenter Hintergrund */}
      <View
        style={[
          StyleSheet.absoluteFill,
          { backgroundColor: glassColors.background, borderRadius },
        ]}
      />

      {/* Gradient-Overlay */}
      <LinearGradient
        colors={[glassColors.gradientStart, glassColors.gradientEnd]}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={[StyleSheet.absoluteFill, { borderRadius }]}
        pointerEvents="none"
      />

      {/* Top-Highlight */}
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

      {/* Content */}
      <View style={styles.content}>
        {/* Back Button */}
        {shouldShowBack && (
          <AnimatedPressable
            onPress={handleBackPress}
            onPressIn={handleBackPressIn}
            onPressOut={handleBackPressOut}
            style={[
              styles.backButton,
              styles.backButtonGlass,
              { backgroundColor: glassColors.backButtonBg },
              backButtonAnimatedStyle,
            ]}
            accessibilityRole="button"
            accessibilityLabel="Zurück"
          >
            <MaterialCommunityIcons
              name="chevron-left"
              size={26}
              color={glassColors.text}
            />
            {backLabel && (
              <Text style={[styles.backLabel, { color: glassColors.text }]}>
                {backLabel}
              </Text>
            )}
          </AnimatedPressable>
        )}

        {/* Spacer wenn kein Back-Button */}
        {!shouldShowBack && <View style={styles.spacer} />}

        {/* Title */}
        <View style={styles.titleContainer}>
          {title && (
            <Text
              style={[styles.title, { color: glassColors.text }]}
              numberOfLines={1}
            >
              {title}
            </Text>
          )}
        </View>

        {/* Right Element oder Spacer */}
        {rightElement ? (
          <View style={styles.rightElement}>{rightElement}</View>
        ) : (
          <View style={styles.spacer} />
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 100,
  },
  containerShadow: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
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
    height: GLASS_HEADER_HEIGHT,
    paddingHorizontal: spacing.m,
    gap: spacing.s,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    minWidth: 44,
    minHeight: 44,
    justifyContent: 'center',
  },
  backButtonGlass: {
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 6,
  },
  backLabel: {
    fontFamily: fonts.regular,
    fontSize: 16,
    marginLeft: -4,
  },
  titleContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontFamily: fonts.semibold,
    fontSize: 17,
    fontWeight: '600',
    textAlign: 'center',
  },
  rightElement: {
    minWidth: 44,
    alignItems: 'flex-end',
  },
  spacer: {
    minWidth: 44,
  },
});

export default GlassHeader;

