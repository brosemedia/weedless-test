import React from 'react';
import { View, StyleSheet, ViewProps } from 'react-native';
import { useTheme } from '../../../src/theme/useTheme';
import { spacing, radius, shadows } from '../../../src/design/tokens';

export const Card: React.FC<ViewProps> = ({ style, children, ...rest }) => {
  const { theme } = useTheme();
  const colors = theme.colors;

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: colors.surface,
          borderColor: colors.border,
        },
        style,
      ]}
      {...rest}
    >
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: radius.l,
    padding: spacing.l,
    borderWidth: 1,
    ...shadows.md,
  },
});
