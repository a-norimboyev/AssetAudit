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
import { validateOrganizationInput, generateCodeFromName } from "@/lib/validations/organization";
import { logSecurityAudit } from "@/lib/audit/logger";
import { notifyTelegramNewTenant } from "@/lib/notifications/telegram";

import { db } from "@/lib/db";
import { user, account } from "@/lib/db/schema/auth";
import { profiles } from "@/lib/db/schema/profiles";
import { hashPassword } from "better-auth/crypto";
import { generateId } from "better-auth";
import { sql, or } from "drizzle-orm";
import {
  generateInternalSystemEmail,
  generateSecureTemporaryPassword,
} from "@/lib/validations/staff";

export interface CreateOrganizationActionInput extends CreateOrganizationInput {
  adminFullName?: string;
  adminUsername?: string;
  adminPassword?: string;
  adminPhone?: string;
}

export interface CreateOrganizationActionResult {
  success: boolean;
  organizationId?: string;
  error?: string;
  fieldErrors?: {
    name?: string;
    code?: string;
    typeId?: string;
    adminFullName?: string;
    adminUsername?: string;
    adminPassword?: string;
  };
  credentials?: {
    username: string;
    email?: string;
    temporaryPassword?: string;
    fullName: string;
    role: string;
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
 * Server Action: Yangi tashkilot yaratish (va ixtiyoriy/boshlang'ich tashkilot administratorini biriktirish)
 *
 * Xavfsizlik kafolatlari:
 * 1. Server-side avtorizatsiya: requirePlatformAdmin() — faqat platforma Super Admini ruxsat etilgan.
 * 2. Qat'iy input validatsiyasi: nom, kod formati, tashkilot turi tekshiruvi.
 * 3. Atomik tranzaksiya: Tashkilot va Administrator yagona DB tranzaksiyasida yaratiladi.
 * 4. Unique constraint va error xaritalash: takroriy kod yoki takroriy login uchun aniq o'zbekcha xabar.
 * 5. Audit jurnali: actorUserId, organizationId va vaqt qayd etiladi.
 * 6. Kesh yangilanishi: /admin/organizations, /admin/administrators va /admin boshqaruv paneli darhol revalidatsiya qilinadi.
 */
export async function createOrganizationAction(
  data: CreateOrganizationActionInput
): Promise<CreateOrganizationActionResult> {
  let actorUserId = "unknown";

  try {
    // 1. Server-side avtorizatsiya: faqat Super Admin
    const authContext = await requirePlatformAdmin();
    actorUserId = authContext.user.id;

    // 2. Input ma'lumotlarini qat'iy tekshirish va normalizatsiya qilish
    const effectiveCode = (data.code && data.code.trim()) ? data.code.trim() : generateCodeFromName(data.name);
    const validation = validateOrganizationInput({ ...data, code: effectiveCode });
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

    // 3. Administrator ma'lumotlarini tekshirish (agar taqdim etilgan bo'lsa)
    const hasAdminInfo = Boolean(
      (data.adminFullName && data.adminFullName.trim()) ||
      (data.adminUsername && data.adminUsername.trim())
    );

    let finalAdminFullName = "";
    let finalUsername = "";
    let finalEmail = "";
    let finalPassword = "";

    if (hasAdminInfo) {
      const adminFieldErrors: Record<string, string> = {};

      const rawFullName = data.adminFullName?.trim() || "";
      if (rawFullName && rawFullName.length >= 2) {
        finalAdminFullName = rawFullName;
      } else {
        finalAdminFullName = `${validation.normalized.name} Administratori`;
      }

      const rawUsername = data.adminUsername?.trim() || "";
      if (!rawUsername) {
        // Avtomatik generatsiya: agar bo'sh qoldirilsa, tashkilot kodi asosida [code].admin
        finalUsername = `${validation.normalized.code.toLowerCase()}.admin`;
        finalEmail = generateInternalSystemEmail(finalUsername);
      } else {
        const cleanInput = rawUsername.toLowerCase().trim();
        finalUsername = cleanInput;
        finalEmail = cleanInput;
      }

      const rawPassword = data.adminPassword?.trim() || "";
      if (rawPassword) {
        if (rawPassword.length < 6) {
          adminFieldErrors.adminPassword = "Parol uzunligi kamida 6 ta belgidan iborat bo'lishi kerak.";
        } else {
          finalPassword = rawPassword;
        }
      } else {
        finalPassword = generateSecureTemporaryPassword();
      }

      if (Object.keys(adminFieldErrors).length > 0) {
        return {
          success: false,
          error: "Administrator ma'lumotlarida xatolik mavjud. Iltimos, maydonlarni tekshiring.",
          fieldErrors: {
            ...validation.errors,
            ...adminFieldErrors,
          },
        };
      }

      // Manzil takrorlanmasligini tekshirish
      const [existingUser] = await db
        .select({ id: user.id })
        .from(user)
        .where(
          or(
            sql`lower(${user.username}) = ${finalUsername.toLowerCase()}`,
            sql`lower(${user.email}) = ${finalEmail.toLowerCase()}`,
            sql`lower(${user.username}) = ${finalEmail.toLowerCase()}`,
            sql`lower(${user.email}) = ${finalUsername.toLowerCase()}`
          )
        )
        .limit(1);

      if (existingUser) {
        return {
          success: false,
          error: `Ushbu "${rawUsername}" manzili bilan foydalanuvchi allaqachon mavjud.`,
          fieldErrors: { adminUsername: "Ushbu manzil band. Boshqa manzil tanlang." },
        };
      }
    }

    logSecurityAudit({
      event: "ORGANIZATION_CREATE_ATTEMPT",
      actorUserId,
      organizationCode: validation.normalized.code,
      metadata: { typeId: validation.normalized.typeId, hasAdmin: hasAdminInfo },
    });

    // 4. Atomik PostgreSQL tranzaksiyasida yaratish
    const inserted = await db.transaction(async (tx) => {
      // 4.1. Tashkilotni yaratish
      const org = await createOrganization(
        {
          ...validation.normalized,
          subscriptionPlan: data.subscriptionPlan,
          subscriptionExpiresAt: data.subscriptionExpiresAt,
          subscriptionNotes: data.subscriptionNotes,
          logoUrl: data.logoUrl,
          adminPhone: data.adminPhone?.trim() || undefined,
        },
        tx
      );

      // 4.2. Administrator hisobini yaratish (agar ma'lumotlar berilgan bo'lsa)
      if (hasAdminInfo) {
        const passwordHash = await hashPassword(finalPassword);
        const userId = generateId();
        const accountId = generateId();
        const now = new Date();

        await tx.insert(user).values({
          id: userId,
          name: finalAdminFullName,
          email: finalEmail,
          emailVerified: true,
          image: null,
          username: finalUsername,
          displayUsername: finalUsername,
          createdAt: now,
          updatedAt: now,
        });

        await tx.insert(account).values({
          id: accountId,
          userId,
          accountId: userId,
          providerId: "credential",
          password: passwordHash,
          createdAt: now,
          updatedAt: now,
        });

        await tx.insert(profiles).values({
          userId,
          organizationId: org.id,
          role: "organization_admin",
          fullName: finalAdminFullName,
          isActive: true,
          mustChangePassword: true,
          createdAt: now,
          updatedAt: now,
        });
      }

      return org;
    });

    // 5. Muvaffaqiyatli audit qaydlari
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

    if (hasAdminInfo) {
      logSecurityAudit({
        event: "ORGANIZATION_ADMIN_CREATED",
        actorUserId,
        organizationId: inserted.id,
        metadata: {
          username: finalUsername,
          role: "organization_admin",
        },
      });
    }

    // 6. Next.js keshini darhol yangilash (Statistika va ro'yxatlar)
    revalidatePath("/admin/organizations");
    revalidatePath("/admin/administrators");
    revalidatePath("/admin");

    // 7. Telegram xabarnoma (sozlamalarda yoqilgan bo'lsa)
    try {
      await notifyTelegramNewTenant(inserted.name, inserted.code);
    } catch (telegramErr) {
      console.warn("[Telegram Notification Error]:", telegramErr);
    }

    return {
      success: true,
      organizationId: inserted.id,
      credentials: hasAdminInfo
        ? {
            username: finalUsername,
            email: finalEmail,
            temporaryPassword: finalPassword,
            fullName: finalAdminFullName,
            role: "Tashkilot Rahbari",
          }
        : undefined,
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
