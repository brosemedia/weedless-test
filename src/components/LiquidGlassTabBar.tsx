import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Platform,
  Image,
  Pressable,
  type ImageSourcePropType,
  type LayoutChangeEvent,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  useAnimatedStyle,
  withSpring,
  withTiming,
  withSequence,
  withDelay,
  cancelAnimation,
  withRepeat,
  useSharedValue,
  runOnJS,
  interpolate,
  Extrapolation,
  type SharedValue,
  Easing,
} from 'react-native-reanimated';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { useTheme } from '../theme/useTheme';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import type { NavigationContainerRefWithCurrent } from '@react-navigation/native';
import { haptics } from '../services/haptics';

const TAB_ICON_DASHBOARD = require('../../assets/029-online.png');
const TAB_ICON_TRACKEN = require('../../assets/044-magnifying_glass.png');
const TAB_ICON_MISSIONS = require('../../assets/033-book.png');
const TAB_ICON_MILESTONES = require('../../assets/004-medal.png');

const TAB_ICONS: Record<string, ImageSourcePropType> = {
  Dashboard: TAB_ICON_DASHBOARD,
  Tracken: TAB_ICON_TRACKEN,
  Wissen: TAB_ICON_MISSIONS,
  Meilensteine: TAB_ICON_MILESTONES,
};

const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity);

/**
 * Plus Button with periodic rotation animation
 */
function PlusButton({ onPress, primaryColor, isDark }: { onPress: () => void; primaryColor: string; isDark: boolean }) {
  const rotation = useSharedValue(0);
  
  // Animation: alle 10 Sekunden 3 mal schnell rotieren – stabil ohne Race Conditions
  React.useEffect(() => {
    rotation.value = withRepeat(
      withSequence(
        withTiming(1080, { duration: 1100, easing: Easing.out(Easing.cubic) }),
        withDelay(8900, withTiming(0, { duration: 0 }))
      ),
      -1,
      false
    );
    return () => {
      cancelAnimation(rotation);
    };
  }, [rotation]);
  
  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ rotate: `${rotation.value}deg` }],
    };
  });
  
  const handlePress = React.useCallback(() => {
    haptics.trigger('general', 'selection');
    onPress();
  }, [onPress]);

  return (
    <View style={styles.plusButtonContainer}>
      <Pressable
        onPress={handlePress}
        style={({ pressed }) => [
          styles.plusButton,
          {
            backgroundColor: primaryColor,
            borderColor: isDark ? 'rgba(255,255,255,0.16)' : 'rgba(0,0,0,0.04)',
            shadowColor: isDark ? '#0f1a14' : '#000',
          },
          pressed && { transform: [{ scale: 0.95 }] },
        ]}
        accessibilityRole="button"
        accessibilityLabel="Schnellaktionen öffnen"
      >
        <Animated.View style={animatedStyle}>
          <Ionicons name="add" size={28} color="#FFFFFF" />
        </Animated.View>
      </Pressable>
    </View>
  );
}

/**
 * Animated Tab Item with zoom effect based on indicator proximity
 */
type AnimatedTabItemProps = {
  index: number;
  indicatorPosition: SharedValue<number>;
  iconSource?: ImageSourcePropType;
  label: string;
  isFocused: boolean;
  activeColor: string;
  inactiveColor: string;
  onPress: () => void;
  onLongPress: () => void;
  accessibilityLabel?: string;
  testID?: string;
};

function AnimatedTabItem({
  index,
  indicatorPosition,
  iconSource,
  label,
  isFocused,
  activeColor,
  inactiveColor,
  onPress,
  onLongPress,
  accessibilityLabel,
  testID,
}: AnimatedTabItemProps) {
  // Icon size based on focus state - use direct size instead of scale to avoid pixelation
  const iconSize = isFocused ? 30 : 26; // Active tab slightly larger, inactive tabs normal size

  const handlePress = React.useCallback(() => {
    haptics.trigger('general', 'selection');
    onPress();
  }, [onPress]);

  return (
    <AnimatedTouchable
      accessibilityRole="button"
      accessibilityState={isFocused ? { selected: true } : {}}
      accessibilityLabel={accessibilityLabel}
      testID={testID}
      onPress={handlePress}
      onLongPress={onLongPress}
      style={styles.tabItem}
      activeOpacity={0.7}
    >
      {iconSource ? (
        <Image
          source={iconSource}
          style={[
            {
              width: iconSize,
              height: iconSize,
            },
            {
              tintColor: isFocused ? activeColor : inactiveColor,
            },
          ]}
          resizeMode="contain"
        />
      ) : (
        <Text
          style={[
            {
              fontSize: iconSize,
              fontWeight: '600',
            },
            {
              color: isFocused ? activeColor : inactiveColor,
            },
          ]}
        >
          •
        </Text>
      )}
      <Text
        style={[
          styles.label,
          {
            color: isFocused ? activeColor : inactiveColor,
            fontWeight: isFocused ? '600' : '500',
          },
        ]}
      >
        {label}
      </Text>
    </AnimatedTouchable>
  );
}

type LiquidGlassTabBarProps = BottomTabBarProps & {
  onQuickActionPress?: () => void;
};

/**
 * iOS 26 Style "Liquid Glass" Floating Tab Bar
 * 
 * Features:
 * - Floating pill-shaped design with rounded corners
 * - Multi-layer Liquid Glass effect with depth
 * - Specular highlights that react to movement
 * - Strong blur effect with dynamic color tinting
 * - Animated pill indicator for active tab
 * - Glass-like transparency with subtle borders and reflections
 * - Swipe gesture to switch tabs fluidly
 * - Dynamic adaptation to light/dark environments
 * - Central plus button for quick actions
 */
export function LiquidGlassTabBar({ state, descriptors, navigation, onQuickActionPress }: LiquidGlassTabBarProps) {
  const insets = useSafeAreaInsets();
  const { theme, mode } = useTheme();
  const palette = theme.colors;
  
  const tabCount = state.routes.length;

  // Navigate to tab
  const navigateToTab = React.useCallback((index: number) => {
    const clampedIndex = Math.max(0, Math.min(tabCount - 1, index));
    const route = state.routes[clampedIndex];
    if (route && clampedIndex !== state.index) {
      navigation.navigate(route.name);
    }
  }, [navigation, state.routes, state.index, tabCount]);

  // Dynamic colors based on theme with enhanced iOS 26 Liquid Glass adaptation
  const isDark = mode === 'dark';
  const glassColors = isDark
    ? {
        // Dark mode - deeper, richer colors
        blur: 'systemMaterialDark' as const,
        blurSecondary: 'systemThickMaterialDark' as const,
        overlay: 'rgba(80, 180, 80, 0.18)',
        overlaySecondary: 'rgba(100, 200, 100, 0.12)',
        border: 'rgba(120, 200, 120, 0.35)',
        borderSecondary: 'rgba(140, 220, 140, 0.25)',
        indicatorBg: 'rgba(100, 200, 100, 0.15)', // Dezenter - weniger sichtbar
        indicatorBorder: 'rgba(140, 220, 140, 0.25)', // Dezenter - weniger sichtbar
        specularHighlight: 'rgba(255, 255, 255, 0.4)',
        specularGradient: ['rgba(255, 255, 255, 0.5)', 'rgba(255, 255, 255, 0.1)', 'rgba(255, 255, 255, 0.3)'],
        activeColor: '#FFFFFF',
        inactiveColor: 'rgba(255, 255, 255, 0.65)',
        reflection: 'rgba(255, 255, 255, 0.08)',
      }
    : {
        // Light mode - brighter, more transparent
        blur: 'systemMaterial' as const,
        blurSecondary: 'systemThickMaterial' as const,
        overlay: 'rgba(100, 200, 100, 0.25)',
        overlaySecondary: 'rgba(120, 220, 120, 0.15)',
        border: 'rgba(100, 180, 100, 0.4)',
        borderSecondary: 'rgba(80, 160, 80, 0.3)',
        indicatorBg: 'rgba(100, 180, 100, 0.18)', // Dezenter - weniger sichtbar
        indicatorBorder: 'rgba(80, 160, 80, 0.3)', // Dezenter - weniger sichtbar
        specularHighlight: 'rgba(255, 255, 255, 0.6)',
        specularGradient: ['rgba(255, 255, 255, 0.7)', 'rgba(255, 255, 255, 0.2)', 'rgba(255, 255, 255, 0.5)'],
        activeColor: palette.primary,
        inactiveColor: 'rgba(0, 0, 0, 0.55)',
        reflection: 'rgba(255, 255, 255, 0.15)',
      };
  const topHighlightColor = isDark ? 'rgba(255, 255, 255, 0.12)' : 'rgba(255, 255, 255, 0.4)';

  return (
    <View style={styles.container}>
      <View style={styles.tabBarWrapper}>
        <Animated.View 
            style={[
              styles.glassContainer, 
              { 
                borderColor: glassColors.border,
                paddingBottom: insets.bottom, // Safe Area nur für den Inhalt
              }
            ]}
          >
            {/* Liquid Glass Background - Clean static effect */}
            {Platform.OS === 'ios' ? (
              <>
                {/* Base Blur Layer */}
                <BlurView
                  intensity={80}
                  tint={glassColors.blur}
                  style={StyleSheet.absoluteFill}
                />
                
                {/* Color Overlay */}
                <LinearGradient
                  colors={[
                    glassColors.overlay,
                    'rgba(255, 255, 255, 0.08)',
                    glassColors.overlay,
                  ]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={StyleSheet.absoluteFill}
                />
                
                {/* Top highlight for glass edge */}
                <View style={[styles.topHighlight, { backgroundColor: topHighlightColor }]} />
              </>
            ) : (
              // Android fallback
              <>
                <View style={[StyleSheet.absoluteFill, { backgroundColor: glassColors.overlay }]} />
                <LinearGradient
                  colors={[
                    glassColors.overlay,
                    'rgba(255, 255, 255, 0.1)',
                    glassColors.overlay,
                  ]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={StyleSheet.absoluteFill}
                />
              </>
            )}
            
            {/* Tab Items with Zoom Effect and Central Plus Button */}
            <View style={styles.tabsContainer}>
              {state.routes.map((route, index) => {
                const { options } = descriptors[route.key];
                const label = options.tabBarLabel ?? options.title ?? route.name;
                const isFocused = state.index === index;
                
                const iconSource = TAB_ICONS[route.name];
                const middleIndex = Math.floor(tabCount / 2);
                
                const onPress = () => {
                  const event = navigation.emit({
                    type: 'tabPress',
                    target: route.key,
                    canPreventDefault: true,
                  });

                  if (!isFocused && !event.defaultPrevented) {
                    navigation.navigate(route.name);
                  }
                };

                const onLongPress = () => {
                  navigation.emit({
                    type: 'tabLongPress',
                    target: route.key,
                  });
                };

                return (
                  <React.Fragment key={route.key}>
                    <AnimatedTabItem
                      index={index}
                      indicatorPosition={useSharedValue(index)} // Dummy value since indicator is removed
                      iconSource={iconSource}
                      label={typeof label === 'string' ? label : route.name}
                      isFocused={isFocused}
                      activeColor={glassColors.activeColor}
                      inactiveColor={glassColors.inactiveColor}
                      onPress={onPress}
                      onLongPress={onLongPress}
                      accessibilityLabel={options.tabBarAccessibilityLabel}
                    />
                    {/* Plus Button in the middle - render after middle tab */}
                    {index === middleIndex - 1 && (
                      <PlusButton 
                        onPress={() => onQuickActionPress?.()}
                        primaryColor={palette.primary}
                        isDark={isDark}
                      />
                    )}
                  </React.Fragment>
                );
              })}
            </View>
          </Animated.View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 0, // Keine seitlichen Abstände - TabBar geht bis an die Ränder
    paddingBottom: 0, // Kein Abstand unten - TabBar geht bis ganz unten
    zIndex: 1000, // High zIndex to ensure TabBar stays on top
  },
  tabBarWrapper: {
    // Subtiler Schatten nur nach oben - nicht schwebend
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 8,
  },
  glassContainer: {
    flexDirection: 'row',
    borderTopLeftRadius: 28, // Mehr Rundung oben wie im Beispiel
    borderTopRightRadius: 28,
    borderBottomLeftRadius: 0, // Unten nicht gerundet - fest am Rand
    borderBottomRightRadius: 0,
    overflow: 'hidden',
    borderWidth: 1,
    borderBottomWidth: 0, // Kein Border unten
    minHeight: 85, // Mehr Höhe für genug Platz
  },
  topHighlight: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.4)',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
  },
  indicator: {
    position: 'absolute',
    top: 12,
    left: 0, // Will be animated via translateX
    borderRadius: 20, // Weniger rund für dezenteres Design
    borderWidth: 0.5, // Dünnerer Border
    overflow: 'hidden',
    height: 56, // Etwas kleiner
  },
  indicatorInnerGlow: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 20,
    borderWidth: 0.5,
    borderColor: 'rgba(255, 255, 255, 0.15)', // Dezenter
  },
  tabsContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between', // Gleichmäßige Verteilung mit Abständen
    paddingTop: 12,
    paddingBottom: 10,
    paddingHorizontal: 12, // Padding für gleichmäßige Abstände
    zIndex: 10,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
    gap: 4,
    minWidth: 0, // Ermöglicht gleichmäßige Verteilung
  },
  plusButtonContainer: {
    width: 56, // Feste Breite für Plus-Button
    height: 56,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0, // Verhindert, dass der Button schrumpft
  },
  plusButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  icon: {
    // Size is now set dynamically in component
  },
  iconPlaceholder: {
    fontSize: 24,
    fontWeight: '600',
  },
  label: {
    fontSize: 11,
    fontFamily: 'Inter-SemiBold',
    textAlign: 'center',
  },
});

export default LiquidGlassTabBar;
