import React, { useMemo, useState } from 'react';
import { View, Text, TextInput, Switch, TouchableOpacity, StyleSheet, Platform } from 'react-native';

// Types
export type DailyUseEvent = {
  type: 'use';
  amountGrams?: number; // >= 0
  form?: 'Joint' | 'Vape' | 'Bong' | 'Edible' | 'Andere';
  time?: string; // "HH:MM"
  craving0to10?: number; // 0..10
  notes?: string;
};

export type DailyPauseEvent = {
  type: 'pause';
  symptoms?: string; // Freitext (z. B. Entzugssymptome)
  time?: string; // "HH:MM"
  // Entzugs-/Begleit-Symptome 0..10
  schlafstoerung?: number;
  reizbarkeit?: number;
  unruhe?: number;
  appetit?: number;
  schwitzen?: number;
  craving0to10?: number; // 0..10
  notes?: string;
};

export type DailyCheckinData = {
  dateISO: string;
  usedToday: boolean;
  amountGrams: number; // Gramm konsumiert heute
  cravings0to10: number; // Verlangen 0–10
  mood1to5: number; // Stimmung 1–5
  sleepHours: number; // Schlafstunden der letzten Nacht
  notes?: string;
  uses?: DailyUseEvent[]; // optionale Liste einzelner Konsumereignisse
  pauses?: DailyPauseEvent[]; // optionale Liste von Pausen/Entzugsnotizen
};

export type DashboardStats = {
  startedAtISO: string;
  totalDays: number;
  totalCheckins: number;
  totalAbstinentDays: number;
  consecutiveAbstinentDays: number;
  totalGramsUsed: number;
  totalGramsAvoided: number;
  totalSavingsEUR: number;
  lastCheckinDateISO?: string;
  lastUseAtISO?: string;
  smokeFreeSeconds?: number;
  moneySavedEUR?: number;
  cravingPct?: number; // 0..100 (höher = besser)
  withdrawalPct?: number; // 0..100 (höher = besser)
  sleepPct?: number; // 0..100 (höher = besser)
};

export type DashboardPatch = Partial<DashboardStats>;

type ComputeOpts = {
  pricePerGramEUR?: number;
  baselineDailyUseGrams?: number;
  now?: Date;
};

// Pure Helper: Berechnet Patch/Stats ohne Seiteneffekte
export function computeDashboardStats(
  input: DailyCheckinData,
  prev: DashboardStats,
  opts?: ComputeOpts
): DashboardPatch {
  // Defaults: 10 €/g, 0.5 g/Tag als Baseline
  const price = Math.max(0, opts?.pricePerGramEUR ?? 10);
  const baseline = Math.max(0, opts?.baselineDailyUseGrams ?? 0.5);
  const now = opts?.now ?? new Date();

  const mode: 'use' | 'pause' = input.usedToday ? 'use' : 'pause';
  const patch: DashboardPatch = {};

  // cravingPct (0..100, höher = besser)
  const cravingVal = (input.cravings0to10 as any) ?? (Array.isArray(input.uses) && input.uses[0]?.craving0to10) ?? (Array.isArray(input.pauses) && input.pauses[0]?.craving0to10) ?? 0;
  patch.cravingPct = Math.max(0, Math.min(100, 100 - (Number(cravingVal) || 0) * 10));

  if (mode === 'use') {
    const t = Array.isArray(input.uses) ? input.uses[0]?.time : undefined;
    if (t && /^\d{2}:\d{2}$/.test(t)) {
      const d = new Date(input.dateISO);
      const [hh, mm] = t.split(':').map((n) => parseInt(n, 10));
      d.setHours(hh, mm, 0, 0);
      patch.lastUseAtISO = d.toISOString();
    } else {
      patch.lastUseAtISO = now.toISOString();
    }
    patch.smokeFreeSeconds = 0;
    // withdrawal/sleep beibehalten
    patch.withdrawalPct = prev.withdrawalPct ?? 100;
    patch.sleepPct = prev.sleepPct ?? 100;
    patch.moneySavedEUR = prev.moneySavedEUR ?? 0;
  } else {
    // pause
    patch.lastUseAtISO = prev.lastUseAtISO;
    const lastUse = prev.lastUseAtISO ? new Date(prev.lastUseAtISO) : now;
    patch.smokeFreeSeconds = Math.max(0, Math.floor((+now - +lastUse) / 1000));
    // money saved heuristisch
    if (baseline > 0 && price > 0) {
      const inc = (baseline * price) * ((patch.smokeFreeSeconds ?? 0) / 86400);
      patch.moneySavedEUR = Number(((prev.moneySavedEUR ?? 0) + inc).toFixed(2));
    } else {
      patch.moneySavedEUR = prev.moneySavedEUR ?? 0;
    }
    // withdrawal: Mittelwert gesetzter Symptome 0..10
    const p = Array.isArray(input.pauses) ? input.pauses[0] : undefined;
    if (p) {
      const arr = [p.schlafstoerung, p.reizbarkeit, p.unruhe, p.appetit, p.schwitzen].filter((v): v is number => typeof v === 'number');
      if (arr.length) {
        const avg = arr.reduce((a, b) => a + b, 0) / arr.length;
        patch.withdrawalPct = Math.max(0, Math.min(100, 100 - avg * 10));
      }
      if (typeof p.schlafstoerung === 'number') {
        patch.sleepPct = Math.max(0, Math.min(100, 100 - p.schlafstoerung * 10));
      }
    } else {
      patch.withdrawalPct = prev.withdrawalPct ?? 100;
      patch.sleepPct = prev.sleepPct ?? 100;
    }
  }

  return patch;
}

// Props des Formulars
export type Props = {
  currentStats?: DashboardStats;
  initial?: Partial<DailyCheckinData>;
  options?: ComputeOpts;
  onSubmit?: (checkin: DailyCheckinData, stats: DashboardPatch) => void;
  onCancel?: () => void;
  style?: any;
};

export default function DailyCheckinForm({ currentStats, initial, options, onSubmit, onCancel, style }: Props): JSX.Element {
  const nowISO = useMemo(() => new Date().toISOString(), []);
  const [started, setStarted] = useState<boolean>(false);
  const [usedToday, setUsedToday] = useState<boolean>(initial?.usedToday ?? false);
  const [amountGrams, setAmountGrams] = useState<string>((initial?.amountGrams ?? 0).toString());
  const [form, setForm] = useState<DailyUseEvent['form']>(undefined);
  const [time, setTime] = useState<string>("");
  const [cravings, setCravings] = useState<string>((initial?.cravings0to10 ?? 0).toString());
  // Pause-Symptome
  const [symSchlaf, setSymSchlaf] = useState<string>('0');
  const [symReiz, setSymReiz] = useState<string>('0');
  const [symUnruhe, setSymUnruhe] = useState<string>('0');
  const [symAppetit, setSymAppetit] = useState<string>('0');
  const [symSchwitz, setSymSchwitz] = useState<string>('0');
  const [sleep, setSleep] = useState<string>((initial?.sleepHours ?? 7).toString());
  const [notes, setNotes] = useState<string>(initial?.notes ?? '');

  // Basic validation for visible inputs
  const errors = useMemo(() => {
    const e: Record<string, string | undefined> = {};
    const toNum = (s: string) => (s?.trim().length ? Number(s) : NaN);
    const inRange = (v: number, min: number, max: number) => !Number.isNaN(v) && v >= min && v <= max;

    const cr = toNum(cravings);
    if (!inRange(cr, 0, 10)) e.cravings = 'Bitte Wert 0-10 eingeben';

    const sl = toNum(sleep);
    if (!Number.isFinite(sl) || sl < 0 || sl > 24) e.sleep = 'Bitte Stunden 0-24 eingeben';

    if (usedToday) {
      const ag = toNum(amountGrams);
      if (!Number.isFinite(ag) || ag < 0 || ag > 100) e.amountGrams = 'Bitte Menge 0-100g eingeben';
      if (time && !/^\d{2}:\d{2}$/.test(time)) e.time = 'Zeit als HH:MM eingeben';
    } else {
      const s1 = toNum(symSchlaf);
      const s2 = toNum(symReiz);
      const s3 = toNum(symUnruhe);
      const s4 = toNum(symAppetit);
      const s5 = toNum(symSchwitz);
      if (!inRange(s1, 0, 10)) e.symSchlaf = '0-10';
      if (!inRange(s2, 0, 10)) e.symReiz = '0-10';
      if (!inRange(s3, 0, 10)) e.symUnruhe = '0-10';
      if (!inRange(s4, 0, 10)) e.symAppetit = '0-10';
      if (!inRange(s5, 0, 10)) e.symSchwitz = '0-10';
    }
    return e;
  }, [usedToday, amountGrams, time, symSchlaf, symReiz, symUnruhe, symAppetit, symSchwitz, cravings, sleep]);

  const data: DailyCheckinData = {
    dateISO: initial?.dateISO ?? nowISO,
    usedToday,
    amountGrams: Number.isFinite(+amountGrams) ? Math.max(0, +amountGrams) : 0,
    cravings0to10: Math.max(0, Math.min(10, Number.isFinite(+cravings) ? +cravings : 0)),
    mood1to5: 3,
    sleepHours: Math.max(0, Number.isFinite(+sleep) ? +sleep : 0),
    notes: notes.trim() || undefined,
    uses: usedToday ? [{ type: 'use', amountGrams: Number.isFinite(+amountGrams) ? Math.max(0, +amountGrams) : 0, form, time: time || undefined }] : undefined,
    pauses: !usedToday ? [{ type: 'pause', schlafstoerung: +symSchlaf || 0, reizbarkeit: +symReiz || 0, unruhe: +symUnruhe || 0, appetit: +symAppetit || 0, schwitzen: +symSchwitz || 0, craving0to10: +cravings || 0 }] : undefined,
  };

  const prev: DashboardStats = currentStats ?? {
    startedAtISO: nowISO,
    totalDays: 0,
    totalCheckins: 0,
    totalAbstinentDays: 0,
    consecutiveAbstinentDays: 0,
    totalGramsUsed: 0,
    totalGramsAvoided: 0,
    totalSavingsEUR: 0,
    lastCheckinDateISO: undefined,
    lastUseAtISO: undefined,
    smokeFreeSeconds: 0,
    moneySavedEUR: 0,
    cravingPct: 100,
    withdrawalPct: 100,
    sleepPct: 100,
  };

  const patch = useMemo(() => computeDashboardStats(data, prev, options), [JSON.stringify(data), JSON.stringify(prev), JSON.stringify(options)]);

  function submit() {
    if (Object.keys(errors).length) return;
    onSubmit?.(data, patch);
  }

  if (!started) {
    return (
      <View style={[styles.wrap, style]}>
        <TouchableOpacity style={[styles.button, { paddingVertical: 16 }]} onPress={() => setStarted(true)} accessibilityRole="button">
          <Text style={styles.buttonLabel}>Daily Check beginnen</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={[styles.wrap, style]}>
      <Text style={styles.h1}>Täglicher Check-in</Text>

      {/* Modus-Umschalter */}
      <View style={{ flexDirection: 'row', gap: 8 }}>
        <TouchableOpacity
          onPress={() => setUsedToday(true)}
          style={[styles.modeBtn, usedToday && styles.modeBtnActive]}
          accessibilityRole="button"
        >
          <Text style={[styles.modeBtnLabel, usedToday && styles.modeBtnLabelActive]}>Heute konsumiert</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => setUsedToday(false)}
          style={[styles.modeBtn, !usedToday && styles.modeBtnActive]}
          accessibilityRole="button"
        >
          <Text style={[styles.modeBtnLabel, !usedToday && styles.modeBtnLabelActive]}>Pausentag</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.rowBetween}>
        <Text style={styles.label}>Heute konsumiert?</Text>
        <Switch value={usedToday} onValueChange={setUsedToday} />
      </View>

      {usedToday ? (
        <View style={styles.inputBlock}>
          <Text style={styles.label}>Menge in Gramm</Text>
          <TextInput
            keyboardType={Platform.select({ ios: 'decimal-pad', android: 'numeric' })}
            value={amountGrams}
            onChangeText={setAmountGrams}
            placeholder="0.0"
            style={styles.input}
          />
          <Text style={[styles.label, { marginTop: 8 }]}>Form</Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
            {(['Joint', 'Vape', 'Bong', 'Edible', 'Andere'] as const).map((f) => (
              <TouchableOpacity key={f} onPress={() => setForm(f)} style={[styles.chip, form === f && styles.chipActive]} accessibilityRole="button">
                <Text style={[styles.chipLabel, form === f && styles.chipLabelActive]}>{f}</Text>
              </TouchableOpacity>
            ))}
          </View>
          <Text style={[styles.label, { marginTop: 8 }]}>Uhrzeit (HH:MM)</Text>
          <TextInput
            keyboardType={Platform.select({ ios: 'numbers-and-punctuation', android: 'numeric' })}
            value={time}
            onChangeText={setTime}
            placeholder="HH:MM"
            style={styles.input}
            maxLength={5}
          />
          {errors.time ? <Text style={styles.error}>{errors.time}</Text> : null}
          {errors.amountGrams ? <Text style={styles.error}>{errors.amountGrams}</Text> : null}
        </View>
      ) : null}

      {/* Gemeinsame Felder */}
      <View style={styles.rowInputs}>
        <View style={styles.inputCol}>
          <Text style={styles.label}>Craving (0-10)</Text>
          <TextInput accessibilityLabel="Craving" keyboardType={Platform.select({ ios: 'number-pad', android: 'numeric' })} value={cravings} onChangeText={setCravings} placeholder="0" style={styles.input} maxLength={2} />
          {errors.cravings ? <Text style={styles.error}>{errors.cravings}</Text> : null}
        </View>
        <View style={styles.inputCol}>
          <Text style={styles.label}>Schlaf (h)</Text>
          <TextInput accessibilityLabel="Schlafstunden" keyboardType={Platform.select({ ios: 'decimal-pad', android: 'numeric' })} value={sleep} onChangeText={setSleep} placeholder="7" style={styles.input} maxLength={4} />
          {errors.sleep ? <Text style={styles.error}>{errors.sleep}</Text> : null}
        </View>
      </View>

      {/* Pause-spezifisch: Symptomfelder */}
      {!usedToday ? (
        <View style={styles.rowInputs}>
          <View style={styles.inputCol}>
            <Text style={styles.label}>Schlafstörung (0–10)</Text>
            <TextInput accessibilityLabel="Schlafstörung" keyboardType={Platform.select({ ios: 'number-pad', android: 'numeric' })} value={symSchlaf} onChangeText={setSymSchlaf} placeholder="0" style={styles.input} maxLength={2} />
            {errors.symSchlaf ? <Text style={styles.error}>{errors.symSchlaf}</Text> : null}
          </View>
          <View style={styles.inputCol}>
            <Text style={styles.label}>Reizbarkeit (0–10)</Text>
            <TextInput accessibilityLabel="Reizbarkeit" keyboardType={Platform.select({ ios: 'number-pad', android: 'numeric' })} value={symReiz} onChangeText={setSymReiz} placeholder="0" style={styles.input} maxLength={2} />
            {errors.symReiz ? <Text style={styles.error}>{errors.symReiz}</Text> : null}
          </View>
        </View>
      ) : null}
      {!usedToday ? (
        <View style={styles.rowInputs}>
          <View style={styles.inputCol}>
            <Text style={styles.label}>Unruhe (0–10)</Text>
            <TextInput accessibilityLabel="Unruhe" keyboardType={Platform.select({ ios: 'number-pad', android: 'numeric' })} value={symUnruhe} onChangeText={setSymUnruhe} placeholder="0" style={styles.input} maxLength={2} />
            {errors.symUnruhe ? <Text style={styles.error}>{errors.symUnruhe}</Text> : null}
          </View>
          <View style={styles.inputCol}>
            <Text style={styles.label}>Appetitminderung (0–10)</Text>
            <TextInput accessibilityLabel="Appetitminderung" keyboardType={Platform.select({ ios: 'number-pad', android: 'numeric' })} value={symAppetit} onChangeText={setSymAppetit} placeholder="0" style={styles.input} maxLength={2} />
            {errors.symAppetit ? <Text style={styles.error}>{errors.symAppetit}</Text> : null}
          </View>
          <View style={styles.inputCol}>
            <Text style={styles.label}>Schwitzen/Unbehagen (0–10)</Text>
            <TextInput accessibilityLabel="Schwitzen/Unbehagen" keyboardType={Platform.select({ ios: 'number-pad', android: 'numeric' })} value={symSchwitz} onChangeText={setSymSchwitz} placeholder="0" style={styles.input} maxLength={2} />
            {errors.symSchwitz ? <Text style={styles.error}>{errors.symSchwitz}</Text> : null}
          </View>
        </View>
      ) : null}

      <View style={styles.inputBlock}>
        <Text style={styles.label}>Notizen (optional)</Text>
        <TextInput
          value={notes}
          onChangeText={setNotes}
          placeholder="Wie ging es dir heute?"
          style={[styles.input, styles.multiline]}
          multiline
        />
      </View>

      <View style={{ flexDirection: 'row', gap: 8 }}>
        <TouchableOpacity style={[styles.button, { flex: 1 }]} onPress={submit} accessibilityRole="button">
          <Text style={styles.buttonLabel}>Check-in speichern</Text>
        </TouchableOpacity>
        {onCancel ? (
          <TouchableOpacity style={[styles.buttonGhost, { flex: 1 }]} onPress={onCancel} accessibilityRole="button">
            <Text style={styles.buttonGhostLabel}>Abbrechen</Text>
          </TouchableOpacity>
        ) : null}
      </View>
    </View>
  );
}

// Styles - schlank und neutral
const styles = StyleSheet.create({
  wrap: { padding: 16, gap: 12 },
  h1: { fontSize: 20, fontWeight: '700', color: '#0F172A', marginBottom: 4 },
  rowBetween: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  inputBlock: { gap: 6 },
  rowInputs: { flexDirection: 'row', gap: 8 },
  inputCol: { flex: 1 },
  label: { color: '#334155', fontSize: 14 },
  input: {
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#CBD5E1',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: Platform.select({ ios: 10, android: 8 }),
    color: '#0F172A',
    backgroundColor: 'rgba(255,255,255,0.85)',
  },
  multiline: { minHeight: 72, textAlignVertical: 'top' },
  preview: { padding: 12, borderRadius: 10, backgroundColor: 'rgba(15,23,42,0.04)', gap: 4 },
  previewTitle: { color: '#0F172A', fontWeight: '700' },
  previewText: { color: '#334155', fontSize: 13 },
  error: { color: '#DC2626', fontSize: 12, marginTop: 4 },
  button: { marginTop: 8, backgroundColor: '#166534', paddingVertical: 12, borderRadius: 10, alignItems: 'center' },
  buttonLabel: { color: 'white', fontWeight: '700' },
  buttonGhost: { marginTop: 8, backgroundColor: 'rgba(15,23,42,0.06)', paddingVertical: 12, borderRadius: 10, alignItems: 'center', borderWidth: StyleSheet.hairlineWidth, borderColor: '#94A3B8' },
  buttonGhostLabel: { color: '#0F172A', fontWeight: '700' },
  modeBtn: { flex: 1, borderRadius: 8, paddingVertical: 10, alignItems: 'center', borderWidth: StyleSheet.hairlineWidth, borderColor: '#CBD5E1', backgroundColor: 'rgba(255,255,255,0.7)' },
  modeBtnActive: { backgroundColor: '#FDE68A', borderColor: '#F59E0B' },
  modeBtnLabel: { color: '#334155', fontWeight: '600' },
  modeBtnLabelActive: { color: '#1F2937' },
  chip: { borderRadius: 999, paddingHorizontal: 12, paddingVertical: 6, borderWidth: StyleSheet.hairlineWidth, borderColor: '#CBD5E1', backgroundColor: 'rgba(255,255,255,0.7)' },
  chipActive: { backgroundColor: '#DCFCE7', borderColor: '#22C55E' },
  chipLabel: { color: '#334155' },
  chipLabelActive: { color: '#065F46', fontWeight: '700' },
});

/*
Beispiel-Einbindung

import DailyCheckinForm, { computeDashboardStats, type DailyCheckinData, type DashboardStats, type DashboardPatch } from './src/components/DailyCheckinForm';

function Screen() {
  const [stats, setStats] = React.useState<DashboardStats>({
    startedAtISO: new Date().toISOString(),
    totalDays: 0,
    totalCheckins: 0,
    totalAbstinentDays: 0,
    consecutiveAbstinentDays: 0,
    totalGramsUsed: 0,
    totalGramsAvoided: 0,
    totalSavingsEUR: 0,
    lastCheckinDateISO: undefined,
    lastUseAtISO: undefined,
    smokeFreeSeconds: 0,
    moneySavedEUR: 0,
    cravingPct: 100,
    withdrawalPct: 100,
    sleepPct: 100,
  });

  return (
    <DailyCheckinForm
      currentStats={stats}
      options={{ pricePerGramEUR: 10, baselineDailyUseGrams: 0.5 }}
      onSubmit={(checkin: DailyCheckinData, patch: DashboardPatch) => {
        // 1) Check-in speichern
        // 2) Dashboard-State mit 'patch' patchen
        console.log('CHECKIN', checkin, patch);
        setStats((prev) => ({ ...prev, ...patch }));
      }}
      onCancel={() => {
        console.log('Abgebrochen');
      }}
    />
  );
}
*/
