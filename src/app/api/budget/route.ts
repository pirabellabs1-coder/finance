import { getSessionUserId } from "@/server/session";
import { getBudget, saveBudget } from "@/server/data";
import { fail, ok } from "@/server/http";
import type { Budget } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const uid = await getSessionUserId();
  if (!uid) return fail("Non authentifié.", 401);
  return ok({ budget: await getBudget(uid) });
}

export async function PUT(req: Request) {
  const uid = await getSessionUserId();
  if (!uid) return fail("Non authentifié.", 401);
  const budget = (await req.json().catch(() => null)) as Budget | null;
  if (!budget) return fail("Données invalides.");
  return ok({
    budget: await saveBudget(uid, {
      monthlyLimit: budget.monthlyLimit ?? null,
      categoryLimits: budget.categoryLimits ?? {},
    }),
  });
}
