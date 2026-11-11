import { useEffect } from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import { radius, useTheme } from '../../theme';

/** Breathing placeholder used while the ledger hydrates. */
export function Skeleton({
  width,
  height = 14,
  style,
  round = false,
}: {
  width?: number | `${number}%`;
  height?: number;
  style?: StyleProp<ViewStyle>;
  round?: boolean;
}) {
  const theme = useTheme();
  const pulse = useSharedValue(0.35);

  useEffect(() => {
    pulse.value = withRepeat(
      withTiming(0.8, { duration: 900, easing: Easing.inOut(Easing.quad) }),
      -1,
      true,
    );
  }, [pulse]);

  const animatedStyle = useAnimatedStyle(() => ({ opacity: pulse.value }));

  return (
    <Animated.View
      style={[
        {
          width: width ?? '100%',
          height,
          borderRadius: round ? height / 2 : radius.sm,
          backgroundColor: theme.colors.hairline,
        },
        style,
        animatedStyle,
      ]}
    />
  );
}

export function SkeletonRow() {
  return (
    <View style={styles.row}>
      <Skeleton width={44} height={44} round />
      <View style={styles.lines}>
        <Skeleton width={'58%'} height={13} />
        <Skeleton width={'32%'} height={11} />
      </View>
      <Skeleton width={54} height={13} />
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 10 },
  lines: { flex: 1, gap: 8 },
});
