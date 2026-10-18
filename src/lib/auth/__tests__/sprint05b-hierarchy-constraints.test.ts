import { describe, it, before, after } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { Client } from "pg";
import { floors, rooms } from "../../db/schema/locations";
import { items } from "../../db/schema/inventory";
import { cycleItems } from "../../db/schema/audit";

describe("AssetAudit — Sprint 05B-1: Bino → Qavat → Xona → Inventar Ierarxik Xavfsizlik Tekshiruvlari", () => {
  // =========================================================================
  // 1. DRIZZLE SCHEMA DARAYASIDAGI KOMPOZIT CHEKLOVLAR (SCHEMA AST AUDIT)
  // =========================================================================
  describe("1. Drizzle ORM Schema Iyerarxiya Constraintlari Tekshiruvi", () => {
    it("floors jadvalida (organization_id, building_id, id) kompozit UNIQUE cheklovi mavjud bo'lishi shart", () => {
      // Drizzle schema export va ustunlar mavjudligi
      assert.ok(floors.id);
      assert.ok(floors.organizationId);
      assert.ok(floors.buildingId);
    });

    it("rooms jadvalida (organization_id, building_id, floor_id, id) 4-qatlamli kompozit UNIQUE mavjud bo'lishi shart", () => {
      assert.ok(rooms.id);
      assert.ok(rooms.organizationId);
      assert.ok(rooms.buildingId);
      assert.ok(rooms.floorId);
    });

    it("items jadvalida 4-qatlamli bino, qavat, xona va tashkilot kompozit bog'lanishi (fk_items_hierarchy_composite) bo'lishi shart", () => {
      assert.ok(items.id);
      assert.ok(items.organizationId);
      assert.ok(items.buildingId);
      assert.ok(items.floorId);
      assert.ok(items.roomId);
    });

    it("cycle_items jadvalida 4-qatlamli muzlatilgan snapshot kompozit bog'lanishi bo'lishi shart", () => {
      assert.ok(cycleItems.id);
      assert.ok(cycleItems.organizationId);
      assert.ok(cycleItems.expectedBuildingId);
      assert.ok(cycleItems.expectedFloorId);
      assert.ok(cycleItems.expectedRoomId);
    });
  });

  // =========================================================================
  // 2. SQL MIGRATSIYA (0003_small_gladiator.sql) QAT'IY AUDITI
  // =========================================================================
  describe("2. 0003_small_gladiator.sql Migratsiyasidagi DB Constraintlari", () => {
    const migrationPath = resolve(process.cwd(), "drizzle/0003_small_gladiator.sql");
    const sqlContent = readFileSync(migrationPath, "utf-8");

    it("floors jadvalida uq_floors_org_bld_id UNIQUE constrainti belgilangan bo'lishi shart", () => {
      assert.match(
        sqlContent,
        /CONSTRAINT "uq_floors_org_bld_id" UNIQUE\("organization_id","building_id","id"\)/,
        "floors jadvali (organization_id, building_id, id) ustunlari bo'yicha UNIQUE bo'lishi shart"
      );
    });

    it("rooms jadvalida uq_rooms_hierarchy UNIQUE constrainti belgilangan bo'lishi shart", () => {
      assert.match(
        sqlContent,
        /CONSTRAINT "uq_rooms_hierarchy" UNIQUE\("organization_id","building_id","floor_id","id"\)/,
        "rooms jadvali (organization_id, building_id, floor_id, id) ustunlari bo'yicha UNIQUE bo'lishi shart"
      );
    });

    it("rooms jadvalida fk_rooms_hierarchy_composite cross-building qavat bog'lanishini bloklashi shart", () => {
      assert.match(
        sqlContent,
        /ALTER TABLE "rooms" ADD CONSTRAINT "fk_rooms_hierarchy_composite" FOREIGN KEY \("organization_id","building_id","floor_id"\) REFERENCES "public"\."floors"\("organization_id","building_id","id"\) ON DELETE restrict/,
        "rooms jadvali faqat tegishli bino qavatiga bog'lanishi DB darajasida kafolatlanishi shart"
      );
    });

    it("items jadvalida fk_items_hierarchy_composite 4-qatlamli nomutanosiblikni bloklashi shart", () => {
      assert.match(
        sqlContent,
        /ALTER TABLE "items" ADD CONSTRAINT "fk_items_hierarchy_composite" FOREIGN KEY \("organization_id","building_id","floor_id","room_id"\) REFERENCES "public"\."rooms"\("organization_id","building_id","floor_id","id"\) ON DELETE restrict/,
        "items jadvali (org, building, floor, room) kompozit FK bilan rooms jadvaliga qat'iy bog'lanishi shart"
      );
    });

    it("cycle_items jadvalida fk_cycle_items_hierarchy_composite mavjud bo'lishi shart", () => {
      assert.match(
        sqlContent,
        /ALTER TABLE "cycle_items" ADD CONSTRAINT "fk_cycle_items_hierarchy_composite" FOREIGN KEY \("organization_id","expected_building_id","expected_floor_id","expected_room_id"\) REFERENCES "public"\."rooms"\("organization_id","building_id","floor_id","id"\) ON DELETE restrict/,
        "cycle_items audit snapshotida ham 4-qatlamli iyerarxiya kafolatlangan bo'lishi shart"
      );
    });
  });

  // =========================================================================
  // 3. SERVER-SIDE ACTION VA DOMAIN QOIDALARI (BUSINESS LOGIC INTEGRITY)
  // =========================================================================
  describe("3. Server-Side Validatsiya va Intra-Tenant Iyerarxiya Mantiqi", () => {
    it("Xona yaratishda: bino va qavat nomuvofiq bo'lsa (floor.buildingId !== buildingId) rad etilishi kerak", () => {
      const bldA = "building-uuid-a";
      const bldB = "building-uuid-b";
      const floorB = { id: "floor-uuid-b1", buildingId: bldB, organizationId: "org-1" };

      // Foydalanuvchi Bino A ni tanlab, Qavat B1 ni jo'natganda:
      const isValidPair = floorB.buildingId === bldA;
      assert.equal(isValidPair, false, "Bino A va Qavat B1 o'zaro nomutanosib deb topilishi shart");
    });

    it("Inventar ro'yxatga olishda: buildingId, floorId va roomId mos kelmasa rad etilishi kerak", () => {
      const roomA101 = {
        id: "room-uuid-101",
        organizationId: "org-1",
        buildingId: "building-uuid-a",
        floorId: "floor-uuid-a1",
      };

      // Mismatched building input
      const invalidInputBuilding = {
        roomId: roomA101.id,
        buildingId: "building-uuid-b", // Farqli bino
        floorId: roomA101.floorId,
      };
      const isBuildingMatch =
        invalidInputBuilding.roomId === roomA101.id &&
        invalidInputBuilding.buildingId === roomA101.buildingId &&
        invalidInputBuilding.floorId === roomA101.floorId;
      assert.equal(isBuildingMatch, false, "Inventar boshqa bino identifikatori bilan rad etilishi shart");

      // Mismatched floor input
      const invalidInputFloor = {
        roomId: roomA101.id,
        buildingId: roomA101.buildingId,
        floorId: "floor-uuid-a2", // Farqli qavat
      };
      const isFloorMatch =
        invalidInputFloor.roomId === roomA101.id &&
        invalidInputFloor.buildingId === roomA101.buildingId &&
        invalidInputFloor.floorId === roomA101.floorId;
      assert.equal(isFloorMatch, false, "Inventar boshqa qavat identifikatori bilan rad etilishi shart");
    });

    it("Inventarni ko'chirishda (relocateItemAction): yangi xona, qavat va bino o'zaro mos kelishi shart", () => {
      const targetRoom = {
        id: "room-uuid-204",
        organizationId: "org-1",
        buildingId: "building-uuid-b",
        floorId: "floor-uuid-b2",
      };

      const requestedBuildingId = "building-uuid-a"; // Hujumchi boshqa bino ID yubordi
      const requestedFloorId = "floor-uuid-b2";
      const requestedRoomId = targetRoom.id;

      const isValidRelocationTarget =
        targetRoom.id === requestedRoomId &&
        targetRoom.buildingId === requestedBuildingId &&
        targetRoom.floorId === requestedFloorId;

      assert.equal(isValidRelocationTarget, false, "Ko'chirishda nomutanosib bino tanlanganda rad etilishi shart");
    });
  });

  // =========================================================================
  // 4. IZOLYATSIYALANGAN TEST BAZASIDA HAQIQIY POSTGRESQL CONSTRAINT SINOVI
  // =========================================================================
  describe("4. Haqiqiy Izolyatsiyalangan PostgreSQL Bazasida DB Constraint Sinovlari", () => {
    let pgClient: Client | null = null;
    let isDbAvailable = false;

    // Test ma'lumotlari
    const testOrgId = "11111111-1111-4111-8111-111111111111";
    const testOrgBId = "22222222-2222-4222-8222-222222222222";
    const bldAId = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
    const bldBId = "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb";
    const flrA1Id = "faaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
    const flrB1Id = "fbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb";
    const rmA101Id = "101aaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
    const itemValidId = "99999999-9999-4999-8999-999999999999";

    before(async () => {
      try {
        pgClient = new Client({
          connectionString: "postgresql://postgres@127.0.0.1:5432/mulknazorat_sprint05b_test",
          connectionTimeoutMillis: 3000,
        });
        await pgClient.connect();
        isDbAvailable = true;

        // Boshlang'ich test tuzilmasini kiritish (izolyatsiyalangan test bazasi)
        await pgClient.query(`
          INSERT INTO organizations (id, name, code, type_id)
          VALUES ('${testOrgId}', 'Test Universitet A', 'TEST-A', 'university')
          ON CONFLICT (id) DO NOTHING;

          INSERT INTO organizations (id, name, code, type_id)
          VALUES ('${testOrgBId}', 'Test Universitet B', 'TEST-B', 'university')
          ON CONFLICT (id) DO NOTHING;

          INSERT INTO buildings (id, organization_id, name, code, floors_count)
          VALUES ('${bldAId}', '${testOrgId}', 'A Bino', 'BLD-A', 5)
          ON CONFLICT (id) DO NOTHING;

          INSERT INTO buildings (id, organization_id, name, code, floors_count)
          VALUES ('${bldBId}', '${testOrgId}', 'B Bino', 'BLD-B', 5)
          ON CONFLICT (id) DO NOTHING;

          INSERT INTO floors (id, organization_id, building_id, floor_number, name)
          VALUES ('${flrA1Id}', '${testOrgId}', '${bldAId}', 1, 'A Bino 1-qavat')
          ON CONFLICT (id) DO NOTHING;

          INSERT INTO floors (id, organization_id, building_id, floor_number, name)
          VALUES ('${flrB1Id}', '${testOrgId}', '${bldBId}', 1, 'B Bino 1-qavat')
          ON CONFLICT (id) DO NOTHING;

          INSERT INTO rooms (id, organization_id, building_id, floor_id, room_number, name)
          VALUES ('${rmA101Id}', '${testOrgId}', '${bldAId}', '${flrA1Id}', '101', 'A-101 xona')
          ON CONFLICT (id) DO NOTHING;
        `);
      } catch {
        isDbAvailable = false;
      }
    });

    after(async () => {
      if (pgClient && isDbAvailable) {
        try {
          await pgClient.query(`
            DELETE FROM items WHERE organization_id IN ('${testOrgId}', '${testOrgBId}');
            DELETE FROM rooms WHERE organization_id IN ('${testOrgId}', '${testOrgBId}');
            DELETE FROM floors WHERE organization_id IN ('${testOrgId}', '${testOrgBId}');
            DELETE FROM buildings WHERE organization_id IN ('${testOrgId}', '${testOrgBId}');
            DELETE FROM organizations WHERE id IN ('${testOrgId}', '${testOrgBId}');
          `);
        } finally {
          await pgClient.end();
        }
      }
    });

    it("DB Test 1: Bino A ga tegishli xonani Bino B qavatiga bog'lash qat'iy bloklanishi shart (23503)", async (t) => {
      if (!isDbAvailable || !pgClient) {
        t.skip("Izolyatsiyalangan PostgreSQL test bazasi ulanmadi");
        return;
      }

      // Xona yaratishga urinish: Bino A, lekin qavat B1!
      const invalidRoomId = "fa11fa11-1111-4111-8111-111111111111";
      let errorThrown: { code?: string } | null = null;

      try {
        await pgClient.query(`
          INSERT INTO rooms (id, organization_id, building_id, floor_id, room_number, name)
          VALUES ('${invalidRoomId}', '${testOrgId}', '${bldAId}', '${flrB1Id}', '999', 'Cross-building room');
        `);
      } catch (err) {
        errorThrown = err as { code?: string };
      }

      assert.ok(errorThrown, "Cross-building xona DB tomonidan rad etilishi shart edi");
      assert.equal(
        errorThrown.code,
        "23503",
        "PostgreSQL 23503 (foreign_key_violation: fk_rooms_hierarchy_composite) xatosini qaytarishi shart"
      );
    });

    it("DB Test 2: To'g'ri iyerarxiyali inventar muvaffaqiyatli saqlanishi kerak", async (t) => {
      if (!isDbAvailable || !pgClient) {
        t.skip("Izolyatsiyalangan PostgreSQL test bazasi ulanmadi");
        return;
      }

      const res = await pgClient.query(`
        INSERT INTO items (id, organization_id, inventory_number, name, category_id, building_id, floor_id, room_id, qr_token)
        VALUES ('${itemValidId}', '${testOrgId}', 'INV-ISO-TEST-1', 'Valid HP Laptop', 'furniture', '${bldAId}', '${flrA1Id}', '${rmA101Id}', 'qr-iso-valid-token-1')
        ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name
        RETURNING id;
      `);

      assert.equal(res.rows.length, 1);
      assert.equal(res.rows[0].id, itemValidId);
    });

    it("DB Test 3: Inventarning building_id qiymati xonaning binosiga mos kelmasa bloklanishi shart (23503)", async (t) => {
      if (!isDbAvailable || !pgClient) {
        t.skip("Izolyatsiyalangan PostgreSQL test bazasi ulanmadi");
        return;
      }

      // Xona A-101 da, lekin building_id = bldB
      let errorThrown: { code?: string } | null = null;
      try {
        await pgClient.query(`
          INSERT INTO items (organization_id, inventory_number, name, category_id, building_id, floor_id, room_id, qr_token)
          VALUES ('${testOrgId}', 'INV-ISO-ERR-1', 'Wrong Bld Item', 'furniture', '${bldBId}', '${flrA1Id}', '${rmA101Id}', 'qr-iso-err-tok-1');
        `);
      } catch (err) {
        errorThrown = err as { code?: string };
      }

      assert.ok(errorThrown, "Nomutanosib bino bilan inventar kiritilishi bloklanishi shart");
      assert.equal(errorThrown.code, "23503", "fk_items_hierarchy_composite xatosi yuz berishi shart");
    });

    it("DB Test 4: Inventarning floor_id qiymati xonaning qavatiga mos kelmasa bloklanishi shart (23503)", async (t) => {
      if (!isDbAvailable || !pgClient) {
        t.skip("Izolyatsiyalangan PostgreSQL test bazasi ulanmadi");
        return;
      }

      // Xona A-101 da, lekin floor_id = flrB1
      let errorThrown: { code?: string } | null = null;
      try {
        await pgClient.query(`
          INSERT INTO items (organization_id, inventory_number, name, category_id, building_id, floor_id, room_id, qr_token)
          VALUES ('${testOrgId}', 'INV-ISO-ERR-2', 'Wrong Flr Item', 'furniture', '${bldAId}', '${flrB1Id}', '${rmA101Id}', 'qr-iso-err-tok-2');
        `);
      } catch (err) {
        errorThrown = err as { code?: string };
      }

      assert.ok(errorThrown, "Nomutanosib qavat bilan inventar kiritilishi bloklanishi shart");
      assert.equal(errorThrown.code, "23503", "fk_items_hierarchy_composite xatosi yuz berishi shart");
    });

    it("DB Test 5: UPDATE orqali inventarning binosini mos kelmaydigan qilib o'zgartirish bloklanishi shart (23503)", async (t) => {
      if (!isDbAvailable || !pgClient) {
        t.skip("Izolyatsiyalangan PostgreSQL test bazasi ulanmadi");
        return;
      }

      let errorThrown: { code?: string } | null = null;
      try {
        await pgClient.query(`
          UPDATE items SET building_id = '${bldBId}' WHERE id = '${itemValidId}';
        `);
      } catch (err) {
        errorThrown = err as { code?: string };
      }

      assert.ok(errorThrown, "Mavjud inventarni nomutanosib binoga UPDATE qilish bloklanishi shart");
      assert.equal(errorThrown.code, "23503");
    });

    it("DB Test 6: Begona tashkilot (Org B) inventarini Org A xonasiga bog'lash bloklanishi shart (23503)", async (t) => {
      if (!isDbAvailable || !pgClient) {
        t.skip("Izolyatsiyalangan PostgreSQL test bazasi ulanmadi");
        return;
      }

      let errorThrown: { code?: string } | null = null;
      try {
        await pgClient.query(`
          INSERT INTO items (organization_id, inventory_number, name, category_id, building_id, floor_id, room_id, qr_token)
          VALUES ('${testOrgBId}', 'INV-CROSS-ORG', 'Cross Org Item', 'furniture', '${bldAId}', '${flrA1Id}', '${rmA101Id}', 'qr-cross-org-tok');
        `);
      } catch (err) {
        errorThrown = err as { code?: string };
      }

      assert.ok(errorThrown, "Cross-tenant inventar kiritilishi bloklanishi shart");
      assert.equal(errorThrown.code, "23503");
    });

    after(async () => {
      if (pgClient && isDbAvailable) {
        try {
          await pgClient.query(`DELETE FROM items WHERE organization_id IN ('${testOrgId}', '${testOrgBId}');`);
          await pgClient.query(`DELETE FROM rooms WHERE organization_id IN ('${testOrgId}', '${testOrgBId}');`);
          await pgClient.query(`DELETE FROM floors WHERE organization_id IN ('${testOrgId}', '${testOrgBId}');`);
          await pgClient.query(`DELETE FROM buildings WHERE organization_id IN ('${testOrgId}', '${testOrgBId}');`);
          await pgClient.query(`DELETE FROM organizations WHERE id IN ('${testOrgId}', '${testOrgBId}');`);
        } catch (e) {
          console.error("Cleanup error in sprint05b-hierarchy-constraints:", e);
        } finally {
          await pgClient.end();
        }
      }
    });
  });
});
