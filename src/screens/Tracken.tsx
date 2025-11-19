import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ScrollView, View, Text, Pressable, StyleSheet, Modal, Image } from 'react-native';
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
  isSameDay,
  isSameMonth,
  startOfDay,
  startOfMonth,
  startOfWeek,
  subMonths,
} from 'date-fns';
import { de } from 'date-fns/locale';
import { Ionicons } from '@expo/vector-icons';
import HeroFigure from '../../assets/1900_81.svg';
import { colors, spacing, radius, shadows } from '../design/tokens';
import { HEADER_TOTAL_HEIGHT } from '../components/AppHeader';
import CheckForm, { type DailyCheckinData } from '../components/MultiStepDailyCheckin';
import { useApp } from '../store/app';
import { useQuickActionsVisibility } from '../hooks/useQuickActionsVisibility';
import { useHeaderTransparency } from '../hooks/useHeaderTransparency';
import { usePauseEngine } from '../hooks/usePauseEngine';
import { TASK_XP } from '../lib/tasks';
import StroopGame from '../games/stroop/StroopGame';
import { getLastStroopSummary, type SessionSummary } from '../games/stroop/storage';
import type { DayLog } from '../types/profile';
import { FrostedSurface } from '../design/FrostedSurface';
import { dayKeysBetween, parseDateKey } from '../lib/pause';
import { createConsumptionEntry } from '../lib/consumption';
import { useUiStore } from '../store/ui';

type TaskId = 'reaction-test' | 'stroop-focus' | 'breathing-session' | 'zen-glide' | 'daily-check-in';

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
  'daily-check-in': 'calendar-outline',
};

const lt = colors.light;
const sp = spacing;
const CONSUMED_ICON = require('../../assets/cannabis_icons/Cannabis_4.png');
const THC_FREE_ICON = require('../../assets/cannabis_icons/Cannabis_15.png');

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

const buildMonthDays = (monthStart: Date) => {
  const start = startOfWeek(monthStart, { weekStartsOn: 1 });
  const end = endOfWeek(endOfMonth(monthStart), { weekStartsOn: 1 });
  return eachDayOfInterval({ start, end });
};

const WEEKDAY_SHORT = ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'];
const MONTH_DAY_WIDTH = `${100 / 7}%`;
const MONTHS_BEFORE_TODAY = 5;
const TOTAL_MONTHS = 12;
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
  hasConsumption: boolean;
  showStatusIcon: boolean;
  onPress: () => void;
};

function DayChip({ date, selected, hasConsumption, showStatusIcon, onPress }: DayChipProps) {
  const weekday = format(date, 'EE', { locale: de });
  const dayNumber = format(date, 'd');
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      style={[styles.dayChip, selected && styles.dayChipSelected]}
    >
      <Text style={styles.dayLabel}>{weekday}</Text>
      <View style={styles.dayCircle}>
        <Text style={styles.dayNumber}>{dayNumber}</Text>
      </View>
      {showStatusIcon ? (
        <Image
          source={hasConsumption ? CONSUMED_ICON : THC_FREE_ICON}
          resizeMode="contain"
          accessibilityLabel={hasConsumption ? 'Konsum erfasst' : 'Kein Konsum'}
          style={styles.dayStatusIcon}
        />
      ) : (
        <View style={styles.dayStatusSpacer} />
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
  const iconColor = completed ? lt.surface : lt.navy;
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
            color={disabled ? lt.textMuted : completed ? lt.surface : lt.primary}
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
        {completed ? (
          <View style={[styles.taskInner, styles.taskInnerDone]}>
            {cardContent}
          </View>
        ) : (
          <FrostedSurface
            borderRadius={radius.l}
            intensity={70}
            fallbackColor="rgba(255,255,255,0.04)"
            overlayColor="rgba(255,255,255,0.18)"
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
};

function CalendarOverviewModal({ visible, onClose, onSelectDate, dayLogs, pauseMap }: CalendarOverviewModalProps) {
  useQuickActionsVisibility('tracken-calendar', visible);
  const insets = useSafeAreaInsets();
  const [calendarAnchor, setCalendarAnchor] = useState(() => new Date());
  const [focusedDate, setFocusedDate] = useState(() => new Date());
  const [activityDate, setActivityDate] = useState<Date | null>(null);
  const [activityModalVisible, setActivityModalVisible] = useState(false);
  const [monthBlockHeight, setMonthBlockHeight] = useState<number | null>(null);
  const scrollRef = useRef<ScrollView>(null);
  const initialScrollDone = useRef(false);

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

  const today = startOfDay(new Date());
  const monthStarts = useMemo(() => {
    const base = startOfMonth(subMonths(calendarAnchor, MONTHS_BEFORE_TODAY));
    return Array.from({ length: TOTAL_MONTHS }, (_, idx) => addMonths(base, idx));
  }, [calendarAnchor]);

  useEffect(() => {
    if (!visible || !monthBlockHeight || initialScrollDone.current) return;
    initialScrollDone.current = true;
    requestAnimationFrame(() => {
      scrollRef.current?.scrollTo({ y: MONTHS_BEFORE_TODAY * monthBlockHeight, animated: false });
    });
  }, [visible, monthBlockHeight]);

  const handleDayPress = (day: Date) => {
    setFocusedDate(day);
    onSelectDate(day);
    setActivityDate(day);
    setActivityModalVisible(true);
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
            paddingTop: insets.top + sp.l,
            paddingBottom: Math.max(sp.l as number, insets.bottom + sp.m),
          },
        ]}
      >
        <View style={styles.calendarModalHeader}>
          <View>
            <Text style={styles.calendarModalTitle}>Kalender</Text>
            <Text style={styles.calendarModalSubtitle}>Alle Aktivitäten im Überblick</Text>
          </View>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Kalender schließen"
            onPress={onClose}
            hitSlop={8}
            style={({ pressed }) => [styles.modalCloseBtn, pressed && styles.modalCloseBtnPressed]}
          >
            <Ionicons name="close" size={22} color={lt.text} />
          </Pressable>
        </View>
        <ScrollView
          ref={scrollRef}
          style={styles.calendarModalScroll}
          contentContainerStyle={styles.calendarModalScrollContent}
          showsVerticalScrollIndicator={false}
        >
          {monthStarts.map((monthStart) => {
            const days = buildMonthDays(monthStart);
            return (
              <View
                key={monthStart.toISOString()}
                style={styles.calendarMonthBlock}
                onLayout={(event) => {
                  if (monthBlockHeight) return;
                  setMonthBlockHeight(event.nativeEvent.layout.height);
                }}
              >
                <Text style={styles.calendarMonthLabel}>
                  {format(monthStart, 'LLLL yyyy', { locale: de })}
                </Text>
                <View style={styles.calendarWeekHeader}>
                  {WEEKDAY_SHORT.map((abbr) => (
                    <Text key={abbr} style={styles.calendarWeekdayText}>
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
                    return (
                      <Pressable
                        key={day.toISOString()}
                        accessibilityRole="button"
                        accessibilityLabel={format(day, 'PPPP', { locale: de })}
                        onPress={() => handleDayPress(day)}
                        style={({ pressed }) => [
                          styles.calendarMonthDay,
                          !isCurrentMonth && styles.calendarMonthDayMuted,
                          pauseState === 'past' && styles.calendarPauseRange,
                          pauseState === 'active' && styles.calendarPauseRangeActive,
                          isSelected && styles.calendarMonthDaySelected,
                          isToday && styles.calendarMonthDayToday,
                          pressed && styles.calendarMonthDayPressed,
                        ]}
                      >
                        <Text
                          style={[
                            styles.calendarMonthDayText,
                            !isCurrentMonth && styles.calendarMonthDayTextMuted,
                            isSelected && styles.calendarMonthDayTextSelected,
                          ]}
                        >
                          {format(day, 'd')}
                        </Text>
                        <View style={styles.calendarIndicatorRow}>
                          {hasTasks ? (
                            <View style={[styles.calendarIndicatorDot, styles.calendarIndicatorTask]} />
                          ) : null}
                          {hasConsumption ? (
                            <View
                              style={[styles.calendarIndicatorDot, styles.calendarIndicatorConsumption]}
                            />
                          ) : null}
                          {hasOther ? (
                            <View style={[styles.calendarIndicatorDot, styles.calendarIndicatorOther]} />
                          ) : null}
                        </View>
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
      />
    </Modal>
  );
}

type ActivitiesModalProps = {
  visible: boolean;
  onClose: () => void;
  date: Date | null;
  entries: ActivityEntry[];
};

function ActivitiesModal({ visible, onClose, date, entries }: ActivitiesModalProps) {
  const insets = useSafeAreaInsets();
  const title = date ? format(date, 'EEEE, d. MMMM', { locale: de }) : 'Aktivitäten';
  return (
    <Modal visible={visible} animationType="slide" presentationStyle="fullScreen" onRequestClose={onClose}>
      <SafeAreaView style={[styles.activitiesScreen, { paddingTop: insets.top + sp.l }]}>
        <View style={styles.activitiesHeader}>
          <View>
            <Text style={styles.activitiesTitle}>{title}</Text>
            <Text style={styles.activitiesSubtitle}>Alles auf einen Blick</Text>
          </View>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Aktivitäten schließen"
            onPress={onClose}
            hitSlop={8}
            style={({ pressed }) => [styles.activitiesCloseBtn, pressed && styles.activitiesCloseBtnPressed]}
          >
            <Ionicons name="close" size={20} color={lt.text} />
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
                style={styles.activityBlock}
              >
                <View style={styles.activityBlockHeader}>
                  <View style={styles.activityIconWrap}>
                    <Ionicons name={getActivityIcon(entry.label)} size={20} color={lt.text} />
                  </View>
                  <Text style={styles.activityLabel}>{entry.label}</Text>
                </View>
                {entry.value ? <Text style={styles.activityValue}>{entry.value}</Text> : null}
                {entry.details ? (
                  <View style={styles.activityDetails}>
                    {entry.details.map((detail) => (
                      <View key={`${detail.label}-${detail.value}`} style={styles.activityDetailRow}>
                        <View style={styles.activityDetailIcon}>
                          <Ionicons name={detail.icon} size={18} color={lt.text} />
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text style={styles.activityDetailLabel}>{detail.label}</Text>
                          <Text style={styles.activityDetailValue}>{detail.value}</Text>
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
            <Text style={styles.activityEmpty}>Noch keine Aktivitäten gespeichert</Text>
          </View>
        )}
      </SafeAreaView>
    </Modal>
  );
}

export default function TrackenScreen() {
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
  const [weekStart, setWeekStart] = useState(() => startOfWeek(new Date(), { weekStartsOn: 1 }));
  const [selectedDate, setSelectedDate] = useState(() => new Date());
  const [showCheck, setShowCheck] = useState(false);
  const [showCalendarModal, setShowCalendarModal] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [showStroop, setShowStroop] = useState(false);
  const [activityDate, setActivityDate] = useState<Date | null>(null);
  const [activityModalVisible, setActivityModalVisible] = useState(false);
  const [lastStroop, setLastStroop] = useState<SessionSummary | null>(null);

  const weekDays = useMemo(
    () => Array.from({ length: 7 }, (_, idx) => addDays(weekStart, idx)),
    [weekStart]
  );

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
  const today = startOfDay(new Date());
  const selectedDayStart = startOfDay(selectedDate);
  const isTodaySelected = isSameDay(selectedDayStart, today);
  const stroopChipLabel = lastStroop
    ? `Letztes: ${(lastStroop.accuracy * 100).toFixed(0)}% • ${Math.round(lastStroop.meanRTAll)} ms`
    : undefined;

  const handleSelectDay = (day: Date) => {
    setSelectedDate(day);
    setWeekStart(startOfWeek(day, { weekStartsOn: 1 }));
    if (day) {
      setActivityDate(day);
      setActivityModalVisible(true);
    }
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
    } else if (id === 'daily-check-in') {
      openCheck();
    }
  };

  const openPausePlanner = () => {
    const parent = navigation.getParent()?.getParent() ?? navigation.getParent() ?? navigation;
    parent.navigate('PausePlan');
  };

  const pauseSubtitle = activePause
    ? `Aktiv bis ${format(parseDateKey(activePause.endDate), 'dd.MM.yyyy', { locale: de })}`
    : 'Plane eine Konsumpause in wenigen Sekunden';

  const topOffset = insets.top + HEADER_TOTAL_HEIGHT + headerAccessoryHeight + (sp.l as number);

  return (
    <>
      <ScrollView
        style={styles.screen}
        contentContainerStyle={[styles.body, { paddingTop: topOffset, paddingBottom: Math.max(sp.xxl as number, insets.bottom) }]}
        onScroll={handleScroll}
        scrollEventThrottle={16}
      >
        <View style={styles.calendarCard}>
          <View style={styles.calendarHeader}>
            <Pressable
              accessibilityRole="button"
              onPress={() => changeWeek(-1)}
              style={styles.calendarButton}
            >
              <Ionicons name="chevron-back" size={18} color={lt.text} />
            </Pressable>
            <Text style={styles.calendarMonth}>
              {format(selectedDate, 'LLLL yyyy', { locale: de })}
            </Text>
            <Pressable
              accessibilityRole="button"
              onPress={() => changeWeek(1)}
              style={styles.calendarButton}
            >
              <Ionicons name="chevron-forward" size={18} color={lt.text} />
            </Pressable>
          </View>
          <View style={styles.weekRow}>
            {weekDays.map((day) => (
              <DayChip
                key={day.toISOString()}
                date={day}
                selected={isSameDay(day, selectedDate)}
                hasConsumption={hasConsumption(day)}
                showStatusIcon={isBefore(startOfDay(day), today)}
                onPress={() => handleSelectDay(day)}
              />
            ))}
          </View>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Kalender vergrößern"
          onPress={openCalendarModal}
          style={({ pressed }) => [styles.calendarExpandButton, pressed && styles.calendarExpandButtonPressed]}
        >
          <Ionicons name="grid-outline" size={18} color={lt.primary} />
          <Text style={styles.calendarExpandLabel}>Kalender öffnen</Text>
        </Pressable>
      </View>

      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Check-in starten"
        onPress={openCheck}
        style={({ pressed }) => [styles.checkinCta, pressed && styles.checkinCtaPressed]}
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

      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Pause einlegen"
        onPress={openPausePlanner}
        style={({ pressed }) => [styles.pauseCta, pressed && styles.pauseCtaPressed]}
      >
        <View style={styles.pauseCtaIcon}>
          <Ionicons name="pause-circle" size={24} color={colors.light.primary} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.pauseCtaTitle}>Pause einlegen</Text>
          <Text style={styles.pauseCtaSubtitle}>{pauseSubtitle}</Text>
        </View>
        <Ionicons name="chevron-forward" size={22} color={colors.light.primary} />
      </Pressable>

      <View style={styles.sectionHeaderRow}>
        <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Heute erledigt: {completedCount}/{tasks.length}</Text>
            <Text style={styles.sectionSubtitle}>
              {isTodaySelected ? 'Mini & Track' : 'Aufgaben können nur am heutigen Tag erledigt werden'}
            </Text>
          </View>
          <View style={styles.xpBadgeLarge}>
            <Text style={styles.xpBadgeLabel}>Heute</Text>
            <Text style={styles.xpBadgeValue}>{todayXp} XP</Text>
          </View>
        </View>

        <View style={styles.grid}>
          {tasks.map((task) => {
            const isStroop = task.id === 'stroop-focus';
            return (
              <TaskCard
                key={task.id}
                task={task}
                completed={task.completed}
                disabled={!isTodaySelected}
                infoText={task.info}
                chipLabel={isStroop ? stroopChipLabel : undefined}
                testID={isStroop ? 'task-stroop' : undefined}
                onPress={isTodaySelected ? () => navigateTo(task.id) : undefined}
              />
            );
          })}
        </View>
      </ScrollView>

      <ActivitiesModal
        visible={activityModalVisible}
        onClose={() => setActivityModalVisible(false)}
        date={activityDate}
        entries={activityEntriesForLog(activityDate ? dayLogs[formatKey(activityDate)] : undefined)}
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
        <View style={[styles.modalWrap, { paddingTop: insets.top + sp.xl }]}>
          <View style={styles.modalHead}>
            <Text style={styles.modalTitle}>Check-in</Text>
            <Pressable onPress={closeCheck} accessibilityRole="button" style={styles.modalBtn}>
              <Text style={styles.modalBtnText}>Schließen</Text>
            </Pressable>
          </View>
          <View style={styles.modalCard}>
            <CheckForm
              initial={{ dateISO: selectedDate.toISOString() }}
              onSubmit={submitCheck}
              onCancel={closeCheck}
            />
          </View>
        </View>
      </Modal>
      <CalendarOverviewModal
        visible={showCalendarModal}
        onClose={closeCalendarModal}
        onSelectDate={handleSelectDay}
        dayLogs={dayLogs}
        pauseMap={pauseHighlightMap}
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
    backgroundColor: lt.bg,
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
  calendarCard: {
    backgroundColor: lt.surface,
    borderRadius: radius.xl,
    padding: sp.l,
    ...shadows.md,
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
    color: lt.primary,
    fontWeight: '600',
  },
  checkinCta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: sp.m,
    backgroundColor: lt.primary,
    borderRadius: radius.xl,
    paddingHorizontal: sp.l,
    paddingVertical: sp.m,
    ...shadows.md,
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
    backgroundColor: lt.surface,
    borderRadius: radius.xl,
    paddingHorizontal: sp.l,
    paddingVertical: sp.m,
    borderWidth: 1,
    borderColor: 'rgba(16,104,74,0.2)',
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
  taskCard: {
    width: '48%',
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
    paddingBottom: sp.xxl + sp.s,
    gap: sp.s,
    borderWidth: 2,
    borderColor: lt.primary,
    width: '100%',
    ...shadows.sm,
    height: 280,
  },
  taskInnerBlur: {
    borderColor: lt.primary,
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
    marginBottom: sp.xxl * 2 + sp.m * 2,
  },
  taskActionLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: lt.primary,
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
    backgroundColor: lt.bg,
    paddingHorizontal: sp.l,
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
    color: lt.primary,
    fontWeight: '600',
    fontSize: 14,
  },
  modalCard: {
    flex: 1,
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
    padding: 4,
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
