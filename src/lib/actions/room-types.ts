"use server";

import { revalidatePath } from "next/cache";
import { requireOrganizationAdmin } from "@/lib/auth/authorization";
import { db } from "@/lib/db";
import { organizations } from "@/lib/db/schema/organizations";
import { eq } from "drizzle-orm";
import { DEFAULT_UNIVERSITY_ROOM_TYPES, type RoomTypeOption, getOrganizationRoomTypes } from "@/lib/constants/room-types";

export interface RoomTypeActionResponse {
  success: boolean;
  message: string;
  fieldErrors?: Record<string, string>;
  data?: unknown;
}

const COLOR_PALETTE = [
  "bg-blue-50 text-blue-700 border-blue-200",
  "bg-purple-50 text-purple-700 border-purple-200",
  "bg-emerald-50 text-emerald-700 border-emerald-200",
  "bg-amber-50 text-amber-700 border-amber-200",
  "bg-rose-50 text-rose-700 border-rose-200",
  "bg-indigo-50 text-indigo-700 border-indigo-200",
  "bg-cyan-50 text-cyan-700 border-cyan-200",
  "bg-teal-50 text-teal-700 border-teal-200",
];

function slugify(text: string): string {
  const uzbekMap: Record<string, string> = {
    "o‘": "o", "oʻ": "o", "g‘": "g", "gʻ": "g",
    "O‘": "O", "Oʻ": "O", "G‘": "G", "Gʻ": "G",
    "ў": "o", "Ў": "O", "ғ": "g", "Ғ": "G",
    "ш": "sh", "Ш": "SH", "ч": "ch", "Ч": "CH",
    "ҳ": "h", "Ҳ": "H", "қ": "q", "Қ": "Q",
  };

  let n = text.trim().toLowerCase();
  for (const [k, v] of Object.entries(uzbekMap)) {
    n = n.replaceAll(k, v);
  }

  const cleaned = n
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "_")
    .replace(/-+/g, "_")
    .slice(0, 30);

  return cleaned || `type_${Date.now()}`;
}

/**
 * 1. Yangi xona turini qo'shish
 */
export async function addRoomTypeAction(
  _prevState: RoomTypeActionResponse | null,
  formData: FormData
): Promise<RoomTypeActionResponse> {
  try {
    const { organization } = await requireOrganizationAdmin();
    const label = (formData.get("label") as string)?.trim() || "";

    if (!label || label.length < 2) {
      return {
        success: false,
        message: "Xona turi nomi kamida 2 ta belgidan iborat bo‘lishi kerak.",
        fieldErrors: { label: "Nom kiritilishi shart." },
      };
    }

    const [org] = await db
      .select({ settings: organizations.settings })
      .from(organizations)
      .where(eq(organizations.id, organization.id))
      .limit(1);

    const currentTypes = getOrganizationRoomTypes(org?.settings);

    // Takroriy nomni tekshirish
    if (currentTypes.some((t) => t.label.toLowerCase() === label.toLowerCase())) {
      return {
        success: false,
        message: `"${label}" nomli xona turi allaqachon mavjud.`,
        fieldErrors: { label: "Bu xona turi mavjud." },
      };
    }

    let idCandidate = slugify(label);
    if (currentTypes.some((t) => t.id === idCandidate)) {
      idCandidate = `${idCandidate}_${Date.now().toString().slice(-4)}`;
    }

    const randomColor = COLOR_PALETTE[currentTypes.length % COLOR_PALETTE.length];
    const newType: RoomTypeOption = {
      id: idCandidate,
      label,
      color: randomColor,
      isCustom: true,
    };

    const updatedTypes = [...currentTypes, newType];
    const updatedSettings = {
      ...(org?.settings || {}),
      roomTypes: updatedTypes,
    };

    await db
      .update(organizations)
      .set({ settings: updatedSettings, updatedAt: new Date() })
      .where(eq(organizations.id, organization.id));

    revalidatePath("/org/rooms");
    revalidatePath("/org/settings");

    return {
      success: true,
      message: `"${label}" xona turi muvaffaqiyatli qo‘shildi.`,
    };
  } catch (err) {
    return {
      success: false,
      message: err instanceof Error ? err.message : "Xona turini qo‘shishda xatolik yuz berdi.",
    };
  }
}

/**
 * 2. Xona turini o'chirish (olib tashlash)
 */
export async function removeRoomTypeAction(typeId: string): Promise<RoomTypeActionResponse> {
  try {
    const { organization } = await requireOrganizationAdmin();

    const [org] = await db
      .select({ settings: organizations.settings })
      .from(organizations)
      .where(eq(organizations.id, organization.id))
      .limit(1);

    const currentTypes = getOrganizationRoomTypes(org?.settings);

    if (currentTypes.length <= 1) {
      return {
        success: false,
        message: "Kamida bitta xona turi qolishi kerak.",
      };
    }

    const updatedTypes = currentTypes.filter((t) => t.id !== typeId);
    const updatedSettings = {
      ...(org?.settings || {}),
      roomTypes: updatedTypes,
    };

    await db
      .update(organizations)
      .set({ settings: updatedSettings, updatedAt: new Date() })
      .where(eq(organizations.id, organization.id));

    revalidatePath("/org/rooms");
    revalidatePath("/org/settings");

    return {
      success: true,
      message: "Xona turi muvaffaqiyatli olib tashlandi.",
    };
  } catch (err) {
    return {
      success: false,
      message: err instanceof Error ? err.message : "Xona turini olib tashlashda xatolik yuz berdi.",
    };
  }
}

/**
 * 3. Standart universitet turlarini tiklash
 */
export async function resetRoomTypesAction(): Promise<RoomTypeActionResponse> {
  try {
    const { organization } = await requireOrganizationAdmin();

    const [org] = await db
      .select({ settings: organizations.settings })
      .from(organizations)
      .where(eq(organizations.id, organization.id))
      .limit(1);

    const updatedSettings = {
      ...(org?.settings || {}),
      roomTypes: DEFAULT_UNIVERSITY_ROOM_TYPES,
    };

    await db
      .update(organizations)
      .set({ settings: updatedSettings, updatedAt: new Date() })
      .where(eq(organizations.id, organization.id));

    revalidatePath("/org/rooms");
    revalidatePath("/org/settings");

    return {
      success: true,
      message: "Standart universitet xona turlari muvaffaqiyatli tiklandi.",
    };
  } catch (err) {
    return {
      success: false,
      message: err instanceof Error ? err.message : "Xona turlarini tiklashda xatolik yuz berdi.",
    };
  }
}

/**
 * 4. Xona turini tahrirlash (nomini o'zgartirish)
 */
export async function updateRoomTypeAction(
  typeId: string,
  newLabel: string
): Promise<RoomTypeActionResponse> {
  try {
    const { organization } = await requireOrganizationAdmin();
    const label = newLabel?.trim() || "";

    if (!label || label.length < 2) {
      return {
        success: false,
        message: "Xona turi nomi kamida 2 ta belgidan iborat bo‘lishi kerak.",
      };
    }

    const [org] = await db
      .select({ settings: organizations.settings })
      .from(organizations)
      .where(eq(organizations.id, organization.id))
      .limit(1);

    const currentTypes = getOrganizationRoomTypes(org?.settings);

    // Boshqa turlarda bu nom bormi-yo'qligini tekshirish
    if (
      currentTypes.some(
        (t) => t.id !== typeId && t.label.toLowerCase() === label.toLowerCase()
      )
    ) {
      return {
        success: false,
        message: `"${label}" nomli xona turi allaqachon mavjud.`,
      };
    }

    const updatedTypes = currentTypes.map((t) => {
      if (t.id === typeId) {
        return {
          ...t,
          label,
        };
      }
      return t;
    });

    const updatedSettings = {
      ...(org?.settings || {}),
      roomTypes: updatedTypes,
    };

    await db
      .update(organizations)
      .set({ settings: updatedSettings, updatedAt: new Date() })
      .where(eq(organizations.id, organization.id));

    revalidatePath("/org/rooms");
    revalidatePath("/org/settings");

    return {
      success: true,
      message: `Xona turi muvaffaqiyatli tahrirlandi: "${label}"`,
    };
  } catch (err) {
    return {
      success: false,
      message: err instanceof Error ? err.message : "Xona turini tahrirlashda xatolik yuz berdi.",
    };
  }
}
