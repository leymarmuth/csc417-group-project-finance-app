import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import Animated, {
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  type SharedValue,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { haptics } from '../lib/haptics';
import { motion, radius, spacing, useTheme } from '../theme';

const ICONS: Record<
  string,
  {
    active: keyof typeof Ionicons.glyphMap;
    inactive: keyof typeof Ionicons.glyphMap;
    label: string;
  }
> = {
  Home: { active: 'home', inactive: 'home-outline', label: 'Home' },
  Activity: { active: 'receipt', inactive: 'receipt-outline', label: 'Activity' },
  Insights: { active: 'pie-chart', inactive: 'pie-chart-outline', label: 'Insights' },
  Goals: { active: 'flag', inactive: 'flag-outline', label: 'Goals' },
  Profile: { active: 'person', inactive: 'person-outline', label: 'Profile' },
};

/**
 * Floating, blurred tab bar with a single spring-driven indicator.
 * One shared value powers both the pill position and the per-icon lift.
 */
export function TabBar({ state, navigation }: BottomTabBarProps) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const [width, setWidth] = useState(0);
  const progress = useSharedValue(state.index);

  useEffect(() => {
    progress.value = withSpring(state.index, motion.spring.gentle);
  }, [progress, state.index]);

  const tabWidth = width / Math.max(state.routes.length, 1);

  const indicatorStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: progress.value * tabWidth }],
    width: tabWidth,
  }));

  return (
    <View
      style={[styles.wrap, { paddingBottom: Math.max(insets.bottom, spacing.md) }]}
      pointerEvents="box-none"
    >
      <View
        style={[styles.bar, theme.elevation.floating, { borderColor: theme.colors.hairline }]}
        onLayout={(event) => setWidth(event.nativeEvent.layout.width)}
      >
        <BlurView
          intensity={theme.scheme === 'dark' ? 42 : 60}
          tint={theme.scheme === 'dark' ? 'dark' : 'light'}
          style={StyleSheet.absoluteFill}
        />
        <View
          style={[
            StyleSheet.absoluteFill,
            {
              backgroundColor:
                theme.scheme === 'dark' ? 'rgba(14,16,21,0.72)' : 'rgba(255,255,255,0.72)',
            },
          ]}
        />

        {tabWidth > 0 ? (
          <Animated.View style={[styles.indicatorLayer, indicatorStyle]}>
            <View style={[styles.indicator, { backgroundColor: theme.colors.accentSoft }]} />
          </Animated.View>
        ) : null}

        {state.routes.map((route, index) => {
          const meta = ICONS[route.name] ?? ICONS.Home;
          const focused = state.index === index;
          return (
            <TabItem
              key={route.key}
              label={meta.label}
              activeIcon={meta.active}
              inactiveIcon={meta.inactive}
              focused={focused}
              index={index}
              progress={progress}
              onPress={() => {
                const event = navigation.emit({
                  type: 'tabPress',
                  target: route.key,
                  canPreventDefault: true,
                });
                if (!focused && !event.defaultPrevented) {
                  haptics.select();
                  navigation.navigate(route.name);
                }
              }}
            />
          );
        })}
      </View>
    </View>
  );
}

function TabItem({
  label,
  activeIcon,
  inactiveIcon,
  focused,
  index,
  progress,
  onPress,
}: {
  label: string;
  activeIcon: keyof typeof Ionicons.glyphMap;
  inactiveIcon: keyof typeof Ionicons.glyphMap;
  focused: boolean;
  index: number;
  progress: SharedValue<number>;
  onPress: () => void;
}) {
  const theme = useTheme();

  const iconStyle = useAnimatedStyle(() => {
    const distance = Math.abs(progress.value - index);
    return {
      transform: [
        { translateY: interpolate(distance, [0, 1], [-1.5, 0], 'clamp') },
        { scale: interpolate(distance, [0, 1], [1.06, 0.96], 'clamp') },
      ],
      opacity: interpolate(distance, [0, 1], [1, 0.55], 'clamp'),
    };
  });

  return (
    <Pressable
      onPress={onPress}
      style={styles.tab}
      accessibilityRole="tab"
      accessibilityState={{ selected: focused }}
      accessibilityLabel={label}
    >
      <Animated.View style={[styles.tabInner, iconStyle]}>
        <Ionicons
          name={focused ? activeIcon : inactiveIcon}
          size={21}
          color={focused ? theme.colors.accent : theme.colors.textTertiary}
        />
        <Animated.Text
          numberOfLines={1}
          style={[
            styles.label,
            { color: focused ? theme.colors.accent : theme.colors.textTertiary },
          ]}
        >
          {label}
        </Animated.Text>
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrap: { position: 'absolute', left: 0, right: 0, bottom: 0, paddingHorizontal: spacing.lg },
  bar: {
    flexDirection: 'row',
    height: 66,
    borderRadius: radius.xxl,
    borderWidth: StyleSheet.hairlineWidth * 2,
    overflow: 'hidden',
    alignItems: 'center',
  },
  indicatorLayer: { position: 'absolute', top: 0, bottom: 0, justifyContent: 'center' },
  indicator: {
    height: 46,
    marginHorizontal: 14,
    borderRadius: radius.lg,
  },
  tab: { flex: 1, alignItems: 'center', justifyContent: 'center', height: '100%' },
  tabInner: { alignItems: 'center', gap: 2 },
  label: { fontSize: 9.5, fontWeight: '600', letterSpacing: 0.2 },
});
