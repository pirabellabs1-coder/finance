// localStorage implementations — used when NEXT_PUBLIC_USE_API is not "1".
// This lets the app run (and deploy) with zero backend. When the API backend is
// enabled, these are not instantiated.

import { hashPassword, verifyPassword } from "./crypto";
import { readJSON, removeKey, STORAGE_KEYS, uid, writeJSON } from "./storage";
import type {
  AuthRepository,
  BudgetRepository,
  GoalRepository,
  RecurringRepository,
  TransactionRepository,
} from "./repositories";
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

interface StoredUser extends User {
  passwordHash: string;
}

function loadUsers(): StoredUser[] {
  return readJSON<StoredUser[]>(STORAGE_KEYS.users, []);
}
function saveUsers(users: StoredUser[]): void {
  writeJSON(STORAGE_KEYS.users, users);
}
function toPublicUser(stored: StoredUser): User {
  return {
    id: stored.id,
    firstName: stored.firstName,
    lastName: stored.lastName,
    email: stored.email,
    currency: stored.currency,
    avatar: stored.avatar,
    emailAlerts: stored.emailAlerts ?? true,
    createdAt: stored.createdAt,
  };
}
function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

export class LocalAuthRepository implements AuthRepository {
  async getCurrentUser(): Promise<User | null> {
    const id = readJSON<string | null>(STORAGE_KEYS.session, null);
    if (!id) return null;
    const user = loadUsers().find((u) => u.id === id);
    return user ? toPublicUser(user) : null;
  }
  async register(input: RegisterInput): Promise<User> {
    const email = normalizeEmail(input.email);
    const users = loadUsers();
    if (users.some((u) => u.email === email)) {
      throw new Error("Un compte existe déjà avec cet email.");
    }
    const stored: StoredUser = {
      id: uid("usr"),
      firstName: input.firstName.trim(),
      lastName: input.lastName.trim(),
      email,
      currency: input.currency,
      emailAlerts: true,
      createdAt: new Date().toISOString(),
      passwordHash: await hashPassword(input.password),
    };
    users.push(stored);
    saveUsers(users);
    writeJSON(STORAGE_KEYS.session, stored.id);
    return toPublicUser(stored);
  }
  async login(email: string, password: string): Promise<User> {
    const normalized = normalizeEmail(email);
    const user = loadUsers().find((u) => u.email === normalized);
    if (!user || !(await verifyPassword(password, user.passwordHash))) {
      throw new Error("Email ou mot de passe incorrect.");
    }
    writeJSON(STORAGE_KEYS.session, user.id);
    return toPublicUser(user);
  }
  async logout(): Promise<void> {
    removeKey(STORAGE_KEYS.session);
  }
  async requestPasswordReset(email: string): Promise<void> {
    // No server in local mode — nothing is sent.
    void email;
  }
  async updateProfile(userId: string, patch: ProfilePatch): Promise<User> {
    const users = loadUsers();
    const idx = users.findIndex((u) => u.id === userId);
    if (idx === -1) throw new Error("Utilisateur introuvable.");
    const current = users[idx];
    users[idx] = {
      ...current,
      firstName: patch.firstName?.trim() ?? current.firstName,
      lastName: patch.lastName?.trim() ?? current.lastName,
      currency: patch.currency ?? current.currency,
      avatar: patch.avatar !== undefined ? patch.avatar : current.avatar,
      emailAlerts: patch.emailAlerts ?? current.emailAlerts ?? true,
    };
    saveUsers(users);
    return toPublicUser(users[idx]);
  }
  async changePassword(userId: string, current: string, next: string): Promise<void> {
    const users = loadUsers();
    const idx = users.findIndex((u) => u.id === userId);
    if (idx === -1) throw new Error("Utilisateur introuvable.");
    if (!(await verifyPassword(current, users[idx].passwordHash))) {
      throw new Error("Le mot de passe actuel est incorrect.");
    }
    users[idx].passwordHash = await hashPassword(next);
    saveUsers(users);
  }
}

export class LocalTransactionRepository implements TransactionRepository {
  private key(userId: string): string {
    return `${STORAGE_KEYS.txPrefix}${userId}`;
  }
  async list(userId: string): Promise<Transaction[]> {
    return readJSON<Transaction[]>(this.key(userId), []);
  }
  async create(userId: string, input: TransactionInput): Promise<Transaction> {
    const now = new Date().toISOString();
    const tx: Transaction = {
      ...input,
      amount: Math.abs(input.amount),
      reference: input.reference?.trim() || undefined,
      id: uid("tx"),
      userId,
      createdAt: now,
      updatedAt: now,
    };
    const txs = await this.list(userId);
    txs.push(tx);
    writeJSON(this.key(userId), txs);
    return tx;
  }
  async update(userId: string, id: string, input: TransactionInput): Promise<Transaction> {
    const txs = await this.list(userId);
    const idx = txs.findIndex((t) => t.id === id);
    if (idx === -1) throw new Error("Transaction introuvable.");
    const updated: Transaction = {
      ...txs[idx],
      ...input,
      amount: Math.abs(input.amount),
      reference: input.reference?.trim() || undefined,
      updatedAt: new Date().toISOString(),
    };
    txs[idx] = updated;
    writeJSON(this.key(userId), txs);
    return updated;
  }
  async remove(userId: string, id: string): Promise<void> {
    const txs = (await this.list(userId)).filter((t) => t.id !== id);
    writeJSON(this.key(userId), txs);
  }
  async replaceAll(userId: string, txs: Transaction[]): Promise<void> {
    writeJSON(this.key(userId), txs);
  }
}

export class LocalBudgetRepository implements BudgetRepository {
  private key(userId: string): string {
    return `${STORAGE_KEYS.budgetPrefix}${userId}`;
  }
  async get(userId: string): Promise<Budget> {
    return readJSON<Budget>(this.key(userId), { monthlyLimit: null, categoryLimits: {} });
  }
  async save(userId: string, budget: Budget): Promise<Budget> {
    writeJSON(this.key(userId), budget);
    return budget;
  }
}

export class LocalGoalRepository implements GoalRepository {
  private key(userId: string): string {
    return `${STORAGE_KEYS.goalsPrefix}${userId}`;
  }
  async list(userId: string): Promise<SavingsGoal[]> {
    return readJSON<SavingsGoal[]>(this.key(userId), []);
  }
  async create(userId: string, input: SavingsGoalInput): Promise<SavingsGoal> {
    const goal: SavingsGoal = {
      ...input,
      id: uid("goal"),
      userId,
      createdAt: new Date().toISOString(),
    };
    const goals = await this.list(userId);
    goals.push(goal);
    writeJSON(this.key(userId), goals);
    return goal;
  }
  async update(
    userId: string,
    id: string,
    input: Partial<SavingsGoalInput>,
  ): Promise<SavingsGoal> {
    const goals = await this.list(userId);
    const idx = goals.findIndex((g) => g.id === id);
    if (idx === -1) throw new Error("Objectif introuvable.");
    goals[idx] = { ...goals[idx], ...input };
    writeJSON(this.key(userId), goals);
    return goals[idx];
  }
  async remove(userId: string, id: string): Promise<void> {
    const goals = (await this.list(userId)).filter((g) => g.id !== id);
    writeJSON(this.key(userId), goals);
  }
}

export class LocalRecurringRepository implements RecurringRepository {
  private key(userId: string): string {
    return `${STORAGE_KEYS.recurringPrefix}${userId}`;
  }
  async list(userId: string): Promise<RecurringRule[]> {
    return readJSON<RecurringRule[]>(this.key(userId), []);
  }
  async create(userId: string, input: RecurringRuleInput): Promise<RecurringRule> {
    const rule: RecurringRule = {
      ...input,
      amount: Math.abs(input.amount),
      id: uid("rec"),
      userId,
      createdAt: new Date().toISOString(),
    };
    const rules = await this.list(userId);
    rules.push(rule);
    writeJSON(this.key(userId), rules);
    return rule;
  }
  async update(
    userId: string,
    id: string,
    input: Partial<RecurringRuleInput>,
  ): Promise<RecurringRule> {
    const rules = await this.list(userId);
    const idx = rules.findIndex((r) => r.id === id);
    if (idx === -1) throw new Error("Règle introuvable.");
    rules[idx] = { ...rules[idx], ...input };
    if (input.amount !== undefined) rules[idx].amount = Math.abs(input.amount);
    writeJSON(this.key(userId), rules);
    return rules[idx];
  }
  async remove(userId: string, id: string): Promise<void> {
    const rules = (await this.list(userId)).filter((r) => r.id !== id);
    writeJSON(this.key(userId), rules);
  }
}
