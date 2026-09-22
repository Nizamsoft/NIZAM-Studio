-- ==========================================================================
-- NIZAM | Studio — Paketler
-- Supabase → SQL Editor'e yapıştır, bir kez çalıştır.
-- İki kez çalıştırsan da bozulmaz.
--
-- Paket = yeni projenin hangi yol haritasından geçeceği.
-- "akis" hangi kodlu akışın kullanılacağını söyler; şimdilik iki tane var:
--   'ozel'     → Kurulum ve yapı → Beta ve geliştirme   (normal proje)
--   'muhasebe' → Değişim → Test ve Güncelle             (şablon kopyası)
-- ==========================================================================

create table if not exists public.packages (
  id          uuid primary key default gen_random_uuid(),
  anahtar     text        not null unique,
  ad          text        not null,
  aciklama    text,
  akis        text        not null default 'ozel',
  sira        int         not null default 0,
  aktif       boolean     not null default true,
  olusturuldu timestamptz not null default now()
);

alter table public.packages enable row level security;

drop policy if exists "paket okuma" on public.packages;
drop policy if exists "paket yazma" on public.packages;

create policy "paket okuma" on public.packages for select
  using (public.rolum() is not null);

create policy "paket yazma" on public.packages for all
  using (public.rolum() = 'yonetici')
  with check (public.rolum() = 'yonetici');

-- Başlangıçtaki iki paket. Varsa dokunmuyor, yoksa ekliyor.
insert into public.packages (anahtar, ad, aciklama, akis, sira)
values
  ('ozel', 'Özel Proje',
   'Sıfırdan yazılan, müşteriye özel program.', 'ozel', 1),
  ('muhasebe-1', 'Muhasebe-1',
   'Hazır muhasebe programının bir müşteriye kurulumu.', 'muhasebe', 2)
on conflict (anahtar) do nothing;
