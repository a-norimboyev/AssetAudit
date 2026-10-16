# AssetAudit (assetaudit.uz) — Fayl Saqlash va Media Xavfsizligi Arxitekturasi
## Persistent Storage, Magic Bytes, Media Xavfsizligi va Antivirus Tahlili

---

### 1. Doimiy Saqlash Jildi (Persistent Storage)

Next.js konteyner yoki jarayoni qayta ishga tushirilganda (`next build` yoki `systemctl restart assetaudit`) foydalanuvchilar yuklagan suratlar o'chib ketmasligi uchun saqlash arxitekturasi quyidagicha ajratilgan:

- **Ishlab chiqarish (Production VPS):** `/var/lib/assetaudit/uploads`
  - Bu jild loyihaning `.next/` yoki kod jildidan butunlay tashqarida alohida disk bo'limida joylashadi.
  - To'g'ri Linux huquqlari (Nginx `www-data` va Next.js `assetaudit` foydalanuvchisi uchun):
    ```bash
    sudo groupadd -f assetaudit
    sudo useradd -r -s /bin/false -g assetaudit assetaudit || true
    # Nginx o'qiy olishi uchun uni assetaudit guruhiga qo'shish:
    sudo usermod -aG assetaudit www-data
    sudo mkdir -p /var/lib/assetaudit/uploads
    sudo chown -R assetaudit:assetaudit /var/lib/assetaudit/uploads
    # 2750: egasi rwx, guruhi (assetaudit/www-data) r-x, boshqalar hech narsa (0).
    # setgid (2...) yangi yaratilgan har bir rasm fayliga avtomatik assetaudit guruhini biriktiradi:
    sudo chmod 2750 /var/lib/assetaudit/uploads
    ```
- **Lokal / Test:** `public/uploads/inventory` (ishlab chiqish uchun qulay ko'rinish).
- **Konfiguratsiya:** `UPLOAD_STORAGE_DIR` muhit o'zgaruvchisi orqali boshqariladi.

---

### 2. Kiruvchi Fayllarni Tekshirish (Birinchi Bosqich Himoyasi)

`src/lib/actions/upload.ts` faylida quyidagi filtrlash amalga oshiriladi:
1. **Ruxsat etilgan turlar:** Faqat `image/jpeg`, `image/png`, `image/webp`.
2. **Hajm chegarasi:** Maksimal 2 MB (DoS xurujlarining oldini olish uchun).
3. **Magic Bytes (Binar Imzo):**
   - JPEG: `FF D8 FF`
   - PNG: `89 50 4E 47 0D 0A 1A 0A`
   - WEBP: `RIFF .... WEBP`
4. **Matnli Hevristika (Anti-Malware Heuristics):**
   - Faylning dastlabki 1024 baytida `<?php`, `<script>`, `<html>`, `<!doctype` yoki PE Executable (`MZ`) sarlavhalari qidiriladi.

---

### 3. MUHIM OGOHLANTIRISH: Matnli Hevristika va Haqiqiy Antivirus Farqi

> [!WARNING]
> Dasturdagi oddiy matnli zararli kod qidiruvi (heuristic text search) **to'liq Antivirus (AV) dvigateli EMAS**!

- **Nega to'liq antivirus emas?**
  1. Steganografiya (rasm piksellari orasiga yashirilgan ma'lumotlar).
  2. Polyglot fayllar (ham to'g'ri JPEG, ham ichiga ZIP/PHP yashirilgan fayllar).
  3. Base64 yoki boshqa usullarda shifrlangan/obfuskatsiya qilingan zararli kodlar.
  Ushbu murakkab tahdidlarni oddiy `includes("<?php")` aniqlay olmaydi.
- **Katta ishlab chiqarish muhitida tavsiya etiladigan qo'shimcha yechim:**
  - Linux server darajasida **ClamAV daemon (`clamdscan`)** o'rnatish.
  - Har bir yuklangan faylni asinxron tekshiruvchi background worker yoki cron job sozlash:
    ```bash
    sudo apt install -y clamav clamav-daemon
    sudo systemctl enable --now clamav-daemon
    # Faylni skanerlash:
    clamdscan --fdpass /var/lib/assetaudit/uploads/
    ```

---

### 4. Chuqurlashtirilgan Himoya (Defense-in-Depth via Nginx)

Fayl ichida hatto zararli script bo'lgan taqdirda ham uning zarar yetkazishini bartaraf qilish uchun **Nginx darajasida 4 qatlamli to'siq** o'rnatilgan:

1. **Skript ijrosini qat'iy bloklash:**
   ```nginx
   location /uploads/ {
       alias /var/lib/assetaudit/uploads/;
       # Uploads jildida PHP, Python, Bash, Perl, Executable fayllar 403 bilan to'xtatiladi:
       location ~* \.(php|phtml|pl|py|cgi|sh|bash|exe|jsp|asp|aspx|bin)$ {
           return 403;
       }
   }
   ```
2. **MIME-Type Sniffingni taqiqlash:**
   `add_header X-Content-Type-Options "nosniff" always;` — Brauzer rasmni hech qachon JavaScript yoki HTML sifatida bajara olmaydi.
3. **Sandbox Content-Security-Policy:**
   `add_header Content-Security-Policy "default-src 'none'; style-src 'unsafe-inline'; sandbox;" always;` — Ushbu jilddan ochilgan fayl hatto HTML bo'lsa ham brauzer sandboxida hech qanday scriptni ishlata olmaydi.
4. **Fayl nomlarini randomizatsiya qilish:**
   Foydalanuvchi yuborgan original fayl nomi (masalan `shell.php.jpg`) o'chirilib, serverda UUID bilan almashtiriladi (`tatu-inv001-c8a7b9f2-....png`). Bu Path Traversal (`../../`) xurujini 100% yo'qotadi.

---

### 5. Maxfiy Inventar Suratlariga Kirish Siyosati (Public vs Private Media Policy)

1. **Ommaviy QR Tekshiruvi (`/qr/[token]`):**
   - Jismoniy buyum QR kodi orqali ochiladigan ommaviy sahifada **suratlar mutlaqo ko'rsatilmaydi**. Faqat inventar raqami, buyum nomi, tashkilot nomi va xona ko'rsatiladi.
2. **Ichki Tizim (`/org/inventory/[id]`):**
   - Suratlarni ko'rish va yuklash faqat tashkilot administratori va mas'ul xodimlar uchun cheklangan.
3. **Qidiruv Tizimlaridan Yashirish:**
   - Nginx `/uploads/` uchun `X-Robots-Tag: noindex, nofollow` sarlavhasini qaytaradi.
   - `robots.txt` faylida `Disallow: /uploads/` qoidasi orqali barcha qidiruv botlari bloklanadi.
4. **Kriptografik UUID Entropiyasi:**
   - Har bir surat fayli 128-bitli tasodifiy UUID bilan saqlangani sababli, fayl manzilini taxmin qilish (brute-force enumeration) matematik jihatdan imkonsizdir.
