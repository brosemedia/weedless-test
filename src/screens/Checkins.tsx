import React, { useEffect, useMemo, useState } from 'react';
import { View, Alert, ScrollView, Pressable, Modal, TextInput } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useStore } from '../store/useStore';
import { spacing, colors, radius } from '../design/tokens';\nimport { aggregate } from '../lib/stats';
import { Card, ThemedText } from '../design/theme';
import MultiStepDailyCheckin, { type DailyCheckinData } from '../components/MultiStepDailyCheckin';

export default function Checkins() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();
  const addCheckin = useStore((s) => s.addCheckin);
  const addEntry = useStore((s) => s.addEntry);
  const diary = useStore((s) => s.diary);
  const removeEntry = useStore((s) => s.removeEntry);
  const checkins = useStore((s) => s.checkins);\n  const profile = useStore((s) => s.profile);\n  const diary = useStore((s) => s.diary);

  // Milestones
  const milestones = useStore((s) => s.milestones);
  const setMilestones = useStore((s) => s.setMilestones);
  const awardMilestone = useStore((s) => s.awardMilestone);

  // Seed default milestones on first run
  useEffect(() => {
    if (!milestones || milestones.length === 0) {
      setMilestones([, { id: 'money1000', title: '1.000 € gespart', points: 120, kind: 'money', threshold: 1000, icon: '💶' }]);
    }
  }, []);

  const hasCheckinOn = (isoDate: string) => checkins.some((c) => c.dateISO.slice(0,10) === isoDate);

  const currentStreak = useMemo(() => {
    let streak = 0;
    const d = new Date();
    for (let i = 0; i < 365; i++) {
      const iso = new Date(d.getFullYear(), d.getMonth(), d.getDate() - i).toISOString().slice(0,10);
      if (hasCheckinOn(iso)) streak++; else break;
    }
    return streak;
  }, [checkins]);

  // Award when thresholds reached
  useEffect(() => {
    const total = checkins.length;
    (milestones || []).forEach((m) => { if (m.achievedAt) return; if (m.kind === 'streak' && currentStreak >= m.threshold) awardMilestone(m.id); if (m.kind === 'count' && total >= m.threshold) awardMilestone(m.id); if (m.kind === 'money') { const agg = aggregate(profile, diary, 'all'); if (agg.moneySaved >= (m.threshold || 0)) awardMilestone(m.id); } });
  }, [checkins, milestones, currentStreak]);

  // Prepare last 7 days overview
  const last7 = useMemo(() => {
    const arr: { iso: string; label: string; done: boolean }[] = [];
    const base = new Date();
    const labels = ['So','Mo','Di','Mi','Do','Fr','Sa'];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(base.getFullYear(), base.getMonth(), base.getDate() - i);
      const iso = d.toISOString().slice(0,10);
      arr.push({ iso, label: labels[d.getDay()], done: hasCheckinOn(iso) });
    }
    return arr;
  }, [checkins]);

  // Quick-entry modal
  const [open, setOpen] = useState(false);
  const [amount, setAmount] = useState('0');
  const [note, setNote] = useState('');

  const handleSubmit = (data: DailyCheckinData) => {
    const used = data.usedToday;
    const mcq = data.cravings0to10 ?? 0;
    const pause = !used ? data.pauses?.[0] : undefined;
    const cws = pause
      ? (pause.schlafstoerung || 0) + (pause.reizbarkeit || 0) + (pause.unruhe || 0) + (pause.appetit || 0) + (pause.schwitzen || 0)
      : undefined;
    const isi = pause?.schlafstoerung != null ? Math.max(0, Math.min(8, Math.round((pause.schlafstoerung || 0) * 0.8))) : undefined;

    addCheckin({
      mcq0_10: mcq,
      cws0_50: cws,
      isi2_0_8: isi,
    });

    if (used) {
      let when = new Date(data.dateISO);
      const t = data.uses?.[0]?.time;
      if (t && /^\d{2}:\d{2}$/.test(t)) {
        const [hh, mm] = t.split(':').map((n) => parseInt(n, 10));
        when.setHours(hh, mm, 0, 0);
      }
      const amount = Number.isFinite(data.amountGrams) ? data.amountGrams : 0;
      const form = data.uses?.[0]?.form;
      const extra = data.notes?.trim() ? ` Notiz: ${data.notes.trim()}` : '';
      const note = `Form: ${form ?? 'n/a'}; Zeit: ${t ?? 'n/a'}.${extra}`;
      addEntry({ date: when.toISOString(), amount, craving: mcq, note });
    }
    Alert.alert('Gespeichert', 'Daily Check-in erfasst');
  };

  const saveQuickEntry = () => {
    const amt = parseFloat((amount || '0').replace(',', '.'));
    addEntry({ date: new Date().toISOString(), amount: isNaN(amt) ? 0 : amt, note: note.trim() || undefined });
    setAmount('0');
    setNote('');
    setOpen(false);
  };

  return (
    <ScrollView
      contentContainerStyle={{
        paddingHorizontal: spacing.xl as any,
        paddingTop: (insets.top + (spacing.l as any)) as any,
        paddingBottom: spacing.xl as any,
        gap: spacing.l as any,
      }}
    >
      <Card>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <ThemedText kind="h2">Deine letzten 7 Tage</ThemedText>
          <Pressable onPress={() => navigation.navigate('Meilensteine')} accessibilityRole="button" style={{ paddingVertical: 6, paddingHorizontal: 10, borderRadius: radius.pill, backgroundColor: colors.light.primary }}>
            <ThemedText style={{ color: 'white', fontWeight: '700' }}>Meilensteine</ThemedText>
          </Pressable>
        </View>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 10 }}>
          {last7.map((d) => (
            <View key={d.iso} style={{ alignItems: 'center', flex: 1 }}>
              <ThemedText muted style={{ marginBottom: 6 }}>{d.label}</ThemedText>
              <View style={{ height: 18, width: 28, borderRadius: 6, backgroundColor: d.done ? colors.light.success : colors.light.border }} />
            </View>
          ))}
        </View>
        <ThemedText muted style={{ marginTop: 8 }}>{`Streak: ${currentStreak} Tag(e)`}</ThemedText>
      </Card>

      <Card>
        <ThemedText kind="h2">Daily Check-in</ThemedText>
        <MultiStepDailyCheckin onSubmit={handleSubmit} />
      </Card>

      <View style={{ gap: spacing.m as any }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <ThemedText kind="h2">Tagebuch</ThemedText>
          <Pressable onPress={() => setOpen(true)} accessibilityRole="button" style={{ paddingVertical: 6, paddingHorizontal: 12, borderRadius: radius.pill, backgroundColor: colors.light.primary }}>
            <ThemedText style={{ color: 'white', fontWeight: '700' }}>+ Eintrag</ThemedText>
          </Pressable>
        </View>
        {diary.length === 0 ? (
          <ThemedText muted>Noch keine Einträge</ThemedText>
        ) : (
          diary.map((item) => (
            <Card key={item.id}>
              <ThemedText kind="h2">{new Date(item.date).toLocaleString()}</ThemedText>
              <ThemedText>{`Menge: ${item.amount}`}</ThemedText>
              {item.craving != null ? (
                <ThemedText muted>{`Craving: ${item.craving}`}</ThemedText>
              ) : null}
              {item.note ? <ThemedText muted>{`Notiz: ${item.note}`}</ThemedText> : null}
              <Pressable onPress={() => removeEntry(item.id)} style={{ marginTop: 8 }}>
                <ThemedText style={{ color: colors.light.danger, fontWeight: '700' }}>Löschen</ThemedText>
              </Pressable>
            </Card>
          ))
        )}
      </View>

      {/* Quick Entry Modal */}
      <Modal visible={open} transparent animationType="slide" onRequestClose={() => setOpen(false)}>
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.15)', justifyContent: 'center' }}>
          <View style={{ margin: 20, padding: spacing.l, borderRadius: radius.l, backgroundColor: 'white' }}>
            <ThemedText kind="h2">Neuer Tagebuch‑Eintrag</ThemedText>
            <ThemedText muted style={{ marginTop: 6 }}>Menge</ThemedText>
            <TextInput
              value={amount}
              onChangeText={setAmount}
              keyboardType="decimal-pad"
              style={{ borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 8, padding: 10, marginBottom: 8 }}
            />
            <ThemedText muted>Notiz</ThemedText>
            <TextInput
              value={note}
              onChangeText={setNote}
              placeholder="optional"
              style={{ borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 8, padding: 10, marginBottom: 12 }}
            />
            <View style={{ flexDirection: 'row', gap: 12, justifyContent: 'flex-end' }}>
              <Pressable onPress={() => setOpen(false)} style={{ paddingVertical: 10, paddingHorizontal: 14 }}>
                <ThemedText style={{ color: '#374151', fontWeight: '600' }}>Abbrechen</ThemedText>
              </Pressable>
              <Pressable onPress={saveQuickEntry} style={{ paddingVertical: 10, paddingHorizontal: 14, backgroundColor: colors.light.primary, borderRadius: radius.pill }}>
                <ThemedText style={{ color: 'white', fontWeight: '700' }}>Speichern</ThemedText>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

