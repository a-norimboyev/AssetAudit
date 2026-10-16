import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  getOrganizationsStats,
  getOrganizationTypesList,
  getOrganizationsList,
} from "@/lib/data/organizations";
import { verifyPlatformAdmin } from "@/lib/auth/authorization-rules";
import type { Profile } from "@/lib/db/schema/profiles";

describe("AssetAudit — Bosqich 2A Tashkilotlar Moduli va Ruxsatlar", () => {
  const BASE_URL = process.env.TEST_SERVER_URL || "http://localhost:3001";

  describe("1. Tashkilotlar Ma'lumotlar Qatlami (Drizzle ORM)", () => {
    it("getOrganizationsStats(): jami, faol, nofaol va turlar sonini to'g'ri qaytarishi shart", async () => {
      const stats = await getOrganizationsStats();
      assert.equal(typeof stats.total, "number");
      assert.equal(typeof stats.active, "number");
      assert.equal(typeof stats.inactive, "number");
      assert.equal(typeof stats.typesCount, "number");
      assert.equal(stats.typesCount, 9, "organization_types katalogida 9 ta tur bo'lishi shart");
    });

    it("getOrganizationTypesList(): 9 ta tashkilot turini ro'yxat sifatida qaytarishi shart", async () => {
      const types = await getOrganizationTypesList();
      assert.equal(Array.isArray(types), true);
      assert.equal(types.length, 9);
      const ids = types.map((t) => t.id);
      assert.ok(ids.includes("university"), "university turi mavjud bo'lishi shart");
      assert.ok(ids.includes("school"), "school turi mavjud bo'lishi shart");
      assert.ok(ids.includes("enterprise"), "enterprise turi mavjud bo'lishi shart");
    });

    it("getOrganizationsList(): sahifalash va bo'sh natija strukturasini to'g'ri qaytarishi kerak", async () => {
      const result = await getOrganizationsList({ page: 1, pageSize: 20 });
      assert.equal(Array.isArray(result.items), true);
      assert.equal(typeof result.totalCount, "number");
      assert.equal(result.currentPage, 1);
      assert.equal(result.pageSize, 20);
    });

    it("getOrganizationsList(): mavjud bo'lmagan qidiruv bo'yicha 0 ta natija qaytarishi kerak", async () => {
      const result = await getOrganizationsList({
        search: "NonExistentOrganizationXYZ12345",
      });
      assert.equal(result.items.length, 0);
      assert.equal(result.totalCount, 0);
      assert.equal(result.totalPages, 1);
    });
  });

  describe("2. Xavfsizlik va Role-Based Access Control (RBAC)", () => {
    it("Super Admin tashkilotlar moduliga kirish huquqiga ega bo'lishi shart", () => {
      const superAdminProfile: Profile = {
        userId: "sa-1",
        organizationId: null,
        role: "super_admin",
        fullName: "Platforma Administratori",
        isActive: true,
        mustChangePassword: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const check = verifyPlatformAdmin(superAdminProfile);
      assert.equal(check.allowed, true);
    });

    it("Tashkilot administratori /admin/organizations moduliga kira olmasligi shart (FORBIDDEN)", () => {
      const orgAdminProfile: Profile = {
        userId: "oa-1",
        organizationId: "org-1",
        role: "organization_admin",
        fullName: "OTM Administratori",
        isActive: true,
        mustChangePassword: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const check = verifyPlatformAdmin(orgAdminProfile);
      assert.equal(check.allowed, false);
      assert.equal(check.errorCode, "FORBIDDEN");
    });

    it("Inspektor va Ro'yxatga oluvchi /admin/organizations moduliga kira olmasligi shart", () => {
      const inspectorProfile: Profile = {
        userId: "ins-1",
        organizationId: "org-1",
        role: "inspector",
        fullName: "Inspektor",
        isActive: true,
        mustChangePassword: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const registrarProfile: Profile = {
        userId: "reg-1",
        organizationId: "org-1",
        role: "registrar",
        fullName: "Ro'yxatga oluvchi",
        isActive: true,
        mustChangePassword: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      assert.equal(verifyPlatformAdmin(inspectorProfile).allowed, false);
      assert.equal(verifyPlatformAdmin(registrarProfile).allowed, false);
    });
  });

  describe("3. HTTP Marshrut Himoyasi (/admin/organizations)", () => {
    it("Sessiyasiz /admin/organizations so'rovi 307 Redirect (/login) qaytarishi shart", async (t) => {
      let res: Response;
      try {
        res = await fetch(`${BASE_URL}/admin/organizations`, {
          method: "GET",
          redirect: "manual",
          headers: {
            Accept: "text/html",
          },
        });
      } catch {
        t.skip("Test serveri (http://localhost:3001) faol emas");
        return;
      }

      assert.equal(res.status, 307);
      assert.equal(res.headers.get("location"), "/login");
      const cacheControl = res.headers.get("cache-control");
      assert.ok(cacheControl && cacheControl.includes("no-store"));
    });
  });
});
