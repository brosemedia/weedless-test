import React, { useState, useEffect } from 'react';
import { View, ScrollView, StyleSheet, Pressable } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { ThemedView, ThemedText, Button } from '../../../design/theme';
import { spacing, radius } from '../../../design/tokens';
import { fetchCurrentProfile } from '../../../api/profile';
import type { SettingsStackParamList } from '../SettingsNavigator';
import type { NavigationProp } from '@react-navigation/native';
import type { RootStackParamList } from '../../../../App';

type Props = NativeStackScreenProps<SettingsStackParamList, 'PrivacyConsents'>;

/**
 * Privacy & Consents Settings Screen
 * 
 * Shows current consent status and allows users to edit their consents.
 */
export default function PrivacyConsentsScreen({ navigation }: Props) {
  const [profile, setProfile] = useState<Awaited<ReturnType<typeof fetchCurrentProfile>>>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const currentProfile = await fetchCurrentProfile();
        setProfile(currentProfile);
      } catch (error) {
        console.error('Error loading profile:', error);
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, []);

  const handleEditConsents = () => {
    // Close Settings modal first, then navigate to CloudConsent
    const rootNavigation = navigation.getParent() as NavigationProp<RootStackParamList> | null;
    if (rootNavigation) {
      // Close the Settings modal
      rootNavigation.goBack();
      // Use requestAnimationFrame to ensure Settings is closed before navigating
      requestAnimationFrame(() => {
        rootNavigation.navigate('CloudConsent');
      });
    }
  };

  if (loading) {
    return (
      <ThemedView style={styles.container}>
        <ThemedText>Lädt...</ThemedText>
      </ThemedView>
    );
  }

  const cloudSyncStatus = profile?.consent_server_storage ? 'Aktiv' : 'Inaktiv';
  const marketingStatus = profile?.marketing_opt_in ? 'Aktiv' : 'Inaktiv';

  return (
    <ThemedView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <ThemedText kind="h1" style={styles.title}>
          Datenschutz & Einwilligungen
        </ThemedText>

        <View style={styles.section}>
          <View style={styles.statusRow}>
            <ThemedText kind="h2">Cloud-Sync</ThemedText>
            <ThemedText style={styles.statusText}>{cloudSyncStatus}</ThemedText>
          </View>
          <ThemedText style={styles.description} muted>
            {profile?.consent_server_storage
              ? 'Deine App-Daten werden verschlüsselt auf Servern in der EU gespeichert, um Cloud-Sync & Backup zu ermöglichen.'
              : 'Deine App-Daten werden nur lokal auf diesem Gerät gespeichert.'}
          </ThemedText>
        </View>

        <View style={styles.section}>
          <View style={styles.statusRow}>
            <ThemedText kind="h2">Marketing-E-Mails</ThemedText>
            <ThemedText style={styles.statusText}>{marketingStatus}</ThemedText>
          </View>
          <ThemedText style={styles.description} muted>
            {profile?.marketing_opt_in
              ? 'Du erhältst gelegentlich E-Mails mit Produktupdates und Angeboten zur Hazeless-App.'
              : 'Du erhältst keine Marketing-E-Mails.'}
          </ThemedText>
        </View>

        <View style={styles.buttonContainer}>
          <Button
            title="Einwilligungen bearbeiten"
            onPress={handleEditConsents}
            fullWidth
          />
        </View>
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing.xl,
    paddingBottom: spacing.xxl,
  },
  title: {
    marginBottom: spacing.xl,
  },
  section: {
    marginBottom: spacing.xl,
    padding: spacing.l,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: radius.l,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  statusText: {
    fontWeight: '600',
    fontSize: 16,
  },
  description: {
    marginTop: spacing.xs,
    fontSize: 14,
    lineHeight: 20,
  },
  buttonContainer: {
    marginTop: spacing.l,
  },
});

