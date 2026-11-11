import { useEffect } from 'react';
import { View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import Animated, {
  Easing,
  useAnimatedProps,
  useSharedValue,
  withDelay,
  withTiming,
} from 'react-native-reanimated';
import { Text } from '../ui/Text';
import { useTheme } from '../../theme';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

export interface DonutSegment {
  id: string;
  value: number;
  color: string;
}

export interface DonutChartProps {
  segments: DonutSegment[];
  size?: number;
  strokeWidth?: number;
  /** Big centre label + caption. */
  centreLabel?: string;
  centreCaption?: string;
}

/** Segmented ring where each slice sweeps in with a stagger. */
export function DonutChart({
  segments,
  size = 180,
  strokeWidth = 16,
  centreLabel,
  centreCaption,
}: DonutChartProps) {
  const theme = useTheme();
  const radiusValue = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radiusValue;
  const total = segments.reduce((acc, segment) => acc + segment.value, 0) || 1;
  const gap = 3;

  const arcs = segments.reduce<
    { id: string; value: number; color: string; fraction: number; offset: number }[]
  >((acc, segment) => {
    const previous = acc[acc.length - 1];
    const offset = previous ? previous.offset + previous.fraction : 0;
    acc.push({ ...segment, fraction: segment.value / total, offset });
    return acc;
  }, []);

  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={size} height={size} style={{ position: 'absolute' }}>
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radiusValue}
          stroke={theme.colors.hairline}
          strokeWidth={strokeWidth}
          fill="none"
        />
        {arcs.map((arc, index) => (
          <Arc
            key={arc.id}
            radius={radiusValue}
            circumference={circumference}
            fraction={arc.fraction}
            offset={arc.offset}
            color={arc.color}
            strokeWidth={strokeWidth}
            gap={gap}
            delay={140 + index * 90}
          />
        ))}
      </Svg>
      <View style={{ alignItems: 'center' }}>
        {centreLabel ? (
          <Text variant="title" tabular>
            {centreLabel}
          </Text>
        ) : null}
        {centreCaption ? (
          <Text variant="micro" tone="tertiary" style={{ marginTop: 4 }}>
            {centreCaption}
          </Text>
        ) : null}
      </View>
    </View>
  );
}

function Arc({
  radius,
  circumference,
  fraction,
  offset,
  color,
  strokeWidth,
  gap,
  delay,
}: {
  radius: number;
  circumference: number;
  fraction: number;
  offset: number;
  color: string;
  strokeWidth: number;
  gap: number;
  delay: number;
}) {
  const grow = useSharedValue(0);

  useEffect(() => {
    grow.value = 0;
    grow.value = withDelay(
      delay,
      withTiming(1, { duration: 900, easing: Easing.out(Easing.cubic) }),
    );
  }, [delay, fraction, grow]);

  const visible = Math.max(circumference * fraction - gap, 0.001);

  const animatedProps = useAnimatedProps(() => ({
    strokeDasharray: `${visible * grow.value} ${circumference}`,
    strokeDashoffset: -circumference * offset,
  }));

  return (
    <AnimatedCircle
      cx={radius + strokeWidth / 2}
      cy={radius + strokeWidth / 2}
      r={radius}
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      fill="none"
      animatedProps={animatedProps}
      transform={`rotate(-90 ${radius + strokeWidth / 2} ${radius + strokeWidth / 2})`}
    />
  );
}
