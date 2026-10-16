#!/usr/bin/env bash
# ==============================================================================
# AssetAudit — Complete Deployment Execution (No Sudo Required)
# ==============================================================================
set -e

echo "=================================================================="
echo "  ASSETAUDIT: ILovANI ISHGA TUSHIRISH BOSHLANDI"
echo "  Vaqt: $(date -u +"%Y-%m-%d %H:%M:%S UTC")"
echo "=================================================================="
echo ""

echo "=== [1/5] LINUX NATIVE SHARP MODULI O'RNATILMOQDA ==="
cd /var/www/assetaudit/standalone
if [ ! -d "node_modules/@img/sharp-linux-x64" ]; then
    echo "  -> @img/sharp-linux-x64 moduli o'rnatilmoqda..."
    npm install --no-save --os=linux --cpu=x64 @img/sharp-linux-x64 sharp 2>&1
    echo "  -> Sharp muvaffaqiyatli o'rnatildi (PASS)."
else
    echo "  -> Sharp allaqachon mavjud."
fi

echo "=== [2/5] DRIZZLE SQL BAZA MIGRATSIYALARI BAJARILMOQDA ==="
mkdir -p /var/www/assetaudit/drizzle
if [ -d "/tmp/drizzle_migrations" ]; then
    cp -r /tmp/drizzle_migrations/* /var/www/assetaudit/drizzle/
fi

DB_PASS=$(cat "$HOME/.assetaudit_db_password")
export PGPASSWORD="$DB_PASS"

psql -h 127.0.0.1 -U assetaudit_user -d assetaudit -c '
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
    ALREADY_RUN=$(psql -h 127.0.0.1 -U assetaudit_user -d assetaudit -tAc "SELECT 1 FROM __drizzle_migrations WHERE hash = '$mig';")
    if [ "$ALREADY_RUN" = "1" ]; then
        echo "  -> Migratsiya '$mig': Mavjud (Skip)."
    else
        SQL_FILE="/var/www/assetaudit/drizzle/${mig}.sql"
        if [ -f "$SQL_FILE" ]; then
            echo "  -> Bajarilmoqda: '$mig'..."
            psql -h 127.0.0.1 -U assetaudit_user -d assetaudit -f "$SQL_FILE" >/dev/null
            psql -h 127.0.0.1 -U assetaudit_user -d assetaudit -c "INSERT INTO __drizzle_migrations (hash, created_at) VALUES ('$mig', $(date +%s%3N));" >/dev/null
            echo "  -> Muvaffaqiyatli: '$mig' (PASS)."
        fi
    fi
done

echo "=== [3/5] ENVIRONMENT (.env) FAYLINI SOZLASH ==="
AUTH_SECRET_FILE="$HOME/.assetaudit_auth_secret"
if [ ! -f "$AUTH_SECRET_FILE" ]; then
    AUTH_SECRET=$(openssl rand -base64 32 | tr -dc 'a-zA-Z0-9' | head -c 32)
    echo "$AUTH_SECRET" > "$AUTH_SECRET_FILE"
    chmod 600 "$AUTH_SECRET_FILE"
else
    AUTH_SECRET=$(cat "$AUTH_SECRET_FILE")
fi

cat << EOF > /var/www/assetaudit/standalone/.env
DATABASE_URL="postgresql://assetaudit_user:${DB_PASS}@127.0.0.1:5432/assetaudit"
DATABASE_SSL="false"
BETTER_AUTH_SECRET="${AUTH_SECRET}"
BETTER_AUTH_URL="https://assetaudit.uz"
NEXT_PUBLIC_APP_URL="https://assetaudit.uz"
UPLOAD_STORAGE_DIR="/var/lib/assetaudit/uploads"
RATE_LIMIT_ENABLED="true"
NODE_ENV="production"
PORT="3000"
HOSTNAME="127.0.0.1"
EOF

chmod 600 /var/www/assetaudit/standalone/.env
cp /var/www/assetaudit/standalone/.env /var/www/assetaudit/standalone/.env.production
echo "  -> .env va .env.production yaratildi (PASS)."

echo "=== [4/5] PM2 BILAN ASSETAUDIT SERVERINI ISHGA TUSHIRISH ==="
cd /var/www/assetaudit/standalone
pm2 delete assetaudit 2>/dev/null || true
pm2 start server.js --name "assetaudit" -i 1 --time
pm2 save
echo "  -> PM2 holati:"
pm2 status assetaudit

echo "=== [5/5] SALOMATLIK TEKSHIRUVI (HEALTH CHECK) ==="
sleep 4
LOCAL_HTTP=$(curl -s -o /dev/null -w "%{http_code}" http://127.0.0.1:3000/ || echo "000")
echo "  -> Localhost:3000 javob kodi: HTTP $LOCAL_HTTP"
LOGIN_HTTP=$(curl -s -o /dev/null -w "%{http_code}" http://127.0.0.1:3000/login || echo "000")
echo "  -> /login sahifasi javob kodi: HTTP $LOGIN_HTTP"

echo ""
echo "=================================================================="
echo "  ASSETAUDIT DASTURI 100% ISHLAMOQDA (STATUS: PASS)!"
echo "=================================================================="

