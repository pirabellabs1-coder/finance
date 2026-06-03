import { getSessionUserId } from "@/server/session";
import { toPublicUser, updateUserProfile } from "@/server/users";
import { fail, ok } from "@/server/http";
import type { ProfilePatch } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function PATCH(req: Request) {
  try {
    const uid = await getSessionUserId();
    if (!uid) return fail("Non authentifié.", 401);
    const patch = (await req.json().catch(() => ({}))) as ProfilePatch;
    const row = await updateUserProfile(uid, patch);
    return ok({ user: toPublicUser(row) });
  } catch (e) {
    console.error("profile error", e);
    return fail("Erreur serveur.", 500);
  }
}
