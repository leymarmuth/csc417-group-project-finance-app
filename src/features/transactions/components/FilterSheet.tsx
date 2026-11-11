import { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { Sheet } from '../../../components/ui/Sheet';
import { Button } from '../../../components/ui/Button';
import { Chip } from '../../../components/ui/Chip';
import { SegmentedControl } from '../../../components/ui/SegmentedControl';
import { Text } from '../../../components/ui/Text';
import { monthKey, shortMonth, addMonths } from '../../../lib/date';
import { haptics } from '../../../lib/haptics';
import { radius, spacing, useTheme } from '../../../theme';
import type { TransactionFilters } from '../../../store/selectors';
import type { Account, Category } from '../../../types/models';

export function FilterSheet({
  visible,
  filters,
  categories,
  accounts,
  onClose,
  onApply,
}: {
  visible: boolean;
  filters: TransactionFilters;
  categories: Category[];
  accounts: Account[];
  onClose: () => void;
  onApply: (next: TransactionFilters) => void;
}) {
  const theme = useTheme();
  const [draft, setDraft] = useState(filters);

  useEffect(() => {
    if (visible) setDraft(filters);
  }, [filters, visible]);

  const months = Array.from({ length: 4 }, (_, index) => addMonths(new Date(), -index));

  const toggleIn = (list: string[], id: string) =>
    list.includes(id) ? list.filter((item) => item !== id) : [...list, id];

  return (
    <Sheet
      visible={visible}
      onClose={onClose}
      title="Filters"
      description="Narrow the ledger to exactly what you need."
      footer={
        <View style={{ gap: spacing.md }}>
          <Button
            label="Apply filters"
            onPress={() => {
              haptics.success();
              onApply(draft);
              onClose();
            }}
          />
          <Button
            label="Reset"
            variant="ghost"
            onPress={() =>
              setDraft({
                ...filters,
                query: draft.query,
                kind: 'all',
                categoryIds: [],
                accountIds: [],
                month: monthKey(new Date()),
              })
            }
          />
        </View>
      }
    >
      <View style={{ gap: spacing.xxl }}>
        <View style={{ gap: spacing.md }}>
          <Text variant="micro" tone="tertiary">
            Direction
          </Text>
          <SegmentedControl
            value={draft.kind}
            onChange={(kind) => setDraft((prev) => ({ ...prev, kind }))}
            options={[
              { value: 'all', label: 'All' },
              { value: 'expense', label: 'Expenses' },
              { value: 'income', label: 'Income' },
            ]}
          />
        </View>

        <View style={{ gap: spacing.md }}>
          <Text variant="micro" tone="tertiary">
            Period
          </Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ gap: spacing.sm }}
          >
            <Chip
              label="All time"
              selected={draft.month === 'all'}
              onPress={() => setDraft((prev) => ({ ...prev, month: 'all' }))}
            />
            {months.map((date) => {
              const key = monthKey(date);
              return (
                <Chip
                  key={key}
                  label={
                    key === monthKey(new Date())
                      ? 'This month'
                      : `${shortMonth(key)} ${key.slice(0, 4)}`
                  }
                  selected={draft.month === key}
                  onPress={() => setDraft((prev) => ({ ...prev, month: key }))}
                />
              );
            })}
          </ScrollView>
        </View>

        <View style={{ gap: spacing.md }}>
          <Text variant="micro" tone="tertiary">
            Categories
          </Text>
          <View style={styles.wrap}>
            {categories.map((category) => (
              <Chip
                key={category.id}
                label={category.name}
                icon={category.icon as never}
                color={category.color}
                size="sm"
                selected={draft.categoryIds.includes(category.id)}
                onPress={() =>
                  setDraft((prev) => ({
                    ...prev,
                    categoryIds: toggleIn(prev.categoryIds, category.id),
                  }))
                }
              />
            ))}
          </View>
        </View>

        <View style={{ gap: spacing.md }}>
          <Text variant="micro" tone="tertiary">
            Accounts
          </Text>
          <View style={styles.wrap}>
            {accounts.map((account) => (
              <Chip
                key={account.id}
                label={account.name}
                size="sm"
                color={account.color}
                selected={draft.accountIds.includes(account.id)}
                onPress={() =>
                  setDraft((prev) => ({
                    ...prev,
                    accountIds: toggleIn(prev.accountIds, account.id),
                  }))
                }
              />
            ))}
          </View>
        </View>

        <View
          style={[
            styles.hint,
            { backgroundColor: theme.colors.surfaceSunken, borderColor: theme.colors.hairline },
          ]}
        >
          <Text variant="caption" tone="tertiary">
            Filters combine — a search term, direction, period, categories and accounts are all
            applied together. Swipe a row left to delete it.
          </Text>
        </View>
      </View>
    </Sheet>
  );
}

const styles = StyleSheet.create({
  wrap: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  hint: {
    padding: spacing.lg,
    borderRadius: radius.md,
    borderWidth: StyleSheet.hairlineWidth * 2,
  },
});
