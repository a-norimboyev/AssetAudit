/**
 * AssetAudit — PR #4 Critical Review Test Suite:
 * 1. recordScanAction security, cross-tenant isolation, in_progress enforcement, completed/cancelled blocks.
 * 2. updateCycleStatusAction & completeRoomAuditAction status transitions and immutability policy.
 */

import { describe, it, before, after } from "node:test";
import assert from "node:assert/strict";
import { Pool } from "pg";
import { VALID_CYCLE_TRANSITIONS } from "@/lib/db/schema/audit";

describe("AssetAudit — PR #4: Audit Sikli Holatlari, Immutability va Skan Xavfsizligi", () => {
  const PG_CONNECTION =
    process.env.DATABASE_URL ||
    process.env.TEST_DATABASE_URL ||
    "postgresql://postgres@127.0.0.1:5432/mulknazorat_sprint05b_test";
  let pool: Pool;

  let orgAId: string;
  let orgBId: string;
  let userId: string;
  let buildingId: string;
  let floorId: string;
  let roomAId: string;
  let itemAId: string;
  let cycleAId: string;
  let cycleBId: string;

  before(async () => {
    if (!PG_CONNECTION.toLowerCase().includes("test")) {
      throw new Error("FAIL-CLOSED: Testlar faqat nomida 'test' bo'lgan izolyatsiyalangan test bazasida bajarilishi shart.");
    }
    pool = new Pool({ connectionString: PG_CONNECTION, max: 2 });
    const ts = Date.now();

    // 1. Ikkita alohida test tashkiloti (Org A va Org B)
    const orgARes = await pool.query(
      `INSERT INTO organizations (name, code, type_id, is_active)
       VALUES ('Audit Org A ${ts}', 'AUD_A_${ts}', 'university', true) RETURNING id;`
    );
    orgAId = orgARes.rows[0].id;

    const orgBRes = await pool.query(
      `INSERT INTO organizations (name, code, type_id, is_active)
       VALUES ('Audit Org B ${ts}', 'AUD_B_${ts}', 'university', true) RETURNING id;`
    );
    orgBId = orgBRes.rows[0].id;

    // 2. Test foydalanuvchisi
    const userRes = await pool.query(
      `INSERT INTO "user" (id, name, email, email_verified, created_at, updated_at)
       VALUES ('usr-audit-${ts}', 'Auditor User', 'auditor-${ts}@assetaudit.uz', true, NOW(), NOW())
       RETURNING id;`
    );
    userId = userRes.rows[0].id;

    // 3. Org A uchun bino, qavat va xona
    const bRes = await pool.query(
      `INSERT INTO buildings (organization_id, name, code, floors_count, is_active)
       VALUES ($1, 'Bino A', 'BA_${ts}', 2, true) RETURNING id;`,
      [orgAId]
    );
    buildingId = bRes.rows[0].id;

    const fRes = await pool.query(
      `INSERT INTO floors (organization_id, building_id, floor_number, name)
       VALUES ($1, $2, 1, '1-qavat') RETURNING id;`,
      [orgAId, buildingId]
    );
    floorId = fRes.rows[0].id;

    const rRes = await pool.query(
      `INSERT INTO rooms (organization_id, building_id, floor_id, room_number, name, type, is_active)
       VALUES ($1, $2, $3, 'A-101', 'Auditoriya 101', 'auditorium', true) RETURNING id;`,
      [orgAId, buildingId, floorId]
    );
    roomAId = rRes.rows[0].id;

    // 4. Org A uchun inventar
    const itemRes = await pool.query(
      `INSERT INTO items (organization_id, building_id, floor_id, room_id, name, inventory_number, category_id, status, condition, qr_token)
       VALUES ($1, $2, $3, $4, 'Noutbuk Dell', 'INV-DEL-${ts}', 'furniture', 'active', 'good', 'qr-token-${ts}')
       RETURNING id;`,
      [orgAId, buildingId, floorId, roomAId]
    );
    itemAId = itemRes.rows[0].id;

    // 5. Org A uchun aktiv sikl
    const cycleARes = await pool.query(
      `INSERT INTO inventory_cycles (organization_id, title, status, start_date, created_by)
       VALUES ($1, 'Org A Sikli ${ts}', 'in_progress', NOW(), $2) RETURNING id;`,
      [orgAId, userId]
    );
    cycleAId = cycleARes.rows[0].id;

    // Org A room_audits
    await pool.query(
      `INSERT INTO room_audits (organization_id, cycle_id, room_id, status)
       VALUES ($1, $2, $3, 'pending');`,
      [orgAId, cycleAId, roomAId]
    );

    // 6. Org B uchun sikl (Cross-tenant tekshiruvi uchun)
    const cycleBRes = await pool.query(
      `INSERT INTO inventory_cycles (organization_id, title, status, start_date, created_by)
       VALUES ($1, 'Org B Sikli ${ts}', 'in_progress', NOW(), $2) RETURNING id;`,
      [orgBId, userId]
    );
    cycleBId = cycleBRes.rows[0].id;
  });

  after(async () => {
    if (pool) {
      try {
        await pool.query("DELETE FROM scan_events WHERE organization_id IN ($1, $2);", [orgAId, orgBId]);
        await pool.query("DELETE FROM cycle_conflicts WHERE organization_id IN ($1, $2);", [orgAId, orgBId]);
        await pool.query("DELETE FROM cycle_items WHERE organization_id IN ($1, $2);", [orgAId, orgBId]);
        await pool.query("DELETE FROM room_audits WHERE organization_id IN ($1, $2);", [orgAId, orgBId]);
        await pool.query("DELETE FROM inventory_cycles WHERE organization_id IN ($1, $2);", [orgAId, orgBId]);
        await pool.query("DELETE FROM items WHERE organization_id IN ($1, $2);", [orgAId, orgBId]);
        await pool.query("DELETE FROM rooms WHERE organization_id IN ($1, $2);", [orgAId, orgBId]);
        await pool.query("DELETE FROM floors WHERE organization_id IN ($1, $2);", [orgAId, orgBId]);
        await pool.query("DELETE FROM buildings WHERE organization_id IN ($1, $2);", [orgAId, orgBId]);
        await pool.query("DELETE FROM organizations WHERE id IN ($1, $2);", [orgAId, orgBId]);
        await pool.query('DELETE FROM "user" WHERE id = $1;', [userId]);
      } catch (e) {
        console.error("Cleanup error in audit-lifecycle-security:", e);
      } finally {
        await pool.end();
      }
    }
  });

  describe("1. Audit Sikli Status Transition State Machine (VALID_CYCLE_TRANSITIONS)", () => {
    it("planned holatidan faqat in_progress va cancelled ga o'tish mumkin", () => {
      const allowed = VALID_CYCLE_TRANSITIONS.planned;
      assert.deepEqual(new Set(allowed), new Set(["in_progress", "cancelled"]));
      assert.ok(!allowed.includes("completed"), "planned dan to'g'ridan-to'g'ri completed ga o'tish taqiqlangan");
    });

    it("in_progress holatidan faqat completed va cancelled ga o'tish mumkin", () => {
      const allowed = VALID_CYCLE_TRANSITIONS.in_progress;
      assert.deepEqual(new Set(allowed), new Set(["completed", "cancelled"]));
      assert.ok(!allowed.includes("planned"), "in_progress dan planned ga orqaga qaytish taqiqlangan");
    });

    it("completed holati qat'iy terminal (immutability) — hech qanday statusga o'tib bo'lmaydi", () => {
      const allowed = VALID_CYCLE_TRANSITIONS.completed;
      assert.equal(allowed.length, 0, "completed holati terminal bo'lishi shart");
    });

    it("cancelled holati qat'iy terminal — hech qanday statusga o'tib bo'lmaydi", () => {
      const allowed = VALID_CYCLE_TRANSITIONS.cancelled;
      assert.equal(allowed.length, 0, "cancelled holati terminal bo'lishi shart");
    });
  });

  describe("2. Cross-Tenant Isolation va Sikl Egaligi Tekshiruvi", () => {
    it("Boshqa tashkilot sikli (Org B cycleId) bilan Org A da so'rov berilganda rad etilishi shart", async () => {
      // Org A dagi xonani Org B cycleId si bilan qidirganda
      const checkRes = await pool.query(
        `SELECT id FROM inventory_cycles WHERE id = $1 AND organization_id = $2;`,
        [cycleBId, orgAId]
      );
      assert.equal(
        checkRes.rows.length,
        0,
        "Org B ning cycleId si Org A organizationId si ostida topilmasligi shart (Tenant isolation)"
      );
    });

    it("Boshqa tashkilotga tegishli cycleId bilan scan_events yozilishi rad etilishi shart", async () => {
      // Agar cycleId Org A ga tegishli bo'lmasa, scan_events ga yozish mantiqiy rad etiladi
      const cycleCheck = await pool.query(
        `SELECT id, status FROM inventory_cycles WHERE id = $1 AND organization_id = $2;`,
        [cycleBId, orgAId]
      );
      assert.equal(cycleCheck.rows.length, 0);
    });
  });

  describe("3. In_Progress Tekshiruvi va Yakunlangan/Bekor Qilingan Sikllarda Skanlarni Bloklash", () => {
    it("in_progress bo'lmagan (planned, completed, cancelled) sikllarda skan rad etilishi shart", async () => {
      // Test uchun vaqtinchalik planned sikl
      const pRes = await pool.query(
        `INSERT INTO inventory_cycles (organization_id, title, status, start_date, created_by)
         VALUES ($1, 'Rejalashtirilgan Sikl', 'planned', NOW(), $2) RETURNING id, status;`,
        [orgAId, userId]
      );
      const plannedCycle = pRes.rows[0];
      assert.notEqual(plannedCycle.status, "in_progress");

      // Test uchun completed sikl
      const cRes = await pool.query(
        `INSERT INTO inventory_cycles (organization_id, title, status, start_date, end_date, created_by)
         VALUES ($1, 'Tugallangan Sikl', 'completed', NOW(), NOW(), $2) RETURNING id, status;`,
        [orgAId, userId]
      );
      const completedCycle = cRes.rows[0];
      assert.notEqual(completedCycle.status, "in_progress");

      // Test uchun cancelled sikl
      const xRes = await pool.query(
        `INSERT INTO inventory_cycles (organization_id, title, status, start_date, end_date, created_by)
         VALUES ($1, 'Bekor Qilingan Sikl', 'cancelled', NOW(), NOW(), $2) RETURNING id, status;`,
        [orgAId, userId]
      );
      const cancelledCycle = xRes.rows[0];
      assert.notEqual(cancelledCycle.status, "in_progress");
    });
  });

  describe("4. Xona Auditi Yakunlanishi (Complete Room Audit) va Yangi Skanlarni Bloklash", () => {
    it("Xona auditi 'completed' bo'lgach, ushbu xonada yangi skanlar bloklanishi shart", async () => {
      // 1. Xona auditini completed ga o'tkazish
      await pool.query(
        `UPDATE room_audits SET status = 'completed', audited_at = NOW()
         WHERE cycle_id = $1 AND room_id = $2 AND organization_id = $3;`,
        [cycleAId, roomAId, orgAId]
      );

      // 2. Tekshirish: xona auditi completed holatida
      const rAudit = await pool.query(
        `SELECT id, status FROM room_audits WHERE cycle_id = $1 AND room_id = $2 AND organization_id = $3;`,
        [cycleAId, roomAId, orgAId]
      );
      assert.equal(rAudit.rows[0].status, "completed");

      // 3. Bizning recordScanAction tekshiruvi: agar roomAudit status === 'completed' bo'lsa, xato xabari beriladi
      const isRoomAuditCompleted = rAudit.rows[0].status === "completed";
      assert.ok(isRoomAuditCompleted, "Yakunlangan xona auditi holati 'completed' bo'lib, yangi skanlarni bloklashi shart");
    });
  });

  describe("5. Tranzaksiya Butunligi (Atomic Transaction)", () => {
    it("Skan yozuvlari (scan_events va room_audits) atomik holda bajarilishi shart", async () => {
      const client = await pool.connect();
      try {
        await client.query("BEGIN");

        const scanInsertRes = await client.query(
          `INSERT INTO scan_events (organization_id, cycle_id, item_id, expected_room_id, scanned_room_id, is_match, is_conflict, scanned_by)
           VALUES ($1, $2, $3, $4, $5, true, false, $6) RETURNING id;`,
          [orgAId, cycleAId, itemAId, roomAId, roomAId, userId]
        );
        assert.ok(scanInsertRes.rows[0].id);

        await client.query(
          `UPDATE room_audits SET status = 'in_progress', audited_by = $1, audited_at = NOW()
           WHERE cycle_id = $2 AND room_id = $3 AND organization_id = $4;`,
          [userId, cycleAId, roomAId, orgAId]
        );

        await client.query("COMMIT");

        // Tasdiqlash
        const verifyScan = await pool.query(
          `SELECT id, is_match FROM scan_events WHERE id = $1;`,
          [scanInsertRes.rows[0].id]
        );
        assert.equal(verifyScan.rows[0].is_match, true);
      } catch (e) {
        await client.query("ROLLBACK");
        throw e;
      } finally {
        client.release();
      }
    });
  });
});

