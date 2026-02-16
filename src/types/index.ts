export type TransactionType = 'income' | 'expense' | 'transfer';

export interface Account {
  id: string;
  name: string;
  type: 'bank' | 'cash' | 'ewallet';
  balance: number;
  color: string;
}

export interface Category {
  id: string;
  name: string;
  type: 'income' | 'expense';
  color: string;
  icon?: string;
}

export interface Transaction {
  id: string;
  amount: number;
  type: TransactionType;
  categoryId?: string; // Optional for transfers
  bucketId?: string; // Optional: links transaction to a specific budget bucket
  accountId: string;
  toAccountId?: string; // For transfers
  date: string; // ISO string
  note?: string;
}

export interface RecurringTransaction {
  id: string;
  amount: number;
  type: TransactionType;
  categoryId?: string;
  accountId: string;
  toAccountId?: string;
  frequency: 'daily' | 'weekly' | 'monthly' | 'yearly';
  startDate: string;
  nextDueDate: string;
  note?: string;
  active: boolean;
}

export interface Bucket {
  id: string;
  name: string;
  limit: number;
  categoryIds: string[];
  color: string;
  // New fields
  period: "daily" | "weekly" | "monthly";
  constraint: "all" | "workdays" | "weekends";
  rollover: boolean;
  isMealTracker?: boolean;
  archived?: boolean;
  createdAt?: string; // ISO date string for when the bucket was created
  targetAccountId?: string; // Optional: specific account to check liquidity against
  rolloverSnapshot?: number; // Frozen rollover when daily rate changed mid-month
  rolloverSnapshotDate?: string; // YYYY-MM-DD when the snapshot was taken
}
