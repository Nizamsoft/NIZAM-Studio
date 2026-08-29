-- ==========================================================================
-- NIZAM | Studio — Adım 4
-- Nizam Standartları ve görevlere bağlanmaları.
-- Supabase → SQL Editor'e yapıştır, bir kez çalıştır.
-- İki kez çalıştırsan da bozulmaz.
-- ==========================================================================

-- 1) Standartlar -----------------------------------------------------------
--    Her standart yazılı bir tariftir. Bir göreve bağlanınca tarifi
--    promptun içine kendiliğinden girer — aynı şeyi her seferinde yazmazsın.

create table if not exists public.standards (
  id          uuid primary key default gen_random_uuid(),
  ad          text        not null unique,
  grup        text        not null default 'Arayüz',
  ozet        text        not null default '',
  tarif       text        not null default '',
  sira        int         not null default 0,
  aktif       boolean     not null default true,
  olusturuldu timestamptz not null default now()
);

-- 2) Görev ↔ standart bağı -------------------------------------------------

create table if not exists public.task_standards (
  gorev_id    uuid not null references public.tasks (id)     on delete cascade,
  standart_id uuid not null references public.standards (id) on delete cascade,
  primary key (gorev_id, standart_id)
);

create index if not exists task_standards_gorev_idx on public.task_standards (gorev_id);

-- 3) Satır güvenliği -------------------------------------------------------

alter table public.standards      enable row level security;
alter table public.task_standards enable row level security;

drop policy if exists "standart okuma" on public.standards;
drop policy if exists "standart yazma" on public.standards;

create policy "standart okuma" on public.standards for select
  using (public.rolum() is not null);

create policy "standart yazma" on public.standards for all
  using (public.rolum() = 'yonetici')
  with check (public.rolum() = 'yonetici');

drop policy if exists "gorev standart okuma" on public.task_standards;
drop policy if exists "gorev standart yazma" on public.task_standards;

create policy "gorev standart okuma" on public.task_standards for select
  using (exists (select 1 from public.tasks t
                 where t.id = gorev_id
                   and (public.rolum() = 'yonetici' or t.atanan = auth.uid())));

create policy "gorev standart yazma" on public.task_standards for all
  using (public.rolum() = 'yonetici')
  with check (public.rolum() = 'yonetici');

-- 4) Hazır standartlar -----------------------------------------------------
--    Tohum artık burada değil: standartlar iki eksenli yapıya geçti
--    (grup + alan) ve hepsi `sql/17-standart.sql` içinde duruyor.
--    Bu dosya yalnızca tabloları ve erişim kurallarını kurar.
--    Sıradaki adım: 17-standart.sql'i çalıştır.
