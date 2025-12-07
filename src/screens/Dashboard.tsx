import React from 'react';
import { ScrollView, View, Image, StyleSheet, Pressable, Platform, Text, ActivityIndicator, Alert } from 'react-native';
const HAZELESS_LOGO = require('../../assets/hazeless_logo_white.png');
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { HEADER_TOTAL_HEIGHT } from '../components/AppHeader';
import { useStore } from '../store/useStore';
import { formatDurationSince } from '../lib/stats';
import { ThemedText, PrimaryButton, SectionHeader } from '../design/theme';
import { spacing, radius } from '../design/tokens';
import { normCravingPercent, normSleepPercent, normWithdrawalPercent, weakestMetric } from '../lib/scales';
import LiveKpiGrid from '../../components/LiveKpiGrid';
import { useApp } from '../store/app';
import { useStats } from '../lib/selectors';
import { isProfileComplete } from '../lib/profileGuard';
import { useOnboardingStore } from '../onboarding/store';
import RecoveryTimeline from '../components/RecoveryTimeline';
import { useHeaderTransparency } from '../hooks/useHeaderTransparency';
import { usePauseEngine } from '../hooks/usePauseEngine';
import { useUiStore } from '../store/ui';
import { useTheme } from '../theme/useTheme';
import { PauseCard } from '../components/PauseCard';
import PauseCalendar from '../components/PauseCalendar';
import { MilestoneOverviewCard } from '../components/MilestoneOverviewCard';
import { DailyTrackCtaCard } from '../components/DailyTrackCtaCard';
import { ReadingTipCard } from '../components/ReadingTipCard';
import { useDashboardMilestones } from '../hooks/useDashboardMilestones';
import { useAppStrings } from '../i18n/useStrings';
import type { ThemeColors, ThemeMode } from '../theme/themes';
import { haptics } from '../services/haptics';
import { levelFromXp } from '../lib/xp';
import { mergeMilestonesWithDefaults } from '../data/milestones';
import { CURRENT_VERSION } from '../store/app';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withSpring,
  interpolate,
  Extrapolation
} from 'react-native-reanimated';
import Slider from '@react-native-community/slider';
import DateTimePicker from '@react-native-community/datetimepicker';
import Svg, { Path } from 'react-native-svg';
import { MaterialCommunityIcons } from '@expo/vector-icons';

const MONTHS_DE = ['Januar', 'Februar', 'März', 'April', 'Mai', 'Juni', 'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember'];

const dateKeyToTimestamp = (key: string) => {
  const [year, month, day] = key.split('-').map((part) => parseInt(part, 10));
  if (!Number.isFinite(year) || !Number.isFinite(month) || !Number.isFinite(day)) {
    return null;
  }
  return new Date(year, month - 1, day, 23, 59, 59, 999).getTime();
};

// Edit/Pencil Icon SVG Component
function EditIcon({ size = 18, color = '#fff' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10"
        stroke={color}
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

// Check Icon SVG Component
function CheckIcon({ size = 18, color = '#fff' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M4.5 12.75l6 6 9-13.5"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

type SmokeFreeBadgeProps = {
  duration: string;
  since?: string | null;
  startTimestamp: number;
  onUpdateStartTime: (newTimestamp: number) => void;
};

function SmokeFreeBadge({ duration, since, startTimestamp, onUpdateStartTime }: SmokeFreeBadgeProps) {
  const { theme } = useTheme();
  const palette = theme.colors;
  const strings = useAppStrings();
  
  // Expanded state & animation
  const [isExpanded, setIsExpanded] = React.useState(false);
  const expandProgress = useSharedValue(0);
  const [showDatePicker, setShowDatePicker] = React.useState(false);
  
  // Calculate current values from startTimestamp
  const now = Date.now();
  const diffMs = Math.max(0, now - startTimestamp);
  const totalMinutes = Math.floor(diffMs / 60000);
  const totalHours = Math.floor(totalMinutes / 60);
  const totalDays = Math.floor(totalHours / 24);
  
  // Local slider states (for editing)
  const [editDays, setEditDays] = React.useState(totalDays);
  const [editHours, setEditHours] = React.useState(totalHours % 24);
  const [editMinutes, setEditMinutes] = React.useState(totalMinutes % 60);
  
  // Calculate the edited date for display and DatePicker
  const editedDate = React.useMemo(() => {
    const totalEditMinutes = editDays * 24 * 60 + editHours * 60 + editMinutes;
    return new Date(Date.now() - totalEditMinutes * 60000);
  }, [editDays, editHours, editMinutes]);
  
  // Reset edit values when expanding
  React.useEffect(() => {
    if (isExpanded) {
      const currentDiffMs = Math.max(0, Date.now() - startTimestamp);
      const mins = Math.floor(currentDiffMs / 60000);
      const hrs = Math.floor(mins / 60);
      const days = Math.floor(hrs / 24);
      setEditDays(days);
      setEditHours(hrs % 24);
      setEditMinutes(mins % 60);
    }
  }, [isExpanded, startTimestamp]);
  
  const toggleExpand = React.useCallback(() => {
    // Haptic feedback
    haptics.trigger('dashboard', 'impact', { intensity: 'medium' });
    
    const nextExpanded = !isExpanded;
    setIsExpanded(nextExpanded);
    
    // Bouncy spring animation
    expandProgress.value = withSpring(nextExpanded ? 1 : 0, {
      damping: 12,
      stiffness: 120,
      mass: 0.8,
    });
  }, [isExpanded, expandProgress]);

  const resetMilestones = React.useCallback(() => {
    const setMilestones = useStore.getState().setMilestones;
    const defaults = mergeMilestonesWithDefaults([]).map((m) => ({ ...m, achievedAt: undefined }));
    setMilestones(defaults);
    useStore.setState((s) => ({ checkins: [], taskCompletions: {} }));
  }, []);

  const applyFullReset = React.useCallback(
    (newTimestamp: number) => {
      const profile = useApp.getState().profile ?? { startTimestamp: newTimestamp, version: CURRENT_VERSION };
      const xpBase = levelFromXp(0);
      useApp.setState({
        profile: {
          ...profile,
          startTimestamp: newTimestamp,
          lastConsumptionAt: newTimestamp,
          moneyCalculationStartTimestamp: newTimestamp,
          version: profile.version ?? CURRENT_VERSION,
        },
        dayLogs: {},
        xp: {
          totalXp: 0,
          currentLevel: xpBase.level,
          xpForCurrentLevel: xpBase.xpForCurrentLevel,
          xpForNextLevel: xpBase.xpForNextLevel,
          xpEvents: [],
        },
      });
      resetMilestones();
      haptics.trigger('dashboard', 'success');
      onUpdateStartTime(newTimestamp);
      setIsExpanded(false);
      expandProgress.value = withSpring(0, {
        damping: 12,
        stiffness: 120,
        mass: 0.8,
      });
    },
    [expandProgress, onUpdateStartTime, resetMilestones]
  );

  const applyMoneyOnly = React.useCallback(
    (newTimestamp: number) => {
      useApp.getState().setProfile({
        moneyCalculationStartTimestamp: newTimestamp,
      });
      haptics.trigger('dashboard', 'selection');
      setIsExpanded(false);
      expandProgress.value = withSpring(0, {
        damping: 12,
        stiffness: 120,
        mass: 0.8,
      });
    },
    [expandProgress]
  );

  const confirmStartTimeChange = React.useCallback(
    (newTimestamp: number) => {
      Alert.alert(
        'Letzten Konsum anpassen',
        'Wenn du die Zeit zurücksetzt, starten Level, XP, Meilensteine und Erholung neu. Alternativ kannst du nur die Geld-/Gramm-Berechnung anpassen.',
        [
          { text: 'Abbrechen', style: 'cancel' },
          {
            text: 'Zeit nicht ändern',
            onPress: () => applyMoneyOnly(newTimestamp),
          },
          {
            text: 'Letzten Konsum ändern',
            style: 'destructive',
            onPress: () => applyFullReset(newTimestamp),
          },
        ]
      );
    },
    [applyFullReset, applyMoneyOnly]
  );

  const handleSave = React.useCallback(() => {
    // Calculate new timestamp from edit values
    const totalEditMinutes = editDays * 24 * 60 + editHours * 60 + editMinutes;
    const newTimestamp = Date.now() - totalEditMinutes * 60000;
    confirmStartTimeChange(newTimestamp);
  }, [editDays, editHours, editMinutes, confirmStartTimeChange]);
  
  // Handle date selection from DatePicker
  const handleDateChange = React.useCallback((event: any, selectedDate?: Date) => {
    setShowDatePicker(false);
    if (selectedDate && event.type !== 'dismissed') {
      haptics.trigger('dashboard', 'impact', { intensity: 'light' });
      const diffMs = Math.max(0, Date.now() - selectedDate.getTime());
      const mins = Math.floor(diffMs / 60000);
      const hrs = Math.floor(mins / 60);
      const days = Math.floor(hrs / 24);
      setEditDays(days);
      setEditHours(hrs % 24);
      setEditMinutes(mins % 60);
    }
  }, []);
  
  // Animated styles for the expanding section
  const expandedStyle = useAnimatedStyle(() => {
    const height = interpolate(
      expandProgress.value,
      [0, 1],
      [0, 460],
      Extrapolation.CLAMP
    );
    const opacity = interpolate(
      expandProgress.value,
      [0, 0.5, 1],
      [0, 0.5, 1],
      Extrapolation.CLAMP
    );
    const scale = interpolate(
      expandProgress.value,
      [0, 1],
      [0.95, 1],
      Extrapolation.CLAMP
    );
    
    return {
      height,
      opacity,
      transform: [{ scaleY: scale }],
      overflow: 'hidden' as const,
    };
  });
  
  // Format the preview of edited time
  const editedTimePreview = React.useMemo(() => {
    const parts: string[] = [];
    if (editDays > 0) parts.push(`${editDays} ${editDays === 1 ? 'Tag' : 'Tage'}`);
    if (editHours > 0) parts.push(`${editHours}h`);
    if (editMinutes > 0 || parts.length === 0) parts.push(`${editMinutes}m`);
    return parts.join(' ');
  }, [editDays, editHours, editMinutes]);
  
  // Responsive font size for time preview
  const timePreviewFontSize = React.useMemo(() => {
    const len = editedTimePreview.length;
    if (len <= 10) return 28;
    if (len <= 15) return 24;
    if (len <= 20) return 20;
    return 18;
  }, [editedTimePreview]);
  
  return (
    <View
      style={{
        alignSelf: 'stretch',
        width: '100%',
        backgroundColor: palette.primary,
        borderRadius: radius.xl,
        paddingVertical: spacing.m as any,
        paddingHorizontal: spacing.l as any,
        borderWidth: 1,
        borderColor: palette.primaryRing,
        shadowColor: palette.primary,
        shadowOpacity: 0.35,
        shadowRadius: 14,
        shadowOffset: { width: 0, height: 8 },
        elevation: 4,
      }}
    >
      {/* Header with Edit Button */}
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.m as any }}>
        <View style={{ flex: 1 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <ThemedText kind="label" style={{ color: '#FFFFFF', textTransform: 'uppercase', letterSpacing: 1 }}>
              {strings.dashboard.smokeFreeTime}
            </ThemedText>
            <Pressable
              onPress={toggleExpand}
              hitSlop={{ top: 12, right: 12, bottom: 12, left: 12 }}
              style={({ pressed }) => ({
                padding: 8,
                borderRadius: radius.m,
                backgroundColor: pressed ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.1)',
              })}
            >
              {isExpanded ? (
                <CheckIcon size={18} color="#FFFFFF" />
              ) : (
                <EditIcon size={18} color="#FFFFFF" />
              )}
            </Pressable>
          </View>
          <ThemedText kind="h1" style={{ color: '#FFFFFF', marginTop: 6, fontSize: 30 }}>{duration}</ThemedText>
          {since ? (
            <View style={{ marginTop: 6, flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <ThemedText kind="label" style={{ color: 'rgba(255,255,255,0.8)', textTransform: 'uppercase' }}>{strings.dashboard.since}</ThemedText>
              <ThemedText style={{ color: '#FFFFFF', fontWeight: '600' }}>{since}</ThemedText>
            </View>
          ) : null}
        </View>
        <Image source={HAZELESS_LOGO} style={{ width: 88, height: 88 }} resizeMode="contain" />
      </View>
      
      {/* Expandable Edit Section */}
      <Animated.View style={expandedStyle}>
        <View style={{ 
          paddingTop: spacing.l as any,
          borderTopWidth: 1,
          borderTopColor: 'rgba(255,255,255,0.2)',
          marginTop: spacing.m as any,
        }}>
          {/* Prominent Time Preview */}
          <View style={{
            alignItems: 'center',
            marginBottom: spacing.m as any,
          }}>
            <View style={{
              backgroundColor: 'rgba(255,255,255,0.2)',
              paddingHorizontal: 24,
              paddingVertical: 12,
              borderRadius: radius.pill,
            }}>
              <Text 
                style={{ 
                  color: '#FFFFFF', 
                  fontSize: timePreviewFontSize, 
                  fontWeight: '700',
                }}
                numberOfLines={1}
                adjustsFontSizeToFit
              >
                {editedTimePreview}
              </Text>
            </View>
          </View>
          
          {/* Date Picker Button */}
          <Pressable
            onPress={() => {
              haptics.trigger('dashboard', 'impact', { intensity: 'light' });
              setShowDatePicker(true);
            }}
            style={({ pressed }) => ({
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
              gap: spacing.s as any,
              paddingVertical: spacing.m as any,
              paddingHorizontal: spacing.l as any,
              backgroundColor: pressed ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.1)',
              borderRadius: radius.l,
              marginBottom: spacing.m as any,
              borderWidth: 1,
              borderColor: 'rgba(255,255,255,0.2)',
            })}
          >
            <MaterialCommunityIcons name="calendar" size={20} color="#FFFFFF" />
            <Text style={{ color: '#FFFFFF', fontSize: 15, fontWeight: '500' }}>
              Datum wählen
            </Text>
          </Pressable>
          
          {/* DateTimePicker - Native Modal/Sheet */}
          {showDatePicker && (
            <DateTimePicker
              value={editedDate}
              mode="datetime"
              display="default"
              onChange={handleDateChange}
              maximumDate={new Date()}
              locale="de-DE"
            />
          )}
          
          {/* Days Slider */}
          <View style={{ marginBottom: spacing.s as any }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
              <ThemedText kind="caption" style={{ color: 'rgba(255,255,255,0.8)' }}>Tage</ThemedText>
              <ThemedText kind="caption" style={{ color: '#FFFFFF', fontWeight: '600' }}>{editDays}</ThemedText>
            </View>
            <Slider
              value={editDays}
              onValueChange={(val) => setEditDays(Math.round(val))}
              minimumValue={0}
              maximumValue={365}
              step={1}
              minimumTrackTintColor="#FFFFFF"
              maximumTrackTintColor="rgba(255,255,255,0.3)"
              thumbTintColor="#FFFFFF"
              style={{ height: 36 }}
            />
          </View>
          
          {/* Hours Slider */}
          <View style={{ marginBottom: spacing.s as any }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
              <ThemedText kind="caption" style={{ color: 'rgba(255,255,255,0.8)' }}>Stunden</ThemedText>
              <ThemedText kind="caption" style={{ color: '#FFFFFF', fontWeight: '600' }}>{editHours}</ThemedText>
            </View>
            <Slider
              value={editHours}
              onValueChange={(val) => setEditHours(Math.round(val))}
              minimumValue={0}
              maximumValue={23}
              step={1}
              minimumTrackTintColor="#FFFFFF"
              maximumTrackTintColor="rgba(255,255,255,0.3)"
              thumbTintColor="#FFFFFF"
              style={{ height: 36 }}
            />
          </View>
          
          {/* Minutes Slider */}
          <View>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
              <ThemedText kind="caption" style={{ color: 'rgba(255,255,255,0.8)' }}>Minuten</ThemedText>
              <ThemedText kind="caption" style={{ color: '#FFFFFF', fontWeight: '600' }}>{editMinutes}</ThemedText>
            </View>
            <Slider
              value={editMinutes}
              onValueChange={(val) => setEditMinutes(Math.round(val))}
              minimumValue={0}
              maximumValue={59}
              step={1}
              minimumTrackTintColor="#FFFFFF"
              maximumTrackTintColor="rgba(255,255,255,0.3)"
              thumbTintColor="#FFFFFF"
              style={{ height: 36 }}
            />
          </View>
          
          {/* Action Buttons */}
          <View style={{ 
            flexDirection: 'row', 
            gap: spacing.m as any,
            marginTop: spacing.l as any,
          }}>
            {/* Cancel Button */}
            <Pressable
              onPress={() => {
                haptics.trigger('dashboard', 'impact', { intensity: 'light' });
                setIsExpanded(false);
                setShowDatePicker(false);
                expandProgress.value = withSpring(0, {
                  damping: 12,
                  stiffness: 120,
                  mass: 0.8,
                });
              }}
              style={({ pressed }) => ({
                flex: 1,
                paddingVertical: spacing.m as any,
                paddingHorizontal: spacing.l as any,
                backgroundColor: pressed ? 'rgba(255,255,255,0.15)' : 'rgba(255,255,255,0.1)',
                borderRadius: radius.pill,
                alignItems: 'center',
                borderWidth: 1,
                borderColor: 'rgba(255,255,255,0.3)',
              })}
            >
              <ThemedText kind="button" style={{ color: '#FFFFFF' }}>
                Abbrechen
              </ThemedText>
            </Pressable>
            
            {/* Save Button */}
            <Pressable
              onPress={handleSave}
              style={({ pressed }) => ({
                flex: 1,
                paddingVertical: spacing.m as any,
                paddingHorizontal: spacing.l as any,
                backgroundColor: pressed ? 'rgba(255,255,255,0.4)' : 'rgba(255,255,255,0.25)',
                borderRadius: radius.pill,
                alignItems: 'center',
              })}
            >
              <ThemedText kind="button" style={{ color: '#FFFFFF' }}>
                Speichern
              </ThemedText>
            </Pressable>
          </View>
        </View>
      </Animated.View>
    </View>
  );
}

export default function Dashboard({ navigation }: any) {
  const profile = useStore((s) => s.profile);
  const checkins = useStore((s) => s.checkins);
  const insets = useSafeAreaInsets();
  const { theme } = useTheme();
  const palette = theme.colors;
  const headerAccessoryHeight = useUiStore((s) => s.headerAccessoryHeight);
  const appHydrated = useApp((s) => s.hydrated);
  const appProfile = useApp((s) => s.profile);
  const dayLogs = useApp((s) => s.dayLogs);
  const pauses = useApp((s) => s.pauses);
  const strings = useAppStrings();
  const restartOnboarding = React.useCallback(() => {
    // Reset onboarding store
    const onboardingStore = useOnboardingStore.getState();
    onboardingStore.reset();
    onboardingStore.requestOnboarding();
    // Also reset all local app data (dayLogs, pauses, etc.)
    useApp.getState().resetAll();
    // Reset legacy store (diary, checkins, missions, etc.)
    useStore.getState().clearAll();
  }, []);
  const stats = useStats();
  const { handleScroll } = useHeaderTransparency(6);
  const { list: milestoneList, milestoneProgress } = useDashboardMilestones();
  
  const openPausePlanner = React.useCallback(() => {
    haptics.trigger('general', 'selection');
    const parent = navigation.getParent()?.getParent() ?? navigation.getParent() ?? navigation;
    parent?.navigate('PausePlan');
  }, [navigation]);
  
  const openTracken = React.useCallback(() => {
    haptics.trigger('general', 'selection');
    navigation.getParent()?.navigate('Tracken');
  }, [navigation]);
  
  const openMilestones = React.useCallback(() => {
    haptics.trigger('general', 'selection');
    navigation.getParent()?.navigate('Meilensteine');
  }, [navigation]);
  
  const openMissions = React.useCallback((focus?: 'craving' | 'withdrawal' | 'sleep') => {
    haptics.trigger('general', 'selection');
    navigation.getParent()?.navigate('Wissen', focus ? { focus } : undefined);
  }, [navigation]);
  
  const openMinigames = React.useCallback(() => {
    haptics.trigger('general', 'selection');
    navigation.getParent()?.getParent()?.navigate('MinigamesHub');
  }, [navigation]);
  
  const handleUpdateStartTime = React.useCallback((newTimestamp: number) => {
    // Update both lastConsumptionAt AND startTimestamp so KPIs also update
    useApp.getState().setProfile({ 
      lastConsumptionAt: newTimestamp,
      startTimestamp: newTimestamp,
    });
  }, []);
  
  usePauseEngine();
  const activePause = pauses.find((pause) => pause.status === 'aktiv') ?? null;
  const [now, setNow] = React.useState(() => new Date());

  React.useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(id);
  }, []);

  React.useEffect(() => {
    if (!appHydrated || stats) {
      return;
    }
    if (appProfile) {
      console.warn('Dashboard: Stats are null but profile exists', {
        profile: appProfile,
        hasGramsPerDay: !!appProfile.gramsPerDayBaseline,
        hasJointsPerDay: !!appProfile.jointsPerDayBaseline,
        hasStartTimestamp: !!appProfile.startTimestamp,
        gramsPerDayBaseline: appProfile.gramsPerDayBaseline,
        jointsPerDayBaseline: appProfile.jointsPerDayBaseline,
        startTimestamp: appProfile.startTimestamp,
      });
    } else {
      console.warn('Dashboard: Stats are null because profile is missing', {
        appHydrated,
        hasCompletedOnboarding: useOnboardingStore.getState().hasCompletedOnboarding,
      });
    }
  }, [stats, appProfile, appHydrated]);

  const hasCompletedOnboarding = useOnboardingStore((state) => state.hasCompletedOnboarding);

  // ALLE Hooks müssen VOR den frühen Returns aufgerufen werden!
  const lastConsumptionTimestamp = React.useMemo(() => {
    if (appProfile?.lastConsumptionAt) return appProfile.lastConsumptionAt;
    const entries = Object.values(dayLogs);
    if (!entries.length) return null;
    const consumedEntries = entries
      .filter((log) => (log.consumedGrams ?? 0) > 0 || (log.consumedJoints ?? 0) > 0)
      .map((log) => ({ log, ts: dateKeyToTimestamp(log.date) }))
      .filter((item): item is { log: typeof entries[number]; ts: number } => item.ts != null)
      .sort((a, b) => b.ts - a.ts);
    return consumedEntries[0]?.ts ?? null;
  }, [appProfile?.lastConsumptionAt, dayLogs]);

  const fallbackStartIso = React.useMemo(() => {
    return profile.startedAt
      ? profile.startedAt
      : appProfile
      ? new Date(appProfile.startTimestamp).toISOString()
      : new Date().toISOString();
  }, [profile.startedAt, appProfile?.startTimestamp]);

  const pauseStartIso = React.useMemo(() => {
    return lastConsumptionTimestamp
      ? new Date(lastConsumptionTimestamp).toISOString()
      : fallbackStartIso;
  }, [lastConsumptionTimestamp, fallbackStartIso]);

  const daysSinceStart = React.useMemo(() => {
    const recoveryStartTs = lastConsumptionTimestamp ?? appProfile?.startTimestamp ?? null;
    if (!recoveryStartTs) return 0;
    const now = Date.now();
    return Math.max(0, Math.floor((now - recoveryStartTs) / (24 * 60 * 60 * 1000)));
  }, [lastConsumptionTimestamp, appProfile?.startTimestamp]);

  const duration = React.useMemo(() => {
    return formatDurationSince(pauseStartIso);
  }, [pauseStartIso]);

  const sinceLabel = React.useMemo(() => {
    const sinceDate = pauseStartIso ? new Date(pauseStartIso) : null;
    return sinceDate && !Number.isNaN(sinceDate.getTime())
      ? `${sinceDate.getDate().toString().padStart(2, '0')}. ${MONTHS_DE[sinceDate.getMonth()]} ${sinceDate.getFullYear()}`
      : null;
  }, [pauseStartIso]);

  const weakest = React.useMemo(() => {
    const latest = checkins[0];
    const vals = {
      craving: normCravingPercent(latest?.mcq0_10),
      withdrawal: normWithdrawalPercent(latest?.cws0_50),
      sleep: normSleepPercent(latest?.isi2_0_8),
    };
    return weakestMetric(vals).key;
  }, [checkins]);

  const handleRecoveryTimelineCardPress = React.useCallback((milestone: { day: number; timeLabel: string; title: string }) => {
    // Note: The modal is now handled internally by RecoveryTimeline
    // This callback is kept for potential future use but does not navigate anymore
    // to prevent unwanted navigation when opening the modal
  }, []);

  const sectionStyles = React.useMemo(() => createSectionStyles(palette, theme.mode), [palette, theme.mode]);

  // Jetzt können die frühen Returns kommen
  if (!appHydrated) {
    return null;
  }
  
  // Wenn Onboarding abgeschlossen ist, aber Profil noch nicht vollständig, 
  // dann ist das Profil trotzdem gültig (Onboarding hat es erstellt)
  if (!hasCompletedOnboarding && !isProfileComplete(appProfile)) {
    return (
      <View style={{ flex: 1, padding: spacing.xl, justifyContent: 'center', alignItems: 'center', gap: spacing.l }}>
        <ThemedText kind="h2" style={{ textAlign: 'center' }}>
          {strings.profile.incomplete}
        </ThemedText>
        <PrimaryButton title={strings.profile.startOnboarding} onPress={restartOnboarding} />
      </View>
    );
  }

  if (!stats) {
    // Show loading or empty state instead of returning null
    return (
      <View style={{ flex: 1, padding: spacing.xl, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator color={palette.primary} size="large" />
        <ThemedText muted style={{ marginTop: spacing.m }}>
          Statistiken werden geladen...
        </ThemedText>
      </View>
    );
  }

  const content = (
    <ScrollView
      style={{ flex: 1, backgroundColor: 'transparent' }}
      contentContainerStyle={{
        paddingHorizontal: spacing.xl as any,
        paddingTop: insets.top + HEADER_TOTAL_HEIGHT + headerAccessoryHeight + (spacing.l as any),
        paddingBottom: Math.max(spacing.xl as any, insets.bottom || 0) + 100, // Extra Padding für TabBar
        gap: spacing.l as any,
      }}
      onScroll={handleScroll}
      scrollEventThrottle={16}
      removeClippedSubviews={true}
    >
      <View style={sectionStyles.section}>
        <SmokeFreeBadge 
          duration={duration} 
          since={sinceLabel}
          startTimestamp={lastConsumptionTimestamp ?? appProfile?.startTimestamp ?? Date.now()}
          onUpdateStartTime={handleUpdateStartTime}
        />
      </View>

      <View style={sectionStyles.divider} />

      <View style={sectionStyles.section}>
        <LiveKpiGrid onViewMoreStats={() => navigation.navigate('Stats')} />
      </View>

      <View style={sectionStyles.divider} />

      <View style={sectionStyles.section}>
        <PauseCard
          activePause={activePause}
          onPressDetails={openPausePlanner}
          onPressPlan={openPausePlanner}
          now={now}
        />
      </View>

      {activePause && (
        <>
          <View style={sectionStyles.divider} />
          <View style={sectionStyles.section}>
            <PauseCalendar
              pause={activePause}
              onPress={openPausePlanner}
            />
          </View>
        </>
      )}

      <View style={sectionStyles.divider} />

      <View style={[sectionStyles.section, sectionStyles.sectionTight]}>
        <SectionHeader title={strings.dashboard.recoveryTimeline} />
        <RecoveryTimeline sinceStartDays={daysSinceStart} onCardPress={handleRecoveryTimelineCardPress} />
      </View>

      <View style={sectionStyles.divider} />

      <View style={sectionStyles.section}>
        <DailyTrackCtaCard onPress={openTracken} />
      </View>

      <View style={sectionStyles.divider} />

      <View style={[sectionStyles.section, sectionStyles.sectionTight]}>
        <MilestoneOverviewCard
          milestones={milestoneList}
          milestoneProgress={milestoneProgress}
          onViewAll={openMilestones}
        />
      </View>

      <View style={sectionStyles.divider} />

      <View style={sectionStyles.section}>
        <ReadingTipCard weakestMetric={weakest} onPress={() => openMissions(weakest)} />
      </View>
    </ScrollView>
  );

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
      {content}
    </View>
  );
}

const createSectionStyles = (colors: ThemeColors, mode: ThemeMode) =>
  StyleSheet.create({
    section: {
      width: '100%',
      borderRadius: radius.xl,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: mode === 'dark' ? 'rgba(26,40,31,0.9)' : 'rgba(255,255,255,0.94)',
      padding: spacing.l as any,
      gap: spacing.m as any,
      shadowColor: '#000',
      shadowOpacity: mode === 'dark' ? 0.35 : 0.1,
      shadowRadius: 18,
      shadowOffset: { width: 0, height: 10 },
      elevation: 6,
    },
    sectionTight: {
      gap: spacing.s as any,
    },
    fullBleed: {
      marginHorizontal: -(spacing.l as any),
    },
    divider: {
      height: StyleSheet.hairlineWidth,
      width: '100%',
      backgroundColor: colors.border,
      opacity: 0.8,
    },
    bleed: {
      marginHorizontal: -(spacing.l as any),
    },
  });
