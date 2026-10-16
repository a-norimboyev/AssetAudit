import "server-only";
import { Pool, type PoolConfig } from "pg";
import { drizzle, type NodePgDatabase } from "drizzle-orm/node-postgres";
import * as schema from "./schema";

/**
 * 1 GB RAMli Eskiz VPS uchun optimallashtirilgan PostgreSQL ulanish sozlamalari:
 * - max: 5 ulanish (har bir worker/jarayon uchun xotirani tejash)
 * - idleTimeoutMillis: 30000 (30 soniya harakatsiz turgan ulanishlar yopiladi)
 * - connectionTimeoutMillis: 5000 (5 soniya ichida javob bo'lmasa xatolik beradi)
 */
const POOL_MAX_CONNECTIONS = 5;
const IDLE_TIMEOUT_MS = 30000;
const CONNECTION_TIMEOUT_MS = 5000;

declare global {
  // Global singleton: Next.js dev HMR jarayonida qayta-qayta yangi pool ochilishini oldini oladi
  var __mulknazorat_pg_pool: Pool | undefined;
  var __mulknazorat_drizzle_db: NodePgDatabase<typeof schema> | undefined;
}

function createPool(): Pool {
  const connectionString = process.env.DATABASE_URL;

  const poolConfig: PoolConfig = {
    connectionString,
    max: POOL_MAX_CONNECTIONS,
    idleTimeoutMillis: IDLE_TIMEOUT_MS,
    connectionTimeoutMillis: CONNECTION_TIMEOUT_MS,
    ssl:
      process.env.DATABASE_SSL === "true"
        ? { rejectUnauthorized: false }
        : undefined,
  };

  const pool = new Pool(poolConfig);

  pool.on("error", (err) => {
    // Parol yoki maxfiy ma'lumotlar logga chiqmasligi uchun faqat xabarni yozamiz
    console.error("AssetAudit: PostgreSQL ulanishida kutilmagan xatolik:", err.message);
  });

  return pool;
}

export function getPool(): Pool {
  if (!globalThis.__mulknazorat_pg_pool) {
    globalThis.__mulknazorat_pg_pool = createPool();
  }
  return globalThis.__mulknazorat_pg_pool;
}

/**
 * Drizzle ORM mijozi (Lazy singleton)
 * DATABASE_URL hali kiritilmagan yoki statik build jarayonida ham xato bermasdan ishlaydi.
 */
export function getDb(): NodePgDatabase<typeof schema> {
  if (!globalThis.__mulknazorat_drizzle_db) {
    const pool = getPool();
    globalThis.__mulknazorat_drizzle_db = drizzle(pool, { schema });
  }
  return globalThis.__mulknazorat_drizzle_db;
}

/**
 * To'g'ridan-to'g'ri so'rovlar uchun Proxy orqali eksport qilingan db obyekti
 */
export const db = new Proxy({} as NodePgDatabase<typeof schema>, {
  get(_target, prop) {
    const database = getDb();
    const value = (database as unknown as Record<string | symbol, unknown>)[prop];
    if (typeof value === "function") {
      return value.bind(database);
    }
    return value;
  },
});

export * from "./schema";
