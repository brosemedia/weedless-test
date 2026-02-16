import React, { useMemo } from 'react';
import { Modal, SafeAreaView, View, Text, Pressable } from 'react-native';
import { useTheme } from '../theme/useTheme';
import { spacing, radius } from '../design/tokens';
import { haptics } from '../services/haptics';
import MultiStepDailyCheckin from './MultiStepDailyCheckin';
import type { DailyCheckinData } from '../types/checkin';

type Props = {
  visible: boolean;
  onClose: () => void;
  onSubmit: (data: DailyCheckinData) => void;
  initial?: Partial<DailyCheckinData>;
  title?: string;
};

export default function CheckinModal({
  visible,
  onClose,
  onSubmit,
  initial,
  title = 'Daily Check-in',
}: Props) {
  const initialData = useMemo<Partial<DailyCheckinData>>(
    () => initial ?? { dateISO: new Date().toISOString() },
    [initial, visible]
  );
  const { theme } = useTheme();

  if (!visible) return null;

  return (
    <Modal animationType="slide" visible onRequestClose={onClose} presentationStyle="fullScreen">
      <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.surface }}>
        <FormHeader title={title} onClose={onClose} />
        <View style={{ flex: 1 }}>
          <MultiStepDailyCheckin initial={initialData} onSubmit={onSubmit} onCancel={onClose} />
        </View>
      </SafeAreaView>
    </Modal>
  );
}

function FormHeader({ title, onClose }: { title: string; onClose: () => void }) {
  const { mode, theme } = useTheme();
  const isDark = mode === 'dark';
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: spacing.l,
        paddingVertical: spacing.m,
        borderBottomWidth: 1,
        borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(74,42,22,0.08)',
      }}
    >
      <Text style={{ fontSize: 18, fontWeight: '700', color: theme.colors.text }}>{title}</Text>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Schließen"
        onPress={() => {
          haptics.trigger('general', 'selection');
          onClose();
        }}
        hitSlop={8}
      >
        <Text style={{ fontSize: 16, fontWeight: '600', color: theme.colors.primary }}>Schließen</Text>
      </Pressable>
    </View>
  );
}

