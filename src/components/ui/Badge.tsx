import { StyleSheet, View } from 'react-native';
import { Text } from './Text';
import { radius, spacing, useTheme } from '../../theme';

export function Badge({
  label,
  tone = 'neutral',
}: {
  label: string;
  tone?: 'neutral' | 'positive' | 'negative' | 'accent' | 'warning';
}) {
  const theme = useTheme();
  const spec = {
    neutral: { bg: theme.colors.surfaceSunken, fg: theme.colors.textSecondary },
    positive: { bg: theme.colors.positiveSoft, fg: theme.colors.positive },
    negative: { bg: theme.colors.negativeSoft, fg: theme.colors.negative },
    accent: { bg: theme.colors.accentSoft, fg: theme.colors.accent },
    warning: { bg: theme.colors.warningSoft, fg: theme.colors.warning },
  }[tone];

  return (
    <View style={[styles.base, { backgroundColor: spec.bg }]}>
      <Text variant="micro" style={{ color: spec.fg, fontSize: 9.5 }}>
        {label}
      </Text>
    </View>
  );
}

export function Dot({ color }: { color: string }) {
  return <View style={[styles.dot, { backgroundColor: color }]} />;
}

const styles = StyleSheet.create({
  base: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: radius.pill,
    alignSelf: 'flex-start',
  },
  dot: { width: 7, height: 7, borderRadius: 4 },
});
