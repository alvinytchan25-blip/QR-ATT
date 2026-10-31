import { Platform } from 'react-native';

const display = Platform.select({
  ios: 'Georgia',
  android: 'serif',
  default: 'Georgia',
});

export const FONT = {
  display,
  body: undefined,
};

export const SPACING = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
  huge: 40,
} as const;

export const RADIUS = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  pill: 999,
} as const;

export const TYPE = {
  display: {
    fontFamily: display,
    fontSize: 34,
    lineHeight: 40,
    fontWeight: '700' as const,
    letterSpacing: -0.6,
  },
  h1: {
    fontFamily: display,
    fontSize: 28,
    lineHeight: 34,
    fontWeight: '700' as const,
    letterSpacing: -0.3,
  },
  h2: {
    fontSize: 20,
    lineHeight: 26,
    fontWeight: '700' as const,
    letterSpacing: -0.2,
  },
  h3: {
    fontSize: 16,
    lineHeight: 22,
    fontWeight: '600' as const,
  },
  body: {
    fontSize: 15,
    lineHeight: 22,
  },
  small: {
    fontSize: 13,
    lineHeight: 18,
  },
  caption: {
    fontSize: 11,
    lineHeight: 14,
    fontWeight: '600' as const,
    letterSpacing: 1.2,
    textTransform: 'uppercase' as const,
  },
  number: {
    fontFamily: display,
    fontSize: 32,
    lineHeight: 36,
    fontWeight: '700' as const,
  },
} as const;

export const SHADOWS = {
  card: {
    shadowColor: '#14213D',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.06,
    shadowRadius: 16,
    elevation: 2,
  },
  hero: {
    shadowColor: '#14213D',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.14,
    shadowRadius: 24,
    elevation: 6,
  },
} as const;
