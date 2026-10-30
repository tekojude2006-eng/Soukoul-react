import { drizzle as drizzlePg } from "drizzle-orm/node-postgres";
import { drizzle as drizzlePglite } from "drizzle-orm/pglite";
import { PGlite } from "@electric-sql/pglite";
import { Pool } from "pg";

const databaseUrl = process.env.DATABASE_URL;

const globalForDb = globalThis as typeof globalThis & {
  __arenaNextJsPostgresqlPool?: Pool;
  __arenaNextJsPglite?: PGlite;
};

export const pool = databaseUrl
  ? (globalForDb.__arenaNextJsPostgresqlPool ??
      new Pool({
        connectionString: databaseUrl,
      }))
  : undefined;

const pglite = !databaseUrl
  ? (globalForDb.__arenaNextJsPglite ?? new PGlite("./.pglite"))
  : undefined;

if (process.env.NODE_ENV !== "production") {
  if (pool) globalForDb.__arenaNextJsPostgresqlPool = pool;
  if (pglite) globalForDb.__arenaNextJsPglite = pglite;
}

export const db = pool ? drizzlePg(pool) : drizzlePglite(pglite!);
