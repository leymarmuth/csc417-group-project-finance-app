import { Text as RNText, type TextProps as RNTextProps, type TextStyle } from 'react-native';
import { fontSize, fonts, useTheme, type Theme } from '../../theme';

export type TextTone =
  | 'primary'
  | 'secondary'
  | 'tertiary'
  | 'accent'
  | 'positive'
  | 'negative'
  | 'inverted'
  | 'inherit';

export type TextVariant =
  | 'hero'
  | 'display'
  | 'title'
  | 'heading'
  | 'subheading'
  | 'lead'
  | 'body'
  | 'bodyStrong'
  | 'label'
  | 'caption'
  | 'micro';

const variants: Record<TextVariant, TextStyle> = {
  hero: {
    fontFamily: fonts.serif,
    fontSize: fontSize.hero,
    lineHeight: fontSize.hero * 1.02,
    letterSpacing: -1.2,
  },
  display: {
    fontFamily: fonts.serif,
    fontSize: fontSize.display,
    lineHeight: fontSize.display * 1.06,
    letterSpacing: -0.8,
  },
  title: {
    fontFamily: fonts.bold,
    fontSize: fontSize.h1,
    lineHeight: fontSize.h1 * 1.16,
    letterSpacing: -0.7,
  },
  heading: {
    fontFamily: fonts.bold,
    fontSize: fontSize.h2,
    lineHeight: fontSize.h2 * 1.2,
    letterSpacing: -0.5,
  },
  subheading: {
    fontFamily: fonts.semibold,
    fontSize: fontSize.h3,
    lineHeight: fontSize.h3 * 1.3,
    letterSpacing: -0.3,
  },
  lead: {
    fontFamily: fonts.medium,
    fontSize: fontSize.lead,
    lineHeight: fontSize.lead * 1.45,
    letterSpacing: -0.1,
  },
  body: {
    fontFamily: fonts.regular,
    fontSize: fontSize.body,
    lineHeight: fontSize.body * 1.5,
  },
  bodyStrong: {
    fontFamily: fonts.semibold,
    fontSize: fontSize.body,
    lineHeight: fontSize.body * 1.5,
  },
  label: {
    fontFamily: fonts.semibold,
    fontSize: fontSize.label,
    lineHeight: fontSize.label * 1.4,
    letterSpacing: -0.05,
  },
  caption: {
    fontFamily: fonts.medium,
    fontSize: fontSize.caption,
    lineHeight: fontSize.caption * 1.4,
  },
  micro: {
    fontFamily: fonts.semibold,
    fontSize: fontSize.micro,
    lineHeight: fontSize.micro * 1.4,
    letterSpacing: 1.4,
    textTransform: 'uppercase',
  },
};

export interface TextProps extends RNTextProps {
  variant?: TextVariant;
  tone?: TextTone;
  color?: string;
  align?: TextStyle['textAlign'];
  /** Tabular figures — essential for money and counters. */
  tabular?: boolean;
  /** Add a subtle uppercase eyebrow treatment. Never on sentences. */
  eyebrow?: boolean;
}

const toneColor = (theme: Theme, tone: TextTone): string | undefined => {
  switch (tone) {
    case 'secondary':
      return theme.colors.textSecondary;
    case 'tertiary':
      return theme.colors.textTertiary;
    case 'accent':
      return theme.colors.accent;
    case 'positive':
      return theme.colors.positive;
    case 'negative':
      return theme.colors.negative;
    case 'inverted':
      return theme.colors.textInverted;
    case 'inherit':
      return undefined;
    default:
      return theme.colors.text;
  }
};

export function Text({
  variant = 'body',
  tone = 'primary',
  color,
  align,
  tabular,
  eyebrow,
  style,
  children,
  ...rest
}: TextProps) {
  const theme = useTheme();
  return (
    <RNText
      {...rest}
      style={[
        variants[variant],
        { color: color ?? toneColor(theme, tone) },
        align ? { textAlign: align } : null,
        tabular ? { fontVariant: ['tabular-nums'] } : null,
        eyebrow && variant !== 'micro'
          ? { letterSpacing: 1.4, textTransform: 'uppercase', fontFamily: fonts.bold }
          : null,
        style,
      ]}
    >
      {children}
    </RNText>
  );
}
