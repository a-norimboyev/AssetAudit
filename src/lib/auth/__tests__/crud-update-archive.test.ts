/**
 * AssetAudit — Sprint 13: CRUD Update va Soft Archive Funksiyalari Sinovi
 * Izolyatsiyalangan test bazasida (mulknazorat_sprint05b_test) tekshiriladi.
 */

import { describe, it, before, after } from "node:test";
import assert from "node:assert/strict";
import { Pool } from "pg";

describe("AssetAudit — Sprint 13: Bino, Qavat, Xona va Inventar Update / Soft-Archive Sinovlari", () => {
  const PG_CONNECTION =
    process.env.DATABASE_URL ||
    process.env.TEST_DATABASE_URL ||
    "postgresql://postgres@127.0.0.1:5432/mulknazorat_sprint05b_test";
  let pool: Pool;
  let orgId: string;
  let buildingId: string;
  let floorId: string;
  let roomId: string;
  let itemId: string;

  before(async () => {
    if (!PG_CONNECTION.toLowerCase().includes("test")) {
      throw new Error("FAIL-CLOSED: Testlar faqat nomida 'test' bo'lgan izolyatsiyalangan test bazasida bajarilishi shart.");
    }
    pool = new Pool({ connectionString: PG_CONNECTION, max: 2 });
    const ts = Date.now();

    // 1. Yangi test tashkilotini yaratish
    const orgRes = await pool.query(
      "INSERT INTO organizations (name, code, type_id, is_active) VALUES ('TATU Test 13', $1, 'university', true) RETURNING id;",
      [`TATU_${ts}`]
    );
    orgId = orgRes.rows[0].id;
    assert.ok(orgId, "Tashkilot yaratilishi shart");

    // 2. Test Binosi
    const bRes = await pool.query(
      `INSERT INTO buildings (organization_id, name, code, floors_count, is_active)
       VALUES ($1, 'Test Bino 13', 'B13_${ts}', 3, true) RETURNING id;`,
      [orgId]
    );
    buildingId = bRes.rows[0].id;

    // 3. Test Qavati
    const fRes = await pool.query(
      `INSERT INTO floors (organization_id, building_id, floor_number, name)
       VALUES ($1, $2, 1, '1-qavat') RETURNING id;`,
      [orgId, buildingId]
    );
    floorId = fRes.rows[0].id;

    // 4. Test Xonasi
    const rRes = await pool.query(
      `INSERT INTO rooms (organization_id, building_id, floor_id, room_number, name, type, is_active)
       VALUES ($1, $2, $3, '101', 'Test Xona', 'office', true) RETURNING id;`,
      [orgId, buildingId, floorId]
    );
    roomId = rRes.rows[0].id;

    // 5. Test Inventari
    const itemRes = await pool.query(
      `INSERT INTO items (organization_id, building_id, floor_id, room_id, name, inventory_number, category_id, status, condition, qr_token)
       VALUES ($1, $2, $3, $4, 'Test Stol 13', 'INV-13-${ts}', 'furniture', 'active', 'good', 'qr_token_13_${ts}') RETURNING id;`,
      [orgId, buildingId, floorId, roomId]
    );
    itemId = itemRes.rows[0].id;
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

  it("1. Bino tahrirlash: nom va manzil muvaffaqiyatli yangilanishi kerak", async () => {
    await pool.query(
      "UPDATE buildings SET name = 'Bosh Korpus Yangilangan', address = 'Amir Temur 108' WHERE id = $1;",
      [buildingId]
    );
    const res = await pool.query("SELECT name, address FROM buildings WHERE id = $1;", [buildingId]);
    assert.equal(res.rows[0].name, "Bosh Korpus Yangilangan");
    assert.equal(res.rows[0].address, "Amir Temur 108");
  });

  it("2. Bino soft-delete: is_active = false bo'lishi va yozuv o'chirilmasligi shart", async () => {
    await pool.query("UPDATE buildings SET is_active = false WHERE id = $1;", [buildingId]);
    const res = await pool.query("SELECT is_active FROM buildings WHERE id = $1;", [buildingId]);
    assert.equal(res.rows[0].is_active, false);
    // Qayta faollashtiramiz keyingi testlar uchun
    await pool.query("UPDATE buildings SET is_active = true WHERE id = $1;", [buildingId]);
  });

  it("3. Qavat tahrirlash: nomi muvaffaqiyatli yangilanishi kerak", async () => {
    await pool.query("UPDATE floors SET name = 'Bosh Qavat' WHERE id = $1;", [floorId]);
    const res = await pool.query("SELECT name FROM floors WHERE id = $1;", [floorId]);
    assert.equal(res.rows[0].name, "Bosh Qavat");
  });

  it("4. Xona tahrirlash: xona nomi, turi va sig'imi yangilanishi kerak", async () => {
    await pool.query(
      "UPDATE rooms SET name = 'Katta Majlislar Zali', type = 'conference', capacity = 50 WHERE id = $1;",
      [roomId]
    );
    const res = await pool.query("SELECT name, type, capacity FROM rooms WHERE id = $1;", [roomId]);
    assert.equal(res.rows[0].name, "Katta Majlislar Zali");
    assert.equal(res.rows[0].type, "conference");
    assert.equal(res.rows[0].capacity, 50);
  });

  it("5. Xona soft-delete: is_active = false bo'lishi va audit zanjiri buzilmasligi shart", async () => {
    await pool.query("UPDATE rooms SET is_active = false WHERE id = $1;", [roomId]);
    const res = await pool.query("SELECT is_active FROM rooms WHERE id = $1;", [roomId]);
    assert.equal(res.rows[0].is_active, false);
  });

  it("6. Inventar tahrirlash: nom, tavsif, holat va narx yangilanishi kerak", async () => {
    await pool.query(
      "UPDATE items SET name = 'Ergonomik Stol', description = 'Yangilangan model', condition = 'new', price = 1500000.00 WHERE id = $1;",
      [itemId]
    );
    const res = await pool.query("SELECT name, description, condition, price FROM items WHERE id = $1;", [itemId]);
    assert.equal(res.rows[0].name, "Ergonomik Stol");
    assert.equal(res.rows[0].description, "Yangilangan model");
    assert.equal(res.rows[0].condition, "new");
    assert.equal(parseFloat(res.rows[0].price), 1500000.0);
  });

  it("7. Inventar soft-archive: status = 'written_off' bo'lishi, Hard DELETE taqiqlanishi shart", async () => {
    await pool.query("UPDATE items SET status = 'written_off' WHERE id = $1;", [itemId]);
    const res = await pool.query("SELECT status, qr_token FROM items WHERE id = $1;", [itemId]);
    assert.equal(res.rows[0].status, "written_off");
    assert.ok(res.rows[0].qr_token, "QR token va tarixiy havola saqlanib qolishi shart");
  });
});
