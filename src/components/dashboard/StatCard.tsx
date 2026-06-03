import type { ReactNode } from "react";
import { ArrowDownRight, ArrowUpRight } from "lucide-react";
import { Card, CardContent } from "@/components/ui/Card";
import { formatPercent } from "@/lib/format";
import { cn } from "@/lib/utils";

interface StatCardProps {
  label: string;
  value: string;
  icon: ReactNode;
  iconClassName?: string;
  /** Month-over-month change as a signed ratio; null hides the trend. */
  trend?: number | null;
  /** Whether an increase is a good thing (income) or not (expense). */
  positiveIsGood?: boolean;
}

export function StatCard({
  label,
  value,
  icon,
  iconClassName,
  trend,
  positiveIsGood = true,
}: StatCardProps) {
  const showTrend = trend !== null && trend !== undefined && Number.isFinite(trend);
  const up = (trend ?? 0) >= 0;
  const good = up === positiveIsGood;

  return (
    <Card>
      <CardContent className="p-4 sm:p-5">
        <div className="flex items-start justify-between gap-2">
          <p className="text-sm text-muted-foreground">{label}</p>
          <span
            className={cn(
              "flex h-9 w-9 shrink-0 items-center justify-center rounded-xl",
              iconClassName ?? "bg-muted text-muted-foreground",
            )}
          >
            {icon}
          </span>
        </div>
        <p className="mt-2 text-2xl font-bold tabular-nums text-foreground">
          {value}
        </p>
        {showTrend && (
          <p
            className={cn(
              "mt-1 flex items-center gap-1 text-xs font-medium",
              good ? "text-income" : "text-expense",
            )}
          >
            {up ? (
              <ArrowUpRight className="h-3.5 w-3.5" />
            ) : (
              <ArrowDownRight className="h-3.5 w-3.5" />
            )}
            {formatPercent(Math.abs(trend ?? 0), 0)} vs mois dernier
          </p>
        )}
      </CardContent>
    </Card>
  );
}
