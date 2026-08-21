-- ==========================================================================
-- NIZAM | Studio — Firma logosu ve renk paleti
--
-- ÖNCE Supabase → Storage → New bucket → ad: logolar
--      Public bucket KAPALI kalsın (müşteri logoları gizli durur).
-- SONRA bu dosyayı SQL Editor'e yapıştır ve çalıştır.
-- İki kez çalıştırsan da bozulmaz.
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
