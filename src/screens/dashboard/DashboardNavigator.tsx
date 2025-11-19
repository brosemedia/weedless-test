import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import Dashboard from '../Dashboard';

export type DashboardStackParamList = {
  DashboardHome: undefined;
};

const Stack = createNativeStackNavigator<DashboardStackParamList>();

export default function DashboardNavigator() {
  return (
    <Stack.Navigator>
      <Stack.Screen name="DashboardHome" component={Dashboard} options={{ headerShown: false }} />
    </Stack.Navigator>
  );
}
