"use server";

import { revalidatePath } from "next/cache";
import ExcelJS from "exceljs";
import { requireAuthenticatedUser } from "@/lib/auth/authorization";
import { canCreateNewItem, canRelocateItem } from "@/lib/auth/authorization-rules";
import { db } from "@/lib/db";
import { items, type ItemStatus, type ItemCondition, ITEM_STATUSES, ITEM_CONDITIONS } from "@/lib/db/schema/inventory";
import { rooms } from "@/lib/db/schema/locations";
import { generateSecureQrToken } from "@/lib/qr";
import { and, eq } from "drizzle-orm";
import { getInventoryList } from "@/lib/data/inventory";

export interface ActionResponse {
  success: boolean;
  message: string;
  fieldErrors?: Record<string, string>;
  data?: unknown;
}

/**
 * 1. Yangi Inventar birligini ro'yxatga olish (Server Action)
 * Vakolat: Faqat organization_admin va registrar yangi inventarni darhol rasmiy ro'yxatga qo'sha oladi.
 * Inspector yarata OLMAYDI.
 */
export async function createItemAction(
  _prevState: ActionResponse | null,
  formData: FormData
): Promise<ActionResponse> {
  try {
    const { profile, organization } = await requireAuthenticatedUser();

    if (!organization) {
      return { success: false, message: "Foydalanuvchi birorta faol tashkilotga biriktirilmagan." };
    }

    // RBAC: canCreateNewItem (Registrar va Organization Admin ruxsat etilgan)
    if (!canCreateNewItem(profile.role)) {
      return {
        success: false,
        message: "Sizning rolingiz (Inspektor) yangi inventarni ro'yxatga olish huquqiga ega emas.",
      };
    }

    const name = (formData.get("name") as string)?.trim() || "";
    const inventoryNumber = (formData.get("inventoryNumber") as string)?.trim().toUpperCase() || "";
    const categoryId = (formData.get("categoryId") as string)?.trim() || "";
    const buildingId = (formData.get("buildingId") as string)?.trim() || "";
    const floorId = (formData.get("floorId") as string)?.trim() || "";
    const roomId = (formData.get("roomId") as string)?.trim() || "";
    const description = (formData.get("description") as string)?.trim() || "";
    const status = ((formData.get("status") as string)?.trim() || "active") as ItemStatus;
    const condition = ((formData.get("condition") as string)?.trim() || "good") as ItemCondition;
    const priceRaw = (formData.get("price") as string)?.trim();
    const price = priceRaw ? parseFloat(priceRaw).toFixed(2) : null;

    const fieldErrors: Record<string, string> = {};

    if (!name || name.length < 2) fieldErrors.name = "Inventar nomi kiritilishi shart (kamida 2 belgi).";
    if (!inventoryNumber) fieldErrors.inventoryNumber = "Inventar raqami kiritilishi shart.";
    if (!categoryId) fieldErrors.categoryId = "Toifa tanlanishi shart.";
    if (!buildingId) fieldErrors.buildingId = "Bino tanlanishi shart.";
    if (!floorId) fieldErrors.floorId = "Qavat tanlanishi shart.";
    if (!roomId) fieldErrors.roomId = "Xona tanlanishi shart.";
    if (!ITEM_STATUSES.includes(status)) fieldErrors.status = "Yaroqsiz holat tanlandi.";
    if (!ITEM_CONDITIONS.includes(condition)) fieldErrors.condition = "Yaroqsiz sifat darajasi tanlandi.";

    if (Object.keys(fieldErrors).length > 0) {
      return { success: false, message: "Kiritilgan ma'lumotlarda xatolik bor.", fieldErrors };
    }

    // Xona ushbu tashkilotga, binoga va qavatga to'liq mosligini tekshirish (Intra-tenant hierarchy validation)
    const [room] = await db
      .select({ id: rooms.id })
      .from(rooms)
      .where(
        and(
          eq(rooms.id, roomId),
          eq(rooms.organizationId, organization.id),
          eq(rooms.buildingId, buildingId),
          eq(rooms.floorId, floorId)
        )
      )
      .limit(1);

    if (!room) {
      return {
        success: false,
        message: "Tanlangan xona, qavat va bino o'zaro mos kelmadi yoki boshqa tashkilotga tegishli.",
      };
    }

    // Tashkilot ichida inventar raqami takrorlanmasligini tekshirish
    const [existingInv] = await db
      .select({ id: items.id })
      .from(items)
      .where(and(eq(items.organizationId, organization.id), eq(items.inventoryNumber, inventoryNumber)))
      .limit(1);

    if (existingInv) {
      return {
        success: false,
        message: `Ushbu tashkilotda "${inventoryNumber}" raqamli inventar allaqachon mavjud.`,
        fieldErrors: { inventoryNumber: "Inventar raqami takrorlanmasligi shart." },
      };
    }

    // Unikal QR token generatsiya qilish
    const qrToken = generateSecureQrToken();

    const [newItem] = await db
      .insert(items)
      .values({
        organizationId: organization.id,
        inventoryNumber,
        name,
        categoryId,
        description: description || null,
        buildingId,
        floorId,
        roomId,
        status,
        condition,
        qrToken,
        price,
        currency: "UZS",
      })
      .returning();

    revalidatePath("/org/inventory");
    revalidatePath("/org/rooms");
    revalidatePath("/org");

    return {
      success: true,
      message: `"${newItem.name}" (${newItem.inventoryNumber}) muvaffaqiyatli ro'yxatga olindi.`,
      data: { id: newItem.id, qrToken: newItem.qrToken },
    };
  } catch (err) {
    return {
      success: false,
      message: err instanceof Error ? err.message : "Inventarni saqlashda server xatoligi yuz berdi.",
    };
  }
}

/**
 * 2. Mavjud inventarning rasmiy joylashuvini o'zgartirish (Ko'chirish)
 * Qat'iy qoida: Faqat Organization Admin ruxsat etilgan.
 * Registrar va Inspector mavjud inventar joylashuvini o'zgartira OLMAYDI!
 */
export async function relocateItemAction(
  _prevState: ActionResponse | null,
  formData: FormData
): Promise<ActionResponse> {
  try {
    const { profile, organization } = await requireAuthenticatedUser();

    if (!organization) {
      return { success: false, message: "Foydalanuvchi birorta faol tashkilotga biriktirilmagan." };
    }

    // RBAC: canRelocateItem (Faqat organization_admin)
    if (!canRelocateItem(profile.role)) {
      return {
        success: false,
        message: "Xavfsizlik cheklovi: Faqat Tashkilot Administratori inventarning rasmiy joylashuvini o'zgartira oladi. Moddiy javobgar yoki inspektor ko'chirish huquqiga ega emas.",
      };
    }

    const itemId = (formData.get("itemId") as string)?.trim();
    const newBuildingId = (formData.get("buildingId") as string)?.trim();
    const newFloorId = (formData.get("floorId") as string)?.trim();
    const newRoomId = (formData.get("roomId") as string)?.trim();

    if (!itemId || !newBuildingId || !newFloorId || !newRoomId) {
      return { success: false, message: "Barcha maydonlar to'liq tanlanishi shart." };
    }

    // Inventar va yangi xona ushbu tashkilotga tegishli ekanini tekshirish
    const [targetItem] = await db
      .select({ id: items.id })
      .from(items)
      .where(and(eq(items.id, itemId), eq(items.organizationId, organization.id)))
      .limit(1);

    if (!targetItem) {
      return { success: false, message: "Inventar topilmadi." };
    }

    const [targetRoom] = await db
      .select({ id: rooms.id })
      .from(rooms)
      .where(
        and(
          eq(rooms.id, newRoomId),
          eq(rooms.organizationId, organization.id),
          eq(rooms.buildingId, newBuildingId),
          eq(rooms.floorId, newFloorId)
        )
      )
      .limit(1);

    if (!targetRoom) {
      return { success: false, message: "Tanlangan yangi xona, qavat va bino o'zaro mos kelmadi yoki boshqa tashkilotga tegishli." };
    }

    await db
      .update(items)
      .set({
        buildingId: newBuildingId,
        floorId: newFloorId,
        roomId: newRoomId,
        updatedAt: new Date(),
      })
      .where(and(eq(items.id, itemId), eq(items.organizationId, organization.id)));

    revalidatePath(`/org/inventory/${itemId}`);
    revalidatePath("/org/inventory");
    revalidatePath("/org/rooms");

    return { success: true, message: "Inventarning rasmiy joylashuvi muvaffaqiyatli yangilandi." };
  } catch (err) {
    return {
      success: false,
      message: err instanceof Error ? err.message : "Ko'chirishda xatolik yuz berdi.",
    };
  }
}

/**
 * 3. Inventar ma'lumotlarini tahrirlash (Server Action)
 * Nomi, tavsifi, toifasi, holati va narxini yangilash
 */
export async function updateItemAction(
  _prevState: ActionResponse | null,
  formData: FormData
): Promise<ActionResponse> {
  try {
    const { profile, organization } = await requireAuthenticatedUser();

    if (!organization) {
      return { success: false, message: "Tashkilot topilmadi." };
    }

    if (!canCreateNewItem(profile.role)) {
      return { success: false, message: "Inventar ma'lumotlarini o'zgartirish uchun huquqingiz yetarli emas." };
    }

    const itemId = (formData.get("itemId") as string)?.trim();
    const name = (formData.get("name") as string)?.trim() || "";
    const description = (formData.get("description") as string)?.trim() || "";
    const categoryId = (formData.get("categoryId") as string)?.trim() || "";
    const status = ((formData.get("status") as string)?.trim() || "active") as ItemStatus;
    const condition = ((formData.get("condition") as string)?.trim() || "good") as ItemCondition;
    const priceRaw = (formData.get("price") as string)?.trim();
    const price = priceRaw ? parseFloat(priceRaw).toFixed(2) : null;

    if (!itemId) return { success: false, message: "Inventar ID ko'rsatilmadi." };
    if (!name || name.length < 2) return { success: false, message: "Inventar nomi kamida 2 ta belgi bo'lishi shart." };
    if (!ITEM_STATUSES.includes(status)) return { success: false, message: "Yaroqsiz holat." };
    if (!ITEM_CONDITIONS.includes(condition)) return { success: false, message: "Yaroqsiz sifat darajasi." };

    const [existing] = await db
      .select({ id: items.id, inventoryNumber: items.inventoryNumber })
      .from(items)
      .where(and(eq(items.id, itemId), eq(items.organizationId, organization.id)))
      .limit(1);

    if (!existing) return { success: false, message: "Inventar topilmadi yoki boshqa tashkilotga tegishli." };

    await db
      .update(items)
      .set({
        name,
        description: description || null,
        ...(categoryId ? { categoryId } : {}),
        status,
        condition,
        price,
        updatedAt: new Date(),
      })
      .where(and(eq(items.id, itemId), eq(items.organizationId, organization.id)));

    revalidatePath(`/org/inventory/${itemId}`);
    revalidatePath("/org/inventory");
    revalidatePath("/org");

    return { success: true, message: `"${name}" (${existing.inventoryNumber}) inventari muvaffaqiyatli yangilandi.` };
  } catch (err) {
    return {
      success: false,
      message: err instanceof Error ? err.message : "Inventarni yangilashda xatolik yuz berdi.",
    };
  }
}

/**
 * 4. Inventarni hisobdan chiqarish / arxivlash (Soft Delete)
 * Hard DELETE qat'iyan taqiqlanadi (audit tarixi va rekonsilyatsiya hisoboti yaxlitligi uchun)
 */
export async function archiveItemAction(itemId: string): Promise<ActionResponse> {
  try {
    const { profile, organization } = await requireAuthenticatedUser();

    if (!organization) {
      return { success: false, message: "Tashkilot topilmadi." };
    }

    if (!canCreateNewItem(profile.role)) {
      return { success: false, message: "Inventarni hisobdan chiqarish huquqingiz yo'q." };
    }

    if (!itemId) return { success: false, message: "Inventar ID ko'rsatilmadi." };

    const [existing] = await db
      .select({ id: items.id, name: items.name, inventoryNumber: items.inventoryNumber })
      .from(items)
      .where(and(eq(items.id, itemId), eq(items.organizationId, organization.id)))
      .limit(1);

    if (!existing) return { success: false, message: "Inventar topilmadi." };

    await db
      .update(items)
      .set({
        status: "written_off",
        updatedAt: new Date(),
      })
      .where(and(eq(items.id, itemId), eq(items.organizationId, organization.id)));

    revalidatePath(`/org/inventory/${itemId}`);
    revalidatePath("/org/inventory");
    revalidatePath("/org");

    return {
      success: true,
      message: `"${existing.name}" (${existing.inventoryNumber}) hisobdan chiqarildi (arxivlandi).`,
    };
  } catch (err) {
    return {
      success: false,
      message: err instanceof Error ? err.message : "Inventarni arxivlashda xatolik yuz berdi.",
    };
  }
}

export interface ExportInventoryRow {
  inventoryNumber: string;
  name: string;
  categoryName: string;
  buildingName: string;
  roomNumber: string;
  roomName: string;
  status: string;
  condition: string;
  price: string | null;
  description: string | null;
  createdAt: string;
}

/**
 * 5. Tashkilot inventarlarini xavfsiz eksport qilish (CSV / Excel)
 * Multi-tenant himoyalangan, faqat joriy tashkilot ma'lumotlarini yuklaydi.
 */
export async function exportInventoryDataAction(filters?: {
  categoryId?: string;
  buildingId?: string;
  roomId?: string;
  status?: string;
  search?: string;
}): Promise<{ success: boolean; data?: ExportInventoryRow[]; message?: string }> {
  try {
    const { profile, organization } = await requireAuthenticatedUser();
    if (!organization) return { success: false, message: "Tashkilot aniqlanmadi." };
    if (!canCreateNewItem(profile.role)) {
      return { success: false, message: "Inventarlarni eksport qilish huquqiga ega emassiz." };
    }

    const res = await getInventoryList({
      organizationId: organization.id,
      categoryId: filters?.categoryId,
      buildingId: filters?.buildingId,
      roomId: filters?.roomId,
      status: filters?.status,
      search: filters?.search,
      page: 1,
      pageSize: 10000,
    });

    if (res.totalCount > 10000) {
      return {
        success: false,
        message: `Eksport qilinayotgan inventarlar soni (${res.totalCount} ta) maksimal ruxsat etilgan 10 000 tadan ortiq. Iltimos, bino, toifa yoki holat filtrlari orqali saralangan holda eksport qiling.`,
      };
    }

    const exportRows: ExportInventoryRow[] = res.items.map((i) => ({
      inventoryNumber: i.inventoryNumber,
      name: i.name,
      categoryName: i.categoryName,
      buildingName: i.buildingName,
      roomNumber: i.roomNumber,
      roomName: i.roomName,
      status: i.status,
      condition: i.condition,
      price: i.price,
      description: i.description,
      createdAt: new Date(i.createdAt).toISOString().split("T")[0] || "",
    }));

    return {
      success: true,
      data: exportRows,
    };
  } catch (err) {
    return {
      success: false,
      message: err instanceof Error ? err.message : "Eksport ma'lumotlarini yuklashda xatolik yuz berdi.",
    };
  }
}

/**
 * 6. Tashkilot inventarlarini to'liq Excel (.xlsx) formatida eksport qilish
 * Serverda ExcelJS orqali hosil qilinadi va xavfsiz Base64 oqimida qaytariladi.
 */
export async function exportInventoryExcelAction(filters?: {
  categoryId?: string;
  buildingId?: string;
  roomId?: string;
  status?: string;
  search?: string;
}): Promise<{ success: boolean; base64?: string; filename?: string; message?: string }> {
  try {
    const { profile, organization } = await requireAuthenticatedUser();
    if (!organization) return { success: false, message: "Tashkilot aniqlanmadi." };
    if (!canCreateNewItem(profile.role)) {
      return { success: false, message: "Inventarlarni eksport qilish huquqiga ega emassiz." };
    }

    const res = await getInventoryList({
      organizationId: organization.id,
      categoryId: filters?.categoryId,
      buildingId: filters?.buildingId,
      roomId: filters?.roomId,
      status: filters?.status,
      search: filters?.search,
      page: 1,
      pageSize: 10000,
    });

    if (res.totalCount > 10000) {
      return {
        success: false,
        message: `Eksport qilinayotgan inventarlar soni (${res.totalCount} ta) maksimal ruxsat etilgan 10 000 tadan ortiq. Iltimos, bino, toifa yoki holat filtrlari orqali saralangan holda eksport qiling.`,
      };
    }

    const workbook = new ExcelJS.Workbook();
    workbook.creator = "AssetAudit Platform";
    workbook.created = new Date();

    const sheet = workbook.addWorksheet("Inventarlar");
    sheet.columns = [
      { header: "Inventar Raqami", key: "inv", width: 22 },
      { header: "Nomi", key: "name", width: 32 },
      { header: "Toifasi", key: "cat", width: 20 },
      { header: "Bino", key: "bld", width: 25 },
      { header: "Xona", key: "room", width: 20 },
      { header: "Holati", key: "status", width: 16 },
      { header: "Sifati", key: "cond", width: 16 },
      { header: "Narxi (so'm)", key: "price", width: 18 },
      { header: "Tavsif", key: "desc", width: 30 },
      { header: "Kiritilgan sana", key: "date", width: 16 },
    ];

    const headerRow = sheet.getRow(1);
    headerRow.font = { bold: true, color: { argb: "FF0F172A" } };
    headerRow.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FFF1F5F9" },
    };

    const STATUS_MAP: Record<string, string> = {
      active: "Faol",
      repair: "Ta'mirda",
      written_off: "Hisobdan chiqarilgan",
      transferred: "Ko'chirilgan",
      lost: "Yo'qolgan",
    };

    const COND_MAP: Record<string, string> = {
      new: "Yangi",
      good: "Yaxshi",
      fair: "Qoniqarli",
      poor: "Eskirgan",
      broken: "Nosoz",
    };

    for (const item of res.items) {
      sheet.addRow({
        inv: item.inventoryNumber,
        name: item.name,
        cat: item.categoryName,
        bld: item.buildingName,
        room: `${item.roomNumber} (${item.roomName})`,
        status: STATUS_MAP[item.status] || item.status,
        cond: COND_MAP[item.condition] || item.condition,
        price: item.price ? Number(item.price) : null,
        desc: item.description || "",
        date: new Date(item.createdAt).toISOString().split("T")[0],
      });
    }

    const buffer = await workbook.xlsx.writeBuffer();
    const base64 = Buffer.from(buffer).toString("base64");
    const dateStr = new Date().toISOString().split("T")[0];
    const filename = `inventarlar_${organization.code.toLowerCase()}_${dateStr}.xlsx`;

    return {
      success: true,
      base64,
      filename,
    };
  } catch (err) {
    return {
      success: false,
      message: err instanceof Error ? err.message : "Excel faylni shakllantirishda server xatosi yuz berdi.",
    };
  }
}


