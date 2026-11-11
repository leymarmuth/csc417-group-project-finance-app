import { StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Text } from './Text';
import { Button } from './Button';
import { spacing, useTheme } from '../../theme';

export function EmptyState({
  icon = 'sparkles-outline',
  title,
  description,
  actionLabel,
  onAction,
}: {
  icon?: keyof typeof Ionicons.glyphMap;
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
}) {
  const theme = useTheme();
  return (
    <View style={styles.root}>
      <View
        style={[
          styles.badge,
          { backgroundColor: theme.colors.accentSoft, borderColor: theme.colors.hairline },
        ]}
      >
        <Ionicons name={icon} size={26} color={theme.colors.accent} />
      </View>
      <Text variant="subheading" align="center">
        {title}
      </Text>
      {description ? (
        <Text variant="body" tone="secondary" align="center" style={{ maxWidth: 300 }}>
          {description}
        </Text>
      ) : null}
      {actionLabel && onAction ? (
        <Button
          label={actionLabel}
          onPress={onAction}
          variant="secondary"
          size="sm"
          fullWidth={false}
          style={{ marginTop: spacing.sm }}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.giant,
    paddingHorizontal: spacing.xxl,
    gap: spacing.md,
  },
  badge: {
    width: 64,
    height: 64,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: StyleSheet.hairlineWidth * 2,
    marginBottom: spacing.xs,
  },
});
