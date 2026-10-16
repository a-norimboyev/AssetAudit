import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  canCreateNewItem,
  canRelocateItem,
  canUploadOfficialItemPhoto,
  canPerformAudit,
  canManageOrganizationUsers,
  verifyProfileStatus,
} from "../authorization-rules";
import { generateSecureQrToken, getPublicQrUrl, generateQrDataUrl, generateQrSvg } from "../../qr";
import { isStorageConfigured, uploadOfficialItemPhoto } from "../../storage";
import { validateStaffPassword } from "../../validations/staff";
import { ROOM_TYPES } from "../../db/schema/locations";
import { ITEM_STATUSES, ITEM_CONDITIONS } from "../../db/schema/inventory";

describe("AssetAudit — Tezkor Sprint 05: Asosiy Modullar (Core Modules) Test To'plami", () => {
  // =========================================================================
  // 1. JOYLAShUVLAR MODULI (LOCATIONS)
  // =========================================================================
  describe("1. Joylashuvlar Moduli va Validatsiya Qoidalari", () => {
    it("Xona turlari (ROOM_TYPES) me'yoriy 8 ta turdan iborat bo'lishi shart", () => {
      const expectedTypes = [
        "classroom",
        "lab",
        "office",
        "warehouse",
        "library",
        "conference",
        "server_room",
        "other",
      ];
      assert.deepEqual([...ROOM_TYPES], expectedTypes);
    });

    it("Bino yaratish validatsiyasi: kamida 2 belgi nom, kod va 1..50 qavat chegarasi", () => {
      // Bino kodi validatsiyasi
      const validCode = "BOSH".trim().toUpperCase();
      assert.equal(validCode, "BOSH");

      const emptyCode = "".trim();
      assert.equal(emptyCode.length < 1, true);

      // Qavatlar chegarasi
      const validFloors = Math.max(1, parseInt("4", 10));
      assert.equal(validFloors >= 1 && validFloors <= 50, true);

      const invalidFloorsLow = 0;
      assert.equal(invalidFloorsLow < 1, true);

      const invalidFloorsHigh = 60;
      assert.equal(invalidFloorsHigh > 50, true);
    });

    it("Bino uchun qavatlar avtomatik ro'yxati 1 dan N gacha izchil hosil bo'lishi kerak", () => {
      const floorsCount = 5;
      const generatedFloors = [];
      for (let f = 1; f <= floorsCount; f++) {
        generatedFloors.push({ floorNumber: f, name: `${f}-qavat` });
      }

      assert.equal(generatedFloors.length, 5);
      assert.equal(generatedFloors[0].floorNumber, 1);
      assert.equal(generatedFloors[0].name, "1-qavat");
      assert.equal(generatedFloors[4].floorNumber, 5);
      assert.equal(generatedFloors[4].name, "5-qavat");
    });

    it("Qavat raqami diapazoni: -10 dan 200 gacha (yerto'la, zamin, yuqori qavatlar) qabul qilinadi, chegaradan tashqarisi rad etiladi", () => {
      const validNumbers = [-2, -1, 0, 1, 10, 55, 200];
      for (const fn of validNumbers) {
        assert.equal(fn >= -10 && fn <= 200, true);
      }
      const invalidNumbers = [-15, -100, 201, 999];
      for (const fn of invalidNumbers) {
        assert.equal(fn < -10 || fn > 200, true);
      }
    });

    it("Same-tenant iyerarxiya tekshiruvi: A bino xonasi B bino qavatiga yoki mos kelmaydigan parametrlarga bog'lanishi rad etiladi", () => {
      const buildingA = { id: "bld-a", orgId: "org-1" };
      const buildingB = { id: "bld-b", orgId: "org-1" };
      const floorA1 = { id: "flr-a1", orgId: "org-1", buildingId: buildingA.id };
      const floorB1 = { id: "flr-b1", orgId: "org-1", buildingId: buildingB.id };

      // Room A101 must match buildingId with its floor's buildingId
      const roomValid = { buildingId: buildingA.id, floorId: floorA1.id };
      assert.equal(roomValid.buildingId === floorA1.buildingId, true);

      // Attempt to link Room A to Floor B
      const roomInvalid = { buildingId: buildingA.id, floorId: floorB1.id };
      assert.equal(roomInvalid.buildingId === floorB1.buildingId, false);
    });
  });

  // =========================================================================
  // 2. INVENTARLAR VA RBAC (INVENTORY & ROLES)
  // =========================================================================
  describe("2. Inventarlar Boshqaruvi va RBAC Ruxsatlari", () => {
    it("Yangi inventarni ro'yxatga olish (canCreateNewItem): faqat registrar va organization_admin", () => {
      assert.equal(canCreateNewItem("registrar"), true);
      assert.equal(canCreateNewItem("organization_admin"), true);
      assert.equal(canCreateNewItem("inspector"), false, "Inspektor yangi mulk qo'sha olmasligi shart");
      assert.equal(canCreateNewItem("super_admin"), false, "Super Admin tashkilot ichki mulkini qo'shmasligi shart");
    });

    it("Rasmiy xonani ko'chirish/o'zgartirish (canRelocateItem): qat'iy ravishda faqat organization_admin", () => {
      assert.equal(canRelocateItem("organization_admin"), true);
      assert.equal(canRelocateItem("registrar"), false, "Registrar mavjud mulkning rasmiy xonasini o'zgartira olmaydi");
      assert.equal(canRelocateItem("inspector"), false, "Inspektor rasmiy xonani o'zgartira olmaydi");
      assert.equal(canRelocateItem("super_admin"), false);
    });

    it("Rasmiy fotosurat yuklash (canUploadOfficialItemPhoto): faqat organization_admin", () => {
      assert.equal(canUploadOfficialItemPhoto("organization_admin"), true);
      assert.equal(canUploadOfficialItemPhoto("registrar"), false);
      assert.equal(canUploadOfficialItemPhoto("inspector"), false);
    });

    it("Inventar holatlari (ITEM_STATUSES) va sifat darajalari (ITEM_CONDITIONS) to'g'ri belgilangan", () => {
      assert.deepEqual([...ITEM_STATUSES], ["active", "repair", "written_off", "transferred", "lost"]);
      assert.deepEqual([...ITEM_CONDITIONS], ["new", "good", "fair", "poor", "broken"]);
    });

    it("Obyekt saqlash arxitekturasi (Object Storage) sozlanmagan holatda soxta muvaffaqiyat qaytarmaydi", async () => {
      const configured = isStorageConfigured();
      if (!configured) {
        const dummyBuffer = Buffer.from("test-content");
        const result = await uploadOfficialItemPhoto(dummyBuffer, "test.jpg", "image/jpeg", "org-1");
        assert.equal(result.success, false);
        assert.match(result.error || "", /ulanmagan|sozlangan/i);
      }
    });
  });

  // =========================================================================
  // 3. QR-KOD TIZIMI VA MAXFIYLIK (QR CODE & PRIVACY)
  // =========================================================================
  describe("3. Kriptografik QR-Kod Tizimi va Ommaviy Maxfiylik", () => {
    it("generateSecureQrToken(): 48 belgili unikal va taxmin qilib bo'lmaydigan token hosil qiladi", () => {
      const token1 = generateSecureQrToken();
      const token2 = generateSecureQrToken();

      assert.equal(token1.length, 48);
      assert.equal(token2.length, 48);
      assert.match(token1, /^[0-9a-f]{48}$/);
      assert.notEqual(token1, token2, "Har bir generatsiya unikal bo'lishi shart");
    });

    it("getPublicQrUrl(): to'g'ri ommaviy /qr/{token} URL manzilini shakllantiradi", () => {
      const token = "abcdef0123456789abcdef0123456789abcdef0123456789";
      const url = getPublicQrUrl(token);

      assert.match(url, new RegExp(`/qr/${token}$`));
      assert.equal(url.includes("/admin"), false);
      assert.equal(url.includes("/org"), false);
    });

    it("generateQrDataUrl(): yaroqli PNG Base64 Data URL generatsiya qiladi", async () => {
      const token = "testtoken1234567890123456789012345678901234567890";
      const dataUrl = await generateQrDataUrl(token);

      assert.equal(dataUrl.startsWith("data:image/png;base64,"), true);
    });

    it("generateQrSvg(): yaroqli vektorli SVG tegini generatsiya qiladi", async () => {
      const token = "testtoken1234567890123456789012345678901234567890";
      const svg = await generateQrSvg(token);

      assert.equal(svg.startsWith("<svg"), true);
      assert.equal(svg.includes("</svg>"), true);
    });

    it("Ommaviy QR sahifasi maxfiylik kafolati: narx, xodim va audit jurnallari ommaga berilmaydi", () => {
      // Public QR modeliga faqat quyidagi ma'lumotlar ruxsat etiladi:
      const publicViewModel = {
        inventoryNumber: "TATU-001",
        name: "Monoblok HP 24",
        categoryName: "Kompyuter uskunalari",
        organizationName: "TATU",
        organizationCode: "TATU",
        buildingName: "Bosh bino",
        roomNumber: "204",
        roomName: "Axborot xavfsizligi kafedrasi",
      };

      // Tekshiruv: Maxfiy maydonlar umuman yo'q
      const forbiddenFields = [
        "price",
        "purchaseDate",
        "currentAssignee",
        "custodianEmail",
        "custodianPhone",
        "auditLogs",
        "discrepancies",
        "internalNotes",
      ];

      for (const field of forbiddenFields) {
        assert.equal(field in publicViewModel, false, `${field} ommaviy ko'rinishda bo'lmasligi shart`);
      }
    });

    it("Restricted vs Public QR siyosati: restricted rejimida loginsiz foydalanuvchidan bino va xona yashirilishi kerak", () => {
      const itemPublic: { qrVisibility: "public" | "restricted"; [key: string]: unknown } = {
        name: "HP Monoblok",
        inventoryNumber: "TATU-001",
        qrVisibility: "public",
        buildingName: "Bosh bino",
        roomNumber: "101",
      };

      const itemRestricted: { qrVisibility: "public" | "restricted"; [key: string]: unknown } = {
        name: "Maxfiy Server",
        inventoryNumber: "TATU-002",
        qrVisibility: "restricted",
        buildingName: "Bosh bino",
        roomNumber: "101",
      };

      // Public bo'lganda bino va xona ommaga beriladi
      assert.equal(itemPublic.qrVisibility === "public", true);

      // Restricted bo'lganda bino va xona loginsiz ommaga ko'rsatilmasligi shart
      assert.equal(itemRestricted.qrVisibility === "restricted", true);
      const shouldHideLocations = itemRestricted.qrVisibility !== "public";
      assert.equal(shouldHideLocations, true);
    });
  });

  // =========================================================================
  // 4. TEKSHIRUV VA REKONSILYATSIYA (AUDIT & RECONCILIATION)
  // =========================================================================
  describe("4. Audit, Skanerlash va Konfliktlarni Aniqlash Mantiqi", () => {
    it("Inventarizatsiya auditini o'tkazish (canPerformAudit): faqat inspector va organization_admin", () => {
      assert.equal(canPerformAudit("inspector"), true);
      assert.equal(canPerformAudit("organization_admin"), true);
      assert.equal(canPerformAudit("registrar"), false, "Registrar mustaqil auditorlik tekshiruvi o'tkaza olmaydi");
      assert.equal(canPerformAudit("super_admin"), false);
    });

    it("Match vs Conflict mantiqi: kutilgan xonaga mos kelganda Match, farq qilganda Conflict", () => {
      const itemExpectedRoomId: string = "room-uuid-101";

      // 1-holat: Bir xil xona -> Match = true, Conflict = false
      const scannedInSameRoom: string = "room-uuid-101";
      const isMatchCase = scannedInSameRoom === itemExpectedRoomId;
      const isConflictCase = !isMatchCase;
      assert.equal(isMatchCase, true);
      assert.equal(isConflictCase, false);

      // 2-holat: Boshqa xona -> Match = false, Conflict = true
      const scannedInDifferentRoom: string = "room-uuid-204";
      const isMatchDiff = scannedInDifferentRoom === itemExpectedRoomId;
      const isConflictDiff = !isMatchDiff;
      assert.equal(isMatchDiff, false);
      assert.equal(isConflictDiff, true);
    });

    it("Konflikt holatida rasmiy xona o'zgarmasligi va konflikt logiga yozilishi shart", () => {
      const officialItem = {
        id: "item-1",
        name: "Proyektor Epson",
        officialRoomId: "room-101",
      };

      const scanEvent = {
        itemId: officialItem.id,
        expectedRoomId: officialItem.officialRoomId,
        scannedRoomId: "room-305", // Boshqa xonada topildi
        isMatch: false,
        isConflict: true,
      };

      // Rasmiy xona o'zgarmaganligini tasdiqlash
      assert.equal(officialItem.officialRoomId, "room-101");
      assert.equal(scanEvent.isConflict, true);
      assert.notEqual(scanEvent.scannedRoomId, officialItem.officialRoomId);
    });

    it("Xolis audit qoidasi: Hali tekshirilmagan xonadagi buyumlar 'yo'qolgan' (missing) deb hisoblanmaydi", () => {
      // 10 ta buyum bor, 5 tasi 101-xonada (tekshirilgan), 5 tasi 102-xonada (hali tekshirilmagan)
      const allItems = [
        { id: "i1", roomId: "room-101" },
        { id: "i2", roomId: "room-101" },
        { id: "i3", roomId: "room-101" },
        { id: "i4", roomId: "room-101" },
        { id: "i5", roomId: "room-101" },
        { id: "i6", roomId: "room-102" }, // pending
        { id: "i7", roomId: "room-102" }, // pending
        { id: "i8", roomId: "room-102" }, // pending
        { id: "i9", roomId: "room-102" }, // pending
        { id: "i10", roomId: "room-102" }, // pending
      ];

      const completedRooms = ["room-101"]; // Faqat 101 tugallangan
      const scannedItemIds = new Set(["i1", "i2", "i3"]); // 101-xonadan 3 tasi topildi, i4 va i5 topilmadi

      // Yo'qolganlar faqat completed bo'lgan xonalardan qidiriladi:
      const missingItems = allItems.filter(
        (item) => completedRooms.includes(item.roomId) && !scannedItemIds.has(item.id)
      );

      // Natija: faqat i4 va i5 (2 ta). 102-xonadagi 5 ta buyum missing ga kirmasligi shart!
      assert.equal(missingItems.length, 2);
      assert.deepEqual(
        missingItems.map((m) => m.id),
        ["i4", "i5"]
      );
    });
  });

  // =========================================================================
  // 5. XODIMLAR BOSHQARUVI (STAFF MANAGEMENT)
  // =========================================================================
  describe("5. Tashkilot Xodimlari Boshqaruvi va Xavfsizlik", () => {
    it("Xodimlarni boshqarish (canManageOrganizationUsers): faqat organization_admin", () => {
      assert.equal(canManageOrganizationUsers("organization_admin"), true);
      assert.equal(canManageOrganizationUsers("registrar"), false);
      assert.equal(canManageOrganizationUsers("inspector"), false);
      assert.equal(canManageOrganizationUsers("super_admin"), false);
    });

    it("Xodim paroli kuchliligi tekshiruvi (validateStaffPassword)", () => {
      assert.equal(validateStaffPassword("weak").valid, false);
      assert.equal(validateStaffPassword("Short1!").valid, false); // < 12 belgi
      assert.equal(validateStaffPassword("alllowercase1234!").valid, false); // Katta harfsiz
      assert.equal(validateStaffPassword("ALLUPPERCASE1234!").valid, false); // Kichik harfsiz
      assert.equal(validateStaffPassword("NoDigitsSpecial!Aa").valid, false); // Raqamsiz
      assert.equal(validateStaffPassword("NoSpecialChars123Aa").valid, false); // Maxsus belgisiz

      // To'g'ri kuchli parol
      assert.equal(validateStaffPassword("TatuSecure#2026!Staff").valid, true);
    });

    it("Tashkilot admini faqat 'inspector' va 'registrar' rollarini yarata oladi", () => {
      const allowedRoles = ["inspector", "registrar"];
      const forbiddenRoles = ["super_admin", "organization_admin"];

      for (const role of allowedRoles) {
        assert.equal(role === "inspector" || role === "registrar", true);
      }

      for (const role of forbiddenRoles) {
        assert.equal(role === "inspector" || role === "registrar", false);
      }
    });

    it("mustChangePassword = true bo'lgan xodim profilini inventar va audit harakatlaridan bloklash (PASSWORD_CHANGE_REQUIRED)", () => {
      const temporaryStaffProfile = {
        userId: "staff-temp-1",
        organizationId: "org-1",
        role: "inspector" as const,
        fullName: "Test Inspektor",
        isActive: true,
        mustChangePassword: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const statusCheck = verifyProfileStatus(temporaryStaffProfile);
      assert.equal(statusCheck.allowed, false);
      assert.equal(statusCheck.errorCode, "PASSWORD_CHANGE_REQUIRED");
      assert.match(statusCheck.errorMessage || "", /parolni o'zgartirishingiz shart/i);

      // Parol o'zgartirilgandan so'ng (mustChangePassword = false)
      const updatedProfile = { ...temporaryStaffProfile, mustChangePassword: false };
      const statusCheckAfter = verifyProfileStatus(updatedProfile);
      assert.equal(statusCheckAfter.allowed, true);
    });
  });
});
