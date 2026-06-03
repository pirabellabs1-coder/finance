"use client";

import { useMemo } from "react";
import {
  CalendarDays,
  Coins,
  PiggyBank,
  Repeat,
  TrendingDown,
  TrendingUp,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { StatCard } from "@/components/dashboard/StatCard";
import { MonthlyBars } from "@/components/charts/MonthlyBars";
import { CategoryGlyph } from "@/components/CategoryIcon";
import { useAuth } from "@/context/AuthContext";
import { useData } from "@/context/DataContext";
import { getCategory } from "@/lib/constants";
import { formatCurrency, formatPercent } from "@/lib/format";
import {
  compare,
  computeTotals,
  filterMonth,
  filterWeek,
  recurringExpenses,
  topCategory,
  weeklySeries,
} from "@/lib/stats";

export default function StatistiquesPage() {
  const { transactions, loading } = useData();
  const { user } = useAuth();
  const currency = user?.currency;

  const stats = useMemo(() => {
    const now = new Date();
    const prevMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);

    const weekItems = filterWeek(transactions, now);
    const week = computeTotals(weekItems);
    const weekTop = topCategory(weekItems, "expense");

    const monthItems = filterMonth(transactions, now);
    const prevItems = filterMonth(transactions, prevMonth);
    const month = computeTotals(monthItems);
    const prev = computeTotals(prevItems);

    return {
      week,
      weekTop,
      weekSeries: weeklySeries(transactions, now).map((d) => ({
        label: d.label,
        income: d.income,
        expense: d.expense,
      })),
      month,
      expenseTrend: compare(month.expense, prev.expense).change,
      incomeTrend: compare(month.income, prev.income).change,
      savings: month.income - month.expense,
      savingsRate: month.income > 0 ? (month.income - month.expense) / month.income : null,
      avgDailyExpense: month.expense / now.getDate(),
      recurring: recurringExpenses(transactions).slice(0, 6),
    };
  }, [transactions]);

  if (loading) {
    return <div className="h-64 animate-pulse rounded-2xl bg-muted" />;
  }

  if (transactions.length === 0) {
    return (
      <EmptyState
        icon={<TrendingUp className="h-6 w-6" />}
        title="Pas encore de statistiques"
        description="Ajoutez quelques transactions pour débloquer vos analyses hebdomadaires et mensuelles."
      />
    );
  }

  const weekTopCategory = stats.weekTop
    ? getCategory(stats.weekTop.categoryId)
    : null;

  return (
    <div className="space-y-8">
      {/* Weekly */}
      <section className="space-y-4">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          Cette semaine
        </h2>
        <div className="grid gap-4 sm:grid-cols-3">
          <StatCard
            label="Dépensé cette semaine"
            value={formatCurrency(stats.week.expense, currency)}
            icon={<TrendingDown className="h-5 w-5" />}
            iconClassName="bg-expense/10 text-expense"
          />
          <StatCard
            label="Gagné cette semaine"
            value={formatCurrency(stats.week.income, currency)}
            icon={<TrendingUp className="h-5 w-5" />}
            iconClassName="bg-income/10 text-income"
          />
          <StatCard
            label="Catégorie la plus coûteuse"
            value={weekTopCategory?.label ?? "—"}
            icon={<Coins className="h-5 w-5" />}
            iconClassName="bg-primary/10 text-primary"
          />
        </div>
        <Card>
          <CardHeader>
            <CardTitle>Évolution de la semaine</CardTitle>
          </CardHeader>
          <CardContent>
            <MonthlyBars data={stats.weekSeries} />
          </CardContent>
        </Card>
      </section>

      {/* Monthly */}
      <section className="space-y-4">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          Ce mois-ci
        </h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            label="Dépenses du mois"
            value={formatCurrency(stats.month.expense, currency)}
            icon={<TrendingDown className="h-5 w-5" />}
            iconClassName="bg-expense/10 text-expense"
            trend={stats.expenseTrend}
            positiveIsGood={false}
          />
          <StatCard
            label="Revenus du mois"
            value={formatCurrency(stats.month.income, currency)}
            icon={<TrendingUp className="h-5 w-5" />}
            iconClassName="bg-income/10 text-income"
            trend={stats.incomeTrend}
            positiveIsGood
          />
          <StatCard
            label="Épargne estimée"
            value={formatCurrency(stats.savings, currency)}
            icon={<PiggyBank className="h-5 w-5" />}
            iconClassName="bg-primary/10 text-primary"
          />
          <StatCard
            label="Dépense moyenne / jour"
            value={formatCurrency(stats.avgDailyExpense, currency)}
            icon={<CalendarDays className="h-5 w-5" />}
            iconClassName="bg-muted text-muted-foreground"
          />
        </div>

        {stats.savingsRate !== null && (
          <Card>
            <CardContent className="flex flex-wrap items-center justify-between gap-3 p-5">
              <div>
                <p className="text-sm font-medium text-foreground">
                  Taux d’épargne
                </p>
                <p className="text-xs text-muted-foreground">
                  Part de vos revenus du mois qui n’a pas été dépensée.
                </p>
              </div>
              <p
                className={`text-2xl font-bold tabular-nums ${
                  stats.savings >= 0 ? "text-income" : "text-expense"
                }`}
              >
                {formatPercent(stats.savingsRate, 0)}
              </p>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Dépenses récurrentes</CardTitle>
          </CardHeader>
          <CardContent className="pt-2">
            {stats.recurring.length === 0 ? (
              <p className="py-6 text-center text-sm text-muted-foreground">
                Aucune dépense récurrente détectée pour l’instant.
              </p>
            ) : (
              <ul className="space-y-0.5">
                {stats.recurring.map((tx) => {
                  const category = getCategory(tx.categoryId);
                  const color = category?.color ?? "#94a3b8";
                  return (
                    <li
                      key={tx.id}
                      className="flex items-center gap-3 rounded-xl px-2 py-2"
                    >
                      <span
                        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full"
                        style={{ backgroundColor: `${color}1a`, color }}
                      >
                        <CategoryGlyph
                          icon={category?.icon ?? "package"}
                          className="h-4 w-4"
                        />
                      </span>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-foreground">
                          {tx.description}
                        </span>
                        <span className="flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-[11px] text-muted-foreground">
                          <Repeat className="h-3 w-3" />
                          récurrent
                        </span>
                      </div>
                      <span className="ml-auto text-sm font-semibold tabular-nums text-foreground">
                        {formatCurrency(tx.amount, currency)}
                      </span>
                    </li>
                  );
                })}
              </ul>
            )}
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
