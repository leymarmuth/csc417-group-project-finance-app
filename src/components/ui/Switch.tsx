import { useEffect } from 'react';
import { Pressable } from 'react-native';
import Animated, {
  interpolateColor,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { haptics } from '../../lib/haptics';
import { motion, useTheme } from '../../theme';

export function Switch({
  value,
  onChange,
  disabled,
}: {
  value: boolean;
  onChange: (next: boolean) => void;
  disabled?: boolean;
}) {
  const theme = useTheme();
  const progress = useSharedValue(value ? 1 : 0);

  useEffect(() => {
    progress.value = withSpring(value ? 1 : 0, motion.spring.snappy);
  }, [progress, value]);

  const trackStyle = useAnimatedStyle(() => ({
    backgroundColor: interpolateColor(
      progress.value,
      [0, 1],
      [
        theme.scheme === 'dark' ? 'rgba(255,255,255,0.13)' : 'rgba(20,21,26,0.14)',
        theme.colors.accent,
      ],
    ),
  }));

  const knobStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: progress.value * 20 }, { scale: 1 + progress.value * 0.06 }],
  }));

  return (
    <Pressable
      onPress={() => {
        if (disabled) return;
        haptics.select();
        onChange(!value);
      }}
      accessibilityRole="switch"
      accessibilityState={{ checked: value, disabled }}
      style={{ opacity: disabled ? 0.45 : 1 }}
    >
      <Animated.View
        style={[
          {
            width: 50,
            height: 30,
            borderRadius: 15,
            padding: 3,
            justifyContent: 'center',
          },
          trackStyle,
        ]}
      >
        <Animated.View
          style={[
            {
              width: 24,
              height: 24,
              borderRadius: 12,
              backgroundColor: theme.scheme === 'dark' ? '#0B0D12' : '#FFFFFF',
            },
            knobStyle,
          ]}
        />
      </Animated.View>
    </Pressable>
  );
}
