import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import Dashboard from '../Dashboard';
import GameScreen from '../GameScreen';

export type DashboardStackParamList = {
  DashboardHome: undefined;
  Game: undefined;
};

const Stack = createNativeStackNavigator<DashboardStackParamList>();

export default function DashboardNavigator() {
  return (
    <Stack.Navigator>
      <Stack.Screen name="DashboardHome" component={Dashboard} options={{ headerShown: false }} />
      <Stack.Screen name="Game" component={GameScreen} options={{ title: 'Craving Tap' }} />
    </Stack.Navigator>
  );
}

