import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  StyleSheet,
  Pressable,
  Animated,
  Linking,
  Text,
  Image,
  useWindowDimensions,
  Easing,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { NavigationContainerRefWithCurrent } from '@react-navigation/native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { colors, spacing } from '../design/tokens';
import { useUiStore } from '../store/ui';

export const HEADER_BAR_HEIGHT = 40;
export const HEADER_CLEARANCE = 6;
export const HEADER_PADDING_BOTTOM = 2;
export const HEADER_TOTAL_HEIGHT = HEADER_BAR_HEIGHT + HEADER_CLEARANCE + HEADER_PADDING_BOTTOM;

type Props = {
  navRef: NavigationContainerRefWithCurrent<any>;
  title: string;
};

const APP_LOGO = require('../../assets/weedless_logo_trimmed.png');

export default function AppHeader({ navRef, title }: Props) {
  const insets = useSafeAreaInsets();
  const { width: screenWidth } = useWindowDimensions();
  const [open, setOpen] = useState(false);
  const [renderMenu, setRenderMenu] = useState(false);
  const pendingNavigation = useRef<(() => void) | null>(null);
  const progress = useRef(new Animated.Value(0)).current;
  const paddingTop = insets.top + HEADER_CLEARANCE;
  const drawerWidth = Math.min(screenWidth * 0.92, screenWidth);
  const headerAtTop = useUiStore((s) => s.headerAtTop);
  const blurProgress = useRef(new Animated.Value(headerAtTop ? 0 : 1)).current;
  const [blurIntensity, setBlurIntensity] = useState(headerAtTop ? 0 : 90);

  useEffect(() => {
    const id = blurProgress.addListener(({ value }) => {
      const next = Math.min(90, Math.max(0, value * 90));
      setBlurIntensity(next);
    });
    return () => blurProgress.removeListener(id);
  }, [blurProgress]);

  useEffect(() => {
    Animated.timing(blurProgress, {
      toValue: headerAtTop ? 0 : 1,
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

  const toggleMenu = () => setOpen((prev) => !prev);
  const closeMenu = (next?: () => void) => {
    if (next) {
      pendingNavigation.current = next;
    } else {
      pendingNavigation.current = null;
    }
    setOpen(false);
  };

  const goToSettings = () => {
    closeMenu(() => {
      navRef.current?.navigate('Settings');
    });
  };

  const goToHelp = () => {
    closeMenu(() => {
      navRef.current?.navigate('Help');
    });
  };

  const goToPhilosophy = () => {
    closeMenu(() => {
      navRef.current?.navigate('Settings', { screen: 'Philosophy' });
    });
  };

  const goToZenGlide = () => {
    closeMenu(() => {
      navRef.current?.navigate('ZenGlide');
    });
  };

  const openFeedback = () => {
    closeMenu();
    Linking.openURL('mailto:feedback@weedless.app').catch(() => {});
  };

  const barHeight = insets.top + HEADER_TOTAL_HEIGHT;
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
            paddingLeft: insets.left + spacing.s,
            paddingRight: spacing.xl + insets.right,
          },
        ]}
      >
        {supportsBlur ? (
          <BlurView
            pointerEvents="none"
            intensity={blurIntensity}
            tint="light"
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
        <View style={styles.logoWrap}>
          <Image source={APP_LOGO} style={styles.logo} resizeMode="contain" />
        </View>
        <View style={styles.titleWrap}>
          <Text style={styles.title} numberOfLines={1}>
            {title}
          </Text>
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
                <MaterialCommunityIcons name="close" size={22} color={colors.light.text} />
              </Pressable>
            </View>
            <View style={styles.drawerQuickAction}>
              <Pressable style={({ pressed }) => [styles.drawerItemAccent, pressed && styles.drawerItemAccentPressed]} onPress={goToZenGlide}>
                <View style={styles.drawerItemContent}>
                  <MaterialCommunityIcons name="gamepad-variant-outline" size={22} color={colors.light.surface} />
                  <Text style={styles.drawerItemAccentText}>Schnelle Ablenkung</Text>
                </View>
              </Pressable>
            </View>
            <View style={styles.drawerList}>
              <Pressable style={({ pressed }) => [styles.drawerItem, pressed && styles.drawerItemPressed]} onPress={goToSettings}>
                <View style={styles.drawerItemContent}>
                  <MaterialCommunityIcons name="cog-outline" size={22} color={colors.light.primary} />
                  <Text style={styles.drawerItemText}>Einstellungen</Text>
                </View>
              </Pressable>
              <View style={styles.separator} />
              <Pressable style={({ pressed }) => [styles.drawerItem, pressed && styles.drawerItemPressed]} onPress={goToHelp}>
                <View style={styles.drawerItemContent}>
                  <MaterialCommunityIcons name="lifebuoy" size={22} color={colors.light.primary} />
                  <Text style={styles.drawerItemText}>Hilfe</Text>
                </View>
              </Pressable>
              <View style={styles.separator} />
              <Pressable style={({ pressed }) => [styles.drawerItem, pressed && styles.drawerItemPressed]} onPress={goToPhilosophy}>
                <View style={styles.drawerItemContent}>
                  <MaterialCommunityIcons name="leaf-circle-outline" size={22} color={colors.light.primary} />
                  <Text style={styles.drawerItemText}>Unsere Philosophie</Text>
                </View>
              </Pressable>
              <View style={styles.separator} />
              <Pressable style={({ pressed }) => [styles.drawerItem, pressed && styles.drawerItemPressed]} onPress={openFeedback}>
                <View style={styles.drawerItemContent}>
                  <MaterialCommunityIcons name="email-edit-outline" size={22} color={colors.light.primary} />
                  <Text style={styles.drawerItemText}>Feedback senden</Text>
                </View>
              </Pressable>
            </View>
          </Animated.View>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    zIndex: 20,
  },
  inner: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingBottom: HEADER_PADDING_BOTTOM,
    overflow: 'hidden',
  },
  tintLayer: {
    backgroundColor: 'rgba(255,255,255,0.65)',
  },
  borderOverlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.light.border,
  },
  logoWrap: {
    height: HEADER_BAR_HEIGHT,
    alignItems: 'flex-start',
    justifyContent: 'center',
    marginRight: spacing.s,
  },
  logo: {
    width: HEADER_BAR_HEIGHT - 6,
    height: HEADER_BAR_HEIGHT - 6,
  },
  titleWrap: {
    flex: 1,
    alignItems: 'flex-start',
    justifyContent: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    fontFamily: 'Inter-Bold',
    color: colors.light.text,
    maxWidth: '100%',
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
    backgroundColor: colors.light.text,
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
    backgroundColor: colors.light.overlay,
  },
  drawer: {
    position: 'absolute',
    right: 0,
    backgroundColor: colors.light.surface,
    borderTopLeftRadius: 32,
    borderBottomLeftRadius: 32,
    paddingHorizontal: spacing.xl,
    shadowColor: '#5a341e',
    shadowOpacity: 0.28,
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
    color: colors.light.text,
    fontFamily: 'Inter-Bold',
  },
  drawerSubtitle: {
    fontSize: 13,
    color: colors.light.textMuted,
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
    backgroundColor: 'rgba(0,0,0,0.05)',
  },
  drawerList: {
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(200, 106, 58, 0.25)',
    overflow: 'hidden',
    backgroundColor: colors.light.surface,
  },
  drawerQuickAction: {
    borderRadius: 28,
    overflow: 'hidden',
    backgroundColor: colors.light.primary,
  },
  drawerItem: {
    paddingHorizontal: 18,
    paddingVertical: 16,
    backgroundColor: colors.light.surface,
  },
  drawerItemPressed: {
    backgroundColor: 'rgba(200, 106, 58, 0.15)',
  },
  drawerItemText: {
    fontSize: 16,
    color: colors.light.text,
    fontWeight: '600',
    fontFamily: 'Inter-SemiBold',
  },
  drawerItemAccent: {
    paddingHorizontal: 18,
    paddingVertical: 18,
    backgroundColor: 'transparent',
  },
  drawerItemAccentPressed: {
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  drawerItemAccentText: {
    fontSize: 16,
    color: colors.light.surface,
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
    backgroundColor: 'rgba(200, 106, 58, 0.18)',
  },
});
