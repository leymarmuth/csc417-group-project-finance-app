import { StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  interpolate,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { CategoryIcon } from '../../../components/finance/CategoryIcon';
import { Text } from '../../../components/ui/Text';
import { PressableScale } from '../../../components/ui/PressableScale';
import { formatMoney } from '../../../lib/format';
import { formatDateLabel } from '../../../lib/date';
import { haptics } from '../../../lib/haptics';
import { motion, radius, spacing, useTheme } from '../../../theme';
import type { Category, CurrencyCode, Transaction } from '../../../types/models';

const ACTION_WIDTH = 92;

export interface TransactionRowProps {
  transaction: Transaction;
  category?: Category;
  currency: CurrencyCode;
  accountName?: string;
  onPress?: () => void;
  onDelete?: () => void;
  showDate?: boolean;
  /** Disable the swipe affordance (e.g. in a compact preview list). */
  swipeable?: boolean;
}

/**
 * Swipe-to-delete transaction row.
 * The gesture is horizontal-only and the row settles open or shut on release;
 * a fast, long swipe commits the delete with a confirmation haptic.
 */
export function TransactionRow({
  transaction,
  category,
  currency,
  accountName,
  onPress,
  onDelete,
  showDate = true,
  swipeable = true,
}: TransactionRowProps) {
  const theme = useTheme();
  const translateX = useSharedValue(0);
  const startX = useSharedValue(0);

  const isIncome = transaction.kind === 'income';
  const signedAmount = isIncome ? transaction.amount : -transaction.amount;
  const amountLabel = formatMoney(signedAmount, { currency, signed: true });
  const tint = isIncome ? theme.colors.positive : theme.colors.text;

  const commitDelete = () => {
    haptics.warning();
    onDelete?.();
  };

  const pan = Gesture.Pan()
    .enabled(swipeable && Boolean(onDelete))
    .activeOffsetX([-14, 14])
    .failOffsetY([-10, 10])
    .onBegin(() => {
      startX.value = translateX.value;
    })
    .onUpdate((event) => {
      const next = startX.value + event.translationX;
      translateX.value = Math.min(0, Math.max(next, -ACTION_WIDTH - 40));
    })
    .onEnd((event) => {
      if (translateX.value < -ACTION_WIDTH - 20 || event.velocityX < -900) {
        translateX.value = withTiming(-ACTION_WIDTH, { duration: 140 });
        runOnJS(commitDelete)();
        translateX.value = withTiming(0, { duration: 260 });
      } else if (translateX.value < -ACTION_WIDTH / 2) {
        translateX.value = withSpring(-ACTION_WIDTH, motion.spring.snappy);
      } else {
        translateX.value = withSpring(0, motion.spring.snappy);
      }
    });

  const rowStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  const actionStyle = useAnimatedStyle(() => ({
    opacity: interpolate(translateX.value, [-ACTION_WIDTH, -20, 0], [1, 0.4, 0], 'clamp'),
    transform: [{ scale: interpolate(translateX.value, [-ACTION_WIDTH, 0], [1, 0.86], 'clamp') }],
  }));

  return (
    <View style={styles.container}>
      <Animated.View style={[styles.actionLayer, actionStyle]}>
        <View
          style={[
            styles.deleteButton,
            {
              backgroundColor: theme.colors.negativeSoft,
              borderColor: theme.colors.negative + '44',
            },
          ]}
        >
          <Ionicons name="trash-outline" size={19} color={theme.colors.negative} />
        </View>
      </Animated.View>

      <GestureDetector gesture={pan}>
        <Animated.View style={rowStyle}>
          <PressableScale onPress={onPress} haptic={false} activeScale={0.985}>
            <View
              style={[
                styles.row,
                {
                  backgroundColor: theme.colors.background,
                  borderBottomColor: theme.colors.hairline,
                },
              ]}
            >
              <CategoryIcon
                icon={category?.icon ?? 'ellipse-outline'}
                color={category?.color ?? theme.colors.textTertiary}
              />
              <View style={styles.labels}>
                <Text variant="label" numberOfLines={1}>
                  {transaction.merchant || category?.name || 'Transaction'}
                </Text>
                <Text variant="caption" tone="tertiary" numberOfLines={1}>
                  {[
                    category?.name,
                    accountName,
                    showDate ? formatDateLabel(transaction.date) : null,
                  ]
                    .filter(Boolean)
                    .join(' · ')}
                </Text>
              </View>
              <View style={styles.amountColumn}>
                <Text variant="bodyStrong" tabular style={{ color: tint }}>
                  {amountLabel}
                </Text>
                {transaction.note ? (
                  <Text
                    variant="caption"
                    tone="tertiary"
                    numberOfLines={1}
                    style={{ maxWidth: 110 }}
                  >
                    {transaction.note}
                  </Text>
                ) : null}
              </View>
            </View>
          </PressableScale>
        </Animated.View>
      </GestureDetector>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { position: 'relative', justifyContent: 'center' },
  actionLayer: {
    position: 'absolute',
    right: 0,
    top: 0,
    bottom: 0,
    width: ACTION_WIDTH,
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  deleteButton: {
    width: ACTION_WIDTH - 12,
    height: 44,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: StyleSheet.hairlineWidth * 2,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  labels: { flex: 1, gap: 3 },
  amountColumn: { alignItems: 'flex-end', gap: 2 },
});
