/**
 * GlassDemoScreen – Demonstriert das Liquid Glass Design System
 *
 * Dieser Screen zeigt alle Glass-Komponenten in Aktion.
 * Du kannst ihn als Referenz und zum Testen verwenden.
 *
 * Um diesen Screen zu nutzen, füge ihn temporär zu deinem Navigator hinzu:
 * ```tsx
 * // In deinem Stack Navigator
 * <Stack.Screen name="GlassDemo" component={GlassDemoScreen} />
 * ```
 */

import React from 'react';
import { View, ScrollView, Text, StyleSheet, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { GlassSurface, GlassButton, GlassHeader, GLASS_HEADER_HEIGHT } from '../components/ui';
import { useTheme } from '../theme/useTheme';
import { spacing, fonts } from '../design/tokens';

export default function GlassDemoScreen() {
  const insets = useSafeAreaInsets();
  const { theme, mode, toggleMode } = useTheme();
  const palette = theme.colors;

  const showAlert = (message: string) => {
    Alert.alert('Button gedrückt', message);
  };

  return (
    <View style={[styles.container, { backgroundColor: palette.background }]}>
      {/* Glass Header */}
      <GlassHeader
        title="Liquid Glass Demo"
        rightElement={
          <MaterialCommunityIcons
            name={mode === 'dark' ? 'weather-sunny' : 'weather-night'}
            size={24}
            color={palette.text}
            onPress={toggleMode}
          />
        }
      />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.content,
          {
            paddingTop: insets.top + GLASS_HEADER_HEIGHT + spacing.l,
            paddingBottom: insets.bottom + spacing.xxl,
          },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Section: GlassSurface Varianten */}
        <Text style={[styles.sectionTitle, { color: palette.text }]}>
          GlassSurface Varianten
        </Text>

        <GlassSurface padding={20} borderRadius={24}>
          <Text style={[styles.cardTitle, { color: palette.text }]}>
            Standard (default)
          </Text>
          <Text style={[styles.cardText, { color: palette.textMuted }]}>
            Die Standard-Glasoberfläche mit mittlerer Transparenz und Blur.
          </Text>
        </GlassSurface>

        <GlassSurface variant="elevated" padding={20} borderRadius={24}>
          <Text style={[styles.cardTitle, { color: palette.text }]}>
            Elevated
          </Text>
          <Text style={[styles.cardText, { color: palette.textMuted }]}>
            Erhöhte Variante mit stärkerem Hintergrund und größerem Schatten.
          </Text>
        </GlassSurface>

        <GlassSurface variant="subtle" padding={20} borderRadius={24}>
          <Text style={[styles.cardTitle, { color: palette.text }]}>
            Subtle
          </Text>
          <Text style={[styles.cardText, { color: palette.textMuted }]}>
            Dezente Variante mit mehr Transparenz – ideal für Overlays.
          </Text>
        </GlassSurface>

        {/* Section: GlassButton Varianten */}
        <Text style={[styles.sectionTitle, { color: palette.text }]}>
          GlassButton Varianten
        </Text>

        <GlassSurface padding={20} borderRadius={24}>
          <View style={styles.buttonRow}>
            <GlassButton
              label="Primary"
              onPress={() => showAlert('Primary Button')}
              variant="primary"
            />
            <GlassButton
              label="Secondary"
              onPress={() => showAlert('Secondary Button')}
              variant="secondary"
            />
          </View>

          <View style={styles.buttonRow}>
            <GlassButton
              label="Ghost"
              onPress={() => showAlert('Ghost Button')}
              variant="ghost"
            />
            <GlassButton
              label="Kompakt"
              onPress={() => showAlert('Compact Button')}
              variant="secondary"
              compact
            />
          </View>

          <GlassButton
            label="Volle Breite mit Icon"
            onPress={() => showAlert('Full Width Button')}
            variant="primary"
            fullWidth
            icon={
              <MaterialCommunityIcons
                name="rocket-launch"
                size={20}
                color="#FFF"
              />
            }
          />

          <GlassButton
            label="Deaktiviert"
            onPress={() => {}}
            variant="primary"
            disabled
            fullWidth
          />
        </GlassSurface>

        {/* Section: Kombiniertes Beispiel */}
        <Text style={[styles.sectionTitle, { color: palette.text }]}>
          Kombiniertes Beispiel
        </Text>

        <GlassSurface variant="elevated" padding={24} borderRadius={28}>
          <View style={styles.exampleHeader}>
            <View style={styles.exampleIcon}>
              <MaterialCommunityIcons
                name="leaf"
                size={32}
                color={palette.primary}
              />
            </View>
            <View style={styles.exampleTitleContainer}>
              <Text style={[styles.exampleTitle, { color: palette.text }]}>
                Deine Pause
              </Text>
              <Text style={[styles.exampleSubtitle, { color: palette.textMuted }]}>
                7 Tage, 14 Stunden, 23 Minuten
              </Text>
            </View>
          </View>

          <View style={styles.exampleStats}>
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: palette.primary }]}>
                €84,50
              </Text>
              <Text style={[styles.statLabel, { color: palette.textMuted }]}>
                Gespart
              </Text>
            </View>
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: palette.primary }]}>
                14g
              </Text>
              <Text style={[styles.statLabel, { color: palette.textMuted }]}>
                Nicht konsumiert
              </Text>
            </View>
          </View>

          <GlassButton
            label="Details ansehen"
            onPress={() => showAlert('Details')}
            variant="secondary"
            fullWidth
            iconRight={
              <MaterialCommunityIcons
                name="arrow-right"
                size={18}
                color={palette.text}
              />
            }
          />
        </GlassSurface>

        {/* Section: Floating Header Preview */}
        <Text style={[styles.sectionTitle, { color: palette.text }]}>
          Header-Varianten
        </Text>

        <GlassSurface padding={16} borderRadius={20}>
          <Text style={[styles.cardText, { color: palette.textMuted }]}>
            Der GlassHeader unterstützt verschiedene Modi:{'\n\n'}
            • <Text style={{ fontWeight: '600' }}>Standard</Text> – Fest am oberen Rand{'\n'}
            • <Text style={{ fontWeight: '600' }}>Floating</Text> – Mit Abständen und rundem Border{'\n'}
            • <Text style={{ fontWeight: '600' }}>Transparent</Text> – Ohne Blur-Hintergrund
          </Text>
        </GlassSurface>

        {/* Info-Box */}
        <GlassSurface variant="subtle" padding={16} borderRadius={16}>
          <View style={styles.infoBox}>
            <MaterialCommunityIcons
              name="information-outline"
              size={20}
              color={palette.info}
            />
            <Text style={[styles.infoText, { color: palette.textMuted }]}>
              Alle Komponenten passen sich automatisch an den aktuellen Theme-Modus an.
              Tippe oben rechts auf das Icon, um zwischen Light und Dark Mode zu wechseln.
            </Text>
          </View>
        </GlassSurface>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    paddingHorizontal: spacing.l,
    gap: spacing.m,
  },
  sectionTitle: {
    fontFamily: fonts.bold,
    fontSize: 20,
    fontWeight: '700',
    marginTop: spacing.l,
    marginBottom: spacing.xs,
  },
  cardTitle: {
    fontFamily: fonts.semibold,
    fontSize: 17,
    fontWeight: '600',
    marginBottom: 6,
  },
  cardText: {
    fontFamily: fonts.regular,
    fontSize: 14,
    lineHeight: 20,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: spacing.m,
    marginBottom: spacing.m,
  },
  exampleHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.l,
  },
  exampleIcon: {
    width: 56,
    height: 56,
    borderRadius: 16,
    backgroundColor: 'rgba(155, 190, 45, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.m,
  },
  exampleTitleContainer: {
    flex: 1,
  },
  exampleTitle: {
    fontFamily: fonts.bold,
    fontSize: 20,
    fontWeight: '700',
  },
  exampleSubtitle: {
    fontFamily: fonts.regular,
    fontSize: 14,
    marginTop: 2,
  },
  exampleStats: {
    flexDirection: 'row',
    marginBottom: spacing.l,
  },
  statItem: {
    flex: 1,
  },
  statValue: {
    fontFamily: fonts.bold,
    fontSize: 24,
    fontWeight: '700',
  },
  statLabel: {
    fontFamily: fonts.regular,
    fontSize: 13,
    marginTop: 2,
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.s,
  },
  infoText: {
    fontFamily: fonts.regular,
    fontSize: 13,
    lineHeight: 18,
    flex: 1,
  },
});

