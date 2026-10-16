#!/usr/bin/env bash
# ==============================================================================
# AssetAudit — Eskiz VPS: Xavfsiz Deployer Bootstrap Skripti
# Ushbu skript faqat alohida 'deployer' foydalanuvchisini yaratadi,
# sudo huquqini (parol bilan) beradi va Windows Ed25519 public keyni o'rnatadi.
#
# XAVFSIZLIK:
# - root authorized_keys ga tegilmaydi.
# - NOPASSWD:ALL qo'shilmaydi (sudo parol talab qiladi).
# - sshd_config o'zgartirilmaydi.
# ==============================================================================
set -euo pipefail

echo ""
echo "======================================================================"
echo "  ASSETAUDIT: VPS DEPLOYER SOZLASH BOSHLANDI"
echo "  Server: ${VPS_HOST:-127.0.0.1}"
echo "======================================================================"
echo ""

# 1. deployer foydalanuvchisini yaratish
echo "[1/4] deployer foydalanuvchisi tekshirilmoqda..."
if id -u deployer &>/dev/null; then
    echo "  -> 'deployer' foydalanuvchisi allaqachon mavjud."
else
    useradd -m -s /bin/bash deployer
    echo "  -> 'deployer' foydalanuvchisi yaratildi."
fi

# 2. Sudo guruhiga biriktirish (Standart parolli sudo)
echo "[2/4] Sudo guruhiga qo'shilmoqda..."
usermod -aG sudo deployer
echo "  -> 'deployer' sudo guruhiga biriktirildi (NOPASSWD yo'q, parolli autentifikatsiya)."

# 3. deployer uchun kuchli parol o'rnatish
echo ""
echo "======================================================================"
echo ">>> [3/4] DEPLOYER UCHUN ALOHIDA KUCHLI SUDO PAROLINI KIRITING:"
echo "======================================================================"
passwd deployer

# 4. Windows Ed25519 public keyni faqat deployer profiliga o'rnatish
echo ""
echo "[4/4] Ed25519 Public Key o'rnatilmoqda..."
mkdir -p /home/deployer/.ssh
chmod 700 /home/deployer/.ssh

cat << 'EOF' > /home/deployer/.ssh/authorized_keys
ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAINGHI1HpqXUdbHP27f/quzO1Q4e+0tfq73EmOgiIF6cH assetaudit-deploy@assetaudit.uz
EOF

chmod 600 /home/deployer/.ssh/authorized_keys
chown -R deployer:deployer /home/deployer/.ssh

echo ""
echo "======================================================================"
echo "  MUVAFFAQIYAT! DEPLOYER SOZLANDI VA ED25519 KALITI O'RNATILDI."
echo "  Root kalitlariga tegilmadi. NOPASSWD qo'shilmadi."
echo "======================================================================"
echo ""

