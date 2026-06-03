"use client";

import { useMemo } from "react";
import { Plus, TrendingDown, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card, CardContent } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { useAuth } from "@/context/AuthContext";
import { useData } from "@/context/DataContext";
import { getCategory } from "@/lib/constants";
import { formatCurrency } from "@/lib/format";
import { breakdownByCategory, computeTotals, filterMonth } from "@/lib/stats";
import type { TransactionType } from "@/lib/types";
import { TransactionList } from "./TransactionList";
import { useTransactionForm } from "./TransactionFormProvider";

export function TypeLedger({ type }: { type: TransactionType }) {
  const { transactions, loading } = useData();
  const { user } = useAuth();
  const { openForm } = useTransactionForm();
  const isIncome = type === "income";

  const items = useMemo(
    () => transactions.filter((t) => t.type === type),
    [transactions, type],
  );
  const monthItems = useMemo(() => filterMonth(items, new Date()), [items]);
  const monthTotal = computeTotals(monthItems)[isIncome ? "income" : "expense"];
  const top = breakdownByCategory(monthItems, type)[0] ?? null;

  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-sm text-muted-foreground">
              {isIncome ? "Revenus" : "Dépenses"} ce mois-ci
            </p>
            <p
              className={`mt-1 text-3xl font-bold tabular-nums ${
                isIncome ? "text-income" : "text-expense"
              }`}
            >
              {formatCurrency(monthTotal, user?.currency)}
            </p>
            {top && (
              <p className="mt-1 text-xs text-muted-foreground">
                Principale catégorie : {getCategory(top.categoryId)?.label} (
                {formatCurrency(top.total, user?.currency)})
              </p>
            )}
          </div>
          <Button onClick={() => openForm({ type })}>
            <Plus className="h-4 w-4" />
            Ajouter {isIncome ? "un revenu" : "une dépense"}
          </Button>
        </CardContent>
      </Card>

      {loading ? (
        <div className="h-40 animate-pulse rounded-2xl bg-muted" />
      ) : items.length === 0 ? (
        <EmptyState
          icon={
            isIncome ? (
              <TrendingUp className="h-6 w-6" />
            ) : (
              <TrendingDown className="h-6 w-6" />
            )
          }
          title={`Aucun${isIncome ? " revenu" : "e dépense"} pour l’instant`}
          description={`Ajoutez votre premi${
            isIncome ? "er revenu" : "ère dépense"
          } pour le voir apparaître ici.`}
          action={
            <Button onClick={() => openForm({ type })}>
              <Plus className="h-4 w-4" />
              Ajouter
            </Button>
          }
        />
      ) : (
        <TransactionList transactions={items} />
      )}
    </div>
  );
}
