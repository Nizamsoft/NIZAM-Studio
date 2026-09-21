-- ==========================================================================
-- NIZAM | Studio — Son görülme
--
-- Ekip kartındaki "son aktiflik" bugüne kadar kişinin en son GÖREV
-- hareketini gösteriyordu; uygulamayı açıp hiçbir şeye dokunmadıysa tarih
-- eski kalıyordu. Artık uygulamayı her açışta buraya zaman damgası
-- yazılıyor.
--
-- Nasıl çalıştırılır: Supabase → SQL Editor → yapıştır → Run.
-- İki kez çalıştırmak zarar vermez.
-- ==========================================================================

alter table public.profiles
  add column if not exists son_gorulme timestamptz;

-- Boş kalmasın: hesabın açıldığı an başlangıç kabul ediliyor.
update public.profiles
   set son_gorulme = olusturuldu
 where son_gorulme is null;
