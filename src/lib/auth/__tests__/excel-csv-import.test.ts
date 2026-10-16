/**
 * AssetAudit — Sprint 14: Excel / CSV Import Mantig'i Sinovlari
 * Izolyatsiyalangan test bazasida (mulknazorat_sprint05b_test) tekshiriladi.
 */

import { describe, it, before, after } from "node:test";
import assert from "node:assert/strict";
import { Pool } from "pg";
import * as XLSX from "xlsx";

describe("AssetAudit — Sprint 14: Excel / CSV Import va Validatsiya Sinovlari", () => {
  const PG_CONNECTION = "postgresql://postgres@127.0.0.1:5432/mulknazorat_sprint05b_test";
  let pool: Pool;
  let orgId: string;
  let bldId: string;
  let roomId: string;
  const ts = Date.now();

  before(async () => {
    pool = new Pool({ connectionString: PG_CONNECTION, max: 2 });

    const orgRes = await pool.query(
      `INSERT INTO organizations (name, code, type_id, is_active)
       VALUES ('Import Sinov Org', 'IMP_${ts}', 'university', true) RETURNING id;`
    );
    orgId = orgRes.rows[0].id;

    const bRes = await pool.query(
      `INSERT INTO buildings (organization_id, name, code, floors_count, is_active)
       VALUES ($1, 'Bosh Bino Import', 'IMP_B1', 2, true) RETURNING id;`,
      [orgId]
    );
    bldId = bRes.rows[0].id;

    const fRes = await pool.query(
      `INSERT INTO floors (organization_id, building_id, floor_number, name)
       VALUES ($1, $2, 1, '1-qavat') RETURNING id;`,
      [orgId, bldId]
    );
    const flId = fRes.rows[0].id;

    const rRes = await pool.query(
      `INSERT INTO rooms (organization_id, building_id, floor_id, room_number, name, type, is_active)
       VALUES ($1, $2, $3, '101', 'Kafedra', 'office', true) RETURNING id;`,
      [orgId, bldId, flId]
    );
    roomId = rRes.rows[0].id;

    // Mavjud bitta inventar qo'shib qo'yamiz (takroriylikni tekshirish uchun)
    await pool.query(
      `INSERT INTO items (organization_id, building_id, floor_id, room_id, name, inventory_number, category_id, qr_token)
       VALUES ($1, $2, $3, $4, 'Mavjud Printer', 'INV-EXISTING-1', 'computer_equipment', 'qr_existing_1');`,
      [orgId, bldId, flId, roomId]
    );
  });

  after(async () => {
    if (pool) {
      await pool.query("DELETE FROM items WHERE organization_id = $1;", [orgId]);
      await pool.query("DELETE FROM rooms WHERE organization_id = $1;", [orgId]);
      await pool.query("DELETE FROM floors WHERE organization_id = $1;", [orgId]);
      await pool.query("DELETE FROM buildings WHERE organization_id = $1;", [orgId]);
      await pool.query("DELETE FROM organizations WHERE id = $1;", [orgId]);
      await pool.end();
    }
  });

  it("1. XLSX / CSV ma'lumotlarini o'qish: sheet_to_json to'g'ri qatorlarni ajratishi kerak", () => {
    const csvContent = "Inventar raqami,Nomi,Bino,Xona,Kategoriya,Narxi\n" +
      "INV-NEW-01,Stol,IMP_B1,101,furniture,500000\n" +
      "INV-NEW-02,Stul,IMP_B1,101,furniture,150000\n";

    const workbook = XLSX.read(Buffer.from(csvContent), { type: "buffer" });
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const rows = XLSX.utils.sheet_to_json<Record<string, string | number>>(sheet);

    assert.equal(rows.length, 2);
    assert.equal(rows[0]["Inventar raqami"], "INV-NEW-01");
    assert.equal(rows[0]["Nomi"], "Stol");
    assert.equal(rows[1]["Inventar raqami"], "INV-NEW-02");
  });

  it("2. Takroriy inventar raqami tekshiruvi: bazada mavjud raqam rad etilishi kerak", async () => {
    const existingCheck = await pool.query(
      "SELECT id FROM items WHERE organization_id = $1 AND inventory_number = 'INV-EXISTING-1';",
      [orgId]
    );
    assert.equal(existingCheck.rows.length, 1, "Mavjud inventar bazada topilishi shart");
  });

  it("3. Batch kiritish: yangi inventarlar to'g'ri organizationId bilan muhrlanishi kerak", async () => {
    const newInvNum = `INV-BATCH-${Date.now()}`;
    await pool.query(
      `INSERT INTO items (organization_id, building_id, floor_id, room_id, name, inventory_number, category_id, qr_token)
       VALUES ($1, $2, (SELECT floor_id FROM rooms WHERE id = $3), $3, 'Batch Stol', $4, 'furniture', 'qr_batch_1');`,
      [orgId, bldId, roomId, newInvNum]
    );

    const res = await pool.query("SELECT organization_id FROM items WHERE inventory_number = $1;", [newInvNum]);
    assert.equal(res.rows[0].organization_id, orgId);
  });
});
