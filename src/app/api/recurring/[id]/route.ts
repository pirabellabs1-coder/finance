import { getSessionUserId } from "@/server/session";
import { deleteRecurring, updateRecurring } from "@/server/data";
import { fail, ok } from "@/server/http";
import type { RecurringRuleInput } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const uid = await getSessionUserId();
  if (!uid) return fail("Non authentifié.", 401);
  const { id } = await params;
  const input = (await req.json().catch(() => ({}))) as Partial<RecurringRuleInput>;
  const rule = await updateRecurring(uid, id, input);
  if (!rule) return fail("Règle introuvable.", 404);
  return ok({ rule });
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const uid = await getSessionUserId();
  if (!uid) return fail("Non authentifié.", 401);
  const { id } = await params;
  await deleteRecurring(uid, id);
  return ok();
}
