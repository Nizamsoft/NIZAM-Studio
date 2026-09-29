-- ============================================================================
-- 35 · Talepler — web sitesindeki Ön Analiz formundan gelenler
-- ============================================================================
-- Müşteri sitedeki formu doldurur → sitenin sunucusu talebi imzalı olarak
-- "talep-al" fonksiyonuna yollar → fonksiyon buraya yazar.
--
-- Tabloya tarayıcıdan EKLEME yapılamaz (ekleme kuralı bilerek yok). Yeni
-- satırı yalnız fonksiyon, sunucu anahtarıyla yazar. İçinde kişisel bilgi
-- olduğu için talepleri yalnız yönetici görür; geliştirici hiç görmez.
--
-- Supabase → SQL Editor'da bir kez çalıştır. İki kez çalıştırmak zarar vermez.
-- ============================================================================

-- 1) Tablo ------------------------------------------------------------------
--    id sitedeki başvurunun kimliğiyle aynı: aynı talep iki kez gelirse
--    ikinci kez yazılmaz.
--    bolumler: formdaki soru ve cevaplar, formun kendi başlıklarıyla
--    [{ baslik, sorular: [{ soru, cevap }] }]. Form değişse de Studio'yu
--    değiştirmek gerekmesin diye soruların adları da birlikte geliyor.

create table if not exists public.talepler (
  id          uuid primary key,
  kaynak      text        not null default 'web',
  durum       text        not null default 'yeni'
              check (durum in ('yeni','inceleniyor','gorusuluyor','onaylandi','reddedildi')),
  firma       text        not null default '',
  yetkili     text        not null default '',
  telefon     text        not null default '',
  eposta      text        not null default '',
  sektor      text        not null default '',
  ozet        text        not null default '',
  iletisim    text        not null default '',
  bolumler    jsonb       not null default '[]'::jsonb,
  proje_id    uuid        references public.projects (id) on delete set null,
  gonderildi  timestamptz not null default now(),
  olusturuldu timestamptz not null default now(),
  guncellendi timestamptz not null default now()
);

create index if not exists talepler_gonderildi_idx on public.talepler (gonderildi desc);

-- 2) Satır güvenliği --------------------------------------------------------
--    Okuma, değiştirme, silme: yalnız yönetici. Ekleme kuralı YOK.

alter table public.talepler enable row level security;

drop policy if exists "talep okuma"   on public.talepler;
drop policy if exists "talep degisim" on public.talepler;
drop policy if exists "talep silme"   on public.talepler;

create policy "talep okuma" on public.talepler for select
  using (public.rolum() = 'yonetici');

create policy "talep degisim" on public.talepler for update
  using (public.rolum() = 'yonetici')
  with check (public.rolum() = 'yonetici');

create policy "talep silme" on public.talepler for delete
  using (public.rolum() = 'yonetici');

-- 3) Değişince saat güncellensin -------------------------------------------

create or replace function public.talep_guncellendi()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.guncellendi := now();
  return new;
end;
$$;

drop trigger if exists talep_guncellendi on public.talepler;
create trigger talep_guncellendi before update on public.talepler
  for each row execute function public.talep_guncellendi();

-- 4) Canlı yayın ------------------------------------------------------------
--    Yeni talep gelince panel kendiliğinden tazelensin.

do $$
begin
  begin
    alter publication supabase_realtime add table public.talepler;
  exception when duplicate_object then null;
  end;
end $$;
