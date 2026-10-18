/**
 * AssetAudit — Tashkilot Xodimlarini Validatsiya Qilish Moduli
 *
 * Faqat inspector va registrar rollarini qo'llab-quvvatlaydi.
 * Parol xavfsizlik qoidalarini tekshiradi.
 */

export function validateStaffPassword(password: string): { valid: boolean; error?: string } {
  if (password.length < 12) {
    return { valid: false, error: "Parol uzunligi kamida 12 ta belgidan iborat bo'lishi shart." };
  }
  if (!/[A-Z]/.test(password)) {
    return { valid: false, error: "Parolda kamida bitta bosh (katta) harf bo'lishi shart [A-Z]." };
  }
  if (!/[a-z]/.test(password)) {
    return { valid: false, error: "Parolda kamida bitta kichik harf bo'lishi shart [a-z]." };
  }
  if (!/[0-9]/.test(password)) {
    return { valid: false, error: "Parolda kamida bitta raqam bo'lishi shart [0-9]." };
  }
  if (!/[^A-Za-z0-9]/.test(password)) {
    return { valid: false, error: "Parolda kamida bitta maxsus belgi bo'lishi shart (!@#$%^&*...)." };
  }
  return { valid: true };
}

import crypto from "node:crypto";

export function validateUsername(username: string): { valid: boolean; error?: string } {
  const trimmed = username.trim();
  if (!trimmed) {
    return { valid: false, error: "Login (foydalanuvchi nomi) kiritilishi shart." };
  }
  if (trimmed.length < 3) {
    return { valid: false, error: "Login kamida 3 ta belgidan iborat bo'lishi shart." };
  }
  if (trimmed.length > 30) {
    return { valid: false, error: "Login 30 ta belgidan oshmasligi shart." };
  }
  if (!/^[a-zA-Z0-9_.]+$/.test(trimmed)) {
    return {
      valid: false,
      error: "Loginda faqat lotin harflari, raqamlar, pastki chiziq (_) va nuqta (.) bo'lishi mumkin.",
    };
  }
  if (trimmed.startsWith(".") || trimmed.endsWith(".")) {
    return { valid: false, error: "Login nuqta bilan boshlanishi yoki tugashi mumkin emas." };
  }
  if (trimmed.includes("..")) {
    return { valid: false, error: "Loginda ketma-ket ikkita nuqta bo'lishi mumkin emas." };
  }
  return { valid: true };
}

export function formatStaffUsername(orgCode: string, rawUsername: string): string {
  const cleanOrg = orgCode.trim().toLowerCase();
  const cleanUser = rawUsername.trim().toLowerCase();
  const prefix = `${cleanOrg}.`;
  if (cleanUser.startsWith(prefix)) {
    return cleanUser;
  }
  return `${prefix}${cleanUser}`;
}

export function generateInternalSystemEmail(username: string): string {
  return `${username.trim().toLowerCase()}@auth.assetaudit.uz`;
}

export function generateSecureTemporaryPassword(): string {
  const upper = "ABCDEFGHJKLMNPQRSTUVWXYZ";
  const lower = "abcdefghijkmnpqrstuvwxyz";
  const digits = "23456789";
  const special = "!@#$%^&*";
  const allChars = upper + lower + digits + special;

  const getRandomChar = (str: string) => str.charAt(crypto.randomInt(0, str.length));

  // Har bir toifadan kamida bittadan kafolatlangan belgi
  const guaranteed = [
    getRandomChar(upper),
    getRandomChar(lower),
    getRandomChar(digits),
    getRandomChar(special),
  ];

  // Qolgan 10 ta belgini tasodifiy to'ldirish (jami 14 belgi)
  const rest: string[] = [];
  for (let i = 0; i < 10; i++) {
    rest.push(getRandomChar(allChars));
  }

  // Fisher-Yates aralashtirish
  const combined = [...guaranteed, ...rest];
  for (let i = combined.length - 1; i > 0; i--) {
    const j = crypto.randomInt(0, i + 1);
    [combined[i], combined[j]] = [combined[j], combined[i]];
  }

  return combined.join("");
}

export interface StaffInput {
  fullName: string;
  username?: string;
  email?: string;
  role: string;
  password?: string;
}

export function validateStaffInput(
  input: Partial<StaffInput>,
  orgCode?: string
): {
  valid: boolean;
  errors: Record<string, string>;
  normalized: {
    fullName: string;
    username: string;
    email: string;
    role: "inspector" | "registrar";
    password?: string;
  };
} {
  const errors: Record<string, string> = {};

  const fullName = typeof input.fullName === "string" ? input.fullName.trim() : "";
  const rawUsername = typeof input.username === "string" ? input.username.trim() : "";
  const rawEmail = typeof input.email === "string" ? input.email.trim().toLowerCase() : "";
  const role = typeof input.role === "string" ? input.role.trim() : "";
  const password = typeof input.password === "string" ? input.password.trim() : "";

  if (!fullName || fullName.length < 3) {
    errors.fullName = "Xodimning to'liq ismi kamida 3 ta belgidan iborat bo'lishi shart.";
  }

  let finalUsername = "";
  let finalEmail = "";

  if (rawUsername) {
    if (rawUsername.includes("@")) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(rawUsername)) {
        errors.username = "To'g'ri email manzilini kiriting (masalan: xodim@gmail.com).";
      } else {
        finalEmail = rawUsername.toLowerCase();
        finalUsername = finalEmail;
      }
    } else {
      const userCheck = validateUsername(rawUsername);
      if (!userCheck.valid) {
        errors.username = userCheck.error!;
      } else {
        finalUsername = orgCode ? formatStaffUsername(orgCode, rawUsername) : rawUsername.toLowerCase();
        finalEmail = rawEmail || generateInternalSystemEmail(finalUsername);
      }
    }
  } else if (rawEmail) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(rawEmail)) {
      errors.email = "To'g'ri email manzilini kiriting.";
    } else {
      finalEmail = rawEmail;
      finalUsername = rawEmail.split("@")[0].toLowerCase();
    }
  } else {
    errors.username = "Xodim uchun kirish emaili kiritilishi shart.";
  }

  if (role !== "inspector" && role !== "registrar") {
    errors.role = "Faqat Inspektor yoki Moddiy javobgar shaxs (Registrar) rolini tanlash mumkin.";
  }

  if (password) {
    const passCheck = validateStaffPassword(password);
    if (!passCheck.valid) {
      errors.password = passCheck.error!;
    }
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors,
    normalized: {
      fullName,
      username: finalUsername,
      email: finalEmail,
      role: role === "inspector" ? "inspector" : "registrar",
      password: password || undefined,
    },
  };
}
