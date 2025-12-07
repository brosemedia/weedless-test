import React, { useState } from 'react';
import { ScrollView, StyleSheet, Alert, InteractionManager } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { ThemedView, ThemedText, Button } from '../../../design/theme';
import { spacing } from '../../../design/tokens';
import { deleteAccount } from '../../../api/profile';
import { useAuth } from '../../../contexts/AuthContext';
import type { SettingsStackParamList } from '../SettingsNavigator';
import type { NavigationProp } from '@react-navigation/native';
import type { RootStackParamList } from '../../../../App';

type Props = NativeStackScreenProps<SettingsStackParamList, 'DeleteAccount'>;

/**
 * Delete Account Screen
 * 
 * Allows users to delete their account and all associated data.
 * This complies with GDPR Art. 17 (Right to erasure / "Right to be forgotten").
 */
export default function DeleteAccountScreen({ navigation }: Props) {
  const [loading, setLoading] = useState(false);
  const { signOut } = useAuth();

  const handleDeleteAccount = () => {
    Alert.alert(
      'Account löschen',
      'Möchtest du deinen Account wirklich unwiderruflich löschen?\n\n' +
      'Dies wird alle deine Daten löschen:\n' +
      '• Profil & Einstellungen\n' +
      '• Alle Konsum-Einträge\n' +
      '• Alle Pausen\n' +
      '• Alle Statistiken\n' +
      '• Cloud-Daten (falls aktiviert)\n\n' +
      'Diese Aktion kann nicht rückgängig gemacht werden!',
      [
        {
          text: 'Abbrechen',
          style: 'cancel',
        },
        {
          text: 'Account löschen',
          style: 'destructive',
          onPress: async () => {
            // Second confirmation
            Alert.alert(
              'Letzte Bestätigung',
              'Bist du dir wirklich sicher? Alle deine Daten werden unwiderruflich gelöscht.',
              [
                {
                  text: 'Abbrechen',
                  style: 'cancel',
                },
                {
                  text: 'Ja, endgültig löschen',
                  style: 'destructive',
                  onPress: async () => {
                    setLoading(true);
                    try {
                      const success = await deleteAccount();
                      
                      if (success) {
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
                            Alert.alert(
                              'Account gelöscht',
                              'Dein Account und alle zugehörigen Daten wurden erfolgreich gelöscht.',
                              [{ text: 'OK' }]
                            );
                          } catch (signOutError) {
                            console.error('Error signing out:', signOutError);
                            // Still show success message even if signOut fails
                            Alert.alert(
                              'Account gelöscht',
                              'Dein Account und alle zugehörigen Daten wurden erfolgreich gelöscht.',
                              [{ text: 'OK' }]
                            );
                          }
                        });
                      } else {
                        Alert.alert(
                          'Fehler',
                          'Beim Löschen des Accounts ist ein Fehler aufgetreten. Bitte versuche es erneut oder kontaktiere den Support.'
                        );
                      }
                    } catch (error) {
                      console.error('Error deleting account:', error);
                      Alert.alert(
                        'Fehler',
                        'Beim Löschen des Accounts ist ein unerwarteter Fehler aufgetreten.'
                      );
                    } finally {
                      setLoading(false);
                    }
                  },
                },
              ]
            );
          },
        },
      ]
    );
  };

  return (
    <ThemedView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <ThemedText kind="h1" style={styles.title}>
          Account löschen
        </ThemedText>

        <ThemedText style={styles.description}>
          Du kannst deinen Account und alle zugehörigen Daten jederzeit löschen. 
          Dies entspricht deinem Recht auf Löschung gemäß DSGVO Art. 17.
        </ThemedText>

        <ThemedText kind="h2" style={styles.sectionTitle}>
          Was wird gelöscht?
        </ThemedText>

        <ThemedText style={styles.listItem}>
          • Dein Profil und alle Einstellungen
        </ThemedText>
        <ThemedText style={styles.listItem}>
          • Alle Konsum-Einträge und Tracking-Daten
        </ThemedText>
        <ThemedText style={styles.listItem}>
          • Alle Pausen und Statistiken
        </ThemedText>
        <ThemedText style={styles.listItem}>
          • Alle Cloud-Daten (falls aktiviert)
        </ThemedText>
        <ThemedText style={styles.listItem}>
          • Dein Authentifizierungs-Account
        </ThemedText>

        <ThemedText style={styles.warning} muted>
          ⚠️ Diese Aktion ist unwiderruflich. Nach der Löschung können deine Daten nicht wiederhergestellt werden.
        </ThemedText>

        <ThemedText style={styles.description} muted>
          Tipp: Du kannst vor dem Löschen deine Daten exportieren, falls du sie später noch benötigst.
        </ThemedText>

        <Button
          title={loading ? 'Wird gelöscht...' : 'Account endgültig löschen'}
          onPress={handleDeleteAccount}
          disabled={loading}
          fullWidth
          style={styles.deleteButton}
        />
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
    marginBottom: spacing.l,
  },
  description: {
    marginBottom: spacing.l,
    lineHeight: 22,
  },
  sectionTitle: {
    marginTop: spacing.xl,
    marginBottom: spacing.m,
  },
  listItem: {
    marginBottom: spacing.xs,
    paddingLeft: spacing.m,
    lineHeight: 22,
  },
  warning: {
    marginTop: spacing.xl,
    marginBottom: spacing.m,
    padding: spacing.m,
    backgroundColor: 'rgba(255, 193, 7, 0.1)',
    borderRadius: 8,
    lineHeight: 22,
  },
  deleteButton: {
    marginTop: spacing.xl,
  },
});

