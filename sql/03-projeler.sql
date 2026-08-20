-- ==========================================================================
-- NIZAM | Studio — Adım 2
-- Projeler, modüller ve sayfalar.
-- Supabase → SQL Editor'e yapıştır, bir kez çalıştır.
-- İki kez çalıştırsan da bozulmaz.
-- ==========================================================================

-- 0) Rolü güvenle okuyan yardımcı ------------------------------------------
--    Kuralların içinden profiles tablosuna bakmak sonsuz döngü yapar.
--    Bu fonksiyon o döngüyü kırar.

create or replace function public.rolum()
returns text
language sql
stable
security definer
set search_path = public
as $$
  select rol from public.profiles where id = auth.uid() and aktif
$$;

-- 1) Projeler --------------------------------------------------------------

create table if not exists public.projects (
  id          uuid primary key default gen_random_uuid(),
  firma       text        not null,
  renk        text        not null default 'metal',
  platform    text        not null default 'web'      check (platform in ('web','mobil','ikisi')),
  veri        text        not null default 'sifirdan' check (veri in ('sifirdan','mevcut','excel')),
  durum       text        not null default 'yeni'     check (durum in ('yeni','gelistiriliyor','kontrolde','tamamlandi')),
  repo        text,
  arsiv       boolean     not null default false,
  sira        int         not null default 0,
  olusturan   uuid        references auth.users (id) on delete set null,
  olusturuldu timestamptz not null default now()
);

-- 2) Modüller --------------------------------------------------------------
--    genel = true olan satır "Proje Geneli" kovasıdır, silinemez.

create table if not exists public.modules (
  id          uuid primary key default gen_random_uuid(),
  proje_id    uuid        not null references public.projects (id) on delete cascade,
  ad          text        not null,
  genel       boolean     not null default false,
  sira        int         not null default 0,
  olusturuldu timestamptz not null default now()
);

create index if not exists modules_proje_idx on public.modules (proje_id);

-- 3) Sayfalar --------------------------------------------------------------

create table if not exists public.pages (
  id          uuid primary key default gen_random_uuid(),
  modul_id    uuid        not null references public.modules (id) on delete cascade,
  ad          text        not null,
  ozet        text        not null default '',
  sira        int         not null default 0,
  olusturuldu timestamptz not null default now()
);

create index if not exists pages_modul_idx on public.pages (modul_id);

-- 4) Satır güvenliği -------------------------------------------------------
--    Okuma: Studio'ya kabul edilmiş herkes.
--    Yazma: yalnızca yönetici.

alter table public.projects enable row level security;
alter table public.modules  enable row level security;
alter table public.pages    enable row level security;

do $$
declare t text;
begin
  foreach t in array array['projects','modules','pages'] loop
    execute format('drop policy if exists "%s okuma" on public.%I', t, t);
    execute format('drop policy if exists "%s yazma" on public.%I', t, t);

    execute format(
      'create policy "%s okuma" on public.%I for select using (public.rolum() is not null)', t, t);

    execute format(
      'create policy "%s yazma" on public.%I for all
         using (public.rolum() = ''yonetici'')
         with check (public.rolum() = ''yonetici'')', t, t);
  end loop;
end $$;
