import React, { Fragment } from 'react';
import { View, ScrollView, Pressable, Text, StyleSheet } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { ThemedView } from '../../design/theme';
import { colors, spacing, radius } from '../../design/tokens';
import type { SettingsStackParamList } from './SettingsNavigator';
const CARD_COLOR = '#D99A25';

type RowProps = {
  label: string;
  icon: string;
  onPress: () => void;
  isFirst: boolean;
  isLast: boolean;
};

function Row({ label, icon, onPress, isFirst, isLast }: RowProps) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.row,
        isFirst && styles.rowFirst,
        isLast && styles.rowLast,
        pressed && styles.rowPressed,
      ]}
    >
      <Text style={styles.rowIcon}>{icon}</Text>
      <Text style={styles.rowLabel}>{label}</Text>
    </Pressable>
  );
}

const sections: Array<
  Array<{
    label: string;
    icon: string;
    navigateTo: keyof SettingsStackParamList;
  }>
> = [
  [
    { label: 'Profil & Onboarding', icon: '🧾', navigateTo: 'ProfileAndOnboarding' },
    { label: 'Benachrichtigungen', icon: '🔔', navigateTo: 'Notifications' },
    { label: 'Sprache', icon: '🌐', navigateTo: 'Language' },
  ],
  [{ label: 'Daten exportieren', icon: '📤', navigateTo: 'ExportData' }],
];

type Props = NativeStackScreenProps<SettingsStackParamList, 'SettingsHome'>;

export default function SettingsHome({ navigation }: Props) {
  return (
    <ThemedView style={{ flex: 1 }}>
      <ScrollView contentContainerStyle={styles.content}>
        {sections.map((items, sectionIndex) => (
          <View key={sectionIndex} style={styles.card}>
            <View style={styles.cardInner}>
              {items.map((item, index) => (
                <Fragment key={item.navigateTo}>
                  <Row
                    label={item.label}
                    icon={item.icon}
                    onPress={() => navigation.navigate(item.navigateTo)}
                    isFirst={index === 0}
                    isLast={index === items.length - 1}
                  />
                  {index < items.length - 1 ? <View style={styles.separator} /> : null}
                </Fragment>
              ))}
            </View>
          </View>
        ))}
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: spacing.l,
    gap: spacing.l,
  },
  card: {
    borderRadius: radius.l,
    overflow: 'hidden',
    shadowColor: 'rgba(166, 90, 46, 0.35)',
    shadowOpacity: 1,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 8 },
    elevation: 4,
    backgroundColor: 'transparent',
  },
  cardInner: {
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    borderRadius: radius.l,
    backgroundColor: CARD_COLOR,
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
    borderTopLeftRadius: radius.l,
    borderTopRightRadius: radius.l,
  },
  rowLast: {
    borderBottomLeftRadius: radius.l,
    borderBottomRightRadius: radius.l,
  },
  rowPressed: {
    backgroundColor: 'rgba(255,255,255,0.12)',
  },
  rowIcon: {
    fontSize: 20,
    width: 32,
    textAlign: 'center',
  },
  rowLabel: {
    fontSize: 16,
    color: '#FFFFFF',
  },
  separator: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: 'rgba(255,255,255,0.25)',
  },
});
