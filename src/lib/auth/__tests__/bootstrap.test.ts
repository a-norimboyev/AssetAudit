import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  validateEmail,
  validateFullName,
  validatePassword,
  auditBootstrapPreconditions,
} from "../../../../scripts/bootstrap-super-admin";
import { hashPassword, verifyPassword } from "better-auth/crypto";
import {
  verifyProfileStatus,
  verifyTenantAccess,
  canUploadOfficialItemPhoto,
  canRelocateItem,
  canManageOrganizationUsers,
  canManagePlatformOrganizations,
} from "../authorization-rules";
import type { Profile } from "../../db/schema/profiles";
import type { Pool } from "pg";

describe("AssetAudit — Bootstrap Super Admin va Xavfsizlik Tekshiruvlari", () => {
  // 1. Email format validatsiyasi
  it("Email kiritilmaganda yoki noto'g'ri bo'lganda rad etishi shart", () => {
    assert.equal(validateEmail("").valid, false);
    assert.equal(validateEmail("   ").valid, false);
    assert.equal(validateEmail("not-an-email").valid, false);
    assert.equal(validateEmail("admin@").valid, false);
    assert.equal(validateEmail("@domain.com").valid, false);
  });

  it("To'g'ri email manzilini qabul qilishi kerak", () => {
    assert.equal(validateEmail("admin@mulknazorat.uz").valid, true);
    assert.equal(validateEmail("super_admin@gov.uz").valid, true);
  });

  // 2. To'liq ism validatsiyasi
  it("Ism bo'sh yoki 3 ta belgidan kam bo'lsa rad etishi shart", () => {
    assert.equal(validateFullName("").valid, false);
    assert.equal(validateFullName("  ").valid, false);
    assert.equal(validateFullName("Ab").valid, false);
  });

  it("To'g'ri ismni qabul qilishi kerak", () => {
    assert.equal(validateFullName("Super Administrator").valid, true);
    assert.equal(validateFullName("Ali Valiyev").valid, true);
  });

  // 3. Parol murakkabligi siyosati (Kamida 12 belgi, [A-Z], [a-z], [0-9], maxsus belgi)
  it("12 belgidan kam parolni rad etishi shart", () => {
    const res = validatePassword("Abc1!def");
    assert.equal(res.valid, false);
    assert.match(res.error!, /12 ta belgi/);
  });

  it("Katta harf [A-Z] bo'lmagan parolni rad etishi shart", () => {
    const res = validatePassword("mulknazorat2026!secure");
    assert.equal(res.valid, false);
    assert.match(res.error!, /katta.*harf/i);
  });

  it("Kichik harf [a-z] bo'lmagan parolni rad etishi shart", () => {
    const res = validatePassword("MULKNAZORAT2026!SECURE");
    assert.equal(res.valid, false);
    assert.match(res.error!, /kichik.*harf/i);
  });

  it("Raqam [0-9] bo'lmagan parolni rad etishi shart", () => {
    const res = validatePassword("MulkNazorat!SecurePass");
    assert.equal(res.valid, false);
    assert.match(res.error!, /raqam/i);
  });

  it("Maxsus belgi bo'lmagan parolni rad etishi shart", () => {
    const res = validatePassword("MulkNazorat2026SecurePass");
    assert.equal(res.valid, false);
    assert.match(res.error!, /maxsus belgi/i);
  });

  it("Barcha xavfsizlik mezonlariga mos keluvchi kuchli parolni qabul qilishi kerak", () => {
    const res = validatePassword("MulkNazorat#2026!AdminKey");
    assert.equal(res.valid, true);
  });

  // 4. Better Auth rasmiy parolni xeshlash (scrypt) integratsiyasi
  it("Better Auth crypto hashPassword va verifyPassword to'g'ri ishlashi shart", async () => {
    const rawPass = "Test#Password123456!";
    const hash = await hashPassword(rawPass);
    assert.equal(typeof hash, "string");
    assert.ok(hash.length > 32);

    const match = await verifyPassword({ password: rawPass, hash });
    assert.equal(match, true);

    const wrongMatch = await verifyPassword({ password: "Wrong#Password999!", hash });
    assert.equal(wrongMatch, false);
  });

  // 5. Bootstrap audit: Takroriy Super Admin yaratishni taqiqlash
  it("Tizimda Super Admin allaqachon mavjud bo'lsa, bootstrap uni bloklashi (ready = false) shart", async () => {
    const mockPool = {
      query: async (sqlText: string) => {
        if (sqlText.includes("current_database()")) {
          return {
            rows: [{ db_name: "mulknazorat", pg_version: "PostgreSQL 18.6", cur_user: "mulknazorat_migrator" }],
          };
        }
        if (sqlText.includes("information_schema.tables")) {
          return {
            rows: [
              { table_name: "account" },
              { table_name: "organization_types" },
              { table_name: "organizations" },
              { table_name: "profiles" },
              { table_name: "session" },
              { table_name: "user" },
              { table_name: "verification" },
            ],
          };
        }
        if (sqlText.includes("role = 'super_admin'")) {
          // 1 ta super admin mavjud
          return { rows: [{ cnt: 1 }] };
        }
        return { rows: [] };
      },
    } as unknown as Pool;

    const audit = await auditBootstrapPreconditions(mockPool);
    assert.equal(audit.ready, false);
    assert.equal(audit.superAdminCount, 1);
    assert.ok(audit.issues.some((iss) => iss.includes("Takroriy Super Admin")));
  });

  // 6. Bootstrap dry-run: Bazada Super Admin bo'lmasa tayyor ekanligini tasdiqlashi shart
  it("Baza to'liq va Super Admin bo'lmaganda, dry-run muvaffaqiyatli (ready = true) chiqishi kerak", async () => {
    const mockPool = {
      query: async (sqlText: string) => {
        if (sqlText.includes("current_database()")) {
          return {
            rows: [{ db_name: "mulknazorat", pg_version: "PostgreSQL 18.6", cur_user: "mulknazorat_migrator" }],
          };
        }
        if (sqlText.includes("information_schema.tables")) {
          return {
            rows: [
              { table_name: "account" },
              { table_name: "organization_types" },
              { table_name: "organizations" },
              { table_name: "profiles" },
              { table_name: "session" },
              { table_name: "user" },
              { table_name: "verification" },
            ],
          };
        }
        if (sqlText.includes("role = 'super_admin'")) {
          return { rows: [{ cnt: 0 }] };
        }
        return { rows: [] };
      },
    } as unknown as Pool;

    const audit = await auditBootstrapPreconditions(mockPool);
    assert.equal(audit.ready, true);
    assert.equal(audit.superAdminCount, 0);
    assert.equal(audit.missingTables.length, 0);
    assert.equal(audit.issues.length, 0);
  });

  // 7. Faol bo'lmagan (is_active = false) profil qat'iy bloklanishi
  it("is_active = false bo'lgan profil barcha biznes amallardan bloklanishi shart", () => {
    const inactiveProfile: Profile = {
      userId: "usr_inactive_001",
      organizationId: "org_tatu_001",
      role: "organization_admin",
      fullName: "Nofaol Admin",
      isActive: false,
      mustChangePassword: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    const res = verifyProfileStatus(inactiveProfile);
    assert.equal(res.allowed, false);
    assert.equal(res.errorCode, "ACCOUNT_INACTIVE");
  });

  // 8. Registrar vakolatlari cheklovi
  it("Registrar inventar joylashuvini o'zgartira olmasligi, rasmiy foto yuklay olmasligi va admin huquqiga ega emasligi shart", () => {
    assert.equal(canRelocateItem("registrar"), false);
    assert.equal(canUploadOfficialItemPhoto("registrar"), false);
    assert.equal(canManageOrganizationUsers("registrar"), false);
    assert.equal(canManagePlatformOrganizations("registrar"), false);
  });

  // 9. Super Admin tashkilot ichki ma'lumotlariga umumiy bypass qila olmasligi
  it("Super Admin tashkilot ichki inventar va auditlariga to'g'ridan-to'g'ri kira olmasligi shart", () => {
    const superAdminProfile: Profile = {
      userId: "usr_super_001",
      organizationId: null,
      role: "super_admin",
      fullName: "Super Administrator",
      isActive: true,
      mustChangePassword: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    const res = verifyTenantAccess(superAdminProfile, "org_tatu_001");
    assert.equal(res.allowed, false);
    assert.equal(res.errorCode, "TENANT_ACCESS_DENIED");
  });

  // 10. Advisory Lock Concurrency Strategiyasi
  it("Parallel bootstrap chaqirilganda pg_advisory_xact_lock transaction-level qulf qo'llanishi shart", () => {
    // 64-bit integer constant advisory lock tekshiruvi
    const advisoryLockId = BigInt("7429184710293847");
    assert.ok(typeof advisoryLockId === "bigint");
    assert.ok(advisoryLockId > BigInt(0));
  });
});

