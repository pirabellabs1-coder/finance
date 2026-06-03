import { db, ensureSchema } from "./db";
import { getSessionUserId } from "./session";
import type { CurrencyCode, ProfilePatch, User } from "@/lib/types";

export interface UserRow {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  currency: string;
  avatar: string | null;
  password_hash: string;
  email_alerts: boolean;
  created_at: Date | string;
}

export function toPublicUser(row: UserRow): User {
  return {
    id: row.id,
    firstName: row.first_name,
    lastName: row.last_name,
    email: row.email,
    currency: row.currency as CurrencyCode,
    avatar: row.avatar ?? undefined,
    emailAlerts: row.email_alerts,
    createdAt: new Date(row.created_at).toISOString(),
  };
}

export async function findUserByEmail(email: string): Promise<UserRow | null> {
  await ensureSchema();
  const { rows } = await db().query("SELECT * FROM users WHERE email = $1", [
    email.trim().toLowerCase(),
  ]);
  return (rows[0] as UserRow) ?? null;
}

export async function getUserRowById(id: string): Promise<UserRow | null> {
  await ensureSchema();
  const { rows } = await db().query("SELECT * FROM users WHERE id = $1", [id]);
  return (rows[0] as UserRow) ?? null;
}

export async function createUser(input: {
  firstName: string;
  lastName: string;
  email: string;
  passwordHash: string;
  currency: CurrencyCode;
}): Promise<UserRow> {
  await ensureSchema();
  const { rows } = await db().query(
    `INSERT INTO users (first_name, last_name, email, password_hash, currency)
     VALUES ($1, $2, $3, $4, $5) RETURNING *`,
    [
      input.firstName.trim(),
      input.lastName.trim(),
      input.email.trim().toLowerCase(),
      input.passwordHash,
      input.currency,
    ],
  );
  return rows[0] as UserRow;
}

export async function updateUserProfile(
  id: string,
  patch: ProfilePatch,
): Promise<UserRow> {
  await ensureSchema();
  const { rows } = await db().query(
    `UPDATE users SET
       first_name   = COALESCE($2, first_name),
       last_name    = COALESCE($3, last_name),
       currency     = COALESCE($4, currency),
       avatar       = CASE WHEN $5::boolean THEN $6 ELSE avatar END,
       email_alerts = COALESCE($7, email_alerts)
     WHERE id = $1 RETURNING *`,
    [
      id,
      patch.firstName ?? null,
      patch.lastName ?? null,
      patch.currency ?? null,
      patch.avatar !== undefined,
      patch.avatar ?? null,
      patch.emailAlerts ?? null,
    ],
  );
  return rows[0] as UserRow;
}

export async function updateUserPassword(
  id: string,
  passwordHash: string,
): Promise<void> {
  await ensureSchema();
  await db().query("UPDATE users SET password_hash = $2 WHERE id = $1", [
    id,
    passwordHash,
  ]);
}

/** Public (password-free) current user from the session cookie, or null. */
export async function getCurrentUser(): Promise<User | null> {
  const uid = await getSessionUserId();
  if (!uid) return null;
  const row = await getUserRowById(uid);
  return row ? toPublicUser(row) : null;
}
