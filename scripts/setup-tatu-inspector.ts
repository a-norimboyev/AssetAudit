import { Pool } from "pg";
import { hashPassword } from "better-auth/crypto";
import { randomUUID } from "node:crypto";

async function main() {
  const pool = new Pool({
    connectionString: "postgresql://postgres@127.0.0.1:5432/mulknazorat_sprint05b_test",
  });

  try {
    console.log("=== Setting up Inspector & Active Audit Cycle for TATU ===");

    // 1. Get TATU Org
    const tatuOrgRes = await pool.query(`SELECT id, name FROM organizations WHERE code = 'TATU'`);
    if (tatuOrgRes.rows.length === 0) {
      throw new Error("TATU organization not found");
    }
    const tatuOrgId = tatuOrgRes.rows[0].id;

    // 2. Create or update inspector user for TATU: username = 'tatu.inspector', password = 'InspectorPass123!'
    const inspectorUsername = "tatu.inspector";
    const inspectorEmail = "inspector@tatu.uz";
    const inspectorFullName = "TATU Bosh Tekshiruvchisi";
    const inspectorPassword = "InspectorPass123!";
    const hashed = await hashPassword(inspectorPassword);

    const uCheck = await pool.query(`SELECT id FROM "user" WHERE username = $1 OR email = $2`, [inspectorUsername, inspectorEmail]);
    let inspectorUserId: string;
    if (uCheck.rows.length === 0) {
      inspectorUserId = randomUUID();
      await pool.query(
        `INSERT INTO "user" (id, name, email, email_verified, username, display_username, created_at, updated_at)
         VALUES ($1, $2, $3, true, $4, $4, NOW(), NOW())`,
        [inspectorUserId, inspectorFullName, inspectorEmail, inspectorUsername]
      );
      console.log(`Created user ${inspectorUsername} (id: ${inspectorUserId})`);
    } else {
      inspectorUserId = uCheck.rows[0].id;
      await pool.query(
        `UPDATE "user" SET name = $1, username = $2, display_username = $2, email = $3, updated_at = NOW() WHERE id = $4`,
        [inspectorFullName, inspectorUsername, inspectorEmail, inspectorUserId]
      );
      console.log(`Updated user ${inspectorUsername} (id: ${inspectorUserId})`);
    }

    // Account / Password
    const accCheck = await pool.query(`SELECT id FROM account WHERE user_id = $1 AND provider_id = 'credential'`, [inspectorUserId]);
    if (accCheck.rows.length === 0) {
      await pool.query(
        `INSERT INTO account (id, account_id, provider_id, user_id, password, created_at, updated_at)
         VALUES ($1, $2, 'credential', $3, $4, NOW(), NOW())`,
        [randomUUID(), inspectorUserId, inspectorUserId, hashed]
      );
      console.log(`Created account credential for ${inspectorUsername}`);
    } else {
      await pool.query(
        `UPDATE account SET password = $1, updated_at = NOW() WHERE user_id = $2 AND provider_id = 'credential'`,
        [hashed, inspectorUserId]
      );
      console.log(`Updated account credential for ${inspectorUsername}`);
    }

    // Profile
    const profCheck = await pool.query(`SELECT user_id FROM profiles WHERE user_id = $1`, [inspectorUserId]);
    if (profCheck.rows.length === 0) {
      await pool.query(
        `INSERT INTO profiles (user_id, organization_id, role, full_name, is_active, must_change_password, created_at, updated_at)
         VALUES ($1, $2, 'inspector', $3, true, false, NOW(), NOW())`,
        [inspectorUserId, tatuOrgId, inspectorFullName]
      );
      console.log(`Created profile (inspector) for ${inspectorUsername}`);
    } else {
      await pool.query(
        `UPDATE profiles SET organization_id = $1, role = 'inspector', full_name = $2, is_active = true, must_change_password = false, updated_at = NOW()
         WHERE user_id = $3`,
        [tatuOrgId, inspectorFullName, inspectorUserId]
      );
      console.log(`Updated profile (inspector) for ${inspectorUsername}`);
    }

    // 3. Check / Create active inventory cycle for TATU
    const cycleCheck = await pool.query(
      `SELECT id, title, status FROM inventory_cycles WHERE organization_id = $1 AND status IN ('in_progress', 'planned')`,
      [tatuOrgId]
    );

    let cycleId: string;
    if (cycleCheck.rows.length === 0) {
      cycleId = randomUUID();
      await pool.query(
        `INSERT INTO inventory_cycles (id, organization_id, title, status, start_date, created_by, notes, created_at, updated_at)
         VALUES ($1, $2, '2026-yil Kuzgi Rejali Inventarizatsiya', 'in_progress', NOW(), $3, 'Oltin Fond va auditoriyalar auditi', NOW(), NOW())`,
        [cycleId, tatuOrgId, inspectorUserId]
      );
      console.log(`Created active cycle '2026-yil Kuzgi Rejali Inventarizatsiya' (id: ${cycleId})`);
    } else {
      cycleId = cycleCheck.rows[0].id;
      console.log(`Active cycle exists: ${cycleCheck.rows[0].title} (${cycleId})`);
    }

    // Ensure room audits exist
    const roomsRes = await pool.query(`SELECT id FROM rooms WHERE organization_id = $1 AND is_active = true`, [tatuOrgId]);
    for (const room of roomsRes.rows) {
      await pool.query(
        `INSERT INTO room_audits (id, cycle_id, organization_id, room_id, status, created_at, updated_at)
         VALUES ($1, $2, $3, $4, 'pending', NOW(), NOW())
         ON CONFLICT DO NOTHING`,
        [randomUUID(), cycleId, tatuOrgId, room.id]
      );
    }
    console.log(`Ensured room audits for ${roomsRes.rows.length} rooms`);

    // Ensure cycle_items snapshot exists
    const itemsRes = await pool.query(
      `SELECT id, building_id, floor_id, room_id, inventory_number, name, category_id, condition, price
       FROM items WHERE organization_id = $1 AND status = 'active'`,
      [tatuOrgId]
    );
    for (const it of itemsRes.rows) {
      await pool.query(
        `INSERT INTO cycle_items (id, cycle_id, organization_id, item_id, expected_building_id, expected_floor_id, expected_room_id, inventory_number, item_name, category_id, condition, price, snapshot_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, NOW())
         ON CONFLICT DO NOTHING`,
        [randomUUID(), cycleId, tatuOrgId, it.id, it.building_id, it.floor_id, it.room_id, it.inventory_number, it.name, it.category_id, it.condition, it.price]
      );
    }
    console.log(`Snapshot of ${itemsRes.rows.length} items recorded`);

    console.log("=== Setup completed successfully! ===");
  } catch (err) {
    console.error("Setup error:", err);
  } finally {
    await pool.end();
  }
}

main();
