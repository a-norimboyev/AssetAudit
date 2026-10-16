"use server";

import { revalidatePath } from "next/cache";
import { requirePlatformAdmin } from "@/lib/auth/authorization";
import {
  createOrganization,
  updateOrganization,
  toggleOrganizationStatus,
  OrganizationError,
  type CreateOrganizationInput,
  type UpdateOrganizationInput,
} from "@/lib/data/organizations";
import { validateOrganizationInput } from "@/lib/validations/organization";
import { logSecurityAudit } from "@/lib/audit/logger";

export interface CreateOrganizationActionResult {
  success: boolean;
  organizationId?: string;
  error?: string;
  fieldErrors?: {
    name?: string;
    code?: string;
    typeId?: string;
  };
}

export interface UpdateOrganizationActionResult {
  success: boolean;
  error?: string;
  fieldErrors?: {
    name?: string;
    typeId?: string;
  };
}

/**
 * Server Action: Yangi tashkilot yaratish
 *
 * Xavfsizlik kafolatlari:
 * 1. Server-side avtorizatsiya: requirePlatformAdmin() — faqat platforma Super Admini ruxsat etilgan.
 * 2. Qat'iy input validatsiyasi: nom, kod formati, tashkilot turi tekshiruvi.
 * 3. Unique constraint va error xaritalash: takroriy kod uchun aniq o'zbekcha xabar.
 * 4. Audit jurnali: actorUserId, organizationId va vaqt qayd etiladi.
 * 5. Kesh yangilanishi: /admin/organizations va /admin boshqaruv paneli darhol revalidatsiya qilinadi.
 */
export async function createOrganizationAction(
  data: CreateOrganizationInput
): Promise<CreateOrganizationActionResult> {
  let actorUserId = "unknown";

  try {
    // 1. Server-side avtorizatsiya: faqat Super Admin
    const authContext = await requirePlatformAdmin();
    actorUserId = authContext.user.id;

    // 2. Input ma'lumotlarini qat'iy tekshirish va normalizatsiya qilish
    const validation = validateOrganizationInput(data);
    if (!validation.valid) {
      logSecurityAudit({
        event: "ORGANIZATION_CREATE_FAILED",
        actorUserId,
        organizationCode: data.code,
        metadata: { reason: "VALIDATION_FAILED", errors: validation.errors },
      });

      return {
        success: false,
        error: "Kiritilgan ma'lumotlarda xatolik mavjud. Iltimos, maydonlarni tekshiring.",
        fieldErrors: validation.errors,
      };
    }

    logSecurityAudit({
      event: "ORGANIZATION_CREATE_ATTEMPT",
      actorUserId,
      organizationCode: validation.normalized.code,
      metadata: { typeId: validation.normalized.typeId },
    });

    // 3. PostgreSQL bazasiga kiritish (Drizzle ORM)
    const inserted = await createOrganization(validation.normalized);

    // 4. Muvaffaqiyatli audit qaydi
    logSecurityAudit({
      event: "ORGANIZATION_CREATED",
      actorUserId,
      organizationId: inserted.id,
      organizationCode: inserted.code,
      metadata: {
        name: inserted.name,
        typeId: inserted.typeId,
        isActive: inserted.isActive,
      },
    });

    // 5. Next.js keshini darhol yangilash (Statistika va ro'yxat)
    revalidatePath("/admin/organizations");
    revalidatePath("/admin");

    return {
      success: true,
      organizationId: inserted.id,
    };
  } catch (error: unknown) {
    // Domain xatoliklari (Unique violation, ruxsatlar, va h.k.)
    if (error instanceof OrganizationError) {
      logSecurityAudit({
        event: "ORGANIZATION_CREATE_FAILED",
        actorUserId,
        organizationCode: data.code,
        metadata: { code: error.code, message: error.message },
      });

      return {
        success: false,
        error: error.message,
        fieldErrors:
          error.code === "ORGANIZATION_CODE_ALREADY_EXISTS"
            ? { code: error.message }
            : error.code === "INVALID_ORGANIZATION_TYPE"
            ? { typeId: error.message }
            : undefined,
      };
    }

    const err = error as { code?: string; message?: string } | null;

    // RBAC xatoliklari
    if (err?.code === "FORBIDDEN" || err?.code === "AUTHENTICATION_REQUIRED") {
      logSecurityAudit({
        event: "ORGANIZATION_CREATE_FAILED",
        actorUserId,
        metadata: { reason: err.code },
      });

      return {
        success: false,
        error: "Ushbu amalni bajarish uchun Super Admin vakolati talab qilinadi.",
      };
    }

    // Kutilmagan server xatoligi (xavfsiz umumiy xabar)
    console.error("AssetAudit: createOrganizationAction kutilmagan xatolik:", err?.message);

    logSecurityAudit({
      event: "ORGANIZATION_CREATE_FAILED",
      actorUserId,
      metadata: { reason: "INTERNAL_ERROR" },
    });

    return {
      success: false,
      error: "Tashkilotni yaratishda server xatoligi yuz berdi. Iltimos, qayta urinib ko'ring.",
    };
  }
}

/**
 * Server Action: Tashkilot ma'lumotlarini tahrirlash
 */
export async function updateOrganizationAction(
  data: UpdateOrganizationInput
): Promise<UpdateOrganizationActionResult> {
  let actorUserId = "unknown";
  try {
    const authContext = await requirePlatformAdmin();
    actorUserId = authContext.user.id;

    if (!data.id || !data.id.trim()) {
      return { success: false, error: "Tashkilot ID ko'rsatilmagan." };
    }
    if (!data.name || data.name.trim().length < 2) {
      return { success: false, error: "Tashkilot nomi kamida 2 ta belgidan iborat bo'lishi kerak." };
    }
    if (!data.typeId || !data.typeId.trim()) {
      return { success: false, error: "Tashkilot turi tanlanishi shart." };
    }

    const updated = await updateOrganization(data);

    logSecurityAudit({
      event: "ORGANIZATION_UPDATED",
      actorUserId,
      organizationId: updated.id,
      organizationCode: updated.code,
      metadata: { name: updated.name, typeId: updated.typeId },
    });

    revalidatePath("/admin/organizations");
    revalidatePath("/admin");

    return { success: true };
  } catch (error: unknown) {
    if (error instanceof OrganizationError) {
      return { success: false, error: error.message };
    }
    return { success: false, error: "Tashkilotni tahrirlashda xatolik yuz berdi." };
  }
}

/**
 * Server Action: Tashkilot faollik holatini o'zgartirish (Active / Inactive toggle)
 */
export async function toggleOrganizationStatusAction(
  id: string,
  isActive: boolean
): Promise<{ success: boolean; error?: string }> {
  let actorUserId = "unknown";
  try {
    const authContext = await requirePlatformAdmin();
    actorUserId = authContext.user.id;

    const updated = await toggleOrganizationStatus(id, isActive);

    logSecurityAudit({
      event: "ORGANIZATION_STATUS_TOGGLED",
      actorUserId,
      organizationId: updated.id,
      organizationCode: updated.code,
      metadata: { isActive: updated.isActive },
    });

    revalidatePath("/admin/organizations");
    revalidatePath("/admin");

    return { success: true };
  } catch (error: unknown) {
    return { success: false, error: error instanceof Error ? error.message : "Xatolik yuz berdi." };
  }
}
