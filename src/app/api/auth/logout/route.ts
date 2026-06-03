import { clearSessionCookie } from "@/server/session";
import { ok } from "@/server/http";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST() {
  await clearSessionCookie();
  return ok();
}
