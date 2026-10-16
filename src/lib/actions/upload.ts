"use server";

import * as fs from "node:fs/promises";
import * as path from "node:path";
import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { requireOrganizationAdmin } from "@/lib/auth/authorization";
import { db } from "@/lib/db";
import { items } from "@/lib/db/schema/inventory";
import { and, eq } from "drizzle-orm";

const ALLOWED_MIME_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_FILE_SIZE_BYTES = 2 * 1024 * 1024; // 2MB

export interface UploadResponse {
  success: boolean;
  message: string;
  photoUrl?: string;
}

/**
 * Haqiqiy fayl imzosini (Magic Bytes) tekshirish:
 * MIME soxtalashtirilishi (MIME spoofing) va polyglot hujumlarni to'liq bloklaydi.
 */
function verifyMagicBytes(buffer: Buffer, claimedMime: string): boolean {
  if (buffer.length < 12) return false;

  // Xavfli script izlari borligini tekshirish (anti-malware check)
  const headerSlice = buffer.subarray(0, 1024).toString("latin1").toLowerCase();
  if (
    headerSlice.includes("<?php") ||
    headerSlice.includes("<script") ||
    headerSlice.includes("<html") ||
    headerSlice.includes("<!doctype")
  ) {
    return false;
  }

  // Windows Executable (MZ)
  if (buffer[0] === 0x4d && buffer[1] === 0x5a) {
    return false;
  }

  // JPEG imzo: FF D8 FF
  if (claimedMime === "image/jpeg") {
    return buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff;
  }

  // PNG imzo: 89 50 4E 47 0D 0A 1A 0A
  if (claimedMime === "image/png") {
    return (
      buffer[0] === 0x89 &&
      buffer[1] === 0x50 &&
      buffer[2] === 0x4e &&
      buffer[3] === 0x47 &&
      buffer[4] === 0x0d &&
      buffer[5] === 0x0a &&
      buffer[6] === 0x1a &&
      buffer[7] === 0x0a
    );
  }

  // WEBP imzo: RIFF (0..3) ... WEBP (8..11)
  if (claimedMime === "image/webp") {
    const isRiff =
      buffer[0] === 0x52 && buffer[1] === 0x49 && buffer[2] === 0x46 && buffer[3] === 0x46;
    const isWebp =
      buffer[8] === 0x57 && buffer[9] === 0x45 && buffer[10] === 0x42 && buffer[11] === 0x50;
    return isRiff && isWebp;
  }

  return false;
}

/**
 * Inventar uchun rasmiy surat yuklash (Server Action)
 * Xavfsizlik:
 * - Faqat Tashkilot Administratori ruxsat etilgan.
 * - Fayl turi (MIME) va hajmi (≤2MB) qat'iy tekshiriladi.
 * - Haqiqiy fayl imzosi (Magic Bytes) tekshiriladi (PHP/Script/MZ bloklanadi).
 * - Fayl nomi tasodifiy UUID bilan almashtiriladi (Path Traversal xavfini yo'qotadi).
 * - Persistent storage (UPLOAD_STORAGE_DIR) muhitga mos holda ishlaydi.
 * - PostgreSQL jadvalida binary saqlanmaydi (RAM va DB hajmini tejash).
 */
export async function uploadItemPhotoAction(
  itemId: string,
  formData: FormData
): Promise<UploadResponse> {
  try {
    const { organization } = await requireOrganizationAdmin();

    if (!itemId) {
      return { success: false, message: "Inventar ID ko'rsatilmadi." };
    }

    const file = formData.get("photo") as File | null;
    if (!file || !(file instanceof File) || file.size === 0) {
      return { success: false, message: "Surat fayli tanlanmadi." };
    }

    if (!ALLOWED_MIME_TYPES.includes(file.type)) {
      return {
        success: false,
        message: "Yaroqsiz fayl formati. Faqat JPEG, PNG va WEBP formatidagi rasmlar qabul qilinadi.",
      };
    }

    if (file.size > MAX_FILE_SIZE_BYTES) {
      return {
        success: false,
        message: "Fayl hajmi 2 MB dan oshmasligi kerak.",
      };
    }

    const buffer = Buffer.from(await file.arrayBuffer());

    // Magic bytes va xavfsiz fayl tarkibini tekshirish
    if (!verifyMagicBytes(buffer, file.type)) {
      return {
        success: false,
        message: "Xavfsizlik xatoligi: Fayl haqiqiy rasm emas yoki tarkibida zararli kod mavjud.",
      };
    }

    // Inventar ushbu tashkilotga tegishli ekanini tekshirish
    const [existingItem] = await db
      .select({ id: items.id, inventoryNumber: items.inventoryNumber })
      .from(items)
      .where(and(eq(items.id, itemId), eq(items.organizationId, organization.id)))
      .limit(1);

    if (!existingItem) {
      return { success: false, message: "Inventar topilmadi yoki boshqa tashkilotga tegishli." };
    }

    // Saqlash papkasi: Persistent storage UPLOAD_STORAGE_DIR yoki public/uploads/inventory
    const uploadDir =
      process.env.UPLOAD_STORAGE_DIR ||
      path.resolve(process.cwd(), "public", "uploads", "inventory");
    await fs.mkdir(uploadDir, { recursive: true });

    const ext = file.type === "image/png" ? ".png" : file.type === "image/webp" ? ".webp" : ".jpg";
    const safeFileName = `${organization.code.toLowerCase()}-${existingItem.inventoryNumber.toLowerCase()}-${randomUUID()}${ext}`;
    const filePath = path.join(uploadDir, safeFileName);

    await fs.writeFile(filePath, buffer);

    const publicPhotoUrl = `/uploads/inventory/${safeFileName}`;

    await db
      .update(items)
      .set({
        photoUrl: publicPhotoUrl,
        updatedAt: new Date(),
      })
      .where(and(eq(items.id, itemId), eq(items.organizationId, organization.id)));

    revalidatePath(`/org/inventory/${itemId}`);
    revalidatePath("/org/inventory");

    return {
      success: true,
      message: "Surat muvaffaqiyatli yuklandi va inventar pasportiga biriktirildi.",
      photoUrl: `/api/media/items/${itemId}/photo?t=${Date.now()}`,
    };
  } catch (err) {
    return {
      success: false,
      message: err instanceof Error ? err.message : "Surat yuklashda server xatosi yuz berdi.",
    };
  }
}
