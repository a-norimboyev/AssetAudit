#!/usr/bin/env bash
# ==============================================================================
# AssetAudit — VPS PostgreSQL READ-ONLY Database Identity va Schema Tekshiruvi
# Ushbu skript faqat SELECT so'rovlarini bajaradi. Hech narsani o'zgartirmaydi.
# ==============================================================================
set -euo pipefail

DB_NAME="mulknazorat"
DB_USER="postgres"

echo "======================================================================"
echo "  ASSETAUDIT — VPS DATABASE READ-ONLY IDENTITY DIAGNOSTIKA"
echo "  Baza: ${DB_NAME}"
echo "======================================================================"
echo ""

if ! command -v psql >/dev/null 2>&1; then
    echo "XATO: psql utilitasi VPS da topilmadi."
    exit 1
fi

echo "--- [1/5] BAZA IDENTIFIKATSIYASI ---"
psql -U "${DB_USER}" -d "${DB_NAME}" -c "SELECT current_database() as database, current_user as db_user, version() as pg_version;" || {
    echo "OGOHLANTIRISH: postgres foydalanuvchisi bilan to'g'ridan-to'g'ri ulanib bo'lmadi. Parol yoki huquqlar talab qilinishi mumkin."
}
echo ""

echo "--- [2/5] TATU TASHKILOTI TEKSHIRUVI ---"
psql -U "${DB_USER}" -d "${DB_NAME}" -c "SELECT id, name, code, is_active, type_id, created_at FROM organizations WHERE code = 'TATU';" || true
echo ""

echo "--- [3/5] TATU.ADMIN FOYDALANUVCHISI TEKSHIRUVI ---"
psql -U "${DB_USER}" -d "${DB_NAME}" -c "SELECT id, name, email, username, email_verified, created_at FROM \"user\" WHERE username = 'tatu.admin' OR email LIKE '%tatu%';" || true
echo ""

echo "--- [4/5] DRIZZLE MIGRATSIYALARI JURNALI (__drizzle_migrations) ---"
psql -U "${DB_USER}" -d "${DB_NAME}" -c "SELECT id, hash, to_timestamp(created_at / 1000) as applied_at FROM \"__drizzle_migrations\" ORDER BY id;" || {
    echo "OGOHLANTIRISH: __drizzle_migrations jadvali topilmadi (Drizzle tracking hali boshlanmagan bo'lishi mumkin)."
}
echo ""

echo "--- [5/5] ASOSIY JADVALLAR VA YOZUVLAR STATISTIKASI ---"
psql -U "${DB_USER}" -d "${DB_NAME}" -c "
SELECT 
  (SELECT count(*) FROM information_schema.tables WHERE table_schema = 'public') as total_tables,
  (SELECT count(*) FROM organizations) as orgs_count,
  (SELECT count(*) FROM \"user\") as users_count,
  (SELECT count(*) FROM items) as items_count;
" || true
echo ""

echo "======================================================================"
echo "  DATABASE IDENTITY DIAGNOSTIKA YAKUNLANDI (READ-ONLY)"
echo "======================================================================"
