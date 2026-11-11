import React, { useCallback } from 'react';
import { Pressable, type PressableProps, type StyleProp, type ViewStyle } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { motion } from '../../theme';
import { haptics } from '../../lib/haptics';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export interface PressableScaleProps extends Omit<PressableProps, 'style'> {
  style?: StyleProp<ViewStyle>;
  /** How far the element compresses. 0.97 is the house default. */
  activeScale?: number;
  /** Fire a light haptic on press-in. */
  haptic?: boolean;
  children?: React.ReactNode;
}

/**
 * The single tap primitive for the app: spring-driven compression, no ripple,
 * haptically confirmed. Every interactive surface is built on this.
 */
export function PressableScale({
  style,
  activeScale = 0.97,
  haptic = true,
  onPressIn,
  onPressOut,
  disabled,
  children,
  ...rest
}: PressableScaleProps) {
  const scale = useSharedValue(1);
  const opacity = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  const handleIn = useCallback<NonNullable<PressableProps['onPressIn']>>(
    (event) => {
      scale.value = withSpring(activeScale, motion.spring.snappy);
      opacity.value = withSpring(0.92, motion.spring.snappy);
      if (haptic) haptics.tap();
      onPressIn?.(event);
    },
    [activeScale, haptic, onPressIn, opacity, scale],
  );

  const handleOut = useCallback<NonNullable<PressableProps['onPressOut']>>(
    (event) => {
      scale.value = withSpring(1, motion.spring.bouncy);
      opacity.value = withSpring(1, motion.spring.snappy);
      onPressOut?.(event);
    },
    [onPressOut, opacity, scale],
  );

  return (
    <AnimatedPressable
      {...rest}
      disabled={disabled}
      onPressIn={handleIn}
      onPressOut={handleOut}
      style={[style, animatedStyle, disabled ? { opacity: 0.5 } : null]}
    >
      {children}
    </AnimatedPressable>
  );
}
