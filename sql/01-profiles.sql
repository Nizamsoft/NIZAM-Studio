-- ==========================================================================
-- NIZAM | Studio — Adım 1
-- Supabase → SQL Editor'e yapıştır, bir kez çalıştır.
-- İki kez çalıştırsan da bozulmaz.
-- ==========================================================================

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
