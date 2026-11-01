-- ==========================================================================
-- NIZAM | Studio — Ana programlar (şablon programlar)
--
-- Yeni firmalara uyarlanan ana programların listesi. Eskiden Studio'nun
-- kodunda tek bir adres sabit yazılıydı; artık Atölye › Şablonlar ›
-- "Ana program ekle" ile adres girilerek ekleniyor.
--
-- Studio her adresteki `surumler.json` dosyasını okuyor: ad, sürüm, depo
-- ve bağlı firmalar oradan geliyor. Bu tablo yalnız adresi ve (varsa)
-- programın Studio'daki projesini tutuyor.
--
-- Nasıl çalıştırılır: Supabase → SQL Editor → yapıştır → Run.
-- İki kez çalıştırmak zarar vermez.
-- ==========================================================================

create table if not exists public.ana_programlar (
  id          uuid primary key default gen_random_uuid(),
  site        text        not null unique,
  ad          text        not null default '',
  proje_id    uuid        references public.projects (id) on delete set null,
  olusturan   uuid        references auth.users (id) on delete set null default auth.uid(),
  olusturuldu timestamptz not null default now()
);

alter table public.ana_programlar enable row level security;

drop policy if exists "ana program okuma"    on public.ana_programlar;
drop policy if exists "ana program ekleme"   on public.ana_programlar;
drop policy if exists "ana program guncelle" on public.ana_programlar;
drop policy if exists "ana program silme"    on public.ana_programlar;

-- Okuma: giriş yapmış herkes. Yazma: yalnız yönetici.
create policy "ana program okuma" on public.ana_programlar for select
  using (public.rolum() is not null);
create policy "ana program ekleme" on public.ana_programlar for insert
  with check (public.rolum() = 'yonetici');
create policy "ana program guncelle" on public.ana_programlar for update
  using (public.rolum() = 'yonetici') with check (public.rolum() = 'yonetici');
create policy "ana program silme" on public.ana_programlar for delete
  using (public.rolum() = 'yonetici');

-- Bugüne kadar koddaki tek ana program: Muhasebe Modülü.
insert into public.ana_programlar (site, ad)
values ('https://nizamsoft.github.io/GULLUOGLUKUBBANKLON-GkMuhasebe/', 'Muhasebe Modülü')
on conflict (site) do nothing;

-- Canlı yayın: biri ana program ekleyince ötekilerde de görünsün.
do $$
begin
  begin
    alter publication supabase_realtime add table public.ana_programlar;
  exception when duplicate_object then null;
  end;
end $$;
