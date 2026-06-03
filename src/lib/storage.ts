// Thin, SSR-safe wrapper around localStorage with JSON (de)serialization.
// Everything that touches persistence goes through here so the storage medium
// can be swapped (e.g. IndexedDB) without touching the repositories.

export const STORAGE_KEYS = {
  users: "finance.users",
  session: "finance.session",
  /** The following are namespaced per user: `<prefix><userId>`. */
  txPrefix: "finance.tx.",
  budgetPrefix: "finance.budget.",
  goalsPrefix: "finance.goals.",
  recurringPrefix: "finance.recurring.",
  /** Persisted read/dismissed notification ids. */
  notifReadPrefix: "finance.notifread.",
} as const;

export function readJSON<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

export function writeJSON<T>(key: string, value: T): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Quota exceeded or serialization error — non-fatal for a local demo.
  }
}

export function removeKey(key: string): void {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(key);
}

/** Collision-resistant id, preferring the native UUID generator. */
export function uid(prefix = ""): string {
  let id: string;
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    id = crypto.randomUUID();
  } else {
    id = Math.random().toString(36).slice(2) + Date.now().toString(36);
  }
  return prefix ? `${prefix}_${id}` : id;
}
