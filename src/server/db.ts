import { Pool } from "pg";

let _pool: Pool | null = null;

/** Lazily-created connection pool. Works with Supabase / any Postgres. */
export function db(): Pool {
  if (!_pool) {
    const connectionString =
      process.env.POSTGRES_URL ||
      process.env.DATABASE_URL ||
      process.env.POSTGRES_PRISMA_URL ||
      process.env.POSTGRES_URL_NON_POOLING;
    _pool = new Pool({
      connectionString,
      // Supabase (and most hosted Postgres) require TLS.
      ssl:
        connectionString && /sslmode=disable/.test(connectionString)
          ? false
          : { rejectUnauthorized: false },
      max: 3,
      idleTimeoutMillis: 10_000,
      connectionTimeoutMillis: 15_000,
    });
  }
  return _pool;
}

let _schema: Promise<void> | null = null;

/** Creates tables on first use (idempotent). Cached per server instance. */
export function ensureSchema(): Promise<void> {
  if (!_schema) {
    _schema = (async () => {
      const p = db();
      await p.query(`
        CREATE TABLE IF NOT EXISTS users (
          id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
          email text UNIQUE NOT NULL,
          first_name text NOT NULL DEFAULT '',
          last_name text NOT NULL DEFAULT '',
          currency text NOT NULL DEFAULT 'EUR',
          avatar text,
          password_hash text NOT NULL,
          email_alerts boolean NOT NULL DEFAULT true,
          created_at timestamptz NOT NULL DEFAULT now()
        );
      `);
      await p.query(`
        CREATE TABLE IF NOT EXISTS transactions (
          id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
          user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          type text NOT NULL,
          amount numeric(14,2) NOT NULL,
          category_id text NOT NULL,
          description text NOT NULL DEFAULT '',
          date date NOT NULL,
          payment_method text NOT NULL,
          reference text,
          created_at timestamptz NOT NULL DEFAULT now(),
          updated_at timestamptz NOT NULL DEFAULT now()
        );
      `);
      await p.query(
        `CREATE INDEX IF NOT EXISTS transactions_user_idx ON transactions(user_id);`,
      );
      await p.query(`
        CREATE TABLE IF NOT EXISTS budgets (
          user_id uuid PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
          monthly_limit numeric(14,2),
          category_limits jsonb NOT NULL DEFAULT '{}'::jsonb
        );
      `);
      await p.query(`
        CREATE TABLE IF NOT EXISTS goals (
          id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
          user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          name text NOT NULL,
          target numeric(14,2) NOT NULL,
          saved numeric(14,2) NOT NULL DEFAULT 0,
          deadline date,
          color text NOT NULL DEFAULT '#6366f1',
          created_at timestamptz NOT NULL DEFAULT now()
        );
      `);
      await p.query(
        `CREATE INDEX IF NOT EXISTS goals_user_idx ON goals(user_id);`,
      );
      await p.query(`
        CREATE TABLE IF NOT EXISTS recurring (
          id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
          user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          type text NOT NULL,
          amount numeric(14,2) NOT NULL,
          category_id text NOT NULL,
          description text NOT NULL DEFAULT '',
          payment_method text NOT NULL,
          frequency text NOT NULL,
          next_date date NOT NULL,
          active boolean NOT NULL DEFAULT true,
          created_at timestamptz NOT NULL DEFAULT now()
        );
      `);
      await p.query(
        `CREATE INDEX IF NOT EXISTS recurring_user_idx ON recurring(user_id);`,
      );
    })().catch((err) => {
      // Reset so a later request can retry (e.g. transient cold-start failure).
      _schema = null;
      throw err;
    });
  }
  return _schema;
}
