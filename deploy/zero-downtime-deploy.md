# AssetAudit (assetaudit.uz) — Minimal-Downtime (<1s) Deployment va Tezkor Rollback Tartibi
## Atomar Relizlar, Symlink Arxitekturasi va Avtomatik Xatolikdan Qaytish

> [!NOTE]
> **Texnik aniqlik:** Yagona systemd xizmatini qayta ishga tushirish (`systemctl restart assetaudit`) paytida jarayon to'xtab, yangi Node jarayoni portni egallaguncha **taxminan 500ms – 1.5 soniyalik** minimal uzilish yuz beradi. Shuning uchun professional muhandislik nuqtai nazaridan bu jarayon **Minimal-Downtime Deployment** deb yuritiladi (haqiqiy 0ms uzilish uchun ikki portli Blue/Green upstream talab etiladi).

---

### 1. Arxitektura Tuzilishi (Symlink Modeli)

Eskiz VPS da server fayllari to'g'ridan-to'g'ri bitta papkaga ustma-ust yozilmaydi. Buning o'rniga har bir versiya o'z vaqt tamg'asi (timestamp) bilan alohida jildda saqlanadi:

```
/var/www/assetaudit/
├── releases/
│   ├── 20261016_120000/   <-- Eski barqaror reliz
│   └── 20261016_130000/   <-- Yangi yuklangan reliz
├── shared/
│   └── .env.production    <-- Barcha relizlar uchun umumiy maxfiy fayl (chmod 600)
├── current -> releases/20261016_130000/   <-- Atomar symlink ko'rsatkichi
```

Doimiy media yuklamalari esa server kodidan butunlay tashqarida saqlanadi:
```
/var/lib/assetaudit/uploads/ (chmod 750, assetaudit:assetaudit)
```

---

### 2. Relizni Joylashtirish Bosqichlari (Deployment Protocol)

`scripts/deploy-release.sh` skripti quyidagi 5 ta bosqichni to'liq avtomatlashtiradi:

1. **Nusxalash:** Yangi standalone paket `/var/www/assetaudit/releases/YYYYMMDD_HHMMSS` jildiga joylashtiriladi.
2. **Environment bog'lash:** `/var/www/assetaudit/shared/.env.production` yangi jildga symlink qilinadi.
3. **Atomar Symlink:** `ln -sfn` buyrug'i yordamida `/var/www/assetaudit/current` ko'rsatkichi 1 millisoniyada yangi relizga yo'naltiriladi.
4. **Xizmatni Qayta Yuklash:** `systemctl restart assetaudit` ishga tushadi. Nginx ushbu 0.5–1 soniyalik oraliqda kiruvchi so'rovlarni o'z buferida kutib turadi (foydalanuvchiga 502 chiqmaydi).
5. **Health Check:** `http://127.0.0.1:3000/api/health` so'rovi yuboriladi.

---

### 3. Avtomatik Xatolikdan Qaytish (Automated Instant Rollback)

Agar yangi reliz ishga tushgach `/api/health` tekshiruvi `500` yoki `503` bersa:
1. `scripts/deploy-release.sh` xatolikni darhol aniqlaydi.
2. Symlink bir zumda oldingi barqaror relizga qaytariladi:
   ```bash
   ln -sfn /var/www/assetaudit/releases/OLD_TAG /var/www/assetaudit/current
   systemctl restart assetaudit
   ```
3. Foydalanuvchilar hech qanday xatolik sezmaydi, tizim 100% ishchi holatda qoladi.

---

### 4. Diskni Tozalash Qoidasi (Garbage Collection)

Har bir muvaffaqiyatli deploymentdan keyin faqat oxirgi 3 ta barqaror reliz saqlab qolinadi, undan eskilar avtomatik o'chiriladi. Bu 20 GB lik Eskiz VPS diskining to'lib qolishini oldini oladi.
