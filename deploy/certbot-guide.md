# AssetAudit (assetaudit.uz) — HTTPS va Let's Encrypt SSL Qo'llanmasi
## Eskiz VPS (Ubuntu 24.04 LTS / Debian) uchun to'liq yo'riqnoma

Ushbu qo'llanma **assetaudit.uz** va **www.assetaudit.uz** domenlari uchun bepul, avtomatik yangilanuvchi Let's Encrypt SSL/TLS sertifikatini o'rnatish bosqichlarini o'z ichiga oladi.

---

### 1. Dastlabki Shartlar (Pre-requisites)

Sertifikat olishdan oldin quyidagi shartlar bajarilgan bo'lishi shart:
1. **DNS A-Yozuvlari:**
   - Domen boshqaruv panelida (masalan, cPanel, Cloudflare yoki domen registratorida) `assetaudit.uz` va `www.assetaudit.uz` yozuvlari Eskiz VPS ning ommaviy IP manziliga (masalan: `XX.XX.XX.XX`) yo'naltirilgan bo'lishi kerak.
   - Tekshirish buyrug'i:
     ```bash
     dig +short assetaudit.uz
     dig +short www.assetaudit.uz
     ```
2. **Ochiq Tarmoq Portlari:**
   - Eskiz xavfsizlik devori (Security Groups / UFW) da **80 (HTTP)** va **443 (HTTPS)** portlari ochiq bo'lishi kerak:
     ```bash
     sudo ufw allow 80/tcp
     sudo ufw allow 443/tcp
     sudo ufw reload
     ```

---

### 2. Certbot va Nginx Pluginini O'rnatish

Eskiz VPS terminalida:
```bash
sudo apt update
sudo apt install -y certbot python3-certbot-nginx
```

---

### 3. Dastlabki Nginx Konfiguratsiyasini Faollashtirish

Sertifikat olishdan oldin, Let's Encrypt serveri domenni tekshira olishi uchun Nginx HTTP (Port 80) ishlayotgan bo'lishi kerak.

1. Nginx konfiguratsiya faylini joylashtirish:
   ```bash
   sudo cp deploy/nginx/assetaudit.uz.conf /etc/nginx/sites-available/assetaudit.uz.conf
   sudo ln -sf /etc/nginx/sites-available/assetaudit.uz.conf /etc/nginx/sites-enabled/
   ```

2. Certbot ACME webroot jildini yaratish:
   ```bash
   sudo mkdir -p /var/www/certbot
   sudo chown -R www-data:www-data /var/www/certbot
   ```

3. Nginx sintaksisini tekshirish va qayta yuklash:
   ```bash
   sudo nginx -t
   sudo systemctl reload nginx
   ```

---

### 4. SSL Sertifikatini Olish (Certbot)

Quyidagi buyruq orqali sertifikat so'raladi:
```bash
sudo certbot certonly --webroot -w /var/www/certbot \
  -d assetaudit.uz \
  -d www.assetaudit.uz \
  --email admin@assetaudit.uz \
  --agree-tos \
  --no-eff-email
```

Muvaffaqiyatli yakunlangach, quyidagi fayllar hosil bo'ladi:
- **Sertifikat zanjiri:** `/etc/letsencrypt/live/assetaudit.uz/fullchain.pem`
- **Maxfiy kalit:** `/etc/letsencrypt/live/assetaudit.uz/privkey.pem`

---

### 5. Nginx HTTPS Konfiguratsiyasini Ishga Tushirish

Sertifikat olingach, Nginx to'liq HTTPS rejimiga o'tadi:
```bash
sudo nginx -t
sudo systemctl reload nginx
```

Brauzer orqali tekshirish:
- `http://assetaudit.uz` avtomatik ravishda `https://assetaudit.uz` ga yo'nalishi kerak.
- SSL Labs orqali xavfsizlik darajasi: `A` yoki `A+`.

---

### 6. Avtomatik Yangilanishni (Auto-Renewal) Tekshirish

Let's Encrypt sertifikatlari 90 kun amal qiladi. Certbot tizimda avtomatik yangilanish taymerini o'rnatadi.

1. Taymer holatini tekshirish:
   ```bash
   sudo systemctl status certbot.timer
   ```

2. Sinov tariqasida simulyatsiya (Dry Run) qilish:
   ```bash
   sudo certbot renew --dry-run
   ```

3. Sertifikat yangilanganda Nginx avtomatik yangi sertifikatni yuklashi uchun deploy hook qo'shish:
   Fayl ochiladi: `/etc/letsencrypt/renewal-hooks/deploy/reload-nginx.sh`
   ```bash
   #!/bin/bash
   systemctl reload nginx
   ```
   Ijro ruxsati beriladi:
   ```bash
   sudo chmod +x /etc/letsencrypt/renewal-hooks/deploy/reload-nginx.sh
   ```
