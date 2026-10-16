import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { username } from "better-auth/plugins";
import { db } from "@/lib/db";
import * as schema from "@/lib/db/schema";

/**
 * Autentifikatsiya maxfiy kalitini xavfsiz olish
 * Qat'iy talab: Hech qanday hardcoded fallback kalit bo'lmasligi shart.
 */
function getAuthSecret(): string {
  const secret = process.env.BETTER_AUTH_SECRET;
  if (!secret) {
    throw new Error(
      "AssetAudit: Xavfsizlik xatosi: BETTER_AUTH_SECRET muhit o'zgaruvchisi topilmadi. Tizim xavfsizligini ta'minlash uchun dastur to'xtatildi."
    );
  }
  if (secret.length < 32) {
    throw new Error(
      "AssetAudit: Xavfsizlik xatosi: BETTER_AUTH_SECRET kamida 32 belgidan iborat yuqori entropiyali kalit bo'lishi shart."
    );
  }
  return secret;
}

/**
 * Autentifikatsiya bazaviy URL manzilini olish
 * Qat'iy talab: Production muhitida aniq domen majburiy, lokal muhitda 3001 porti moslangan.
 */
function getAuthBaseUrl(): string {
  if (process.env.BETTER_AUTH_URL) {
    return process.env.BETTER_AUTH_URL;
  }
  if (process.env.NODE_ENV === "production") {
    throw new Error(
      "AssetAudit: Production muhitida BETTER_AUTH_URL aniq domen bilan belgilanishi shart (masalan: https://assetaudit.uz)."
    );
  }
  const port = process.env.PORT || "3001";
  return `http://localhost:${port}`;
}

/**
 * AssetAudit — Better Auth ishlab chiqarish konfiguratsiyasi
 * Mustaqil PostgreSQL va Drizzle ORM adapteriga asoslangan.
 */
export const auth = betterAuth({
  secret: getAuthSecret(),
  baseURL: getAuthBaseUrl(),
  database: drizzleAdapter(db, {
    provider: "pg",
    schema: {
      user: schema.user,
      session: schema.session,
      account: schema.account,
      verification: schema.verification,
    },
  }),
  emailAndPassword: {
    enabled: true,
    disableSignUp: true, // Qat'iy talab: Ochiq ro'yxatdan o'tish yopiq (faqat adminlar taklif qiladi)
  },
  plugins: [
    username({
      minUsernameLength: 3,
      maxUsernameLength: 30,
      displayUsername: true,
    }),
  ],
  session: {
    expiresIn: 60 * 60 * 24 * 7, // 7 kunlik sessiya muddati
    updateAge: 60 * 60 * 24, // 1 kunda bir marta yangilash
    cookieCache: {
      enabled: false, // Qat'iy talab: Bloklangan (is_active = false) xodim sessiyasi kesh tufayli ochiq qolmasligi uchun
    },
  },
  rateLimit: {
    enabled: process.env.RATE_LIMIT_ENABLED !== "false",
    window: 60, // 60 soniya
    max: 100, // Xavfsiz brute-force chegarasi (E2E testlar va normal yuklama uchun moslangan)
  },
  advanced: {
    useSecureCookies: process.env.NODE_ENV === "production",
    cookiePrefix: "assetaudit",
  },
});

export type Session = typeof auth.$Infer.Session.session;
export type User = typeof auth.$Infer.Session.user;
