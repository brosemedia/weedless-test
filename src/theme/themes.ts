import type { ImageSourcePropType } from 'react-native';

export type ThemeMode = 'light' | 'dark';

export type ThemeColors = {
  background: string;
  bg: string;
  textPrimary: string;
  textSecondary: string;
  cardBg: string;
  border: string;
  accent: string;
  buttonBg: string;
  buttonText: string;
  surface: string;
  surfaceMuted: string;
  text: string;
  textMuted: string;
  primary: string;
  primaryRing: string;
  primaryMuted: string;
  info: string;
  warning: string;
  success: string;
  danger: string;
  navy: string;
  overlay: string;
};

export type AppTheme = {
  mode: ThemeMode;
  colors: ThemeColors;
  backgroundImage: ImageSourcePropType | null;
};

const heroPlant = require('../../assets/hero_plant.png');

export const lightTheme: AppTheme = {
  mode: 'light',
  colors: {
    background: '#FFFFFF',
    bg: 'transparent',
    textPrimary: '#1E3A25',
    textSecondary: '#335C3C',
    cardBg: 'rgba(255,255,255,0.78)',
    border: 'rgba(30,58,37,0.12)',
    accent: '#9BBE2D',
    buttonBg: '#A9C23F',
    buttonText: '#FFFFFF',
    surface: '#FFFFFF',
    surfaceMuted: '#F7F4EC',
    text: '#1E3A25',
    textMuted: '#4F6A4F',
    primary: '#9BBE2D',
    primaryRing: '#D3D85C',
    primaryMuted: '#E6E9A0',
    info: '#335928',
    warning: '#D99A25',
    success: '#335928',
    danger: '#A65A2E',
    navy: '#44604D',
    overlay: 'rgba(30,58,37,0.2)',
  },
  backgroundImage: heroPlant,
};

export const darkTheme: AppTheme = {
  mode: 'dark',
  colors: {
    background: '#0F1A14',
    bg: '#0F1A14',
    textPrimary: '#F4F7F5',
    textSecondary: '#B8C5BB',
    cardBg: 'rgba(17,28,23,0.9)',
    border: 'rgba(244,247,245,0.08)',
    accent: '#8FB13A',
    buttonBg: '#6E8E2B',
    buttonText: '#FFFFFF',
    surface: '#1A281F',
    surfaceMuted: '#1E2F24',
    text: '#F4F7F5',
    textMuted: '#A2B6A7',
    primary: '#8FB13A',
    primaryRing: '#B3D25E',
    primaryMuted: '#415634',
    info: '#A5D68B',
    warning: '#E8B363',
    success: '#7CBF72',
    danger: '#F08A5D',
    navy: '#0E3321',
    overlay: 'rgba(0,0,0,0.55)',
  },
  backgroundImage: null,
};

export const themes: Record<ThemeMode, AppTheme> = {
  light: lightTheme,
  dark: darkTheme,
};
