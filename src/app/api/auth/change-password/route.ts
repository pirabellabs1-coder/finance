import { hashPassword, verifyPassword } from "@/server/password";
import { getSessionUserId } from "@/server/session";
import { getUserRowById, updateUserPassword } from "@/server/users";
import { fail, ok } from "@/server/http";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const uid = await getSessionUserId();
    if (!uid) return fail("Non authentifié.", 401);
    const { current, next } = (await req.json().catch(() => ({}))) ?? {};
    if (!next || next.length < 6) return fail("Le nouveau mot de passe doit faire 6 caractères minimum.");
    const row = await getUserRowById(uid);
    if (!row) return fail("Utilisateur introuvable.", 404);
    if (!verifyPassword(current ?? "", row.password_hash)) {
      return fail("Le mot de passe actuel est incorrect.");
    }
    await updateUserPassword(uid, hashPassword(next));
    return ok();
  } catch (e) {
    console.error("change-password error", e);
    return fail("Erreur serveur.", 500);
  }
}
