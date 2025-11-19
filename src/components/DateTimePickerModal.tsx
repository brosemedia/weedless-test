import React, { useEffect, useMemo, useState } from 'react';
import { Modal, Platform, Pressable, StyleSheet, Text, UIManager, View } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import {
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  isAfter,
  isBefore,
  isSameDay,
  startOfMonth,
  startOfWeek,
} from 'date-fns';
import { colors, radius, spacing } from '../design/tokens';

type Props = {
  visible: boolean;
  date: Date;
  locale?: string;
  onChange: (date: Date) => void;
  onDismiss: () => void;
  onConfirm: () => void;
  minimumDate?: Date;
  maximumDate?: Date;
};

const pad = (value: number) => String(value).padStart(2, '0');

const clampToBounds = (date: Date, minDate?: Date, maxDate?: Date) => {
  const next = new Date(date);
  if (maxDate && next.getTime() > maxDate.getTime()) {
    return new Date(maxDate);
  }
  if (minDate && next.getTime() < minDate.getTime()) {
    return new Date(minDate);
  }
  return next;
};

const WEEKDAY_LABELS = ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'];

const buildCalendarMatrix = (month: Date) => {
  const start = startOfWeek(startOfMonth(month), { weekStartsOn: 1 });
  const end = endOfWeek(endOfMonth(month), { weekStartsOn: 1 });
  const days = eachDayOfInterval({ start, end });
  const rows: Date[][] = [];
  for (let i = 0; i < days.length; i += 7) {
    rows.push(days.slice(i, i + 7));
  }
  return rows;
};

const stepCircular = (value: number, delta: number, max: number) => {
  const next = (value + delta) % max;
  return next < 0 ? next + max : next;
};

const hasNativeDatePicker =
  Platform.OS !== 'web' &&
  typeof UIManager?.getViewManagerConfig === 'function' &&
  Boolean(UIManager.getViewManagerConfig('RNDateTimePicker'));

export const DateTimePickerModal: React.FC<Props> = ({
  visible,
  date,
  locale,
  onChange,
  onDismiss,
  onConfirm,
  minimumDate,
  maximumDate,
}) => {
  const needsFallback = Platform.OS === 'web' || !hasNativeDatePicker;
  const pickerMode = Platform.OS === 'ios' ? 'datetime' : 'date';
  const pickerDisplay = Platform.OS === 'ios' ? 'spinner' : 'calendar';
  const maxDate = maximumDate ?? new Date();
  const minDate = minimumDate;
  const clampedValue = clampToBounds(date, minDate, maxDate);

  return (
    <Modal transparent animationType="fade" visible={visible} onRequestClose={onDismiss}>
      <View style={styles.modalBackdrop}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onDismiss} />
        <View style={styles.modalCard}>
          {needsFallback ? (
            <FallbackCalendarPicker
              locale={locale || 'de-DE'}
              value={clampedValue}
              onChange={(next) => onChange(clampToBounds(next, minDate, maxDate))}
              minimumDate={minDate}
              maximumDate={maxDate}
            />
          ) : (
            <DateTimePicker
              value={clampedValue}
              mode={pickerMode}
              display={pickerDisplay}
              maximumDate={maxDate}
              minimumDate={minDate}
              onChange={(_event: unknown, selectedDate?: Date) => {
                if (selectedDate) {
                  onChange(clampToBounds(selectedDate, minDate, maxDate));
                }
              }}
              locale={locale}
              style={styles.nativePicker}
            />
          )}
          <View style={styles.modalActions}>
            <Pressable onPress={onDismiss} style={styles.modalActionButton}>
              <Text style={styles.modalActionTextMuted}>Abbrechen</Text>
            </Pressable>
            <Pressable onPress={onConfirm} style={styles.modalActionButton}>
              <Text style={styles.modalActionText}>Übernehmen</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
};

type FallbackCalendarPickerProps = {
  locale: string;
  value: Date;
  onChange: (date: Date) => void;
  minimumDate?: Date;
  maximumDate?: Date;
};

const FallbackCalendarPicker: React.FC<FallbackCalendarPickerProps> = ({
  locale,
  value,
  onChange,
  minimumDate,
  maximumDate,
}) => {
  const [visibleMonth, setVisibleMonth] = useState(startOfMonth(value));
  const [selected, setSelected] = useState(clampToBounds(value, minimumDate, maximumDate));
  const upperBound = maximumDate ?? new Date();
  const lowerBound = minimumDate;
  const calendar = useMemo(() => buildCalendarMatrix(visibleMonth), [visibleMonth]);
  const today = new Date();
  const canGoNextMonth = isBefore(visibleMonth, startOfMonth(upperBound));
  const canGoPrevMonth = !lowerBound || isAfter(visibleMonth, startOfMonth(lowerBound));

  useEffect(() => {
    const normalized = clampToBounds(value, lowerBound, upperBound);
    setSelected(normalized);
    setVisibleMonth(startOfMonth(normalized));
  }, [value, lowerBound?.getTime(), upperBound.getTime()]);

  const updateSelected = (mutator: (draft: Date) => void) => {
    setSelected((prev) => {
      const next = new Date(prev);
      mutator(next);
      const clamped = clampToBounds(next, lowerBound, upperBound);
      onChange(clamped);
      return clamped;
    });
  };

  const handleSelectDay = (day: Date) => {
    if (isAfter(day, upperBound)) return;
    if (lowerBound && isBefore(day, lowerBound)) return;
    updateSelected((draft) => {
      draft.setFullYear(day.getFullYear(), day.getMonth(), day.getDate());
    });
    setVisibleMonth(startOfMonth(day));
  };

  const handleMonthChange = (delta: number) => {
    if (delta > 0 && !canGoNextMonth) return;
    if (delta < 0 && !canGoPrevMonth) return;
    setVisibleMonth((prev) => addMonths(prev, delta));
  };

  const adjustHour = (delta: number) => {
    updateSelected((draft) => {
      const nextHour = stepCircular(draft.getHours(), delta, 24);
      draft.setHours(nextHour);
    });
  };

  const adjustMinute = (delta: number) => {
    updateSelected((draft) => {
      const nextMinute = stepCircular(draft.getMinutes(), delta, 60);
      draft.setMinutes(nextMinute);
    });
  };

  const handleSetNow = () => {
    const now = clampToBounds(new Date(), lowerBound, upperBound);
    setSelected(now);
    setVisibleMonth(startOfMonth(now));
    onChange(now);
  };

  const summary = new Intl.DateTimeFormat(locale, {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(selected);

  return (
    <View style={styles.fallbackPicker}>
      <Text style={styles.fallbackSummary}>{summary}</Text>
      <View style={styles.calendarHeader}>
        <Pressable
          style={[styles.calendarHeaderButton, !canGoPrevMonth && styles.disabledButton]}
          onPress={() => handleMonthChange(-1)}
          disabled={!canGoPrevMonth}
        >
          <Text style={styles.calendarHeaderTitle}>‹</Text>
        </Pressable>
        <Text style={styles.calendarHeaderTitle}>
          {new Intl.DateTimeFormat(locale, {
            month: 'long',
            year: 'numeric',
          }).format(visibleMonth)}
        </Text>
        <Pressable
          style={[styles.calendarHeaderButton, !canGoNextMonth && styles.disabledButton]}
          onPress={() => handleMonthChange(1)}
          disabled={!canGoNextMonth}
        >
          <Text style={styles.calendarHeaderTitle}>›</Text>
        </Pressable>
      </View>
      <View style={styles.weekdayRow}>
        {WEEKDAY_LABELS.map((label) => (
          <Text key={label} style={styles.weekdayLabel}>
            {label}
          </Text>
        ))}
      </View>
      {calendar.map((week, index) => (
        <View key={index} style={styles.weekRow}>
          {week.map((day) => {
            const inMonth = day.getMonth() === visibleMonth.getMonth();
            const disabled = isAfter(day, upperBound) || (lowerBound ? isBefore(day, lowerBound) : false);
            const selectedDay = isSameDay(day, selected);
            const isToday = isSameDay(day, today);

            return (
              <Pressable
                key={day.toISOString()}
                style={[
                  styles.dayCell,
                  !inMonth && styles.dayCellMuted,
                  selectedDay && styles.dayCellSelected,
                  isToday && !selectedDay && styles.dayCellToday,
                  disabled && styles.dayCellDisabled,
                ]}
                onPress={() => handleSelectDay(day)}
                disabled={disabled}
              >
                <Text
                  style={[
                    styles.dayCellText,
                    selectedDay && styles.dayCellSelectedText,
                    (!inMonth || disabled) && styles.dayCellMutedText,
                  ]}
                >
                  {day.getDate()}
                </Text>
              </Pressable>
            );
          })}
        </View>
      ))}
      <View style={styles.timeSection}>
        <View style={styles.timeSectionHeader}>
          <Text style={styles.timeSectionLabel}>Uhrzeit</Text>
          <Pressable onPress={handleSetNow} style={styles.quickActionButton}>
            <Text style={styles.quickActionText}>Jetzt</Text>
          </Pressable>
        </View>
        <View style={styles.timeControls}>
          <TimeStepper label="Stunde" value={selected.getHours()} onIncrement={() => adjustHour(1)} onDecrement={() => adjustHour(-1)} />
          <TimeStepper
            label="Minute"
            value={selected.getMinutes()}
            onIncrement={() => adjustMinute(5)}
            onDecrement={() => adjustMinute(-5)}
          />
        </View>
      </View>
    </View>
  );
};

type TimeStepperProps = {
  label: string;
  value: number;
  onIncrement: () => void;
  onDecrement: () => void;
};

const TimeStepper: React.FC<TimeStepperProps> = ({ label, value, onIncrement, onDecrement }) => (
  <View style={styles.stepper}>
    <Text style={styles.stepperLabel}>{label}</Text>
    <View style={styles.stepperRow}>
      <Pressable onPress={onDecrement} style={styles.stepperButton}>
        <Text style={styles.stepperButtonText}>–</Text>
      </Pressable>
      <Text style={styles.stepperValue}>{pad(value)}</Text>
      <Pressable onPress={onIncrement} style={styles.stepperButton}>
        <Text style={styles.stepperButtonText}>+</Text>
      </Pressable>
    </View>
  </View>
);

const styles = StyleSheet.create({
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.l,
  },
  modalCard: {
    width: '100%',
    backgroundColor: '#fff',
    borderRadius: radius.l,
    padding: spacing.m,
    shadowColor: '#000',
    shadowOpacity: 0.18,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 8 },
    elevation: 10,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: spacing.m,
    marginTop: spacing.m,
  },
  modalActionButton: {
    paddingHorizontal: spacing.m,
    paddingVertical: spacing.s,
  },
  modalActionText: {
    color: colors.light.primary,
    fontWeight: '600',
  },
  modalActionTextMuted: {
    color: colors.light.textMuted,
  },
  nativePicker: {
    width: '100%',
    height: Platform.OS === 'ios' ? 220 : undefined,
  },
  fallbackPicker: {
    width: '100%',
    gap: spacing.m,
  },
  fallbackSummary: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.light.text,
  },
  calendarHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  calendarHeaderButton: {
    padding: spacing.s,
  },
  calendarHeaderTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.light.text,
  },
  weekdayRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  weekdayLabel: {
    flex: 1,
    textAlign: 'center',
    fontSize: 12,
    color: colors.light.textMuted,
  },
  weekRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  dayCell: {
    flex: 1,
    margin: 2,
    borderRadius: radius.s,
    paddingVertical: 10,
    alignItems: 'center',
  },
  dayCellText: {
    fontSize: 15,
    color: colors.light.text,
  },
  dayCellMutedText: {
    color: colors.light.textMuted,
  },
  dayCellMuted: {
    opacity: 0.5,
  },
  dayCellSelected: {
    backgroundColor: colors.light.primary,
  },
  dayCellSelectedText: {
    color: '#fff',
    fontWeight: '600',
  },
  dayCellToday: {
    borderWidth: 1,
    borderColor: colors.light.primary,
  },
  dayCellDisabled: {
    opacity: 0.3,
  },
  timeSection: {
    gap: spacing.s,
  },
  timeSectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  timeSectionLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.light.text,
  },
  timeControls: {
    flexDirection: 'row',
    gap: spacing.m,
  },
  stepper: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.light.border,
    borderRadius: radius.m,
    padding: spacing.s,
  },
  stepperLabel: {
    fontSize: 12,
    textTransform: 'uppercase',
    color: colors.light.textMuted,
    marginBottom: 6,
  },
  stepperRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  stepperButton: {
    paddingHorizontal: spacing.s,
    paddingVertical: spacing.xs,
  },
  stepperButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.light.primary,
  },
  stepperValue: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.light.text,
  },
  quickActionButton: {
    paddingHorizontal: spacing.s,
    paddingVertical: spacing.xs,
  },
  quickActionText: {
    color: colors.light.primary,
    fontWeight: '600',
  },
  disabledButton: {
    opacity: 0.3,
  },
});

export const hasCalendarNativeSupport = hasNativeDatePicker;
