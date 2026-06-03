import { getSessionUserId } from "@/server/session";
import { deleteGoal, updateGoal } from "@/server/data";
import { fail, ok } from "@/server/http";
import type { SavingsGoalInput } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const uid = await getSessionUserId();
  if (!uid) return fail("Non authentifié.", 401);
  const { id } = await params;
  const input = (await req.json().catch(() => ({}))) as Partial<SavingsGoalInput>;
  const goal = await updateGoal(uid, id, input);
  if (!goal) return fail("Objectif introuvable.", 404);
  return ok({ goal });
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const uid = await getSessionUserId();
  if (!uid) return fail("Non authentifié.", 401);
  const { id } = await params;
  await deleteGoal(uid, id);
  return ok();
}
