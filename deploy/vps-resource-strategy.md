# AssetAudit (assetaudit.uz) — VPS Resurslari va Build Strategiyasi
## Eskiz VPS (1 GB RAM + 2 GB Swap) uchun Yuqori Unumdorlik va Barqarorlik Rejasi

---

### 1. Texnik Holat va Muammo Tahlili

- **Server parametrlari:** 1 vCPU, 1024 MB (1 GB) RAM, 20 GB NVMe SSD (Eskiz.uz).
- **Next.js 16 Build xususiyati:** Turbopack, React 19 va TypeScript kompilyatsiyasi paytida xotira sarfi vaqtinchalik 1.2 GB dan 1.8 GB gacha ko'tarilishi mumkin.
- **Asosiy xavf:** Agar 1 GB RAMli serverda cheklovlarsiz `next build` ishga tushirilsa, Linux operatsion tizimining **OOM Killer (Out-of-Memory Killer)** mexanizmi Node.js jarayonini majburiy o'ldiradi (`exit code 137` yoki `Killed`). Natijada PostgreSQL va Nginx xizmatlari ham xavf ostida qolishi mumkin.

---

### 2. Ishlab Chiqilgan Ikkita Yechim Strategiyasi

#### A-STRATEGIYA: Lokal/CI Build va Standalone Artefaktlarini Sinxronlash (TAVSIYA ETILADI — 0% XAVF)
Ushbu strategiyada og'ir build jarayoni VPS ga yuklanmaydi.

1. **Lokal yoki CI (GitHub Actions) da build qilish:**
   ```bash
   npm run build
   ```
   Next.js avtomatik ravishda `.next/standalone/` jildini hosil qiladi.

2. **Faqat tayyor yengil artefaktlarni VPS ga nusxalash (rsync / scp):**
   ```bash
   # VPS da papka tayyorlash
   ssh user@vps "mkdir -p /var/www/assetaudit"

   # Standalone server, statik fayllar va public resurslarni uzatish
   rsync -avz --delete .next/standalone/ user@vps:/var/www/assetaudit/
   rsync -avz .next/static/ user@vps:/var/www/assetaudit/.next/static/
   rsync -avz public/ user@vps:/var/www/assetaudit/public/
   ```

3. **Natija:**
   - VPS dagi build xotira sarfi: **0 MB** (Serverda og'ir build bajarilmaydi).
   - VPS dagi runtime xotira sarfi: bor-yo'g'i **85 MB – 120 MB** RAM!
   - Serverda `node_modules` jildini saqlashga yoki `npm install` qilishga hojat qolmaydi.

---

#### B-STRATEGIYA: To'g'ridan-to'g'ri VPS da Build Qilish (Zaxira Yechim)
Agar build bevosita VPS da bajarilishi shart bo'lsa, quyidagi xavfsizlik choralari majburiy:

1. **2 GB Swap Faylini Yaratish va Faollashtirish:**
   ```bash
   sudo fallocate -l 2G /swapfile
   sudo chmod 600 /swapfile
   sudo mkswap /swapfile
   sudo swapon /swapfile

   # Qayta yuklanganda saqlanib qolishi uchun fstab ga qo'shish:
   echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab

   # Swappiness sozlamasi (xotira 80% to'lganda swapga o'tish):
   sudo sysctl vm.swappiness=25
   echo 'vm.swappiness=25' | sudo tee -a /etc/sysctl.conf
   ```

2. **Node.js Xotira Cheklovi Bilan Build Qilish:**
   Node.js ga 1 GB dan ortiq RAM olmaslik buyrug'i beriladi:
   ```bash
   NODE_OPTIONS="--max-old-space-size=700" npm run build
   ```

---

### 3. Server Xotira Xaritasi va Byudjeti (Realistik Tahlil)

> [!NOTE]
> **Lokal Sinov Eslatmasi:** `scripts/load-test-concurrency.ts` skripti orqali o'tkazilgan sinovda tizim 150 ta parallel so'rov ostida eng yuqori **214 MB RSS** xotira sarfladi. Bu natija **lokal Windows muhitida olingan dastlabki ko'rsatkich** hisoblanadi.
> Real Linux (Ubuntu 24.04) muhitida xotira sarfi `glibc` xotira allokatori, V8 Garbage Collector dinamikasi va bir vaqtdagi ulanishlar soniga bog'liq.

1024 MB (1 GB) jismoniy operativ xotiraning realistik taqsimoti:

| Xizmat nomi | Realistik RAM hajmi | Optimallashtirish va Cheklov choralari |
|---|:---:|---|
| **Linux OS & Systemd** | ~140 MB – 170 MB | Keraksiz servislar o'chirilgan, yengil kernel |
| **PostgreSQL 18** | ~160 MB – 220 MB | `shared_buffers = 128MB`, `max_connections = 20` |
| **AssetAudit Connection Pool** | ~15 MB – 25 MB | `POOL_MAX_CONNECTIONS = 5` qat'iy chegarasi |
| **Nginx Reverse Proxy** | ~25 MB – 40 MB | Statik kesh, `worker_connections 1024` |
| **Next.js Standalone Node** | ~120 MB – 250 MB | Standalone runtime, `systemd MemoryHigh=380M` |
| **Jami Band Qilingan RAM** | **~460 MB – 705 MB** | Normal va o'rtacha yuklama ostida |
| **Erkin Qolgan Xotira (Headroom)**| **~319 MB – 564 MB** | Kesh va cho'qqi so'rovlar uchun zaxira |
| **Zaxira Swap Xotirasi** | **2048 MB (2 GB)** | RAM to'lganda NVMe SSD dan foydalanish |

---

### 4. OOM (Out-of-Memory) Xavfini Minimallashtirish

> [!WARNING]
> Har qanday 1 GB RAMli serverda OOM xavfini mutlaqo "0%" deb da'vo qilish muhandislik jihatidan noto'g'ri. Biroq tizimda **uch bosqichli himoya** o'rnatilgan:

1. **2 GB Swap Fayli:** To'satdan yuklama ko'payganda tizim darhol to'xtab qolmaydi, yuklamani swap xotiraga o'tkazadi.
2. **systemd Cgroups Cheklovi:** `MemoryHigh=380M` va `MemoryMax=450M` parametrlari Node.js xotirasi nazoratsiz o'sib ketishining oldini oladi. Agar Node.js 450 MB ga yetsa, faqat ilova xavfsiz qayta ishga tushadi, butun VPS operatsion tizimi va PostgreSQL bazasi qulab tushmaydi.
3. **PostgreSQL Pool Throttling:** `POOL_MAX_CONNECTIONS = 5` orqali baza xotirasi doimo nazorat ostida saqlanadi.
