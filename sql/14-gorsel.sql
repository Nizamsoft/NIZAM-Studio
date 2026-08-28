-- ==========================================================================
-- NIZAM | Studio — Görsel yuvaları
--
-- ÖNCE Supabase → Storage → New bucket → ad: gorseller
--      Public bucket KAPALI kalsın (müşteri görselleri gizli durur).
-- SONRA bu dosyayı SQL Editor'e yapıştır ve çalıştır.
-- İki kez çalıştırsan da bozulmaz.
--
-- Yeni sütun yok: yuvalar projenin `palet` alanında duruyor.
--   palet.gorseller = [{ no, ad, tarif, dosya, yol, boyut, tur }]
-- Dosyalar kovada proje klasöründe: <proje-id>/gorsel-1.jpg
-- ==========================================================================

-- Kova kuralları -----------------------------------------------------------
--   Okuma: giriş yapmış herkes (geliştirici de görseli görmeli).
--   Yazma: yalnızca yönetici.
--   Kova private olduğu için okuma bile imzalı adres ister; adres bir saat
--   geçerlidir. Dışarıdan yol bilinse de açılmaz.

drop policy if exists "gorsel okuma"    on storage.objects;
drop policy if exists "gorsel yukleme"  on storage.objects;
drop policy if exists "gorsel guncelle" on storage.objects;
drop policy if exists "gorsel silme"    on storage.objects;

create policy "gorsel okuma" on storage.objects for select
  using (bucket_id = 'gorseller' and public.rolum() is not null);

create policy "gorsel yukleme" on storage.objects for insert
  with check (bucket_id = 'gorseller' and public.rolum() = 'yonetici');

create policy "gorsel guncelle" on storage.objects for update
  using (bucket_id = 'gorseller' and public.rolum() = 'yonetici');

create policy "gorsel silme" on storage.objects for delete
  using (bucket_id = 'gorseller' and public.rolum() = 'yonetici');
