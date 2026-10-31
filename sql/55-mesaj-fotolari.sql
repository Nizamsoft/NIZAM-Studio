-- ==========================================================================
-- NIZAM | Studio — Mesajlarda fotoğraf (3 gün sonra silinir)
--
-- Ne yapar:
--   1) messages tablosuna `fotolar` sütunu ekler (dosya yollarının listesi).
--   2) "mesaj-fotolari" adında kapalı bir fotoğraf kovası açar
--      (dosya başına en çok 3 MB, yalnız resim).
--   3) Kova kuralları: fotoğrafı yalnız yazışmanın iki tarafı görür;
--      yükleyen yalnız kendi klasörüne yükler; iki taraf da silebilir
--      (3 gün dolunca uygulama temizliyor).
--
-- Dosya yolu: <gonderen-id>/<alici-id>/<zaman>-<sira>.webp
--
-- Nasıl çalıştırılır: Supabase → SQL Editor → yapıştır → Run.
-- İki kez çalıştırmak zarar vermez.
-- ==========================================================================

-- 1) Sütun ----------------------------------------------------------------

alter table public.messages
  add column if not exists fotolar jsonb not null default '[]'::jsonb;

-- Alıcı yalnız "okundu"yu değiştirebilsin; fotoğraf listesi de kilitli.
create or replace function public.mesaj_kilit()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is not null then
    new.id          := old.id;
    new.gonderen    := old.gonderen;
    new.alici       := old.alici;
    new.metin       := old.metin;
    new.fotolar     := old.fotolar;
    new.olusturuldu := old.olusturuldu;
  end if;
  return new;
end;
$$;

-- 2) Kova -----------------------------------------------------------------

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('mesaj-fotolari', 'mesaj-fotolari', false, 3145728,
        array['image/webp', 'image/jpeg', 'image/png', 'image/gif', 'image/heic'])
on conflict (id) do update
  set public = false,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

-- 3) Kova kuralları -------------------------------------------------------
--    Yolun ilk iki klasörü gönderen ve alıcı. Kişi ikisinden biriyse görür.

drop policy if exists "mesaj fotosu okuma"   on storage.objects;
drop policy if exists "mesaj fotosu yukleme" on storage.objects;
drop policy if exists "mesaj fotosu silme"   on storage.objects;

create policy "mesaj fotosu okuma" on storage.objects for select
  using (bucket_id = 'mesaj-fotolari'
         and auth.uid()::text in ((storage.foldername(name))[1], (storage.foldername(name))[2]));

create policy "mesaj fotosu yukleme" on storage.objects for insert
  with check (bucket_id = 'mesaj-fotolari'
              and (storage.foldername(name))[1] = auth.uid()::text);

create policy "mesaj fotosu silme" on storage.objects for delete
  using (bucket_id = 'mesaj-fotolari'
         and auth.uid()::text in ((storage.foldername(name))[1], (storage.foldername(name))[2]));
