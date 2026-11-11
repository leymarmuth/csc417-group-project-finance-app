import type {
  Account,
  Budget,
  Category,
  Goal,
  LedgerSnapshot,
  MonthKey,
  Transaction,
} from '../types/models';
import { daysInMonth, monthKey, monthKeyOf, monthRange, shortMonth, addMonths } from '../lib/date';
import { sum } from '../lib/utils';

/**
 * Pure derivations over the ledger. Kept out of the store so they are trivially
 * testable and memo-friendly at the call site.
 */

export const indexById = <T extends { id: string }>(items: T[]) =>
  items.reduce<Record<string, T>>((acc, item) => {
    acc[item.id] = item;
    return acc;
  }, {});

export interface MonthTotals {
  income: number;
  expense: number;
  net: number;
}

export function monthTotals(transactions: Transaction[], month: MonthKey): MonthTotals {
  let income = 0;
  let expense = 0;
  for (const tx of transactions) {
    if (monthKeyOf(tx.date) !== month) continue;
    if (tx.kind === 'income') income += tx.amount;
    else expense += tx.amount;
  }
  return { income, expense, net: income - expense };
}

export function transactionsInMonth(transactions: Transaction[], month: MonthKey): Transaction[] {
  return transactions.filter((tx) => monthKeyOf(tx.date) === month);
}

export function totalBalance(accounts: Account[]): number {
  return sum(
    accounts.filter((a) => !a.archived),
    (a) => a.balance,
  );
}

export interface CategorySpend {
  category: Category;
  total: number;
  count: number;
}

export function spendByCategory(
  transactions: Transaction[],
  categories: Category[],
  month: MonthKey,
): CategorySpend[] {
  const byId = indexById(categories);
  const totals = new Map<string, { total: number; count: number }>();
  for (const tx of transactions) {
    if (tx.kind !== 'expense' || monthKeyOf(tx.date) !== month) continue;
    const entry = totals.get(tx.categoryId) ?? { total: 0, count: 0 };
    entry.total += tx.amount;
    entry.count += 1;
    totals.set(tx.categoryId, entry);
  }
  return Array.from(totals.entries())
    .map(([categoryId, value]) => ({
      category: byId[categoryId],
      total: value.total,
      count: value.count,
    }))
    .filter((row): row is CategorySpend => Boolean(row.category))
    .sort((a, b) => b.total - a.total);
}

/** Cumulative spend for every day of the month — powers the area chart. */
export function dailySpendSeries(
  transactions: Transaction[],
  month: MonthKey,
): { day: number; value: number; cumulative: number }[] {
  const total = daysInMonth(month);
  const buckets = new Array<number>(total).fill(0);
  for (const tx of transactions) {
    if (tx.kind !== 'expense' || monthKeyOf(tx.date) !== month) continue;
    const day = new Date(tx.date).getDate() - 1;
    buckets[day] += tx.amount;
  }
  let cumulative = 0;
  return buckets.map((value, index) => {
    cumulative += value;
    return { day: index + 1, value, cumulative };
  });
}

export interface MonthPoint {
  month: MonthKey;
  label: string;
  income: number;
  expense: number;
}

export function monthlySeries(transactions: Transaction[], months = 6): MonthPoint[] {
  const anchor = new Date();
  return Array.from({ length: months }, (_, i) => {
    const date = addMonths(anchor, -(months - 1 - i));
    const key = monthKey(date);
    const totals = monthTotals(transactions, key);
    return { month: key, label: shortMonth(key), income: totals.income, expense: totals.expense };
  });
}

export interface BudgetProgress {
  budget: Budget;
  category: Category;
  spent: number;
  remaining: number;
  progress: number;
  overBudget: boolean;
}

export function budgetProgress(
  snapshot: Pick<LedgerSnapshot, 'budgets' | 'categories' | 'transactions'>,
  month: MonthKey,
): BudgetProgress[] {
  const byId = indexById(snapshot.categories);
  const spend = new Map<string, number>();
  for (const tx of snapshot.transactions) {
    if (tx.kind !== 'expense' || monthKeyOf(tx.date) !== month) continue;
    spend.set(tx.categoryId, (spend.get(tx.categoryId) ?? 0) + tx.amount);
  }
  return snapshot.budgets
    .filter((budget) => budget.month === month)
    .map((budget) => {
      const category = byId[budget.categoryId];
      const spent = spend.get(budget.categoryId) ?? 0;
      const progress = budget.limit > 0 ? spent / budget.limit : 0;
      return {
        budget,
        category,
        spent,
        remaining: budget.limit - spent,
        progress,
        overBudget: spent > budget.limit,
      };
    })
    .filter((row): row is BudgetProgress => Boolean(row.category))
    .sort((a, b) => b.progress - a.progress);
}

/** Percent change between this month and last, guarding divide-by-zero. */
export function percentChange(current: number, previous: number): number {
  if (previous === 0) return current === 0 ? 0 : 1;
  return (current - previous) / Math.abs(previous);
}

export function goalProgress(goal: Goal): number {
  return goal.target > 0 ? Math.min(goal.saved / goal.target, 1) : 0;
}

export function sortTransactionsDesc(transactions: Transaction[]): Transaction[] {
  return [...transactions].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}

export interface TransactionFilters {
  query: string;
  kind: 'all' | 'expense' | 'income';
  categoryIds: string[];
  accountIds: string[];
  month: MonthKey | 'all';
}

export const emptyFilters: TransactionFilters = {
  query: '',
  kind: 'all',
  categoryIds: [],
  accountIds: [],
  month: monthKey(new Date()),
};

export function filterTransactions(
  transactions: Transaction[],
  categories: Category[],
  filters: TransactionFilters,
): Transaction[] {
  const byId = indexById(categories);
  const query = filters.query.trim().toLowerCase();
  return sortTransactionsDesc(
    transactions.filter((tx) => {
      if (filters.kind !== 'all' && tx.kind !== filters.kind) return false;
      if (filters.month !== 'all' && monthKeyOf(tx.date) !== filters.month) return false;
      if (filters.categoryIds.length && !filters.categoryIds.includes(tx.categoryId)) return false;
      if (filters.accountIds.length && !filters.accountIds.includes(tx.accountId)) return false;
      if (!query) return true;
      const categoryName = byId[tx.categoryId]?.name.toLowerCase() ?? '';
      return (
        tx.merchant.toLowerCase().includes(query) ||
        tx.note.toLowerCase().includes(query) ||
        categoryName.includes(query)
      );
    }),
  );
}

export function activeFilterCount(filters: TransactionFilters): number {
  let count = 0;
  if (filters.kind !== 'all') count += 1;
  if (filters.categoryIds.length) count += 1;
  if (filters.accountIds.length) count += 1;
  if (filters.month !== 'all' && filters.month !== monthKey(new Date())) count += 1;
  return count;
}

export function upcomingGoal(goals: Goal[]): Goal | undefined {
  return goals
    .filter((g) => !g.archived && g.deadline)
    .sort((a, b) => new Date(a.deadline!).getTime() - new Date(b.deadline!).getTime())[0];
}

export function monthBounds(month: MonthKey) {
  return monthRange(month);
}
