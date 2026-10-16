#!/usr/bin/env bash
# ==============================================================================
# AssetAudit — Eskiz VPS: Mavjud Loyihalarni Aniqlash va Favqulodda Backup
# Ushbu skript:
# 1. VPS dagi barcha loyihalar, Nginx domenlari va PostgreSQL bazalarini aniqlaydi.
# 2. Barcha bazalar, konfiguratsiyalar (.env) va yuklangan fayllarni to'liq zaxiralaydi.
# 3. Serverdan tashqariga (Offsite) yuklab olish uchun yaxlit arxiv va SHA-256 hosil qiladi.
# ==============================================================================
set -euo pipefail

TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_BASE="/root/vps_emergency_backups"
WORK_DIR="${BACKUP_BASE}/${TIMESTAMP}"

mkdir -p "${WORK_DIR}/databases"
mkdir -p "${WORK_DIR}/configs"
mkdir -p "${WORK_DIR}/uploads"

echo "======================================================================"
echo "  ASSETAUDIT — VPS AUDIT VA ZAXIRALASH (TIMESTAMP: ${TIMESTAMP})"
echo "======================================================================"
echo ""

# ------------------------------------------------------------------------------
# 1. MAVJUD LOYIHALAR VA XIZMATLARNI ANIQLASH (READ-ONLY AUDIT)
# ------------------------------------------------------------------------------
echo "--- [1/5] VPS DAGI MAVJUD LOYIHALAR VA PAPKALAR ---"
echo "[/var/www tarkibi]:"
ls -la /var/www || true
echo ""

echo "[Faol Node.js / Veb jarayonlari]:"
ps aux | grep -E 'node|next|npm|python|gunicorn' | grep -v grep || echo "Faol Node.js jarayonlari topilmadi."
echo ""

echo "[Nginx domenlari va proksi yo'nalishlari]:"
if [ -d /etc/nginx ]; then
    grep -rh -E 'server_name|proxy_pass|root ' /etc/nginx/sites-enabled/ /etc/nginx/conf.d/ 2>/dev/null || true
fi
echo ""

echo "[Systemd veb xizmatlari]:"
systemctl list-unit-files --type=service | grep -E 'node|next|assetaudit|mulk' || echo "Boshqa maxsus systemd xizmatlari topilmadi."
echo ""

# ------------------------------------------------------------------------------
# 2. POSTGRESQL BAZALARI VA JADVALLARINI ANIQLASH
# ------------------------------------------------------------------------------
echo "--- [2/5] POSTGRESQL BAZALARI VA IDENTIFIKATSIYASI ---"
if command -v psql >/dev/null 2>&1; then
    psql -U postgres -c "SELECT datname, pg_size_pretty(pg_database_size(datname)) as size FROM pg_database WHERE datistemplate = false;" || true
else
    echo "OGOHLANTIRISH: psql utilitasi topilmadi!"
fi
echo ""

# ------------------------------------------------------------------------------
# 3. BARCHA POSTGRESQL BAZALARIDAN TO'LIQ ZAXIRA OLISH
# ------------------------------------------------------------------------------
echo "--- [3/5] POSTGRESQL MA'LUMOTLARINI ZAXIRALASH ---"
if command -v pg_dump >/dev/null 2>&1 && command -v psql >/dev/null 2>&1; then
    # Foydalanuvchi bazalari ro'yxatini olish
    DATABASES=$(psql -U postgres -t -A -c "SELECT datname FROM pg_database WHERE datistemplate = false;")

    for DB in ${DATABASES}; do
        echo "  -> Baza zaxiralanmoqda: ${DB}..."
        pg_dump -U postgres -F c -b -d "${DB}" -f "${WORK_DIR}/databases/${DB}_${TIMESTAMP}.dump" || {
            echo "OGOHLANTIRISH: ${DB} bazasini custom formatda zaxiralashda xatolik."
        }
    done

    # Barcha global foydalanuvchilar va rollarni saqlash
    echo "  -> Global rollar va ruxsatlar saqlanmoqda..."
    pg_dumpall -U postgres --globals-only > "${WORK_DIR}/databases/globals_${TIMESTAMP}.sql" || true

    # Butun klaster (all databases) to'liq SQL zaxirasi
    echo "  -> Butun PostgreSQL klasteri to'liq SQL arxiviga olinmoqda..."
    pg_dumpall -U postgres --clean | gzip > "${WORK_DIR}/databases/all_databases_${TIMESTAMP}.sql.gz"
    echo "PostgreSQL zaxiralash yakunlandi."
fi
echo ""

# ------------------------------------------------------------------------------
# 4. KONFIGURATSIYALAR, .ENV VA UPLOAD FAYLLARNI ZAXIRALASH
# ------------------------------------------------------------------------------
echo "--- [4/5] KONFIGURATSIYA VA FAYLLAR ZAXIRASI ---"
# Nginx sozlamalari
if [ -d /etc/nginx ]; then
    echo "  -> Nginx konfiguratsiyasi saqlanmoqda..."
    tar -czf "${WORK_DIR}/configs/nginx_config_${TIMESTAMP}.tar.gz" -C /etc nginx
fi

# Systemd servis fayllari
if [ -d /etc/systemd/system ]; then
    echo "  -> Systemd servis fayllari saqlanmoqda..."
    tar -czf "${WORK_DIR}/configs/systemd_services_${TIMESTAMP}.tar.gz" -C /etc/systemd/system . || true
fi

# .env fayllari
echo "  -> /var/www dagi barcha .env fayllar qidirilmoqda..."
find /var/www -name "*.env*" -exec cp --parents {} "${WORK_DIR}/configs/" \; 2>/dev/null || true

# Doimiy yuklangan suratlar (Uploads)
if [ -d /var/lib/assetaudit/uploads ]; then
    echo "  -> AssetAudit uploads jildi zaxiralanmoqda..."
    tar -czf "${WORK_DIR}/uploads/assetaudit_uploads_${TIMESTAMP}.tar.gz" -C /var/lib/assetaudit uploads
fi
if [ -d /var/www/mulknazorat.uz/public/uploads ]; then
    echo "  -> Eski mulknazorat uploads jildi zaxiralanmoqda..."
    tar -czf "${WORK_DIR}/uploads/mulknazorat_uploads_${TIMESTAMP}.tar.gz" -C /var/www/mulknazorat.uz/public uploads
fi
echo ""

# ------------------------------------------------------------------------------
# 5. YAXLITLIK CHECKSUM (SHA-256) VA BITTA RELIZ ARXIVINI YIG'ISH
# ------------------------------------------------------------------------------
echo "--- [5/5] SHA-256 YAXLITLIK TEKSHIRUVI VA ARXIV HOSIL QILISH ---"
cd "${WORK_DIR}"
find . -type f -exec sha256sum {} + > "${WORK_DIR}/SHA256SUMS"
echo "Barcha zaxira fayllari uchun SHA-256 nazorati muhrlandi."

ARCHIVE_FILE="${BACKUP_BASE}/vps_complete_backup_${TIMESTAMP}.tar.gz"
tar -czf "${ARCHIVE_FILE}" -C "${BACKUP_BASE}" "${TIMESTAMP}"
sha256sum "${ARCHIVE_FILE}" > "${ARCHIVE_FILE}.sha256"

# Eng so'nggi arxivga havola (symlink)
ln -sf "${ARCHIVE_FILE}" "${BACKUP_BASE}/vps_complete_backup_latest.tar.gz"
ln -sf "${ARCHIVE_FILE}.sha256" "${BACKUP_BASE}/vps_complete_backup_latest.tar.gz.sha256"

echo "======================================================================"
echo "ZAXIRA MUVAFFAQIYATLI YAKUNLANDI!"
echo "Yaxlit Zaxira Fayli: ${ARCHIVE_FILE}"
echo "Hajmi: $(du -sh "${ARCHIVE_FILE}" | cut -f1)"
echo "SHA-256: $(cat "${ARCHIVE_FILE}.sha256")"
echo "======================================================================"
