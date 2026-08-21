-- ==========================================================================
-- NIZAM | Studio — Toplu güncelleme (v0.11 → v0.15)
--
-- Beş ayrı dosya tek yerde. Hepsi bir arada, sırayla çalışır.
-- İki kez çalıştırsan da bozulmaz; zaten kurulmuş olanı bozmaz.
--
-- ÖNCE İKİ KOVA AÇ — Supabase → Storage → New bucket
--   1) avatarlar  → Public bucket AÇIK   (profil fotoğrafları)
--   2) logolar    → Public bucket KAPALI (müşteri logoları gizli durur)
--
-- SONRA bu dosyanın tamamını SQL Editor'e yapıştır ve Run'a bas.
-- ==========================================================================

-- ==========================================================================
-- KULLANICI KENDI ADINI DEĞIŞTIREBILSIN   (08-profil-ad.sql)
-- ==========================================================================
-- profiles tablosunda yalnızca "okuma" kuralı vardı; güncelleme kuralı yoktu.
-- Bu yüzden uygulama "kaydet" dediğinde Supabase hata vermiyor ama hiçbir
-- satıra dokunmuyordu — ad eskisi gibi kalıyordu.

drop policy if exists "kendi profilini gunceller" on public.profiles;
create policy "kendi profilini gunceller"
  on public.profiles for update
  using  (id = auth.uid())
  with check (id = auth.uid());

-- Rol ve aktiflik uygulamadan DEĞİŞTİRİLEMEZ.
-- auth.uid() yalnızca uygulamadan gelen isteklerde doludur; Supabase panelinden
-- ya da SQL Editor'den yapılan değişikliklerde boştur. Yani sen panelden rolü
-- yine değiştirebilirsin, kullanıcı kendi kendini yönetici yapamaz.

create or replace function public.profil_kilit()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is not null then
    new.id    := old.id;
    new.rol   := old.rol;
    new.aktif := old.aktif;
  end if;
  return new;
end;
$$;

drop trigger if exists profil_kilidi on public.profiles;
create trigger profil_kilidi
  before update on public.profiles
  for each row execute function public.profil_kilit();


-- ==========================================================================
-- PROFIL FOTOĞRAFI   (09-foto.sql)
-- ==========================================================================
-- 1) Fotoğrafın adresi profilde durur ---------------------------------------

alter table public.profiles
  add column if not exists foto text;

-- 2) Kova kuralları ---------------------------------------------------------
--    Okuma herkese açık (fotoğraflar zaten görünsün diye).
--    Yazma yalnızca kendi dosyana: dosya adı kendi kullanıcı kimliğin olmalı.

drop policy if exists "avatar okuma"    on storage.objects;
drop policy if exists "avatar yukleme"  on storage.objects;
drop policy if exists "avatar guncelle" on storage.objects;
drop policy if exists "avatar silme"    on storage.objects;

create policy "avatar okuma" on storage.objects for select
  using (bucket_id = 'avatarlar');

create policy "avatar yukleme" on storage.objects for insert
  with check (
    bucket_id = 'avatarlar'
    and split_part(name, '.', 1) = auth.uid()::text
  );

create policy "avatar guncelle" on storage.objects for update
  using (
    bucket_id = 'avatarlar'
    and split_part(name, '.', 1) = auth.uid()::text
  );

create policy "avatar silme" on storage.objects for delete
  using (
    bucket_id = 'avatarlar'
    and split_part(name, '.', 1) = auth.uid()::text
  );


-- ==========================================================================
-- EKIP YÖNETIMI   (10-ekip.sql)
-- ==========================================================================
-- 1) Yönetici tüm profilleri güncelleyebilsin -------------------------------
--    Okuma izni zaten 04-gorevler.sql'de verilmişti.

drop policy if exists "yonetici profilleri gunceller" on public.profiles;
create policy "yonetici profilleri gunceller"
  on public.profiles for update
  using  (public.rolum() = 'yonetici')
  with check (public.rolum() = 'yonetici');

-- 2) Kilidi yeniden yaz -----------------------------------------------------
--    Kural:
--      · Kimlik hiçbir koşulda değişmez.
--      · Geliştirici yalnızca kendi adını ve fotoğrafını değiştirir.
--      · Yönetici başkalarının rolünü ve aktifliğini değiştirebilir,
--        ama KENDİ rolüne ve aktifliğine dokunamaz — son yönetici kendini
--        geliştirici yapıp sistemi kilitleyemesin diye.
--      · auth.uid() boşsa (Supabase paneli, SQL Editor) hiçbir kısıt yok.

create or replace function public.profil_kilit()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then
    return new;
  end if;

  new.id := old.id;

  if public.rolum() = 'yonetici' then
    if old.id = auth.uid() then
      new.rol   := old.rol;
      new.aktif := old.aktif;
    end if;
  else
    new.rol   := old.rol;
    new.aktif := old.aktif;
  end if;

  return new;
end;
$$;

drop trigger if exists profil_kilidi on public.profiles;
create trigger profil_kilidi
  before update on public.profiles
  for each row execute function public.profil_kilit();


-- ==========================================================================
-- FIRMA LOGOSU VE RENK PALETI   (11-marka.sql)
-- ==========================================================================
-- 1) Projeye iki alan ------------------------------------------------------
--    logo  = kovadaki dosya yolu (adres değil; adres her seferinde üretilir)
--    palet = renkler ve yazı tipleri

alter table public.projects
  add column if not exists logo  text,
  add column if not exists palet jsonb;

-- 2) Kova kuralları --------------------------------------------------------
--    Okuma: giriş yapmış herkes (geliştirici de logoyu görmeli).
--    Yazma: yalnızca yönetici.
--    Kova private olduğu için okuma bile imzalı adres ister; dışarıdan
--    adres bilinse de açılmaz.

drop policy if exists "logo okuma"    on storage.objects;
drop policy if exists "logo yukleme"  on storage.objects;
drop policy if exists "logo guncelle" on storage.objects;
drop policy if exists "logo silme"    on storage.objects;

create policy "logo okuma" on storage.objects for select
  using (bucket_id = 'logolar' and public.rolum() is not null);

create policy "logo yukleme" on storage.objects for insert
  with check (bucket_id = 'logolar' and public.rolum() = 'yonetici');

create policy "logo guncelle" on storage.objects for update
  using (bucket_id = 'logolar' and public.rolum() = 'yonetici');

create policy "logo silme" on storage.objects for delete
  using (bucket_id = 'logolar' and public.rolum() = 'yonetici');


-- ==========================================================================
-- MODÜL ŞABLONLARI   (12-modul-sablon.sql)
-- ==========================================================================
create table if not exists public.module_templates (
  id          uuid primary key default gen_random_uuid(),
  ad          text        not null unique,
  sayfalar    text[]      not null default '{}',
  sira        int         not null default 0,
  aktif       boolean     not null default true,
  olusturuldu timestamptz not null default now()
);

alter table public.module_templates enable row level security;

drop policy if exists "sablon okuma" on public.module_templates;
drop policy if exists "sablon yazma" on public.module_templates;

create policy "sablon okuma" on public.module_templates for select
  using (public.rolum() is not null);

create policy "sablon yazma" on public.module_templates for all
  using (public.rolum() = 'yonetici')
  with check (public.rolum() = 'yonetici');

-- Hazır yedi modül. Zaten varsa dokunulmaz — kendi düzenlemen korunur.
insert into public.module_templates (ad, sayfalar, sira) values
('Stok', array['Ürün Listesi', 'Ürün Kartı', 'Stok Hareketleri', 'Depo Transferi', 'Sayım'], 1),
('Cari', array['Cari Listesi', 'Cari Kartı', 'Cari Hareketler', 'Bakiye Raporu'], 2),
('Fatura', array['Fatura Listesi', 'Fatura Oluştur', 'Fatura Detayı', 'İade', 'Tahsilat'], 3),
('Personel', array['Personel Listesi', 'Personel Kartı', 'İzin Takibi', 'Puantaj'], 4),
('Rapor', array['Genel Bakış', 'Satış Raporu', 'Stok Raporu', 'Dışa Aktarım'], 5),
('Sipariş', array['Sipariş Listesi', 'Sipariş Oluştur', 'Sipariş Detayı', 'Sevkiyat'], 6),
('Üretim', array['İş Emri Listesi', 'İş Emri Kartı', 'Reçete', 'Üretim Raporu'], 7)
on conflict (ad) do nothing;


-- ==========================================================================
-- BİTTİ
-- "Success. No rows returned" görüyorsan hepsi kuruldu.
-- Uygulamada dene: Ayarlar → Hesap → Fotoğraf · Ayarlar → Ekip ·
-- Ayarlar → Modül Şablonları · bir projede Marka bölümü.
-- ==========================================================================
