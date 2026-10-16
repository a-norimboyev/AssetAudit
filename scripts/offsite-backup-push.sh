#!/usr/bin/env bash
# ==============================================================================
# AssetAudit — Offsite Zaxiralash (Push Model / Shifrlangan uzatish)
# Pullik servislarsiz (0 so'm), ikkinchi server yoki xavfsiz mashinaga uzatish
# ==============================================================================
set -euo pipefail

BACKUP_DIR="${BACKUP_DIR:-/var/backups/assetaudit/postgres}"
REMOTE_DEST="${OFFSITE_DEST:-}" # Masalan: backupuser@secondary.server.uz:/var/backups/assetaudit_offsite
ENC_KEY_FILE="${BACKUP_ENC_KEY:-/etc/assetaudit/backup_encryption.key}"

if [ -z "${REMOTE_DEST}" ]; then
    echo "[OGOHLANTIRISH] OFFSITE_DEST muhit o'zgaruvchisi ko'rsatilmadi. Offsite push o'tkazib yuborildi."
    exit 0
fi

# Eng so'nggi dump faylini topish
LATEST_DUMP=$(ls -t "${BACKUP_DIR}"/*.dump 2>/dev/null | head -n 1)

if [ -z "${LATEST_DUMP}" ]; then
    echo "XATO: Zaxira fayli topilmadi!"
    exit 1
fi

echo "[$(date '+%Y-%m-%d %H:%M:%S')] Offsite shifrlangan uzatish boshlandi: ${LATEST_DUMP}"

# 1. Agar shifrlash kaliti mavjud bo'lsa, OpenSSL AES-256-CBC bilan shifrlash
TRANSFER_FILE="${LATEST_DUMP}"
if [ -f "${ENC_KEY_FILE}" ]; then
    echo "[1/3] AES-256-CBC bilan shifrlanmoqda..."
    TRANSFER_FILE="${LATEST_DUMP}.enc"
    openssl enc -aes-256-cbc -salt -pbkdf2 -in "${LATEST_DUMP}" -out "${TRANSFER_FILE}" -pass "file:${ENC_KEY_FILE}"
fi

# 2. Rsync / SCP orqali ikkinchi xavfsiz serverga uzatish
echo "[2/3] SSH orqali offsite serverga uzatilmoqda: ${REMOTE_DEST}..."
rsync -avz -e "ssh -p 22 -o StrictHostKeyChecking=accept-new" "${TRANSFER_FILE}" "${LATEST_DUMP}.sha256" "${REMOTE_DEST}/"

# 3. Vaqtinchalik .enc faylni tozalash
if [ "${TRANSFER_FILE}" != "${LATEST_DUMP}" ]; then
    rm -f "${TRANSFER_FILE}"
fi

echo "[3/3] Offsite uzatish muvaffaqiyatli yakunlandi."
