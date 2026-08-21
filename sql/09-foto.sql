-- ==========================================================================
-- NIZAM | Studio — Profil fotoğrafı
-- ÖNCE Supabase → Storage → New bucket → ad: avatarlar → Public açık → Save
-- SONRA bu dosyayı SQL Editor'e yapıştır ve çalıştır.
-- İki kez çalıştırsan da bozulmaz.
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
