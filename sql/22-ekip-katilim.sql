-- ==========================================================================
-- NIZAM | Studio — Ekibe katılım tarihi ve kurucu işareti
--
-- katilim = kişinin ekibe katıldığı gün (yönetici elle seçer)
-- kurucu  = ekibin kurucusu; katılım tarihi yok, kartta "Kurucu" yazar
--
-- Nasıl çalıştırılır: Supabase → SQL Editor → yapıştır → Run.
-- İki kez çalıştırmak zarar vermez.
-- ==========================================================================

alter table public.profiles
  add column if not exists katilim date,
  add column if not exists kurucu  boolean not null default false;

-- Tarihi olmayanlarda hesabın açıldığı gün başlangıç kabul ediliyor.
update public.profiles
   set katilim = olusturuldu::date
 where katilim is null;
