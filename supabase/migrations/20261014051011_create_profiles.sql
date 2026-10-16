-- ============================================================================
-- MULKNAZORAT PLATFORMASI — PROFILES MIGRATSIYASI
-- Versiya: 20261014051011
-- Jadval: profiles (Foydalanuvchilar profillari va rollar)
-- ============================================================================

-- 1. Avtomatik updated_at vaqtini yangilash funksiyasi
CREATE OR REPLACE FUNCTION public.set_profiles_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = ''
AS $$
BEGIN
    NEW.updated_at = pg_catalog.now();
    RETURN NEW;
END;
$$;

-- 2. Eng kam ruxsat prinsipi (Least Privilege):
-- Trigger funksiyasiga PUBLIC, anon va authenticated rollaridan bevosita EXECUTE huquqi bekor qilinadi.
-- Ortiqcha GRANT huquqlari berilmaydi.
REVOKE ALL ON FUNCTION public.set_profiles_updated_at() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.set_profiles_updated_at() FROM anon;
REVOKE ALL ON FUNCTION public.set_profiles_updated_at() FROM authenticated;

-- 3. profiles jadvalini yaratish
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE RESTRICT,
    university_id UUID REFERENCES public.universities(id) ON DELETE RESTRICT,
    role VARCHAR(30) NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT pg_catalog.now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT pg_catalog.now(),

    -- Faqat 3 ta aniq rol ruxsat etiladi
    CONSTRAINT chk_profiles_role_valid CHECK (
        role IN ('super_admin', 'university_admin', 'inspector')
    ),

    -- Ism bo'sh bo'lmasligi cheklovi
    CONSTRAINT chk_profiles_full_name_not_empty CHECK (
        char_length(trim(full_name)) > 0
    ),

    -- Rol va universitet bog'liqligi qat'iy qoidasi:
    -- super_admin bo'lsa, university_id NULL bo'lishi shart.
    -- university_admin yoki inspector bo'lsa, university_id majburiy (NULL bo'lolmaydi).
    CONSTRAINT chk_profiles_role_university CHECK (
        (role = 'super_admin' AND university_id IS NULL) OR
        (role IN ('university_admin', 'inspector') AND university_id IS NOT NULL)
    )
);

-- 4. Indekslar
-- Multi-tenancy: Universitet bo'yicha xodimlarni filtrlash va bog'lash uchun indeks
CREATE INDEX IF NOT EXISTS idx_profiles_university_id 
    ON public.profiles (university_id);

-- Eslatma: 'role' ustuni bo'yicha past kardinallik (atigi 3 ta qiymat) sababli
-- ortiqcha alohida indeks yaratilmadi.

-- 5. O'zgarish vaqtini avtomatik yangilash triggeri
DROP TRIGGER IF EXISTS trg_profiles_updated_at ON public.profiles;
CREATE TRIGGER trg_profiles_updated_at
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW
    EXECUTE FUNCTION public.set_profiles_updated_at();

-- 6. Row-Level Security (RLS) ni yoqish
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 7. PostgreSQL GRANT / REVOKE xavfsiz huquqlarini sozlash
-- anon va authenticated rollaridan barcha to'g'ridan-to'g'ri huquqlar bekor qilinadi (Zero Trust).
REVOKE ALL ON TABLE public.profiles FROM anon, authenticated;

-- ============================================================================
-- ARXITEKTURA VA XAVFSIZLIK E’TIBORLARI:
-- 1. O'chirish strategiyasi (ON DELETE RESTRICT):
--    Xodimning akkaunti va audit jurnallari (tekshiruv tarixi) tasodifan o'chib
--    ketmasligi uchun auth.users(id) va universities(id) bilan RESTRICT bog'lanishi qo'yildi.
-- 2. Deaktivatsiya (is_active = false):
--    Xodim ishdan ketganda jismonan o'chirilmaydi, balki is_active = false qilinadi.
--    Muhim: is_active = false Supabase Auth loginini o'z-o'zidan to'xtatmaydi,
--    shu sababli keyingi bosqichlarda barcha himoyalangan RLS va server amallarida
--    qat'iy 'profiles.is_active = true' sharti tekshiriladi.
-- 3. Ustunlarni o'zboshimchalik bilan o'zgartirishdan himoya:
--    Hozircha hech qanday ochiq RLS POLICY yo'q. Kelajakda foydalanuvchi o'zining
--    'role', 'university_id' yoki 'is_active' maydonlarini o'zgartira olmasligi
--    uchun faqat ishonchli Super Admin amallari orqali ruxsat beriladi.
-- ============================================================================
