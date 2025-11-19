import React from 'react';
import { View, Text, StyleSheet, ScrollView, Linking } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, spacing } from '../design/tokens';
import { HEADER_TOTAL_HEIGHT } from '../components/AppHeader';
import { useHeaderTransparency } from '../hooks/useHeaderTransparency';
import { useUiStore } from '../store/ui';
const CARD_COLOR = '#D99A25';

export default function Help() {
  const insets = useSafeAreaInsets();
  const headerAccessoryHeight = useUiStore((s) => s.headerAccessoryHeight);
  const { handleScroll } = useHeaderTransparency();
  return (
    <ScrollView
      contentContainerStyle={[
        styles.container,
        {
          paddingTop: insets.top + HEADER_TOTAL_HEIGHT + headerAccessoryHeight + spacing.l,
          paddingBottom: Math.max(spacing.xl, insets.bottom + spacing.m),
        },
      ]}
      onScroll={handleScroll}
      scrollEventThrottle={16}
    >
      <Text style={styles.title}>Hilfe & Support</Text>
      <Text style={styles.paragraph}>
        Willkommen im Support-Bereich. Hier findest du Antworten auf die häufigsten Fragen rund um
        Weedless und die Minigames.
      </Text>
      <View style={styles.card}>
        <View style={styles.cardInner}>
          <Text style={styles.cardTitle}>FAQ</Text>
          <Text style={[styles.paragraph, styles.cardBody]}>
          • Daily Tracken: Erfasse täglich deinen Konsum oder deine Pause.{'\n'}
          • Minigames: Trainiere Reaktionsfähigkeit und Achtsamkeit.{'\n'}
          • Meilensteine: Tracke deine wichtigsten Erfolge.
          </Text>
        </View>
      </View>
      <View style={styles.card}>
        <View style={styles.cardInner}>
          <Text style={styles.cardTitle}>Kontakt</Text>
          <Text style={[styles.paragraph, styles.cardBody]}>Schreibe uns bei Fragen oder Feedback gerne eine E-Mail.</Text>
          <Text style={styles.link} onPress={() => Linking.openURL('mailto:support@weedless.app')}>
          support@weedless.app
          </Text>
        </View>
      </View>
      <View style={styles.card}>
        <View style={styles.cardInner}>
          <Text style={styles.cardTitle}>Notfall?</Text>
          <Text style={[styles.paragraph, styles.cardBody]}>
          Wenn du dich akut belastet fühlst, wende dich bitte an medizinische Fachstellen oder rufe
          den Notruf (112) an.
          </Text>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: spacing.xl,
    gap: spacing.l,
    backgroundColor: 'rgba(255,255,255,0.94)',
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    fontFamily: 'Inter-Bold',
    color: colors.light.text,
  },
  paragraph: {
    fontSize: 15,
    lineHeight: 22,
    fontFamily: 'Inter-Regular',
    color: colors.light.text,
  },
  card: {
    borderRadius: 18,
    shadowColor: 'rgba(166, 90, 46, 0.35)',
    shadowOpacity: 1,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 8 },
    elevation: 5,
    backgroundColor: 'transparent',
  },
  cardInner: {
    borderRadius: 18,
    padding: spacing.l,
    gap: 8,
    backgroundColor: CARD_COLOR,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    fontFamily: 'Inter-SemiBold',
    color: '#FFFFFF',
  },
  cardBody: {
    color: '#FFFFFF',
  },
  link: {
    fontSize: 15,
    color: '#FFFFFF',
    textDecorationLine: 'underline',
    fontWeight: '600',
    fontFamily: 'Inter-SemiBold',
  },
});
