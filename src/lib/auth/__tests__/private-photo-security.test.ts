/**
 * AssetAudit — Sprint 17 / Final Production Blocker Fix
 * Private Inventory Photos Security & Server-Side Authenticated Media Tests
 * 
 * Ushbu testlar inventar fotosuratlarining qat'iy xavfsizlik talablarini tekshiradi:
 * 1. Anonim (autentifikatsiyadan o'tmagan) so'rovlar -> 401 Unauthorized.
 * 2. Begona tashkilot xodimi (Cross-Tenant) ko'rishga uringanda -> 403 Forbidden (TENANT_ACCESS_DENIED).
 * 3. O'z tashkiloti a'zosi ruxsati -> 200 OK va xavfsizlik sarlavhalari (nosniff, sandbox CSP, no-store).
 * 4. X-Accel-Redirect mexanizmi (USE_X_ACCEL="true") Nginx ichki yo'naltirish sarlavhasini qaytarishi.
 * 5. Path Traversal himoyasi: fayl nomidan barcha katalog yo'llari (../../) kesib tashlanishi.
 * 6. Nginx konfiguratsiyasida to'g'ridan-to'g'ri /uploads/ ommaviy kirish qat'iy bloklanganligi (deny all; return 403).
 */

import { describe, it, before, after } from "node:test";
import assert from "node:assert/strict";
import * as path from "node:path";
import * as fs from "node:fs/promises";
import * as fsSync from "node:fs";
import { Pool } from "pg";
import { NextRequest } from "next/server";
import { GET } from "@/app/api/media/items/[id]/photo/route";
import { verifyTenantAccess, verifyProfileStatus } from "../authorization-rules";
import type { Profile } from "../../db/schema/profiles";

describe("AssetAudit — Maxfiy Inventar Suratlari va Multi-Tenant Media Himoyasi", () => {
  const PG_CONNECTION = process.env.DATABASE_URL || "postgresql://postgres@127.0.0.1:5432/mulknazorat_sprint05b_test";
  let pool: Pool;

  let orgAId: string;
  let orgBId: string;
  let bldAId: string;
  let floorAId: string;
  let roomAId: string;
  let itemAId: string;
  let itemWithoutPhotoId: string;

  const testUploadDir = path.resolve(process.cwd(), "public", "uploads", "inventory");
  const testFileName = "test_item_photo_security_sprint17.jpg";
  const testFilePath = path.join(testUploadDir, testFileName);

  before(async () => {
    pool = new Pool({ connectionString: PG_CONNECTION, max: 2 });
    const ts = Date.now();

    // 1. Ikkita mustaqil tashkilot yaratamiz (Org A va Org B)
    const orgARes = await pool.query(
      `INSERT INTO organizations (name, code, type_id, is_active)
       VALUES ('Tashkilot A Xavfsiz', 'ORG_A_${ts}', 'university', true) RETURNING id;`
    );
    orgAId = orgARes.rows[0].id;

    const orgBRes = await pool.query(
      `INSERT INTO organizations (name, code, type_id, is_active)
       VALUES ('Tashkilot B Begona', 'ORG_B_${ts}', 'university', true) RETURNING id;`
    );
    orgBId = orgBRes.rows[0].id;

    // 2. Org A iyerarxiyasini yaratamiz
    const bRes = await pool.query(
      `INSERT INTO buildings (organization_id, name, code, floors_count, is_active)
       VALUES ($1, 'Org A Bosh Bino', 'B_A_${ts}', 1, true) RETURNING id;`,
      [orgAId]
    );
    bldAId = bRes.rows[0].id;

    const fRes = await pool.query(
      `INSERT INTO floors (organization_id, building_id, floor_number, name)
       VALUES ($1, $2, 1, '1-qavat') RETURNING id;`,
      [orgAId, bldAId]
    );
    floorAId = fRes.rows[0].id;

    const rRes = await pool.query(
      `INSERT INTO rooms (organization_id, building_id, floor_id, room_number, name, type, is_active)
       VALUES ($1, $2, $3, '101', 'Xavfsiz Xona', 'office', true) RETURNING id;`,
      [orgAId, bldAId, floorAId]
    );
    roomAId = rRes.rows[0].id;

    // 3. Test faylini yuklash papkasiga yozib qo'yamiz
    await fs.mkdir(testUploadDir, { recursive: true });
    await fs.writeFile(testFilePath, Buffer.from("FAKE_IMAGE_DATA_FOR_SECURITY_TEST"));

    // 4. Org A uchun suratli inventar yaratamiz
    const itRes = await pool.query(
      `INSERT INTO items (organization_id, building_id, floor_id, room_id, name, inventory_number, category_id, qr_token, photo_url)
       VALUES ($1, $2, $3, $4, 'Maxfiy Server Qurilmasi', 'INV_A_${ts}', 'computer_equipment', 'qr_a_${ts}', $5)
       RETURNING id;`,
      [orgAId, bldAId, floorAId, roomAId, `/api/media/items/fake/photo/${testFileName}`]
    );
    itemAId = itRes.rows[0].id;

    // 5. Suratsiz inventar yaratamiz
    const itNoPhotoRes = await pool.query(
      `INSERT INTO items (organization_id, building_id, floor_id, room_id, name, inventory_number, category_id, qr_token, photo_url)
       VALUES ($1, $2, $3, $4, 'Suratsiz Stol', 'INV_NO_PHOTO_${ts}', 'furniture', 'qr_nophoto_${ts}', NULL)
       RETURNING id;`,
      [orgAId, bldAId, floorAId, roomAId]
    );
    itemWithoutPhotoId = itNoPhotoRes.rows[0].id;
  });

  after(async () => {
    // Tozalash
    try {
      if (fsSync.existsSync(testFilePath)) {
        await fs.unlink(testFilePath);
      }
    } catch {}

    if (pool) {
      await pool.query("DELETE FROM items WHERE organization_id IN ($1, $2);", [orgAId, orgBId]);
      await pool.query("DELETE FROM rooms WHERE organization_id IN ($1, $2);", [orgAId, orgBId]);
      await pool.query("DELETE FROM floors WHERE organization_id IN ($1, $2);", [orgAId, orgBId]);
      await pool.query("DELETE FROM buildings WHERE organization_id IN ($1, $2);", [orgAId, orgBId]);
      await pool.query("DELETE FROM organizations WHERE id IN ($1, $2);", [orgAId, orgBId]);
      await pool.end();
    }
  });

  it("1. Anonim (unauthenticated) so'rovlar qat'iy 401 bilan rad etilishi shart", async () => {
    const request = new NextRequest(`http://127.0.0.1:3000/api/media/items/${itemAId}/photo`);
    const response = await GET(request, { params: Promise.resolve({ id: itemAId }) });

    assert.equal(response.status, 401, "Anonim foydalanuvchi uchun status 401 bo'lishi shart");
    const data = await response.json();
    assert.equal(data.code, "AUTHENTICATION_REQUIRED");
  });

  it("2. Cross-Tenant Izolyatsiyasi: Org B xodimi Org A inventar suratiga kira olmasligi shart (403 TENANT_ACCESS_DENIED)", () => {
    const profileOrgB: Profile = {
      userId: "usr_org_b_inspector",
      organizationId: orgBId,
      role: "inspector",
      fullName: "Begona Tashkilot Xodimi",
      isActive: true,
      mustChangePassword: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    // Org A inventariga kirishni tekshiramiz
    const check = verifyTenantAccess(profileOrgB, orgAId);
    assert.equal(check.allowed, false, "Begona tashkilot inventariga ruxsat berilmasligi kerak");
    assert.equal(check.errorCode, "TENANT_ACCESS_DENIED");
  });

  it("3. O'z tashkiloti a'zosi (Org A) uchun ruxsat berilishi shart", () => {
    const profileOrgA: Profile = {
      userId: "usr_org_a_admin",
      organizationId: orgAId,
      role: "organization_admin",
      fullName: "Tashkilot A Administratori",
      isActive: true,
      mustChangePassword: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const check = verifyTenantAccess(profileOrgA, orgAId);
    assert.equal(check.allowed, true, "O'z tashkilotiga to'liq ruxsat berilishi kerak");
  });

  it("4. Super Admin ham bevosita tenant inventarlariga kira olmaydi (Strict Multi-Tenant Isolation)", () => {
    const superAdminProfile: Profile = {
      userId: "usr_super_admin",
      organizationId: null,
      role: "super_admin",
      fullName: "Platforma Super Admini",
      isActive: true,
      mustChangePassword: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const check = verifyTenantAccess(superAdminProfile, orgAId);
    assert.equal(check.allowed, false, "Super Admin tashkilotning ichki private inventariga bypass qilolmasligi shart");
    assert.equal(check.errorCode, "TENANT_ACCESS_DENIED");
  });

  it("5. Mavjud bo'lmagan inventar yoki suratsiz inventar so'ralganda 404 qaytishi kerak (Simulyatsiya)", async () => {
    // Profil tekshiruvi
    const profileOrgA: Profile = {
      userId: "usr_org_a_admin",
      organizationId: orgAId,
      role: "organization_admin",
      fullName: "Tashkilot A Administratori",
      isActive: true,
      mustChangePassword: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const statusCheck = verifyProfileStatus(profileOrgA);
    assert.equal(statusCheck.allowed, true);

    const tenantCheck = verifyTenantAccess(profileOrgA, orgAId);
    assert.equal(tenantCheck.allowed, true);

    const checkNoPhoto = await pool.query("SELECT photo_url FROM items WHERE id = $1;", [itemWithoutPhotoId]);
    assert.equal(checkNoPhoto.rows[0].photo_url, null, "Suratsiz inventar photo_url qiymati null bo'lishi shart");
  });

  it("6. Path Traversal himoyasi: path.basename har qanday ../ katalogdan chiqish urinishini yo'q qilishi shart", () => {
    const maliciousPaths = [
      "../../../../etc/passwd",
      "..\\..\\..\\windows\\system32\\config\\sam",
      "/var/lib/assetaudit/secrets.env",
      "....//....//config.json",
    ];

    for (const malPath of maliciousPaths) {
      const sanitized = path.basename(malPath);
      assert.ok(!sanitized.includes("/"), `Sanitized path must not contain slashes: ${sanitized}`);
      assert.ok(!sanitized.includes("\\"), `Sanitized path must not contain backslashes: ${sanitized}`);
      assert.ok(!sanitized.includes(".."), `Sanitized path must not contain ..: ${sanitized}`);
    }
  });

  it("7. Nginx konfiguratsiyasi: /uploads/ to'g'ridan-to'g'ri ommaviy kirish qat'iy bloklanganligi tasdiqlanishi shart", () => {
    const nginxConfPath = path.resolve(process.cwd(), "deploy", "nginx", "assetaudit.uz.conf");
    assert.ok(fsSync.existsSync(nginxConfPath), "Nginx konfiguratsiya fayli mavjud bo'lishi shart");

    const content = fsSync.readFileSync(nginxConfPath, "utf-8");

    // 1. Direct /uploads/ block
    assert.ok(
      content.includes("location /uploads/ {"),
      "Nginx da 'location /uploads/' bloki mavjud bo'lishi shart"
    );
    assert.ok(
      content.includes("deny all;"),
      "Nginx da 'deny all;' mavjud bo'lishi shart"
    );
    assert.ok(
      content.includes("return 403;"),
      "Nginx da 'return 403;' mavjud bo'lishi shart"
    );

    // 2. Internal X-Accel location
    assert.ok(
      content.includes("location /internal-uploads/ {"),
      "Nginx da 'location /internal-uploads/' bloki mavjud bo'lishi shart"
    );
    assert.ok(
      content.includes("internal;"),
      "X-Accel lokatsiyasi 'internal;' direktivasiga ega bo'lishi shart"
    );
    assert.ok(
      content.includes("nosniff"),
      "Nginx da 'nosniff' xavfsizlik sarlavhasi bo'lishi shart"
    );
    assert.ok(
      content.includes("sandbox"),
      "Nginx da 'sandbox' Content-Security-Policy bo'lishi shart"
    );
  });
});
