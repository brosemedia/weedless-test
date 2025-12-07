import React, { useState, useEffect } from 'react';
import { View, Switch, ActivityIndicator, StyleSheet, Alert } from 'react-native';
import { ThemedView, ThemedText } from '../../../design/theme';
import { spacing } from '../../../design/tokens';
import { fetchCurrentProfile, updateProfileConsents } from '../../../api/profile';
import { useAuth } from '../../../contexts/AuthContext';
import { supabase } from '../../../lib/supabase';

export default function Notifications() {
  const { user } = useAuth();
  const [notificationsEnabled, setNotificationsEnabled] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const loadProfile = async () => {
      try {
        // Check if user is authenticated
        const { data: { user: currentUser }, error: userError } = await supabase.auth.getUser();
        
        if (userError || !currentUser) {
          console.error('User not authenticated:', userError);
          Alert.alert(
            'Nicht angemeldet',
            'Bitte melde dich an, um Benachrichtigungseinstellungen zu ändern.'
          );
          setNotificationsEnabled(true);
          setLoading(false);
          return;
        }

        const profile = await fetchCurrentProfile();
        if (profile) {
          setNotificationsEnabled(profile.notifications_enabled ?? true);
        } else {
          // Fallback if profile not found
          setNotificationsEnabled(true);
        }
      } catch (error) {
        console.error('Error loading notification settings:', error);
        Alert.alert('Fehler', 'Einstellungen konnten nicht geladen werden.');
        setNotificationsEnabled(true);
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, [user]);

  const handleToggle = async (value: boolean) => {
    // Optimistic update
    setNotificationsEnabled(value);
    setSaving(true);

    try {
      // Double-check authentication
      const { data: { user: currentUser }, error: userError } = await supabase.auth.getUser();
      
      if (userError || !currentUser) {
        console.error('User not authenticated when trying to update:', userError);
        Alert.alert(
          'Nicht angemeldet',
          'Bitte melde dich an, um Benachrichtigungseinstellungen zu ändern.'
        );
        // Revert on error
        setNotificationsEnabled(!value);
        setSaving(false);
        return;
      }

      console.log('Updating notifications_enabled to:', value);
      const updated = await updateProfileConsents({
        notifications_enabled: value,
      });

      if (!updated) {
        console.error('Failed to update notification settings - updateProfileConsents returned null');
        Alert.alert(
          'Fehler',
          'Die Einstellungen konnten nicht gespeichert werden. Bitte versuche es erneut.'
        );
        // Revert on error
        setNotificationsEnabled(!value);
      } else {
        console.log('Successfully updated notifications_enabled:', updated.notifications_enabled);
      }
    } catch (error) {
      console.error('Error updating notification settings:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unbekannter Fehler';
      Alert.alert(
        'Fehler',
        `Die Einstellungen konnten nicht gespeichert werden: ${errorMessage}`
      );
      // Revert on error
      setNotificationsEnabled(!value);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <ThemedView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" />
          <ThemedText style={styles.loadingText}>Lädt...</ThemedText>
        </View>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.switchRow}>
          <View style={styles.switchLabel}>
            <ThemedText>Benachrichtigungen aktivieren</ThemedText>
            <ThemedText muted style={styles.description}>
              Erhalte Erinnerungen und Tipps zur Unterstützung deiner Pause
            </ThemedText>
          </View>
          {saving ? (
            <ActivityIndicator size="small" />
          ) : (
            <Switch
              value={notificationsEnabled ?? true}
              onValueChange={handleToggle}
              disabled={saving}
            />
          )}
        </View>
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: spacing.l,
    gap: spacing.l,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing.m,
  },
  loadingText: {
    marginTop: spacing.m,
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.m,
  },
  switchLabel: {
    flex: 1,
    marginRight: spacing.m,
  },
  description: {
    marginTop: spacing.xs,
    fontSize: 14,
  },
});
