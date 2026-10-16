#!/bin/bash
set -e
echo "=== ASSETAUDIT: NGINX VA PM2 AUTOSTART SOZLASH ==="

echo "1. Nginx konfiguratsiyasi ko'chirilmoqda..."
sudo cp /home/deployer/assetaudit.nginx.conf /etc/nginx/sites-available/assetaudit
sudo rm -f /etc/nginx/sites-enabled/default
sudo ln -sf /etc/nginx/sites-available/assetaudit /etc/nginx/sites-enabled/assetaudit

echo "2. Nginx sintaksisi tekshirilmoqda..."
sudo nginx -t

echo "3. Nginx qayta yuklanmoqda..."
sudo systemctl reload nginx
echo "  -> Nginx muvaffaqiyatli faollashtirildi (Port 80 -> 3000)!"

echo "4. PM2 tizim avtomatik ishga tushirish (systemd) sozlanmoqda..."
sudo env PATH=$PATH:/usr/bin /usr/lib/node_modules/pm2/bin/pm2 startup systemd -u deployer --hp /home/deployer
pm2 save

echo "=================================================="
echo "  HAMMASI TAYYOR! AssetAudit port 80 da faol!"
echo "=================================================="

