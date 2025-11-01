import 'react-native-gesture-handler';
import 'react-native-reanimated';
import * as React from 'react';
import { Text, ImageBackground } from 'react-native';
import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import DashboardNavigator from './src/screens/dashboard/DashboardNavigator';
import Stats from './src/screens/Stats';
import Missions from './src/screens/Missions';
import Milestones from './src/screens/Milestones';
import SettingsNavigator from './src/screens/settings/SettingsNavigator';
import { ThemeProvider } from './src/design/theme';
import { colors } from './src/design/tokens';
import Checkins from './src/screens/Checkins';

const Tab = createBottomTabNavigator();

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

function NavigationWithTheme() {
  const insets = useSafeAreaInsets();

  const iconFor = (name: string) => {
  switch (name) {
    case 'Dashboard':
      return '🏠';
    case 'Check-in':
      return '✅';
    case 'Statistiken':
      return '📈';
    case 'Missionen':
      return '🎯';
    case 'Meilensteine':
      return '🏅';
    case 'Einstellungen':
      return '⚙️';
    default:
      return '•';
  }
};

  return (
    <NavigationContainer theme={navTheme as any}>
      <Tab.Navigator
        sceneContainerStyle={{ paddingTop: insets.top }}
        screenOptions={({ route }) => ({
          headerShown: false,
          tabBarActiveTintColor: colors.light.primary,
          tabBarInactiveTintColor: colors.light.textMuted,
          tabBarStyle: {
            backgroundColor: colors.light.bg,
            borderTopColor: colors.light.border,
            height: 64 + insets.bottom,
            paddingBottom: Math.max(10, insets.bottom),
            paddingTop: 6,
          },
          tabBarLabelStyle: { fontSize: 12, fontWeight: '600' },
          tabBarIcon: ({ color }) => (
            <Text style={{ fontSize: 18, color }}>{iconFor(route.name)}</Text>
          ),
        })}
        >
          <Tab.Screen name="Dashboard" component={DashboardNavigator} />
          <Tab.Screen name="Check-in" component={Checkins} />
          <Tab.Screen name="Statistiken" component={Stats} />
          <Tab.Screen name="Missionen" component={Missions} />
          <Tab.Screen name="Meilensteine" component={Milestones} />
          <Tab.Screen name="Einstellungen" component={SettingsNavigator} />
        </Tab.Navigator>
    </NavigationContainer>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <SafeAreaProvider>
        <ImageBackground source={require('./ref/bg1.png')} style={{ flex: 1 }} resizeMode="cover">
          <NavigationWithTheme />
        </ImageBackground>
      </SafeAreaProvider>
    </ThemeProvider>
  );
}

// Removed default styles and content; rendering only test component.








