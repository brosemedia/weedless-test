import React, { useState, useEffect } from 'react';
import { View, ScrollView, Pressable, Text, StyleSheet, Alert, InteractionManager } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ThemedView, useTheme } from '../../design/theme';
import { spacing, radius } from '../../design/tokens';
import type { SettingsStackParamList } from './SettingsNavigator';
import { useAuth } from '../../contexts/AuthContext';
import type { NavigationProp } from '@react-navigation/native';
import type { RootStackParamList } from '../../../App';
import { useAppStrings } from '../../i18n/useStrings';
import { fetchCurrentProfile } from '../../api/profile';
import { supabase } from '../../lib/supabase';

// Header-Höhe für native transparent header
const NATIVE_HEADER_HEIGHT = 44;

type RowProps = {
  label: string;
  icon: string;
  onPress: () => void;
  isFirst: boolean;
  isLast: boolean;
  textColor: string;
  pressedColor: string;
  borderColor: string;
};

function Row({ label, icon, onPress, isFirst, isLast, textColor, pressedColor, borderColor }: RowProps) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.row,
        isFirst && styles.rowFirst,
        isLast && styles.rowLast,
        pressed && { backgroundColor: pressedColor },
        !isLast && { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: borderColor },
      ]}
    >
      <Text style={styles.rowIcon}>{icon}</Text>
      <Text style={[styles.rowLabel, { color: textColor }]}>{label}</Text>
    </Pressable>
  );
}

// Sections will be defined inside the component to use translations

type Props = NativeStackScreenProps<SettingsStackParamList, 'SettingsHome'>;

type AccountInfo = {
  email: string;
  hasSync: boolean;
  lastSyncTime: string | null;
};

export default function SettingsHome({ navigation }: Props) {
  const { signOut, user } = useAuth();
  const [loggingOut, setLoggingOut] = useState(false);
  const [accountInfo, setAccountInfo] = useState<AccountInfo | null>(null);
  const strings = useAppStrings();
  const theme = useTheme();
  const insets = useSafeAreaInsets();

  // Load account info and sync status
  useEffect(() => {
    const loadAccountInfo = async () => {
      if (!user) {
        setAccountInfo(null);
        return;
      }

      try {
        // Get email from user
        const email = user.email || 'Unbekannt';

        // Check if user has sync consent and get last sync time
        const profile = await fetchCurrentProfile();
        const hasSync = profile?.consent_server_storage ?? false;

        // Get last sync time from app_profiles
        let lastSyncTime: string | null = null;
        if (hasSync) {
          const { data: appProfile } = await supabase
            .from('app_profiles')
            .select('updated_at')
            .eq('user_id', user.id)
            .maybeSingle();

          if (appProfile?.updated_at) {
            const syncDate = new Date(appProfile.updated_at);
            const now = new Date();
            const diffMs = now.getTime() - syncDate.getTime();
            const diffMins = Math.floor(diffMs / 60000);
            const diffHours = Math.floor(diffMs / 3600000);
            const diffDays = Math.floor(diffMs / 86400000);

            if (diffMins < 1) {
              lastSyncTime = 'Gerade eben';
            } else if (diffMins < 60) {
              lastSyncTime = `Vor ${diffMins} Min.`;
            } else if (diffHours < 24) {
              lastSyncTime = `Vor ${diffHours} Std.`;
            } else if (diffDays === 1) {
              lastSyncTime = 'Gestern';
            } else if (diffDays < 7) {
              lastSyncTime = `Vor ${diffDays} Tagen`;
            } else {
              lastSyncTime = syncDate.toLocaleDateString('de-DE', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric',
              });
            }
          }
        }

        setAccountInfo({
          email,
          hasSync,
          lastSyncTime,
        });
      } catch (error) {
        console.error('Error loading account info:', error);
        // Fallback: just show email
        setAccountInfo({
          email: user.email || 'Unbekannt',
          hasSync: false,
          lastSyncTime: null,
        });
      }
    };

    loadAccountInfo();
  }, [user]);

  const sections: Array<
    Array<{
      label: string;
      icon: string;
      navigateTo?: keyof SettingsStackParamList;
      onPress?: () => void;
    }>
  > = [
    [
      { label: strings.settings.profileAndOnboarding, icon: '🧾', navigateTo: 'ProfileAndOnboarding' },
      { label: strings.settings.notifications, icon: '🔔', navigateTo: 'Notifications' },
      { label: strings.settings.haptics || 'Haptisches Feedback', icon: '📳', navigateTo: 'Haptics' },
      { label: strings.settings.language, icon: '🌐', navigateTo: 'Language' },
    ],
    [
      { label: strings.settings.privacyConsents, icon: '🔒', navigateTo: 'PrivacyConsents' },
      { label: strings.settings.deleteAccount, icon: '🗑️', navigateTo: 'DeleteAccount' },
    ],
  ];

  const handleLogout = () => {
    const syncOff = accountInfo?.hasSync === false;
    const title = syncOff ? strings.settings.logoutNoSyncTitle : strings.settings.logoutConfirmTitle;
    const message = syncOff ? strings.settings.logoutNoSyncMessage : strings.settings.logoutConfirmMessage;
    const confirmLabel = syncOff ? strings.settings.logoutNoSyncProceed : strings.settings.logoutConfirm;

    const buttons: Array<{ text: string; style?: 'cancel' | 'destructive'; onPress?: () => void }> = [
      {
        text: strings.settings.cancel,
        style: 'cancel',
      },
    ];

    if (syncOff) {
      buttons.push({
        text: strings.settings.logoutNoSyncEnable,
        onPress: () => {
          const rootNavigation = navigation.getParent() as NavigationProp<RootStackParamList> | null;
          if (rootNavigation) {
            rootNavigation.goBack();
            requestAnimationFrame(() => {
              rootNavigation.navigate('CloudConsent');
            });
          }
        },
      });
    }

    buttons.push({
      text: confirmLabel,
      style: 'destructive',
      onPress: async () => {
        setLoggingOut(true);
        try {
          // Navigate to login screen FIRST, before signOut to avoid React hooks errors
          // This ensures components unmount before stores are reset
          const rootNavigation = navigation.getParent() as NavigationProp<RootStackParamList> | null;
          if (rootNavigation) {
            rootNavigation.reset({
              index: 0,
              routes: [{ name: 'Login' }],
            });
          }
          
          // Wait for navigation and interactions to complete, then sign out
          // signOut() will reset all stores automatically (see AuthContext)
          // Using InteractionManager ensures components have unmounted before stores are reset
          InteractionManager.runAfterInteractions(async () => {
            try {
              await signOut();
            } catch (signOutError) {
              console.error('Error signing out:', signOutError);
              // Don't show alert here as we're already navigating away
            }
          });
        } catch (error) {
          console.error('Error during logout:', error);
          Alert.alert(strings.settings.logoutError, strings.settings.logoutErrorMessage);
          setLoggingOut(false);
        }
      },
    });

    Alert.alert(title, message, buttons);
  };

  const handleAccountPress = () => {
    Alert.alert(
      'Account',
      'Was möchtest du tun?',
      [
        {
          text: 'Abbrechen',
          style: 'cancel',
        },
        {
          text: 'Ausloggen',
          onPress: handleLogout,
        },
      ]
    );
  };

  // Logout is now handled in the account card above
  const allSections = sections;

  return (
    <ThemedView style={{ flex: 1 }}>
      <ScrollView 
        contentContainerStyle={[
          styles.content, 
          { 
            paddingTop: insets.top + NATIVE_HEADER_HEIGHT + (spacing.l as any),
            paddingBottom: Math.max(spacing.l as any, insets.bottom || 0) + 100, // Extra Padding für TabBar
          }
        ]}
      >
        {/* Account Info Section */}
        {user && (
          <Pressable
            onPress={handleAccountPress}
            style={[
              styles.accountCard,
              {
                backgroundColor: theme.mode === 'dark' ? 'rgba(40,50,45,0.8)' : 'rgba(255,255,255,0.95)',
                borderColor: theme.colors.border,
              },
            ]}
          >
            <View style={styles.accountHeader}>
              <Text style={[styles.accountIcon]}>👤</Text>
              <View style={styles.accountInfo}>
                <Text
                  style={[
                    styles.accountEmail,
                    { color: theme.mode === 'dark' ? '#FFFFFF' : theme.colors.text },
                  ]}
                >
                  {accountInfo?.email ?? user.email ?? 'Account'}
                </Text>
                {accountInfo?.hasSync ? (
                  <Text
                    style={[
                      styles.accountSyncStatus,
                      { color: theme.mode === 'dark' ? '#FFFFFF' : theme.colors.textMuted },
                    ]}
                  >
                    {accountInfo?.lastSyncTime
                      ? `Zuletzt synchronisiert: ${accountInfo.lastSyncTime}`
                      : 'Cloud-Sync aktiv'}
                  </Text>
                ) : (
                  <Text
                    style={[
                      styles.accountSyncStatus,
                      { color: theme.mode === 'dark' ? '#FFFFFF' : theme.colors.textMuted },
                    ]}
                  >
                    Cloud-Sync nicht aktiviert
                  </Text>
                )}
              </View>
            </View>
            <View style={styles.accountActions}>
              <Pressable
                onPress={handleLogout}
                style={({ pressed }) => [
                  styles.logoutButton,
                  {
                    borderColor: theme.colors.border,
                    backgroundColor: pressed
                      ? theme.mode === 'dark'
                        ? 'rgba(255,255,255,0.08)'
                        : 'rgba(0,0,0,0.04)'
                      : 'transparent',
                  },
                ]}
              >
                <Text
                  style={[
                    styles.logoutButtonText,
                    { color: theme.mode === 'dark' ? '#FFFFFF' : theme.colors.text },
                  ]}
                >
                  Ausloggen
                </Text>
              </Pressable>
              <Text
                style={[
                  styles.accountHint,
                  { color: theme.mode === 'dark' ? '#FFFFFF' : theme.colors.textMuted },
                ]}
              >
                Tippen für Account-Details
              </Text>
            </View>
          </Pressable>
        )}

        {allSections.map((items, sectionIndex) => (
          // Minimalistischer Container ohne GlassSurface-Effekte
          <View
            key={sectionIndex}
            style={[
              styles.card,
              { 
                backgroundColor: theme.mode === 'dark' ? 'rgba(40,50,45,0.8)' : 'rgba(255,255,255,0.95)',
                borderColor: theme.colors.border,
              }
            ]}
          >
            {items.map((item, index) => (
              <Row
                key={item.navigateTo || item.label}
                label={item.label}
                icon={item.icon}
                onPress={item.onPress || (() => item.navigateTo && navigation.navigate(item.navigateTo))}
                isFirst={index === 0}
                isLast={index === items.length - 1}
                textColor={theme.colors.text}
                pressedColor={theme.mode === 'light' ? 'rgba(0,0,0,0.06)' : 'rgba(255,255,255,0.08)'}
                borderColor={theme.colors.border}
              />
            ))}
          </View>
        ))}
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: spacing.l,
    gap: spacing.l,
  },
  accountCard: {
    borderRadius: radius.l,
    borderWidth: 1,
    padding: spacing.l,
    marginBottom: spacing.m,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 3,
  },
  accountHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.m,
    marginBottom: spacing.s,
  },
  accountIcon: {
    fontSize: 34,
  },
  accountInfo: {
    flex: 1,
  },
  accountEmail: {
    fontSize: 17,
    fontWeight: '600',
    fontFamily: 'Inter-SemiBold',
    marginBottom: 2,
  },
  accountSyncStatus: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    lineHeight: 18,
  },
  accountHint: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    marginTop: spacing.xs,
    fontStyle: 'italic',
  },
  accountActions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing.m,
    gap: spacing.m,
  },
  logoutButton: {
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.s + 2,
    borderRadius: radius.pill,
    borderWidth: 1,
  },
  logoutButtonText: {
    fontSize: 15,
    fontFamily: 'Inter-SemiBold',
  },
  card: {
    borderRadius: radius.l,
    borderWidth: 1,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    backgroundColor: 'transparent',
    gap: 12,
  },
  rowFirst: {
    borderTopLeftRadius: radius.l - 1,
    borderTopRightRadius: radius.l - 1,
  },
  rowLast: {
    borderBottomLeftRadius: radius.l - 1,
    borderBottomRightRadius: radius.l - 1,
  },
  rowIcon: {
    fontSize: 20,
    width: 32,
    textAlign: 'center',
  },
  rowLabel: {
    fontSize: 16,
  },
});
