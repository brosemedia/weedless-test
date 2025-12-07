import React, { useEffect, useMemo, useState } from 'react';
import { ScrollView, View, Text, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';
import { colors, spacing, radius } from '../../design/tokens';
import { FrostedSurface } from '../../design/FrostedSurface';
import { useApp } from '../../store/app';
import { parseDateKey, pauseDurationInDays } from '../../lib/pause';
import { usePauseEngine } from '../../hooks/usePauseEngine';
import { getPauseEndTimestamp, getPauseStartTimestamp, getPauseTimeInfo } from '../../lib/pauseTime';

// BackButton entfernt – der native Stack-Header hat bereits einen Zurück-Button mit Blur-Effekt

const MS_PER_MINUTE = 60 * 1000;
const MS_PER_HOUR = 60 * MS_PER_MINUTE;
const MS_PER_DAY = 24 * MS_PER_HOUR;

const formatDate = (key: string) => format(parseDateKey(key), 'dd.MM.yyyy', { locale: de });

const StatusTag = ({ status }: { status: string }) => {
  const color = status === 'abgeschlossen' ? colors.light.success : status === 'abgebrochen' ? colors.light.warning : colors.light.primary;
  return (
    <View
      style={{
        alignSelf: 'flex-start',
        paddingHorizontal: spacing.m,
        paddingVertical: spacing.xs,
        borderRadius: radius.pill,
        backgroundColor: `${color}22`,
      }}
    >
      <Text style={{ fontWeight: '600', color }}>{status}</Text>
    </View>
  );
};

export default function PauseHistoryScreen() {
  usePauseEngine();
  const insets = useSafeAreaInsets();
  const pauses = useApp((s) => s.pauses);
  const sorted = useMemo(() => [...pauses].sort((a, b) => (b.createdAt ?? 0) - (a.createdAt ?? 0)), [pauses]);
  const [now, setNow] = useState(() => new Date());
  
  // Höhe für den nativen transparenten Stack-Header
  const headerHeight = 44;

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(id);
  }, []);

  const formatDurationLabel = (ms?: number | null) => {
    if (!ms || ms <= 0) return null;
    const days = ms / MS_PER_DAY;
    if (days >= 1) {
      const value = Math.floor(days * 10) / 10;
      return `${value.toFixed(1).replace('.', ',')} Tage`;
    }
    const hours = Math.floor(ms / MS_PER_HOUR);
    const minutes = Math.floor((ms % MS_PER_HOUR) / MS_PER_MINUTE);
    return `${hours}h ${minutes}m`;
  };

  return (
    <ScrollView
      contentContainerStyle={{
        paddingTop: insets.top + headerHeight + spacing.l,
        paddingBottom: Math.max(insets.bottom + spacing.l, spacing.xl),
        paddingHorizontal: spacing.xl,
        gap: spacing.m,
      }}
    >
      {/* BackButton entfernt – nativer Header übernimmt */}
      <View style={{ gap: spacing.s }}>
        <Text style={{ fontSize: 28, fontWeight: '700', color: colors.light.text }}>Pausen-Historie</Text>
        <Text style={{ color: colors.light.textMuted }}>Alle geplanten Auszeiten im Überblick.</Text>
      </View>
      {sorted.length === 0 ? (
        <View style={styles.frame}>
          <FrostedSurface
            borderRadius={radius.xl}
            intensity={70}
            fallbackColor="rgba(255,255,255,0.08)"
            overlayColor="rgba(255,255,255,0.14)"
            style={styles.card}
          >
            <Text style={{ fontSize: 16, fontWeight: '600', color: colors.light.text }}>Noch keine Pausen</Text>
            <Text style={{ color: colors.light.textMuted, marginTop: spacing.s }}>
              Starte deine erste Pause über „Pause einlegen“. Wir speichern hier deine Fortschritte.
            </Text>
          </FrostedSurface>
        </View>
      ) : (
        sorted.map((pause) => {
          const days = pauseDurationInDays(pause);
          const pauseInfo =
            pause.status === 'aktiv'
              ? getPauseTimeInfo(pause.startDate, pause.endDate, now, {
                  startTimestamp: pause.startTimestamp,
                  endTimestamp: pause.endTimestamp,
                })
              : null;
          const startTs = getPauseStartTimestamp(pause);
          const completionTs =
            pause.status === 'aktiv'
              ? now.getTime()
              : pause.completedAt ?? pause.endTimestamp ?? getPauseEndTimestamp(pause);
          const actualDurationMs =
            typeof startTs === 'number' && Number.isFinite(startTs) && typeof completionTs === 'number'
              ? Math.max(0, completionTs - startTs)
              : null;
          const actualDurationLabel = formatDurationLabel(actualDurationMs);
          return (
            <View key={pause.id} style={styles.frame}>
              <FrostedSurface
                borderRadius={radius.xl}
                intensity={75}
                fallbackColor="rgba(255,255,255,0.08)"
                overlayColor="rgba(255,255,255,0.16)"
              style={styles.card}
            >
                <View style={{ gap: spacing.xs }}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: spacing.s }}>
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontSize: 18, fontWeight: '700', color: colors.light.text }}>
                        {formatDate(pause.startDate)} – {formatDate(pause.endDate)}
                      </Text>
                      <Text style={{ color: colors.light.textMuted }}>{days} Tage</Text>
                    </View>
                  </View>
                  <StatusTag status={pause.status} />
                </View>
                {pause.status === 'aktiv' ? (
                  <View style={{ gap: 4 }}>
                    <Text style={{ color: colors.light.textMuted }}>Geplant: {days} Tage</Text>
                    <Text style={{ color: colors.light.text }}>{pauseInfo?.displayLabel ?? 'Pause beendet'}</Text>
                  </View>
                ) : null}
                {pause.status === 'abgebrochen' && actualDurationLabel ? (
                  <Text style={{ color: colors.light.textMuted }}>Durchgehalten: {actualDurationLabel}</Text>
                ) : null}
              </FrostedSurface>
            </View>
          );
        })
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  frame: {
    width: '100%',
    borderWidth: 1,
    borderRadius: radius.xl + 6,
    padding: spacing.s,
    backgroundColor: 'rgba(0,0,0,0.02)',
    borderColor: colors.light.border,
  },
  card: {
    width: '100%',
    padding: spacing.l,
    gap: spacing.s,
    minHeight: 170,
  },
});
