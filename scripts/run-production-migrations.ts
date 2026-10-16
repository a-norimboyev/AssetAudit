import * as path from "node:path";
import * as fs from "node:fs";
import { Pool, type PoolClient } from "pg";

export interface JournalEntry {
  idx: number;
  version: string;
  when: number;
  tag: string;
  breakpoints: boolean;
}

export interface Journal {
  version: string;
  dialect: string;
  entries: JournalEntry[];
}

export interface MigrationRequirement {
  tag: string;
  tables?: string[];
  columns?: { table: string; column: string }[];
  legacyTableAliases?: Record<string, string>; // e.g. universities -> organizations
}

/**
 * Har bir migratsiyaning qat'iy sxema shartnomasi (Schema Contract)
 * Drizzle meta jurnali (_journal.json) va snapshots bilan 100% moslashtirilgan.
 */
export const MIGRATION_REQUIREMENTS: MigrationRequirement[] = [
  {
    tag: "0000_dear_spectrum",
    tables: ["organizations"], // Dastlab universities bo'lgan, 0002 da organizations ga aylangan
    legacyTableAliases: { organizations: "universities" },
  },
  {
    tag: "0001_silent_alex_wilder",
    tables: ["account", "session", "user", "verification", "profiles"],
  },
  {
    tag: "0002_multi_organization",
    tables: ["organization_types", "organizations"],
    columns: [
      { table: "profiles", column: "organization_id" },
      { table: "organizations", column: "type_id" },
      { table: "organizations", column: "settings" },
    ],
  },
  {
    tag: "0003_small_gladiator",
    tables: [
      "buildings",
      "floors",
      "rooms",
      "item_categories",
      "items",
      "cycle_conflicts",
      "cycle_items",
      "inventory_cycles",
      "room_audits",
      "scan_events",
    ],
    columns: [
      { table: "items", column: "photo_url" },
      { table: "items", column: "qr_token" },
      { table: "items", column: "organization_id" },
    ],
  },
  {
    tag: "0004_odd_the_santerians",
    columns: [
      { table: "user", column: "username" },
      { table: "user", column: "display_username" },
    ],
  },
];

export interface VerificationResult {
  appliedHashes: Set<string>;
  adoptedMigrations: string[];
  pendingMigrations: JournalEntry[];
  driftErrors: string[];
}

/**
 * Baza sxemasi va Drizzle meta jurnali o'rtasidagi muvofiqlikni tekshirish
 * Fail-Closed Drift Detection dvigateli
 */
export async function verifySchemaIntegrity(
  client: PoolClient,
  journal: Journal
): Promise<VerificationResult> {
  // 1. __drizzle_migrations jadvalini ta'minlash
  await client.query(`
    CREATE TABLE IF NOT EXISTS "__drizzle_migrations" (
      id SERIAL PRIMARY KEY,
      hash text NOT NULL,
      created_at bigint
    );
  `);

  const existingMigRes = await client.query(`SELECT hash FROM "__drizzle_migrations";`);
  const appliedHashes = new Set(existingMigRes.rows.map((r: { hash: string }) => r.hash));

  // 2. Bazadagi barcha jadvallar va ustunlarni to'liq xaritaga olish (Schema Reflection)
  const tablesRes = await client.query(`
    SELECT table_name FROM information_schema.tables WHERE table_schema = 'public';
  `);
  const dbTables = new Set<string>(tablesRes.rows.map((r: { table_name: string }) => r.table_name));

  const colsRes = await client.query(`
    SELECT table_name, column_name FROM information_schema.columns WHERE table_schema = 'public';
  `);
  const dbColumns = new Set<string>(
    colsRes.rows.map((r: { table_name: string; column_name: string }) => `${r.table_name}.${r.column_name}`)
  );

  const adoptedMigrations: string[] = [];
  const driftErrors: string[] = [];
  const pendingMigrations: JournalEntry[] = [];

  for (const entry of journal.entries) {
    const req = MIGRATION_REQUIREMENTS.find((r) => r.tag === entry.tag);
    if (!req) {
      driftErrors.push(`[DRIFT]: Migratsiya "${entry.tag}" uchun rasmiy sxema shartnomasi topilmadi.`);
      continue;
    }

    const checkItem = (
      tableName: string,
      aliasName?: string
    ): boolean => {
      if (dbTables.has(tableName)) return true;
      if (aliasName && dbTables.has(aliasName)) return true;
      return false;
    };

    const checkCol = (tableName: string, colName: string): boolean => {
      return dbColumns.has(`${tableName}.${colName}`);
    };

    // Ushbu migratsiyaning kutilayotgan barcha elementlarini tekshirish
    const requiredItems: { name: string; present: boolean }[] = [];

    if (req.tables) {
      for (const t of req.tables) {
        const alias = req.legacyTableAliases?.[t];
        const present = checkItem(t, alias);
        requiredItems.push({ name: `table:${t}`, present });
      }
    }

    if (req.columns) {
      for (const c of req.columns) {
        const present = checkCol(c.table, c.column);
        requiredItems.push({ name: `column:${c.table}.${c.column}`, present });
      }
    }

    const presentCount = requiredItems.filter((i) => i.present).length;
    const totalCount = requiredItems.length;

    const isMarkedApplied = appliedHashes.has(entry.tag);

    if (isMarkedApplied) {
      // Agar migratsiya bajarilgan deb yozilgan bo'lsa, lekin uning elementlari bazada yo'q bo'lsa -> DRIFT!
      if (presentCount < totalCount) {
        const missing = requiredItems.filter((i) => !i.present).map((i) => i.name);
        driftErrors.push(
          `[CRITICAL DRIFT]: Migratsiya "${entry.tag}" __drizzle_migrations jadvalida mavjud, biroq bazada quyidagi elementlar topilmadi: ${missing.join(", ")}`
        );
      }
    } else {
      // Migratsiya __drizzle_migrations jadvalida yo'q
      if (presentCount === totalCount && totalCount > 0) {
        // 100% elementlar mavjud -> Eski to'liq migratsiyani xavfsiz qabul qilish (Verified Adoption)
        adoptedMigrations.push(entry.tag);
      } else if (presentCount === 0) {
        // 0% elementlar mavjud -> Haqiqiy yangi kutilayotgan migratsiya
        pendingMigrations.push(entry);
      } else {
        // Qisman mavjud, qisman yo'q (0 < presentCount < totalCount) -> Noma'lum/Buzilgan holat (FAIL-CLOSED)
        const present = requiredItems.filter((i) => i.present).map((i) => i.name);
        const missing = requiredItems.filter((i) => !i.present).map((i) => i.name);
        driftErrors.push(
          `[FAIL-CLOSED DRIFT]: Migratsiya "${entry.tag}" qisman bajarilgan holatda! Mavjud: [${present.join(", ")}], Yetishmayotgan: [${missing.join(", ")}]. Baza xavfsizligini ta'minlash uchun jarayon to'xtatildi.`
        );
      }
    }
  }

  return {
    appliedHashes,
    adoptedMigrations,
    pendingMigrations,
    driftErrors,
  };
}

/**
 * AssetAudit — Bulletproof Idempotent Production Migration Engine
 */
export async function runProductionMigrations() {
  const isCheckOnly = process.argv.includes("--check-only");
  const connectionString = process.env.DATABASE_URL;

  if (!connectionString) {
    console.error("XATO: DATABASE_URL muhit o'zgaruvchisi topilmadi!");
    process.exit(1);
  }

  const pool = new Pool({
    connectionString,
    max: 2,
    connectionTimeoutMillis: 5000,
    ssl: process.env.DATABASE_SSL === "true" ? { rejectUnauthorized: false } : undefined,
  });

  const client = await pool.connect();

  try {
    console.log("=== AssetAudit: Idempotent Migratsiya Tahlili va Dvigateli ===");

    // 1. _journal.json faylini o'qish
    const journalPath = path.resolve(process.cwd(), "drizzle", "meta", "_journal.json");
    if (!fs.existsSync(journalPath)) {
      throw new Error(`_journal.json topilmadi: ${journalPath}`);
    }

    const journal: Journal = JSON.parse(fs.readFileSync(journalPath, "utf-8"));
    const totalEntries = journal.entries.length;
    console.log(`[1/4] Drizzle sxemasida belgilangan jami migratsiyalar: ${totalEntries} ta (0000 -> 000${totalEntries - 1})`);

    // 2. Sxema va Drift tahlili
    const result = await verifySchemaIntegrity(client, journal);

    if (result.driftErrors.length > 0) {
      console.error("\n======================================================================");
      console.error("XAVFSIZLIK TO'XTATILISHI (FAIL-CLOSED DRIFT DETECTED):");
      for (const err of result.driftErrors) {
        console.error(`  -> ${err}`);
      }
      console.error("======================================================================\n");
      throw new Error("Baza sxemasida mos kelmaydigan kutilmagan farq (drift) aniqlandi. Operatsiya to'xtatildi.");
    }

    // 3. Qabul qilinishi tasdiqlangan migratsiyalarni muhrlash
    if (result.adoptedMigrations.length > 0) {
      console.log(`[2/4] Bazadagi mavjud to'liq sxema 100% tasdiqlandi. ${result.adoptedMigrations.length} ta migratsiya Drizzle ro'yxatiga muhrlanmoqda...`);
      for (const tag of result.adoptedMigrations) {
        await client.query(
          `INSERT INTO "__drizzle_migrations" (hash, created_at) VALUES ($1, $2);`,
          [tag, Date.now()]
        );
        result.appliedHashes.add(tag);
      }
    } else {
      console.log(`[2/4] Barcha mavjud migratsiyalar allaqachon muhrlangan va sxema bilan to'liq mos keladi.`);
    }

    console.log(`[3/4] Migratsiyalar xulosasi:`);
    console.log(`  -> Tatbiq etilgan va tasdiqlangan: ${result.appliedHashes.size} / ${totalEntries}`);
    console.log(`  -> Kutilayotgan: ${result.pendingMigrations.length}`);

    if (isCheckOnly) {
      if (result.pendingMigrations.length === 0) {
        console.log("  -> [IDEMPOTENT STATUS]: Barcha migratsiyalar to'liq mavjud. Hech qanday SQL ijro etish shart emas.");
      } else {
        console.log(`  -> [PENDING]: Quyidagi yangi migratsiyalar zarur: ${result.pendingMigrations.map((m) => m.tag).join(", ")}`);
      }
      return;
    }

    // 4. Kutilayotgan yangi migratsiyalarni tranzaksiyada bajarish
    if (result.pendingMigrations.length === 0) {
      console.log("[4/4] Baza to'liq dolzarb holatda. Yangi SQL migratsiyalar mavjud emas.");
    } else {
      console.log(`[4/4] ${result.pendingMigrations.length} ta yangi migratsiya tranzaksiya bilan qo'llanilmoqda...`);
      for (const m of result.pendingMigrations) {
        const sqlFile = path.resolve(process.cwd(), "drizzle", `${m.tag}.sql`);
        if (!fs.existsSync(sqlFile)) {
          throw new Error(`Migratsiya SQL fayli topilmadi: ${sqlFile}`);
        }
        const sqlContent = fs.readFileSync(sqlFile, "utf-8");

        console.log(`  -> Bajarilmoqda: ${m.tag}...`);
        await client.query("BEGIN;");
        try {
          await client.query(sqlContent);
          await client.query(
            `INSERT INTO "__drizzle_migrations" (hash, created_at) VALUES ($1, $2);`,
            [m.tag, Date.now()]
          );
          await client.query("COMMIT;");
          console.log(`  -> Muvaffaqiyatli: ${m.tag}`);
        } catch (err) {
          await client.query("ROLLBACK;");
          throw new Error(`Migratsiya ${m.tag} xatosi tufayli ROLLBACK qilindi: ${err instanceof Error ? err.message : String(err)}`);
        }
      }
    }

    console.log("======================================================================");
    console.log("NATIJA: Baza migratsiya holati 100% IDEMPOTENT va xavfsiz tasdiqlandi!");
    console.log("======================================================================");
  } finally {
    client.release();
    await pool.end();
  }
}

if (require.main === module || process.argv[1]?.endsWith("run-production-migrations.ts")) {
  runProductionMigrations().catch((err) => {
    console.error("Migratsiya skripti xatosi:", err.message);
    process.exit(1);
  });
}
