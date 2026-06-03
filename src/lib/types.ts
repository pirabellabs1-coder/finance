// Core domain types shared across the app.

export type TransactionType = "income" | "expense";

export type PaymentMethod =
  | "card"
  | "cash"
  | "transfer"
  | "check"
  | "mobile"
  | "other";

export type CurrencyCode =
  | "EUR"
  | "USD"
  | "GBP"
  | "CHF"
  | "CAD"
  | "MAD"
  | "XOF"
  | "DZD"
  | "TND";

export interface Category {
  id: string;
  label: string;
  type: TransactionType;
  /** Key into the lucide icon map (see components/CategoryIcon). */
  icon: string;
  /** Hex color used by charts and badges. */
  color: string;
}

export interface Transaction {
  id: string;
  userId: string;
  type: TransactionType;
  /** Always stored as a positive number, in major currency units. */
  amount: number;
  categoryId: string;
  description: string;
  /** ISO date — `YYYY-MM-DD`. */
  date: string;
  paymentMethod: PaymentMethod;
  /** Optional reference (income) or receipt note (expense). */
  reference?: string;
  createdAt: string;
  updatedAt: string;
}

/** Fields a user supplies when creating or editing a transaction. */
export interface TransactionInput {
  type: TransactionType;
  amount: number;
  categoryId: string;
  description: string;
  date: string;
  paymentMethod: PaymentMethod;
  reference?: string;
}

export interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  currency: CurrencyCode;
  /** Optional avatar as a data URL. */
  avatar?: string;
  createdAt: string;
}

export interface RegisterInput {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  currency: CurrencyCode;
}

export interface ProfilePatch {
  firstName?: string;
  lastName?: string;
  currency?: CurrencyCode;
  avatar?: string;
}

// --- Phase 2: planning ------------------------------------------------------

/** Per-user budget: a global monthly cap plus optional per-category caps. */
export interface Budget {
  /** Global monthly spending limit; null = not set. */
  monthlyLimit: number | null;
  /** categoryId → monthly limit. */
  categoryLimits: Record<string, number>;
}

export interface SavingsGoal {
  id: string;
  userId: string;
  name: string;
  target: number;
  saved: number;
  /** Optional target date, ISO `YYYY-MM-DD`. */
  deadline?: string;
  color: string;
  createdAt: string;
}

export interface SavingsGoalInput {
  name: string;
  target: number;
  saved: number;
  deadline?: string;
  color: string;
}

export type RecurrenceFrequency = "weekly" | "monthly";

export interface RecurringRule {
  id: string;
  userId: string;
  type: TransactionType;
  amount: number;
  categoryId: string;
  description: string;
  paymentMethod: PaymentMethod;
  frequency: RecurrenceFrequency;
  /** Next occurrence date, ISO `YYYY-MM-DD`. */
  nextDate: string;
  active: boolean;
  createdAt: string;
}

export interface RecurringRuleInput {
  type: TransactionType;
  amount: number;
  categoryId: string;
  description: string;
  paymentMethod: PaymentMethod;
  frequency: RecurrenceFrequency;
  nextDate: string;
  active: boolean;
}

export type NotificationSeverity = "info" | "warning" | "danger" | "success";

/** Notifications are derived from live state, not stored. */
export interface NotificationItem {
  id: string;
  severity: NotificationSeverity;
  title: string;
  message: string;
  href?: string;
}
