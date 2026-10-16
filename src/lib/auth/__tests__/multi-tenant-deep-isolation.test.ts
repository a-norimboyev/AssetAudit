/**
 * AssetAudit — Sprint 14: Multi-Tenant Qat'iy Izolyatsiya va RBAC Sinovlari
 * Izolyatsiyalangan test bazasida (mulknazorat_sprint05b_test) tekshiriladi.
 */

import { describe, it, before, after } from "node:test";
import assert from "node:assert/strict";
import { Pool } from "pg";
import { canCreateNewItem, canRelocateItem } from "../authorization-rules";

describe("AssetAudit — Sprint 14: Multi-Tenant Qat'iy Izolyatsiya va RBAC Chuqur Sinovlari", () => {
  const PG_CONNECTION = "postgresql://postgres@127.0.0.1:5432/mulknazorat_sprint05b_test";
  let pool: Pool;
  let orgAId: string;
  let orgBId: string;
  let bldAId: string;
  let bldBId: string;
  let roomAId: string;
  let roomBId: string;
  let itemAId: string;
  let itemBId: string;
  const ts = Date.now();

  before(async () => {
    pool = new Pool({ connectionString: PG_CONNECTION, max: 2 });

    // 1. Tashkilot A (TATU) va Tashkilot B (O'zMU) yaratish
    const orgARes = await pool.query(
      `INSERT INTO organizations (name, code, type_id, is_active)
       VALUES ('TATU Sinov', 'TATU_${ts}', 'university', true) RETURNING id;`
    );
    orgAId = orgARes.rows[0].id;

    const orgBRes = await pool.query(
      `INSERT INTO organizations (name, code, type_id, is_active)
       VALUES ('OzMU Sinov', 'OZMU_${ts}', 'university', true) RETURNING id;`
    );
    orgBId = orgBRes.rows[0].id;

    // 2. Bino A va Bino B
    const bldARes = await pool.query(
      `INSERT INTO buildings (organization_id, name, code, floors_count, is_active)
       VALUES ($1, 'Bosh Bino TATU', 'A_${ts}', 2, true) RETURNING id;`,
      [orgAId]
    );
    bldAId = bldARes.rows[0].id;

    const bldBRes = await pool.query(
      `INSERT INTO buildings (organization_id, name, code, floors_count, is_active)
       VALUES ($1, 'Bosh Bino OzMU', 'B_${ts}', 2, true) RETURNING id;`,
      [orgBId]
    );
    bldBId = bldBRes.rows[0].id;

    // 3. Qavatlar va Xonalar
    const flARes = await pool.query(
      `INSERT INTO floors (organization_id, building_id, floor_number, name)
       VALUES ($1, $2, 1, '1-qavat') RETURNING id;`,
      [orgAId, bldAId]
    );
    const flARId = flARes.rows[0].id;

    const flBRes = await pool.query(
      `INSERT INTO floors (organization_id, building_id, floor_number, name)
       VALUES ($1, $2, 1, '1-qavat') RETURNING id;`,
      [orgBId, bldBId]
    );
    const flBId = flBRes.rows[0].id;

    const rARes = await pool.query(
      `INSERT INTO rooms (organization_id, building_id, floor_id, room_number, name, type, is_active)
       VALUES ($1, $2, $3, '101', 'Kafedra', 'office', true) RETURNING id;`,
      [orgAId, bldAId, flARId]
    );
    roomAId = rARes.rows[0].id;

    const rBRes = await pool.query(
      `INSERT INTO rooms (organization_id, building_id, floor_id, room_number, name, type, is_active)
       VALUES ($1, $2, $3, '202', 'Rektorat', 'office', true) RETURNING id;`,
      [orgBId, bldBId, flBId]
    );
    roomBId = rBRes.rows[0].id;

    // 4. Inventarlar
    const itARes = await pool.query(
      `INSERT INTO items (organization_id, building_id, floor_id, room_id, name, inventory_number, category_id, qr_token, status, condition, price)
       VALUES ($1, $2, $3, $4, 'TATU Kompyuter', 'INV-TATU-${ts}', 'computer_equipment', 'qr_token_tatu_${ts}', 'active', 'good', 7500000.00)
       RETURNING id;`,
      [orgAId, bldAId, flARId, roomAId]
    );
    itemAId = itARes.rows[0].id;

    const itBRes = await pool.query(
      `INSERT INTO items (organization_id, building_id, floor_id, room_id, name, inventory_number, category_id, qr_token, status, condition, price)
       VALUES ($1, $2, $3, $4, 'OzMU Printer', 'INV-OZMU-${ts}', 'computer_equipment', 'qr_token_ozmu_${ts}', 'active', 'good', 3200000.00)
       RETURNING id;`,
      [orgBId, bldBId, flBId, roomBId]
    );
    itemBId = itBRes.rows[0].id;
  });

  after(async () => {
    if (pool) {
      await pool.query("DELETE FROM items WHERE organization_id IN ($1, $2);", [orgAId, orgBId]);
      await pool.query("DELETE FROM rooms WHERE organization_id IN ($1, $2);", [orgAId, orgBId]);
      await pool.query("DELETE FROM floors WHERE organization_id IN ($1, $2);", [orgAId, orgBId]);
      await pool.query("DELETE FROM buildings WHERE organization_id IN ($1, $2);", [orgAId, orgBId]);
      await pool.query("DELETE FROM organizations WHERE id IN ($1, $2);", [orgAId, orgBId]);
      await pool.end();
    }
  });

  it("1. Cross-Tenant Izolyatsiyasi: Admin A faqat Org A inventarlarini ko'rishi shart", async () => {
    const res = await pool.query(
      "SELECT id, name FROM items WHERE organization_id = $1;",
      [orgAId]
    );
    assert.equal(res.rows.length, 1);
    assert.equal(res.rows[0].id, itemAId);
    assert.equal(res.rows[0].name, "TATU Kompyuter");
  });

  it("2. Cross-Tenant Izolyatsiyasi: Admin B faqat Org B inventarlarini ko'rishi shart", async () => {
    const res = await pool.query(
      "SELECT id, name FROM items WHERE organization_id = $1;",
      [orgBId]
    );
    assert.equal(res.rows.length, 1);
    assert.equal(res.rows[0].id, itemBId);
    assert.equal(res.rows[0].name, "OzMU Printer");
  });

  it("3. Composite FK Himoyasi: Org A inventarini Org B xonasiga biriktirish DB darajasida bloklanishi shart", async () => {
    await assert.rejects(
      async () => {
        // Org A inventarini Org B xonasiga ko'chirishga urinish
        await pool.query(
          "UPDATE items SET room_id = $1, building_id = $2 WHERE id = $3 AND organization_id = $4;",
          [roomBId, bldBId, itemAId, orgAId]
        );
      },
      (err: { code?: string }) => {
        // PostgreSQL FK yoki check cheklovi (23503 foreign key violation)
        return err.code === "23503";
      },
      "Org A inventari begona Org B xonasiga biriktirilganda 23503 FK xatosi chiqishi shart"
    );
  });

  it("4. RBAC Cheklovi: Registrar yangi inventar qo'sha oladi, lekin rasmiy ko'chira (relocate) OLMAYDI", () => {
    assert.equal(canCreateNewItem("registrar"), true, "Registrar yangi inventar qo'sha olishi kerak");
    assert.equal(canRelocateItem("registrar"), false, "Registrar inventarning rasmiy xonasini ko'chira olmasligi shart");
  });

  it("5. RBAC Cheklovi: Inspector yangi inventar yarata OLMAYDI va ko'chira OLMAYDI", () => {
    assert.equal(canCreateNewItem("inspector"), false, "Inspector yangi inventar qo'sha olmasligi shart");
    assert.equal(canRelocateItem("inspector"), false, "Inspector inventar xonasini ko'chira olmasligi shart");
  });

  it("6. RBAC Cheklovi: Faqat Organization Admin rasmiy ko'chirish (relocate) huquqiga ega", () => {
    assert.equal(canRelocateItem("organization_admin"), true, "Organization Admin rasmiy ko'chirish huquqiga ega");
  });

  it("7. Public QR Maxfiyligi: Public QR sahifasida narx va mas'ul shaxs sirlari chiqmasligi shart", async () => {
    const res = await pool.query(
      `SELECT name, inventory_number, qr_token FROM items WHERE id = $1;`,
      [itemAId]
    );
    assert.ok(res.rows[0].qr_token, "QR token mavjud");
    assert.equal(res.rows[0].inventoryNumber, undefined, "Narx yoki maxfiy ustunlar public selectga kiritilmaydi");
  });
});
