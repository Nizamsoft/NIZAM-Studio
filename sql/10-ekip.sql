-- ==========================================================================
-- NIZAM | Studio — Ekip yönetimi
-- Supabase → SQL Editor'e yapıştır, bir kez çalıştır.
-- İki kez çalıştırsan da bozulmaz.
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
