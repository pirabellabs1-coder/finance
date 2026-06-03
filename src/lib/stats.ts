import type { RecurrenceFrequency, Transaction, TransactionType } from "./types";

export interface Totals {
  income: number;
  expense: number;
  balance: number;
}

export function computeTotals(txs: Transaction[]): Totals {
  let income = 0;
  let expense = 0;
  for (const t of txs) {
    if (t.type === "income") income += t.amount;
    else expense += t.amount;
  }
  return { income, expense, balance: income - expense };
}

// --- Date helpers (all local-time, working from `YYYY-MM-DD` strings) --------

export function isoFromDate(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
    d.getDate(),
  ).padStart(2, "0")}`;
}

export function parseISO(iso: string): Date {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y ?? 1970, (m ?? 1) - 1, d ?? 1);
}

export function monthKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

export function isoMonthKey(iso: string): string {
  return iso.slice(0, 7);
}

export function startOfWeek(ref: Date): Date {
  const d = new Date(ref.getFullYear(), ref.getMonth(), ref.getDate());
  const offset = (d.getDay() + 6) % 7; // Monday = 0
  d.setDate(d.getDate() - offset);
  return d;
}

export function addDays(d: Date, n: number): Date {
  const r = new Date(d);
  r.setDate(r.getDate() + n);
  return r;
}

/** The next date after `iso` for a recurrence frequency, as an ISO string. */
export function nextOccurrence(
  iso: string,
  frequency: RecurrenceFrequency,
): string {
  const d = parseISO(iso);
  if (frequency === "weekly") d.setDate(d.getDate() + 7);
  else d.setMonth(d.getMonth() + 1);
  return isoFromDate(d);
}

export function inRange(iso: string, start: Date, end: Date): boolean {
  const d = parseISO(iso);
  return d >= start && d < end;
}

export function inMonth(iso: string, ref: Date): boolean {
  return isoMonthKey(iso) === monthKey(ref);
}

// --- Aggregations ------------------------------------------------------------

export interface CategorySlice {
  categoryId: string;
  total: number;
}

export function breakdownByCategory(
  txs: Transaction[],
  type: TransactionType,
): CategorySlice[] {
  const map = new Map<string, number>();
  for (const t of txs) {
    if (t.type !== type) continue;
    map.set(t.categoryId, (map.get(t.categoryId) ?? 0) + t.amount);
  }
  return Array.from(map, ([categoryId, total]) => ({ categoryId, total })).sort(
    (a, b) => b.total - a.total,
  );
}

export function topCategory(
  txs: Transaction[],
  type: TransactionType,
): CategorySlice | null {
  return breakdownByCategory(txs, type)[0] ?? null;
}

export interface MonthPoint {
  key: string;
  label: string;
  income: number;
  expense: number;
}

/** A series covering the last `months` months ending on `ref`'s month. */
export function monthlySeries(
  txs: Transaction[],
  months: number,
  ref: Date,
): MonthPoint[] {
  const fmt = new Intl.DateTimeFormat("fr-FR", { month: "short" });
  const points: MonthPoint[] = [];
  for (let i = months - 1; i >= 0; i--) {
    const d = new Date(ref.getFullYear(), ref.getMonth() - i, 1);
    points.push({ key: monthKey(d), label: fmt.format(d), income: 0, expense: 0 });
  }
  const index = new Map(points.map((p) => [p.key, p]));
  for (const t of txs) {
    const point = index.get(isoMonthKey(t.date));
    if (!point) continue;
    if (t.type === "income") point.income += t.amount;
    else point.expense += t.amount;
  }
  return points;
}

export interface DayPoint {
  date: string;
  label: string;
  income: number;
  expense: number;
}

/** Seven daily points for the week containing `ref` (Monday → Sunday). */
export function weeklySeries(txs: Transaction[], ref: Date): DayPoint[] {
  const start = startOfWeek(ref);
  const fmt = new Intl.DateTimeFormat("fr-FR", { weekday: "short" });
  const days: DayPoint[] = [];
  for (let i = 0; i < 7; i++) {
    const d = addDays(start, i);
    days.push({ date: isoFromDate(d), label: fmt.format(d), income: 0, expense: 0 });
  }
  const index = new Map(days.map((d) => [d.date, d]));
  for (const t of txs) {
    const point = index.get(t.date);
    if (!point) continue;
    if (t.type === "income") point.income += t.amount;
    else point.expense += t.amount;
  }
  return days;
}

export function filterMonth(txs: Transaction[], ref: Date): Transaction[] {
  return txs.filter((t) => inMonth(t.date, ref));
}

export function filterWeek(txs: Transaction[], ref: Date): Transaction[] {
  const start = startOfWeek(ref);
  const end = addDays(start, 7);
  return txs.filter((t) => inRange(t.date, start, end));
}

export interface Comparison {
  current: number;
  previous: number;
  /** Signed ratio of change, e.g. 0.12 = +12 %. null when previous is 0. */
  change: number | null;
}

export function compare(current: number, previous: number): Comparison {
  const change = previous === 0 ? null : (current - previous) / previous;
  return { current, previous, change };
}

/**
 * Detect recurring expenses: same category + similar label appearing in two or
 * more distinct months. Returns the most recent matching transaction per group.
 */
export function recurringExpenses(txs: Transaction[]): Transaction[] {
  const groups = new Map<string, { months: Set<string>; latest: Transaction }>();
  for (const t of txs) {
    if (t.type !== "expense") continue;
    const key = `${t.categoryId}::${t.description.trim().toLowerCase()}`;
    const entry = groups.get(key);
    if (entry) {
      entry.months.add(isoMonthKey(t.date));
      if (t.date > entry.latest.date) entry.latest = t;
    } else {
      groups.set(key, { months: new Set([isoMonthKey(t.date)]), latest: t });
    }
  }
  return Array.from(groups.values())
    .filter((g) => g.months.size >= 2)
    .map((g) => g.latest)
    .sort((a, b) => b.amount - a.amount);
}
