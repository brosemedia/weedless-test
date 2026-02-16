import React, { useState, useEffect } from 'react';
import { View, ScrollView, StyleSheet, Switch, Pressable, Alert } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { ThemedView, ThemedText, Button } from '../design/theme';
import { spacing, radius } from '../design/tokens';
import { fetchCurrentProfile, updateProfileConsents } from '../api/profile';
import { useUiStore } from '../store/ui';
import type { RootStackParamList } from '../../App';

type Props = NativeStackScreenProps<RootStackParamList, 'CloudConsent'>;

/**
 * Cloud Consent Screen
 * 
 * Allows users to:
 * - Opt-in to server-side storage of sensitive tracking data (consent_server_storage)
 *   Legal basis: User consent for processing & storing sensitive app data on the server
 * 
 * - Opt-in to marketing emails (marketing_opt_in)
 *   Legal basis: User consent for sending marketing emails; must be optional
 *   This is separate from server storage and NOT required for app usage
 */
export default function CloudConsentScreen({ navigation, route }: Props) {
  const [cloudConsent, setCloudConsent] = useState(false);
  const [marketingConsent, setMarketingConsent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const { hideQuickActions, showQuickActions } = useUiStore();
  const insets = useSafeAreaInsets();

  // Hide quick actions (plus button) when this screen is active
  useEffect(() => {
    hideQuickActions('CloudConsent');
    return () => {
      showQuickActions('CloudConsent');
    };
  }, [hideQuickActions, showQuickActions]);

  // Pre-fill with current profile values if coming from settings
  useEffect(() => {
    const loadCurrentProfile = async () => {
      try {
        const profile = await fetchCurrentProfile();
        if (profile) {
          setCloudConsent(profile.consent_server_storage ?? false);
          setMarketingConsent(profile.marketing_opt_in ?? false);
        }
      } catch (error) {
        console.error('Error loading profile for consent screen:', error);
      } finally {
        setInitialLoading(false);
      }
    };

    loadCurrentProfile();
  }, []);

  const handleSave = async () => {
    setLoading(true);
    try {
      const updated = await updateProfileConsents({
        consent_server_storage: cloudConsent,
        marketing_opt_in: marketingConsent,
      });

      if (updated) {
        // Mark that consent screen was shown
        const { setCloudConsentShown } = await import('../storage/localFlags');
        await setCloudConsentShown(true);
        
        // Navigate back or forward
        if (navigation.canGoBack()) {
          navigation.goBack();
        } else {
          navigation.navigate('Tabs');
        }
      } else {
        // Show error (could add error state here)
        console.error('Failed to update consents');
      }
    } catch (error) {
      console.error('Error updating consents:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleCloudConsent = (value: boolean) => {
    // Wenn von an -> aus: warnen vor Datenverlust (lokal-only)
    if (!value && cloudConsent) {
      Alert.alert(
        'Cloud-Sync deaktivieren?',
        'Dann bleiben deine Daten nur auf diesem Gerät. Bei Abmeldung oder Gerätewechsel gehen sie verloren.',
        [
          { text: 'Abbrechen', style: 'cancel' },
          {
            text: 'Ja, deaktivieren',
            style: 'destructive',
            onPress: () => setCloudConsent(false),
          },
        ]
      );
      return;
    }
    setCloudConsent(value);
  };

  const handleSkip = async () => {
    // Mark that consent screen was shown, so we don't nag again
    const { setCloudConsentShown } = await import('../storage/localFlags');
    await setCloudConsentShown(true);
    
    // Dismiss without saving
    if (navigation.canGoBack()) {
      navigation.goBack();
    } else {
      navigation.navigate('Tabs');
    }
  };

  if (initialLoading) {
    return (
      <ThemedView style={styles.container}>
        <ThemedText>Lädt...</ThemedText>
      </ThemedView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      <ThemedView style={[styles.container, { backgroundColor: 'transparent' }]}>
        <ScrollView 
          contentContainerStyle={[
            styles.scrollContent,
            { paddingTop: insets.top + spacing.xxl + spacing.m },
          ]}
          showsVerticalScrollIndicator={false}
          style={styles.scrollView}
        >
          <ThemedText kind="h1" style={styles.title}>
            Datenschutz & Cloud-Speicherung
          </ThemedText>

          <ThemedText style={styles.description}>
            Damit du deine Daten bei Gerätewechsel nicht verlierst und Hazeless auf mehreren Geräten nutzen kannst, können deine Einträge (Konsum, Pausen, Stimmung etc.) verschlüsselt auf unseren Servern in der EU gespeichert werden (Supabase).
          </ThemedText>

          <ThemedText style={styles.description}>
            Du kannst diese Einwilligung jederzeit in den Einstellungen widerrufen und alle gespeicherten Daten löschen.
          </ThemedText>

          <View style={styles.consentSection}>
            {/* Cloud Sync Consent */}
            <View style={styles.consentRow}>
              <View style={styles.consentContent}>
                <ThemedText kind="h2" style={styles.consentTitle}>
                  Cloud-Sync & Datenspeicherung aktivieren
                </ThemedText>
                <ThemedText style={styles.consentDescription}>
                  Ich bin einverstanden, dass meine App-Daten (Konsum, Pausen, Stimmung etc.) verschlüsselt auf Servern in der EU gespeichert werden, um Cloud-Sync & Backup zu ermöglichen.
                </ThemedText>
              </View>
              <Switch
                value={cloudConsent}
                onValueChange={handleToggleCloudConsent}
                trackColor={{ false: '#767577', true: '#A1A61F' }}
                thumbColor={cloudConsent ? '#FFFFFF' : '#f4f3f4'}
              />
            </View>

            {/* Marketing Consent - Separate and Optional */}
            <View style={[styles.consentRow, styles.marketingRow]}>
              <View style={styles.consentContent}>
                <ThemedText kind="h2" style={styles.consentTitle}>
                  Optionale E-Mail-Updates
                </ThemedText>
                <ThemedText style={styles.consentDescription}>
                  Ich möchte gelegentlich E-Mails mit Produktupdates und Angeboten zur Hazeless-App erhalten. Diese Einwilligung ist freiwillig und kann ich jederzeit widerrufen.
                </ThemedText>
              </View>
              <Switch
                value={marketingConsent}
                onValueChange={setMarketingConsent}
                trackColor={{ false: '#767577', true: '#A1A61F' }}
                thumbColor={marketingConsent ? '#FFFFFF' : '#f4f3f4'}
              />
            </View>
          </View>
        </ScrollView>

        <View style={[styles.buttonContainer, { paddingBottom: insets.bottom + spacing.m }]}>
          <Pressable
            onPress={handleSkip}
            style={({ pressed }) => [
              styles.skipButton,
              pressed && styles.skipButtonPressed,
            ]}
          >
            <ThemedText style={styles.skipButtonText}>Nicht jetzt</ThemedText>
          </Pressable>

          <Button
            title="Speichern"
            onPress={handleSave}
            disabled={loading}
            fullWidth
          />
        </View>
      </ThemedView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.xxl + spacing.l,
    paddingBottom: spacing.xl,
  },
  title: {
    marginBottom: spacing.l,
  },
  description: {
    marginBottom: spacing.m,
    lineHeight: 22,
  },
  consentSection: {
    marginTop: spacing.xl,
    marginBottom: spacing.xl,
    gap: spacing.l,
  },
  consentRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.m,
    padding: spacing.l,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: radius.l,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  marketingRow: {
    marginTop: spacing.m,
  },
  consentContent: {
    flex: 1,
    gap: spacing.xs,
  },
  consentTitle: {
    marginBottom: spacing.xs,
  },
  consentDescription: {
    fontSize: 14,
    lineHeight: 20,
    opacity: 0.9,
  },
  buttonContainer: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.m,
    gap: spacing.m,
  },
  skipButton: {
    paddingVertical: spacing.m,
    paddingHorizontal: spacing.l,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 44,
  },
  skipButtonPressed: {
    opacity: 0.7,
  },
  skipButtonText: {
    fontSize: 16,
    fontWeight: '600',
    opacity: 0.7,
  },
});

