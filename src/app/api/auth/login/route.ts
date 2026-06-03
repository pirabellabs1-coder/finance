import { verifyPassword } from "@/server/password";
import { createSessionToken, setSessionCookie } from "@/server/session";
import { findUserByEmail, toPublicUser } from "@/server/users";
import { fail, ok } from "@/server/http";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const { email, password } = (await req.json().catch(() => ({}))) ?? {};
    const row = email ? await findUserByEmail(email) : null;
    if (!row || !verifyPassword(password ?? "", row.password_hash)) {
      return fail("Email ou mot de passe incorrect.", 401);
    }
    await setSessionCookie(await createSessionToken(row.id));
    return ok({ user: toPublicUser(row) });
  } catch (e) {
    console.error("login error", e);
    return fail("Erreur serveur.", 500);
  }
}
