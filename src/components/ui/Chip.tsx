import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, View } from 'react-native';
import { PressableScale } from './PressableScale';
import { Text } from './Text';
import { radius, spacing, useTheme } from '../../theme';

export interface ChipProps {
  label: string;
  selected?: boolean;
  onPress?: () => void;
  icon?: keyof typeof Ionicons.glyphMap;
  color?: string;
  size?: 'sm' | 'md';
}

export function Chip({ label, selected = false, onPress, icon, color, size = 'md' }: ChipProps) {
  const theme = useTheme();
  const accent = color ?? theme.colors.accent;
  const foreground = selected ? theme.colors.onAccent : theme.colors.textSecondary;

  const inner = (
    <View
      style={[
        styles.base,
        {
          paddingVertical: size === 'sm' ? spacing.xs + 1 : spacing.sm,
          paddingHorizontal: size === 'sm' ? spacing.md : spacing.lg,
          backgroundColor: selected ? accent : theme.colors.surfaceSunken,
          borderColor: selected ? accent : theme.colors.hairline,
        },
      ]}
    >
      {icon ? <Ionicons name={icon} size={size === 'sm' ? 12 : 14} color={foreground} /> : null}
      <Text variant={size === 'sm' ? 'caption' : 'label'} style={{ color: foreground }}>
        {label}
      </Text>
    </View>
  );

  if (!onPress) return inner;

  return (
    <PressableScale onPress={onPress} activeScale={0.94} haptic={false} accessibilityRole="button">
      {inner}
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs + 2,
    borderRadius: radius.pill,
    borderWidth: StyleSheet.hairlineWidth * 2,
  },
});
