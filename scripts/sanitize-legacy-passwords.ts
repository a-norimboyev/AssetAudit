/**
 * AssetAudit — Xavfsiz Parol Tozalash Skripti (Legacy Plaintext Password Sanitizer)
 *
 * Vazifasi:
 * Ilgari organizations.settings JSON ustunida saqlangan 'adminPassword' ochiq matnli
 * kalitini xavfsiz tozalash (strip qilish).
 *
 * Xavfsizlik qoidalari:
 * 1. Sukut bo'yicha FAQAT tekshirish (DRY-RUN) rejimida ishlaydi.
 * 2. Haqiqiy o'chirish uchun --apply bayrog'i talab qilinadi.
 * 3. Tashkilotlarning boshqa sozlamalariga (kvotalar, obuna, prefikslar) mutlaqo tegmaydi.
 * 4. Tranzaksiya ichida xavfsiz bajariladi.
 *
 * Ishga tushirish:
 * npx tsx scripts/sanitize-legacy-passwords.ts          # Dry-run (tekshirish)
 * npx tsx scripts/sanitize-legacy-passwords.ts --apply  # Tozalashni qo'llash
 */

import { Pool } from "pg";

async function main() {
  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl) {
    console.error("XATO: DATABASE_URL muhit o'zgaruvchisi topilmadi.");
    process.exit(1);
  }

  const isApply = process.argv.includes("--apply");

  console.log("======================================================================");
  console.log("AssetAudit — Xavfsiz Parol Tozalash Skripti (Legacy Password Sanitizer)");
  console.log(`Rejim: ${isApply ? "HAQIQIY TOZALASH (--apply)" : "FAQAT TEKSHIRISH (DRY-RUN)"}`);
  console.log("======================================================================");

  const pool = new Pool({ connectionString: dbUrl, max: 1 });
  const client = await pool.connect();

  try {
    // 1. Ochiq parol saqlangan tashkilotlarni sanash
    const countRes = await client.query(`
      SELECT count(*) as count
      FROM organizations
      WHERE settings ? 'adminPassword';
    `);

    const count = parseInt(countRes.rows[0]?.count || "0", 10);
    console.log(`Aniqlangan tashkilotlar soni (adminPassword mavjud): ${count}`);

    if (count === 0) {
      console.log("TABRIKLAYMIZ: Bazada ochiq matnli adminPassword topilmadi. Tizim toza!");
      return;
    }

    if (!isApply) {
      console.log("\n[DIQQAT] Hozir tekshirish rejimi (Dry-run). Hech qanday o'zgarish qilinmadi.");
      console.log("Ushbu yozuvlarni tozalash uchun quyidagi buyruqni bering:");
      console.log("  npx tsx scripts/sanitize-legacy-passwords.ts --apply");
      return;
    }

    // 2. Tranzaksiya ichida tozalash
    console.log("\nTranzaksiya boshlanmoqda va ochiq parollar tozalanmoqda...");
    await client.query("BEGIN;");

    const updateRes = await client.query(`
      UPDATE organizations
      SET settings = settings - 'adminPassword',
          updated_at = NOW()
      WHERE settings ? 'adminPassword';
    `);

    await client.query("COMMIT;");
    console.log(`MUVAFFAQIYAT: ${updateRes.rowCount} ta tashkilotdagi 'adminPassword' kaliti to'liq tozalandi.`);
    console.log("Barcha parollar endi faqat Better Auth scrypt xeshlari orqali himoyalangan.");
  } catch (err) {
    await client.query("ROLLBACK;");
    console.error("XATOLIK YUZ BERDI (ROLLBACK QILINDI):", err);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

main().catch((err) => {
  console.error("Kutilmagan xatolik:", err);
  process.exit(1);
});
