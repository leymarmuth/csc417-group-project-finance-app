import { useEffect } from 'react';
import { ActivityIndicator, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { PressableScale } from './PressableScale';
import { Text } from './Text';
import { radius, spacing, useTheme } from '../../theme';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'outline';
export type ButtonSize = 'sm' | 'md' | 'lg';

export interface ButtonProps {
  label: string;
  onPress?: () => void;
  variant?: ButtonVariant;
  size?: ButtonSize;
  icon?: keyof typeof Ionicons.glyphMap;
  iconPosition?: 'leading' | 'trailing';
  loading?: boolean;
  disabled?: boolean;
  fullWidth?: boolean;
  style?: StyleProp<ViewStyle>;
  accessibilityLabel?: string;
}

const heights: Record<ButtonSize, number> = { sm: 38, md: 50, lg: 58 };

export function Button({
  label,
  onPress,
  variant = 'primary',
  size = 'md',
  icon,
  iconPosition = 'leading',
  loading = false,
  disabled = false,
  fullWidth = true,
  style,
  accessibilityLabel,
}: ButtonProps) {
  const theme = useTheme();
  const shimmer = useSharedValue(0);

  useEffect(() => {
    if (loading) {
      shimmer.value = withRepeat(
        withTiming(1, { duration: 1100, easing: Easing.inOut(Easing.quad) }),
        -1,
        false,
      );
    } else {
      shimmer.value = 0;
    }
  }, [loading, shimmer]);

  const shimmerStyle = useAnimatedStyle(() => ({
    opacity: 0.55 + Math.sin(shimmer.value * Math.PI) * 0.45,
  }));

  const height = heights[size];
  const labelVariant = size === 'sm' ? 'label' : 'bodyStrong';

  const content = (color: string) => (
    <View style={styles.content}>
      {loading ? (
        <Animated.View style={shimmerStyle}>
          <ActivityIndicator size="small" color={color} />
        </Animated.View>
      ) : (
        <>
          {icon && iconPosition === 'leading' ? (
            <Ionicons name={icon} size={size === 'sm' ? 15 : 18} color={color} />
          ) : null}
          <Text variant={labelVariant} style={{ color, letterSpacing: 0.1 }}>
            {label}
          </Text>
          {icon && iconPosition === 'trailing' ? (
            <Ionicons name={icon} size={size === 'sm' ? 15 : 18} color={color} />
          ) : null}
        </>
      )}
    </View>
  );

  const isDisabled = disabled || loading;

  if (variant === 'primary') {
    return (
      <PressableScale
        onPress={onPress}
        disabled={isDisabled}
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel ?? label}
        style={[fullWidth ? styles.full : null, { borderRadius: radius.pill, height }, style]}
      >
        <LinearGradient
          colors={theme.gradients.gold as unknown as [string, string, ...string[]]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[styles.fill, { borderRadius: radius.pill }]}
        >
          {content(theme.colors.onAccent)}
        </LinearGradient>
      </PressableScale>
    );
  }

  const surface: Record<
    Exclude<ButtonVariant, 'primary'>,
    { bg: string; border: string; fg: string }
  > = {
    secondary: {
      bg: theme.colors.surface,
      border: theme.colors.hairline,
      fg: theme.colors.text,
    },
    outline: {
      bg: 'transparent',
      border: theme.colors.hairlineStrong,
      fg: theme.colors.text,
    },
    ghost: { bg: 'transparent', border: 'transparent', fg: theme.colors.textSecondary },
    danger: { bg: theme.colors.negativeSoft, border: 'transparent', fg: theme.colors.negative },
  };
  const spec = surface[variant];

  return (
    <PressableScale
      onPress={onPress}
      disabled={isDisabled}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? label}
      style={[
        styles.fill,
        fullWidth ? styles.full : null,
        {
          height,
          borderRadius: radius.pill,
          backgroundColor: spec.bg,
          borderWidth: StyleSheet.hairlineWidth * 2,
          borderColor: spec.border,
        },
        style,
      ]}
    >
      {content(spec.fg)}
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  fill: { alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  full: { alignSelf: 'stretch' },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
  },
});
