import React from 'react';
import { View, Text, StyleSheet, ScrollView, Linking } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { spacing } from '../design/tokens';
import { useTheme } from '../theme/useTheme';
import { useThemedStyles } from '../theme/useThemedStyles';
import type { ThemeColors } from '../theme/themes';
import { useAppStrings } from '../i18n/useStrings';

// BackButton entfernt – der native Stack-Header hat bereits einen Zurück-Button mit Blur-Effekt

export default function Help() {
  const insets = useSafeAreaInsets();
  const styles = useThemedStyles(createStyles);
  const strings = useAppStrings();
  
  // Padding für den nativen transparenten Stack-Header (ca. 44pt + Safe Area)
  const headerHeight = 44;
  
  return (
    <ScrollView
      contentContainerStyle={[
        styles.container,
        {
          paddingTop: insets.top + headerHeight + spacing.l,
          paddingBottom: Math.max(spacing.xl, insets.bottom + spacing.m),
        },
      ]}
      scrollEventThrottle={16}
    >
      {/* BackButton entfernt – nativer Header übernimmt */}
      <Text style={styles.title}>{strings.help.title}</Text>
      <Text style={styles.paragraph}>
        {strings.help.welcome}
      </Text>
      <View style={styles.card}>
        <View style={styles.cardInner}>
          <Text style={styles.cardTitle}>{strings.help.faq}</Text>
          <Text style={[styles.paragraph, styles.cardBody]}>
          {strings.help.faqContent}
          </Text>
        </View>
      </View>
      <View style={styles.card}>
        <View style={styles.cardInner}>
          <Text style={styles.cardTitle}>{strings.help.contact}</Text>
          <Text style={[styles.paragraph, styles.cardBody]}>{strings.help.contactText}</Text>
          <Text style={styles.link} onPress={() => Linking.openURL('mailto:support@hazeless.app')}>
          support@hazeless.app
          </Text>
        </View>
      </View>
      <View style={styles.card}>
        <View style={styles.cardInner}>
          <Text style={styles.cardTitle}>{strings.help.emergency}</Text>
          <Text style={[styles.paragraph, styles.cardBody]}>
          {strings.help.emergencyText}
          </Text>
        </View>
      </View>
    </ScrollView>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    container: {
      paddingHorizontal: spacing.xl,
      gap: spacing.l,
      backgroundColor: colors.cardBg,
    },
    title: {
      fontSize: 28,
      fontWeight: '700',
      fontFamily: 'Inter-Bold',
      color: colors.text,
    },
    paragraph: {
      fontSize: 15,
      lineHeight: 22,
      fontFamily: 'Inter-Regular',
      color: colors.text,
    },
    card: {
      borderRadius: 18,
      shadowColor: colors.primary,
      shadowOpacity: 0.35,
      shadowRadius: 18,
      shadowOffset: { width: 0, height: 8 },
      elevation: 5,
      backgroundColor: 'transparent',
    },
    cardInner: {
      borderRadius: 18,
      padding: spacing.l,
      gap: 8,
      backgroundColor: colors.primary,
    },
    cardTitle: {
      fontSize: 18,
      fontWeight: '600',
      fontFamily: 'Inter-SemiBold',
      color: colors.surface,
    },
    cardBody: {
      color: colors.surface,
    },
    link: {
      fontSize: 15,
      color: colors.surface,
      textDecorationLine: 'underline',
      fontWeight: '600',
      fontFamily: 'Inter-SemiBold',
    },
  });
