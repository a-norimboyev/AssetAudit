"use server";

import * as XLSX from "xlsx";
import { revalidatePath } from "next/cache";
import { requireAuthenticatedUser } from "@/lib/auth/authorization";
import { canCreateNewItem } from "@/lib/auth/authorization-rules";
import { db } from "@/lib/db";
import { items, ITEM_STATUSES, ITEM_CONDITIONS, type ItemStatus, type ItemCondition } from "@/lib/db/schema/inventory";
import { buildings, rooms } from "@/lib/db/schema/locations";
import { generateSecureQrToken } from "@/lib/qr";
import { and, eq } from "drizzle-orm";

export interface ImportError {
  row: number;
  inventoryNumber?: string;
  name?: string;
  reason: string;
}

export interface ImportResult {
  success: boolean;
  message: string;
  totalRows: number;
  importedCount: number;
  skippedCount: number;
  errors: ImportError[];
}

export type ExcelCellValue = string | number | boolean | null | undefined;
export type ExcelRow = Record<string, ExcelCellValue>;

/**
 * Excel (XLSX) va CSV fayldan inventarlarni ommaviy import qilish
 * QOIDALAR:
 * - Faqat organization_admin va registrar huquqiga ega foydalanuvchilar.
 * - Multi-tenant izolyatsiyasi: faqat joriy tashkilot bazasiga yozadi.
 * - Takroriy inventar raqamlari rad etiladi va xato hisobotida ko'rsatiladi.
 * - 1 GB RAM li VPS uchun batch-chunk (50 talab) rejimida xavfsiz ishlaydi.
 */
export async function importInventoryAction(formData: FormData): Promise<ImportResult> {
  try {
    const { profile, organization } = await requireAuthenticatedUser();

    if (!organization) {
      return {
        success: false,
        message: "Tashkilot aniqlanmadi.",
        totalRows: 0,
        importedCount: 0,
        skippedCount: 0,
        errors: [],
      };
    }

    if (!canCreateNewItem(profile.role)) {
      return {
        success: false,
        message: "Inventarlarni import qilish huquqiga ega emassiz.",
        totalRows: 0,
        importedCount: 0,
        skippedCount: 0,
        errors: [],
      };
    }

    const file = formData.get("file") as File | null;
    if (!file || !(file instanceof File) || file.size === 0) {
      return {
        success: false,
        message: "Fayl tanlanmagan yoki hajmi bo'sh.",
        totalRows: 0,
        importedCount: 0,
        skippedCount: 0,
        errors: [],
      };
    }

    const arrayBuffer = await file.arrayBuffer();
    const workbook = XLSX.read(Buffer.from(arrayBuffer), { type: "buffer" });
    const firstSheetName = workbook.SheetNames[0];
    if (!firstSheetName) {
      return {
        success: false,
        message: "Faylda varaqlar (sheets) topilmadi.",
        totalRows: 0,
        importedCount: 0,
        skippedCount: 0,
        errors: [],
      };
    }

    const worksheet = workbook.Sheets[firstSheetName];
    const rawData: ExcelRow[] = XLSX.utils.sheet_to_json<ExcelRow>(worksheet, { defval: "" });

    if (rawData.length === 0) {
      return {
        success: false,
        message: "Jadvalda ma'lumotlar qatori topilmadi.",
        totalRows: 0,
        importedCount: 0,
        skippedCount: 0,
        errors: [],
      };
    }

    // Tashkilotning mavjud binolari va xonalarini keshga olish (tezkor tekshiruv uchun)
    const [existingBuildings, existingRooms, existingItems] = await Promise.all([
      db
        .select({ id: buildings.id, code: buildings.code, name: buildings.name })
        .from(buildings)
        .where(and(eq(buildings.organizationId, organization.id), eq(buildings.isActive, true))),
      db
        .select({
          id: rooms.id,
          roomNumber: rooms.roomNumber,
          buildingId: rooms.buildingId,
          floorId: rooms.floorId,
        })
        .from(rooms)
        .where(and(eq(rooms.organizationId, organization.id), eq(rooms.isActive, true))),
      db
        .select({ inventoryNumber: items.inventoryNumber })
        .from(items)
        .where(eq(items.organizationId, organization.id)),
    ]);

    const buildingByCode = new Map(existingBuildings.map((b) => [b.code.toUpperCase(), b]));
    const buildingByName = new Map(existingBuildings.map((b) => [b.name.toLowerCase(), b]));
    const existingInvSet = new Set(existingItems.map((i) => i.inventoryNumber.toUpperCase()));

    // Fayl ichidagi xonalarni tezkor qidirish uchun map: `buildingId:roomNumber` -> room
    const roomKeyMap = new Map<string, typeof existingRooms[0]>();
    for (const r of existingRooms) {
      roomKeyMap.set(`${r.buildingId}:${r.roomNumber.toUpperCase()}`, r);
    }

    const seenInFile = new Set<string>();
    const validRowsToInsert: Array<{
      organizationId: string;
      buildingId: string;
      floorId: string;
      roomId: string;
      inventoryNumber: string;
      name: string;
      categoryId: string;
      status: ItemStatus;
      condition: ItemCondition;
      price: string | null;
      description: string | null;
      qrToken: string;
    }> = [];

    const errors: ImportError[] = [];

    let rowNum = 1; // 1-qator sarlavha hisoblanadi
    for (const row of rawData) {
      rowNum++;

      if (!row || typeof row !== "object") continue;

      // Xavfsizlik: Prototype pollution va ReDoS himoyasi (fail-closed)
      if (
        Object.prototype.hasOwnProperty.call(row, "__proto__") ||
        Object.prototype.hasOwnProperty.call(row, "constructor") ||
        Object.prototype.hasOwnProperty.call(row, "prototype")
      ) {
        errors.push({ row: rowNum, reason: "Xavfsizlik xatosi: Faylda ruxsat etilmagan prototip kalitlari aniqlandi." });
        continue;
      }

      // Ustun nomlarini normalizatsiya qilish (har xil nomlanishlarni avtomatik aniqlash)
      const invNum = (
        row["Inventar raqami"] ||
        row["inventar_raqami"] ||
        row["inventoryNumber"] ||
        row["InvNumber"] ||
        row["ID"] ||
        ""
      )
        .toString()
        .trim()
        .toUpperCase();

      const name = (
        row["Nomi"] ||
        row["nomi"] ||
        row["name"] ||
        row["Inventar nomi"] ||
        row["Item Name"] ||
        ""
      )
        .toString()
        .trim();

      const buildingKey = (
        row["Bino"] ||
        row["bino"] ||
        row["Bino kodi"] ||
        row["Building"] ||
        row["buildingCode"] ||
        ""
      )
        .toString()
        .trim();

      const roomKey = (
        row["Xona"] ||
        row["xona"] ||
        row["Xona raqami"] ||
        row["Room"] ||
        row["roomNumber"] ||
        ""
      )
        .toString()
        .trim()
        .toUpperCase();

      const category = (
        row["Kategoriya"] ||
        row["kategoriya"] ||
        row["category"] ||
        row["Toifa"] ||
        "other"
      )
        .toString()
        .trim()
        .toLowerCase();

      const conditionRaw = (
        row["Holati (Sifat)"] ||
        row["condition"] ||
        row["Sifat"] ||
        "good"
      )
        .toString()
        .trim()
        .toLowerCase();

      const statusRaw = (
        row["Status"] ||
        row["status"] ||
        row["Holati"] ||
        "active"
      )
        .toString()
        .trim()
        .toLowerCase();

      const priceRaw = (row["Narxi"] || row["narx"] || row["price"] || "").toString().trim();
      const description = (row["Tavsif"] || row["description"] || "").toString().trim() || null;

      // 1. Majburiy maydonlar
      if (!invNum) {
        errors.push({ row: rowNum, reason: "Inventar raqami kiritilmagan." });
        continue;
      }

      if (!name || name.length < 2) {
        errors.push({ row: rowNum, inventoryNumber: invNum, reason: "Inventar nomi kamida 2 belgi bo'lishi shart." });
        continue;
      }

      // 2. Takroriylik tekshiruvi (fayl ichida va bazada)
      if (seenInFile.has(invNum)) {
        errors.push({ row: rowNum, inventoryNumber: invNum, name, reason: "Ushbu faylning o'zida takroriy inventar raqami." });
        continue;
      }
      seenInFile.add(invNum);

      if (existingInvSet.has(invNum)) {
        errors.push({ row: rowNum, inventoryNumber: invNum, name, reason: "Ushbu inventar raqami tashkilot bazasida allaqachon mavjud." });
        continue;
      }

      // 3. Bino tekshiruvi (Qat'iy validatsiya)
      if (!buildingKey && existingBuildings.length > 1) {
        errors.push({
          row: rowNum,
          inventoryNumber: invNum,
          name,
          reason: "Bino ko'rsatilmadi. Tashkilotda bir nechta bino mavjud bo'lgani sababli bino ko'rsatilishi shart.",
        });
        continue;
      }

      const matchedBuilding = buildingKey
        ? buildingByCode.get(buildingKey.toUpperCase()) || buildingByName.get(buildingKey.toLowerCase())
        : existingBuildings[0];

      if (!matchedBuilding) {
        errors.push({
          row: rowNum,
          inventoryNumber: invNum,
          name,
          reason: `"${buildingKey}" nomli yoki kodli bino topilmadi.`,
        });
        continue;
      }

      // 4. Xona tekshiruvi (Qat'iy validatsiya — tasodifiy xonaga noo'rin biriktirish qat'iyan man etiladi)
      if (!roomKey) {
        errors.push({
          row: rowNum,
          inventoryNumber: invNum,
          name,
          reason: "Xona raqami ko'rsatilmadi.",
        });
        continue;
      }

      const roomLookupKey = `${matchedBuilding.id}:${roomKey}`;
      const matchedRoom = roomKeyMap.get(roomLookupKey);

      if (!matchedRoom) {
        errors.push({
          row: rowNum,
          inventoryNumber: invNum,
          name,
          reason: `"${matchedBuilding.name}" (${matchedBuilding.code}) binosida "${roomKey}" raqamli faol xona topilmadi.`,
        });
        continue;
      }

      // 5. Qiymatlarni normalizatsiya qilish
      const condition: ItemCondition = (ITEM_CONDITIONS as readonly string[]).includes(conditionRaw)
        ? (conditionRaw as ItemCondition)
        : "good";

      const status: ItemStatus = (ITEM_STATUSES as readonly string[]).includes(statusRaw)
        ? (statusRaw as ItemStatus)
        : "active";

      const price = priceRaw && !isNaN(parseFloat(priceRaw)) ? parseFloat(priceRaw).toFixed(2) : null;
      const qrToken = generateSecureQrToken();

      validRowsToInsert.push({
        organizationId: organization.id,
        buildingId: matchedBuilding.id,
        floorId: matchedRoom.floorId,
        roomId: matchedRoom.id,
        inventoryNumber: invNum,
        name,
        categoryId: category || "other",
        status,
        condition,
        price,
        description,
        qrToken,
      });
    }

    // 6. Xavfsiz batch kiritish (50 tadan chunk, RAM optimalligi)
    const CHUNK_SIZE = 50;
    let successfullyImported = 0;

    for (let i = 0; i < validRowsToInsert.length; i += CHUNK_SIZE) {
      const chunk = validRowsToInsert.slice(i, i + CHUNK_SIZE);
      await db.insert(items).values(chunk);
      successfullyImported += chunk.length;
    }

    revalidatePath("/org/inventory");
    revalidatePath("/org/reports");
    revalidatePath("/org");

    return {
      success: successfullyImported > 0,
      message: `${successfullyImported} ta inventar muvaffaqiyatli import qilindi.${errors.length > 0 ? ` (${errors.length} ta xato qator o'tkazib yuborildi)` : ""}`,
      totalRows: rawData.length,
      importedCount: successfullyImported,
      skippedCount: errors.length,
      errors,
    };
  } catch (err) {
    return {
      success: false,
      message: err instanceof Error ? err.message : "Import jarayonida kutilmagan server xatosi yuz berdi.",
      totalRows: 0,
      importedCount: 0,
      skippedCount: 0,
      errors: [],
    };
  }
}
