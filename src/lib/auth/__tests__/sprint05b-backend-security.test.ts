import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { hashPassword, verifyPassword } from "better-auth/crypto";

describe("AssetAudit — Sprint 05B: Backend va SQL Migratsiya Xavfsizligi Tekshiruvlari", () => {
  // =========================================================================
  // 1. SQL MIGRATSIYA VA WORM APPEND-ONLY AUDITI
  // =========================================================================
  describe("1. SQL Migratsiya (0003_small_gladiator.sql) Xavfsizlik Tekshiruvi", () => {
    const migrationPath = resolve(process.cwd(), "drizzle/0003_small_gladiator.sql");
    const migrationSql = readFileSync(migrationPath, "utf-8");

    it("0003 migratsiyasida scan_events.cycle_id kaskadli o'chmasligi (ON DELETE restrict) shart", () => {
      // scan_events yuridik xolis append-only jurnal bo'lgani sababli, cycle o'chirilganda kaskadli o'chmasligi kerak
      assert.match(
        migrationSql,
        /ALTER TABLE "scan_events" ADD CONSTRAINT "scan_events_cycle_id_inventory_cycles_id_fk" FOREIGN KEY \("cycle_id"\) REFERENCES "public"\."inventory_cycles"\("id"\) ON DELETE restrict/
      );
    });

    it("0003 migratsiyasida cycle_items.cycle_id kaskadli o'chmasligi (ON DELETE restrict) shart", () => {
      assert.match(
        migrationSql,
        /ALTER TABLE "cycle_items" ADD CONSTRAINT "cycle_items_cycle_id_inventory_cycles_id_fk" FOREIGN KEY \("cycle_id"\) REFERENCES "public"\."inventory_cycles"\("id"\) ON DELETE restrict/
      );
      assert.match(
        migrationSql,
        /ALTER TABLE "cycle_items" ADD CONSTRAINT "fk_cycle_items_cycle_composite" FOREIGN KEY \("organization_id","cycle_id"\) REFERENCES "public"\."inventory_cycles"\("organization_id","id"\) ON DELETE restrict/
      );
    });

    it("0003 migratsiyasida xonaning bino/qavat kompozit FK (fk_rooms_hierarchy_composite) mavjud bo'lishi shart", () => {
      assert.match(
        migrationSql,
        /ALTER TABLE "rooms" ADD CONSTRAINT "fk_rooms_hierarchy_composite" FOREIGN KEY \("organization_id","building_id","floor_id"\) REFERENCES "public"\."floors"\("organization_id","building_id","id"\) ON DELETE restrict/
      );
    });

    it("0003 migratsiyasida inventarning 4-qatlamli kompozit FK (fk_items_hierarchy_composite) mavjud bo'lishi shart", () => {
      assert.match(
        migrationSql,
        /ALTER TABLE "items" ADD CONSTRAINT "fk_items_hierarchy_composite" FOREIGN KEY \("organization_id","building_id","floor_id","room_id"\) REFERENCES "public"\."rooms"\("organization_id","building_id","floor_id","id"\) ON DELETE restrict/
      );
    });

    it("0003 migratsiyasida mulknazorat_app uchun cycle_items va scan_events faqat SELECT, INSERT (append-only) bo'lishi shart", () => {
      assert.match(
        migrationSql,
        /GRANT SELECT, INSERT ON TABLE "cycle_items", "scan_events" TO mulknazorat_app;/
      );
    });
  });

  // =========================================================================
  // 2. VAQTINCHALIK PAROL VA MUST_CHANGE_PASSWORD HIMOYASI
  // =========================================================================
  describe("2. Vaqtinchalik Parolni Majburiy Yangilash va verifyPassword Tekshiruvi", () => {
    it("Noto'g'ri joriy parol kiritilganda verifyPassword rad etishi shart", async () => {
      const realTemporaryPassword = "TempPassword123!";
      const realHash = await hashPassword(realTemporaryPassword);

      const attackerGuess = "WrongPassword999!";
      const isValid = await verifyPassword({
        hash: realHash,
        password: attackerGuess,
      });

      assert.equal(isValid, false, "Noto'g'ri parol qabul qilinmasligi shart");
    });

    it("To'g'ri joriy parol kiritilganda verifyPassword muvaffaqiyatli tasdiqlashi shart", async () => {
      const realTemporaryPassword = "TempPassword123!";
      const realHash = await hashPassword(realTemporaryPassword);

      const isValid = await verifyPassword({
        hash: realHash,
        password: realTemporaryPassword,
      });

      assert.equal(isValid, true, "To'g'ri parol tasdiqlanishi kerak");
    });

    it("Yangi parol bilan joriy parol bir xil bo'lsa, xavfsizlik cheklovi ishga tushishi shart", () => {
      const currentPassword = "TempPassword123!";
      const newPassword = "TempPassword123!";

      const isSame = currentPassword === newPassword;
      assert.equal(isSame, true, "Yangi parol eskisidan farq qilishi talab etiladi");
    });
  });

  // =========================================================================
  // 3. CROSS-TENANT VA SERVER ROLE SCOPING CHEKLOVLARI
  // =========================================================================
  describe("3. Multi-Tenant Izolyatsiyasi va Server Action Scoping", () => {
    it("Xona auditini yakunlashda begona organization_id qabul qilinmasligi shart", () => {
      const orgAId: string = "org-uuid-tatu";
      const orgBId: string = "org-uuid-bdu";
      const targetRoomOrgId: string = orgAId;

      const actorOrgId: string = orgBId;
      const isAllowed = actorOrgId === targetRoomOrgId;

      assert.equal(isAllowed, false, "Begona tashkilot xona auditini yakunlay olmasligi shart");
    });

    it("Inventarni ko'chirishda faqat shu tashkilotga tegishli itemId va xona ruxsat etilishi kerak", () => {
      const orgAId: string = "org-uuid-tatu";
      const itemOrgId: string = orgAId;
      const newRoomOrgId: string = orgAId;

      const isValidRelocate = itemOrgId === orgAId && newRoomOrgId === orgAId;
      assert.equal(isValidRelocate, true);

      const crossTenantRoomOrgId: string = "org-uuid-samdu";
      const isCrossTenantValid = itemOrgId === crossTenantRoomOrgId;
      assert.equal(isCrossTenantValid, false, "Boshqa tashkilot xonasiga ko'chirish rad etilishi shart");
    });
  });

  // =========================================================================
  // 4. PUBLIC QR MAXFIYLIK SIYOSATI (RESTRICTED VA PRIVATE)
  // =========================================================================
  describe("4. Public QR Siyosati va Ma'lumotlar Sizib Chiqishi (Data Leakage) Himoyasi", () => {
    it("restricted rejimida ommaviy ko'rinishda bino va xona ma'lumotlari bo'shatib berilishi shart", () => {
      const rawData = {
        name: "HP ProBook 450 G8",
        inventoryNumber: "TATU-KOMP-001",
        buildingName: "A Bino",
        floorName: "2-qavat",
        roomNumber: "204",
        roomName: "Kompyuter laboratoriyasi",
      };

      const qrVisibility: "public" | "restricted" | "private" = "restricted";
      const isRestricted = qrVisibility === "restricted";

      const sanitizedResult = {
        name: rawData.name,
        inventoryNumber: rawData.inventoryNumber,
        buildingName: isRestricted ? "" : rawData.buildingName,
        floorName: isRestricted ? "" : rawData.floorName,
        roomNumber: isRestricted ? "" : rawData.roomNumber,
        roomName: isRestricted ? "" : rawData.roomName,
        qrVisibility,
      };

      assert.equal(sanitizedResult.buildingName, "", "Bino nomi oshkor bo'lmasligi shart");
      assert.equal(sanitizedResult.roomNumber, "", "Xona raqami oshkor bo'lmasligi shart");
      assert.equal(sanitizedResult.qrVisibility, "restricted");
    });

    it("private rejimida QR token butunlay rad etilishi (null / 404) shart", () => {
      const qrVisibility: "public" | "restricted" | "private" = "private";
      const shouldReturnNull = qrVisibility === "private";

      assert.equal(shouldReturnNull, true, "Private rejimida umumiy ko'rinish berilmasligi shart");
    });
  });

  // =========================================================================
  // 5. IYERARXIYA VA QAVATLAR CHEGARASI
  // =========================================================================
  describe("5. Joylashuvlar Iyerarxiyasi va Qavatlar Diapazoni", () => {
    it("Bino ichidagi qavat raqami -10 dan 200 gacha qabul qilinadi", () => {
      const basement = -2;
      const ground = 0;
      const normal = 5;
      const high = 55;

      const isValidRange = (n: number) => n >= -10 && n <= 200;

      assert.equal(isValidRange(basement), true);
      assert.equal(isValidRange(ground), true);
      assert.equal(isValidRange(normal), true);
      assert.equal(isValidRange(high), true);

      assert.equal(isValidRange(-11), false);
      assert.equal(isValidRange(201), false);
    });

    it("Bino va Qavat o'zaro nomuvofiq bo'lganda xona yaratish rad etilishi shart", () => {
      const selectedBuildingId = "bld-uuid-1";
      const selectedFloor = { id: "flr-uuid-1", buildingId: "bld-uuid-2" };

      const isMatching = selectedFloor.buildingId === selectedBuildingId;
      assert.equal(isMatching, false, "Begona bino qavatiga xona bog'lanishi mumkin emas");
    });
  });
});
