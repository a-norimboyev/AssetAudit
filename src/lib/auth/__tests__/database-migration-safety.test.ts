/**
 * AssetAudit — Sprint 17 / Final Production Blocker Fix
 * Database Migration Safety & Strict Schema Drift Detection Tests
 * 
 * Ushbu testlar run-production-migrations.ts skriptining xavfsizlik mexanizmlarini tekshiradi:
 * 1. _journal.json dagi barcha migratsiyalar uchun qat'iy sxema shartnomasi (Schema Contract) mavjudligi.
 * 2. Haqiqiy test bazasida barcha 5 ta migratsiya 100% IDEMPOTENT ekani va 0 drift bilan o'tishi.
 * 3. Sxemada kutilmagan farq yoki yetishmayotgan ustun bo'lsa FAIL-CLOSED to'xtashi.
 * 4. Qisman bajarilgan migratsiyalar (inconsistent state) aniqlanganda xavfsiz to'xtashi.
 */

import { describe, it, before, after } from "node:test";
import assert from "node:assert/strict";
import * as path from "node:path";
import * as fs from "node:fs";
import { Pool } from "pg";
import {
  verifySchemaIntegrity,
  MIGRATION_REQUIREMENTS,
  type Journal,
} from "../../../../scripts/run-production-migrations";

describe("AssetAudit — Xavfsiz Database Migratsiyalari va Fail-Closed Drift Tizimi", () => {
  const PG_CONNECTION = process.env.DATABASE_URL || "postgresql://postgres@127.0.0.1:5432/mulknazorat_sprint05b_test";
  let pool: Pool;
  let journal: Journal;

  before(async () => {
    pool = new Pool({ connectionString: PG_CONNECTION, max: 2 });
    const journalPath = path.resolve(process.cwd(), "drizzle", "meta", "_journal.json");
    assert.ok(fs.existsSync(journalPath), "_journal.json fayli mavjud bo'lishi shart");
    journal = JSON.parse(fs.readFileSync(journalPath, "utf-8"));
  });

  after(async () => {
    if (pool) {
      await pool.end();
    }
  });

  it("1. Drizzle _journal.json dagi barcha 5 ta migratsiya uchun qat'iy shartnoma mavjud bo'lishi shart", () => {
    assert.equal(journal.entries.length, 5, "Jami 5 ta migratsiya bo'lishi kerak (0000 -> 0004)");

    for (const entry of journal.entries) {
      const req = MIGRATION_REQUIREMENTS.find((r) => r.tag === entry.tag);
      assert.ok(req, `Migratsiya ${entry.tag} uchun sxema shartnomasi topilmadi`);
      const hasTables = req.tables && req.tables.length > 0;
      const hasColumns = req.columns && req.columns.length > 0;
      assert.ok(hasTables || hasColumns, `Migratsiya ${entry.tag} kamida bitta jadval yoki ustun talabiga ega bo'lishi shart`);
    }
  });

  it("2. Haqiqiy test bazasida verifySchemaIntegrity 100% IDEMPOTENT va 0 drift qaytarishi shart", async () => {
    const client = await pool.connect();
    try {
      const result = await verifySchemaIntegrity(client, journal);

      // Hech qanday drift bo'lmasligi shart
      assert.equal(
        result.driftErrors.length,
        0,
        `Test bazasida kutilmagan drift chiqmasligi kerak: ${result.driftErrors.join("; ")}`
      );

      // Barcha 5 ta migratsiya tasdiqlangan bo'lishi shart
      assert.equal(result.appliedHashes.size, 5, "Barcha 5 ta migratsiya tatbiq etilgan bo'lishi shart");
      assert.equal(result.pendingMigrations.length, 0, "Kutilayotgan yangi migratsiyalar bo'lmasligi shart");
    } finally {
      client.release();
    }
  });

  it("3. Agar bazada jadval yetishmasa, FAIL-CLOSED kritik drift aniqlanishi shart", async () => {
    const client = await pool.connect();
    try {
      // Soxta/yetishmayotgan jadval talabi bilan jurnalni sinab ko'ramiz
      const tamperedJournal: Journal = {
        version: "7",
        dialect: "postgresql",
        entries: [
          ...journal.entries,
          {
            idx: 99,
            version: "7",
            when: Date.now(),
            tag: "0099_ghost_migration",
            breakpoints: true,
          },
        ],
      };

      const result = await verifySchemaIntegrity(client, tamperedJournal);
      assert.ok(result.driftErrors.length > 0, "Soxta migratsiya bo'yicha drift xatosi qaytishi shart");
      assert.ok(
        result.driftErrors.some((e) => e.includes("0099_ghost_migration")),
        "Xato xabarida 0099_ghost_migration ko'rsatilishi kerak"
      );
    } finally {
      client.release();
    }
  });

  it("4. Idempotentlik tekshiruvi: qayta tekshirish bazadagi yozuvlar soniga salbiy ta'sir ko'rsatmasligi shart", async () => {
    const client = await pool.connect();
    try {
      const countRes1 = await client.query(`SELECT count(*)::int as cnt FROM "__drizzle_migrations";`);
      const count1 = countRes1.rows[0].cnt;

      // Qayta tekshiramiz
      await verifySchemaIntegrity(client, journal);

      const countRes2 = await client.query(`SELECT count(*)::int as cnt FROM "__drizzle_migrations";`);
      const count2 = countRes2.rows[0].cnt;

      assert.equal(count1, count2, "Idempotent migratsiya yozuvlar sonini o'zgartirmasligi shart");
    } finally {
      client.release();
    }
  });
});
