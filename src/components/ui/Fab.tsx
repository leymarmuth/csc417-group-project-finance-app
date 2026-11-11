import { StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { PressableScale } from './PressableScale';
import { Text } from './Text';
import { radius, spacing, useTheme } from '../../theme';

export function Fab({
  onPress,
  icon = 'add',
  label,
  extended = false,
  /** Distance from the safe-area bottom. Defaults to clearing the tab bar. */
  bottom,
}: {
  onPress: () => void;
  icon?: keyof typeof Ionicons.glyphMap;
  label?: string;
  extended?: boolean;
  bottom?: number;
}) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const offset = bottom ?? insets.bottom + 96;
  return (
    <Animated.View
      entering={FadeInDown.delay(320).springify().damping(18)}
      style={[styles.wrap, { bottom: offset }, theme.elevation.floating]}
    >
      <PressableScale onPress={onPress} accessibilityLabel={label ?? 'Create'} activeScale={0.92}>
        <LinearGradient
          colors={theme.gradients.gold as unknown as [string, string, ...string[]]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[
            styles.gradient,
            extended ? { paddingHorizontal: spacing.xl, height: 52 } : { width: 58, height: 58 },
          ]}
        >
          <View style={styles.inner}>
            <Ionicons name={icon} size={22} color={theme.colors.onAccent} />
            {extended && label ? (
              <Text variant="bodyStrong" style={{ color: theme.colors.onAccent }}>
                {label}
              </Text>
            ) : null}
          </View>
        </LinearGradient>
      </PressableScale>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrap: { position: 'absolute', right: spacing.xl },
  gradient: { borderRadius: radius.pill, alignItems: 'center', justifyContent: 'center' },
  inner: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
});
