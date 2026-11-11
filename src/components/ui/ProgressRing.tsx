import { useEffect } from 'react';
import { View, type StyleProp, type ViewStyle } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import Animated, {
  useAnimatedProps,
  useSharedValue,
  withDelay,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { useTheme } from '../../theme';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

export interface ProgressRingProps {
  progress: number;
  size?: number;
  strokeWidth?: number;
  color?: string;
  trackColor?: string;
  delay?: number;
  children?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  rounded?: boolean;
}

/** SVG ring whose sweep animates in on mount and on every value change. */
export function ProgressRing({
  progress,
  size = 64,
  strokeWidth = 6,
  color,
  trackColor,
  delay = 0,
  children,
  style,
  rounded = true,
}: ProgressRingProps) {
  const theme = useTheme();
  const clamped = Math.max(0, Math.min(progress, 1));
  const radiusValue = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radiusValue;

  const animated = useSharedValue(0);

  useEffect(() => {
    animated.value = withDelay(
      delay,
      withTiming(clamped, { duration: 900, easing: Easing.out(Easing.cubic) }),
    );
  }, [animated, clamped, delay]);

  const animatedProps = useAnimatedProps(() => ({
    strokeDashoffset: circumference * (1 - animated.value),
  }));

  return (
    <View style={[{ width: size, height: size }, style]}>
      <Svg width={size} height={size}>
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radiusValue}
          stroke={trackColor ?? theme.colors.hairline}
          strokeWidth={strokeWidth}
          fill="none"
        />
        <AnimatedCircle
          cx={size / 2}
          cy={size / 2}
          r={radiusValue}
          stroke={color ?? theme.colors.accent}
          strokeWidth={strokeWidth}
          strokeLinecap={rounded ? 'round' : 'butt'}
          fill="none"
          strokeDasharray={`${circumference} ${circumference}`}
          animatedProps={animatedProps}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </Svg>
      {children ? (
        <View
          style={{
            ...StyleSheetAbsoluteFill,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {children}
        </View>
      ) : null}
    </View>
  );
}

const StyleSheetAbsoluteFill = {
  position: 'absolute' as const,
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
};
