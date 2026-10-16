import fs from "node:fs";
import path from "node:path";
import readline from "node:readline";
import crypto from "node:crypto";
import { Pool } from "pg";
import { drizzle } from "drizzle-orm/node-postgres";
import { eq, or, sql } from "drizzle-orm";
import { hashPassword } from "better-auth/crypto";
import { generateId } from "better-auth";
import { user, account } from "../src/lib/db/schema/auth";
import { profiles } from "../src/lib/db/schema/profiles";
import { organizations } from "../src/lib/db/schema/organizations";
import * as schema from "../src/lib/db/schema";

/**
 * Xavfsiz .env.bootstrap faylini yuklash (faqat CLI uchun, Next.js ga aralashmaydi)
 */
export function loadBootstrapEnv(): void {
  const candidates = [
    path.resolve(process.cwd(), ".env.bootstrap"),
    path.resolve(process.cwd(), ".env.local"),
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
    return { valid: false, error: "Email manzili formati noto'g'ri (masalan: admin@tatu.uz)." };
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
 * - Maxsus belgi (!@#$%^&*...)
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

/**
 * Xavfsiz, yuqori entropiyali tasodifiy parol generatsiyasi
 */
export function generateSecureRandomPassword(length = 16): string {
  const upper = "ABCDEFGHJKLMNPQRSTUVWXYZ";
  const lower = "abcdefghijkmnopqrstuvwxyz";
  const digits = "23456789";
  const special = "!@#$%^&*()_+~=";
  const all = upper + lower + digits + special;

  const picked = [
    upper[crypto.randomInt(upper.length)],
    lower[crypto.randomInt(lower.length)],
    digits[crypto.randomInt(digits.length)],
    special[crypto.randomInt(special.length)],
  ];

  for (let i = 4; i < length; i++) {
    picked.push(all[crypto.randomInt(all.length)]);
  }

  for (let i = picked.length - 1; i > 0; i--) {
    const j = crypto.randomInt(i + 1);
    [picked[i], picked[j]] = [picked[j], picked[i]];
  }

  return picked.join("");
}

/**
 * Terminalda parolni yashirgan holda xavfsiz o'qish (Interaktiv TTY)
 */
export function readHiddenInput(promptText: string): Promise<string> {
  return new Promise((resolve) => {
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

export function readLineInput(promptText: string): Promise<string> {
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

export interface AdminCreationPreconditions {
  ready: boolean;
  databaseName: string;
  postgresVersion: string;
  organizationsCount: number;
  targetOrgFound: boolean;
  targetOrgId?: string;
  targetOrgName?: string;
  targetOrgCode?: string;
  targetOrgActive?: boolean;
  existingOrgAdminsCount: number;
  cryptoHashingVerified: boolean;
  issues: string[];
}

/**
 * Audit tekshiruvi (Dry-Run Diagnostikasi)
 */
export async function auditAdminPreconditions(
  pool: Pool,
  orgCode: string
): Promise<AdminCreationPreconditions> {
  const issues: string[] = [];

  const dbInfoRes = await pool.query(
    "SELECT current_database() as db_name, version() as pg_version"
  );
  const databaseName = dbInfoRes.rows[0]?.db_name || "unknown";
  const postgresVersion = dbInfoRes.rows[0]?.pg_version || "unknown";

  // Tashkilotlar soni
  const orgCountRes = await pool.query("SELECT COUNT(*)::int as cnt FROM organizations");
  const organizationsCount = orgCountRes.rows[0]?.cnt || 0;

  // Maqsadli tashkilotni qidirish
  const normalizedCode = orgCode.trim().toUpperCase();
  const orgRes = await pool.query(
    "SELECT id, name, code, is_active FROM organizations WHERE UPPER(code) = $1 LIMIT 1",
    [normalizedCode]
  );

  let targetOrgFound = false;
  let targetOrgId: string | undefined;
  let targetOrgName: string | undefined;
  let targetOrgCode: string | undefined;
  let targetOrgActive: boolean | undefined;

  if (orgRes.rows.length > 0) {
    targetOrgFound = true;
    targetOrgId = orgRes.rows[0].id;
    targetOrgName = orgRes.rows[0].name;
    targetOrgCode = orgRes.rows[0].code;
    targetOrgActive = Boolean(orgRes.rows[0].is_active);

    if (!targetOrgActive) {
      issues.push(`Tashkilot [${targetOrgCode}] bazada mavjud, lekin NOFAOL (is_active = false) holatda.`);
    }
  } else {
    issues.push(`[${normalizedCode}] kodi bilan tashkilot ma'lumotlar bazasida topilmadi.`);
  }

  // Ushbu tashkilotda mavjud adminlar soni
  let existingOrgAdminsCount = 0;
  if (targetOrgId) {
    const adminCheckRes = await pool.query(
      "SELECT COUNT(*)::int as cnt FROM profiles WHERE role = 'organization_admin' AND organization_id = $1",
      [targetOrgId]
    );
    existingOrgAdminsCount = adminCheckRes.rows[0]?.cnt || 0;
  }

  // Better Auth crypto hashing tekshiruvi
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
    organizationsCount,
    targetOrgFound,
    targetOrgId,
    targetOrgName,
    targetOrgCode,
    targetOrgActive,
    existingOrgAdminsCount,
    cryptoHashingVerified,
    issues,
  };
}

/**
 * CLI Asosiy Kirish Nuqtasi
 */
export async function runCli(): Promise<void> {
  const args = process.argv.slice(2);
  const isExecute = args.includes("--execute");
  const isDryRun = args.includes("--dry-run") || !isExecute;

  // CLI argumentlaridan parametrlarni qidirish
  const orgCodeArgIdx = args.indexOf("--org-code");
  const usernameArgIdx = args.indexOf("--username") !== -1 ? args.indexOf("--username") : args.indexOf("--login");
  const emailArgIdx = args.indexOf("--email");
  const nameArgIdx = args.indexOf("--name");

  const cliOrgCode = orgCodeArgIdx !== -1 && args[orgCodeArgIdx + 1] ? args[orgCodeArgIdx + 1] : "";
  const cliUsername = usernameArgIdx !== -1 && args[usernameArgIdx + 1] ? args[usernameArgIdx + 1] : "";
  const cliEmail = emailArgIdx !== -1 && args[emailArgIdx + 1] ? args[emailArgIdx + 1] : "";
  const cliName = nameArgIdx !== -1 && args[nameArgIdx + 1] ? args[nameArgIdx + 1] : "";
  const isAutoPassword = args.includes("--auto-password");

  console.log("==================================================================");
  console.log("  MulkNazorat — Tashkilot Administratori (Organization Admin) Onboarding");
  console.log("==================================================================\n");

  loadBootstrapEnv();

  const connectionString =
    process.env.BOOTSTRAP_DATABASE_URL ||
    process.env.MIGRATOR_URL ||
    process.env.DATABASE_URL;

  if (!connectionString) {
    console.error("XATO: PostgreSQL ulanish manzili (DATABASE_URL yoki BOOTSTRAP_DATABASE_URL) topilmadi.");
    console.error("Iltimos, .env.bootstrap yoki .env.local faylini tekshiring.");
    process.exit(1);
  }

  const pool = new Pool({
    connectionString,
    max: 2,
    connectionTimeoutMillis: 5000,
  });

  try {
    // 1. Tashkilot kodini aniqlash (Default: TATU)
    let orgCode = cliOrgCode;
    if (!orgCode) {
      const inputCode = await readLineInput("Tashkilot kodi (Enter = TATU): ");
      orgCode = inputCode.trim() || "TATU";
    }

    console.log(`\n1. [${orgCode.toUpperCase()}] tashkiloti va ma'lumotlar bazasi tekshirilmoqda...`);
    const audit = await auditAdminPreconditions(pool, orgCode);

    console.log(`- Ma'lumotlar bazasi: [${audit.databaseName}]`);
    console.log(`- PostgreSQL versiyasi: ${audit.postgresVersion.split(" on ")[0]}`);
    console.log(`- Tashkilot topildi: ${audit.targetOrgFound ? `Ha ("${audit.targetOrgName}", ${audit.targetOrgCode})` : "YO'Q"}`);
    console.log(`- Tashkilot holati: ${audit.targetOrgActive ? "Faol (Active)" : "Nofaol"}`);
    console.log(`- Mavjud adminlar soni: ${audit.existingOrgAdminsCount} ta`);
    console.log(`- Better Auth crypto hashing: ${audit.cryptoHashingVerified ? "Muvaffaqiyatli (scrypt)" : "Nosozlik"}`);

    if (audit.issues.length > 0) {
      console.log("\nTopilgan muammolar:");
      audit.issues.forEach((iss) => console.log(`  [!] ${iss}`));
    }

    if (isDryRun) {
      console.log("\n------------------------------------------------------------------");
      console.log("  DRY-RUN DIAGNOSTIKA NATIJASI:");
      if (audit.ready) {
        console.log("  STATUS: TAYYOR (READY)");
        console.log(`  Tizim [${audit.targetOrgCode}] uchun administrator yaratishga to'liq tayyor.`);
        console.log("  Ma'lumotlar bazasiga hech qanday o'zgartirish kiritilmadi.");
        console.log("  Haqiqiy administrator yaratish uchun ushbu buyruqni bajaring:");
        console.log(`  npx tsx scripts/create-organization-admin.ts --execute --org-code ${audit.targetOrgCode}`);
      } else {
        console.log("  STATUS: TO'XTATILDI (BLOCKED)");
        console.log("  Administrator yaratish mumkin emas. Yuqoridagi xatoliklarni bartaraf eting.");
      }
      console.log("------------------------------------------------------------------\n");
      await pool.end();
      process.exit(audit.ready ? 0 : 1);
    }

    // --execute rejimi
    if (!audit.ready) {
      console.error("\nXATO: Audit talablari bajarilmadi. Jarayon to'xtatildi.");
      await pool.end();
      process.exit(1);
    }

    console.log(`\nDIQQAT: Siz [${audit.targetOrgName}] uchun yangi administrator yaratish rejimidasiz (--execute).\n`);

    const currentOrgCode = (audit.targetOrgCode || orgCode).toLowerCase();

    // Login (Username)
    let rawUsername = cliUsername;
    if (!rawUsername) {
      const defaultUser = `${currentOrgCode}.admin`;
      const inputUser = await readLineInput(`Administrator Logini (Enter = ${defaultUser}): `);
      rawUsername = inputUser.trim() || defaultUser;
    }

    const orgPrefix = `${currentOrgCode}.`;
    const finalUsername = rawUsername.toLowerCase().startsWith(orgPrefix)
      ? rawUsername.toLowerCase()
      : `${orgPrefix}${rawUsername.toLowerCase()}`;

    // Email (agar berilmagan bo'lsa, xavfsiz ichki tizim domeni bo'yicha)
    let email = cliEmail;
    if (!email) {
      email = `${finalUsername}@auth.assetaudit.uz`;
    } else {
      const emailCheck = validateEmail(email);
      if (!emailCheck.valid) {
        console.error(`XATO: ${emailCheck.error}`);
        await pool.end();
        process.exit(1);
      }
    }

    // Ism
    let fullName = cliName;
    if (!fullName) {
      fullName = await readLineInput("Administrator To'liq Ismi (Full Name): ");
    }
    const nameCheck = validateFullName(fullName);
    if (!nameCheck.valid) {
      console.error(`XATO: ${nameCheck.error}`);
      await pool.end();
      process.exit(1);
    }

    // Parol (Avtomatik yoki Yashirin TTY)
    let password = "";
    if (isAutoPassword) {
      password = generateSecureRandomPassword(16);
      console.log("\n==================================================================");
      console.log("  XAVFSIZLIK VAQTINCHALIK PAROLI (Faqat shaxsiy terminalingizda):");
      console.log(`  >>>  ${password}  <<<`);
      console.log("  (Ushbu parolni nusxalab oling. Birinchi kirishda majburiy o'zgaradi)");
      console.log("==================================================================\n");
    } else {
      password = await readHiddenInput("Xavfsiz parol (terminalda ko'rinmaydi): ");
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
    }

    console.log("\nParol Better Auth rasmiy xeshlash algoritmi (scrypt) orqali xeshlanmoqda...");
    const passwordHash = await hashPassword(password);

    console.log("Tranzaksiya ochilmoqda va yozuvlar kiritilmoqda (user, account, profiles)...");
    const db = drizzle(pool, { schema });

    await db.transaction(async (tx) => {
      // 0. PostgreSQL Advisory Lock
      await tx.execute(sql`SELECT pg_advisory_xact_lock(7429184710293848);`);

      // 1. Email va Username takrorlanmasligini tranzaksiya ichida tekshirish
      const existingUsers = await tx
        .select()
        .from(user)
        .where(
          or(
            eq(user.email, email.toLowerCase().trim()),
            sql`lower(${user.username}) = ${finalUsername.toLowerCase()}`
          )
        )
        .limit(1);

      if (existingUsers.length > 0) {
        throw new Error(`Xavfsizlik himoyasi: [${finalUsername}] logini yoki [${email}] emaili bilan foydalanuvchi allaqachon mavjud.`);
      }

      // 2. Tashkilot faolligini qayta tekshirish
      const [foundOrg] = await tx
        .select()
        .from(organizations)
        .where(eq(organizations.id, audit.targetOrgId!))
        .limit(1);

      if (!foundOrg || !foundOrg.isActive) {
        throw new Error("Xavfsizlik himoyasi: Tashkilot topilmadi yoki nofaol holatda.");
      }

      const userId = generateId();
      const accountId = generateId();
      const now = new Date();

      // 3. user jadvaliga yozish
      await tx.insert(user).values({
        id: userId,
        name: fullName.trim(),
        email: email.toLowerCase().trim(),
        emailVerified: true,
        image: null,
        username: finalUsername,
        displayUsername: finalUsername,
        createdAt: now,
        updatedAt: now,
      });

      // 4. account jadvaliga credential hisobini bog'lash
      await tx.insert(account).values({
        id: accountId,
        userId: userId,
        accountId: userId,
        providerId: "credential",
        password: passwordHash,
        createdAt: now,
        updatedAt: now,
      });

      // 5. profiles jadvaliga organization_admin biznes profilini kiritish (mustChangePassword = true bilan)
      await tx.insert(profiles).values({
        userId: userId,
        organizationId: audit.targetOrgId!,
        role: "organization_admin",
        fullName: fullName.trim(),
        isActive: true,
        mustChangePassword: true,
        createdAt: now,
        updatedAt: now,
      });
    });

    console.log("\n==================================================================");
    console.log("  MUVAFFAQIYATLI! Tashkilot Administratori yaratildi.");
    console.log(`  Tashkilot: ${audit.targetOrgName} (${audit.targetOrgCode})`);
    console.log(`  Login (Username): ${finalUsername}`);
    console.log(`  Email: ${email.toLowerCase().trim()}`);
    console.log(`  To'liq ism: ${fullName.trim()}`);
    console.log("  Rol: organization_admin (Tashkilot Rahbari)");
    console.log("  Tenant Dashboard: /org");
    console.log("  Majburiy parol almashtirish: must_change_password = true");
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
  process.argv[1]?.includes("create-organization-admin") ||
  process.argv[1]?.endsWith("create-organization-admin.ts")
) {
  runCli();
}
