import { useCallback, useEffect, useState } from 'react';
import type { TextStyle } from 'react-native';
import {
  Easing,
  runOnJS,
  useAnimatedReaction,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { Text, type TextProps } from './Text';

export interface AnimatedNumberProps extends Omit<TextProps, 'children'> {
  value: number;
  format?: (value: number) => string;
  duration?: number;
  /** Start from zero on first mount (the "count up" signature move). */
  countUp?: boolean;
  style?: TextStyle | TextStyle[];
}

/**
 * Interpolates between the previous and next value in the UI thread and pushes
 * the formatted string back with `runOnJS` — no per-frame React re-renders of
 * the parent, and money never jitters.
 */
export function AnimatedNumber({
  value,
  format = (input) => Math.round(input).toLocaleString(),
  duration = 850,
  countUp = true,
  ...textProps
}: AnimatedNumberProps) {
  const shared = useSharedValue(countUp ? 0 : value);
  const [display, setDisplay] = useState(() => format(countUp ? 0 : value));

  useEffect(() => {
    shared.value = withTiming(value, { duration, easing: Easing.out(Easing.cubic) });
  }, [duration, shared, value]);

  // `format` is a regular JS function: run it on the JS thread, never inside the worklet
  // (calling a non-worklet function on the UI thread crashes native builds).
  const updateDisplay = useCallback((current: number) => setDisplay(format(current)), [format]);

  useAnimatedReaction(
    () => shared.value,
    (current, previous) => {
      if (current !== previous) runOnJS(updateDisplay)(current);
    },
    [updateDisplay],
  );

  return (
    <Text {...textProps} tabular>
      {display}
    </Text>
  );
}
