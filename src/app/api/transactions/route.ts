import { getSessionUserId } from "@/server/session";
import {
  createTransaction,
  deleteAllTransactions,
  listTransactions,
} from "@/server/data";
import { fail, ok } from "@/server/http";
import type { Transaction, TransactionInput } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const uid = await getSessionUserId();
  if (!uid) return fail("Non authentifié.", 401);
  return ok({ transactions: await listTransactions(uid) });
}

export async function POST(req: Request) {
  const uid = await getSessionUserId();
  if (!uid) return fail("Non authentifié.", 401);
  const input = (await req.json().catch(() => null)) as TransactionInput | null;
  if (!input) return fail("Données invalides.");
  return ok({ transaction: await createTransaction(uid, input) });
}

/** Replace all transactions (used for bulk reset / clearing). */
export async function PUT(req: Request) {
  const uid = await getSessionUserId();
  if (!uid) return fail("Non authentifié.", 401);
  const body = (await req.json().catch(() => ({}))) as { transactions?: Transaction[] };
  await deleteAllTransactions(uid);
  for (const t of body.transactions ?? []) await createTransaction(uid, t);
  return ok({ transactions: await listTransactions(uid) });
}
