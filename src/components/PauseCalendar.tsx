/**
 * PauseCalendar
 * - Zeigt einen Kalender mit nummerierten Tagen (1-30+)
 * - Verbindungslinien zwischen den Tagen
 * - Markiert Fortschritt bei aktiver Pause
 * - Navigation zum Pause-Screen
 * - Responsives Zoomen basierend auf Anzahl der Tage
 */
import React from 'react';
import { View, Text, StyleSheet, Pressable, Dimensions, Animated, Easing } from 'react-native';
import Svg, { Line } from 'react-native-svg';
import { useTheme } from '../theme/useTheme';
import { spacing, radius } from '../design/tokens';
import { ThemedText } from '../design/theme';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import type { Pause } from '../types/pause';
import { pauseDurationInDays } from '../lib/pause';
import { haptics } from '../services/haptics';

type PauseCalendarProps = {
  pause: Pause;
  onPress?: () => void;
  onExpand?: () => void;
  compact?: boolean; // Kompakte Ansicht für Karten
};

const DAYS_PER_VIEW = 30;
const CONTAINER_PADDING = spacing.l as number;
const SCREEN_WIDTH = Dimensions.get('window').width;
const MAX_CALENDAR_WIDTH = SCREEN_WIDTH - (spacing.xl as number) * 2 - (spacing.l as number) * 2;

export default function PauseCalendar({ pause, onPress, onExpand, compact = false }: PauseCalendarProps) {
  const { theme } = useTheme();
  const palette = theme.colors;
  const [isExpanded, setIsExpanded] = React.useState(false);
  const dotPulse = React.useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(dotPulse, {
          toValue: 1,
          duration: 900,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(dotPulse, {
          toValue: 0,
          duration: 900,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    );
    loop.start();
    return () => {
      loop.stop();
    };
  }, [dotPulse]);

  // Berechne Tage der Pause konsistent zur restlichen App
  const totalDays = pauseDurationInDays(pause);
  const daysToShow = isExpanded ? totalDays : Math.min(totalDays, DAYS_PER_VIEW);
  const needsExpansion = totalDays > DAYS_PER_VIEW;

  // Bereits vollständig abgeschlossene Tage (XP vergeben)
  const completedDays = React.useMemo(() => {
    if (pause.status !== 'aktiv') {
      return totalDays;
    }
    const uniqueAwarded = new Set(
      Array.isArray(pause.xpAwardedDays) ? pause.xpAwardedDays.map((d) => d.slice(0, 10)) : []
    );
    return Math.min(totalDays, uniqueAwarded.size);
  }, [pause.status, pause.xpAwardedDays, totalDays]);

  const currentDay = React.useMemo(() => {
    if (completedDays >= totalDays) return totalDays;
    return completedDays + 1;
  }, [completedDays, totalDays]);

  // Responsive Berechnung: Weniger Tage = größere Nodes
  const responsiveConfig = React.useMemo(() => {
    let nodesPerRow = 6;
    let baseNodeSize = 40;
    let baseSpacing = 12;
    let verticalSpacing = 20; // Zusätzlicher vertikaler Abstand für den Indikator

    if (daysToShow <= 5) {
      // Sehr wenige Tage: groß und breit
      nodesPerRow = daysToShow;
      baseNodeSize = Math.min(60, (MAX_CALENDAR_WIDTH - CONTAINER_PADDING * 2) / daysToShow - 20);
      baseSpacing = 16;
      verticalSpacing = 24;
    } else if (daysToShow <= 10) {
      // Wenige Tage: mittelgroß
      nodesPerRow = 5;
      baseNodeSize = 50;
      baseSpacing = 14;
      verticalSpacing = 22;
    } else if (daysToShow <= 20) {
      // Mittlere Anzahl: normal
      nodesPerRow = 6;
      baseNodeSize = 44;
      baseSpacing = 12;
      verticalSpacing = 20;
    } else {
      // Viele Tage: kompakt
      nodesPerRow = 6;
      baseNodeSize = 40;
      baseSpacing = 10;
      verticalSpacing = 18;
    }

    return { nodesPerRow, nodeSize: baseNodeSize, spacing: baseSpacing, verticalSpacing };
  }, [daysToShow]);

  const { nodesPerRow, nodeSize, spacing: nodeSpacing, verticalSpacing } = responsiveConfig;

  // Generiere Layout für die Tage (Snake-Pattern)
  const layout = React.useMemo(() => {
    const nodes: Array<{ day: number; x: number; y: number; row: number; col: number }> = [];
    let currentRow = 0;
    let currentCol = 0;
    let goingRight = true;

    for (let day = 1; day <= daysToShow; day++) {
      nodes.push({
        day,
        x: CONTAINER_PADDING + currentCol * (nodeSize + nodeSpacing) + nodeSize / 2,
        y: CONTAINER_PADDING + currentRow * (nodeSize + verticalSpacing) + nodeSize / 2,
        row: currentRow,
        col: currentCol,
      });

      if (goingRight) {
        currentCol++;
        if (currentCol >= nodesPerRow) {
          currentCol = nodesPerRow - 1;
          currentRow++;
          goingRight = false;
        }
      } else {
        currentCol--;
        if (currentCol < 0) {
          currentCol = 0;
          currentRow++;
          goingRight = true;
        }
      }
    }

    return nodes;
  }, [daysToShow, nodeSize, nodeSpacing, nodesPerRow]);

  // Berechne Container-Dimensionen
  const containerWidth = CONTAINER_PADDING * 2 + nodesPerRow * (nodeSize + nodeSpacing) - nodeSpacing;
  const rows = Math.ceil(daysToShow / nodesPerRow);
  const containerHeight = CONTAINER_PADDING * 2 + rows * (nodeSize + verticalSpacing) - verticalSpacing;

  // Generiere Verbindungslinien
  const lines = React.useMemo(() => {
    const linesArray: Array<{ x1: number; y1: number; x2: number; y2: number }> = [];
    
    for (let i = 0; i < layout.length - 1; i++) {
      const current = layout[i];
      const next = layout[i + 1];
      
      linesArray.push({
        x1: current.x,
        y1: current.y,
        x2: next.x,
        y2: next.y,
      });
    }
    
    return linesArray;
  }, [layout]);

  const handlePress = () => {
    haptics.trigger('pause', 'selection', { intensity: 'light' });
    onPress?.();
  };

  return (
    <Pressable
      onPress={handlePress}
      style={({ pressed }) => [
        styles.container,
        {
          backgroundColor: compact ? 'transparent' : palette.surface,
          borderColor: compact ? 'transparent' : palette.border,
          borderWidth: compact ? 0 : 1,
          padding: compact ? 0 : spacing.l,
          opacity: pressed ? 0.8 : 1,
        },
      ]}
    >
      {/* Header - nur wenn nicht compact */}
      {!compact && (
        <View style={styles.header}>
          <View style={{ flex: 1 }}>
            <ThemedText kind="label" style={{ color: palette.textMuted, textTransform: 'uppercase', fontSize: 12 }}>
              Pause Fortschritt
            </ThemedText>
            <ThemedText kind="h2" style={{ color: palette.text, marginTop: 4 }}>
              {completedDays} / {totalDays} Tage
            </ThemedText>
          </View>
          {needsExpansion && (
            <Pressable
              onPress={() => {
                haptics.trigger('pause', 'selection', { intensity: 'light' });
                setIsExpanded(!isExpanded);
              }}
              hitSlop={8}
              style={({ pressed }) => [
                styles.expandButton,
                {
                  backgroundColor: pressed ? palette.surfaceMuted : palette.primary,
                },
              ]}
            >
              <MaterialCommunityIcons 
                name={isExpanded ? "arrow-collapse" : "arrow-expand"} 
                size={18} 
                color={palette.surface} 
              />
            </Pressable>
          )}
        </View>
      )}

      {/* Calendar Grid */}
      <View style={[styles.calendarContainer, { width: containerWidth, height: containerHeight }]}>
        <Svg width={containerWidth} height={containerHeight} style={StyleSheet.absoluteFill}>
          {/* Verbindungslinien - besser sichtbar */}
          {lines.map((line, index) => {
            const isCompleted = index < completedDays - 1;
            return (
              <Line
                key={`line-${index}`}
                x1={line.x1}
                y1={line.y1}
                x2={line.x2}
                y2={line.y2}
                stroke={isCompleted ? palette.primary : palette.border}
                strokeWidth={2.5}
                strokeOpacity={isCompleted ? 0.7 : 0.5}
              />
            );
          })}
        </Svg>

        {/* Tage-Nodes */}
        {layout.map((node) => {
          const isCompleted = node.day <= completedDays;
          const isCurrent = completedDays < totalDays && node.day === currentDay;
          const isFuture = node.day > currentDay;

          return (
            <View
              key={node.day}
              style={[
                styles.nodeContainer,
                {
                  left: node.x - nodeSize / 2,
                  top: node.y - nodeSize / 2,
                  width: nodeSize,
                  height: nodeSize + verticalSpacing,
                },
              ]}
            >
              <View
                style={[
                  styles.node,
                  {
                    width: nodeSize,
                    height: nodeSize,
                    borderRadius: nodeSize / 2,
                    backgroundColor: isCompleted
                      ? palette.primary
                      : isCurrent
                      ? palette.surfaceMuted
                      : palette.surfaceMuted,
                    borderColor: isCurrent ? palette.primary : palette.border,
                    borderWidth: isCurrent ? 3 : 1,
                    shadowColor: isCompleted || isCurrent ? palette.primary : 'transparent',
                    shadowOpacity: isCurrent ? 0.55 : isCompleted ? 0.4 : 0,
                    shadowRadius: isCurrent ? 14 : 8,
                    shadowOffset: { width: 0, height: 4 },
                  },
                ]}
              >
                <Text
                  style={[
                    styles.nodeText,
                    {
                      fontSize: nodeSize * 0.35,
                      color: isCurrent ? palette.primary : isCompleted ? palette.surface : palette.textMuted,
                      fontWeight: isCurrent ? '800' : isCompleted ? '600' : '400',
                    },
                  ]}
                >
                  {node.day}
                </Text>
              </View>
              {/* Aktueller Tag-Indikator UNTER dem Kreis */}
              {isCurrent && (
                <View
                  pointerEvents="none"
                  style={{
                    position: 'absolute',
                    top: nodeSize + (verticalSpacing - 12) / 2, // mittig im verfügbaren Zwischenraum
                    left: 0,
                    width: nodeSize,
                    height: verticalSpacing,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Animated.View
                    style={{
                      position: 'absolute',
                      width: 22,
                      height: 22,
                      borderRadius: 11,
                      backgroundColor: palette.primary,
                      opacity: dotPulse.interpolate({ inputRange: [0, 1], outputRange: [0.35, 0] }),
                      transform: [
                        {
                          scale: dotPulse.interpolate({ inputRange: [0, 1], outputRange: [1, 1.7] }),
                        },
                      ],
                    }}
                  />
                  <Animated.View
                    style={[
                      styles.currentIndicator,
                      {
                        backgroundColor: palette.primary,
                        shadowColor: palette.primary,
                        shadowOpacity: 0.9,
                        shadowRadius: 10,
                        opacity: dotPulse.interpolate({ inputRange: [0, 1], outputRange: [0.7, 1] }),
                        transform: [
                          {
                            scale: dotPulse.interpolate({ inputRange: [0, 1], outputRange: [0.9, 1.35] }),
                          },
                        ],
                        left: (nodeSize - 12) / 2,
                      },
                    ]}
                  />
                </View>
              )}
            </View>
          );
        })}
      </View>

      {/* Footer Info - nur wenn nicht compact */}
      {!compact && (
        <View style={styles.footer}>
          <MaterialCommunityIcons name="information-outline" size={14} color={palette.textMuted} />
          <Text style={[styles.footerText, { color: palette.textMuted }]}>
            Tippe für Details
          </Text>
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: radius.xl,
    borderWidth: 0, // Wird von parent gesetzt
    padding: spacing.l,
    gap: spacing.m,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  expandButton: {
    width: 36,
    height: 36,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  calendarContainer: {
    position: 'relative',
    alignSelf: 'center',
  },
  nodeContainer: {
    position: 'absolute',
    alignItems: 'center',
  },
  node: {
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 2,
  },
  nodeText: {
    fontWeight: '600',
  },
  currentIndicator: {
    position: 'absolute',
    width: 12,
    height: 12,
    borderRadius: 6,
    zIndex: 2,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: spacing.xs,
  },
  footerText: {
    fontSize: 12,
  },
});
