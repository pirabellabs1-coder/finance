"use client";

import { CategoryGlyph } from "@/components/CategoryIcon";
import { useAuth } from "@/context/AuthContext";
import { getCategory, paymentLabel } from "@/lib/constants";
import { formatDate, formatSigned } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { Transaction } from "@/lib/types";
import { useTransactionForm } from "./TransactionFormProvider";

export function TransactionItem({
  tx,
  showDate = false,
}: {
  tx: Transaction;
  showDate?: boolean;
}) {
  const { user } = useAuth();
  const { openForm } = useTransactionForm();
  const category = getCategory(tx.categoryId);
  const color = category?.color ?? "#94a3b8";
  const isIncome = tx.type === "income";

  const meta = [category?.label ?? "—", paymentLabel(tx.paymentMethod)];
  if (showDate) meta.push(formatDate(tx.date, "short"));

  return (
    <button
      type="button"
      onClick={() => openForm({ transaction: tx })}
      className="flex w-full items-center gap-3 rounded-xl px-2 py-2.5 text-left transition-colors hover:bg-muted"
    >
      <span
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full"
        style={{ backgroundColor: `${color}1a`, color }}
      >
        <CategoryGlyph icon={category?.icon ?? "package"} className="h-5 w-5" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-foreground">
          {tx.description}
        </p>
        <p className="truncate text-xs text-muted-foreground">
          {meta.join(" · ")}
        </p>
      </div>
      <span
        className={cn(
          "shrink-0 text-sm font-semibold tabular-nums",
          isIncome ? "text-income" : "text-foreground",
        )}
      >
        {formatSigned(isIncome ? tx.amount : -tx.amount, user?.currency)}
      </span>
    </button>
  );
}
