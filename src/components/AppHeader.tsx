import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  StyleSheet,
  Pressable,
  Animated,
  Linking,
  Text,
  useWindowDimensions,
  Easing,
  Platform,
  Switch,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { NavigationContainerRefWithCurrent } from '@react-navigation/native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { spacing } from '../design/tokens';
import { useUiStore } from '../store/ui';
import PauseHeaderBadge from './PauseHeaderBadge';
import LevelHeaderBadge from './LevelHeaderBadge';
import { useTheme } from '../theme/useTheme';
import type { ThemeColors } from '../theme/themes';
import { useThemedStyles } from '../theme/useThemedStyles';
import { haptics } from '../services/haptics';

export const HEADER_BAR_HEIGHT = 40;
export const HEADER_CLEARANCE = 6;
export const HEADER_PADDING_BOTTOM = 2;
export const HEADER_TOTAL_HEIGHT = HEADER_BAR_HEIGHT + HEADER_CLEARANCE + HEADER_PADDING_BOTTOM;
const BASE_BOTTOM_PADDING = spacing.s;

type Props = {
  navRef: NavigationContainerRefWithCurrent<any>;
  title: string;
};

export default function AppHeader({ navRef, title }: Props) {
  const insets = useSafeAreaInsets();
  const { width: screenWidth } = useWindowDimensions();
  const { mode, theme, toggleMode } = useTheme();
  const palette = theme.colors;
  const styles = useThemedStyles(createStyles);
  const [open, setOpen] = useState(false);
  const [renderMenu, setRenderMenu] = useState(false);
  const pendingNavigation = useRef<(() => void) | null>(null);
  const progress = useRef(new Animated.Value(0)).current;
  const paddingTop = insets.top + HEADER_CLEARANCE;
  const drawerWidth = Math.min(screenWidth * 0.92, screenWidth);
  const headerAtTop = useUiStore((s) => s.headerAtTop);
  const setHeaderAccessoryHeight = useUiStore((s) => s.setHeaderAccessoryHeight);
  const MIN_BLUR_PROGRESS = 0.35;
  const blurProgress = useRef(new Animated.Value(headerAtTop ? MIN_BLUR_PROGRESS : 1)).current;
  const [blurIntensity, setBlurIntensity] = useState(headerAtTop ? 90 * MIN_BLUR_PROGRESS : 90);
  const extraBottomPadding = BASE_BOTTOM_PADDING;

  useEffect(() => {
    const id = blurProgress.addListener(({ value }) => {
      const next = Math.min(90, Math.max(35, value * 90));
      setBlurIntensity(next);
    });
    return () => blurProgress.removeListener(id);
  }, [blurProgress]);

  useEffect(() => {
    Animated.timing(blurProgress, {
      toValue: headerAtTop ? MIN_BLUR_PROGRESS : 1,
      duration: 240,
      easing: headerAtTop ? Easing.out(Easing.cubic) : Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();
  }, [headerAtTop, blurProgress]);

  useEffect(() => {
    const duration = open ? 260 : 220;
    Animated.timing(progress, {
      toValue: open ? 1 : 0,
      duration,
      easing: open ? Easing.out(Easing.cubic) : Easing.in(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [open, progress]);

  useEffect(() => {
    if (open) {
      setRenderMenu(true);
      return;
    }
    const timeout = setTimeout(() => setRenderMenu(false), 240);
    return () => clearTimeout(timeout);
  }, [open]);

  useEffect(() => {
    if (open) {
      return undefined;
    }
    const fn = pendingNavigation.current;
    if (!fn) {
      return undefined;
    }
    pendingNavigation.current = null;
    const timeout = setTimeout(() => {
      try {
        fn();
      } catch (error) {
        console.warn('Drawer navigation failed', error);
      }
    }, 260);
    return () => clearTimeout(timeout);
  }, [open]);

  useEffect(() => {
    setHeaderAccessoryHeight(extraBottomPadding);
  }, [extraBottomPadding, setHeaderAccessoryHeight]);

  useEffect(
    () => () => {
      setHeaderAccessoryHeight(0);
    },
    [setHeaderAccessoryHeight]
  );

  const toggleMenu = () => {
    haptics.trigger('general', 'selection');
    setOpen((prev) => !prev);
  };
  const closeMenu = (next?: () => void) => {
    haptics.trigger('general', 'selection');
    if (next) {
      pendingNavigation.current = next;
    } else {
      pendingNavigation.current = null;
    }
    setOpen(false);
  };

  // Import haptics statically instead of require to avoid potential issues
  const haptics = require('../services/haptics').haptics;

  const goToSettings = () => {
    haptics.trigger('general', 'selection');
    closeMenu(() => {
      navRef.current?.navigate('Settings');
    });
  };

  const goToHelp = () => {
    haptics.trigger('general', 'selection');
    closeMenu(() => {
      navRef.current?.navigate('Help');
    });
  };

  const goToPhilosophy = () => {
    haptics.trigger('general', 'selection');
    closeMenu(() => {
      navRef.current?.navigate('Settings', { screen: 'Philosophy' });
    });
  };

  const goToPauseHistory = () => {
    haptics.trigger('general', 'selection');
    closeMenu(() => {
      navRef.current?.navigate('PauseHistory');
    });
  };

  const goToZenGlide = () => {
    haptics.trigger('general', 'selection');
    closeMenu(() => {
      navRef.current?.navigate('ZenGlide');
    });
  };

  const openFeedback = () => {
    haptics.trigger('general', 'selection');
    closeMenu();
    Linking.openURL('mailto:feedback@hazeless.app').catch(() => {});
  };

  const barHeight = insets.top + HEADER_TOTAL_HEIGHT + extraBottomPadding;
  const translateX = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [drawerWidth, 0],
  });
  const backdropOpacity = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 0.35],
  });

  const supportsBlur = Platform.OS === 'ios' || Platform.OS === 'android';

  return (
    <View pointerEvents="box-none" style={styles.wrap}>
      <Animated.View
        style={[
          styles.inner,
          {
            height: barHeight,
            paddingTop,
            paddingLeft: insets.left + spacing.xl,
            paddingRight: spacing.xl + insets.right,
            paddingBottom: HEADER_PADDING_BOTTOM + extraBottomPadding,
            gap: spacing.s,
          },
        ]}
      >
        {supportsBlur ? (
          <BlurView
            pointerEvents="none"
            intensity={blurIntensity}
            tint={mode === 'dark' ? 'dark' : 'light'}
            style={StyleSheet.absoluteFill}
          />
        ) : null}
        <Animated.View
          pointerEvents="none"
          style={[StyleSheet.absoluteFill, styles.tintLayer, { opacity: blurProgress }]}
        />
        <Animated.View
          pointerEvents="none"
          style={[
            styles.borderOverlay,
            {
              opacity: blurProgress,
            },
          ]}
        />
        <View style={styles.topRow}>
          <View style={styles.titleRow}>
            <Text style={styles.title} numberOfLines={1}>
              {title}
            </Text>
            <View style={styles.badgeRow}>
              <LevelHeaderBadge navRef={navRef} />
              <PauseHeaderBadge navRef={navRef} />
            </View>
          </View>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Menü öffnen"
            onPress={toggleMenu}
            style={styles.menuButton}
            hitSlop={8}
          >
            <View style={styles.hamburger}>
              <View style={styles.hamburgerLine} />
              <View style={styles.hamburgerLine} />
              <View style={styles.hamburgerLine} />
            </View>
          </Pressable>
        </View>
      </Animated.View>
      {renderMenu ? (
        <View style={styles.drawerLayer} pointerEvents="box-none">
          <Animated.View
            pointerEvents="none"
            style={[
              StyleSheet.absoluteFill,
              styles.backdrop,
              {
                opacity: backdropOpacity,
              },
            ]}
          />
          <Pressable
            style={StyleSheet.absoluteFill}
            onPress={() => closeMenu()}
            accessibilityRole="button"
            accessibilityLabel="Menü schließen"
          />
          <Animated.View
            style={[
              styles.drawer,
              {
                top: 0,
                bottom: 0,
                paddingTop: insets.top + spacing.xl,
                paddingBottom: insets.bottom + spacing.xl,
                width: drawerWidth,
                transform: [{ translateX }],
              },
            ]}
          >
            <View style={styles.drawerHeader}>
              <View style={{ flex: 1 }}>
                <Text style={styles.drawerTitle}>Menü</Text>
                <Text style={styles.drawerSubtitle}>Schnell zu deinen wichtigsten Bereichen</Text>
              </View>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Menü schließen"
                onPress={() => closeMenu()}
                hitSlop={8}
                style={({ pressed }) => [styles.drawerCloseBtn, pressed && styles.drawerCloseBtnPressed]}
              >
                <MaterialCommunityIcons name="close" size={22} color={palette.text} />
              </Pressable>
            </View>
            <View style={styles.drawerQuickAction}>
              <Pressable style={({ pressed }) => [styles.drawerItemAccent, pressed && styles.drawerItemAccentPressed]} onPress={goToZenGlide}>
                <View style={styles.drawerItemContent}>
                  <MaterialCommunityIcons name="gamepad-variant-outline" size={22} color={palette.surface} />
                  <Text style={styles.drawerItemAccentText}>Schnelle Ablenkung</Text>
                </View>
              </Pressable>
            </View>
            <View style={styles.drawerList}>
              <Pressable style={({ pressed }) => [styles.drawerItem, pressed && styles.drawerItemPressed]} onPress={goToPauseHistory}>
                <View style={styles.drawerItemContent}>
                  <MaterialCommunityIcons name="pause-circle-outline" size={22} color={palette.primary} />
                  <Text style={styles.drawerItemText}>Pausen</Text>
                </View>
              </Pressable>
              <View style={styles.separator} />
              <Pressable style={({ pressed }) => [styles.drawerItem, pressed && styles.drawerItemPressed]} onPress={goToSettings}>
                <View style={styles.drawerItemContent}>
                  <MaterialCommunityIcons name="cog-outline" size={22} color={palette.primary} />
                  <Text style={styles.drawerItemText}>Einstellungen</Text>
                </View>
              </Pressable>
              <View style={styles.separator} />
              <Pressable style={({ pressed }) => [styles.drawerItem, pressed && styles.drawerItemPressed]} onPress={goToHelp}>
                <View style={styles.drawerItemContent}>
                  <MaterialCommunityIcons name="lifebuoy" size={22} color={palette.primary} />
                  <Text style={styles.drawerItemText}>Hilfe</Text>
                </View>
              </Pressable>
              <View style={styles.separator} />
              <Pressable style={({ pressed }) => [styles.drawerItem, pressed && styles.drawerItemPressed]} onPress={goToPhilosophy}>
                <View style={styles.drawerItemContent}>
                  <MaterialCommunityIcons name="leaf-circle-outline" size={22} color={palette.primary} />
                  <Text style={styles.drawerItemText}>Unsere Philosophie</Text>
                </View>
              </Pressable>
              <View style={styles.separator} />
              <Pressable style={({ pressed }) => [styles.drawerItem, pressed && styles.drawerItemPressed]} onPress={openFeedback}>
                <View style={styles.drawerItemContent}>
                  <MaterialCommunityIcons name="email-edit-outline" size={22} color={palette.primary} />
                  <Text style={styles.drawerItemText}>Feedback senden</Text>
                </View>
              </Pressable>
              <View style={styles.separator} />
              <View style={styles.themeToggleRow}>
                <Text style={styles.themeToggleLabel}>Dunkler Modus</Text>
                <Switch
                  value={mode === 'dark'}
                  onValueChange={toggleMode}
                  thumbColor={mode === 'dark' ? palette.buttonText : '#f4f3f4'}
                  trackColor={{ false: palette.border, true: palette.primary }}
                  ios_backgroundColor={palette.border}
                />
              </View>
            </View>
          </Animated.View>
        </View>
      ) : null}
    </View>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    wrap: {
      position: 'absolute',
      left: 0,
      right: 0,
      top: 0,
      bottom: 0,
      zIndex: 20,
    },
    inner: {
      flexDirection: 'column',
      alignItems: 'stretch',
      paddingBottom: HEADER_PADDING_BOTTOM,
      overflow: 'hidden',
    },
    tintLayer: {
      backgroundColor: colors.overlay,
    },
    borderOverlay: {
      position: 'absolute',
      left: 0,
      right: 0,
      bottom: 0,
      height: StyleSheet.hairlineWidth,
      backgroundColor: colors.border,
    },
    topRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: spacing.s,
    },
    titleRow: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: spacing.s,
    },
    badgeRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.xs,
      flexShrink: 1,
      flexWrap: 'nowrap',
      maxWidth: '60%',
    },
    title: {
      fontSize: 20,
      fontWeight: '700',
      fontFamily: 'Inter-Bold',
      color: colors.text,
      flex: 1,
      marginRight: spacing.xs,
      minWidth: 80,
    },
    menuButton: {
      width: 36,
      height: 36,
      borderRadius: 18,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: 'transparent',
    },
    hamburger: {
      justifyContent: 'space-between',
      alignItems: 'center',
      height: 16,
    },
    hamburgerLine: {
      width: 18,
      height: 2,
      borderRadius: 2,
      backgroundColor: colors.text,
    },
    drawerLayer: {
      position: 'absolute',
      left: 0,
      top: 0,
      right: 0,
      bottom: 0,
      zIndex: 10,
    },
    backdrop: {
      backgroundColor: colors.overlay,
    },
    drawer: {
      position: 'absolute',
      right: 0,
      backgroundColor: colors.surface,
      borderTopLeftRadius: 32,
      borderBottomLeftRadius: 32,
      paddingHorizontal: spacing.xl,
      shadowColor: colors.primary,
      shadowOpacity: 0.25,
      shadowRadius: 32,
      shadowOffset: { width: -8, height: 12 },
      elevation: 18,
      gap: spacing.xl,
    },
    drawerHeader: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: spacing.s,
    },
    drawerTitle: {
      fontSize: 20,
      fontWeight: '700',
      color: colors.text,
      fontFamily: 'Inter-Bold',
    },
    drawerSubtitle: {
      fontSize: 13,
      color: colors.textMuted,
      fontFamily: 'Inter-Regular',
    },
    drawerCloseBtn: {
      width: 36,
      height: 36,
      borderRadius: 18,
      alignItems: 'center',
      justifyContent: 'center',
    },
    drawerCloseBtnPressed: {
      backgroundColor: colors.border,
    },
    drawerList: {
      borderRadius: 24,
      borderWidth: 1,
      borderColor: colors.border,
      overflow: 'hidden',
      backgroundColor: colors.surface,
    },
    drawerQuickAction: {
      borderRadius: 28,
      overflow: 'hidden',
      backgroundColor: colors.primary,
    },
    drawerItem: {
      paddingHorizontal: 18,
      paddingVertical: 16,
      backgroundColor: colors.surface,
    },
    drawerItemPressed: {
      backgroundColor: colors.border,
    },
    drawerItemText: {
      fontSize: 16,
      color: colors.text,
      fontWeight: '600',
      fontFamily: 'Inter-SemiBold',
    },
    drawerItemAccent: {
      paddingHorizontal: 18,
      paddingVertical: 18,
      backgroundColor: 'transparent',
    },
    drawerItemAccentPressed: {
      backgroundColor: colors.border,
    },
    drawerItemAccentText: {
      fontSize: 16,
      color: colors.surface,
      fontWeight: '700',
      fontFamily: 'Inter-Bold',
    },
    drawerItemContent: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.m,
    },
    separator: {
      height: StyleSheet.hairlineWidth,
      backgroundColor: colors.border,
    },
    themeToggleRow: {
      paddingHorizontal: 18,
      paddingVertical: 14,
      backgroundColor: colors.surface,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    themeToggleLabel: {
      fontSize: 16,
      color: colors.text,
      fontWeight: '600',
      fontFamily: 'Inter-SemiBold',
    },
  });
