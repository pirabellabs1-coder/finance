import { cookies } from "next/headers";
import { SignJWT, jwtVerify } from "jose";

const COOKIE = "finance_session";
const MAX_AGE = 60 * 60 * 24 * 30; // 30 days

function secret(): Uint8Array {
  return new TextEncoder().encode(
    process.env.AUTH_SECRET || "dev-insecure-secret-change-me",
  );
}

export async function createSessionToken(userId: string): Promise<string> {
  return new SignJWT({ uid: userId })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("30d")
    .sign(secret());
}

export async function setSessionCookie(token: string): Promise<void> {
  const store = await cookies();
  store.set(COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: MAX_AGE,
  });
}

export async function clearSessionCookie(): Promise<void> {
  const store = await cookies();
  store.delete(COOKIE);
}

export async function getSessionUserId(): Promise<string | null> {
  const store = await cookies();
  const token = store.get(COOKIE)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secret());
    return (payload.uid as string) ?? null;
  } catch {
    return null;
  }
}

// --- Password reset tokens (stateless, signed, short-lived) ---

export async function createResetToken(
  userId: string,
  passwordHash: string,
): Promise<string> {
  return new SignJWT({ uid: userId, k: passwordHash.slice(-24), purpose: "reset" })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("1h")
    .sign(secret());
}

export async function verifyResetToken(
  token: string,
): Promise<{ uid: string; k: string } | null> {
  try {
    const { payload } = await jwtVerify(token, secret());
    if (payload.purpose !== "reset") return null;
    return { uid: payload.uid as string, k: payload.k as string };
  } catch {
    return null;
  }
}
