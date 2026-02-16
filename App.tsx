import 'react-native-gesture-handler';
import 'react-native-reanimated';
import * as React from 'react';
import { Text, ActivityIndicator, View, StyleSheet, Image, Platform, AppState, type AppStateStatus } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { useFonts } from 'expo-font';
import { LiquidGlass } from './src/design/LiquidGlass';
import { StatusBar } from 'expo-status-bar';
import {
  NavigationContainer,
  DefaultTheme,
  createNavigationContainerRef,
  type NavigationContainerRefWithCurrent,
  type NavigationState,
  type PartialState,
} from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import DashboardNavigator from './src/screens/dashboard/DashboardNavigator';
import Knowledge from './src/screens/Missions';
import Milestones from './src/screens/Milestones';
import SettingsNavigator, { type SettingsStackParamList } from './src/screens/settings/SettingsNavigator';
import TrackenScreen from './src/screens/Tracken';
import MinigamesHub, { MinigameStackParamList } from './src/screens/minigames/MinigamesHub';
import TapGame from './src/screens/minigames/TapGame';
import TapResults from './src/screens/minigames/TapResults';
import MindHouseGame from './src/screens/minigames/mindHouse/MindHouseGame';
import NumberFlowGame from './src/screens/minigames/numberFlow/NumberFlowGame';
import Help from './src/screens/Help';
import { OnboardingNavigator } from './src/onboarding/OnboardingNavigator';
import { useOnboardingStore } from './src/onboarding/store';
import { colors as onboardingColors } from './src/onboarding/theme';
import { useAppStrings } from './src/i18n/useStrings';
import { useStore } from './src/store/useStore';
import { getLocaleFromString } from './src/onboarding/i18n';
import BreathScreen from './src/screens/BreathScreen';
import AppHeader from './src/components/AppHeader';
import { HydrationGate } from './src/components/HydrationGate';
import GlobalQuickActions from './src/components/GlobalQuickActions';
import PausePlannerScreen from './src/screens/pause/PausePlannerScreen';
import PauseHistoryScreen from './src/screens/pause/PauseHistoryScreen';
import PauseCheckinScreen from './src/screens/pause/PauseCheckinScreen';
import CloudConsentScreen from './src/screens/CloudConsentScreen';
import { AnimatedTabScreen } from './src/components/AnimatedTabScreen';
import { useUiStore } from './src/store/ui';
import PauseHeaderBadge from './src/components/PauseHeaderBadge';
import PauseCelebrationModal from './src/components/PauseCelebrationModal';
import AppBackground from './src/components/AppBackground';
import { LiquidGlassTabBar } from './src/components/LiquidGlassTabBar';
import { ThemeProvider } from './src/theme/ThemeProvider';
import { useTheme } from './src/theme/useTheme';
import { AuthProvider, useAuth } from './src/contexts/AuthContext';
import { LoadingProvider } from './src/contexts/LoadingContext';
import { useConsentCheck } from './src/hooks/useConsentCheck';
import { useHasActivePause } from './src/hooks/useHasActivePause';
import { useApp } from './src/store/app';
import { LoginScreen } from './src/screens/auth/LoginScreen';
import { RegisterScreen } from './src/screens/auth/RegisterScreen';
import { ResetPasswordScreen } from './src/screens/auth/ResetPasswordScreen';
import LevelStatusScreen from './src/screens/LevelStatusScreen';

const HAZELESS_LOGO_WHITE = require('./assets/hazeless_logo_white.png');

// Grüner Farbverlauf: helles Grün unten (#4CAF50) zu dunklerem Grün oben (#1B5E20)
const GRADIENT_START = '#1B5E20';
const GRADIENT_END = '#4CAF50';

// Pause-Check-in Timing
const CHECKIN_WINDOW_MS = 2 * 60 * 60 * 1000; // 2 Stunden bis ein Check-in als „alt“ gilt
const CHECKIN_INTERVAL_MS = 2 * 60 * 60 * 1000; // Intervall für Hintergrundprüfungen
const PAUSE_START_GRACE_MS = 30 * 60 * 1000; // Schonfrist nach Pausenstart, bevor geprüft wird

type NavStateLike = NavigationState | PartialState<NavigationState> | undefined;

const ROUTE_TITLES_DE: Record<string, string> = {
  Dashboard: 'Dashboard',
  DashboardHome: 'Dashboard',
  Stats: 'Statistiken',
  Tracken: 'Tracken',
  Missions: 'Wissen',
  MinigamesHub: 'Minigames',
  TapGame: 'Tap Game',
  TapResults: 'Ergebnis',
  MindHouseGame: 'Mind House',
  NumberFlowGame: 'Number Flow',
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
  LevelStatus: 'Level & XP',
};

const ROUTE_TITLES_EN: Record<string, string> = {
  Dashboard: 'Dashboard',
  DashboardHome: 'Dashboard',
  Stats: 'Statistics',
  Tracken: 'Track',
  Missions: 'Knowledge',
  MinigamesHub: 'Minigames',
  TapGame: 'Tap Game',
  TapResults: 'Result',
  MindHouseGame: 'Mind House',
  NumberFlowGame: 'Number Flow',
  Breath: 'Breathing Exercise',
  Milestones: 'Milestones',
  Settings: 'Settings',
  SettingsHome: 'Settings',
  Notifications: 'Notifications',
  Language: 'Language',
  Philosophy: 'Philosophy',
  ExportData: 'Export Data',
  Help: 'Help',
  ZenGlide: 'ZenGlide',
  PausePlan: 'Break',
  PauseHistory: 'Breaks',
  LevelStatus: 'Level & XP',
};

// Screens, bei denen der globale AppHeader versteckt wird (nutzen den nativen Stack-Header mit Blur)
const HIDDEN_HEADER_ROUTES = new Set([
  'ZenGlide',
  'Settings',
  'SettingsHome',
  'CloudConsent',
  'PauseCheckin', // Vollbild Check-in Screen
  // Diese Screens nutzen jetzt den nativen iOS Liquid-Glass-Header:
  'Help',
  'MinigamesHub',
  'TapGame',
  'TapResults',
  'MindHouseGame',
  'NumberFlowGame',
  'Breath',
  'PausePlan',
  'PauseHistory',
  'LevelStatus',
  'Stats',
]);

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

const titleForRoute = (name?: string, locale?: string) => {
  if (!name) return 'Hazeless';
  const isEnglish = locale ? getLocaleFromString(locale) === 'en' : false;
  const titles = isEnglish ? ROUTE_TITLES_EN : ROUTE_TITLES_DE;
  return titles[name] ?? name;
};

const Tab = createBottomTabNavigator();
const ZenGlideScreen = React.lazy(() => import('./src/game/ZenGlide'));

const ZenGlideFallback = () => {
  const { theme } = useTheme();
  return (
    <AppBackground>
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator color={theme.colors.accent} />
      </View>
    </AppBackground>
  );
};

const ZenGlideLazy: React.FC = (props) => (
  <React.Suspense fallback={<ZenGlideFallback />}>
    <ZenGlideScreen {...props} />
  </React.Suspense>
);

export type RootStackParamList = {
  Tabs: undefined;
  Help: undefined;
  Settings: { screen?: keyof SettingsStackParamList } | undefined;
  Breath: undefined;
  ZenGlide: undefined;
  PausePlan: undefined;
  PauseHistory: undefined;
  PauseCheckin: undefined;
  Login: undefined;
  Register: undefined;
  ResetPassword: undefined;
  CloudConsent: undefined;
  LevelStatus: undefined;
} & MinigameStackParamList;
const RootStack = createNativeStackNavigator<RootStackParamList>();

function TabsNavigator({ onQuickActionPress }: { onQuickActionPress?: () => void }) {
  const strings = useAppStrings();

  return (
    <Tab.Navigator
      initialRouteName="Dashboard"
      tabBar={(props) => <LiquidGlassTabBar {...props} onQuickActionPress={onQuickActionPress} />}
      screenOptions={{
        headerShown: false,
      }}
    >
      <Tab.Screen 
        name="Dashboard" 
        options={{
          tabBarLabel: strings.tabs.dashboard,
        }}
      >
        {() => (
          <AnimatedTabScreen>
            <DashboardNavigator />
          </AnimatedTabScreen>
        )}
      </Tab.Screen>
      <Tab.Screen 
        name="Tracken" 
        options={{
          tabBarLabel: strings.tabs.tracken,
        }}
      >
        {() => (
          <AnimatedTabScreen>
            <TrackenScreen />
          </AnimatedTabScreen>
        )}
      </Tab.Screen>
      <Tab.Screen 
        name="Wissen" 
        options={{
          tabBarLabel: strings.tabs.wissen,
        }}
      >
        {() => (
          <AnimatedTabScreen>
            <Knowledge />
          </AnimatedTabScreen>
        )}
      </Tab.Screen>
      <Tab.Screen 
        name="Meilensteine" 
        options={{
          tabBarLabel: strings.tabs.milestones,
        }}
      >
        {() => (
          <AnimatedTabScreen>
            <Milestones />
          </AnimatedTabScreen>
        )}
      </Tab.Screen>
    </Tab.Navigator>
  );
}

type NavigationWithThemeProps = {
  navRef: NavigationContainerRefWithCurrent<RootStackParamList>;
  onReady: () => void;
  onStateChange: (state?: NavStateLike) => void;
  onQuickActionPress?: () => void;
};

function NavigationWithTheme({ navRef, onReady, onStateChange, onQuickActionPress, initialRoute = 'Tabs' }: NavigationWithThemeProps & { initialRoute?: 'Login' | 'Tabs' }) {
  const { theme } = useTheme();
  const { user, loading } = useAuth();
  const [navigationReady, setNavigationReady] = React.useState(false);
  const hasActivePause = useHasActivePause();
  const hydrated = useApp((s) => s.hydrated);
  const pauses = useApp((s) => s.pauses); // Track pauses to detect when they load
  const prevRouteRef = React.useRef<string | null>(null);
  
  // Check if consent screen should be shown
  useConsentCheck(navRef);
  const navTheme = React.useMemo(
    () => ({
      ...DefaultTheme,
      colors: {
        ...DefaultTheme.colors,
        background: 'transparent',
        card: 'transparent',
        text: theme.colors.text,
        border: theme.colors.border,
      },
    }),
    [theme.colors.border, theme.colors.text]
  );

  // Funktion zum Prüfen und Navigieren zum Check-in-Screen
  const checkAndNavigateToCheckin = React.useCallback(() => {
    // Prüfe alle Bedingungen - wenn nicht erfüllt, versuche es später erneut
    const conditions = {
      hydrated,
      hasUser: !!user,
      notLoading: !loading,
      navigationReady,
      navReady: navRef.isReady?.(),
    };
    
    if (!conditions.hydrated || !conditions.hasUser || !conditions.notLoading || !conditions.navigationReady || !conditions.navReady) {
      console.log('[PauseCheckin] Conditions not met:', conditions);
      return false; // Gibt false zurück, wenn Bedingungen nicht erfüllt sind
    }
    
    const currentRoute = navRef.getCurrentRoute()?.name;
    const authRoutes = ['Login', 'Register', 'ResetPassword', 'PauseCheckin'];
    
    // Überspringe Navigation, wenn wir auf Auth-Screens oder bereits auf Check-in sind
    if (currentRoute && authRoutes.includes(currentRoute)) {
      console.log('[PauseCheckin] Already on auth/checkin route:', currentRoute);
      return true; // Bedingungen erfüllt, aber bereits auf Check-in Screen
    }
    
    // Wenn User eingeloggt ist und eine aktive Pause existiert
    if (hasActivePause && user) {
      console.log('[PauseCheckin] Active pause detected, checking for check-in');
      
      // Prüfe, ob ein Check-in gemacht wurde und ob es weniger als eine Stunde alt ist
      const now = Date.now();
      
      // Finde den neuesten Check-in (heute oder in den letzten Tagen)
      const state = useApp.getState();
      const dayLogs = state.dayLogs;
      const activePause = state.pauses.find((pause) => pause.status === 'aktiv');
      let lastCheckinTimestamp: number | null = null;
      
      // Durchsuche alle DayLogs nach dem neuesten Check-in
      Object.values(dayLogs).forEach((log) => {
        if (log.checkin?.recordedAt) {
          const recordedAt = typeof log.checkin.recordedAt === 'number' 
            ? log.checkin.recordedAt 
            : new Date(log.checkin.recordedAt).getTime();
          
          if (recordedAt > 0) {
            if (lastCheckinTimestamp === null || recordedAt > lastCheckinTimestamp) {
              lastCheckinTimestamp = recordedAt;
            }
          }
        }
      });
      
      // Schonfrist direkt nach Pausenstart
      if (activePause?.startTimestamp) {
        const sinceStart = now - Number(activePause.startTimestamp);
        if (sinceStart < PAUSE_START_GRACE_MS) {
          console.log('[PauseCheckin] Within grace period after pause start, skipping check-in prompt');
          return true;
        }
      }

      const needsCheckin = lastCheckinTimestamp === null || (now - lastCheckinTimestamp) > CHECKIN_WINDOW_MS;
      
      console.log('[PauseCheckin] Last check-in timestamp:', lastCheckinTimestamp, 'Now:', now, 'Needs check-in:', needsCheckin);
      
      if (lastCheckinTimestamp) {
        const hoursSinceLastCheckin = (now - lastCheckinTimestamp) / (60 * 60 * 1000);
        console.log('[PauseCheckin] Hours since last check-in:', hoursSinceLastCheckin.toFixed(2));
      }
      
      // Navigiere zum Check-in-Screen, wenn kein Check-in existiert oder der letzte mehr als eine Stunde alt ist
      if (needsCheckin) {
        console.log('[PauseCheckin] Navigating to check-in screen from route:', currentRoute);
        navRef.navigate('PauseCheckin');
        return true; // Navigation erfolgreich
      } else {
        console.log('[PauseCheckin] Check-in is recent (less than 1 hour ago)');
      }
    } else {
      console.log('[PauseCheckin] No active pause or no user. hasActivePause:', hasActivePause, 'hasUser:', !!user);
    }
    
    return true; // Bedingungen erfüllt, aber kein Check-in nötig
  }, [hasActivePause, user, loading, navigationReady, hydrated, navRef]);

  const handleReady = React.useCallback(() => {
    setNavigationReady(true);
    onReady();
    // Prüfe Check-in nach kurzer Verzögerung, wenn Navigation bereit ist
    setTimeout(() => {
      checkAndNavigateToCheckin();
    }, 500);
  }, [onReady, checkAndNavigateToCheckin]);

  React.useEffect(() => {
    if (!loading && navigationReady && navRef.isReady?.()) {
      const currentRoute = navRef.getCurrentRoute()?.name;
      if (!user && currentRoute !== 'Login' && currentRoute !== 'Register' && currentRoute !== 'ResetPassword') {
        navRef.navigate('Login');
      } else if (user && currentRoute === 'Login') {
        navRef.navigate('Tabs');
      }
    }
  }, [user, loading, navigationReady, navRef]);

  // Prüfe Check-in beim App-Start und wenn die App aus dem Hintergrund kommt
  React.useEffect(() => {
    let retryTimeout: NodeJS.Timeout | null = null;
    let initialCheckTimeout: NodeJS.Timeout | null = null;
    let previousAppState = AppState.currentState;
    let retryCount = 0;
    const MAX_RETRIES = 10; // Maximal 10 Versuche (10 Sekunden)

    const attemptCheckin = () => {
      const success = checkAndNavigateToCheckin();
      
      // Wenn Bedingungen nicht erfüllt sind, versuche es erneut
      if (!success && retryCount < MAX_RETRIES) {
        retryCount++;
        retryTimeout = setTimeout(() => {
          attemptCheckin();
        }, 1000); // Versuche alle Sekunde
      } else {
        retryCount = 0; // Reset für nächsten Versuch
      }
    };

    const handleAppStateChange = (nextAppState: AppStateStatus) => {
      console.log('[PauseCheckin] AppState changed:', previousAppState, '->', nextAppState);
      // Wenn die App aktiv wird (sowohl beim ersten Start als auch beim Zurückkommen)
      if (nextAppState === 'active') {
        // App wird aktiv (beim Start oder aus Hintergrund)
        retryCount = 0; // Reset Retry-Counter
        const delay = previousAppState.match(/inactive|background/) ? 500 : 1000;
        setTimeout(() => {
          attemptCheckin();
        }, delay);
      }
      previousAppState = nextAppState;
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);

    // Prüfe auch beim ersten Start (auch wenn AppState bereits 'active' ist)
    // Warte etwas länger, damit alles geladen ist
    initialCheckTimeout = setTimeout(() => {
      console.log('[PauseCheckin] Initial check after app start');
      retryCount = 0;
      attemptCheckin();
    }, 2000); // Etwas länger warten beim ersten Start

    // Prüfe auch regelmäßig (alle ~2 Stunden), damit Check-ins nach Ablauf erkannt werden
    const intervalCheck = setInterval(() => {
      console.log('[PauseCheckin] Regular interval check');
      checkAndNavigateToCheckin();
    }, CHECKIN_INTERVAL_MS);

    return () => {
      subscription.remove();
      if (initialCheckTimeout) {
        clearTimeout(initialCheckTimeout);
      }
      if (retryTimeout) {
        clearTimeout(retryTimeout);
      }
      clearInterval(intervalCheck);
    };
  }, [checkAndNavigateToCheckin]);

  // Prüfe auch bei Änderungen der relevanten Dependencies (hydrated, user, hasActivePause, pauses)
  React.useEffect(() => {
    // Prüfe Check-in, wenn wichtige Dependencies sich ändern
    if (hydrated && user && !loading && navigationReady) {
      console.log('[PauseCheckin] Dependencies changed, checking check-in. HasActivePause:', hasActivePause, 'Pauses count:', pauses.length);
      // Kurze Verzögerung, damit Navigation bereit ist
      const timeout = setTimeout(() => {
        checkAndNavigateToCheckin();
      }, 300);
      return () => clearTimeout(timeout);
    }
  }, [hydrated, user, loading, navigationReady, hasActivePause, pauses, checkAndNavigateToCheckin]);

  // Erweiterte onStateChange-Handler, der auch Check-in prüft
  const handleStateChange = React.useCallback((state?: NavStateLike) => {
    onStateChange(state);
    
    // Haptik bei Navigation-Übergängen (nur bei tatsächlichen Screen-Wechseln)
    // Verwende einen Ref, um zu verhindern, dass Haptik bei jedem State-Change ausgelöst wird
    const currentRoute = state?.routes?.[state?.index ?? 0]?.name;
    if (currentRoute && currentRoute !== prevRouteRef.current) {
      prevRouteRef.current = currentRoute;
      // Leichte Haptik bei Navigation (nur bei tatsächlichem Screen-Wechsel)
      const { haptics } = require('./src/services/haptics');
      haptics.trigger('general', 'selection').catch(() => {
        // Fehler ignorieren
      });
    }
    
    // Prüfe nach Navigation, ob wir zum Check-in-Screen navigieren müssen
    // Warte kurz, damit die Navigation abgeschlossen ist
    setTimeout(() => {
      checkAndNavigateToCheckin();
    }, 100);
  }, [onStateChange, checkAndNavigateToCheckin]);

  return (
    <NavigationContainer
      theme={navTheme as any}
      ref={navRef}
      onReady={handleReady}
      onStateChange={handleStateChange}
    >
      <RootStack.Navigator 
        initialRouteName={initialRoute || 'Tabs'}
        screenOptions={{ 
          headerShown: true, 
          contentStyle: { backgroundColor: 'transparent' },
          animation: 'default', // Nutzt native iOS-Übergänge
          headerTransparent: true,
          headerBlurEffect: theme.mode === 'dark' ? 'systemMaterialDark' : 'systemMaterial',
          headerLargeTitle: false,
          headerLargeTitleShadowVisible: false,
          headerShadowVisible: false,
          headerTintColor: theme.colors.primary,
          headerBackTitle: 'Zurück', // Text für den Zurück-Button
          headerStyle: {
            backgroundColor: 'transparent',
          },
          headerTitleStyle: {
            fontFamily: 'Inter-SemiBold',
            fontSize: 17,
            color: theme.colors.text,
          },
        }}
      >
        <RootStack.Screen 
          name="Login" 
          component={LoginScreen} 
          options={{ headerShown: false }}
        />
        <RootStack.Screen 
          name="Register" 
          component={RegisterScreen}
          options={{ headerShown: false }}
        />
        <RootStack.Screen 
          name="ResetPassword" 
          component={ResetPasswordScreen}
          options={{ headerShown: false }}
        />
        <RootStack.Screen 
          name="PauseCheckin" 
          component={PauseCheckinScreen}
          options={{
            headerShown: false,
            animation: 'fade',
            gestureEnabled: false, // Verhindert Zurück-Navigation
          }}
        />
        <RootStack.Screen 
          name="Tabs" 
          options={{
            headerShown: false,
            animation: 'fade',
          }}
        >
          {() => <TabsNavigator onQuickActionPress={onQuickActionPress} />}
        </RootStack.Screen>
        <RootStack.Screen 
          name="MinigamesHub" 
          component={MinigamesHub}
          options={{
            title: 'Minigames',
          }}
        />
        <RootStack.Screen 
          name="TapGame" 
          component={TapGame}
          options={{
            title: 'Tap Game',
          }}
        />
        <RootStack.Screen 
          name="TapResults" 
          component={TapResults}
          options={{
            title: 'Ergebnis',
          }}
        />
        <RootStack.Screen 
          name="MindHouseGame" 
          component={MindHouseGame}
          options={{
            title: 'Mind House',
          }}
        />
        <RootStack.Screen 
          name="NumberFlowGame" 
          component={NumberFlowGame}
          options={{
            title: 'Number Flow',
          }}
        />
        <RootStack.Screen 
          name="Breath" 
          component={BreathScreen} 
          options={{ 
            title: 'Atemübung',
            headerShown: false, 
          }} 
        />
        <RootStack.Screen 
          name="Settings" 
          component={SettingsNavigator}
          options={{
            headerShown: false, // SettingsNavigator hat eigenen Header
          }}
        />
        <RootStack.Screen 
          name="Help" 
          component={Help}
          options={{
            title: 'Hilfe',
          }}
        />
        <RootStack.Screen 
          name="ZenGlide" 
          component={ZenGlideLazy} 
          options={{ 
            headerShown: false,
            animation: 'fade',
          }} 
        />
        <RootStack.Screen 
          name="PausePlan" 
          component={PausePlannerScreen}
          options={{
            title: 'Pause planen',
          }}
        />
        <RootStack.Screen 
          name="LevelStatus" 
          component={LevelStatusScreen}
          options={{
            title: 'Level & XP',
          }}
        />
        <RootStack.Screen 
          name="PauseHistory" 
          component={PauseHistoryScreen}
          options={{
            title: 'Pausen-Verlauf',
          }}
        />
        <RootStack.Screen 
          name="CloudConsent" 
          component={CloudConsentScreen} 
          options={{ 
            headerShown: false,
            animation: 'fade',
          }} 
        />
      </RootStack.Navigator>
    </NavigationContainer>
  );
}

type MainAppShellProps = {
  navRef: NavigationContainerRefWithCurrent<RootStackParamList>;
  fontsLoaded: boolean;
  initialRoute?: 'Login' | 'Tabs';
};

const MainAppShell: React.FC<MainAppShellProps> = ({ navRef, fontsLoaded, initialRoute = 'Tabs' }) => {
  const profileLocale = useStore((s) => s.profile.locale);
  const [headerTitle, setHeaderTitle] = React.useState(() => titleForRoute('Dashboard', profileLocale));
  const [activeRoute, setActiveRoute] = React.useState<string | undefined>('Dashboard');
  const setHeaderAccessoryHeight = useUiStore((s) => s.setHeaderAccessoryHeight);
  const { mode, theme } = useTheme();
  const { user } = useAuth();
  
  // Auth-Screens, bei denen Header und Quick Actions versteckt werden sollen
  const AUTH_ROUTES = new Set(['Login', 'Register', 'ResetPassword']);

  const updateHeaderTitle = React.useCallback(
    (state?: NavStateLike) => {
      const currentState =
        state ??
        navRef.getRootState?.() ??
        (navRef.current?.getRootState ? navRef.current.getRootState() : undefined);
      const activeName = getActiveRouteName(currentState);
      setActiveRoute(activeName);
      setHeaderTitle(titleForRoute(activeName, profileLocale));
    },
    [navRef, profileLocale]
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

  // Ref to open quick actions menu from TabBar - must be before early return
  const openQuickActionsMenuRef = React.useRef<(() => void) | null>(null);

  if (!fontsLoaded) {
    return (
      <AppBackground>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator color={theme.colors.accent} />
        </View>
      </AppBackground>
    );
  }

  const isAuthScreen = activeRoute && AUTH_ROUTES.has(activeRoute);
  const isCheckinScreen = activeRoute === 'PauseCheckin';
  const shouldShowHeader = !isAuthScreen && !isCheckinScreen && user && (!activeRoute || !HIDDEN_HEADER_ROUTES.has(activeRoute));
  const shouldShowQuickActions = !isAuthScreen && !isCheckinScreen && user;

  return (
    <AppBackground>
      <StatusBar
        style={mode === 'dark' ? 'light' : 'dark'}
        backgroundColor={theme.colors.background}
      />
      <View style={{ flex: 1 }}>
        <NavigationWithTheme
          navRef={navRef}
          onReady={updateHeaderTitle}
          onStateChange={updateHeaderTitle}
          onQuickActionPress={() => openQuickActionsMenuRef.current?.()}
          initialRoute={initialRoute}
        />
        {shouldShowHeader ? (
          <AppHeader navRef={navRef} title={headerTitle} />
        ) : null}
        {shouldShowQuickActions ? (
          <GlobalQuickActions navRef={navRef} onOpenMenuRef={openQuickActionsMenuRef} />
        ) : null}
        {user ? (
          <PauseCelebrationModal navRef={navRef} />
        ) : null}
      </View>
    </AppBackground>
  );
};

const MainApp: React.FC<{ initialRoute?: 'Login' | 'Tabs' }> = ({ initialRoute = 'Tabs' }) => {
  const navRef = React.useMemo(() => createNavigationContainerRef<RootStackParamList>(), []);
  const [fontsLoaded] = useFonts({
    'Inter-Regular': require('./assets/fonts/Inter-Regular.ttf'),
    'Inter-SemiBold': require('./assets/fonts/Inter-SemiBold.ttf'),
    'Inter-Bold': require('./assets/fonts/Inter-Bold.ttf'),
  });

  return (
    <ThemeProvider>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <SafeAreaProvider>
          <MainAppShell navRef={navRef} fontsLoaded={fontsLoaded} initialRoute={initialRoute} />
        </SafeAreaProvider>
      </GestureHandlerRootView>
    </ThemeProvider>
  );
};

const LoadingScreen: React.FC = () => (
  <LinearGradient
    colors={[GRADIENT_END, GRADIENT_START]}
    style={{ flex: 1 }}
    start={{ x: 0, y: 0 }}
    end={{ x: 0, y: 1 }}
  >
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
      <Image 
        source={HAZELESS_LOGO_WHITE} 
        style={{ width: 280, height: 112 }} 
        resizeMode="contain" 
      />
    </View>
  </LinearGradient>
);

const RootApp: React.FC = () => {
  const hydrated = useOnboardingStore((state) => state.hydrated);
  const hasCompletedOnboarding = useOnboardingStore((state) => state.hasCompletedOnboarding);
  const forceOnboarding = useOnboardingStore((state) => state.forceOnboarding);
  const [checkingAuth, setCheckingAuth] = React.useState(true);
  const [needsOnboarding, setNeedsOnboarding] = React.useState(false);
  const [initialRoute, setInitialRoute] = React.useState<'Login' | 'Tabs'>('Login');
  const [hasSessionUser, setHasSessionUser] = React.useState(false);
  const [preferredAuthScreen, setPreferredAuthScreen] = React.useState<'Login' | 'Register'>('Register');
  const [currentUserId, setCurrentUserId] = React.useState<string | null>(null);
  const applyServerAppProfile = React.useCallback(async () => {
    try {
      const { loadAppProfile } = await import('./src/lib/sync');
      const serverProfile = await loadAppProfile();
      if (!serverProfile) return false;

      const { useApp } = await import('./src/store/app');
      useApp.getState().replaceProfile(serverProfile);

      const { useOnboardingStore } = await import('./src/onboarding/store');
      if (!useOnboardingStore.getState().hasCompletedOnboarding) {
        useOnboardingStore.getState().markCompleted();
      }
      return true;
    } catch (error) {
      console.error('Error applying server app profile:', error);
      return false;
    }
  }, []);

  // Check auth status and onboarding status
  React.useEffect(() => {
    if (!hydrated) {
      return;
    }

    const checkAuthAndOnboarding = async () => {
      try {
        const { loadAuthPref } = await import('./src/lib/authPrefs');
        const authPref = await loadAuthPref();
        setPreferredAuthScreen(authPref.hasAccount ? 'Login' : 'Register');

        // Import supabase dynamically to avoid circular dependencies
        const { supabase } = await import('./src/lib/supabase');
        
        // Check if user is authenticated
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        
        if (authError || !user) {
          // User is not authenticated - show Login screen
          console.log('User not authenticated - showing Login screen');
          setNeedsOnboarding(false);
          setHasSessionUser(false);
          setInitialRoute('Login');
          setCheckingAuth(false);
          return;
        }

        // If user explicitly signed out last time, enforce logout even if a session exists
        if (authPref.lastSignedOut) {
          console.log('Previous explicit sign-out detected - enforcing login screen');
          await supabase.auth.signOut();
          setNeedsOnboarding(false);
          setHasSessionUser(false);
          setInitialRoute('Login');
          setCheckingAuth(false);
          return;
        }

        setHasSessionUser(true);

        // User is authenticated - check if app_profiles exists (onboarding completed)
        const { data: appProfile, error: profileError } = await supabase
          .from('app_profiles')
          .select('*')
          .eq('user_id', user.id)
          .maybeSingle();

        if (profileError && profileError.code !== 'PGRST116') {
          console.error('Error checking app profile:', profileError);
          // On error, default to requiring onboarding for safety
          setNeedsOnboarding(true);
          setInitialRoute('Login');
        } else if (!appProfile) {
          // No app_profiles exists - user must complete onboarding
          console.log('User authenticated but no app_profiles - onboarding required');
          const store = useOnboardingStore.getState();
          const { useApp } = await import('./src/store/app');
          const appProfileData = useApp.getState().profile;
          
          // Check if onboarding was just completed but app_profiles creation failed
          if (store.hasCompletedOnboarding && appProfileData) {
            // Onboarding completed locally but app_profiles doesn't exist yet
            // Try to create it now (might have failed during onboarding)
            try {
              const { createOrUpdateAppProfile } = await import('./src/lib/sync');
              const created = await createOrUpdateAppProfile(appProfileData);
              if (created) {
                console.log('App profile created after onboarding completion (retry)');
                setNeedsOnboarding(false);
                setInitialRoute('Tabs');
                setCheckingAuth(false);
                return;
              } else {
                console.warn('Onboarding completed locally but app_profiles creation failed - will retry on next save');
                setNeedsOnboarding(false);
                setInitialRoute('Tabs');
                setCheckingAuth(false);
                return;
              }
            } catch (error) {
              console.error('Error creating app profile after onboarding (retry):', error);
              setNeedsOnboarding(false);
              setInitialRoute('Tabs');
              setCheckingAuth(false);
              return;
            }
          }
          
          if (!store.hasCompletedOnboarding) {
            // User hasn't completed onboarding - check if they've started
            if (store.currentStepIndex === 0) {
              // Fresh start - reset everything
              console.log('New user detected - resetting stores for fresh onboarding');
              useOnboardingStore.getState().reset();
              // Also clear all local app data when starting fresh onboarding
              const { useStore } = await import('./src/store/useStore');
              useApp.getState().resetAll();
              useStore.getState().clearAll();
            }
            setNeedsOnboarding(true);
            setInitialRoute('Login');
          } else {
            // User completed onboarding locally but app_profiles doesn't exist
            // Try to create it now (might have failed during onboarding)
            const { useApp } = await import('./src/store/app');
            const appProfileData = useApp.getState().profile;
            if (appProfileData) {
              try {
                const { createOrUpdateAppProfile } = await import('./src/lib/sync');
                const created = await createOrUpdateAppProfile(appProfileData);
                if (created) {
                  console.log('App profile created after onboarding completion');
                  setNeedsOnboarding(false);
                  setInitialRoute('Tabs');
                } else {
                  console.warn('Onboarding completed locally but app_profiles creation failed - will retry on next save');
                  setNeedsOnboarding(false);
                  setInitialRoute('Tabs');
                }
              } catch (error) {
                console.error('Error creating app profile after onboarding:', error);
                setNeedsOnboarding(false);
                setInitialRoute('Tabs');
              }
            } else {
              console.warn('Onboarding completed locally but app_profiles missing and no local profile found');
              setNeedsOnboarding(false);
              setInitialRoute('Tabs');
            }
          }
        } else {
          // app_profiles exists - load it into the app store
          const applied = await applyServerAppProfile();
          if (!applied) {
            console.warn('app_profiles exists but could not be loaded');
          } else {
            console.log('Loaded app profile from Supabase');
          }
          setNeedsOnboarding(false);
          setInitialRoute('Tabs');
        }
      } catch (error) {
        console.error('Error checking auth and onboarding status:', error);
        // On error, default to Login screen for safety
        setNeedsOnboarding(false);
        setHasSessionUser(false);
        setInitialRoute('Login');
      } finally {
        setCheckingAuth(false);
      }
    };

    checkAuthAndOnboarding();
  }, [hydrated, applyServerAppProfile]);

  // Listen for auth state changes to detect new user login
  React.useEffect(() => {
    if (!hydrated) {
      return;
    }

    const setupAuthListener = async () => {
      const { supabase } = await import('./src/lib/supabase');
      
      const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
        const newUserId = session?.user?.id ?? null;
        
        if (event === 'SIGNED_IN' && newUserId && newUserId !== currentUserId) {
          console.log('New user signed in - checking onboarding status');
          setCurrentUserId(newUserId);
          
          // Check if app_profiles exists for this user
          const { data: appProfile } = await supabase
            .from('app_profiles')
            .select('user_id')
            .eq('user_id', newUserId)
            .maybeSingle();

          if (!appProfile) {
            // No app_profiles - check if onboarding was just completed
            const { useApp } = await import('./src/store/app');
            const { useOnboardingStore } = await import('./src/onboarding/store');
            const appProfileData = useApp.getState().profile;
            const hasCompleted = useOnboardingStore.getState().hasCompletedOnboarding;
            
            // If onboarding was just completed and profile exists locally, try to create app_profiles
            if (hasCompleted && appProfileData) {
              console.log('Onboarding completed locally but app_profiles missing - trying to create');
              try {
                const { createOrUpdateAppProfile } = await import('./src/lib/sync');
                const created = await createOrUpdateAppProfile(appProfileData);
                if (created) {
                  console.log('App profile created after sign-in');
                  setHasSessionUser(true);
                  setNeedsOnboarding(false);
                  setInitialRoute('Tabs');
                  return;
                }
              } catch (error) {
                console.error('Error creating app profile after sign-in:', error);
              }
            }
            
            // No app_profiles and no local profile - reset onboarding and show it
            console.log('New user - no app_profiles found, showing onboarding');
            useOnboardingStore.getState().reset();
            const { useStore } = await import('./src/store/useStore');
            useApp.getState().resetAll();
            useStore.getState().clearAll();
            setHasSessionUser(true);
            setNeedsOnboarding(true);
            setInitialRoute('Login');
          } else {
            // app_profiles exists - onboarding already completed, load into store
            await applyServerAppProfile();
            setHasSessionUser(true);
            setNeedsOnboarding(false);
            setInitialRoute('Tabs');
          }
        } else if (event === 'SIGNED_OUT') {
          setCurrentUserId(null);
          setHasSessionUser(false);
          setNeedsOnboarding(false);
        }
      });

      return () => {
        subscription.unsubscribe();
      };
    };

    const cleanup = setupAuthListener();
    return () => {
      cleanup.then((unsubscribe) => unsubscribe?.());
    };
  }, [hydrated, currentUserId, applyServerAppProfile]);

  // If onboarding restart was requested, force show onboarding flow
  React.useEffect(() => {
    if (!hydrated || !forceOnboarding) {
      return;
    }
    if (hasSessionUser) {
      setNeedsOnboarding(true);
      setInitialRoute('Login');
      const { clearForceOnboarding } = useOnboardingStore.getState();
      clearForceOnboarding();
    }
  }, [forceOnboarding, hasSessionUser, hydrated]);

  // React to onboarding completion - when hasCompletedOnboarding changes to true, switch to main app
  React.useEffect(() => {
    if (!hydrated || checkingAuth || !hasSessionUser) {
      return;
    }

    const checkOnboardingStatus = async () => {
      if (hasCompletedOnboarding) {
        // Onboarding was just completed - verify profile exists in app store and app_profiles exists
        try {
          const { useApp } = await import('./src/store/app');
          
          // Wait a short moment to ensure profile is saved (onboarding might have just finished)
          await new Promise(resolve => setTimeout(resolve, 200));
          
          let appProfileData = useApp.getState().profile;
          
          if (!appProfileData) {
            // Profile not in app store - try to transfer from onboarding store immediately
            const { useOnboardingStore } = await import('./src/onboarding/store');
            const onboardingProfile = useOnboardingStore.getState().profile;
            
            if (onboardingProfile) {
              console.log('Profile not in app store yet - transferring from onboarding store');
              try {
                const { onboardingProfileToAppProfile } = await import('./src/onboarding/utils/toAppProfile');
                const recoveredProfile = onboardingProfileToAppProfile(onboardingProfile);
                const { replaceProfile } = useApp.getState();
                replaceProfile(recoveredProfile);
                
                // Wait a moment for the state to update
                await new Promise(resolve => setTimeout(resolve, 100));
                appProfileData = useApp.getState().profile;
                
                if (appProfileData) {
                  console.log('Profile transferred successfully from onboarding store');
                } else {
                  console.error('Failed to transfer profile - this is a critical error');
                  return;
                }
              } catch (recoverError) {
                console.error('Error transferring profile:', recoverError);
                return;
              }
            } else {
              console.error('Cannot transfer profile - both app store and onboarding store are empty');
              return;
            }
          }
          
          // Profile exists - continue with switch
          await completeOnboardingSwitch();
        } catch (error) {
          console.error('Error checking onboarding status:', error);
        }
      } else if (hasSessionUser) {
        // Onboarding not completed - check if it should be shown
        try {
          const { supabase } = await import('./src/lib/supabase');
          const { data: { user } } = await supabase.auth.getUser();
          
          if (user) {
            const { data: appProfile } = await supabase
              .from('app_profiles')
              .select('user_id')
              .eq('user_id', user.id)
              .maybeSingle();

            if (!appProfile) {
              // No app_profiles - show onboarding
              console.log('No app_profiles found - showing onboarding');
              setNeedsOnboarding(true);
              setInitialRoute('Login');
            }
          }
        } catch (error) {
          console.error('Error checking app profile:', error);
        }
      }
    };

    const completeOnboardingSwitch = async () => {
      try {
        const { supabase } = await import('./src/lib/supabase');
        const { data: { user } } = await supabase.auth.getUser();
        const { useApp } = await import('./src/store/app');
        const appProfileData = useApp.getState().profile;
        
        if (!user || !appProfileData) {
          console.error('Cannot complete onboarding switch - missing user or profile');
          return;
        }
        
        const { data: appProfile } = await supabase
          .from('app_profiles')
          .select('user_id')
          .eq('user_id', user.id)
          .maybeSingle();

        if (appProfile) {
          console.log('Onboarding completed - app_profiles exists, switching to main app');
          setNeedsOnboarding(false);
          setInitialRoute('Tabs');
        } else {
          // Try to create app_profiles if it doesn't exist
          try {
            const { createOrUpdateAppProfile } = await import('./src/lib/sync');
            const created = await createOrUpdateAppProfile(appProfileData);
            if (created) {
              console.log('App profile created after onboarding completion');
              setNeedsOnboarding(false);
              setInitialRoute('Tabs');
            } else {
              console.warn('Failed to create app profile after onboarding');
              // Still switch to main app - profile will be created on next sync
              setNeedsOnboarding(false);
              setInitialRoute('Tabs');
            }
          } catch (error) {
            console.error('Error creating app profile after onboarding:', error);
            // Still switch to main app
            setNeedsOnboarding(false);
            setInitialRoute('Tabs');
          }
        }
      } catch (error) {
        console.error('Error completing onboarding switch:', error);
      }
    };

    checkOnboardingStatus();
  }, [hasCompletedOnboarding, hydrated, checkingAuth, hasSessionUser]);

  if (!hydrated || checkingAuth) {
    return <LoadingScreen />;
  }

  // Wrap everything in AuthProvider so we can use useAuth hook
  return (
    <AuthProvider>
      <LoadingProvider>
        <HydrationGate>
          {needsOnboarding && hasSessionUser ? (
            <OnboardingNavigator />
          ) : (
            <MainApp initialRoute={initialRoute} />
          )}
        </HydrationGate>
      </LoadingProvider>
    </AuthProvider>
  );
};

export default RootApp;
const TAB_ICON_DASHBOARD = require('./assets/029-online.png');
const TAB_ICON_TRACKEN = require('./assets/044-magnifying_glass.png');
const TAB_ICON_MISSIONS = require('./assets/033-book.png');
const TAB_ICON_MILESTONES = require('./assets/004-medal.png');
