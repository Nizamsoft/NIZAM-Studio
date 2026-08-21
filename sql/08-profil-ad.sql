-- ==========================================================================
-- NIZAM | Studio — Kullanıcı kendi adını değiştirebilsin
-- Supabase → SQL Editor'e yapıştır, bir kez çalıştır.
-- İki kez çalıştırsan da bozulmaz.
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
