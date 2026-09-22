-- ==========================================================================
-- NIZAM | Studio — Pakete prompt tanımı
-- Supabase → SQL Editor'e yapıştır, bir kez çalıştır.
--
-- tanim = Claude'a giden promptlarda bu paketin nasıl anlatılacağı.
-- Cümlenin içine düz bir ad gibi giriyor:
--   "çalışan bir <tanim> var, birebir kopyalandı"
--   "Bu proje bir <tanim> şablonundan kopyalandı"
-- Bu yüzden ek almayan bir ad yazılmalı: "muhasebe programı", "stok takibi".
-- ==========================================================================

alter table public.packages
  add column if not exists tanim text;

update public.packages
   set tanim = 'muhasebe programı'
 where anahtar = 'muhasebe-1' and tanim is null;
