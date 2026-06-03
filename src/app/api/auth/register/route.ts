import { hashPassword } from "@/server/password";
import { createSessionToken, setSessionCookie } from "@/server/session";
import { createUser, findUserByEmail, toPublicUser } from "@/server/users";
import { fail, isUniqueViolation, ok } from "@/server/http";
import type { CurrencyCode } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const { firstName, lastName, email, password, currency } = body ?? {};
    if (!firstName?.trim()) return fail("Le prénom est requis.");
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email ?? "")) return fail("Email invalide.");
    if (!password || password.length < 6) return fail("Mot de passe trop court (6 min).");

    if (await findUserByEmail(email)) {
      return fail("Un compte existe déjà avec cet email.", 409);
    }
    const row = await createUser({
      firstName,
      lastName: lastName ?? "",
      email,
      passwordHash: hashPassword(password),
      currency: (currency ?? "EUR") as CurrencyCode,
    });
    await setSessionCookie(await createSessionToken(row.id));
    return ok({ user: toPublicUser(row) });
  } catch (e) {
    if (isUniqueViolation(e)) return fail("Un compte existe déjà avec cet email.", 409);
    console.error("register error", e);
    return fail("Erreur serveur.", 500);
  }
}
