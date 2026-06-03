// Password hashing for the LOCAL demo backend, using the Web Crypto API
// (PBKDF2 / SHA-256). This exists only so credentials are not stored as
// plaintext in localStorage.
//
// ⚠️ Client-side hashing is NOT real authentication security. When you swap in
// Firebase Auth or a real API (see lib/repositories.ts), delete this module and
// let the backend own credential handling.

const ITERATIONS = 100_000;
const KEY_LENGTH_BITS = 256;

function toHex(buffer: ArrayBuffer): string {
  return Array.from(new Uint8Array(buffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

function fromHex(hex: string): Uint8Array<ArrayBuffer> {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < bytes.length; i++) {
    bytes[i] = parseInt(hex.slice(i * 2, i * 2 + 2), 16);
  }
  return bytes;
}

async function deriveKey(
  password: string,
  salt: Uint8Array<ArrayBuffer>,
  iterations: number,
): Promise<ArrayBuffer> {
  const baseKey = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(password),
    "PBKDF2",
    false,
    ["deriveBits"],
  );
  return crypto.subtle.deriveBits(
    { name: "PBKDF2", salt, iterations, hash: "SHA-256" },
    baseKey,
    KEY_LENGTH_BITS,
  );
}

/** Returns a self-describing string: `iterations:saltHex:hashHex`. */
export async function hashPassword(password: string): Promise<string> {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const derived = await deriveKey(password, salt, ITERATIONS);
  return `${ITERATIONS}:${toHex(salt.buffer)}:${toHex(derived)}`;
}

export async function verifyPassword(
  password: string,
  stored: string,
): Promise<boolean> {
  const [iterStr, saltHex, hashHex] = stored.split(":");
  if (!iterStr || !saltHex || !hashHex) return false;
  const derived = await deriveKey(password, fromHex(saltHex), parseInt(iterStr, 10));
  return toHex(derived) === hashHex;
}
