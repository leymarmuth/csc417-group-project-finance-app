import { useMemo, useState } from 'react';
import { SectionList, StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeIn } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Input } from '../../components/ui/Input';
import { IconButton } from '../../components/ui/IconButton';
import { Text } from '../../components/ui/Text';
import { Badge } from '../../components/ui/Badge';
import { EmptyState } from '../../components/ui/EmptyState';
import { Fab } from '../../components/ui/Fab';
import { TransactionRow } from './components/TransactionRow';
import { FilterSheet } from './components/FilterSheet';
import { useLedgerStore } from '../../store/useLedgerStore';
import { useSettingsStore } from '../../store/useSettingsStore';
import { toast } from '../../store/useToastStore';
import {
  activeFilterCount,
  emptyFilters,
  filterTransactions,
  indexById,
  sortTransactionsDesc,
  type TransactionFilters,
} from '../../store/selectors';
import { formatDateLabel } from '../../lib/date';
import { formatMoney } from '../../lib/format';
import { useDebouncedValue } from '../../lib/utils';
import { radius, spacing, useTheme } from '../../theme';
import type { TabScreenProps } from '../../navigation/types';
import type { Transaction } from '../../types/models';

interface Section {
  title: string;
  total: number;
  data: Transaction[];
}

export function TransactionsScreen({ navigation }: TabScreenProps<'Activity'>) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();

  const transactions = useLedgerStore((state) => state.transactions);
  const categories = useLedgerStore((state) => state.categories);
  const accounts = useLedgerStore((state) => state.accounts);
  const deleteTransaction = useLedgerStore((state) => state.deleteTransaction);
  const restoreTransaction = useLedgerStore((state) => state.restoreTransaction);
  const currency = useSettingsStore((state) => state.currency);

  const [query, setQuery] = useState('');
  const debouncedQuery = useDebouncedValue(query, 180);
  const [filters, setFilters] = useState<TransactionFilters>(() => ({
    ...emptyFilters,
    month: 'all',
  }));
  const [filterOpen, setFilterOpen] = useState(false);

  const categoryById = useMemo(() => indexById(categories), [categories]);
  const accountById = useMemo(() => indexById(accounts), [accounts]);

  const effectiveFilters = useMemo(
    () => ({ ...filters, query: debouncedQuery }),
    [debouncedQuery, filters],
  );

  const results = useMemo(
    () => filterTransactions(transactions, categories, effectiveFilters),
    [categories, effectiveFilters, transactions],
  );

  const totals = useMemo(() => {
    let income = 0;
    let expense = 0;
    for (const tx of results) {
      if (tx.kind === 'income') income += tx.amount;
      else expense += tx.amount;
    }
    return { income, expense };
  }, [results]);

  const sections = useMemo<Section[]>(() => {
    const grouped = new Map<string, Transaction[]>();
    for (const tx of sortTransactionsDesc(results)) {
      const label = formatDateLabel(tx.date);
      const list = grouped.get(label) ?? [];
      list.push(tx);
      grouped.set(label, list);
    }
    return Array.from(grouped.entries()).map(([title, data]) => ({
      title,
      total: data.reduce((acc, tx) => acc + (tx.kind === 'income' ? tx.amount : -tx.amount), 0),
      data,
    }));
  }, [results]);

  const filterCount = activeFilterCount(filters);

  const handleDelete = async (id: string) => {
    const removed = await deleteTransaction(id);
    toast.show('Transaction deleted', {
      description: removed.merchant,
      action: { label: 'Undo', onPress: () => void restoreTransaction(removed) },
    });
  };

  return (
    <View style={[styles.root, { backgroundColor: theme.colors.background }]}>
      <LinearGradient
        colors={theme.gradients.ambient as unknown as [string, string, ...string[]]}
        style={StyleSheet.absoluteFill}
      />
      <SectionList
        sections={sections}
        keyExtractor={(item) => item.id}
        stickySectionHeadersEnabled={false}
        contentContainerStyle={{
          paddingBottom: insets.bottom + 150,
          paddingHorizontal: spacing.xl,
        }}
        ListHeaderComponent={
          <View style={{ paddingTop: insets.top + spacing.md }}>
            <View style={styles.titleRow}>
              <View style={{ flex: 1 }}>
                <Text variant="title">Activity</Text>
                <Text variant="caption" tone="tertiary" style={{ marginTop: 2 }}>
                  {results.length} {results.length === 1 ? 'entry' : 'entries'} ·{' '}
                  {formatMoney(totals.income - totals.expense, { currency, signed: true })} net
                </Text>
              </View>
              <View>
                <IconButton
                  name="options-outline"
                  onPress={() => setFilterOpen(true)}
                  accessibilityLabel="Filters"
                />
                {filterCount > 0 ? (
                  <View style={{ position: 'absolute', top: -5, right: -5 }}>
                    <Badge label={`${filterCount}`} tone="accent" />
                  </View>
                ) : null}
              </View>
            </View>

            <View style={{ marginTop: spacing.lg }}>
              <Input
                icon="search-outline"
                placeholder="Search merchant, note or category"
                value={query}
                onChangeText={setQuery}
                returnKeyType="search"
                autoCorrect={false}
                trailing={
                  query ? (
                    <IconButton
                      name="close-circle"
                      size={16}
                      diameter={26}
                      bordered={false}
                      background="transparent"
                      onPress={() => setQuery('')}
                      accessibilityLabel="Clear search"
                    />
                  ) : null
                }
              />
            </View>

            <Animated.View entering={FadeIn.duration(320)} style={styles.summaryRow}>
              <SummaryPill
                label="In"
                value={formatMoney(totals.income, { currency, compactCents: true })}
                tone={theme.colors.positive}
              />
              <SummaryPill
                label="Out"
                value={formatMoney(totals.expense, { currency, compactCents: true })}
                tone={theme.colors.negative}
              />
              <SummaryPill
                label="Net"
                value={formatMoney(totals.income - totals.expense, {
                  currency,
                  compactCents: true,
                  signed: true,
                })}
                tone={theme.colors.text}
              />
            </Animated.View>
          </View>
        }
        renderSectionHeader={({ section }) => (
          <View style={styles.sectionHeader}>
            <Text variant="micro" tone="tertiary">
              {section.title}
            </Text>
            <Text variant="caption" tone="tertiary" tabular>
              {formatMoney(section.total, { currency, signed: true })}
            </Text>
          </View>
        )}
        renderItem={({ item }) => (
          <TransactionRow
            transaction={item}
            category={categoryById[item.categoryId]}
            accountName={accountById[item.accountId]?.name}
            currency={currency}
            showDate={false}
            onPress={() => navigation.navigate('TransactionEditor', { id: item.id })}
            onDelete={() => void handleDelete(item.id)}
          />
        )}
        ListEmptyComponent={
          <EmptyState
            icon="receipt-outline"
            title="No matching entries"
            description="Try loosening your filters, or record something new."
            actionLabel="New transaction"
            onAction={() => navigation.navigate('TransactionEditor')}
          />
        }
      />

      <Fab onPress={() => navigation.navigate('TransactionEditor')} extended label="New" />

      <FilterSheet
        visible={filterOpen}
        filters={filters}
        categories={categories}
        accounts={accounts}
        onClose={() => setFilterOpen(false)}
        onApply={setFilters}
      />
    </View>
  );
}

function SummaryPill({ label, value, tone }: { label: string; value: string; tone: string }) {
  const theme = useTheme();
  return (
    <View
      style={[
        styles.pill,
        { backgroundColor: theme.colors.surface, borderColor: theme.colors.hairline },
      ]}
    >
      <Text variant="micro" tone="tertiary">
        {label}
      </Text>
      <Text variant="label" tabular style={{ color: tone }}>
        {value}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  summaryRow: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.lg },
  pill: {
    flex: 1,
    gap: 3,
    padding: spacing.md,
    borderRadius: radius.md,
    borderWidth: StyleSheet.hairlineWidth * 2,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing.xl,
    marginBottom: spacing.xs,
  },
});
