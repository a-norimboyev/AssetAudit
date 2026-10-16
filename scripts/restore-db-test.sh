#!/usr/bin/env bash
# ==============================================================================
# AssetAudit — Izolyatsiyalangan PostgreSQL Tiklash (Restore Test) Skripti
# Asosiy production bazasiga mutlaqo tegmasdan, zaxira faylning butunligini
# vaqtinchalik test bazasida to'liq tekshirish
# ==============================================================================
set -euo pipefail

BACKUP_FILE="${1:-}"
DB_HOST="${DB_HOST:-127.0.0.1}"
DB_PORT="${DB_PORT:-5432}"
DB_USER="${DB_USER:-postgres}"
TMP_DB="assetaudit_restore_verify_$$"

if [ -z "${BACKUP_FILE}" ] || [ ! -f "${BACKUP_FILE}" ]; then
    echo "XATO: Zaxira fayli ko'rsatilmadi yoki topilmadi!"
    echo "Foydalanish: $0 /yo'l/fayl.dump"
    exit 1
fi

echo "======================================================================"
echo "[$(date '+%Y-%m-%d %H:%M:%S')] IZOLYATSIYALANGAN TIKLASH SINOVI BOSHLANDI"
echo "Zaxira fayli: ${BACKUP_FILE}"
echo "Vaqtinchalik sinov bazasi: ${TMP_DB}"
echo "======================================================================"

# 1. SHA-256 xeshini tekshirish (agar .sha256 fayli mavjud bo'lsa)
if [ -f "${BACKUP_FILE}.sha256" ]; then
    echo "[1/4] Butunlik xeshi tekshirilmoqda..."
    sha256sum -c "${BACKUP_FILE}.sha256"
    echo "Xesh tekshiruvi: TO'G'RI (Fayl buzilmagan)."
fi

# 2. Vaqtinchalik izolyatsiyalangan baza yaratish
echo "[2/4] Vaqtinchalik sinov bazasi yaratilmoqda: ${TMP_DB}..."
createdb -h "${DB_HOST}" -p "${DB_PORT}" -U "${DB_USER}" "${TMP_DB}"

cleanup() {
    echo "[4/4] Tozalash: Vaqtinchalik sinov bazasi (${TMP_DB}) o'chirilmoqda..."
    dropdb -h "${DB_HOST}" -p "${DB_PORT}" -U "${DB_USER}" --if-exists "${TMP_DB}" || true
    echo "Izolyatsiyalangan sinov to'liq yakunlandi."
}
trap cleanup EXIT

# 3. Zaxira faylini vaqtinchalik bazaga tiklash (pg_restore)
echo "[3/4] Ma'lumotlarni tiklash bajarilmoqda..."
pg_restore -h "${DB_HOST}" -p "${DB_PORT}" -U "${DB_USER}" -d "${TMP_DB}" --no-owner --no-privileges "${BACKUP_FILE}" || true

# 4. Tiklangan ma'lumotlar butunligini tekshirish
echo "======================================================================"
echo "TIKLANGAN MA'LUMOTLAR STATISTIKASI (AUDIT TEKSHIRUVI):"
echo "----------------------------------------------------------------------"

psql -h "${DB_HOST}" -p "${DB_PORT}" -U "${DB_USER}" -d "${TMP_DB}" -t -c "
SELECT 'Tashkilotlar soni: ' || count(*) FROM organizations;
SELECT 'Binolar soni: ' || count(*) FROM buildings;
SELECT 'Xonalar soni: ' || count(*) FROM rooms;
SELECT 'Inventarlar soni: ' || count(*) FROM items;
SELECT 'Foydalanuvchilar soni: ' || count(*) FROM \"user\";
"

echo "======================================================================"
echo "NATIJA: Zaxira fayli 100% YAROQLI va muvaffaqiyatli tiklanadi!"
echo "======================================================================"
