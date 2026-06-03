import { getSessionUserId } from "@/server/session";
import { createRecurring, listRecurring } from "@/server/data";
import { fail, ok } from "@/server/http";
import type { RecurringRuleInput } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const uid = await getSessionUserId();
  if (!uid) return fail("Non authentifié.", 401);
  return ok({ recurring: await listRecurring(uid) });
}

export async function POST(req: Request) {
  const uid = await getSessionUserId();
  if (!uid) return fail("Non authentifié.", 401);
  const input = (await req.json().catch(() => null)) as RecurringRuleInput | null;
  if (!input) return fail("Données invalides.");
  return ok({ rule: await createRecurring(uid, input) });
}
