import { hashPassword } from "@/server/password";
import { verifyResetToken } from "@/server/session";
import { getUserRowById, updateUserPassword } from "@/server/users";
import { fail, ok } from "@/server/http";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const { token, password } = (await req.json().catch(() => ({}))) ?? {};
    if (!token || !password || password.length < 6) {
      return fail("Lien ou mot de passe invalide.");
    }
    const payload = await verifyResetToken(token);
    if (!payload) return fail("Lien invalide ou expiré.", 400);
    const row = await getUserRowById(payload.uid);
    // Token is bound to the password hash → becomes single-use after reset.
    if (!row || row.password_hash.slice(-24) !== payload.k) {
      return fail("Lien invalide ou expiré.", 400);
    }
    await updateUserPassword(row.id, hashPassword(password));
    return ok();
  } catch (e) {
    console.error("reset-password error", e);
    return fail("Erreur serveur.", 500);
  }
}
