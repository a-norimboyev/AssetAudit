/**
 * AssetAudit — Sprint 12: Production DB READ-ONLY Verifikatsiya Skripti
 * 
 * QOIDALAR:
 * - Hech qanday yozish yoki INSERT/UPDATE/DELETE bajarmaydi.
 * - Parol logga yoki konsolga mutlaqo chiqmaydi.
 * - Production bazasi (localhost:5433) dagi TATU va tatu.admin holatini tekshiradi.
 */

import * as fs from "node:fs";
import * as path from "node:path";
import { Pool } from "pg";

function loadBootstrapEnv(): string | null {
  const envPath = path.resolve(process.cwd(), ".env.local");
  if (!fs.existsSync(envPath)) return null;

  const content = fs.readFileSync(envPath, "utf8");
  const match = content.match(/DATABASE_URL=([^\r\n]+)/);
  return match ? match[1].trim() : null;
}

async function verify() {
  const databaseUrl = loadBootstrapEnv();
  if (!databaseUrl) {
    console.log(JSON.stringify({
      success: false,
      stage: "CONFIG",
      error: ".env.local ichida DATABASE_URL topilmadi."
    }));
    process.exit(1);
  }

  // URL diagnostikasi (parolsiz)
  let host = "unknown", port = "5432", dbName = "unknown", user = "unknown";
  try {
    const u = new URL(databaseUrl);
    host = u.hostname;
    port = u.port || "5432";
    dbName = u.pathname.replace(/^\//, "");
    user = decodeURIComponent(u.username);
  } catch {
    // maxsus format
  }

  const pool = new Pool({
    connectionString: databaseUrl,
    max: 1,
    connectionTimeoutMillis: 4000,
  });

  try {
    // 1. SELECT 1 & current context
    const ping = await pool.query("SELECT 1 as ok, current_database(), current_user, version();");
    const activeDb = ping.rows[0]?.current_database;
    const activeUser = ping.rows[0]?.current_user;
    const pgVersion = ping.rows[0]?.version?.split(" on ")[0];

    // 2. TATU tashkilotini tekshir (READ-ONLY)
    const orgRes = await pool.query(
      "SELECT id, name, code, is_active, type_id, created_at FROM organizations WHERE code = 'TATU' LIMIT 1;"
    );
    const tatuOrg = orgRes.rows[0] || null;

    // 3. tatu.admin foydalanuvchisini tekshir (READ-ONLY)
    const userRes = await pool.query(
      "SELECT id, name, email, username, email_verified, created_at FROM public.user WHERE username = 'tatu.admin' LIMIT 1;"
    );
    const tatuUser = userRes.rows[0] || null;

    let tatuProfile = null;
    let tatuSessionsCount = 0;

    if (tatuUser) {
      const profileRes = await pool.query(
        "SELECT role, full_name, is_active, must_change_password FROM profiles WHERE user_id = $1 LIMIT 1;",
        [tatuUser.id]
      );
      tatuProfile = profileRes.rows[0] || null;

      const sessionRes = await pool.query(
        "SELECT count(*)::int as count FROM session WHERE user_id = $1;",
        [tatuUser.id]
      );
      tatuSessionsCount = sessionRes.rows[0]?.count || 0;
    }

    // 4. Super Admin mavjudligini tekshir (READ-ONLY)
    const superAdminRes = await pool.query(
      `SELECT u.id, u.username, u.email, p.role, p.is_active 
       FROM public.user u 
       JOIN profiles p ON u.id = p.user_id 
       WHERE p.role = 'super_admin' LIMIT 5;`
    );
    const superAdmins = superAdminRes.rows;

    // 5. Migratsiyalar (0004 gacha) holatini tekshir (READ-ONLY)
    let migrations = [];
    try {
      const migRes = await pool.query(
        "SELECT id, hash, created_at FROM drizzle.__drizzle_migrations ORDER BY id ASC;"
      );
      migrations = migRes.rows;
    } catch {
      try {
        const migRes = await pool.query(
          "SELECT id, hash, created_at FROM __drizzle_migrations ORDER BY id ASC;"
        );
        migrations = migRes.rows;
      } catch {
        migrations = [];
      }
    }

    // Jami tashkilotlar va foydalanuvchilar soni
    const totalOrgs = await pool.query("SELECT count(*)::int as count FROM organizations;");
    const totalUsers = await pool.query("SELECT count(*)::int as count FROM public.user;");

    console.log(JSON.stringify({
      success: true,
      target: { host, port, dbName, user },
      activeContext: { activeDb, activeUser, pgVersion },
      stats: {
        totalOrganizations: totalOrgs.rows[0]?.count,
        totalUsers: totalUsers.rows[0]?.count,
      },
      migrations: {
        count: migrations.length,
        items: migrations.map(m => m.id || m.hash),
      },
      superAdmins: superAdmins.map(sa => ({
        username: sa.username,
        email: sa.email,
        role: sa.role,
        isActive: sa.is_active,
      })),
      tatuOrganization: tatuOrg ? {
        id: tatuOrg.id,
        name: tatuOrg.name,
        code: tatuOrg.code,
        isActive: tatuOrg.is_active,
        typeId: tatuOrg.type_id,
      } : null,
      tatuAdminUser: tatuUser ? {
        id: tatuUser.id,
        username: tatuUser.username,
        email: tatuUser.email,
        name: tatuUser.name,
        profile: tatuProfile,
        activeSessionsCount: tatuSessionsCount,
      } : null,
    }, null, 2));

    await pool.end();
    process.exit(0);
  } catch (err: unknown) {
    const errorObj = err as { message?: string; code?: string } | null;
    const errorMsg = errorObj?.message || String(err);
    const errorCode = errorObj?.code;

    let reason = "UNKNOWN";
    if (errorCode === "ECONNREFUSED" || errorMsg.includes("ECONNREFUSED")) {
      reason = "TUNNEL_NOT_RUNNING";
    } else if (errorCode === "28P01" || errorMsg.includes("password authentication failed")) {
      reason = "AUTH_FAILED_CREDENTIAL_MISMATCH";
    } else if (errorCode === "3D000") {
      reason = "DATABASE_DOES_NOT_EXIST";
    }

    console.log(JSON.stringify({
      success: false,
      target: { host, port, dbName, user },
      reason,
      errorCode,
      errorMessage: errorMsg,
    }, null, 2));

    await pool.end();
    process.exit(1);
  }
}

verify();
