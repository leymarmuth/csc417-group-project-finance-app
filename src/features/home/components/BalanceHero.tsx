import { StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeIn } from 'react-native-reanimated';
import { MoneyDisplay } from '../../../components/finance/MoneyDisplay';
import { Sparkline } from '../../../components/charts';
import { AmbientGlow } from '../../../components/ui/AmbientGlow';
import { IconButton } from '../../../components/ui/IconButton';
import { PressableScale } from '../../../components/ui/PressableScale';
import { Text } from '../../../components/ui/Text';
import { formatPercent } from '../../../lib/format';
import { haptics } from '../../../lib/haptics';
import { radius, spacing, useTheme } from '../../../theme';
import type { CurrencyCode } from '../../../types/models';

export interface BalanceHeroProps {
  total: number;
  currency: CurrencyCode;
  income: number;
  expense: number;
  change: number;
  trend: number[];
  masked: boolean;
  onToggleMask: () => void;
  onPress?: () => void;
}

/** The signature card: total balance, month delta and a six-month trend. */
export function BalanceHero({
  total,
  currency,
  income,
  expense,
  change,
  trend,
  masked,
  onToggleMask,
  onPress,
}: BalanceHeroProps) {
  const theme = useTheme();
  /** Spending less than last month reads as good news. */
  const positive = change < 0;

  return (
    <PressableScale onPress={onPress} haptic={false} activeScale={0.99}>
      <View style={[styles.shell, { borderColor: theme.colors.hairline }, theme.elevation.card]}>
        <LinearGradient
          colors={theme.gradients.hero as unknown as [string, string, ...string[]]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
        <AmbientGlow color={theme.colors.accent} size={320} intensity={0.16} style={styles.glow} />
        <View style={styles.content}>
          <View style={styles.topRow}>
            <View style={styles.labelRow}>
              <Text variant="micro" tone="secondary">
                Total balance
              </Text>
              <PressableScale
                onPress={() => {
                  haptics.select();
                  onToggleMask();
                }}
                activeScale={0.85}
                haptic={false}
                style={styles.eye}
                accessibilityLabel={masked ? 'Show balances' : 'Hide balances'}
              >
                <Ionicons
                  name={masked ? 'eye-off-outline' : 'eye-outline'}
                  size={15}
                  color={theme.colors.textTertiary}
                />
              </PressableScale>
            </View>
            <View
              style={[
                styles.deltaPill,
                {
                  backgroundColor: positive ? theme.colors.positiveSoft : theme.colors.negativeSoft,
                },
              ]}
            >
              <Ionicons
                name={positive ? 'arrow-down' : 'arrow-up'}
                size={11}
                color={positive ? theme.colors.positive : theme.colors.negative}
              />
              <Text
                variant="caption"
                style={{ color: positive ? theme.colors.positive : theme.colors.negative }}
              >
                {formatPercent(Math.abs(change), 1)} spend
              </Text>
            </View>
          </View>

          <MoneyDisplay
            amount={total}
            currency={currency}
            size="hero"
            masked={masked}
            style={styles.amount}
          />

          <Animated.View entering={FadeIn.delay(380)} style={styles.sparkRow}>
            <Sparkline values={trend} width={104} height={26} color={theme.colors.accent} />
            <Text variant="caption" tone="tertiary">
              last 6 months
            </Text>
          </Animated.View>

          <View style={[styles.divider, { backgroundColor: theme.colors.hairline }]} />

          <View style={styles.split}>
            <View style={styles.splitItem}>
              <View style={styles.splitLabel}>
                <View style={[styles.dot, { backgroundColor: theme.colors.positive }]} />
                <Text variant="micro" tone="tertiary">
                  In
                </Text>
              </View>
              <MoneyDisplay
                amount={income}
                currency={currency}
                size="summary"
                masked={masked}
                showSymbol={false}
              />
            </View>
            <View style={[styles.vRule, { backgroundColor: theme.colors.hairline }]} />
            <View style={styles.splitItem}>
              <View style={styles.splitLabel}>
                <View style={[styles.dot, { backgroundColor: theme.colors.negative }]} />
                <Text variant="micro" tone="tertiary">
                  Out
                </Text>
              </View>
              <MoneyDisplay
                amount={expense}
                currency={currency}
                size="summary"
                masked={masked}
                showSymbol={false}
              />
            </View>
            <IconButton
              name="arrow-forward"
              diameter={34}
              size={15}
              onPress={onPress}
              accessibilityLabel="View accounts"
              background={theme.colors.surfaceSunken}
              style={{ alignSelf: 'center' }}
            />
          </View>
        </View>
      </View>
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  shell: {
    borderRadius: radius.xxl,
    borderWidth: StyleSheet.hairlineWidth * 2,
    overflow: 'hidden',
  },
  glow: { top: -130, right: -90 },
  content: { padding: spacing.xxl, gap: spacing.md },
  topRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  labelRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm - 2 },
  eye: { padding: 2 },
  deltaPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: radius.pill,
  },
  amount: { marginTop: spacing.xs },
  sparkRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  divider: { height: StyleSheet.hairlineWidth, marginVertical: spacing.sm },
  split: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  splitItem: { flex: 1, gap: 5 },
  splitLabel: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  dot: { width: 5, height: 5, borderRadius: 3 },
  vRule: { width: StyleSheet.hairlineWidth, height: 32 },
});
