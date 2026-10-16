# AssetAudit (assetaudit.uz) — Pullik Servislarsiz Offsite Zaxiralash Strategiyasi
## 0 So'm Xarajat bilan Ma'lumotlarni Geografik va Izolyatsiyalangan Saqlash

---

### 1. Nega Mahalliy Zaxira Yetarli Emas?

Agar PostgreSQL zaxiralari faqat Eskiz VPS diskida qolsa:
- Server apparat nosozligi (NVMe disk kuyishi)
- Ma'lumotlar markazidagi avariya yoki tarmoq uzilishi
- Tasodifiy VPS o'chirilishi yoki operatsion tizim buzilishi
yuz berganda zaxira nusxalari ham server bilan birga yo'qolishi mumkin.

---

### 2. Pullik Bulut Servislarisiz (0 So'm) Ikki Xil Yechim

#### 1-USUL: Pull Model — Administrator Kompyuteriga Avtomatik Yuklash (TAVSIYA ETILADI)
- **Mexanizm:** Administrator yoki tashkilotning mahalliy serveri/kompyuteri (Windows / Linux) har kuni kechasi (masalan, 03:00 da) rejalashtirilgan skript orqali VPS dagi zaxira fayllarni o'ziga ko'chirib oladi.
- **Skript:** `scripts/offsite-backup-pull.ps1` (Windows Task Scheduler orqali avtomatlashtiriladi):
  ```powershell
  powershell -File scripts\offsite-backup-pull.ps1 -VpsHost "assetaudit.uz" -VpsUser "assetaudit" -LocalOffsiteDir "D:\AssetAudit_Backups"
  ```
- **Xavfsizlik:** VPS da hech qanday tashqi ruxsat ochilmaydi; faqat mavjud SSH kalit orqali shaxsiy kompyuterga o'qish (read-only) huquqi bilan yuklanadi.
- **Xarajat:** 0 so'm.

#### 2-USUL: Push Model — Tashkilotning Ikkinchi Serveriga Shifrlab Uzatish
- **Mexanizm:** VPS da `cron` vazifasi orqali zaxira olingandan so'ng, fayl OpenSSL AES-256 bilan shifrlanadi va TATU ning ikkinchi ichki serveriga `rsync` orqali uzatiladi.
- **Skript:** `scripts/offsite-backup-push.sh`.
- **Shifrlash kaliti:** Faqat boshqaruvchiga ma'lum bo'lgan maxfiy faylda saqlanadi (`/etc/assetaudit/backup_encryption.key`).
- **Xarajat:** 0 so'm.

---

### 3. Zaxira Nusxalarini Tiklash Sinovi Qoidasi

Har qanday offsite zaxira kamida oyiga bir marta quyidagi skript orqali izolyatsiyalangan sinovdan o'tkazilishi shart:
```bash
# Linux:
bash scripts/restore-db-test.sh /yo'l/fayl.dump

# Windows:
powershell -File scripts\restore-db-test.ps1 -BackupFile "D:\AssetAudit_Backups\db_*.dump"
```
Bu ishlab chiqarish bazasiga zarar yetkazmasdan butunlikni 100% kafolatlaydi.
