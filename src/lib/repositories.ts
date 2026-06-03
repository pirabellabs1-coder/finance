import { readJSON, STORAGE_KEYS, writeJSON } from "./storage";
import {
  LocalAuthRepository,
  LocalBudgetRepository,
  LocalGoalRepository,
  LocalRecurringRepository,
  LocalTransactionRepository,
} from "./repositories.local";
import type {
  Budget,
  ProfilePatch,
  RecurringRule,
  RecurringRuleInput,
  RegisterInput,
  SavingsGoal,
  SavingsGoalInput,
  Transaction,
  TransactionInput,
  User,
} from "./types";

// ---------------------------------------------------------------------------
// Repository interfaces — the contract the whole UI depends on.
// ---------------------------------------------------------------------------

export interface AuthRepository {
  getCurrentUser(): Promise<User | null>;
  register(input: RegisterInput): Promise<User>;
  login(email: string, password: string): Promise<User>;
  logout(): Promise<void>;
  requestPasswordReset(email: string): Promise<void>;
  updateProfile(userId: string, patch: ProfilePatch): Promise<User>;
  changePassword(userId: string, current: string, next: string): Promise<void>;
}

export interface TransactionRepository {
  list(userId: string): Promise<Transaction[]>;
  create(userId: string, input: TransactionInput): Promise<Transaction>;
  update(userId: string, id: string, input: TransactionInput): Promise<Transaction>;
  remove(userId: string, id: string): Promise<void>;
  replaceAll(userId: string, txs: Transaction[]): Promise<void>;
}

export interface BudgetRepository {
  get(userId: string): Promise<Budget>;
  save(userId: string, budget: Budget): Promise<Budget>;
}

export interface GoalRepository {
  list(userId: string): Promise<SavingsGoal[]>;
  create(userId: string, input: SavingsGoalInput): Promise<SavingsGoal>;
  update(userId: string, id: string, input: Partial<SavingsGoalInput>): Promise<SavingsGoal>;
  remove(userId: string, id: string): Promise<void>;
}

export interface RecurringRepository {
  list(userId: string): Promise<RecurringRule[]>;
  create(userId: string, input: RecurringRuleInput): Promise<RecurringRule>;
  update(userId: string, id: string, input: Partial<RecurringRuleInput>): Promise<RecurringRule>;
  remove(userId: string, id: string): Promise<void>;
}

export interface NotificationStateRepository {
  getReadIds(userId: string): Promise<string[]>;
  setReadIds(userId: string, ids: string[]): Promise<void>;
}

// ---------------------------------------------------------------------------
// HTTP helper — talks to the Next.js API routes (same-origin, cookie auth).
// ---------------------------------------------------------------------------

async function api<T>(
  url: string,
  options?: { method?: string; json?: unknown },
): Promise<T> {
  const res = await fetch(url, {
    method: options?.method ?? "GET",
    headers: options?.json !== undefined ? { "Content-Type": "application/json" } : undefined,
    body: options?.json !== undefined ? JSON.stringify(options.json) : undefined,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error((data as { error?: string })?.error ?? "Une erreur est survenue.");
  }
  return data as T;
}

// ---------------------------------------------------------------------------
// API-backed implementations (Vercel Postgres behind the routes).
// ---------------------------------------------------------------------------

class ApiAuthRepository implements AuthRepository {
  async getCurrentUser(): Promise<User | null> {
    const { user } = await api<{ user: User | null }>("/api/auth/me");
    return user;
  }
  async register(input: RegisterInput): Promise<User> {
    const { user } = await api<{ user: User }>("/api/auth/register", {
      method: "POST",
      json: input,
    });
    return user;
  }
  async login(email: string, password: string): Promise<User> {
    const { user } = await api<{ user: User }>("/api/auth/login", {
      method: "POST",
      json: { email, password },
    });
    return user;
  }
  async logout(): Promise<void> {
    await api("/api/auth/logout", { method: "POST" });
  }
  async requestPasswordReset(email: string): Promise<void> {
    await api("/api/auth/forgot-password", { method: "POST", json: { email } });
  }
  async updateProfile(_userId: string, patch: ProfilePatch): Promise<User> {
    const { user } = await api<{ user: User }>("/api/auth/profile", {
      method: "PATCH",
      json: patch,
    });
    return user;
  }
  async changePassword(_userId: string, current: string, next: string): Promise<void> {
    await api("/api/auth/change-password", { method: "POST", json: { current, next } });
  }
}

class ApiTransactionRepository implements TransactionRepository {
  async list(): Promise<Transaction[]> {
    const { transactions } = await api<{ transactions: Transaction[] }>("/api/transactions");
    return transactions;
  }
  async create(_userId: string, input: TransactionInput): Promise<Transaction> {
    const { transaction } = await api<{ transaction: Transaction }>("/api/transactions", {
      method: "POST",
      json: input,
    });
    return transaction;
  }
  async update(_userId: string, id: string, input: TransactionInput): Promise<Transaction> {
    const { transaction } = await api<{ transaction: Transaction }>(`/api/transactions/${id}`, {
      method: "PATCH",
      json: input,
    });
    return transaction;
  }
  async remove(_userId: string, id: string): Promise<void> {
    await api(`/api/transactions/${id}`, { method: "DELETE" });
  }
  async replaceAll(_userId: string, txs: Transaction[]): Promise<void> {
    await api("/api/transactions", { method: "PUT", json: { transactions: txs } });
  }
}

class ApiBudgetRepository implements BudgetRepository {
  async get(): Promise<Budget> {
    const { budget } = await api<{ budget: Budget }>("/api/budget");
    return budget;
  }
  async save(_userId: string, budget: Budget): Promise<Budget> {
    const { budget: saved } = await api<{ budget: Budget }>("/api/budget", {
      method: "PUT",
      json: budget,
    });
    return saved;
  }
}

class ApiGoalRepository implements GoalRepository {
  async list(): Promise<SavingsGoal[]> {
    const { goals } = await api<{ goals: SavingsGoal[] }>("/api/goals");
    return goals;
  }
  async create(_userId: string, input: SavingsGoalInput): Promise<SavingsGoal> {
    const { goal } = await api<{ goal: SavingsGoal }>("/api/goals", {
      method: "POST",
      json: input,
    });
    return goal;
  }
  async update(_userId: string, id: string, input: Partial<SavingsGoalInput>): Promise<SavingsGoal> {
    const { goal } = await api<{ goal: SavingsGoal }>(`/api/goals/${id}`, {
      method: "PATCH",
      json: input,
    });
    return goal;
  }
  async remove(_userId: string, id: string): Promise<void> {
    await api(`/api/goals/${id}`, { method: "DELETE" });
  }
}

class ApiRecurringRepository implements RecurringRepository {
  async list(): Promise<RecurringRule[]> {
    const { recurring } = await api<{ recurring: RecurringRule[] }>("/api/recurring");
    return recurring;
  }
  async create(_userId: string, input: RecurringRuleInput): Promise<RecurringRule> {
    const { rule } = await api<{ rule: RecurringRule }>("/api/recurring", {
      method: "POST",
      json: input,
    });
    return rule;
  }
  async update(_userId: string, id: string, input: Partial<RecurringRuleInput>): Promise<RecurringRule> {
    const { rule } = await api<{ rule: RecurringRule }>(`/api/recurring/${id}`, {
      method: "PATCH",
      json: input,
    });
    return rule;
  }
  async remove(_userId: string, id: string): Promise<void> {
    await api(`/api/recurring/${id}`, { method: "DELETE" });
  }
}

/** Notification read-state stays client-side (per-device UI state). */
class LocalNotificationStateRepository implements NotificationStateRepository {
  private key(userId: string): string {
    return `${STORAGE_KEYS.notifReadPrefix}${userId}`;
  }
  async getReadIds(userId: string): Promise<string[]> {
    return readJSON<string[]>(this.key(userId), []);
  }
  async setReadIds(userId: string, ids: string[]): Promise<void> {
    writeJSON(this.key(userId), ids);
  }
}

// ===========================================================================
//  These are the single point the app talks to. To change backend, swap the
//  implementations below — the interfaces above stay identical.
// ===========================================================================

// Set NEXT_PUBLIC_USE_API=1 (with a Postgres DB + server env) to use the real
// backend. Unset/anything-else → fully client-side localStorage mode (no DB).
const USE_API = process.env.NEXT_PUBLIC_USE_API === "1";

export const auth: AuthRepository = USE_API
  ? new ApiAuthRepository()
  : new LocalAuthRepository();
export const transactions: TransactionRepository = USE_API
  ? new ApiTransactionRepository()
  : new LocalTransactionRepository();
export const budgets: BudgetRepository = USE_API
  ? new ApiBudgetRepository()
  : new LocalBudgetRepository();
export const goals: GoalRepository = USE_API
  ? new ApiGoalRepository()
  : new LocalGoalRepository();
export const recurring: RecurringRepository = USE_API
  ? new ApiRecurringRepository()
  : new LocalRecurringRepository();
export const notificationState: NotificationStateRepository =
  new LocalNotificationStateRepository();
