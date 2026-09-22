-- ==========================================================================
-- NIZAM | Studio — Pakette varsayılan işareti
-- Supabase → SQL Editor'e yapıştır, bir kez çalıştır.
-- İki kez çalıştırsan da bozulmaz. (sql/26 çalıştırılmadıysa onu da kapatır.)
-- ==========================================================================

alter table public.packages
  add column if not exists tanim      text,
  add column if not exists varsayilan boolean not null default false;

-- Promptta bu paketin nasıl anlatılacağı.
update public.packages
   set tanim = 'Bu paket, çalışan bir muhasebe programının bir müşteriye kurulumunu kapsar.'
 where anahtar = 'muhasebe-1' and tanim is null;

-- Hiç varsayılan yoksa "Özel Proje" varsayılan olsun.
update public.packages
   set varsayilan = true
 where anahtar = 'ozel'
   and not exists (select 1 from public.packages where varsayilan);
