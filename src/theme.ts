import type {AbilityKey} from './types';

export const colors = {
  bg: '#0B0B0D',
  surface: '#16161C',
  surfaceAlt: '#1E1E26',
  surfaceHi: '#272733',
  border: '#2C2C36',
  yellow: '#F5D70B',
  yellowDim: '#8A7708',
  red: '#D93A2B',
  green: '#4FB868',
  blue: '#4A90D9',
  violet: '#9B5DE5',
  text: '#EDEBE4',
  textDim: '#9A978F',
  textFaint: '#63615B',
  overlay: 'rgba(0,0,0,0.7)',
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
} as const;

export const radius = {
  sm: 4,
  md: 8,
  lg: 12,
} as const;

export const font = {
  title: 20,
  heading: 15,
  body: 14,
  small: 12,
  tiny: 10,
} as const;

export const type = {
  display: {
    fontSize: 30,
    fontWeight: '900' as const,
    letterSpacing: 4,
  },
  section: {
    fontSize: 15,
    fontWeight: '800' as const,
    letterSpacing: 1.8,
  },
  label: {
    fontSize: 10,
    fontWeight: '700' as const,
    letterSpacing: 1.4,
  },
  mono: {
    fontSize: 22,
    fontWeight: '800' as const,
    fontVariant: ['tabular-nums'] as const,
  },
} as const;

export const ABILITY_LABELS = {
  body: 'ТЕЛ',
  dexterity: 'ЛОВ',
  savvy: 'РАЗУМ',
  tech: 'ТЕХ',
} as const;

export const ABILITY_NAMES = {
  body: 'ТЕЛО',
  dexterity: 'ЛОВКОСТЬ',
  savvy: 'РАЗУМ',
  tech: 'ТЕХНИКА',
} as const;

export const PORTRAITS = [
  '🛸',
  '🪐',
  '👩‍🚀',
  '👨‍🚀',
  '🤖',
  '👾',
  '☠️',
  '🧟',
  '🦾',
  '👁️',
  '⚡',
  '🧬',
] as const;

/** Ability accent colours, used on the sheet and in the roster. */
export const ABILITY_COLORS: Record<AbilityKey, string> = {
  body: colors.red,
  dexterity: colors.green,
  savvy: colors.blue,
  tech: colors.violet,
};

export const shadow = {
  card: {
    shadowColor: '#000',
    shadowOpacity: 0.45,
    shadowRadius: 14,
    shadowOffset: {width: 0, height: 6},
    elevation: 6,
  },
  raised: {
    shadowColor: '#000',
    shadowOpacity: 0.6,
    shadowRadius: 8,
    shadowOffset: {width: 0, height: 3},
    elevation: 4,
  },
} as const;
