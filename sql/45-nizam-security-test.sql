-- ============================================================================
-- 45 · Nizam Security — Test Ortamı (2. aşama)
-- ============================================================================
-- Eski güvenlik tablolarından (guvenlik_*) TAMAMEN BAĞIMSIZ.
--
-- Proje başına tek satır: ayrı Supabase TEST projesinin bilgileri.
--   test_url / test_ref / test_anahtar : test projesi (yalnız publishable/anon
--                                        anahtar; service_role ASLA tutulmaz)
--   uretim_ref                         : bağlanırken karşılaştırılan production
--   kullanicilar                       : sentetik test hesapları (rol, e-posta,
--                                        rastgele şifre, Auth kimliği)
--   veri_sql                           : Claude'un yazdığı sentetik veri SQL'i
--   kontrol                            : son durum kontrolünün sonucu
--
-- Test hesaplarının şifreleri burada durur: yalnız yönetici okuyabilir.
-- Supabase → SQL Editor → yapıştır → Run. İki kez çalıştırmak zarar vermez.
-- ============================================================================

create table if not exists public.security_test_ortamlari (
  proje_id        uuid primary key references public.projects (id) on delete cascade,
  test_url        text,
  test_ref        text,
  test_anahtar    text,
  uretim_ref      text,
  kullanicilar    jsonb not null default '[]'::jsonb,
  kurulum_tarihi  timestamptz,
  veri_sql        text,
  veri_tarihi     timestamptz,
  kontrol         jsonb,
  kontrol_tarihi  timestamptz,
  olusturuldu     timestamptz not null default now(),
  guncellendi     timestamptz not null default now(),
  -- Kayıt seviyesinde de kilit: test projesi production olamaz.
  constraint security_test_ayri check (test_ref is null or uretim_ref is null or test_ref <> uretim_ref)
);

alter table public.security_test_ortamlari enable row level security;

drop policy if exists "security test okuma" on public.security_test_ortamlari;
drop policy if exists "security test yazma" on public.security_test_ortamlari;
create policy "security test okuma" on public.security_test_ortamlari for select
  using (public.rolum() = 'yonetici');
create policy "security test yazma" on public.security_test_ortamlari for all
  using (public.rolum() = 'yonetici')
  with check (public.rolum() = 'yonetici');

-- Doğrulama (isteğe bağlı):
--   select tablename, rowsecurity from pg_tables where tablename = 'security_test_ortamlari';
