"use server";

import { revalidatePath } from "next/cache";
import { requireOrganizationAdmin } from "@/lib/auth/authorization";
import { db } from "@/lib/db";
import { buildings, floors, rooms, type RoomType, ROOM_TYPES } from "@/lib/db/schema/locations";
import { items } from "@/lib/db/schema/inventory";
import { and, eq, sql } from "drizzle-orm";

export interface ActionResponse {
  success: boolean;
  message: string;
  fieldErrors?: Record<string, string>;
  data?: unknown;
}

function generateBuildingCode(name: string): string {
  const uzbekMap: Record<string, string> = {
    "o‘": "o", "oʻ": "o", "g‘": "g", "gʻ": "g",
    "O‘": "O", "Oʻ": "O", "G‘": "G", "Gʻ": "G",
    "ў": "o", "Ў": "O", "ғ": "g", "Ғ": "G",
    "ш": "sh", "Ш": "SH", "ч": "ch", "Ч": "CH",
    "ҳ": "h", "Ҳ": "H", "қ": "q", "Қ": "Q",
    "ь": "", "ъ": "",
    "а": "a", "б": "b", "в": "v", "г": "g", "д": "d", "е": "e", "ё": "yo",
    "ж": "j", "з": "z", "и": "i", "й": "y", "к": "k", "л": "l", "м": "m",
    "н": "n", "о": "o", "п": "p", "р": "r", "с": "s", "т": "t", "у": "u",
    "ф": "f", "х": "x", "ц": "ts", "э": "e", "ю": "yu", "я": "ya",
  };

  let normalized = name.trim();
  for (const [k, v] of Object.entries(uzbekMap)) {
    normalized = normalized.replaceAll(k, v);
  }

  const cleaned = normalized
    .toUpperCase()
    .replace(/[^A-Z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 20);

  return cleaned || "BINO";
}

/**
 * 1. Yangi Bino qo'shish (Server Action)
 * Faqat Tashkilot Administratori vakolatiga ega
 */
export async function createBuildingAction(
  _prevState: ActionResponse | null,
  formData: FormData
): Promise<ActionResponse> {
  try {
    const { organization } = await requireOrganizationAdmin();

    const name = (formData.get("name") as string)?.trim() || "";
    let code = (formData.get("code") as string)?.trim().toUpperCase() || "";
    const address = (formData.get("address") as string)?.trim() || "";
    const floorsCount = Math.max(1, parseInt(formData.get("floorsCount") as string, 10) || 1);

    const fieldErrors: Record<string, string> = {};

    if (!name || name.length < 2) {
      fieldErrors.name = "Bino nomi kamida 2 ta belgidan iborat bo'lishi shart.";
    }

    if (floorsCount < 1 || floorsCount > 50) {
      fieldErrors.floorsCount = "Qavatlar soni 1 dan 50 gacha bo'lishi kerak.";
    }

    if (Object.keys(fieldErrors).length > 0) {
      return { success: false, message: "Kiritilgan ma'lumotlarda xatolik bor.", fieldErrors };
    }

    if (!code) {
      const baseCode = generateBuildingCode(name);
      let candidate = baseCode;
      let counter = 1;

      while (true) {
        const [existing] = await db
          .select({ id: buildings.id })
          .from(buildings)
          .where(and(eq(buildings.organizationId, organization.id), eq(buildings.code, candidate)))
          .limit(1);

        if (!existing) {
          code = candidate;
          break;
        }
        counter++;
        candidate = `${baseCode.slice(0, 15)}-${counter}`;
      }
    } else {
      // Bino kodi ushbu tashkilotda takrorlanmasligini tekshirish
      const [existing] = await db
        .select({ id: buildings.id })
        .from(buildings)
        .where(and(eq(buildings.organizationId, organization.id), eq(buildings.code, code)))
        .limit(1);

      if (existing) {
        return {
          success: false,
          message: `Ushbu tashkilotda "${code}" kodli bino allaqachon mavjud.`,
          fieldErrors: { code: "Ushbu bino kodi band." },
        };
      }
    }

    // Tranzaksiya: Bino yaratish va dastlabki qavatlarni avtomatik yaratish
    const [newBuilding] = await db
      .insert(buildings)
      .values({
        organizationId: organization.id,
        name,
        code,
        address: address || null,
        floorsCount,
        isActive: true,
      })
      .returning();

    // 1 dan floorsCount gacha bo'lgan qavatlarni avtomatik kiritish
    const floorRows = [];
    for (let f = 1; f <= floorsCount; f++) {
      floorRows.push({
        organizationId: organization.id,
        buildingId: newBuilding.id,
        floorNumber: f,
        name: `${f}-qavat`,
      });
    }

    if (floorRows.length > 0) {
      await db.insert(floors).values(floorRows);
    }

    revalidatePath("/org/buildings");
    revalidatePath("/org/floors");
    revalidatePath("/org/rooms");
    revalidatePath("/org");

    return {
      success: true,
      message: `"${name}" binosi va ${floorsCount} ta qavat muvaffaqiyatli yaratildi.`,
    };
  } catch (err) {
    return {
      success: false,
      message: err instanceof Error ? err.message : "Binoni yaratishda kutilmagan server xatoligi yuz berdi.",
    };
  }
}

/**
 * 2. Qavat qo'shish (Server Action)
 */
export async function createFloorAction(
  _prevState: ActionResponse | null,
  formData: FormData
): Promise<ActionResponse> {
  try {
    const { organization } = await requireOrganizationAdmin();

    const buildingId = (formData.get("buildingId") as string)?.trim();
    const floorNumber = parseInt(formData.get("floorNumber") as string, 10);
    const name = (formData.get("name") as string)?.trim() || "";

    const fieldErrors: Record<string, string> = {};

    if (!buildingId) {
      fieldErrors.buildingId = "Bino tanlanishi shart.";
    }

    if (isNaN(floorNumber)) {
      fieldErrors.floorNumber = "Qavat raqami kiritilishi shart (masalan: 1, 2, -1, 0).";
    } else if (floorNumber < -10 || floorNumber > 200) {
      fieldErrors.floorNumber = "Qavat raqami -10 dan 200 gacha bo'lishi kerak (-10..-1 yerto'la, 0 zamin, 1..200 yuqori qavatlar).";
    }

    if (!name) {
      fieldErrors.name = "Qavat nomi kiritilishi shart (masalan: 1-qavat, Yerto'la).";
    }

    if (Object.keys(fieldErrors).length > 0) {
      return { success: false, message: "Kiritilgan ma'lumotlarda xatolik bor.", fieldErrors };
    }

    // Bino ushbu tashkilotga tegishli ekanini tekshirish (Tenant Isolation)
    const [building] = await db
      .select({ id: buildings.id })
      .from(buildings)
      .where(and(eq(buildings.id, buildingId), eq(buildings.organizationId, organization.id)))
      .limit(1);

    if (!building) {
      return { success: false, message: "Tanlangan bino topilmadi yoki unga ruxsat yo'q." };
    }

    // Ushbu binoda qavat raqami takrorlanmasligini tekshirish
    const [existingFloor] = await db
      .select({ id: floors.id })
      .from(floors)
      .where(and(eq(floors.buildingId, buildingId), eq(floors.floorNumber, floorNumber)))
      .limit(1);

    if (existingFloor) {
      return {
        success: false,
        message: `Ushbu binoda ${floorNumber}-qavat allaqachon mavjud.`,
        fieldErrors: { floorNumber: "Bu qavat raqami allaqachon mavjud." },
      };
    }

    await db.insert(floors).values({
      organizationId: organization.id,
      buildingId,
      floorNumber,
      name,
    });

    revalidatePath("/org/floors");
    revalidatePath("/org/buildings");

    return {
      success: true,
      message: `"${name}" muvaffaqiyatli qo'shildi.`,
    };
  } catch (err) {
    return {
      success: false,
      message: err instanceof Error ? err.message : "Qavatni saqlashda xatolik yuz berdi.",
    };
  }
}

/**
 * 3. Yangi Xona qo'shish (Server Action)
 */
export async function createRoomAction(
  _prevState: ActionResponse | null,
  formData: FormData
): Promise<ActionResponse> {
  try {
    const { organization } = await requireOrganizationAdmin();

    const buildingId = (formData.get("buildingId") as string)?.trim();
    const floorId = (formData.get("floorId") as string)?.trim();
    const roomNumber = (formData.get("roomNumber") as string)?.trim() || "";
    const name = (formData.get("name") as string)?.trim() || "";
    const rawType = (formData.get("type") as string)?.trim();
    const type: RoomType = rawType && (ROOM_TYPES as readonly string[]).includes(rawType as RoomType)
      ? (rawType as RoomType)
      : "classroom";
    const capacityRaw = formData.get("capacity") as string;
    const capacity = capacityRaw ? parseInt(capacityRaw, 10) : null;

    const fieldErrors: Record<string, string> = {};

    if (!buildingId) fieldErrors.buildingId = "Bino tanlanishi shart.";
    if (!floorId) fieldErrors.floorId = "Qavat tanlanishi shart.";
    if (!roomNumber) fieldErrors.roomNumber = "Xona raqami kiritilishi shart (masalan: 101, 204-A).";
    if (!name) fieldErrors.name = "Xona nomi kiritilishi shart.";

    if (Object.keys(fieldErrors).length > 0) {
      return { success: false, message: "Kiritilgan ma'lumotlarda xatolik bor.", fieldErrors };
    }

    // Bino va Qavat ushbu tashkilotga tegishli ekanini tekshirish
    const [floor] = await db
      .select({ id: floors.id, buildingId: floors.buildingId })
      .from(floors)
      .where(and(eq(floors.id, floorId), eq(floors.organizationId, organization.id)))
      .limit(1);

    if (!floor || floor.buildingId !== buildingId) {
      return { success: false, message: "Tanlangan qavat yoki bino topilmadi." };
    }

    // Qavatda xona raqami takrorlanmasligini tekshirish
    const [existingRoom] = await db
      .select({ id: rooms.id })
      .from(rooms)
      .where(and(eq(rooms.floorId, floorId), eq(rooms.roomNumber, roomNumber)))
      .limit(1);

    if (existingRoom) {
      return {
        success: false,
        message: `Ushbu qavatda "${roomNumber}" raqamli xona allaqachon mavjud.`,
        fieldErrors: { roomNumber: "Bu xona raqami ushbu qavatda mavjud." },
      };
    }

    await db.insert(rooms).values({
      organizationId: organization.id,
      buildingId,
      floorId,
      roomNumber,
      name,
      type,
      capacity: capacity && capacity > 0 ? capacity : null,
      isActive: true,
    });

    revalidatePath("/org/rooms");
    revalidatePath("/org/floors");
    revalidatePath("/org/buildings");
    revalidatePath("/org");

    return {
      success: true,
      message: `"${roomNumber} — ${name}" xonasi muvaffaqiyatli qo'shildi.`,
    };
  } catch (err) {
    return {
      success: false,
      message: err instanceof Error ? err.message : "Xonani saqlashda server xatosi yuz berdi.",
    };
  }
}

/**
 * 4. Bino ma'lumotlarini tahrirlash (Server Action)
 * Faqat Tashkilot Administratori vakolatiga ega
 */
export async function updateBuildingAction(
  _prevState: ActionResponse | null,
  formData: FormData
): Promise<ActionResponse> {
  try {
    const { organization } = await requireOrganizationAdmin();

    const buildingId = (formData.get("buildingId") as string)?.trim();
    const name = (formData.get("name") as string)?.trim() || "";
    const address = (formData.get("address") as string)?.trim() || "";
    const isActiveVal = formData.get("isActive");
    const isActive = isActiveVal !== null ? isActiveVal === "true" || isActiveVal === "on" : undefined;

    if (!buildingId) {
      return { success: false, message: "Bino identifikatori ko'rsatilmadi." };
    }

    if (!name || name.length < 2) {
      return {
        success: false,
        message: "Bino nomi kamida 2 ta belgidan iborat bo'lishi shart.",
        fieldErrors: { name: "Bino nomi kamida 2 ta belgidan iborat bo'lishi shart." },
      };
    }

    const [existing] = await db
      .select({ id: buildings.id })
      .from(buildings)
      .where(and(eq(buildings.id, buildingId), eq(buildings.organizationId, organization.id)))
      .limit(1);

    if (!existing) {
      return { success: false, message: "Bino topilmadi yoki boshqa tashkilotga tegishli." };
    }

    await db
      .update(buildings)
      .set({
        name,
        address: address || null,
        ...(isActive !== undefined ? { isActive } : {}),
        updatedAt: new Date(),
      })
      .where(and(eq(buildings.id, buildingId), eq(buildings.organizationId, organization.id)));

    revalidatePath("/org/buildings");
    revalidatePath("/org/floors");
    revalidatePath("/org/rooms");
    revalidatePath("/org");

    return { success: true, message: `"${name}" binosi muvaffaqiyatli yangilandi.` };
  } catch (err) {
    return {
      success: false,
      message: err instanceof Error ? err.message : "Binoni yangilashda xatolik yuz berdi.",
    };
  }
}

/**
 * 5. Bino arxivlash / faolsizlantirish (Soft Delete)
 * Hard DELETE qat'iyan taqiqlanadi (audit yaxlitligi uchun)
 */
export async function archiveBuildingAction(buildingId: string): Promise<ActionResponse> {
  try {
    const { organization } = await requireOrganizationAdmin();

    if (!buildingId) {
      return { success: false, message: "Bino ID ko'rsatilmadi." };
    }

    const [existing] = await db
      .select({ id: buildings.id, name: buildings.name })
      .from(buildings)
      .where(and(eq(buildings.id, buildingId), eq(buildings.organizationId, organization.id)))
      .limit(1);

    if (!existing) {
      return { success: false, message: "Bino topilmadi." };
    }

    const [activeItemsRes] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(items)
      .where(
        and(
          eq(items.buildingId, buildingId),
          eq(items.organizationId, organization.id),
          sql`${items.status} != 'written_off'`
        )
      );

    if (activeItemsRes && activeItemsRes.count > 0) {
      return {
        success: false,
        message: `Ushbu binoda ${activeItemsRes.count} ta faol inventar biriktirilgan. Binoni arxivlashdan oldin ularni boshqa binoga ko'chiring.`,
      };
    }

    await db
      .update(buildings)
      .set({ isActive: false, updatedAt: new Date() })
      .where(and(eq(buildings.id, buildingId), eq(buildings.organizationId, organization.id)));

    revalidatePath("/org/buildings");
    revalidatePath("/org");

    return { success: true, message: `"${existing.name}" binosi muvaffaqiyatli arxivlandi.` };
  } catch (err) {
    return {
      success: false,
      message: err instanceof Error ? err.message : "Binoni arxivlashda xatolik yuz berdi.",
    };
  }
}

/**
 * 6. Qavat ma'lumotlarini tahrirlash (Server Action)
 */
export async function updateFloorAction(
  _prevState: ActionResponse | null,
  formData: FormData
): Promise<ActionResponse> {
  try {
    const { organization } = await requireOrganizationAdmin();

    const floorId = (formData.get("floorId") as string)?.trim();
    const name = (formData.get("name") as string)?.trim() || "";

    if (!floorId) return { success: false, message: "Qavat ID ko'rsatilmadi." };
    if (!name) return { success: false, message: "Qavat nomi kiritilishi shart." };

    const [existing] = await db
      .select({ id: floors.id })
      .from(floors)
      .where(and(eq(floors.id, floorId), eq(floors.organizationId, organization.id)))
      .limit(1);

    if (!existing) return { success: false, message: "Qavat topilmadi." };

    await db
      .update(floors)
      .set({ name })
      .where(and(eq(floors.id, floorId), eq(floors.organizationId, organization.id)));

    revalidatePath("/org/floors");
    revalidatePath("/org/rooms");

    return { success: true, message: `Qavat nomi "${name}" ga yangilandi.` };
  } catch (err) {
    return {
      success: false,
      message: err instanceof Error ? err.message : "Qavatni yangilashda xatolik yuz berdi.",
    };
  }
}

/**
 * 7. Xona ma'lumotlarini tahrirlash (Server Action)
 */
export async function updateRoomAction(
  _prevState: ActionResponse | null,
  formData: FormData
): Promise<ActionResponse> {
  try {
    const { organization } = await requireOrganizationAdmin();

    const roomId = (formData.get("roomId") as string)?.trim();
    const name = (formData.get("name") as string)?.trim() || "";
    const rawType = (formData.get("type") as string)?.trim();
    const type: RoomType | undefined = rawType && (ROOM_TYPES as readonly string[]).includes(rawType as RoomType)
      ? (rawType as RoomType)
      : undefined;
    const capacityRaw = formData.get("capacity") as string;
    const capacity = capacityRaw ? parseInt(capacityRaw, 10) : null;
    const isActiveVal = formData.get("isActive");
    const isActive = isActiveVal !== null ? isActiveVal === "true" || isActiveVal === "on" : undefined;

    if (!roomId) return { success: false, message: "Xona ID ko'rsatilmadi." };
    if (!name) return { success: false, message: "Xona nomi kiritilishi shart." };

    const [existing] = await db
      .select({ id: rooms.id, roomNumber: rooms.roomNumber })
      .from(rooms)
      .where(and(eq(rooms.id, roomId), eq(rooms.organizationId, organization.id)))
      .limit(1);

    if (!existing) return { success: false, message: "Xona topilmadi." };

    await db
      .update(rooms)
      .set({
        name,
        ...(type ? { type } : {}),
        capacity: capacity && capacity > 0 ? capacity : null,
        ...(isActive !== undefined ? { isActive } : {}),
      })
      .where(and(eq(rooms.id, roomId), eq(rooms.organizationId, organization.id)));

    revalidatePath("/org/rooms");
    revalidatePath("/org");

    return { success: true, message: `"${existing.roomNumber} — ${name}" xonasi muvaffaqiyatli yangilandi.` };
  } catch (err) {
    return {
      success: false,
      message: err instanceof Error ? err.message : "Xonani yangilashda xatolik yuz berdi.",
    };
  }
}

/**
 * 8. Xonani arxivlash / faolsizlantirish (Soft Delete)
 */
export async function archiveRoomAction(roomId: string): Promise<ActionResponse> {
  try {
    const { organization } = await requireOrganizationAdmin();

    if (!roomId) return { success: false, message: "Xona ID ko'rsatilmadi." };

    const [existing] = await db
      .select({ id: rooms.id, roomNumber: rooms.roomNumber, name: rooms.name })
      .from(rooms)
      .where(and(eq(rooms.id, roomId), eq(rooms.organizationId, organization.id)))
      .limit(1);

    if (!existing) return { success: false, message: "Xona topilmadi." };

    const [activeItemsRes] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(items)
      .where(
        and(
          eq(items.roomId, roomId),
          eq(items.organizationId, organization.id),
          sql`${items.status} != 'written_off'`
        )
      );

    if (activeItemsRes && activeItemsRes.count > 0) {
      return {
        success: false,
        message: `Ushbu xonada ${activeItemsRes.count} ta faol inventar biriktirilgan. Xonani arxivlashdan oldin ularni boshqa xonaga ko'chiring yoki hisobdan chiqaring.`,
      };
    }

    await db
      .update(rooms)
      .set({ isActive: false })
      .where(and(eq(rooms.id, roomId), eq(rooms.organizationId, organization.id)));

    revalidatePath("/org/rooms");
    revalidatePath("/org");

    return { success: true, message: `"${existing.roomNumber} — ${existing.name}" xonasi arxivlandi.` };
  } catch (err) {
    return {
      success: false,
      message: err instanceof Error ? err.message : "Xonani arxivlashda xatolik yuz berdi.",
    };
  }
}

