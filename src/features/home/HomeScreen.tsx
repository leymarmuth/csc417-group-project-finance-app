import { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, View, useWindowDimensions } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AreaChart } from '../../components/charts';
import { MoneyDisplay } from '../../components/finance/MoneyDisplay';
import { MonthSwitcher } from '../../components/finance/MonthSwitcher';
import { CategoryIcon } from '../../components/finance/CategoryIcon';
import { Avatar } from '../../components/ui/Avatar';
import { Card } from '../../components/ui/Card';
import { Fab } from '../../components/ui/Fab';
import { IconButton } from '../../components/ui/IconButton';
import { PressableScale } from '../../components/ui/PressableScale';
import { ProgressRing } from '../../components/ui/ProgressRing';
import { Screen } from '../../components/ui/Screen';
import { SectionHeader } from '../../components/ui/SectionHeader';
import { Skeleton } from '../../components/ui/Skeleton';
import { Text } from '../../components/ui/Text';
import { BalanceHero } from './components/BalanceHero';
import { AccountStrip } from './components/AccountStrip';
import { TransactionRow } from '../transactions/components/TransactionRow';
import { useLedgerStore } from '../../store/useLedgerStore';
import { useAuthStore } from '../../store/useAuthStore';
import { toast } from '../../store/useToastStore';
import { useSettingsStore } from '../../store/useSettingsStore';
import {
  budgetProgress,
  dailySpendSeries,
  goalProgress,
  indexById,
  monthTotals,
  monthlySeries,
  sortTransactionsDesc,
  totalBalance,
  percentChange,
} from '../../store/selectors';
import { monthKey, monthLabel } from '../../lib/date';
import { formatMoney, formatPercent } from '../../lib/format';
import { spacing, radius, useTheme } from '../../theme';
import type { TabScreenProps } from '../../navigation/types';

const greeting = () => {
  const hour = new Date().getHours();
  if (hour < 5) return 'Still up';
  if (hour < 12) return 'Good morning';
  if (hour < 18) return 'Good afternoon';
  return 'Good evening';
};

export function HomeScreen({ navigation }: TabScreenProps<'Home'>) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();

  const user = useAuthStore((state) => state.user);
  const currency = useSettingsStore((state) => state.currency);
  const hideBalances = useSettingsStore((state) => state.hideBalances);
  const updateSetting = useSettingsStore((state) => state.update);

  const status = useLedgerStore((state) => state.status);
  const accounts = useLedgerStore((state) => state.accounts);
  const categories = useLedgerStore((state) => state.categories);
  const transactions = useLedgerStore((state) => state.transactions);
  const budgets = useLedgerStore((state) => state.budgets);
  const goals = useLedgerStore((state) => state.goals);
  const deleteTransaction = useLedgerStore((state) => state.deleteTransaction);
  const restoreTransaction = useLedgerStore((state) => state.restoreTransaction);

  const [month, setMonth] = useState(() => monthKey(new Date()));
  const [busy, setBusy] = useState(false);

  const categoryById = useMemo(() => indexById(categories), [categories]);
  const accountById = useMemo(() => indexById(accounts), [accounts]);

  const totals = useMemo(() => monthTotals(transactions, month), [transactions, month]);
  const previous = useMemo(() => {
    const [year, m] = month.split('-').map(Number);
    const prevDate = new Date(year, (m ?? 1) - 2, 1);
    return monthTotals(transactions, monthKey(prevDate));
  }, [month, transactions]);

  const spendChange = percentChange(totals.expense, previous.expense);
  const trend = useMemo(
    () => monthlySeries(transactions, 6).map((point) => point.expense),
    [transactions],
  );
  const daily = useMemo(() => {
    const series = dailySpendSeries(transactions, month);
    const isCurrent = month === monthKey(new Date());
    const cutoff = isCurrent ? new Date().getDate() : series.length;
    const trimmed = series.slice(0, cutoff);
    return trimmed.map((point) => point.cumulative);
  }, [month, transactions]);

  const budgetRows = useMemo(
    () => budgetProgress({ budgets, categories, transactions }, month).slice(0, 3),
    [budgets, categories, month, transactions],
  );

  const recent = useMemo(() => sortTransactionsDesc(transactions).slice(0, 4), [transactions]);
  const activeGoals = useMemo(() => goals.filter((goal) => !goal.archived).slice(0, 4), [goals]);
  const balance = useMemo(() => totalBalance(accounts), [accounts]);

  const chartWidth = width - spacing.xl * 2 - spacing.lg * 2 - 4;
  const activeDays = Math.max(daily.length, 1);
  const avgPerDay = totals.expense / activeDays;

  const handleDelete = async (id: string) => {
    if (busy) return;
    setBusy(true);
    try {
      const removed = await deleteTransaction(id);
      toast.show('Transaction deleted', {
        description: removed.merchant,
        action: { label: 'Undo', onPress: () => void restoreTransaction(removed) },
      });
    } finally {
      setBusy(false);
    }
  };

  const loading = status === 'loading' || status === 'idle';

  return (
    <View style={{ flex: 1 }}>
      <Screen scroll contentContainerStyle={{ paddingBottom: 140 }} bottomInset={insets.bottom}>
        <View style={[styles.header, { paddingTop: insets.top + spacing.md }]}>
          <View style={{ flex: 1 }}>
            <Text variant="micro" tone="tertiary">
              {greeting()}
            </Text>
            <Text variant="heading" numberOfLines={1} style={{ marginTop: 2 }}>
              {user?.name?.split(' ')[0] ?? 'Welcome'}
            </Text>
          </View>
          <IconButton
            name="notifications-outline"
            onPress={() => navigation.navigate('Settings')}
            accessibilityLabel="Notifications"
          />
          <PressableScale
            onPress={() => navigation.navigate('Profile')}
            activeScale={0.94}
            haptic={false}
          >
            <Avatar name={user?.name ?? 'Aurum'} size={42} />
          </PressableScale>
        </View>

        <View style={styles.section}>
          {loading ? (
            <Skeleton height={220} style={{ borderRadius: radius.xxl }} />
          ) : (
            <BalanceHero
              total={balance}
              currency={currency}
              income={totals.income}
              expense={totals.expense}
              change={spendChange}
              trend={trend}
              masked={hideBalances}
              onToggleMask={() => updateSetting('hideBalances', !hideBalances)}
              onPress={() => navigation.navigate('Accounts')}
            />
          )}
        </View>

        <Animated.View entering={FadeInDown.delay(80).springify().damping(20)}>
          <View style={{ paddingLeft: spacing.xl }}>
            <AccountStrip
              accounts={accounts}
              currency={currency}
              masked={hideBalances}
              onPressAccount={(account) => navigation.navigate('AccountEditor', { id: account.id })}
              onAdd={() => navigation.navigate('AccountEditor')}
            />
          </View>
        </Animated.View>

        <Animated.View
          entering={FadeInDown.delay(140).springify().damping(20)}
          style={styles.section}
        >
          <Card>
            <View style={styles.cardHeader}>
              <View style={{ flex: 1 }}>
                <Text variant="micro" tone="tertiary">
                  Spending
                </Text>
                <MoneyDisplay
                  amount={totals.expense}
                  currency={currency}
                  size="display"
                  masked={hideBalances}
                  style={{ marginTop: spacing.xs }}
                />
                <Text variant="caption" tone="tertiary" numberOfLines={1} style={{ marginTop: 2 }}>
                  {formatMoney(Math.round(avgPerDay), { currency, compactCents: true })}/day ·{' '}
                  <Text
                    variant="caption"
                    style={{
                      color: spendChange >= 0 ? theme.colors.negative : theme.colors.positive,
                    }}
                  >
                    {formatPercent(Math.abs(spendChange), 1)} {spendChange >= 0 ? 'more' : 'less'}
                  </Text>
                </Text>
              </View>
              <MonthSwitcher month={month} onChange={setMonth} compact />
            </View>
            <AreaChart
              values={daily.length > 1 ? daily : [0, 0]}
              width={chartWidth}
              height={116}
              delay={220}
              style={{ marginTop: spacing.lg }}
            />
            <View style={styles.chartFooter}>
              <Text variant="caption" tone="tertiary">
                {monthLabel(month)}
              </Text>
              <Text variant="caption" tone="tertiary">
                Today
              </Text>
            </View>
          </Card>
        </Animated.View>

        <Animated.View
          entering={FadeInDown.delay(200).springify().damping(20)}
          style={styles.section}
        >
          <SectionHeader
            title="Budgets"
            actionLabel="Manage"
            onAction={() => navigation.navigate('Insights')}
          />
          <Card padded={false} style={{ paddingHorizontal: spacing.lg }}>
            {budgetRows.length === 0 ? (
              <View style={styles.emptyInline}>
                <Text variant="body" tone="secondary" align="center">
                  No budgets for {monthLabel(month)} yet.
                </Text>
              </View>
            ) : (
              budgetRows.map((row, index) => (
                <PressableScale
                  key={row.budget.id}
                  onPress={() => navigation.navigate('Insights')}
                  haptic={false}
                  activeScale={0.99}
                >
                  <View
                    style={[
                      styles.budgetRow,
                      index > 0
                        ? {
                            borderTopWidth: StyleSheet.hairlineWidth,
                            borderTopColor: theme.colors.hairline,
                          }
                        : null,
                    ]}
                  >
                    <ProgressRing
                      progress={Math.min(row.progress, 1)}
                      size={40}
                      strokeWidth={4}
                      color={row.overBudget ? theme.colors.negative : row.category.color}
                      delay={index * 90}
                    />
                    <View style={styles.budgetLabels}>
                      <Text variant="label">{row.category.name}</Text>
                      <Text variant="caption" tone="tertiary" tabular>
                        {formatMoney(row.spent, { currency })} of{' '}
                        {formatMoney(row.budget.limit, { currency })}
                      </Text>
                    </View>
                    <Text
                      variant="caption"
                      tabular
                      style={{
                        color: row.overBudget ? theme.colors.negative : theme.colors.textSecondary,
                      }}
                    >
                      {formatPercent(row.progress, 0)}
                    </Text>
                  </View>
                </PressableScale>
              ))
            )}
          </Card>
        </Animated.View>

        <Animated.View
          entering={FadeInDown.delay(260).springify().damping(20)}
          style={styles.section}
        >
          <SectionHeader
            title="Recent activity"
            actionLabel="See all"
            onAction={() => navigation.navigate('Activity')}
          />
          <View>
            {recent.length === 0 ? (
              <Card>
                <Text variant="body" tone="secondary" align="center">
                  Nothing here yet. Add your first transaction.
                </Text>
              </Card>
            ) : (
              recent.map((transaction) => (
                <TransactionRow
                  key={transaction.id}
                  transaction={transaction}
                  category={categoryById[transaction.categoryId]}
                  accountName={accountById[transaction.accountId]?.name}
                  currency={currency}
                  showDate
                  onPress={() => navigation.navigate('TransactionEditor', { id: transaction.id })}
                  onDelete={() => void handleDelete(transaction.id)}
                />
              ))
            )}
          </View>
        </Animated.View>

        {activeGoals.length > 0 ? (
          <Animated.View
            entering={FadeInDown.delay(320).springify().damping(20)}
            style={styles.section}
          >
            <SectionHeader
              title="Goals"
              actionLabel="All goals"
              onAction={() => navigation.navigate('Goals')}
            />
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ gap: spacing.md, paddingRight: spacing.xl }}
              style={{ marginLeft: -spacing.xxl, paddingLeft: spacing.xxl }}
            >
              {activeGoals.map((goal, index) => (
                <PressableScale
                  key={goal.id}
                  onPress={() => navigation.navigate('GoalEditor', { id: goal.id })}
                  haptic={false}
                  activeScale={0.97}
                >
                  <View
                    style={[
                      styles.goalCard,
                      { backgroundColor: theme.colors.surface, borderColor: theme.colors.hairline },
                    ]}
                  >
                    <CategoryIcon icon={goal.icon} color={goal.color} size={34} />
                    <Text variant="label" numberOfLines={1} style={{ marginTop: spacing.md }}>
                      {goal.name}
                    </Text>
                    <Text variant="caption" tone="tertiary" tabular>
                      {formatMoney(goal.saved, { currency, compactCents: true })} /{' '}
                      {formatMoney(goal.target, { currency, compactCents: true })}
                    </Text>
                    <View
                      style={[styles.goalTrack, { backgroundColor: theme.colors.surfaceSunken }]}
                    >
                      <View
                        style={{
                          width: `${goalProgress(goal) * 100}%`,
                          height: '100%',
                          borderRadius: 3,
                          backgroundColor: goal.color,
                        }}
                      />
                    </View>
                    <Text variant="caption" tone="tertiary" style={{ marginTop: 6 }} tabular>
                      {formatPercent(goalProgress(goal), 0)} funded
                    </Text>
                  </View>
                </PressableScale>
              ))}
            </ScrollView>
          </Animated.View>
        ) : null}
      </Screen>

      <Fab
        onPress={() => navigation.navigate('TransactionEditor', undefined)}
        extended
        label="New"
      />
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
  cardHeader: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.md },
  chartFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: spacing.sm,
  },
  emptyInline: { paddingVertical: spacing.xl },
  budgetRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.md,
  },
  budgetLabels: { flex: 1, gap: 3 },
  goalCard: {
    width: 168,
    padding: spacing.lg,
    borderRadius: radius.lg,
    borderWidth: StyleSheet.hairlineWidth * 2,
  },
  goalTrack: {
    height: 5,
    borderRadius: 3,
    marginTop: spacing.md,
    overflow: 'hidden',
  },
});
