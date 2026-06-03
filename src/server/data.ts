import { db, ensureSchema } from "./db";
import type {
  Budget,
  RecurringRule,
  RecurringRuleInput,
  SavingsGoal,
  SavingsGoalInput,
  Transaction,
  TransactionInput,
} from "@/lib/types";

const iso = (v: Date | string) => new Date(v).toISOString();

// ----------------------------- Transactions --------------------------------

const TX_COLS = `id, user_id, type, amount, category_id, description,
  to_char(date,'YYYY-MM-DD') AS date, payment_method, reference, created_at, updated_at`;

interface TxRow {
  id: string;
  user_id: string;
  type: string;
  amount: string;
  category_id: string;
  description: string;
  date: string;
  payment_method: string;
  reference: string | null;
  created_at: Date | string;
  updated_at: Date | string;
}

function mapTx(r: TxRow): Transaction {
  return {
    id: r.id,
    userId: r.user_id,
    type: r.type as Transaction["type"],
    amount: Number(r.amount),
    categoryId: r.category_id,
    description: r.description,
    date: r.date,
    paymentMethod: r.payment_method as Transaction["paymentMethod"],
    reference: r.reference ?? undefined,
    createdAt: iso(r.created_at),
    updatedAt: iso(r.updated_at),
  };
}

export async function listTransactions(userId: string): Promise<Transaction[]> {
  await ensureSchema();
  const { rows } = await db().query(
    `SELECT ${TX_COLS} FROM transactions WHERE user_id = $1
     ORDER BY date DESC, created_at DESC`,
    [userId],
  );
  return (rows as TxRow[]).map(mapTx);
}

export async function createTransaction(
  userId: string,
  input: TransactionInput,
): Promise<Transaction> {
  await ensureSchema();
  const { rows } = await db().query(
    `INSERT INTO transactions (user_id, type, amount, category_id, description, date, payment_method, reference)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING ${TX_COLS}`,
    [
      userId,
      input.type,
      Math.abs(input.amount),
      input.categoryId,
      input.description,
      input.date,
      input.paymentMethod,
      input.reference?.trim() || null,
    ],
  );
  return mapTx(rows[0] as TxRow);
}

export async function updateTransaction(
  userId: string,
  id: string,
  input: TransactionInput,
): Promise<Transaction | null> {
  await ensureSchema();
  const { rows } = await db().query(
    `UPDATE transactions SET type=$3, amount=$4, category_id=$5, description=$6,
       date=$7, payment_method=$8, reference=$9, updated_at=now()
     WHERE id=$1 AND user_id=$2 RETURNING ${TX_COLS}`,
    [
      id,
      userId,
      input.type,
      Math.abs(input.amount),
      input.categoryId,
      input.description,
      input.date,
      input.paymentMethod,
      input.reference?.trim() || null,
    ],
  );
  return rows[0] ? mapTx(rows[0] as TxRow) : null;
}

export async function deleteTransaction(userId: string, id: string): Promise<void> {
  await ensureSchema();
  await db().query("DELETE FROM transactions WHERE id=$1 AND user_id=$2", [id, userId]);
}

export async function deleteAllTransactions(userId: string): Promise<void> {
  await ensureSchema();
  await db().query("DELETE FROM transactions WHERE user_id=$1", [userId]);
}

// ------------------------------- Budget -------------------------------------

export async function getBudget(userId: string): Promise<Budget> {
  await ensureSchema();
  const { rows } = await db().query(
    "SELECT monthly_limit, category_limits FROM budgets WHERE user_id=$1",
    [userId],
  );
  if (!rows[0]) return { monthlyLimit: null, categoryLimits: {} };
  const row = rows[0] as { monthly_limit: string | null; category_limits: Record<string, number> };
  return {
    monthlyLimit: row.monthly_limit == null ? null : Number(row.monthly_limit),
    categoryLimits: row.category_limits ?? {},
  };
}

export async function saveBudget(userId: string, budget: Budget): Promise<Budget> {
  await ensureSchema();
  await db().query(
    `INSERT INTO budgets (user_id, monthly_limit, category_limits)
     VALUES ($1,$2,$3::jsonb)
     ON CONFLICT (user_id) DO UPDATE SET monthly_limit=$2, category_limits=$3::jsonb`,
    [userId, budget.monthlyLimit, JSON.stringify(budget.categoryLimits ?? {})],
  );
  return getBudget(userId);
}

// -------------------------------- Goals -------------------------------------

interface GoalRow {
  id: string;
  user_id: string;
  name: string;
  target: string;
  saved: string;
  deadline: string | null;
  color: string;
  created_at: Date | string;
}
const GOAL_COLS = `id, user_id, name, target, saved, to_char(deadline,'YYYY-MM-DD') AS deadline, color, created_at`;

function mapGoal(r: GoalRow): SavingsGoal {
  return {
    id: r.id,
    userId: r.user_id,
    name: r.name,
    target: Number(r.target),
    saved: Number(r.saved),
    deadline: r.deadline ?? undefined,
    color: r.color,
    createdAt: iso(r.created_at),
  };
}

export async function listGoals(userId: string): Promise<SavingsGoal[]> {
  await ensureSchema();
  const { rows } = await db().query(
    `SELECT ${GOAL_COLS} FROM goals WHERE user_id=$1 ORDER BY created_at ASC`,
    [userId],
  );
  return (rows as GoalRow[]).map(mapGoal);
}

export async function createGoal(
  userId: string,
  input: SavingsGoalInput,
): Promise<SavingsGoal> {
  await ensureSchema();
  const { rows } = await db().query(
    `INSERT INTO goals (user_id, name, target, saved, deadline, color)
     VALUES ($1,$2,$3,$4,$5,$6) RETURNING ${GOAL_COLS}`,
    [userId, input.name, input.target, input.saved ?? 0, input.deadline || null, input.color],
  );
  return mapGoal(rows[0] as GoalRow);
}

export async function updateGoal(
  userId: string,
  id: string,
  input: Partial<SavingsGoalInput>,
): Promise<SavingsGoal | null> {
  await ensureSchema();
  const { rows } = await db().query(
    `UPDATE goals SET
       name = COALESCE($3, name),
       target = COALESCE($4, target),
       saved = COALESCE($5, saved),
       deadline = CASE WHEN $6::boolean THEN $7 ELSE deadline END,
       color = COALESCE($8, color)
     WHERE id=$1 AND user_id=$2 RETURNING ${GOAL_COLS}`,
    [
      id,
      userId,
      input.name ?? null,
      input.target ?? null,
      input.saved ?? null,
      input.deadline !== undefined,
      input.deadline || null,
      input.color ?? null,
    ],
  );
  return rows[0] ? mapGoal(rows[0] as GoalRow) : null;
}

export async function deleteGoal(userId: string, id: string): Promise<void> {
  await ensureSchema();
  await db().query("DELETE FROM goals WHERE id=$1 AND user_id=$2", [id, userId]);
}

// ------------------------------ Recurring -----------------------------------

interface RecRow {
  id: string;
  user_id: string;
  type: string;
  amount: string;
  category_id: string;
  description: string;
  payment_method: string;
  frequency: string;
  next_date: string;
  active: boolean;
  created_at: Date | string;
}
const REC_COLS = `id, user_id, type, amount, category_id, description, payment_method,
  frequency, to_char(next_date,'YYYY-MM-DD') AS next_date, active, created_at`;

function mapRec(r: RecRow): RecurringRule {
  return {
    id: r.id,
    userId: r.user_id,
    type: r.type as RecurringRule["type"],
    amount: Number(r.amount),
    categoryId: r.category_id,
    description: r.description,
    paymentMethod: r.payment_method as RecurringRule["paymentMethod"],
    frequency: r.frequency as RecurringRule["frequency"],
    nextDate: r.next_date,
    active: r.active,
    createdAt: iso(r.created_at),
  };
}

export async function listRecurring(userId: string): Promise<RecurringRule[]> {
  await ensureSchema();
  const { rows } = await db().query(
    `SELECT ${REC_COLS} FROM recurring WHERE user_id=$1 ORDER BY created_at ASC`,
    [userId],
  );
  return (rows as RecRow[]).map(mapRec);
}

export async function createRecurring(
  userId: string,
  input: RecurringRuleInput,
): Promise<RecurringRule> {
  await ensureSchema();
  const { rows } = await db().query(
    `INSERT INTO recurring (user_id, type, amount, category_id, description, payment_method, frequency, next_date, active)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING ${REC_COLS}`,
    [
      userId,
      input.type,
      Math.abs(input.amount),
      input.categoryId,
      input.description,
      input.paymentMethod,
      input.frequency,
      input.nextDate,
      input.active,
    ],
  );
  return mapRec(rows[0] as RecRow);
}

export async function updateRecurring(
  userId: string,
  id: string,
  input: Partial<RecurringRuleInput>,
): Promise<RecurringRule | null> {
  await ensureSchema();
  const { rows } = await db().query(
    `UPDATE recurring SET
       type = COALESCE($3, type),
       amount = COALESCE($4, amount),
       category_id = COALESCE($5, category_id),
       description = COALESCE($6, description),
       payment_method = COALESCE($7, payment_method),
       frequency = COALESCE($8, frequency),
       next_date = COALESCE($9, next_date),
       active = COALESCE($10, active)
     WHERE id=$1 AND user_id=$2 RETURNING ${REC_COLS}`,
    [
      id,
      userId,
      input.type ?? null,
      input.amount ?? null,
      input.categoryId ?? null,
      input.description ?? null,
      input.paymentMethod ?? null,
      input.frequency ?? null,
      input.nextDate ?? null,
      input.active ?? null,
    ],
  );
  return rows[0] ? mapRec(rows[0] as RecRow) : null;
}

export async function deleteRecurring(userId: string, id: string): Promise<void> {
  await ensureSchema();
  await db().query("DELETE FROM recurring WHERE id=$1 AND user_id=$2", [id, userId]);
}
