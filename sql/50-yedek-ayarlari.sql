-- ==========================================================================
-- NIZAM | Studio — 50 · Yedek ayarları (v0.337.0)
--
-- Hangi programın veritabanı her gece yedeklensin? Son Yedekleme penceresinin
-- "Ayarlar" sekmesi bu tabloyu yönetir; gece yedeği (nizam-yedek) listeyi
-- `yedek` fonksiyonundan okur. Bağlantı adresleri burada DURMAZ — yalnız
-- GitHub'ın gizli ayarlarında (DB_<KOD>).
--
--   kod      · gizli ayarın adı DB_<kod> (büyük harf, rakam, alt çizgi)
--   proje_id · Studio projesi (NIZAM Studio'nun kendisi için boş)
--   acik     · gece yedeklensin mi
--
-- Yazan yalnız `yedek` fonksiyonu (service_role); okuyan yönetici.
-- Tekrar çalıştırmak zararsız.
-- ==========================================================================

create table if not exists public.yedek_ayarlari (
  kod         text primary key check (kod ~ '^[A-Z0-9_]{2,40}$'),
  ad          text not null default '',
  proje_id    uuid references public.projects (id) on delete set null,
  acik        boolean not null default true,
  guncellendi timestamptz not null default now()
);

alter table public.yedek_ayarlari enable row level security;

drop policy if exists "yedek ayar okuma" on public.yedek_ayarlari;
create policy "yedek ayar okuma" on public.yedek_ayarlari for select
  using (public.rolum() = 'yonetici');

revoke all on public.yedek_ayarlari from anon;
grant select on public.yedek_ayarlari to authenticated;

-- Bugüne kadar nizam-yedek/projeler.json'da duran liste.
insert into public.yedek_ayarlari (kod, ad, proje_id, acik)
select x.kod, x.ad, (select id from public.projects where id = x.pid), true
  from (values
    ('YOGATUGI',     'Green Village Pilates — Ön Muhasebe', '4f2d6d1c-1ad1-490d-8ba3-87796a5172f3'::uuid),
    ('GKMUHASEBE',   'Güllüoğlu Kubban — GK Muhasebe',      null::uuid),
    ('MERKEZEFENDI', 'Merkez Efendi Köftecisi — Muhasebe',  '94b664ff-6a03-458c-957a-618a621b84f0'::uuid),
    ('STUDIO',       'NIZAM Studio (kendi verimiz)',        null::uuid)
  ) x(kod, ad, pid)
on conflict (kod) do nothing;

notify pgrst, 'reload schema';
