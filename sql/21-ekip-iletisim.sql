-- ==========================================================================
-- NIZAM | Studio — Ekip üyesine e-posta ve telefon
--
-- Ekip düzenleme ekranında e-posta ve telefon alanları var. E-posta zaten
-- Supabase'in kendi kullanıcı tablosunda duruyor ama oradan okunamıyor
-- (tarayıcıya kapalı), o yüzden profilin içine de yazılıyor.
--
-- Nasıl çalıştırılır: Supabase → SQL Editor → bu dosyayı yapıştır → Run.
-- İki kez çalıştırmak zarar vermez.
-- ==========================================================================

-- 1) İki yeni alan ---------------------------------------------------------

alter table public.profiles
  add column if not exists eposta  text,
  add column if not exists telefon text;

-- 2) Mevcut kullanıcıların e-postasını doldur ------------------------------
--    auth.users yalnızca sunucudan okunur; SQL Editor sunucu tarafıdır.

update public.profiles p
   set eposta = u.email
  from auth.users u
 where u.id = p.id
   and coalesce(p.eposta, '') = '';

-- 3) Bitti -----------------------------------------------------------------
--    Not: e-posta ve şifre değişikliği "kullanici-guncelle" adlı Edge
--    Function ile yapılıyor; onu da Supabase → Edge Functions'dan kur.
