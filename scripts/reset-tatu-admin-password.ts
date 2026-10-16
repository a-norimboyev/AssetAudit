/**
 * AssetAudit — tatu.admin Parol Reset Skripti (Sprint 11 / 45X)
 * Maqsad: FAQAT mavjud tatu.admin hisobi parolini xavfsiz yangilash
 *
 * XAVFSIZLIK QOIDALARI:
 * - Yangi hisob YARATMAYDI. Faqat mavjud tatu.admin bo'lsagina ishlaydi.
 * - Yangi parol FAQAT TTY (yashirin kiritish) orqali qabul qilinadi.
 * - Parol hech qachon stdout/stderr ga chiqarilmaydi va AI ga ko'rinmaydi.
 * - Better Auth rasmiy scrypt algoritmi (better-auth/crypto) orqali xeshlanadi.
 * - Mavjud barcha faol sessiyalar bekor qilinadi (session jadvalidan o'chiriladi).
 * - Boshqa foydalanuvchilarga mutlaqo tegilmaydi.
 */

import * as fs from "node:fs";
import * as path from "node:path";
import * as readline from "node:readline";
import { Pool } from "pg";
import { drizzle } from "drizzle-orm/node-postgres";
import { eq } from "drizzle-orm";
import { hashPassword } from "better-auth/crypto";
import * as schema from "../src/lib/db/schema/index";

const { user, account, session, profiles } = schema;

/**
 * .env.local faylini yuklash
 */
function loadBootstrapEnv(): void {
  const candidates = [
    path.resolve(process.cwd(), ".env.local"),
    path.resolve(process.cwd(), ".env.bootstrap"),
    path.resolve(process.cwd(), ".env"),
  ];

  for (const envPath of candidates) {
    if (fs.existsSync(envPath)) {
      const lines = fs.readFileSync(envPath, "utf8").split("\n");
      for (const line of lines) {
        const trimmed = line.trim();
        if (trimmed && !trimmed.startsWith("#") && trimmed.includes("=")) {
          const eqIdx = trimmed.indexOf("=");
          const key = trimmed.slice(0, eqIdx).trim();
          const val = trimmed.slice(eqIdx + 1).trim();
          if (key && !process.env[key]) {
            process.env[key] = val;
          }
        }
      }
    }
  }
}

// ── Yashirin parol kiritish (TTY, echo yo'q) ──────────────────────────────
function readHiddenInput(prompt: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
      terminal: true,
    });
    process.stdout.write(prompt);
    let password = "";
    process.stdin.setRawMode(true);
    process.stdin.resume();
    process.stdin.on("data", (char) => {
      const c = char.toString();
      if (c === "\n" || c === "\r" || c === "\u0004") {
        process.stdin.setRawMode(false);
        process.stdout.write("\n");
        rl.close();
        resolve(password);
      } else if (c === "\u007F" || c === "\b") {
        if (password.length > 0) {
          password = password.slice(0, -1);
          process.stdout.clearLine(0);
          process.stdout.cursorTo(0);
          process.stdout.write(prompt + "*".repeat(password.length));
        }
      } else {
        password += c;
        process.stdout.write("*");
      }
    });
    process.stdin.on("error", reject);
  });
}

// ── Parol validatsiyasi ───────────────────────────────────────────────────
function validatePassword(p: string): { valid: boolean; error?: string } {
  if (p.length < 10) return { valid: false, error: "Kamida 10 belgi bo'lishi shart." };
  if (!/[A-Z]/.test(p)) return { valid: false, error: "Kamida 1 ta katta harf bo'lishi kerak." };
  if (!/[a-z]/.test(p)) return { valid: false, error: "Kamida 1 ta kichik harf bo'lishi kerak." };
  if (!/[0-9]/.test(p)) return { valid: false, error: "Kamida 1 ta raqam bo'lishi kerak." };
  return { valid: true };
}

async function main() {
  loadBootstrapEnv();

  const DATABASE_URL = process.env.DATABASE_URL;
  if (!DATABASE_URL) {
    console.error("XATO: DATABASE_URL muhit o'zgaruvchisi topilmadi (.env.local faylini tekshiring).");
    process.exit(1);
  }

  // Ulanish porti va hostini diagnostika uchun ajratib olish (parolsiz)
  let dbTargetInfo = "Noma'lum";
  try {
    const parsed = new URL(DATABASE_URL);
    dbTargetInfo = `${parsed.hostname}:${parsed.port || "5432"}/${parsed.pathname.replace(/^\//, "")}`;
  } catch {
    dbTargetInfo = "URL formati maxsus";
  }

  console.log("");
  console.log("==================================================================");
  console.log("  ASSETAUDIT — tatu.admin Parol Reset (Sprint 11)");
  console.log(`  Target DB: [${dbTargetInfo}]`);
  console.log("==================================================================");
  console.log("");

  const pool = new Pool({ connectionString: DATABASE_URL, max: 1 });
  const db = drizzle(pool, { schema });

  try {
    // 1. Ulanishni tekshir
    console.log("[1/5] Ma'lumotlar bazasi ulanishi tekshirilmoqda...");
    const connCheck = await pool.query("SELECT current_database() as db_name, current_user as db_user;");
    const activeDbName = connCheck.rows[0]?.db_name;
    const activeDbUser = connCheck.rows[0]?.db_user;
    console.log(`      OK — Ulangan DB: [${activeDbName}], Foydalanuvchi: [${activeDbUser}]`);

    // 2. tatu.admin mavjudligini QAT'IY tekshir (yangi yaratilmaydi!)
    console.log("[2/5] tatu.admin mavjudligi tekshirilmoqda...");
    const [targetUser] = await db
      .select({ id: user.id, username: user.username, email: user.email, name: user.name })
      .from(user)
      .where(eq(user.username, "tatu.admin"))
      .limit(1);

    if (!targetUser) {
      console.error("");
      console.error("==================================================================");
      console.error("  QAT'IY TO'XTATILDI: tatu.admin ushbu bazada topilmadi!");
      console.error(`  Joriy ulanish: [${dbTargetInfo}]`);
      console.error("  Eslatma: Agar bu VPS production bazasi bo'lsa, SSH tunnel");
      console.error("  (ssh -N -L 5433:127.0.0.1:5432 deployer@<vps-host>) faolligini");
      console.error("  va .env.local to'g'ri sozlanganini tekshiring.");
      console.error("  Xavfsizlik qoidasi: Yangi hisob avtomatik yaratilmaydi.");
      console.error("==================================================================");
      console.error("");
      await pool.end();
      process.exit(1);
    }

    const [targetAccount] = await db
      .select({ id: account.id })
      .from(account)
      .where(eq(account.userId, targetUser.id))
      .limit(1);

    if (!targetAccount) {
      console.error("XATO: tatu.admin uchun credential account topilmadi.");
      await pool.end();
      process.exit(1);
    }

    const [targetProfile] = await db
      .select({
        role: profiles.role,
        fullName: profiles.fullName,
        orgId: profiles.organizationId,
        isActive: profiles.isActive,
      })
      .from(profiles)
      .where(eq(profiles.userId, targetUser.id))
      .limit(1);

    console.log(`      OK — tatu.admin topildi:`);
    console.log(`           ID: ${targetUser.id.substring(0, 8)}...`);
    console.log(`           Ism: ${targetProfile?.fullName || targetUser.name}`);
    console.log(`           Rol: ${targetProfile?.role}`);
    console.log(`           Status: ${targetProfile?.isActive ? "FAOL" : "BLOKLANGAN"}`);

    // Mavjud sessiyalar
    const existingSessions = await db
      .select({ id: session.id })
      .from(session)
      .where(eq(session.userId, targetUser.id));

    console.log(`      Mavjud faol sessiyalar: ${existingSessions.length} ta (barchasi bekor qilinadi)`);

    // 3. Yangi parolni yashirin kiritish
    console.log("");
    console.log("[3/5] Yangi doimiy parol kiriting (ekranda ko'rinmaydi):");
    console.log("      Talablar: ≥10 belgi, katta+kichik harf, raqam");
    console.log("");

    let newPassword = "";
    let confirmPassword = "";

    for (let attempt = 0; attempt < 3; attempt++) {
      newPassword = await readHiddenInput("      Yangi parol: ");
      const v = validatePassword(newPassword);
      if (!v.valid) {
        console.log(`      XATO: ${v.error} Qayta urinib ko'ring.`);
        continue;
      }
      confirmPassword = await readHiddenInput("      Qayta tasdiqlang: ");
      if (newPassword !== confirmPassword) {
        console.log("      XATO: Parollar mos kelmadi. Qayta urinib ko'ring.");
        continue;
      }
      break;
    }

    if (!newPassword || newPassword !== confirmPassword) {
      console.error("XATO: Parol kiritish muvaffaqiyatsiz tugadi.");
      await pool.end();
      process.exit(1);
    }

    // 4. Tranzaksiya: faqat ushbu foydalanuvchi parolini yangilash + force logout
    console.log("");
    console.log("[4/5] Parol Better Auth rasmiy scrypt orqali xeshlanmoqda...");
    const passwordHash = await hashPassword(newPassword);
    const now = new Date();

    await db.transaction(async (tx) => {
      // Parolni yangilash
      await tx
        .update(account)
        .set({ password: passwordHash, updatedAt: now })
        .where(eq(account.userId, targetUser.id));

      // must_change_password ni false qilish (chunki o'zi doimiy parol o'rnatdi)
      await tx
        .update(profiles)
        .set({ mustChangePassword: false, updatedAt: now })
        .where(eq(profiles.userId, targetUser.id));

      // Barcha eski sessiyalarni bekor qilish
      await tx.delete(session).where(eq(session.userId, targetUser.id));
    });

    // 5. Natijani tekshirish (READ-ONLY)
    console.log("[5/5] Tekshirilmoqda...");
    const [updatedAccount] = await db
      .select({ id: account.id, updatedAt: account.updatedAt })
      .from(account)
      .where(eq(account.userId, targetUser.id))
      .limit(1);

    const remainingSessions = await db
      .select({ id: session.id })
      .from(session)
      .where(eq(session.userId, targetUser.id));

    console.log("");
    console.log("==================================================================");
    console.log("  MUVAFFAQIYATLI! tatu.admin doimiy paroli yangilandi.");
    console.log(`  Account yangilangan vaqti: ${updatedAccount?.updatedAt?.toISOString()}`);
    console.log(`  Bekor qilingan sessiyalar: ${existingSessions.length} ta`);
    console.log(`  Qolgan sessiyalar: ${remainingSessions.length} ta (0 bo'lishi shart)`);
    console.log("  must_change_password = false (doimiy parol qabul qilindi)");
    console.log("  Boshqa foydalanuvchilarga mutlaqo tegilmadi.");
    console.log("  Keyingi qadam: http://localhost:3001/login sahifasida kiring.");
    console.log("==================================================================");
    console.log("");

    await pool.end();
    process.exit(0);
  } catch (err) {
    console.error("KUTILMAGAN XATOLIK:", err instanceof Error ? err.message : String(err));
    await pool.end();
    process.exit(1);
  }
}

main();
