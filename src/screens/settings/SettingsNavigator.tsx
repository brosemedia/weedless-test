import React from 'react';
import { Pressable, Text, StyleSheet } from 'react-native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useNavigation } from '@react-navigation/native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import SettingsHome from './SettingsHome';
import Notifications from './pages/Notifications';
import Language from './pages/Language';
import Philosophy from './pages/Philosophy';
import ProfileAndOnboarding from './pages/ProfileAndOnboarding';
import PrivacyConsents from './pages/PrivacyConsents';
import DeleteAccount from './pages/DeleteAccount';
import Haptics from './pages/Haptics';
import { useTheme } from '../../theme/useTheme';
import { useAppStrings } from '../../i18n/useStrings';

// Zurück-Button Komponente für den ersten Screen
function BackToAppButton() {
  const navigation = useNavigation();
  const { theme } = useTheme();
  
  return (
    <Pressable
      onPress={() => navigation.getParent()?.goBack()}
      hitSlop={{ top: 10, right: 10, bottom: 10, left: 10 }}
      style={({ pressed }) => [
        styles.backButton,
        pressed && styles.backButtonPressed,
      ]}
    >
      <MaterialCommunityIcons name="chevron-left" size={28} color={theme.colors.primary} />
      <Text style={[styles.backText, { color: theme.colors.primary }]}>Zurück</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: -8,
  },
  backButtonPressed: {
    opacity: 0.6,
  },
  backText: {
    fontSize: 17,
    marginLeft: -4,
  },
});

export type SettingsStackParamList = {
  SettingsHome: undefined;
  ProfileAndOnboarding: undefined;
  Notifications: undefined;
  Language: undefined;
  Philosophy: undefined;
  PrivacyConsents: undefined;
  DeleteAccount: undefined;
  Haptics: undefined;
};

const Stack = createNativeStackNavigator<SettingsStackParamList>();

export default function SettingsNavigator() {
  const { theme, mode } = useTheme();
  const palette = theme.colors;
  const strings = useAppStrings();
  
  return (
    <Stack.Navigator
      screenOptions={{
        // Native iOS-Animationen (default nutzt die nativen Übergänge)
        animation: 'default',
        contentStyle: {
          backgroundColor: 'transparent',
        },
        // Native iOS Glasmorphismus-Header
        headerTransparent: true,
        headerBlurEffect: mode === 'dark' ? 'systemMaterialDark' : 'systemMaterial',
        headerLargeTitleShadowVisible: false,
        headerShadowVisible: false,
        // Native iOS Zurueck-Button mit "Zurueck" Text
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
        name="SettingsHome"
        component={SettingsHome}
        options={{
          title: strings.settings.title,
          headerLeft: () => <BackToAppButton />,
        }}
      />
      <Stack.Screen
        name="ProfileAndOnboarding"
        component={ProfileAndOnboarding}
        options={{ 
          title: strings.settings.profileAndOnboarding,
        }}
      />
      <Stack.Screen 
        name="Notifications" 
        component={Notifications} 
        options={{ 
          title: strings.settings.notifications,
        }} 
      />
      <Stack.Screen 
        name="Language" 
        component={Language} 
        options={{ 
          title: strings.settings.language,
        }} 
      />
      <Stack.Screen 
        name="Philosophy" 
        component={Philosophy} 
        options={{ 
          title: 'Unsere Philosophie',
        }} 
      />
      <Stack.Screen 
        name="PrivacyConsents" 
        component={PrivacyConsents} 
        options={{ 
          title: strings.settings.privacyConsents,
        }} 
      />
      <Stack.Screen 
        name="DeleteAccount" 
        component={DeleteAccount} 
        options={{ 
          title: strings.settings.deleteAccount,
        }} 
      />
      <Stack.Screen 
        name="Haptics" 
        component={Haptics} 
        options={{ 
          title: strings.settings.haptics || 'Haptisches Feedback',
        }} 
      />
    </Stack.Navigator>
  );
}
