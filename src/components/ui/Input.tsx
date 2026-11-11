import { useEffect, useState } from 'react';
import {
  Platform,
  Pressable,
  StyleSheet,
  TextInput,
  View,
  type TextInputProps,
  type StyleProp,
  type TextStyle,
  type ViewStyle,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  interpolateColor,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { Text } from './Text';
import { fontSize, fonts, radius, spacing, useTheme } from '../../theme';

export interface InputProps extends Omit<TextInputProps, 'style'> {
  label?: string;
  hint?: string;
  error?: string;
  icon?: keyof typeof Ionicons.glyphMap;
  /** Adds a visibility toggle and masks the value. */
  secure?: boolean;
  containerStyle?: StyleProp<ViewStyle>;
  /** Compact variant used inside dense rows. */
  size?: 'md' | 'lg';
  trailing?: React.ReactNode;
}

export function Input({
  label,
  hint,
  error,
  icon,
  secure = false,
  containerStyle,
  size = 'md',
  trailing,
  onFocus,
  onBlur,
  value,
  ...rest
}: InputProps) {
  const theme = useTheme();
  const [focused, setFocused] = useState(false);
  const [revealed, setRevealed] = useState(false);
  const focus = useSharedValue(0);

  useEffect(() => {
    focus.value = withTiming(focused ? 1 : 0, { duration: 180 });
  }, [focus, focused]);

  const shellStyle = useAnimatedStyle(() => ({
    borderColor: interpolateColor(
      focus.value,
      [0, 1],
      [
        error ? theme.colors.negative : theme.colors.hairline,
        error ? theme.colors.negative : theme.colors.accent,
      ],
    ),
    backgroundColor: interpolateColor(
      focus.value,
      [0, 1],
      [theme.colors.surfaceSunken, theme.colors.surface],
    ),
  }));

  const height = size === 'lg' ? 62 : 54;

  return (
    <View style={containerStyle}>
      {label ? (
        <Text variant="micro" tone="tertiary" style={styles.label}>
          {label}
        </Text>
      ) : null}
      <Animated.View
        style={[
          styles.shell,
          { height, borderRadius: radius.lg, borderWidth: StyleSheet.hairlineWidth * 2 },
          shellStyle,
        ]}
      >
        {icon ? <Ionicons name={icon} size={17} color={theme.colors.textTertiary} /> : null}
        <TextInput
          {...rest}
          value={value}
          secureTextEntry={secure && !revealed}
          placeholderTextColor={theme.colors.textTertiary}
          selectionColor={theme.colors.accent}
          cursorColor={theme.colors.accent}
          onFocus={(event) => {
            setFocused(true);
            onFocus?.(event);
          }}
          onBlur={(event) => {
            setFocused(false);
            onBlur?.(event);
          }}
          style={[
            styles.input,
            { color: theme.colors.text, fontSize: size === 'lg' ? fontSize.lead : fontSize.body },
            Platform.OS === 'web' ? styles.webReset : null,
          ]}
        />
        {secure ? (
          <Pressable
            hitSlop={10}
            onPress={() => setRevealed((prev) => !prev)}
            accessibilityRole="button"
            accessibilityLabel={revealed ? 'Hide password' : 'Show password'}
          >
            <Ionicons
              name={revealed ? 'eye-off-outline' : 'eye-outline'}
              size={18}
              color={theme.colors.textTertiary}
            />
          </Pressable>
        ) : null}
        {trailing}
      </Animated.View>
      {error ? (
        <Text variant="caption" tone="negative" style={styles.helper}>
          {error}
        </Text>
      ) : hint ? (
        <Text variant="caption" tone="tertiary" style={styles.helper}>
          {hint}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  label: { marginBottom: spacing.sm, marginLeft: spacing.xs },
  shell: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    gap: spacing.md,
  },
  input: {
    flex: 1,
    fontFamily: fonts.medium,
    paddingVertical: 0,
    letterSpacing: -0.1,
  },
  helper: { marginTop: spacing.sm, marginLeft: spacing.xs },
  // React Native Web draws the browser's default focus outline; the animated
  // shell already communicates focus, so we remove it there only.
  webReset: { outlineStyle: 'none' } as unknown as TextStyle,
});
