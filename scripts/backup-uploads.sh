#!/usr/bin/env bash
# ==============================================================================
# AssetAudit — Uploads Storage Backup Skripti (Linux VPS)
# Rasmlar va media fayllarini arxivlash va xeshini hisoblash
# ==============================================================================
set -euo pipefail

BACKUP_DIR="${BACKUP_DIR:-/var/backups/assetaudit/uploads}"
SOURCE_DIR="${UPLOAD_STORAGE_DIR:-/var/lib/assetaudit/uploads}"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
ARCHIVE_NAME="assetaudit_uploads_${TIMESTAMP}.tar.gz"
ARCHIVE_PATH="${BACKUP_DIR}/${ARCHIVE_NAME}"
RETENTION_DAYS=7

mkdir -p "${BACKUP_DIR}"

echo "[$(date '+%Y-%m-%d %H:%M:%S')] Uploads zaxiralash boshlandi: ${SOURCE_DIR} -> ${ARCHIVE_PATH}"

if [ ! -d "${SOURCE_DIR}" ]; then
    echo "[OGOHLANTIRISH] Manba jildi topilmadi: ${SOURCE_DIR}. Bo'sh arxiv yaratilmoqda."
    tar -czf "${ARCHIVE_PATH}" --files-from /dev/null
else
    # Faqat fayllar mavjud bo'lsa arxivlash
    tar -czf "${ARCHIVE_PATH}" -C "${SOURCE_DIR}" .
fi

# SHA-256 xeshini hisoblash (fayl butunligini tekshirish uchun)
sha256sum "${ARCHIVE_PATH}" > "${ARCHIVE_PATH}.sha256"

FILE_SIZE=$(du -h "${ARCHIVE_PATH}" | cut -f1)
echo "[$(date '+%Y-%m-%d %H:%M:%S')] Zaxira muvaffaqiyatli yakunlandi! Hajmi: ${FILE_SIZE}"
echo "[SHA-256]: $(cat "${ARCHIVE_PATH}.sha256")"

# 7 kundan eski zaxira nusxalarini tozalash (Retention Policy)
echo "[$(date '+%Y-%m-%d %H:%M:%S')] ${RETENTION_DAYS} kundan eski arxivlar tozalanmoqda..."
find "${BACKUP_DIR}" -type f -name "assetaudit_uploads_*.tar.gz*" -mtime "+${RETENTION_DAYS}" -exec rm -f {} +

echo "[$(date '+%Y-%m-%d %H:%M:%S')] Bajarildi."
