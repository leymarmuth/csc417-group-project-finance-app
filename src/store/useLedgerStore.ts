import { create } from 'zustand';
import type {
  Account,
  Budget,
  Category,
  Goal,
  LedgerSnapshot,
  MonthKey,
  Transaction,
} from '../types/models';
import { createSeedSnapshot } from '../data/seed';
import { ledgerRepository } from '../services/ledger.repository';
import { monthKey } from '../lib/date';
import { uid } from '../lib/utils';

export type LedgerStatus = 'idle' | 'loading' | 'ready' | 'error';

export class LedgerError extends Error {
  constructor(
    public code: 'duplicate' | 'in_use' | 'not_found' | 'invalid' | 'persist',
    message: string,
  ) {
    super(message);
    this.name = 'LedgerError';
  }
}

export type TransactionDraft = Omit<Transaction, 'id' | 'createdAt' | 'updatedAt'>;
export type CategoryDraft = Omit<Category, 'id' | 'createdAt' | 'updatedAt'>;
export type AccountDraft = Omit<Account, 'id' | 'createdAt' | 'updatedAt'>;
export type GoalDraft = Omit<Goal, 'id' | 'createdAt' | 'updatedAt'>;

interface LedgerState {
  status: LedgerStatus;
  error: string | null;

  accounts: Account[];
  categories: Category[];
  transactions: Transaction[];
  budgets: Budget[];
  goals: Goal[];

  hydrate: () => Promise<void>;
  resetToSeed: () => Promise<void>;

  // Transactions
  createTransaction: (draft: TransactionDraft) => Promise<Transaction>;
  updateTransaction: (id: string, patch: Partial<TransactionDraft>) => Promise<Transaction>;
  deleteTransaction: (id: string) => Promise<Transaction>;
  restoreTransaction: (transaction: Transaction) => Promise<Transaction>;

  // Categories
  createCategory: (draft: CategoryDraft) => Promise<Category>;
  updateCategory: (id: string, patch: Partial<CategoryDraft>) => Promise<Category>;
  deleteCategory: (id: string) => Promise<Category>;

  // Accounts
  createAccount: (draft: AccountDraft) => Promise<Account>;
  updateAccount: (id: string, patch: Partial<AccountDraft>) => Promise<Account>;
  deleteAccount: (id: string) => Promise<Account>;

  // Budgets
  setBudget: (input: { categoryId: string; limit: number; month?: MonthKey }) => Promise<Budget>;
  deleteBudget: (id: string) => Promise<Budget>;

  // Goals
  createGoal: (draft: GoalDraft) => Promise<Goal>;
  updateGoal: (id: string, patch: Partial<GoalDraft>) => Promise<Goal>;
  contributeToGoal: (id: string, amount: number) => Promise<Goal>;
  deleteGoal: (id: string) => Promise<Goal>;
}

/* ------------------------------------------------------------------ */
/* Write-behind persistence                                            */
/* ------------------------------------------------------------------ */

let persistTimer: ReturnType<typeof setTimeout> | null = null;

function snapshotOf(state: LedgerState): LedgerSnapshot {
  return {
    version: 1,
    accounts: state.accounts,
    categories: state.categories,
    transactions: state.transactions,
    budgets: state.budgets,
    goals: state.goals,
  };
}

function schedulePersist(get: () => LedgerState) {
  if (persistTimer) clearTimeout(persistTimer);
  persistTimer = setTimeout(() => {
    persistTimer = null;
    void ledgerRepository.save(snapshotOf(get())).catch(() => {
      /* Data is still in memory; the next write retries. */
    });
  }, 320);
}

/** Flush any pending write immediately (used on sign-out). */
export async function flushLedgerPersistence(): Promise<void> {
  if (persistTimer) {
    clearTimeout(persistTimer);
    persistTimer = null;
  }
  const state = useLedgerStore.getState();
  await ledgerRepository.save(snapshotOf(state));
}

const nowISO = () => new Date().toISOString();

/** Derive the balance delta a transaction applies to its account. */
const balanceDelta = (tx: Transaction) => (tx.kind === 'income' ? tx.amount : -tx.amount);

export const useLedgerStore = create<LedgerState>((set, get) => {
  const commit = (mutate: (state: LedgerState) => Partial<LedgerState>) => {
    set((state) => {
      const next = mutate(state);
      return next as LedgerState;
    });
    schedulePersist(get);
  };

  const adjustAccount = (accounts: Account[], accountId: string, delta: number): Account[] =>
    accounts.map((account) =>
      account.id === accountId
        ? { ...account, balance: account.balance + delta, updatedAt: nowISO() }
        : account,
    );

  return {
    status: 'idle',
    error: null,
    accounts: [],
    categories: [],
    transactions: [],
    budgets: [],
    goals: [],

    hydrate: async () => {
      if (get().status === 'loading' || get().status === 'ready') return;
      set({ status: 'loading', error: null });
      try {
        const snapshot = await ledgerRepository.load();
        set({ ...snapshot, status: 'ready' });
      } catch (error) {
        set({
          status: 'error',
          error: error instanceof Error ? error.message : 'Could not load your ledger.',
        });
      }
    },

    resetToSeed: async () => {
      const seeded = createSeedSnapshot();
      await ledgerRepository.save(seeded);
      set({ ...seeded, status: 'ready', error: null });
    },

    /* ----------------------------- Transactions ----------------------------- */

    createTransaction: async (draft) => {
      if (!draft.amount || draft.amount <= 0) {
        throw new LedgerError('invalid', 'Enter an amount greater than zero.');
      }
      const timestamp = nowISO();
      const transaction: Transaction = {
        ...draft,
        id: uid('txn'),
        createdAt: timestamp,
        updatedAt: timestamp,
      };
      commit((state) => ({
        transactions: [transaction, ...state.transactions],
        accounts: adjustAccount(state.accounts, transaction.accountId, balanceDelta(transaction)),
      }));
      return transaction;
    },

    updateTransaction: async (id, patch) => {
      const existing = get().transactions.find((tx) => tx.id === id);
      if (!existing) throw new LedgerError('not_found', 'That transaction no longer exists.');
      const next: Transaction = { ...existing, ...patch, id, updatedAt: nowISO() };
      commit((state) => {
        // Rebalance: undo the old effect, apply the new one.
        let accounts = adjustAccount(state.accounts, existing.accountId, -balanceDelta(existing));
        accounts = adjustAccount(accounts, next.accountId, balanceDelta(next));
        return {
          transactions: state.transactions.map((tx) => (tx.id === id ? next : tx)),
          accounts,
        };
      });
      return next;
    },

    deleteTransaction: async (id) => {
      const existing = get().transactions.find((tx) => tx.id === id);
      if (!existing) throw new LedgerError('not_found', 'That transaction no longer exists.');
      commit((state) => ({
        transactions: state.transactions.filter((tx) => tx.id !== id),
        accounts: adjustAccount(state.accounts, existing.accountId, -balanceDelta(existing)),
      }));
      return existing;
    },

    restoreTransaction: async (transaction) => {
      commit((state) => ({
        transactions: [transaction, ...state.transactions],
        accounts: adjustAccount(state.accounts, transaction.accountId, balanceDelta(transaction)),
      }));
      return transaction;
    },

    /* ------------------------------ Categories ------------------------------ */

    createCategory: async (draft) => {
      const name = draft.name.trim();
      if (!name) throw new LedgerError('invalid', 'Give your category a name.');
      const duplicate = get().categories.some(
        (c) => c.name.toLowerCase() === name.toLowerCase() && c.kind === draft.kind,
      );
      if (duplicate) throw new LedgerError('duplicate', `“${name}” already exists.`);
      const timestamp = nowISO();
      const category: Category = {
        ...draft,
        name,
        id: uid('cat'),
        createdAt: timestamp,
        updatedAt: timestamp,
      };
      commit((state) => ({ categories: [...state.categories, category] }));
      return category;
    },

    updateCategory: async (id, patch) => {
      const existing = get().categories.find((c) => c.id === id);
      if (!existing) throw new LedgerError('not_found', 'Category not found.');
      const next: Category = { ...existing, ...patch, id, updatedAt: nowISO() };
      commit((state) => ({
        categories: state.categories.map((c) => (c.id === id ? next : c)),
      }));
      return next;
    },

    deleteCategory: async (id) => {
      const state = get();
      const existing = state.categories.find((c) => c.id === id);
      if (!existing) throw new LedgerError('not_found', 'Category not found.');
      const inUse = state.transactions.some((tx) => tx.categoryId === id);
      if (inUse) {
        throw new LedgerError('in_use', 'Recategorise its transactions before deleting.');
      }
      commit((s) => ({
        categories: s.categories.filter((c) => c.id !== id),
        budgets: s.budgets.filter((b) => b.categoryId !== id),
      }));
      return existing;
    },

    /* ------------------------------- Accounts ------------------------------- */

    createAccount: async (draft) => {
      const name = draft.name.trim();
      if (!name) throw new LedgerError('invalid', 'Give your account a name.');
      const timestamp = nowISO();
      const account: Account = {
        ...draft,
        name,
        id: uid('acc'),
        createdAt: timestamp,
        updatedAt: timestamp,
      };
      commit((state) => ({ accounts: [...state.accounts, account] }));
      return account;
    },

    updateAccount: async (id, patch) => {
      const existing = get().accounts.find((a) => a.id === id);
      if (!existing) throw new LedgerError('not_found', 'Account not found.');
      const next: Account = { ...existing, ...patch, id, updatedAt: nowISO() };
      commit((state) => ({
        accounts: state.accounts.map((a) => (a.id === id ? next : a)),
      }));
      return next;
    },

    deleteAccount: async (id) => {
      const state = get();
      const existing = state.accounts.find((a) => a.id === id);
      if (!existing) throw new LedgerError('not_found', 'Account not found.');
      if (state.accounts.filter((a) => !a.archived).length <= 1) {
        throw new LedgerError('in_use', 'Keep at least one active account.');
      }
      const inUse = state.transactions.some((tx) => tx.accountId === id);
      if (inUse) {
        throw new LedgerError('in_use', 'Move its transactions before deleting this account.');
      }
      commit((s) => ({ accounts: s.accounts.filter((a) => a.id !== id) }));
      return existing;
    },

    /* -------------------------------- Budgets ------------------------------- */

    setBudget: async ({ categoryId, limit, month }) => {
      if (limit <= 0) throw new LedgerError('invalid', 'Set a limit above zero.');
      const targetMonth = month ?? monthKey(new Date());
      const existing = get().budgets.find(
        (b) => b.categoryId === categoryId && b.month === targetMonth,
      );
      const timestamp = nowISO();
      if (existing) {
        const next: Budget = { ...existing, limit, updatedAt: timestamp };
        commit((state) => ({
          budgets: state.budgets.map((b) => (b.id === existing.id ? next : b)),
        }));
        return next;
      }
      const budget: Budget = {
        id: uid('bud'),
        categoryId,
        limit,
        month: targetMonth,
        createdAt: timestamp,
        updatedAt: timestamp,
      };
      commit((state) => ({ budgets: [...state.budgets, budget] }));
      return budget;
    },

    deleteBudget: async (id) => {
      const existing = get().budgets.find((b) => b.id === id);
      if (!existing) throw new LedgerError('not_found', 'Budget not found.');
      commit((state) => ({ budgets: state.budgets.filter((b) => b.id !== id) }));
      return existing;
    },

    /* --------------------------------- Goals -------------------------------- */

    createGoal: async (draft) => {
      const name = draft.name.trim();
      if (!name) throw new LedgerError('invalid', 'Name your goal.');
      if (draft.target <= 0) throw new LedgerError('invalid', 'Set a target above zero.');
      const timestamp = nowISO();
      const goal: Goal = {
        ...draft,
        name,
        id: uid('goal'),
        createdAt: timestamp,
        updatedAt: timestamp,
      };
      commit((state) => ({ goals: [goal, ...state.goals] }));
      return goal;
    },

    updateGoal: async (id, patch) => {
      const existing = get().goals.find((g) => g.id === id);
      if (!existing) throw new LedgerError('not_found', 'Goal not found.');
      const next: Goal = { ...existing, ...patch, id, updatedAt: nowISO() };
      commit((state) => ({ goals: state.goals.map((g) => (g.id === id ? next : g)) }));
      return next;
    },

    contributeToGoal: async (id, amount) => {
      const existing = get().goals.find((g) => g.id === id);
      if (!existing) throw new LedgerError('not_found', 'Goal not found.');
      if (!Number.isFinite(amount) || amount === 0) {
        throw new LedgerError('invalid', 'Enter an amount to add.');
      }
      const next: Goal = {
        ...existing,
        saved: Math.min(Math.max(existing.saved + amount, 0), existing.target),
        updatedAt: nowISO(),
      };
      commit((state) => ({ goals: state.goals.map((g) => (g.id === id ? next : g)) }));
      return next;
    },

    deleteGoal: async (id) => {
      const existing = get().goals.find((g) => g.id === id);
      if (!existing) throw new LedgerError('not_found', 'Goal not found.');
      commit((state) => ({ goals: state.goals.filter((g) => g.id !== id) }));
      return existing;
    },
  };
});

/** Convenience selectors — stable references, safe for `useStore(selector)`. */
export const selectLedger = (state: LedgerState) => state;
