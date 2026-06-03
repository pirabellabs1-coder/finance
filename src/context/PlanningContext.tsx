"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import {
  budgets as budgetRepo,
  goals as goalRepo,
  notificationState as notifRepo,
  recurring as recurringRepo,
} from "@/lib/repositories";
import { getCategory } from "@/lib/constants";
import { formatCurrency } from "@/lib/format";
import {
  addDays,
  breakdownByCategory,
  computeTotals,
  filterMonth,
  isoFromDate,
  monthKey,
  nextOccurrence,
} from "@/lib/stats";
import type {
  Budget,
  NotificationItem,
  RecurringRule,
  RecurringRuleInput,
  SavingsGoal,
  SavingsGoalInput,
  TransactionInput,
} from "@/lib/types";
import { useAuth } from "./AuthContext";
import { useData } from "./DataContext";

interface PlanningContextValue {
  loading: boolean;
  budget: Budget;
  goals: SavingsGoal[];
  recurring: RecurringRule[];
  notifications: NotificationItem[];
  readIds: string[];
  unreadCount: number;
  setMonthlyLimit: (limit: number | null) => Promise<void>;
  setCategoryLimit: (categoryId: string, limit: number | null) => Promise<void>;
  addGoal: (input: SavingsGoalInput) => Promise<void>;
  editGoal: (id: string, input: Partial<SavingsGoalInput>) => Promise<void>;
  removeGoal: (id: string) => Promise<void>;
  contributeGoal: (id: string, amount: number) => Promise<void>;
  addRecurring: (input: RecurringRuleInput) => Promise<void>;
  editRecurring: (id: string, input: Partial<RecurringRuleInput>) => Promise<void>;
  removeRecurring: (id: string) => Promise<void>;
  toggleRecurring: (id: string) => Promise<void>;
  markRead: (id: string) => Promise<void>;
  markAllRead: () => Promise<void>;
}

const PlanningContext = createContext<PlanningContextValue | undefined>(undefined);

const EMPTY_BUDGET: Budget = { monthlyLimit: null, categoryLimits: {} };

export function PlanningProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const userId = user?.id ?? null;
  const currency = user?.currency;
  const { transactions, addMany } = useData();

  const [budget, setBudget] = useState<Budget>(EMPTY_BUDGET);
  const [goals, setGoals] = useState<SavingsGoal[]>([]);
  const [recurring, setRecurring] = useState<RecurringRule[]>([]);
  const [readIds, setReadIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const generatedFor = useRef<string | null>(null);

  useEffect(() => {
    let active = true;
    if (!userId) {
      setBudget(EMPTY_BUDGET);
      setGoals([]);
      setRecurring([]);
      setReadIds([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    Promise.all([
      budgetRepo.get(userId),
      goalRepo.list(userId),
      recurringRepo.list(userId),
      notifRepo.getReadIds(userId),
    ])
      .then(([b, g, r, ids]) => {
        if (!active) return;
        setBudget(b);
        setGoals(g);
        setRecurring(r);
        setReadIds(ids);
        setLoading(false);
      })
      .catch(() => {
        if (!active) return;
        setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [userId]);

  // Materialize any due recurring occurrences, once per user load.
  useEffect(() => {
    if (!userId || loading) return;
    if (generatedFor.current === userId) return;
    generatedFor.current = userId;

    const today = isoFromDate(new Date());
    const generated: TransactionInput[] = [];
    const updated = recurring.map((rule) => {
      if (!rule.active) return rule;
      let next = rule.nextDate;
      let guard = 0;
      while (next <= today && guard < 60) {
        generated.push({
          type: rule.type,
          amount: rule.amount,
          categoryId: rule.categoryId,
          description: rule.description,
          date: next,
          paymentMethod: rule.paymentMethod,
        });
        next = nextOccurrence(next, rule.frequency);
        guard++;
      }
      return next === rule.nextDate ? rule : { ...rule, nextDate: next };
    });

    if (generated.length === 0) return;

    (async () => {
      for (const rule of updated) {
        const original = recurring.find((r) => r.id === rule.id);
        if (original && original.nextDate !== rule.nextDate) {
          await recurringRepo.update(userId, rule.id, { nextDate: rule.nextDate });
        }
      }
      setRecurring(updated);
      await addMany(generated);
    })();
  }, [userId, loading, recurring, addMany]);

  const persistBudget = useCallback(
    async (next: Budget) => {
      if (!userId) return;
      setBudget(next);
      await budgetRepo.save(userId, next);
    },
    [userId],
  );

  const setMonthlyLimit = useCallback(
    (limit: number | null) => persistBudget({ ...budget, monthlyLimit: limit }),
    [budget, persistBudget],
  );

  const setCategoryLimit = useCallback(
    (categoryId: string, limit: number | null) => {
      const categoryLimits = { ...budget.categoryLimits };
      if (limit == null || limit <= 0) delete categoryLimits[categoryId];
      else categoryLimits[categoryId] = limit;
      return persistBudget({ ...budget, categoryLimits });
    },
    [budget, persistBudget],
  );

  const addGoal = useCallback(
    async (input: SavingsGoalInput) => {
      if (!userId) return;
      const goal = await goalRepo.create(userId, input);
      setGoals((s) => [...s, goal]);
    },
    [userId],
  );

  const editGoal = useCallback(
    async (id: string, input: Partial<SavingsGoalInput>) => {
      if (!userId) return;
      const goal = await goalRepo.update(userId, id, input);
      setGoals((s) => s.map((g) => (g.id === id ? goal : g)));
    },
    [userId],
  );

  const removeGoal = useCallback(
    async (id: string) => {
      if (!userId) return;
      await goalRepo.remove(userId, id);
      setGoals((s) => s.filter((g) => g.id !== id));
    },
    [userId],
  );

  const contributeGoal = useCallback(
    async (id: string, amount: number) => {
      if (!userId) return;
      const goal = goals.find((g) => g.id === id);
      if (!goal) return;
      const saved = Math.max(0, Math.round((goal.saved + amount) * 100) / 100);
      const updated = await goalRepo.update(userId, id, { saved });
      setGoals((s) => s.map((g) => (g.id === id ? updated : g)));
    },
    [userId, goals],
  );

  const addRecurring = useCallback(
    async (input: RecurringRuleInput) => {
      if (!userId) return;
      const rule = await recurringRepo.create(userId, input);
      setRecurring((s) => [...s, rule]);
    },
    [userId],
  );

  const editRecurring = useCallback(
    async (id: string, input: Partial<RecurringRuleInput>) => {
      if (!userId) return;
      const rule = await recurringRepo.update(userId, id, input);
      setRecurring((s) => s.map((r) => (r.id === id ? rule : r)));
    },
    [userId],
  );

  const removeRecurring = useCallback(
    async (id: string) => {
      if (!userId) return;
      await recurringRepo.remove(userId, id);
      setRecurring((s) => s.filter((r) => r.id !== id));
    },
    [userId],
  );

  const toggleRecurring = useCallback(
    async (id: string) => {
      if (!userId) return;
      const rule = recurring.find((r) => r.id === id);
      if (!rule) return;
      const updated = await recurringRepo.update(userId, id, { active: !rule.active });
      setRecurring((s) => s.map((r) => (r.id === id ? updated : r)));
    },
    [userId, recurring],
  );

  const notifications = useMemo<NotificationItem[]>(() => {
    const now = new Date();
    const mKey = monthKey(now);
    const monthItems = filterMonth(transactions, now);
    const monthExpense = computeTotals(monthItems).expense;
    const list: NotificationItem[] = [];

    if (budget.monthlyLimit && budget.monthlyLimit > 0) {
      const ratio = monthExpense / budget.monthlyLimit;
      if (ratio >= 1) {
        list.push({
          id: `budget-over-${mKey}`,
          severity: "danger",
          title: "Budget mensuel dépassé",
          message: `Vous avez dépensé ${formatCurrency(monthExpense, currency)} sur ${formatCurrency(budget.monthlyLimit, currency)}.`,
          href: "/budgets",
        });
      } else if (ratio >= 0.8) {
        list.push({
          id: `budget-warn-${mKey}`,
          severity: "warning",
          title: "Budget mensuel presque atteint",
          message: `${Math.round(ratio * 100)} % de votre budget est consommé.`,
          href: "/budgets",
        });
      }
    }

    const spentByCategory = new Map(
      breakdownByCategory(monthItems, "expense").map((s) => [s.categoryId, s.total]),
    );
    for (const [categoryId, limit] of Object.entries(budget.categoryLimits)) {
      if (!limit || limit <= 0) continue;
      const spent = spentByCategory.get(categoryId) ?? 0;
      const ratio = spent / limit;
      const label = getCategory(categoryId)?.label ?? categoryId;
      if (ratio >= 1) {
        list.push({
          id: `catbudget-over-${categoryId}-${mKey}`,
          severity: "danger",
          title: `Budget « ${label} » dépassé`,
          message: `${formatCurrency(spent, currency)} dépensés sur ${formatCurrency(limit, currency)}.`,
          href: "/budgets",
        });
      } else if (ratio >= 0.8) {
        list.push({
          id: `catbudget-warn-${categoryId}-${mKey}`,
          severity: "warning",
          title: `Budget « ${label} » presque atteint`,
          message: `${Math.round(ratio * 100)} % consommé.`,
          href: "/budgets",
        });
      }
    }

    const soon = isoFromDate(addDays(now, 7));
    const today = isoFromDate(now);
    for (const rule of recurring) {
      if (!rule.active) continue;
      if (rule.nextDate <= soon) {
        const overdue = rule.nextDate < today;
        list.push({
          id: `recurring-${rule.id}-${rule.nextDate}`,
          severity: overdue ? "warning" : "info",
          title: overdue ? "Échéance récurrente à régulariser" : "Échéance récurrente à venir",
          message: `${rule.description} — ${formatCurrency(rule.amount, currency)} le ${rule.nextDate.split("-").reverse().join("/")}.`,
          href: "/recurrences",
        });
      }
    }

    return list;
  }, [transactions, budget, recurring, currency]);

  const unreadCount = useMemo(
    () => notifications.filter((n) => !readIds.includes(n.id)).length,
    [notifications, readIds],
  );

  const markRead = useCallback(
    async (id: string) => {
      if (!userId || readIds.includes(id)) return;
      const next = [...readIds, id];
      setReadIds(next);
      await notifRepo.setReadIds(userId, next);
    },
    [userId, readIds],
  );

  const markAllRead = useCallback(async () => {
    if (!userId) return;
    const next = Array.from(new Set([...readIds, ...notifications.map((n) => n.id)]));
    setReadIds(next);
    await notifRepo.setReadIds(userId, next);
  }, [userId, readIds, notifications]);

  const value = useMemo<PlanningContextValue>(
    () => ({
      loading,
      budget,
      goals,
      recurring,
      notifications,
      readIds,
      unreadCount,
      setMonthlyLimit,
      setCategoryLimit,
      addGoal,
      editGoal,
      removeGoal,
      contributeGoal,
      addRecurring,
      editRecurring,
      removeRecurring,
      toggleRecurring,
      markRead,
      markAllRead,
    }),
    [
      loading,
      budget,
      goals,
      recurring,
      notifications,
      readIds,
      unreadCount,
      setMonthlyLimit,
      setCategoryLimit,
      addGoal,
      editGoal,
      removeGoal,
      contributeGoal,
      addRecurring,
      editRecurring,
      removeRecurring,
      toggleRecurring,
      markRead,
      markAllRead,
    ],
  );

  return <PlanningContext.Provider value={value}>{children}</PlanningContext.Provider>;
}

export function usePlanning() {
  const ctx = useContext(PlanningContext);
  if (!ctx)
    throw new Error("usePlanning doit être utilisé dans un PlanningProvider");
  return ctx;
}
