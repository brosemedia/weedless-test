import React, { useEffect, useMemo, useRef, useState } from 'react';
import { View, Text, TextInput, StyleSheet, Pressable, Animated, ScrollView } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { HapticSlider } from '../onboarding/components/HapticSlider';
import { useTheme } from '../theme/useTheme';
import { spacing, radius } from '../design/tokens';
import { haptics } from '../services/haptics';
import { REASON_CATEGORIES, REASON_OPTIONS } from '../constants/checkinReasons';
import { CHECKIN_SYMPTOM_SECTIONS } from '../constants/checkinSymptoms';
import { gramsPerJointFromProfile } from '../lib/consumption';
import { useApp } from '../store/app';
import type { DailyCheckinData } from '../types/checkin';
import type { ConsumptionMethod, ConsumptionAmountUnit } from '../types/profile';

export type Props = {
  initial?: Partial<DailyCheckinData>;
  onSubmit?: (checkin: DailyCheckinData) => void;
  onCancel?: () => void;
  style?: any;
};

type StepKey =
  | 'mode'
  | 'method'
  | 'amount'
  | 'reasons'
  | 'sleep'
  | 'mood'
  | 'craving'
  | 'symptoms'
  | 'notes'
  | 'review';

const METHOD_OPTIONS: { key: ConsumptionMethod; label: string; unit: ConsumptionAmountUnit }[] = [
  { key: 'joint', label: 'Joint', unit: 'g' },
  { key: 'bong', label: 'Bong', unit: 'g' },
  { key: 'pipe', label: 'Pipe', unit: 'g' },
  { key: 'vape', label: 'Vaporizer', unit: 'g' },
  { key: 'edible', label: 'Edible', unit: 'mg_thc' },
  { key: 'wax', label: 'Dab / Wax', unit: 'g' },
  { key: 'oil', label: 'Öl / Tinktur', unit: 'mg_thc' },
  { key: 'other', label: 'Sonstiges', unit: 'g' },
];

const moodEmoji = (value: number) => {
  if (value <= 1.5) return '😢';
  if (value <= 2.5) return '😔';
  if (value <= 3.5) return '😐';
  if (value <= 4.5) return '🙂';
  return '😊';
};

const moodLabel = (value: number) => {
  if (value <= 1.5) return 'Sehr schlecht';
  if (value <= 2.5) return 'Schlecht';
  if (value <= 3.5) return 'Okay';
  if (value <= 4.5) return 'Gut';
  return 'Sehr gut';
};

const formatHours = (value: number) => `${(Math.round(value * 10) / 10).toFixed(1)} h`;

const Chip = ({
  active,
  label,
  onPress,
}: {
  active: boolean;
  label: string;
  onPress: () => void;
}) => {
  const { theme } = useTheme();
  const colors = theme.colors;
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        {
          paddingHorizontal: spacing.m,
          paddingVertical: spacing.s,
          borderRadius: radius.pill,
          borderWidth: 1,
          borderColor: active ? colors.primary : colors.border,
          backgroundColor: active ? colors.primaryMuted : colors.surface,
        },
        pressed && { opacity: 0.9 },
      ]}
    >
      <Text
        style={{
          color: active ? colors.text : colors.textMuted,
          fontWeight: '600',
        }}
      >
        {label}
      </Text>
    </Pressable>
  );
};

export default function MultiStepDailyCheckin({ initial, onSubmit, onCancel, style }: Props): React.ReactElement {
  const nowISO = useMemo(() => new Date().toISOString(), []);
  const { theme } = useTheme();
  const colors = theme.colors;
  const profile = useApp((s) => s.profile);
  const insets = useSafeAreaInsets();
  const gramsPerJoint = useMemo(() => gramsPerJointFromProfile(profile), [profile]);

  const [modeChoice, setModeChoice] = useState<boolean | null>(
    typeof initial?.usedToday === 'boolean' ? initial.usedToday : null
  );
  const [method, setMethod] = useState<ConsumptionMethod>('joint');
  const [amountUnit, setAmountUnit] = useState<ConsumptionAmountUnit>('g');
  const [amountValue, setAmountValue] = useState<number>(0.5);
  const [sleepHours, setSleepHours] = useState<number>(initial?.sleepHours ?? 7);
  const [mood, setMood] = useState<number>(3);
  const [craving, setCraving] = useState<number>(0);
  const [reasonCategories, setReasonCategories] = useState<string[]>([]);
  const [reasons, setReasons] = useState<string[]>([]);
  const [symptoms, setSymptoms] = useState<string[]>([]);
  const [skippedSymptoms, setSkippedSymptoms] = useState<boolean>(false);
  const [notes, setNotes] = useState<string>(initial?.notes ?? '');
  const [navHeight, setNavHeight] = useState(0);

  const stepAnim = useRef(new Animated.Value(1)).current;
  const animateStep = () => {
    stepAnim.setValue(0);
    Animated.timing(stepAnim, {
      toValue: 1,
      duration: 220,
      useNativeDriver: true,
    }).start();
  };

  useEffect(() => {
    const preset = METHOD_OPTIONS.find((m) => m.key === method);
    if (preset) setAmountUnit(preset.unit);
  }, [method]);

  const steps: StepKey[] = useMemo(() => {
    if (modeChoice === true) {
      return ['mode', 'method', 'amount', 'reasons', 'sleep', 'mood', 'craving', 'symptoms', 'notes', 'review'];
    }
    if (modeChoice === false) {
      return ['mode', 'sleep', 'mood', 'craving', 'symptoms', 'notes', 'review'];
    }
    return ['mode'];
  }, [modeChoice]);

  const [stepIdx, setStepIdx] = useState(0);
  useEffect(() => {
    setStepIdx((prev) => Math.min(prev, Math.max(steps.length - 1, 0)));
  }, [steps.length]);
  useEffect(() => {
    animateStep();
  }, [stepIdx]);

  const usedToday = modeChoice === true;

  const amountGrams = useMemo(() => {
    if (!usedToday) return 0;
    if (amountUnit === 'g') return Math.max(0, amountValue);
    if (amountUnit === 'mg_thc') return Math.max(0, amountValue / 1000);
    return 0;
  }, [usedToday, amountUnit, amountValue]);

  const computedJoints =
    usedToday && gramsPerJoint > 0 && amountGrams > 0 ? amountGrams / gramsPerJoint : undefined;

  const dailyData: DailyCheckinData = {
    dateISO: initial?.dateISO ?? nowISO,
    usedToday: !!usedToday,
    amountGrams,
    cravings0to10: craving,
    mood1to5: mood,
    sleepHours: Math.max(0, sleepHours),
    notes: notes.trim() || undefined,
    consumptionMethod: usedToday ? method : undefined,
    consumptionAmountValue: usedToday ? amountValue : undefined,
    consumptionAmountUnit: usedToday ? amountUnit : undefined,
    consumptionJoints: computedJoints,
    reasonCategoryIds: usedToday ? reasonCategories : undefined,
    reasonIds: usedToday ? reasons : undefined,
    withdrawalSymptomIds: symptoms.length ? symptoms : undefined,
    skippedSymptoms,
    uses: usedToday
      ? [
          {
            type: 'use',
            amountGrams,
            form: METHOD_OPTIONS.find((m) => m.key === method)?.label ?? 'Konsum',
            craving0to10: craving,
          },
        ]
      : undefined,
    pauses: !usedToday
      ? [
          {
            type: 'pause',
            craving0to10: craving,
          },
        ]
      : undefined,
  };

  const total = steps.length;
  const percent = Math.max(0, Math.min(1, (stepIdx + 1) / total));

  const canProceed = (key: StepKey) => {
    if (key === 'mode') return modeChoice !== null;
    if (key === 'amount' && usedToday) return amountValue > 0;
    return true;
  };

  const next = () => {
    const k = steps[stepIdx];
    if (!canProceed(k)) return;
    if (stepIdx < steps.length - 1) {
      haptics.trigger('general', 'selection');
      setStepIdx(stepIdx + 1);
    }
  };

  const back = () => {
    if (stepIdx > 0) {
      haptics.trigger('general', 'selection');
      setStepIdx(stepIdx - 1);
    }
  };

  const toggleReasonCategory = (id: string) => {
    setReasonCategories((prev) =>
      prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id]
    );
  };

  const toggleReason = (id: string) => {
    setReasons((prev) => (prev.includes(id) ? prev.filter((r) => r !== id) : [...prev, id]));
  };

  const toggleSymptom = (id: string) => {
    setSkippedSymptoms(false);
    setSymptoms((prev) => (prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]));
  };

  const filteredReasons = useMemo(() => {
    if (!reasonCategories.length) return REASON_OPTIONS;
    return REASON_OPTIONS.filter((opt) => opt.categories.some((c) => reasonCategories.includes(c)));
  }, [reasonCategories]);

  const renderStep = (key: StepKey) => {
    switch (key) {
      case 'mode':
        return (
          <View style={{ gap: spacing.m }}>
            <Text style={[styles.helper, { color: colors.textMuted }]}>
              Starte mit der zentralen Frage.
            </Text>
            <View style={{ flexDirection: 'row', gap: spacing.s }}>
              <Pressable
                onPress={() => {
                  haptics.trigger('general', 'impact', { intensity: 'light' });
                  setModeChoice(true);
                  setStepIdx(1);
                }}
                style={({ pressed }) => [
                  styles.optionCard,
                  {
                    borderColor: modeChoice === true ? colors.primary : colors.border,
                    backgroundColor: modeChoice === true ? colors.primaryMuted : colors.surface,
                  },
                  pressed && { opacity: 0.9 },
                ]}
              >
                <Text style={[styles.optionEmoji, { color: colors.text }]}>🌿</Text>
                <Text style={[styles.optionTitle, { color: colors.text }]}>Ja, konsumiert</Text>
                <Text style={[styles.optionSubtitle, { color: colors.textMuted }]}>
                  Heute gab es Konsum
                </Text>
              </Pressable>
              <Pressable
                onPress={() => {
                  haptics.trigger('general', 'impact', { intensity: 'light' });
                  setModeChoice(false);
                  setStepIdx(1);
                }}
                style={({ pressed }) => [
                  styles.optionCard,
                  {
                    borderColor: modeChoice === false ? colors.primary : colors.border,
                    backgroundColor: modeChoice === false ? colors.primaryMuted : colors.surface,
                  },
                  pressed && { opacity: 0.9 },
                ]}
              >
                <Text style={[styles.optionEmoji, { color: colors.text }]}>✅</Text>
                <Text style={[styles.optionTitle, { color: colors.text }]}>Nein, konsumfrei</Text>
                <Text style={[styles.optionSubtitle, { color: colors.textMuted }]}>
                  Heute nichts konsumiert
                </Text>
              </Pressable>
            </View>
          </View>
        );
      case 'method':
        return (
          <View style={{ gap: spacing.s }}>
            <View style={styles.grid}>
              {METHOD_OPTIONS.map((option) => (
                <Pressable
                  key={option.key}
                  onPress={() => {
                    haptics.trigger('general', 'selection');
                    setMethod(option.key);
                    setAmountUnit(option.unit);
                  }}
                  style={({ pressed }) => [
                    styles.chipCard,
                    {
                      borderColor: method === option.key ? colors.primary : colors.border,
                      backgroundColor: method === option.key ? colors.primaryMuted : colors.surface,
                    },
                    pressed && { opacity: 0.9 },
                  ]}
                >
                  <Text style={[styles.chipLabel, { color: colors.text }]}>{option.label}</Text>
                  <Text style={[styles.chipSub, { color: colors.textMuted }]}>
                    Standard: {option.unit === 'g' ? 'Gramm' : 'mg THC'}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>
        );
      case 'amount': {
        const unitLabel = amountUnit === 'g' ? 'Gramm' : 'mg THC';
        const min = amountUnit === 'g' ? 0 : 0;
        const max = amountUnit === 'g' ? 3 : 100;
        const step = amountUnit === 'g' ? 0.05 : 1;
        return (
          <View style={{ gap: spacing.m }}>
            <HapticSlider
              value={amountValue}
              onValueChange={(v) => setAmountValue(Math.max(0, v))}
              minimumValue={min}
              maximumValue={max}
              step={step}
              label={`Menge (${unitLabel})`}
              formatValue={(v) =>
                amountUnit === 'g'
                  ? `${(Math.round(v * 100) / 100).toFixed(2)} g`
                  : `${Math.round(v)} mg`
              }
            />
            <Text style={[styles.helper, { color: colors.textMuted }]}>
              Passe die Range bei Bedarf über einen längeren Druck auf die Skala an.
            </Text>
          </View>
        );
      }
      case 'reasons':
        return (
          <View style={{ gap: spacing.m }}>
            <View style={{ flexWrap: 'wrap', flexDirection: 'row', gap: spacing.s }}>
              {REASON_CATEGORIES.map((cat) => (
                <Chip
                  key={cat.id}
                  active={reasonCategories.includes(cat.id)}
                  label={`${cat.emoji} ${cat.label}`}
                  onPress={() => toggleReasonCategory(cat.id)}
                />
              ))}
            </View>
            <View style={{ gap: spacing.s }}>
              <Text style={[styles.helper, { color: colors.textMuted }]}>Gründe (Mehrfachauswahl)</Text>
              <View style={{ flexWrap: 'wrap', flexDirection: 'row', gap: spacing.s }}>
                {filteredReasons.map((reason) => (
                  <Chip
                    key={reason.id}
                    active={reasons.includes(reason.id)}
                    label={reason.label}
                    onPress={() => toggleReason(reason.id)}
                  />
                ))}
              </View>
            </View>
          </View>
        );
      case 'sleep':
        return (
          <View style={{ gap: spacing.m }}>
            <HapticSlider
              value={sleepHours}
              onValueChange={(v) => setSleepHours(Math.max(0, Math.min(12, v)))}
              minimumValue={0}
              maximumValue={12}
              step={0.5}
              label="Schlafdauer"
              formatValue={(v) => formatHours(v)}
            />
          </View>
        );
      case 'mood':
        return (
          <View style={{ gap: spacing.m }}>
            <View style={{ alignItems: 'center', gap: spacing.xs }}>
              <Text style={{ fontSize: 48 }}>{moodEmoji(mood)}</Text>
              <Text style={{ color: colors.textMuted, fontWeight: '600' }}>{moodLabel(mood)}</Text>
            </View>
            <HapticSlider
              value={mood}
              onValueChange={(v) => setMood(Math.round(v))}
              minimumValue={1}
              maximumValue={5}
              step={1}
              formatValue={(v) => `${Math.round(v)}/5`}
            />
          </View>
        );
      case 'craving':
        return (
          <View style={{ gap: spacing.m }}>
            <HapticSlider
              value={craving}
              onValueChange={(v) => setCraving(Math.round(v))}
              minimumValue={0}
              maximumValue={10}
              step={1}
              formatValue={(v) => `${Math.round(v)}/10`}
            />
          </View>
        );
      case 'symptoms':
        return (
          <View style={{ gap: spacing.m }}>
            <Text style={[styles.label, { color: colors.text }]}>
              Gefühle & mögliche Entzugssymptome
            </Text>
            <View style={{ gap: spacing.m, marginTop: spacing.s }}>
              {CHECKIN_SYMPTOM_SECTIONS.map((section) => (
                <View key={section.id} style={{ gap: spacing.s }}>
                  <Text style={[styles.sectionTitle, { color: colors.text }]}>
                    {section.emoji} {section.label}
                  </Text>
                  <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.s }}>
                    {section.items.map((item) => (
                      <Chip
                        key={item.id}
                        active={symptoms.includes(item.id)}
                        label={item.label}
                        onPress={() => toggleSymptom(item.id)}
                      />
                    ))}
                  </View>
                </View>
              ))}
            </View>
          </View>
        );
      case 'notes':
        return (
          <View style={{ gap: spacing.s }}>
            <TextInput
              value={notes}
              onChangeText={setNotes}
              placeholder="Wie ging es dir heute?"
              placeholderTextColor={colors.textMuted}
              style={[
                styles.input,
                {
                  color: colors.text,
                  borderColor: colors.border,
                  backgroundColor: colors.surface,
                  minHeight: 110,
                  textAlignVertical: 'top',
                },
              ]}
              multiline
            />
          </View>
        );
      case 'review':
        return (
          <View style={{ gap: spacing.m }}>
            <Text style={[styles.label, { color: colors.text }]}>Übersicht</Text>
            <View
              style={[
                styles.previewCard,
                { borderColor: colors.border, backgroundColor: colors.surfaceMuted },
              ]}
            >
              <SummaryRow label="Status" value={usedToday ? 'Konsumiert' : 'Konsumfrei'} />
              {usedToday ? (
                <>
                  <SummaryRow
                    label="Art"
                    value={METHOD_OPTIONS.find((m) => m.key === method)?.label ?? '–'}
                  />
                  <SummaryRow
                    label="Menge"
                    value={
                      amountUnit === 'g'
                        ? `${amountGrams.toFixed(2)} g`
                        : `${Math.round(amountValue)} mg THC`
                    }
                  />
                  {reasons.length ? (
                    <SummaryRow
                      label="Gründe"
                      value={REASON_OPTIONS.filter((r) => reasons.includes(r.id))
                        .map((r) => r.label)
                        .join(', ')}
                    />
                  ) : null}
                </>
              ) : null}
              <SummaryRow label="Schlaf" value={formatHours(sleepHours)} />
              <SummaryRow label="Stimmung" value={`${moodEmoji(mood)} ${mood}/5`} />
              <SummaryRow label="Suchtdruck" value={`${craving}/10`} />
              {symptoms.length ? (
                <SummaryRow
                  label="Symptome"
                  value={symptoms.length > 3 ? `${symptoms.length} ausgewählt` : symptoms.join(', ')}
                />
              ) : skippedSymptoms ? (
                <SummaryRow label="Symptome" value="Übersprungen / keine Angabe" />
              ) : null}
              {notes ? <SummaryRow label="Notizen" value={notes} /> : null}
            </View>
          </View>
        );
    }
    return null;
  };

  const current = steps[stepIdx];
  const isReview = current === 'review';
  const hasSymptomsSelection = symptoms.length > 0;
  const disableNext = current === 'mode' ? modeChoice === null : current === 'amount' && usedToday && amountValue <= 0;
  const primaryLabel =
    isReview
      ? 'Check-in speichern'
      : current === 'symptoms' && !hasSymptomsSelection
      ? 'Überspringen'
      : 'Weiter';
  const promptEmoji =
    current === 'mode'
      ? modeChoice === null
        ? '🤔'
        : usedToday
        ? '🌿'
        : '✅'
      : current === 'mood'
      ? null
      : '✨';

  const footerOffset = navHeight || spacing.xl * 2 + insets.bottom;
  const extraBottomSpacing = spacing.xl;
  const scrollBottomPadding = footerOffset + extraBottomSpacing;

  return (
    <SafeAreaView
      style={[styles.safeArea, { backgroundColor: colors.surface }]}
      edges={['bottom', 'left', 'right']}
    >
      <View style={[styles.wrap, { backgroundColor: colors.surface }, style]}>
        <View
          style={[
            styles.content,
            { paddingBottom: scrollBottomPadding },
          ]}
        >
        <View style={styles.progressHeader}>
          <View style={[styles.progressBarTrack, { backgroundColor: colors.border }]}>
            <View
              style={[
                styles.progressBarFill,
                { width: `${percent * 100}%`, backgroundColor: colors.primary },
              ]}
            />
          </View>
          <Text style={[styles.progress, { color: colors.textMuted }]}>
            Schritt {Math.min(stepIdx + 1, total)} / {total}
          </Text>
        </View>

        <Animated.View
          style={{
            opacity: stepAnim,
            transform: [
              {
                translateY: stepAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [12, 0],
                }),
              },
            ],
          }}
        >
          <View
            style={[
              styles.stage,
              {
                backgroundColor: 'transparent',
                borderColor: 'transparent',
                paddingBottom: scrollBottomPadding,
              },
            ]}
          >
            <View style={styles.prompt}>
              {promptEmoji ? (
                <Text style={[styles.stepEmoji, { color: colors.text }]}>{promptEmoji}</Text>
              ) : null}
              <Text style={[styles.h1, { color: colors.text }]}>
                {
                  {
                    mode: 'Hast du heute konsumiert?',
                    method: 'Was hast du konsumiert?',
                    amount: 'Wie viel ungefähr?',
                    reasons: 'Warum hast du konsumiert?',
                    sleep: 'Wie viel hast du geschlafen?',
                    mood: 'Wie ist deine Stimmung?',
                    craving: 'Wie stark ist dein Suchtdruck?',
                    symptoms: 'Was trifft zu?',
                    notes: 'Notizen (optional)',
                    review: 'Zusammenfassung',
                  }[current]
                }
              </Text>
            </View>
            <ScrollView
              contentContainerStyle={{
                gap: spacing.m,
                paddingBottom: scrollBottomPadding,
                paddingTop: spacing.m,
              }}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            >
              {renderStep(current)}
            </ScrollView>
          </View>
        </Animated.View>

        </View>

        <View
          style={[
            styles.navContainer,
            {
              paddingBottom: insets.bottom,
              backgroundColor: colors.surface,
              borderTopColor: colors.border,
              paddingHorizontal: spacing.l,
              paddingTop: spacing.m,
            },
          ]}
          onLayout={(e) => setNavHeight(e.nativeEvent.layout.height)}
        >
          <View style={styles.navRow}>
            <Pressable
              style={({ pressed }) => [
                styles.buttonGhost,
                { borderColor: colors.border },
                pressed && { opacity: 0.8 },
                stepIdx === 0 && !onCancel ? styles.buttonGhostDisabled : null,
              ]}
              onPress={stepIdx === 0 ? onCancel ?? undefined : back}
              disabled={stepIdx === 0 && !onCancel}
            >
              <Text style={[styles.buttonGhostLabel, { color: colors.text }]}>
                {stepIdx === 0 ? (onCancel ? 'Abbrechen' : 'Zurück') : 'Zurück'}
              </Text>
            </Pressable>
            <Pressable
              style={({ pressed }) => [
                styles.button,
                {
                  backgroundColor: disableNext ? colors.border : colors.primary,
                },
                pressed && !disableNext ? { opacity: 0.9 } : null,
              ]}
              onPress={() => {
                if (isReview) {
                  onSubmit?.(dailyData);
                  haptics.trigger('general', 'success');
                } else {
                  if (current === 'symptoms' && !hasSymptomsSelection) {
                    setSkippedSymptoms(true);
                    setSymptoms([]);
                  }
                  next();
                }
              }}
              disabled={disableNext}
            >
              <Text style={[styles.buttonLabel, { color: colors.surface }]}>{primaryLabel}</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  const { theme } = useTheme();
  return (
    <View style={{ gap: 4 }}>
      <Text style={{ fontSize: 12, color: theme.colors.textMuted, textTransform: 'uppercase', fontWeight: '700' }}>
        {label}
      </Text>
      <Text style={{ fontSize: 16, color: theme.colors.text, fontWeight: '600' }}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  wrap: {
    flex: 1,
    minHeight: 420,
  },
  content: {
    flex: 1,
    paddingHorizontal: spacing.l,
    paddingTop: spacing.l,
    gap: spacing.m,
  },
  progressHeader: { gap: 6 },
  h1: { fontSize: 22, fontWeight: '700', textAlign: 'center' },
  progress: { fontSize: 12, fontWeight: '600' },
  stepEmoji: { fontSize: 36, textAlign: 'center' },
  progressBarTrack: { height: 8, borderRadius: 999, overflow: 'hidden' },
  progressBarFill: { height: 8, borderRadius: 999 },
  stage: {
    borderRadius: radius.xl,
    paddingHorizontal: spacing.m,
    paddingTop: spacing.m,
    justifyContent: 'flex-start',
    gap: spacing.m,
    borderWidth: 0,
  },
  prompt: { alignItems: 'center', gap: 6 },
  navContainer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 0,
    paddingTop: 0,
    paddingBottom: spacing.s,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  navRow: {
    flexDirection: 'row',
    gap: spacing.s,
    paddingHorizontal: 0,
  },
  label: { fontSize: 15, fontWeight: '700' },
  helper: { fontSize: 13, fontWeight: '500' },
  optionCard: {
    flex: 1,
    padding: spacing.m,
    borderRadius: radius.l,
    borderWidth: 1,
    gap: spacing.s / 2,
  },
  optionEmoji: { fontSize: 24 },
  optionTitle: { fontSize: 16, fontWeight: '700' },
  optionSubtitle: { fontSize: 13, fontWeight: '500' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.s },
  chipCard: {
    width: '48%',
    borderRadius: radius.l,
    borderWidth: 1,
    padding: spacing.m,
    gap: 4,
  },
  chipLabel: { fontSize: 15, fontWeight: '700' },
  chipSub: { fontSize: 12, fontWeight: '500' },
  input: {
    borderWidth: 1,
    borderRadius: radius.l,
    paddingHorizontal: spacing.m,
    paddingVertical: spacing.s,
  },
  button: {
    flex: 1,
    paddingVertical: spacing.m,
    borderRadius: radius.l,
    alignItems: 'center',
  },
  buttonLabel: { fontWeight: '700', fontSize: 16 },
  buttonGhost: {
    flex: 1,
    borderWidth: 1,
    borderRadius: radius.l,
    paddingVertical: spacing.m,
    alignItems: 'center',
  },
  buttonGhostDisabled: { opacity: 0.5 },
  buttonGhostLabel: { fontWeight: '700', fontSize: 16 },
  previewCard: {
    borderRadius: radius.l,
    borderWidth: 1,
    padding: spacing.m,
    gap: spacing.s,
  },
  sectionTitle: { fontSize: 14, fontWeight: '700' },
  skipButton: {
    paddingHorizontal: spacing.m,
    paddingVertical: spacing.xs,
    borderRadius: radius.pill,
    borderWidth: 1,
  },
});
