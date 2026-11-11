import { useMemo, useState } from 'react';
import { StyleSheet, View, useWindowDimensions } from 'react-native';
import Animated, { FadeInDown, Layout } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BarChart, DonutChart } from '../../components/charts';
import { MonthSwitcher } from '../../components/finance/MonthSwitcher';
import { CategoryIcon } from '../../components/finance/CategoryIcon';
import { Card } from '../../components/ui/Card';
import { IconButton } from '../../components/ui/IconButton';
import { PressableScale } from '../../components/ui/PressableScale';
import { ProgressRing } from '../../components/ui/ProgressRing';
import { Screen } from '../../components/ui/Screen';
import { SectionHeader } from '../../components/ui/SectionHeader';
import { SegmentedControl } from '../../components/ui/SegmentedControl';
import { Text } from '../../components/ui/Text';
import { BudgetSheet } from './components/BudgetSheet';
import { useLedgerStore } from '../../store/useLedgerStore';
import { useSettingsStore } from '../../store/useSettingsStore';
import { toast } from '../../store/useToastStore';
import {
  budgetProgress,
  monthTotals,
  monthlySeries,
  spendByCategory,
  percentChange,
  transactionsInMonth,
  type BudgetProgress,
} from '../../store/selectors';
import { daysInMonth, monthKey, monthLabel } from '../../lib/date';
import { formatMoney, formatPercent } from '../../lib/format';
import { spacing, radius, useTheme } from '../../theme';
import type { TabScreenProps } from '../../navigation/types';

export function InsightsScreen({ navigation }: TabScreenProps<'Insights'>) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const [month, setMonth] = useState(() => monthKey(new Date()));
  const [mode, setMode] = useState<'donut' | 'bars'>('donut');
  const [sheetOpen, setSheetOpen] = useState(false);
  const [editing, setEditing] = useState<BudgetProgress | null>(null);

  const transactions = useLedgerStore((state) => state.transactions);
  const categories = useLedgerStore((state) => state.categories);
  const budgets = useLedgerStore((state) => state.budgets);
  const setBudget = useLedgerStore((state) => state.setBudget);
  const deleteBudget = useLedgerStore((state) => state.deleteBudget);
  const currency = useSettingsStore((state) => state.currency);

  const totals = useMemo(() => monthTotals(transactions, month), [month, transactions]);
  const spend = useMemo(
    () => spendByCategory(transactions, categories, month),
    [categories, month, transactions],
  );
  const series = useMemo(() => monthlySeries(transactions, 6), [transactions]);
  const rows = useMemo(
    () => budgetProgress({ budgets, categories, transactions }, month),
    [budgets, categories, month, transactions],
  );

  const [year, monthNumber] = month.split('-').map(Number);
  const previousTotals = useMemo(
    () => monthTotals(transactions, monthKey(new Date(year, (monthNumber ?? 1) - 2, 1))),
    [monthNumber, transactions, year],
  );

  const monthTransactions = useMemo(
    () => transactionsInMonth(transactions, month),
    [month, transactions],
  );
  const largest = useMemo(
    () =>
      monthTransactions
        .filter((tx) => tx.kind === 'expense')
        .sort((a, b) => b.amount - a.amount)[0],
    [monthTransactions],
  );
  const activeDays = Math.max(new Date().getDate(), 1);
  const avgDaily = totals.expense / activeDays;
  const projected = avgDaily * daysInMonth(month);
  const change = percentChange(totals.expense, previousTotals.expense);

  const topSegments = spend.slice(0, 5);
  const otherTotal = spend.slice(5).reduce((acc, row) => acc + row.total, 0);
  const segments = [
    ...topSegments.map((row) => ({
      id: row.category.id,
      value: row.total,
      color: row.category.color,
    })),
    ...(otherTotal > 0
      ? [{ id: 'other', value: otherTotal, color: theme.colors.textTertiary }]
      : []),
  ];

  const chartWidth = width - spacing.xl * 2 - spacing.lg * 2;
  const openNew = () => {
    setEditing(null);
    setSheetOpen(true);
  };

  return (
    <View style={{ flex: 1 }}>
      <Screen scroll contentContainerStyle={{ paddingBottom: 150 }} bottomInset={insets.bottom}>
        <View style={[styles.header, { paddingTop: insets.top + spacing.md }]}>
          <View style={{ flex: 1 }}>
            <Text variant="title">Insights</Text>
            <Text variant="caption" tone="tertiary" style={{ marginTop: 2 }}>
              Where your money actually goes
            </Text>
          </View>
          <MonthSwitcher month={month} onChange={setMonth} compact />
        </View>

        <View style={styles.section}>
          <Card>
            <SegmentedControl
              value={mode}
              onChange={setMode}
              size="sm"
              options={[
                { value: 'donut', label: 'Breakdown' },
                { value: 'bars', label: 'Trend' },
              ]}
            />

            {mode === 'donut' ? (
              <View style={styles.donutWrap}>
                {segments.length ? (
                  <DonutChart
                    segments={segments}
                    size={196}
                    strokeWidth={18}
                    centreLabel={formatMoney(totals.expense, { currency, compactCents: true })}
                    centreCaption="spent"
                  />
                ) : (
                  <View style={styles.donutEmpty}>
                    <Text variant="body" tone="secondary" align="center">
                      No spending recorded in {monthLabel(month)}.
                    </Text>
                  </View>
                )}
              </View>
            ) : (
              <View style={{ marginTop: spacing.xl }}>
                <BarChart
                  groups={series.map((point) => ({
                    label: point.label,
                    primary: point.income,
                    secondary: point.expense,
                  }))}
                  width={chartWidth}
                  height={150}
                  primaryColor={theme.colors.positive}
                  secondaryColor={theme.colors.accent}
                />
                <View style={styles.legend}>
                  <Legend color={theme.colors.positive} label="Income" />
                  <Legend color={theme.colors.accent} label="Spend" />
                </View>
              </View>
            )}

            <View style={[styles.splitRow, { borderTopColor: theme.colors.hairline }]}>
              <View style={styles.splitCell}>
                <Text variant="micro" tone="tertiary">
                  Daily avg
                </Text>
                <Text variant="label" tabular numberOfLines={1}>
                  {formatMoney(Math.round(avgDaily), { currency, compactCents: true })}
                </Text>
              </View>
              <View style={[styles.vRule, { backgroundColor: theme.colors.hairline }]} />
              <View style={styles.splitCell}>
                <Text variant="micro" tone="tertiary">
                  Projected
                </Text>
                <Text variant="label" tabular numberOfLines={1}>
                  {formatMoney(Math.round(projected), { currency, compactCents: true })}
                </Text>
              </View>
              <View style={[styles.vRule, { backgroundColor: theme.colors.hairline }]} />
              <View style={styles.splitCell}>
                <Text variant="micro" tone="tertiary">
                  vs last
                </Text>
                <Text
                  variant="label"
                  tabular
                  style={{ color: change >= 0 ? theme.colors.negative : theme.colors.positive }}
                >
                  {formatPercent(Math.abs(change), 1)}
                </Text>
              </View>
            </View>
          </Card>
        </View>

        <Animated.View
          entering={FadeInDown.delay(90).springify().damping(20)}
          style={styles.section}
        >
          <SectionHeader title="By category" />
          <Card padded={false} style={{ paddingHorizontal: spacing.lg }}>
            {spend.length === 0 ? (
              <View style={{ padding: spacing.xl }}>
                <Text variant="body" tone="secondary" align="center">
                  Nothing to break down yet.
                </Text>
              </View>
            ) : (
              spend.slice(0, 6).map((row, index) => {
                const share = totals.expense ? row.total / totals.expense : 0;
                return (
                  <Animated.View
                    key={row.category.id}
                    layout={Layout.springify().damping(22)}
                    style={[
                      styles.categoryRow,
                      index > 0
                        ? {
                            borderTopWidth: StyleSheet.hairlineWidth,
                            borderTopColor: theme.colors.hairline,
                          }
                        : null,
                    ]}
                  >
                    <CategoryIcon icon={row.category.icon} color={row.category.color} size={38} />
                    <View style={{ flex: 1, gap: 5 }}>
                      <View style={styles.categoryTop}>
                        <Text variant="label">{row.category.name}</Text>
                        <Text variant="label" tabular>
                          {formatMoney(row.total, { currency })}
                        </Text>
                      </View>
                      <View style={[styles.track, { backgroundColor: theme.colors.surfaceSunken }]}>
                        <View
                          style={{
                            width: `${Math.max(share, 0.02) * 100}%`,
                            height: '100%',
                            borderRadius: 3,
                            backgroundColor: row.category.color,
                          }}
                        />
                      </View>
                      <Text variant="caption" tone="tertiary">
                        {formatPercent(share, 1)} · {row.count}{' '}
                        {row.count === 1 ? 'entry' : 'entries'}
                      </Text>
                    </View>
                  </Animated.View>
                );
              })
            )}
          </Card>
        </Animated.View>

        <Animated.View
          entering={FadeInDown.delay(150).springify().damping(20)}
          style={styles.section}
        >
          <SectionHeader title="Budgets" actionLabel="Add budget" onAction={openNew} />
          <View style={{ gap: spacing.md }}>
            {rows.length === 0 ? (
              <Card>
                <Text variant="body" tone="secondary">
                  No budgets for {monthLabel(month)}. Set one and Aurum will track it for you.
                </Text>
              </Card>
            ) : (
              rows.map((row, index) => (
                <Animated.View key={row.budget.id} layout={Layout.springify().damping(22)}>
                  <Card padded={false} style={{ padding: spacing.lg }}>
                    <View style={styles.budgetTop}>
                      <ProgressRing
                        progress={Math.min(row.progress, 1)}
                        size={52}
                        strokeWidth={5}
                        color={row.overBudget ? theme.colors.negative : row.category.color}
                        delay={index * 80}
                      >
                        <Text variant="caption" tabular>
                          {formatPercent(row.progress, 0)}
                        </Text>
                      </ProgressRing>
                      <View style={{ flex: 1, gap: 3 }}>
                        <Text variant="bodyStrong">{row.category.name}</Text>
                        <Text variant="caption" tone="tertiary" tabular>
                          {formatMoney(row.spent, { currency })} of{' '}
                          {formatMoney(row.budget.limit, { currency })}
                        </Text>
                        <Text
                          variant="caption"
                          style={{
                            color: row.overBudget ? theme.colors.negative : theme.colors.positive,
                          }}
                        >
                          {row.overBudget
                            ? `${formatMoney(Math.abs(row.remaining), { currency })} over`
                            : `${formatMoney(row.remaining, { currency })} left`}
                        </Text>
                      </View>
                      <IconButton
                        name="create-outline"
                        diameter={36}
                        size={15}
                        onPress={() => {
                          setEditing(row);
                          setSheetOpen(true);
                        }}
                        accessibilityLabel={`Edit ${row.category.name} budget`}
                      />
                    </View>
                  </Card>
                </Animated.View>
              ))
            )}
          </View>
        </Animated.View>

        <Animated.View
          entering={FadeInDown.delay(210).springify().damping(20)}
          style={styles.section}
        >
          <SectionHeader title="Worth knowing" />
          <View style={{ gap: spacing.md }}>
            <InsightRow
              icon="trending-down-outline"
              title={spend[0] ? `${spend[0].category.name} leads` : 'No spending yet'}
              value={
                spend[0]
                  ? `${formatMoney(spend[0].total, { currency })} · ${formatPercent(
                      spend[0].total / Math.max(totals.expense, 1),
                      0,
                    )}`
                  : '—'
              }
              tone={theme.colors.negative}
            />
            <InsightRow
              icon="alert-circle-outline"
              title="Largest single expense"
              value={
                largest ? `${largest.merchant} · ${formatMoney(largest.amount, { currency })}` : '—'
              }
              tone={theme.colors.warning}
            />
            <InsightRow
              icon="calendar-outline"
              title="Days with spending"
              value={`${new Set(monthTransactions.filter((tx) => tx.kind === 'expense').map((tx) => new Date(tx.date).getDate())).size} of ${activeDays}`}
              tone={theme.colors.info}
            />
            <InsightRow
              icon="sparkles-outline"
              title="Saved this month"
              value={formatMoney(totals.net, { currency, signed: true })}
              tone={theme.colors.positive}
            />
          </View>
        </Animated.View>

        <PressableScale
          onPress={() => navigation.navigate('Categories')}
          haptic={false}
          activeScale={0.99}
          style={{ marginHorizontal: spacing.xl, marginTop: spacing.xl }}
        >
          <Card>
            <View style={styles.linkRow}>
              <View>
                <Text variant="label">Manage categories</Text>
                <Text variant="caption" tone="tertiary">
                  {categories.length} categories in your ledger
                </Text>
              </View>
              <IconButton
                name="arrow-forward"
                diameter={34}
                size={15}
                onPress={() => navigation.navigate('Categories')}
                accessibilityLabel="Manage categories"
              />
            </View>
          </Card>
        </PressableScale>
      </Screen>

      <BudgetSheet
        visible={sheetOpen}
        monthLabel={monthLabel(month)}
        currency={currency}
        categories={categories}
        existing={editing}
        onClose={() => setSheetOpen(false)}
        onSave={async ({ categoryId, limit }) => {
          await setBudget({ categoryId, limit, month });
          toast.success(editing ? 'Budget updated' : 'Budget created');
        }}
        onDelete={
          editing
            ? () => {
                const target = editing;
                void deleteBudget(target.budget.id).then(() => {
                  toast.show('Budget removed', {
                    action: {
                      label: 'Undo',
                      onPress: () =>
                        void setBudget({
                          categoryId: target.category.id,
                          limit: target.budget.limit,
                          month,
                        }),
                    },
                  });
                  setSheetOpen(false);
                });
              }
            : undefined
        }
      />
    </View>
  );
}

function Legend({ color, label }: { color: string; label: string }) {
  return (
    <View style={styles.legendItem}>
      <View style={[styles.legendDot, { backgroundColor: color }]} />
      <Text variant="caption" tone="tertiary">
        {label}
      </Text>
    </View>
  );
}

function InsightRow({
  icon,
  title,
  value,
  tone,
}: {
  icon: keyof typeof import('@expo/vector-icons').Ionicons.glyphMap;
  title: string;
  value: string;
  tone: string;
}) {
  const theme = useTheme();
  return (
    <View
      style={[
        styles.insightRow,
        { backgroundColor: theme.colors.surface, borderColor: theme.colors.hairline },
      ]}
    >
      <View style={[styles.insightIcon, { backgroundColor: `${tone}1F` }]}>
        <CategoryIcon icon={icon as string} color={tone} size={32} />
      </View>
      <View style={{ flex: 1, gap: 2 }}>
        <Text variant="label">{title}</Text>
        <Text variant="caption" tone="secondary" numberOfLines={1}>
          {value}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.lg,
  },
  section: { paddingHorizontal: spacing.xl, marginTop: spacing.xl },
  donutWrap: { alignItems: 'center', paddingVertical: spacing.xl },
  donutEmpty: { paddingVertical: spacing.giant },
  splitRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingTop: spacing.lg,
    marginTop: spacing.sm,
  },
  splitCell: { flex: 1, gap: 4, paddingRight: spacing.xs },
  vRule: { width: StyleSheet.hairlineWidth, height: 30 },
  legend: {
    flexDirection: 'row',
    gap: spacing.lg,
    justifyContent: 'center',
    marginTop: spacing.md,
  },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  legendDot: { width: 6, height: 6, borderRadius: 3 },
  categoryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.md,
  },
  categoryTop: { flexDirection: 'row', justifyContent: 'space-between' },
  track: { height: 5, borderRadius: 3, overflow: 'hidden' },
  budgetTop: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  insightRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.md,
    borderRadius: radius.lg,
    borderWidth: StyleSheet.hairlineWidth * 2,
  },
  insightIcon: { borderRadius: 12 },
  linkRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
});
