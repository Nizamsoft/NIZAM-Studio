-- ============================================================================
-- 44 · Nizam Security — Erişim Kuralları (ilk aşama)
-- ============================================================================
-- Eski güvenlik tablolarından (guvenlik_*) TAMAMEN BAĞIMSIZ. Onlara dokunmaz,
-- onlardan okumaz.
--
-- Proje başına tek satır:
--   yapi  = müşterinin veritabanının GERÇEK yapısı (SQL Editor çıktısı:
--           tablo, kolon, tip, PK, ilişki, RLS). Satır verisi YOK.
--   model = olması İSTENEN erişim kuralları (Claude ile görüşmeden çıkan JSON).
--
-- Yalnız yönetici okur ve yazar.
-- Supabase → SQL Editor → yapıştır → Run. İki kez çalıştırmak zarar vermez.
-- ============================================================================

create table if not exists public.security_modelleri (
  proje_id      uuid primary key references public.projects (id) on delete cascade,
  yapi          jsonb,
  yapi_tarihi   timestamptz,
  model         jsonb,
  model_tarihi  timestamptz,
  olusturuldu   timestamptz not null default now(),
  guncellendi   timestamptz not null default now()
);

alter table public.security_modelleri enable row level security;

drop policy if exists "security model okuma" on public.security_modelleri;
drop policy if exists "security model yazma" on public.security_modelleri;
create policy "security model okuma" on public.security_modelleri for select
  using (public.rolum() = 'yonetici');
create policy "security model yazma" on public.security_modelleri for all
  using (public.rolum() = 'yonetici')
  with check (public.rolum() = 'yonetici');

-- Doğrulama (isteğe bağlı):
--   select tablename, rowsecurity from pg_tables where tablename = 'security_modelleri';
