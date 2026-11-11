import { Pressable, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Text } from './Text';
import { spacing, useTheme } from '../../theme';

export function SectionHeader({
  title,
  actionLabel,
  onAction,
  style,
}: {
  title: string;
  actionLabel?: string;
  onAction?: () => void;
  style?: object;
}) {
  const theme = useTheme();
  return (
    <View style={[styles.row, style]}>
      <Text variant="micro" tone="tertiary">
        {title}
      </Text>
      {actionLabel && onAction ? (
        <Pressable onPress={onAction} hitSlop={8} style={styles.action}>
          <Text variant="caption" style={{ color: theme.colors.accent }}>
            {actionLabel}
          </Text>
          <Ionicons name="chevron-forward" size={12} color={theme.colors.accent} />
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  action: { flexDirection: 'row', alignItems: 'center', gap: 2 },
});
