/**
 * AssetAudit — Sprint 15: E2E Brauzer Testlari uchun Ma'lumotlarni Tayyorlash Skripti
 * Bazaga faqat mulknazorat_sprint05b_test (Port 5432) orqali ulanadi.
 */

import { Pool } from "pg";
import { hashPassword } from "better-auth/crypto";
import { randomUUID } from "node:crypto";

const TEST_DB_URL = "postgresql://postgres@127.0.0.1:5432/mulknazorat_sprint05b_test";

export const E2E_CREDENTIALS = {
  superAdmin: {
    username: "superadmin",
    password: "SuperAdminPass123!",
    fullName: "Bosh Super Admin",
    role: "super_admin",
  },
  admin: {
    username: "tatu.e2e.admin",
    password: "TestAdminPass123!",
    fullName: "TATU E2E Admin",
    role: "organization_admin",
  },
  registrar: {
    username: "tatu.e2e.registrar",
    password: "TestRegistrarPass123!",
    fullName: "TATU E2E Moddiy Javobgar",
    role: "registrar",
  },
  inspector: {
    username: "tatu.e2e.inspector",
    password: "TestInspectorPass123!",
    fullName: "TATU E2E Inspektor",
    role: "inspector",
  },
  samduAdmin: {
    username: "samdu.e2e.admin",
    password: "SamduAdminPass123!",
    fullName: "SamDU E2E Admin",
    role: "organization_admin",
  },
};

export async function seedE2EUsers(): Promise<{ orgAId: string; orgBId: string }> {
  const pool = new Pool({ connectionString: TEST_DB_URL });

  try {
    console.log("[SEED] E2E test ma'lumotlari tayyorlanmoqda...");

    // 0. organization_types tekshirish
    const typeCheck = await pool.query(
      `SELECT id FROM organization_types WHERE id = 'university'`
    );
    if (typeCheck.rows.length === 0) {
      await pool.query(
        `INSERT INTO organization_types (id, name, is_active, created_at)
         VALUES ('university', 'Oliy Ta''lim Muassasasi', true, NOW())
         ON CONFLICT (id) DO NOTHING`
      );
    }

    // 1. Tashkilot A (TATU E2E)
    const orgACode = "TATU_E2E";
    const orgARes = await pool.query(
      `SELECT id FROM organizations WHERE code = $1`,
      [orgACode]
    );
    let orgAId: string;
    if (orgARes.rows.length === 0) {
      orgAId = randomUUID();
      await pool.query(
        `INSERT INTO organizations (id, name, code, type_id, is_active, created_at, updated_at)
         VALUES ($1, $2, $3, 'university', true, NOW(), NOW())`,
        [orgAId, "TATU Axborot Texnologiyalari Universiteti (E2E)", orgACode]
      );
    } else {
      orgAId = orgARes.rows[0].id;
    }

    // 2. Tashkilot B (SAMDU E2E - Izolyatsiya uchun)
    const orgBCode = "SAMDU_E2E";
    const orgBRes = await pool.query(
      `SELECT id FROM organizations WHERE code = $1`,
      [orgBCode]
    );
    let orgBId: string;
    if (orgBRes.rows.length === 0) {
      orgBId = randomUUID();
      await pool.query(
        `INSERT INTO organizations (id, name, code, type_id, is_active, created_at, updated_at)
         VALUES ($1, $2, $3, 'university', true, NOW(), NOW())`,
        [orgBId, "Samarqand Davlat Universiteti (E2E)", orgBCode]
      );
    } else {
      orgBId = orgBRes.rows[0].id;
    }

    // 3. Foydalanuvchilarni kiritish
    const usersToSeed: Array<{ creds: (typeof E2E_CREDENTIALS)[keyof typeof E2E_CREDENTIALS]; orgId: string | null }> = [
      { creds: E2E_CREDENTIALS.superAdmin, orgId: null },
      { creds: E2E_CREDENTIALS.admin, orgId: orgAId },
      { creds: E2E_CREDENTIALS.registrar, orgId: orgAId },
      { creds: E2E_CREDENTIALS.inspector, orgId: orgAId },
      { creds: E2E_CREDENTIALS.samduAdmin, orgId: orgBId },
    ];

    for (const item of usersToSeed) {
      const { creds, orgId } = item;
      const email = `${creds.username}@auth.assetaudit.uz`;
      const hashed = await hashPassword(creds.password);

      // user jadvalida tekshirish
      const uCheck = await pool.query(
        `SELECT id FROM "user" WHERE username = $1 OR email = $2`,
        [creds.username, email]
      );

      let userId: string;
      if (uCheck.rows.length === 0) {
        userId = randomUUID();
        await pool.query(
          `INSERT INTO "user" (id, name, email, email_verified, username, display_username, created_at, updated_at)
           VALUES ($1, $2, $3, true, $4, $4, NOW(), NOW())`,
          [userId, creds.fullName, email, creds.username]
        );
      } else {
        userId = uCheck.rows[0].id;
        await pool.query(
          `UPDATE "user" SET username = $1, display_username = $1 WHERE id = $2`,
          [creds.username, userId]
        );
      }

      // account jadvali (parol)
      const accCheck = await pool.query(
        `SELECT id FROM account WHERE user_id = $1 AND provider_id = 'credential'`,
        [userId]
      );
      if (accCheck.rows.length === 0) {
        await pool.query(
          `INSERT INTO account (id, account_id, provider_id, user_id, password, created_at, updated_at)
           VALUES ($1, $2, 'credential', $3, $4, NOW(), NOW())`,
          [randomUUID(), userId, userId, hashed]
        );
      } else {
        await pool.query(
          `UPDATE account SET password = $1 WHERE user_id = $2 AND provider_id = 'credential'`,
          [hashed, userId]
        );
      }

      // profiles jadvali
      const profCheck = await pool.query(
        `SELECT user_id FROM profiles WHERE user_id = $1`,
        [userId]
      );
      if (profCheck.rows.length === 0) {
        await pool.query(
          `INSERT INTO profiles (user_id, organization_id, role, full_name, is_active, must_change_password, created_at, updated_at)
           VALUES ($1, $2, $3, $4, true, false, NOW(), NOW())`,
          [userId, orgId, creds.role, creds.fullName]
        );
      } else {
        await pool.query(
          `UPDATE profiles SET organization_id = $1, role = $2, full_name = $3, is_active = true, must_change_password = false WHERE user_id = $4`,
          [orgId, creds.role, creds.fullName, userId]
        );
      }
    }

    // 4. Bino, qavat va xonalar tayyorlash (TATU_E2E)
    let bldAId: string;
    const bldARes = await pool.query(
      `SELECT id FROM buildings WHERE organization_id = $1 AND code = 'BB-E2E'`,
      [orgAId]
    );
    if (bldARes.rows.length === 0) {
      bldAId = randomUUID();
      await pool.query(
        `INSERT INTO buildings (id, organization_id, name, code, is_active, created_at, updated_at)
         VALUES ($1, $2, 'TATU Bosh Bino (E2E)', 'BB-E2E', true, NOW(), NOW())`,
        [bldAId, orgAId]
      );
    } else {
      bldAId = bldARes.rows[0].id;
    }

    let floorAId: string;
    const floorARes = await pool.query(
      `SELECT id FROM floors WHERE building_id = $1 AND floor_number = 1`,
      [bldAId]
    );
    if (floorARes.rows.length === 0) {
      floorAId = randomUUID();
      await pool.query(
        `INSERT INTO floors (id, building_id, organization_id, floor_number, name, created_at, updated_at)
         VALUES ($1, $2, $3, 1, '1-qavat', NOW(), NOW())`,
        [floorAId, bldAId, orgAId]
      );
    } else {
      floorAId = floorARes.rows[0].id;
    }

    let roomAId: string;
    const roomARes = await pool.query(
      `SELECT id FROM rooms WHERE floor_id = $1 AND room_number = '101'`,
      [floorAId]
    );
    if (roomARes.rows.length === 0) {
      roomAId = randomUUID();
      await pool.query(
        `INSERT INTO rooms (id, building_id, floor_id, organization_id, room_number, name, is_active, created_at, updated_at)
         VALUES ($1, $2, $3, $4, '101', '101-Auditoriya', true, NOW(), NOW())`,
        [roomAId, bldAId, floorAId, orgAId]
      );
    } else {
      roomAId = roomARes.rows[0].id;
    }

    // SAMDU_E2E uchun bino va xona
    let bldBId: string;
    const bldBRes = await pool.query(
      `SELECT id FROM buildings WHERE organization_id = $1 AND code = 'SB-E2E'`,
      [orgBId]
    );
    if (bldBRes.rows.length === 0) {
      bldBId = randomUUID();
      await pool.query(
        `INSERT INTO buildings (id, organization_id, name, code, is_active, created_at, updated_at)
         VALUES ($1, $2, 'SamDU Bosh Bino', 'SB-E2E', true, NOW(), NOW())`,
        [bldBId, orgBId]
      );
    } else {
      bldBId = bldBRes.rows[0].id;
    }

    let floorBId: string;
    const floorBRes = await pool.query(
      `SELECT id FROM floors WHERE building_id = $1 AND floor_number = 1`,
      [bldBId]
    );
    if (floorBRes.rows.length === 0) {
      floorBId = randomUUID();
      await pool.query(
        `INSERT INTO floors (id, building_id, organization_id, floor_number, name, created_at, updated_at)
         VALUES ($1, $2, $3, 1, '1-qavat', NOW(), NOW())`,
        [floorBId, bldBId, orgBId]
      );
    } else {
      floorBId = floorBRes.rows[0].id;
    }

    let roomBId: string;
    const roomBRes = await pool.query(
      `SELECT id FROM rooms WHERE floor_id = $1 AND room_number = '201'`,
      [floorBId]
    );
    if (roomBRes.rows.length === 0) {
      roomBId = randomUUID();
      await pool.query(
        `INSERT INTO rooms (id, building_id, floor_id, organization_id, room_number, name, is_active, created_at, updated_at)
         VALUES ($1, $2, $3, $4, '201', 'SamDU 201-Laboratoriya', true, NOW(), NOW())`,
        [roomBId, bldBId, floorBId, orgBId]
      );
    } else {
      roomBId = roomBRes.rows[0].id;
    }

    // 5. Baseline inventar (TATU_E2E-INV-001) va QR token
    const itemInvNumber = "TATU_E2E-INV-001";
    const itemCheck = await pool.query(
      `SELECT id, qr_token FROM items WHERE organization_id = $1 AND inventory_number = $2`,
      [orgAId, itemInvNumber]
    );
    let seededItemId: string;
    const seededQrToken = "qr_tok_tatu_e2e_inv_001_secret";
    if (itemCheck.rows.length === 0) {
      seededItemId = randomUUID();
      await pool.query(
        `INSERT INTO items (id, organization_id, name, inventory_number, category_id, building_id, floor_id, room_id, status, condition, qr_token, created_at, updated_at)
         VALUES ($1, $2, 'E2E HP ProOne 440 Monoblok', $3, 'computer_equipment', $4, $5, $6, 'active', 'good', $7, NOW(), NOW())`,
        [seededItemId, orgAId, itemInvNumber, bldAId, floorAId, roomAId, seededQrToken]
      );
    } else {
      seededItemId = itemCheck.rows[0].id;
      await pool.query(
        `UPDATE items SET status = 'active', qr_token = $1 WHERE id = $2`,
        [seededQrToken, seededItemId]
      );
    }

    console.log("[SEED] E2E ma'lumotlari muvaffaqiyatli saqlandi.");
    return { orgAId, orgBId };
  } finally {
    await pool.end();
  }
}

if (process.argv[1]?.endsWith("seed-e2e-users.ts")) {
  seedE2EUsers()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error("[SEED ERROR]", err);
      process.exit(1);
    });
}
