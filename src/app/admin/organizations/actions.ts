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
import { user, account, session } from "@/lib/db/schema/auth";
import { profiles } from "@/lib/db/schema/profiles";
import { organizations } from "@/lib/db/schema/organizations";
import { items } from "@/lib/db/schema/inventory";
import { buildings, floors, rooms } from "@/lib/db/schema/locations";
import {
  inventoryCycles,
  cycleItems,
  roomAudits,
  scanEvents,
  cycleConflicts,
  systemAuditLogs,
} from "@/lib/db/schema/audit";
import { hashPassword } from "better-auth/crypto";
import { generateId } from "better-auth";
import { sql, or, eq, and, inArray } from "drizzle-orm";
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
        finalEmail = cleanInput.includes("@") ? cleanInput : generateInternalSystemEmail(cleanInput);
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
          error: `Ushbu "${rawUsername}" logini bilan foydalanuvchi allaqachon mavjud.`,
          fieldErrors: { adminUsername: "Ushbu login band. Boshqa login tanlang." },
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
          assetLimitMlrd: data.assetLimitMlrd,
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
      return { success: false, error: "OTM ID ko'rsatilmagan." };
    }
    if (!data.name || data.name.trim().length < 2) {
      return { success: false, error: "OTM nomi kamida 2 ta belgidan iborat bo'lishi kerak." };
    }
    const effectiveTypeId = (data.typeId && data.typeId.trim()) ? data.typeId.trim() : "university";

    const updated = await updateOrganization({
      ...data,
      typeId: effectiveTypeId,
    });

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

export interface ResetAdminPasswordActionResult {
  success: boolean;
  error?: string;
  temporaryPassword?: string;
  username?: string;
  fullName?: string;
}

/**
 * Server Action: Tashkilot administratori parolini tiklash / yangilash
 */
export async function resetOrganizationAdminPasswordAction(input: {
  organizationId: string;
  userId?: string;
  customPassword?: string;
}): Promise<ResetAdminPasswordActionResult> {
  try {
    const authContext = await requirePlatformAdmin();
    const actorUserId = authContext.user.id;

    if (!input.organizationId) {
      return { success: false, error: "OTM ID ko'rsatilmagan." };
    }

    // 1. OTM admin profilini topish
    let targetUserId = input.userId;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let adminProfile: any = null;

    if (targetUserId) {
      const [found] = await db
        .select({
          userId: profiles.userId,
          fullName: profiles.fullName,
          organizationId: profiles.organizationId,
          username: user.username,
          email: user.email,
        })
        .from(profiles)
        .innerJoin(user, eq(profiles.userId, user.id))
        .where(
          and(
            eq(profiles.userId, targetUserId),
            eq(profiles.organizationId, input.organizationId)
          )
        )
        .limit(1);
      adminProfile = found;
    }

    if (!adminProfile) {
      const [found] = await db
        .select({
          userId: profiles.userId,
          fullName: profiles.fullName,
          organizationId: profiles.organizationId,
          username: user.username,
          email: user.email,
        })
        .from(profiles)
        .innerJoin(user, eq(profiles.userId, user.id))
        .where(
          and(
            eq(profiles.organizationId, input.organizationId),
            eq(profiles.role, "organization_admin")
          )
        )
        .limit(1);
      adminProfile = found;
      if (adminProfile) {
        targetUserId = adminProfile.userId;
      }
    }

    if (!adminProfile || !targetUserId) {
      return {
        success: false,
        error: "Ushbu OTMga biriktirilgan administrator topilmadi.",
      };
    }

    const newPassword =
      input.customPassword && input.customPassword.trim()
        ? input.customPassword.trim()
        : generateSecureTemporaryPassword();
    const passwordHash = await hashPassword(newPassword);

    await db.transaction(async (tx) => {
      // 1. Hisob parolini yangilash
      await tx
        .update(account)
        .set({ password: passwordHash, updatedAt: new Date() })
        .where(
          and(
            eq(account.userId, targetUserId),
            eq(account.providerId, "credential")
          )
        );

      // 2. Profil mustChangePassword ni true qilish
      await tx
        .update(profiles)
        .set({ mustChangePassword: true, updatedAt: new Date() })
        .where(eq(profiles.userId, targetUserId));

      // 3. Eski faol sessiyalarni xavfsizlik uchun bekor qilish
      await tx.delete(session).where(eq(session.userId, targetUserId));
    });

    logSecurityAudit({
      event: "ORGANIZATION_ADMIN_PASSWORD_RESET",
      actorUserId,
      organizationId: input.organizationId,
      metadata: { targetUserId, username: adminProfile.username },
    });

    revalidatePath("/admin/organizations");
    revalidatePath("/admin/administrators");
    revalidatePath("/admin");

    return {
      success: true,
      temporaryPassword: newPassword,
      username: adminProfile.username || adminProfile.email,
      fullName: adminProfile.fullName,
    };
  } catch (err: unknown) {
    return {
      success: false,
      error:
        err instanceof Error
          ? err.message
          : "Parolni tiklashda xatolik yuz berdi.",
    };
  }
}

/**
 * Server Action: Yangi administrator biriktirish / yaratish
 */
export async function createOrAssignOrganizationAdminAction(input: {
  organizationId: string;
  fullName: string;
  username: string;
  password?: string;
  phone?: string;
}): Promise<{
  success: boolean;
  error?: string;
  credentials?: {
    username: string;
    temporaryPassword: string;
    fullName: string;
  };
}> {
  try {
    const authContext = await requirePlatformAdmin();
    const actorUserId = authContext.user.id;

    if (!input.organizationId) {
      return { success: false, error: "OTM ID ko'rsatilmagan." };
    }
    if (!input.fullName || input.fullName.trim().length < 2) {
      return {
        success: false,
        error: "Administrator F.I.Sh. kiritilishi shart (kamida 2 ta belgi).",
      };
    }
    if (!input.username || input.username.trim().length < 3) {
      return {
        success: false,
        error: "Login kamida 3 ta belgidan iborat bo'lishi kerak.",
      };
    }

    const cleanUsername = input.username.trim().toLowerCase();
    const finalPassword =
      input.password && input.password.trim()
        ? input.password.trim()
        : generateSecureTemporaryPassword();
    const passwordHash = await hashPassword(finalPassword);
    const systemEmail = generateInternalSystemEmail(cleanUsername);

    // OTM mavjudligini tekshirish
    const [org] = await db
      .select({
        id: organizations.id,
        code: organizations.code,
        settings: organizations.settings,
      })
      .from(organizations)
      .where(eq(organizations.id, input.organizationId))
      .limit(1);

    if (!org) {
      return { success: false, error: "OTM topilmadi." };
    }

    const newUserId = generateId();
    await db.transaction(async (tx) => {
      // 1. user
      await tx.insert(user).values({
        id: newUserId,
        name: input.fullName.trim(),
        email: systemEmail,
        username: cleanUsername,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      // 2. account
      await tx.insert(account).values({
        id: generateId(),
        userId: newUserId,
        accountId: newUserId,
        providerId: "credential",
        password: passwordHash,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      // 3. profile
      await tx.insert(profiles).values({
        userId: newUserId,
        organizationId: input.organizationId,
        role: "organization_admin",
        fullName: input.fullName.trim(),
        mustChangePassword: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      // 4. OTM sozlamalarida administrator ismi va telefonini yangilash
      const currentSettings = org.settings || {};
      await tx
        .update(organizations)
        .set({
          settings: {
            ...currentSettings,
            adminName: input.fullName.trim(),
            adminPhone: input.phone?.trim() || currentSettings.adminPhone || "",
          },
          updatedAt: new Date(),
        })
        .where(eq(organizations.id, input.organizationId));
    });

    logSecurityAudit({
      event: "ORGANIZATION_ADMIN_CREATED",
      actorUserId,
      organizationId: input.organizationId,
      metadata: { newUserId, username: cleanUsername },
    });

    revalidatePath("/admin/organizations");
    revalidatePath("/admin/administrators");
    revalidatePath("/admin");

    return {
      success: true,
      credentials: {
        username: cleanUsername,
        temporaryPassword: finalPassword,
        fullName: input.fullName.trim(),
      },
    };
  } catch (err: unknown) {
    const msg =
      err instanceof Error
        ? err.message
        : "Administrator yaratishda xatolik yuz berdi.";
    if (msg.includes("unique") || msg.includes("duplicate")) {
      return {
        success: false,
        error: "Ushbu login tizimda allaqachon mavjud, boshqa login tanlang.",
      };
    }
    return { success: false, error: msg };
  }
}

export interface DeleteOrganizationActionResult {
  success: boolean;
  error?: string;
}

export async function deleteOrganizationAction(
  organizationId: string,
  confirmationName: string
): Promise<DeleteOrganizationActionResult> {
  try {
    const sessionUser = await requirePlatformAdmin();
    const actorUserId = sessionUser.user.id;

    if (!organizationId || !organizationId.trim()) {
      return { success: false, error: "OTM identifikatori ko'rsatilmadi." };
    }

    const [org] = await db
      .select({
        id: organizations.id,
        name: organizations.name,
      })
      .from(organizations)
      .where(eq(organizations.id, organizationId))
      .limit(1);

    if (!org) {
      return { success: false, error: "Bunday OTM topilmadi." };
    }

    if (confirmationName.trim().toLowerCase() !== org.name.trim().toLowerCase()) {
      return {
        success: false,
        error: `Tasdiqlash nomi noto'g'ri kiritildi. OTM nomini aynan ko'chirib yozing.`,
      };
    }

    await db.transaction(async (tx) => {
      // 1. Ushbu OTMga biriktirilgan profillarni topish
      const orgProfiles = await tx
        .select({ userId: profiles.userId })
        .from(profiles)
        .where(eq(profiles.organizationId, organizationId));

      const userIds = orgProfiles.map((p) => p.userId);

      // 2. Ushbu foydalanuvchilarning sessiyalari, accountlari va profillarini o'chirish
      if (userIds.length > 0) {
        await tx.delete(session).where(inArray(session.userId, userIds));
        await tx.delete(account).where(inArray(account.userId, userIds));
        await tx.delete(profiles).where(eq(profiles.organizationId, organizationId));
        await tx.delete(user).where(inArray(user.id, userIds));
      }

      // 3. Audit va tekshiruvlar jadvallaridan tozalash
      await tx.delete(cycleConflicts).where(eq(cycleConflicts.organizationId, organizationId));
      await tx.delete(scanEvents).where(eq(scanEvents.organizationId, organizationId));
      await tx.delete(roomAudits).where(eq(roomAudits.organizationId, organizationId));
      await tx.delete(cycleItems).where(eq(cycleItems.organizationId, organizationId));
      await tx.delete(inventoryCycles).where(eq(inventoryCycles.organizationId, organizationId));
      await tx.delete(systemAuditLogs).where(eq(systemAuditLogs.organizationId, organizationId));

      // 4. Inventarizatsiya buyumlari (items) ni o'chirish
      await tx.delete(items).where(eq(items.organizationId, organizationId));

      // 5. Lokatsiyalar: xonalar, qavatlar, binolarni o'chirish
      await tx.delete(rooms).where(eq(rooms.organizationId, organizationId));
      await tx.delete(floors).where(eq(floors.organizationId, organizationId));
      await tx.delete(buildings).where(eq(buildings.organizationId, organizationId));

      // 6. OTMning o'zini o'chirish
      await tx.delete(organizations).where(eq(organizations.id, organizationId));
    });

    logSecurityAudit({
      event: "ORGANIZATION_DELETED",
      actorUserId,
      organizationId,
      metadata: { deletedOrganizationName: org.name },
    });

    revalidatePath("/admin/organizations");
    revalidatePath("/admin/administrators");
    revalidatePath("/admin");

    return { success: true };
  } catch (err: unknown) {
    return {
      success: false,
      error:
        err instanceof Error
          ? err.message
          : "OTMni o'chirishda kutilmagan xatolik yuz berdi.",
    };
  }
}
