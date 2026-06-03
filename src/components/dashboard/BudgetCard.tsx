"use client";

import { useMemo } from "react";
import Link from "next/link";
import { ArrowRight, Wallet } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { ProgressBar, budgetBarColor } from "@/components/ui/ProgressBar";
import { useAuth } from "@/context/AuthContext";
import { useData } from "@/context/DataContext";
import { usePlanning } from "@/context/PlanningContext";
import { formatCurrency, formatPercent } from "@/lib/format";
import { computeTotals, filterMonth } from "@/lib/stats";
import { cn } from "@/lib/utils";

export function BudgetCard() {
  const { budget } = usePlanning();
  const { transactions } = useData();
  const { user } = useAuth();
  const currency = user?.currency;
  const limit = budget.monthlyLimit;

  const monthExpense = useMemo(
    () => computeTotals(filterMonth(transactions, new Date())).expense,
    [transactions],
  );

  if (!limit || limit <= 0) {
    return (
      <Card>
        <CardContent className="flex flex-wrap items-center justify-between gap-3 p-5">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <Wallet className="h-5 w-5" />
            </span>
            <div>
              <p className="text-sm font-medium text-foreground">
                Définissez une limite de dépense mensuelle
              </p>
              <p className="text-xs text-muted-foreground">
                Suivez votre budget et recevez une alerte en cas de dépassement.
              </p>
            </div>
          </div>
          <Link
            href="/budgets"
            className="flex items-center gap-1 text-sm font-medium text-primary hover:underline"
          >
            Configurer <ArrowRight className="h-4 w-4" />
          </Link>
        </CardContent>
      </Card>
    );
  }

  const ratio = monthExpense / limit;
  const remaining = limit - monthExpense;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Budget du mois</CardTitle>
        <Link
          href="/budgets"
          className="text-sm font-medium text-primary hover:underline"
        >
          Gérer
        </Link>
      </CardHeader>
      <CardContent className="space-y-2">
        <div className="flex items-end justify-between">
          <p className="text-xl font-bold tabular-nums text-foreground">
            {formatCurrency(monthExpense, currency)}
            <span className="text-sm font-normal text-muted-foreground">
              {" "}
              / {formatCurrency(limit, currency)}
            </span>
          </p>
          <p
            className={cn(
              "text-sm font-semibold",
              ratio >= 1 ? "text-expense" : "text-muted-foreground",
            )}
          >
            {formatPercent(ratio, 0)}
          </p>
        </div>
        <ProgressBar value={monthExpense} max={limit} colorClassName={budgetBarColor(ratio)} />
        <p className="text-xs text-muted-foreground">
          {remaining >= 0
            ? `Reste ${formatCurrency(remaining, currency)}`
            : `Dépassé de ${formatCurrency(-remaining, currency)}`}
        </p>
      </CardContent>
    </Card>
  );
}
