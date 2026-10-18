"use server";

import { revalidatePath } from "next/cache";
import { requireAuthenticatedUser } from "@/lib/auth/authorization";
import { canPerformAudit } from "@/lib/auth/authorization-rules";
import { db } from "@/lib/db";
import {
  inventoryCycles,
  roomAudits,
  scanEvents,
  cycleConflicts,
  cycleItems,
  VALID_CYCLE_TRANSITIONS,
  type CycleStatus,
} from "@/lib/db/schema/audit";
import { items } from "@/lib/db/schema/inventory";
import { rooms } from "@/lib/db/schema/locations";
import { and, or, eq, desc } from "drizzle-orm";
import ExcelJS from "exceljs";
import { getReconciliationReport } from "@/lib/data/audit";

export interface ScanActionResult {
  success: boolean;
  message: string;
  isMatch?: boolean;
  isConflict?: boolean;
  item?: {
    id: string;
    name: string;
    inventoryNumber: string;
    expectedRoomNumber: string;
    scannedRoomNumber: string;
  };
}

/**
 * 1. QR Skanerlash va Tekshirish (Audit Scan Action)
 *
 * Vakolat: Faqat inspector va organization_admin ruxsat etilgan.
 *
 * Muhim qoidalar:
 * - Rasmiy xona avtomatik O'ZGARTIRILMAYDI.
 * - Boshqa xonada topilgan buyum KONFLIKT sifatida scan_events ga yoziladi.
 * - Takroriy skan ikki marta hisoblanmaydi (deduplication).
 */
export async function recordScanAction(
  _prevState: ScanActionResult | null,
  formData: FormData
): Promise<ScanActionResult> {
  try {
    const { profile, user, organization } = await requireAuthenticatedUser();

    if (!organization) {
      return { success: false, message: "Foydalanuvchi birorta faol tashkilotga biriktirilmagan." };
    }

    if (!canPerformAudit(profile.role)) {
      return {
        success: false,
        message: "Sizning rolingiz inventarizatsiya tekshiruvini o'tkazish huquqiga ega emas.",
      };
    }

    const tokenOrCode = (formData.get("tokenOrCode") as string)?.trim() || "";
    const scannedRoomId = (formData.get("scannedRoomId") as string)?.trim() || "";
    const cycleId = (formData.get("cycleId") as string)?.trim() || null;

    if (!tokenOrCode) {
      return { success: false, message: "QR kod yoki inventar raqamini kiriting." };
    }

    if (!scannedRoomId) {
      return { success: false, message: "Skanerlanayotgan xona tanlanishi shart." };
    }

    // 1. Skanerlanayotgan xonani tekshirish (Tenant isolation)
    const [scannedRoom] = await db
      .select({ id: rooms.id, roomNumber: rooms.roomNumber, name: rooms.name })
      .from(rooms)
      .where(and(eq(rooms.id, scannedRoomId), eq(rooms.organizationId, organization.id)))
      .limit(1);

    if (!scannedRoom) {
      return { success: false, message: "Tanlangan xona topilmadi yoki boshqa tashkilotga tegishli." };
    }

    // 2. Sikl tekshiruvi (Tenant isolation, Active status check, Immutability)
    let validatedCycle: { id: string; status: string; title: string } | null = null;
    if (cycleId) {
      const [foundCycle] = await db
        .select({
          id: inventoryCycles.id,
          status: inventoryCycles.status,
          title: inventoryCycles.title,
          organizationId: inventoryCycles.organizationId,
        })
        .from(inventoryCycles)
        .where(
          and(
            eq(inventoryCycles.id, cycleId),
            eq(inventoryCycles.organizationId, organization.id)
          )
        )
        .limit(1);

      if (!foundCycle) {
        return {
          success: false,
          message: "Ko'rsatilgan audit sikli topilmadi yoki boshqa tashkilotga tegishli.",
        };
      }

      if (foundCycle.status !== "in_progress") {
        return {
          success: false,
          message: `Ushbu audit sikli faol emas (holati: ${foundCycle.status}). Faqat "in_progress" (jarayonda) bo'lgan sikllarda skanerlash mumkin.`,
        };
      }

      // Xona audit holatini tekshirish: agar xona allaqachon yakunlangan bo'lsa, yangi skan bloklanadi
      const [existingRoomAudit] = await db
        .select({ id: roomAudits.id, status: roomAudits.status })
        .from(roomAudits)
        .where(
          and(
            eq(roomAudits.cycleId, cycleId),
            eq(roomAudits.roomId, scannedRoomId),
            eq(roomAudits.organizationId, organization.id)
          )
        )
        .limit(1);

      if (existingRoomAudit && existingRoomAudit.status === "completed") {
        return {
          success: false,
          message: `Ushbu xona auditi allaqachon yakunlangan (${scannedRoom.roomNumber}-xona). Yakunlangan xonaga yangi skanlar kiritish bloklangan.`,
        };
      }

      validatedCycle = foundCycle;
    }

    // 3. Token yoki inventar raqamini normalizatsiya qilish (URL bo'lsa token ajratib olinadi)
    let cleanToken = tokenOrCode.trim();
    if (cleanToken.includes("/qr/")) {
      const parts = cleanToken.split("/qr/");
      cleanToken = parts[parts.length - 1].split("?")[0].split("#")[0].trim();
    }

    const [foundItem] = await db
      .select({
        id: items.id,
        name: items.name,
        inventoryNumber: items.inventoryNumber,
        roomId: items.roomId,
      })
      .from(items)
      .where(
        and(
          eq(items.organizationId, organization.id),
          or(
            eq(items.qrToken, cleanToken),
            eq(items.inventoryNumber, cleanToken.toUpperCase())
          )
        )
      )
      .limit(1);

    if (!foundItem) {
      return {
        success: false,
        message: `[${tokenOrCode}] identifikatori bilan inventar topilmadi.`,
      };
    }

    // 4. Kutilgan xona ma'lumotlari (Tenant isolation)
    const [expectedRoom] = await db
      .select({ id: rooms.id, roomNumber: rooms.roomNumber, name: rooms.name })
      .from(rooms)
      .where(
        and(
          eq(rooms.id, foundItem.roomId),
          eq(rooms.organizationId, organization.id)
        )
      )
      .limit(1);

    const isMatch = foundItem.roomId === scannedRoomId;
    const isConflict = !isMatch;

    // 5. Takroriy skanerni tekshirish (Idempotent Deduplication)
    if (validatedCycle) {
      const [recentScan] = await db
        .select({ id: scanEvents.id, scannedAt: scanEvents.scannedAt })
        .from(scanEvents)
        .where(
          and(
            eq(scanEvents.organizationId, organization.id),
            eq(scanEvents.cycleId, validatedCycle.id),
            eq(scanEvents.itemId, foundItem.id),
            eq(scanEvents.scannedRoomId, scannedRoomId)
          )
        )
        .orderBy(desc(scanEvents.scannedAt))
        .limit(1);

      if (recentScan) {
        return {
          success: true,
          isMatch,
          isConflict,
          message: `Eslatma: Ushbu inventar (${foundItem.inventoryNumber}) ushbu xonada allaqachon skanerlangan. Takroriy skan sifatida qayd etildi.`,
          item: {
            id: foundItem.id,
            name: foundItem.name,
            inventoryNumber: foundItem.inventoryNumber,
            expectedRoomNumber: expectedRoom?.roomNumber || "Noma'lum",
            scannedRoomNumber: scannedRoom.roomNumber,
          },
        };
      }
    }

    // 6. DB tranzaksiyasi orqali yozish (scan_events, cycle_conflicts, room_audits)
    await db.transaction(async (tx) => {
      const [insertedScan] = await tx
        .insert(scanEvents)
        .values({
          organizationId: organization.id,
          cycleId: validatedCycle ? validatedCycle.id : null,
          itemId: foundItem.id,
          expectedRoomId: foundItem.roomId,
          scannedRoomId,
          isMatch,
          isConflict,
          scannedBy: user.id,
        })
        .returning({ id: scanEvents.id });

      // 6b. Agar konflikt yuz bersa va faol sikl bo'lsa, cycle_conflicts jadvaliga kiritish
      if (isConflict && validatedCycle && insertedScan) {
        await tx
          .insert(cycleConflicts)
          .values({
            organizationId: organization.id,
            cycleId: validatedCycle.id,
            itemId: foundItem.id,
            scanEventId: insertedScan.id,
            expectedRoomId: foundItem.roomId,
            scannedRoomId,
            status: "open",
          })
          .onConflictDoNothing({
            target: [cycleConflicts.cycleId, cycleConflicts.itemId],
          });
      }

      // 6c. Xona audit holatini in_progress ga o'tkazish (faqat pending bo'lsa)
      if (validatedCycle) {
        await tx
          .update(roomAudits)
          .set({
            status: "in_progress",
            auditedBy: user.id,
            auditedAt: new Date(),
            updatedAt: new Date(),
          })
          .where(
            and(
              eq(roomAudits.cycleId, validatedCycle.id),
              eq(roomAudits.roomId, scannedRoomId),
              eq(roomAudits.organizationId, organization.id),
              eq(roomAudits.status, "pending")
            )
          );
      }
    });

    revalidatePath("/audit");
    revalidatePath("/audit/scan");
    revalidatePath("/org/audits");
    revalidatePath("/org/reports");

    if (isConflict) {
      return {
        success: true,
        isMatch: false,
        isConflict: true,
        message: `DIQQAT! Joylashuv nomuvofiqligi: "${foundItem.name}" rasman ${expectedRoom?.roomNumber || "boshqa"}-xonaga biriktirilgan, lekin ${scannedRoom.roomNumber}-xonada topildi. Konflikt jurnali qayd etildi.`,
        item: {
          id: foundItem.id,
          name: foundItem.name,
          inventoryNumber: foundItem.inventoryNumber,
          expectedRoomNumber: expectedRoom?.roomNumber || "Noma'lum",
          scannedRoomNumber: scannedRoom.roomNumber,
        },
      };
    }

    return {
      success: true,
      isMatch: true,
      isConflict: false,
      message: `Muvaffaqiyatli! "${foundItem.name}" (${foundItem.inventoryNumber}) o'z rasmiy joyida (${scannedRoom.roomNumber}-xona) tasdiqlandi.`,
      item: {
        id: foundItem.id,
        name: foundItem.name,
        inventoryNumber: foundItem.inventoryNumber,
        expectedRoomNumber: expectedRoom?.roomNumber || "Noma'lum",
        scannedRoomNumber: scannedRoom.roomNumber,
      },
    };
  } catch (err) {
    return {
      success: false,
      message: err instanceof Error ? err.message : "Skanerlashda xatolik yuz berdi.",
    };
  }
}

/**
 * 2. Xona auditini yakunlash (Complete Room Audit)
 * Faqat xona auditi yakunlangandan keyingina yo'qolgan buyumlar rasmiy hisoblanadi!
 */
export async function completeRoomAuditAction(
  _prevState: unknown,
  formData: FormData
) {
  try {
    const { profile, user, organization } = await requireAuthenticatedUser();

    if (!organization || !canPerformAudit(profile.role)) {
      return { success: false, message: "Vakolatingiz yetarli emas." };
    }

    const cycleId = (formData.get("cycleId") as string)?.trim();
    const roomId = (formData.get("roomId") as string)?.trim();

    if (!cycleId || !roomId) {
      return { success: false, message: "Sikl va xona ko'rsatilishi shart." };
    }

    // 1. Sikl tekshiruvi (Tenant isolation va status)
    const [cycle] = await db
      .select({ id: inventoryCycles.id, status: inventoryCycles.status, title: inventoryCycles.title })
      .from(inventoryCycles)
      .where(
        and(
          eq(inventoryCycles.id, cycleId),
          eq(inventoryCycles.organizationId, organization.id)
        )
      )
      .limit(1);

    if (!cycle) {
      return { success: false, message: "Audit sikli topilmadi yoki boshqa tashkilotga tegishli." };
    }

    if (cycle.status !== "in_progress") {
      return {
        success: false,
        message: `Ushbu audit sikli faol emas (holati: ${cycle.status}). Faqat "in_progress" sikldagi xona auditini yakunlash mumkin.`,
      };
    }

    // 2. Xona tekshiruvi (Tenant isolation)
    const [room] = await db
      .select({ id: rooms.id, roomNumber: rooms.roomNumber })
      .from(rooms)
      .where(
        and(
          eq(rooms.id, roomId),
          eq(rooms.organizationId, organization.id)
        )
      )
      .limit(1);

    if (!room) {
      return { success: false, message: "Xona topilmadi yoki boshqa tashkilotga tegishli." };
    }

    // 3. Room audit yozuvini tekshirish
    const [existingRoomAudit] = await db
      .select({ id: roomAudits.id, status: roomAudits.status })
      .from(roomAudits)
      .where(
        and(
          eq(roomAudits.cycleId, cycleId),
          eq(roomAudits.roomId, roomId),
          eq(roomAudits.organizationId, organization.id)
        )
      )
      .limit(1);

    if (!existingRoomAudit) {
      return { success: false, message: "Ushbu xona uchun ushbu siklda audit yozuvi mavjud emas." };
    }

    if (existingRoomAudit.status === "completed") {
      return { success: true, message: `"${room.roomNumber}"-xona auditi allaqachon yakunlangan.` };
    }

    await db
      .update(roomAudits)
      .set({
        status: "completed",
        auditedBy: user.id,
        auditedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(roomAudits.cycleId, cycleId),
          eq(roomAudits.roomId, roomId),
          eq(roomAudits.organizationId, organization.id)
        )
      );

    revalidatePath("/audit");
    revalidatePath("/audit/scan");
    revalidatePath("/org/audits");
    revalidatePath("/org/reports");

    return { success: true, message: `"${room.roomNumber}"-xona auditi muvaffaqiyatli yakunlandi.` };
  } catch (err) {
    return {
      success: false,
      message: err instanceof Error ? err.message : "Xona auditini yakunlashda xatolik yuz berdi.",
    };
  }
}

/**
 * 3. Yangi Inventarizatsiya Siklini boshlash (Create Inventory Cycle)
 * Faqat Organization Admin vakolati
 */
export async function createCycleAction(
  _prevState: unknown,
  formData: FormData
) {
  try {
    const { profile, user, organization } = await requireAuthenticatedUser();

    if (!organization || profile.role !== "organization_admin") {
      return { success: false, message: "Faqat Tashkilot Administratori yangi audit sikli yarata oladi." };
    }

    const title = (formData.get("title") as string)?.trim() || "";
    const notes = (formData.get("notes") as string)?.trim() || "";

    if (!title || title.length < 3) {
      return { success: false, message: "Sikl nomi kamida 3 ta belgidan iborat bo'lishi shart." };
    }

    // 1. Yangi sikl yozuvini kiritish
    const [newCycle] = await db
      .insert(inventoryCycles)
      .values({
        organizationId: organization.id,
        title,
        status: "in_progress",
        startDate: new Date(),
        createdBy: user.id,
        notes: notes || null,
      })
      .returning();

    // 2. Tashkilotdagi barcha faol xonalar uchun room_audits yaratish
    const orgRooms = await db
      .select({ id: rooms.id })
      .from(rooms)
      .where(and(eq(rooms.organizationId, organization.id), eq(rooms.isActive, true)));

    if (orgRooms.length > 0) {
      await db.insert(roomAudits).values(
        orgRooms.map((r) => ({
          cycleId: newCycle.id,
          organizationId: organization.id,
          roomId: r.id,
          status: "pending" as const,
        }))
      );
    }

    // 3. Tashkilotdagi barcha faol inventarlarning sikl boshidagi holatini muzlatish (Immutable Cycle Items Snapshot)
    const orgItems = await db
      .select({
        id: items.id,
        buildingId: items.buildingId,
        floorId: items.floorId,
        roomId: items.roomId,
        inventoryNumber: items.inventoryNumber,
        name: items.name,
        categoryId: items.categoryId,
        condition: items.condition,
        price: items.price,
      })
      .from(items)
      .where(and(eq(items.organizationId, organization.id), eq(items.status, "active")));

    if (orgItems.length > 0) {
      await db.insert(cycleItems).values(
        orgItems.map((it) => ({
          cycleId: newCycle.id,
          organizationId: organization.id,
          itemId: it.id,
          expectedBuildingId: it.buildingId,
          expectedFloorId: it.floorId,
          expectedRoomId: it.roomId,
          inventoryNumber: it.inventoryNumber,
          itemName: it.name,
          categoryId: it.categoryId,
          condition: it.condition,
          price: it.price,
        }))
      );
    }

    revalidatePath("/org/audits");
    revalidatePath("/audit");

    return { success: true, message: `"${title}" inventarizatsiya sikli muvaffaqiyatli boshlandi.` };
  } catch (err) {
    return {
      success: false,
      message: err instanceof Error ? err.message : "Sikl yaratishda xatolik yuz berdi.",
    };
  }
}

export async function updateCycleStatusAction(
  cycleId: string,
  status: "completed" | "cancelled" | "in_progress"
): Promise<{ success: boolean; message: string }> {
  try {
    const { profile, organization } = await requireAuthenticatedUser();

    if (!organization || profile.role !== "organization_admin") {
      return { success: false, message: "Faqat Tashkilot Administratori audit siklini yakunlay oladi." };
    }

    if (!cycleId) {
      return { success: false, message: "Sikl identifikatori ko'rsatilmadi." };
    }

    const [existing] = await db
      .select({ id: inventoryCycles.id, title: inventoryCycles.title, status: inventoryCycles.status })
      .from(inventoryCycles)
      .where(and(eq(inventoryCycles.id, cycleId), eq(inventoryCycles.organizationId, organization.id)))
      .limit(1);

    if (!existing) {
      return { success: false, message: "Audit sikli topilmadi." };
    }

    if (existing.status === status) {
      return { success: true, message: `Audit sikli allaqachon "${status}" holatida.` };
    }

    // Immutability siyosati: completed va cancelled holatidagi sikllar terminal hisoblanadi
    if (existing.status === "completed") {
      return {
        success: false,
        message: "Yakunlangan audit sikli qulflangan (immutability siyosati). Rasmiy audit ma'lumotlari buzilmasligi uchun uning holatini o'zgartirib bo'lmaydi.",
      };
    }

    if (existing.status === "cancelled") {
      return {
        success: false,
        message: "Bekor qilingan audit sikli yopilgan. Uning holatini qayta o'zgartirish mumkin emas.",
      };
    }

    const allowedNextStatuses = VALID_CYCLE_TRANSITIONS[existing.status] || [];
    if (!allowedNextStatuses.includes(status)) {
      return {
        success: false,
        message: `Noto'g'ri status o'tishi: "${existing.status}" holatidan "${status}" holatiga o'tib bo'lmaydi.`,
      };
    }

    await db
      .update(inventoryCycles)
      .set({
        status,
        endDate: status === "completed" || status === "cancelled" ? new Date() : null,
        updatedAt: new Date(),
      })
      .where(and(eq(inventoryCycles.id, cycleId), eq(inventoryCycles.organizationId, organization.id)));

    revalidatePath("/org/audits");
    revalidatePath("/org/reports");
    revalidatePath("/audit");

    const statusLabel =
      status === "completed"
        ? "muvaffaqiyatli yakunlandi"
        : status === "cancelled"
        ? "bekor qilindi"
        : "jarayonda deb belgilandi";

    return {
      success: true,
      message: `"${existing.title}" audit sikli ${statusLabel}.`,
    };
  } catch (err) {
    return {
      success: false,
      message: err instanceof Error ? err.message : "Sikl holatini o'zgartirishda xatolik yuz berdi.",
    };
  }
}

/**
 * 6. Rekonsilyatsiya hisobotini Excel (.xlsx) formatida eksport qilish
 */
export async function exportReportExcelAction(cycleId: string): Promise<{
  success: boolean;
  base64?: string;
  filename?: string;
  message?: string;
}> {
  try {
    const { profile, organization } = await requireAuthenticatedUser();
    if (!organization) return { success: false, message: "Tashkilot aniqlanmadi." };
    if (!canPerformAudit(profile.role) && profile.role !== "organization_admin") {
      return { success: false, message: "Hisobotni eksport qilish huquqiga ega emassiz." };
    }

    const report = await getReconciliationReport({
      organizationId: organization.id,
      cycleId,
    });

    if (!report) {
      return { success: false, message: "Tanlangan audit sikli hisoboti topilmadi." };
    }

    const workbook = new ExcelJS.Workbook();
    workbook.creator = "AssetAudit Platform";
    workbook.created = new Date();

    // 1. Umumiy Xulosa varag'i
    const summarySheet = workbook.addWorksheet("Umumiy Xulosa");
    summarySheet.columns = [
      { header: "Ko'rsatkich", key: "metric", width: 35 },
      { header: "Qiymat", key: "value", width: 25 },
    ];
    const sumHeader = summarySheet.getRow(1);
    sumHeader.font = { bold: true, color: { argb: "FF0F172A" } };
    sumHeader.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFF1F5F9" } };

    summarySheet.addRow({ metric: "Audit Sikli", value: report.cycleTitle });
    summarySheet.addRow({ metric: "Jami kutilgan mulklar", value: report.totalExpectedItems });
    summarySheet.addRow({ metric: "Skanerlangan mulklar", value: report.totalScannedItems });
    summarySheet.addRow({ metric: "Mos kelganlar (Match)", value: report.matchedItemsCount });
    summarySheet.addRow({ metric: "Konfliktlar (Location mismatch)", value: report.conflictItemsCount });
    summarySheet.addRow({ metric: "Topilmagan mulklar (Missing)", value: report.missingItemsCount });
    summarySheet.addRow({ metric: "Tekshirilgan xonalar", value: `${report.completedRooms} / ${report.totalRooms}` });

    // 2. Joylashuv Konfliktlari varag'i
    const conflictSheet = workbook.addWorksheet("Joylashuv Konfliktlari");
    conflictSheet.columns = [
      { header: "Inventar Raqami", key: "inv", width: 20 },
      { header: "Buyum Nomi", key: "name", width: 32 },
      { header: "Kutilgan Joylashuv", key: "expected", width: 30 },
      { header: "Amalda Topilgan Joylashuv", key: "scanned", width: 30 },
      { header: "Tekshiruvchi", key: "scanner", width: 25 },
      { header: "Skanerlangan Sana", key: "date", width: 20 },
    ];
    const confHeader = conflictSheet.getRow(1);
    confHeader.font = { bold: true, color: { argb: "FF0F172A" } };
    confHeader.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFFEE2E2" } };

    for (const c of report.conflicts) {
      conflictSheet.addRow({
        inv: c.inventoryNumber,
        name: c.itemName,
        expected: `${c.expectedBuildingName} / ${c.expectedRoomNumber}-xona`,
        scanned: `${c.scannedBuildingName} / ${c.scannedRoomNumber}-xona`,
        scanner: c.scannerName || "Inspektor",
        date: new Date(c.scannedAt).toLocaleString("uz-UZ"),
      });
    }

    // 3. Topilmagan mulklar varag'i
    if (report.missingItems && report.missingItems.length > 0) {
      const missingSheet = workbook.addWorksheet("Topilmagan Mulklar");
      missingSheet.columns = [
        { header: "Inventar Raqami", key: "inv", width: 20 },
        { header: "Buyum Nomi", key: "name", width: 32 },
        { header: "Kutilgan Joylashuv", key: "location", width: 30 },
        { header: "Holati", key: "status", width: 20 },
      ];
      const missHeader = missingSheet.getRow(1);
      missHeader.font = { bold: true, color: { argb: "FF0F172A" } };
      missHeader.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFFEF3C7" } };

      for (const m of report.missingItems) {
        missingSheet.addRow({
          inv: m.inventoryNumber,
          name: m.name,
          location: `${m.buildingName} / ${m.roomNumber}-xona`,
          status: "Topilmadi",
        });
      }
    }

    const buffer = await workbook.xlsx.writeBuffer();
    const base64 = Buffer.from(buffer).toString("base64");
    const sanitizedTitle = report.cycleTitle.toLowerCase().replace(/[^a-z0-9]/g, "_");

    return {
      success: true,
      base64,
      filename: `rekonsilyatsiya_${sanitizedTitle}.xlsx`,
    };
  } catch (err) {
    return {
      success: false,
      message: err instanceof Error ? err.message : "Excel hisobotini shakllantirishda xatolik yuz berdi.",
    };
  }
}
