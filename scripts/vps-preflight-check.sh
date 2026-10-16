#!/usr/bin/env bash
# ==============================================================================
# AssetAudit — Eskiz VPS READ-ONLY Preflight Diagnostika Skripti
# Ushbu skript VPS ga hech qanday o'zgartirish kiritmaydi, faqat READ-ONLY holatni ko'rsatadi.
# ==============================================================================
set -euo pipefail

echo "======================================================================"
echo "  ASSETAUDIT — ESKIZ VPS READ-ONLY PREFLIGHT TEKSHIRUVI"
echo "  Sana: $(date -u +"%Y-%m-%dT%H:%M:%SZ")"
echo "======================================================================"
echo ""

# 1. Operatsion Tizim
echo "--- [1/9] OPERATSION TIZIM ---"
if [ -f /etc/os-release ]; then
    grep -E '^(NAME|VERSION)=' /etc/os-release || true
fi
uname -a
echo ""

# 2. Node.js va NPM Runtime
echo "--- [2/9] NODE.JS VA NPM RUNTIME ---"
if command -v node >/dev/null 2>&1; then
    echo "Node.js: $(node -v)"
else
    echo "Node.js: O'RNATILMAGAN (Node.js 20 LTS o'rnatilishi zarur)"
fi
if command -v npm >/dev/null 2>&1; then
    echo "NPM: $(npm -v)"
else
    echo "NPM: O'RNATILMAGAN"
fi
echo ""

# 3. PostgreSQL Holati
echo "--- [3/9] POSTGRESQL HOLATI ---"
if systemctl is-active --quiet postgresql 2>/dev/null; then
    echo "PostgreSQL Service: ACTIVE (RUNNING)"
else
    echo "PostgreSQL Service: INACTIVE yoki O'RNATILMAGAN"
fi
if command -v pg_isready >/dev/null 2>&1; then
    pg_isready -h 127.0.0.1 -p 5432 || true
fi
if command -v psql >/dev/null 2>&1; then
    echo "psql client: $(psql --version)"
fi
echo ""

# 4. Disk Maydoni
echo "--- [4/9] DISK MAYDONI ---"
df -h /
echo ""

# 5. Operativ Xotira (RAM)
echo "--- [5/9] OPERATIV XOTIRA (RAM) ---"
free -h
echo ""

# 6. Swap Xotirasi
echo "--- [6/9] SWAP HOLATI ---"
if [ -f /proc/swaps ] && [ "$(wc -l < /proc/swaps)" -gt 1 ]; then
    swapon --show || true
else
    echo "OGOHLANTIRISH: Swap faol emas! 1 GB RAM li VPS da kamida 2 GB swapfile kerak."
fi
echo ""

# 7. Nginx Veb-Server
echo "--- [7/9] NGINX VEB-SERVER ---"
if command -v nginx >/dev/null 2>&1; then
    echo "Nginx versiyasi: $(nginx -v 2>&1)"
    if systemctl is-active --quiet nginx 2>/dev/null; then
        echo "Nginx Service: ACTIVE (RUNNING)"
    else
        echo "Nginx Service: INACTIVE"
    fi
else
    echo "Nginx: O'RNATILMAGAN"
fi
echo ""

# 8. Ochiq Portlar
echo "--- [8/9] FAOL PORTLAR (LISTENING) ---"
if command -v ss >/dev/null 2>&1; then
    ss -tulpn | grep -E ':(80|443|3000|5432|22)\b' || true
elif command -v netstat >/dev/null 2>&1; then
    netstat -tuln | grep -E ':(80|443|3000|5432|22)\b' || true
fi
echo ""

# 9. Mavjud va Eski Xizmatlar
echo "--- [9/9] ESKI VA JORIY XIZMATLAR ---"
systemctl list-units --type=service --state=running | grep -E 'node|next|assetaudit|mulk' || echo "Boshqa Node.js/AssetAudit xizmatlari topilmadi."
echo ""

echo "======================================================================"
echo "  PREFLIGHT TEKSHIRUVI YAKUNLANDI (100% READ-ONLY)"
echo "======================================================================"
