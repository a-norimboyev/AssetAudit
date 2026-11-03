import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  verifyTenantAdmin,
  verifyTenantAccess,
  canManageOrganizationUsers,
  canCreateNewItem,
  canRelocateItem,
  canUploadOfficialItemPhoto,
  canPerformAudit,
  canManagePlatformOrganizations,
  isManageableStaffRole,
  isHeadReadOnly,
} from "../authorization-rules";
import {
  validateStaffInput,
  validateStaffPassword,
  validateUsername,
  formatStaffUsername,
  generateSecureTemporaryPassword,
} from "../../validations/staff";
import { USER_ROLES, MANAGED_STAFF_ROLES, type Profile } from "../../db/schema/profiles";
import type { Organization } from "../../db/schema/organizations";

function createMockProfile(overrides: Partial<Profile> = {}): Profile {
  return {
    userId: "usr_uni_admin_tatu",
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
    name: "Muhammad al-Xorazmiy nomidagi Toshkent axborot texnologiyalari universiteti",
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

describe("AssetAudit — Universitet Administratori (Tashkilot Boshqaruvchisi) Moduli", () => {
  // =========================================================================
  // 1. UNIVERSITET ADMINISTRATORINING MAQOMI VA ROLI (TENANT ISOLATION)
  // =========================================================================
  describe("1. Universitet Administratorining Maqomi va Izolyatsiyasi", () => {
    it("O'z universitetining ma'lumotlarini ko'rishga to'liq ruxsat berilishi shart", () => {
      const adminProfile = createMockProfile();
      const org = createMockOrganization();

      const accessCheck = verifyTenantAdmin(adminProfile, org);
      assert.equal(accessCheck.allowed, true);

      const tenantCheck = verifyTenantAccess(adminProfile, org.id);
      assert.equal(tenantCheck.allowed, true);
    });

    it("Boshqa universitetning ma'lumotlariga kirish qat'iy rad etilishi shart (Tenant Isolation)", () => {
      const adminProfile = createMockProfile({
        organizationId: "16e1b5f8-0c70-43cb-8180-835efc7d2cc6", // TATU
      });
      const otherOrgId = "22222222-2222-2222-2222-222222222222"; // Masalan: SamDU

      const result = verifyTenantAccess(adminProfile, otherOrgId);
      assert.equal(result.allowed, false);
      assert.equal(result.errorCode, "TENANT_ACCESS_DENIED");
      assert.match(result.errorMessage!, /Boshqa tashkilot ma'lumotlariga kirish/);
    });

    it("Universitet administratori platforma sozlamalarini boshqara olmaydi (Superadmin ishi)", () => {
      assert.equal(canManagePlatformOrganizations("organization_admin"), false);
      assert.equal(canManagePlatformOrganizations("super_admin"), true);
    });
  });

  // =========================================================================
  // 2. XODIMLARNI BOSHQARISH — FAQAT 3 TA ROLNI YARATISH VA BOSHQARISH
  // =========================================================================
  describe("2. Xodimlarni Boshqarish: Faqat 3 ta Rol (Boshliq, Registrar, Auditor)", () => {
    it("Baza schema USER_ROLES ro'yxatida aniq 5 ta rasmiy rol mavjud bo'lishi shart", () => {
      const expectedRoles = ["super_admin", "organization_admin", "head", "inspector", "registrar"];
      assert.deepEqual([...USER_ROLES], expectedRoles);
    });

    it("Universitet Administratori faqat va faqat 3 ta rolni boshqara oladi (MANAGED_STAFF_ROLES)", () => {
      const expectedManagedRoles = ["head", "registrar", "inspector"];
      assert.deepEqual([...MANAGED_STAFF_ROLES], expectedManagedRoles);

      assert.equal(isManageableStaffRole("head"), true, "Boshliq roli boshqarilishi mumkin");
      assert.equal(isManageableStaffRole("registrar"), true, "Ro'yxatga oluvchi boshqarilishi mumkin");
      assert.equal(isManageableStaffRole("inspector"), true, "Tekshiruvchi boshqarilishi mumkin");

      // Ruxsat etilmagan rollar:
      assert.equal(isManageableStaffRole("organization_admin"), false, "Admin boshqa admin yarata olmaydi");
      assert.equal(isManageableStaffRole("super_admin"), false, "Admin superadmin yarata olmaydi");
      assert.equal(isManageableStaffRole("unknown_role"), false);
    });

    it("validateStaffInput: 'head' (Boshliq) rolini to'g'ri qabul qilishi shart", () => {
      const res = validateStaffInput({
        fullName: "Rustam Rektorov",
        username: "rektor",
        role: "head",
      }, "tatu");

      assert.equal(res.valid, true);
      assert.equal(res.normalized.role, "head");
      assert.equal(res.normalized.fullName, "Rustam Rektorov");
      assert.equal(res.normalized.username, "tatu.rektor");
    });

    it("validateStaffInput: 'registrar' (Moddiy hisobchi) rolini to'g'ri qabul qilishi shart", () => {
      const res = validateStaffInput({
        fullName: "Anvar Hisobchi",
        username: "hisobchi1",
        role: "registrar",
      }, "tatu");

      assert.equal(res.valid, true);
      assert.equal(res.normalized.role, "registrar");
      assert.equal(res.normalized.username, "tatu.hisobchi1");
    });

    it("validateStaffInput: 'inspector' (Auditor) rolini to'g'ri qabul qilishi shart", () => {
      const res = validateStaffInput({
        fullName: "Bobur Tekshiruvchi",
        username: "auditor1",
        role: "inspector",
      }, "tatu");

      assert.equal(res.valid, true);
      assert.equal(res.normalized.role, "inspector");
      assert.equal(res.normalized.username, "tatu.auditor1");
    });

    it("validateStaffInput: 3 tadan boshqa rollar qat'iy rad etilishi shart", () => {
      const res1 = validateStaffInput({
        fullName: "Sinov Foydalanuvchi",
        username: "sinov",
        role: "organization_admin",
      });
      assert.equal(res1.valid, false);
      assert.match(res1.errors.role, /Faqat Boshliq, Ro'yxatga oluvchi yoki Tekshiruvchi/);

      const res2 = validateStaffInput({
        fullName: "Sinov Foydalanuvchi",
        username: "sinov",
        role: "super_admin",
      });
      assert.equal(res2.valid, false);
    });

    it("generateSecureTemporaryPassword: Yuqori xavfsizlik talablariga 100% mos parol generatsiya qilishi shart", () => {
      for (let i = 0; i < 10; i++) {
        const pass = generateSecureTemporaryPassword();
        const check = validateStaffPassword(pass);
        assert.equal(check.valid, true, `Parol noto'g'ri: ${pass}`);
        assert.equal(pass.length >= 12, true);
      }
    });
  });

  // =========================================================================
  // 3. BOSHLIQ (REKTORAT) UCHUN 100% READ-ONLY KAFOLATI
  // =========================================================================
  describe("3. Boshliq Roli Uchun 100% Read-Only Kafolati", () => {
    it("isHeadReadOnly: 'head' roli 100% faqat ko'rish huquqiga ega", () => {
      assert.equal(isHeadReadOnly("head"), true);
      assert.equal(isHeadReadOnly("organization_admin"), false);
      assert.equal(isHeadReadOnly("registrar"), false);
      assert.equal(isHeadReadOnly("inspector"), false);
    });

    it("Boshliq hech qanday o'zgartirish yoki yaratish amallarini bajara olmasligi shart", () => {
      assert.equal(canCreateNewItem("head"), false, "Boshliq yangi jihoz yarata olmaydi");
      assert.equal(canRelocateItem("head"), false, "Boshliq jihozni ko'chira olmaydi");
      assert.equal(canUploadOfficialItemPhoto("head"), false, "Boshliq rasm yuklay olmaydi");
      assert.equal(canPerformAudit("head"), false, "Boshliq joyida audit o'tkazmaydi");
      assert.equal(canManageOrganizationUsers("head"), false, "Boshliq xodimlarni boshqarmaydi");
    });
  });

  // =========================================================================
  // 4. UNIVERSITET ADMINISTRATORI TAQIQLARI
  // =========================================================================
  describe("4. Universitet Administratorining Cheklovlari va Taqiqlari", () => {
    it("Admin joyida QR skanerlab audit o'tkazishi auditorning mustaqil vazifasi hisoblanadi", () => {
      // Inspector joyida audit o'tkazadi
      assert.equal(canPerformAudit("inspector"), true);
      assert.equal(canPerformAudit("registrar"), false);
    });

    it("Faqat Organization Admin xodimlarni boshqara oladi", () => {
      assert.equal(canManageOrganizationUsers("organization_admin"), true);
      assert.equal(canManageOrganizationUsers("inspector"), false);
      assert.equal(canManageOrganizationUsers("registrar"), false);
      assert.equal(canManageOrganizationUsers("head"), false);
    });
  });
});
