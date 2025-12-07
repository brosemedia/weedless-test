import React, { useEffect } from 'react';
import { View, Switch, StyleSheet, Pressable, Platform } from 'react-native';
import { ThemedView, ThemedText } from '../../../design/theme';
import { useTheme } from '../../../theme/useTheme';
import { spacing } from '../../../design/tokens';
import { useUiStore } from '../../../store/ui';
import { haptics, setGlobalHapticsEnabled } from '../../../services/haptics';

export default function Haptics() {
  const { theme } = useTheme();
  const hapticsEnabled = useUiStore((s) => s.hapticsEnabled ?? true); // Default: true
  const setHapticsEnabled = useUiStore((s) => s.setHapticsEnabled);

  // Stelle sicher, dass der Wert initialisiert ist
  useEffect(() => {
    const currentValue = useUiStore.getState().hapticsEnabled;
    if (currentValue === undefined) {
      setHapticsEnabled(true); // Initialisiere mit true
    }
    // Setze globalen Cache für HapticsService
    setGlobalHapticsEnabled(hapticsEnabled ?? true);
  }, [setHapticsEnabled, hapticsEnabled]);

  const handleToggle = (value: boolean) => {
    setHapticsEnabled(value);
    setGlobalHapticsEnabled(value); // Aktualisiere globalen Cache
    // Test-Haptik beim Aktivieren
    if (value) {
      haptics.trigger('general', 'selection');
    }
  };

  const handleTestPress = async () => {
    if (!hapticsEnabled) return;
    console.log('[Haptics Settings] Test button pressed');
    
    // Teste verschiedene Muster mit stärkeren Vibrationen
    try {
      // Stärkste Vibration zuerst
      await haptics.trigger('game', 'celebration');
      await new Promise(resolve => setTimeout(resolve, 800));
      await haptics.trigger('game', 'error');
      await new Promise(resolve => setTimeout(resolve, 800));
      await haptics.trigger('dashboard', 'impact', { intensity: 'heavy' });
    } catch (error) {
      console.error('[Haptics Settings] Error in test:', error);
    }
  };

  // Direkter Test mit expo-haptics (umgeht unseren Service)
  const handleDirectTest = async () => {
    if (!hapticsEnabled) return;
    console.log('[Haptics Settings] Direct test button pressed');
    try {
      const Haptics = require('expo-haptics').default;
      // Teste direkt die stärkste Haptik
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
      await new Promise(resolve => setTimeout(resolve, 200));
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
      await new Promise(resolve => setTimeout(resolve, 200));
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (error) {
      console.error('[Haptics Settings] Direct test error:', error);
    }
  };

  return (
    <ThemedView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.switchRow}>
          <View style={styles.switchLabel}>
            <ThemedText>Haptisches Feedback</ThemedText>
            <ThemedText muted style={styles.description}>
              Aktiviere Vibrationen für verschiedene Interaktionen in der App
            </ThemedText>
          </View>
          <Switch
            value={hapticsEnabled}
            onValueChange={handleToggle}
          />
        </View>

        {hapticsEnabled && (
          <>
            <ThemedText muted style={styles.infoText}>
              💡 Tipp: Prüfe in den iPhone-Einstellungen (Einstellungen → Töne & Haptik → System-Haptik), ob Haptik aktiviert ist.
            </ThemedText>
            
            <Pressable
              onPress={handleDirectTest}
              style={({ pressed }) => [
                styles.testButton,
                styles.testButtonStrong,
                {
                  backgroundColor: pressed
                    ? theme.colors.primary + '30'
                    : theme.colors.primary + '20',
                  borderColor: theme.colors.primary + '50',
                },
              ]}
            >
              <ThemedText style={[styles.testButtonText, { color: theme.colors.primary }]}>
                🔥 Direkter Test (stärkste Haptik)
              </ThemedText>
              <ThemedText muted style={styles.testButtonDescription}>
                Testet direkt expo-haptics - sollte immer funktionieren
              </ThemedText>
            </Pressable>

            <Pressable
              onPress={handleTestPress}
              style={({ pressed }) => [
                styles.testButton,
                {
                  backgroundColor: pressed
                    ? theme.colors.primary + '20'
                    : theme.colors.primary + '10',
                  borderColor: theme.colors.primary + '30',
                },
              ]}
            >
              <ThemedText style={[styles.testButtonText, { color: theme.colors.primary }]}>
                🎮 Vibrationsmuster testen
              </ThemedText>
              <ThemedText muted style={styles.testButtonDescription}>
                Testet verschiedene Muster über unseren Service
              </ThemedText>
            </Pressable>
          </>
        )}
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
  testButton: {
    borderRadius: 12,
    borderWidth: 1,
    padding: spacing.m,
    alignItems: 'center',
    marginTop: spacing.s,
  },
  testButtonText: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: spacing.xs,
  },
  testButtonDescription: {
    fontSize: 13,
    textAlign: 'center',
  },
  warningText: {
    fontSize: 12,
    textAlign: 'center',
    fontStyle: 'italic',
    marginBottom: spacing.s,
    padding: spacing.s,
    backgroundColor: 'rgba(255, 193, 7, 0.1)',
    borderRadius: 8,
  },
  infoText: {
    fontSize: 12,
    textAlign: 'center',
    marginBottom: spacing.m,
    padding: spacing.s,
    backgroundColor: 'rgba(33, 150, 243, 0.1)',
    borderRadius: 8,
  },
  testButtonStrong: {
    borderWidth: 2,
    marginBottom: spacing.m,
  },
});

