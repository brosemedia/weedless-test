import React from 'react';
import { View, Text, Pressable, type ViewProps, type TextProps, type GestureResponderEvent, type DimensionValue } from 'react-native';
import { radius, radii, spacing, typography } from './tokens';
import { FrostedSurface } from './FrostedSurface';
import { useTheme as useAppTheme } from '../theme/useTheme';

type Mode = 'light' | 'dark';

type Theme = {
  mode: Mode;
  c: ReturnType<typeof useAppTheme>['theme']['colors'];
  colors: ReturnType<typeof useAppTheme>['theme']['colors'];
  spacing: typeof spacing;
  radii: typeof radii;
  radius: typeof radius;
  typography: typeof typography;
};

export function useTheme(): Theme {
  const { theme } = useAppTheme();
  const c = theme.colors;
  return {
    mode: theme.mode,
    c,
    colors: c,
    spacing,
    radii,
    radius,
    typography,
  };
}

// Primitives
// UI PRIMITIVES
export function ThemedView(
  props: ViewProps & { surface?: boolean; padded?: boolean; rounded?: boolean }
) {
  const { c, spacing, radius } = useTheme();
  const { style, surface, padded, rounded, ...rest } = props as any;
  const baseStyle = {
    backgroundColor: surface ? c.surface : 'transparent',
    ...(padded ? { padding: spacing.l } : {}),
    ...(rounded ? { borderRadius: radius.l } : {}),
  } as const;
  return <View style={[baseStyle, style]} {...(rest as ViewProps)} />;
}

export function ThemedText(
  {
    kind = 'body',
    muted,
    style,
    ...rest
  }: TextProps & { kind?: 'h1' | 'h2' | 'body' | 'label' | 'button' | 'caption'; muted?: boolean }
) {
  const { c, typography } = useTheme();
  const base =
    kind === 'h1'
      ? (typography.variants.h1 as any)
      : kind === 'h2'
      ? (typography.variants.h2 as any)
      : kind === 'button'
      ? (typography.variants.button as any)
      : kind === 'caption'
      ? (typography.variants.caption as any)
      : kind === 'label'
      ? (typography.variants.label as any)
      : (typography.variants.body as any);
  return <Text style={[base, { color: muted ? c.textMuted : c.text }, style]} {...rest} />;
}

export function Card({ children, style }: { children: React.ReactNode; style?: any }) {
  const { c, radius, spacing } = useTheme();
  return (
    <FrostedSurface
      borderRadius={radius.l}
      fallbackColor="rgba(255,255,255,0.05)"
      overlayColor="rgba(255,255,255,0.18)"
      style={[
        {
          padding: spacing.l,
          borderWidth: 2,
          borderColor: c.primary,
        },
        style,
      ]}
    >
      {children}
    </FrostedSurface>
  );
}

export function PrimaryButton({ title, onPress }: { title: string; onPress: () => void }) {
  const { c, spacing, radius, typography } = useTheme();
  const { haptics } = require('../services/haptics');
  
  const handlePress = () => {
    haptics.trigger('general', 'selection');
    onPress();
  };
  
  return (
    <Pressable
      accessibilityRole="button"
      onPress={handlePress}
      style={({ pressed }) => ({
        backgroundColor: c.primary,
        paddingVertical: spacing.m,
        paddingHorizontal: spacing.xl,
        borderRadius: radius.pill,
        opacity: pressed ? 0.9 : 1,
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: 44,
      })}
    >
      <Text style={{ color: 'white', ...(typography.variants.button as any) }}>{title}</Text>
    </Pressable>
  );
}

export function SectionHeader({ title, subtitle }: { title: string; subtitle?: string }) {
  const { spacing, c } = useTheme();
  return (
    <View style={{ marginBottom: spacing.m }}>
      <ThemedText kind="h2">{title}</ThemedText>
      {subtitle ? (
        <ThemedText kind="label" muted style={{ marginTop: 4 }}>
          {subtitle}
        </ThemedText>
      ) : null}
      <View style={{ height: 8 }} />
      <View style={{ height: 3, width: 36, backgroundColor: c.primary, borderRadius: 2 }} />
    </View>
  );
}

export function ProgressBar({ value }: { value: number }) {
  const { c, radius } = useTheme();
  const clamped = Math.max(0, Math.min(1, value));
  const widthPercent = `${Math.round(clamped * 100)}%`;
  return (
    <View style={{ height: 10, backgroundColor: c.border, borderRadius: radius.pill }}>
      <View
        style={{
          height: 10,
          width: widthPercent as unknown as DimensionValue,
          backgroundColor: c.primaryRing,
          borderRadius: radius.pill,
        }}
      />
    </View>
  );
}

type BoxProps = ViewProps & {
  surface?: 'bg' | 'surface' | 'surfaceMuted' | 'navy';
  padded?: keyof typeof spacing;
  rounded?: keyof typeof radii | 'pill';
};

export function Box({ surface = 'bg', padded, rounded = 'md', style, ...rest }: BoxProps) {
  const { colors, spacing, radii } = useTheme();
  const padding = padded ? spacing[padded] : undefined;
  const borderRadius = rounded === 'pill' ? 999 : radii[rounded as keyof typeof radii] ?? radii.md;
  return (
    <View
      style={[{ backgroundColor: (colors as any)[surface], padding, borderRadius }, style]}
      {...rest}
    />
  );
}

type TProps = TextProps & {
  variant?: keyof typeof typography.variants;
  muted?: boolean;
  color?: keyof Theme['colors'] | string;
};

export function T({ variant = 'body', muted, color, style, ...rest }: TProps) {
  const theme = useTheme();
  const v = theme.typography.variants[variant];
  const c = typeof color === 'string' ? color : muted ? theme.colors.textMuted : theme.colors.text;
  return <Text style={[{ color: c }, v as any, style]} {...rest} />;
}

type ButtonProps = {
  title: string;
  onPress?: (event: GestureResponderEvent) => void;
  tone?: 'primary' | 'outline' | 'danger';
  disabled?: boolean;
  fullWidth?: boolean;
  style?: ViewProps['style'];
};

export function Button({ title, onPress, tone = 'primary', disabled, fullWidth, style }: ButtonProps) {
  const theme = useTheme();
  const base = {
    minHeight: 44,
    paddingHorizontal: theme.spacing.l,
    paddingVertical: theme.spacing.s,
    borderRadius: theme.radius.l,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  };
  const stylesByTone = {
    primary: {
      backgroundColor: theme.colors.primary,
    },
    outline: {
      backgroundColor: 'transparent',
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
    danger: {
      backgroundColor: theme.colors.danger,
    },
  } as const;
  const labelColor = tone === 'outline' ? theme.colors.text : theme.colors.surface;
  const { haptics } = require('../services/haptics');
  
  const handlePress = (event: GestureResponderEvent) => {
    if (!disabled) {
      haptics.trigger('general', 'selection');
      onPress?.(event);
    }
  };
  
  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled}
      onPress={handlePress}
      style={[
        {
          ...(base as any),
          ...(stylesByTone[tone] as any),
          opacity: disabled ? 0.5 : 1,
          width: fullWidth ? '100%' : undefined,
        },
        style,
      ]}
    >
      <Text style={{ color: labelColor, ...(theme.typography.variants.button as any) }}>{title}</Text>
    </Pressable>
  );
}
