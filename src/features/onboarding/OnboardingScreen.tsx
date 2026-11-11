import { useRef, useState } from 'react';
import { StyleSheet, View, useWindowDimensions, type ScrollViewInstance } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  Extrapolation,
  interpolate,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useSharedValue,
  type SharedValue,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button } from '../../components/ui/Button';
import { ProgressRing } from '../../components/ui/ProgressRing';
import { Text } from '../../components/ui/Text';
import { PROJECT } from '../../constants/project';
import { haptics } from '../../lib/haptics';
import { radius, spacing, useTheme } from '../../theme';
import type { AuthScreenProps } from '../../navigation/types';

interface Slide {
  id: string;
  eyebrow: string;
  title: string;
  body: string;
}

const slides: Slide[] = [
  {
    id: 'clarity',
    eyebrow: 'Clarity',
    title: 'Every account,\none calm view.',
    body: 'M-Pesa, bank and Sacco balances — composed into a single, quiet picture.',
  },
  {
    id: 'intent',
    eyebrow: 'Intention',
    title: 'Budgets that\nbehave like guides.',
    body: 'Set a limit per category — food, matatu, airtime. Aurum watches the month and tells you where you stand.',
  },
  {
    id: 'momentum',
    eyebrow: 'Momentum',
    title: 'Goals you can\nactually feel.',
    body: 'A laptop, a hostel deposit, a gown for graduation. Add funds as you go and watch the number move.',
  },
];

export function OnboardingScreen({ navigation }: AuthScreenProps<'Welcome'>) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const [index, setIndex] = useState(0);
  const scrollX = useSharedValue(0);
  const scrollRef = useRef<ScrollViewInstance>(null);

  const handler = useAnimatedScrollHandler((event) => {
    scrollX.value = event.contentOffset.x;
  });

  const advance = () => {
    haptics.tap();
    if (index === slides.length - 1) {
      navigation.navigate('SignUp');
      return;
    }
    scrollRef.current?.scrollTo({ x: width * (index + 1), animated: true });
  };

  return (
    <View style={[styles.root, { backgroundColor: theme.colors.background }]}>
      <LinearGradient
        colors={theme.gradients.ambient as unknown as [string, string, ...string[]]}
        style={StyleSheet.absoluteFill}
      />

      <View style={[styles.topBar, { paddingTop: insets.top + spacing.md }]}>
        <View style={styles.wordmark}>
          <View style={[styles.mark, { backgroundColor: theme.colors.accent }]}>
            <Text style={{ color: theme.colors.onAccent, fontSize: 13, fontWeight: '800' }}>A</Text>
          </View>
          <View>
            <Text variant="label" style={{ letterSpacing: 2 }}>
              AURUM
            </Text>
            <Text style={{ fontSize: 8.5, letterSpacing: 1.1, color: theme.colors.textTertiary }}>
              {PROJECT.institution.toUpperCase()} · {PROJECT.courseCode}
            </Text>
          </View>
        </View>
        <Text
          variant="caption"
          tone="tertiary"
          onPress={() => navigation.navigate('SignIn')}
          suppressHighlighting
        >
          Sign in
        </Text>
      </View>

      <Animated.ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        scrollEventThrottle={16}
        onScroll={handler}
        onMomentumScrollEnd={(event) => {
          setIndex(Math.round(event.nativeEvent.contentOffset.x / width));
        }}
        style={{ flex: 1 }}
      >
        {slides.map((slide, slideIndex) => (
          <View key={slide.id} style={[styles.slide, { width }]}>
            <Art index={slideIndex} scrollX={scrollX} width={width} />
            <View style={styles.copy}>
              <Text variant="micro" tone="accent">
                {slide.eyebrow}
              </Text>
              <Text variant="display" style={{ marginTop: spacing.md }}>
                {slide.title}
              </Text>
              <Text
                variant="body"
                tone="secondary"
                style={{ marginTop: spacing.md, maxWidth: 320 }}
              >
                {slide.body}
              </Text>
            </View>
          </View>
        ))}
      </Animated.ScrollView>

      <View style={[styles.footer, { paddingBottom: insets.bottom + spacing.xl }]}>
        <View style={styles.dots}>
          {slides.map((slide, dotIndex) => (
            <Dot key={slide.id} index={dotIndex} scrollX={scrollX} width={width} />
          ))}
        </View>
        <Button
          label={index === slides.length - 1 ? 'Create your account' : 'Continue'}
          onPress={advance}
          icon="arrow-forward"
          iconPosition="trailing"
        />
        <Button
          label="I already have an account"
          variant="ghost"
          onPress={() => navigation.navigate('SignIn')}
        />
      </View>
    </View>
  );
}

function Dot({
  index,
  scrollX,
  width,
}: {
  index: number;
  scrollX: SharedValue<number>;
  width: number;
}) {
  const theme = useTheme();
  const style = useAnimatedStyle(() => {
    const input = [(index - 1) * width, index * width, (index + 1) * width];
    return {
      width: interpolate(scrollX.value, input, [6, 22, 6], Extrapolation.CLAMP),
      opacity: interpolate(scrollX.value, input, [0.25, 1, 0.25], Extrapolation.CLAMP),
    };
  });

  return (
    <Animated.View
      style={[{ height: 6, borderRadius: 3, backgroundColor: theme.colors.accent }, style]}
    />
  );
}

/** Abstract composition — three stacked "product" fragments with parallax. */
function Art({
  index,
  scrollX,
  width,
}: {
  index: number;
  scrollX: SharedValue<number>;
  width: number;
}) {
  const theme = useTheme();

  const parallax = useAnimatedStyle(() => {
    const distance = scrollX.value - index * width;
    return {
      // Cards drift opposite the swipe so neighbours never peek in from the edge.
      transform: [{ translateX: distance * -0.14 }, { rotate: `${distance * 0.004}deg` }],
      opacity: interpolate(Math.abs(distance), [0, width], [1, 0.55], Extrapolation.CLAMP),
    };
  });

  return (
    <View style={styles.artWrap}>
      <Animated.View
        style={[
          styles.art,
          { borderColor: theme.colors.hairline, backgroundColor: theme.colors.surface },
          parallax,
        ]}
      >
        <LinearGradient
          colors={theme.gradients.hero as unknown as [string, string, ...string[]]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
        {index === 0 ? (
          <View style={styles.artInner}>
            <Text variant="micro" tone="secondary">
              Total balance
            </Text>
            <Text style={styles.artNumber}>KSh 182,080</Text>
            <View style={styles.sparkRow}>
              {[0.3, 0.5, 0.4, 0.7, 0.55, 0.85, 1].map((value, i) => (
                <View
                  key={i}
                  style={{
                    flex: 1,
                    height: 4 + value * 34,
                    borderRadius: 3,
                    backgroundColor: theme.colors.accent,
                    opacity: 0.28 + value * 0.6,
                  }}
                />
              ))}
            </View>
            <View style={styles.artFooter}>
              <ArtPill label="In" value="KSh 51,300" tone={theme.colors.positive} />
              <ArtPill label="Out" value="KSh 28,940" tone={theme.colors.negative} />
            </View>
          </View>
        ) : index === 1 ? (
          <View style={[styles.artInner, { alignItems: 'center', gap: spacing.md }]}>
            <ProgressRing progress={0.68} size={132} strokeWidth={13} delay={200}>
              <Text variant="title" tabular>
                68%
              </Text>
              <Text variant="micro" tone="tertiary">
                Food
              </Text>
            </ProgressRing>
            <Text variant="caption" tone="secondary">
              KSh 1,820 of KSh 6,000 left this month
            </Text>
          </View>
        ) : (
          <View style={[styles.artInner, { gap: spacing.lg }]}>
            {[
              { name: 'Laptop for final year', progress: 0.35, color: theme.colors.accent },
              { name: 'Hostel deposit', progress: 0.5, color: theme.colors.positive },
              { name: 'Gown & photos', progress: 0.45, color: theme.colors.info },
            ].map((goal) => (
              <View key={goal.name} style={{ gap: 7 }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                  <Text variant="caption">{goal.name}</Text>
                  <Text variant="caption" tone="tertiary" tabular>
                    {Math.round(goal.progress * 100)}%
                  </Text>
                </View>
                <View style={styles.artTrack}>
                  <View
                    style={{
                      width: `${goal.progress * 100}%`,
                      height: '100%',
                      borderRadius: 3,
                      backgroundColor: goal.color,
                    }}
                  />
                </View>
              </View>
            ))}
            <View style={[styles.artBadge, { borderColor: theme.colors.hairline }]}>
              <Ionicons name="sparkles-outline" size={13} color={theme.colors.accent} />
              <Text variant="caption" tone="secondary">
                On track for graduation
              </Text>
            </View>
          </View>
        )}
      </Animated.View>
    </View>
  );
}

function ArtPill({ label, value, tone }: { label: string; value: string; tone: string }) {
  const theme = useTheme();
  return (
    <View style={[styles.artPill, { backgroundColor: theme.colors.surfaceSunken }]}>
      <Text variant="micro" tone="tertiary">
        {label}
      </Text>
      <Text variant="label" style={{ color: tone }} tabular>
        {value}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.xxl,
  },
  wordmark: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  mark: {
    width: 26,
    height: 26,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  slide: { flex: 1, justifyContent: 'center' },
  artWrap: { paddingHorizontal: spacing.xxl, paddingTop: spacing.xxl },
  art: {
    borderRadius: radius.xxl,
    borderWidth: StyleSheet.hairlineWidth * 2,
    overflow: 'hidden',
    minHeight: 260,
    justifyContent: 'center',
  },
  artInner: { padding: spacing.xxl },
  artNumber: {
    fontSize: 40,
    fontWeight: '700',
    letterSpacing: -1.4,
    marginTop: spacing.sm,
    color: '#F7F5F1',
  },
  sparkRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 6,
    height: 46,
    marginTop: spacing.xl,
  },
  artFooter: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.xl },
  artPill: { flex: 1, padding: spacing.md, borderRadius: radius.md, gap: 2 },
  artTrack: {
    height: 5,
    borderRadius: 3,
    backgroundColor: 'rgba(255,255,255,0.09)',
    overflow: 'hidden',
  },
  artBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-start',
    paddingHorizontal: spacing.md,
    paddingVertical: 5,
    borderRadius: radius.pill,
    borderWidth: StyleSheet.hairlineWidth * 2,
  },
  copy: { paddingHorizontal: spacing.xxl, paddingTop: spacing.xxxl },
  footer: { paddingHorizontal: spacing.xxl, gap: spacing.sm },
  dots: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.lg, marginLeft: 2 },
});
