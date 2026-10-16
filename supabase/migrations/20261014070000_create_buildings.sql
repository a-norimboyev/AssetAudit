-- ============================================================================
-- MULKNAZORAT PLATFORMASI — TO'RTINCHI MIGRATSIYA
-- Versiya: 20261014070000
-- Jadval: buildings (Universitet binolari va korpuslari)
-- ============================================================================

-- 1. Avtomatik updated_at vaqtini yangilash funksiyasi
CREATE OR REPLACE FUNCTION public.set_buildings_updated_at()
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
-- Trigger funksiyasiga PUBLIC, anon va authenticated tomonidan bevosita EXECUTE berilmaydi
REVOKE ALL ON FUNCTION public.set_buildings_updated_at() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.set_buildings_updated_at() FROM anon;
REVOKE ALL ON FUNCTION public.set_buildings_updated_at() FROM authenticated;

-- 3. buildings jadvalini yaratish
CREATE TABLE public.buildings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    university_id UUID NOT NULL REFERENCES public.universities(id) ON DELETE RESTRICT,
    name VARCHAR(255) NOT NULL,
    code VARCHAR(50) NOT NULL,
    address TEXT,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT pg_catalog.now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT pg_catalog.now(),

    -- Bino nomi va kodi bo'sh yoki faqat probellardan iborat bo'lmasligi shart
    CONSTRAINT chk_buildings_name_not_empty CHECK (char_length(btrim(name)) > 0),
    CONSTRAINT chk_buildings_code_not_empty CHECK (char_length(btrim(code)) > 0),

    -- Multi-tenancy yaxlitligi:
    -- Kelajakda 'rooms' va 'floors' jadvallarida (building_id, university_id)
    -- kompozit foreign key orqali bino va xona/qavat aynan bir xil universitetga
    -- tegishli ekanini kafolatlash uchun zarur bo'lgan composite UNIQUE cheklovi
    CONSTRAINT uq_buildings_id_university UNIQUE (id, university_id)
);

-- 4. Indekslar
-- Unikallik: Bir universitet ichida bino kodi takrorlanmasligi kerak (registr va probellardan xoli)
CREATE UNIQUE INDEX idx_buildings_university_code_unique 
    ON public.buildings (university_id, upper(btrim(code)));

-- 5. O'zgarish vaqtini avtomatik yangilash triggeri
DROP TRIGGER IF EXISTS trg_buildings_updated_at ON public.buildings;
CREATE TRIGGER trg_buildings_updated_at
    BEFORE UPDATE ON public.buildings
    FOR EACH ROW
    EXECUTE FUNCTION public.set_buildings_updated_at();

-- 6. Row-Level Security (RLS) ni yoqish
ALTER TABLE public.buildings ENABLE ROW LEVEL SECURITY;

-- 7. PostgreSQL GRANT / REVOKE xavfsiz huquqlarini sozlash
-- PUBLIC, anon va authenticated rollaridan barcha to'g'ridan-to'g'ri huquqlar bekor qilinadi (Zero Trust).
REVOKE ALL ON TABLE public.buildings FROM PUBLIC, anon, authenticated;

-- ============================================================================
-- ARXITEKTURA VA KELAJAKDAGI REJALAR:
-- 1. Qavatlarni modellashtirish rejasi (floors jadvali):
--    Qavatlar soni buildings jadvalida sun'iy cheklov bilan saqlanmaydi.
--    Kelajakda alohida 'floors' jadvali yaratiladi:
--    - id UUID PRIMARY KEY,
--    - university_id UUID NOT NULL,
--    - building_id UUID NOT NULL,
--    - floor_number INT NOT NULL (yerosti: -2, -1; birinchi/lobby: 0 yoki 1; yuqori: 2, 3..),
--    - floor_name VARCHAR(50) (masalan: "Podval", "Sokol", "Lobby", "Mansarda"),
--    - FOREIGN KEY (building_id, university_id) REFERENCES buildings(id, university_id).
-- 2. Multi-Tenant yaxlitligi:
--    'uq_buildings_id_university' cheklovi kelgusi barcha xonalar va qavatlarning
--    boshqa universitet binolariga tasodifan birikib qolishini bazaviy darajada to'sadi.
-- 3. O'chirishdan himoya (ON DELETE RESTRICT):
--    Universitet o'chirilganda uning barcha binolari va ularga biriktirilgan
--    moddiy mulklar tarixi saqlanib qolishi shart.
-- 4. RLS Siyosatlari:
--    Hozircha ochiq RLS siyosati yo'q. Keyingi alohida migratsiyada:
--    - super_admin: barcha binolarni boshqarish
--    - university_admin: faqat o'z universitetidagi binolarni boshqarish
--    - inspector va registrar: faqat o'z universitetidagi binolarni ko'rish (SELECT)
--    siyosatlari kiritiladi.
-- ============================================================================
