-- ==========================================================================
-- NIZAM | Studio — Sektörler ve yeni proje alanları
-- Supabase → SQL Editor'e yapıştır, bir kez çalıştır.
-- İki kez çalıştırsan da bozulmaz.
-- ==========================================================================

-- 1) Projeye yeni alanlar --------------------------------------------------

alter table public.projects
  add column if not exists sektor    text,
  add column if not exists yetkili   text,
  add column if not exists telefon   text,
  add column if not exists eposta    text,
  add column if not exists dil       text default 'tr',
  add column if not exists para      text default 'TRY',
  add column if not exists baslangic date,
  add column if not exists teslim    date;

-- 2) Sektör listesi --------------------------------------------------------
--    moduller = o sektör seçilince önden işaretlenecek modül adları.

create table if not exists public.sectors (
  id          uuid primary key default gen_random_uuid(),
  ad          text        not null unique,
  moduller    text[]      not null default '{}',
  sira        int         not null default 0,
  aktif       boolean     not null default true,
  olusturuldu timestamptz not null default now()
);

alter table public.sectors enable row level security;

drop policy if exists "sektor okuma" on public.sectors;
drop policy if exists "sektor yazma" on public.sectors;

create policy "sektor okuma" on public.sectors for select
  using (public.rolum() is not null);

create policy "sektor yazma" on public.sectors for all
  using (public.rolum() = 'yonetici')
  with check (public.rolum() = 'yonetici');
