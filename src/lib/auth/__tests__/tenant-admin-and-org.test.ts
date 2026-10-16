import { describe, it, after } from "node:test";
import assert from "node:assert/strict";
import {
  verifyTenantAdmin,
  verifyPlatformAdmin,
  verifyTenantAccess,
} from "../authorization-rules";
import {
  validateEmail,
  validateFullName,
  validatePassword,
} from "../../../../scripts/create-organization-admin";
import {
  getOrganizationAdminsStats,
  getOrganizationAdminsList,
} from "../../data/administrators";
import { getPool } from "../../db";
import type { Profile } from "../../db/schema/profiles";
import type { Organization } from "../../db/schema/organizations";

function createMockProfile(overrides: Partial<Profile> = {}): Profile {
  return {
    userId: "usr_org_admin_1",
    organizationId: "16e1b5f8-0c70-43cb-8180-835efc7d2cc6",
    role: "organization_admin",
    fullName: "TATU Administratori",
    isActive: true,
    mustChangePassword: false,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

function createMockOrganization(overrides: Partial<Organization> = {}): Organization {
  return {
    id: "16e1b5f8-0c70-43cb-8180-835efc7d2cc6",
    name: "Toshkent axborot texnologiyalari universiteti",
    code: "TATU",
    typeId: "university",
    isActive: true,
    settings: {
      defaultQrVisibility: "restricted",
      inventoryPrefix: "TATU-",
      allowPublicScanLogs: false,
    },
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

describe("AssetAudit — Bosqich 2C: Tashkilot Administratori va Tenant Dashboard (/org)", () => {
  describe("1. Tenant Admin Avtorizatsiya Qoidalari (verifyTenantAdmin)", () => {
    it("Faol organization_admin va faol tashkilot uchun ruxsat berilishi shart", () => {
      const profile = createMockProfile();
      const org = createMockOrganization();
      const result = verifyTenantAdmin(profile, org);

      assert.equal(result.allowed, true);
    });

    it("Super Admin /org ga kirishga uringanda qat'iy rad etilishi shart (FORBIDDEN)", () => {
      const profile = createMockProfile({
        role: "super_admin",
        organizationId: null,
      });
      const org = createMockOrganization();
      const result = verifyTenantAdmin(profile, org);

      assert.equal(result.allowed, false);
      assert.equal(result.errorCode, "FORBIDDEN");
      assert.match(result.errorMessage!, /Super Admin platforma ma'muri bo'lib/);
    });

    it("Inspektor (inspector) /org boshqaruviga kira olmasligi shart (FORBIDDEN)", () => {
      const profile = createMockProfile({ role: "inspector" });
      const org = createMockOrganization();
      const result = verifyTenantAdmin(profile, org);

      assert.equal(result.allowed, false);
      assert.equal(result.errorCode, "FORBIDDEN");
    });

    it("Moddiy javobgar shaxs (registrar) /org boshqaruviga kira olmasligi shart (FORBIDDEN)", () => {
      const profile = createMockProfile({ role: "registrar" });
      const org = createMockOrganization();
      const result = verifyTenantAdmin(profile, org);

      assert.equal(result.allowed, false);
      assert.equal(result.errorCode, "FORBIDDEN");
    });

    it("Tashkilotga bog'lanmagan organization_admin rad etilishi shart (TENANT_ACCESS_DENIED)", () => {
      const profile = createMockProfile({ organizationId: null });
      const org = createMockOrganization();
      const result = verifyTenantAdmin(profile, org);

      assert.equal(result.allowed, false);
      assert.equal(result.errorCode, "TENANT_ACCESS_DENIED");
    });

    it("Nofaol (is_active = false) tashkilot xodimi rad etilishi shart (ORGANIZATION_INACTIVE)", () => {
      const profile = createMockProfile();
      const org = createMockOrganization({ isActive: false });
      const result = verifyTenantAdmin(profile, org);

      assert.equal(result.allowed, false);
      assert.equal(result.errorCode, "ORGANIZATION_INACTIVE");
    });

    it("Nofaol profil (is_active = false) rad etilishi shart (ACCOUNT_INACTIVE)", () => {
      const profile = createMockProfile({ isActive: false });
      const org = createMockOrganization();
      const result = verifyTenantAdmin(profile, org);

      assert.equal(result.allowed, false);
      assert.equal(result.errorCode, "ACCOUNT_INACTIVE");
    });
  });

  describe("2. Qat'iy Tenant Izolyatsiyasi va RBAC Cheklovlari", () => {
    it("organization_admin /admin platforma boshqaruviga KIRA OLMAYDI (FORBIDDEN)", () => {
      const profile = createMockProfile({ role: "organization_admin" });
      const result = verifyPlatformAdmin(profile);

      assert.equal(result.allowed, false);
      assert.equal(result.errorCode, "FORBIDDEN");
    });

    it("organization_admin boshqa tashkilot ma'lumotlariga KIRA OLMAYDI (TENANT_ACCESS_DENIED)", () => {
      const profile = createMockProfile({
        organizationId: "16e1b5f8-0c70-43cb-8180-835efc7d2cc6",
      });
      const result = verifyTenantAccess(profile, "other-org-uuid-999");

      assert.equal(result.allowed, false);
      assert.equal(result.errorCode, "TENANT_ACCESS_DENIED");
    });

    it("organization_admin o'z tashkilotiga kira oladi", () => {
      const profile = createMockProfile({
        organizationId: "16e1b5f8-0c70-43cb-8180-835efc7d2cc6",
      });
      const result = verifyTenantAccess(
        profile,
        "16e1b5f8-0c70-43cb-8180-835efc7d2cc6"
      );

      assert.equal(result.allowed, true);
    });
  });

  describe("3. Administrator Onboarding CLI Validatsiyasi (scripts/create-organization-admin.ts)", () => {
    it("Noto'g'ri email formatini rad etishi shart", () => {
      assert.equal(validateEmail("").valid, false);
      assert.equal(validateEmail("not-an-email").valid, false);
      assert.equal(validateEmail("user@domain").valid, false);
      assert.equal(validateEmail("admin@tatu.uz").valid, true);
    });

    it("3 belgidan kam bo'lgan ismni rad etishi shart", () => {
      assert.equal(validateFullName("").valid, false);
      assert.equal(validateFullName("  ab ").valid, false);
      assert.equal(validateFullName("Ali").valid, true);
      assert.equal(validateFullName("TATU Admin").valid, true);
    });

    it("12 belgidan kam parolni rad etishi shart", () => {
      assert.equal(validatePassword("Short1!Aa").valid, false);
    });

    it("Katta harf [A-Z] bo'lmagan parolni rad etishi shart", () => {
      assert.equal(validatePassword("tatu_secure_password_123!").valid, false);
    });

    it("Kichik harf [a-z] bo'lmagan parolni rad etishi shart", () => {
      assert.equal(validatePassword("TATU_SECURE_PASSWORD_123!").valid, false);
    });

    it("Raqam [0-9] bo'lmagan parolni rad etishi shart", () => {
      assert.equal(validatePassword("TATU_Secure_Password_NoDigit!").valid, false);
    });

    it("Maxsus belgi bo'lmagan parolni rad etishi shart", () => {
      assert.equal(validatePassword("TATUSecurePassword123456").valid, false);
    });

    it("Barcha xavfsizlik mezonlariga mos keluvchi kuchli parolni qabul qilishi kerak", () => {
      assert.equal(validatePassword("Tatu_Secure_Pass_2026!").valid, true);
    });
  });

  describe("4. Administratorlar Ma'lumotlar Qatlami (getOrganizationAdminsStats / List)", () => {
    it("getOrganizationAdminsStats(): statistika strukturasini to'g'ri qaytarishi shart", async () => {
      const stats = await getOrganizationAdminsStats();

      assert.equal(typeof stats.total, "number");
      assert.equal(typeof stats.active, "number");
      assert.equal(typeof stats.inactive, "number");
      assert.equal(typeof stats.organizationsCount, "number");
      assert.ok(stats.total >= 0);
      assert.ok(stats.active >= 0);
    });

    it("getOrganizationAdminsList(): paginatsiya va ro'yxat strukturasini to'g'ri qaytarishi shart", async () => {
      const result = await getOrganizationAdminsList({ page: 1, pageSize: 10 });

      assert.equal(typeof result.totalCount, "number");
      assert.equal(typeof result.totalPages, "number");
      assert.equal(result.currentPage, 1);
      assert.equal(result.pageSize, 10);
      assert.ok(Array.isArray(result.items));
    });

    it("getOrganizationAdminsList(): mavjud bo'lmagan qidiruv bo'yicha 0 ta natija qaytarishi kerak", async () => {
      const result = await getOrganizationAdminsList({
        search: "NON_EXISTENT_ADMIN_SEARCH_QUERY_2026_XYZ",
      });

      assert.equal(result.totalCount, 0);
      assert.equal(result.items.length, 0);
    });

    after(async () => {
      try {
        const pool = getPool();
        await pool.end();
      } catch {
        // Pool allaqachon yopilgan bo'lsa
      }
    });
  });
});
