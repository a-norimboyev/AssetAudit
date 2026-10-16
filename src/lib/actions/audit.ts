"use server";

import { revalidatePath } from "next/cache";
import { requireAuthenticatedUser } from "@/lib/auth/authorization";
import { canPerformAudit } from "@/lib/auth/authorization-rules";
import { db } from "@/lib/db";
import { inventoryCycles, roomAudits, scanEvents, cycleConflicts, cycleItems } from "@/lib/db/schema/audit";
import { items } from "@/lib/db/schema/inventory";
import { rooms } from "@/lib/db/schema/locations";
import { and, or, eq, desc } from "drizzle-orm";

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

    // 1. Skanerlanayotgan xonani tekshirish
    const [scannedRoom] = await db
      .select({ id: rooms.id, roomNumber: rooms.roomNumber, name: rooms.name })
      .from(rooms)
      .where(and(eq(rooms.id, scannedRoomId), eq(rooms.organizationId, organization.id)))
      .limit(1);

    if (!scannedRoom) {
      return { success: false, message: "Tanlangan xona topilmadi yoki boshqa tashkilotga tegishli." };
    }

    // 2. Token yoki inventar raqamini normalizatsiya qilish (URL bo'lsa token ajratib olinadi)
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

    // 3. Kutilgan xona ma'lumotlari
    const [expectedRoom] = await db
      .select({ id: rooms.id, roomNumber: rooms.roomNumber, name: rooms.name })
      .from(rooms)
      .where(eq(rooms.id, foundItem.roomId))
      .limit(1);

    const isMatch = foundItem.roomId === scannedRoomId;
    const isConflict = !isMatch;

    // 4. Takroriy skanerni tekshirish (Idempotent Deduplication)
    // Agar ushbu sikl va xonada aynan shu buyum allaqachon skan qilingan bo'lsa
    if (cycleId) {
      const [recentScan] = await db
        .select({ id: scanEvents.id, scannedAt: scanEvents.scannedAt })
        .from(scanEvents)
        .where(
          and(
            eq(scanEvents.cycleId, cycleId),
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

    // 5. Scan Events jadvaliga rasmiy qayd etish
    const [insertedScan] = await db
      .insert(scanEvents)
      .values({
        organizationId: organization.id,
        cycleId,
        itemId: foundItem.id,
        expectedRoomId: foundItem.roomId,
        scannedRoomId,
        isMatch,
        isConflict,
        scannedBy: user.id,
      })
      .returning({ id: scanEvents.id });

    // 5b. Agar konflikt yuz bersa va faol sikl bo'lsa, cycle_conflicts jadvaliga kiritish
    if (isConflict && cycleId && insertedScan) {
      await db
        .insert(cycleConflicts)
        .values({
          organizationId: organization.id,
          cycleId,
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

    // 6. Xona audit holatini in_progress ga o'tkazish
    if (cycleId) {
      await db
        .update(roomAudits)
        .set({
          status: "in_progress",
          auditedBy: user.id,
          auditedAt: new Date(),
          updatedAt: new Date(),
        })
        .where(
          and(
            eq(roomAudits.cycleId, cycleId),
            eq(roomAudits.roomId, scannedRoomId),
            eq(roomAudits.status, "pending")
          )
        );
    }

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
    revalidatePath("/org/audits");
    revalidatePath("/org/reports");

    return { success: true, message: "Xona auditi muvaffaqiyatli yakunlandi." };
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
