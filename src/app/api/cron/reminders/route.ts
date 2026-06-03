import { db, ensureSchema } from "@/server/db";
import { alertsEmail, sendEmail } from "@/server/email";
import { ok } from "@/server/http";
import { getCategory } from "@/lib/constants";
import { formatCurrency, formatDate } from "@/lib/format";
import type { CurrencyCode } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

interface AlertItem {
  title: string;
  message: string;
}

async function buildAlerts(
  userId: string,
  currency: CurrencyCode,
): Promise<AlertItem[]> {
  const p = db();
  const items: AlertItem[] = [];

  // Upcoming / overdue recurring (next 3 days)
  const { rows: recs } = await p.query(
    `SELECT description, amount, type, to_char(next_date,'YYYY-MM-DD') AS next_date,
            (next_date < current_date) AS overdue
     FROM recurring
     WHERE user_id=$1 AND active=true AND next_date <= current_date + INTERVAL '3 days'
     ORDER BY next_date ASC`,
    [userId],
  );
  for (const r of recs as {
    description: string;
    amount: string;
    type: string;
    next_date: string;
    overdue: boolean;
  }[]) {
    const sign = r.type === "income" ? "+" : "−";
    items.push({
      title: r.overdue ? "Échéance récurrente en retard" : "Échéance récurrente à venir",
      message: `${r.description} — ${sign}${formatCurrency(Number(r.amount), currency)} le ${formatDate(r.next_date, "short")}`,
    });
  }

  // Budget status (current month)
  const { rows: totalRows } = await p.query(
    `SELECT coalesce(sum(amount),0) AS total FROM transactions
     WHERE user_id=$1 AND type='expense'
       AND date_trunc('month',date)=date_trunc('month',current_date)`,
    [userId],
  );
  const monthExpense = Number((totalRows[0] as { total: string }).total);

  const { rows: budgetRows } = await p.query(
    "SELECT monthly_limit, category_limits FROM budgets WHERE user_id=$1",
    [userId],
  );
  const budget = budgetRows[0] as
    | { monthly_limit: string | null; category_limits: Record<string, number> }
    | undefined;

  if (budget) {
    const limit = budget.monthly_limit == null ? null : Number(budget.monthly_limit);
    if (limit && limit > 0) {
      const ratio = monthExpense / limit;
      if (ratio >= 1) {
        items.push({
          title: "Budget mensuel dépassé",
          message: `${formatCurrency(monthExpense, currency)} dépensés sur ${formatCurrency(limit, currency)}.`,
        });
      } else if (ratio >= 0.8) {
        items.push({
          title: "Budget mensuel presque atteint",
          message: `${Math.round(ratio * 100)} % de votre budget consommé.`,
        });
      }
    }

    const limits = budget.category_limits ?? {};
    if (Object.keys(limits).length > 0) {
      const { rows: catRows } = await p.query(
        `SELECT category_id, sum(amount) AS spent FROM transactions
         WHERE user_id=$1 AND type='expense'
           AND date_trunc('month',date)=date_trunc('month',current_date)
         GROUP BY category_id`,
        [userId],
      );
      const spentByCat = new Map(
        (catRows as { category_id: string; spent: string }[]).map((c) => [
          c.category_id,
          Number(c.spent),
        ]),
      );
      for (const [categoryId, catLimit] of Object.entries(limits)) {
        if (!catLimit || catLimit <= 0) continue;
        const spent = spentByCat.get(categoryId) ?? 0;
        const label = getCategory(categoryId)?.label ?? categoryId;
        if (spent >= catLimit) {
          items.push({
            title: `Budget « ${label} » dépassé`,
            message: `${formatCurrency(spent, currency)} dépensés sur ${formatCurrency(catLimit, currency)}.`,
          });
        }
      }
    }
  }

  return items.slice(0, 20);
}

export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET;
  if (secret && req.headers.get("authorization") !== `Bearer ${secret}`) {
    return new Response("Unauthorized", { status: 401 });
  }

  await ensureSchema();
  const appUrl = process.env.APP_URL || new URL(req.url).origin;

  const { rows: users } = await db().query(
    "SELECT id, email, first_name, currency FROM users WHERE email_alerts = true",
  );

  let emailsSent = 0;
  for (const u of users as {
    id: string;
    email: string;
    first_name: string;
    currency: string;
  }[]) {
    const items = await buildAlerts(u.id, u.currency as CurrencyCode);
    if (items.length === 0) continue;
    const { subject, html } = alertsEmail(u.first_name, items, appUrl);
    const res = await sendEmail({ to: u.email, subject, html });
    if (res.ok) emailsSent++;
  }

  return ok({ usersChecked: users.length, emailsSent });
}
