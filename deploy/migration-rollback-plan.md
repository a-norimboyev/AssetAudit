# AssetAudit (assetaudit.uz) — Migratsiya va Rollback / Recovery Rejasi
## Ishlab Chiqarish (Production) Ma'lumotlar Bazasi Migratsiyasi va Qaytarish Tartibi

Ushbu hujjat PostgreSQL bazasida Drizzle ORM migratsiyalarini (`0000` -> `0004`) xavfsiz qo'llash, yuzaga kelishi mumkin bo'lgan nosozliklarda ma'lumotlarni yo'qotmasdan avvalgi holatga qaytarish (Rollback) va favqulodda tiklash (Disaster Recovery) rejasini belgilaydi.

---

### 1. Migratsiyadan Oldingi Majburiy Qoidalar (Pre-Flight Checklist)

> [!IMPORTANT]
> Har qanday migratsiya buyrug'ini bajarishdan oldin **0-QADAM: Majburiy Zaxira** bajarilishi shart!

1. **Zaxira nusxa yaratish:**
   ```bash
   bash scripts/backup-db.sh
   ```
2. **Joriy migratsiyalar holatini tekshirish:**
   ```sql
   SELECT id, hash, created_at FROM __drizzle_migrations ORDER BY created_at DESC;
   ```
3. **Faol ulanishlar va blokirovkalar yo'qligini tekshirish:**
   ```sql
   SELECT pid, query, state, age(clock_timestamp(), query_start) 
   FROM pg_stat_activity 
   WHERE state != 'idle' AND pid <> pg_backend_pid();
   ```

---

### 2. Ishlab Chiqarish Muhitida Migratsiyani Qo'llash

Drizzle migratsiyalari avtomatik tranzaksiya (`BEGIN ... COMMIT`) ichida bajarilishi tavsiya etiladi.

```bash
# Production serverda:
NODE_ENV=production npx drizzle-kit migrate
```

Agar buyruq bajarilishi paytida xatolik yuz bersa, tranzaksiya o'z-o'zidan `ROLLBACK` bo'ladi va baza buzilmaydi.

---

### 3. Teskari Qaytarish (Rollback) SQL Skriptlari

Agar migratsiya muvaffaqiyatli o'tgandan so'ng kutilmagan dasturiy xatolik aniqlansa, quyidagi teskari SQL buyruqlari orqali bosqichma-bosqich qaytariladi:

#### 3.1. 0004 Migratsiyasini Qaytarish (LMS Login va Parol):
```sql
BEGIN;

-- 1. Yaratilgan indekslarni o'chirish
DROP INDEX IF EXISTS "user_username_lower_idx";
DROP INDEX IF EXISTS "user_username_idx";

-- 2. Qo'shilgan ustunlarni xavfsiz o'chirish
ALTER TABLE "user" DROP COLUMN IF EXISTS "display_username";
ALTER TABLE "user" DROP COLUMN IF EXISTS "username";

-- 3. Drizzle migratsiyalar jurnalidan yozuvni o'chirish
DELETE FROM __drizzle_migrations WHERE hash LIKE '%0004%';

COMMIT;
```

#### 3.2. 0003 Migratsiyasini Qaytarish (Inventarizatsiya va Audit Ierarxiyasi):
```sql
BEGIN;

-- 1. Bog'liq audit va inventar jadvallarini teskari ketma-ketlikda o'chirish
DROP TABLE IF EXISTS "discrepancies" CASCADE;
DROP TABLE IF EXISTS "audit_scans" CASCADE;
DROP TABLE IF EXISTS "audit_cycles" CASCADE;
DROP TABLE IF EXISTS "item_discrepancies" CASCADE;
DROP TABLE IF EXISTS "items" CASCADE;
DROP TABLE IF EXISTS "rooms" CASCADE;
DROP TABLE IF EXISTS "floors" CASCADE;
DROP TABLE IF EXISTS "buildings" CASCADE;
DROP TABLE IF EXISTS "categories" CASCADE;

-- 2. Drizzle migratsiyalar jurnalidan yozuvni o'chirish
DELETE FROM __drizzle_migrations WHERE hash LIKE '%0003%';

COMMIT;
```

#### 3.3. 0002 Migratsiyasini Qaytarish (Multi-Tenant Tashkilotlar):
```sql
BEGIN;

DROP TABLE IF EXISTS "user_profiles" CASCADE;
DROP TABLE IF EXISTS "organizations" CASCADE;

DELETE FROM __drizzle_migrations WHERE hash LIKE '%0002%';

COMMIT;
```

---

### 4. Favqulodda Tiklash (Disaster Recovery — DR)

Agar migratsiya paytida baza butunligiga tuzatib bo'lmas zarar yetsa:

1. **Next.js xizmatini vaqtincha to'xtatish:**
   ```bash
   sudo systemctl stop assetaudit
   ```

2. **Eng oxirgi toza zaxirani tiklash:**
   ```bash
   # Masalan: /var/backups/assetaudit/postgres/db_assetaudit_production_YYYYMMDD_HHMMSS.dump
   LATEST_BACKUP=$(ls -t /var/backups/assetaudit/postgres/*.dump | head -n 1)

   dropdb -h 127.0.0.1 -U postgres assetaudit_production
   createdb -h 127.0.0.1 -U postgres assetaudit_production
   pg_restore -h 127.0.0.1 -U postgres -d assetaudit_production --no-owner "${LATEST_BACKUP}"
   ```

3. **Ilova xizmatini qayta ishga tushirish va tekshirish:**
   ```bash
   sudo systemctl start assetaudit
   curl -I http://127.0.0.1:3000/api/health
   ```
