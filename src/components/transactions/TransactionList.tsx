"use client";

import { useMemo } from "react";
import { formatDate } from "@/lib/format";
import type { Transaction } from "@/lib/types";
import { TransactionItem } from "./TransactionItem";

/** Renders transactions grouped by day, most recent first. */
export function TransactionList({
  transactions,
}: {
  transactions: Transaction[];
}) {
  const groups = useMemo(() => {
    const sorted = [...transactions].sort((a, b) => {
      if (a.date !== b.date) return a.date < b.date ? 1 : -1;
      return a.createdAt < b.createdAt ? 1 : -1;
    });
    const byDate = new Map<string, Transaction[]>();
    for (const tx of sorted) {
      const bucket = byDate.get(tx.date);
      if (bucket) bucket.push(tx);
      else byDate.set(tx.date, [tx]);
    }
    return Array.from(byDate.entries());
  }, [transactions]);

  return (
    <div className="space-y-5">
      {groups.map(([date, items]) => (
        <div key={date}>
          <p className="mb-1 px-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
            {formatDate(date, "long")}
          </p>
          <div className="space-y-0.5">
            {items.map((tx) => (
              <TransactionItem key={tx.id} tx={tx} />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
