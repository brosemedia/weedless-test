/**
 * LiveKpiGrid
 * - Konfigurierbare KPI-Karten (2-4 Stück) mit Live-Werten.
 * - Bearbeitbar über Edit-Button (Flip-Animation)
 * - Responsive Schriftgröße für große Zahlen
 */
import React from 'react';
import { View, Text, StyleSheet, Pressable, AppState, type AppStateStatus } from 'react-native';
import { useIsFocused } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import Svg, { Path, Rect, Circle } from 'react-native-svg';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
  interpolate,
  Extrapolation,
} from 'react-native-reanimated';
import { haptics } from '../src/services/haptics';
import { useMonotonicTicker } from '../hooks/useMonotonicTicker';
import { useStats } from '../src/lib/selectors';
import { useTheme } from '../src/theme/useTheme';
import type { ThemeColors } from '../src/theme/themes';
import { useThemedStyles } from '../src/theme/useThemedStyles';
import { spacing, radius } from '../src/design/tokens';
import { useUiStore, KpiType } from '../src/store/ui';
import { useApp } from '../src/store/app';
import { MoodSliderModal } from './MoodSliderModal';
import { SleepSliderModal } from './SleepSliderModal';
import {
  KPI_CONFIGS,
  buildKpiData,
  getKpiPaletteByIndex,
  getResponsiveFontSize,
  safeProgress,
  type KpiConfig,
} from '../src/lib/kpis';

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

// Close Icon SVG Component
function CloseIcon({ size = 18, color = '#fff' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M6 18L18 6M6 6l12 12"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

// Visuelles Element: Balkendiagramm für Geld ausgegeben
const MoneyChart = React.memo(function MoneyChart({ color, value }: { color: string; value: number }) {
  // Normalisiere den Wert für die Visualisierung (max 1000€ als Referenz)
  const normalizedValue = Math.min(1, Math.max(0.1, value / 1000));
  const barHeights = [0.4, 0.6, 0.5, normalizedValue, 0.7, 0.5, 0.8];
  
  return (
    <Svg width={80} height={24} viewBox="0 0 80 24">
      {barHeights.map((height, index) => {
        const barHeight = Math.max(2, height * 20); // Mindestens 2px hoch
        return (
          <Rect
            key={index}
            x={index * 10 + 2}
            y={24 - barHeight}
            width={7}
            height={barHeight}
            fill={color}
            rx={2}
            opacity={0.8}
          />
        );
      })}
    </Svg>
  );
});

type KpiCardProps = {
  icon: React.ReactNode;
  label: string;
  value: string;
  subline: string;
  progress: number;
  testID: string;
  styles: ReturnType<typeof createStyles>;
  gradientColors: [string, string, string];
  borderColor: string;
  textColor: string;
  trackColor: string;
  fullWidth?: boolean;
  showProgress?: boolean;
  progressColor?: string;
  visualElement?: React.ReactNode;
  cardSizeStyle?: any;
  cardShadowColor?: string;
  onPress?: () => void;
  disableShadow?: boolean;
  isDarkMode?: boolean;
};

function KpiCard({
  icon,
  label,
  value,
  subline,
  progress,
  testID,
  styles,
  gradientColors,
  borderColor,
  textColor,
  trackColor,
  fullWidth,
  showProgress = true,
  progressColor,
  visualElement,
  cardSizeStyle,
  cardShadowColor,
  onPress,
  disableShadow,
  isDarkMode = false,
}: KpiCardProps) {
  const responsiveFontSize = getResponsiveFontSize(value);
  const valueLineHeight = Math.round(responsiveFontSize * 1.15);
  const normalizedProgress = safeProgress(progress);

  const content = (
    <View style={[styles.cardInner, { borderColor }]}>
      <LinearGradient
        colors={gradientColors}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.gradientOverlay, { opacity: 1.0 }]}
      />
      <View style={styles.cardIcon}>{icon}</View>
      <Text 
        style={[
          styles.cardValue,
          { fontSize: responsiveFontSize, lineHeight: valueLineHeight, color: textColor },
        ]} 
        numberOfLines={1} 
        adjustsFontSizeToFit
      >
        {value}
      </Text>
      <Text
        style={[
          styles.cardSub,
          { color: textColor, opacity: textColor === '#FFFFFF' ? 0.9 : 0.78 },
        ]}
      >
        {subline}
      </Text>
      {showProgress && (
        <View style={[styles.progressTrack, { backgroundColor: trackColor }]}>
          <View
            style={[
              styles.progressFill,
              { width: `${normalizedProgress * 100}%`, backgroundColor: progressColor },
            ]}
          />
        </View>
      )}
      {visualElement && (
        <View style={styles.visualElementContainer}>
          {visualElement}
        </View>
      )}
      <Text
        style={[
          styles.cardLabel,
          { color: textColor, opacity: textColor === '#FFFFFF' ? 0.9 : 0.82 },
        ]}
      >
        {label}
      </Text>
    </View>
  );

  const cardBaseStyle = [
    styles.card,
    fullWidth && styles.cardFullWidth,
    cardSizeStyle,
    cardShadowColor ? { shadowColor: cardShadowColor } : null,
    disableShadow ? styles.cardNoShadow : null,
  ];

  if (onPress) {
    return (
      <Pressable
        onPress={onPress}
        testID={testID}
        accessibilityRole="button"
        accessibilityLabel={`${label}: ${value}`}
        style={({ pressed }) => [
          ...cardBaseStyle,
          pressed ? { opacity: 0.94, transform: [{ translateY: 1 }] } : null,
        ]}
      >
        {content}
      </Pressable>
    );
  }

  return (
    <View 
      style={[...cardBaseStyle]} 
      accessibilityRole="text" 
      accessibilityLabel={`${label}: ${value}`} 
      testID={testID}
    >
      {content}
    </View>
  );
}

const MAX_KPI_SELECTION = KPI_CONFIGS.length;

type LiveKpiGridProps = {
  onViewMoreStats?: () => void;
};

export default function LiveKpiGrid({ onViewMoreStats }: LiveKpiGridProps) {
  const { theme, mode } = useTheme();
  const palette = theme.colors;
  const styles = useThemedStyles(createStyles);
  const selectedKpis = useUiStore((s) => s.selectedKpis);
  const setSelectedKpis = useUiStore((s) => s.setSelectedKpis);

  const [appState, setAppState] = React.useState<AppStateStatus>(AppState.currentState);
  const isFocused = useIsFocused();
  const isActive = appState === 'active';
  const [isFlipped, setIsFlipped] = React.useState(false);
  const [tempSelected, setTempSelected] = React.useState<KpiType[]>(selectedKpis);
  const flipProgress = useSharedValue(0);
  const [focusNow, setFocusNow] = React.useState<number | null>(null);
  const lastSyncRef = React.useRef<number>(0);

  React.useEffect(() => {
    const sub = AppState.addEventListener('change', (nextState) => {
      setAppState(nextState);
      if (nextState === 'active') {
        setFocusNow(Date.now());
      }
    });
    return () => sub.remove();
  }, []);

  const liveTickerFps = React.useMemo(() => {
    if (!isFocused || !isActive || isFlipped) return 0;
    // Mindestens 1 FPS für sichtbare Bewegung, unabhängig von Menge.
    return 1;
  }, [isActive, isFocused, isFlipped]);

  const nowTick = useMonotonicTicker(liveTickerFps, liveTickerFps > 0);
  // Wenn der Ticker läuft, nutzen wir ihn; sonst den letzten Fokus-Zeitpunkt.
  const nowForStats = liveTickerFps > 0 ? nowTick : focusNow ?? Date.now();
  const stats = useStats(nowForStats);

  // Sofortige Neu-Berechnung bei Fokus/Active
  React.useEffect(() => {
    if (isFocused && isActive) {
      setFocusNow(Date.now());
    }
  }, [isFocused, isActive]);
  
  // Zusätzliche Daten für erweiterte KPIs
  const dayLogs = useApp((s) => s.dayLogs);
  const pauses = useApp((s) => s.pauses);
  const profile = useApp((s) => s.profile);
  const [moodModalVisible, setMoodModalVisible] = React.useState(false);
  const [sleepModalVisible, setSleepModalVisible] = React.useState(false);

  // Cloud-Sync bei Fokus/Active, gedrosselt
  React.useEffect(() => {
    const SYNC_INTERVAL_MS = 2 * 60 * 1000;
    if (!isFocused || !isActive) return;
    const now = Date.now();
    if (now - lastSyncRef.current < SYNC_INTERVAL_MS) return;
    lastSyncRef.current = now;
    console.log('[Sync] focus sync start', { at: new Date(now).toISOString() });
    import('../src/lib/sync').then(({ syncAllData }) => {
      syncAllData(profile, dayLogs, pauses)
        .then(() => {
          console.log('[Sync] focus sync done', {
            at: new Date().toISOString(),
            dayLogsCount: Object.keys(dayLogs ?? {}).length,
            pausesCount: (pauses ?? []).length,
            profile: profile ? true : false,
          });
        })
        .catch((err) => {
          console.error('[Sync] focus sync failed', err);
        });
    });
  }, [isActive, isFocused, profile, dayLogs, pauses]);

  // Reset temp selection when flipping to back
  React.useEffect(() => {
    if (isFlipped) {
      setTempSelected(selectedKpis);
    }
  }, [isFlipped, selectedKpis]);

  const handleFlip = React.useCallback(() => {
    haptics.trigger('dashboard', 'impact', { intensity: 'medium' });
    const nextFlipped = !isFlipped;
    setIsFlipped(nextFlipped);
    flipProgress.value = withTiming(nextFlipped ? 1 : 0, {
      duration: 320,
      easing: Easing.bezier(0.25, 0.46, 0.45, 0.94),
    });
  }, [isFlipped, flipProgress]);

  const handleSave = React.useCallback(() => {
    if (!isFlipped) return; // Only allow when fully flipped
    setSelectedKpis(tempSelected);
    haptics.trigger('dashboard', 'success');
    setIsFlipped(false);
    flipProgress.value = withTiming(0, {
      duration: 320,
      easing: Easing.bezier(0.25, 0.46, 0.45, 0.94),
    });
  }, [tempSelected, setSelectedKpis, flipProgress, isFlipped]);

  const handleCancel = React.useCallback(() => {
    if (!isFlipped) return; // Only allow when fully flipped
    haptics.trigger('dashboard', 'impact', { intensity: 'light' });
    setIsFlipped(false);
    flipProgress.value = withTiming(0, {
      duration: 320,
      easing: Easing.bezier(0.25, 0.46, 0.45, 0.94),
    });
  }, [flipProgress, isFlipped]);

  const toggleKpi = (type: KpiType) => {
    haptics.trigger('dashboard', 'impact', { intensity: 'light' });
    setTempSelected((prev) => {
      if (prev.includes(type)) {
        if (prev.length <= 2) {
          haptics.trigger('dashboard', 'error');
          return prev;
        }
        return prev.filter((t) => t !== type);
      }
      if (prev.length >= MAX_KPI_SELECTION) {
        haptics.trigger('dashboard', 'error');
        return prev;
      }
      return [...prev, type];
    });
  };

  // Front side animation
  const frontAnimatedStyle = useAnimatedStyle(() => {
    const rotateY = interpolate(flipProgress.value, [0, 1], [0, 180], Extrapolation.CLAMP);
    const opacity = interpolate(flipProgress.value, [0, 0.4], [1, 0], Extrapolation.CLAMP);
    const scale = interpolate(flipProgress.value, [0, 0.5], [1, 0.97], Extrapolation.CLAMP);
    
    return {
      transform: [{ perspective: 1000 }, { rotateY: `${rotateY}deg` }, { scale }],
      opacity,
    };
  });

  // Back side animation
  const backAnimatedStyle = useAnimatedStyle(() => {
    const rotateY = interpolate(flipProgress.value, [0, 1], [-180, 0], Extrapolation.CLAMP);
    const opacity = interpolate(flipProgress.value, [0.6, 1], [0, 1], Extrapolation.CLAMP);
    const scale = interpolate(flipProgress.value, [0.5, 1], [0.97, 1], Extrapolation.CLAMP);
    
    return {
      transform: [{ perspective: 1000 }, { rotateY: `${rotateY}deg` }, { scale }],
      opacity,
    };
  });

  const handleViewMoreStats = React.useCallback(() => {
    if (!onViewMoreStats || isFlipped) return;
    onViewMoreStats();
  }, [isFlipped, onViewMoreStats]);

  const handleKpiPress = React.useCallback(
    (type: KpiType) => {
      if (isFlipped) return;
      if (type === 'avgMood' || type === 'currentMood') {
        setMoodModalVisible(true);
      } else if (type === 'avgSleep') {
        setSleepModalVisible(true);
      }
    },
    [isFlipped, setMoodModalVisible, setSleepModalVisible]
  );

  // Alle Hooks müssen vor dem bedingten Return aufgerufen werden
  const xp = useApp((s) => s.xp);
  const kpiData = React.useMemo(
    () => buildKpiData({ stats, dayLogs, pauses, profile, xp }),
    [stats, dayLogs, pauses, profile, xp]
  );

  const setProfile = useApp((s) => s.setProfile);

  React.useEffect(() => {
    if (!profile) return;
    if ((profile.longestStreakHours ?? 0) < kpiData.longestStreakHours) {
      setProfile({ longestStreakHours: kpiData.longestStreakHours });
    }
  }, [profile, kpiData.longestStreakHours, setProfile]);

  // Filtere die ausgewählten KPIs
  const activeKpis = selectedKpis
    .map((type) => KPI_CONFIGS.find((c) => c.type === type))
    .filter((c): c is KpiConfig => c !== undefined);

  const cardHeights = React.useMemo(() => {
    const count = activeKpis.length;
    if (count <= 2) return { base: 230, wide: 230 };
    if (count === 3) return { base: 210, wide: 185 };
    if (count === 4) return { base: 200, wide: 215 };
    return { base: 190, wide: 200 };
  }, [activeKpis.length]);

  const baseCardStyle = React.useMemo(() => ({ minHeight: cardHeights.base }), [cardHeights.base]);
  const wideCardStyle = React.useMemo(() => ({ minHeight: cardHeights.wide }), [cardHeights.wide]);

  // Layout basierend auf Anzahl der KPIs
  const renderKpis = React.useMemo(() => {
    const rows: KpiConfig[][] = [];
    for (let i = 0; i < activeKpis.length; i += 2) {
      rows.push(activeKpis.slice(i, i + 2));
    }
    const disableShadows = activeKpis.length > 4;

    return (
      <>
        {rows.map((row, rowIndex) => (
          <View
            key={`row-${rowIndex}`}
            style={[
              row.length === 1 ? styles.gridRowCentered : styles.gridRow,
              rowIndex !== rows.length - 1 ? styles.rowSpacing : null,
            ]}
          >
            {row.map((config, colIndex) => {
              const paletteIndex = rowIndex * 2 + colIndex;
              const cardColors = getKpiPaletteByIndex(paletteIndex, { dark: mode === 'dark' });
              const iconColor = '#FFFFFF';
              const textColor = '#FFFFFF';
              const showProgress = config.type !== 'spent' && config.type !== 'consumed';
              let visualElement: React.ReactNode = null;
              if (config.type === 'spent') {
                visualElement = <MoneyChart color={iconColor} value={kpiData.totalMoneySpent} />;
              }
              const isInteractive =
                config.type === 'avgMood' || config.type === 'currentMood' || config.type === 'avgSleep';
              const onPress = isInteractive ? () => handleKpiPress(config.type) : undefined;
              const isSingle = row.length === 1;
              const shadowColor = disableShadows ? undefined : cardColors.border;
              return (
                <KpiCard
                  key={config.type}
                  icon={<MaterialCommunityIcons name={config.icon as any} size={32} color={iconColor} />}
                  label={config.label}
                  value={config.getValue(kpiData)}
                  subline={config.getSubline(kpiData)}
                  progress={config.getProgress(kpiData)}
                  testID={`kpi-${config.type}`}
                  styles={styles}
                  gradientColors={cardColors.gradient}
                  borderColor={cardColors.border}
                  textColor={textColor}
                  trackColor={cardColors.track}
                  fullWidth={isSingle}
                  showProgress={showProgress}
                  progressColor={textColor}
                  visualElement={visualElement}
                  cardSizeStyle={isSingle ? wideCardStyle : baseCardStyle}
                  cardShadowColor={shadowColor}
                  disableShadow={disableShadows}
                  onPress={onPress}
                  isDarkMode={mode === 'dark'}
                />
              );
            })}
          </View>
        ))}
      </>
    );
  }, [activeKpis, styles, kpiData, mode, isFlipped, baseCardStyle, wideCardStyle]);

  // Show front or back based on isFlipped state
  const CardWrapper = ({ children, animatedStyle }: { children: React.ReactNode; animatedStyle: any }) => {
    // Dynamische Höhe basierend auf Anzahl der KPIs
    const kpiCount = activeKpis.length;
    const rows = Math.max(1, Math.ceil(kpiCount / 2));
    const contentHeight = cardHeights.base * rows + (rows - 1) * (spacing.s as number);
    const dynamicMinHeight = isFlipped 
      ? 520 // Back side braucht mehr Platz
      : contentHeight + 140;
    
    return (
      <Animated.View
        style={[
          styles.container,
          animatedStyle,
          { minHeight: dynamicMinHeight },
        ]}
      >
        {children}
      </Animated.View>
    );
  };

  // Bedingter Return nach allen Hooks
  if (!stats) return null;

  if (isFlipped) {
    // Back Side - Settings
    return (
      <CardWrapper animatedStyle={backAnimatedStyle}>
        <View style={styles.backContent}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={[styles.headerTitle, { color: palette.text }]}>KPIs auswählen</Text>
          </View>

          {/* Live-Zähler + Aktionen */}
          <View style={styles.counterRow}>
            <View style={[styles.counterBadge, { backgroundColor: palette.primary }]}>
              <Text style={[styles.counterText, { color: palette.surface }]}>
                {tempSelected.length}/{MAX_KPI_SELECTION}
              </Text>
            </View>
            <View style={styles.counterActions}>
              <Pressable
                onPress={handleCancel}
            hitSlop={{ top: 16, right: 16, bottom: 16, left: 16 }}
            style={({ pressed }) => [
              styles.actionIconButton,
              { backgroundColor: pressed ? palette.surfaceMuted : palette.surface },
            ]}
            disabled={!isFlipped}
              >
                <CloseIcon size={16} color={palette.text} />
              </Pressable>
              <Pressable
                onPress={handleSave}
            hitSlop={{ top: 16, right: 16, bottom: 16, left: 16 }}
            style={({ pressed }) => [
              styles.actionIconButton,
              { backgroundColor: pressed ? palette.primaryRing : palette.primary },
            ]}
            disabled={!isFlipped}
              >
                <MaterialCommunityIcons name="check" size={18} color={palette.surface} />
              </Pressable>
            </View>
          </View>

        {/* KPI Liste ohne Scrollen */}
        <View
          style={[
            styles.listContainer,
            {
              borderColor: palette.border,
              backgroundColor: palette.surfaceMuted,
              minHeight: 240,
              justifyContent: 'center',
            },
          ]}
        >
          <View style={[styles.listGrid, { marginTop: spacing.s as any }]}>
            {KPI_CONFIGS.map((config) => {
              const isSelected = tempSelected.includes(config.type);
              const selectionIndex = tempSelected.indexOf(config.type);
              const orderNumber = selectionIndex >= 0 ? selectionIndex + 1 : null;
              return (
                <Pressable
                  key={config.type}
                  onPress={() => toggleKpi(config.type)}
                  hitSlop={{ top: 12, right: 12, bottom: 12, left: 12 }}
                  android_ripple={{ color: `${palette.primary}33`, borderless: false }}
                  pressRetentionOffset={{ top: 14, right: 14, bottom: 14, left: 14 }}
                  style={({ pressed }) => [
                    styles.listItemGrid,
                    { 
                      backgroundColor: pressed 
                        ? palette.surfaceMuted 
                        : isSelected 
                          ? `${palette.primary}15` 
                          : 'transparent',
                      borderColor: isSelected ? palette.primary : palette.border,
                    },
                  ]}
                  testID={`kpi-select-${config.type}`}
                >
                  <View style={styles.listItemContent}>
                    <Text 
                      style={[
                        styles.listItemText,
                        { 
                          color: palette.text,
                          fontWeight: isSelected ? '700' : '500',
                        },
                      ]}
                      numberOfLines={2}
                      adjustsFontSizeToFit
                      minimumFontScale={0.85}
                    >
                      {config.label}
                    </Text>
                    <View style={styles.listItemBottomRow}>
                      <View style={[
                        styles.listItemIcon,
                        { backgroundColor: isSelected ? palette.primary : palette.border },
                      ]}>
                        <MaterialCommunityIcons
                          name={config.icon as any}
                          size={22}
                          color={isSelected ? palette.surface : palette.textMuted}
                        />
                      </View>
                      <View
                        style={[
                          styles.orderBadge,
                          {
                            backgroundColor: isSelected ? palette.primary : 'transparent',
                            borderColor: isSelected ? palette.primary : palette.border,
                          },
                        ]}
                      >
                        {orderNumber != null && (
                          <Text style={[styles.orderBadgeText, { color: palette.surface }]}>
                            {orderNumber}
                          </Text>
                        )}
                      </View>
                    </View>
                  </View>
                </Pressable>
              );
            })}
          </View>
        </View>
        </View>
      </CardWrapper>
    );
  }

  // Front Side - KPIs
  return (
    <>
      <CardWrapper animatedStyle={frontAnimatedStyle}>
        {/* Header mit Edit-Button */}
        <View style={styles.header}>
          <Text style={[styles.headerTitle, { color: palette.text }]}>Statistiken</Text>
          <Pressable
            onPress={handleFlip}
            hitSlop={{ top: 20, right: 20, bottom: 20, left: 20 }}
            style={({ pressed }) => [
              styles.editButton,
              { backgroundColor: pressed ? palette.surfaceMuted : 'transparent' },
            ]}
          >
            <EditIcon size={18} color={palette.primary} />
          </Pressable>
        </View>

        {/* KPI Grid */}
        <View style={styles.grid}>
          {renderKpis}
        </View>

        {onViewMoreStats && (
        <Pressable
          hitSlop={{ top: 14, right: 14, bottom: 14, left: 14 }}
          style={({ pressed }) => [
            styles.moreStatsButton,
            pressed && styles.moreStatsButtonPressed,
          ]}
          accessibilityRole="button"
          accessibilityLabel="Alle Statistiken anzeigen"
          disabled={!onViewMoreStats}
          onPress={handleViewMoreStats}
        >
          <Text style={styles.moreStatsText}>Alle Statistiken</Text>
          <MaterialCommunityIcons name="chevron-right" size={20} color={palette.primary} />
        </Pressable>
      )}
      </CardWrapper>
      <MoodSliderModal visible={moodModalVisible} onClose={() => setMoodModalVisible(false)} />
      <SleepSliderModal visible={sleepModalVisible} onClose={() => setSleepModalVisible(false)} />
    </>
  );
}

const createStyles = (palette: ThemeColors) =>
  StyleSheet.create({
    container: {
      width: '100%',
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: spacing.m as any,
    },
    headerTitle: {
      fontSize: 16,
      fontWeight: '600',
    },
    editButton: {
      padding: 12,
      borderRadius: radius.l,
    },
    grid: {
      width: '100%',
    },
    gridRow: {
      flexDirection: 'row',
      justifyContent: 'flex-start',
      gap: spacing.s as any,
      alignItems: 'stretch',
    },
    gridRowCentered: {
      flexDirection: 'row',
      justifyContent: 'center',
      alignItems: 'stretch',
      width: '100%',
      gap: spacing.s as any,
    },
    rowSpacing: {
      marginBottom: spacing.s as any,
    },
    card: {
      flex: 1,
      flexBasis: 0,
      minWidth: 0,
      alignSelf: 'stretch',
      borderRadius: 22,
      shadowOpacity: 0.12,
      shadowRadius: 12,
      shadowOffset: { width: 0, height: 6 },
      elevation: 3,
      backgroundColor: 'transparent',
    },
    cardNoShadow: {
      shadowOpacity: 0,
      shadowRadius: 0,
      shadowOffset: { width: 0, height: 0 },
      elevation: 0,
    },
    cardFullWidth: {
      width: '100%',
      flexBasis: '100%',
      maxWidth: '100%',
    },
    cardInner: {
      flex: 1,
      borderRadius: 22,
      padding: 24,
      justifyContent: 'flex-end',
      borderWidth: 2,
      overflow: 'hidden',
      position: 'relative',
    },
    gradientOverlay: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      borderRadius: 20,
      opacity: 0.15,
    },
    cardIcon: {
      position: 'absolute',
      top: 18,
      right: 18,
      opacity: 0.9,
    },
    cardValue: {
      fontSize: 30,
      fontWeight: '800',
      lineHeight: 34,
    },
    cardSub: {
      marginTop: 4,
      fontSize: 11,
    },
    cardLabel: {
      marginTop: 10,
      fontSize: 12,
      fontWeight: '600',
    },
    progressTrack: {
      marginTop: 12,
      height: 5,
      width: '100%',
      borderRadius: 5,
      overflow: 'hidden',
    },
    progressFill: {
      height: '100%',
    },
    visualElementContainer: {
      marginTop: 10,
      height: 24,
      width: '100%',
      alignItems: 'flex-start',
      justifyContent: 'center',
    },
    moreStatsButton: {
      width: '100%',
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: spacing.s as any,
      marginTop: spacing.m as any,
      paddingVertical: spacing.m as any,
      paddingHorizontal: spacing.l as any,
      borderRadius: radius.l,
      borderWidth: 1,
      borderColor: palette.primary,
      backgroundColor: 'transparent',
    },
    moreStatsButtonPressed: {
      opacity: 0.7,
    },
    moreStatsText: {
      fontSize: 14,
      fontWeight: '600',
      color: palette.primary,
    },
    // Back side styles
    counterRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: spacing.m as any,
      marginBottom: spacing.m as any,
    },
    counterBadge: {
      paddingHorizontal: 20,
      paddingVertical: 10,
      borderRadius: radius.pill,
    },
    counterText: {
      fontSize: 20,
      fontWeight: '700',
    },
    counterActions: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.s as any,
    },
    actionIconButton: {
      width: 48,
      height: 48,
      borderRadius: 14,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1,
      borderColor: palette.border,
      shadowColor: '#000',
      shadowOpacity: 0.08,
      shadowRadius: 8,
      shadowOffset: { width: 0, height: 4 },
      elevation: 2,
    },
    listContainer: {
      minHeight: 240,
      borderRadius: radius.l,
      borderWidth: 1,
      overflow: 'hidden',
      padding: spacing.s as any,
    },
    listGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      columnGap: spacing.s as any,
      rowGap: spacing.s as any,
    },
    listItemGrid: {
      flexBasis: '48%',
      maxWidth: '48%',
      alignSelf: 'stretch',
      flexGrow: 1,
      minHeight: 116,
      overflow: 'hidden',
      borderWidth: 1,
      borderRadius: radius.m,
      padding: spacing.m as any,
      justifyContent: 'space-between',
    },
    listItemContent: {
      flex: 1,
      justifyContent: 'space-between',
    },
    listItemIcon: {
      width: 40,
      height: 40,
      borderRadius: 12,
      alignItems: 'center',
      justifyContent: 'center',
      flexShrink: 0,
    },
    listItemText: {
      fontSize: 16,
      fontWeight: '600',
      marginBottom: spacing.m as any,
      lineHeight: 20,
    },
    listItemBottomRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    orderBadge: {
      width: 28,
      height: 28,
      borderRadius: 14,
      borderWidth: 2,
      alignItems: 'center',
      justifyContent: 'center',
      flexShrink: 0,
    },
    orderBadgeText: {
      fontSize: 13,
      fontWeight: '700',
    },
    scrollHintContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 6,
      paddingVertical: spacing.s as any,
    },
    scrollHintText: {
      fontSize: 12,
    },
    backContent: {
      flex: 1,
      justifyContent: 'flex-start',
      gap: spacing.l as any,
    },
  });
