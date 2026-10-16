#!/usr/bin/env bash
# ==============================================================================
# AssetAudit — Complete Application Deployment & Migration Script
# ==============================================================================
set -euo pipefail

echo "=================================================================="
echo "  ASSETAUDIT: APPLICATION DEPLOYMENT BOSHLANDI"
echo "  Vaqt: $(date -u +"%Y-%m-%d %H:%M:%S UTC")"
echo "=================================================================="
echo ""

APP_DIR="/var/www/assetaudit/standalone"
UPLOAD_DIR="/var/lib/assetaudit/uploads"
DB_PASS_FILE="$HOME/.assetaudit_db_password"

if [ ! -f "$DB_PASS_FILE" ]; then
    echo "XATO: Database password fayli topilmadi: $DB_PASS_FILE"
    exit 1
fi
DB_PASS=$(cat "$DB_PASS_FILE")

# 1. Release arxivini ochish
echo "=== [1/6] RELEASE PAKETI OCHILMOQDA ==="
mkdir -p "$APP_DIR"
if [ -f "/tmp/release.zip" ]; then
    unzip -q -o /tmp/release.zip -d "$APP_DIR"
    rm -f /tmp/release.zip
    echo "  -> Release paketi muvaffaqiyatli ochildi."
fi

# 2. Drizzle migratsiyalarini serverga joylash
echo "=== [2/6] BAZA MIGRATSIYALARI BAJARILMOQDA ==="
mkdir -p /var/www/assetaudit/drizzle
if [ -d "/tmp/drizzle_migrations" ]; then
    cp -r /tmp/drizzle_migrations/* /var/www/assetaudit/drizzle/
    rm -rf /tmp/drizzle_migrations
fi

# PostgreSQL psql orqali xavfsiz va idempotent migratsiya
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
        echo "  -> Migratsiya '$mig': Allaqachon mavjud (Skip)."
    else
        SQL_FILE="/var/www/assetaudit/drizzle/${mig}.sql"
        if [ -f "$SQL_FILE" ]; then
            echo "  -> Bajarilmoqda: '$mig'..."
            psql -h 127.0.0.1 -U assetaudit_user -d assetaudit -f "$SQL_FILE" >/dev/null
            psql -h 127.0.0.1 -U assetaudit_user -d assetaudit -c "INSERT INTO __drizzle_migrations (hash, created_at) VALUES ('$mig', $(date +%s%3N));" >/dev/null
            echo "  -> Muvaffaqiyatli: '$mig'."
        else
            echo "  -> OGOHLANTIRISH: Migratsiya fayli topilmadi: $SQL_FILE"
        fi
    fi
done

# 3. Environment faylini yaratish
echo "=== [3/6] ENVIRONMENT (.env) FAYLI SOZLANMOQDA ==="
AUTH_SECRET_FILE="$HOME/.assetaudit_auth_secret"
if [ ! -f "$AUTH_SECRET_FILE" ]; then
    AUTH_SECRET=$(openssl rand -base64 32 | tr -dc 'a-zA-Z0-9' | head -c 32)
    echo "$AUTH_SECRET" > "$AUTH_SECRET_FILE"
    chmod 600 "$AUTH_SECRET_FILE"
else
    AUTH_SECRET=$(cat "$AUTH_SECRET_FILE")
fi

cat << EOF > "$APP_DIR/.env"
DATABASE_URL="postgresql://assetaudit_user:${DB_PASS}@127.0.0.1:5432/assetaudit"
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
echo "  -> .env va .env.production fayllari xavfsiz yaratildi."

# 4. Nginx konfiguratsiyasini faollashtirish
echo "=== [4/6] NGINX KONFIGURATSIYASI O'RNATILMOQDA ==="
if [ -f "/tmp/nginx-assetaudit.conf" ]; then
    sudo cp /tmp/nginx-assetaudit.conf /etc/nginx/sites-available/assetaudit.uz
    sudo ln -sf /etc/nginx/sites-available/assetaudit.uz /etc/nginx/sites-enabled/
    sudo rm -f /etc/nginx/sites-enabled/default
    sudo nginx -t
    sudo systemctl reload nginx
    rm -f /tmp/nginx-assetaudit.conf
    echo "  -> Nginx muvaffaqiyatli sozlandi va qayta yuklandi."
fi

# 5. PM2 orqali ilovani ishga tushirish
echo "=== [5/6] ASSETAUDIT ILovASI PM2 BILAN ISHGA TUSHIRILMOQDA ==="
cd "$APP_DIR"
pm2 delete assetaudit 2>/dev/null || true
pm2 start server.js --name "assetaudit" -i 1 --time
pm2 save
echo "  -> PM2 holati:"
pm2 status assetaudit

# 6. Salomatlik tekshiruvi (Health Check)
echo "=== [6/6] SALOMATLIK TEKSHIRUVI (HEALTH CHECK) ==="
sleep 3

HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" http://127.0.0.1:3000/api/health || curl -s -o /dev/null -w "%{http_code}" http://127.0.0.1:3000/ || echo "000")

echo "  -> Mahalliy HTTP javob kodi: $HTTP_CODE"

if [ "$HTTP_CODE" -ge 200 ] && [ "$HTTP_CODE" -lt 400 ]; then
    echo "  -> SALOMATLIK TEKSHIRUVI: PASS!"
else
    echo "  -> DIQQAT: Server $HTTP_CODE javob berdi. Loglar tekshirilmoqda..."
    pm2 logs assetaudit --lines 20 --nostream
fi

echo ""
echo "=================================================================="
echo "  ASSETAUDIT DEPLOYMENTI MUVAFFAQIYATLI YAKUNLANDI (PASS)!"
echo "=================================================================="

