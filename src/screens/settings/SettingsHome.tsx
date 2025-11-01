import React from 'react';
import { View, ScrollView, Pressable, Text } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { ThemedView, ThemedText } from '../../design/theme';
import { colors, spacing, radius } from '../../design/tokens';
import type { SettingsStackParamList } from './SettingsNavigator';

function Row({ label, icon, onPress }: { label: string; icon: string; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => ({
      backgroundColor: 'white',
      paddingVertical: 14,
      paddingHorizontal: 14,
      flexDirection: 'row',
      alignItems: 'center',
      opacity: pressed ? 0.9 : 1,
    })}>
      <Text style={{ fontSize: 18, width: 28 }}>{icon}</Text>
      <Text style={{ fontSize: 16 }}>{label}</Text>
    </Pressable>
  );
}

export default function SettingsHome({ navigation }: any) {
  return (
    <ThemedView style={{ flex: 1 }}>
      <ScrollView contentContainerStyle={{ padding: spacing.l, gap: spacing.l }}>
        <View style={{ backgroundColor: colors.light.surface, borderRadius: radius.l, borderWidth: 1, borderColor: colors.light.border, overflow: 'hidden' }}>
          <Row label="Die Rauchdaten ändern" icon="📅" onPress={() => navigation.navigate('ChangeSmokingData')} />
          <View style={{ height: 1, backgroundColor: colors.light.border }} />
          <Row label="Benachrichtigungen" icon="🔔" onPress={() => navigation.navigate('Notifications')} />
          <View style={{ height: 1, backgroundColor: colors.light.border }} />
          <Row label="Sprache" icon="🌐" onPress={() => navigation.navigate('Language')} />
        </View>

        <View style={{ backgroundColor: colors.light.surface, borderRadius: radius.l, borderWidth: 1, borderColor: colors.light.border, overflow: 'hidden' }}>
          <Row label="Daten exportieren" icon="📤" onPress={() => navigation.navigate('ExportData')} />
        </View>

        <View style={{ backgroundColor: colors.light.surface, borderRadius: radius.l, borderWidth: 1, borderColor: colors.light.border, overflow: 'hidden' }}>
          <Row label="Unsere Philosophie" icon="😊" onPress={() => navigation.navigate('Philosophy')} />
        </View>
      </ScrollView>
    </ThemedView>
  );
}
