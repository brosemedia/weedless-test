import React from 'react';
import { Modal, View, Text, Pressable, StyleSheet } from 'react-native';
import { HapticSlider } from '../src/onboarding/components/HapticSlider';
import { toDateKey } from '../src/lib/pause';
import { useApp } from '../src/store/app';
import { useTheme } from '../src/theme/useTheme';
import { spacing, radius } from '../src/design/tokens';
import type { DayCheckin } from '../src/types/profile';

type MoodSliderModalProps = {
  visible: boolean;
  onClose: () => void;
};

const getMoodEmoji = (value: number): string => {
  if (value <= 1.5) return '😢';
  if (value <= 2.5) return '😔';
  if (value <= 3.5) return '😐';
  if (value <= 4.5) return '🙂';
  return '😊';
};

const getMoodLabel = (value: number): string => {
  if (value <= 1.5) return 'Sehr schlecht';
  if (value <= 2.5) return 'Schlecht';
  if (value <= 3.5) return 'Okay';
  if (value <= 4.5) return 'Gut';
  return 'Sehr gut';
};

export function MoodSliderModal({ visible, onClose }: MoodSliderModalProps) {
  const { theme } = useTheme();
  const colors = theme.colors;
  const upsertDayLog = useApp((s) => s.upsertDayLog);
  const dayLogs = useApp((s) => s.dayLogs);
  const todayKey = toDateKey(new Date());
  const todayLog = dayLogs[todayKey];
  const currentMood = todayLog?.checkin?.mood1to5;
  const initialMood =
    typeof currentMood === 'number' && currentMood >= 1 && currentMood <= 5 ? currentMood : 3;
  const [mood, setMood] = React.useState(initialMood);

  React.useEffect(() => {
    setMood(initialMood);
  }, [initialMood, visible]);

  const emoji = React.useMemo(() => getMoodEmoji(mood), [mood]);
  const label = React.useMemo(() => getMoodLabel(mood), [mood]);

  const handleSave = React.useCallback(() => {
    const existing: Partial<DayCheckin> = todayLog?.checkin ?? {};
    const normalizedCheckin = {
      ...existing,
      usedToday: existing.usedToday ?? false,
      amountGrams: existing.amountGrams ?? 0,
      cravings0to10: existing.cravings0to10 ?? 0,
      sleepHours: existing.sleepHours ?? 0,
      mood1to5: Math.round(mood),
      recordedAt: Date.now(),
    };
    upsertDayLog({
      date: todayKey,
      checkin: normalizedCheckin,
    });
    onClose();
  }, [mood, onClose, todayKey, todayLog, upsertDayLog]);

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <Pressable style={styles.backdrop} onPress={onClose} />
        <View
          style={[
            styles.modal,
            { backgroundColor: colors.surface, borderColor: colors.border, shadowColor: colors.text },
          ]}
        >
          <Text style={[styles.title, { color: colors.text }]}>Stimmung eintragen</Text>
          <View style={styles.emojiContainer}>
            <Text style={styles.emoji}>{emoji}</Text>
            <Text style={[styles.label, { color: colors.textMuted }]}>{label}</Text>
          </View>
          <HapticSlider
            value={mood}
            onValueChange={setMood}
            minimumValue={1}
            maximumValue={5}
            step={1}
            formatValue={(v) => `${Math.round(v)}/5`}
          />
          <View style={styles.buttonRow}>
            <Pressable
              style={[styles.button, styles.secondaryButton, { borderColor: colors.border }]}
              onPress={onClose}
            >
              <Text style={[styles.buttonText, { color: colors.text }]}>Abbrechen</Text>
            </Pressable>
            <Pressable
              style={[styles.button, styles.primaryButton, { backgroundColor: colors.primary }]}
              onPress={handleSave}
            >
              <Text style={[styles.buttonText, { color: colors.surface }]}>Speichern</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.l,
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
  modal: {
    width: '100%',
    maxWidth: 440,
    borderRadius: radius.xl,
    padding: spacing.l,
    borderWidth: 1,
    shadowOpacity: 0.18,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 10 },
    elevation: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: spacing.m,
  },
  emojiContainer: {
    alignItems: 'center',
    gap: spacing.xs,
    marginBottom: spacing.m,
  },
  emoji: {
    fontSize: 64,
    lineHeight: 72,
  },
  label: {
    fontSize: 15,
    fontWeight: '600',
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: spacing.s,
    marginTop: spacing.m,
  },
  button: {
    paddingHorizontal: spacing.l,
    paddingVertical: spacing.s,
    borderRadius: radius.m,
    minWidth: 110,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryButton: {
    borderWidth: 1,
  },
  primaryButton: {},
  buttonText: {
    fontSize: 15,
    fontWeight: '700',
  },
});
