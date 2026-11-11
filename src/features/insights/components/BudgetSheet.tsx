import { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { Button } from '../../../components/ui/Button';
import { Chip } from '../../../components/ui/Chip';
import { Input } from '../../../components/ui/Input';
import { Sheet } from '../../../components/ui/Sheet';
import { Text } from '../../../components/ui/Text';
import { CategoryIcon } from '../../../components/finance/CategoryIcon';
import { formatMoney, parseAmount } from '../../../lib/format';
import { haptics } from '../../../lib/haptics';
import { radius, spacing, useTheme } from '../../../theme';
import type { Budget, Category, CurrencyCode } from '../../../types/models';
import type { BudgetProgress } from '../../../store/selectors';

export interface BudgetSheetProps {
  visible: boolean;
  monthLabel: string;
  currency: CurrencyCode;
  categories: Category[];
  existing?: BudgetProgress | null;
  onClose: () => void;
  onSave: (input: { categoryId: string; limit: number }) => Promise<void>;
  onDelete?: () => void;
}

/** Create / edit a monthly category budget. */
export function BudgetSheet({
  visible,
  monthLabel,
  currency,
  categories,
  existing,
  onClose,
  onSave,
  onDelete,
}: BudgetSheetProps) {
  const theme = useTheme();
  const [categoryId, setCategoryId] = useState('');
  const [limit, setLimit] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!visible) return;
    setCategoryId(existing?.category.id ?? '');
    setLimit(existing ? (existing.budget.limit / 100).toFixed(0) : '');
    setError(null);
  }, [existing, visible]);

  const expenseCategories = categories.filter((category) => category.kind === 'expense');

  const submit = async () => {
    const minor = parseAmount(limit);
    if (!categoryId) {
      setError('Choose a category first.');
      return;
    }
    if (minor === null || minor <= 0) {
      setError('Enter a limit above zero.');
      haptics.warning();
      return;
    }
    setSaving(true);
    try {
      await onSave({ categoryId, limit: minor });
      haptics.success();
      onClose();
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'Could not save budget.');
      haptics.error();
    } finally {
      setSaving(false);
    }
  };

  return (
    <Sheet
      visible={visible}
      onClose={onClose}
      title={existing ? 'Edit budget' : 'New budget'}
      description={`Applies to ${monthLabel}.`}
      footer={
        <View style={{ gap: spacing.sm }}>
          <Button
            label={existing ? 'Save budget' : 'Create budget'}
            onPress={() => void submit()}
            loading={saving}
          />
          {existing && onDelete ? (
            <Button label="Remove budget" variant="danger" onPress={onDelete} />
          ) : null}
        </View>
      }
    >
      <View style={{ gap: spacing.xl }}>
        <Input
          label="Monthly limit"
          placeholder="0"
          icon="cash-outline"
          keyboardType="decimal-pad"
          value={limit}
          onChangeText={setLimit}
          error={error ?? undefined}
          hint={
            existing
              ? `Currently spending ${formatMoney(existing.spent, { currency })}`
              : 'You can change this any time.'
          }
        />

        <View style={{ gap: spacing.md }}>
          <Text variant="micro" tone="tertiary">
            Category
          </Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ gap: spacing.sm }}
          >
            {expenseCategories.map((category) => {
              const selected = category.id === categoryId;
              return (
                <Chip
                  key={category.id}
                  label={category.name}
                  color={category.color}
                  selected={selected}
                  icon={category.icon as never}
                  onPress={() => setCategoryId(category.id)}
                />
              );
            })}
          </ScrollView>
        </View>

        {categoryId ? (
          <View
            style={[
              styles.preview,
              { backgroundColor: theme.colors.surfaceSunken, borderColor: theme.colors.hairline },
            ]}
          >
            <CategoryIcon
              icon={expenseCategories.find((c) => c.id === categoryId)?.icon ?? 'pricetag-outline'}
              color={
                expenseCategories.find((c) => c.id === categoryId)?.color ?? theme.colors.accent
              }
            />
            <Text variant="caption" tone="secondary" style={{ flex: 1 }}>
              {expenseCategories.find((c) => c.id === categoryId)?.name} ·{' '}
              {formatMoney(parseAmount(limit) ?? 0, { currency })} per month
            </Text>
          </View>
        ) : null}
      </View>
    </Sheet>
  );
}

const styles = StyleSheet.create({
  preview: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.md,
    borderRadius: radius.md,
    borderWidth: StyleSheet.hairlineWidth * 2,
  },
});

export type { Budget };
