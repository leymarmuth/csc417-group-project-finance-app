import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Svg, { G, Rect } from 'react-native-svg';
import Animated, {
  Easing,
  useAnimatedProps,
  useSharedValue,
  withDelay,
  withTiming,
} from 'react-native-reanimated';
import { Text } from '../ui/Text';
import { withAlpha } from '../../lib/utils';
import { spacing, useTheme } from '../../theme';

const AnimatedRect = Animated.createAnimatedComponent(Rect);

export interface BarGroup {
  /** Short axis label, e.g. "Aug". */
  label: string;
  primary: number;
  secondary: number;
}

export interface BarChartProps {
  groups: BarGroup[];
  width: number;
  height?: number;
  primaryColor?: string;
  secondaryColor?: string;
}

function Bar({
  x,
  width,
  height,
  baseline,
  fill,
  delay,
}: {
  x: number;
  width: number;
  height: number;
  baseline: number;
  fill: string;
  delay: number;
}) {
  const grow = useSharedValue(0);

  useEffect(() => {
    grow.value = 0;
    grow.value = withDelay(
      delay,
      withTiming(1, { duration: 760, easing: Easing.out(Easing.cubic) }),
    );
  }, [delay, grow, height]);

  const animatedProps = useAnimatedProps(() => ({
    height: Math.max(height * grow.value, 0.001),
    y: baseline - height * grow.value,
  }));

  return (
    <AnimatedRect
      x={x}
      width={width}
      rx={Math.min(width / 2, 5)}
      ry={Math.min(width / 2, 5)}
      fill={fill}
      animatedProps={animatedProps}
    />
  );
}

/**
 * Paired income / expense columns.
 * Bars grow from the baseline with a small stagger, so the chart reads as a
 * sequence rather than a jump-cut.
 */
export function BarChart({
  groups,
  width,
  height = 140,
  primaryColor,
  secondaryColor,
}: BarChartProps) {
  const theme = useTheme();
  const primary = primaryColor ?? theme.colors.accent;
  const secondary = secondaryColor ?? withAlpha(theme.colors.text, 0.13);

  const max = Math.max(...groups.flatMap((group) => [group.primary, group.secondary]), 1);
  const groupWidth = width / Math.max(groups.length, 1);
  const barWidth = Math.min(groupWidth * 0.24, 11);
  const gap = 4;
  const baseline = height - 1;

  return (
    <View>
      <Svg width={width} height={height}>
        {groups.map((group, index) => {
          const centre = groupWidth * index + groupWidth / 2;
          const primaryHeight = (group.primary / max) * (height - 6);
          const secondaryHeight = (group.secondary / max) * (height - 6);
          return (
            <G key={group.label}>
              <Bar
                x={centre - barWidth - gap / 2}
                width={barWidth}
                height={primaryHeight}
                baseline={baseline}
                fill={primary}
                delay={120 + index * 60}
              />
              <Bar
                x={centre + gap / 2}
                width={barWidth}
                height={secondaryHeight}
                baseline={baseline}
                fill={secondary}
                delay={170 + index * 60}
              />
            </G>
          ) as unknown as React.ReactElement;
        })}
      </Svg>
      <View style={[styles.labels, { width }]}>
        {groups.map((group) => (
          <Text key={group.label} variant="caption" tone="tertiary" style={styles.label}>
            {group.label}
          </Text>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  labels: { flexDirection: 'row', marginTop: spacing.sm },
  label: { flex: 1, textAlign: 'center' },
});
