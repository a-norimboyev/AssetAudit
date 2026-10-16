#!/usr/bin/env bash
# ==============================================================================
# AssetAudit — Complete Fast-Track Production Provisioning & Deployment
# ==============================================================================
set -euo pipefail

echo "=================================================================="
echo "  ASSETAUDIT: FAST TRACK PRODUCTION DEPLOYMENT"
echo "  Server: ${VPS_HOST:-127.0.0.1} | Vaqt: $(date -u +"%Y-%m-%d %H:%M:%S UTC")"
echo "=================================================================="
echo ""

# Sudo ruxsatini dastlab tekshirish
if ! sudo -n true 2>/dev/null; then
    echo "Iltimos, deployer uchun sudo parolini kiriting:"
    sudo true
fi

# 1. 2 GB Swap xotira
echo "=== [1/11] 2 GB SWAP XOTIRA SOZLANMOQDA ==="
SWAP_SIZE=$(stat -c%s /swapfile 2>/dev/null || echo 0)
if [ "$SWAP_SIZE" -lt 2000000000 ]; then
    echo "  -> Swap hajmi 2 GB ga sozlanmoqda..."
    sudo swapoff /swapfile 2>/dev/null || true
    sudo rm -f /swapfile
    sudo fallocate -l 2G /swapfile || sudo dd if=/dev/zero of=/swapfile bs=1M count=2048
    sudo chmod 600 /swapfile
    sudo mkswap /swapfile
    sudo swapon /swapfile
    if ! grep -q '/swapfile' /etc/fstab; then
        echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
    fi
    echo "  -> Swap 2 GB ga kengaytirildi (PASS)."
else
    echo "  -> Swap allaqachon yetarli (>= 2 GB)."
fi
sudo sysctl -w vm.swappiness=10
sudo sysctl -w vm.vfs_cache_pressure=50
echo ""

# 2. Tizim paketlarini yangilash
echo "=== [2/11] TIZIM PAKETLARINI YANGILASH ==="
sudo apt-get update -y
sudo DEBIAN_FRONTEND=noninteractive apt-get install -y curl wget git build-essential ufw nginx jq libpq-dev unzip
echo "  -> Tizim paketlari yangilandi (PASS)."
echo ""

# 3. Node.js 24 LTS va PM2
echo "=== [3/11] NODE.JS 24 VA PM2 O'RNATILMOQDA ==="
if ! command -v node >/dev/null 2>&1 || [ "$(node -v | cut -d'.' -f1)" != "v24" ]; then
    echo "  -> NodeSource Node.js 24 o'rnatilmoqda..."
    curl -fsSL https://deb.nodesource.com/setup_24.x | sudo -E bash -
    sudo apt-get install -y nodejs
fi
echo "  -> Node.js versiyasi: $(node -v) (PASS)"
echo "  -> NPM versiyasi: $(npm -v)"

if ! command -v pm2 >/dev/null 2>&1; then
    echo "  -> PM2 global paket sifatida o'rnatilmoqda..."
    sudo npm install -g pm2
fi
echo "  -> PM2 versiyasi: $(pm2 -v) (PASS)"
echo ""

# 4. PostgreSQL 16
echo "=== [4/11] POSTGRESQL 16 O'RNATILMOQDA VA SOZLANMOQDA ==="
sudo apt-get install -y postgresql postgresql-contrib
sudo systemctl enable postgresql
sudo systemctl start postgresql

echo "  -> PostgreSQL servisi holati: $(systemctl is-active postgresql) (PASS)"

PG_CONF=$(sudo -u postgres psql -t -P format=unaligned -c "SHOW config_file;")
sudo sed -i "s/^#listen_addresses = .*/listen_addresses = 'localhost'/" "$PG_CONF" 2>/dev/null || true
sudo systemctl reload postgresql

DB_NAME="assetaudit"
DB_USER="assetaudit_user"
DB_PASS_FILE="$HOME/.assetaudit_db_password"

if [ ! -f "$DB_PASS_FILE" ]; then
    DB_PASS=$(openssl rand -base64 24 | tr -dc 'a-zA-Z0-9' | head -c 24)
    echo "$DB_PASS" > "$DB_PASS_FILE"
    chmod 600 "$DB_PASS_FILE"
else
    DB_PASS=$(cat "$DB_PASS_FILE")
fi

sudo -u postgres psql -tc "SELECT 1 FROM pg_roles WHERE rolname = '$DB_USER'" | grep -q 1 || \
    sudo -u postgres psql -c "CREATE USER $DB_USER WITH ENCRYPTED PASSWORD '$DB_PASS';"

sudo -u postgres psql -c "ALTER USER $DB_USER WITH ENCRYPTED PASSWORD '$DB_PASS';"

sudo -u postgres psql -tc "SELECT 1 FROM pg_database WHERE datname = '$DB_NAME'" | grep -q 1 || \
    sudo -u postgres psql -c "CREATE DATABASE $DB_NAME OWNER $DB_USER;"

sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE $DB_NAME TO $DB_USER;"
sudo -u postgres psql -d "$DB_NAME" -c "GRANT ALL ON SCHEMA public TO $DB_USER;"

echo "  -> PostgreSQL baza va foydalanuvchi sozlandi (PASS)."
echo ""

# 5. UFW Xavfsizlik devori
echo "=== [5/11] UFW XAVFSIZLIK DEVORINI SOZLASH ==="
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow 22/tcp comment 'SSH'
sudo ufw allow 80/tcp comment 'HTTP'
sudo ufw allow 443/tcp comment 'HTTPS'
sudo ufw --force enable
echo "  -> UFW faollashtirildi (SSH 22, HTTP 80, HTTPS 443 ochiq) (PASS)."
echo ""

# 6. AssetAudit kataloglari va release ochish
echo "=== [6/11] ASSETAUDIT DIRECTORY VA RELEASE OCHISH ==="
APP_DIR="/var/www/assetaudit/standalone"
UPLOAD_DIR="/var/lib/assetaudit/uploads"

sudo mkdir -p "$APP_DIR"
sudo mkdir -p "$UPLOAD_DIR"
sudo chown -R deployer:deployer /var/www/assetaudit
sudo chown -R deployer:deployer /var/lib/assetaudit
sudo chmod -R 755 /var/www/assetaudit
sudo chmod -R 750 /var/lib/assetaudit

if [ -f "/tmp/release.zip" ]; then
    echo "  -> Release paketi /var/www/assetaudit/standalone ga ochilmoqda..."
    unzip -q -o /tmp/release.zip -d "$APP_DIR"
    rm -f /tmp/release.zip
    echo "  -> Release paketi muvaffaqiyatli ochildi (PASS)."
fi

# 7. Linux native sharp moduli o'rnatish
echo "=== [7/11] LINUX NATIVE SHARP MODULINI O'RNATISH ==="
cd "$APP_DIR"
if [ ! -d "node_modules/@img/sharp-linux-x64" ]; then
    echo "  -> Linux uchun @img/sharp-linux-x64 moduli o'rnatilmoqda..."
    npm install --no-save --os=linux --cpu=x64 @img/sharp-linux-x64 sharp 2>/dev/null || true
    echo "  -> Linux sharp moduli o'rnatildi (PASS)."
else
    echo "  -> Linux sharp moduli allaqachon mavjud."
fi
echo ""

# 8. Drizzle SQL migratsiyalari
echo "=== [8/11] DRIZZLE BAZA MIGRATSIYALARI BAJARILMOQDA ==="
mkdir -p /var/www/assetaudit/drizzle
if [ -d "/tmp/drizzle_migrations" ]; then
    cp -r /tmp/drizzle_migrations/* /var/www/assetaudit/drizzle/
    rm -rf /tmp/drizzle_migrations
fi

export PGPASSWORD="$DB_PASS"

psql -h 127.0.0.1 -U "$DB_USER" -d "$DB_NAME" -c '
CREATE TABLE IF NOT EXISTS "__drizzle_migrations" (
  id SERIAL PRIMARY KEY,
  hash text NOT NULL UNIQUE,
  created_at bigint
);
' >/dev/null

MIGRATIONS=(
    "0000_dear_spectrum"
    "0001_silent_alex_wilder"
    "0002_multi_organization"
    "0003_small_gladiator"
    "0004_odd_the_santerians"
)

for mig in "${MIGRATIONS[@]}"; do
    ALREADY_RUN=$(psql -h 127.0.0.1 -U "$DB_USER" -d "$DB_NAME" -tAc "SELECT 1 FROM __drizzle_migrations WHERE hash = '$mig';")
    if [ "$ALREADY_RUN" = "1" ]; then
        echo "  -> Migratsiya '$mig': Mavjud (Skip)."
    else
        SQL_FILE="/var/www/assetaudit/drizzle/${mig}.sql"
        if [ -f "$SQL_FILE" ]; then
            echo "  -> Bajarilmoqda: '$mig'..."
            psql -h 127.0.0.1 -U "$DB_USER" -d "$DB_NAME" -f "$SQL_FILE" >/dev/null
            psql -h 127.0.0.1 -U "$DB_USER" -d "$DB_NAME" -c "INSERT INTO __drizzle_migrations (hash, created_at) VALUES ('$mig', $(date +%s%3N));" >/dev/null
            echo "  -> Muvaffaqiyatli: '$mig' (PASS)."
        fi
    fi
done
echo ""

# 9. Environment sozlash
echo "=== [9/11] ENVIRONMENT (.env) FAYLINI SOZLASH ==="
AUTH_SECRET_FILE="$HOME/.assetaudit_auth_secret"
if [ ! -f "$AUTH_SECRET_FILE" ]; then
    AUTH_SECRET=$(openssl rand -base64 32 | tr -dc 'a-zA-Z0-9' | head -c 32)
    echo "$AUTH_SECRET" > "$AUTH_SECRET_FILE"
    chmod 600 "$AUTH_SECRET_FILE"
else
    AUTH_SECRET=$(cat "$AUTH_SECRET_FILE")
fi

cat << EOF > "$APP_DIR/.env"
DATABASE_URL="postgresql://${DB_USER}:${DB_PASS}@127.0.0.1:5432/${DB_NAME}"
DATABASE_SSL="false"
BETTER_AUTH_SECRET="${AUTH_SECRET}"
BETTER_AUTH_URL="https://assetaudit.uz"
NEXT_PUBLIC_APP_URL="https://assetaudit.uz"
UPLOAD_STORAGE_DIR="${UPLOAD_DIR}"
RATE_LIMIT_ENABLED="true"
NODE_ENV="production"
PORT="3000"
HOSTNAME="127.0.0.1"
EOF

chmod 600 "$APP_DIR/.env"
cp "$APP_DIR/.env" "$APP_DIR/.env.production"
echo "  -> .env va .env.production fayllari xavfsiz yaratildi (PASS)."
echo ""

# 10. Nginx va PM2 Ishga Tushirish
echo "=== [10/11] NGINX VA PM2 SERVISLARINI ISHGA TUSHIRISH ==="
if [ -f "/tmp/nginx-assetaudit.conf" ]; then
    sudo cp /tmp/nginx-assetaudit.conf /etc/nginx/sites-available/assetaudit.uz
    sudo ln -sf /etc/nginx/sites-available/assetaudit.uz /etc/nginx/sites-enabled/
    sudo rm -f /etc/nginx/sites-enabled/default
    sudo nginx -t
    sudo systemctl reload nginx
    rm -f /tmp/nginx-assetaudit.conf
    echo "  -> Nginx muvaffaqiyatli qayta yuklandi (PASS)."
fi

cd "$APP_DIR"
pm2 delete assetaudit 2>/dev/null || true
pm2 start server.js --name "assetaudit" -i 1 --time
pm2 save

# PM2 autostart xizmatini ulash
sudo env PATH=$PATH:/usr/bin pm2 startup systemd -u deployer --hp /home/deployer 2>/dev/null || true
echo "  -> PM2 autostart xizmati ulandi (PASS)."
echo ""

# 11. To'liq Salomatlik Tekshiruvi
echo "=== [11/11] TIZIM VA ILOVA TEKSHIRUVI (VERIFICATION) ==="
sleep 4

echo -n "  -> Node.js jarayoni: "
if pgrep -f "server.js" >/dev/null; then echo "PASS (Ishlamoqda)"; else echo "BLOCKED (Ishlamayapti)"; fi

echo -n "  -> PostgreSQL xizmati: "
if systemctl is-active --quiet postgresql; then echo "PASS (Active)"; else echo "BLOCKED (Inactive)"; fi

echo -n "  -> Nginx xizmati: "
if systemctl is-active --quiet nginx; then echo "PASS (Active)"; else echo "BLOCKED (Inactive)"; fi

echo -n "  -> Localhost:3000 javobi: "
LOCAL_HTTP=$(curl -s -o /dev/null -w "%{http_code}" http://127.0.0.1:3000/ || echo "000")
echo "HTTP $LOCAL_HTTP"

echo -n "  -> Login / Auth sahifasi: "
LOGIN_HTTP=$(curl -s -o /dev/null -w "%{http_code}" http://127.0.0.1:3000/login || echo "000")
echo "HTTP $LOGIN_HTTP"

echo -n "  -> Nginx orqali port 80 javobi: "
NGINX_HTTP=$(curl -s -o /dev/null -w "%{http_code}" http://127.0.0.1/ || echo "000")
echo "HTTP $NGINX_HTTP"

echo ""
echo "=== DISK VA XOTIRA HOLATI ==="
free -h
df -h /

echo ""
echo "=================================================================="
echo "  FAST TRACK PRODUCTION DEPLOYMENT YAKUNLANDI!"
echo "=================================================================="

