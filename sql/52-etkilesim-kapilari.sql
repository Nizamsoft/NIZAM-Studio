-- ==========================================================================
-- NIZAM | Studio — 52 · Etkileşim kapıları (v0.348.0)
--
-- Proje sayfasındaki "Etkileşim geçmişi" müşterinin programından okunur:
-- programın veritabanında yalnız okuyan tek bir fonksiyon var
-- (ns_studio_ozet · ana programda göç 456, firmalarda ME-08 / GK-28).
-- O fonksiyon bir anahtar ister; anahtar BURADA durur.
--
--   proje_id · Studio projesi
--   adres    · programın Supabase adresi (https://xxxx.supabase.co)
--   anon     · programın yayınlanabilir (herkese açık) anahtarı
--   anahtar  · Studio okuma anahtarı (programda yalnız SHA-256 özeti durur)
--
-- Okuyan ve yazan yalnız yönetici. Anahtar sızarsa yalnız işlem başlıkları ve
-- hata kaydı okunabilir; programda hiçbir şey değiştirilemez. Değiştirmek için
-- programda özet güncellenir, buradaki satır yenilenir.
-- Tekrar çalıştırmak zararsız.
-- ==========================================================================

create table if not exists public.etkilesim_kapilari (
  proje_id    uuid primary key references public.projects (id) on delete cascade,
  adres       text not null check (adres ~ '^https://[a-z0-9-]+\.supabase\.co$'),
  anon        text not null check (length(anon) between 20 and 400),
  anahtar     text not null check (length(anahtar) between 32 and 200),
  guncellendi timestamptz not null default now()
);

alter table public.etkilesim_kapilari enable row level security;

drop policy if exists "etkilesim kapisi yonetici" on public.etkilesim_kapilari;
create policy "etkilesim kapisi yonetici" on public.etkilesim_kapilari for all
  using (public.rolum() = 'yonetici')
  with check (public.rolum() = 'yonetici');

revoke all on public.etkilesim_kapilari from anon;
grant select, insert, update, delete on public.etkilesim_kapilari to authenticated;

notify pgrst, 'reload schema';
