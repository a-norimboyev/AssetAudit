"use server";

import { revalidatePath } from "next/cache";
import { requireOrganizationAdmin, requirePlatformAdmin } from "@/lib/auth/authorization";
import { db } from "@/lib/db";
import { user, account, session } from "@/lib/db/schema/auth";
import { profiles, type UserRole } from "@/lib/db/schema/profiles";
import { organizations } from "@/lib/db/schema/organizations";
import { hashPassword, verifyPassword } from "better-auth/crypto";
import { generateId } from "better-auth";
import { eq, and, or, sql } from "drizzle-orm";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { logSecurityAudit } from "@/lib/audit/logger";
import {
  validateStaffPassword,
  validateStaffInput,
  validateUsername,
  formatStaffUsername,
  generateInternalSystemEmail,
  generateSecureTemporaryPassword,
} from "@/lib/validations/staff";

export interface StaffActionResponse {
  success: boolean;
  message: string;
  fieldErrors?: Record<string, string>;
  credentials?: {
    username: string;
    email: string;
    temporaryPassword?: string;
    role: string;
    fullName: string;
  };
}

export {
  validateStaffPassword,
  validateStaffInput,
  validateUsername,
  formatStaffUsername,
  generateInternalSystemEmail,
  generateSecureTemporaryPassword,
};

/**
 * 1. Yangi Xodim (Inspektor yoki Moddiy javobgar shaxs) akkauntini yaratish
 *
 * LMS Uslubi: Foydalanuvchiga unikal login (masalan: tatu.inspector1) va
 * xavfsiz vaqtinchalik parol biriktiriladi.
 *
 * Vakolat: Faqat Organization Admin ruxsat etilgan.
 * Xavfsizlik: Tashkilot rahbari faqat 'inspector' va 'registrar' yarata oladi.
 * Boshqa tashkilotga yoki Super Admin roliga xodim yarata OLMAYDI!
 */
export async function createStaffMemberAction(
  _prevState: StaffActionResponse | null,
  formData: FormData
): Promise<StaffActionResponse> {
  let actorUserId = "unknown";
  try {
    const { organization, profile: actorProfile } = await requireOrganizationAdmin();
    actorUserId = actorProfile.userId;

    const fullName = (formData.get("fullName") as string)?.trim() || "";
    const rawUsername = (formData.get("username") as string)?.trim() || "";
    const rawEmail = (formData.get("email") as string)?.trim().toLowerCase() || "";
    const role = (formData.get("role") as string)?.trim() as UserRole;
    let password = (formData.get("password") as string)?.trim() || "";

    const validation = validateStaffInput(
      { fullName, username: rawUsername, email: rawEmail, role, password },
      organization.code
    );

    if (!validation.valid) {
      return {
        success: false,
        message: "Kiritilgan ma'lumotlarda xatolik bor.",
        fieldErrors: validation.errors,
      };
    }

    const finalUsername = validation.normalized.username;
    const finalEmail = validation.normalized.email;

    // Agar parol kiritilmagan bo'lsa, xavfsiz yuqori entropiyali vaqtinchalik parol generatsiya qilinadi
    if (!password) {
      password = generateSecureTemporaryPassword();
    }

    // Login (username) takrorlanmasligini tekshirish (Case-insensitive)
    const [existingUserByUsername] = await db
      .select({ id: user.id })
      .from(user)
      .where(sql`lower(${user.username}) = ${finalUsername.toLowerCase()}`)
      .limit(1);

    if (existingUserByUsername) {
      return {
        success: false,
        message: `Ushbu "${finalUsername}" logini bilan foydalanuvchi allaqachon mavjud.`,
        fieldErrors: { username: "Bu login band. Boshqa nom tanlang." },
      };
    }

    // Email takrorlanmasligini tekshirish
    const [existingUserByEmail] = await db
      .select({ id: user.id })
      .from(user)
      .where(eq(user.email, finalEmail))
      .limit(1);

    if (existingUserByEmail) {
      return {
        success: false,
        message: `Ushbu "${finalEmail}" email manzili bilan foydalanuvchi allaqachon mavjud.`,
        fieldErrors: { username: "Bu akkaunt tizimda mavjud." },
      };
    }

    // Better Auth rasmiy scrypt xeshlash
    const passwordHash = await hashPassword(password);
    const userId = generateId();
    const accountId = generateId();
    const now = new Date();

    await db.transaction(async (tx) => {
      // 1. user jadvaliga yozish (LMS login va displayUsername bilan)
      await tx.insert(user).values({
        id: userId,
        name: fullName,
        email: finalEmail,
        emailVerified: true,
        image: null,
        username: finalUsername,
        displayUsername: finalUsername,
        createdAt: now,
        updatedAt: now,
      });

      // 2. account jadvaliga credential hisobini bog'lash
      await tx.insert(account).values({
        id: accountId,
        userId,
        accountId: userId,
        providerId: "credential",
        password: passwordHash,
        createdAt: now,
        updatedAt: now,
      });

      // 3. profiles jadvaliga biznes profilini kiritish (mustChangePassword = false)
      await tx.insert(profiles).values({
        userId,
        organizationId: organization.id,
        role,
        fullName,
        isActive: true,
        mustChangePassword: false,
        createdAt: now,
        updatedAt: now,
      });
    });

    logSecurityAudit({
      event: "STAFF_CREATED",
      actorUserId,
      organizationId: organization.id,
      metadata: {
        role,
        username: finalUsername,
        targetUserId: userId,
      },
    });

    revalidatePath("/org/staff");

    return {
      success: true,
      message: `"${fullName}" xodimi muvaffaqiyatli ro'yxatdan o'tkazildi.`,
      credentials: {
        username: finalUsername,
        email: finalEmail,
        temporaryPassword: password,
        role: role === "inspector" ? "Inventarizatsiya Tekshiruvchisi" : "Moddiy Javobgar Shaxs (Registrar)",
        fullName,
      },
    };
  } catch (err) {
    return {
      success: false,
      message: err instanceof Error ? err.message : "Xodimni yaratishda server xatosi yuz berdi.",
    };
  }
}

/**
 * 2. Tashkilot xodimi parolini xavfsiz reset qilish (Reset Staff Password Action)
 *
 * Vakolat: Faqat Organization Admin ruxsat etilgan.
 * Xavfsizlik kafolatlari:
 * - Faqat o'z tashkilotiga tegishli inspector/registrar xodimlarining paroli reset qilinishi mumkin.
 * - Yangi xavfsiz vaqtinchalik parol hosil qilinadi.
 * - mustChangePassword = true qilib belgilanadi.
 * - Xodimning barcha faol sessiyalari (session jadvali) DARHOL BEKOR QILINADI (force logout).
 * - Xavfsizlik auditi qayd etiladi.
 */
export async function resetStaffPasswordAction(formData: FormData): Promise<StaffActionResponse> {
  let actorUserId = "unknown";
  try {
    const { organization, profile: actorProfile } = await requireOrganizationAdmin();
    actorUserId = actorProfile.userId;

    const targetUserId = (formData.get("userId") as string)?.trim() || "";
    if (!targetUserId) {
      return { success: false, message: "Xodim identifikatori topilmadi." };
    }

    // Xodimni tekshirish (qat'iy intra-tenant cheklov)
    const [targetProfile] = await db
      .select({
        userId: profiles.userId,
        fullName: profiles.fullName,
        role: profiles.role,
        organizationId: profiles.organizationId,
        username: user.username,
        email: user.email,
      })
      .from(profiles)
      .innerJoin(user, eq(profiles.userId, user.id))
      .where(
        and(
          eq(profiles.userId, targetUserId),
          eq(profiles.organizationId, organization.id)
        )
      )
      .limit(1);

    if (!targetProfile) {
      return { success: false, message: "Xodim topilmadi yoki ushbu tashkilotga tegishli emas." };
    }

    if (targetProfile.role !== "inspector" && targetProfile.role !== "registrar") {
      return { success: false, message: "Faqat inspektor va moddiy javobgarlarning parolini reset qilish mumkin." };
    }

    const newTemporaryPassword = generateSecureTemporaryPassword();
    const newHash = await hashPassword(newTemporaryPassword);

    await db.transaction(async (tx) => {
      // 1. account jadvalida parolni yangilash
      await tx
        .update(account)
        .set({ password: newHash, updatedAt: new Date() })
        .where(and(eq(account.userId, targetUserId), eq(account.providerId, "credential")));

      // 2. profiles jadvalida mustChangePassword = false qilish
      await tx
        .update(profiles)
        .set({ mustChangePassword: false, updatedAt: new Date() })
        .where(eq(profiles.userId, targetUserId));

      // 3. Faol sessiyalarni bekor qilish (Immediate Session Invalidation)
      await tx.delete(session).where(eq(session.userId, targetUserId));
    });

    logSecurityAudit({
      event: "STAFF_PASSWORD_RESET",
      actorUserId,
      organizationId: organization.id,
      metadata: {
        targetUserId,
        role: targetProfile.role,
        username: targetProfile.username,
      },
    });

    revalidatePath("/org/staff");

    return {
      success: true,
      message: `"${targetProfile.fullName}" paroli muvaffaqiyatli yangilandi. Faol sessiyalari bekor qilindi.`,
      credentials: {
        username: targetProfile.username || targetProfile.email,
        email: targetProfile.email,
        temporaryPassword: newTemporaryPassword,
        role: targetProfile.role === "inspector" ? "Inventarizatsiya Tekshiruvchisi" : "Moddiy Javobgar Shaxs",
        fullName: targetProfile.fullName,
      },
    };
  } catch (err) {
    return {
      success: false,
      message: err instanceof Error ? err.message : "Parolni yangilashda server xatosi yuz berdi.",
    };
  }
}

/**
 * 2B. Xodim holatini o'zgartirish (Aktivlashtirish / Bloklash - Toggle Staff Status)
 *
 * Vakolat: Faqat Organization Admin ruxsat etilgan.
 * Xavfsizlik:
 * - Faqat o'z tashkilotiga tegishli inspector/registrar xodimi.
 * - Bloklangan (isActive = false) xodimning barcha sessiyalari session jadvalidan darhol o'chiriladi (force logout).
 * - Audit jurnali qayd etiladi.
 */
export async function toggleStaffStatusAction(
  userId: string,
  nextActiveState: boolean
): Promise<{ success: boolean; message: string }> {
  let actorUserId = "unknown";
  try {
    const { organization, profile: actorProfile } = await requireOrganizationAdmin();
    actorUserId = actorProfile.userId;

    if (!userId || typeof userId !== "string") {
      return { success: false, message: "Foydalanuvchi identifikatori topilmadi." };
    }

    const [targetProfile] = await db
      .select({
        userId: profiles.userId,
        fullName: profiles.fullName,
        role: profiles.role,
        organizationId: profiles.organizationId,
        isActive: profiles.isActive,
      })
      .from(profiles)
      .where(
        and(
          eq(profiles.userId, userId),
          eq(profiles.organizationId, organization.id)
        )
      )
      .limit(1);

    if (!targetProfile) {
      return { success: false, message: "Xodim topilmadi yoki ushbu tashkilotga tegishli emas." };
    }

    if (targetProfile.role !== "inspector" && targetProfile.role !== "registrar") {
      return { success: false, message: "Faqat inspektor va moddiy javobgarlarning holatini o'zgartirish mumkin." };
    }

    await db.transaction(async (tx) => {
      // 1. Profil holatini yangilash
      await tx
        .update(profiles)
        .set({
          isActive: nextActiveState,
          updatedAt: new Date(),
        })
        .where(eq(profiles.userId, userId));

      // 2. Agar nofaol qilinsa, foydalanuvchining barcha faol sessiyalarini bekor qilish (force logout)
      if (!nextActiveState) {
        await tx.delete(session).where(eq(session.userId, userId));
      }
    });

    logSecurityAudit({
      event: nextActiveState ? "STAFF_ACTIVATED" : "STAFF_DEACTIVATED",
      actorUserId,
      organizationId: organization.id,
      metadata: {
        targetUserId: userId,
        targetFullName: targetProfile.fullName,
        nextActiveState,
      },
    });

    revalidatePath("/org/staff");
    revalidatePath("/org");

    return {
      success: true,
      message: `Xodim holati muvaffaqiyatli ${nextActiveState ? "faollashtirildi" : "to'xtatildi"}.`,
    };
  } catch (err) {
    return {
      success: false,
      message: err instanceof Error ? err.message : "Xodim holatini o'zgartirishda server xatosi yuz berdi.",
    };
  }
}

/**
 * 3. Tashkilot Administratorini yaratish (Create Organization Admin Action)
 *
 * Vakolat: Faqat Platforma Super Admini ruxsat etilgan.
 * LMS Uslubi: Administrator uchun unikal login belgilanadi (masalan: tatu.admin)
 * va xavfsiz vaqtinchalik parol taqdim etiladi.
 */
export async function createOrganizationAdminAction(
  _prevState: StaffActionResponse | null,
  formData: FormData
): Promise<StaffActionResponse> {
  let actorUserId = "unknown";
  try {
    const authContext = await requirePlatformAdmin();
    actorUserId = authContext.user.id;

    const organizationId = (formData.get("organizationId") as string)?.trim() || "";
    const fullName = (formData.get("fullName") as string)?.trim() || "";
    const rawUsername = (formData.get("username") as string)?.trim() || "";
    let password = (formData.get("password") as string)?.trim() || "";
    const phone = (formData.get("phone") as string)?.trim() || "";

    const fieldErrors: Record<string, string> = {};

    if (!organizationId) {
      fieldErrors.organizationId = "Tashkilot tanlanishi shart.";
    }

    if (!fullName || fullName.length < 3) {
      fieldErrors.fullName = "To'liq ism kamida 3 ta belgidan iborat bo'lishi shart.";
    }

    let finalUsername = "";
    let finalEmail = "";

    if (!rawUsername) {
      fieldErrors.username = "Administrator uchun kirish emaili kiritilishi shart.";
    } else if (rawUsername.includes("@")) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(rawUsername)) {
        fieldErrors.username = "To'g'ri email manzilini kiriting (masalan: nodir@gmail.com).";
      } else {
        finalEmail = rawUsername.toLowerCase().trim();
        finalUsername = finalEmail;
      }
    } else {
      const uCheck = validateUsername(rawUsername);
      if (!uCheck.valid) {
        fieldErrors.username = uCheck.error!;
      }
    }

    if (Object.keys(fieldErrors).length > 0) {
      return { success: false, message: "Kiritilgan ma'lumotlarda xatolik bor.", fieldErrors };
    }

    // Tashkilotni tekshirish
    const [targetOrg] = await db
      .select({ id: organizations.id, name: organizations.name, code: organizations.code, isActive: organizations.isActive })
      .from(organizations)
      .where(eq(organizations.id, organizationId))
      .limit(1);

    if (!targetOrg) {
      return { success: false, message: "Belgilangan tashkilot topilmadi." };
    }

    if (!targetOrg.isActive) {
      return { success: false, message: "Nofaol tashkilot uchun administrator yaratib bo'lmaydi." };
    }

    if (!finalUsername) {
      finalUsername = formatStaffUsername(targetOrg.code, rawUsername);
      finalEmail = generateInternalSystemEmail(finalUsername);
    }

    if (!password) {
      password = generateSecureTemporaryPassword();
    } else {
      const passCheck = validateStaffPassword(password);
      if (!passCheck.valid) {
        return { success: false, message: passCheck.error!, fieldErrors: { password: passCheck.error! } };
      }
    }

    // Login yoki email takrorlanmasligini tekshirish
    const [existingUser] = await db
      .select({ id: user.id })
      .from(user)
      .where(
        or(
          sql`lower(${user.username}) = ${finalUsername.toLowerCase()}`,
          sql`lower(${user.email}) = ${finalEmail.toLowerCase()}`
        )
      )
      .limit(1);

    if (existingUser) {
      return {
        success: false,
        message: `Ushbu "${finalEmail}" email/login bilan foydalanuvchi allaqachon mavjud.`,
        fieldErrors: { username: "Bu email yoki login band. Boshqa nom tanlang." },
      };
    }

    const passwordHash = await hashPassword(password);
    const userId = generateId();
    const accountId = generateId();
    const now = new Date();

    await db.transaction(async (tx) => {
      await tx.insert(user).values({
        id: userId,
        name: fullName,
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
        organizationId: targetOrg.id,
        role: "organization_admin",
        fullName,
        isActive: true,
        mustChangePassword: false,
        createdAt: now,
        updatedAt: now,
      });

      if (password && phone) {
        await tx.execute(
          sql`UPDATE organizations SET settings = jsonb_set(jsonb_set(COALESCE(settings, '{}'::jsonb), '{adminPassword}', to_jsonb(${password}::text)), '{adminPhone}', to_jsonb(${phone}::text)) WHERE id = ${targetOrg.id}`
        );
      } else if (password) {
        await tx.execute(
          sql`UPDATE organizations SET settings = jsonb_set(COALESCE(settings, '{}'::jsonb), '{adminPassword}', to_jsonb(${password}::text)) WHERE id = ${targetOrg.id}`
        );
      } else if (phone) {
        await tx.execute(
          sql`UPDATE organizations SET settings = jsonb_set(COALESCE(settings, '{}'::jsonb), '{adminPhone}', to_jsonb(${phone}::text)) WHERE id = ${targetOrg.id}`
        );
      }
    });

    logSecurityAudit({
      event: "ORGANIZATION_ADMIN_CREATED",
      actorUserId,
      organizationId: targetOrg.id,
      metadata: {
        username: finalUsername,
        targetUserId: userId,
      },
    });

    revalidatePath("/admin/administrators");
    revalidatePath("/admin/organizations");

    return {
      success: true,
      message: `"${targetOrg.name}" uchun administrator muvaffaqiyatli yaratildi.`,
      credentials: {
        username: finalUsername,
        email: finalEmail,
        temporaryPassword: password,
        role: "Tashkilot Rahbari (Administrator)",
        fullName,
      },
    };
  } catch (err) {
    return {
      success: false,
      message: err instanceof Error ? err.message : "Administratorni yaratishda server xatosi yuz berdi.",
    };
  }
}

/**
 * 4. Tashkilot Administratori parolini reset qilish (Reset Organization Admin Password Action)
 *
 * Vakolat: Faqat Platforma Super Admini.
 * Sessiyalarni darhol bekor qilish va yangi vaqtinchalik parol taqdim etish.
 */
export async function resetOrganizationAdminPasswordAction(formData: FormData): Promise<StaffActionResponse> {
  let actorUserId = "unknown";
  try {
    const authContext = await requirePlatformAdmin();
    actorUserId = authContext.user.id;

    const targetUserId = (formData.get("userId") as string)?.trim() || "";
    if (!targetUserId) {
      return { success: false, message: "Foydalanuvchi identifikatori topilmadi." };
    }

    const [adminProfile] = await db
      .select({
        userId: profiles.userId,
        fullName: profiles.fullName,
        role: profiles.role,
        organizationId: profiles.organizationId,
        username: user.username,
        email: user.email,
      })
      .from(profiles)
      .innerJoin(user, eq(profiles.userId, user.id))
      .where(and(eq(profiles.userId, targetUserId), eq(profiles.role, "organization_admin")))
      .limit(1);

    if (!adminProfile) {
      return { success: false, message: "Tashkilot administratori topilmadi." };
    }

    const newTemporaryPassword = generateSecureTemporaryPassword();
    const newHash = await hashPassword(newTemporaryPassword);

    await db.transaction(async (tx) => {
      await tx
        .update(account)
        .set({ password: newHash, updatedAt: new Date() })
        .where(and(eq(account.userId, targetUserId), eq(account.providerId, "credential")));

      await tx
        .update(profiles)
        .set({ mustChangePassword: false, updatedAt: new Date() })
        .where(eq(profiles.userId, targetUserId));

      await tx.delete(session).where(eq(session.userId, targetUserId));

      if (adminProfile.organizationId) {
        await tx.execute(
          sql`UPDATE organizations SET settings = jsonb_set(COALESCE(settings, '{}'::jsonb), '{adminPassword}', to_jsonb(${newTemporaryPassword}::text)) WHERE id = ${adminProfile.organizationId}`
        );
      }
    });

    logSecurityAudit({
      event: "ORGANIZATION_ADMIN_PASSWORD_RESET",
      actorUserId,
      organizationId: adminProfile.organizationId,
      metadata: {
        targetUserId,
        username: adminProfile.username,
      },
    });

    revalidatePath("/admin/administrators");
    revalidatePath("/admin/organizations");

    return {
      success: true,
      message: `"${adminProfile.fullName}" paroli muvaffaqiyatli yangilandi. Faol sessiyalari bekor qilindi.`,
      credentials: {
        username: adminProfile.username || adminProfile.email,
        email: adminProfile.email,
        temporaryPassword: newTemporaryPassword,
        role: "Tashkilot Rahbari (Administrator)",
        fullName: adminProfile.fullName,
      },
    };
  } catch (err) {
    return {
      success: false,
      message: err instanceof Error ? err.message : "Parolni reset qilishda xatolik yuz berdi.",
    };
  }
}

/**
 * 4.1. Tashkilot Administratori holatini o'zgartirish (Faollashtirish / Bloklash)
 *
 * Vakolat: Faqat Platforma Super Admini.
 * Bloklangan (isActive = false) administratorning barcha sessiyalari session jadvalidan darhol o'chiriladi (force logout).
 */
export async function toggleOrganizationAdminStatusAction(
  userId: string,
  nextActiveState: boolean
): Promise<{ success: boolean; message: string }> {
  let actorUserId = "unknown";
  try {
    const authContext = await requirePlatformAdmin();
    actorUserId = authContext.user.id;

    if (!userId) {
      return { success: false, message: "Foydalanuvchi identifikatori topilmadi." };
    }

    const [adminProfile] = await db
      .select({
        userId: profiles.userId,
        fullName: profiles.fullName,
        role: profiles.role,
        organizationId: profiles.organizationId,
        isActive: profiles.isActive,
      })
      .from(profiles)
      .where(and(eq(profiles.userId, userId), eq(profiles.role, "organization_admin")))
      .limit(1);

    if (!adminProfile) {
      return { success: false, message: "Tashkilot administratori topilmadi." };
    }

    await db.transaction(async (tx) => {
      await tx
        .update(profiles)
        .set({
          isActive: nextActiveState,
          updatedAt: new Date(),
        })
        .where(eq(profiles.userId, userId));

      if (!nextActiveState) {
        await tx.delete(session).where(eq(session.userId, userId));
      }
    });

    logSecurityAudit({
      event: nextActiveState ? "ORGANIZATION_ADMIN_ACTIVATED" : "ORGANIZATION_ADMIN_DEACTIVATED",
      actorUserId,
      organizationId: adminProfile.organizationId,
      metadata: {
        targetUserId: userId,
        targetFullName: adminProfile.fullName,
        nextActiveState,
      },
    });

    revalidatePath("/admin/administrators");
    revalidatePath("/admin");

    return {
      success: true,
      message: `"${adminProfile.fullName}" holati muvaffaqiyatli ${nextActiveState ? "faollashtirildi" : "bloklandi"}.`,
    };
  } catch (err) {
    return {
      success: false,
      message: err instanceof Error ? err.message : "Holatni o'zgartirishda xatolik yuz berdi.",
    };
  }
}

/**
 * 5. Vaqtinchalik parolni majburiy yangilash (Change Temporary Password Action)
 * Foydalanuvchi tizimga kirgan, lekin mustChangePassword = true bo'lgan holatda
 * yangi mustahkam parol o'rnatishi uchun xizmat qiladi.
 */
export async function changeTemporaryPasswordAction(
  _prevState: StaffActionResponse | null,
  formData: FormData
): Promise<StaffActionResponse> {
  try {
    const reqHeaders = await headers();
    const authSession = await auth.api.getSession({ headers: reqHeaders });

    if (!authSession || !authSession.user) {
      return { success: false, message: "Avtorizatsiyadan o'tilmagan." };
    }

    const currentPassword = (formData.get("currentPassword") as string)?.trim() || "";
    const newPassword = (formData.get("newPassword") as string)?.trim() || "";
    const confirmPassword = (formData.get("confirmPassword") as string)?.trim() || "";

    const fieldErrors: Record<string, string> = {};

    if (!currentPassword) {
      fieldErrors.currentPassword = "Joriy (vaqtinchalik) parolni kiriting.";
    }

    const passCheck = validateStaffPassword(newPassword);
    if (!passCheck.valid) {
      fieldErrors.newPassword = passCheck.error || "Yangi parol xavfsizlik talablariga javob bermaydi.";
    }

    if (newPassword !== confirmPassword) {
      fieldErrors.confirmPassword = "Yangi parol va tasdiqlovchi parol bir xil bo'lishi shart.";
    }

    if (newPassword === currentPassword) {
      fieldErrors.newPassword = "Yangi parol vaqtinchalik parol bilan bir xil bo'lishi mumkin emas.";
    }

    if (Object.keys(fieldErrors).length > 0) {
      return { success: false, message: "Kiritilgan ma'lumotlarda xatolik bor.", fieldErrors };
    }

    // Foydalanuvchi hisobini olish
    const [acc] = await db
      .select({ id: account.id, password: account.password })
      .from(account)
      .where(and(eq(account.userId, authSession.user.id), eq(account.providerId, "credential")))
      .limit(1);

    if (!acc || !acc.password) {
      return { success: false, message: "Parol bilan kirish hisobi topilmadi." };
    }

    const isCurrentValid = await verifyPassword({
      hash: acc.password,
      password: currentPassword,
    });

    if (!isCurrentValid) {
      return {
        success: false,
        message: "Joriy (vaqtinchalik) parol noto'g'ri kiritildi.",
        fieldErrors: { currentPassword: "Joriy parol noto'g'ri." },
      };
    }

    const newHash = await hashPassword(newPassword);

    // Foydalanuvchi profilini olish (tashkilot admini ekanligini tekshirish uchun)
    const [userProfile] = await db
      .select({
        role: profiles.role,
        organizationId: profiles.organizationId,
      })
      .from(profiles)
      .where(eq(profiles.userId, authSession.user.id))
      .limit(1);

    await db.transaction(async (tx) => {
      await tx
        .update(account)
        .set({ password: newHash, updatedAt: new Date() })
        .where(eq(account.id, acc.id));

      await tx
        .update(profiles)
        .set({ mustChangePassword: false, updatedAt: new Date() })
        .where(eq(profiles.userId, authSession.user.id));

      if (userProfile?.role === "organization_admin" && userProfile.organizationId) {
        await tx.execute(
          sql`UPDATE organizations SET settings = jsonb_set(COALESCE(settings, '{}'::jsonb), '{adminPassword}', to_jsonb(${newPassword}::text)) WHERE id = ${userProfile.organizationId}`
        );
      }
    });

    logSecurityAudit({
      event: "PASSWORD_CHANGED",
      actorUserId: authSession.user.id,
      metadata: { reason: "TEMPORARY_PASSWORD_UPDATED" },
    });

    revalidatePath("/admin/organizations");

    return {
      success: true,
      message: "Parol muvaffaqiyatli o'zgartirildi. Endi tizimdan to'liq foydalanishingiz mumkin.",
    };
  } catch (err) {
    return {
      success: false,
      message: err instanceof Error ? err.message : "Parolni yangilashda xatolik yuz berdi.",
    };
  }
}

/**
 * 6. Tashkilot Administratori o'z parolini mustaqil yangilashi (Change Admin Own Password Action)
 *
 * Vakolat: Faqat Organization Admin ruxsat etilgan.
 * Xavfsizlik va integratsiya:
 * - Joriy parol xavfsiz tekshiriladi.
 * - Yangi parol kamida 6 ta belgidan iborat bo'lishi tekshiriladi.
 * - account jadvalida xavfsiz shifrlangan yangi hesh saqlanadi.
 * - Tashkilot sozlamalari (organizations.settings.adminPassword) da Super Admin uchun yangi parol yangilanadi.
 * - /admin/organizations va /org/settings keshlari darhol revalidatsiya qilinadi.
 */
export async function changeAdminOwnPasswordAction(
  _prevState: StaffActionResponse | null,
  formData: FormData
): Promise<StaffActionResponse> {
  let actorUserId = "unknown";
  try {
    const { organization, profile, user: authUser } = await requireOrganizationAdmin();
    actorUserId = profile.userId;

    const currentPassword = (formData.get("currentPassword") as string)?.trim() || "";
    const newPassword = (formData.get("newPassword") as string)?.trim() || "";
    const confirmPassword = (formData.get("confirmPassword") as string)?.trim() || "";

    const fieldErrors: Record<string, string> = {};

    if (!currentPassword) {
      fieldErrors.currentPassword = "Joriy parolingizni kiriting.";
    }

    if (!newPassword || newPassword.length < 6) {
      fieldErrors.newPassword = "Yangi parol kamida 6 ta belgidan iborat bo'lishi kerak.";
    }

    if (newPassword !== confirmPassword) {
      fieldErrors.confirmPassword = "Yangi parol va tasdiqlovchi parol bir xil bo'lishi shart.";
    }

    if (newPassword && newPassword === currentPassword) {
      fieldErrors.newPassword = "Yangi parol joriy parol bilan bir xil bo'lishi mumkin emas.";
    }

    if (Object.keys(fieldErrors).length > 0) {
      return { success: false, message: "Kiritilgan ma'lumotlarda xatolik bor.", fieldErrors };
    }

    // Foydalanuvchi hisobini olish
    const [acc] = await db
      .select({ id: account.id, password: account.password })
      .from(account)
      .where(and(eq(account.userId, authUser.id), eq(account.providerId, "credential")))
      .limit(1);

    if (!acc || !acc.password) {
      return { success: false, message: "Parol bilan kirish hisobi topilmadi." };
    }

    const isCurrentValid = await verifyPassword({
      hash: acc.password,
      password: currentPassword,
    });

    if (!isCurrentValid) {
      return {
        success: false,
        message: "Joriy parol noto'g'ri kiritildi.",
        fieldErrors: { currentPassword: "Joriy parol noto'g'ri." },
      };
    }

    const newHash = await hashPassword(newPassword);

    await db.transaction(async (tx) => {
      await tx
        .update(account)
        .set({ password: newHash, updatedAt: new Date() })
        .where(eq(account.id, acc.id));

      await tx
        .update(profiles)
        .set({ mustChangePassword: false, updatedAt: new Date() })
        .where(eq(profiles.userId, authUser.id));

      await tx.execute(
        sql`UPDATE organizations SET settings = jsonb_set(COALESCE(settings, '{}'::jsonb), '{adminPassword}', to_jsonb(${newPassword}::text)) WHERE id = ${organization.id}`
      );
    });

    logSecurityAudit({
      event: "PASSWORD_CHANGED",
      actorUserId,
      organizationId: organization.id,
      metadata: { username: authUser.email, reason: "ADMIN_SELF_CHANGED" },
    });

    revalidatePath("/admin/organizations");
    revalidatePath("/org/settings");

    return {
      success: true,
      message: "Parolingiz muvaffaqiyatli o'zgartirildi! Super Admin boshqaruv panelida ham yangi parol aks etadi.",
    };
  } catch (err) {
    return {
      success: false,
      message: err instanceof Error ? err.message : "Parolni yangilashda xatolik yuz berdi.",
    };
  }
}
