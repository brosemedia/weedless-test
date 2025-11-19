import React, { useMemo } from 'react';
import { ScrollView, View, Text } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';
import { colors, spacing, radius } from '../../design/tokens';
import { HEADER_TOTAL_HEIGHT } from '../../components/AppHeader';
import { FrostedSurface } from '../../design/FrostedSurface';
import { useApp } from '../../store/app';
import { parseDateKey, pauseDurationInDays } from '../../lib/pause';
import { usePauseEngine } from '../../hooks/usePauseEngine';
import { useUiStore } from '../../store/ui';

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
  const headerAccessoryHeight = useUiStore((s) => s.headerAccessoryHeight);
  const pauses = useApp((s) => s.pauses);
  const sorted = useMemo(() => [...pauses].sort((a, b) => (b.createdAt ?? 0) - (a.createdAt ?? 0)), [pauses]);

  return (
    <ScrollView
      contentContainerStyle={{
        paddingTop: insets.top + HEADER_TOTAL_HEIGHT + headerAccessoryHeight + spacing.l,
        paddingBottom: Math.max(insets.bottom + spacing.l, spacing.xl),
        paddingHorizontal: spacing.xl,
        gap: spacing.m,
      }}
    >
      <View style={{ gap: spacing.s }}>
        <Text style={{ fontSize: 28, fontWeight: '700', color: colors.light.text }}>Pausen-Historie</Text>
        <Text style={{ color: colors.light.textMuted }}>Alle geplanten Auszeiten im Überblick.</Text>
      </View>
      {sorted.length === 0 ? (
        <FrostedSurface borderRadius={radius.xl} intensity={70} fallbackColor="rgba(255,255,255,0.08)" overlayColor="rgba(255,255,255,0.14)" style={{ padding: spacing.l }}>
          <Text style={{ fontSize: 16, fontWeight: '600', color: colors.light.text }}>Noch keine Pausen</Text>
          <Text style={{ color: colors.light.textMuted, marginTop: spacing.s }}>
            Starte deine erste Pause über „Pause einlegen“. Wir speichern hier deine Fortschritte.
          </Text>
        </FrostedSurface>
      ) : (
        sorted.map((pause) => {
          const days = pauseDurationInDays(pause);
          return (
            <FrostedSurface key={pause.id} borderRadius={radius.xl} intensity={75} fallbackColor="rgba(255,255,255,0.08)" overlayColor="rgba(255,255,255,0.16)" style={{ padding: spacing.l, gap: spacing.s }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <View>
                  <Text style={{ fontSize: 18, fontWeight: '700', color: colors.light.text }}>
                    {formatDate(pause.startDate)} – {formatDate(pause.endDate)}
                  </Text>
                  <Text style={{ color: colors.light.textMuted }}>{days} Tage</Text>
                </View>
                <StatusTag status={pause.status} />
              </View>
            </FrostedSurface>
          );
        })
      )}
    </ScrollView>
  );
}
