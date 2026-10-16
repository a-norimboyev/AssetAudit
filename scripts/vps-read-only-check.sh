#!/usr/bin/env bash
# ==============================================================================
# AssetAudit — Eskiz VPS: 100% READ-ONLY Preflight Diagnostika
# Ushbu skript serverga hech qanday yozish yoki o'zgartirish kiritmaydi.
# ==============================================================================
set -euo pipefail

echo "======================================================================"
echo "  ASSETAUDIT — ESKIZ VPS READ-ONLY DIAGNOSTIKA"
echo "  Server: ${VPS_HOST:-127.0.0.1} | Vaqt: $(date -u +"%Y-%m-%d %H:%M:%S UTC")"
echo "======================================================================"
echo ""

# 1. Operatsion Tizim va Kernel
echo "=== [1/10] OPERATSION TIZIM VA KERNEL ==="
if [ -f /etc/os-release ]; then
    grep -E '^(PRETTY_NAME|NAME|VERSION|VERSION_ID)=' /etc/os-release || true
fi
uname -a
echo ""

# 2. CPU / Protsessor
echo "=== [2/10] CPU / PROTSESSOR ==="
if command -v lscpu >/dev/null 2>&1; then
    lscpu | grep -E 'Model name|CPU\(s\):|Thread|Socket|Architecture' || true
else
    grep -m 1 "model name" /proc/cpuinfo || true
fi
echo ""

# 3. Disk Maydoni
echo "=== [3/10] DISK MAYDONI ==="
df -h /
echo ""

# 4. Operativ Xotira (RAM) va Swap
echo "=== [4/10] OPERATIV XOTIRA (RAM) VA SWAP ==="
free -h
echo ""
if [ -f /proc/swaps ] && [ "$(wc -l < /proc/swaps)" -gt 1 ]; then
    echo "Faol Swap bo'limlari:"
    swapon --show || true
else
    echo "OGOHLANTIRISH: Swap faol emas! 1 GB RAM li VPS uchun kamida 2 GB Swap kerak."
fi
echo ""

# 5. Node.js va JavaScript Runtime
echo "=== [5/10] NODE.JS VA RUNTIME HOLATI ==="
if command -v node >/dev/null 2>&1; then
    echo "Node.js: $(node -v) (O'rnatilgan)"
else
    echo "Node.js: O'RNATILMAGAN"
fi
if command -v npm >/dev/null 2>&1; then
    echo "NPM: $(npm -v)"
else
    echo "NPM: O'RNATILMAGAN"
fi
echo ""

# 6. PostgreSQL Baza Holati
echo "=== [6/10] POSTGRESQL MA'LUMOTLAR BAZASI ==="
if command -v psql >/dev/null 2>&1; then
    echo "PostgreSQL CLI: $(psql --version)"
    if systemctl is-active --quiet postgresql 2>/dev/null; then
        echo "PostgreSQL Service: ACTIVE (Ishlamoqda)"
        echo "Mavjud bazalar:"
        psql -U postgres -c "SELECT datname, pg_size_pretty(pg_database_size(datname)) as size FROM pg_database WHERE datistemplate = false;" 2>/dev/null || echo "psql orqali bazalar ro'yxatini olishda ruxsat talab qilindi."
    else
        echo "PostgreSQL Service: INACTIVE (To'xtatilgan yoki o'rnatilmagan)"
    fi
else
    echo "PostgreSQL: O'RNATILMAGAN (Yangi toza tizim)"
fi
echo ""

# 7. Nginx Veb-Server
echo "=== [7/10] NGINX VEB-SERVER ==="
if command -v nginx >/dev/null 2>&1; then
    echo "Nginx: $(nginx -v 2>&1)"
    if systemctl is-active --quiet nginx 2>/dev/null; then
        echo "Nginx Service: ACTIVE (Ishlamoqda)"
    else
        echo "Nginx Service: INACTIVE"
    fi
else
    echo "Nginx: O'RNATILMAGAN"
fi
echo ""

# 8. UFW Xavfsizlik Devori
echo "=== [8/10] UFW XAVFSIZLIK DEVORI ==="
if command -v ufw >/dev/null 2>&1; then
    ufw status verbose || true
else
    echo "UFW: O'RNATILMAGAN"
fi
echo ""

# 9. Eski Loyiha Fayllari va Kataloglar (/var/www, /opt, /srv, /home)
echo "=== [9/10] MAVJUD LOYIHALAR VA KATALOGLAR ==="
echo "[/var/www]:"
if [ -d /var/www ]; then
    ls -la /var/www
else
    echo "/var/www mavjud emas."
fi
echo ""
echo "[/opt]:"
ls -la /opt 2>/dev/null || true
echo ""
echo "[/srv]:"
ls -la /srv 2>/dev/null || true
echo ""
echo "[/home]:"
ls -la /home 2>/dev/null || true
echo ""
echo "[Faol Veb/Node jarayonlari]:"
ps aux | grep -E 'node|next|npm|gunicorn|python' | grep -v grep || echo "Faol Node/Veb jarayonlari topilmadi."
echo ""

# 10. Ochiq Portlar (22, 80, 443, 3000, 5432)
echo "=== [10/10] OCHIQ PORTLAR HOLATI ==="
if command -v ss >/dev/null 2>&1; then
    ss -tuln 2>/dev/null | grep -E ':(22|80|443|3000|5432)\b' || echo "Standart portlar faol emas."
elif command -v netstat >/dev/null 2>&1; then
    netstat -tuln 2>/dev/null | grep -E ':(22|80|443|3000|5432)\b' || true
fi
echo ""

echo "======================================================================"
echo "  DIAGNOSTIKA TUGADI (100% READ-ONLY)"
echo "======================================================================"
