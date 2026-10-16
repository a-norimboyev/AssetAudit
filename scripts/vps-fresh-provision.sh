#!/usr/bin/env bash
# ==============================================================================
# AssetAudit — Toza Ubuntu VPS Muhitini Avtomatlashtirilgan Sozlash (Provisioning)
# Ushbu skript yangi o'rnatilgan Ubuntu VPS (1 GB RAM, Eskiz) uchun barcha zarur
# dasturlar va xavfsizlik sozlamalarini o'rnatadi.
#
# MUHIM: Faqat foydalanuvchi tasdiqlaganidan keyin ishga tushiriladi!
# ==============================================================================
set -euo pipefail

echo "======================================================================"
echo "  ASSETAUDIT — TOZA UBUNTU VPS PROVISIONING BOSHLANDI"
echo "  Server: ${VPS_HOST:-127.0.0.1} | Sana: $(date -u +"%Y-%m-%d %H:%M:%S UTC")"
echo "======================================================================"
echo ""

# 1. 2 GB Swap Faylini Sozlash (1 GB RAM li VPS da OOM Killer oldini olish)
echo "=== [1/8] SWAP XOTIRASI SOZLANMOQDA ==="
CURRENT_SWAP=$(free -m | awk '/Swap:/ {print $2}')
if [ "${CURRENT_SWAP}" -lt 1000 ]; then
    echo "Swap yetarli emas (${CURRENT_SWAP} MB). 2 GB Swapfile yaratilmoqda..."
    if [ ! -f /swapfile ]; then
        fallocate -l 2G /swapfile || dd if=/dev/zero of=/swapfile bs=1M count=2048
        chmod 600 /swapfile
        mkswap /swapfile
        swapon /swapfile
        if ! grep -q '/swapfile' /etc/fstab; then
            echo '/swapfile none swap sw 0 0' >> /etc/fstab
        fi
        sysctl vm.swappiness=10
        echo "vm.swappiness=10" > /etc/sysctl.d/99-assetaudit-swap.conf
        echo "2 GB Swap muvaffaqiyatli faollashtirildi."
    fi
else
    echo "Swap allaqachon mavjud: ${CURRENT_SWAP} MB."
fi
echo ""

# 2. Tizim paketlarini yangilash va asosiy utilitalarni o'rnatish
echo "=== [2/8] ASOSIY TIZIM PAKETLARI O'RNATILMOQDA ==="
export DEBIAN_FRONTEND=noninteractive
apt-get update -y
apt-get install -y curl wget git build-essential ufw fail2ban jq htop libcap2-bin
echo ""

# 3. Node.js 20 LTS O'rnatish
echo "=== [3/8] NODE.JS 20 LTS O'RNATILMOQDA ==="
if ! command -v node >/dev/null 2>&1 || [[ $(node -v) != v20* ]]; then
    echo "Node.js 20 repozitoriysi qo'shilmoqda..."
    curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
    apt-get install -y nodejs
fi
echo "Node.js: $(node -v), NPM: $(npm -v)"
echo ""

# 4. PostgreSQL O'rnatish va Sozlash
echo "=== [4/8] POSTGRESQL O'RNATILMOQDA ==="
if ! command -v psql >/dev/null 2>&1; then
    apt-get install -y postgresql postgresql-contrib
    systemctl enable postgresql
    systemctl start postgresql
fi
echo "PostgreSQL: $(psql --version)"

# Baza va foydalanuvchini xavfsiz yaratish
DB_NAME="mulknazorat"
DB_USER="mulknazorat_app"

echo "PostgreSQL ma'lumotlar bazasi tekshirilmoqda (${DB_NAME})..."
sudo -u postgres psql -tc "SELECT 1 FROM pg_database WHERE datname = '${DB_NAME}'" | grep -q 1 || {
    echo "Baza '${DB_NAME}' yaratilmoqda..."
    sudo -u postgres psql -c "CREATE DATABASE ${DB_NAME};"
}

sudo -u postgres psql -tc "SELECT 1 FROM pg_roles WHERE rolname = '${DB_USER}'" | grep -q 1 || {
    echo "Foydalanuvchi '${DB_USER}' yaratilmoqda..."
    APP_DB_PASSWORD=$(openssl rand -hex 16)
    sudo -u postgres psql -c "CREATE USER ${DB_USER} WITH ENCRYPTED PASSWORD '${APP_DB_PASSWORD}';"
    sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE ${DB_NAME} TO ${DB_USER};"
    sudo -u postgres psql -d "${DB_NAME}" -c "GRANT ALL ON SCHEMA public TO ${DB_USER};"

    # Xavfsiz production .env faylini yaratish (Logga chiqarmasdan)
    mkdir -p /var/www/assetaudit/shared
    cat <<EOF > /var/www/assetaudit/shared/.env.production
DATABASE_URL=postgresql://${DB_USER}:${APP_DB_PASSWORD}@127.0.0.1:5432/${DB_NAME}
DATABASE_SSL=false
BETTER_AUTH_SECRET=$(openssl rand -base64 36)
BETTER_AUTH_URL=https://assetaudit.uz
NEXT_PUBLIC_APP_URL=https://assetaudit.uz
UPLOAD_STORAGE_DIR=/var/lib/assetaudit/uploads
USE_X_ACCEL=true
RATE_LIMIT_ENABLED=true
NODE_ENV=production
PORT=3000
HOSTNAME=127.0.0.1
EOF
    chmod 600 /var/www/assetaudit/shared/.env.production
    chown -R assetaudit:assetaudit /var/www/assetaudit/shared 2>/dev/null || true
    echo "Production muhit fayli (.env.production) 600 ruxsati bilan yaratildi."
}

# 5. Nginx Veb-Server va Certbot O'rnatish
echo "=== [5/8] NGINX VA CERTBOT O'RNATILMOQDA ==="
apt-get install -y nginx certbot python3-certbot-nginx
systemctl enable nginx
systemctl start nginx
echo "Nginx versiyasi: $(nginx -v 2>&1)"
echo ""

# 6. Tizim foydalanuvchisi va Loyiha kataloglari
echo "=== [6/8] KATALOGLAR VA RUXSATLAR SOZLANMOQDA ==="
id -u assetaudit &>/dev/null || useradd -r -s /bin/false -d /var/www/assetaudit assetaudit

mkdir -p /var/www/assetaudit/releases
mkdir -p /var/www/assetaudit/shared
mkdir -p /var/lib/assetaudit/uploads
mkdir -p /var/log/assetaudit

chown -R assetaudit:assetaudit /var/www/assetaudit
chown -R assetaudit:assetaudit /var/lib/assetaudit
chown -R assetaudit:assetaudit /var/log/assetaudit

# uploads uchun setgid (yangi fayllar assetaudit guruhiga tushishi uchun)
chmod 2750 /var/lib/assetaudit/uploads
echo "Kataloglar va ruxsatlar tayyorlandi."
echo ""

# 7. Xavfsizlik Devori (UFW Firewall) va Fail2ban
echo "=== [7/8] XAVFSIZLIK DEVORI (UFW) SOZLANMOQDA ==="
ufw allow 22/tcp comment 'SSH'
ufw allow 80/tcp comment 'HTTP'
ufw allow 443/tcp comment 'HTTPS'
# PostgreSQL faqat localhost uchun ochiq qoladi (tashqaridan yopiq)
ufw --force enable
systemctl enable fail2ban
systemctl restart fail2ban
echo "UFW va Fail2ban faollashtirildi."
echo ""

# 8. Yakuniy tekshiruv
echo "=== [8/8] YAKUNIY PROVISIONING XULOSASI ==="
echo "Node.js: $(node -v)"
echo "NPM: $(npm -v)"
echo "PostgreSQL: $(systemctl is-active postgresql)"
echo "Nginx: $(systemctl is-active nginx)"
echo "Swap: $(swapon --show --noheadings | awk '{print $3}')"
echo "Disk: $(df -h / | awk 'NR==2 {print $4}') bo'sh joy"
echo ""
echo "======================================================================"
echo "  UBUNTU VPS PROVISIONING MUVAFFAQIYATLI YAKUNLANDI!"
echo "  Server AssetAudit relizini qabul qilishga 100% tayyor."
echo "======================================================================"

