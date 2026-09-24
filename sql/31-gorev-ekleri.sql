-- ==========================================================================
-- NIZAM | Studio — Görev ekleri
--
-- ÖNCE Supabase → Storage → New bucket → ad: gorevler
--      Public bucket KAPALI kalsın (iş dosyaları dışarı açılmasın).
-- SONRA bu dosyayı SQL Editor'e yapıştır ve çalıştır.
-- İki kez çalıştırsan da bozulmaz.
--
-- Dosyanın kendisi kovada görev klasöründe: <gorev-id>/referans.png
-- Listesi görevin `ekler` sütununda: [{ ad, yol, boyut, tur }]
-- ==========================================================================

alter table public.tasks
  add column if not exists ekler jsonb not null default '[]'::jsonb;

-- Kova kuralları -----------------------------------------------------------
--   Okuma ve yazma: giriş yapmış herkes. Hangi görevin eki olduğu yola
--   gömülü; görev satırını göremeyen dosyayı da bulamaz.
--   Kova private olduğu için okuma bile imzalı adres ister.

drop policy if exists "gorev eki okuma"    on storage.objects;
drop policy if exists "gorev eki yukleme"  on storage.objects;
drop policy if exists "gorev eki guncelle" on storage.objects;
drop policy if exists "gorev eki silme"    on storage.objects;

create policy "gorev eki okuma" on storage.objects for select
  using (bucket_id = 'gorevler' and public.rolum() is not null);

create policy "gorev eki yukleme" on storage.objects for insert
  with check (bucket_id = 'gorevler' and public.rolum() is not null);

create policy "gorev eki guncelle" on storage.objects for update
  using (bucket_id = 'gorevler' and public.rolum() is not null);

create policy "gorev eki silme" on storage.objects for delete
  using (bucket_id = 'gorevler' and public.rolum() is not null);
