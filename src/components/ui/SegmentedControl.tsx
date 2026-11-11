import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { Text } from './Text';
import { haptics } from '../../lib/haptics';
import { motion, radius, spacing, useTheme } from '../../theme';

export interface SegmentedOption<T extends string> {
  value: T;
  label: string;
}

export interface SegmentedControlProps<T extends string> {
  options: SegmentedOption<T>[];
  value: T;
  onChange: (value: T) => void;
  size?: 'sm' | 'md';
}

/** Sliding indicator segmented control — no rebuild, just one shared value. */
export function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
  size = 'md',
}: SegmentedControlProps<T>) {
  const theme = useTheme();
  const [width, setWidth] = useState(0);
  const index = Math.max(
    0,
    options.findIndex((option) => option.value === value),
  );
  const offset = useSharedValue(0);

  const segmentWidth = width / Math.max(options.length, 1);

  useEffect(() => {
    offset.value = withSpring(index * segmentWidth, motion.spring.snappy);
  }, [index, offset, segmentWidth]);

  const indicatorStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: offset.value }],
    width: segmentWidth,
  }));

  const height = size === 'sm' ? 34 : 42;

  return (
    <View
      onLayout={(event) => setWidth(event.nativeEvent.layout.width)}
      style={[
        styles.track,
        {
          height,
          borderRadius: radius.pill,
          backgroundColor: theme.colors.surfaceSunken,
          borderColor: theme.colors.hairline,
        },
      ]}
    >
      {segmentWidth > 0 ? (
        <Animated.View
          style={[
            styles.indicator,
            {
              height: height - 6,
              borderRadius: radius.pill,
              backgroundColor: theme.colors.surfaceRaised,
              borderColor: theme.colors.hairlineStrong,
            },
            indicatorStyle,
          ]}
        />
      ) : null}
      {options.map((option) => {
        const selected = option.value === value;
        return (
          <Pressable
            key={option.value}
            style={styles.segment}
            onPress={() => {
              if (selected) return;
              haptics.select();
              onChange(option.value);
            }}
            accessibilityRole="tab"
            accessibilityState={{ selected }}
          >
            <Text
              variant={size === 'sm' ? 'caption' : 'label'}
              style={{ color: selected ? theme.colors.text : theme.colors.textTertiary }}
            >
              {option.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    flexDirection: 'row',
    padding: 3,
    borderWidth: StyleSheet.hairlineWidth * 2,
    position: 'relative',
  },
  indicator: {
    position: 'absolute',
    top: 3,
    left: 3,
    borderWidth: StyleSheet.hairlineWidth * 2,
  },
  segment: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xs,
  },
});
