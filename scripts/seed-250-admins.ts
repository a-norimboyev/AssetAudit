import { Pool } from "pg";
import { hashPassword } from "better-auth/crypto";
import { randomUUID } from "node:crypto";
import { MOCK_UNIVERSITIES } from "../src/lib/mock/superadmin-mock-data";

const TEST_DB_URL = process.env.DATABASE_URL || "postgresql://postgres@127.0.0.1:5432/mulknazorat_sprint05b_test";

const ADMIN_NAMES_SEED = [
  "Abdullayev Jamshid Rustamovich",
  "Karimov Sherzod Alisherovich",
  "Xolmatov Bekzod Ikromovich",
  "Raximov Anvar Baxtiyorovich",
  "Tursunov Jasur Farxodovich",
  "Yo'ldoshev Otabek Shavkatovich",
  "Qodirov Aziz Ulug'bekovich",
  "Mirzayev Sardor Mansurovich",
  "Ergashev Ulug'bek Dilshodovich",
  "Sobirov Farruh Nodirovich",
  "Nazarov Elyor Zokirovich",
  "G'aniyev Doniyor Ravshanovich",
  "Usmonov Bobur Bahromovich",
  "Mamatqulov Sanjar Shuxratovich",
  "Hasanov Ilhom Odilovich",
  "Olimov Shuhrat Valiyevich",
  "Rustamov Bahodir Qobilovich",
  "Sultonov Akmal Rahimovich",
  "Jabborov Dilmurod Erkinovich",
  "Bozorov Umidjon Anvarovich",
];

export async function seed250Admins() {
  const pool = new Pool({ connectionString: TEST_DB_URL });
  const client = await pool.connect();

  try {
    console.log("=== 250 ta OTM Administratorlarini kiritish boshlandi ===");
    await client.query("BEGIN");

    // 1. Barcha tashkilotlarni olish
    const orgsRes = await client.query(`
      SELECT id, name, code, is_active, settings, created_at 
      FROM organizations 
      ORDER BY name ASC;
    `);

    const orgs = orgsRes.rows;
    console.log(`Bazada ${orgs.length} ta tashkilot mavjud.`);

    // 2. Mavjud administratorlarni tekshirish
    const existingAdminsRes = await client.query(`
      SELECT user_id, organization_id, full_name 
      FROM profiles 
      WHERE role = 'organization_admin';
    `);

    const orgsWithAdmin = new Map<string, string>();
    for (const row of existingAdminsRes.rows) {
      if (row.organization_id) {
        orgsWithAdmin.set(row.organization_id, row.user_id);
      }
    }

    console.log(`Hozirda administrator biriktirilgan OTMlar: ${orgsWithAdmin.size} ta.`);

    const defaultHashedPassword = await hashPassword("AdminPass123!");
    let createdCount = 0;
    let updatedCount = 0;

    for (let i = 0; i < orgs.length; i++) {
      const org = orgs[i];
      const settings = org.settings || {};
      
      // Real ism-familiya tanlash
      let adminFullName = (settings.adminName as string)?.trim() || ADMIN_NAMES_SEED[i % ADMIN_NAMES_SEED.length];
      
      // Agar mavjud admin "SamDU E2E Admin" yoki "TATU Administratori" kabi sun'iy bo'lsa, chiroyli ismga keltirish
      if (org.code === "TATU_E2E" || org.code === "TATU") {
        adminFullName = "Karimov Sherzod Alisherovich";
      } else if (org.code === "SAMDU_E2E" || org.code === "SAMDU") {
        adminFullName = "Xolmatov Bekzod Ikromovich";
      }

      const existingUserId = orgsWithAdmin.get(org.id);

      if (existingUserId) {
        // Mavjud adminning ismi va statusini yangilash
        await client.query(`
          UPDATE profiles 
          SET full_name = $1, is_active = $2, updated_at = NOW() 
          WHERE user_id = $3;
        `, [adminFullName, org.is_active, existingUserId]);

        await client.query(`
          UPDATE "user" 
          SET name = $1, updated_at = NOW() 
          WHERE id = $2;
        `, [adminFullName, existingUserId]);

        updatedCount++;
      } else {
        // Yangi admin yaratish
        const baseUsername = ((settings.adminLogin as string)?.trim() || `${org.code.toLowerCase().replace(/[^a-z0-9]/g, '')}.admin`)
          .toLowerCase();
        
        let username = baseUsername;
        let suffix = 1;
        while (true) {
          const uCheck = await client.query('SELECT id FROM "user" WHERE lower(username) = lower($1) LIMIT 1', [username]);
          if (uCheck.rows.length === 0) break;
          username = `${baseUsername}_${suffix++}`;
        }

        const email = `${username}@auth.assetaudit.uz`;
        const userId = randomUUID();
        const accountId = randomUUID();

        // user jadvali
        await client.query(`
          INSERT INTO "user" (id, name, email, email_verified, username, display_username, image, created_at, updated_at)
          VALUES ($1, $2, $3, true, $4, $4, null, $5, NOW());
        `, [userId, adminFullName, email, username, org.created_at || new Date()]);

        // account jadvali
        await client.query(`
          INSERT INTO account (id, account_id, provider_id, user_id, password, created_at, updated_at)
          VALUES ($1, $2, 'credential', $2, $3, NOW(), NOW());
        `, [accountId, userId, defaultHashedPassword]);

        // profiles jadvali
        await client.query(`
          INSERT INTO profiles (user_id, organization_id, role, full_name, is_active, must_change_password, created_at, updated_at)
          VALUES ($1, $2, 'organization_admin', $3, $4, false, $5, NOW());
        `, [userId, org.id, adminFullName, org.is_active, org.created_at || new Date()]);

        orgsWithAdmin.set(org.id, userId);
        createdCount++;
      }
    }

    await client.query("COMMIT");

    // Yakuniy statistika
    const finalStats = await client.query(`
      SELECT 
        count(*)::int as total,
        count(*) filter (where is_active = true)::int as active,
        count(*) filter (where is_active = false)::int as inactive,
        count(distinct organization_id)::int as orgs_count
      FROM profiles
      WHERE role = 'organization_admin';
    `);

    console.log("=== YAKUNIY STATISTIKA ===");
    console.log(finalStats.rows[0]);
    console.log(`Yaratildi: ${createdCount}, Yangilandi: ${updatedCount}`);

  } catch (err) {
    await client.query("ROLLBACK");
    console.error("Xatolik:", err);
    throw err;
  } finally {
    client.release();
    await pool.end();
  }
}

seed250Admins().catch((err) => {
  console.error(err);
  process.exit(1);
});
