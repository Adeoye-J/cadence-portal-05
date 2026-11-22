import type { NodePgDatabase } from "drizzle-orm/node-postgres";
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import { env } from "@/lib/env";

/**
 * Shared database client. On serverless, keep the pool small and point DATABASE_URL at a transaction-mode
 * pooler (PgBouncer or the provider's pooler). The pool is created on first use, and creating it does not connect.
 */
type Db = NodePgDatabase;

let instance: Db | undefined;

function database(): Db {
  if (!instance) {
    const pool = new Pool({ connectionString: env.DATABASE_URL, max: 5 });
    instance = drizzle(pool);
  }
  return instance;
}

export const db: Db = new Proxy({} as Db, {
  get(_target, property) {
    const real = database();
    const value = Reflect.get(real, property);
    return typeof value === "function" ? value.bind(real) : value;
  },
});
