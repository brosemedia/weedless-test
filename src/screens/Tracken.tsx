import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ScrollView, View, Text, Pressable, StyleSheet, Modal, Image, ImageBackground, Animated, FlatList } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useIsFocused, useNavigation } from '@react-navigation/native';
import {
  addDays,
  addWeeks,
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isBefore,
  isAfter,
  isSameDay,
  isSameMonth,
  startOfDay,
  startOfMonth,
  startOfWeek,
  subMonths,
  isValid,
} from 'date-fns';
import { de, enUS } from 'date-fns/locale';
import { Ionicons } from '@expo/vector-icons';
import HeroFigure from '../../assets/1900_81.svg';
import { colors, spacing, radius, shadows } from '../design/tokens';
import { HEADER_TOTAL_HEIGHT } from '../components/AppHeader';
import CheckForm, { type DailyCheckinData } from '../components/MultiStepDailyCheckin';
import { useApp } from '../store/app';
import { useQuickActionsVisibility } from '../hooks/useQuickActionsVisibility';
import { useHeaderTransparency } from '../hooks/useHeaderTransparency';
import { usePauseEngine } from '../hooks/usePauseEngine';
import { TASK_XP, TaskKey } from '../lib/tasks';
import StroopGame from '../games/stroop/StroopGame';
import { getLastStroopSummary, type SessionSummary } from '../games/stroop/storage';
import type { DayLog } from '../types/profile';
import { FrostedSurface } from '../design/FrostedSurface';
import { dayKeysBetween, parseDateKey } from '../lib/pause';
import { createConsumptionEntry } from '../lib/consumption';
import { useUiStore } from '../store/ui';
import { useTheme } from '../theme/useTheme';
import type { ThemeColors, ThemeMode } from '../theme/themes';

const AMBIENT_BG = require('../../assets/ambient_bg.png');

type TaskId = TaskKey;

type TaskDefinition = {
  id: TaskId;
  title: string;
  subtitle?: string;
  kind: 'minigame' | 'tracking';
  info?: string;
};

const TASKS: TaskDefinition[] = [
  { id: 'reaction-test', title: 'Reaktionstest', subtitle: 'Tap Game', kind: 'minigame' },
  {
    id: 'stroop-focus',
    title: 'Stroop Focus',
    subtitle: 'Aufmerksamkeit • Inhibition',
    info: 'Trainiere Fokus. Miss deine Reaktionszeit.',
    kind: 'minigame',
  },
  { id: 'breathing-session', title: 'Atemübung', subtitle: '5 Minuten Ruhe', kind: 'minigame' },
  { id: 'zen-glide', title: 'ZenGlide', subtitle: 'Kurzer Flow', kind: 'minigame' },
  { id: 'mind-house', title: 'Mind House', subtitle: 'Fokus trainieren', kind: 'minigame' },
  {
    id: 'number-flow',
    title: 'Number Flow',
    subtitle: 'Mentale Rechenkette',
    kind: 'minigame',
  },
  { id: 'daily-check-in', title: 'Check-in', subtitle: 'Gefühl & Konsum notieren', kind: 'tracking' },
] as const;

const TASK_LABELS: Record<TaskId, string> = TASKS.reduce((acc, task) => {
  acc[task.id] = task.title;
  return acc;
}, {} as Record<TaskId, string>);

const ICONS: Record<TaskId, keyof typeof Ionicons.glyphMap> = {
  'reaction-test': 'flash-outline',
  'stroop-focus': 'color-filter-outline',
  'breathing-session': 'heart-outline',
  'zen-glide': 'paper-plane-outline',
  'mind-house': 'home-outline',
  'number-flow': 'calculator-outline',
  'daily-check-in': 'calendar-outline',
};

const lt = colors.light;
const sp = spacing;
const CONSUMED_ICON = require('../../assets/cannabis_icons/Cannabis_4.png');
const THC_FREE_ICON = require('../../assets/cannabis_icons/Cannabis_15.png');

type LocaleInfo = {
  locale: Locale;
  weekStartsOn: 0 | 1;
  shortDateFormat: string;
  longDateA11yFormat: string;
};

type Locale = typeof de;

const resolveLocaleInfo = (profileLocale?: string): LocaleInfo => {
  const deviceLocale = Intl.DateTimeFormat().resolvedOptions().locale ?? 'de-DE';
  const tag = (profileLocale || deviceLocale || 'de-DE').toLowerCase();
  const isEnglish = tag.startsWith('en');
  return {
    locale: isEnglish ? enUS : de,
    weekStartsOn: isEnglish ? 0 : 1,
    shortDateFormat: isEnglish ? 'MM/dd' : 'dd.MM.',
    longDateA11yFormat: isEnglish ? 'PPPP' : 'PPPP',
  };
};

const weekdayLabels = (weekStartsOn: 0 | 1, locale: Locale) => {
  const start = startOfWeek(new Date(), { weekStartsOn });
  return Array.from({ length: 7 }, (_, idx) => format(addDays(start, idx), 'EEEEE', { locale }));
};

const normalizeStartDate = (timestamp?: number | null) => {
  if (!timestamp) return null;
  const ms = timestamp < 10_000_000_000 ? timestamp * 1000 : timestamp;
  const date = startOfDay(new Date(ms));
  return isValid(date) ? date : null;
};

const timestampFromKey = (dateKey: string, time?: string) => {
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

const formatKey = (date: Date) => format(date, 'yyyy-MM-dd');

const buildMonthDays = (monthStart: Date, weekStartsOn: 0 | 1) => {
  const start = startOfWeek(monthStart, { weekStartsOn });
  const end = endOfWeek(endOfMonth(monthStart), { weekStartsOn });
  return eachDayOfInterval({ start, end });
};

const MONTH_DAY_WIDTH = `${100 / 7}%`;
const ACTIVITY_ICONS: Record<string, keyof typeof Ionicons.glyphMap> = {
  Aufgaben: 'checkmark-done-outline',
  Konsum: 'leaf-outline',
  Ausgaben: 'wallet-outline',
  Sessions: 'time-outline',
  Tests: 'pulse-outline',
  Notizen: 'document-text-outline',
  XP: 'star-outline',
  'Check-in': 'clipboard-outline',
};

const DAY_ITEM_WIDTH = 68;
const DAY_ITEM_STEP = DAY_ITEM_WIDTH + 8;
const DAY_ROW_INSET = spacing.s as number;

function LegendDot({ color, label }: { color: string; label: string }) {
  return (
    <View style={styles.legendItem}>
      <View style={[styles.legendDot, { backgroundColor: color }]} />
      <Text style={styles.legendLabel}>{label}</Text>
    </View>
  );
}

const formatNumber = (value: number, maximumFractionDigits = 1) =>
  value.toLocaleString('de-DE', {
    minimumFractionDigits: 0,
    maximumFractionDigits,
  });

const getActivityIcon = (label: string): keyof typeof Ionicons.glyphMap =>
  ACTIVITY_ICONS[label] ?? 'ellipse-outline';

type ActivityEntryDetail = {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string;
};

type ActivityEntry = {
  label: string;
  value?: string;
  details?: ActivityEntryDetail[];
};

const activityEntriesForLog = (log?: DayLog): ActivityEntry[] => {
  if (!log) return [];
  const entries: ActivityEntry[] = [];
  if (log.tasksDone?.length) {
    const names = log.tasksDone.map((id) => TASK_LABELS[id as TaskId] ?? id).join(', ');
    entries.push({ label: 'Aufgaben', value: names });
  }
  const grams = log.consumedGrams ?? 0;
  const joints = log.consumedJoints ?? 0;
  if (grams > 0 || joints > 0) {
    const parts = [] as string[];
    if (grams > 0) parts.push(`${formatNumber(grams)} g`);
    if (joints > 0) parts.push(`${formatNumber(joints, 2)} Joints`);
    entries.push({ label: 'Konsum', value: parts.join(' · ') });
  }
  if ((log.moneySpentEUR ?? 0) > 0) {
    entries.push({ label: 'Ausgaben', value: `${formatNumber(log.moneySpentEUR ?? 0, 2)} €` });
  }
  if ((log.sessionMinutes ?? 0) > 0) {
    entries.push({ label: 'Sessions', value: `${formatNumber(log.sessionMinutes ?? 0, 0)} Minuten` });
  }
  if (log.checkin) {
    const detailRows: ActivityEntryDetail[] = [
      {
        icon: log.checkin.usedToday ? 'leaf' : 'shield-checkmark',
        label: 'Status',
        value: log.checkin.usedToday
          ? `Konsumiert (${formatNumber(log.checkin.amountGrams, 2)} g)`
          : 'Konsumfrei',
      },
      {
        icon: 'happy-outline',
        label: 'Stimmung',
        value: `${log.checkin.mood1to5}/5`,
      },
      {
        icon: 'flame-outline',
        label: 'Suchtdruck',
        value: `${log.checkin.cravings0to10}/10`,
      },
      {
        icon: 'moon-outline',
        label: 'Schlaf',
        value: `${formatNumber(log.checkin.sleepHours, 1)} h`,
      },
    ];
    if (log.checkin.notes) {
      detailRows.push({
        icon: 'document-text-outline',
        label: 'Notizen',
        value: log.checkin.notes,
      });
    }
    entries.push({ label: 'Check-in', details: detailRows });
  }
  const testDetails: string[] = [];
  if (typeof log.tests?.reactionMs === 'number') {
    testDetails.push(`${Math.round(log.tests.reactionMs)} ms Reaktion`);
  }
  if (typeof log.tests?.memoryScore === 'number') {
    testDetails.push(`${log.tests.memoryScore} Memory`);
  }
  if (
    typeof log.tests?.stroopAccuracy === 'number' &&
    typeof log.tests?.stroopMeanRt === 'number'
  ) {
    const accuracyPct = Math.round(log.tests.stroopAccuracy * 100);
    const rtMs = Math.round(log.tests.stroopMeanRt);
    testDetails.push(`Stroop Focus: ${accuracyPct}% • ${rtMs} ms`);
  }
  if (testDetails.length) {
    entries.push({ label: 'Tests', value: testDetails.join(' · ') });
  }
  if (log.notes) {
    entries.push({ label: 'Notizen', value: log.notes });
  }
  if ((log.xpEarned ?? 0) > 0) {
    entries.push({ label: 'XP', value: `${log.xpEarned} XP` });
  }
  return entries;
};

type DayChipProps = {
  date: Date;
  selected: boolean;
  weekdayLabel: string;
  hasConsumption: boolean;
  showStatusIcon: boolean;
  onPress: () => void;
  isBeforeStart?: boolean;
  indicatorColor?: string;
};

function DayChip({
  date,
  selected,
  weekdayLabel,
  hasConsumption,
  showStatusIcon,
  onPress,
  isBeforeStart,
  indicatorColor,
}: DayChipProps) {
  const { theme } = useTheme();
  const palette = theme.colors;
  const dayNumber = format(date, 'd');

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      style={[styles.dayChipCompact, { width: DAY_ITEM_WIDTH }, selected && styles.dayChipCompactSelected]}
    >
      <Text
        style={[
          styles.dayWeekLabel,
          { color: palette.textMuted },
          selected && { color: palette.text },
        ]}
      >
        {weekdayLabel}
      </Text>
      <View 
        style={[
          styles.dayNumberBox, 
          { backgroundColor: palette.surfaceMuted },
          selected && [styles.dayNumberBoxSelected, { backgroundColor: palette.primary }],
        ]}
      >
        <Text 
          style={[
            styles.dayNumberCompact, 
            { color: palette.text },
            selected && styles.dayNumberCompactSelected,
          ]}
        >
          {dayNumber}
        </Text>
      </View>
      {showStatusIcon && indicatorColor ? (
        <View style={[styles.dayIndicatorDot, { backgroundColor: indicatorColor }]} />
      ) : (
        <View style={styles.dayIndicatorSpacer} />
      )}
    </Pressable>
  );
}

type TaskCardProps = {
  task: TaskDefinition;
  completed: boolean;
  disabled?: boolean;
  onPress?: () => void;
  infoText?: string;
  chipLabel?: string;
  testID?: string;
};

function TaskCard({ task, completed, disabled, onPress, infoText, chipLabel, testID }: TaskCardProps) {
  const interactive = Boolean(onPress) && !disabled;
  const xp = TASK_XP[task.id] ?? 0;
  const secondary = disabled ? 'Nur heute möglich' : completed ? 'Starker Move' : 'Dranbleiben';
  const ctaLabel = completed ? 'Geschafft' : 'Tippen & starten';
  const iconColor = completed ? lt.surface : lt.text;
  const icon =
    task.id === 'zen-glide' ? (
      <HeroFigure width={28} height={28} />
    ) : (
      <Ionicons name={ICONS[task.id]} size={26} color={iconColor} />
    );
  const xpBadge = (
    <View style={styles.taskXpWrap}>
      <View style={[styles.xpPill, completed && styles.xpPillDone]}>
        <Text style={[styles.xpPillText, completed && styles.xpPillTextDone]}>+{xp} XP</Text>
      </View>
    </View>
  );

  const cardContent = (
    <View style={styles.taskContent}>
      <View style={[styles.taskIcon, completed && styles.taskIconDone]}>{icon}</View>
      <Text style={[styles.taskTitle, completed && styles.taskTitleDone]} numberOfLines={2}>
        {task.title}
      </Text>
      <View style={styles.taskMeta}>
        <Text style={[styles.taskFootnote, completed && styles.taskFootnoteDone]}>{secondary}</Text>
        <View style={styles.taskActionRow}>
          <View style={styles.taskActionInfo}>
            <Text
              style={[
                styles.taskActionLabel,
                completed && styles.taskActionLabelDone,
                disabled && styles.taskActionLabelDisabled,
              ]}
            >
              {ctaLabel}
            </Text>
          </View>
        </View>
        <View style={styles.playButtonRow}>
          <Ionicons
            name={completed ? 'checkmark-circle' : 'play-circle'}
            size={44}
            color={disabled ? lt.textMuted : completed ? lt.surface : lt.text}
          />
        </View>
        {chipLabel ? (
          <View style={[styles.taskChip, completed && styles.taskChipDone]}>
            <Text style={[styles.taskChipText, completed && styles.taskChipTextDone]}>{chipLabel}</Text>
          </View>
        ) : null}
      </View>
    </View>
  );
  return (
    <Pressable
      onPress={interactive ? onPress : undefined}
      disabled={!interactive}
      accessibilityRole="button"
      accessibilityLabel={task.title}
      style={({ pressed }) => [
        styles.taskCard,
        pressed && interactive && styles.taskCardPressed,
        !interactive && styles.taskCardDisabled,
      ]}
      testID={testID}
    >
      <View style={styles.taskCardBody}>
        {xpBadge}
        {completed === true ? (
          <View style={[styles.taskInner, styles.taskInnerDone]}>
            {cardContent}
          </View>
        ) : (
          <FrostedSurface
            borderRadius={radius.l}
            intensity={70}
            fallbackColor="#ffffff"
            overlayColor="rgba(255,255,255,0.95)"
            tint="light"
            style={[styles.taskInner, styles.taskInnerBlur]}
          >
            {cardContent}
          </FrostedSurface>
        )}
      </View>
    </Pressable>
  );
}

type CalendarOverviewModalProps = {
  visible: boolean;
  onClose: () => void;
  onSelectDate: (day: Date) => void;
  dayLogs: Record<string, DayLog>;
  pauseMap?: Record<string, 'active' | 'past'>;
  userStartDate?: Date | null;
  localeInfo: LocaleInfo;
};

function CalendarOverviewModal({
  visible,
  onClose,
  onSelectDate,
  dayLogs,
  pauseMap,
  userStartDate,
  localeInfo,
}: CalendarOverviewModalProps) {
  useQuickActionsVisibility('tracken-calendar', visible);
  const insets = useSafeAreaInsets();
  const { theme } = useTheme();
  const palette = theme.colors;
  const [calendarAnchor, setCalendarAnchor] = useState(() => new Date());
  const [focusedDate, setFocusedDate] = useState(() => new Date());
  const [activityDate, setActivityDate] = useState<Date | null>(null);
  const [activityModalVisible, setActivityModalVisible] = useState(false);
  const [monthBlockHeight, setMonthBlockHeight] = useState<number | null>(null);
  const scrollRef = useRef<ScrollView>(null);
  const initialScrollDone = useRef(false);
  const lastTapRef = useRef<{ date: Date; ts: number } | null>(null);

  const { locale, weekStartsOn } = localeInfo ?? resolveLocaleInfo();
  const today = startOfDay(new Date());

  const { journeyStart, journeyEnd } = useMemo(() => {
    const logDates = Object.keys(dayLogs)
      .map((key) => startOfDay(parseDateKey(key)))
      .filter((d) => !Number.isNaN(d.getTime()));
    const earliestLog = logDates.length ? logDates.reduce((a, b) => (isBefore(a, b) ? a : b)) : null;
    const latestLog = logDates.length ? logDates.reduce((a, b) => (isBefore(a, b) ? b : a)) : null;
    const start = userStartDate ?? earliestLog ?? today;
    const end = latestLog && isBefore(today, latestLog) ? latestLog : today;
    return { journeyStart: startOfDay(start), journeyEnd: startOfDay(end) };
  }, [dayLogs, userStartDate, today]);

  const consumedKeys = useMemo(
    () =>
      new Set(
        Object.entries(dayLogs)
          .filter(([, log]) => (log?.consumedGrams ?? 0) > 0 || (log?.consumedJoints ?? 0) > 0)
          .map(([key]) => key)
      ),
    [dayLogs]
  );

  const isConsumedDay = (day: Date) => consumedKeys.has(formatKey(day));

  const horizonEnd = useMemo(() => startOfMonth(addMonths(today, 12)), [today]);

  const monthStarts = useMemo(() => {
    const startMonth = startOfMonth(journeyStart);
    const months: Date[] = [];
    let cursor = startMonth;
    while (!isAfter(cursor, horizonEnd)) {
      months.push(cursor);
      cursor = addMonths(cursor, 1);
    }
    return months;
  }, [journeyStart, horizonEnd]);

  const currentStreak = useMemo(() => {
    let streak = 0;
    let cursor = today;
    while (!isBefore(cursor, journeyStart)) {
      if (isConsumedDay(cursor)) break;
      streak += 1;
      cursor = addDays(cursor, -1);
    }
    return streak;
  }, [journeyStart, today, consumedKeys]);

  const longestStreak = useMemo(() => {
    let best = 0;
    let run = 0;
    eachDayOfInterval({ start: journeyStart, end: journeyEnd }).forEach((day) => {
      if (isConsumedDay(day)) {
        run = 0;
      } else {
        run += 1;
        best = Math.max(best, run);
      }
    });
    return best;
  }, [journeyStart, journeyEnd, consumedKeys]);

  useEffect(() => {
    if (!visible) return;
    const now = new Date();
    setCalendarAnchor(now);
    setFocusedDate(now);
  }, [visible]);

  useEffect(() => {
    if (visible) {
      setActivityDate(null);
      setActivityModalVisible(false);
      initialScrollDone.current = false;
    }
  }, [visible]);

  useEffect(() => {
    if (!visible || !monthBlockHeight || initialScrollDone.current) return;
    initialScrollDone.current = true;
    requestAnimationFrame(() => {
      const currentMonthIdx = monthStarts.findIndex((m) => isSameMonth(m, today));
      const targetIdx = currentMonthIdx >= 0 ? currentMonthIdx : monthStarts.length - 1;
      scrollRef.current?.scrollTo({ y: targetIdx * monthBlockHeight, animated: false });
    });
  }, [visible, monthBlockHeight, monthStarts, today]);

  const handleDayPress = (day: Date) => {
    const nowTs = Date.now();
    const isDoubleTap =
      lastTapRef.current && isSameDay(day, lastTapRef.current.date) && nowTs - lastTapRef.current.ts < 450;
    setFocusedDate(day);
    onSelectDate(day);
    if (isDoubleTap) {
      setActivityDate(day);
      setActivityModalVisible(true);
    }
    lastTapRef.current = { date: day, ts: nowTs };
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="fullScreen"
      onRequestClose={onClose}
    >
      <View
        style={[
          styles.calendarModalScreen,
          {
              backgroundColor: palette.background,
            paddingTop: insets.top + sp.l,
            paddingBottom: Math.max(sp.m as number, insets.bottom + sp.s) + 16,
          },
        ]}
      >
        <View style={styles.calendarModalHeader}>
          <View>
            <Text style={[styles.calendarModalTitle, { color: palette.text }]}>Kalender</Text>
            <Text style={[styles.calendarModalSubtitle, { color: palette.textMuted }]}>
              Alle Aktivitäten im Überblick
            </Text>
          </View>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Kalender schließen"
            onPress={onClose}
            hitSlop={8}
            style={({ pressed }) => [
              styles.modalCloseBtn,
              { backgroundColor: palette.surfaceMuted, borderColor: palette.border, borderWidth: StyleSheet.hairlineWidth },
              pressed && styles.modalCloseBtnPressed,
            ]}
          >
            <Ionicons name="close" size={22} color={palette.text} />
          </Pressable>
        </View>
        <View style={[styles.calendarLegendRow, { backgroundColor: palette.surface, borderColor: palette.border }]}>
          <LegendDot color={palette.primary} label="Aktuelle Pause" />
          <LegendDot color="rgba(16,104,74,0.35)" label="Vergangene Pause" />
          <LegendDot color="#f59e0b" label="Konsum" />
          <LegendDot color="#22c55e" label="Konsumfrei" />
        </View>
        <View
          style={[
            styles.calendarSummary,
            { backgroundColor: palette.surface, borderColor: palette.border },
          ]}
        >
          <View style={styles.calendarSummaryItem}>
            <Text style={[styles.calendarSummaryLabel, { color: palette.textMuted }]}>Aktuelle Pause</Text>
            <Text style={[styles.calendarSummaryValue, { color: palette.text }]}>{currentStreak} Tage</Text>
          </View>
          <View style={styles.calendarSummaryDivider} />
          <View style={styles.calendarSummaryItem}>
            <Text style={[styles.calendarSummaryLabel, { color: palette.textMuted }]}>Längste Pause</Text>
            <Text style={[styles.calendarSummaryValue, { color: palette.text }]}>{longestStreak} Tage</Text>
          </View>
        </View>
        <ScrollView
          ref={scrollRef}
          style={styles.calendarModalScroll}
          contentContainerStyle={[
            styles.calendarModalScrollContent,
            { paddingBottom: (sp.xl as number) + (insets.bottom || 0) + 32 },
          ]}
          showsVerticalScrollIndicator={false}
        >
          {monthStarts
            .filter((monthStart) => {
              const days = buildMonthDays(monthStart, weekStartsOn);
              return days.some((day) => {
                const dayStart = startOfDay(day);
                const before = isBefore(dayStart, journeyStart);
                const after = isAfter(dayStart, horizonEnd);
                return !(before || after);
              });
            })
            .map((monthStart) => {
            const days = buildMonthDays(monthStart, weekStartsOn);
            const visibleDays = days.filter((day) => {
              const dayStart = startOfDay(day);
              const before = isBefore(dayStart, journeyStart);
              const after = isAfter(dayStart, horizonEnd);
              return !(before || after);
            });
            if (visibleDays.length === 0) return null;
            return (
              <View
                key={monthStart.toISOString()}
                style={[
                  styles.calendarMonthBlock,
                  { backgroundColor: palette.surface, borderColor: palette.border, borderWidth: StyleSheet.hairlineWidth },
                ]}
                onLayout={(event) => {
                  if (monthBlockHeight) return;
                  setMonthBlockHeight(event.nativeEvent.layout.height);
                }}
              >
                <Text style={[styles.calendarMonthLabel, { color: palette.text }]}>
                  {format(monthStart, 'LLLL yyyy', { locale })}
                </Text>
                <View style={styles.calendarWeekHeader}>
                  {weekdayLabels(weekStartsOn, locale).map((abbr, idx) => (
                    <Text
                      key={`${abbr}-${idx}`}
                      style={[styles.calendarWeekdayText, { color: palette.textMuted }]}
                    >
                      {abbr}
                    </Text>
                  ))}
                </View>
                <View style={styles.calendarMonthGrid}>
                  {days.map((day) => {
                    const key = formatKey(day);
                    const log = dayLogs[key];
                    const hasTasks = (log?.tasksDone?.length ?? 0) > 0;
                    const hasConsumption =
                      (log?.consumedGrams ?? 0) > 0 || (log?.consumedJoints ?? 0) > 0;
                    const hasOther =
                      (log?.moneySpentEUR ?? 0) > 0 ||
                      (log?.sessionMinutes ?? 0) > 0 ||
                      Boolean(log?.notes) ||
                      Boolean(log?.tests);
                    const isSelected = isSameDay(day, focusedDate);
                    const isCurrentMonth = isSameMonth(day, monthStart);
                    const isToday = isSameDay(day, today);
                    const pauseState = pauseMap?.[key];
                    
                    // Prüfen ob Tag vor dem Benutzer-Start liegt
                    const isBeforeStart = isBefore(startOfDay(day), journeyStart);
                    const isAfterHorizon = isAfter(startOfDay(day), horizonEnd);
                    const isFuture = isAfter(startOfDay(day), journeyEnd);
                    
                    // Tage vor dem Start werden als leere Platzhalter angezeigt
                    const dayKey = `${monthStart.toISOString()}-${key}`;

                    if (isBeforeStart || isAfterHorizon) {
                      return (
                        <View key={dayKey} style={[styles.calendarMonthDay, styles.calendarMonthDayHidden]}>
                          <Text style={styles.calendarMonthDayTextHidden}>{format(day, 'd')}</Text>
                        </View>
                      );
                    }
                    
                    return (
                      <Pressable
                        key={dayKey}
                        accessibilityRole="button"
                        accessibilityLabel={format(day, localeInfo.longDateA11yFormat, { locale })}
                        onPress={() => handleDayPress(day)}
                        disabled={isFuture}
                        style={({ pressed }) => [
                          styles.calendarMonthDay,
                          { backgroundColor: palette.surfaceMuted },
                          !isCurrentMonth && styles.calendarMonthDayMuted,
                          isFuture && { opacity: 0.8 },
                          pauseState === 'past' && styles.calendarPauseRange,
                          pauseState === 'active' && styles.calendarPauseRangeActive,
                          isSelected && [styles.calendarMonthDaySelected, { borderColor: palette.primary }],
                          isToday && [
                            styles.calendarMonthDayToday,
                            { borderColor: palette.primary, backgroundColor: 'rgba(34,197,94,0.12)' },
                          ],
                          pressed && styles.calendarMonthDayPressed,
                        ]}
                        >
                        <Text
                          style={[
                            styles.calendarMonthDayText,
                            !isCurrentMonth && styles.calendarMonthDayTextMuted,
                            isSelected && [styles.calendarMonthDayTextSelected, { color: palette.surface }],
                            isFuture && { color: palette.text },
                            isToday && { fontWeight: '800' },
                          ]}
                        >
                          {format(day, 'd')}
                        </Text>
                        {!isFuture && (
                          <View style={styles.calendarIndicatorRow}>
                            {hasTasks ? (
                              <View style={[styles.calendarIndicatorDot, styles.calendarIndicatorTask, { opacity: 0.95 }]} />
                            ) : null}
                            {hasConsumption ? (
                              <View
                                style={[styles.calendarIndicatorDot, styles.calendarIndicatorConsumption, { opacity: 0.95 }]}
                              />
                            ) : null}
                            {hasOther ? (
                              <View style={[styles.calendarIndicatorDot, styles.calendarIndicatorOther, { opacity: 0.95 }]} />
                            ) : null}
                          </View>
                        )}
                      </Pressable>
                    );
                  })}
                </View>
              </View>
            );
          })}
        </ScrollView>
      </View>
      <ActivitiesModal
        visible={activityModalVisible}
        onClose={() => setActivityModalVisible(false)}
        date={activityDate}
        entries={activityEntriesForLog(activityDate ? dayLogs[formatKey(activityDate)] : undefined)}
        localeInfo={localeInfo}
      />
    </Modal>
  );
}

type ActivitiesModalProps = {
  visible: boolean;
  onClose: () => void;
  date: Date | null;
  entries: ActivityEntry[];
  localeInfo: LocaleInfo;
};

function ActivitiesModal({ visible, onClose, date, entries, localeInfo }: ActivitiesModalProps) {
  const insets = useSafeAreaInsets();
  const { theme } = useTheme();
  const palette = theme.colors;
  const safeLocale = localeInfo?.locale ?? de;
  const title = date ? format(date, 'EEEE, d. MMMM', { locale: safeLocale }) : 'Aktivitäten';
  return (
    <Modal visible={visible} animationType="slide" presentationStyle="fullScreen" onRequestClose={onClose}>
      <SafeAreaView style={[styles.activitiesScreen, { paddingTop: insets.top + sp.l, backgroundColor: palette.background }]}>
        <View style={styles.activitiesHeader}>
          <View>
            <Text style={[styles.activitiesTitle, { color: palette.text }]}>{title}</Text>
            <Text style={[styles.activitiesSubtitle, { color: palette.textMuted }]}>Alles auf einen Blick</Text>
          </View>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Aktivitäten schließen"
            onPress={onClose}
            hitSlop={8}
            style={({ pressed }) => [
              styles.activitiesCloseBtn,
              { backgroundColor: palette.surfaceMuted, borderColor: palette.border, borderWidth: StyleSheet.hairlineWidth },
              pressed && styles.activitiesCloseBtnPressed,
            ]}
          >
            <Ionicons name="close" size={20} color={palette.text} />
          </Pressable>
        </View>
        {entries.length ? (
          <ScrollView
            style={styles.activitiesScrollFull}
            contentContainerStyle={styles.activitiesList}
            showsVerticalScrollIndicator={false}
          >
            {entries.map((entry) => (
              <View
                key={`${entry.label}-${entry.value ?? entry.details?.length ?? 0}`}
                style={[
                  styles.activityBlock,
                  { backgroundColor: palette.surface, borderColor: palette.border, borderWidth: StyleSheet.hairlineWidth },
                ]}
              >
                <View style={styles.activityBlockHeader}>
                  <View style={[styles.activityIconWrap, { backgroundColor: palette.surfaceMuted }]}>
                    <Ionicons name={getActivityIcon(entry.label)} size={20} color={palette.text} />
                  </View>
                  <Text style={[styles.activityLabel, { color: palette.text }]}>{entry.label}</Text>
                </View>
                {entry.value ? <Text style={[styles.activityValue, { color: palette.text }]}>{entry.value}</Text> : null}
                {entry.details ? (
                  <View style={styles.activityDetails}>
                    {entry.details.map((detail) => (
                      <View key={`${detail.label}-${detail.value}`} style={styles.activityDetailRow}>
                        <View style={[styles.activityDetailIcon, { backgroundColor: palette.surfaceMuted }]}>
                          <Ionicons name={detail.icon} size={18} color={palette.text} />
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text style={[styles.activityDetailLabel, { color: palette.textMuted }]}>{detail.label}</Text>
                          <Text style={[styles.activityDetailValue, { color: palette.text }]}>{detail.value}</Text>
                        </View>
                      </View>
                    ))}
                  </View>
                ) : null}
              </View>
            ))}
          </ScrollView>
        ) : (
          <View style={styles.activityEmptyWrap}>
            <Text style={[styles.activityEmpty, { color: palette.textMuted }]}>Noch keine Aktivitäten gespeichert</Text>
          </View>
        )}
      </SafeAreaView>
    </Modal>
  );
}

export default function TrackenScreen() {
  const { theme } = useTheme();
  const palette = theme.colors;
  const sectionStyles = useMemo(() => createTrackSectionStyles(palette, theme.mode), [palette, theme.mode]);
  const insets = useSafeAreaInsets();
  const headerAccessoryHeight = useUiStore((s) => s.headerAccessoryHeight);
  const navigation = useNavigation<any>();
  const isFocused = useIsFocused();
  useQuickActionsVisibility('tracken-screen', isFocused);
  usePauseEngine();
  const { handleScroll } = useHeaderTransparency();
  const dayLogs = useApp((s) => s.dayLogs);
  const upsertDayLog = useApp((s) => s.upsertDayLog);
  const markTaskDone = useApp((s) => s.markTaskDone);
  const pauses = useApp((s) => s.pauses);
  const profile = useApp((s) => s.profile);
  const localeInfo = useMemo(() => resolveLocaleInfo(profile?.locale ?? undefined), [profile?.locale]);
  const userStartDate = useMemo(() => {
    return normalizeStartDate(profile?.startTimestamp);
  }, [profile?.startTimestamp]);
  const today = startOfDay(new Date());
  const normalizedUserStartDate = useMemo(() => {
    if (!userStartDate) return null;
    return isAfter(userStartDate, today) ? today : userStartDate;
  }, [userStartDate, today]);
  const [weekStart, setWeekStart] = useState(() =>
    startOfWeek(new Date(), { weekStartsOn: localeInfo.weekStartsOn })
  );
  const [selectedDate, setSelectedDate] = useState(() => new Date());
  const [showCheck, setShowCheck] = useState(false);
  const [showCalendarModal, setShowCalendarModal] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [showStroop, setShowStroop] = useState(false);
  const [activityDate, setActivityDate] = useState<Date | null>(null);
  const [activityModalVisible, setActivityModalVisible] = useState(false);
  const [lastStroop, setLastStroop] = useState<SessionSummary | null>(null);
  const taskScrollRef = useRef<ScrollView>(null);
  const [taskScrollOffset, setTaskScrollOffset] = useState(0);
  const taskScrollX = useRef(new Animated.Value(0)).current;
  const [taskContainerWidth, setTaskContainerWidth] = useState(0);
  const [currentTaskIndex, setCurrentTaskIndex] = useState(0);
  const lastDayTapRef = useRef<{ date: Date; ts: number } | null>(null);
  const compactListRef = useRef<ScrollView | null>(null);
  const [visibleMonthDate, setVisibleMonthDate] = useState<Date>(() => new Date());
  
  // Task Scroll Konstanten
  const TASK_CARD_WIDTH = 270;
  const TASK_CARD_GAP = 16;
  const TASK_CARD_SPACING = TASK_CARD_WIDTH + TASK_CARD_GAP;
  const taskHorizontalInset = useMemo(() => {
    if (!taskContainerWidth) return 0;
    return (taskContainerWidth - TASK_CARD_WIDTH) / 2;
  }, [taskContainerWidth]);
  
  const scrollToTaskIndex = (index: number) => {
    const clampedIndex = Math.max(0, Math.min(index, TASKS.length - 1));
    const x = clampedIndex * TASK_CARD_SPACING;
    taskScrollRef.current?.scrollTo({ x, animated: true });
    setCurrentTaskIndex(clampedIndex);
  };

  const compactDays = useMemo(() => {
    const rawStart = normalizedUserStartDate ?? addDays(today, -30);
    const validStart = isValid(rawStart) ? rawStart : addDays(today, -30);
    const safeStart = isAfter(validStart, today) ? addDays(today, -30) : validStart;
    return eachDayOfInterval({ start: safeStart, end: today });
  }, [today, normalizedUserStartDate]);

  useEffect(() => {
    setWeekStart(startOfWeek(selectedDate, { weekStartsOn: localeInfo.weekStartsOn }));
  }, [localeInfo.weekStartsOn, selectedDate]);

  const selectedKey = formatKey(selectedDate);
  const logForSelected = dayLogs[selectedKey];
  const completedIds = new Set(logForSelected?.tasksDone ?? []);
  const todayXp = logForSelected?.xpEarned ?? 0;
  const pauseHighlightMap = useMemo(() => {
    const map: Record<string, 'active' | 'past'> = {};
    pauses.forEach((pause) => {
      const type = pause.status === 'aktiv' ? 'active' : 'past';
      dayKeysBetween(pause.startDate, pause.endDate).forEach((key) => {
        if (!map[key] || type === 'active') {
          map[key] = type;
        }
      });
    });
    return map;
  }, [pauses]);
  const activePause = pauses.find((pause) => pause.status === 'aktiv');

  const tasks = TASKS.map((task) => ({
    ...task,
    completed: completedIds.has(task.id),
  }));
  const completedCount = tasks.filter((t) => t.completed).length;
  const selectedDayStart = startOfDay(selectedDate);
  const isTodaySelected = isSameDay(selectedDayStart, today);
  const stroopChipLabel = lastStroop
    ? `Letztes: ${(lastStroop.accuracy * 100).toFixed(0)}% • ${Math.round(lastStroop.meanRTAll)} ms`
    : undefined;

  const handleSelectDay = (day: Date) => {
    const nowTs = Date.now();
    const lastTap = lastDayTapRef.current;
    const isSameAsLast = lastTap && isSameDay(day, lastTap.date) && nowTs - lastTap.ts < 450;
    setSelectedDate(day);
    setWeekStart(startOfWeek(day, { weekStartsOn: localeInfo.weekStartsOn }));
    if (isSameAsLast) {
      setActivityDate(day);
      setActivityModalVisible(true);
    }
    lastDayTapRef.current = { date: day, ts: nowTs };
  };

  const changeWeek = (offset: number) => {
    setWeekStart((prev) => addWeeks(prev, offset));
    setSelectedDate((prev) => addWeeks(prev, offset));
  };

  useEffect(() => {
    let mounted = true;
    getLastStroopSummary()
      .then((summary) => {
        if (mounted) setLastStroop(summary);
      })
      .catch(() => {
        if (mounted) setLastStroop(null);
      });
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    if (!statusMessage) return;
    const timeout = setTimeout(() => setStatusMessage(null), 2400);
    return () => clearTimeout(timeout);
  }, [statusMessage]);

  useEffect(() => {
    const index = compactDays.findIndex((d) => isSameDay(d, selectedDate));
    if (index < 0) return;
    requestAnimationFrame(() => {
      const x = DAY_ROW_INSET + DAY_ITEM_STEP * index;
      compactListRef.current?.scrollTo({ x, animated: true });
    });
  }, [compactDays, selectedDate]);

  // Sichtbarer Monat folgt dem Scroll-Offset
  const updateVisibleMonth = (offsetX: number) => {
    if (!compactDays.length) return;
    const approxIndex = Math.round(offsetX / DAY_ITEM_STEP);
    const clampedIndex = Math.max(0, Math.min(approxIndex, compactDays.length - 1));
    const day = compactDays[clampedIndex];
    if (day) {
      setVisibleMonthDate(day);
    }
  };

  useEffect(() => {
    setVisibleMonthDate(selectedDate);
  }, [selectedDate]);

  const openCheck = () => setShowCheck(true);
  const closeCheck = () => setShowCheck(false);
  const openCalendarModal = () => setShowCalendarModal(true);
  const closeCalendarModal = () => setShowCalendarModal(false);

  const submitCheck = (data: DailyCheckinData) => {
    const consumed = data.usedToday ? Math.max(0, data.amountGrams) : 0;
    const lastConsumptionTimestamp =
      data.usedToday ? timestampFromKey(selectedKey, data.uses?.[0]?.time) : undefined;
    const existing = dayLogs[selectedKey];
    const updates: Partial<DayLog> & { date: string } = {
      date: selectedKey,
      notes: data.notes,
      checkin: {
        usedToday: data.usedToday,
        amountGrams: data.amountGrams,
        cravings0to10: data.cravings0to10,
        mood1to5: data.mood1to5,
        sleepHours: data.sleepHours,
        notes: data.notes,
        recordedAt: Date.now(),
      },
    };
    if (consumed > 0) {
      const entry = createConsumptionEntry({
        grams: consumed,
        joints: data.consumptionJoints,
        sessionMinutes: data.consumptionSessionMinutes,
        method: data.consumptionMethod,
        paidByUser: data.consumptionPaidByUser ?? 'unknown',
        amountSpent: data.consumptionAmountSpentEUR,
      });
      const nextEntries = [...(existing?.consumptionEntries ?? []), entry];
      const totalGrams = (existing?.consumedGrams ?? 0) + (entry.grams ?? consumed);
      const totalJoints = (existing?.consumedJoints ?? 0) + (entry.joints ?? 0);
      const totalMinutes = (existing?.sessionMinutes ?? 0) + (entry.sessionMinutes ?? 0);
      const moneySpent =
        entry.paidByUser === 'yes' && entry.amountSpent
          ? (existing?.moneySpentEUR ?? 0) + entry.amountSpent
          : existing?.moneySpentEUR;
      updates.consumedGrams = totalGrams;
      if (totalJoints > 0) {
        updates.consumedJoints = totalJoints;
      }
      if (totalMinutes > 0) {
        updates.sessionMinutes = totalMinutes;
      }
      if (typeof moneySpent === 'number') {
        updates.moneySpentEUR = moneySpent;
      }
      updates.consumptionEntries = nextEntries;
    } else if (existing?.consumedGrams) {
      updates.consumedGrams = existing.consumedGrams;
    }
    upsertDayLog({
      ...updates,
      lastConsumptionAt: lastConsumptionTimestamp,
    });
    markTaskDone(selectedKey, 'daily-check-in', TASK_XP['daily-check-in'] ?? 0);
    closeCheck();
    setStatusMessage('Check-in gespeichert');
  };

  const hasConsumption = (date: Date) => {
    const entry = dayLogs[formatKey(date)];
    if (!entry) return false;
    const grams = entry.consumedGrams ?? 0;
    const joints = entry.consumedJoints ?? 0;
    return grams > 0 || joints > 0;
  };

  // Prüft ob ein Tag vor dem Benutzer-Startdatum liegt
  const isBeforeUserStart = (date: Date) => {
    if (!normalizedUserStartDate) return false;
    return isBefore(startOfDay(date), normalizedUserStartDate);
  };

  // Bestimmt die Indikator-Farbe basierend auf dem Tag-Status
  const getIndicatorColor = (date: Date): string | undefined => {
    const dayStart = startOfDay(date);
    if (!isBefore(dayStart, today)) return undefined; // Zukunft oder heute - kein Indikator
    
    const consumed = hasConsumption(date);
    if (consumed) return '#f97316'; // Orange für Konsum
    return '#22c55e'; // Grün für konsumfrei
  };

  const navigateTo = (id: TaskId) => {
    if (id === 'stroop-focus') {
      setShowStroop(true);
      return;
    }
    const parent = navigation.getParent()?.getParent() ?? navigation.getParent() ?? navigation;
    if (id === 'reaction-test') {
      parent.navigate('TapGame');
    } else if (id === 'breathing-session') {
      parent.navigate('Breath');
    } else if (id === 'zen-glide') {
      parent.navigate('ZenGlide');
    } else if (id === 'mind-house') {
      parent.navigate('MindHouseGame');
    } else if (id === 'number-flow') {
      parent.navigate('NumberFlowGame');
    } else if (id === 'daily-check-in') {
      openCheck();
    }
  };

  const openPausePlanner = () => {
    const parent = navigation.getParent()?.getParent() ?? navigation.getParent() ?? navigation;
    parent.navigate('PausePlan');
  };

  const pauseSubtitle = activePause
    ? `Aktiv bis ${format(parseDateKey(activePause.endDate), localeInfo.shortDateFormat, { locale: localeInfo.locale })}`
    : 'Plane eine Konsumpause in wenigen Sekunden';

  const topOffset = insets.top + HEADER_TOTAL_HEIGHT + headerAccessoryHeight + (sp.l as number);

  return (
    <>
      <ScrollView
        style={[styles.screen, { backgroundColor: palette.background }]}
        contentContainerStyle={[styles.body, { paddingTop: topOffset, paddingBottom: Math.max(sp.xxl as number, insets.bottom) + 100 }]}
        onScroll={handleScroll}
        scrollEventThrottle={16}
      >
        {/* Kompakter iOS-Stil Kalender */}
        <View style={styles.compactCalendarContainer}>
          <View style={styles.compactCalendarHeaderRow}>
            <Text style={[styles.compactCalendarMonth, { color: palette.text }]}>
              {format(visibleMonthDate, 'LLLL', { locale: localeInfo.locale })}
            </Text>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Kalender öffnen"
              onPress={openCalendarModal}
              hitSlop={10}
              style={({ pressed }) => [
                styles.expandIconButton,
                { backgroundColor: palette.surfaceMuted, borderColor: palette.border },
                pressed && { opacity: 0.8, transform: [{ scale: 0.97 }] },
              ]}
            >
              <Ionicons name="calendar-outline" size={18} color={palette.text} />
              <Ionicons name="chevron-forward" size={16} color={palette.text} />
            </Pressable>
          </View>

          {/* Tage als kompakte Boxen (full-bleed) */}
          <View style={styles.compactCalendarChips}>
            <ScrollView
              ref={compactListRef}
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={[styles.compactWeekRow, { paddingHorizontal: spacing.s }]}
              onScroll={(e) => updateVisibleMonth(e.nativeEvent.contentOffset.x)}
              scrollEventThrottle={16}
              onMomentumScrollEnd={(e) => updateVisibleMonth(e.nativeEvent.contentOffset.x)}
            >
              {compactDays.map((item) => (
                <View key={item.toISOString()} style={{ marginRight: 8 }}>
                  <DayChip
                    date={item}
                    selected={isSameDay(item, selectedDate)}
                    weekdayLabel={format(item, 'EEE', { locale: localeInfo.locale })}
                    hasConsumption={hasConsumption(item)}
                    showStatusIcon={isBefore(startOfDay(item), today)}
                    onPress={() => handleSelectDay(item)}
                    isBeforeStart={isBeforeUserStart(item)}
                    indicatorColor={getIndicatorColor(item)}
                  />
                </View>
              ))}
            </ScrollView>
          </View>
        </View>

        <View style={[styles.cardFrame, { borderColor: palette.border }]}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Check-in starten"
            onPress={openCheck}
            style={({ pressed }) => [
              sectionStyles.section,
              styles.checkinCta,
              { backgroundColor: palette.primary, borderColor: palette.primaryRing, shadowColor: palette.primary },
              pressed && styles.checkinCtaPressed,
            ]}
          >
            <View style={styles.checkinCtaIcon}>
              <Ionicons name="calendar-outline" size={22} color="#ffffff" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.checkinCtaTitle}>Check-in starten</Text>
              <Text style={styles.checkinCtaSubtitle}>Direkt zur ersten Frage springen</Text>
            </View>
            <Ionicons name="arrow-forward-circle" size={30} color="#ffffff" />
          </Pressable>
        </View>

        <View style={[styles.cardFrame, { borderColor: palette.border }]}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Pause einlegen"
            onPress={openPausePlanner}
            style={({ pressed }) => [sectionStyles.section, styles.pauseCta, pressed && styles.pauseCtaPressed]}
          >
            <View style={styles.pauseCtaIcon}>
              <Ionicons name="pause-circle" size={24} color={palette.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text
                style={[
                  styles.pauseCtaTitle,
                  { color: theme.mode === 'dark' ? '#ffffff' : palette.text },
                ]}
              >
                Pause einlegen
              </Text>
              <Text
                style={[
                  styles.pauseCtaSubtitle,
                  { color: theme.mode === 'dark' ? '#e5e7eb' : palette.textMuted },
                ]}
              >
                {pauseSubtitle}
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={22} color={palette.primary} />
          </Pressable>
        </View>

      {/* Tasks Section - Combined Container */}
      <View style={[styles.cardFrame, { borderColor: palette.border }]}>
        <View style={[styles.tasksSectionContainer, { backgroundColor: palette.surface, borderColor: palette.border }]}>
        {/* Task Progress Card - Overlay */}
        <View style={[styles.taskProgressCard, { backgroundColor: palette.surface, zIndex: 2 }]}>
          <View style={styles.taskProgressHeader}>
            <View style={styles.taskProgressTitleRow}>
              <View
                style={[
                  styles.taskProgressIconWrap,
                  { backgroundColor: theme.mode === 'dark' ? 'rgba(255,255,255,0.08)' : 'rgba(16,104,74,0.12)' },
                ]}
              >
                <Ionicons name="flame" size={20} color={theme.mode === 'dark' ? palette.primary : lt.primary} />
              </View>
              <Text style={[styles.taskProgressTitle, { color: palette.text }]}>Tägliche Aufgaben</Text>
            </View>
            <View style={[styles.xpBadgeNew, { backgroundColor: '#fbbf24' }]}>
              <Ionicons name="star" size={14} color="#ffffff" />
              <Text style={[styles.xpBadgeNewText, { color: '#ffffff' }]}>{todayXp} XP</Text>
            </View>
          </View>
          
          {/* Progress Bar */}
          <View style={styles.taskProgressBarContainer}>
            <View style={[styles.taskProgressBarBg, { backgroundColor: palette.surfaceMuted }]}>
              <View 
                style={[
                  styles.taskProgressBarFill, 
                  { 
                    width: `${(completedCount / tasks.length) * 100}%`,
                    backgroundColor: theme.mode === 'dark' ? palette.primary : completedCount === tasks.length ? '#22c55e' : lt.primary,
                  }
                ]} 
              />
            </View>
            <Text style={[styles.taskProgressText, { color: palette.textMuted }]}>
              {completedCount}/{tasks.length} erledigt
            </Text>
          </View>

          {/* Motivational Text */}
          <Text style={[styles.taskProgressMotivation, { color: palette.textMuted }]}>
            {!isTodaySelected 
              ? '📅 Aufgaben nur heute verfügbar'
              : completedCount === 0 
                ? '🎯 Starte mit deiner ersten Aufgabe!'
                : completedCount === tasks.length 
                  ? '🎉 Großartig! Alle Aufgaben erledigt!'
                  : `💪 Weiter so! Noch ${tasks.length - completedCount} Aufgaben übrig`
            }
          </Text>
        </View>

        {/* Divider - Overlay */}
        <View style={[styles.tasksSectionDivider, { backgroundColor: palette.surface, zIndex: 2 }]} />

        {/* Task Cards Scroll - Behind the box */}
        <View 
          style={[styles.taskScrollContainer, { zIndex: 1 }]}
          onLayout={(e) => setTaskContainerWidth(e.nativeEvent.layout.width)}
        >
          <Animated.ScrollView
            ref={taskScrollRef as any}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={[
              styles.taskScrollContent,
              { paddingHorizontal: taskHorizontalInset || sp.xl },
            ]}
            style={styles.taskScroll}
            decelerationRate="fast"
            snapToInterval={TASK_CARD_SPACING}
            snapToAlignment="start"
            onScroll={Animated.event(
              [{ nativeEvent: { contentOffset: { x: taskScrollX } } }],
              {
                useNativeDriver: true,
                listener: (e: any) => {
                  const offset = e.nativeEvent.contentOffset.x;
                  setTaskScrollOffset(offset);
                  const approxIndex = Math.round(offset / TASK_CARD_SPACING);
                  setCurrentTaskIndex(Math.max(0, Math.min(approxIndex, TASKS.length - 1)));
                },
              }
            )}
            scrollEventThrottle={16}
          >
            {tasks.map((task, idx) => {
              const isStroop = task.id === 'stroop-focus';
              const cardOffset = idx * TASK_CARD_SPACING;
              const inputRange = [
                cardOffset - TASK_CARD_SPACING,
                cardOffset,
                cardOffset + TASK_CARD_SPACING,
              ];
              const scale = taskScrollX.interpolate({
                inputRange,
                outputRange: [0.88, 1.05, 0.88],
                extrapolate: 'clamp',
              });
              const rotateY = taskScrollX.interpolate({
                inputRange,
                outputRange: ['6deg', '0deg', '-6deg'],
                extrapolate: 'clamp',
              });
              // Ensure backgroundColor stays constant - no color animation based on scroll
              const backgroundColor = theme.mode === 'dark' ? palette.surface : palette.surfaceMuted;
              const borderColor = palette.border;
              
              return (
                <Animated.View
                  key={task.id}
                  style={[
                    styles.taskFrameHorizontal,
                    {
                      backgroundColor,
                      borderColor,
                      transform: [
                        { perspective: 800 },
                        { scale },
                        { rotateY },
                      ],
                    },
                  ]}
                >
                  <TaskCard
                    task={task}
                    completed={task.completed}
                    disabled={!isTodaySelected}
                    infoText={task.info}
                    chipLabel={isStroop ? stroopChipLabel : undefined}
                    testID={isStroop ? 'task-stroop' : undefined}
                    onPress={isTodaySelected ? () => navigateTo(task.id) : undefined}
                  />
                </Animated.View>
              );
            })}
          </Animated.ScrollView>
          {/* Scroll-Indikator Pfeil links */}
          {currentTaskIndex > 0 && (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Vorherige Tasks anzeigen"
              onPress={() => scrollToTaskIndex(currentTaskIndex - 1)}
              style={({ pressed }) => [
                styles.scrollIndicator,
                styles.scrollIndicatorLeft,
                pressed && styles.scrollIndicatorPressed,
              ]}
            >
              <Ionicons name="chevron-back" size={20} color={lt.textMuted} />
            </Pressable>
          )}
          {/* Scroll-Indikator Pfeil rechts */}
          {currentTaskIndex < tasks.length - 1 && (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Weitere Tasks anzeigen"
              onPress={() => scrollToTaskIndex(currentTaskIndex + 1)}
              style={({ pressed }) => [
                styles.scrollIndicator,
                styles.scrollIndicatorRight,
                pressed && styles.scrollIndicatorPressed,
              ]}
            >
              <Ionicons name="chevron-forward" size={20} color={lt.textMuted} />
            </Pressable>
          )}
        </View>
        </View>
      </View>
      </ScrollView>

      <ActivitiesModal
        visible={activityModalVisible}
        onClose={() => setActivityModalVisible(false)}
        date={activityDate}
        entries={activityEntriesForLog(activityDate ? dayLogs[formatKey(activityDate)] : undefined)}
        localeInfo={localeInfo}
      />

      <Modal visible={showStroop} animationType="slide" onRequestClose={() => setShowStroop(false)}>
        <SafeAreaView style={{ flex: 1, backgroundColor: '#000000' }}>
          <StroopGame
            mode="INK"
            useCannabisStroop
            onAbort={() => {
              setShowStroop(false);
              setStatusMessage('Stroop Focus abgebrochen');
            }}
            onExit={(summary) => {
              setShowStroop(false);
              setLastStroop(summary);
              upsertDayLog({
                date: selectedKey,
                tests: {
                  stroopAccuracy: summary.accuracy,
                  stroopMeanRt: summary.meanRTAll,
                  stroopInterference: summary.stroopInterferenceMs,
                  stroopTimestamp: summary.timestamp,
                },
              });
              if (isTodaySelected) {
                markTaskDone(selectedKey, 'stroop-focus', TASK_XP['stroop-focus'] ?? 0);
              }
              setStatusMessage('Stroop Focus gespeichert');
            }}
          />
        </SafeAreaView>
      </Modal>

      <Modal
        visible={showCheck}
        animationType="slide"
        presentationStyle="fullScreen"
        onRequestClose={closeCheck}
      >
        <ImageBackground source={AMBIENT_BG} style={styles.modalWrap} resizeMode="cover">
          <View
            style={[
              styles.modalContent,
              {
                paddingTop: insets.top + sp.l,
                paddingBottom: Math.max(sp.xl as number, (insets.bottom || 0) + sp.l) + 100, // Extra Padding für TabBar
              },
            ]}
          >
            <View style={styles.modalHead}>
              <Text style={styles.modalTitle}>Check-in</Text>
              <Pressable onPress={closeCheck} accessibilityRole="button" style={styles.modalBtn}>
                <Text style={styles.modalBtnText}>Schließen</Text>
              </Pressable>
            </View>
            <View style={styles.modalCard}>
              <FrostedSurface borderRadius={radius.xl} style={styles.modalCardSurface}>
                <CheckForm
                  initial={{ dateISO: selectedDate.toISOString() }}
                  onSubmit={submitCheck}
                  onCancel={closeCheck}
                  style={styles.checkinForm}
                />
              </FrostedSurface>
            </View>
          </View>
        </ImageBackground>
      </Modal>
      <CalendarOverviewModal
        visible={showCalendarModal}
        onClose={closeCalendarModal}
        onSelectDate={handleSelectDay}
        dayLogs={dayLogs}
        pauseMap={pauseHighlightMap}
        userStartDate={normalizedUserStartDate}
        localeInfo={localeInfo}
      />
      {statusMessage ? (
        <View
          pointerEvents="none"
          style={[
            styles.statusToast,
            { bottom: Math.max(sp.xl as number, (insets.bottom || 0) + sp.m) },
          ]}
        >
          <Ionicons name="checkmark-circle" size={20} color="#ffffff" />
          <Text style={styles.statusToastText}>{statusMessage}</Text>
        </View>
      ) : null}
    </>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    paddingHorizontal: sp.xl,
  },
  body: {
    gap: sp.l,
  },
  xpBadgeLarge: {
    backgroundColor: lt.primary,
    paddingHorizontal: sp.l,
    paddingVertical: sp.s,
    borderRadius: radius.pill,
    alignItems: 'flex-start',
  },
  xpBadgeLabel: {
    color: lt.surface,
    fontSize: 12,
    fontWeight: '600',
  },
  xpBadgeValue: {
    color: lt.surface,
    fontSize: 20,
    fontWeight: '700',
  },
  // Neuer kompakter iOS-Stil Kalender
  compactCalendarContainer: {
    width: '100%',
    gap: sp.m,
  },
  compactCalendarChips: {
    marginHorizontal: -(sp.xl as number),
    paddingHorizontal: sp.s,
  },
  compactCalendarHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  compactCalendarHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  compactCalendarMonth: {
    fontSize: 28,
    fontWeight: '700',
  },
  weekdayHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 4,
  },
  weekdayHeaderText: {
    flex: 1,
    textAlign: 'center',
    fontSize: 13,
    fontWeight: '500',
  },
  compactWeekRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  expandIconButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    height: 34,
    borderRadius: radius.m,
    borderWidth: StyleSheet.hairlineWidth,
  },
  // Legacy Kalender-Styles (für Modal)
  calendarCard: {
    gap: sp.m,
  },
  calendarHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: sp.m,
  },
  calendarButton: {
    width: 36,
    height: 36,
    borderRadius: radius.pill,
    backgroundColor: lt.surfaceMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  calendarMonth: {
    fontSize: 18,
    fontWeight: '700',
    color: lt.text,
  },
  weekRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  calendarExpandButton: {
    marginTop: sp.m,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: sp.s,
    borderRadius: radius.pill,
    backgroundColor: lt.surfaceMuted,
    gap: sp.xs,
  },
  calendarExpandButtonPressed: {
    opacity: 0.85,
  },
  calendarExpandLabel: {
    color: lt.text,
    fontWeight: '600',
  },
  checkinCta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: sp.m,
  },
  checkinCtaPressed: {
    transform: [{ scale: 0.99 }],
    opacity: 0.95,
  },
  checkinCtaIcon: {
    width: 46,
    height: 46,
    borderRadius: radius.pill,
    backgroundColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkinCtaTitle: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '700',
  },
  checkinCtaSubtitle: {
    color: 'rgba(255,255,255,0.92)',
    fontSize: 13,
    marginTop: 2,
  },
  pauseCta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: sp.m,
  },
  pauseCtaPressed: {
    opacity: 0.9,
  },
  pauseCtaIcon: {
    width: 46,
    height: 46,
    borderRadius: radius.pill,
    backgroundColor: 'rgba(16,104,74,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pauseCtaTitle: {
    color: lt.text,
    fontSize: 17,
    fontWeight: '700',
  },
  pauseCtaSubtitle: {
    color: lt.textMuted,
    fontSize: 13,
    marginTop: 2,
  },
  cardFrame: {
    width: '100%',
    borderWidth: 1,
    borderRadius: radius.xl + 6,
    padding: spacing.s,
    backgroundColor: 'rgba(0,0,0,0.02)',
  },
  // Neuer kompakter DayChip Style (iOS-Kalender-Look)
  dayChipCompact: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 4,
  },
  dayChipCompactSelected: {
    // Kein zusätzlicher Container-Style nötig
  },
  dayChipPlaceholder: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 4,
    opacity: 0, // Unsichtbar aber behält Platz
  },
  dayWeekLabel: {
    fontSize: 11,
    fontWeight: '600',
    marginBottom: 4,
    textTransform: 'uppercase',
  },
  dayNumberBox: {
    width: 52,
    height: 52,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayNumberBoxSelected: {
    borderWidth: 3,
    borderColor: 'rgba(0,0,0,0.2)',
  },
  dayNumberCompact: {
    fontSize: 22,
    fontWeight: '600',
  },
  dayNumberCompactSelected: {
    color: '#ffffff',
    fontWeight: '700',
  },
  dayIndicatorDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginTop: 6,
  },
  dayIndicatorSpacer: {
    width: 6,
    height: 6,
    marginTop: 6,
  },
  // Legacy DayChip Styles (für Kompatibilität)
  dayChip: {
    alignItems: 'center',
    flex: 1,
    gap: 4,
  },
  dayChipSelected: {
    borderRadius: radius.l,
    backgroundColor: 'rgba(22,163,74,0.08)',
  },
  dayLabel: {
    fontSize: 12,
    color: lt.textMuted,
  },
  dayCircle: {
    width: 44,
    height: 44,
    borderRadius: radius.pill,
    backgroundColor: lt.surfaceMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayNumber: {
    fontSize: 16,
    fontWeight: '600',
    color: lt.text,
  },
  dayStatusIcon: {
    width: 36,
    height: 36,
    marginTop: 2,
  },
  dayStatusSpacer: {
    width: 36,
    height: 36,
    marginTop: 2,
  },
  // Tasks Section Container
  tasksSectionContainer: {
    borderRadius: radius.xl,
    borderWidth: 1,
    padding: sp.l,
    gap: 0,
    ...shadows.sm,
    overflow: 'hidden',
    position: 'relative',
  },
  tasksSectionDivider: {
    height: 20,
    marginVertical: sp.m,
    marginHorizontal: -sp.l,
    position: 'relative',
  },
  // Task Progress Card Styles
  taskProgressCard: {
    padding: 0,
    gap: sp.m,
    position: 'relative',
  },
  taskProgressHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  taskProgressTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: sp.s,
  },
  taskProgressIconWrap: {
    width: 36,
    height: 36,
    borderRadius: radius.pill,
    backgroundColor: 'rgba(16,104,74,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  taskProgressTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  xpBadgeNew: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: sp.m,
    paddingVertical: sp.xs,
    borderRadius: radius.pill,
  },
  xpBadgeNewText: {
    fontSize: 14,
    fontWeight: '700',
  },
  taskProgressBarContainer: {
    gap: sp.xs,
  },
  taskProgressBarBg: {
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
  },
  taskProgressBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  taskProgressText: {
    fontSize: 13,
    fontWeight: '500',
  },
  taskProgressMotivation: {
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'center',
    paddingTop: sp.xs,
  },
  // Legacy Section Styles (für Kompatibilität)
  sectionHeaderRow: {
    marginTop: sp.s,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: sp.m,
  },
  sectionHeader: {
    flex: 1,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: lt.text,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: lt.textMuted,
    marginTop: sp.xs / 2,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: sp.m,
  },
  taskScrollContainer: {
    position: 'relative',
    paddingVertical: 16, // Extra Platz für Zoom-Effekt
    marginHorizontal: -sp.l, // Negative margin um den Container-Padding auszugleichen
    marginTop: -20, // Overlap mit Divider für "hinter der Box" Effekt
  },
  taskScroll: {
    overflow: 'visible',
  },
  taskScrollContent: {
    gap: sp.m,
    alignItems: 'center',
    paddingVertical: 12, // Extra Platz für Zoom-Effekt
  },
  scrollIndicator: {
    position: 'absolute',
    top: '50%',
    transform: [{ translateY: -20 }],
    width: 40,
    height: 40,
    borderRadius: radius.pill,
    backgroundColor: lt.surface,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.sm,
    borderWidth: 1,
    borderColor: lt.border,
    zIndex: 10,
  },
  scrollIndicatorLeft: {
    left: sp.s,
  },
  scrollIndicatorRight: {
    right: sp.s,
  },
  scrollIndicatorPressed: {
    opacity: 0.7,
    transform: [{ translateY: -20 }, { scale: 0.95 }],
  },
  taskFrameHorizontal: {
    width: 270,
    borderWidth: 1,
    borderRadius: radius.l + 6,
    padding: spacing.s,
    backgroundColor: '#ffffff', // Solid white background
    borderColor: lt.border,
  },
  taskFrame: {
    width: '48%',
    borderWidth: 1,
    borderRadius: radius.l + 6,
    padding: spacing.s,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderColor: lt.border,
  },
  taskCard: {
    width: '100%',
    borderRadius: radius.l,
  },
  taskCardBody: {
    position: 'relative',
    width: '100%',
  },
  taskContent: {
    flex: 1,
    justifyContent: 'space-between',
    gap: sp.s,
    position: 'relative',
    alignItems: 'center',
    paddingTop: sp.xl,
  },
  taskXpWrap: {
    position: 'absolute',
    top: sp.s,
    right: sp.s,
    zIndex: 2,
  },
  taskMeta: {
    gap: sp.xs,
    alignItems: 'center',
  },
  taskInner: {
    borderRadius: radius.l,
    padding: sp.m,
    paddingBottom: sp.l,
    gap: sp.s,
    borderWidth: 2,
    borderColor: lt.border,
    backgroundColor: '#ffffff', // Solid white background
    width: '100%',
    ...shadows.sm,
    height: 260,
  },
  taskInnerBlur: {
    borderColor: lt.border,
    backgroundColor: '#ffffff', // Solid white background
  },
  taskInnerDone: {
    backgroundColor: lt.primary,
    borderColor: lt.primary,
  },
  taskCardPressed: {
    transform: [{ scale: 0.98 }],
    opacity: 0.9,
  },
  taskCardDisabled: {
    opacity: 0.6,
  },
  taskIcon: {
    width: 42,
    height: 42,
    borderRadius: radius.pill,
    backgroundColor: lt.primaryMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  taskIconDone: {
    backgroundColor: 'rgba(255,255,255,0.18)',
  },
  taskTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: lt.text,
    textAlign: 'center',
  },
  taskTitleDone: {
    color: lt.surface,
  },
  taskSubtitle: {
    fontSize: 13,
    color: lt.textMuted,
  },
  taskSubtitleDone: {
    color: 'rgba(255,255,255,0.9)',
  },
  taskInfo: {
    fontSize: 12,
    color: lt.textMuted,
    marginTop: 2,
  },
  taskInfoDone: {
    color: 'rgba(255,255,255,0.85)',
  },
  xpPill: {
    backgroundColor: lt.primary,
    borderRadius: radius.pill,
    paddingHorizontal: sp.s,
    paddingVertical: 4,
  },
  xpPillDone: {
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  xpPillText: {
    color: lt.surface,
    fontSize: 12,
    fontWeight: '600',
  },
  xpPillTextDone: {
    color: lt.surface,
  },
  taskActionRow: {
    marginTop: sp.xs,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: sp.xs,
  },
  taskActionInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  playButtonRow: {
    alignItems: 'center',
    marginTop: sp.xs / 2,
    marginBottom: sp.s,
  },
  taskActionLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: lt.text,
    textAlign: 'center',
    width: '100%',
  },
  taskActionLabelDone: {
    color: lt.surface,
  },
  taskActionLabelDisabled: {
    color: lt.textMuted,
  },
  taskChip: {
    alignSelf: 'center',
    marginTop: sp.xs,
    backgroundColor: lt.surfaceMuted,
    borderRadius: radius.pill,
    paddingHorizontal: sp.s,
    paddingVertical: 2,
  },
  taskChipDone: {
    backgroundColor: 'rgba(255,255,255,0.15)',
  },
  taskChipText: {
    fontSize: 11,
    fontWeight: '600',
    color: lt.text,
  },
  taskChipTextDone: {
    color: lt.surface,
  },
  taskFootnote: {
    fontSize: 12,
    color: lt.textMuted,
    textAlign: 'center',
  },
  taskFootnoteDone: {
    color: 'rgba(255,255,255,0.85)',
  },
  modalWrap: {
    flex: 1,
  },
  modalContent: {
    flex: 1,
    paddingHorizontal: sp.l,
    gap: sp.l,
    justifyContent: 'flex-start',
  },
  modalHead: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: sp.l,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: lt.text,
  },
  modalBtn: {
    paddingHorizontal: sp.m,
    paddingVertical: sp.s,
  },
  modalBtnText: {
    color: lt.text,
    fontWeight: '600',
    fontSize: 14,
  },
  modalCard: {
    flex: 1,
    width: '100%',
    maxWidth: 520,
    alignSelf: 'center',
    alignItems: 'stretch',
  },
  modalCardSurface: {
    flex: 1,
    width: '100%',
    padding: sp.l,
    gap: sp.m,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.36)',
  },
  checkinForm: {
    flex: 0,
  },
  statusToast: {
    position: 'absolute',
    left: sp.xl,
    right: sp.xl,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: sp.s,
    backgroundColor: 'rgba(15,118,110,0.95)',
    paddingVertical: sp.s,
    paddingHorizontal: sp.m,
    borderRadius: radius.pill,
    ...shadows.sm,
  },
  statusToastText: {
    color: '#ffffff',
    fontWeight: '600',
  },
  calendarModalScreen: {
    flex: 1,
    backgroundColor: lt.bg,
    paddingHorizontal: sp.l,
    gap: sp.m,
  },
  calendarModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: sp.s,
  },
  calendarModalTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: lt.text,
  },
  calendarModalSubtitle: {
    fontSize: 14,
    color: lt.textMuted,
    marginTop: 4,
  },
  calendarSummary: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: radius.l,
    padding: sp.m,
    gap: sp.m,
  },
  calendarSummaryItem: {
    flex: 1,
    gap: 6,
  },
  calendarSummaryLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: lt.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  calendarSummaryValue: {
    fontSize: 18,
    fontWeight: '700',
    color: lt.text,
  },
  calendarSummaryDivider: {
    width: StyleSheet.hairlineWidth,
    alignSelf: 'stretch',
    backgroundColor: lt.border,
  },
  modalCloseBtn: {
    width: 40,
    height: 40,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: lt.surfaceMuted,
  },
  modalCloseBtnPressed: {
    opacity: 0.85,
  },
  calendarModalScroll: {
    flex: 1,
  },
  calendarModalScrollContent: {
    paddingHorizontal: sp.l,
    paddingBottom: sp.m,
    gap: sp.l,
  },
  calendarLegendRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: sp.s,
    borderWidth: 1,
    borderRadius: radius.l,
    paddingVertical: sp.s,
    paddingHorizontal: sp.m,
    marginBottom: sp.s,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  legendLabel: {
    color: lt.text,
    fontSize: 12,
    fontWeight: '600',
  },
  calendarMonthBlock: {
    backgroundColor: lt.surface,
    borderRadius: radius.xl,
    padding: sp.l,
    gap: sp.m,
  },
  calendarMonthLabel: {
    fontSize: 18,
    fontWeight: '700',
    color: lt.text,
  },
  calendarWeekHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  calendarWeekdayText: {
    flex: 1,
    textAlign: 'center',
    fontSize: 12,
    color: lt.textMuted,
    fontWeight: '600',
  },
  calendarMonthGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
  },
  calendarMonthDay: {
    width: MONTH_DAY_WIDTH,
    aspectRatio: 1,
    borderRadius: radius.l,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: lt.surfaceMuted,
  },
  calendarMonthDayPressed: {
    opacity: 0.9,
  },
  calendarPauseRange: {
    backgroundColor: 'rgba(16,104,74,0.12)',
  },
  calendarPauseRangeActive: {
    backgroundColor: 'rgba(16,104,74,0.18)',
    borderColor: 'rgba(16,104,74,0.6)',
    borderWidth: 2,
  },
  calendarMonthDayMuted: {
    backgroundColor: 'rgba(0,0,0,0.03)',
  },
  calendarMonthDayHidden: {
    backgroundColor: 'transparent',
    opacity: 0,
  },
  calendarMonthDayTextHidden: {
    color: 'transparent',
  },
  calendarMonthDaySelected: {
    borderWidth: 2,
    borderColor: lt.primary,
  },
  calendarMonthDayToday: {
    borderWidth: 1,
    borderColor: lt.primaryMuted,
  },
  calendarMonthDayText: {
    fontSize: 16,
    fontWeight: '600',
    color: lt.text,
    textAlign: 'center',
    lineHeight: 18,
  },
  calendarMonthDayTextMuted: {
    color: lt.textMuted,
  },
  calendarMonthDayTextSelected: {
    color: lt.primary,
  },
  calendarIndicatorRow: {
    flexDirection: 'row',
    gap: 4,
    marginTop: 6,
  },
  calendarIndicatorDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  calendarIndicatorTask: {
    backgroundColor: lt.primary,
  },
  calendarIndicatorConsumption: {
    backgroundColor: lt.success,
  },
  calendarIndicatorOther: {
    backgroundColor: lt.warning,
  },
  activitiesScreen: {
    flex: 1,
    backgroundColor: lt.bg,
    paddingHorizontal: sp.l,
    paddingTop: sp.xl,
    paddingBottom: sp.xl,
    gap: sp.m,
  },
  activitiesHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  activitiesTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: lt.text,
  },
  activitiesSubtitle: {
    fontSize: 14,
    color: lt.textMuted,
    marginTop: 4,
  },
  activitiesCloseBtn: {
    width: 32,
    height: 32,
    borderRadius: radius.pill,
    backgroundColor: lt.surfaceMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  activitiesCloseBtnPressed: {
    opacity: 0.85,
  },
  activitiesScrollFull: {
    flex: 1,
  },
  activitiesList: {
    paddingBottom: sp.xl,
    gap: sp.m,
  },
  activityBlock: {
    backgroundColor: lt.surface,
    borderRadius: radius.xl,
    padding: sp.l,
    gap: sp.s,
    ...shadows.sm,
  },
  activityBlockHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: sp.m,
  },
  activityIconWrap: {
    width: 40,
    height: 40,
    borderRadius: radius.pill,
    backgroundColor: lt.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  activityLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: lt.text,
  },
  activityValue: {
    fontSize: 14,
    color: lt.textMuted,
  },
  activityDetails: {
    gap: sp.s,
    marginTop: sp.s,
  },
  activityDetailRow: {
    flexDirection: 'row',
    gap: sp.m,
    alignItems: 'center',
  },
  activityDetailIcon: {
    width: 34,
    height: 34,
    borderRadius: radius.l,
    backgroundColor: lt.surfaceMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  activityDetailLabel: {
    fontSize: 12,
    color: lt.textMuted,
    textTransform: 'uppercase',
  },
  activityDetailValue: {
    fontSize: 14,
    fontWeight: '600',
    color: lt.text,
  },
  activityEmptyWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  activityEmpty: {
    fontSize: 15,
    color: lt.textMuted,
    fontStyle: 'italic',
  },
});

const createTrackSectionStyles = (colors: ThemeColors, mode: ThemeMode) =>
  StyleSheet.create({
    section: {
      width: '100%',
      borderRadius: radius.xl,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: mode === 'dark' ? 'rgba(26,40,31,0.92)' : 'rgba(255,255,255,0.96)',
      padding: spacing.l as number,
      gap: spacing.m as number,
      shadowColor: mode === 'dark' ? '#000' : colors.primary,
      shadowOpacity: mode === 'dark' ? 0.35 : 0.12,
      shadowRadius: 18,
      shadowOffset: { width: 0, height: 10 },
      elevation: 6,
  },
});
