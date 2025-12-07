import React from 'react';
import { Modal, View, Text, Pressable, StyleSheet } from 'react-native';
import { HapticSlider } from '../src/onboarding/components/HapticSlider';
import { toDateKey } from '../src/lib/pause';
import { useApp } from '../src/store/app';
import { useTheme } from '../src/theme/useTheme';
import { spacing, radius } from '../src/design/tokens';

type SleepSliderModalProps = {
  visible: boolean;
  onClose: () => void;
};

const getSleepEmoji = (hours: number): string => {
  if (hours < 5) return '😴';
  if (hours < 7) return '😪';
  if (hours < 9) return '😌';
  return '😊';
};

const getSleepLabel = (hours: number): string => {
  if (hours < 5) return 'Sehr kurz';
  if (hours < 7) return 'Kurz';
  if (hours < 9) return 'Erholt';
  return 'Ausgeschlafen';
};

export function SleepSliderModal({ visible, onClose }: SleepSliderModalProps) {
  const { theme } = useTheme();
  const colors = theme.colors;
  const upsertDayLog = useApp((s) => s.upsertDayLog);
  const dayLogs = useApp((s) => s.dayLogs);
  const todayKey = toDateKey(new Date());
  const todayLog = dayLogs[todayKey];
  const currentSleep = todayLog?.checkin?.sleepHours;
  const initialSleep =
    typeof currentSleep === 'number' && currentSleep > 0 && currentSleep <= 24 ? currentSleep : 7;
  const [sleepHours, setSleepHours] = React.useState(initialSleep);

  React.useEffect(() => {
    setSleepHours(initialSleep);
  }, [initialSleep, visible]);

  const emoji = React.useMemo(() => getSleepEmoji(sleepHours), [sleepHours]);
  const label = React.useMemo(() => getSleepLabel(sleepHours), [sleepHours]);

  const handleSave = React.useCallback(() => {
    const existing = todayLog?.checkin ?? {};
    const roundedSleep = Math.max(0, Math.min(24, Math.round(sleepHours * 10) / 10));
    const normalizedCheckin = {
      ...existing,
      usedToday: existing.usedToday ?? false,
      amountGrams: existing.amountGrams ?? 0,
      cravings0to10: existing.cravings0to10 ?? 0,
      mood1to5: existing.mood1to5 ?? 3,
      sleepHours: roundedSleep,
      recordedAt: Date.now(),
    };
    upsertDayLog({
      date: todayKey,
      checkin: normalizedCheckin,
    });
    onClose();
  }, [sleepHours, todayKey, todayLog, upsertDayLog, onClose]);

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
          <Text style={[styles.title, { color: colors.text }]}>Schlaf eintragen</Text>
          <View style={styles.emojiContainer}>
            <Text style={styles.emoji}>{emoji}</Text>
            <Text style={[styles.label, { color: colors.textMuted }]}>{label}</Text>
          </View>
          <HapticSlider
            value={sleepHours}
            onValueChange={setSleepHours}
            minimumValue={1}
            maximumValue={10}
            step={0.5}
            formatValue={(v) => `${(Math.round(v * 10) / 10).toFixed(1)} h`}
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
