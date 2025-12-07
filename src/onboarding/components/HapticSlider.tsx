import React, { useCallback, useRef } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Slider from '@react-native-community/slider';
import { haptics } from '../../../src/services/haptics';
import { useTheme } from '../../../src/theme/useTheme';
import { spacing, typography } from '../../../src/design/tokens';

interface HapticSliderProps {
  value: number;
  onValueChange: (value: number) => void;
  minimumValue: number;
  maximumValue: number;
  step?: number;
  label?: string;
  formatValue?: (value: number) => string;
}

export const HapticSlider: React.FC<HapticSliderProps> = ({
  value,
  onValueChange,
  minimumValue,
  maximumValue,
  step = 1,
  label,
  formatValue,
}) => {
  const { theme } = useTheme();
  const colors = theme.colors;
  const lastHapticValue = useRef<number>(value);
  const isDragging = useRef(false);

  const handleValueChange = useCallback(
    (newValue: number) => {
      const roundedValue = Math.round(newValue / step) * step;
      const clampedValue = Math.max(minimumValue, Math.min(maximumValue, roundedValue));
      
      onValueChange(clampedValue);
      
      // Haptik nur bei ganzzahligen Steps und wenn sich der Wert ändert
      if (Math.abs(clampedValue - lastHapticValue.current) >= step) {
        haptics.trigger('onboarding', 'threshold');
        lastHapticValue.current = clampedValue;
      }
    },
    [onValueChange, step, minimumValue, maximumValue]
  );

  const handleSlidingStart = useCallback(() => {
    isDragging.current = true;
    haptics.trigger('onboarding', 'impact', { intensity: 'light' });
  }, []);

  const handleSlidingComplete = useCallback(
    (finalValue: number) => {
      isDragging.current = false;
      const roundedValue = Math.round(finalValue / step) * step;
      const clampedValue = Math.max(minimumValue, Math.min(maximumValue, roundedValue));
      onValueChange(clampedValue);
      haptics.trigger('onboarding', 'impact', { intensity: 'medium' });
    },
    [onValueChange, step, minimumValue, maximumValue]
  );

  const displayValue = formatValue ? formatValue(value) : value.toString();

  return (
    <View style={styles.container}>
      {label && (
        <Text style={[styles.label, { color: colors.textMuted }]}>{label}</Text>
      )}
      <View style={styles.valueContainer}>
        <Text style={[styles.valueText, { color: colors.primary }]}>{displayValue}</Text>
      </View>
      <View style={styles.sliderWrapper}>
        <Slider
          value={value}
          onValueChange={handleValueChange}
          onSlidingStart={handleSlidingStart}
          onSlidingComplete={handleSlidingComplete}
          minimumValue={minimumValue}
          maximumValue={maximumValue}
          step={step}
          minimumTrackTintColor={colors.primary}
          maximumTrackTintColor={colors.border}
          thumbTintColor={colors.primary}
          style={styles.slider}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    paddingVertical: spacing.l,
  },
  label: {
    ...typography.variants.label,
    marginBottom: spacing.s,
    textAlign: 'center',
  },
  valueContainer: {
    alignItems: 'center',
    marginBottom: spacing.l,
    minHeight: 48,
    justifyContent: 'center',
  },
  valueText: {
    ...typography.variants.h1,
    fontSize: 36,
    fontWeight: '700',
    letterSpacing: -0.5,
  },
  sliderWrapper: {
    width: '100%',
    paddingHorizontal: spacing.xs,
  },
  slider: {
    width: '100%',
    height: 40,
  },
});
