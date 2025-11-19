import React from 'react';
import { Pressable, Text } from 'react-native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import SettingsHome from './SettingsHome';
import Notifications from './pages/Notifications';
import Language from './pages/Language';
import Philosophy from './pages/Philosophy';
import ExportData from './pages/ExportData';
import ProfileAndOnboarding from './pages/ProfileAndOnboarding';
import { colors } from '../../design/tokens';

export type SettingsStackParamList = {
  SettingsHome: undefined;
  ProfileAndOnboarding: undefined;
  Notifications: undefined;
  Language: undefined;
  Philosophy: undefined;
  ExportData: undefined;
};

const Stack = createNativeStackNavigator<SettingsStackParamList>();

export default function SettingsNavigator() {
  return (
    <Stack.Navigator>
      <Stack.Screen
        name="SettingsHome"
        component={SettingsHome}
        options={({ navigation }) => ({
          title: 'Einstellungen',
          presentation: 'modal',
          headerRight: () => (
            <Pressable onPress={() => navigation.goBack()} accessibilityRole="button">
              <Text style={{ color: colors.light.primary, fontWeight: '700', fontFamily: 'Inter-SemiBold' }}>Fertig</Text>
            </Pressable>
          ),
        })}
      />
      <Stack.Screen
        name="ProfileAndOnboarding"
        component={ProfileAndOnboarding}
        options={{ title: 'Profil & Onboarding' }}
      />
      <Stack.Screen name="Notifications" component={Notifications} options={{ title: 'Benachrichtigungen' }} />
      <Stack.Screen name="Language" component={Language} options={{ title: 'Sprache' }} />
      <Stack.Screen name="Philosophy" component={Philosophy} options={{ title: 'Unsere Philosophie' }} />
      <Stack.Screen name="ExportData" component={ExportData} options={{ title: 'Daten exportieren' }} />
    </Stack.Navigator>
  );
}
