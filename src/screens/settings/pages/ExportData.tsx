import React, { useState } from 'react';
import { Share, ScrollView, StyleSheet, ActivityIndicator } from 'react-native';
import { ThemedView, ThemedText, Button } from '../../../design/theme';
import { spacing } from '../../../design/tokens';
import { useStore } from '../../../store/useStore';
import { fetchCurrentProfile } from '../../../api/profile';
import { loadAllSyncData } from '../../../lib/loadSyncData';

/**
 * Export Data Screen
 * 
 * Exports all user data (local + cloud) in compliance with GDPR Art. 15 (Right of access)
 * and Art. 20 (Right to data portability).
 */
export default function ExportData() {
  const [loading, setLoading] = useState(false);
  const localData = useStore((s) => ({ profile: s.profile, diary: s.diary, checkins: s.checkins }));

  const onExport = async () => {
    setLoading(true);
    try {
      // Get local data
      const exportData: any = {
        exported_at: new Date().toISOString(),
        local: localData,
      };

      // Check if user has cloud storage consent and load cloud data if available
      const profile = await fetchCurrentProfile();
      if (profile?.consent_server_storage) {
        try {
          const cloudData = await loadAllSyncData();
          if (cloudData) {
            exportData.cloud = {
              app_profile: cloudData.profile,
              day_logs: cloudData.dayLogs,
              pauses: cloudData.pauses,
            };
          }
        } catch (cloudError) {
          console.error('Error loading cloud data for export:', cloudError);
          // Continue with local data only
        }
      }

      const json = JSON.stringify(exportData, null, 2);
      await Share.share({ message: json });
    } catch (e) {
      console.error('Error exporting data:', e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ThemedView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <ThemedText style={styles.description}>
          Exportiert alle deine Daten (lokal + Cloud, falls aktiviert) als JSON über das System‑Share‑Sheet.
        </ThemedText>
        <ThemedText style={styles.description} muted>
          Dies entspricht deinem Recht auf Datenübertragbarkeit gemäß DSGVO Art. 20.
        </ThemedText>
        {loading ? (
          <ActivityIndicator size="large" style={styles.loader} />
        ) : (
          <Button title="Daten exportieren" onPress={onExport} fullWidth />
        )}
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loader: {
    marginTop: spacing.xl,
  },
  scrollContent: {
    padding: spacing.xl,
    paddingBottom: spacing.xxl,
  },
  description: {
    marginBottom: spacing.xl,
    lineHeight: 22,
  },
});
