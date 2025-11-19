import 'react-native-gesture-handler';
import 'react-native-reanimated';
import * as React from 'react';
import { Text, ActivityIndicator, View, Image, StyleSheet, ImageBackground, Platform } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { useFonts } from 'expo-font';
import { BlurView } from 'expo-blur';
import {
  NavigationContainer,
  DefaultTheme,
  createNavigationContainerRef,
  type NavigationContainerRefWithCurrent,
  type NavigationState,
  type PartialState,
} from '@react-navigation/native';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import DashboardNavigator from './src/screens/dashboard/DashboardNavigator';
import Knowledge from './src/screens/Missions';
import Milestones from './src/screens/Milestones';
import SettingsNavigator, { type SettingsStackParamList } from './src/screens/settings/SettingsNavigator';
import { ThemeProvider } from './src/design/theme';
import { colors } from './src/design/tokens';
import TrackenScreen from './src/screens/Tracken';
import MinigamesHub, { MinigameStackParamList } from './src/screens/minigames/MinigamesHub';
import TapGame from './src/screens/minigames/TapGame';
import TapResults from './src/screens/minigames/TapResults';
import Help from './src/screens/Help';
import { OnboardingNavigator } from './src/onboarding/OnboardingNavigator';
import { useOnboardingStore } from './src/onboarding/store';
import { colors as onboardingColors } from './src/onboarding/theme';
import BreathScreen from './src/screens/BreathScreen';
import AppHeader from './src/components/AppHeader';
import { HydrationGate } from './src/components/HydrationGate';
import GlobalQuickActions from './src/components/GlobalQuickActions';
import PausePlannerScreen from './src/screens/pause/PausePlannerScreen';
import PauseHistoryScreen from './src/screens/pause/PauseHistoryScreen';
import { useUiStore } from './src/store/ui';
import PauseHeaderBadge from './src/components/PauseHeaderBadge';

const HERO_PLANT_BACKGROUND = require('./assets/hero_plant.png');

type NavStateLike = NavigationState | PartialState<NavigationState> | undefined;

const ROUTE_TITLES: Record<string, string> = {
  Dashboard: 'Dashboard',
  DashboardHome: 'Dashboard',
  Tracken: 'Tracken',
  Missions: 'Wissen',
  MinigamesHub: 'Minigames',
  TapGame: 'Tap Game',
  TapResults: 'Ergebnis',
  Breath: 'Atemübung',
  Milestones: 'Meilensteine',
  Settings: 'Einstellungen',
  SettingsHome: 'Einstellungen',
  Notifications: 'Benachrichtigungen',
  Language: 'Sprache',
  Philosophy: 'Philosophie',
  ExportData: 'Daten exportieren',
  Help: 'Hilfe',
  ZenGlide: 'ZenGlide',
  PausePlan: 'Pause',
  PauseHistory: 'Pausen',
};

const HIDDEN_HEADER_ROUTES = new Set(['ZenGlide', 'Wissen']);

const getActiveRouteName = (state: NavStateLike): string | undefined => {
  if (!state || !('routes' in state) || !state.routes.length) {
    return undefined;
  }
  const index = 'index' in state && typeof state.index === 'number' ? state.index : state.routes.length - 1;
  const route = state.routes[index];
  if (!route) return undefined;
  const nestedState = (route as any).state as NavStateLike | undefined;
  return getActiveRouteName(nestedState) ?? route.name;
};

const titleForRoute = (name?: string) => {
  if (!name) return 'Weedless';
  return ROUTE_TITLES[name] ?? name;
};

const Tab = createBottomTabNavigator();
const ZenGlideScreen = React.lazy(() => import('./src/game/ZenGlide'));

const ZenGlideFallback = () => (
  <ImageBackground source={HERO_PLANT_BACKGROUND} style={{ flex: 1 }} resizeMode="cover">
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
      <ActivityIndicator color={colors.light.primary} />
    </View>
  </ImageBackground>
);

const ZenGlideLazy: React.FC = (props) => (
  <React.Suspense fallback={<ZenGlideFallback />}>
    <ZenGlideScreen {...props} />
  </React.Suspense>
);

type RootStackParamList = {
  Tabs: undefined;
  Help: undefined;
  Settings: { screen?: keyof SettingsStackParamList } | undefined;
  Breath: undefined;
  ZenGlide: undefined;
  PausePlan: undefined;
  PauseHistory: undefined;
} & MinigameStackParamList;
const RootStack = createNativeStackNavigator<RootStackParamList>();

const navTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    background: 'transparent',
    card: 'transparent',
    text: colors.light.text,
    border: colors.light.border,
  },
} as const;

function TabsNavigator() {
  const insets = useSafeAreaInsets();
  const supportsBlur = Platform.OS === 'ios' || Platform.OS === 'android';

  const tabIcons: Record<string, any> = {
    Dashboard: TAB_ICON_DASHBOARD,
    Tracken: TAB_ICON_TRACKEN,
    Wissen: TAB_ICON_MISSIONS,
    Meilensteine: TAB_ICON_MILESTONES,
  };

  const baseTabBarStyle = {
    backgroundColor: supportsBlur ? 'rgba(255,255,255,0.25)' : 'rgba(255,255,255,0.85)',
    borderTopColor: 'rgba(74,42,22,0.12)',
    borderTopWidth: StyleSheet.hairlineWidth,
    height: 64 + insets.bottom,
    paddingBottom: Math.max(10, insets.bottom),
    paddingTop: 8,
    paddingHorizontal: 12,
  } as const;

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: colors.light.primary,
        tabBarInactiveTintColor: colors.light.textMuted,
        tabBarStyle: baseTabBarStyle,
        tabBarBackground: () =>
          supportsBlur ? (
            <BlurView intensity={85} tint="light" style={StyleSheet.absoluteFill} />
          ) : (
            <View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(255,255,255,0.85)' }]} />
          ),
        tabBarLabelStyle: { fontSize: 12, fontWeight: '600', fontFamily: 'Inter-SemiBold' },
        tabBarIcon: ({ color }) => {
          const source = tabIcons[route.name];
          if (!source) {
            return <Text style={{ fontSize: 16, color, fontFamily: 'Inter-SemiBold' }}>•</Text>;
          }
          return (
            <Image
              source={source}
              style={{ width: 26, height: 26, tintColor: color }}
              resizeMode="contain"
            />
          );
        },
      })}
    >
      <Tab.Screen name="Dashboard" component={DashboardNavigator} />
      <Tab.Screen name="Tracken" component={TrackenScreen} />
      <Tab.Screen name="Wissen" component={Knowledge} />
      <Tab.Screen name="Meilensteine" component={Milestones} />
    </Tab.Navigator>
  );
}

type NavigationWithThemeProps = {
  navRef: NavigationContainerRefWithCurrent<RootStackParamList>;
  onReady: () => void;
  onStateChange: (state?: NavStateLike) => void;
};

function NavigationWithTheme({ navRef, onReady, onStateChange }: NavigationWithThemeProps) {
  return (
    <NavigationContainer
      theme={navTheme as any}
      ref={navRef}
      onReady={onReady}
      onStateChange={onStateChange}
    >
      <RootStack.Navigator screenOptions={{ headerShown: false, contentStyle: { backgroundColor: 'transparent' } }}>
        <RootStack.Screen name="Tabs" component={TabsNavigator} />
        <RootStack.Screen name="MinigamesHub" component={MinigamesHub} />
      <RootStack.Screen name="TapGame" component={TapGame} />
      <RootStack.Screen name="TapResults" component={TapResults} />
      <RootStack.Screen name="Breath" component={BreathScreen} options={{ headerShown: true, title: 'Atemübung' }} />
      <RootStack.Screen name="Settings" component={SettingsNavigator} />
      <RootStack.Screen name="Help" component={Help} />
      <RootStack.Screen name="ZenGlide" component={ZenGlideLazy} options={{ headerShown: false }} />
      <RootStack.Screen name="PausePlan" component={PausePlannerScreen} />
      <RootStack.Screen name="PauseHistory" component={PauseHistoryScreen} />
      </RootStack.Navigator>
    </NavigationContainer>
  );
}

const MainApp: React.FC = () => {
  const navRef = React.useMemo(() => createNavigationContainerRef<RootStackParamList>(), []);
  const [headerTitle, setHeaderTitle] = React.useState(() => titleForRoute('Dashboard'));
  const [activeRoute, setActiveRoute] = React.useState<string | undefined>('Dashboard');
  const [fontsLoaded] = useFonts({
    'Inter-Regular': require('./assets/fonts/Inter-Regular.ttf'),
    'Inter-SemiBold': require('./assets/fonts/Inter-SemiBold.ttf'),
    'Inter-Bold': require('./assets/fonts/Inter-Bold.ttf'),
  });
  const setHeaderAccessoryHeight = useUiStore((s) => s.setHeaderAccessoryHeight);

  const updateHeaderTitle = React.useCallback(
    (state?: NavStateLike) => {
      const currentState =
        state ??
        navRef.getRootState?.() ??
        (navRef.current?.getRootState ? navRef.current.getRootState() : undefined);
      const activeName = getActiveRouteName(currentState);
      setActiveRoute(activeName);
      setHeaderTitle(titleForRoute(activeName));
    },
    [navRef]
  );

  React.useEffect(() => {
    if (navRef.isReady?.()) {
      updateHeaderTitle();
    }
  }, [navRef, updateHeaderTitle]);

  React.useEffect(() => {
    if (activeRoute && HIDDEN_HEADER_ROUTES.has(activeRoute)) {
      setHeaderAccessoryHeight(0);
    }
  }, [activeRoute, setHeaderAccessoryHeight]);

  if (!fontsLoaded) {
    return (
      <ImageBackground source={HERO_PLANT_BACKGROUND} style={{ flex: 1 }} resizeMode="cover">
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator color={colors.light.primary} />
        </View>
      </ImageBackground>
    );
  }

  return (
    <ThemeProvider>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <SafeAreaProvider>
          <ImageBackground source={HERO_PLANT_BACKGROUND} style={{ flex: 1 }} resizeMode="cover">
            <View style={{ flex: 1 }}>
              <NavigationWithTheme
                navRef={navRef}
                onReady={updateHeaderTitle}
                onStateChange={updateHeaderTitle}
              />
              {!activeRoute || !HIDDEN_HEADER_ROUTES.has(activeRoute) ? (
                <AppHeader navRef={navRef} title={headerTitle} />
              ) : null}
              <GlobalQuickActions navRef={navRef} />
            </View>
          </ImageBackground>
        </SafeAreaProvider>
      </GestureHandlerRootView>
    </ThemeProvider>
  );
};

const LoadingScreen: React.FC = () => (
  <ImageBackground source={HERO_PLANT_BACKGROUND} style={{ flex: 1 }} resizeMode="cover">
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
      <ActivityIndicator size="large" color={onboardingColors.primary} />
    </View>
  </ImageBackground>
);

const RootApp: React.FC = () => {
  const hydrated = useOnboardingStore((state) => state.hydrated);
  const hasCompletedOnboarding = useOnboardingStore((state) => state.hasCompletedOnboarding);

  if (!hydrated) {
    return <LoadingScreen />;
  }

  if (!hasCompletedOnboarding) {
    return <OnboardingNavigator />;
  }

  return (
    <HydrationGate>
      <MainApp />
    </HydrationGate>
  );
};

export default RootApp;
const TAB_ICON_DASHBOARD = require('./assets/029-online.png');
const TAB_ICON_TRACKEN = require('./assets/044-magnifying_glass.png');
const TAB_ICON_MISSIONS = require('./assets/033-book.png');
const TAB_ICON_MILESTONES = require('./assets/004-medal.png');
