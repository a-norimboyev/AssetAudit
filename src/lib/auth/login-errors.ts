/**
 * AssetAudit — Login Xatoliklari va Submission Guard Yordamchilari
 *
 * Ushbu modul HTTP va Better Auth xatoliklarini o'zbek tilidagi tushunarli
 * va xavfsiz xabarlarga xaritalaydi hamda takroriy so'rovlar himoyasi qoidalarini ta'minlaydi.
 */

export interface AuthErrorInput {
  status?: number;
  code?: string;
  message?: string;
}

/**
 * HTTP va Auth xatoliklarini xavfsiz va tushunarli o'zbekcha xabarlarga aylantirish
 */
export function mapLoginError(error: AuthErrorInput | null | undefined): string {
  if (!error) {
    return "Tizimga kirishda xatolik yuz berdi.";
  }

  // 1. Rate Limiting (429 Too Many Requests)
  if (error.status === 429) {
    return "Juda ko'p urinishlar qilindi. Iltimos, 1 daqiqadan so'ng qayta urinib ko'ring.";
  }

  // 2. Noto'g'ri hisob ma'lumotlari (401 Unauthorized / Invalid Credentials)
  if (
    error.status === 401 ||
    error.code === "INVALID_EMAIL_OR_PASSWORD" ||
    error.code === "INVALID_USERNAME_OR_PASSWORD"
  ) {
    return "Login, email yoki parol noto'g'ri kiritildi.";
  }

  // 3. Server yoki Baza uzilishi (500 Internal Server Error)
  if (error.status === 500) {
    return "Server yoki ma'lumotlar bazasi bilan ulanishda xatolik yuz berdi. Iltimos, birozdan so'ng qayta urinib ko'ring.";
  }

  // 4. Boshqa maxsus xatoliklar
  return error.message || "Tizimga kirishda xatolik yuz berdi.";
}

/**
 * Tarmoq yoki ulanish uzilishi xatosi (Network Error)
 */
export const NETWORK_ERROR_MESSAGE =
  "Serverga bog'lanib bo'lmadi. Internet yoki tarmoq ulanishingizni tekshiring.";
