import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  Pressable,
  Modal,
  TextInput,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors, radius, spacing, shadows } from '../design/tokens';
import { useApp } from '../store/app';
import { useUiStore } from '../store/ui';
import type { DayLog } from '../types/profile';
import MultiStepDailyCheckin, { type DailyCheckinData } from './MultiStepDailyCheckin';
import { GRAMS_PER_JOINT_DEFAULT, TASK_XP } from '../lib/tasks';

type ActionKey = 'consumption' | 'purchase' | 'checkin';

const ACTIONS: { key: ActionKey; label: string; description: string; icon: keyof typeof Ionicons.glyphMap }[] = [
  { key: 'consumption', label: 'Konsum hinzufügen', description: 'Session schnell erfassen', icon: 'leaf-outline' },
  { key: 'purchase', label: 'Einkauf protokollieren', description: 'Ausgaben festhalten', icon: 'cart-outline' },
  { key: 'checkin', label: 'Check-in starten', description: 'Gefühl & Konsum tracken', icon: 'calendar-outline' },
];

const parseNumberInput = (raw: string) => {
  if (!raw?.trim()) return NaN;
  const normalized = raw.replace(',', '.');
  const value = Number(normalized);
  return Number.isFinite(value) ? value : NaN;
};

const todayKey = () => new Date().toISOString().slice(0, 10);

const timestampFromDateKey = (dateKey: string, time?: string) => {
  const [year, month, day] = dateKey.split('-').map((part) => parseInt(part, 10));
  if (!Number.isFinite(year) || !Number.isFinite(month) || !Number.isFinite(day)) {
    return Date.now();
  }
  const date = new Date(year, month - 1, day);
  if (time && /^\d{2}:\d{2}$/.test(time)) {
    const [hh, mm] = time.split(':').map((part) => parseInt(part, 10));
    date.setHours(hh, mm, 0, 0);
  } else {
    date.setHours(12, 0, 0, 0);
  }
  return date.getTime();
};

function Field({
  label,
  value,
  placeholder,
  onChangeText,
}: {
  label: string;
  value: string;
  placeholder?: string;
  onChangeText: (text: string) => void;
}) {
  return (
    <View style={{ width: '100%' }}>
      <Text style={{ fontSize: 13, fontWeight: '600', color: colors.light.navy, marginBottom: 6 }}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        keyboardType="decimal-pad"
        placeholderTextColor="rgba(74,42,22,0.4)"
        style={{
          borderRadius: radius.l,
          borderWidth: 1,
          borderColor: colors.light.border,
          paddingHorizontal: spacing.l,
          paddingVertical: spacing.m,
          backgroundColor: '#fff7ef',
          color: colors.light.text,
          fontSize: 16,
        }}
      />
    </View>
  );
}

function FormHeader({ title, onClose }: { title: string; onClose: () => void }) {
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: spacing.l,
        paddingVertical: spacing.m,
        borderBottomWidth: 1,
        borderColor: 'rgba(74,42,22,0.08)',
      }}
    >
      <Text style={{ fontSize: 18, fontWeight: '700', color: colors.light.text }}>{title}</Text>
      <Pressable accessibilityRole='button' accessibilityLabel="Schließen" onPress={onClose} hitSlop={8}>
        <Text style={{ fontSize: 16, fontWeight: '600', color: colors.light.primary }}>Schließen</Text>
      </Pressable>
    </View>
  );
}

type SheetProps = {
  visible: boolean;
  bottomInset: number;
  onClose: () => void;
  onSelect: (key: ActionKey) => void;
};

function ActionSheet({ visible, bottomInset, onClose, onSelect }: SheetProps) {
  if (!visible) return null;
  return (
    <Modal animationType="fade" transparent visible onRequestClose={onClose}>
      <Pressable style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.25)' }} onPress={onClose} />
      <View
        style={{
          position: 'absolute',
          left: spacing.l,
          right: spacing.l,
          bottom: bottomInset + 90,
          backgroundColor: '#fff8ef',
          borderRadius: radius.xl,
          padding: spacing.l,
          ...shadows.md,
        }}
      >
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: spacing.s,
          }}
        >
          <Text style={{ fontSize: 16, fontWeight: '700', color: colors.light.text }}>Schnelle Aktion</Text>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Menü schließen"
            onPress={onClose}
            hitSlop={8}
            style={({ pressed }) => [
              {
                width: 32,
                height: 32,
                borderRadius: radius.pill,
                alignItems: 'center',
                justifyContent: 'center',
              },
              pressed && { backgroundColor: 'rgba(200,106,58,0.12)' },
            ]}
          >
            <Ionicons name="close" size={20} color={colors.light.text} />
          </Pressable>
        </View>
        {ACTIONS.map((action) => (
          <Pressable
            key={action.key}
            onPress={() => onSelect(action.key)}
            style={({ pressed }) => [
              {
                flexDirection: 'row',
                alignItems: 'center',
                paddingVertical: spacing.s,
                borderRadius: radius.l,
              },
              pressed && { backgroundColor: 'rgba(200,106,58,0.08)' },
            ]}
          >
            <View
              style={{
                width: 40,
                height: 40,
                borderRadius: radius.pill,
                backgroundColor: colors.light.primary,
                alignItems: 'center',
                justifyContent: 'center',
                marginRight: spacing.m,
              }}
            >
              <Ionicons name={action.icon} size={22} color={colors.light.surface} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 15, fontWeight: '600', color: colors.light.text }}>
                {action.label}
              </Text>
              <Text style={{ fontSize: 13, color: colors.light.textMuted }}>{action.description}</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={colors.light.textMuted} />
          </Pressable>
        ))}
      </View>
    </Modal>
  );
}

type ConsumptionModalProps = {
  visible: boolean;
  onClose: () => void;
  onSubmit: (grams: string, joints: string, minutes: string) => string | null;
};

function ConsumptionModal({ visible, onClose, onSubmit }: ConsumptionModalProps) {
  const [grams, setGrams] = useState('');
  const [joints, setJoints] = useState('');
  const [minutes, setMinutes] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!visible) {
      setGrams('');
      setJoints('');
      setMinutes('');
      setError(null);
    }
  }, [visible]);

  if (!visible) return null;

  const handleSubmit = () => {
    const maybeError = onSubmit(grams, joints, minutes);
    if (maybeError) {
      setError(maybeError);
    }
  };

  return (
    <Modal animationType="slide" visible onRequestClose={onClose}>
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.light.surface }}>
        <FormHeader title="Konsum hinzufügen" onClose={onClose} />
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <ScrollView contentContainerStyle={{ padding: spacing.l, gap: spacing.l }}>
            <Field
              label="Menge in Gramm"
              value={grams}
              onChangeText={(text) => {
                setGrams(text);
                if (text) setJoints('');
              }}
              placeholder="z. B. 0.5"
            />
            <Field
              label="oder Anzahl Joints"
              value={joints}
              onChangeText={(text) => {
                setJoints(text);
                if (text) setGrams('');
              }}
              placeholder="z. B. 1"
            />
            <Field
              label="Session-Dauer (Minuten)"
              value={minutes}
              onChangeText={setMinutes}
              placeholder="optional"
            />
            <Text style={{ fontSize: 13, color: colors.light.textMuted }}>
              Die Angaben beeinflussen Geld gespart, Gramm/Joints vermieden und Zeit zurückgewonnen im Dashboard.
            </Text>
            {error ? (
              <Text style={{ color: colors.light.danger, fontWeight: '600' }}>{error}</Text>
            ) : null}
            <Pressable
              onPress={handleSubmit}
              style={({ pressed }) => [
                {
                  backgroundColor: colors.light.primary,
                  paddingVertical: spacing.m,
                  borderRadius: radius.pill,
                  alignItems: 'center',
                },
                pressed && { opacity: 0.9 },
              ]}
            >
              <Text style={{ color: colors.light.surface, fontSize: 16, fontWeight: '700' }}>Speichern</Text>
            </Pressable>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </Modal>
  );
}

type PurchaseModalProps = {
  visible: boolean;
  onClose: () => void;
  onSubmit: (amount: string) => string | null;
};

function PurchaseModal({ visible, onClose, onSubmit }: PurchaseModalProps) {
  const [amount, setAmount] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!visible) {
      setAmount('');
      setError(null);
    }
  }, [visible]);

  if (!visible) return null;

  const handleSubmit = () => {
    const maybeError = onSubmit(amount);
    if (maybeError) {
      setError(maybeError);
    }
  };

  return (
    <Modal animationType="slide" visible onRequestClose={onClose}>
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.light.surface }}>
        <FormHeader title="Einkauf protokollieren" onClose={onClose} />
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <ScrollView contentContainerStyle={{ padding: spacing.l, gap: spacing.l }}>
            <Field
              label="Betrag in Euro"
              value={amount}
              onChangeText={setAmount}
              placeholder="z. B. 25"
            />
            <Text style={{ fontSize: 13, color: colors.light.textMuted }}>
              Ausgaben werden von „Geld gespart“ abgezogen – so bleiben deine Ersparnisse realistisch.
            </Text>
            {error ? (
              <Text style={{ color: colors.light.danger, fontWeight: '600' }}>{error}</Text>
            ) : null}
            <Pressable
              onPress={handleSubmit}
              style={({ pressed }) => [
                {
                  backgroundColor: colors.light.primary,
                  paddingVertical: spacing.m,
                  borderRadius: radius.pill,
                  alignItems: 'center',
                },
                pressed && { opacity: 0.9 },
              ]}
            >
              <Text style={{ color: colors.light.surface, fontSize: 16, fontWeight: '700' }}>Speichern</Text>
            </Pressable>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </Modal>
  );
}

type CheckinModalProps = {
  visible: boolean;
  onClose: () => void;
  onSubmit: (data: DailyCheckinData) => void;
};

function CheckinModal({ visible, onClose, onSubmit }: CheckinModalProps) {
  const initial = useMemo<Partial<DailyCheckinData>>(
    () => ({ dateISO: new Date().toISOString() }),
    [visible]
  );
  if (!visible) return null;
  return (
    <Modal animationType="slide" visible onRequestClose={onClose}>
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.light.surface }}>
        <FormHeader title="Daily Check-in" onClose={onClose} />
        <ScrollView contentContainerStyle={{ padding: spacing.l, paddingBottom: spacing.xl }}>
          <MultiStepDailyCheckin initial={initial} onSubmit={onSubmit} onCancel={onClose} />
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}

export default function GlobalQuickActions() {
  const insets = useSafeAreaInsets();
  const [menuOpen, setMenuOpen] = useState(false);
  const [activeForm, setActiveForm] = useState<ActionKey | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const profile = useApp((s) => s.profile);
  const dayLogs = useApp((s) => s.dayLogs);
  const upsertDayLog = useApp((s) => s.upsertDayLog);
  const markTaskDone = useApp((s) => s.markTaskDone);
  const quickActionsHidden = useUiStore((s) => s.quickActionsHiddenKeys.length > 0);

  const gramsPerJoint = useMemo(() => {
    if (!profile) return GRAMS_PER_JOINT_DEFAULT;
    if (profile.gramsPerDayBaseline && profile.jointsPerDayBaseline) {
      const ratio = profile.gramsPerDayBaseline / Math.max(1, profile.jointsPerDayBaseline);
      if (Number.isFinite(ratio) && ratio > 0) {
        return ratio;
      }
    }
    return GRAMS_PER_JOINT_DEFAULT;
  }, [profile]);

  useEffect(() => {
    if (!statusMessage) return;
    const timeout = setTimeout(() => setStatusMessage(null), 2200);
    return () => clearTimeout(timeout);
  }, [statusMessage]);

  useEffect(() => {
    if (quickActionsHidden) {
      setMenuOpen(false);
    }
  }, [quickActionsHidden]);

  if (!profile) return null;

  const closeForm = () => setActiveForm(null);

  const submitConsumption = (gramsInput: string, jointsInput: string, minutesInput: string) => {
    const gramsValue = parseNumberInput(gramsInput);
    const jointsValue = parseNumberInput(jointsInput);
    const minutesValue = parseNumberInput(minutesInput);
    const hasGrams = Number.isFinite(gramsValue) && gramsValue > 0;
    const hasJoints = Number.isFinite(jointsValue) && jointsValue > 0;
    if (!hasGrams && !hasJoints) {
      return 'Bitte Menge in Gramm oder Joints angeben.';
    }
    const finalGrams = hasGrams ? gramsValue : jointsValue * gramsPerJoint;
    const finalJoints = hasJoints
      ? jointsValue
      : gramsPerJoint > 0
      ? finalGrams / gramsPerJoint
      : undefined;
    const sessionMinutes = Number.isFinite(minutesValue) && minutesValue > 0 ? minutesValue : 0;
    const key = todayKey();
    const existing = dayLogs[key];
    const next: Partial<DayLog> & { date: string } = {
      date: key,
      consumedGrams: (existing?.consumedGrams ?? 0) + (finalGrams || 0),
    };
    if (typeof finalJoints === 'number' && Number.isFinite(finalJoints)) {
      next.consumedJoints = (existing?.consumedJoints ?? 0) + finalJoints;
    }
    if (sessionMinutes > 0) {
      next.sessionMinutes = (existing?.sessionMinutes ?? 0) + sessionMinutes;
    }
    upsertDayLog({ ...next, lastConsumptionAt: Date.now() });
    setActiveForm(null);
    setStatusMessage('Konsum gespeichert');
    return null;
  };

  const submitPurchase = (amountInput: string) => {
    const amount = parseNumberInput(amountInput);
    if (!Number.isFinite(amount) || amount <= 0) {
      return 'Bitte Betrag größer 0 € eingeben.';
    }
    const key = todayKey();
    const existing = dayLogs[key];
    upsertDayLog({
      date: key,
      moneySpentEUR: (existing?.moneySpentEUR ?? 0) + amount,
    });
    setActiveForm(null);
    setStatusMessage('Einkauf gespeichert');
    return null;
  };

  const submitCheckin = (data: DailyCheckinData) => {
    const key = data.dateISO.slice(0, 10);
    const consumed = data.usedToday ? Math.max(0, data.amountGrams) : 0;
    const next: Partial<DayLog> & { date: string } = {
      date: key,
      consumedGrams: consumed > 0 ? consumed : undefined,
      notes: data.notes,
    };
    if (consumed > 0 && gramsPerJoint > 0) {
      next.consumedJoints = consumed / gramsPerJoint;
    }
    const lastConsumptionTimestamp =
      data.usedToday ? timestampFromDateKey(key, data.uses?.[0]?.time) : undefined;
    upsertDayLog({
      ...next,
      lastConsumptionAt: lastConsumptionTimestamp,
    });
    markTaskDone(key, 'daily-check-in', TASK_XP['daily-check-in'] ?? 0);
    setActiveForm(null);
    setStatusMessage('Check-in gespeichert');
  };

  return (
    <>
      {!quickActionsHidden ? (
        <View
          pointerEvents="box-none"
          style={{
            position: 'absolute',
            right: spacing.xl,
            bottom: (insets.bottom || 0) + 90,
          }}
        >
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Schnellaktionen öffnen"
            onPress={() => setMenuOpen(true)}
            style={({ pressed }) => [
              {
                width: 64,
                height: 64,
                borderRadius: radius.pill,
                backgroundColor: colors.light.primary,
                alignItems: 'center',
                justifyContent: 'center',
                ...shadows.md,
              },
              pressed && { transform: [{ scale: 0.97 }] },
            ]}
          >
            <Ionicons name="add" size={34} color={colors.light.surface} />
          </Pressable>
          {statusMessage ? (
            <View
              style={{
                marginTop: spacing.s,
                backgroundColor: 'rgba(0,0,0,0.75)',
                paddingHorizontal: spacing.m,
                paddingVertical: spacing.s,
                borderRadius: radius.l,
                flexDirection: 'row',
                alignItems: 'center',
                gap: spacing.xs,
              }}
            >
              <Ionicons name="checkmark-circle" size={16} color="#fff" />
              <Text style={{ color: '#fff', fontSize: 13 }}>{statusMessage}</Text>
            </View>
          ) : null}
        </View>
      ) : null}
      <ActionSheet
        visible={menuOpen}
        bottomInset={insets.bottom || 0}
        onClose={() => setMenuOpen(false)}
        onSelect={(key) => {
          setMenuOpen(false);
          setActiveForm(key);
        }}
      />
      <ConsumptionModal
        visible={activeForm === 'consumption'}
        onClose={closeForm}
        onSubmit={submitConsumption}
      />
      <PurchaseModal
        visible={activeForm === 'purchase'}
        onClose={closeForm}
        onSubmit={submitPurchase}
      />
      <CheckinModal visible={activeForm === 'checkin'} onClose={closeForm} onSubmit={submitCheckin} />
    </>
  );
}
