import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  verifyProfileStatus,
  verifyOrganizationStatus,
  verifyPlatformAdmin,
  verifyRole,
  verifyTenantAccess,
  canUploadOfficialItemPhoto,
  canCreateNewItem,
  canRelocateItem,
  canPerformAudit,
  canManageOrganizationUsers,
  canManagePlatformOrganizations,
} from "../authorization-rules";
import { auth } from "../../auth";
import type { Profile } from "../../db/schema/profiles";
import type { Organization } from "../../db/schema/organizations";

// Mock ma'lumotlar generatori
function createMockProfile(overrides: Partial<Profile> = {}): Profile {
  return {
    userId: "usr_test_123",
    organizationId: "org_tatu_001",
    role: "organization_admin",
    fullName: "Ali Valiyev",
    isActive: true,
    mustChangePassword: false,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

function createMockOrganization(overrides: Partial<Organization> = {}): Organization {
  return {
    id: "org_tatu_001",
    name: "Toshkent Axborot Texnologiyalari Universiteti",
    code: "TATU",
    typeId: "university",
    isActive: true,
    settings: {},
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

describe("AssetAudit — Multi-Organization Avtorizatsiya va Xavfsizlik Qoidalari", () => {
  // 1. Profil va foydalanuvchi faolligi
  it("Profil mavjud bo'lmaganda rad etishi shart (PROFILE_NOT_FOUND)", () => {
    const result = verifyProfileStatus(null);
    assert.equal(result.allowed, false);
    assert.equal(result.errorCode, "PROFILE_NOT_FOUND");
  });

  it("Bloklangan xodimni (isActive = false) darhol rad etishi shart (ACCOUNT_INACTIVE)", () => {
    const profile = createMockProfile({ isActive: false });
    const result = verifyProfileStatus(profile);
    assert.equal(result.allowed, false);
    assert.equal(result.errorCode, "ACCOUNT_INACTIVE");
  });

  it("Faol profilga ega foydalanuvchiga ruxsat berilishi kerak", () => {
    const profile = createMockProfile({ isActive: true });
    const result = verifyProfileStatus(profile);
    assert.equal(result.allowed, true);
  });

  // 2. Tashkilot faolligi tekshiruvi
  it("Tashkilot bloklangan (isActive = false) bo'lsa, xodim rad etilishi shart (ORGANIZATION_INACTIVE)", () => {
    const profile = createMockProfile({ organizationId: "org_tatu_001" });
    const organization = createMockOrganization({ isActive: false });
    const result = verifyOrganizationStatus(profile, organization);
    assert.equal(result.allowed, false);
    assert.equal(result.errorCode, "ORGANIZATION_INACTIVE");
  });

  it("Super Admin uchun tashkilot holati tekshirilmaydi (chunki organizationId yo'q)", () => {
    const profile = createMockProfile({ role: "super_admin", organizationId: null });
    const result = verifyOrganizationStatus(profile, null);
    assert.equal(result.allowed, true);
  });

  // 3. Platforma Super Administratori (Super Admin) qoidalari
  it("Super Admin to'g'ri tekshirilishi va ruxsat berilishi kerak", () => {
    const profile = createMockProfile({ role: "super_admin", organizationId: null });
    const result = verifyPlatformAdmin(profile);
    assert.equal(result.allowed, true);
  });

  it("Tashkilot administratori Platforma boshqaruviga uringanda rad etilishi shart (FORBIDDEN)", () => {
    const profile = createMockProfile({ role: "organization_admin" });
    const result = verifyPlatformAdmin(profile);
    assert.equal(result.allowed, false);
    assert.equal(result.errorCode, "FORBIDDEN");
  });

  it("Super Admin birorta tashkilotga biriktirilgan bo'lsa xavfsizlik xatosi deb rad etilishi shart", () => {
    const profile = createMockProfile({ role: "super_admin", organizationId: "org_tatu_001" });
    const result = verifyPlatformAdmin(profile);
    assert.equal(result.allowed, false);
    assert.equal(result.errorCode, "FORBIDDEN");
  });

  // 4. Qat'iy Multi-Tenant Izolyatsiyasi va Super Admin Bypass'ni Bekor Qilish
  it("Super Admin ichki tashkilot ma'lumotlariga to'g'ridan-to'g'ri kira olmasligi shart (TENANT_ACCESS_DENIED)", () => {
    const profile = createMockProfile({ role: "super_admin", organizationId: null });
    const result = verifyTenantAccess(profile, "org_tatu_001");
    assert.equal(result.allowed, false);
    assert.equal(result.errorCode, "TENANT_ACCESS_DENIED");
    assert.match(result.errorMessage!, /Super Admin/);
  });

  it("Xodim o'z tashkilotiga kirishiga ruxsat berilishi kerak", () => {
    const profile = createMockProfile({
      role: "organization_admin",
      organizationId: "org_tatu_001",
    });
    const result = verifyTenantAccess(profile, "org_tatu_001");
    assert.equal(result.allowed, true);
  });

  it("Xodim begona tashkilot ma'lumotlariga kirishga uringanda rad etilishi shart (TENANT_ACCESS_DENIED)", () => {
    const profile = createMockProfile({
      role: "organization_admin",
      organizationId: "org_tatu_001",
    });
    const result = verifyTenantAccess(profile, "org_maktab_999");
    assert.equal(result.allowed, false);
    assert.equal(result.errorCode, "TENANT_ACCESS_DENIED");
  });

  // 5. Rol darajasidagi cheklovlar (RBAC)
  it("Xodim vakolati yetarli bo'lmaganda rad etilishi shart (FORBIDDEN)", () => {
    const profile = createMockProfile({
      role: "inspector",
      organizationId: "org_tatu_001",
    });
    const result = verifyRole(profile, ["organization_admin"]);
    assert.equal(result.allowed, false);
    assert.equal(result.errorCode, "FORBIDDEN");
  });

  it("Xodim talab qilingan rollardan biriga ega bo'lsa ruxsat berilishi kerak", () => {
    const profile = createMockProfile({
      role: "registrar",
      organizationId: "org_tatu_001",
    });
    const result = verifyRole(profile, ["organization_admin", "registrar"]);
    assert.equal(result.allowed, true);
  });

  // 6. Maxsus biznes amallari huquqlari matritsasi (Tuzatilgan qoidalar)
  it("Rasmiy inventar fotosuratini yuklash: Faqat organization_admin ruxsat etilgan, inspector va registrar esa rad etiladi", () => {
    assert.equal(canUploadOfficialItemPhoto("organization_admin"), true);
    assert.equal(canUploadOfficialItemPhoto("inspector"), false);
    assert.equal(canUploadOfficialItemPhoto("registrar"), false);
    assert.equal(canUploadOfficialItemPhoto("super_admin"), false);
  });

  it("Yangi inventarni ro'yxatga olish: registrar va organization_admin ruxsat etilgan, inspector esa rad etiladi", () => {
    assert.equal(canCreateNewItem("registrar"), true);
    assert.equal(canCreateNewItem("organization_admin"), true);
    assert.equal(canCreateNewItem("inspector"), false);
    assert.equal(canCreateNewItem("super_admin"), false);
  });

  it("Inventar rasmiy joylashuvini o'zgartirish (ko'chirish): Faqat organization_admin ruxsat etilgan, registrar esa rad etiladi", () => {
    assert.equal(canRelocateItem("organization_admin"), true);
    assert.equal(canRelocateItem("registrar"), false);
    assert.equal(canRelocateItem("inspector"), false);
  });

  it("Audit o'tkazish: inspector va organization_admin ruxsat etilgan", () => {
    assert.equal(canPerformAudit("inspector"), true);
    assert.equal(canPerformAudit("organization_admin"), true);
    assert.equal(canPerformAudit("registrar"), false);
  });

  it("Platforma va tashkilot xodimlarini boshqarish huquqlari", () => {
    assert.equal(canManageOrganizationUsers("organization_admin"), true);
    assert.equal(canManageOrganizationUsers("inspector"), false);
    assert.equal(canManageOrganizationUsers("registrar"), false);
    assert.equal(canManagePlatformOrganizations("super_admin"), true);
    assert.equal(canManagePlatformOrganizations("organization_admin"), false);
  });

  // 7. Better Auth Ochiq Ro'yxatdan O'tish (Sign-up) Himoyasi
  it("Better Auth konfiguratsiyasida public signup qat'iy o'chirilgan bo'lishi shart", () => {
    assert.equal(auth.options.emailAndPassword?.enabled, true);
    assert.equal(auth.options.emailAndPassword?.disableSignUp, true);
  });
});
