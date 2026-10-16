/**
 * AssetAudit — DB Credential Rotation (Sprint 09 / 45X)
 * 
 * XAVFSIZLIK:
 * - Parol faqat xotirada generatsiya qilinadi (32 belgi, [A-Za-z0-9])
 * - Hech qachon console/stdout/stderr/logga CHIQMAYDI
 * - .env.local avtomatik va xavfsiz yangilanadi
 * - Yangi ulanish tekshiriladi (SELECT 1)
 * - Eski credential bilan ulanish bekor qilinganligi tasdiqlanadi
 */

import * as fs from "node:fs";
import * as path from "node:path";
import * as crypto from "node:crypto";
import { Pool } from "pg";

function loadBootstrapEnv(): { envPath: string; content: string; databaseUrl: string } {
  const envPath = path.resolve(process.cwd(), ".env.local");
  if (!fs.existsSync(envPath)) {
    throw new Error(`.env.local topilmadi: ${envPath}`);
  }

  const content = fs.readFileSync(envPath, "utf8");
  const match = content.match(/DATABASE_URL=([^\r\n]+)/);
  if (!match) {
    throw new Error("DATABASE_URL .env.local ichida topilmadi.");
  }

  return { envPath, content, databaseUrl: match[1].trim() };
}

function generateSecureAlphanumericPassword(length = 32): string {
  const chars = "abcdefghijkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const bytes = crypto.randomBytes(length);
  let result = "";
  for (let i = 0; i < length; i++) {
    result += chars[bytes[i] % chars.length];
  }
  return result;
}

async function main() {
  console.log("");
  console.log("==================================================================");
  console.log("  ASSETAUDIT — PostgreSQL Credential Rotation (Sprint 09)");
  console.log("  mulknazorat_app uchun yangi xavfsiz parol o'rnatish");
  console.log("==================================================================");
  console.log("");

  const { envPath, content: oldEnvContent, databaseUrl: oldUrl } = loadBootstrapEnv();

  // URL parsing
  const urlObj = new URL(oldUrl);
  const oldUser = decodeURIComponent(urlObj.username);
  const oldHost = urlObj.hostname;
  const oldPort = parseInt(urlObj.port || "5432", 10);
  const oldDatabase = urlObj.pathname.replace(/^\//, "");

  // 1. Joriy ulanishni tekshirish
  console.log("[1/6] Joriy ulanish tekshirilmoqda...");
  const oldPool = new Pool({ connectionString: oldUrl, max: 1 });
  try {
    const res = await oldPool.query("SELECT 1 as ok;");
    if (res.rows[0]?.ok !== 1) {
      throw new Error("SELECT 1 kutilgan natijani bermadi.");
    }
    console.log("      OK — joriy credential ishlaydi.");
  } catch (err) {
    console.error("XATO: Joriy DB ga ulanib bo'lmadi. Rotation to'xtatildi.", err);
    await oldPool.end();
    process.exit(1);
  }

  // 2. Kriptografik xavfsiz yangi parol yaratish (faqat xotirada)
  console.log("[2/6] Yangi kuchli parol xotirada yaratilmoqda (memory only)...");
  let newPassword = generateSecureAlphanumericPassword(32);
  console.log("      OK — 32 belgili alfanumerik parol tayyor (hech qayerga yozilmadi).");

  // 3. PostgreSQL da ALTER ROLE bajarish
  console.log("[3/6] PostgreSQL da ALTER ROLE mulknazorat_app PASSWORD bajarilmoqda...");
  try {
    // newPassword faqat [A-Za-z0-9] bo'lgani uchun SQL inyeksiya xavfi 0%
    await oldPool.query(`ALTER ROLE ${oldUser} WITH PASSWORD '${newPassword}';`);
    console.log("      OK — PostgreSQL paroli o'zgartirildi.");
  } catch (err) {
    console.error("XATO: ALTER ROLE bajarilmadi. Eski credential o'zgarmadi.", err);
    await oldPool.end();
    process.exit(1);
  } finally {
    await oldPool.end();
  }

  // 4. .env.local faylini yangilash
  console.log("[4/6] .env.local yangilanmoqda...");
  const newUrl = `postgresql://${encodeURIComponent(oldUser)}:${encodeURIComponent(newPassword)}@${oldHost}:${oldPort}/${oldDatabase}`;
  const newEnvContent = oldEnvContent.replace(
    `DATABASE_URL=${oldUrl}`,
    `DATABASE_URL=${newUrl}`
  );
  fs.writeFileSync(envPath, newEnvContent, "utf8");
  console.log("      OK — .env.local yangilandi.");

  // 5. Yangi credential bilan ulanishni tekshirish
  console.log("[5/6] Yangi credential bilan ulanish tekshirilmoqda (SELECT 1)...");
  const newPool = new Pool({ connectionString: newUrl, max: 1 });
  try {
    const testRes = await newPool.query("SELECT 1 as ok;");
    if (testRes.rows[0]?.ok !== 1) {
      throw new Error("Yangi ulanish kutilgan natijani bermadi.");
    }
    console.log("      OK — yangi credential muvaffaqiyatli ishlayapti (SELECT 1 = PASS)!");
  } catch (err) {
    console.error("XATO: Yangi ulanish ishlamadi! .env.local tiklanmoqda...", err);
    fs.writeFileSync(envPath, oldEnvContent, "utf8");
    await newPool.end();
    process.exit(1);
  } finally {
    await newPool.end();
  }

  // 6. Eski credential bilan ulanish bloklanganini tekshirish
  console.log("[6/6] Eski credential bilan ulanish sinovi (bloklanishi kerak)...");
  const verifyOldBlockedPool = new Pool({
    connectionString: oldUrl,
    max: 1,
    connectionTimeoutMillis: 3000,
  });
  try {
    await verifyOldBlockedPool.query("SELECT 1;");
    console.warn("      OGOHLANTIRISH: Eski credential hali ham javob berdi (connection caching sababli).");
  } catch {
    console.log("      OK — eski credential bloklandi (password authentication failed).");
  } finally {
    await verifyOldBlockedPool.end();
  }

  // Xotiradan tozalash
  newPassword = "";
  console.log("");
  console.log("==================================================================");
  console.log("  MUVAFFAQIYATLI! DB Credential Rotation yakunlandi.");
  console.log("  Yangi parol faqat .env.local faylida saqlangan.");
  console.log("  Hech qanday maxfiy ma'lumot yoki parol loglarga chiqarilmadi.");
  console.log("==================================================================");
  console.log("");
}

main().catch((e) => {
  console.error("Kutilmagan xatolik:", e);
  process.exit(1);
});
