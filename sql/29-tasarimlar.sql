-- ==========================================================================
-- NIZAM | Studio — Hazır tasarım görselleri
--
-- ÖNCE Supabase → Storage → New bucket → ad: tasarimlar
--      Public bucket AÇIK olsun (bunlar müşteri verisi değil, uygulamanın
--      kendi tanıtım kareleri; imzalı adres beklemeden açılsınlar).
-- SONRA bu dosyayı SQL Editor'e yapıştır ve çalıştır.
-- İki kez çalıştırsan da bozulmaz.
--
-- Yeni tablo yok: dosyanın adı tasarım yönünün anahtarı (marka.webp,
-- minimal.webp …). Studio kovayı listeleyip haritaya çeviriyor.
-- ==========================================================================

-- Kova kuralları -----------------------------------------------------------
--   Okuma: herkes (kova public).
--   Yazma / değiştirme / silme: yalnızca yönetici.

drop policy if exists "tasarim okuma"    on storage.objects;
drop policy if exists "tasarim yukleme"  on storage.objects;
drop policy if exists "tasarim guncelle" on storage.objects;
drop policy if exists "tasarim silme"    on storage.objects;

create policy "tasarim okuma" on storage.objects for select
  using (bucket_id = 'tasarimlar');

create policy "tasarim yukleme" on storage.objects for insert
  with check (bucket_id = 'tasarimlar' and public.rolum() = 'yonetici');

create policy "tasarim guncelle" on storage.objects for update
  using (bucket_id = 'tasarimlar' and public.rolum() = 'yonetici');

create policy "tasarim silme" on storage.objects for delete
  using (bucket_id = 'tasarimlar' and public.rolum() = 'yonetici');
