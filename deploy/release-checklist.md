# AssetAudit (assetaudit.uz) — Ishlab Chiqarishga Chiqarish (Release) Nazorat Ro'yxati
## Domen, Xavfsizlik, Mobil QR va Jismoniy Sinovlar

Ushbu nazorat ro'yxati tizimni ommaga e'lon qilishdan oldin o'tkaziladigan barcha amaliy tekshiruvlarni qamrab oladi.

---

### 1. Domen va DNS Tayyorgarligi

- [ ] **DNS A-Yozuvi:** `assetaudit.uz` -> Eskiz VPS ning ommaviy IPv4 manziliga yo'naltirilgan.
- [ ] **DNS CNAME/A:** `www.assetaudit.uz` -> Eskiz VPS ga yo'naltirilgan.
- [ ] **Propagatsiya:** `nslookup assetaudit.uz 8.8.8.8` to'g'ri IP manzilni qaytarmoqda.
- [ ] **Xavfsizlik Devori (UFW):** Faqat 22 (SSH), 80 (HTTP) va 443 (HTTPS) portlari ochiq. Baza porti (5432) tashqi internetga yopiq (`127.0.0.1` bilan chegaralangan).

---

### 2. VPS Tizim va Resurslar Holati

- [ ] **Swap Xotirasi:** 2 GB swap fayli faol (`swapon --show` orqali tasdiqlangan).
- [ ] **Doimiy Fayl Saqlash:** `/var/lib/assetaudit/uploads` mavjud va ruxsati `assetaudit:assetaudit` ga berilgan (`chmod 750`).
- [ ] **Muhit O'zgaruvchilari:** `/var/www/assetaudit/.env.production` faylida:
  - `BETTER_AUTH_SECRET` kamida 32 belgili tasodifiy kalit.
  - `BETTER_AUTH_URL=https://assetaudit.uz`
  - `NEXT_PUBLIC_APP_URL=https://assetaudit.uz`
  - `UPLOAD_STORAGE_DIR=/var/lib/assetaudit/uploads`
  - `RATE_LIMIT_ENABLED=true`
  - Ruxsati `chmod 600` bilan faqat `assetaudit` foydalanuvchisiga cheklangan.

---

### 3. Nginx va SSL Sertifikati

- [ ] **SSL Sertifikati:** Let's Encrypt sertifikati muvaffaqiyatli olingan.
- [ ] **HTTP Redirect:** `http://assetaudit.uz` ochilganda avtomatik `301 -> https://assetaudit.uz` ga o'tmoqda.
- [ ] **SSL Labs Reytingi:** Qualys SSL Labs orqali `A` yoki `A+` bahosi olingan.
- [ ] **Uploads Xavfsizligi:** `https://assetaudit.uz/uploads/test.php` so'rovi Nginx darajasida `403 Forbidden` qaytarmoqda.
- [ ] **Auto-Renewal:** `sudo certbot renew --dry-run` xatosiz yakunlanmoqda.

---

### 4. Ma'lumotlar Bazasi va Migratsiyalar

- [ ] **Zaxira (Backup):** Dastlabki `bash scripts/backup-db.sh` orqali toza zaxira va `.sha256` xeshi olindi.
- [ ] **Drizzle Migratsiyalari:** `0000`, `0001`, `0002`, `0003`, `0004` migratsiyalari production bazasiga to'liq tatbiq etildi.
- [ ] **Admin Parol Reseti:** `TATU_ADMIN_RESET.bat` orqali haqiqiy `tatu.admin` paroli foydalanuvchi tomonidan maxfiy terminalda o'rnatildi.
- [ ] **Eski Sessiyalar:** Parol o'zgargach, barcha eski sessiyalar bekor qilingani tasdiqlandi.

---

### 5. Mobil Qurilma va Jismoniy Kamera Sinovlari (Smartfonlar)

> [!IMPORTANT]
> QR kod skaneri faqat brauzerda emas, real smartfon kamerasida jismoniy tekshirilishi shart!

- [ ] **Android (Google Chrome):**
  - Smartfonda `https://assetaudit.uz/login` ochilib, `tatu.inspector` hisobi bilan kirildi.
  - `/audit/scan` sahifasiga o'tildi.
  - Brauzer "Kameradan foydalanishga ruxsat berasizmi?" so'rovini chiqardi va ruxsat berildi.
  - Orqa kamera (Environment camera) avtomatik faollashdi.
- [ ] **Apple iOS (Safari):**
  - iPhone da `https://assetaudit.uz/audit/scan` ochildi.
  - Safari kamera ruxsati berildi va video-oqim qotmasdan ishladi.
- [ ] **Jismoniy Termo-Stikerni Skanerlash:**
  - Chop etilgan 50x30 mm yoki 70x40 mm o'lchamdagi QR stiker stolga qo'yildi.
  - Kamera 15-30 sm masofadan yo'naltirildi.
  - **Skanerlash tezligi:** 0.5 soniyadan kam vaqtda muvaffaqiyatli aniqlandi (yashil **MATCH** yoki qizil **CONFLICT**).
- [ ] **Smartfonning Oddiy (Tizim) Kamerasi Bilan Sinov:**
  - Tizimdan mutlaqo chiqib ketilgan (logout) holatda, telefonning standart kamera ilovasi bilan QR kodga qaraldi.
  - Telefon ekranda `https://assetaudit.uz/qr/[token]` havolasini taklif qildi.
  - Havolaga bosilganda umumiy ma'lumotlar (Bino, Xona, Mulk nomi) ochildi.
  - Narx va javobgar shaxs yashirin ekanligi tasdiqlandi.

---

### 6. Chop Etish Sifati (Print Labels)

- [ ] **A4 Qog'oz:** `/org/inventory/print-labels` orqali standart printerda 24 talik stikerlar to'plami chop etildi.
- [ ] **Termo-Printer (Xprinter / Zebra):** 50x30 mm o'lchamdagi termo-yorliqda QR kod chiziqlari aniq, qora va o'qilishi oson ekanligi tekshirildi.

---

### 7. Monitoring va Barqarorlik

- [ ] `curl -I https://assetaudit.uz/api/health` doimiy ravishda HTTP 200 va `healthy` qaytarmoqda.
- [ ] `systemctl status assetaudit` holati `active (running)`. Xotira sarfi 150 MB dan past.
- [ ] Zaxiralash cron vazifalari (`crontab -l`) sozlangan va ishlamoqda.
