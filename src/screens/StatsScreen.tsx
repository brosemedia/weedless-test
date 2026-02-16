import React, { useMemo, useEffect } from 'react';
import { ScrollView, View, Text, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useApp } from '../store/app';
import { useStats } from '../lib/selectors';
import { SectionHeader } from '../design/theme';
import { spacing } from '../design/tokens';
import { useTheme } from '../theme/useTheme';
import { useThemedStyles } from '../theme/useThemedStyles';
import type { ThemeColors } from '../theme/themes';
import {
  KPI_CONFIGS,
  buildKpiData,
  getKpiPaletteByIndex,
  getResponsiveFontSize,
  safeProgress,
  type KpiConfig,
} from '../lib/kpis';

const HEADER_HEIGHT = 44;

export default function StatsScreen(): React.ReactElement | null {
  const insets = useSafeAreaInsets();
  const { theme, mode } = useTheme();
  const palette = theme.colors;
  const styles = useThemedStyles(createStyles);
  const stats = useStats();
  const dayLogs = useApp((s) => s.dayLogs);
  const pauses = useApp((s) => s.pauses);
  const profile = useApp((s) => s.profile);
  const xp = useApp((s) => s.xp);
  const setProfile = useApp((s) => s.setProfile);

  const kpiData = useMemo(
    () => buildKpiData({ stats, dayLogs, pauses, profile, xp }),
    [stats, dayLogs, pauses, profile, xp]
  );

  useEffect(() => {
    if (!profile) return;
    if ((profile.longestStreakHours ?? 0) < kpiData.longestStreakHours) {
      setProfile({ longestStreakHours: kpiData.longestStreakHours });
    }
  }, [profile, kpiData.longestStreakHours, setProfile]);

  const kpiRows = useMemo(() => {
    const rows: KpiConfig[][] = [];
    for (let i = 0; i < KPI_CONFIGS.length; i += 2) {
      rows.push(KPI_CONFIGS.slice(i, i + 2));
    }
    return rows;
  }, []);

  if (!stats || !profile) {
    return null;
  }

  const content = (
    <ScrollView
      style={{ flex: 1, backgroundColor: 'transparent' }}
      contentContainerStyle={{
        paddingHorizontal: spacing.xl as any,
        paddingTop: insets.top + HEADER_HEIGHT + (spacing.l as any),
        paddingBottom: Math.max(spacing.xl as any, insets.bottom || 0) + 100,
        gap: spacing.l as any,
      }}
      scrollEventThrottle={16}
      removeClippedSubviews={true}
    >
      <SectionHeader title="Alle Statistiken" subtitle="Vollständige KPI-Übersicht" />

      <View style={styles.kpiGrid}>
        {kpiRows.map((row, rowIndex) => (
          <View
            key={`row-${rowIndex}`}
            style={[
              row.length === 1 ? styles.kpiRowCentered : styles.kpiRow,
              rowIndex !== kpiRows.length - 1 ? styles.rowSpacing : null,
            ]}
          >
            {row.map((config, colIndex) => {
              const paletteIndex = rowIndex * 2 + colIndex;
              const cardColors = getKpiPaletteByIndex(paletteIndex, { dark: mode === 'dark' });
              const textColor = '#FFFFFF';
              const value = config.getValue(kpiData);
              const subline = config.getSubline(kpiData);
              const progress = safeProgress(config.getProgress(kpiData));
              const fontSize = getResponsiveFontSize(value);
              const lineHeight = Math.round(fontSize * 1.15);

              return (
                <View
                  key={config.type}
                  style={[styles.card, { shadowColor: cardColors.border }]}
                >
                  <View style={[styles.cardInner, { borderColor: cardColors.border }]}>
                    <LinearGradient
                      colors={cardColors.gradient}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                      style={[styles.gradientOverlay, { opacity: 1.0 }]}
                    />
                    <MaterialCommunityIcons
                      name={config.icon as any}
                      size={32}
                      color={textColor}
                      style={styles.cardIcon}
                    />
                    <Text
                      style={[styles.cardValue, { fontSize, lineHeight, color: textColor }]}
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
                    <View style={[styles.progressTrack, { backgroundColor: cardColors.track }]}>
                      <View
                        style={[
                          styles.progressFill,
                          { width: `${progress * 100}%`, backgroundColor: textColor },
                        ]}
                      />
                    </View>
                    <Text
                      style={[
                        styles.cardLabel,
                        { color: textColor, opacity: textColor === '#FFFFFF' ? 0.9 : 0.82 },
                      ]}
                    >
                      {config.label}
                    </Text>
                  </View>
                </View>
              );
            })}
          </View>
        ))}
      </View>
    </ScrollView>
  );

  if (mode !== 'dark') {
    return (
      <LinearGradient
        colors={['rgba(250,248,242,0.6)', 'rgba(255,255,255,0.95)']}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={{ flex: 1 }}
      >
        {content}
      </LinearGradient>
    );
  }

  return <View style={{ flex: 1, backgroundColor: palette.background }}>{content}</View>;
}

const createStyles = (palette: ThemeColors) =>
  StyleSheet.create({
    kpiGrid: {
      width: '100%',
    },
    kpiRow: {
      flexDirection: 'row',
      justifyContent: 'flex-start',
      gap: spacing.s as any,
      alignItems: 'stretch',
    },
    kpiRowCentered: {
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
      shadowOpacity: 0.08,
      shadowRadius: 10,
      shadowOffset: { width: 0, height: 4 },
      elevation: 2,
      backgroundColor: 'transparent',
      minHeight: 250,
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
    cardLabel: {
      marginTop: 10,
      fontSize: 12,
      fontWeight: '600',
    },
  });
