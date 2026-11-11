import { useEffect, useState } from 'react';
import { ScrollView, View } from 'react-native';
import { Button } from '../../../components/ui/Button';
import { Chip } from '../../../components/ui/Chip';
import { Input } from '../../../components/ui/Input';
import { Sheet } from '../../../components/ui/Sheet';
import { Text } from '../../../components/ui/Text';
import { MoneyDisplay } from '../../../components/finance/MoneyDisplay';
import { formatMoney, parseAmount } from '../../../lib/format';
import { haptics } from '../../../lib/haptics';
import { spacing } from '../../../theme';
import type { CurrencyCode, Goal } from '../../../types/models';
import { goalProgress } from '../../../store/selectors';

export function ContributeSheet({
  visible,
  goal,
  currency,
  onClose,
  onContribute,
}: {
  visible: boolean;
  goal: Goal | null;
  currency: CurrencyCode;
  onClose: () => void;
  onContribute: (amount: number) => Promise<void>;
}) {
  const [amount, setAmount] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (visible) setAmount('');
  }, [visible]);

  if (!goal) return null;

  const remaining = Math.max(goal.target - goal.saved, 0);
  const quicks = [5000, 10000, 25000, remaining].filter(
    (value, index, arr) => value > 0 && arr.indexOf(value) === index,
  );

  return (
    <Sheet
      visible={visible}
      onClose={onClose}
      title="Add funds"
      description={goal.name}
      footer={
        <Button
          label="Add to goal"
          loading={busy}
          disabled={!amount}
          onPress={async () => {
            const minor = parseAmount(amount);
            if (minor === null) return;
            setBusy(true);
            try {
              await onContribute(minor);
              haptics.success();
              onClose();
            } finally {
              setBusy(false);
            }
          }}
        />
      }
    >
      <View style={{ gap: spacing.xl }}>
        <View style={{ alignItems: 'center', gap: spacing.xs }}>
          <MoneyDisplay amount={goal.saved} currency={currency} size="display" />
          <Text variant="caption" tone="tertiary">
            of {formatMoney(goal.target, { currency })} · {Math.round(goalProgress(goal) * 100)}%
          </Text>
        </View>

        <Input
          label="Amount"
          placeholder="0.00"
          icon="add-circle-outline"
          keyboardType="decimal-pad"
          value={amount}
          onChangeText={setAmount}
        />

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ gap: spacing.sm }}
        >
          {quicks.map((value) => (
            <Chip
              key={value}
              label={
                value === remaining
                  ? `Finish · ${formatMoney(value, { currency, compactCents: true })}`
                  : formatMoney(value, { currency, compactCents: true })
              }
              selected={parseAmount(amount) === value}
              onPress={() => setAmount((value / 100).toFixed(value % 100 === 0 ? 0 : 2))}
            />
          ))}
        </ScrollView>
      </View>
    </Sheet>
  );
}
