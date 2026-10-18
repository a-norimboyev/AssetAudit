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
 * CSRF xavfsizligi uchun ruxsat etilgan Origin manzillarini aniqlash.
 * Qat'iy qoidalar:
 * 1. Production'da faqat rasmiy https://assetaudit.uz va BETTER_AUTH_URL qabul qilinadi.
 * 2. Localhost va 127.0.0.1 originlariga FAQAT development va test muhitida ruxsat beriladi.
 * 3. Wildcard (*) yoki barcha originlarga ruxsat berish qat'iyan taqiqlangan.
 */
export function getTrustedOrigins(): string[] {
  const isProduction = process.env.NODE_ENV === "production";
  const baseUrl = process.env.BETTER_AUTH_URL;
  const origins = new Set<string>();

  if (isProduction) {
    origins.add("https://assetaudit.uz");
    origins.add("https://www.assetaudit.uz");
    if (baseUrl && baseUrl.startsWith("https://")) {
      origins.add(baseUrl.replace(/\/$/, ""));
    }
    return Array.from(origins);
  }

  // Development va Test muhiti
  if (baseUrl) {
    origins.add(baseUrl.replace(/\/$/, ""));
  }
  origins.add("http://localhost:3000");
  origins.add("http://localhost:3001");
  origins.add("http://localhost:3005");
  origins.add("http://127.0.0.1:3000");
  origins.add("http://127.0.0.1:3001");
  origins.add("http://127.0.0.1:3005");

  return Array.from(origins);
}

/**
 * AssetAudit — Better Auth ishlab chiqarish konfiguratsiyasi
 * Mustaqil PostgreSQL va Drizzle ORM adapteriga asoslangan.
 */
export const auth = betterAuth({
  secret: getAuthSecret(),
  baseURL: getAuthBaseUrl(),
  trustedOrigins: getTrustedOrigins(),
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
      maxUsernameLength: 60,
      displayUsername: true,
      usernameValidator: (u: string) => /^[a-zA-Z0-9_.@-]{3,60}$/.test(u),
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
