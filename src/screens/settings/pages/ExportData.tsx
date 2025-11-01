import React from 'react';
import { Share } from 'react-native';
import { ThemedView, ThemedText, Button } from '../../../design/theme';
import { spacing } from '../../../design/tokens';
import { useStore } from '../../../store/useStore';

export default function ExportData() {
  const data = useStore((s) => ({ profile: s.profile, diary: s.diary, checkins: s.checkins }));

  const onExport = async () => {
    const json = JSON.stringify(data, null, 2);
    try {
      await Share.share({ message: json });
    } catch (e) {
      // no-op
    }
  };

  return (
    <ThemedView style={{ flex: 1 }}>
      <ThemedText style={{ padding: spacing.l }}>
        Exportiert die wichtigsten Daten (Profil, Tagebuch & Check‑ins) als
        JSON über das System‑Share‑Sheet.
      </ThemedText>
      <Button title="Daten exportieren" onPress={onExport} />
    </ThemedView>
  );
}
