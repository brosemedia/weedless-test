/**
 * PausePlannerScreen - Modernisierte UI/UX
 * - Scrollbare Liste aller Pausen
 * - Große, freundliche Auswahl-Buttons
 * - PauseCalendar in jeder Pause-Karte
 * - Klickbar für Details
 *
 */
import React, { useEffect, useMemo, useState } from 'react';
import { ScrollView, View, Text, Pressable, StyleSheet, Modal, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { addDays, addMonths, differenceInCalendarDays, format } from 'date-fns';
import { de } from 'date-fns/locale';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { spacing, radius } from '../../design/tokens';
import { FrostedSurface } from '../../design/FrostedSurface';
import { BlurView } from 'expo-blur';
import { useApp } from '../../store/app';
import { usePauseEngine } from '../../hooks/usePauseEngine';
import { DateTimePickerModal } from '../../components/DateTimePickerModal';
import { calculatePauseStats, parseDateKey, pauseDurationInDays, toDateKey } from '../../lib/pause';
import { getPauseTimeInfo } from '../../lib/pauseTime';
import { useTheme } from '../../theme/useTheme';
import { ThemedText, SectionHeader } from '../../design/theme';
import PauseCalendar from '../../components/PauseCalendar';
import { haptics } from '../../services/haptics';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withSpring, 
  withRepeat,
  withTiming,
  interpolate, 
  Extrapolation,
  Easing,
} from 'react-native-reanimated';

const PRESETS = [
  { label: '3 Tage', days: 3, icon: 'calendar-today' },
  { label: '7 Tage', days: 7, icon: 'calendar-week' },
  { label: '14 Tage', days: 14, icon: 'calendar-range' },
  { label: '1 Monat', days: 30, icon: 'calendar-month' },
] as const;

const DAY_MS = 86_400_000;

// Hilfsfunktion: Konsistenter Fortschritt auf Basis vergebener XP-Tage
const getCompletedDaysForPause = (pause: any) => {
  const total = pauseDurationInDays(pause);
  const uniqueAwarded = new Set(
    Array.isArray(pause.xpAwardedDays) ? pause.xpAwardedDays.map((d: string) => d.slice(0, 10)) : []
  ).size;
  const done = Math.min(total, uniqueAwarded);
  if (pause.status === 'aktiv') {
    return done;
  }
  // Bei abgeschlossenen Pausen mindestens total anzeigen
  return Math.max(done, total);
};

// Pause Detail Modal
type PauseDetailModalProps = {
  pause: any;
  visible: boolean;
  onClose: () => void;
  profile: any;
  now: Date;
};

function PauseDetailModal({ pause, visible, onClose, profile, now }: PauseDetailModalProps) {
  const { theme, mode } = useTheme();
  const palette = theme.colors;
  const insets = useSafeAreaInsets();
  const [modalVisible, setModalVisible] = useState(false);

  React.useEffect(() => {
    setModalVisible(visible);
  }, [visible]);

  if (!pause) return null;

  const stats = pause.stats || (profile ? calculatePauseStats(pause, profile) : undefined);
  const days = pauseDurationInDays(pause);
  const pauseInfo = getPauseTimeInfo(pause.startDate, pause.endDate, now, {
    startTimestamp: pause.startTimestamp,
    endTimestamp: pause.endTimestamp,
  });

  return (
    <Modal
      visible={modalVisible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <View style={[styles.modalOverlay, { paddingTop: insets.top }]}>
        {/* Subtiler Blur statt schwarzer Overlay */}
        <BlurView
          intensity={20}
          tint={theme.mode === 'dark' ? 'dark' : 'light'}
          style={StyleSheet.absoluteFill}
        />
        <Pressable 
          style={StyleSheet.absoluteFill} 
          onPress={onClose}
        />
        <View style={[
          styles.modalContent, 
          { 
            backgroundColor: palette.surface,
            borderTopLeftRadius: radius.xl,
            borderTopRightRadius: radius.xl,
          }
        ]}>
          {/* Header */}
          <View style={styles.modalHeader}>
            <ThemedText kind="h2" style={{ color: palette.text }}>
              Pause Details
            </ThemedText>
            <Pressable onPress={onClose} hitSlop={12}>
              <MaterialCommunityIcons name="close" size={24} color={palette.text} />
            </Pressable>
          </View>

          <ScrollView 
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: spacing.xl }}
          >
            {/* Datum & Status */}
            <View style={[styles.detailSection, { borderBottomColor: palette.border }]}>
              <ThemedText kind="label" style={{ color: palette.textMuted, marginBottom: spacing.s }}>
                Zeitraum
              </ThemedText>
              <ThemedText kind="h2" style={{ color: palette.text }}>
                {format(parseDateKey(pause.startDate), 'dd.MM.yyyy', { locale: de })} – {format(parseDateKey(pause.endDate), 'dd.MM.yyyy', { locale: de })}
              </ThemedText>
              <ThemedText style={{ color: palette.textMuted, marginTop: spacing.xs }}>
                {days} Tage · {pause.status === 'aktiv' ? 'Aktiv' : pause.status === 'abgeschlossen' ? 'Abgeschlossen' : 'Abgebrochen'}
              </ThemedText>
            </View>

            {/* Kalender */}
            <View style={[styles.detailSection, { borderBottomColor: palette.border }]}>
              <ThemedText kind="label" style={{ color: palette.textMuted, marginBottom: spacing.m }}>
                Fortschritt
              </ThemedText>
              <PauseCalendar pause={pause} />
            </View>

            {/* Statistiken */}
            {stats && (
              <View style={styles.detailSection}>
                <ThemedText kind="label" style={{ color: palette.textMuted, marginBottom: spacing.m, textTransform: 'uppercase' }}>
                  Gespart
                </ThemedText>
                <View style={styles.statsGrid}>
                  <View style={[
                    styles.statCard, 
                    { 
                      backgroundColor: palette.surfaceMuted,
                      borderColor: palette.border,
                    }
                  ]}>
                    <View style={[styles.statIconContainer, { backgroundColor: `${palette.primary}15` }]}>
                      <MaterialCommunityIcons name="cash-multiple" size={28} color={palette.primary} />
                    </View>
                    <ThemedText kind="h2" style={{ color: palette.text, marginTop: spacing.m, fontSize: 24 }}>
                      {new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(Math.round(stats.savedMoney))}
                    </ThemedText>
                    <ThemedText style={{ color: palette.textMuted, fontSize: 13, marginTop: spacing.xs }}>
                      Geld gespart
                    </ThemedText>
                  </View>
                  <View style={[
                    styles.statCard, 
                    { 
                      backgroundColor: palette.surfaceMuted,
                      borderColor: palette.border,
                    }
                  ]}>
                    <View style={[styles.statIconContainer, { backgroundColor: `${palette.primary}15` }]}>
                      <MaterialCommunityIcons name="leaf" size={28} color={palette.primary} />
                    </View>
                    <ThemedText kind="h2" style={{ color: palette.text, marginTop: spacing.m, fontSize: 24 }}>
                      {new Intl.NumberFormat('de-DE', { maximumFractionDigits: 1 }).format(stats.savedGrams)} g
                    </ThemedText>
                    <ThemedText style={{ color: palette.textMuted, fontSize: 13, marginTop: spacing.xs }}>
                      Gramm vermieden
                    </ThemedText>
                  </View>
                  <View style={[
                    styles.statCard, 
                    { 
                      backgroundColor: palette.surfaceMuted,
                      borderColor: palette.border,
                    }
                  ]}>
                    <View style={[styles.statIconContainer, { backgroundColor: `${palette.primary}15` }]}>
                      <MaterialCommunityIcons name="clock-check" size={28} color={palette.primary} />
                    </View>
                    <ThemedText kind="h2" style={{ color: palette.text, marginTop: spacing.m, fontSize: 24 }}>
                      {new Intl.NumberFormat('de-DE', { maximumFractionDigits: 1 }).format(stats.savedTimeHours)} h
                    </ThemedText>
                    <ThemedText style={{ color: palette.textMuted, fontSize: 13, marginTop: spacing.xs }}>
                      Zeit zurückgewonnen
                    </ThemedText>
                  </View>
                </View>
              </View>
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

// Aktive Pause Status Card mit Animation
type ActivePauseStatusCardProps = {
  pause: any;
  pauseInfo: any;
  completedDays: number;
  totalDays: number;
  onPress: () => void;
  onEndPause: () => void;
};

function ActivePauseStatusCard({ pause, pauseInfo, completedDays, totalDays, onPress, onEndPause }: ActivePauseStatusCardProps) {
  const { theme } = useTheme();
  const palette = theme.colors;
  const isDark = theme.mode === 'dark';
  const pulseScale = useSharedValue(1);
  const pulseOpacity = useSharedValue(0.3);
  const dotPulse = useSharedValue(0);
  
  React.useEffect(() => {
    // Pulsierende Animation für Hintergrund
    pulseScale.value = withRepeat(
      withTiming(1.05, { duration: 2000, easing: Easing.inOut(Easing.ease) }),
      -1,
      true
    );
    pulseOpacity.value = withRepeat(
      withTiming(0.6, { duration: 2000, easing: Easing.inOut(Easing.ease) }),
      -1,
      true
    );
    dotPulse.value = withRepeat(
      withTiming(1, { duration: 900, easing: Easing.inOut(Easing.ease) }),
      -1,
      true
    );
  }, []);

  const pulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulseScale.value }],
    opacity: pulseOpacity.value,
  }));
  const dotStyle = useAnimatedStyle(() => ({
    opacity: 0.55 + dotPulse.value * 0.35,
    transform: [{ scale: 0.9 + dotPulse.value * 0.4 }],
  }));

  return (
    <View>
      <Pressable onPress={onPress} style={({ pressed }) => [{ opacity: pressed ? 0.9 : 1 }]}>
        <FrostedSurface
          borderRadius={radius.xl}
          intensity={85}
          fallbackColor={isDark ? 'rgba(46,160,79,0.65)' : palette.surface}
          overlayColor={isDark ? 'rgba(143,177,58,0.18)' : `${palette.primary}08`}
          style={{
            padding: spacing.xl,
            gap: spacing.m,
            borderWidth: 1,
            borderColor: isDark ? 'rgba(143,177,58,0.35)' : palette.border,
            backgroundColor: isDark ? 'rgba(31,49,35,0.85)' : palette.surface,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.08,
            shadowRadius: 8,
            elevation: 3,
          }}
        >
          {/* Pulsierender Hintergrund - sehr subtil */}
          <Animated.View
            style={[
              StyleSheet.absoluteFill,
              {
                backgroundColor: palette.primary,
                borderRadius: radius.xl,
                opacity: 0.03,
              },
              pulseStyle,
            ]}
          />

          {/* Blinkender Aktiv-Dot */}
          <Animated.View
            style={[
              {
                position: 'absolute',
                top: spacing.s,
                right: spacing.s,
                width: 16,
                height: 16,
                borderRadius: 8,
                backgroundColor: palette.primary,
                shadowColor: palette.primary,
                shadowOpacity: isDark ? 0.85 : 0.55,
                shadowRadius: isDark ? 12 : 8,
                shadowOffset: { width: 0, height: 0 },
              },
              dotStyle,
            ]}
          />

          {/* Content */}
          <View style={{ position: 'relative', zIndex: 1 }}>
            <View style={{ marginBottom: spacing.m }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.s, marginBottom: spacing.xs }}>
                <MaterialCommunityIcons name="pause-circle" size={22} color={palette.text} />
                <ThemedText kind="h2" style={{ color: palette.text, fontSize: 20 }}>
                  Pause aktiv
                </ThemedText>
              </View>
              <ThemedText style={{ color: palette.textMuted, fontSize: 14 }}>
                {format(parseDateKey(pause.startDate), 'dd.MM.yyyy', { locale: de })} – {format(parseDateKey(pause.endDate), 'dd.MM.yyyy', { locale: de })}
              </ThemedText>
            </View>

            {/* Fortschritt */}
            <View style={{ marginBottom: spacing.m }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.s }}>
                <ThemedText style={{ color: palette.textMuted, fontSize: 12, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                  Fortschritt
                </ThemedText>
                <ThemedText style={{ color: palette.text, fontWeight: '700', fontSize: 15 }}>
                  {completedDays} / {totalDays} Tage
                </ThemedText>
              </View>
              <View style={{ height: 4, borderRadius: radius.pill, backgroundColor: palette.surfaceMuted, overflow: 'hidden' }}>
                <Animated.View
                  style={{
                    height: '100%',
                    backgroundColor: palette.primary,
                    width: `${Math.min(100, (completedDays / totalDays) * 100)}%`,
                    borderRadius: radius.pill,
                  }}
                />
              </View>
            </View>

            {/* Zeit Info - Pill Style */}
            {pauseInfo && (
              <View style={[styles.timeInfoPill, { backgroundColor: palette.surfaceMuted, borderColor: palette.border }]}>
                <MaterialCommunityIcons name="clock-outline" size={16} color={palette.textMuted} />
                <ThemedText style={{ color: palette.text, fontWeight: '500', marginLeft: spacing.xs, fontSize: 13 }}>
                  {pauseInfo.displayLabel}
                </ThemedText>
              </View>
            )}

            {/* Tap Hint */}
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: spacing.m, paddingTop: spacing.s, borderTopWidth: 1, borderTopColor: palette.border }}>
              <ThemedText style={{ color: palette.textMuted, fontSize: 12, marginRight: spacing.xs }}>
                Für Details tippen
              </ThemedText>
              <MaterialCommunityIcons name="chevron-down" size={16} color={palette.textMuted} />
            </View>
          </View>
        </FrostedSurface>
      </Pressable>

      {/* Pause beenden Button - außerhalb der klickbaren Karte */}
      <Pressable
        onPress={onEndPause}
        style={({ pressed }) => [
          {
            marginTop: spacing.m,
            paddingVertical: spacing.m,
            paddingHorizontal: spacing.l,
            borderRadius: radius.pill,
            backgroundColor: pressed ? `${palette.primary}20` : `${palette.primary}15`,
            borderWidth: 1,
            borderColor: `${palette.primary}40`,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            gap: spacing.s,
          },
        ]}
      >
        <MaterialCommunityIcons name="stop-circle" size={20} color={palette.primary} />
        <ThemedText style={{ color: palette.primary, fontWeight: '600', fontSize: 15 }}>
          Pause beenden
        </ThemedText>
      </Pressable>
    </View>
  );
}

// Pause Card Component
type PauseCardProps = {
  pause: any;
  onPress: () => void;
  profile: any;
  now: Date;
  isActive?: boolean;
};

function PauseCard({ pause, onPress, profile, now, isActive }: PauseCardProps) {
  const { theme } = useTheme();
  const palette = theme.colors;
  const days = pauseDurationInDays(pause);
  const pauseInfo = getPauseTimeInfo(pause.startDate, pause.endDate, now, {
    startTimestamp: pause.startTimestamp,
    endTimestamp: pause.endTimestamp,
  });

  const getStatusColor = () => {
    if (pause.status === 'aktiv') return palette.primary;
    if (pause.status === 'abgeschlossen') return '#4CAF50';
    return palette.textMuted;
  };

  const getStatusLabel = () => {
    if (pause.status === 'aktiv') return 'Aktiv';
    if (pause.status === 'abgeschlossen') return 'Abgeschlossen';
    return 'Abgebrochen';
  };

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.pauseCard,
        {
          backgroundColor: palette.surface,
          borderColor: isActive ? palette.primary : palette.border,
          borderWidth: isActive ? 2 : 1,
          opacity: pressed ? 0.8 : 1,
        },
      ]}
    >
      {/* Header */}
      <View style={styles.pauseCardHeader}>
        <View style={{ flex: 1 }}>
          <ThemedText kind="h2" style={{ color: palette.text, fontSize: 17 }}>
            {format(parseDateKey(pause.startDate), 'dd.MM.yyyy', { locale: de })} – {format(parseDateKey(pause.endDate), 'dd.MM.yyyy', { locale: de })}
          </ThemedText>
          <ThemedText style={{ color: palette.textMuted, marginTop: 4, fontSize: 14 }}>
            {days} Tage
          </ThemedText>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: `${getStatusColor()}15` }]}>
          <View style={[styles.statusDot, { backgroundColor: getStatusColor() }]} />
          <ThemedText style={{ color: getStatusColor(), fontSize: 12, fontWeight: '600', marginLeft: 6 }}>
            {getStatusLabel()}
          </ThemedText>
        </View>
      </View>

      {/* Kalender (kompakt) - nur bei aktiven Pausen */}
      {isActive && (
        <View style={styles.calendarContainer}>
          <PauseCalendar pause={pause} compact />
        </View>
      )}

      {/* Zeit Info - nur bei aktiven Pausen */}
      {isActive && pauseInfo && (
        <View style={[styles.timeInfoPill, { backgroundColor: `${palette.primary}10`, borderColor: `${palette.primary}20` }]}>
          <MaterialCommunityIcons name="clock-outline" size={16} color={palette.primary} />
          <ThemedText style={{ color: palette.text, fontSize: 13, marginLeft: spacing.xs, fontWeight: '500' }}>
            {pauseInfo.displayLabel}
          </ThemedText>
        </View>
      )}

      {/* Tap Hint */}
      <View style={styles.tapHint}>
        <ThemedText style={{ color: palette.textMuted, fontSize: 12, marginRight: spacing.xs }}>
          Für Details tippen
        </ThemedText>
        <MaterialCommunityIcons name="chevron-right" size={18} color={palette.textMuted} />
      </View>
    </Pressable>
  );
}

export default function PausePlannerScreen({ navigation }: any) {
  usePauseEngine();
  const { theme } = useTheme();
  const palette = theme.colors;
  const isDark = theme.mode === 'dark';
  const insets = useSafeAreaInsets();
  const pauses = useApp((s) => s.pauses);
  const profile = useApp((s) => s.profile);
  const startPause = useApp((s) => s.startPause);
  const endPause = useApp((s) => s.endPause);
  
  const headerHeight = 44;
  const [selection, setSelection] = useState<typeof PRESETS[number]['days'] | 'custom'>(PRESETS[1].days);
  const [customStart, setCustomStart] = useState(new Date());
  const [customEnd, setCustomEnd] = useState(addDays(new Date(), 7));
  const [picker, setPicker] = useState<null | 'start' | 'end'>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [selectedPause, setSelectedPause] = useState<any>(null);
  const [now, setNow] = useState(() => new Date());
  const [showEndPauseModal, setShowEndPauseModal] = useState(false);

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(id);
  }, []);

  const activePause = pauses.find((pause) => pause.status === 'aktiv');
  const sortedPauses = useMemo(() => [...pauses].sort((a, b) => (b.createdAt ?? 0) - (a.createdAt ?? 0)), [pauses]);

  const todayKey = toDateKey(new Date());
  const derivedRange = useMemo(() => {
    if (selection === 'custom') {
      return { start: toDateKey(customStart), end: toDateKey(customEnd) };
    }
    const start = todayKey;
    const end = toDateKey(addDays(new Date(), selection - 1));
    return { start, end };
  }, [selection, customStart, customEnd, todayKey]);

  const durationDays = Math.max(
    1,
    differenceInCalendarDays(parseDateKey(derivedRange.end), parseDateKey(derivedRange.start)) + 1
  );

  const handleStartPause = () => {
    if (activePause) {
      setStatus('Es läuft bereits eine Pause.');
      return;
    }
    const nowTs = Date.now();
    const plannedStartTs = selection === 'custom' ? customStart.getTime() : nowTs;
    const durationDaysClamped = Math.max(1, durationDays);
    const rawEndTs =
      selection === 'custom'
        ? customEnd.getTime()
        : plannedStartTs + durationDaysClamped * DAY_MS;
    const plannedEndTs = Math.max(plannedStartTs + 60_000, rawEndTs);
    const startDateKey = toDateKey(new Date(plannedStartTs));
    const endDateKey =
      selection === 'custom'
        ? toDateKey(customEnd)
        : toDateKey(new Date(plannedStartTs + (durationDaysClamped - 1) * DAY_MS));
    const result = startPause({
      startDate: startDateKey,
      endDate: endDateKey,
      startTimestamp: plannedStartTs,
      endTimestamp: plannedEndTs,
    });
    if (result.ok) {
      haptics.trigger('pause', 'success');
      setStatus('Pause gestartet!');
      setSelection(PRESETS[1].days);
    } else if (result.reason === 'date-order') {
      setStatus('Enddatum muss nach dem Start liegen.');
    } else {
      setStatus('Es ist bereits eine Pause aktiv.');
    }
  };

  const handleEndPause = (status: 'abgeschlossen' | 'abgebrochen') => {
    endPause(status);
    setStatus(status === 'abgeschlossen' ? 'Pause erfolgreich abgeschlossen!' : 'Pause abgebrochen.');
  };

  return (
    <>
      <ScrollView
        contentContainerStyle={{
          paddingTop: insets.top + headerHeight + spacing.s,
          paddingBottom: Math.max(insets.bottom + spacing.xl, spacing.xl) + 100,
          paddingHorizontal: spacing.xl,
          gap: spacing.m,
        }}
      >
        {/* Header */}
        <View style={{ gap: spacing.xs, marginBottom: spacing.xs }}>
          <ThemedText kind="h1" style={{ color: palette.text, fontSize: 24 }}>Pause einlegen</ThemedText>
          <ThemedText style={{ color: palette.textMuted, fontSize: 13 }}>
            Kurze Auszeiten helfen dir, Körper und Kopf Luft zu verschaffen.
          </ThemedText>
        </View>

        {/* Aktive Pause Status - Großer Button */}
        {activePause && (() => {
          const pauseInfo = getPauseTimeInfo(activePause.startDate, activePause.endDate, now, {
            startTimestamp: activePause.startTimestamp,
            endTimestamp: activePause.endTimestamp,
          });
          const days = pauseDurationInDays(activePause);
          const completedDays = getCompletedDaysForPause(activePause);
          
          return (
            <ActivePauseStatusCard
              pause={activePause}
              pauseInfo={pauseInfo}
              completedDays={completedDays}
              totalDays={days}
              onPress={() => {
                haptics.trigger('pause', 'selection', { intensity: 'medium' });
                setSelectedPause(activePause);
              }}
              onEndPause={() => {
                setShowEndPauseModal(true);
              }}
            />
          );
        })()}

        {/* Neue Pause planen - nur wenn keine Pause aktiv */}
        {!activePause && (
        <View style={{ gap: spacing.m }}>
          <View style={{ marginBottom: spacing.xs }}>
            <ThemedText kind="h2" style={{ fontSize: 18, marginBottom: 4 }}>Dauer auswählen</ThemedText>
            <View style={{ height: 3, width: 36, backgroundColor: palette.primary, borderRadius: 2 }} />
          </View>
          
          {/* Vertikale Preset-Buttons - kompakt */}
          <View style={styles.presetVerticalList}>
            {PRESETS.map((preset) => {
              const active = selection === preset.days;
              return (
                <Pressable
                  key={preset.label}
                  onPress={() => {
                    haptics.trigger('pause', 'selection', { intensity: 'light' });
                    setSelection(preset.days);
                  }}
                  style={({ pressed }) => [
                    styles.presetButtonVertical,
                    {
                      backgroundColor: active ? palette.primary : palette.surfaceMuted,
                      borderColor: active ? palette.primary : palette.border,
                      opacity: pressed ? 0.8 : 1,
                    },
                  ]}
                >
                  <MaterialCommunityIcons
                    name={preset.icon as any}
                    size={20}
                    color={active ? palette.surface : palette.textMuted}
                  />
                  <ThemedText
                    style={{
                      color: active ? palette.surface : palette.text,
                      fontWeight: '600',
                      marginLeft: spacing.s,
                      fontSize: 15,
                    }}
                  >
                    {preset.label}
                  </ThemedText>
                </Pressable>
              );
            })}
            <Pressable
              onPress={() => {
                haptics.trigger('pause', 'selection', { intensity: 'light' });
                setSelection('custom');
              }}
              style={({ pressed }) => [
                styles.presetButtonVertical,
                {
                  backgroundColor: selection === 'custom' ? palette.primary : palette.surfaceMuted,
                  borderColor: selection === 'custom' ? palette.primary : palette.border,
                  opacity: pressed ? 0.8 : 1,
                },
              ]}
            >
              <MaterialCommunityIcons
                name="calendar-edit"
                size={20}
                color={selection === 'custom' ? palette.surface : palette.textMuted}
              />
              <ThemedText
                style={{
                  color: selection === 'custom' ? palette.surface : palette.text,
                  fontWeight: '600',
                  marginLeft: spacing.s,
                  fontSize: 15,
                }}
              >
                Individuell
              </ThemedText>
            </Pressable>
          </View>

          {/* Custom Date Picker */}
          {selection === 'custom' && (
            <View style={{ gap: spacing.m }}>
              <Pressable
                onPress={() => setPicker('start')}
                style={({ pressed }) => [
                  styles.dateButton,
                  {
                    backgroundColor: palette.surfaceMuted,
                    borderColor: palette.border,
                    opacity: pressed ? 0.8 : 1,
                  },
                ]}
              >
                <MaterialCommunityIcons name="calendar-start" size={20} color={palette.primary} />
                <View style={{ flex: 1, marginLeft: spacing.s }}>
                  <ThemedText style={{ color: palette.textMuted, fontSize: 12 }}>Startdatum</ThemedText>
                  <ThemedText style={{ color: palette.text, fontWeight: '600' }}>
                    {format(customStart, 'PPPP', { locale: de })}
                  </ThemedText>
                </View>
                <MaterialCommunityIcons name="chevron-right" size={20} color={palette.textMuted} />
              </Pressable>
              <Pressable
                onPress={() => setPicker('end')}
                style={({ pressed }) => [
                  styles.dateButton,
                  {
                    backgroundColor: palette.surfaceMuted,
                    borderColor: palette.border,
                    opacity: pressed ? 0.8 : 1,
                  },
                ]}
              >
                <MaterialCommunityIcons name="calendar-end" size={20} color={palette.primary} />
                <View style={{ flex: 1, marginLeft: spacing.s }}>
                  <ThemedText style={{ color: palette.textMuted, fontSize: 12 }}>Enddatum</ThemedText>
                  <ThemedText style={{ color: palette.text, fontWeight: '600' }}>
                    {format(customEnd, 'PPPP', { locale: de })}
                  </ThemedText>
                </View>
                <MaterialCommunityIcons name="chevron-right" size={20} color={palette.textMuted} />
              </Pressable>
            </View>
          )}

          {/* Live-Übersicht - Zusammenfassung */}
          <View style={[styles.summaryCard, { backgroundColor: palette.surfaceMuted, borderColor: palette.border }]}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.s, marginBottom: spacing.xs }}>
              <MaterialCommunityIcons name="information-outline" size={16} color={palette.primary} />
              <ThemedText style={{ color: palette.textMuted, fontSize: 11, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                Zusammenfassung
              </ThemedText>
            </View>
            <ThemedText kind="h2" style={{ color: palette.text, marginTop: spacing.xs, fontSize: 16 }}>
              {format(parseDateKey(derivedRange.start), 'dd.MM.yyyy', { locale: de })} – {format(parseDateKey(derivedRange.end), 'dd.MM.yyyy', { locale: de })}
            </ThemedText>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: spacing.xs }}>
              <MaterialCommunityIcons name="calendar-range" size={14} color={palette.textMuted} />
              <ThemedText style={{ color: palette.textMuted, marginLeft: spacing.xs, fontSize: 13 }}>
                {durationDays} {durationDays === 1 ? 'Tag' : 'Tage'}
              </ThemedText>
            </View>
          </View>

          {/* Start Button */}
          <Pressable
            onPress={handleStartPause}
            disabled={!!activePause}
            style={({ pressed }) => [
              styles.startButton,
              {
                backgroundColor: activePause ? palette.surfaceMuted : palette.primary,
                opacity: pressed ? 0.8 : 1,
              },
            ]}
          >
            <MaterialCommunityIcons
              name="play-circle"
              size={24}
              color={activePause ? palette.textMuted : isDark ? '#ffffff' : palette.surface}
            />
            <ThemedText
              style={{
                color: activePause ? palette.textMuted : isDark ? '#ffffff' : palette.surface,
                fontWeight: '700',
                marginLeft: spacing.s,
              }}
            >
              {activePause ? 'Pause bereits aktiv' : 'Pause starten'}
            </ThemedText>
          </Pressable>

          {status && (
            <ThemedText style={{ color: palette.primary, textAlign: 'center', marginTop: spacing.s }}>
              {status}
            </ThemedText>
          )}
        </View>
        )}

        {/* Alle Pausen - Scrollbare Liste */}
        {sortedPauses.length > 0 && (
          <View style={{ gap: spacing.m }}>
            <SectionHeader title="Alle Pausen" />
            {sortedPauses.map((pause) => (
              <PauseCard
                key={pause.id}
                pause={pause}
                onPress={() => {
                  haptics.trigger('pause', 'selection', { intensity: 'medium' });
                  setSelectedPause(pause);
                }}
                profile={profile}
                now={now}
                isActive={pause.status === 'aktiv'}
              />
            ))}
          </View>
        )}
      </ScrollView>

      {/* Detail Modal */}
      {selectedPause && (
        <PauseDetailModal
          pause={selectedPause}
          visible={!!selectedPause}
          onClose={() => setSelectedPause(null)}
          profile={profile}
          now={now}
        />
      )}

      {/* Date Pickers */}
      <DateTimePickerModal
        visible={picker === 'start'}
        date={customStart}
        locale="de-DE"
        onChange={(date) => {
          setCustomStart(date);
          if (date > customEnd) {
            setCustomEnd(addDays(date, 3));
          }
        }}
        onDismiss={() => setPicker(null)}
        onConfirm={() => setPicker(null)}
        minimumDate={new Date()}
        maximumDate={addMonths(new Date(), 6)}
      />
      <DateTimePickerModal
        visible={picker === 'end'}
        date={customEnd}
        locale="de-DE"
        onChange={(date) => setCustomEnd(date)}
        onDismiss={() => setPicker(null)}
        onConfirm={() => {
          if (customEnd < customStart) {
            setCustomEnd(addDays(customStart, 1));
          }
          setPicker(null);
        }}
        minimumDate={customStart}
        maximumDate={addMonths(new Date(), 12)}
      />

      {/* Pause beenden Modal */}
      <Modal
        visible={showEndPauseModal}
        animationType="fade"
        transparent
        onRequestClose={() => setShowEndPauseModal(false)}
      >
        <View style={[styles.modalOverlay, { paddingTop: insets.top, justifyContent: 'center' }]}>
          <BlurView
            intensity={20}
            tint={theme.mode === 'dark' ? 'dark' : 'light'}
            style={StyleSheet.absoluteFill}
          />
          <Pressable 
            style={StyleSheet.absoluteFill} 
            onPress={() => setShowEndPauseModal(false)}
          />
          <Pressable onPress={(e) => e.stopPropagation()}>
            <View style={[
              styles.endPauseModalContent, 
              { 
                backgroundColor: palette.surface,
                borderRadius: radius.xl,
              }
            ]}>
            <ThemedText kind="h2" style={{ color: palette.text, marginBottom: spacing.xl, textAlign: 'center' }}>
              Möchtest du die Pause abbrechen?
            </ThemedText>
            
            <View style={{ gap: spacing.m, width: '100%' }}>
              <Pressable
                onPress={() => {
                  haptics.trigger('pause', 'selection', { intensity: 'light' });
                  setShowEndPauseModal(false);
                }}
                style={({ pressed }) => [
                  {
                    paddingVertical: spacing.m,
                    paddingHorizontal: spacing.l,
                    borderRadius: radius.l,
                    backgroundColor: pressed ? '#4CAF5015' : '#4CAF5020',
                    borderWidth: 2,
                    borderColor: '#4CAF50',
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: spacing.s,
                  },
                ]}
              >
                <MaterialCommunityIcons name="play-circle" size={20} color="#4CAF50" />
                <ThemedText style={{ color: '#4CAF50', fontWeight: '600', fontSize: 16 }}>
                  Pause fortsetzen
                </ThemedText>
              </Pressable>

              <Pressable
                onPress={() => {
                  haptics.trigger('pause', 'selection', { intensity: 'medium' });
                  handleEndPause('abgebrochen');
                  setShowEndPauseModal(false);
                }}
                style={({ pressed }) => [
                  {
                    paddingVertical: spacing.m,
                    paddingHorizontal: spacing.l,
                    borderRadius: radius.l,
                    backgroundColor: pressed ? `${palette.danger}20` : `${palette.danger}15`,
                    borderWidth: 2,
                    borderColor: palette.danger,
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: spacing.s,
                  },
                ]}
              >
                <MaterialCommunityIcons name="stop-circle" size={20} color={palette.danger} />
                <ThemedText style={{ color: palette.danger, fontWeight: '600', fontSize: 16 }}>
                  Pause abbrechen
                </ThemedText>
              </Pressable>
            </View>
          </View>
          </Pressable>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  presetGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.m,
  },
  presetButton: {
    flex: 1,
    minWidth: '45%',
    aspectRatio: 1.2,
    borderRadius: radius.l,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.m,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  presetVerticalList: {
    gap: spacing.s,
  },
  presetButtonVertical: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.m,
    paddingHorizontal: spacing.m,
    borderRadius: radius.l,
    borderWidth: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  dateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.m,
    borderRadius: radius.l,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  summaryCard: {
    padding: spacing.m,
    borderRadius: radius.l,
    gap: spacing.xs,
    borderWidth: 1,
  },
  startButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.m,
    borderRadius: radius.pill,
  },
  pauseCard: {
    borderRadius: radius.xl,
    padding: spacing.l,
    gap: spacing.m,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  pauseCardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.s,
    paddingVertical: spacing.xs,
    borderRadius: radius.pill,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  calendarContainer: {
    marginTop: spacing.s,
  },
  pauseInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.s,
    borderRadius: radius.m,
  },
  timeInfoPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.m,
    paddingVertical: spacing.s,
    borderRadius: radius.pill,
    borderWidth: 1,
    alignSelf: 'flex-start',
  },
  tapHint: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginTop: spacing.s,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'transparent',
    justifyContent: 'flex-end',
  },
  modalContent: {
    maxHeight: '90%',
    padding: spacing.l,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 10,
  },
  endPauseModalContent: {
    padding: spacing.xl,
    margin: spacing.xl,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 10,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.l,
  },
  detailSection: {
    paddingVertical: spacing.l,
    borderBottomWidth: 1,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.m,
  },
  statCard: {
    flex: 1,
    minWidth: '30%',
    padding: spacing.l,
    borderRadius: radius.l,
    alignItems: 'center',
    gap: spacing.xs,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  statIconContainer: {
    width: 56,
    height: 56,
    borderRadius: radius.l,
    alignItems: 'center',
    justifyContent: 'center',
  },
  activeBadge: {
    width: 44,
    height: 44,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  timeInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.m,
    borderRadius: radius.l,
  },
});
