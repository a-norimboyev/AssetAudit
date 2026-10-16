import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { validateOrganizationInput } from "@/lib/validations/organization";
import { verifyPlatformAdmin, canManagePlatformOrganizations } from "@/lib/auth/authorization-rules";
import { logSecurityAudit } from "@/lib/audit/logger";
import { OrganizationError } from "@/lib/data/organizations";
import type { Profile } from "@/lib/db/schema/profiles";

function createMockProfile(overrides: Partial<Profile> = {}): Profile {
  return {
    userId: "usr_test_123",
    organizationId: null,
    role: "super_admin",
    fullName: "Super Admin",
    isActive: true,
    mustChangePassword: false,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

describe("AssetAudit — Bosqich 2B: Tashkilot Yaratish va Xavfsizlik Qoidalari", () => {
  describe("1. Validatsiya va Input Normalizatsiyasi (validateOrganizationInput)", () => {
    it("To'g'ri ma'lumotlar kiritilganda kodni UPPERCASE va nomni TRIM qilishi shart", () => {
      const result = validateOrganizationInput({
        name: "  Toshkent Axborot Texnologiyalari Universiteti  ",
        code: "  tatu_01  ",
        typeId: "university",
        isActive: true,
      });

      assert.equal(result.valid, true);
      assert.equal(result.normalized.name, "Toshkent Axborot Texnologiyalari Universiteti");
      assert.equal(result.normalized.code, "TATU_01");
      assert.equal(result.normalized.typeId, "university");
      assert.equal(result.normalized.isActive, true);
      assert.deepEqual(result.errors, {});
    });

    it("Bo'sh yoki faqat probellardan iborat nom rad etilishi shart", () => {
      const result = validateOrganizationInput({
        name: "   ",
        code: "TATU",
        typeId: "university",
      });

      assert.equal(result.valid, false);
      assert.ok(result.errors.name);
      assert.match(result.errors.name, /nomi kiritilishi shart/i);
    });

    it("3 belgidan kam nom rad etilishi shart", () => {
      const result = validateOrganizationInput({
        name: "AB",
        code: "TATU",
        typeId: "university",
      });

      assert.equal(result.valid, false);
      assert.ok(result.errors.name);
      assert.match(result.errors.name, /kamida 3 ta/i);
    });

    it("Bo'sh yoki 2 belgidan kam kod rad etilishi shart", () => {
      const result1 = validateOrganizationInput({
        name: "TATU Universiteti",
        code: "",
        typeId: "university",
      });
      assert.equal(result1.valid, false);
      assert.ok(result1.errors.code);

      const result2 = validateOrganizationInput({
        name: "TATU Universiteti",
        code: "T",
        typeId: "university",
      });
      assert.equal(result2.valid, false);
      assert.ok(result2.errors.code);
    });

    it("Koddagi yaroqsiz maxsus belgilar (probel, %, @, #) rad etilishi shart", () => {
      const result = validateOrganizationInput({
        name: "TATU Universiteti",
        code: "TATU 01!",
        typeId: "university",
      });

      assert.equal(result.valid, false);
      assert.ok(result.errors.code);
      assert.match(result.errors.code, /faqat lotin harflari/i);
    });

    it("Tashkilot turi tanlanmaganda yoki 'all' bo'lganda rad etilishi shart", () => {
      const result1 = validateOrganizationInput({
        name: "TATU Universiteti",
        code: "TATU",
        typeId: "",
      });
      assert.equal(result1.valid, false);
      assert.ok(result1.errors.typeId);

      const result2 = validateOrganizationInput({
        name: "TATU Universiteti",
        code: "TATU",
        typeId: "all",
      });
      assert.equal(result2.valid, false);
      assert.ok(result2.errors.typeId);
    });

    it("isActive parametri berilmaganda sukut bo'yicha true bo'lishi kerak", () => {
      const result = validateOrganizationInput({
        name: "TATU Universiteti",
        code: "TATU",
        typeId: "university",
      });

      assert.equal(result.valid, true);
      assert.equal(result.normalized.isActive, true);
    });
  });

  describe("2. Server-Side Avtorizatsiya va RBAC Qoidalari", () => {
    it("Super Admin tashkilot yaratish huquqiga (canManagePlatformOrganizations) ega bo'lishi shart", () => {
      const superAdmin = createMockProfile({ role: "super_admin", organizationId: null });
      assert.equal(canManagePlatformOrganizations(superAdmin.role), true);

      const authCheck = verifyPlatformAdmin(superAdmin);
      assert.equal(authCheck.allowed, true);
    });

    it("Tashkilot administratori (organization_admin) tashkilot yaratishdan qat'iy rad etilishi shart", () => {
      const orgAdmin = createMockProfile({
        role: "organization_admin",
        organizationId: "org-uuid-1",
      });
      assert.equal(canManagePlatformOrganizations(orgAdmin.role), false);

      const authCheck = verifyPlatformAdmin(orgAdmin);
      assert.equal(authCheck.allowed, false);
      assert.equal(authCheck.errorCode, "FORBIDDEN");
    });

    it("Inspektor va Moddiy javobgar shaxs (registrar) tashkilot yarata olmasligi shart", () => {
      const inspector = createMockProfile({ role: "inspector", organizationId: "org-uuid-1" });
      const registrar = createMockProfile({ role: "registrar", organizationId: "org-uuid-1" });

      assert.equal(canManagePlatformOrganizations(inspector.role), false);
      assert.equal(canManagePlatformOrganizations(registrar.role), false);
      assert.equal(verifyPlatformAdmin(inspector).allowed, false);
      assert.equal(verifyPlatformAdmin(registrar).allowed, false);
    });

    it("Bloklangan Super Admin (isActive = false) rad etilishi shart (ACCOUNT_INACTIVE)", () => {
      const inactiveAdmin = createMockProfile({ isActive: false });
      const authCheck = verifyPlatformAdmin(inactiveAdmin);
      assert.equal(authCheck.allowed, false);
      assert.equal(authCheck.errorCode, "ACCOUNT_INACTIVE");
    });

    it("Agar Super Admin qaysidir tashkilotga bog'langan bo'lsa (organizationId != null), qoidabuzarlik deb rad etilishi shart", () => {
      const corruptedAdmin = createMockProfile({ organizationId: "org-illegal" });
      const authCheck = verifyPlatformAdmin(corruptedAdmin);
      assert.equal(authCheck.allowed, false);
      assert.equal(authCheck.errorCode, "FORBIDDEN");
    });
  });

  describe("3. Xavfsiz Audit Jurnali (logSecurityAudit)", () => {
    it("Tashkilot yaratish audit hodisasi maxfiy ma'lumotlarsiz qayd etilishi shart", () => {
      const auditEvent = logSecurityAudit({
        event: "ORGANIZATION_CREATED",
        actorUserId: "usr-admin-1",
        organizationId: "org-uuid-tatu",
        organizationCode: "TATU",
        metadata: {
          name: "Toshkent Axborot Texnologiyalari Universiteti",
          typeId: "university",
          passwordSecret: "SuperSecretPassword123!", // Redacted bo'lishi kerak
          sessionToken: "session-token-xyz", // Redacted bo'lishi kerak
        },
      });

      assert.equal(auditEvent.event, "ORGANIZATION_CREATED");
      assert.equal(auditEvent.actorUserId, "usr-admin-1");
      assert.equal(auditEvent.organizationCode, "TATU");
      assert.ok(auditEvent.timestamp);
      assert.equal(auditEvent.metadata?.passwordSecret, "[REDACTED]");
      assert.equal(auditEvent.metadata?.sessionToken, "[REDACTED]");
      assert.equal(auditEvent.metadata?.name, "Toshkent Axborot Texnologiyalari Universiteti");
    });
  });

  describe("4. Tashkilot Xatoliklari va Kod Takrorlanishi (OrganizationError)", () => {
    it("OrganizationError xatolik kodlari va HTTP statuslarini to'g'ri saqlashi kerak", () => {
      const uniqueErr = new OrganizationError(
        "ORGANIZATION_CODE_ALREADY_EXISTS",
        '"TATU" kodi bilan tashkilot allaqachon ro\'yxatga olingan.',
        409
      );
      assert.equal(uniqueErr.code, "ORGANIZATION_CODE_ALREADY_EXISTS");
      assert.equal(uniqueErr.status, 409);
      assert.equal(uniqueErr.name, "OrganizationError");

      const permErr = new OrganizationError(
        "DATABASE_PERMISSION_DENIED",
        "Tashkilot yaratish huquqi (INSERT privilege) yetarli emas.",
        500
      );
      assert.equal(permErr.code, "DATABASE_PERMISSION_DENIED");
      assert.equal(permErr.status, 500);
    });
  });

  describe("5. HTTP Marshrut Himoyasi (/admin/organizations/new)", () => {
    const BASE_URL = process.env.TEST_SERVER_URL || "http://localhost:3001";

    it("Sessiyasiz /admin/organizations/new so'rovi 307 Redirect (/login) qaytarishi shart", async (t) => {
      let res: Response;
      try {
        res = await fetch(`${BASE_URL}/admin/organizations/new`, {
          method: "GET",
          redirect: "manual",
        });
      } catch {
        t.skip("Test serveri (http://localhost:3001) faol emas");
        return;
      }

      assert.equal(
        res.status,
        307,
        "Sessiyasiz /admin/organizations/new so'rovi 307 Redirect berishi shart"
      );
      const location = res.headers.get("location") || "";
      assert.ok(
        location.includes("/login"),
        `Redirect manzili /login bo'lishi kerak, olingan: ${location}`
      );
      assert.ok(
        res.headers.get("cache-control")?.includes("no-store"),
        "Himoyalangan sahifa no-store kesh bilan himoyalangan bo'lishi shart"
      );
    });
  });
});
