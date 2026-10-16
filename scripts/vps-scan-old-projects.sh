#!/usr/bin/env bash
# ==============================================================================
# AssetAudit — VPS Eski Loyihalarni Read-Only Audit Skripti
# ==============================================================================
set -u

echo "=================================================================="
echo "  ASSETAUDIT: VPS ESKI LOYIHALARINI CHUQUR AUDIT QILISH"
echo "  Server: ${VPS_HOST:-127.0.0.1} | Vaqt: $(date -u +"%Y-%m-%d %H:%M:%S UTC")"
echo "=================================================================="
echo ""

echo "=== [1/8] TIZIM FOYDALANUVCHILARI (UID >= 1000) ==="
awk -F: '$3 >= 1000 {printf "Foydalanuvchi: %-15s UID: %-5s Home: %-20s Shell: %s\n", $1, $3, $6, $7}' /etc/passwd
echo ""

echo "=== [2/8] /home KATALOGI MAZMUNI ==="
ls -la /home/
echo ""
for u in /home/*; do
    if [ -d "$u" ]; then
        echo "Katalog: $u (Hajmi: $(du -sh "$u" 2>/dev/null | cut -f1))"
        ls -la "$u"
        echo "--------------------------------------------------"
    fi
done
echo ""

echo "=== [3/8] /var/www, /opt, /srv KATALOGLARI (Standart Veb Joylashuvlar) ==="
echo "[/var/www]:"
if [ -d /var/www ]; then
    ls -la /var/www
    du -sh /var/www/* 2>/dev/null || true
else
    echo "  -> /var/www mavjud emas."
fi
echo ""

echo "[/opt]:"
if [ -d /opt ]; then
    ls -la /opt
    du -sh /opt/* 2>/dev/null || true
else
    echo "  -> /opt mavjud emas."
fi
echo ""

echo "[/srv]:"
if [ -d /srv ]; then
    ls -la /srv
    du -sh /srv/* 2>/dev/null || true
else
    echo "  -> /srv mavjud emas."
fi
echo ""

echo "=== [4/8] SYSTEMD CUSTOM SERVISLAR (/etc/systemd/system) ==="
CUSTOM_SERVICES=$(find /etc/systemd/system -maxdepth 1 -name "*.service" -type f 2>/dev/null || true)
if [ -n "$CUSTOM_SERVICES" ]; then
    echo "Topilgan xizmatlar:"
    ls -la /etc/systemd/system/*.service
else
    echo "  -> Hech qanday qo'shimcha yoki eski loyiha servisi topilmadi."
fi
echo ""

echo "=== [5/8] MA'LUMOTLAR BAZALARI VA FAYLLARI (Postgres, MySQL, SQLite, MongoDB) ==="
echo -n "PostgreSQL (/var/lib/postgresql): "
if [ -d /var/lib/postgresql ]; then
    echo "MAVJUD ($(du -sh /var/lib/postgresql 2>/dev/null | cut -f1))"
    ls -la /var/lib/postgresql
else
    echo "YO'Q (O'rnatilmagan)"
fi

echo -n "MySQL/MariaDB (/var/lib/mysql): "
if [ -d /var/lib/mysql ]; then
    echo "MAVJUD ($(du -sh /var/lib/mysql 2>/dev/null | cut -f1))"
else
    echo "YO'Q (O'rnatilmagan)"
fi

echo -n "MongoDB (/var/lib/mongodb): "
if [ -d /var/lib/mongodb ]; then
    echo "MAVJUD ($(du -sh /var/lib/mongodb 2>/dev/null | cut -f1))"
else
    echo "YO'Q (O'rnatilmagan)"
fi

echo -n "Redis (/var/lib/redis): "
if [ -d /var/lib/redis ]; then
    echo "MAVJUD ($(du -sh /var/lib/redis 2>/dev/null | cut -f1))"
else
    echo "YO'Q (O'rnatilmagan)"
fi
echo ""

echo "=== [6/8] VEB-SERVERLAR VA KONFIGURATSIYALAR (Nginx, Apache, Caddy) ==="
if [ -d /etc/nginx ]; then
    echo "Nginx mavjud. Saytlar:"
    ls -la /etc/nginx/sites-enabled/ 2>/dev/null || true
else
    echo "  -> Nginx o'rnatilmagan."
fi

if [ -d /etc/apache2 ]; then
    echo "Apache mavjud. Saytlar:"
    ls -la /etc/apache2/sites-enabled/ 2>/dev/null || true
else
    echo "  -> Apache o'rnatilmagan."
fi
echo ""

echo "=== [7/8] DOKER VA KONTEYNERLAR ==="
if command -v docker >/dev/null 2>&1; then
    echo "Docker o'rnatilgan:"
    docker ps -a 2>/dev/null || true
else
    echo "  -> Docker o'rnatilmagan."
fi
echo ""

echo "=== [8/8] DISK VA KATTA HAJMLI PAPKALAR (Disk Usage Audit) ==="
df -h /
echo ""
echo "Asosiy kataloglar hajmi:"
du -sh /etc /home /opt /root /srv /tmp /usr /var 2>/dev/null | sort -h
echo ""

echo "=================================================================="
echo "  AUDIT YAKUNLANDI (100% READ-ONLY)"
echo "=================================================================="

