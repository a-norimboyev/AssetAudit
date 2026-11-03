import { Pool } from "pg";
import { MOCK_UNIVERSITIES } from "../src/lib/mock/superadmin-mock-data";

const TEST_DB_URL = process.env.DATABASE_URL || "postgresql://postgres@127.0.0.1:5432/mulknazorat_sprint05b_test";

export async function seed250OTM() {
  const pool = new Pool({ connectionString: TEST_DB_URL });
  const client = await pool.connect();

  try {
    console.log("=== 250 ta OTMni bazaga kiritish boshlandi ===");
    await client.query("BEGIN");

    // 1. organization_types tekshirish
    await client.query(`
      INSERT INTO organization_types (id, name, is_active, created_at)
      VALUES ('university', 'Oliy Ta''lim Muassasasi', true, NOW())
      ON CONFLICT (id) DO NOTHING;
    `);

    // 2. Keraksiz test tashkilotlarni tozalash (vbnm, SMV va ortiqcha duplicate TATU/SAMDU agar bor bo'lsa)
    await client.query(`
      DELETE FROM profiles 
      WHERE organization_id IN (
        SELECT id FROM organizations WHERE code IN ('VBNM', 'SMV', 'TATU', 'SAMDU')
      );
    `);
    await client.query(`
      DELETE FROM items 
      WHERE organization_id IN (
        SELECT id FROM organizations WHERE code IN ('VBNM', 'SMV', 'TATU', 'SAMDU')
      );
    `);
    await client.query(`
      DELETE FROM buildings 
      WHERE organization_id IN (
        SELECT id FROM organizations WHERE code IN ('VBNM', 'SMV', 'TATU', 'SAMDU')
      );
    `);
    await client.query(`
      DELETE FROM organizations WHERE code IN ('VBNM', 'SMV', 'TATU', 'SAMDU');
    `);

    // 3. TATU_E2E va SAMDU_E2E ni to'g'irlash
    const today = new Date("2026-11-02T12:00:00Z");
    const tatuExp = new Date(today.getTime() + 361 * 24 * 60 * 60 * 1000);
    const samduExp = new Date(today.getTime() + 352 * 24 * 60 * 60 * 1000);

    await client.query(`
      UPDATE organizations
      SET name = 'Toshkent Axborot Texnologiyalari Universiteti',
          is_active = true,
          settings = $1,
          updated_at = NOW()
      WHERE code = 'TATU_E2E';
    `, [JSON.stringify({
      subscriptionPlan: "1_year",
      subscriptionStartsAt: "2026-01-01T00:00:00Z",
      subscriptionExpiresAt: tatuExp.toISOString(),
      subscriptionNotes: "1 yillik dostup",
      assetLimitMlrd: 500,
      assetValueMlrd: 360,
      auditProgress: 72,
      adminName: "Karimov Sherzod Alisherovich",
      adminPhone: "+998 90 103 700",
      adminLogin: "tatu.e2e.admin",
      region: "Toshkent shahri",
      logoUrl: null,
    })]);

    await client.query(`
      UPDATE organizations
      SET name = 'Samarqand Davlat Universiteti',
          is_active = true,
          settings = $1,
          updated_at = NOW()
      WHERE code = 'SAMDU_E2E';
    `, [JSON.stringify({
      subscriptionPlan: "1_year",
      subscriptionStartsAt: "2026-01-01T00:00:00Z",
      subscriptionExpiresAt: samduExp.toISOString(),
      subscriptionNotes: "1 yillik dostup",
      assetLimitMlrd: 500,
      assetValueMlrd: 270,
      auditProgress: 54,
      adminName: "Xolmatov Bekzod Ikromovich",
      adminPhone: "+998 90 107 400",
      adminLogin: "samdu.e2e.admin",
      region: "Samarqand viloyati",
      logoUrl: null,
    })]);

    // 4. Qolgan 248 ta OTMni MOCK_UNIVERSITIES ro'yxatidan kiritish (TATU va SAMDU kodlaridan tashqari)
    const otherMocks = MOCK_UNIVERSITIES.filter(
      (m) => m.code !== "TATU" && m.code !== "SAMDU"
    ).slice(0, 248);

    console.log(`Boshqa OTMlar soni: ${otherMocks.length} ta (+ 2 ta mavjud E2E = 250 ta)`);

    // 25 ta muzlatilgan OTM indekslari (0..247 oralig'ida)
    const frozenIndices = new Set<number>();
    for (let f = 0; f < 25; f++) {
      frozenIndices.add(f * 10 + 5);
    }

    // 15 ta muddati tugayotgan OTM indekslari (faollar orasidan)
    const expiringIndices = new Set<number>();
    for (let e = 0; e < 15; e++) {
      expiringIndices.add(e * 16 + 2);
    }

    for (let i = 0; i < otherMocks.length; i++) {
      const mock = otherMocks[i];
      const isFrozen = frozenIndices.has(i);
      const isExpiring = !isFrozen && expiringIndices.has(i);

      let expiresAt: Date;
      let subscriptionNotes = "1 yillik dostup";

      if (isFrozen) {
        expiresAt = new Date("2026-09-30T00:00:00Z");
        subscriptionNotes = "Muzlatilgan / To'xtatilgan";
      } else if (isExpiring) {
        // 4 kundan 26 kungacha qolgan (Muddati tugayotgan)
        const remDays = 4 + (i % 22);
        expiresAt = new Date(today.getTime() + remDays * 24 * 60 * 60 * 1000);
        subscriptionNotes = "Dostup muddati tugayotgan";
      } else {
        // Sog'lom faol: 200 dan 365 kungacha
        const remDays = 180 + ((i * 13) % 185);
        expiresAt = new Date(today.getTime() + remDays * 24 * 60 * 60 * 1000);
      }

      const startsAt = new Date("2026-01-01T00:00:00Z");
      const limitMlrd = 500;
      
      // Foiz taqsimoti: turli real foizlar (0% - 95%)
      const progressPercent = mock.auditProgress ?? (15 + ((i * 17) % 80));
      const assetValueMlrd = Math.round((progressPercent / 100) * limitMlrd);

      const settings = {
        subscriptionPlan: "1_year",
        subscriptionStartsAt: startsAt.toISOString(),
        subscriptionExpiresAt: expiresAt.toISOString(),
        subscriptionNotes,
        assetLimitMlrd: limitMlrd,
        assetValueMlrd: assetValueMlrd,
        auditProgress: progressPercent,
        adminName: mock.adminName,
        adminPhone: mock.adminPhone,
        adminLogin: mock.adminLogin,
        region: mock.region,
        logoUrl: mock.logoUrl || null,
      };

      const code = mock.code.toUpperCase().trim();
      const name = mock.name.trim();

      const existing = await client.query(
        "SELECT id FROM organizations WHERE upper(btrim(code)) = upper(btrim($1)) LIMIT 1",
        [code]
      );

      if (existing.rows.length > 0) {
        await client.query(
          `UPDATE organizations
           SET name = $1, is_active = $2, settings = $3, updated_at = NOW()
           WHERE id = $4`,
          [name, !isFrozen, JSON.stringify(settings), existing.rows[0].id]
        );
      } else {
        await client.query(
          `INSERT INTO organizations (name, code, type_id, is_active, settings, created_at, updated_at)
           VALUES ($1, $2, 'university', $3, $4, NOW(), NOW())`,
          [name, code, !isFrozen, JSON.stringify(settings)]
        );
      }
    }

    await client.query("COMMIT");

    // Tekshirish natijalari
    const statsRes = await client.query(`
      SELECT 
        count(*)::int as total,
        count(*) filter (where is_active = true)::int as active,
        count(*) filter (where is_active = false)::int as inactive
      FROM organizations;
    `);

    console.log("=== BAZADAGI YAKUNIY STATISTIKA ===");
    console.log(statsRes.rows[0]);

  } catch (err) {
    await client.query("ROLLBACK");
    console.error("Xatolik:", err);
    throw err;
  } finally {
    client.release();
    await pool.end();
  }
}

seed250OTM().catch((err) => {
  console.error(err);
  process.exit(1);
});
