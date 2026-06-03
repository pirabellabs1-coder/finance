import { getSessionUserId } from "@/server/session";
import { deleteTransaction, updateTransaction } from "@/server/data";
import { fail, ok } from "@/server/http";
import type { TransactionInput } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const uid = await getSessionUserId();
  if (!uid) return fail("Non authentifié.", 401);
  const { id } = await params;
  const input = (await req.json().catch(() => null)) as TransactionInput | null;
  if (!input) return fail("Données invalides.");
  const tx = await updateTransaction(uid, id, input);
  if (!tx) return fail("Transaction introuvable.", 404);
  return ok({ transaction: tx });
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const uid = await getSessionUserId();
  if (!uid) return fail("Non authentifié.", 401);
  const { id } = await params;
  await deleteTransaction(uid, id);
  return ok();
}
