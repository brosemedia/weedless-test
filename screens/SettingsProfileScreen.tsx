import React, { useEffect, useState } from 'react';
import { View, Text, TextInput, StyleSheet, ScrollView, Button } from 'react-native';
import { loadProfile, saveProfile, OnboardingProfile } from '../stores/profile';

export default function SettingsProfileScreen() {
  const [p, setP] = useState<OnboardingProfile | null>(null);

  useEffect(() => {
    loadProfile().then(setP);
  }, []);

  if (!p) return null;

  function change<K extends keyof OnboardingProfile>(key: K, v: string) {
    const numKeys: (keyof OnboardingProfile)[] = [
      'pricePerGram',
      'gramsPerDayBaseline',
      'jointsPerDayBaseline',
      'gramsPerJoint',
      'avgSessionMinutes',
    ];
    setP((prev) => {
      if (!prev) return prev;
      const nextValue = numKeys.includes(key) ? Number(v.replace(',', '.')) : (v as OnboardingProfile[K]);
      return { ...prev, [key]: nextValue } as OnboardingProfile;
    });
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.h1}>Profil & Onboarding</Text>

      {(
        [
          ['locale', 'de-DE'],
          ['currency', 'EUR'],
          ['pauseStartISO', new Date().toISOString()],
          ['pricePerGram', '10'],
          ['gramsPerDayBaseline', '1.0'],
          ['jointsPerDayBaseline', '2'],
          ['gramsPerJoint', '0.35'],
          ['avgSessionMinutes', '12'],
        ] as const
      ).map(([k, placeholder]) => (
        <View key={k} style={styles.row}>
          <Text style={styles.label}>{k}</Text>
          <TextInput
            style={styles.input}
            value={String((p as OnboardingProfile)[k as keyof OnboardingProfile] ?? '')}
            onChangeText={(t) => change(k as keyof OnboardingProfile, t)}
            placeholder={placeholder}
            placeholderTextColor="#789"
          />
        </View>
      ))}

      <Button title="Speichern" onPress={() => saveProfile(p)} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, gap: 12 },
  h1: { fontSize: 20, fontWeight: '800', marginBottom: 8, color: '#fff' },
  row: { gap: 6 },
  label: { color: '#cdd6e0', fontSize: 12 },
  input: {
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#2f3a44',
    padding: 10,
    color: '#fff',
    backgroundColor: '#1b2026',
  },
});
