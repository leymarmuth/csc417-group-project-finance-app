import { useEffect } from 'react';
import Svg, { Path } from 'react-native-svg';
import Animated, {
  Easing,
  useAnimatedProps,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { polylineLength, scalePoints, smoothPath } from './path';
import { useTheme } from '../../theme';

const AnimatedPath = Animated.createAnimatedComponent(Path);

export function Sparkline({
  values,
  width = 64,
  height = 26,
  color,
  strokeWidth = 1.8,
}: {
  values: number[];
  width?: number;
  height?: number;
  color?: string;
  strokeWidth?: number;
}) {
  const theme = useTheme();
  const stroke = color ?? theme.colors.accent;
  const points = scalePoints(values, width, height, 3);
  const path = smoothPath(points);
  const length = polylineLength(points);

  const draw = useSharedValue(0);
  useEffect(() => {
    draw.value = 0;
    draw.value = withTiming(1, { duration: 900, easing: Easing.out(Easing.cubic) });
  }, [draw, path]);

  const animatedProps = useAnimatedProps(() => ({
    strokeDashoffset: length * (1 - draw.value),
  }));

  return (
    <Svg width={width} height={height}>
      <AnimatedPath
        d={path}
        stroke={stroke}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        fill="none"
        strokeDasharray={`${length} ${length}`}
        animatedProps={animatedProps}
      />
    </Svg>
  );
}
