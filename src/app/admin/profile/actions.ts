"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { requirePlatformAdmin } from "@/lib/auth/authorization";
import { db } from "@/lib/db";
import { user, account } from "@/lib/db/schema/auth";
import { profiles } from "@/lib/db/schema/profiles";
import { eq, and, ne, or } from "drizzle-orm";
import { hashPassword, verifyPassword } from "better-auth/crypto";
import { logSecurityAudit } from "@/lib/audit/logger";

export interface ProfileActionResult {
  success: boolean;
  message?: string;
  error?: string;
}

/**
 * 0. Super Admin ism-familiyasi va loginini o'zgartirish
 */
export async function updateAdminProfileAction(data: {
  fullName: string;
  username: string;
}): Promise<ProfileActionResult> {
  try {
    const authContext = await requirePlatformAdmin();

    if (authContext.profile.role !== "super_admin") {
      return {
        success: false,
        error: "Ruxsat etilmagan: Faqat Super Admin o'z ma'lumotlarini o'zgartirishi mumkin.",
      };
    }

    const currentUserId = authContext.user.id;
    const trimmedName = (data.fullName || "").trim();
    const trimmedUsername = (data.username || "").trim().toLowerCase();

    // 1. Ism validatsiyasi
    if (!trimmedName || trimmedName.length < 2) {
      return {
        success: false,
        error: "Ism va familiya kamida 2 ta belgidan iborat bo'lishi kerak.",
      };
    }

    // 2. Login validatsiyasi
    if (!trimmedUsername || trimmedUsername.length < 3) {
      return {
        success: false,
        error: "Login kamida 3 ta belgidan iborat bo'lishi kerak.",
      };
    }

    if (!/^[a-z0-9._-]+$/.test(trimmedUsername)) {
      return {
        success: false,
        error: "Login faqat kichik lotin harflari, raqamlar, nuqta va chiziqchadan iborat bo'lishi mumkin.",
      };
    }

    // 3. Login takrorlanmasligi tekshiruvi
    const existing = await db
      .select({ id: user.id })
      .from(user)
      .where(
        and(
          or(eq(user.username, trimmedUsername), eq(user.email, trimmedUsername)),
          ne(user.id, currentUserId)
        )
      )
      .limit(1);

    if (existing.length > 0) {
      return {
        success: false,
        error: "Ushbu login allaqachon band. Iltimos, boshqa login tanlang.",
      };
    }

    // 4. user va profiles jadvallarini yangilash
    await db
      .update(user)
      .set({
        name: trimmedName,
        username: trimmedUsername,
        displayUsername: trimmedUsername,
        updatedAt: new Date(),
      })
      .where(eq(user.id, currentUserId));

    await db
      .update(profiles)
      .set({
        fullName: trimmedName,
        updatedAt: new Date(),
      })
      .where(eq(profiles.userId, currentUserId));

    logSecurityAudit({
      event: "PASSWORD_CHANGED",
      actorUserId: currentUserId,
      metadata: {
        action: "ADMIN_PROFILE_UPDATED",
        newFullName: trimmedName,
        newUsername: trimmedUsername,
      },
    });

    revalidatePath("/admin");
    revalidatePath("/admin/profile");
    revalidatePath("/admin/administrators");

    return {
      success: true,
      message: "Ma'lumotlar muvaffaqiyatli saqlandi!",
    };
  } catch (error) {
    console.error("[updateAdminProfileAction] Error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Ma'lumotlarni saqlashda xatolik yuz berdi.",
    };
  }
}

/**
 * 1. Kirish emailini (Gmail) yoki foydalanuvchi nomini o'zgartirish
 */
export async function updateUsernameAction(newEmailOrUsername: string): Promise<ProfileActionResult> {
  try {
    const authContext = await requirePlatformAdmin();

    // Faqat Super Admin hisob loginini o'zgartirishi mumkin
    if (authContext.profile.role !== "super_admin") {
      return {
        success: false,
        error: "Ruxsat etilmagan: Faqat Super Admin hisob loginini o'zgartirishi mumkin.",
      };
    }

    const currentUserId = authContext.user.id;

    const trimmed = (newEmailOrUsername || "").trim().toLowerCase();

    // Validatsiya
    if (!trimmed || trimmed.length < 3) {
      return {
        success: false,
        error: "Login kamida 3 ta belgidan iborat bo'lishi kerak.",
      };
    }

    const isEmail = trimmed.includes("@");
    if (isEmail) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(trimmed)) {
        return {
          success: false,
          error: "Login formatida xatolik bor.",
        };
      }
    } else if (!/^[a-z0-9._-]+$/.test(trimmed)) {
      return {
        success: false,
        error: "Login faqat kichik lotin harflari, raqamlar, nuqta va chiziqchadan iborat bo'lishi mumkin.",
      };
    }

    // Takroriylikni tekshirish
    const existing = await db
      .select({ id: user.id })
      .from(user)
      .where(
        and(
          or(eq(user.username, trimmed), eq(user.email, trimmed)),
          ne(user.id, currentUserId)
        )
      )
      .limit(1);

    if (existing.length > 0) {
      return {
        success: false,
        error: "Ushbu login allaqachon band. Iltimos, boshqa login tanlang.",
      };
    }

    // Yangilash
    await db
      .update(user)
      .set({
        email: isEmail ? trimmed : user.email,
        username: trimmed,
        displayUsername: trimmed,
        updatedAt: new Date(),
      })
      .where(eq(user.id, currentUserId));

    logSecurityAudit({
      event: "PASSWORD_CHANGED",
      actorUserId: currentUserId,
      metadata: {
        action: "LOGIN_CHANGED",
        newEmailOrUsername: trimmed,
      },
    });

    revalidatePath("/admin");
    revalidatePath("/admin/profile");
    revalidatePath("/admin/administrators");

    return {
      success: true,
      message: `Login muvaffaqiyatli "${trimmed}" ga o'zgartirildi!`,
    };
  } catch (error) {
    console.error("[updateUsernameAction] Error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Loginni o'zgartirishda xatolik yuz berdi.",
    };
  }
}

/**
 * 2. Maxfiy parolni o'zgartirish
 */
export async function updatePasswordAction(formData: {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}): Promise<ProfileActionResult> {
  try {
    const authContext = await requirePlatformAdmin();
    const currentUserId = authContext.user.id;

    const { currentPassword, newPassword, confirmPassword } = formData;

    if (!currentPassword) {
      return { success: false, error: "Joriy maxfiy parolni kiriting." };
    }

    if (!newPassword || newPassword.length < 8) {
      return {
        success: false,
        error: "Yangi parol kamida 8 ta belgidan iborat bo'lishi shart.",
      };
    }

    if (newPassword !== confirmPassword) {
      return {
        success: false,
        error: "Yangi parol va tasdiqlash paroli bir-biriga mos kelmadi.",
      };
    }

    // Joriy parolni tekshirish
    const userAccounts = await db
      .select({ id: account.id, password: account.password })
      .from(account)
      .where(and(eq(account.userId, currentUserId), eq(account.providerId, "credential")))
      .limit(1);

    if (userAccounts.length === 0 || !userAccounts[0].password) {
      return {
        success: false,
        error: "Hisob ma'lumotlari topilmadi.",
      };
    }

    const isMatch = await verifyPassword({
      hash: userAccounts[0].password,
      password: currentPassword,
    });

    if (!isMatch) {
      return {
        success: false,
        error: "Joriy maxfiy parol noto'g'ri kiritildi.",
      };
    }

    // Yangi parolni xeshlash va saqlash
    const newHash = await hashPassword(newPassword);

    await db
      .update(account)
      .set({
        password: newHash,
        updatedAt: new Date(),
      })
      .where(and(eq(account.userId, currentUserId), eq(account.providerId, "credential")));

    logSecurityAudit({
      event: "PASSWORD_CHANGED",
      actorUserId: currentUserId,
      metadata: {
        action: "SUPERADMIN_PASSWORD_CHANGED",
        timestamp: new Date().toISOString(),
      },
    });

    return {
      success: true,
      message: "Maxfiy parol muvaffaqiyatli yangilandi!",
    };
  } catch (error) {
    console.error("[updatePasswordAction] Error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Parolni yangilashda xatolik yuz berdi.",
    };
  }
}

/**
 * 3. Tizim tilini o'zgartirish
 */
export async function updateLanguageAction(lang: string): Promise<ProfileActionResult> {
  try {
    await requirePlatformAdmin();

    const allowed = ["uz-latn", "uz-cyrl", "ru", "en"];
    if (!allowed.includes(lang)) {
      return { success: false, error: "Noto'g'ri til kodi tanlandi." };
    }

    const cookieStore = await cookies();
    cookieStore.set("NEXT_LOCALE", lang, {
      path: "/",
      maxAge: 60 * 60 * 24 * 365, // 1 yil
      httpOnly: false,
      sameSite: "lax",
    });

    const langNames: Record<string, string> = {
      "uz-latn": "O'zbekcha (Lotin)",
      "uz-cyrl": "Ўзбекча (Кирилл)",
      ru: "Русский",
      en: "English",
    };

    return {
      success: true,
      message: `Interfeys tili "${langNames[lang] || lang}" ga o'zgartirildi!`,
    };
  } catch (error) {
    console.error("[updateLanguageAction] Error:", error);
    return {
      success: false,
      error: "Tilni o'zgartirishda xatolik yuz berdi.",
    };
  }
}

/**
 * 4. Profil rasmini (Avatar) saqlash yoki o'chirish
 */
export async function updateAvatarAction(imageUrl: string | null): Promise<ProfileActionResult> {
  try {
    const authContext = await requirePlatformAdmin();

    if (authContext.profile.role !== "super_admin") {
      return {
        success: false,
        error: "Ruxsat etilmagan: Faqat Super Admin profil rasmini o'zgartirishi mumkin.",
      };
    }

    const currentUserId = authContext.user.id;

    await db
      .update(user)
      .set({
        image: imageUrl || null,
        updatedAt: new Date(),
      })
      .where(eq(user.id, currentUserId));

    revalidatePath("/admin");
    revalidatePath("/admin/profile");

    return {
      success: true,
      message: imageUrl
        ? "Profil rasmi muvaffaqiyatli saqlandi!"
        : "Profil rasmi o'chirildi.",
    };
  } catch (error) {
    console.error("[updateAvatarAction] Error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Rasm saqlashda xatolik yuz berdi.",
    };
  }
}
