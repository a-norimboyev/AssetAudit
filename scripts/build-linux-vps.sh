#!/usr/bin/env bash
# ==============================================================================
# AssetAudit — Eskiz VPS da Mahalliy Linux-Native Build Skripti
# Windowsda yig'ilgan paketni Linuxga ko'chirishdagi NTFS/Junction va native
# binary nomutanosibliklarini bartaraf etish uchun bevosita Linuxda yig'ish
# ==============================================================================
set -euo pipefail

echo "=== AssetAudit: Eskiz VPS (Ubuntu 24.04) Linux-Native Build ==="

# 1. 2 GB Swap faolligini tekshirish
if ! swapon --show | grep -q "swap"; then
    echo "[XATOLIK] Serverda Swap xotirasi aniqlanmadi!"
    echo "1 GB RAMda Next.js build paytida OOM xatosi chiqmasligi uchun kamida 2 GB swap yoqilishi shart:"
    echo "  sudo fallocate -l 2G /swapfile && sudo chmod 600 /swapfile && sudo mkswap /swapfile && sudo swapon /swapfile"
    exit 1
fi
echo "[1/4] Swap xotirasi faol."

# 2. Linux native bog'liqliklarini toza o'rnatish
echo "[2/4] Linux uchun toza 'npm ci' o'rnatilmoqda..."
npm ci

# 3. Xotira chegarasi bilan Next.js Standalone paketini yig'ish
echo "[3/4] NODE_OPTIONS='--max-old-space-size=700' bilan standalone paket yig'ilmoqda..."
NODE_OPTIONS="--max-old-space-size=700" npm run package

# 4. Standalone butunligini tasdiqlash
echo "[4/4] Linux Standalone butunligi tekshirilmoqda..."
test -f ".next/standalone/server.js" || { echo "server.js yetishmaydi!"; exit 1; }
test -d ".next/standalone/.next/static" || { echo ".next/static yetishmaydi!"; exit 1; }
test -d ".next/standalone/public" || { echo "public yetishmaydi!"; exit 1; }

echo "======================================================================"
echo "NATIJA: Linux-Native Standalone Reliz paketi muvaffaqiyatli tayyorlandi!"
echo "Joylashuv: .next/standalone"
echo "Keyingi qadam: bash scripts/deploy-release.sh .next/standalone"
echo "======================================================================"
