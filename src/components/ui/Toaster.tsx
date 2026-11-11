import { useEffect } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInUp, FadeOutUp, LinearTransition } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Text } from './Text';
import { useToastStore, type Toast, type ToastVariant } from '../../store/useToastStore';
import { radius, spacing, useTheme } from '../../theme';
import { haptics } from '../../lib/haptics';

const icons: Record<ToastVariant, keyof typeof Ionicons.glyphMap> = {
  default: 'information-circle-outline',
  success: 'checkmark-circle-outline',
  error: 'alert-circle-outline',
  warning: 'warning-outline',
};

function ToastItem({ toast }: { toast: Toast }) {
  const theme = useTheme();
  const dismiss = useToastStore((state) => state.dismiss);

  useEffect(() => {
    const timer = setTimeout(() => dismiss(toast.id), toast.duration);
    return () => clearTimeout(timer);
  }, [dismiss, toast.duration, toast.id]);

  const accent =
    toast.variant === 'success'
      ? theme.colors.positive
      : toast.variant === 'error'
        ? theme.colors.negative
        : toast.variant === 'warning'
          ? theme.colors.warning
          : theme.colors.accent;

  return (
    <Animated.View
      entering={FadeInUp.springify().damping(20).stiffness(200)}
      exiting={FadeOutUp.duration(180)}
      layout={LinearTransition.springify().damping(22)}
      style={[
        styles.item,
        {
          backgroundColor: theme.colors.surfaceRaised,
          borderColor: theme.colors.hairlineStrong,
        },
        theme.elevation.floating,
      ]}
    >
      <View style={styles.row}>
        <Ionicons name={icons[toast.variant]} size={19} color={accent} />
        <View style={{ flex: 1 }}>
          <Text variant="label">{toast.message}</Text>
          {toast.description ? (
            <Text variant="caption" tone="secondary" style={{ marginTop: 2 }}>
              {toast.description}
            </Text>
          ) : null}
        </View>
        {toast.action ? (
          <Pressable
            hitSlop={8}
            onPress={() => {
              haptics.tap();
              toast.action?.onPress();
              dismiss(toast.id);
            }}
          >
            <Text variant="label" style={{ color: accent }}>
              {toast.action.label}
            </Text>
          </Pressable>
        ) : null}
      </View>
    </Animated.View>
  );
}

/** Single mount point for all toasts — rendered above the navigator. */
export function Toaster() {
  const toasts = useToastStore((state) => state.toasts);
  const insets = useSafeAreaInsets();

  return (
    <View pointerEvents="box-none" style={[styles.root, { top: insets.top + spacing.sm }]}>
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    position: 'absolute',
    left: spacing.lg,
    right: spacing.lg,
    gap: spacing.sm,
    zIndex: 1000,
  },
  item: {
    borderRadius: radius.lg,
    borderWidth: StyleSheet.hairlineWidth * 2,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
  },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
});
