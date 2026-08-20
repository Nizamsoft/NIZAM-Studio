-- ==========================================================================
-- NIZAM | Studio — Adım 3
-- Görevler, durumlar, atama ve hareket geçmişi.
-- Supabase → SQL Editor'e yapıştır, bir kez çalıştır.
-- İki kez çalıştırsan da bozulmaz.
-- ==========================================================================

-- 1) Görev numarası sayacı — NS-101, NS-102 … -----------------------------

create sequence if not exists public.gorev_no_seq start 101;

-- 2) Görevler --------------------------------------------------------------
--    Görev sayfaya bağlanır; olmazsa modüle, o da olmazsa doğrudan projeye.
--    Bu yüzden sayfa_id ve modul_id boş olabilir, proje_id olamaz.

create table if not exists public.tasks (
  id          uuid primary key default gen_random_uuid(),
  no          int         not null default nextval('public.gorev_no_seq') unique,
  proje_id    uuid        not null references public.projects (id) on delete cascade,
  modul_id    uuid        references public.modules (id) on delete set null,
  sayfa_id    uuid        references public.pages (id)   on delete set null,
  baslik      text        not null,
  aciklama    text        not null default '',
  durum       text        not null default 'yapilacak'
              check (durum in ('yapilacak','gelistiriliyor','kontrolde','tamamlandi')),
  oncelik     text        not null default 'normal' check (oncelik in ('normal','acil')),
  atanan      uuid        references auth.users (id) on delete set null,
  commit_sha  text,
  olusturan   uuid        references auth.users (id) on delete set null,
  olusturuldu timestamptz not null default now(),
  guncellendi timestamptz not null default now()
);

create index if not exists tasks_proje_idx  on public.tasks (proje_id);
create index if not exists tasks_sayfa_idx  on public.tasks (sayfa_id);
create index if not exists tasks_atanan_idx on public.tasks (atanan);

-- 3) Hareket geçmişi -------------------------------------------------------
--    Kim ne zaman ne yaptı. Revize notu da burada durur.

create table if not exists public.task_events (
  id          uuid primary key default gen_random_uuid(),
  gorev_id    uuid        not null references public.tasks (id) on delete cascade,
  tip         text        not null,
  notu        text        not null default '',
  kim         uuid        references auth.users (id) on delete set null,
  olusturuldu timestamptz not null default now()
);

create index if not exists task_events_gorev_idx on public.task_events (gorev_id);

-- 4) Geliştirici korumaları ------------------------------------------------
--    Geliştirici kendi görevini yalnızca ileri taşıyabilir; kendini
--    başka projeye atayamaz, "Tamamlandı" diyemez, önceliği değiştiremez.

create or replace function public.gorev_kilit()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if public.rolum() = 'yonetici' then
    new.guncellendi := now();
    return new;
  end if;

  if old.atanan is distinct from auth.uid() then
    raise exception 'Bu görev sana atanmamış.';
  end if;

  if new.durum not in ('gelistiriliyor','kontrolde') then
    raise exception 'Bu durumu yalnızca yönetici verebilir.';
  end if;

  /* Geliştirici sadece durumu ve commit etiketini değiştirebilir */
  new.no        := old.no;
  new.proje_id  := old.proje_id;
  new.modul_id  := old.modul_id;
  new.sayfa_id  := old.sayfa_id;
  new.baslik    := old.baslik;
  new.aciklama  := old.aciklama;
  new.oncelik   := old.oncelik;
  new.atanan    := old.atanan;
  new.olusturan := old.olusturan;
  new.guncellendi := now();

  return new;
end;
$$;

drop trigger if exists gorev_kilit_tetik on public.tasks;
create trigger gorev_kilit_tetik
  before update on public.tasks
  for each row execute function public.gorev_kilit();

-- 5) Satır güvenliği -------------------------------------------------------

alter table public.tasks       enable row level security;
alter table public.task_events enable row level security;

drop policy if exists "gorev okuma"   on public.tasks;
drop policy if exists "gorev ekleme"  on public.tasks;
drop policy if exists "gorev degisim" on public.tasks;
drop policy if exists "gorev silme"   on public.tasks;

create policy "gorev okuma" on public.tasks for select
  using (public.rolum() = 'yonetici' or atanan = auth.uid());

create policy "gorev ekleme" on public.tasks for insert
  with check (public.rolum() = 'yonetici');

create policy "gorev degisim" on public.tasks for update
  using (public.rolum() = 'yonetici' or atanan = auth.uid())
  with check (public.rolum() = 'yonetici' or atanan = auth.uid());

create policy "gorev silme" on public.tasks for delete
  using (public.rolum() = 'yonetici');

drop policy if exists "hareket okuma" on public.task_events;
drop policy if exists "hareket ekleme" on public.task_events;

create policy "hareket okuma" on public.task_events for select
  using (exists (select 1 from public.tasks t
                 where t.id = gorev_id
                   and (public.rolum() = 'yonetici' or t.atanan = auth.uid())));

create policy "hareket ekleme" on public.task_events for insert
  with check (exists (select 1 from public.tasks t
                      where t.id = gorev_id
                        and (public.rolum() = 'yonetici' or t.atanan = auth.uid())));

-- 6) Proje ağacını daralt --------------------------------------------------
--    Geliştirici artık yalnızca görev aldığı projeleri, o projelerin
--    modüllerini ve sayfalarını görür. Yönetici hepsini görür.

drop policy if exists "projects okuma" on public.projects;
create policy "projects okuma" on public.projects for select
  using (
    public.rolum() = 'yonetici'
    or exists (select 1 from public.tasks t where t.proje_id = projects.id and t.atanan = auth.uid())
  );

drop policy if exists "modules okuma" on public.modules;
create policy "modules okuma" on public.modules for select
  using (
    public.rolum() = 'yonetici'
    or exists (select 1 from public.tasks t where t.proje_id = modules.proje_id and t.atanan = auth.uid())
  );

drop policy if exists "pages okuma" on public.pages;
create policy "pages okuma" on public.pages for select
  using (
    public.rolum() = 'yonetici'
    or exists (select 1 from public.tasks t
               join public.modules m on m.id = pages.modul_id
               where t.proje_id = m.proje_id and t.atanan = auth.uid())
  );

-- 7) Yönetici ekibi görebilsin --------------------------------------------
--    Görev atarken kişi listesi gerekiyor.

drop policy if exists "yonetici tum profilleri okur" on public.profiles;
create policy "yonetici tum profilleri okur" on public.profiles for select
  using (public.rolum() = 'yonetici');
