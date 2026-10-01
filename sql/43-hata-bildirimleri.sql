-- ============================================================================
-- 43 · Hata Bildirimleri — müşteri programlarından gelen hata raporları
-- ============================================================================
-- Müşterinin kullandığı programda bir "Hata bildir" formu vardır. Kullanıcı
-- hatayı yazıp gönderince, programın TARAYICISI bunu "hata-al" Edge
-- Function'ına yollar; fonksiyon service_role ile buraya yazar.
--
-- Tüm programlar AYNI sabit adres + sabit erişim kodunu kullanır (tek kurulum).
-- Hangi projeden geldiğini program kendi Studio proje UUID'sini göndererek
-- söyler; fonksiyon bu UUID gerçek bir projeyle eşleşirse kabul eder.
--
-- Tabloya tarayıcıdan EKLEME yapılamaz (ekleme kuralı bilerek yok). Yeni satırı
-- yalnız fonksiyon yazar. İçinde kullanıcı iletişimi olabileceği için
-- bildirimleri yalnız yönetici görür; geliştirici hiç görmez.
--
-- Supabase → SQL Editor → yapıştır → Run. İki kez çalıştırmak zarar vermez.
-- ============================================================================

-- 1) Tablo ------------------------------------------------------------------
--    id programın ürettiği kimlik: aynı bildirim iki kez gelirse (çevrimdışı
--    tekrar gönderimi) ikinci kez yazılmaz.
--    proje_ad: gönderildiği andaki proje adının kopyası — proje sonradan
--    silinse bile bildirim hangi projeden geldiğini söyleyebilsin.

create table if not exists public.hata_bildirimleri (
  id          uuid primary key,
  proje_id    uuid        references public.projects (id) on delete set null,
  proje_ad    text        not null default '',
  durum       text        not null default 'yeni'
              check (durum in ('yeni','inceleniyor','cozuldu','yoksayildi')),
  mesaj       text        not null default '',
  ekran       text        not null default '',
  surum       text        not null default '',
  iletisim    text        not null default '',
  tarayici    text        not null default '',
  gonderildi  timestamptz not null default now(),
  olusturuldu timestamptz not null default now(),
  guncellendi timestamptz not null default now()
);

create index if not exists hata_bildirimleri_gonderildi_idx
  on public.hata_bildirimleri (gonderildi desc);
create index if not exists hata_bildirimleri_proje_idx
  on public.hata_bildirimleri (proje_id);

-- 2) Satır güvenliği --------------------------------------------------------
--    Okuma, değiştirme, silme: yalnız yönetici. Ekleme kuralı YOK.

alter table public.hata_bildirimleri enable row level security;

drop policy if exists "hata okuma"   on public.hata_bildirimleri;
drop policy if exists "hata degisim" on public.hata_bildirimleri;
drop policy if exists "hata silme"   on public.hata_bildirimleri;

create policy "hata okuma" on public.hata_bildirimleri for select
  using (public.rolum() = 'yonetici');

create policy "hata degisim" on public.hata_bildirimleri for update
  using (public.rolum() = 'yonetici')
  with check (public.rolum() = 'yonetici');

create policy "hata silme" on public.hata_bildirimleri for delete
  using (public.rolum() = 'yonetici');

-- 3) Değişince saat güncellensin -------------------------------------------

create or replace function public.hata_guncellendi()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.guncellendi := now();
  return new;
end;
$$;

drop trigger if exists hata_guncellendi on public.hata_bildirimleri;
create trigger hata_guncellendi before update on public.hata_bildirimleri
  for each row execute function public.hata_guncellendi();

-- 4) Canlı yayın ------------------------------------------------------------
--    Yeni bildirim gelince panel kendiliğinden tazelensin.

do $$
begin
  begin
    alter publication supabase_realtime add table public.hata_bildirimleri;
  exception when duplicate_object then null;
  end;
end $$;
