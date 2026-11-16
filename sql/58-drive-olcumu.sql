-- ==========================================================================
-- NIZAM | Studio — 58 · Google Drive doluluk ölçümü (v0.387.0)
--
-- nizam-yedek artık Drive doluluğunu 2 saatte bir (ve Studio'da "Şimdi ölç"
-- ile) ayrıca ölçüp bildiriyor. Bu ölçümler yedek_raporlari'na tur='drive'
-- olarak yazılır; `yedek` fonksiyonu her seferinde yalnız en sonuncuyu tutar.
--
-- Supabase → SQL Editor → yapıştır → Run. İki kez çalıştırmak zarar vermez.
-- ==========================================================================

alter table public.yedek_raporlari drop constraint if exists yedek_raporlari_tur_check;
alter table public.yedek_raporlari add constraint yedek_raporlari_tur_check
  check (tur in ('gece', 'deneme', 'elle', 'drive', 'drive-elle'));

notify pgrst, 'reload schema';
