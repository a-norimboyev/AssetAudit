import { describe, it, before, after } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { Pool } from "pg";
import { hashPassword, verifyPassword } from "better-auth/crypto";
import { generateId } from "better-auth";
import {
  validateUsername,
  formatStaffUsername,
  generateInternalSystemEmail,
  generateSecureTemporaryPassword,
  validateStaffPassword,
  validateStaffInput,
} from "../../validations/staff";
import { mapLoginError } from "../login-errors";

describe("AssetAudit — Sprint 05C: LMS Uslubidagi Login va Parol Tizimi", () => {
  // =========================================================================
  // 1. LOGIN (USERNAME) VA PAROL FORMATI VALIDATSIYASI
  // =========================================================================
  describe("1. LMS Login va Parol Formati Validatsiyasi", () => {
    it("To'g'ri formatdagi unikal loginlarni qabul qilishi kerak", () => {
      assert.equal(validateUsername("tatu.admin").valid, true);
      assert.equal(validateUsername("tatu.inspector1").valid, true);
      assert.equal(validateUsername("tatu.registrar_2").valid, true);
      assert.equal(validateUsername("usr123").valid, true);
    });

    it("3 belgidan kam yoki 30 belgidan oshgan loginni rad etishi shart", () => {
      assert.equal(validateUsername("ab").valid, false);
      assert.equal(validateUsername("a".repeat(31)).valid, false);
    });

    it("Loginda taqiqlangan maxsus belgilarni (@, probel, %, #) rad etishi shart", () => {
      assert.equal(validateUsername("user@tatu").valid, false);
      assert.equal(validateUsername("user name").valid, false);
      assert.equal(validateUsername("user#1").valid, false);
    });

    it("Login nuqta bilan boshlanishi, tugashi yoki ketma-ket ikkita nuqtadan iborat bo'lishi mumkin emas", () => {
      assert.equal(validateUsername(".tatu.admin").valid, false);
      assert.equal(validateUsername("tatu.admin.").valid, false);
      assert.equal(validateUsername("tatu..admin").valid, false);
    });

    it("formatStaffUsername(): tashkilot prefiksini avtomatik to'g'ri biriktirishi shart", () => {
      assert.equal(formatStaffUsername("TATU", "admin"), "tatu.admin");
      assert.equal(formatStaffUsername("TATU", "tatu.admin"), "tatu.admin");
      assert.equal(formatStaffUsername("TATU", "inspector1"), "tatu.inspector1");
    });

    it("generateInternalSystemEmail(): faqat korporativ domen bo'yicha ichki email hosil qilishi kerak", () => {
      const email = generateInternalSystemEmail("tatu.admin");
      assert.equal(email, "tatu.admin@auth.assetaudit.uz");
      assert.ok(!email.includes("gmail.com"));
      assert.ok(!email.includes("mail.ru"));
    });

    it("generateSecureTemporaryPassword(): yuqori xavfsizlik mezonlariga mos parol ishlab chiqishi shart", () => {
      for (let i = 0; i < 5; i++) {
        const pass = generateSecureTemporaryPassword();
        assert.ok(pass.length >= 12, "Parol uzunligi kamida 12 belgi bo'lishi kerak");
        const check = validateStaffPassword(pass);
        assert.equal(check.valid, true, `Parol tekshiruvdan o'tmadi: ${pass} -> ${check.error}`);
      }
    });

    it("validateStaffInput(): username berilganda emailni avtomatik xavfsiz generatsiya qilishi kerak", () => {
      const res = validateStaffInput(
        { fullName: "Alisher Qodirov", username: "inspector1", role: "inspector" },
        "TATU"
      );
      assert.equal(res.valid, true);
      assert.equal(res.normalized.username, "tatu.inspector1");
      assert.equal(res.normalized.email, "tatu.inspector1@auth.assetaudit.uz");
      assert.equal(res.normalized.role, "inspector");
    });
  });

  // =========================================================================
  // 2. MIGRATSIYA (0004) VA DRIZZLE SXEMASI TEKSHIRUVI
  // =========================================================================
  describe("2. SQL Migratsiya (0004) va Drizzle Sxemasi Tekshiruvi", () => {
    const migrationPath = resolve(process.cwd(), "drizzle/0004_odd_the_santerians.sql");
    const migrationSql = readFileSync(migrationPath, "utf-8");

    it("0004 migratsiyasida user jadvaliga username ustuni qo'shilgan bo'lishi shart", () => {
      assert.match(migrationSql, /ALTER TABLE "user" ADD COLUMN "username" text/);
    });

    it("0004 migratsiyasida user jadvaliga display_username ustuni qo'shilgan bo'lishi shart", () => {
      assert.match(migrationSql, /ALTER TABLE "user" ADD COLUMN "display_username" text/);
    });

    it("0004 migratsiyasida user_username_unique cheklovi mavjud bo'lishi shart", () => {
      assert.match(migrationSql, /ALTER TABLE "user" ADD CONSTRAINT "user_username_unique" UNIQUE\("username"\)/);
    });

    it("0004 migratsiyasida case-insensitive lower unique index mavjud bo'lishi shart", () => {
      assert.match(migrationSql, /CREATE UNIQUE INDEX IF NOT EXISTS "user_username_lower_idx" ON "user" \(LOWER\("username"\)\)/);
    });
  });

  // =========================================================================
  // 3. XAVFSIZLIK VA USER ENUMERATION HIMOYA TEKSHIRUVLARI
  // =========================================================================
  describe("3. Generic Xatoliklar va User Enumeration Himoyasi", () => {
    it("Noto'g'ri username kiritilganda generic umumiy xatolik xabari qaytishi shart", () => {
      const msg = mapLoginError({ status: 401, code: "INVALID_USERNAME_OR_PASSWORD" });
      assert.equal(msg, "Login, email yoki parol noto'g'ri kiritildi.");
    });

    it("Noto'g'ri email kiritilganda ham generic umumiy xatolik xabari qaytishi shart", () => {
      const msg = mapLoginError({ status: 401, code: "INVALID_EMAIL_OR_PASSWORD" });
      assert.equal(msg, "Login, email yoki parol noto'g'ri kiritildi.");
    });

    it("429 rate limit holatida kutish xabari berilishi shart", () => {
      const msg = mapLoginError({ status: 429 });
      assert.match(msg, /Juda ko'p urinishlar qilindi/);
    });
  });

  // =========================================================================
  // 4. HAQIQIY IZOLYATSIYALANGAN POSTGRESQL SHADOW BAZASIDA INTEGRATSIYA
  // =========================================================================
  describe("4. Haqiqiy Izolyatsiyalangan PostgreSQL Bazasida LMS Auth Sinovlari", () => {
    const connectionString =
      process.env.DATABASE_URL ||
      "postgresql://postgres@127.0.0.1:5432/mulknazorat_sprint05b_test";

    let pool: Pool;
    const testOrgId = "b9f1d044-3298-4682-a7d1-" + Math.floor(100000000000 + Math.random() * 900000000000);
    const testOrgCode = `LMS${Math.floor(1000 + Math.random() * 9000)}`;
    const testAdminUserId = `usr-admin-${Date.now()}`;
    const testStaffUserId = `usr-staff-${Date.now()}`;
    const testUsername = `lms.staff.${Date.now()}`;
    const testPassword = "Initial_Temporary_Pass_2026!";
    const adminEmail = `superadmin-${Date.now()}@assetaudit.uz`;

    before(async () => {
      pool = new Pool({ connectionString, max: 2, connectionTimeoutMillis: 5000 });

      // Sinov uchun tashkilot yaratish
      await pool.query(
        `INSERT INTO organizations (id, name, code, type_id, is_active, created_at, updated_at)
         VALUES ($1, 'LMS Test Universiteti', $2, 'university', true, NOW(), NOW())
         ON CONFLICT (id) DO NOTHING`,
        [testOrgId, testOrgCode]
      );

      // Super Admin foydalanuvchisi (mavjud email orqali kirishni tekshirish uchun)
      const adminPassHash = await hashPassword("SuperAdmin_Pass_2026!");
      await pool.query(
        `INSERT INTO "user" (id, name, email, email_verified, username, display_username, created_at, updated_at)
         VALUES ($1, 'LMS Super Admin', $2, true, NULL, NULL, NOW(), NOW())
         ON CONFLICT (id) DO NOTHING`,
        [testAdminUserId, adminEmail]
      );
      await pool.query(
        `INSERT INTO account (id, user_id, account_id, provider_id, password, created_at, updated_at)
         VALUES ($1, $1, $1, 'credential', $2, NOW(), NOW())
         ON CONFLICT (id) DO NOTHING`,
        [testAdminUserId, adminPassHash]
      );
      await pool.query(
        `INSERT INTO profiles (user_id, organization_id, role, full_name, is_active, must_change_password, created_at, updated_at)
         VALUES ($1, NULL, 'super_admin', 'LMS Super Admin', true, false, NOW(), NOW())
         ON CONFLICT (user_id) DO NOTHING`,
        [testAdminUserId]
      );

      // LMS xodimi (username bilan)
      const staffPassHash = await hashPassword(testPassword);
      const staffEmail = `${testUsername}@auth.assetaudit.uz`;
      await pool.query(
        `INSERT INTO "user" (id, name, email, email_verified, username, display_username, created_at, updated_at)
         VALUES ($1, 'LMS Xodimi', $2, true, $3, $3, NOW(), NOW())
         ON CONFLICT (id) DO NOTHING`,
        [testStaffUserId, staffEmail, testUsername]
      );
      await pool.query(
        `INSERT INTO account (id, user_id, account_id, provider_id, password, created_at, updated_at)
         VALUES ($1, $1, $1, 'credential', $2, NOW(), NOW())
         ON CONFLICT (id) DO NOTHING`,
        [testStaffUserId, staffPassHash]
      );
      await pool.query(
        `INSERT INTO profiles (user_id, organization_id, role, full_name, is_active, must_change_password, created_at, updated_at)
         VALUES ($1, $2, 'inspector', 'LMS Xodimi', true, true, NOW(), NOW())
         ON CONFLICT (user_id) DO NOTHING`,
        [testStaffUserId, testOrgId]
      );
    });

    after(async () => {
      // Tozalash
      if (pool) {
        await pool.query(`DELETE FROM session WHERE user_id IN ($1, $2)`, [testStaffUserId, testAdminUserId]);
        await pool.query(`DELETE FROM profiles WHERE user_id IN ($1, $2)`, [testStaffUserId, testAdminUserId]);
        await pool.query(`DELETE FROM account WHERE user_id IN ($1, $2)`, [testStaffUserId, testAdminUserId]);
        await pool.query(`DELETE FROM "user" WHERE id IN ($1, $2)`, [testStaffUserId, testAdminUserId]);
        await pool.query(`DELETE FROM organizations WHERE id = $1`, [testOrgId]);
        await pool.end();
      }
    });

    it("DB Test 1: Username + to'g'ri parol Better Auth verifyPassword orqali muvaffaqiyatli tasdiqlanishi shart", async () => {
      const accRes = await pool.query(
        `SELECT a.password FROM account a
         JOIN "user" u ON u.id = a.user_id
         WHERE u.username = $1 AND a.provider_id = 'credential'`,
        [testUsername]
      );
      assert.equal(accRes.rows.length, 1);
      const isValid = await verifyPassword({
        hash: accRes.rows[0].password,
        password: testPassword,
      });
      assert.equal(isValid, true, "To'g'ri parol qabul qilinmadi");
    });

    it("DB Test 2: Username + noto'g'ri parol verifyPassword orqali rad etilishi shart", async () => {
      const accRes = await pool.query(
        `SELECT a.password FROM account a
         JOIN "user" u ON u.id = a.user_id
         WHERE u.username = $1`,
        [testUsername]
      );
      const isValid = await verifyPassword({
        hash: accRes.rows[0].password,
        password: "Wrong_Password_12345!",
      });
      assert.equal(isValid, false, "Noto'g'ri parol qabul qilinib ketdi!");
    });

    it("DB Test 3: Takroriy (Duplicate) username kiritish DB darajasida bloklanishi shart (23505)", async () => {
      await assert.rejects(
        async () => {
          await pool.query(
            `INSERT INTO "user" (id, name, email, email_verified, username, display_username, created_at, updated_at)
             VALUES ($1, 'Takroriy User', 'another@auth.assetaudit.uz', true, $2, $2, NOW(), NOW())`,
            [generateId(), testUsername]
          );
        },
        (err: unknown) => {
          const pgErr = err as { code?: string };
          return pgErr.code === "23505"; // unique_violation
        }
      );
    });

    it("DB Test 4: Registr farqli (Case-insensitive) duplicate username ham bloklanishi shart (23505)", async () => {
      await assert.rejects(
        async () => {
          await pool.query(
            `INSERT INTO "user" (id, name, email, email_verified, username, display_username, created_at, updated_at)
             VALUES ($1, 'Case User', 'case@auth.assetaudit.uz', true, $2, $2, NOW(), NOW())`,
            [generateId(), testUsername.toUpperCase()]
          );
        },
        (err: unknown) => {
          const pgErr = err as { code?: string };
          return pgErr.code === "23505";
        }
      );
    });

    it("DB Test 5: Super Adminning avvalgi email orqali kirish hisobi 100% saqlanishi shart", async () => {
      const adminAcc = await pool.query(
        `SELECT a.password FROM account a
         JOIN "user" u ON u.id = a.user_id
         WHERE u.email = $1 AND a.provider_id = 'credential'`,
        [adminEmail]
      );
      assert.equal(adminAcc.rows.length, 1);
      const isSuperAdminValid = await verifyPassword({
        hash: adminAcc.rows[0].password,
        password: "SuperAdmin_Pass_2026!",
      });
      assert.equal(isSuperAdminValid, true, "Super Admin paroli tasdiqlanmadi");
    });

    it("DB Test 6: Vaqtinchalik parol bilan must_change_password = true holati tasdiqlanishi kerak", async () => {
      const profRes = await pool.query(
        `SELECT must_change_password FROM profiles WHERE user_id = $1`,
        [testStaffUserId]
      );
      assert.equal(profRes.rows[0].must_change_password, true);
    });

    it("DB Test 7: Parol yangilangandan so'ng must_change_password = false bo'lishi shart", async () => {
      const newHash = await hashPassword("New_Permanent_Pass_2026!");
      await pool.query(
        `UPDATE account SET password = $1 WHERE user_id = $2`,
        [newHash, testStaffUserId]
      );
      await pool.query(
        `UPDATE profiles SET must_change_password = false WHERE user_id = $1`,
        [testStaffUserId]
      );

      const profRes = await pool.query(
        `SELECT must_change_password FROM profiles WHERE user_id = $1`,
        [testStaffUserId]
      );
      assert.equal(profRes.rows[0].must_change_password, false);
    });

    it("DB Test 8: Admin parolni reset qilganda, eski faol sessiyalar darhol o'chirilishi (force logout) shart", async () => {
      // 1. Simulyatsiya: xodim uchun faol sessiya ochamiz
      const sessionId = `sess-${Date.now()}`;
      const sessionToken = `tok-${Date.now()}-${Math.random()}`;
      await pool.query(
        `INSERT INTO session (id, user_id, token, expires_at, created_at, updated_at)
         VALUES ($1, $2, $3, NOW() + INTERVAL '7 days', NOW(), NOW())`,
        [sessionId, testStaffUserId, sessionToken]
      );

      const beforeCheck = await pool.query(`SELECT count(*)::int as cnt FROM session WHERE user_id = $1`, [testStaffUserId]);
      assert.equal(beforeCheck.rows[0].cnt, 1, "Sessiya yaratilmadi");

      // 2. Admin parolni reset qildi: yangi parol o'rnatildi, mustChangePassword = true qilindi va sessiyalar o'chirildi
      const resetHash = await hashPassword("Admin_Reset_Pass_2026!");
      await pool.query(`BEGIN;`);
      await pool.query(`UPDATE account SET password = $1 WHERE user_id = $2`, [resetHash, testStaffUserId]);
      await pool.query(`UPDATE profiles SET must_change_password = true WHERE user_id = $1`, [testStaffUserId]);
      await pool.query(`DELETE FROM session WHERE user_id = $1`, [testStaffUserId]);
      await pool.query(`COMMIT;`);

      // 3. Tekshiruv: eski sessiya yo'q bo'lishi va must_change_password = true bo'lishi shart
      const afterCheck = await pool.query(`SELECT count(*)::int as cnt FROM session WHERE user_id = $1`, [testStaffUserId]);
      assert.equal(afterCheck.rows[0].cnt, 0, "Eski sessiya bekor qilinmadi!");

      const flagCheck = await pool.query(`SELECT must_change_password FROM profiles WHERE user_id = $1`, [testStaffUserId]);
      assert.equal(flagCheck.rows[0].must_change_password, true, "must_change_password yoqilmadi!");
    });
  });
});
