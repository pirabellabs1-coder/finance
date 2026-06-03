import { getCurrentUser } from "@/server/users";
import { ok } from "@/server/http";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const user = await getCurrentUser();
    return ok({ user });
  } catch (e) {
    console.error("me error", e);
    return ok({ user: null });
  }
}
