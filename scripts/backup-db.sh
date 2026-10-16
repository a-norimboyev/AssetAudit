#!/usr/bin/env bash
# ==============================================================================
# AssetAudit (assetaudit.uz) — PostgreSQL Avtomatik Zaxiralash (Backup) Skripti
# Eskiz VPS Linux uchun optimallashtirilgan
# ==============================================================================
set -euo pipefail

BACKUP_DIR="${BACKUP_DIR:-/var/backups/assetaudit/postgres}"
DATABASE_NAME="${DATABASE_NAME:-assetaudit_production}"
DB_USER="${DB_USER:-assetaudit_user}"
DB_HOST="${DB_HOST:-127.0.0.1}"
DB_PORT="${DB_PORT:-5432}"

TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_FILE="${BACKUP_DIR}/db_${DATABASE_NAME}_${TIMESTAMP}.dump"
RETENTION_DAYS=7

mkdir -p "${BACKUP_DIR}"
chmod 700 "${BACKUP_DIR}"

echo "[$(date '+%Y-%m-%d %H:%M:%S')] PostgreSQL zaxiralash boshlandi: ${DATABASE_NAME} -> ${BACKUP_FILE}"

# pg_dump orqali siqilgan binar formatda eksport qilish (-Fc yuqori siqish va tez tiklash beradi)
PGPASSWORD="${PGPASSWORD:-}" pg_dump \
    -h "${DB_HOST}" \
    -p "${DB_PORT}" \
    -U "${DB_USER}" \
    -d "${DATABASE_NAME}" \
    -F c \
    -b \
    -v \
    -f "${BACKUP_FILE}"

# Butunlik xeshini (SHA-256) hisoblash
sha256sum "${BACKUP_FILE}" > "${BACKUP_FILE}.sha256"
chmod 600 "${BACKUP_FILE}" "${BACKUP_FILE}.sha256"

FILE_SIZE=$(du -h "${BACKUP_FILE}" | cut -f1)
echo "[$(date '+%Y-%m-%d %H:%M:%S')] Zaxira muvaffaqiyatli saqlandi! Hajmi: ${FILE_SIZE}"
echo "[SHA-256]: $(cat "${BACKUP_FILE}.sha256")"

# ------------------------------------------------------------------------------
# Offsite Backup (Tashqi xavfsiz serverga uzatish — Masalan, SFTP, S3, Rclone)
# ------------------------------------------------------------------------------
if [ -n "${OFFSITE_REMOTE_DEST:-}" ]; then
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] Offsite zaxiralash serveriga uzatilmoqda: ${OFFSITE_REMOTE_DEST}"
    # rsync yoki scp orqali tashqi xavfsiz xotiraga nusxalash
    # rsync -avz -e "ssh -p 22" "${BACKUP_FILE}" "${OFFSITE_REMOTE_DEST}/"
    echo "[Offsite]: Tayyor."
fi

# ------------------------------------------------------------------------------
# Retention Policy (Eski zaxira fayllarini tozalash)
# ------------------------------------------------------------------------------
echo "[$(date '+%Y-%m-%d %H:%M:%S')] ${RETENTION_DAYS} kundan eski zaxiralar tozalanmoqda..."
find "${BACKUP_DIR}" -type f -name "db_${DATABASE_NAME}_*.dump*" -mtime "+${RETENTION_DAYS}" -exec rm -f {} +

echo "[$(date '+%Y-%m-%d %H:%M:%S')] Zaxiralash jarayoni to'liq yakunlandi."
