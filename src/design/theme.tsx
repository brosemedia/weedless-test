import React, { createContext, useContext } from 'react';
import { View, Text, Pressable, type ViewProps, type TextProps, type GestureResponderEvent } from 'react-native';
import { colors, radius, radii, spacing, typography, type ColorMode, defaultMode } from './tokens';

type Mode = 'light' | 'dark';

type Theme = {
  mode: Mode;
  // alias c for convenience in views (matches your snippet)
  c: typeof colors.light;
  colors: typeof colors.light;
  spacing: typeof spacing;
  radii: typeof radii;
  radius: typeof radius;
  typography: typeof typography;
};

const ThemeContext = createContext<Theme>({
  mode: (defaultMode as Mode) ?? 'light',
  c: colors.light,
  colors: colors.light,
  spacing,
  radii,
  radius,
  typography,
});

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  // For MVP keep mode constant; structure allows future toggling
  const mode: Mode = 'light';
  const c = colors[mode];
  const value: Theme = {
    mode,
    c,
    colors: c,
    spacing,
    radii,
    radius,
    typography,
  };
  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  return useContext(ThemeContext);
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
  { kind = 'body', muted, style, ...rest }: TextProps & { kind?: 'h1' | 'h2' | 'body' | 'label'; muted?: boolean }
) {
  const { c, typography } = useTheme();
  const base =
    kind === 'h1'
      ? (typography.variants.h1 as any)
      : kind === 'h2'
      ? (typography.variants.h2 as any)
      : kind === 'label'
      ? (typography.variants.label as any)
      : (typography.variants.body as any);
  return <Text style={[base, { color: muted ? c.textMuted : c.text }, style]} {...rest} />;
}

export function Card({ children, style }: { children: React.ReactNode; style?: any }) {
  const { c, radius, spacing } = useTheme();
  return (
    <View
      style={[
        {
          backgroundColor: c.surface,
          borderRadius: radius.l,
          padding: spacing.l,
          borderWidth: 1,
          borderColor: c.border,
        },
        style,
      ]}
    >
      {children}
    </View>
  );
}

export function PrimaryButton({ title, onPress }: { title: string; onPress: () => void }) {
  const { c, spacing, radius } = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
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
      <Text style={{ color: 'white', fontWeight: '700' }}>{title}</Text>
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
  const width = `${clamped * 100}%`;
  return (
    <View style={{ height: 10, backgroundColor: c.border, borderRadius: radius.pill }}>
      <View style={{ height: 10, width, backgroundColor: c.primaryRing, borderRadius: radius.pill }} />
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
  color?: keyof typeof colors.light | string;
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
};

export function Button({ title, onPress, tone = 'primary', disabled, fullWidth }: ButtonProps) {
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
  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled}
      onPress={onPress}
      style={{
        ...(base as any),
        ...(stylesByTone[tone] as any),
        opacity: disabled ? 0.5 : 1,
        width: fullWidth ? '100%' : undefined,
      }}
    >
      <Text style={{ color: labelColor, fontWeight: '600' }}>{title}</Text>
    </Pressable>
  );
}
