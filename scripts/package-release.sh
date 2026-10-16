#!/usr/bin/env bash
# ==============================================================================
# AssetAudit — Standalone Release Packager (Linux / CI)
# ==============================================================================
set -euo pipefail

STANDALONE_DIR=".next/standalone"
STATIC_SRC=".next/static"
STATIC_DEST=".next/standalone/.next/static"
PUBLIC_SRC="public"
PUBLIC_DEST=".next/standalone/public"

echo "=== AssetAudit: Standalone Release Paketini Yig'ish (Linux) ==="

if [ ! -d "${STANDALONE_DIR}" ]; then
    echo "XATO: ${STANDALONE_DIR} topilmadi. Avval 'npm run build' buyrug'ini bajaring."
    exit 1
fi

echo "[1/3] Statik resurslar nusxalanmoqda..."
mkdir -p "$(dirname "${STATIC_DEST}")"
cp -r "${STATIC_SRC}" "${STATIC_DEST}"

echo "[2/3] Public resurslar nusxalanmoqda..."
cp -r "${PUBLIC_SRC}" "${PUBLIC_DEST}"

echo "[3/3] Butunlik tekshiruvi..."
test -f "${STANDALONE_DIR}/server.js" || { echo "server.js yetishmaydi!"; exit 1; }
test -d "${STATIC_DEST}" || { echo ".next/static yetishmaydi!"; exit 1; }
test -d "${PUBLIC_DEST}" || { echo "public yetishmaydi!"; exit 1; }

echo "======================================================================"
echo "NATIJA: Standalone paket to'liq tayyor! (.next/standalone)"
echo "Ishga tushirish: node .next/standalone/server.js"
echo "======================================================================"
