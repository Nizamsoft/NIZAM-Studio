-- ==========================================================================
-- NIZAM | Studio — Mesajlaşma
--
-- Kişiden kişiye mesaj. Herkes yalnız kendi yazışmalarını görür; okundu
-- bilgisini yalnız alıcı işaretleyebilir ve yalnız o alanı değiştirebilir.
--
-- Nasıl çalıştırılır: Supabase → SQL Editor → yapıştır → Run.
-- İki kez çalıştırmak zarar vermez.
-- ==========================================================================

-- 1) Tablo ----------------------------------------------------------------

create table if not exists public.messages (
  id          uuid primary key default gen_random_uuid(),
  gonderen    uuid        not null references auth.users (id) on delete cascade,
  alici       uuid        not null references auth.users (id) on delete cascade,
  metin       text        not null,
  okundu      timestamptz,
  olusturuldu timestamptz not null default now()
);

create index if not exists messages_ikili_idx on public.messages (gonderen, alici, olusturuldu);
create index if not exists messages_alici_idx on public.messages (alici, okundu);

-- 2) Satır güvenliği ------------------------------------------------------

alter table public.messages enable row level security;

drop policy if exists "mesajlarimi okurum"  on public.messages;
drop policy if exists "mesaj gonderirim"    on public.messages;
drop policy if exists "okundu isaretlerim"  on public.messages;
drop policy if exists "mesajimi silerim"    on public.messages;

--    Okuma: yalnız yazışmanın iki tarafı.
create policy "mesajlarimi okurum"
  on public.messages for select
  using (gonderen = auth.uid() or alici = auth.uid());

--    Yazma: yalnız kendi adına, kendine değil.
create policy "mesaj gonderirim"
  on public.messages for insert
  with check (gonderen = auth.uid() and alici <> auth.uid());

--    Güncelleme: yalnız alıcı (okundu işareti için).
create policy "okundu isaretlerim"
  on public.messages for update
  using (alici = auth.uid())
  with check (alici = auth.uid());

--    Silme: yalnız gönderen kendi mesajını siler.
create policy "mesajimi silerim"
  on public.messages for delete
  using (gonderen = auth.uid());

-- 3) Kilit ----------------------------------------------------------------
--    Alıcı satırı güncelleyebiliyor; yalnız "okundu" değişsin, mesajın
--    kendisi değişmesin.

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
    new.olusturuldu := old.olusturuldu;
  end if;
  return new;
end;
$$;

drop trigger if exists mesaj_kilidi on public.messages;
create trigger mesaj_kilidi
  before update on public.messages
  for each row execute function public.mesaj_kilit();

-- 4) Canlı yayın ----------------------------------------------------------
--    Mesaj gelince karşı taraf anında görsün.

do $$
begin
  begin
    alter publication supabase_realtime add table public.messages;
  exception when duplicate_object then null;
  end;
end $$;
