-- ============================================================================
-- MULKNAZORAT PLATFORMASI — UCHINCHI MIGRATSIYA
-- Versiya: 20261014053613
-- Maqsad: profiles jadvaliga 'registrar' (ro'yxatga oluvchi) rolini qo'shish
-- va rol-universitet bog'liqligi CHECK constraintlarini yangilash.
-- ============================================================================

-- 1. Mavjud rol tekshiruvi cheklovini bekor qilish va 4 ta rol bilan yangilash
ALTER TABLE public.profiles 
    DROP CONSTRAINT IF EXISTS chk_profiles_role_valid;

ALTER TABLE public.profiles 
    ADD CONSTRAINT chk_profiles_role_valid 
    CHECK (role IN ('super_admin', 'university_admin', 'inspector', 'registrar'));

-- 2. Rol va universitet bog'liqligi cheklovini yangilash:
--    - super_admin: platforma boshqaruvchisi, university_id NULL bo'lishi shart.
--    - university_admin, inspector, registrar: faqat o'z universitetiga tegishli,
--      university_id majburiy (NULL bo'lishi mumkin emas).
ALTER TABLE public.profiles 
    DROP CONSTRAINT IF EXISTS chk_profiles_role_university;

ALTER TABLE public.profiles 
    ADD CONSTRAINT chk_profiles_role_university 
    CHECK (
        (role = 'super_admin' AND university_id IS NULL) OR
        (role IN ('university_admin', 'inspector', 'registrar') AND university_id IS NOT NULL)
    );

-- ============================================================================
-- ARXITEKTURA VA VAKOLATLAR IZOHI:
-- 1. 'registrar' roli vazifalari:
--    - Yangi inventarlarni mustaqil ro'yxatga olish (darhol rasmiy bazaga kiritiladi).
--    - Faqat o'z universitetiga biriktirilgan (university_id IS NOT NULL).
--    - Cheklovlar: Boshqa universitetga inventar qo'sha olmaydi, joylashuvini
--      o'zgartira olmaydi, inventarni o'chira olmaydi, rasm yuklay olmaydi va
--      inventarizatsiya audit natijalarini tasdiqlay olmaydi.
-- 2. Ushbu vakolatlar kelgusi bosqichlarda RLS (Row-Level Security) siyosatlari
--    va backend biznes-mantiqi darajasida qat'iy tatbiq etiladi.
-- ============================================================================
