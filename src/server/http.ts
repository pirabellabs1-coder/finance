import { NextResponse } from "next/server";

export const ok = (data: unknown = { ok: true }, status = 200) =>
  NextResponse.json(data, { status });

export const fail = (error: string, status = 400) =>
  NextResponse.json({ error }, { status });

/** Narrowed check for a Postgres unique-violation error. */
export function isUniqueViolation(e: unknown): boolean {
  return (
    typeof e === "object" &&
    e !== null &&
    "code" in e &&
    (e as { code?: string }).code === "23505"
  );
}
