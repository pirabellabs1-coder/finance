"use client";

export interface BarPoint {
  label: string;
  income: number;
  expense: number;
}

/** Grouped income/expense bars, one pair per period. Pure CSS, responsive. */
export function MonthlyBars({ data }: { data: BarPoint[] }) {
  const max = Math.max(1, ...data.flatMap((d) => [d.income, d.expense]));
  const height = (value: number) =>
    value > 0 ? `${Math.max((value / max) * 100, 2)}%` : "0%";

  return (
    <div className="flex items-end justify-between gap-1.5">
      {data.map((d, i) => (
        <div key={i} className="flex flex-1 flex-col items-center gap-2">
          <div className="flex h-40 w-full items-end justify-center gap-1">
            <div
              className="w-2.5 rounded-t bg-income transition-all sm:w-3"
              style={{ height: height(d.income) }}
            />
            <div
              className="w-2.5 rounded-t bg-expense transition-all sm:w-3"
              style={{ height: height(d.expense) }}
            />
          </div>
          <span className="text-[11px] capitalize text-muted-foreground">
            {d.label}
          </span>
        </div>
      ))}
    </div>
  );
}
