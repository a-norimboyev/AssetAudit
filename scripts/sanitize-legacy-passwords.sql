-- ==============================================================================
-- AssetAudit — Legacy Plaintext Password Sanitization SQL
-- Qo'llash: psql -d assetaudit -f scripts/sanitize-legacy-passwords.sql
-- ==============================================================================

BEGIN;

-- 1. Tekshirish
SELECT count(*) AS plaintext_passwords_count
FROM organizations
WHERE settings ? 'adminPassword';

-- 2. Xavfsiz tozalash (Faqat 'adminPassword' kalitini olib tashlaydi)
UPDATE organizations
SET settings = settings - 'adminPassword',
    updated_at = NOW()
WHERE settings ? 'adminPassword';

-- 3. Qayta tekshirish (0 bo'lishi shart)
SELECT count(*) AS remaining_plaintext_count
FROM organizations
WHERE settings ? 'adminPassword';

COMMIT;
