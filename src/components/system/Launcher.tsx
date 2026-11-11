import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { Text } from '../ui/Text';
import { useTheme } from '../../theme';
import { PROJECT } from '../../constants/project';

/**
 * Boot / splash surface. Shown while fonts load, settings hydrate and the
 * session is restored — so the first real frame is never a half-built UI.
 */
export function Launcher() {
  const theme = useTheme();
  const markScale = useSharedValue(0.7);
  const markOpacity = useSharedValue(0);
  const glow = useSharedValue(0);
  const textShift = useSharedValue(12);

  useEffect(() => {
    markOpacity.value = withTiming(1, { duration: 520, easing: Easing.out(Easing.cubic) });
    markScale.value = withSpring(1, { damping: 14, stiffness: 120 });
    textShift.value = withDelay(260, withSpring(0, { damping: 18, stiffness: 140 }));
    glow.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 1400, easing: Easing.inOut(Easing.quad) }),
        withTiming(0.25, { duration: 1400, easing: Easing.inOut(Easing.quad) }),
      ),
      -1,
      false,
    );
  }, [glow, markOpacity, markScale, textShift]);

  const markStyle = useAnimatedStyle(() => ({
    opacity: markOpacity.value,
    transform: [{ scale: markScale.value }],
  }));

  const glowStyle = useAnimatedStyle(() => ({
    opacity: 0.12 + glow.value * 0.16,
    transform: [{ scale: 0.9 + glow.value * 0.12 }],
  }));

  const textStyle = useAnimatedStyle(() => ({
    opacity: markOpacity.value,
    transform: [{ translateY: textShift.value }],
  }));

  return (
    <View style={[styles.root, { backgroundColor: theme.colors.background }]}>
      <LinearGradient
        colors={theme.gradients.ambient as unknown as [string, string, ...string[]]}
        style={StyleSheet.absoluteFill}
      />
      <Animated.View style={[styles.glow, { backgroundColor: theme.colors.accent }, glowStyle]} />
      <Animated.View style={[styles.markWrap, markStyle]}>
        <LinearGradient
          colors={theme.gradients.gold as unknown as [string, string, ...string[]]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.mark}
        >
          <Text style={[styles.letter, { color: theme.colors.onAccent }]}>A</Text>
        </LinearGradient>
      </Animated.View>
      <Animated.View style={[textStyle, styles.wordmark]}>
        <Text variant="micro" tone="secondary" style={{ letterSpacing: 6 }}>
          AURUM
        </Text>
        <Text variant="caption" tone="tertiary" style={{ marginTop: 6 }}>
          wealth, composed
        </Text>
        <Text
          style={{
            fontSize: 9,
            letterSpacing: 1.6,
            marginTop: 10,
            color: theme.colors.textTertiary,
          }}
        >
          {PROJECT.courseCode} · GROUP PROJECT · {PROJECT.institution.toUpperCase()}
        </Text>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 26 },
  glow: { position: 'absolute', width: 240, height: 240, borderRadius: 120 },
  markWrap: { alignItems: 'center', justifyContent: 'center' },
  mark: {
    width: 78,
    height: 78,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
  },
  letter: { fontSize: 38, fontWeight: '800', letterSpacing: -1 },
  wordmark: { alignItems: 'center' },
});
