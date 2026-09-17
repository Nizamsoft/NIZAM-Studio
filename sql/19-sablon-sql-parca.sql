-- ==========================================================================
-- NIZAM | Studio — Şablon SQL metni: üç parça
-- Supabase → SQL Editor'e yapıştır, bir kez çalıştır.
--
-- Birleşik kurulum SQL'i (şablon deposunun 5-veritabani/3-birlesik/
-- klasöründeki dosya) artık 20 bin satırın üzerinde — tek blok halinde
-- Claude Code sohbetine sığmıyor. Template deposunun kendi Claude oturumu
-- bunu üç parçaya bölüp veriyor; Studio da üç ayrı kolonda tutuyor.
--
-- `metin` daha önce NOT NULL'du (tek parçaydı); artık parçalardan biri
-- diğerlerinden önce kaydedilebileceği için üçü de boş bırakılabilir hale
-- getiriliyor.
-- ==========================================================================

alter table public.sablon_sql_metinleri
  alter column metin drop not null,
  add column if not exists metin2 text,
  add column if not exists metin3 text;

-- ==========================================================================
-- BİTTİ
-- Uygulamada dene: Ayarlar → Templateler → (bir template) → kurulum
-- sihirbazı → SQL adımı → üç parçayı sırayla yapıştır, her birini
-- ayrı ayrı kaydet.
-- ==========================================================================
