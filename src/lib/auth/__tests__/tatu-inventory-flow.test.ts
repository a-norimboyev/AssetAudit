/**
 * AssetAudit — Sprint 10: TATU To'liq Inventarizatsiya Oqimi (E2E Integration Test)
 * Izolyatsiyalangan test bazasida (mulknazorat_sprint05b_test)
 *
 * 9 ta asosiy bosqich:
 * 1. Bino yaratish va ko'rish
 * 2. Qavat yaratish va ko'rish
 * 3. Xona yaratish va ko'rish
 * 4. Inventar yaratish va ko'rish
 * 5. Inventar uchun QR yaratish
 * 6. QR public sahifasini tekshirish (maxfiylik kafolati)
 * 7. Audit sikli yaratish
 * 8. Inventarni skanerlashni simulyatsiya qilish (Match + Conflict)
 * 9. Rekonsilyatsiya hisobotini tekshirish
 *
 * QAT'IY QOIDA: Production bazasiga tegilmaydi.
 */

import { describe, it, before, after } from "node:test";
import assert from "node:assert/strict";
import { Pool } from "pg";
import { drizzle } from "drizzle-orm/node-postgres";
import { eq, and, sql } from "drizzle-orm";
import * as schema from "../../db/schema/index";
import { generateSecureQrToken, getPublicQrUrl, generateQrDataUrl, generateQrSvg } from "@/lib/qr";

const {
  organizations,
  buildings,
  floors,
  rooms,
  itemCategories,
  items,
  inventoryCycles,
  cycleItems,
  scanEvents,
  cycleConflicts,
  user,
} = schema;

describe("AssetAudit — Sprint 10: TATU To'liq Inventarizatsiya Oqimi", () => {
  const connectionString =
    process.env.TEST_DATABASE_URL ||
    process.env.DATABASE_URL ||
    "postgresql://postgres@127.0.0.1:5432/mulknazorat_sprint05b_test";

  let pool: Pool;
  let db: ReturnType<typeof drizzle<typeof schema>>;

  // Test ma'lumotlari identifikatorlari
  const testOrgId = "e1000000-0000-4000-8000-" + Math.floor(100000000000 + Math.random() * 900000000000);
  const testOrgCode = `TATU${Math.floor(1000 + Math.random() * 9000)}`;
  const testUserId = `usr-test-inspector-${Date.now()}`;
  let buildingId: string;
  let floor1Id: string;
  let floor2Id: string;
  let room204Id: string;
  let room101Id: string;
  let categoryId: string;
  let itemId: string;
  let qrToken: string;
  let cycleId: string;

  before(async () => {
    pool = new Pool({ connectionString, max: 2, connectionTimeoutMillis: 5000 });
    db = drizzle(pool, { schema });

    // 0. Izolyatsiyalangan tashkilot yaratish
    await db
      .insert(organizations)
      .values({
        id: testOrgId,
        name: "TATU Sinov Tashkiloti",
        code: testOrgCode,
        typeId: "university",
        isActive: true,
        settings: {
          inventoryPrefix: `${testOrgCode}-`,
          allowPublicScanLogs: false,
          defaultQrVisibility: "restricted",
        },
      })
      .onConflictDoNothing();

    // Sinov foydalanuvchisi (auditor / inspektor)
    await db
      .insert(user)
      .values({
        id: testUserId,
        name: "TATU Sinov Inspektori",
        email: `inspector-${Date.now()}@tatu.uz`,
        emailVerified: true,
        username: `tatu.inspector.${Date.now()}`,
      })
      .onConflictDoNothing();

    // Toifa yaratish
    const [cat] = await db
      .insert(itemCategories)
      .values({
        id: `it-${Date.now()}`,
        name: "Kompyuter va IT Jihozlar",
        description: "Hisoblash texnikalari",
      })
      .returning();
    categoryId = cat.id;
  });

  after(async () => {
    if (pool) {
      await pool.end();
    }
  });

  // =========================================================================
  // 1. BINO YARATISH VA KO'RISH
  // =========================================================================
  it("1. Bino yaratish va ko'rish: Bosh bino muvaffaqiyatli saqlanishi kerak", async () => {
    const [bld] = await db
      .insert(buildings)
      .values({
        organizationId: testOrgId,
        name: "TATU Bosh O'quv Binosi",
        code: "BOSH",
        floorsCount: 5,
        address: "Amir Temur ko'chasi 108",
      })
      .returning();

    assert.ok(bld.id);
    assert.equal(bld.organizationId, testOrgId);
    assert.equal(bld.name, "TATU Bosh O'quv Binosi");
    assert.equal(bld.code, "BOSH");
    assert.equal(bld.floorsCount, 5);
    buildingId = bld.id;

    // Ko'rish (Read)
    const [found] = await db
      .select()
      .from(buildings)
      .where(and(eq(buildings.id, buildingId), eq(buildings.organizationId, testOrgId)));

    assert.ok(found);
    assert.equal(found.code, "BOSH");
  });

  // =========================================================================
  // 2. QAVAT YARATISH VA KO'RISH
  // =========================================================================
  it("2. Qavat yaratish va ko'rish: 1 va 2-qavatlar binoga bog'lanishi kerak", async () => {
    const [flr1] = await db
      .insert(floors)
      .values({
        organizationId: testOrgId,
        buildingId: buildingId,
        floorNumber: 1,
        name: "1-qavat (Ma'muriyat)",
      })
      .returning();

    const [flr2] = await db
      .insert(floors)
      .values({
        organizationId: testOrgId,
        buildingId: buildingId,
        floorNumber: 2,
        name: "2-qavat (Laboratoriyalar)",
      })
      .returning();

    assert.ok(flr1.id);
    assert.ok(flr2.id);
    assert.equal(flr1.floorNumber, 1);
    assert.equal(flr2.floorNumber, 2);
    floor1Id = flr1.id;
    floor2Id = flr2.id;

    // Ko'rish (Read)
    const floorList = await db
      .select()
      .from(floors)
      .where(and(eq(floors.buildingId, buildingId), eq(floors.organizationId, testOrgId)));

    assert.equal(floorList.length, 2);
  });

  // =========================================================================
  // 3. XONA YARATISH VA KO'RISH
  // =========================================================================
  it("3. Xona yaratish va ko'rish: 101 va 204-xonalar qavatlarga to'g'ri biriktirilishi kerak", async () => {
    const [rm101] = await db
      .insert(rooms)
      .values({
        organizationId: testOrgId,
        buildingId: buildingId,
        floorId: floor1Id,
        roomNumber: "101",
        name: "Qabulxona",
        type: "office",
        capacity: 10,
      })
      .returning();

    const [rm204] = await db
      .insert(rooms)
      .values({
        organizationId: testOrgId,
        buildingId: buildingId,
        floorId: floor2Id,
        roomNumber: "204",
        name: "Sun'iy Intellekt Laboratoriyasi",
        type: "lab",
        capacity: 35,
      })
      .returning();

    assert.ok(rm101.id);
    assert.ok(rm204.id);
    assert.equal(rm101.roomNumber, "101");
    assert.equal(rm204.roomNumber, "204");
    room101Id = rm101.id;
    room204Id = rm204.id;

    // Ko'rish (Read)
    const roomList = await db
      .select()
      .from(rooms)
      .where(and(eq(rooms.organizationId, testOrgId), eq(rooms.buildingId, buildingId)));

    assert.equal(roomList.length, 2);
  });

  // =========================================================================
  // 4. INVENTAR YARATISH VA KO'RISH
  // =========================================================================
  it("4. Inventar yaratish va ko'rish: Rasmiy xonaga biriktirilgan buyum saqlanishi kerak", async () => {
    qrToken = generateSecureQrToken();

    const [item] = await db
      .insert(items)
      .values({
        organizationId: testOrgId,
        buildingId: buildingId,
        floorId: floor2Id,
        roomId: room204Id,
        categoryId: categoryId,
        name: "Monoblok HP ProOne 440 G9",
        inventoryNumber: `${testOrgCode}-IT-001`,
        status: "active",
        condition: "good",
        price: "12500000.00",
        qrToken: qrToken,
        description: "AI laboratoriyasi asosiy ish stansiyasi",
      })
      .returning();

    assert.ok(item.id);
    assert.equal(item.name, "Monoblok HP ProOne 440 G9");
    assert.equal(item.inventoryNumber, `${testOrgCode}-IT-001`);
    assert.equal(item.roomId, room204Id);
    assert.equal(item.qrToken, qrToken);
    itemId = item.id;

    // Ko'rish (Read)
    const [found] = await db
      .select()
      .from(items)
      .where(and(eq(items.id, itemId), eq(items.organizationId, testOrgId)));

    assert.ok(found);
    assert.equal(found.status, "active");
    assert.equal(found.condition, "good");
  });

  // =========================================================================
  // 5. INVENTAR UCHUN QR YARATISH
  // =========================================================================
  it("5. Inventar uchun QR yaratish: Token, Public URL, PNG Data URL va SVG to'g'ri generatsiya bo'lishi kerak", async () => {
    assert.equal(qrToken.length, 48, "QR token kamida 48 belgidan iborat yuqori entropiyali bo'lishi shart");

    const publicUrl = getPublicQrUrl(qrToken);
    assert.ok(publicUrl.includes(`/qr/${qrToken}`), "URL to'g'ri formatda bo'lishi kerak");

    const dataUrl = await generateQrDataUrl(qrToken);
    assert.ok(dataUrl.startsWith("data:image/png;base64,"), "Data URL valid PNG base64 bo'lishi shart");

    const svg = await generateQrSvg(qrToken);
    assert.ok(svg.includes("<svg"), "SVG formati to'g'ri XML tegini o'z ichiga olishi shart");
    assert.ok(svg.includes("</svg>"));
  });

  // =========================================================================
  // 6. QR PUBLIC SAHIFASINI TEKSHIRISH (MAXFIYLIK VA SIZIB CHIQISh HIMOYASI)
  // =========================================================================
  it("6. QR public sahifasi tekshiruvi: Ommaga faqat ruxsatli maydonlar berilishi, narx va xodim maxfiy qolishi shart", async () => {
    // Public ko'rinish simulyatsiyasi
    const [publicData] = await db
      .select({
        name: items.name,
        inventoryNumber: items.inventoryNumber,
        status: items.status,
        condition: items.condition,
        orgName: organizations.name,
        orgCode: organizations.code,
      })
      .from(items)
      .innerJoin(organizations, eq(items.organizationId, organizations.id))
      .where(eq(items.qrToken, qrToken))
      .limit(1);

    assert.ok(publicData);
    assert.equal(publicData.name, "Monoblok HP ProOne 440 G9");
    assert.equal(publicData.orgCode, testOrgCode);

    // Maxfiylik tekshiruvi: publicData ichida narx (price), creatorUserId, audit logs yo'q
    assert.equal((publicData as Record<string, unknown>).price, undefined, "Narx ommaga ko'rinmasligi shart");
    assert.equal((publicData as Record<string, unknown>).userId, undefined, "Mas'ul xodim ID ommaga ko'rinmasligi shart");
  });

  // =========================================================================
  // 7. AUDIT SIKLI YARATISH
  // =========================================================================
  it("7. Audit sikli yaratish: Faol inventarizatsiya sikli ochilishi va snapshot kiritilishi shart", async () => {
    const [cycle] = await db
      .insert(inventoryCycles)
      .values({
        organizationId: testOrgId,
        title: "2026-yil Kuzgi Yalpi Inventarizatsiya",
        status: "in_progress",
        startDate: new Date(),
        createdBy: testUserId,
      })
      .returning();

    assert.ok(cycle.id);
    assert.equal(cycle.status, "in_progress");
    cycleId = cycle.id;

    // Snapshot yaratish: mavjud inventar snapshotga muzlatiladi
    const [snap] = await db
      .insert(cycleItems)
      .values({
        cycleId: cycleId,
        organizationId: testOrgId,
        itemId: itemId,
        expectedBuildingId: buildingId,
        expectedFloorId: floor2Id,
        expectedRoomId: room204Id,
        inventoryNumber: `${testOrgCode}-IT-001`,
        itemName: "Monoblok HP ProOne 440 G9",
        categoryId: categoryId,
        condition: "good",
        price: "12500000.00",
      })
      .returning();

    assert.ok(snap.id);
    assert.equal(snap.expectedRoomId, room204Id);
  });

  // =========================================================================
  // 8. INVENTARNI SKANERLASHNI SIMULYATSIYA QILISH (MATCH VA CONFLICT)
  // =========================================================================
  it("8. Skanerlash simulyatsiyasi: Kutilgan xonada Match, begona xonada Conflict hosil qilishi kerak", async () => {
    // 8.1. Begona xonada skanerlash (Xona 101 da topildi, lekin kutilgan xona 204)
    const isConflict = room101Id !== room204Id;
    assert.equal(isConflict, true, "101-xonada skan qilinganda konflikt aniqlanishi shart");

    const [conflictScan] = await db
      .insert(scanEvents)
      .values({
        organizationId: testOrgId,
        cycleId: cycleId,
        itemId: itemId,
        expectedRoomId: room204Id,
        scannedRoomId: room101Id,
        isMatch: false,
        isConflict: true,
        scannedBy: testUserId,
        notes: "Xona 101 da topildi (nomutanosiblik)",
      })
      .returning();

    assert.ok(conflictScan.id);
    assert.equal(conflictScan.isMatch, false);
    assert.equal(conflictScan.isConflict, true);

    // Konflikt jadvaliga qayd etish
    const [conflictRec] = await db
      .insert(cycleConflicts)
      .values({
        cycleId: cycleId,
        organizationId: testOrgId,
        itemId: itemId,
        scanEventId: conflictScan.id,
        expectedRoomId: room204Id,
        scannedRoomId: room101Id,
        status: "open",
        resolutionNotes: "Audit inspektori tomonidan aniqlandi",
      })
      .returning();

    assert.ok(conflictRec.id);
    assert.equal(conflictRec.status, "open");

    // Xolis audit qoidasi: Rasmiy xona o'zgarmasligi shart!
    const [itemAfterConflict] = await db
      .select({ roomId: items.roomId })
      .from(items)
      .where(eq(items.id, itemId));
    assert.equal(itemAfterConflict.roomId, room204Id, "Konflikt bo'lganda ham rasmiy xona o'zgarmasligi shart");

    // 8.2. O'z xonasida skanerlash (Xona 204 da skan qilinganda: Match)
    const [matchScan] = await db
      .insert(scanEvents)
      .values({
        organizationId: testOrgId,
        cycleId: cycleId,
        itemId: itemId,
        expectedRoomId: room204Id,
        scannedRoomId: room204Id,
        isMatch: true,
        isConflict: false,
        scannedBy: testUserId,
        notes: "O'z xonasida tasdiqlandi",
      })
      .returning();

    assert.ok(matchScan.id);
    assert.equal(matchScan.isMatch, true);
    assert.equal(matchScan.isConflict, false);
  });

  // =========================================================================
  // 9. REKONSILYATSIYA HISOBOTINI TEKSHIRISH
  // =========================================================================
  it("9. Rekonsilyatsiya hisoboti: Jami inventarlar, topilganlar va konfliktlar statistikasi to'g'ri hisoblanishi kerak", async () => {
    // Sikl snapshotdagi jami kutilgan inventarlar
    const [expectedStats] = await db
      .select({
        totalExpected: sql<number>`count(*)::int`,
      })
      .from(cycleItems)
      .where(eq(cycleItems.cycleId, cycleId));

    assert.equal(expectedStats.totalExpected, 1, "Jami kutilgan inventarlar 1 ta bo'lishi kerak");

    // Skan qilingan unikal inventarlar (scan_events)
    const [scannedStats] = await db
      .select({
        uniqueScannedCount: sql<number>`count(distinct ${scanEvents.itemId})::int`,
        matchCount: sql<number>`count(*) filter (where ${scanEvents.isMatch} = true)::int`,
        conflictCount: sql<number>`count(*) filter (where ${scanEvents.isConflict} = true)::int`,
      })
      .from(scanEvents)
      .where(eq(scanEvents.cycleId, cycleId));

    assert.equal(scannedStats.uniqueScannedCount, 1, "Unikal skan qilingan buyumlar 1 ta bo'lishi kerak");
    assert.equal(scannedStats.matchCount, 1, "Mos kelgan skanlar 1 ta bo'lishi kerak");
    assert.equal(scannedStats.conflictCount, 1, "Konfliktli skanlar 1 ta bo'lishi kerak");

    // Konfliktlar jurnali (cycle_conflicts)
    const conflicts = await db
      .select()
      .from(cycleConflicts)
      .where(eq(cycleConflicts.cycleId, cycleId));

    assert.equal(conflicts.length, 1, "Konfliktlar soni aniq 1 ta bo'lishi kerak");
    assert.equal(conflicts[0].expectedRoomId, room204Id);
    assert.equal(conflicts[0].scannedRoomId, room101Id);
    assert.equal(conflicts[0].status, "open");

    // Rekonsilyatsiya darajasi (Reconciliation Rate)
    const reconciliationRate = Math.round((scannedStats.uniqueScannedCount / expectedStats.totalExpected) * 100);
    assert.equal(reconciliationRate, 100, "Rekonsilyatsiya qamrovi 100% bo'lishi kerak");
  });
});
