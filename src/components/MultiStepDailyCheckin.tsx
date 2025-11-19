import React, { useMemo, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Platform, Modal, Pressable } from 'react-native';
import Slider from '@react-native-community/slider';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Ionicons } from '@expo/vector-icons';

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

export default function MultiStepDailyCheckin({ initial, onSubmit, onCancel, style }: Props): React.ReactElement {
  const nowISO = useMemo(() => new Date().toISOString(), []);
  const [modeChoice, setModeChoice] = useState<boolean | null>(
    typeof initial?.usedToday === 'boolean' ? initial.usedToday : null
  );
  const usedToday = modeChoice === true;
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
  const [timePickerVisible, setTimePickerVisible] = useState(false);
  const parsedTime = React.useMemo(() => {
    if (!/^\d{2}:\d{2}$/.test(time)) return new Date();
    const [hh, mm] = time.split(':').map((part) => parseInt(part, 10));
    const base = new Date();
    base.setHours(Math.min(23, Math.max(0, hh)), Math.min(59, Math.max(0, mm)), 0, 0);
    return base;
  }, [time]);
  const [timeDraft, setTimeDraft] = useState<Date>(parsedTime);
  React.useEffect(() => {
    if (timePickerVisible) {
      setTimeDraft(parsedTime);
    }
  }, [parsedTime, timePickerVisible]);

  const useDaySteps: StepKey[] = ['mode', 'amount', 'form', 'time', 'craving', 'sleep', 'notes', 'review'];
  const pauseDaySteps: StepKey[] = ['mode', 'craving', 'sleep', 'sym_schlaf', 'sym_reiz', 'sym_unruhe', 'sym_appetit', 'sym_schwitz', 'notes', 'review'];
  const steps: StepKey[] = useMemo(() => {
    if (modeChoice === true) {
      return useDaySteps;
    }
    if (modeChoice === false) {
      return pauseDaySteps;
    }
    return ['mode'];
  }, [modeChoice]);
  const [stepIdx, setStepIdx] = useState(0);
  React.useEffect(() => {
    setStepIdx((prev) => Math.min(prev, Math.max(steps.length - 1, 0)));
  }, [steps.length]);

  const titles: Record<StepKey, { emoji: string; title: string }> = {
    mode: { emoji: modeChoice === null ? '🤔' : usedToday ? '🌿' : '⏸️', title: 'Wie war dein Tag?' },
    amount: { emoji: '⚖️', title: 'Menge in Gramm' },
    form: { emoji: '🍃', title: 'Form des Konsums' },
    time: { emoji: '🕒', title: 'Uhrzeit wählen' },
    craving: { emoji: '🔥', title: 'Suchtdruck (0–10)' },
    sleep: { emoji: '😴', title: 'Schlaf (h)' },
    sym_schlaf: { emoji: '🛌', title: 'Schlafstörung (0–10)' },
    sym_reiz: { emoji: '😡', title: 'Reizbarkeit (0–10)' },
    sym_unruhe: { emoji: '🌀', title: 'Unruhe (0–10)' },
    sym_appetit: { emoji: '🍽️', title: 'Appetitminderung (0–10)' },
    sym_schwitz: { emoji: '💧', title: 'Schwitzen/Unbehagen (0–10)' },
    notes: { emoji: '📝', title: 'Notizen (optional)' },
    review: { emoji: '✅', title: 'Übersicht' },
  };

  const pad = (value: number) => String(value).padStart(2, '0');
  const formatTimeString = (date: Date) => `${pad(date.getHours())}:${pad(date.getMinutes())}`;

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
          maximumTrackTintColor="rgba(74,42,22,0.15)"
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
          maximumTrackTintColor="rgba(74,42,22,0.15)"
          thumbTintColor="#16A34A"
          onValueChange={(v: number) => setLive(v)}
          onSlidingComplete={(v: number) => set(fmt(v))}
        />
      </View>
    );
  }

  function GramSlider({ value, set, min = 0, max = 20, step = 0.1 }: { value: number; set: (v: string) => void; min?: number; max?: number; step?: number }) {
    const [live, setLive] = useState(() => Math.max(min, Math.min(max, Number.isFinite(value) ? value : min)));
    React.useEffect(() => {
      setLive(Math.max(min, Math.min(max, Number.isFinite(value) ? value : min)));
    }, [value, min, max]);
    const fmt = (n: number) => `${n.toFixed(2)} g`;
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
          maximumTrackTintColor="rgba(74,42,22,0.15)"
          thumbTintColor="#16A34A"
          onValueChange={(v: number) => setLive(Number(v.toFixed(2)))}
          onSlidingComplete={(v: number) => {
            const clamped = Math.max(min, Math.min(max, v));
            set(clamped.toFixed(2));
          }}
        />
      </View>
    );
  }

  const isUseDay = modeChoice === true;
  const isPauseDay = modeChoice === false;
  const errors = useMemo(() => {
    const e: Record<string, string | undefined> = {};
    const toNum = (s: string) => (s?.trim().length ? Number(s) : NaN);
    const inRange = (v: number, min: number, max: number) => !Number.isNaN(v) && v >= min && v <= max;
    const cr = toNum(cravings);
    if (!inRange(cr, 0, 10)) e.cravings = 'Bitte Wert 0-10 eingeben';
    const sl = toNum(sleep);
    if (!Number.isFinite(sl) || sl < 0 || sl > 24) e.sleep = 'Bitte Stunden 0-24 eingeben';
    if (isUseDay) {
      const ag = toNum(amountGrams);
      if (!Number.isFinite(ag) || ag < 0 || ag > 100) e.amountGrams = 'Bitte Menge 0-100g eingeben';
      if (time && !/^\d{2}:\d{2}$/.test(time)) e.time = 'Zeit als HH:MM eingeben';
    } else if (isPauseDay) {
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
  }, [isUseDay, isPauseDay, amountGrams, time, symSchlaf, symReiz, symUnruhe, symAppetit, symSchwitz, cravings, sleep]);

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
    if (k === 'mode') return modeChoice !== null;
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

  function renderStep(k: StepKey): React.ReactElement {
    switch (k) {
      case 'mode':
        return (
          <View style={{ gap: 12 }}>
            <Text style={styles.helper}>Option antippen und anschließend mit „Weiter“ bestätigen.</Text>
            <View style={{ flexDirection: 'row', gap: 8 }}>
              <TouchableOpacity
                onPress={() => setModeChoice(true)}
                style={[styles.modeBtn, modeChoice === true && styles.modeBtnActive]}
                accessibilityRole="button"
              >
                <Text style={[styles.modeBtnLabel, modeChoice === true && styles.modeBtnLabelActive]}>Heute konsumiert</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => setModeChoice(false)}
                style={[styles.modeBtn, modeChoice === false && styles.modeBtnActive]}
                accessibilityRole="button"
              >
                <Text style={[styles.modeBtnLabel, modeChoice === false && styles.modeBtnLabelActive]}>Pausentag</Text>
              </TouchableOpacity>
            </View>
          </View>
        );
      case 'amount':
        return (
          <View style={styles.inputBlock}>
            <Text style={styles.label}>Menge in Gramm</Text>
            <GramSlider value={Number(amountGrams || '0') || 0} set={setAmountGrams} min={0} max={20} step={0.1} />
            <Text style={styles.helper}>Schiebe den Regler für eine genaue Menge.</Text>
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
            <Text style={styles.label}>Uhrzeit</Text>
            <TouchableOpacity style={styles.pickerField} onPress={() => setTimePickerVisible(true)} accessibilityRole="button">
              <Text style={styles.pickerValue}>{time ? `${time} Uhr` : 'Zeit auswählen'}</Text>
              <Ionicons name="time-outline" size={18} color="#4A2A16" />
            </TouchableOpacity>
            {errors.time ? <Text style={styles.error}>{errors.time}</Text> : null}
            {timePickerVisible ? (
              <Modal transparent animationType="fade" visible onRequestClose={() => setTimePickerVisible(false)}>
                <View style={styles.timeModalBackdrop}>
                  <Pressable style={StyleSheet.absoluteFill} onPress={() => setTimePickerVisible(false)} />
                  <View style={styles.timeModalCard}>
                    <Text style={styles.timeModalTitle}>Uhrzeit wählen</Text>
                    <DateTimePicker
                      value={timeDraft}
                      mode="time"
                      display={Platform.OS === 'ios' ? 'spinner' : 'spinner'}
                      onChange={(_event, selected) => {
                        if (selected) {
                          setTimeDraft(selected);
                        }
                      }}
                    />
                    <View style={styles.timeModalActions}>
                      <TouchableOpacity style={styles.buttonGhost} onPress={() => setTimePickerVisible(false)}>
                        <Text style={styles.buttonGhostLabel}>Abbrechen</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[styles.button, { flex: 1 }]}
                        onPress={() => {
                          setTime(formatTimeString(timeDraft));
                          setTimePickerVisible(false);
                        }}
                      >
                        <Text style={styles.buttonLabel}>Übernehmen</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              </Modal>
            ) : null}
          </View>
        );
      case 'craving':
        return (
          <View style={styles.inputBlock}>
            <Text style={styles.label}>Suchtdruck (0-10)</Text>
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
        const reviewRows = usedToday
          ? [
              { icon: 'leaf-outline' as const, label: 'Modus', value: 'Konsumtag' },
              { icon: 'analytics-outline' as const, label: 'Menge', value: `${(Number(amountGrams) || 0).toFixed(2)} g` },
              { icon: 'flask-outline' as const, label: 'Form', value: form || 'Keine Angabe' },
              { icon: 'time-outline' as const, label: 'Zeitpunkt', value: time || 'Keine Angabe' },
            ]
          : [
              { icon: 'calendar-outline' as const, label: 'Modus', value: 'Pausentag' },
              { icon: 'bed-outline' as const, label: 'Schlafstörung', value: symSchlaf },
              { icon: 'alert-circle-outline' as const, label: 'Reizbarkeit', value: symReiz },
              { icon: 'pulse-outline' as const, label: 'Unruhe', value: symUnruhe },
              { icon: 'restaurant-outline' as const, label: 'Appetit', value: symAppetit },
              { icon: 'water-outline' as const, label: 'Schwitzen', value: symSchwitz },
            ];
        const sharedRows = [
          { icon: 'flame-outline' as const, label: 'Suchtdruck', value: cravings },
          { icon: 'moon-outline' as const, label: 'Schlaf', value: `${sleep} h` },
        ];
        return (
          <View style={styles.preview}>
            <Text style={styles.previewTitle}>Deine Übersicht</Text>
            <View style={{ gap: 12 }}>
              {[...reviewRows, ...sharedRows].map((row) => (
                <View key={row.label} style={styles.summaryRow}>
                  <View style={styles.summaryIcon}>
                    <Ionicons name={row.icon} size={18} color="#4A2A16" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.summaryLabel}>{row.label}</Text>
                    <Text style={styles.summaryValue}>{row.value}</Text>
                  </View>
                </View>
              ))}
              {notes ? (
                <View style={[styles.summaryRow, styles.summaryNoteRow]}>
                  <View style={styles.summaryIcon}>
                    <Ionicons name="chatbubble-ellipses-outline" size={18} color="#4A2A16" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.summaryLabel}>Notiz</Text>
                    <Text style={styles.summaryValue}>{notes}</Text>
                  </View>
                </View>
              ) : null}
            </View>
          </View>
        );
    }
    return <View />;
  }

  const current = steps[stepIdx];
  const total = modeChoice === null ? useDaySteps.length : steps.length;
  const { emoji, title } = titles[current];
  const percent = Math.max(0, Math.min(1, (stepIdx + 1) / total));

  const isReview = current === 'review';
  const disableNext = !isReview && !canProceed(current);
  const primaryLabel = isReview ? 'Check-in speichern' : 'Weiter';

  return (
    <View style={[styles.wrap, style]}>
      <View style={styles.progressHeader}>
        <View style={styles.progressBarTrack}>
          <View style={[styles.progressBarFill, { width: `${percent * 100}%` }]} />
        </View>
        <Text style={styles.progress}>{`Schritt ${Math.min(stepIdx + 1, total)} / ${total}`}</Text>
      </View>
      <View style={styles.stage}>
        <View style={styles.prompt}>
          <Text style={styles.stepEmoji}>{emoji}</Text>
          <Text style={styles.h1}>{title}</Text>
        </View>
        <View style={styles.stepContent}>{renderStep(current)}</View>
      </View>

      <View style={styles.navRow}>
        <TouchableOpacity
          style={[styles.buttonGhost, (stepIdx === 0 && !onCancel) && styles.buttonGhostDisabled]}
          onPress={stepIdx === 0 ? onCancel ?? undefined : back}
          disabled={stepIdx === 0 && !onCancel}
          accessibilityRole="button"
        >
          <Text style={styles.buttonGhostLabel}>{stepIdx === 0 ? (onCancel ? 'Abbrechen' : 'Zurück') : 'Zurück'}</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.button, disableNext && styles.buttonDisabled]}
          onPress={() => {
            if (isReview) {
              onSubmit?.(data);
            } else {
              next();
            }
          }}
          disabled={disableNext}
          accessibilityRole="button"
        >
          <Text style={styles.buttonLabel}>{primaryLabel}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, padding: 16, gap: 16 },
  progressHeader: { gap: 6 },
  h1: { fontSize: 22, fontWeight: '700', fontFamily: 'Inter-Bold', color: '#4A2A16', textAlign: 'center' },
  progress: { color: '#8A5D3E', fontSize: 12, fontFamily: 'Inter-SemiBold' },
  stepEmoji: { fontSize: 36, textAlign: 'center' },
  progressBarTrack: { height: 8, borderRadius: 999, backgroundColor: 'rgba(74,42,22,0.12)' },
  progressBarFill: { height: 8, borderRadius: 999, backgroundColor: '#E08C55' },
  stage: {
    flex: 1,
    borderRadius: 20,
    backgroundColor: 'rgba(253,241,226,0.85)',
    padding: 20,
    justifyContent: 'center',
    gap: 20,
  },
  prompt: { alignItems: 'center', gap: 6 },
  stepContent: { gap: 12 },
  navRow: { flexDirection: 'row', gap: 12 },
  inputBlock: { gap: 6 },
  label: { color: '#8A5D3E', fontSize: 14, fontFamily: 'Inter-SemiBold' },
  helper: { color: '#8A5D3E', fontSize: 12, fontFamily: 'Inter-Regular' },
  input: {
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#E4BB90',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: Platform.select({ ios: 12, android: 10 }),
    color: '#4A2A16',
    fontFamily: 'Inter-Regular',
    backgroundColor: '#fffdf8',
  },
  multiline: { minHeight: 96, textAlignVertical: 'top' },
  pickerField: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#E4BB90',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: '#fffdf8',
  },
  pickerValue: { color: '#4A2A16', fontSize: 16, fontFamily: 'Inter-SemiBold' },
  preview: {
    padding: 16,
    borderRadius: 18,
    backgroundColor: '#fffdf8',
    borderWidth: 1,
    borderColor: 'rgba(74,42,22,0.1)',
    gap: 12,
  },
  previewTitle: { color: '#4A2A16', fontWeight: '700', fontFamily: 'Inter-SemiBold', fontSize: 16 },
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    paddingVertical: 6,
  },
  summaryIcon: {
    width: 34,
    height: 34,
    borderRadius: 12,
    backgroundColor: 'rgba(200,106,58,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  summaryLabel: { color: '#8A5D3E', fontSize: 12, textTransform: 'uppercase', fontFamily: 'Inter-SemiBold' },
  summaryValue: { color: '#4A2A16', fontSize: 16, fontFamily: 'Inter-SemiBold', marginTop: 2 },
  summaryNoteRow: { backgroundColor: 'rgba(74,42,22,0.05)', borderRadius: 12, padding: 12 },
  error: { color: '#C85B3A', fontSize: 12, marginTop: 4, fontFamily: 'Inter-SemiBold' },
  button: {
    flex: 1,
    backgroundColor: '#16A34A',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  buttonDisabled: { backgroundColor: 'rgba(22,163,74,0.4)' },
  buttonLabel: { color: 'white', fontWeight: '700', fontFamily: 'Inter-SemiBold' },
  buttonGhost: {
    flex: 1,
    backgroundColor: 'rgba(74,42,22,0.08)',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#D6A477',
  },
  buttonGhostDisabled: { opacity: 0.5 },
  buttonGhostLabel: { color: '#4A2A16', fontWeight: '700', fontFamily: 'Inter-SemiBold' },
  modeBtn: {
    flex: 1,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#E4BB90',
    backgroundColor: '#fffdf8',
  },
  modeBtnActive: { backgroundColor: '#F7C99E', borderColor: '#E08C55' },
  modeBtnLabel: { color: '#8A5D3E', fontWeight: '600', fontFamily: 'Inter-SemiBold' },
  modeBtnLabelActive: { color: '#4A2A16', fontFamily: 'Inter-SemiBold' },
  chip: {
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#E4BB90',
    backgroundColor: 'rgba(253,241,226,0.7)',
  },
  chipActive: { backgroundColor: '#F9D7B4', borderColor: '#E08C55' },
  chipLabel: { color: '#8A5D3E', fontFamily: 'Inter-Regular' },
  chipLabelActive: { color: '#4A2A16', fontWeight: '700', fontFamily: 'Inter-SemiBold' },
  timeModalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.35)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  timeModalCard: {
    width: '100%',
    borderRadius: 20,
    backgroundColor: '#fffdf8',
    padding: 20,
  },
  timeModalTitle: { fontSize: 18, fontWeight: '700', color: '#4A2A16', marginBottom: 12 },
  timeModalActions: { flexDirection: 'row', gap: 12, marginTop: 12 },
});
