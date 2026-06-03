import { db, ensureSchema } from "@/server/db";
import { getSessionUserId } from "@/server/session";
import { getUserRowById } from "@/server/users";
import { sendEmail, summaryEmail } from "@/server/email";
import { fail, ok } from "@/server/http";
import { formatCurrency } from "@/lib/format";
import type { CurrencyCode } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const uid = await getSessionUserId();
  if (!uid) return fail("Non authentifié.", 401);

  await ensureSchema();
  const user = await getUserRowById(uid);
  if (!user) return fail("Utilisateur introuvable.", 404);

  const { rows } = await db().query(
    `SELECT
       coalesce(sum(amount) FILTER (WHERE type='income'),0)  AS income,
       coalesce(sum(amount) FILTER (WHERE type='expense'),0) AS expense
     FROM transactions
     WHERE user_id=$1 AND date_trunc('month',date)=date_trunc('month',current_date)`,
    [uid],
  );
  const income = Number((rows[0] as { income: string }).income);
  const expense = Number((rows[0] as { expense: string }).expense);
  const currency = user.currency as CurrencyCode;

  const period = new Intl.DateTimeFormat("fr-FR", {
    month: "long",
    year: "numeric",
  }).format(new Date());

  const { subject, html } = summaryEmail(
    user.first_name,
    {
      period,
      income: formatCurrency(income, currency),
      expense: formatCurrency(expense, currency),
      balance: formatCurrency(income - expense, currency),
    },
    process.env.APP_URL || new URL(req.url).origin,
  );

  const res = await sendEmail({ to: user.email, subject, html });
  if (!res.ok) return fail(res.error ?? "Échec de l'envoi.", 502);
  return ok({ sent: true });
}
