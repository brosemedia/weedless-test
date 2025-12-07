export const colors = {
  light: {
    // App-Hintergrund ist transparent, damit das globale Hero-Bild sichtbar bleibt
    bg: 'transparent',
    // Kartenflächen freundlich hell
    surface: '#FFFFFF',
    surfaceMuted: '#F7F4EC',
    // Primärer Text im tiefen Grün
    text: '#335928',
    // Sekundärer Text in Oliv
    textMuted: '#657744',
    border: '#E2D7C3',
    // Primärer Akzent (Olivgrün)
    primary: '#A1A61F',
    // hellerer Akzent für Glanz
    primaryRing: '#D3D85C',
    primaryMuted: '#E6E9A0',
    info: '#335928',
    warning: '#D99A25',
    success: '#335928',
    danger: '#A65A2E',
    // Warmes Braun für dunkle Flächen
    navy: '#A65A2E',
    overlay: 'rgba(51, 89, 40, 0.18)',
  },
  dark: {
    bg: '#2B1A12',
    surface: '#3A2316',
    surfaceMuted: '#442819',
    primary: '#E59C65',
    primaryRing: '#F4B884',
    text: '#FDF1E2',
    textMuted: '#D8BFA7',
    border: '#4F2F1E',
    info: '#F3A261',
    warning: '#F5B273',
    success: '#E09E72',
    danger: '#E27D5E',
    navy: '#5C2F18',
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

export const fonts = {
  regular: 'Inter-Regular',
  medium: 'Inter-SemiBold',
  semibold: 'Inter-SemiBold',
  bold: 'Inter-Bold',
} as const;

export const typography = {
  sizes: {
    xs: 12,
    s: 14,
    m: 16,
    l: 18,
    xl: 24,
    xxl: 30,
    display: 36,
  },
  weights: {
    regular: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
  } as const,
  variants: {
    h1: { fontSize: 30, fontFamily: fonts.bold, letterSpacing: 0.2 },
    h2: { fontSize: 20, fontFamily: fonts.semibold },
    body: { fontSize: 16, fontFamily: fonts.regular, lineHeight: 22 },
    label: { fontSize: 13, fontFamily: fonts.semibold, letterSpacing: 0.4, textTransform: 'uppercase' },
    button: { fontSize: 16, fontFamily: fonts.semibold },
    caption: { fontSize: 12, fontFamily: fonts.medium },
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

export const applyThemeToLegacyColors = (next: Partial<typeof colors.light>) => {
  Object.assign(colors.light as Record<string, any>, next);
};
