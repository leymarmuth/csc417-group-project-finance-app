import { Pressable, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Text } from '../ui/Text';
import { haptics } from '../../lib/haptics';
import { addMonths, monthKey, monthLabel } from '../../lib/date';
import { radius, spacing, useTheme } from '../../theme';
import type { MonthKey } from '../../types/models';

export function MonthSwitcher({
  month,
  onChange,
  compact = false,
}: {
  month: MonthKey;
  onChange: (next: MonthKey) => void;
  compact?: boolean;
}) {
  const theme = useTheme();
  const isCurrent = month === monthKey(new Date());

  const shift = (delta: number) => {
    haptics.select();
    const base = new Date(`${month}-01T00:00:00`);
    const next = addMonths(base, delta);
    onChange(monthKey(next));
  };

  return (
    <View
      style={[
        styles.root,
        {
          borderRadius: radius.pill,
          backgroundColor: theme.colors.surfaceSunken,
          borderColor: theme.colors.hairline,
          paddingVertical: compact ? 2 : 4,
        },
      ]}
    >
      <Pressable
        hitSlop={8}
        onPress={() => shift(-1)}
        style={styles.arrow}
        accessibilityLabel="Previous month"
      >
        <Ionicons name="chevron-back" size={14} color={theme.colors.textSecondary} />
      </Pressable>
      <Text
        variant={compact ? 'caption' : 'label'}
        style={{ minWidth: compact ? 74 : 92, textAlign: 'center' }}
      >
        {isCurrent ? 'This month' : monthLabel(month)}
      </Text>
      <Pressable
        hitSlop={8}
        onPress={() => shift(1)}
        disabled={isCurrent}
        style={[styles.arrow, isCurrent ? { opacity: 0.32 } : null]}
        accessibilityLabel="Next month"
      >
        <Ionicons name="chevron-forward" size={14} color={theme.colors.textSecondary} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: StyleSheet.hairlineWidth * 2,
    paddingHorizontal: spacing.sm,
    alignSelf: 'flex-start',
  },
  arrow: { padding: 4 },
});
