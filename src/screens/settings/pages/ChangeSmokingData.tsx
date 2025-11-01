import React, { useState } from 'react';
import { View, TextInput, Alert, Pressable, Text, ScrollView } from 'react-native';
import { ThemedView, ThemedText, Button } from '../../../design/theme';
import { spacing, colors, radius } from '../../../design/tokens';
import { useStore } from '../../../store/useStore';

export default function ChangeSmokingData() {
  const profile = useStore((s) => s.profile);
  const setBaseline = useStore((s) => s.setBaseline);

  const [unit, setUnit] = useState(profile.baseline.unit);
  const [amountPerDay, setAmountPerDay] = useState(String(profile.baseline.amountPerDay));
  const [pricePerUnit, setPricePerUnit] = useState(String(profile.baseline.pricePerUnit));

  const onSave = () => {
    const amt = parseFloat((amountPerDay || '0').replace(',', '.'));
    const price = parseFloat((pricePerUnit || '0').replace(',', '.'));
    if (isNaN(amt) || isNaN(price)) {
      Alert.alert('Ungültige Werte', 'Bitte gültige Zahlen eingeben.');
      return;
    }
    setBaseline({ unit, amountPerDay: amt, pricePerUnit: price });
    Alert.alert('Gespeichert', 'Rauchdaten aktualisiert.');
  };

  return (
    <ThemedView style={{ flex: 1 }}>
      <ScrollView contentContainerStyle={{ padding: spacing.l, gap: spacing.m }}>
        <ThemedText kind="h2">Einheit</ThemedText>
        <View style={{ flexDirection: 'row', gap: 8 }}>
          <Pressable onPress={() => setUnit('g')} style={{ paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8, backgroundColor: unit === 'g' ? colors.light.primary : colors.light.surface, borderWidth: 1, borderColor: colors.light.border }}>
            <Text style={{ color: unit === 'g' ? 'white' : colors.light.text }}>g</Text>
          </Pressable>
          <Pressable onPress={() => setUnit('joint')} style={{ paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8, backgroundColor: unit === 'joint' ? colors.light.primary : colors.light.surface, borderWidth: 1, borderColor: colors.light.border }}>
            <Text style={{ color: unit === 'joint' ? 'white' : colors.light.text }}>joint</Text>
          </Pressable>
        </View>

        <ThemedText>Baseline - Menge pro Tag ({unit})</ThemedText>
        <TextInput value={amountPerDay} onChangeText={setAmountPerDay} keyboardType="decimal-pad" style={{ borderWidth: 1, borderColor: colors.light.border, borderRadius: radius.sm, padding: 8, backgroundColor: 'white' }} />

        <ThemedText>{`Preis pro Einheit (pro ${unit})`}</ThemedText>
        <TextInput value={pricePerUnit} onChangeText={setPricePerUnit} keyboardType="decimal-pad" style={{ borderWidth: 1, borderColor: colors.light.border, borderRadius: radius.sm, padding: 8, backgroundColor: 'white' }} />

        <Button title="Speichern" onPress={onSave} />
      </ScrollView>
    </ThemedView>
  );
}
