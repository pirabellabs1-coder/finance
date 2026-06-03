"use client";

import { useEffect, useMemo, useState } from "react";
import { Wallet } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { ProgressBar, budgetBarColor } from "@/components/ui/ProgressBar";
import { CategoryGlyph } from "@/components/CategoryIcon";
import { useAuth } from "@/context/AuthContext";
import { useData } from "@/context/DataContext";
import { usePlanning } from "@/context/PlanningContext";
import { CURRENCIES, EXPENSE_CATEGORIES } from "@/lib/constants";
import { formatCurrency, formatPercent } from "@/lib/format";
import { breakdownByCategory, computeTotals, filterMonth } from "@/lib/stats";
import { cn } from "@/lib/utils";

function LimitInput({
  value,
  onSave,
  symbol,
}: {
  value: number | null;
  onSave: (v: number | null) => void;
  symbol: string;
}) {
  const [text, setText] = useState(value != null ? String(value) : "");
  useEffect(() => {
    setText(value != null ? String(value) : "");
  }, [value]);

  const commit = () => {
    const v = parseFloat(text.replace(",", "."));
    onSave(Number.isNaN(v) || v <= 0 ? null : v);
  };

  return (
    <div className="relative w-32 shrink-0">
      <input
        inputMode="decimal"
        placeholder="Aucun"
        value={text}
        onChange={(e) => setText(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === "Enter") (e.target as HTMLInputElement).blur();
        }}
        className="h-10 w-full rounded-xl border border-input bg-card pl-3 pr-7 text-right text-sm tabular-nums text-foreground focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring/30"
      />
      <span className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
        {symbol}
      </span>
    </div>
  );
}

export default function BudgetsPage() {
  const { budget, setMonthlyLimit, setCategoryLimit, loading } = usePlanning();
  const { transactions } = useData();
  const { user } = useAuth();
  const currency = user?.currency;
  const symbol = CURRENCIES.find((c) => c.code === currency)?.symbol ?? "€";

  const { monthExpense, spentByCategory } = useMemo(() => {
    const monthItems = filterMonth(transactions, new Date());
    return {
      monthExpense: computeTotals(monthItems).expense,
      spentByCategory: new Map(
        breakdownByCategory(monthItems, "expense").map((s) => [s.categoryId, s.total]),
      ),
    };
  }, [transactions]);

  if (loading) {
    return <div className="h-64 animate-pulse rounded-2xl bg-muted" />;
  }

  const limit = budget.monthlyLimit;
  const ratio = limit && limit > 0 ? monthExpense / limit : 0;
  const remaining = limit ? limit - monthExpense : 0;

  return (
    <div className="space-y-6">
      {/* Global monthly limit */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-4">
          <CardTitle>Limite de dépense mensuelle</CardTitle>
          <LimitInput value={limit} onSave={setMonthlyLimit} symbol={symbol} />
        </CardHeader>
        <CardContent>
          {limit && limit > 0 ? (
            <div className="space-y-2">
              <div className="flex items-end justify-between">
                <p className="text-2xl font-bold tabular-nums text-foreground">
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
              <ProgressBar
                value={monthExpense}
                max={limit}
                colorClassName={budgetBarColor(ratio)}
              />
              <p className="text-sm text-muted-foreground">
                {remaining >= 0
                  ? `Il vous reste ${formatCurrency(remaining, currency)} ce mois-ci.`
                  : `Vous avez dépassé de ${formatCurrency(-remaining, currency)}.`}
              </p>
            </div>
          ) : (
            <p className="flex items-center gap-2 text-sm text-muted-foreground">
              <Wallet className="h-4 w-4" />
              Définissez un montant à droite pour suivre votre budget global.
            </p>
          )}
        </CardContent>
      </Card>

      {/* Per-category budgets */}
      <Card>
        <CardHeader>
          <CardTitle>Budgets par catégorie</CardTitle>
        </CardHeader>
        <CardContent className="space-y-1">
          {EXPENSE_CATEGORIES.map((category) => {
            const spent = spentByCategory.get(category.id) ?? 0;
            const catLimit = budget.categoryLimits[category.id] ?? null;
            const catRatio = catLimit && catLimit > 0 ? spent / catLimit : 0;
            return (
              <div
                key={category.id}
                className="flex items-center gap-3 rounded-xl px-1 py-2.5"
              >
                <span
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full"
                  style={{ backgroundColor: `${category.color}1a`, color: category.color }}
                >
                  <CategoryGlyph icon={category.icon} className="h-4 w-4" />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <p className="truncate text-sm font-medium text-foreground">
                      {category.label}
                    </p>
                    <p className="shrink-0 text-xs tabular-nums text-muted-foreground">
                      {formatCurrency(spent, currency)}
                      {catLimit ? ` / ${formatCurrency(catLimit, currency)}` : ""}
                    </p>
                  </div>
                  {catLimit && catLimit > 0 && (
                    <ProgressBar
                      value={spent}
                      max={catLimit}
                      className="mt-1.5 h-1.5"
                      colorClassName={budgetBarColor(catRatio)}
                    />
                  )}
                </div>
                <LimitInput
                  value={catLimit}
                  onSave={(v) => setCategoryLimit(category.id, v)}
                  symbol={symbol}
                />
              </div>
            );
          })}
        </CardContent>
      </Card>
    </div>
  );
}
