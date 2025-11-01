import React, { useState } from 'react';
import { View, TextInput, Button, Alert, ScrollView, Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useStore } from '../store/useStore';
import { ThemedView, ThemedText } from '../design/theme';
import { spacing } from '../design/tokens';

export default function Settings() {
  const insets = useSafeAreaInsets();
  const profile = useStore((s) => s.profile);
  const setBaseline = useStore((s) => s.setBaseline);
  const setGoalMode = useStore((s) => s.setGoalMode);
  const setSavingGoal = useStore((s) => s.setSavingGoal);
  const clearAll = useStore((s) => s.clearAll);

  const [unit, setUnit] = useState(profile.baseline.unit);
  const [amountPerDay, setAmountPerDay] = useState(String(profile.baseline.amountPerDay));
  const [pricePerUnit, setPricePerUnit] = useState(String(profile.baseline.pricePerUnit));
  const [goalMode, setGoalModeLocal] = useState(profile.goalMode);
  const [goalTitle, setGoalTitle] = useState(profile.savingGoal?.title ?? '');
  const [goalAmount, setGoalAmount] = useState(String(profile.savingGoal?.targetAmount ?? 0));

  const onSave = () => {
    const amt = parseFloat((amountPerDay || '0').replace(',', '.'));
    const price = parseFloat((pricePerUnit || '0').replace(',', '.'));
    if (isNaN(amt) || isNaN(price)) {
      Alert.alert('Ungültige Werte', 'Bitte gültige Zahlen eingeben.');
      return;
    }
    setBaseline({ unit, amountPerDay: amt, pricePerUnit: price });
    setGoalMode(goalMode);
    const gAmt = parseFloat((goalAmount || '').replace(',', '.'));
    if (goalTitle && !isNaN(gAmt) && gAmt > 0) {
      setSavingGoal({ title: goalTitle, targetAmount: gAmt });
    } else {
      setSavingGoal(undefined);
    }
    Alert.alert('Gespeichert', 'Einstellungen wurden aktualisiert.');
  };

  return (
    <ThemedView style={{ flex: 1 }}>
      <ScrollView
        contentContainerStyle={{
          paddingHorizontal: spacing.l as any,
          paddingTop: insets.top + (spacing.l as any),
          paddingBottom: Math.max(spacing.l as any, insets.bottom),
          gap: spacing.m as any,
        }}
      >
        <ThemedText kind="h1">Einstellungen</ThemedText>

      <View style={{ backgroundColor: '#F5F7F2', borderRadius: 12, padding: 16 }}>
        <ThemedText kind="h2" style={{ marginBottom: 8 }}>Baseline</ThemedText>
        <ThemedText>Einheit</ThemedText>
        <View style={{ flexDirection: 'row', gap: 8, marginVertical: 8 }}>
          <Pressable
            onPress={() => setUnit('g')}
            style={{ paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8, backgroundColor: unit === 'g' ? '#4F7A1F' : '#E5E7EB' }}
          >
            <ThemedText style={{ color: unit === 'g' ? 'white' : '#111827' }}>g</ThemedText>
          </Pressable>
          <Pressable
            onPress={() => setUnit('joint')}
            style={{ paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8, backgroundColor: unit === 'joint' ? '#4F7A1F' : '#E5E7EB' }}
          >
            <ThemedText style={{ color: unit === 'joint' ? 'white' : '#111827' }}>joint</ThemedText>
          </Pressable>
        </View>
        <ThemedText>{`Baseline - Menge pro Tag (${profile.baseline.unit})`}</ThemedText>
        <TextInput
          value={amountPerDay}
          onChangeText={setAmountPerDay}
          keyboardType="decimal-pad"
          style={{ borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 8, padding: 8 }}
        />
        <ThemedText>{`Preis pro Einheit (pro ${profile.baseline.unit})`}</ThemedText>
        <TextInput
          value={pricePerUnit}
          onChangeText={setPricePerUnit}
          keyboardType="decimal-pad"
          style={{ borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 8, padding: 8 }}
        />
        <View style={{ height: 8 }} />
        <Button
          title="Baseline speichern"
          onPress={() => {
            const amt = parseFloat(amountPerDay || '0');
            const price = parseFloat(pricePerUnit || '0');
            if (isNaN(amt) || isNaN(price)) {
              Alert.alert('Ungültige Werte', 'Bitte gültige Zahlen eingeben.');
              return;
            }
            setBaseline({ amountPerDay: amt, pricePerUnit: price });
            Alert.alert('Gespeichert', 'Baseline aktualisiert');
          }}
        />
      </View>

      <View style={{ backgroundColor: '#F5F7F2', borderRadius: 12, padding: 16 }}>
        <ThemedText kind="h2" style={{ marginBottom: 8 }}>Zielmodus</ThemedText>
        <View style={{ flexDirection: 'row', gap: 8 }}>
          <Pressable
            onPress={() => setGoalModeLocal('quit')}
            style={{ paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8, backgroundColor: goalMode === 'quit' ? '#4F7A1F' : '#E5E7EB' }}
          >
            <ThemedText style={{ color: goalMode === 'quit' ? 'white' : '#111827' }}>quit</ThemedText>
          </Pressable>
          <Pressable
            onPress={() => setGoalModeLocal('reduce')}
            style={{ paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8, backgroundColor: goalMode === 'reduce' ? '#4F7A1F' : '#E5E7EB' }}
          >
            <ThemedText style={{ color: goalMode === 'reduce' ? 'white' : '#111827' }}>reduce</ThemedText>
          </Pressable>
        </View>
      </View>

      <View style={{ backgroundColor: '#F5F7F2', borderRadius: 12, padding: 16 }}>
        <ThemedText kind="h2" style={{ marginTop: 16 }}>Sparziel</ThemedText>
        <ThemedText>Titel</ThemedText>
        <TextInput
          value={goalTitle}
          onChangeText={setGoalTitle}
          placeholder="z. B. Brettspiel"
          style={{ borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 8, padding: 8 }}
        />
        <ThemedText>Betrag ()</ThemedText>
        <TextInput
          value={goalAmount}
          onChangeText={setGoalAmount}
          keyboardType="decimal-pad"
          placeholder="z. B. 100"
          style={{ borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 8, padding: 8, marginBottom: 8 }}
        />
        <Button
          title="Sparziel speichern"
          onPress={() => {
            const amt = parseFloat(goalAmount || '0');
            setSavingGoal(
              goalTitle ? { title: goalTitle, targetAmount: amt } : undefined
            );
            Alert.alert('Gespeichert', 'Sparziel aktualisiert');
          }}
        />
      </View>

        <View style={{ flexDirection: 'row', gap: 12, justifyContent: 'flex-end' }}>
          <Button title="Zurücksetzen" onPress={() => clearAll()} />
          <Button title="Speichern" onPress={onSave} />
        </View>
      </ScrollView>
    </ThemedView>
  );
}

