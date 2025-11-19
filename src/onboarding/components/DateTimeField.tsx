import React, { useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { colors, radii, spacing, typography } from '../theme';
import { formatDate, formatTime } from '../utils/format';
import { DateTimePickerModal } from '../../components/DateTimePickerModal';

interface Props {
  label: string;
  value: Date;
  mode: 'date' | 'time';
  onChange: (next: Date) => void;
}

export const DateTimeField: React.FC<Props> = ({ label, value, mode, onChange }) => {
  const [pickerVisible, setPickerVisible] = useState(false);
  const [pendingDate, setPendingDate] = useState<Date>(value);

  const openPicker = () => {
    setPendingDate(value);
    setPickerVisible(true);
  };

  const handleConfirm = () => {
    onChange(pendingDate);
    setPickerVisible(false);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>
      <TouchableOpacity style={styles.button} onPress={openPicker}>
        <Text style={styles.value}>{mode === 'time' ? formatTime(value) : formatDate(value)}</Text>
      </TouchableOpacity>
      <DateTimePickerModal
        visible={pickerVisible}
        date={pendingDate}
        locale="de-DE"
        onChange={setPendingDate}
        onDismiss={() => setPickerVisible(false)}
        onConfirm={handleConfirm}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing.lg,
  },
  label: {
    ...typography.body,
    fontWeight: '600',
    fontFamily: 'Inter-SemiBold',
    marginBottom: spacing.xs,
  },
  button: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.md,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.surface,
  },
  value: {
    ...typography.body,
  },
});
