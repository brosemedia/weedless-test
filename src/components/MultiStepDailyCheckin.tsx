import React, { useMemo, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import Slider from '@react-native-community/slider';

export type DailyUseEvent = {
  type: 'use';
  amountGrams?: number;
  form?: 'Joint' | 'Vape' | 'Bong' | 'Edible' | 'Andere';
  time?: string; // HH:MM
  craving0to10?: number;
  notes?: string;
};

export type DailyPauseEvent = {
  type: 'pause';
  time?: string; // HH:MM
  schlafstoerung?: number;
  reizbarkeit?: number;
  unruhe?: number;
  appetit?: number;
  schwitzen?: number;
  craving0to10?: number;
  notes?: string;
};

export type DailyCheckinData = {
  dateISO: string;
  usedToday: boolean;
  amountGrams: number;
  cravings0to10: number;
  mood1to5: number;
  sleepHours: number;
  notes?: string;
  uses?: DailyUseEvent[];
  pauses?: DailyPauseEvent[];
};

export type Props = {
  initial?: Partial<DailyCheckinData>; // optional
  onSubmit?: (checkin: DailyCheckinData) => void;
  onCancel?: () => void;
  style?: any;
};

type StepKey =
  | 'mode'
  | 'amount'
  | 'form'
  | 'time'
  | 'craving'
  | 'sleep'
  | 'sym_schlaf'
  | 'sym_reiz'
  | 'sym_unruhe'
  | 'sym_appetit'
  | 'sym_schwitz'
  | 'notes'
  | 'review';

export default function MultiStepDailyCheckin({ initial, onSubmit, onCancel, style }: Props): JSX.Element {
  const nowISO = useMemo(() => new Date().toISOString(), []);
  const [started, setStarted] = useState(false);
  const [usedToday, setUsedToday] = useState<boolean>(initial?.usedToday ?? false);
  const [amountGrams, setAmountGrams] = useState<string>((initial?.amountGrams ?? 0).toString());
  const [form, setForm] = useState<DailyUseEvent['form']>(undefined);
  const [time, setTime] = useState<string>('');
  const [cravings, setCravings] = useState<string>((initial?.cravings0to10 ?? 0).toString());
  const [sleep, setSleep] = useState<string>((initial?.sleepHours ?? 7).toString());
  const [notes, setNotes] = useState<string>(initial?.notes ?? '');
  // Pause Symptome
  const [symSchlaf, setSymSchlaf] = useState<string>('0');
  const [symReiz, setSymReiz] = useState<string>('0');
  const [symUnruhe, setSymUnruhe] = useState<string>('0');
  const [symAppetit, setSymAppetit] = useState<string>('0');
  const [symSchwitz, setSymSchwitz] = useState<string>('0');

  const steps: StepKey[] = useMemo(
    () =>
      usedToday
        ? ['mode', 'amount', 'form', 'time', 'craving', 'sleep', 'notes', 'review']
        : ['mode', 'craving', 'sleep', 'sym_schlaf', 'sym_reiz', 'sym_unruhe', 'sym_appetit', 'sym_schwitz', 'notes', 'review'],
    [usedToday]
  );
  const [stepIdx, setStepIdx] = useState(0);

  const titles: Record<StepKey, { emoji: string; title: string }> = {
    mode: { emoji: usedToday ? '🌿' : '⏸️', title: 'Wie war dein Tag?' },
    amount: { emoji: '⚖️', title: 'Menge in Gramm' },
    form: { emoji: '🍃', title: 'Form des Konsums' },
    time: { emoji: '🕒', title: 'Uhrzeit (HH:MM)' },
    craving: { emoji: '🔥', title: 'Craving (0–10)' },
    sleep: { emoji: '😴', title: 'Schlaf (h)' },
    sym_schlaf: { emoji: '🛌', title: 'Schlafstörung (0–10)' },
    sym_reiz: { emoji: '😡', title: 'Reizbarkeit (0–10)' },
    sym_unruhe: { emoji: '🌀', title: 'Unruhe (0–10)' },
    sym_appetit: { emoji: '🍽️', title: 'Appetitminderung (0–10)' },
    sym_schwitz: { emoji: '💧', title: 'Schwitzen/Unbehagen (0–10)' },
    notes: { emoji: '📝', title: 'Notizen (optional)' },
    review: { emoji: '✅', title: 'Übersicht' },
  };

  // Stable 0-10 slider using @react-native-community/slider
  function NumberSlider({ value, set, min = 0, max = 10 }: { value: number; set: (v: string) => void; min?: number; max?: number }) {
    const [live, setLive] = useState(() => Math.max(min, Math.min(max, Math.round(value ?? 0))));
    React.useEffect(() => {
      setLive(Math.max(min, Math.min(max, Math.round(value ?? 0))));
    }, [value, min, max]);
    return (
      <View>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 }}>
          <Text style={styles.label}>{min}</Text>
          <Text style={[styles.label, { fontWeight: '700' }]}>{live}</Text>
          <Text style={styles.label}>{max}</Text>
        </View>
        <Slider
          value={live}
          step={1}
          minimumValue={min}
          maximumValue={max}
          minimumTrackTintColor="#16A34A"
          maximumTrackTintColor="rgba(15,23,42,0.15)"
          thumbTintColor="#16A34A"
          onValueChange={(v: number) => setLive(Math.round(v))}
          onSlidingComplete={(v: number) => set(String(Math.round(v)))}
        />
      </View>
    );
  }

  // Float slider (e.g., sleep hours)
  function FloatSlider({ value, set, min = 0, max = 24, step = 0.5, decimals = 1 }: { value: number; set: (v: string) => void; min?: number; max?: number; step?: number; decimals?: number }) {
    const [live, setLive] = useState(() => Math.max(min, Math.min(max, Number.isFinite(value) ? value : min)));
    React.useEffect(() => {
      setLive(Math.max(min, Math.min(max, Number.isFinite(value) ? value : min)));
    }, [value, min, max]);
    const fmt = (n: number) => n.toFixed(decimals);
    return (
      <View>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 }}>
          <Text style={styles.label}>{fmt(min)}</Text>
          <Text style={[styles.label, { fontWeight: '700' }]}>{fmt(live)}</Text>
          <Text style={styles.label}>{fmt(max)}</Text>
        </View>
        <Slider
          value={live}
          step={step}
          minimumValue={min}
          maximumValue={max}
          minimumTrackTintColor="#16A34A"
          maximumTrackTintColor="rgba(15,23,42,0.15)"
          thumbTintColor="#16A34A"
          onValueChange={(v: number) => setLive(v)}
          onSlidingComplete={(v: number) => set(fmt(v))}
        />
      </View>
    );
  }

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

  function stepError(k: StepKey): string | undefined {
    if (k === 'amount') return errors.amountGrams;
    if (k === 'time') return errors.time;
    if (k === 'craving') return errors.cravings;
    if (k === 'sleep') return errors.sleep;
    if (k === 'sym_schlaf') return errors.symSchlaf;
    if (k === 'sym_reiz') return errors.symReiz;
    if (k === 'sym_unruhe') return errors.symUnruhe;
    if (k === 'sym_appetit') return errors.symAppetit;
    if (k === 'sym_schwitz') return errors.symSchwitz;
    return undefined;
  }

  function canProceed(k: StepKey): boolean {
    return !stepError(k);
  }

  function next() {
    const k = steps[stepIdx];
    if (!canProceed(k)) return;
    if (stepIdx < steps.length - 1) setStepIdx(stepIdx + 1);
  }
  function back() {
    if (stepIdx > 0) setStepIdx(stepIdx - 1);
  }

  function renderStep(k: StepKey): JSX.Element {
    switch (k) {
      case 'mode':
        return (
          <View style={{ gap: 12 }}>
            <View style={{ flexDirection: 'row', gap: 8 }}>
              <TouchableOpacity
                onPress={() => {
                  setUsedToday(true);
                  setStepIdx(stepIdx + 1);
                }}
                style={[styles.modeBtn, usedToday && styles.modeBtnActive]}
                accessibilityRole="button"
              >
                <Text style={[styles.modeBtnLabel, usedToday && styles.modeBtnLabelActive]}>Heute konsumiert</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => {
                  setUsedToday(false);
                  setStepIdx(stepIdx + 1);
                }}
                style={[styles.modeBtn, !usedToday && styles.modeBtnActive]}
                accessibilityRole="button"
              >
                <Text style={[styles.modeBtnLabel, !usedToday && styles.modeBtnLabelActive]}>Pausentag</Text>
              </TouchableOpacity>
            </View>
          </View>
        );
      case 'amount':
        return (
          <View style={styles.inputBlock}>
            <Text style={styles.label}>Menge in Gramm (bis Milligramm)</Text>
            <TextInput
              keyboardType={Platform.select({ ios: 'decimal-pad', android: 'numeric' })}
              value={amountGrams}
              onChangeText={(t) => setAmountGrams(t.replace(',', '.'))}
              placeholder="0.000"
              style={styles.input}
            />
            {errors.amountGrams ? <Text style={styles.error}>{errors.amountGrams}</Text> : null}
          </View>
        );
      case 'form':
        return (
          <View style={styles.inputBlock}>
            <Text style={styles.label}>Form</Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
              {(['Joint', 'Vape', 'Bong', 'Edible', 'Andere'] as const).map((f) => (
                <TouchableOpacity key={f} onPress={() => setForm(f)} style={[styles.chip, form === f && styles.chipActive]} accessibilityRole="button">
                  <Text style={[styles.chipLabel, form === f && styles.chipLabelActive]}>{f}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        );
      case 'time':
        return (
          <View style={styles.inputBlock}>
            <Text style={styles.label}>Uhrzeit (HH:MM)</Text>
            <TextInput
              keyboardType={Platform.select({ ios: 'numbers-and-punctuation', android: 'numeric' })}
              value={time}
              onChangeText={setTime}
              placeholder="HH:MM"
              style={styles.input}
              maxLength={5}
            />
            {errors.time ? <Text style={styles.error}>{errors.time}</Text> : null}
          </View>
        );
      case 'craving':
        return (
          <View style={styles.inputBlock}>
            <Text style={styles.label}>Craving (0-10)</Text>
            <NumberSlider value={Number(cravings || '0') || 0} set={setCravings} min={0} max={10} />
          </View>
        );
      case 'sleep':
        return (
          <View style={styles.inputBlock}>
            <Text style={styles.label}>Schlaf (h)</Text>
            <FloatSlider value={Number(sleep || '0') || 0} set={setSleep} min={0} max={24} step={0.5} decimals={1} />
            {errors.sleep ? <Text style={styles.error}>{errors.sleep}</Text> : null}
          </View>
        );
      case 'sym_schlaf':
        return (
          <View style={styles.inputBlock}>
            <Text style={styles.label}>Schlafstörung (0-10)</Text>
            <NumberSlider value={Number(symSchlaf || '0') || 0} set={setSymSchlaf} min={0} max={10} />
          </View>
        );
      case 'sym_reiz':
        return (
          <View style={styles.inputBlock}>
            <Text style={styles.label}>Reizbarkeit (0-10)</Text>
            <NumberSlider value={Number(symReiz || '0') || 0} set={setSymReiz} min={0} max={10} />
          </View>
        );
      case 'sym_unruhe':
        return (
          <View style={styles.inputBlock}>
            <Text style={styles.label}>Unruhe (0-10)</Text>
            <NumberSlider value={Number(symUnruhe || '0') || 0} set={setSymUnruhe} min={0} max={10} />
          </View>
        );
      case 'sym_appetit':
        return (
          <View style={styles.inputBlock}>
            <Text style={styles.label}>Appetitminderung (0-10)</Text>
            <NumberSlider value={Number(symAppetit || '0') || 0} set={setSymAppetit} min={0} max={10} />
          </View>
        );
      case 'sym_schwitz':
        return (
          <View style={styles.inputBlock}>
            <Text style={styles.label}>Schwitzen/Unbehagen (0-10)</Text>
            <NumberSlider value={Number(symSchwitz || '0') || 0} set={setSymSchwitz} min={0} max={10} />
          </View>
        );
      case 'notes':
        return (
          <View style={styles.inputBlock}>
            <Text style={styles.label}>Notizen (optional)</Text>
            <TextInput value={notes} onChangeText={setNotes} placeholder="Wie ging es dir heute?" style={[styles.input, styles.multiline]} multiline />
          </View>
        );
      case 'review':
        return (
          <View style={styles.preview}>
            <Text style={styles.previewTitle}>Zusammenfassung</Text>
            <Text style={styles.previewText}>{usedToday ? 'Modus: Konsumiert' : 'Modus: Pausentag'}</Text>
            {usedToday ? (
              <>
                <Text style={styles.previewText}>{`Menge: ${(Number(amountGrams) || 0).toFixed(3)} g`}</Text>
                <Text style={styles.previewText}>{`Form: ${form || 'n/a'}`}</Text>
                <Text style={styles.previewText}>{`Zeit: ${time || 'n/a'}`}</Text>
              </>
            ) : (
              <>
                <Text style={styles.previewText}>{`Schlafstörung: ${symSchlaf}`}</Text>
                <Text style={styles.previewText}>{`Reizbarkeit: ${symReiz}`}</Text>
                <Text style={styles.previewText}>{`Unruhe: ${symUnruhe}`}</Text>
                <Text style={styles.previewText}>{`Appetitminderung: ${symAppetit}`}</Text>
                <Text style={styles.previewText}>{`Schwitzen/Unbehagen: ${symSchwitz}`}</Text>
              </>
            )}
            <Text style={styles.previewText}>{`Craving: ${cravings}`}</Text>
            <Text style={styles.previewText}>{`Schlaf (h): ${sleep}`}</Text>
            {notes ? <Text style={styles.previewText}>{`Notiz: ${notes}`}</Text> : null}
          </View>
        );
    }
  }

  const current = steps[stepIdx];
  const total = steps.length;
  const { emoji, title } = titles[current];
  const percent = Math.max(0, Math.min(1, (stepIdx + 1) / total));

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
      <View style={styles.progressBarTrack}>
        <View style={[styles.progressBarFill, { width: `${percent * 100}%` }]} />
      </View>
      <Text style={styles.progress}>{`Schritt ${stepIdx + 1} / ${total}`}</Text>
      <Text style={styles.stepEmoji}>{emoji}</Text>
      <Text style={styles.h1}>{title}</Text>

      {renderStep(current)}

      <View style={{ flexDirection: 'row', gap: 8, marginTop: 12 }}>
        {onCancel ? (
          <TouchableOpacity style={[styles.buttonGhost, { flex: 1 }]} onPress={onCancel} accessibilityRole="button">
            <Text style={styles.buttonGhostLabel}>Abbrechen</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity style={[styles.buttonGhost, { flex: 1 }]} onPress={back} accessibilityRole="button" disabled={stepIdx === 0}>
            <Text style={styles.buttonGhostLabel}>Zurück</Text>
          </TouchableOpacity>
        )}
        {current === 'review' ? (
          <TouchableOpacity
            style={[styles.button, { flex: 2 }]}
            onPress={() => onSubmit?.(data)}
            accessibilityRole="button"
          >
            <Text style={styles.buttonLabel}>Check-in speichern</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity style={[styles.button, { flex: 2 }]} onPress={next} accessibilityRole="button">
            <Text style={styles.buttonLabel}>Weiter</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { padding: 16, gap: 12 },
  h1: { fontSize: 20, fontWeight: '700', color: '#0F172A', marginBottom: 4 },
  progress: { color: '#64748B', fontSize: 12 },
  stepEmoji: { fontSize: 32, marginTop: 4 },
  progressBarTrack: { height: 8, borderRadius: 999, backgroundColor: 'rgba(15,23,42,0.12)' },
  progressBarFill: { height: 8, borderRadius: 999, backgroundColor: '#86EFAC' },
  inputBlock: { gap: 6 },
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
  sliderTrack: { },
  sliderFill: { },
  sliderThumb: { },
});
