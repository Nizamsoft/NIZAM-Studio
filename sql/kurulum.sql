-- ==========================================================================
-- NIZAM | Studio — TEK SEFERLİK KURULUM
--
-- Supabase → SQL Editor → yeni sorgu → hepsini yapıştır → Run.
-- Kaç kez çalıştırırsan çalıştır bozulmaz, veri silinmez.
--
-- Kurduğu tablolar:
--   profiles     — kullanıcı adı, rolü, aktifliği
--   projects     — müşteri projeleri
--   modules      — proje modülleri (+ Proje Geneli kovası)
--   pages        — modül sayfaları
--   tasks        — görevler (NS-101, NS-102 …)
--   task_events  — görev hareket geçmişi
-- Ayrıca: satır güvenliği kuralları ve geliştirici korumaları.
-- ==========================================================================


-- ##########################################################################
-- BÖLÜM 1 — KULLANICILAR
-- ##########################################################################

-- 1) Kullanıcı profilleri -------------------------------------------------
--    Şifreler Supabase'in kendi auth tablosunda durur, buraya girmez.
--    Burada sadece "kim, ne rolde, aktif mi" bilgisi tutulur.

create table if not exists public.profiles (
  id          uuid primary key references auth.users (id) on delete cascade,
  ad          text        not null default '',
  rol         text        not null default 'gelistirici'
              check (rol in ('yonetici', 'gelistirici')),
  aktif       boolean     not null default true,
  olusturuldu timestamptz not null default now()
);

-- 2) Satır güvenliği ------------------------------------------------------
--    Açık olmazsa herkes herkesin satırını okur. Açık.

alter table public.profiles enable row level security;

drop policy if exists "kendi profilini okur" on public.profiles;
create policy "kendi profilini okur"
  on public.profiles for select
  using (id = auth.uid());

-- Not: Rolü ve aktifliği yalnızca yönetici, Supabase panelinden değiştirir.
-- Bu yüzden bilerek update/insert/delete kuralı yazılmadı — kimse kendi
-- rolünü yönetici yapamaz.

-- 3) Yeni kullanıcı eklenince profili kendiliğinden oluşsun ---------------
--    Panelden "Add user" dediğinde bu tetikleyici çalışır.

create or replace function public.yeni_kullanici()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, ad, rol)
  values (
    new.id,
    coalesce(nullif(new.raw_user_meta_data ->> 'ad', ''), split_part(new.email, '@', 1)),
    coalesce(nullif(new.raw_user_meta_data ->> 'rol', ''), 'gelistirici')
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists yeni_kullanici_olusunca on auth.users;
create trigger yeni_kullanici_olusunca
  after insert on auth.users
  for each row execute function public.yeni_kullanici();

-- 4) Zaten var olan kullanıcılar için profil tamamla ----------------------

insert into public.profiles (id, ad)
select u.id, split_part(u.email, '@', 1)
from auth.users u
where not exists (select 1 from public.profiles p where p.id = u.id);

-- ##########################################################################
-- BÖLÜM 2 — PROJELER, MODÜLLER, SAYFALAR
-- ##########################################################################
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

-- ##########################################################################
-- BÖLÜM 3 — GÖREVLER
-- ##########################################################################
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
