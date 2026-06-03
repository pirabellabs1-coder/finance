import { cn } from "@/lib/utils";

export function ProgressBar({
  value,
  max,
  className,
  colorClassName = "bg-primary",
}: {
  value: number;
  max: number;
  className?: string;
  colorClassName?: string;
}) {
  const pct = max > 0 ? Math.min((value / max) * 100, 100) : 0;
  return (
    <div
      className={cn("h-2 w-full overflow-hidden rounded-full bg-muted", className)}
      role="progressbar"
      aria-valuenow={Math.round(pct)}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      <div
        className={cn("h-full rounded-full transition-all", colorClassName)}
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}

/** Tailwind fill color for a consumption ratio (spent / limit). */
export function budgetBarColor(ratio: number): string {
  if (ratio >= 1) return "bg-expense";
  if (ratio >= 0.8) return "bg-amber-500";
  return "bg-income";
}
