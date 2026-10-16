#!/usr/bin/env bash
# ==============================================================================
# AssetAudit — Minimal-Downtime (<1s) Atomar Deployment va Rollback Skripti
# Symlink orqali atomar almashtirish va xatolik yuz berganda avtomatik orqaga qaytish.
# Eslatma: Bitta systemd jarayonini restart qilish paytida ~500ms-1s uzilish bo'lishi
# mumkin, shu sababli to'g'ri texnik termin: MINIMAL-DOWNTIME (<1s).
# ==============================================================================
set -euo pipefail

APP_ROOT="/var/www/assetaudit"
RELEASES_DIR="${APP_ROOT}/releases"
CURRENT_LINK="${APP_ROOT}/current"
SHARED_ENV="${APP_ROOT}/shared/.env.production"
SHARED_UPLOADS="/var/lib/assetaudit/uploads"

NEW_RELEASE_TAG=$(date +"%Y%m%d_%H%M%S")
TARGET_DIR="${RELEASES_DIR}/${NEW_RELEASE_TAG}"
SOURCE_PACKAGE="${1:-.next/standalone}"

echo "=== AssetAudit: Minimal-Downtime Atomar Deployment (${NEW_RELEASE_TAG}) ==="

mkdir -p "${RELEASES_DIR}" "${APP_ROOT}/shared" "${SHARED_UPLOADS}"
# Ruxsatlar: assetaudit egasi, setgid (2750) orqali yangi fayllar assetaudit guruhiga birikadi
chown -R assetaudit:assetaudit "${SHARED_UPLOADS}"
chmod 2750 "${SHARED_UPLOADS}"

# 1. Yangi reliz papkasini yaratish va nusxalash
echo "[1/5] Yangi reliz nusxalanmoqda: ${TARGET_DIR}..."
mkdir -p "${TARGET_DIR}"
cp -r "${SOURCE_PACKAGE}"/* "${TARGET_DIR}/"

# 2. Umumiy konfiguratsiyani (Environment) bog'lash
if [ -f "${SHARED_ENV}" ]; then
    echo "[2/5] Umumiy muhit fayli (.env.production) ulanmoqda..."
    ln -sf "${SHARED_ENV}" "${TARGET_DIR}/.env.production"
else
    echo "[OGOHLANTIRISH] ${SHARED_ENV} topilmadi. .env.production mavjudligiga ishonch hosil qiling."
fi

# 3. Oldingi relizni aniqlash (Rollback uchun)
PREVIOUS_RELEASE=""
if [ -L "${CURRENT_LINK}" ]; then
    PREVIOUS_RELEASE=$(readlink -f "${CURRENT_LINK}")
    echo "[3/5] Joriy faol reliz: ${PREVIOUS_RELEASE}"
fi

# 4. Atomar symlink almashtirish
echo "[4/5] Atomar symlink yangilanmoqda: ${CURRENT_LINK} -> ${TARGET_DIR}..."
ln -sfn "${TARGET_DIR}" "${CURRENT_LINK}"

# 5. Xizmatni qayta yuklash va Health Check tekshiruvi
echo "[5/5] Xizmat qayta ishga tushirilmoqda..."
systemctl restart assetaudit

echo "Sog'lomlik tekshiruvi (/api/health kutilmoqda)..."
sleep 2

HEALTH_CHECK=$(curl -s -o /dev/null -w "%{http_code}" http://127.0.0.1:3000/api/health || echo "500")

if [ "${HEALTH_CHECK}" = "200" ]; then
    echo "======================================================================"
    echo "DEPLOYMENT MUVAFFAQIYATLI YAKUNLANDI (HTTP 200 OK)!"
    echo "Faol reliz: ${TARGET_DIR}"
    echo "======================================================================"
    # Faqat oxirgi 3 ta relizni saqlab qolish
    cd "${RELEASES_DIR}"
    ls -t | tail -n +4 | xargs rm -rf 2>/dev/null || true
else
    echo "======================================================================"
    echo "[XATOLIK] Yangi reliz sog'lomlik tekshiruvidan o'tmadi (HTTP ${HEALTH_CHECK})!"
    if [ -n "${PREVIOUS_RELEASE}" ] && [ -d "${PREVIOUS_RELEASE}" ]; then
        echo "AVTOMATIK ROLLBACK: Oldingi barqaror relizga qaytilmoqda: ${PREVIOUS_RELEASE}..."
        ln -sfn "${PREVIOUS_RELEASE}" "${CURRENT_LINK}"
        systemctl restart assetaudit
        echo "Oldingi reliz qayta tiklandi."
    fi
    echo "======================================================================"
    exit 1
fi
