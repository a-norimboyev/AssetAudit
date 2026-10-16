-- ============================================================================
-- MULKNAZORAT PLATFORMASI — BIRINCHI MIGRATSIYA
-- Jadval: universities (Universitetlar va tashkilotlar reyestri)
-- ============================================================================

-- 1. Avtomatik updated_at vaqtini yangilash funksiyasi
-- SECURITY INVOKER va qat'iy search_path = '' bilan xavfsiz holatga keltirilgan
CREATE OR REPLACE FUNCTION public.set_universities_updated_at()
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

-- 2. Trigger funksiyasiga PUBLIC va anon tomonidan bevosita murojaatni cheklash
REVOKE ALL ON FUNCTION public.set_universities_updated_at() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.set_universities_updated_at() FROM anon;
GRANT EXECUTE ON FUNCTION public.set_universities_updated_at() TO authenticated, service_role;

-- 3. universities jadvalini yaratish
CREATE TABLE IF NOT EXISTS public.universities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    code VARCHAR(50) NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT pg_catalog.now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT pg_catalog.now(),

    -- Cheklovlar (Constraints)
    CONSTRAINT chk_universities_name_not_empty CHECK (char_length(trim(name)) > 0),
    CONSTRAINT chk_universities_code_not_empty CHECK (char_length(trim(code)) > 0)
);

-- 4. Universitet kodining yagonalik indeksi (katta-kichik harflar sezgirligisiz)
CREATE UNIQUE INDEX IF NOT EXISTS idx_universities_code_unique 
    ON public.universities (upper(trim(code)));

-- 5. O'zgarish vaqtini avtomatik yangilash triggeri
DROP TRIGGER IF EXISTS trg_universities_updated_at ON public.universities;
CREATE TRIGGER trg_universities_updated_at
    BEFORE UPDATE ON public.universities
    FOR EACH ROW
    EXECUTE FUNCTION public.set_universities_updated_at();

-- 6. Row-Level Security (RLS) ni yoqish
ALTER TABLE public.universities ENABLE ROW LEVEL SECURITY;

-- 7. PostgreSQL GRANT / REVOKE xavfsiz huquqlarini sozlash
-- anon va authenticated rollaridan barcha to'g'ridan-to'g'ri huquqlar bekor qilinadi.
REVOKE ALL ON TABLE public.universities FROM anon, authenticated;

-- IZOH:
-- Hozircha anon va authenticated rollari uchun hech qanday RLS siyosati (POLICY) qo'shilmadi.
-- RLS yoqilganligi va huquqlar bekor qilinganligi sababli barcha o'qish/yozish so'rovlari bloklanadi.
-- Keyinchalik 'profiles' va rollar tizimi yaratilgach, Super Admin va Universitet xodimlari uchun
-- aniq RLS siyosatlari alohida migratsiyada joriy etiladi.
