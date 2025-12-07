import React from 'react';
import { ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import LiveKpiGrid from '../../components/LiveKpiGrid';
import { ThemedView, SectionHeader } from '../design/theme';
import { spacing } from '../design/tokens';
import { HEADER_TOTAL_HEIGHT } from '../components/AppHeader';
import { useHeaderTransparency } from '../hooks/useHeaderTransparency';
import { useUiStore } from '../store/ui';

export default function Stats() {
  const insets = useSafeAreaInsets();
  const headerAccessoryHeight = useUiStore((s) => s.headerAccessoryHeight);
  useHeaderTransparency();

  return (
    <ThemedView style={{ flex: 1 }}>
      <ScrollView
        contentContainerStyle={{
          paddingHorizontal: spacing.xl as any,
          paddingTop: insets.top + HEADER_TOTAL_HEIGHT + headerAccessoryHeight,
          paddingBottom: Math.max(spacing.l as any, insets.bottom),
          gap: spacing.l as any,
        }}
      >
        <SectionHeader title="Alle Statistiken" subtitle="Dein KPI-Dashboard" />
        <LiveKpiGrid />
      </ScrollView>
    </ThemedView>
  );
}
