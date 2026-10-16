import fs from "node:fs";
import path from "node:path";
import readline from "node:readline";
import { Pool } from "pg";
import { drizzle } from "drizzle-orm/node-postgres";
import { eq, sql } from "drizzle-orm";
import { hashPassword } from "better-auth/crypto";
import { generateId } from "better-auth";
import { user, account } from "../src/lib/db/schema/auth";
import { profiles } from "../src/lib/db/schema/profiles";
import * as schema from "../src/lib/db/schema";

/**
 * Xavfsiz .env.bootstrap faylini yuklash (faqat CLI uchun, Next.js ga aralashmaydi)
 */
function loadBootstrapEnv(): void {
  const envBootstrapPath = path.resolve(process.cwd(), ".env.bootstrap");
  if (fs.existsSync(envBootstrapPath)) {
    const lines = fs.readFileSync(envBootstrapPath, "utf8").split("\n");
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

/**
 * 1. Email formatini tekshirish
 */
export function validateEmail(email: string): { valid: boolean; error?: string } {
  const trimmed = email.trim();
  if (!trimmed) {
    return { valid: false, error: "Email manzili kiritilishi shart." };
  }
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(trimmed)) {
    return { valid: false, error: "Email manzili formati noto'g'ri (masalan: admin@mulknazorat.uz)." };
  }
  return { valid: true };
}

/**
 * 2. To'liq ism (Full Name) tekshiruvi
 */
export function validateFullName(name: string): { valid: boolean; error?: string } {
  const trimmed = name.trim();
  if (!trimmed || trimmed.length < 3) {
    return { valid: false, error: "To'liq ism kamida 3 ta belgidan iborat bo'lishi shart." };
  }
  return { valid: true };
}

/**
 * 3. Parol murakkabligini tekshirish (Security Best Practice)
 * Qat'iy talab:
 * - Kamida 12 ta belgi
 * - Katta harf [A-Z]
 * - Kichik harf [a-z]
 * - Raqam [0-9]
 * - Maxsus belgi
 */
export function validatePassword(password: string): { valid: boolean; error?: string } {
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

export interface BootstrapAuditResult {
  ready: boolean;
  databaseName: string;
  postgresVersion: string;
  superAdminCount: number;
  existingTables: string[];
  missingTables: string[];
  cryptoHashingVerified: boolean;
  issues: string[];
}

const REQUIRED_TABLES = [
  "account",
  "organization_types",
  "organizations",
  "profiles",
  "session",
  "user",
  "verification",
];

/**
 * 4. Ma'lumotlar bazasi va muhit auditini o'tkazish (Dry-Run Diagnostikasi)
 */
export async function auditBootstrapPreconditions(pool: Pool): Promise<BootstrapAuditResult> {
  const issues: string[] = [];

  // 1. Bazaga ulanish va versiyani aniqlash
  const dbInfoRes = await pool.query(
    "SELECT current_database() as db_name, version() as pg_version, current_user as cur_user"
  );
  const databaseName = dbInfoRes.rows[0]?.db_name || "unknown";
  const postgresVersion = dbInfoRes.rows[0]?.pg_version || "unknown";

  // 2. Jadvallar mavjudligini tekshirish
  const tablesRes = await pool.query(
    "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'"
  );
  const existingTables: string[] = tablesRes.rows.map((r: { table_name: string }) => r.table_name);
  const missingTables = REQUIRED_TABLES.filter((t) => !existingTables.includes(t));

  if (missingTables.length > 0) {
    issues.push(`Zarur jadvallar yetishmaydi: ${missingTables.join(", ")}`);
  }

  // 3. Super Admin mavjudligini tekshirish
  let superAdminCount = 0;
  if (existingTables.includes("profiles")) {
    const adminCheckRes = await pool.query(
      "SELECT COUNT(*)::int as cnt FROM profiles WHERE role = 'super_admin'"
    );
    superAdminCount = adminCheckRes.rows[0]?.cnt || 0;
    if (superAdminCount > 0) {
      issues.push(`Tizimda allaqachon ${superAdminCount} ta Super Admin mavjud. Takroriy Super Admin yaratish taqiqlanadi.`);
    }
  } else {
    issues.push("profiles jadvali topilmadi.");
  }

  // 4. Better Auth crypto hashing tekshiruvi
  let cryptoHashingVerified = false;
  try {
    const testHash = await hashPassword("MulkNazorat_Verification_Test_2026!");
    if (typeof testHash === "string" && testHash.length > 32) {
      cryptoHashingVerified = true;
    } else {
      issues.push("Better Auth crypto hashing algoritmi kutilmagan format qaytardi.");
    }
  } catch (err) {
    issues.push(`Better Auth crypto xatosi: ${err instanceof Error ? err.message : String(err)}`);
  }

  return {
    ready: issues.length === 0,
    databaseName,
    postgresVersion,
    superAdminCount,
    existingTables,
    missingTables,
    cryptoHashingVerified,
    issues,
  };
}

/**
 * Terminalda parolni yashirgan holda xavfsiz o'qish (Interaktiv)
 */
export function readHiddenInput(promptText: string): Promise<string> {
  return new Promise((resolve) => {
    // Agar no-tty yoki test muhitida bo'lsa oddiy readline
    if (!process.stdin.isTTY) {
      const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
      });
      rl.question(promptText, (ans) => {
        rl.close();
        resolve(ans.trim());
      });
      return;
    }

    process.stdout.write(promptText);
    let input = "";
    process.stdin.setRawMode(true);
    process.stdin.resume();

    const onData = (charBuffer: Buffer) => {
      const str = charBuffer.toString("utf8");
      for (const char of str) {
        if (char === "\n" || char === "\r" || char === "\u0004") {
          process.stdin.setRawMode(false);
          process.stdin.removeListener("data", onData);
          process.stdout.write("\n");
          resolve(input);
          return;
        } else if (char === "\u0003") {
          // Ctrl+C
          process.stdin.setRawMode(false);
          process.exit(1);
        } else if (char === "\u007f" || char === "\b") {
          if (input.length > 0) {
            input = input.slice(0, -1);
            process.stdout.write("\b \b");
          }
        } else {
          input += char;
          process.stdout.write("*");
        }
      }
    };

    process.stdin.on("data", onData);
  });
}

function readLineInput(promptText: string): Promise<string> {
  return new Promise((resolve) => {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });
    rl.question(promptText, (ans) => {
      rl.close();
      resolve(ans.trim());
    });
  });
}

/**
 * CLI Asosiy Kirish Nuqtasi
 */
export async function runCli(): Promise<void> {
  const args = process.argv.slice(2);
  const isExecute = args.includes("--execute");
  const isDryRun = args.includes("--dry-run") || !isExecute;

  console.log("==================================================================");
  console.log("  MulkNazorat — Platforma Bosh Administratori (Super Admin) Bootstrap");
  console.log("==================================================================\n");

  loadBootstrapEnv();

  const connectionString =
    process.env.BOOTSTRAP_DATABASE_URL ||
    process.env.MIGRATOR_URL ||
    process.env.DATABASE_URL;

  if (!connectionString) {
    console.error("XATO: PostgreSQL ulanish manzili (DATABASE_URL yoki BOOTSTRAP_DATABASE_URL) topilmadi.");
    console.error("Masalan: set DATABASE_URL=postgres://mulknazorat_migrator:parol@localhost:5432/mulknazorat");
    process.exit(1);
  }

  const pool = new Pool({
    connectionString,
    max: 2,
    connectionTimeoutMillis: 5000,
  });

  try {
    console.log("1. Ma'lumotlar bazasi va muhit talablari tekshirilmoqda (Audit)...");
    const audit = await auditBootstrapPreconditions(pool);

    console.log(`- Ma'lumotlar bazasi: [${audit.databaseName}]`);
    console.log(`- PostgreSQL versiyasi: ${audit.postgresVersion.split(" on ")[0]}`);
    console.log(`- Asosiy jadvallar: ${audit.existingTables.length} ta mavjud (${audit.missingTables.length} ta yetishmaydi)`);
    console.log(`- Mavjud Super Adminlar soni: ${audit.superAdminCount} ta`);
    console.log(`- Better Auth crypto hashing: ${audit.cryptoHashingVerified ? "Muvaffaqiyatli (scrypt)" : "Nosozlik"}`);

    if (audit.issues.length > 0) {
      console.log("\nTopilgan muammolar:");
      audit.issues.forEach((iss) => console.log(`  [!] ${iss}`));
    }

    if (isDryRun) {
      console.log("\n------------------------------------------------------------------");
      console.log("  DRY-RUN NATIJASI:");
      if (audit.ready) {
        console.log("  STATUS: TAYYOR (READY)");
        console.log("  Tizim birinchi Super Admin'ni yaratishga to'liq tayyor.");
        console.log("  Ma'lumotlar bazasiga hech qanday o'zgartirish kiritilmadi.");
        console.log("  Haqiqiy Super Admin yaratish uchun skriptni --execute parametri bilan ishga tushiring.");
      } else {
        console.log("  STATUS: TO'XTATILDI (BLOCKED)");
        console.log("  Tizim Super Admin yaratishga tayyor emas. Yuqoridagi xatoliklarni bartaraf eting.");
      }
      console.log("------------------------------------------------------------------\n");
      await pool.end();
      process.exit(audit.ready ? 0 : 1);
    }

    // --execute rejimi (faqat Bosqich 1C-E.2 uchun)
    if (!audit.ready) {
      console.error("\nXATO: Audit talablari bajarilmadi. Jarayon to'xtatildi.");
      await pool.end();
      process.exit(1);
    }

    console.log("\nDIQQAT: Siz haqiqiy Super Admin akkauntini yaratish rejimidasiz (--execute).");
    console.log("Ushbu foydalanuvchi platformaning birinchi va yagona bosh boshqaruvchisi bo'ladi.\n");

    const email = await readLineInput("Admin Email: ");
    const emailCheck = validateEmail(email);
    if (!emailCheck.valid) {
      console.error(`XATO: ${emailCheck.error}`);
      await pool.end();
      process.exit(1);
    }

    const fullName = await readLineInput("To'liq ism (Full Name): ");
    const nameCheck = validateFullName(fullName);
    if (!nameCheck.valid) {
      console.error(`XATO: ${nameCheck.error}`);
      await pool.end();
      process.exit(1);
    }

    const password = await readHiddenInput("Xavfsiz parol (terminalda ko'rinmaydi): ");
    const passCheck = validatePassword(password);
    if (!passCheck.valid) {
      console.error(`XATO: ${passCheck.error}`);
      await pool.end();
      process.exit(1);
    }

    const confirmPassword = await readHiddenInput("Parolni qayta tasdiqlang: ");
    if (password !== confirmPassword) {
      console.error("XATO: Kiritilgan parollar bir-biriga mos kelmadi.");
      await pool.end();
      process.exit(1);
    }

    console.log("\nParol Better Auth rasmiy xeshlash algoritmi (scrypt) orqali xeshlanmoqda...");
    const passwordHash = await hashPassword(password);

    console.log("Tranzaksiya ochilmoqda va yozuvlar kiritilmoqda (user, account, profiles)...");
    const db = drizzle(pool, { schema });

    await db.transaction(async (tx) => {
      // 0. PostgreSQL Transaction-Level Advisory Lock (Concurrency va Race Condition himoyasi)
      // Ikkita parallel bootstrap bir vaqtda ishga tushsa ham faqat bittasi lock oladi va bajariladi.
      await tx.execute(sql`SELECT pg_advisory_xact_lock(7429184710293847);`);

      // 1. Qayta tekshirish (tranzaksiya ichida)
      const existingAdmins = await tx
        .select()
        .from(profiles)
        .where(eq(profiles.role, "super_admin"))
        .limit(1);

      if (existingAdmins.length > 0) {
        throw new Error("Xavfsizlik himoyasi: Tranzaksiya ichida mavjud Super Admin aniqlandi.");
      }

      const existingUsers = await tx
        .select()
        .from(user)
        .where(eq(user.email, email.toLowerCase().trim()))
        .limit(1);

      if (existingUsers.length > 0) {
        throw new Error("Xavfsizlik himoyasi: Ushbu email bilan foydalanuvchi allaqachon mavjud.");
      }

      const userId = generateId();
      const accountId = generateId();
      const now = new Date();

      // 2. user jadvaliga yozish
      await tx.insert(user).values({
        id: userId,
        name: fullName.trim(),
        email: email.toLowerCase().trim(),
        emailVerified: true,
        image: null,
        createdAt: now,
        updatedAt: now,
      });

      // 3. account jadvaliga credential hisobini bog'lash
      await tx.insert(account).values({
        id: accountId,
        userId: userId,
        accountId: userId,
        providerId: "credential",
        password: passwordHash,
        createdAt: now,
        updatedAt: now,
      });

      // 4. profiles jadvaliga super_admin biznes profilini kiritish
      await tx.insert(profiles).values({
        userId: userId,
        organizationId: null,
        role: "super_admin",
        fullName: fullName.trim(),
        isActive: true,
        createdAt: now,
        updatedAt: now,
      });
    });

    console.log("\n==================================================================");
    console.log("  MUVAFFAQIYATLI! Super Admin muvaffaqiyatli yaratildi.");
    console.log(`  Email: ${email.toLowerCase().trim()}`);
    console.log(`  Rol: super_admin`);
    console.log("  Hech qanday maxfiy ma'lumot yoki parol loglarga chiqarilmadi.");
    console.log("==================================================================\n");

    await pool.end();
    process.exit(0);
  } catch (err) {
    console.error("\nKUTILMAGAN XATOLIK:");
    console.error(err instanceof Error ? err.message : String(err));
    await pool.end();
    process.exit(1);
  }
}

// Skript to'g'ridan-to'g'ri chaqirilganda ishga tushirish
if (
  process.argv[1]?.includes("bootstrap-super-admin") ||
  process.argv[1]?.endsWith("bootstrap-super-admin.ts")
) {
  runCli();
}
