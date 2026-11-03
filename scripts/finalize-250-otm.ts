import { Pool } from "pg";

const TEST_DB_URL = process.env.DATABASE_URL || "postgresql://postgres@127.0.0.1:5432/mulknazorat_sprint05b_test";

async function main() {
  const pool = new Pool({ connectionString: TEST_DB_URL });
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    // 1. Agar bo'sh SAMDU kodi bo'lsa o'chiramiz (chunki SAMDU_E2E mavjud)
    await client.query(`
      DELETE FROM organizations 
      WHERE code = 'SAMDU' 
        AND id NOT IN (SELECT organization_id FROM profiles WHERE organization_id IS NOT NULL)
        AND id NOT IN (SELECT organization_id FROM items WHERE organization_id IS NOT NULL);
    `);

    // 2. Jami sonini 250 ga tekshirish
    const currentRes = await client.query("SELECT count(*)::int as count FROM organizations;");
    const count = currentRes.rows[0].count;
    console.log("Hozirgi OTMlar soni:", count);

    if (count > 250) {
      const diff = count - 250;
      console.log(`Ortiqcha ${diff} ta OTMni o'chiramiz...`);
      await client.query(`
        DELETE FROM organizations
        WHERE id IN (
          SELECT id FROM organizations
          WHERE code NOT IN ('TATU', 'TATU_E2E', 'SAMDU_E2E')
            AND id NOT IN (SELECT organization_id FROM profiles WHERE organization_id IS NOT NULL)
            AND id NOT IN (SELECT organization_id FROM items WHERE organization_id IS NOT NULL)
          ORDER BY created_at DESC
          LIMIT $1
        );
      `, [diff]);
    }

    // Barcha tashkilotlar ro'yxatini olamiz
    const allOrgs = await client.query(`
      SELECT id, code, name, settings, is_active FROM organizations ORDER BY name ASC;
    `);

    const orgs = allOrgs.rows;
    console.log(`Bazada aniq ${orgs.length} ta OTM mavjud.`);

    const today = new Date("2026-11-02T12:00:00Z");

    const frozenIndices = new Set<number>();
    for (let f = 0; f < 25; f++) {
      frozenIndices.add(f * 10 + 7);
    }

    const expiringIndices = new Set<number>();
    let expCount = 0;
    for (let i = 0; i < orgs.length && expCount < 15; i++) {
      if (!frozenIndices.has(i) && !['TATU', 'TATU_E2E', 'SAMDU_E2E'].includes(orgs[i].code)) {
        if (i % 11 === 3 || expCount < 15 && i > 200) {
          expiringIndices.add(i);
          expCount++;
        }
      }
    }

    let frozenAssigned = 0;
    let expiringAssigned = 0;

    for (let i = 0; i < orgs.length; i++) {
      const org = orgs[i];
      const isFrozen = frozenIndices.has(i);
      const isExpiring = !isFrozen && expiringIndices.has(i);

      if (isFrozen) frozenAssigned++;
      if (isExpiring) expiringAssigned++;

      const currentSettings = org.settings || {};
      const limitMlrd = currentSettings.assetLimitMlrd || 500;
      const progressPercent = typeof currentSettings.auditProgress === "number" 
        ? currentSettings.auditProgress 
        : (10 + ((i * 19) % 85));
      const assetValueMlrd = Math.round((progressPercent / 100) * limitMlrd);

      let expiresAt: Date;
      let subscriptionNotes = "1 yillik dostup";

      if (isFrozen) {
        expiresAt = new Date("2026-09-30T00:00:00Z");
        subscriptionNotes = "Muzlatilgan / To'xtatilgan";
      } else if (isExpiring) {
        // 5 kundan 25 kungacha qolgan
        const remDays = 5 + (expiringAssigned * 1.3);
        expiresAt = new Date(today.getTime() + Math.round(remDays) * 24 * 60 * 60 * 1000);
        subscriptionNotes = "Dostup muddati tugayotgan";
      } else {
        // Sog'lom faol: 180 dan 365 kungacha
        const remDays = 180 + ((i * 7) % 185);
        expiresAt = new Date(today.getTime() + remDays * 24 * 60 * 60 * 1000);
      }

      const updatedSettings = {
        ...currentSettings,
        subscriptionPlan: "1_year",
        subscriptionStartsAt: "2026-01-01T00:00:00Z",
        subscriptionExpiresAt: expiresAt.toISOString(),
        subscriptionNotes,
        assetLimitMlrd: limitMlrd,
        assetValueMlrd: assetValueMlrd,
        auditProgress: progressPercent,
      };

      await client.query(`
        UPDATE organizations
        SET is_active = $1, settings = $2, updated_at = NOW()
        WHERE id = $3;
      `, [!isFrozen, JSON.stringify(updatedSettings), org.id]);
    }

    await client.query("COMMIT");

    const finalStats = await client.query(`
      SELECT 
        count(*)::int as total,
        count(*) filter (where is_active = true)::int as active,
        count(*) filter (where is_active = false)::int as inactive
      FROM organizations;
    `);

    console.log("=== BAZADAGI YAKUNIY STATISTIKA ===");
    console.log(finalStats.rows[0]);
    console.log(`Muzlatilgan: ${frozenAssigned}, Muddati tugayotgan: ${expiringAssigned}`);

  } catch (err) {
    await client.query("ROLLBACK");
    console.error("Xatolik:", err);
    throw err;
  } finally {
    client.release();
    await pool.end();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
