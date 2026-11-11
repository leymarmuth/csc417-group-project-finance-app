import { StyleSheet, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { IconButton } from './IconButton';
import { Text } from './Text';
import { spacing, useTheme } from '../../theme';

export interface ScreenHeaderProps {
  title?: string;
  subtitle?: string;
  onBack?: () => void;
  right?: React.ReactNode;
  large?: boolean;
}

/** Stack header used by every pushed screen (native headers are disabled). */
export function ScreenHeader({ title, subtitle, onBack, right, large = false }: ScreenHeaderProps) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();

  return (
    <View style={[styles.root, { paddingTop: insets.top + spacing.sm }]}>
      <View style={styles.bar}>
        <IconButton
          name="chevron-back"
          onPress={() => (onBack ? onBack() : navigation.goBack())}
          accessibilityLabel="Go back"
          background={theme.colors.surface}
        />
        {title && !large ? (
          <Text variant="label" numberOfLines={1} style={styles.title}>
            {title}
          </Text>
        ) : (
          <View style={styles.title} />
        )}
        {right ?? <View style={{ width: 42 }} />}
      </View>
      {large && title ? (
        <View style={styles.largeTitle}>
          <Text variant="title">{title}</Text>
          {subtitle ? (
            <Text variant="caption" tone="secondary" style={{ marginTop: 2 }}>
              {subtitle}
            </Text>
          ) : null}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { paddingHorizontal: spacing.lg, paddingBottom: spacing.sm },
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  title: { flex: 1, textAlign: 'center' },
  largeTitle: { paddingTop: spacing.xl },
});

export { Ionicons };
