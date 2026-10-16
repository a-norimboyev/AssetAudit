import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  verifyProfileStatus,
  verifyPlatformAdmin,
  verifyTenantAccess,
  canManagePlatformOrganizations,
  canManageOrganizationUsers,
  canRelocateItem,
  canUploadOfficialItemPhoto,
  canCreateNewItem,
  canPerformAudit,
} from "../authorization-rules";
import type { Profile } from "../../db/schema/profiles";

function createProfile(overrides: Partial<Profile> = {}): Profile {
  return {
    userId: "usr_test_100",
    organizationId: null,
    role: "super_admin",
    fullName: "Platforma Administratori",
    isActive: true,
    mustChangePassword: false,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

describe("AssetAudit — Server-Side Route Himoyasi va RBAC Qoidalari", () => {
  // 1. /admin marshruti faqat Super Admin uchun ochiq bo'lishi
  it("/admin marshruti: super_admin roli va organizationId = null bo'lganda ruxsat berilishi kerak", () => {
    const profile = createProfile({ role: "super_admin", organizationId: null });
    const check = verifyPlatformAdmin(profile);
    assert.equal(check.allowed, true);
  });

  it("/admin marshruti: organization_admin kirishga uringanda qat'iy rad etilishi shart (FORBIDDEN)", () => {
    const profile = createProfile({ role: "organization_admin", organizationId: "org_tatu_01" });
    const check = verifyPlatformAdmin(profile);
    assert.equal(check.allowed, false);
    assert.equal(check.errorCode, "FORBIDDEN");
  });

  it("/admin marshruti: inspector kirishga uringanda qat'iy rad etilishi shart (FORBIDDEN)", () => {
    const profile = createProfile({ role: "inspector", organizationId: "org_tatu_01" });
    const check = verifyPlatformAdmin(profile);
    assert.equal(check.allowed, false);
    assert.equal(check.errorCode, "FORBIDDEN");
  });

  it("/admin marshruti: registrar kirishga uringanda qat'iy rad etilishi shart (FORBIDDEN)", () => {
    const profile = createProfile({ role: "registrar", organizationId: "org_tatu_01" });
    const check = verifyPlatformAdmin(profile);
    assert.equal(check.allowed, false);
    assert.equal(check.errorCode, "FORBIDDEN");
  });

  it("/admin marshruti: super_admin birorta tashkilotga bog'langan bo'lsa xavfsizlik buzilishi deb rad etilishi shart", () => {
    const profile = createProfile({ role: "super_admin", organizationId: "org_illegal_link" });
    const check = verifyPlatformAdmin(profile);
    assert.equal(check.allowed, false);
    assert.equal(check.errorCode, "FORBIDDEN");
  });

  // 2. Super Admin tashkilot ichki inventarlariga avtomatik bypass qila olmasligi
  it("Super Admin tashkilot ichki ma'lumotlariga to'g'ridan-to'g'ri kira olmaydi (TENANT_ACCESS_DENIED)", () => {
    const profile = createProfile({ role: "super_admin", organizationId: null });
    const check = verifyTenantAccess(profile, "org_tatu_01");
    assert.equal(check.allowed, false);
    assert.equal(check.errorCode, "TENANT_ACCESS_DENIED");
    assert.match(check.errorMessage!, /Super Admin platforma ma'muri bo'lib/);
  });

  // 3. Faolsizlantirilgan profil himoyasi
  it("isActive = false bo'lgan profil har qanday marshrutdan rad etilishi shart (ACCOUNT_INACTIVE)", () => {
    const profile = createProfile({ isActive: false });
    const check = verifyProfileStatus(profile);
    assert.equal(check.allowed, false);
    assert.equal(check.errorCode, "ACCOUNT_INACTIVE");
  });

  // 4. Biznes amallarining rol matritsasi
  it("canManagePlatformOrganizations: faqat super_admin ruxsat etilgan", () => {
    assert.equal(canManagePlatformOrganizations("super_admin"), true);
    assert.equal(canManagePlatformOrganizations("organization_admin"), false);
    assert.equal(canManagePlatformOrganizations("inspector"), false);
    assert.equal(canManagePlatformOrganizations("registrar"), false);
  });

  it("canManageOrganizationUsers: faqat organization_admin ruxsat etilgan", () => {
    assert.equal(canManageOrganizationUsers("organization_admin"), true);
    assert.equal(canManageOrganizationUsers("super_admin"), false);
    assert.equal(canManageOrganizationUsers("inspector"), false);
    assert.equal(canManageOrganizationUsers("registrar"), false);
  });

  it("canUploadOfficialItemPhoto: faqat organization_admin ruxsat etilgan", () => {
    assert.equal(canUploadOfficialItemPhoto("organization_admin"), true);
    assert.equal(canUploadOfficialItemPhoto("super_admin"), false);
    assert.equal(canUploadOfficialItemPhoto("inspector"), false);
    assert.equal(canUploadOfficialItemPhoto("registrar"), false);
  });

  it("canRelocateItem: faqat organization_admin ruxsat etilgan", () => {
    assert.equal(canRelocateItem("organization_admin"), true);
    assert.equal(canRelocateItem("registrar"), false);
    assert.equal(canRelocateItem("inspector"), false);
  });

  it("canCreateNewItem: registrar va organization_admin ruxsat etilgan", () => {
    assert.equal(canCreateNewItem("registrar"), true);
    assert.equal(canCreateNewItem("organization_admin"), true);
    assert.equal(canCreateNewItem("super_admin"), false);
    assert.equal(canCreateNewItem("inspector"), false);
  });

  it("canPerformAudit: inspector va organization_admin ruxsat etilgan", () => {
    assert.equal(canPerformAudit("inspector"), true);
    assert.equal(canPerformAudit("organization_admin"), true);
    assert.equal(canPerformAudit("registrar"), false);
    assert.equal(canPerformAudit("super_admin"), false);
  });
});
