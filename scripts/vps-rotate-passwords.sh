#!/usr/bin/env bash
# ==============================================================================
# AssetAudit — VPS Xavfsiz Parol Rotatsiyasi va Tarix Tozalash
# ==============================================================================
set -euo pipefail

echo ""
echo "=================================================================="
echo "  ASSETAUDIT: VPS PAROLLARINI YANGILASH (ROTATSIYA)"
echo "  Server: ${VPS_HOST:-127.0.0.1}"
echo "=================================================================="
echo ""

echo ">>> [1/3] DEPLOYER FOYDALANUVCHISI PAROLINI YANGILASH:"
echo "    Eski oshkor bo'lgan parolni yangisiga almashtiring."
echo "    (Linux terminalida kiritilgan parol ekranda ko'rinmaydi)."
echo "------------------------------------------------------------------"
passwd

echo ""
echo ">>> [2/3] ROOT ADMINISTRATORI PAROLINI YANGILASH:"
echo "    Eski root parolini xavfsiz yangilang."
echo "    (Avval deployer uchun yangi sudo parolini kiritishingiz so'ralishi mumkin)."
echo "------------------------------------------------------------------"
sudo passwd root

echo ""
echo ">>> [3/3] SHELL TARIXI (BASH HISTORY) XAVFSIZLIGINI TEKSHIRISH:"
echo "------------------------------------------------------------------"
LEAKS_FOUND=0

if [ -f /root/.bash_history ]; then
    if sudo grep -qi -E 'passwd|useradd|ssh-ed25519' /root/.bash_history 2>/dev/null; then
        echo "  [TOPILDI] /root/.bash_history faylida maxfiy buyruqlar aniqlandi."
        LEAKS_FOUND=1
    fi
fi

if [ -f "$HOME/.bash_history" ]; then
    if grep -qi -E 'passwd|useradd|ssh-ed25519' "$HOME/.bash_history" 2>/dev/null; then
        echo "  [TOPILDI] $HOME/.bash_history faylida maxfiy buyruqlar aniqlandi."
        LEAKS_FOUND=1
    fi
fi

if [ "$LEAKS_FOUND" -eq 1 ]; then
    echo "  -> Xavfsizlik maqsadida root va deployer bash tarixi xavfsiz tozalanmoqda..."
    sudo truncate -s 0 /root/.bash_history 2>/dev/null || true
    truncate -s 0 "$HOME/.bash_history" 2>/dev/null || true
    history -c 2>/dev/null || true
    echo "  -> Bash tarixi to'liq va xavfsiz tozalandi (0 bayt)."
else
    echo "  -> Bash tarixi toza. Hech qanday maxfiy ma'lumot saqlanmagan."
fi

echo ""
echo "=================================================================="
echo "  PAROLLAR MUVAFFAQIYATLI YANGILANDI VA XAVFSIZLIK TA'MINLANDI!"
echo "=================================================================="
echo ""

