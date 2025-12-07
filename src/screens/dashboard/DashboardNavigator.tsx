import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import Dashboard from '../Dashboard';
import StatsScreen from '../StatsScreen';
import { useTheme } from '../../theme/useTheme';

export type DashboardStackParamList = {
  DashboardHome: undefined;
  Stats: undefined;
};

const Stack = createNativeStackNavigator<DashboardStackParamList>();

export default function DashboardNavigator() {
  const { theme, mode } = useTheme();
  const palette = theme.colors;
  
  return (
    <Stack.Navigator
      screenOptions={{
        // Native iOS-Animationen
        animation: 'default',
        contentStyle: {
          backgroundColor: 'transparent',
        },
        // Native iOS Glasmorphismus-Header
        headerTransparent: true,
        headerBlurEffect: mode === 'dark' ? 'systemMaterialDark' : 'systemMaterial',
        headerLargeTitleShadowVisible: false,
        headerShadowVisible: false,
        // Native iOS Zurück-Button mit "Zurück" Text
        headerBackTitleVisible: true,
        headerBackTitle: 'Zurück',
        headerTintColor: palette.primary,
        headerTitleStyle: {
          fontFamily: 'Inter-SemiBold',
          fontSize: 17,
          color: palette.text,
        },
      }}
    >
      <Stack.Screen 
        name="DashboardHome" 
        component={Dashboard} 
        options={{ headerShown: false }} 
      />
      <Stack.Screen 
        name="Stats" 
        component={StatsScreen} 
        options={{ 
          title: 'Statistiken',
          headerShown: true,
        }} 
      />
    </Stack.Navigator>
  );
}
