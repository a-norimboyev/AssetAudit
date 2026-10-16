# AssetAudit (`assetaudit.uz`)

> **Universitetlar, davlat idoralari va korxonalar uchun zamonaviy, xavfsiz va ko‘p tashkilotli (Multi-Tenant) raqamli inventarizatsiya va mulk nazorati platformasi.**

---

## 🌟 Loyiha Haqida

**AssetAudit** — korxona va ta'lim muassasalarida (masalan, Toshkent Axborot Texnologiyalari Universiteti — TATU) barcha moddiy-texnik aktivlarni bino, qavat va xonalar kesimida aniq hisobga olish, kriptografik QR kodlar orqali tezkor audit o‘tkazish hamda joylashuv nomuvofiqliklarini (konfliktlarni) avtomatlashtirilgan tarzda aniqlash uchun yaratilgan korporativ tizim.

---

## 🏗 Arxitektura va Asosiy Imkoniyatlar

- **Qat'iy Multi-Tenant Izolyatsiyasi:** Har bir tashkilot ma'lumotlari (`organization_id`) mustaqil ajratilgan. PostgreSQL darajasida 4-qatlamli Composite Foreign Key (`fk_items_hierarchy_composite`) orqali begona tashkilot xonasiga inventar bog'lash imkoni mutlaqo bloklangan.
- **Rolga Asoslangan Ruxsatlar Tizimi (RBAC):**
  - `super_admin`: Platforma miqyosidagi tashkilotlarni boshqarish (ichki audit ma'lumotlariga to'g'ridan-to'g'ri aralashmaydi).
  - `organization_admin`: Tashkilot tuzilmasi, binolar, xonalar, xodimlar va rasmiy inventar ko'chirish huquqi.
  - `inspector`: Faqat inventarizatsiya auditini o'tkazish va skanerlash vakolati.
  - `registrar`: Yangi inventarlarni ro'yxatga olish huquqi (rasmiy joylashuvni ko'chirish huquqisiz).
- **Kriptografik QR Tizimi:** 48 belgili yuqori entropiyali QR tokenlar. Ommaviy ko'rish sahifasida (`/qr/[token]`) buxgalteriya narxi, xodim shaxsi yoki audit sirlari ommaga ko'rinmaydi. `restricted` rejimida aniq xona manzili ham loginsiz foydalanuvchidan yashiriladi.
- **Himoyalangan Media Server:** Inventar suratlari to'g'ridan-to'g'ri ommaga ochilmaydi (`/uploads/` bloklangan). Kirish faqat avtorizatsiyadan o'tgan xodimlar uchun `/api/media/items/[id]/photo` orqali, `X-Content-Type-Options: nosniff` va `Content-Security-Policy: sandbox` choralari bilan ta'minlanadi.
- **Xavfsiz Excel / CSV Import:** Ommaviy ma'lumot kiritishda takroriy inventar raqamlarini rad etish va SheetJS Prototype Pollution / ReDoS ekspluatatsiyasidan fail-closed himoya.
- **Audit va Rekonsilyatsiya:** Skanerlangan inventarlarning kutilgan xonaga mosligini tekshirish (`Match` vs `Conflict`), yo'qolgan buyumlarni hisobga olish va CSV eksport.

---

## 🛠 Texnologiyalar Steki

| Qatlam | Texnologiya | Tavsif |
| :--- | :--- | :--- |
| **Frontend & Backend** | [Next.js 16.4](https://nextjs.org) (Turbopack) | App Router, Server Actions, React 19 |
| **Autentifikatsiya** | [Better Auth 1.7](https://www.better-auth.com) | Scrypt xeshlash, LMS username tizimi, sessiyani majburiy bekor qilish |
| **Ma'lumotlar Bazasi** | [PostgreSQL 16](https://www.postgresql.org) | Tranzaksion ACID xavfsizligi, Composite FK cheklovlari |
| **ORM & Migratsiyalar** | [Drizzle ORM 0.45](https://orm.drizzle.team) | Zero-overhead tiplashtirilgan SQL migratsiyalari |
| **Dizayn & UI** | [Tailwind CSS v4](https://tailwindcss.com) + Lucide | Zamonaviy va moslashuvchan korporativ interfeys |
| **Test Tizimi** | Node Test Runner (`tsx --test`) + Playwright | 238 ta unit/integratsion test va 17 ta E2E test |
| **Deploy & OS** | Ubuntu 24.04 LTS, Nginx, PM2, Node 24 | Standalone production build |

---

## 🚀 Mahalliy Ishga Tushirish (Local Setup)

### 1. Talablar
- **Node.js:** `v24.x LTS` (tavsiya etiladi) yoki `v20.x`
- **PostgreSQL:** `16.x`
- **Git**

### 2. Klonlash va Bog'liqliklarni O'rnatish
```bash
git clone https://github.com/a-norimboyev/AssetAudit.git
cd AssetAudit
npm install
```

### 3. Muhit O'zgaruvchilarini Sozlash
Namuna fayldan `.env.local` nusxasini yarating:
```bash
cp .env.example .env.local
```
Fayl ichidagi qiymatlarni mahalliy muhitingizga moslang:
- `DATABASE_URL`: Mahalliy PostgreSQL ulanish manzili.
- `BETTER_AUTH_SECRET`: Kamida 32 belgili kriptografik kalit (`openssl rand -base64 32`).
- `BETTER_AUTH_URL`: `http://localhost:3000`

### 4. Ma'lumotlar Bazasi Migratsiyalari
```bash
# Drizzle SQL migratsiyalarini generatsiya qilish / yangilash
npm run db:generate
```

### 5. Ishga Tushirish
```bash
npm run dev
```
Brauzerda [http://localhost:3000](http://localhost:3000) manzilini oching.

---

## 🧪 Sinovlar va Sifat Nazorati (Testing)

Loyiha qat'iy test-driven va fail-closed prinsiplari asosida ishlab chiqilgan.

```bash
# 1. TypeScript tekshiruvi (0 errors)
npx tsc --noEmit

# 2. ESLint qoidalari tekshiruvi (0 errors, 0 warnings)
npm run lint

# 3. Unit va Integratsion xavfsizlik sinovlari (227+ tests)
npm test

# 4. Production Standalone build tekshiruvi
npm run build

# 5. Playwright E2E testlari
npm run test:e2e
```

---

## 📁 Kataloglar Tuzilishi

```text
AssetAudit/
├── .github/workflows/        # CI/CD avtomatlashtirish quvurlari
├── deploy/                   # Nginx va ishlab chiqarish konfiguratsiyalari
├── drizzle/                  # Idempotent Drizzle SQL migratsiyalari
├── public/                   # Statik resurslar va SVG fayllar
├── scripts/                  # Onboarding, super-admin bootstrap va diagnostika skriptlari
├── src/
│   ├── app/                  # Next.js App Router (admin, org, audit, qr, api)
│   ├── components/           # UI komponentlar (stat-card, sidebar, badges)
│   └── lib/
│       ├── actions/          # Xavfsiz Server Actions (audit, import, inventory)
│       ├── auth/             # Better Auth va RBAC avtorizatsiya qoidalari
│       ├── data/             # Drizzle ma'lumotlar qatlami (DAL)
│       ├── db/               # PostgreSQL sxemalari (auth, audit, inventory, locations)
│       ├── qr/               # Kriptografik QR token va vizual generatsiya
│       └── storage/          # Xavfsiz fayl va media saqlash dvigateli
└── tests-e2e/                # Playwright integratsion E2E sinovlari
```

---

## 🔒 Xavfsizlik Siyosati

Xavfsizlik choralari, zaifliklarni xabar qilish tartibi va ma'lumotlar daxlsizligi haqida batafsil ma'lumot olish uchun [SECURITY.md](SECURITY.md) faylini ko‘ring.

---

## 👥 Loyiha Hissadorlari

Loyiha arxitekturasi va kod standartlariga hissa qo‘shish qoidalari [CONTRIBUTING.md](CONTRIBUTING.md) faylida batafsil bayon etilgan.

---

© 2026 AssetAudit. Barcha huquqlar himoyalangan.
