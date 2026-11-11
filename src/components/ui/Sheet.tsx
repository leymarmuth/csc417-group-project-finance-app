import { useEffect, useState } from 'react';
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
  useWindowDimensions,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  Easing,
  interpolate,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Text } from './Text';
import { IconButton } from './IconButton';
import { motion, radius, spacing, useTheme } from '../../theme';

export interface SheetProps {
  visible: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  scrollable?: boolean;
  /** Dismiss when the backdrop is tapped. */
  dismissOnBackdrop?: boolean;
  contentStyle?: StyleProp<ViewStyle>;
  /** Hide the grab handle + close button for custom headers. */
  hideChrome?: boolean;
}

/**
 * Gesture-driven bottom sheet.
 * Mounted state is decoupled from `visible` so the exit animation can finish.
 */
export function Sheet({
  visible,
  onClose,
  title,
  description,
  children,
  footer,
  scrollable = true,
  dismissOnBackdrop = true,
  contentStyle,
  hideChrome = false,
}: SheetProps) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const { height } = useWindowDimensions();
  const [mounted, setMounted] = useState(visible);

  const progress = useSharedValue(0);
  const dragY = useSharedValue(0);

  useEffect(() => {
    if (visible) {
      setMounted(true);
      dragY.value = 0;
      progress.value = withSpring(1, motion.spring.gentle);
    } else {
      progress.value = withTiming(
        0,
        { duration: motion.duration.fast, easing: Easing.out(Easing.cubic) },
        (finished) => {
          if (finished) runOnJS(setMounted)(false);
        },
      );
    }
  }, [dragY, progress, visible]);

  const sheetStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: (1 - progress.value) * height * 0.6 + Math.max(dragY.value, 0) }],
  }));

  const backdropStyle = useAnimatedStyle(() => ({
    opacity: progress.value * 0.98,
  }));

  const pan = Gesture.Pan()
    .onUpdate((event) => {
      dragY.value = Math.max(event.translationY, 0);
    })
    .onEnd((event) => {
      const shouldClose = event.translationY > 110 || event.velocityY > 850;
      if (shouldClose) {
        runOnJS(onClose)();
      } else {
        dragY.value = withSpring(0, motion.spring.snappy);
      }
    });

  if (!mounted) return null;

  return (
    <Modal
      visible={mounted}
      transparent
      animationType="none"
      statusBarTranslucent
      navigationBarTranslucent
      onRequestClose={onClose}
    >
      <View style={styles.root}>
        <Animated.View
          style={[StyleSheet.absoluteFill, { backgroundColor: theme.colors.scrim }, backdropStyle]}
        >
          <Pressable
            style={StyleSheet.absoluteFill}
            onPress={() => {
              if (dismissOnBackdrop) onClose();
            }}
            accessibilityLabel="Dismiss"
            accessibilityRole="button"
          />
        </Animated.View>

        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.keyboard}
          pointerEvents="box-none"
        >
          <Animated.View
            style={[
              styles.sheet,
              {
                maxHeight: height * 0.92,
                backgroundColor: theme.colors.surfaceRaised,
                borderColor: theme.colors.hairline,
                paddingBottom: Math.max(insets.bottom, spacing.lg),
              },
              theme.elevation.floating,
              sheetStyle,
            ]}
          >
            <GestureDetector gesture={pan}>
              <View>
                <View style={styles.handleWrap}>
                  <View style={[styles.handle, { backgroundColor: theme.colors.hairlineStrong }]} />
                </View>
                {!hideChrome && (title || description) ? (
                  <View style={styles.header}>
                    <View style={styles.headerText}>
                      {title ? <Text variant="heading">{title}</Text> : null}
                      {description ? (
                        <Text variant="caption" tone="secondary" style={{ marginTop: spacing.xs }}>
                          {description}
                        </Text>
                      ) : null}
                    </View>
                    <IconButton
                      name="close"
                      size={16}
                      diameter={34}
                      onPress={onClose}
                      accessibilityLabel="Close"
                      background={theme.colors.surfaceSunken}
                    />
                  </View>
                ) : null}
              </View>
            </GestureDetector>

            {scrollable ? (
              <ScrollView
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={false}
                contentContainerStyle={[styles.content, contentStyle]}
              >
                {children}
              </ScrollView>
            ) : (
              <View style={[styles.content, contentStyle]}>{children}</View>
            )}

            {footer ? <View style={styles.footer}>{footer}</View> : null}
          </Animated.View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}

/** Decorative overlay used for "processing" states. */
export function SheetScrollSpacer() {
  return <View style={{ height: spacing.xxl }} />;
}

const styles = StyleSheet.create({
  root: { flex: 1, justifyContent: 'flex-end' },
  keyboard: { justifyContent: 'flex-end' },
  sheet: {
    borderTopLeftRadius: radius.xxl,
    borderTopRightRadius: radius.xxl,
    borderTopWidth: StyleSheet.hairlineWidth * 2,
    overflow: 'hidden',
  },
  handleWrap: { alignItems: 'center', paddingTop: spacing.md },
  handle: { width: 40, height: 4, borderRadius: 2 },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: spacing.md,
    paddingHorizontal: spacing.xxl,
    paddingTop: spacing.lg,
  },
  headerText: { flex: 1 },
  content: { paddingHorizontal: spacing.xxl, paddingTop: spacing.xl },
  footer: {
    paddingHorizontal: spacing.xxl,
    paddingTop: spacing.lg,
    gap: spacing.md,
  },
});

export { interpolate };
