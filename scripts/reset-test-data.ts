import { Pool } from "pg";
import { hashPassword } from "better-auth/crypto";

async function cleanDatabase(connectionString: string, dbLabel: string) {
  const pool = new Pool({ connectionString });
  let client;
  try {
    client = await pool.connect();
    await client.query("BEGIN");

    console.log(`\n=== [${dbLabel}] Tozalash boshlandi ===`);

    // 0. Super Adminni aniqlash
    const mainAdminRes = await client.query(`
      SELECT id FROM "user" 
      WHERE username = 'superadmin' OR email = 'superadmin@auth.assetaudit.uz' 
      LIMIT 1;
    `);

    let superAdminUserId: string;

    if (mainAdminRes.rows.length > 0) {
      superAdminUserId = mainAdminRes.rows[0].id;
    } else {
      const createRes = await client.query(`
        INSERT INTO "user" (id, name, email, email_verified, username, display_username, created_at, updated_at)
        VALUES ('1aa4a1ce-0c99-473b-b444-17efbe0aa55c', 'Bosh Super Admin', 'superadmin@auth.assetaudit.uz', true, 'superadmin', 'superadmin', NOW(), NOW())
        RETURNING id;
      `);
      superAdminUserId = createRes.rows[0].id;
    }

    // 1. Audit va skanerlash jurnallari
    await client.query("DELETE FROM cycle_conflicts;");
    await client.query("DELETE FROM scan_events;");
    await client.query("DELETE FROM room_audits;");
    await client.query("DELETE FROM cycle_items;");
    await client.query("DELETE FROM inventory_cycles;");

    // 2. Inventarlar
    await client.query("DELETE FROM items;");

    // 3. Joylashuvlar (xonalar, qavatlar, binolar)
    await client.query("DELETE FROM rooms;");
    await client.query("DELETE FROM floors;");
    await client.query("DELETE FROM buildings;");

    // 4. Tashkilot xodimlari va profillari (Super Admindan boshqalar)
    await client.query(`DELETE FROM profiles WHERE user_id != $1;`, [superAdminUserId]);
    await client.query(`DELETE FROM session WHERE user_id != $1;`, [superAdminUserId]);
    await client.query("DELETE FROM verification;");
    await client.query(`DELETE FROM account WHERE user_id != $1;`, [superAdminUserId]);
    await client.query(`DELETE FROM "user" WHERE id != $1;`, [superAdminUserId]);

    // 5. Barcha tashkilotlarni to'liq o'chirish (0 holatiga keltirish)
    await client.query("DELETE FROM organizations;");

    // 6. Super Admin ma'lumotlarini tiklash
    const hashedPassword = await hashPassword("SuperAdminPass123!");

    await client.query(`
      UPDATE "user" 
      SET name = 'Bosh Super Admin',
          email = 'superadmin@auth.assetaudit.uz',
          username = 'superadmin',
          display_username = 'superadmin',
          email_verified = true,
          updated_at = NOW()
      WHERE id = $1;
    `, [superAdminUserId]);

    await client.query(`
      INSERT INTO account (id, account_id, provider_id, user_id, password, created_at, updated_at)
      VALUES ($1, $1, 'credential', $1, $2, NOW(), NOW())
      ON CONFLICT (id) DO UPDATE SET password = $2, updated_at = NOW();
    `, [superAdminUserId, hashedPassword]);

    await client.query(`
      INSERT INTO profiles (user_id, organization_id, role, full_name, is_active, must_change_password, created_at, updated_at)
      VALUES ($1, NULL, 'super_admin', 'Bosh Super Admin', true, false, NOW(), NOW())
      ON CONFLICT (user_id) DO UPDATE 
      SET organization_id = NULL, role = 'super_admin', is_active = true, must_change_password = false, updated_at = NOW();
    `, [superAdminUserId]);

    await client.query("COMMIT");

    // Yakuniy statistika
    const finalCounts = await client.query(`
      SELECT 
        (SELECT count(*) FROM organizations) as organizations,
        (SELECT count(*) FROM buildings) as buildings,
        (SELECT count(*) FROM floors) as floors,
        (SELECT count(*) FROM rooms) as rooms,
        (SELECT count(*) FROM items) as items,
        (SELECT count(*) FROM scan_events) as scan_events,
        (SELECT count(*) FROM inventory_cycles) as inventory_cycles,
        (SELECT count(*) FROM profiles) as profiles,
        (SELECT count(*) FROM "user") as users;
    `);

    console.log(`=== [${dbLabel}] MUVAFFAQIYATLI: Barcha tashkilotlar va ma'lumotlar 0 ga keltirildi! ===`);
    console.log("YAKUNIY_STATISTIKA:", JSON.stringify(finalCounts.rows[0], null, 2));
  } catch (err) {
    if (client) await client.query("ROLLBACK");
    console.error(`[${dbLabel}] Xatolik:`, err);
  } finally {
    if (client) client.release();
    await pool.end();
  }
}

async function resetAllTestData() {
  // Faqat izolyatsiyalangan test bazasini tozalash (Hech qachon asosiy yoki lokal mulknazorat bazasiga tegmaslik!)
  const testDbUrl = process.env.TEST_DATABASE_URL || "postgresql://postgres@127.0.0.1:5432/mulknazorat_sprint05b_test";
  await cleanDatabase(testDbUrl, "Faqat Test Muhiti");
}

resetAllTestData().catch((err) => {
  console.error("Kutilmagan xatolik:", err);
  process.exit(1);
});
