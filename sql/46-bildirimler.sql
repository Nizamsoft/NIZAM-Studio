-- ==========================================================================
-- NIZAM | Studio — Mesaj bildirimleri (Web Push)
--
-- Studio kapalıyken gelen mesaj telefona bildirim olarak düşsün diye.
--   • push_abonelik : hangi cihaz kime ait (bildirimin gideceği adres)
--   • push_anahtar  : bildirim imza anahtarı — fonksiyon ilk çağrıda
--                     kendisi üretir; kimse okuyamaz (yalnız sunucu)
--   • messages.bildirildi : aynı mesajın bildirimi iki kez gitmesin
--
-- Nasıl çalıştırılır: Supabase → SQL Editor → yapıştır → Run.
-- İki kez çalıştırmak zarar vermez.
-- Sonra: supabase/functions/bildirim-gonder fonksiyonunu kur.
-- ==========================================================================

-- 1) Cihaz abonelikleri ---------------------------------------------------

create table if not exists public.push_abonelik (
  endpoint    text primary key,
  kullanici   uuid        not null references auth.users (id) on delete cascade,
  p256dh      text        not null,
  auth        text        not null,
  cihaz       text        not null default '',
  olusturuldu timestamptz not null default now()
);

create index if not exists push_abonelik_kullanici_idx on public.push_abonelik (kullanici);

alter table public.push_abonelik enable row level security;

drop policy if exists "aboneligimi gorurum" on public.push_abonelik;
create policy "aboneligimi gorurum"
  on public.push_abonelik for select
  using (kullanici = auth.uid());

drop policy if exists "aboneligimi silerim" on public.push_abonelik;
create policy "aboneligimi silerim"
  on public.push_abonelik for delete
  using (kullanici = auth.uid());

-- Ekleme doğrudan değil, bu fonksiyonla: aynı telefonda hesap değişince
-- cihaz eski hesaptan alınıp yenisine geçsin (yoksa eski kişinin
-- mesajları bu telefona düşmeye devam ederdi).
create or replace function public.push_abone_ol(
  p_endpoint text, p_p256dh text, p_auth text, p_cihaz text default '')
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then raise exception 'Oturum yok.'; end if;
  if p_endpoint !~ '^https://' or length(p_endpoint) > 1000 then
    raise exception 'Geçersiz adres.';
  end if;
  insert into public.push_abonelik (endpoint, kullanici, p256dh, auth, cihaz)
  values (p_endpoint, auth.uid(), p_p256dh, p_auth, left(coalesce(p_cihaz, ''), 120))
  on conflict (endpoint) do update
    set kullanici = excluded.kullanici,
        p256dh    = excluded.p256dh,
        auth      = excluded.auth,
        cihaz     = excluded.cihaz,
        olusturuldu = now();
end;
$$;

revoke all on function public.push_abone_ol(text, text, text, text) from public, anon;
grant execute on function public.push_abone_ol(text, text, text, text) to authenticated;

-- 2) İmza anahtarı (yalnız sunucu) ----------------------------------------

create table if not exists public.push_anahtar (
  id          int primary key default 1 check (id = 1),
  ozel        jsonb       not null,
  genel       text        not null,
  olusturuldu timestamptz not null default now()
);

alter table public.push_anahtar enable row level security;
-- Bilerek hiç kural yok: tarayıcıdan okunamaz, yalnız fonksiyon erişir.

-- 3) Mesaja "bildirildi" işareti ------------------------------------------

alter table public.messages
  add column if not exists bildirildi timestamptz;
