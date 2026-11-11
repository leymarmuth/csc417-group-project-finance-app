import { useEffect } from 'react';
import { View, type StyleProp, type ViewStyle } from 'react-native';
import Svg, { Defs, LinearGradient, Path, Stop } from 'react-native-svg';
import Animated, {
  Easing,
  useAnimatedProps,
  useSharedValue,
  withDelay,
  withTiming,
} from 'react-native-reanimated';
import { polylineLength, scalePoints, smoothPath } from './path';
import { withAlpha } from '../../lib/utils';
import { useTheme } from '../../theme';

const AnimatedPath = Animated.createAnimatedComponent(Path);

export interface AreaChartProps {
  values: number[];
  height?: number;
  width: number;
  color?: string;
  delay?: number;
  /** Draw a dot at the latest point. */
  showLastPoint?: boolean;
  style?: StyleProp<ViewStyle>;
}

/** Gradient area chart that draws itself in, left to right. */
export function AreaChart({
  values,
  height = 140,
  width,
  color,
  delay = 120,
  showLastPoint = true,
  style,
}: AreaChartProps) {
  const theme = useTheme();
  const stroke = color ?? theme.colors.accent;

  const points = scalePoints(values, width, height, 8);
  const line = smoothPath(points);
  const length = polylineLength(points);
  const area = points.length ? `${line} L ${width} ${height} L 0 ${height} Z` : '';

  const draw = useSharedValue(0);
  const fill = useSharedValue(0);

  useEffect(() => {
    draw.value = 0;
    fill.value = 0;
    draw.value = withDelay(
      delay,
      withTiming(1, { duration: 1200, easing: Easing.out(Easing.cubic) }),
    );
    fill.value = withDelay(delay + 420, withTiming(1, { duration: 700 }));
  }, [delay, draw, fill, length, line]);

  const lineProps = useAnimatedProps(() => ({
    strokeDashoffset: length * (1 - draw.value),
  }));

  const fillProps = useAnimatedProps(() => ({ opacity: fill.value }));

  const last = points[points.length - 1];

  return (
    <View style={style}>
      <Svg width={width} height={height}>
        <Defs>
          <LinearGradient id="areaFill" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor={withAlpha(stroke, 0.42)} />
            <Stop offset="0.65" stopColor={withAlpha(stroke, 0.1)} />
            <Stop offset="1" stopColor={withAlpha(stroke, 0)} />
          </LinearGradient>
        </Defs>
        {area ? <AnimatedPath d={area} fill="url(#areaFill)" animatedProps={fillProps} /> : null}
        {line ? (
          <AnimatedPath
            d={line}
            stroke={stroke}
            strokeWidth={2.4}
            strokeLinecap="round"
            fill="none"
            strokeDasharray={`${length} ${length}`}
            animatedProps={lineProps}
          />
        ) : null}
        {showLastPoint && last ? (
          <>
            <Path
              d={`M ${last.x} ${last.y}`}
              stroke={withAlpha(stroke, 0.28)}
              strokeWidth={10}
              strokeLinecap="round"
            />
            <Path
              d={`M ${last.x} ${last.y}`}
              stroke={stroke}
              strokeWidth={4}
              strokeLinecap="round"
            />
          </>
        ) : null}
      </Svg>
    </View>
  );
}
