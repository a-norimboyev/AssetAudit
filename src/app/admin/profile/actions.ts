"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { requirePlatformAdmin } from "@/lib/auth/authorization";
import { db } from "@/lib/db";
import { user, account } from "@/lib/db/schema/auth";
import { eq, and, ne, or } from "drizzle-orm";
import { hashPassword, verifyPassword } from "better-auth/crypto";
import { logSecurityAudit } from "@/lib/audit/logger";

export interface ProfileActionResult {
  success: boolean;
  message?: string;
  error?: string;
}

/**
 * 1. Kirish emailini (Gmail) yoki foydalanuvchi nomini o'zgartirish
 */
export async function updateUsernameAction(newEmailOrUsername: string): Promise<ProfileActionResult> {
  try {
    const authContext = await requirePlatformAdmin();
    const currentUserId = authContext.user.id;

    const trimmed = (newEmailOrUsername || "").trim().toLowerCase();

    // Validatsiya
    if (!trimmed || trimmed.length < 3) {
      return {
        success: false,
        error: "Kirish emaili kamida 3 ta belgidan iborat bo'lishi kerak.",
      };
    }

    const isEmail = trimmed.includes("@");
    if (isEmail) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(trimmed)) {
        return {
          success: false,
          error: "To'g'ri email manzilini kiriting (masalan: admin@gmail.com).",
        };
      }
    } else if (!/^[a-z0-9._-]+$/.test(trimmed)) {
      return {
        success: false,
        error: "Email yoki nom faqat kichik lotin harflari, raqamlar, nuqta va chiziqchadan iborat bo'lishi mumkin.",
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
        error: "Ushbu email/login allaqachon band. Iltimos, boshqa email tanlang.",
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
        action: "LOGIN_EMAIL_CHANGED",
        newEmailOrUsername: trimmed,
      },
    });

    revalidatePath("/admin");
    revalidatePath("/admin/profile");
    revalidatePath("/admin/administrators");

    return {
      success: true,
      message: `Kirish emaili muvaffaqiyatli "${trimmed}" ga o'zgartirildi!`,
    };
  } catch (error) {
    console.error("[updateUsernameAction] Error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Emailni o'zgartirishda xatolik yuz berdi.",
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
