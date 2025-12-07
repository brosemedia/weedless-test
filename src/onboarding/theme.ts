export const colors = {
  background: '#F5F7FB',
  surface: '#FFFFFF',
  primary: '#256D1B',
  accent: '#3949AB',
  text: '#102A43',
  muted: '#627D98',
  border: '#D9E2EC',
  danger: '#D64545',
  success: '#2E7D32',
  warning: '#E9B949',
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
};

export const radii = {
  sm: 8,
  md: 12,
  lg: 20,
};

export const shadows = {
  card: {
    shadowColor: 'rgba(16, 42, 67, 0.15)',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 5,
  },
};

export const typography = {
  heading: {
    fontSize: 24,
    fontWeight: '600' as const,
    fontFamily: 'Inter-SemiBold' as const,
    color: colors.text,
  },
  subheading: {
    fontSize: 16,
    fontWeight: '400' as const,
    fontFamily: 'Inter-Regular' as const,
    color: colors.muted,
  },
  body: {
    fontSize: 15,
    fontWeight: '400' as const,
    fontFamily: 'Inter-Regular' as const,
    color: colors.text,
  },
  variants: {
    h1: {
      fontSize: 24,
      fontWeight: '700' as const,
      fontFamily: 'Inter-SemiBold' as const,
      color: colors.text,
    },
    h2: {
      fontSize: 20,
      fontWeight: '600' as const,
      fontFamily: 'Inter-SemiBold' as const,
      color: colors.text,
    },
    body: {
      fontSize: 15,
      fontWeight: '400' as const,
      fontFamily: 'Inter-Regular' as const,
      color: colors.text,
    },
    label: {
      fontSize: 13,
      fontWeight: '600' as const,
      fontFamily: 'Inter-SemiBold' as const,
      letterSpacing: 0.5,
      textTransform: 'uppercase' as const,
      color: colors.muted,
    },
    button: {
      fontSize: 16,
      fontWeight: '600' as const,
      fontFamily: 'Inter-SemiBold' as const,
      color: colors.surface,
    },
  },
};
