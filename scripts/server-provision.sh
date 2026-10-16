#!/usr/bin/env bash
# ==============================================================================
# AssetAudit — Complete VPS Provisioning Script
# Target: Ubuntu 24.04 LTS (<target-vps-ip>)
# ==============================================================================
set -euo pipefail

echo "=================================================================="
echo "  ASSETAUDIT: VPS PROVISIONING BOSHLANDI"
echo "  Vaqt: $(date -u +"%Y-%m-%d %H:%M:%S UTC")"
echo "=================================================================="
echo ""

# 1. Swap xotirani kengaytirish (2 GB)
echo "=== [1/6] SWAP XOTIRANI 2 GB GA KENGAYTIRISH ==="
CURRENT_SWAP_SIZE=$(stat -c%s /swapfile 2>/dev/null || echo 0)
if [ "$CURRENT_SWAP_SIZE" -lt 2000000000 ]; then
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
    echo "  -> Swap muvaffaqiyatli 2 GB ga kengaytirildi."
else
    echo "  -> Swap hajmi allaqachon yetarli (>= 2 GB)."
fi
sudo sysctl -w vm.swappiness=10
sudo sysctl -w vm.vfs_cache_pressure=50
echo ""

# 2. Tizim paketlarini yangilash
echo "=== [2/6] TIZIM PAKETLARINI YANGILASH ==="
sudo apt-get update -y
sudo DEBIAN_FRONTEND=noninteractive apt-get install -y curl wget git build-essential ufw nginx jq libpq-dev
echo ""

# 3. Node.js 20 LTS va PM2 o'rnatish
echo "=== [3/6] NODE.JS 20 LTS VA PM2 O'RNATISH ==="
if ! command -v node >/dev/null 2>&1 || [ "$(node -v | cut -d'.' -f1)" != "v20" ]; then
    echo "  -> NodeSource Node.js 20 LTS repozitoriysi qo'shilmoqda..."
    curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
    sudo apt-get install -y nodejs
fi
echo "  -> Node.js: $(node -v)"
echo "  -> NPM: $(npm -v)"

if ! command -v pm2 >/dev/null 2>&1; then
    echo "  -> PM2 global paket sifatida o'rnatilmoqda..."
    sudo npm install -g pm2
fi
echo "  -> PM2: $(pm2 -v)"
echo ""

# 4. PostgreSQL 16 o'rnatish va sozlash
echo "=== [4/6] POSTGRESQL 16 O'RNATISH VA SOZLASH ==="
sudo apt-get install -y postgresql postgresql-contrib
sudo systemctl enable postgresql
sudo systemctl start postgresql

echo "  -> PostgreSQL holati: $(systemctl is-active postgresql)"

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

echo "  -> PostgreSQL baza ('$DB_NAME') va foydalanuvchi ('$DB_USER') muvaffaqiyatli sozlandi."
echo "  -> DATABASE_URL=postgresql://$DB_USER:****@127.0.0.1:5432/$DB_NAME"
echo ""

# 5. UFW Xavfsizlik devori
echo "=== [5/6] UFW XAVFSIZLIK DEVORI ==="
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow 22/tcp comment 'SSH'
sudo ufw allow 80/tcp comment 'HTTP'
sudo ufw allow 443/tcp comment 'HTTPS'
sudo ufw --force enable
echo "  -> UFW faol (22, 80, 443 ochiq)."
echo ""

# 6. AssetAudit kataloglari
echo "=== [6/6] ASSETAUDIT DIRECTORY VA RUXSATLAR ==="
sudo mkdir -p /var/www/assetaudit/standalone
sudo mkdir -p /var/lib/assetaudit/uploads
sudo chown -R deployer:deployer /var/www/assetaudit
sudo chown -R deployer:deployer /var/lib/assetaudit
sudo chmod -R 755 /var/www/assetaudit
sudo chmod -R 750 /var/lib/assetaudit/uploads

echo "=================================================================="
echo "  PROVISIONING MUVAFFAQIYATLI YAKUNLANDI (PASS)!"
echo "=================================================================="

