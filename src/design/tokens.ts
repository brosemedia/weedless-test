export const colors = {
  light: {
    // warmes, sehr helles Beige
    bg: '#FCFBF7',
    // Kartenhintergrund
    surface: '#F5F7F2',
    surfaceMuted: '#F5F7F2',
    // fast schwarz
    text: '#111827',
    // grau
    textMuted: '#4B5563',
    border: '#E5E7EB',
    // Weedless-Grün
    primary: '#4F7A1F',
    // Akzentgrün (Ring/Hover)
    primaryRing: '#8FBF3F',
    primaryMuted: '#E8F1DA',
    info: '#0EA5E9',
    warning: '#F59E0B',
    success: '#16A34A',
    danger: '#DC2626',
    // Dunkelblau (CTA-Hintergrund)
    navy: '#0D2B4A',
    overlay: 'rgba(0,0,0,0.2)',
  },
  dark: {
    bg: '#0A0F0B',
    surface: '#121712',
    surfaceMuted: '#121712',
    primary: '#8CCF55',
    primaryRing: '#A4E06C',
    text: '#F9FAFB',
    textMuted: '#9CA3AF',
    border: '#1F2937',
    info: '#38BDF8',
    warning: '#FBBF24',
    success: '#22C55E',
    danger: '#F87171',
    navy: '#17314F',
    overlay: 'rgba(0,0,0,0.4)',
  },
} as const;

export const spacing = {
  xs: 6,
  s: 10,
  m: 14,
  l: 18,
  xl: 24,
  xxl: 32,
} as const;

export const radii = {
  xs: 6,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  pill: 999,
} as const;

// alias to match requested naming
export const radius = { s: 8, m: 12, l: 16, xl: 24, pill: 999 } as const;

export const fontSizes = {
  xs: 12,
  sm: 14,
  md: 16,
  lg: 18,
  xl: 22,
  xxl: 26,
  display: 32,
} as const;

export const fontWeights = {
  regular: '400',
  medium: '500',
  semibold: '600',
  bold: '700',
} as const;

export const typography = {
  sizes: {
    xs: 12,
    s: 14,
    m: 16,
    l: 18,
    xl: 22,
    xxl: 26,
    display: 32,
  },
  weights: {
    regular: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
  } as const,
  variants: {
    h1: { fontSize: 26, fontWeight: '700' as const },
    h2: { fontSize: 20, fontWeight: '700' as const },
    body: { fontSize: 16, fontWeight: '400' as const },
    label: { fontSize: 12, fontWeight: '500' as const },
  },
} as const;

export const shadows = {
  sm: { shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 8, shadowOffset: { width: 0, height: 2 }, elevation: 2 },
  md: { shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 12, shadowOffset: { width: 0, height: 4 }, elevation: 4 },
} as const;

// Accessibility helpers
export const touch = {
  minSize: 44, // recommended minimum touch target size in dp
} as const;

export type ColorMode = keyof typeof colors;
export const defaultMode: ColorMode = 'light';
