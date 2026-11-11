/** Domain models for the Aurum ledger. */

export type ISODateString = string;
export type MonthKey = string; // 'YYYY-MM'

export type CurrencyCode = 'USD' | 'EUR' | 'GBP' | 'KES' | 'NGN' | 'ZAR' | 'INR' | 'AED';

export interface User {
  id: string;
  name: string;
  email: string;
  createdAt: ISODateString;
}

export interface Session {
  token: string;
  user: User;
  expiresAt: ISODateString;
}

export type AccountKind = 'checking' | 'savings' | 'card' | 'cash' | 'investment';

export interface Account {
  id: string;
  name: string;
  kind: AccountKind;
  institution: string;
  /** Opening balance in minor units. */
  balance: number;
  currency: CurrencyCode;
  color: string;
  archived: boolean;
  createdAt: ISODateString;
  updatedAt: ISODateString;
}

export type TransactionKind = 'expense' | 'income';

export interface Category {
  id: string;
  name: string;
  icon: string;
  color: string;
  kind: TransactionKind;
  createdAt: ISODateString;
  updatedAt: ISODateString;
}

export interface Transaction {
  id: string;
  /** Always a positive amount in minor units; direction lives in `kind`. */
  amount: number;
  kind: TransactionKind;
  categoryId: string;
  accountId: string;
  note: string;
  merchant: string;
  date: ISODateString;
  createdAt: ISODateString;
  updatedAt: ISODateString;
}

export interface Budget {
  id: string;
  categoryId: string;
  /** Monthly cap in minor units. */
  limit: number;
  month: MonthKey;
  createdAt: ISODateString;
  updatedAt: ISODateString;
}

export interface Goal {
  id: string;
  name: string;
  target: number;
  saved: number;
  deadline: ISODateString | null;
  icon: string;
  color: string;
  archived: boolean;
  createdAt: ISODateString;
  updatedAt: ISODateString;
}

export interface LedgerSnapshot {
  version: number;
  accounts: Account[];
  categories: Category[];
  transactions: Transaction[];
  budgets: Budget[];
  goals: Goal[];
}

/** Generic create / update payloads. */
export type Draft<T extends { id: string; createdAt: string; updatedAt: string }> = Omit<
  T,
  'id' | 'createdAt' | 'updatedAt'
>;
export type Patch<T> = Partial<Omit<T, 'id' | 'createdAt'>>;
