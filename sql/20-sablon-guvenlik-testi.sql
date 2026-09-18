-- ==========================================================================
-- NIZAM | Studio — Şablon güvenlik testi
-- Supabase → SQL Editor'e yapıştır, bir kez çalıştır.
--
-- Muhasebe şablonuna eklenen saldırı testi (5-veritabani/4-bakim/
-- saldiri-testi.sql) üç parça halinde geliyor — nedeni kurulum SQL'iyle
-- aynı: tek blok Claude Code sohbetine sığmıyor. Kurulum SQL'inden ayrı
-- üç kolonda tutuluyor çünkü ikisinin amacı farklı: biri kurulumun
-- kendisi, öbürü kurulum bittikten sonra istendiğinde çalıştırılan bir
-- test — karışmasınlar diye ayrı adlandırıldı.
-- ==========================================================================

alter table public.sablon_sql_metinleri
  add column if not exists guvenlik1 text,
  add column if not exists guvenlik2 text,
  add column if not exists guvenlik3 text;

-- ==========================================================================
-- BİTTİ
-- Uygulamada dene: Ayarlar → Templateler → (bir template) → kurulum
-- sihirbazı → Güvenlik adımı → üç parçayı sırayla yapıştır, her birini
-- ayrı ayrı kaydet.
-- ==========================================================================
