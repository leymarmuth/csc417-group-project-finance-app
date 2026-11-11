import { useEffect, useState } from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import {
  Easing,
  runOnJS,
  useAnimatedReaction,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { Text } from '../ui/Text';
import { splitMoney } from '../../lib/format';
import { fonts, useTheme } from '../../theme';
import type { CurrencyCode } from '../../types/models';

export type MoneySize = 'hero' | 'display' | 'summary' | 'inline';

const sizes: Record<MoneySize, { whole: number; cents: number; symbol: number; gap: number }> = {
  hero: { whole: 46, cents: 21, symbol: 22, gap: 1 },
  display: { whole: 33, cents: 16, symbol: 17, gap: 1 },
  summary: { whole: 23, cents: 12, symbol: 13, gap: 1 },
  inline: { whole: 16, cents: 11, symbol: 11, gap: 0 },
};

export interface MoneyDisplayProps {
  /** Amount in minor units. */
  amount: number;
  currency?: CurrencyCode;
  size?: MoneySize;
  color?: string;
  style?: StyleProp<ViewStyle>;
  animate?: boolean;
  showSymbol?: boolean;
  /** Force a leading + or −. */
  signed?: boolean;
  masked?: boolean;
}

/**
 * Money as typography: symbol and decimals set small, whole units large.
 * Values interpolate, so a balance change reads like a dial turning rather
 * than a string being replaced.
 */
export function MoneyDisplay({
  amount,
  currency = 'KES',
  size = 'display',
  color,
  style,
  animate = true,
  showSymbol = true,
  signed = false,
  masked = false,
}: MoneyDisplayProps) {
  const theme = useTheme();
  const metrics = sizes[size];
  const [parts, setParts] = useState(() => splitMoney(animate ? 0 : amount, currency));
  const shared = useSharedValue(animate ? 0 : amount);

  useEffect(() => {
    if (animate) {
      shared.value = withTiming(amount, { duration: 900, easing: Easing.out(Easing.cubic) });
    } else {
      shared.value = amount;
      setParts(splitMoney(amount, currency));
    }
  }, [amount, animate, currency, shared]);

  useAnimatedReaction(
    () => shared.value,
    (current) => {
      runOnJS(setParts)(splitMoney(Math.round(current), currency));
    },
    [currency],
  );

  const tint = color ?? theme.colors.text;
  const signPrefix = signed ? (parts.negative ? '−' : '+') : parts.negative ? '−' : '';

  if (masked) {
    return (
      <View style={[styles.row, style]}>
        <Text style={{ fontFamily: fonts.bold, fontSize: metrics.whole, color: tint }}>
          ••• •••
        </Text>
      </View>
    );
  }

  return (
    <View style={[styles.row, { columnGap: metrics.gap }, style]}>
      <Text
        style={{
          fontFamily: fonts.semibold,
          fontSize: metrics.symbol,
          color: tint,
          opacity: 0.66,
          marginBottom: metrics.whole * 0.16,
        }}
      >
        {signPrefix}
        {showSymbol ? parts.symbol : ''}
      </Text>
      <Text
        tabular
        style={{
          fontFamily: fonts.bold,
          fontSize: metrics.whole,
          lineHeight: metrics.whole * 1.06,
          letterSpacing: -metrics.whole * 0.035,
          color: tint,
        }}
      >
        {parts.whole}
      </Text>
      <Text
        tabular
        style={{
          fontFamily: fonts.semibold,
          fontSize: metrics.cents,
          color: tint,
          opacity: 0.5,
          marginBottom: metrics.whole * 0.1,
        }}
      >
        .{parts.cents}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'flex-end' },
});
