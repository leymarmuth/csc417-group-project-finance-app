/**
 * Aurum design tokens.
 * Single source of truth for colour, type, space, radius, elevation and motion.
 * Nothing in the app hard-codes a hex value or a duration.
 */

export const palette = {
  // Core ink ramp (used by the dark theme)
  ink900: '#07080B',
  ink850: '#0A0B0F',
  ink800: '#0E1015',
  ink700: '#14171F',
  ink600: '#1A1E27',
  ink500: '#242A35',

  // Warm parchment ramp (used by the light theme)
  bone50: '#FBF9F5',
  bone100: '#F4F0E8',
  bone200: '#EAE4D8',
  bone300: '#DCD4C5',

  // Signature metal
  gold50: '#FBF3E2',
  gold100: '#F3E3BE',
  gold300: '#E9C88B',
  gold500: '#D3A85C',
  gold700: '#A97C2F',
  gold900: '#6B4C17',

  // Semantic
  mint400: '#6FE3B0',
  mint600: '#2FA97A',
  coral400: '#FF8578',
  coral600: '#D9503F',
  azure400: '#8AB0FF',
  azure600: '#4C74CC',
  violet400: '#B79CFF',
  amber400: '#FFC46B',

  white: '#FFFFFF',
  black: '#000000',
} as const;

export const spacing = {
  xxs: 2,
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
  huge: 40,
  giant: 56,
} as const;

export const radius = {
  xs: 6,
  sm: 10,
  md: 14,
  lg: 20,
  xl: 26,
  xxl: 34,
  pill: 999,
} as const;

export const fontSize = {
  micro: 10.5,
  caption: 12,
  label: 13,
  body: 15,
  lead: 17,
  h3: 20,
  h2: 24,
  h1: 30,
  display: 44,
  hero: 56,
} as const;

export const fonts = {
  regular: 'Manrope_400Regular',
  medium: 'Manrope_500Medium',
  semibold: 'Manrope_600SemiBold',
  bold: 'Manrope_700Bold',
  extrabold: 'Manrope_800ExtraBold',
  serif: 'InstrumentSerif_400Regular',
  serifItalic: 'InstrumentSerif_400Regular_Italic',
} as const;

/** Motion language: every animation in Aurum pulls from these. */
export const motion = {
  duration: {
    instant: 120,
    fast: 200,
    base: 320,
    slow: 480,
    deliberate: 720,
  },
  spring: {
    /** Snappy, for taps and toggles. */
    snappy: { damping: 18, stiffness: 260, mass: 0.7 },
    /** Default, for layout + sheets. */
    gentle: { damping: 22, stiffness: 180, mass: 0.9 },
    /** Slow settle, for large surfaces and hero moments. */
    silky: { damping: 28, stiffness: 110, mass: 1 },
    /** Overshoots slightly — for confirmations and playful accents. */
    bouncy: { damping: 12, stiffness: 220, mass: 0.8 },
  },
  /** Standard stagger between sibling elements entering a screen. */
  stagger: 55,
} as const;

export type ColorScheme = 'light' | 'dark';

export interface Theme {
  scheme: ColorScheme;
  colors: {
    /** Full-screen background. */
    background: string;
    /** Elevated page wash used behind scroll content. */
    backgroundAlt: string;
    /** Default card surface. */
    surface: string;
    /** Raised surface (sheets, modals, floating bars). */
    surfaceRaised: string;
    /** Recessed surface (inputs, chips, wells). */
    surfaceSunken: string;
    /** 1px separators and card borders. */
    hairline: string;
    hairlineStrong: string;

    text: string;
    textSecondary: string;
    textTertiary: string;
    textInverted: string;

    accent: string;
    accentStrong: string;
    accentSoft: string;
    onAccent: string;

    positive: string;
    positiveSoft: string;
    negative: string;
    negativeSoft: string;
    info: string;
    infoSoft: string;
    warning: string;
    warningSoft: string;

    scrim: string;
    shadow: string;
  };
  gradients: {
    /** Hero card wash. */
    hero: readonly [string, string, ...string[]];
    /** Full-screen ambient wash. */
    ambient: readonly [string, string, ...string[]];
    gold: readonly [string, string, ...string[]];
    mint: readonly [string, string, ...string[]];
    coral: readonly [string, string, ...string[]];
  };
  elevation: {
    card: object;
    raised: object;
    floating: object;
  };
}

const dark: Theme = {
  scheme: 'dark',
  colors: {
    background: palette.ink900,
    backgroundAlt: palette.ink850,
    surface: 'rgba(255,255,255,0.045)',
    surfaceRaised: palette.ink700,
    surfaceSunken: 'rgba(255,255,255,0.028)',
    hairline: 'rgba(255,255,255,0.075)',
    hairlineStrong: 'rgba(255,255,255,0.14)',

    text: '#F7F5F1',
    textSecondary: 'rgba(247,245,241,0.62)',
    textTertiary: 'rgba(247,245,241,0.38)',
    textInverted: palette.ink900,

    accent: palette.gold300,
    accentStrong: palette.gold500,
    accentSoft: 'rgba(233,200,139,0.13)',
    onAccent: '#1A1405',

    positive: palette.mint400,
    positiveSoft: 'rgba(111,227,176,0.13)',
    negative: palette.coral400,
    negativeSoft: 'rgba(255,133,120,0.13)',
    info: palette.azure400,
    infoSoft: 'rgba(138,176,255,0.13)',
    warning: palette.amber400,
    warningSoft: 'rgba(255,196,107,0.13)',

    scrim: 'rgba(4,5,8,0.72)',
    shadow: '#000000',
  },
  gradients: {
    hero: ['#1C2230', '#141821', '#0E1116'],
    ambient: ['#0B0D12', '#07080B'],
    gold: [palette.gold300, palette.gold500, palette.gold700],
    mint: ['#8FF0C6', palette.mint600],
    coral: ['#FFA296', palette.coral600],
  },
  elevation: {
    card: {
      shadowColor: '#000',
      shadowOpacity: 0.34,
      shadowRadius: 22,
      shadowOffset: { width: 0, height: 12 },
      elevation: 6,
    },
    raised: {
      shadowColor: '#000',
      shadowOpacity: 0.45,
      shadowRadius: 34,
      shadowOffset: { width: 0, height: 20 },
      elevation: 14,
    },
    floating: {
      shadowColor: '#000',
      shadowOpacity: 0.56,
      shadowRadius: 44,
      shadowOffset: { width: 0, height: 26 },
      elevation: 24,
    },
  },
};

const light: Theme = {
  scheme: 'light',
  colors: {
    background: palette.bone100,
    backgroundAlt: palette.bone50,
    surface: palette.white,
    surfaceRaised: palette.white,
    surfaceSunken: 'rgba(20,21,26,0.035)',
    hairline: 'rgba(20,21,26,0.085)',
    hairlineStrong: 'rgba(20,21,26,0.16)',

    text: '#14151A',
    textSecondary: 'rgba(20,21,26,0.58)',
    textTertiary: 'rgba(20,21,26,0.36)',
    textInverted: palette.bone50,

    accent: palette.gold700,
    accentStrong: '#8A6320',
    accentSoft: 'rgba(169,124,47,0.10)',
    onAccent: '#FFFDF8',

    positive: palette.mint600,
    positiveSoft: 'rgba(47,169,122,0.10)',
    negative: palette.coral600,
    negativeSoft: 'rgba(217,80,63,0.10)',
    info: palette.azure600,
    infoSoft: 'rgba(76,116,204,0.10)',
    warning: '#B98222',
    warningSoft: 'rgba(185,130,34,0.12)',

    scrim: 'rgba(24,22,18,0.42)',
    shadow: '#4A3B22',
  },
  gradients: {
    hero: ['#FFFFFF', '#FBF6EC', '#F4ECDC'],
    ambient: [palette.bone50, palette.bone100],
    gold: [palette.gold300, palette.gold500, palette.gold700],
    mint: ['#7FE9BE', palette.mint600],
    coral: ['#FF9A8D', palette.coral600],
  },
  elevation: {
    card: {
      shadowColor: '#4A3B22',
      shadowOpacity: 0.09,
      shadowRadius: 18,
      shadowOffset: { width: 0, height: 10 },
      elevation: 3,
    },
    raised: {
      shadowColor: '#4A3B22',
      shadowOpacity: 0.14,
      shadowRadius: 30,
      shadowOffset: { width: 0, height: 18 },
      elevation: 10,
    },
    floating: {
      shadowColor: '#4A3B22',
      shadowOpacity: 0.2,
      shadowRadius: 40,
      shadowOffset: { width: 0, height: 24 },
      elevation: 18,
    },
  },
};

export const themes: Record<ColorScheme, Theme> = { dark, light };
