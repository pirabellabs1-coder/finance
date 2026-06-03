"use client";

import { useMemo } from "react";
import Link from "next/link";
import {
  Gauge,
  PiggyBank,
  Plus,
  Repeat,
  Target,
  TrendingDown,
  TrendingUp,
  Wallet,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { StatCard } from "@/components/dashboard/StatCard";
import { BudgetCard } from "@/components/dashboard/BudgetCard";
import { DonutChart } from "@/components/charts/DonutChart";
import { MonthlyBars } from "@/components/charts/MonthlyBars";
import { TransactionItem } from "@/components/transactions/TransactionItem";
import { useTransactionForm } from "@/components/transactions/TransactionFormProvider";
import { useAuth } from "@/context/AuthContext";
import { useData } from "@/context/DataContext";
import { getCategory } from "@/lib/constants";
import { formatCurrency, formatPercent } from "@/lib/format";
import {
  breakdownByCategory,
  compare,
  computeTotals,
  filterMonth,
  monthlySeries,
} from "@/lib/stats";

export default function DashboardPage() {
  const { transactions, loading } = useData();
  const { user } = useAuth();
  const { openForm } = useTransactionForm();
  const currency = user?.currency;

  const data = useMemo(() => {
    const now = new Date();
    const prevMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);

    const monthItems = filterMonth(transactions, now);
    const prevItems = filterMonth(transactions, prevMonth);

    const all = computeTotals(transactions);
    const month = computeTotals(monthItems);
    const prev = computeTotals(prevItems);

    const slices = breakdownByCategory(monthItems, "expense");
    const savings = month.income - month.expense;

    const recent = [...transactions]
      .sort((a, b) => {
        if (a.date !== b.date) return a.date < b.date ? 1 : -1;
        return a.createdAt < b.createdAt ? 1 : -1;
      })
      .slice(0, 6);

    return {
      balance: all.balance,
      month,
      incomeTrend: compare(month.income, prev.income).change,
      expenseTrend: compare(month.expense, prev.expense).change,
      savings,
      savingsRate: month.income > 0 ? savings / month.income : null,
      series: monthlySeries(transactions, 6, now),
      slices,
      recent,
    };
  }, [transactions]);

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-28 animate-pulse rounded-2xl bg-muted" />
          ))}
        </div>
        <div className="h-64 animate-pulse rounded-2xl bg-muted" />
      </div>
    );
  }

  if (transactions.length === 0) {
    return (
      <EmptyState
        icon={<Wallet className="h-6 w-6" />}
        title="Bienvenue ! Votre tableau de bord est vide"
        description="Ajoutez un revenu ou une dépense pour voir apparaître votre solde, vos statistiques et vos graphiques."
        action={
          <Button onClick={() => openForm()}>
            <Plus className="h-4 w-4" />
            Ajouter une transaction
          </Button>
        }
      />
    );
  }

  const donutData = data.slices.map((s) => ({
    label: getCategory(s.categoryId)?.label ?? s.categoryId,
    value: s.total,
    color: getCategory(s.categoryId)?.color ?? "#94a3b8",
  }));
  const monthExpenseTotal = data.month.expense;

  return (
    <div className="space-y-6">
      {/* Key figures */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Solde total"
          value={formatCurrency(data.balance, currency)}
          icon={<Wallet className="h-5 w-5" />}
          iconClassName="bg-primary/10 text-primary"
        />
        <StatCard
          label="Revenus du mois"
          value={formatCurrency(data.month.income, currency)}
          icon={<TrendingUp className="h-5 w-5" />}
          iconClassName="bg-income/10 text-income"
          trend={data.incomeTrend}
          positiveIsGood
        />
        <StatCard
          label="Dépenses du mois"
          value={formatCurrency(data.month.expense, currency)}
          icon={<TrendingDown className="h-5 w-5" />}
          iconClassName="bg-expense/10 text-expense"
          trend={data.expenseTrend}
          positiveIsGood={false}
        />
        <StatCard
          label="Épargne du mois"
          value={formatCurrency(data.savings, currency)}
          icon={<PiggyBank className="h-5 w-5" />}
          iconClassName="bg-primary/10 text-primary"
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-5">
        {/* Evolution */}
        <Card className="lg:col-span-3">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Évolution financière</CardTitle>
            <div className="flex items-center gap-3 text-xs text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-full bg-income" />
                Revenus
              </span>
              <span className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-full bg-expense" />
                Dépenses
              </span>
            </div>
          </CardHeader>
          <CardContent>
            <MonthlyBars data={data.series} />
          </CardContent>
        </Card>

        {/* Expense breakdown */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Répartition des dépenses</CardTitle>
          </CardHeader>
          <CardContent>
            {monthExpenseTotal === 0 ? (
              <p className="py-10 text-center text-sm text-muted-foreground">
                Aucune dépense ce mois-ci.
              </p>
            ) : (
              <div className="flex flex-col items-center gap-5">
                <DonutChart
                  data={donutData}
                  centerLabel="Ce mois"
                  centerValue={formatCurrency(monthExpenseTotal, currency)}
                />
                <ul className="w-full space-y-1.5">
                  {data.slices.slice(0, 5).map((s) => {
                    const category = getCategory(s.categoryId);
                    return (
                      <li
                        key={s.categoryId}
                        className="flex items-center gap-2 text-sm"
                      >
                        <span
                          className="h-2.5 w-2.5 shrink-0 rounded-full"
                          style={{ backgroundColor: category?.color ?? "#94a3b8" }}
                        />
                        <span className="flex-1 truncate text-foreground">
                          {category?.label ?? s.categoryId}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {formatPercent(s.total / monthExpenseTotal, 0)}
                        </span>
                        <span className="w-20 text-right font-medium tabular-nums text-foreground">
                          {formatCurrency(s.total, currency)}
                        </span>
                      </li>
                    );
                  })}
                </ul>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <BudgetCard />

      {/* Quick access to planning pages (mobile — sidebar covers desktop) */}
      <div className="grid grid-cols-3 gap-3 lg:hidden">
        {[
          { href: "/budgets", label: "Budgets", icon: Gauge },
          { href: "/objectifs", label: "Objectifs", icon: Target },
          { href: "/recurrences", label: "Récurrences", icon: Repeat },
        ].map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className="flex flex-col items-center gap-2 rounded-2xl border border-border bg-card p-4 text-center transition-colors hover:bg-muted"
          >
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <Icon className="h-5 w-5" />
            </span>
            <span className="text-xs font-medium text-foreground">{label}</span>
          </Link>
        ))}
      </div>

      {/* Recent transactions */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Dernières transactions</CardTitle>
          <Link
            href="/transactions"
            className="text-sm font-medium text-primary hover:underline"
          >
            Voir tout
          </Link>
        </CardHeader>
        <CardContent className="pt-2">
          <div className="space-y-0.5">
            {data.recent.map((tx) => (
              <TransactionItem key={tx.id} tx={tx} showDate />
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
