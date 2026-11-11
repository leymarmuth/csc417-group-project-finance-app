import { StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { PressableScale } from './PressableScale';
import { Text } from './Text';
import { spacing, useTheme } from '../../theme';

export interface ListRowProps {
  icon?: keyof typeof Ionicons.glyphMap;
  iconColor?: string;
  title: string;
  subtitle?: string;
  value?: string;
  valueTone?: 'primary' | 'secondary' | 'positive' | 'negative';
  onPress?: () => void;
  right?: React.ReactNode;
  chevron?: boolean;
  danger?: boolean;
  iconBackground?: string;
}

/** The workhorse settings/detail row. */
export function ListRow({
  icon,
  iconColor,
  title,
  subtitle,
  value,
  valueTone = 'secondary',
  onPress,
  right,
  chevron = false,
  danger = false,
  iconBackground,
}: ListRowProps) {
  const theme = useTheme();
  const color = danger ? theme.colors.negative : (iconColor ?? theme.colors.accent);

  const content = (
    <View style={styles.row}>
      {icon ? (
        <View
          style={[
            styles.iconWrap,
            { backgroundColor: iconBackground ?? theme.colors.surfaceSunken },
          ]}
        >
          <Ionicons name={icon} size={17} color={color} />
        </View>
      ) : null}
      <View style={styles.labels}>
        <Text variant="label" tone={danger ? 'negative' : 'primary'}>
          {title}
        </Text>
        {subtitle ? (
          <Text variant="caption" tone="tertiary" numberOfLines={1}>
            {subtitle}
          </Text>
        ) : null}
      </View>
      {value ? (
        <Text variant="label" tone={valueTone} tabular numberOfLines={1}>
          {value}
        </Text>
      ) : null}
      {right}
      {chevron ? (
        <Ionicons name="chevron-forward" size={15} color={theme.colors.textTertiary} />
      ) : null}
    </View>
  );

  if (!onPress) return content;

  return (
    <PressableScale onPress={onPress} haptic={false} activeScale={0.985}>
      {content}
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.md,
    minHeight: 52,
  },
  iconWrap: {
    width: 34,
    height: 34,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  labels: { flex: 1, gap: 2 },
});
