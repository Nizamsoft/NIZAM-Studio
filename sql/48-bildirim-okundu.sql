-- ==========================================================================
-- NIZAM | Studio — Okundu bilgisi ve uygulama simgesindeki sayı
--
-- Simgedeki kırmızı sayı = okunmamış mesaj + okunmamış görev bildirimi +
-- (yöneticide) okunmamış yeni hata bildirimi. Zile ya da hataya bakınca düşer.
--
-- Zildeki "okundu" bilgisi eskiden yalnız o cihazda tutuluyordu; sunucu
-- bilemiyordu, telefonda okunan bilgisayarda okunmamış görünüyordu. Artık
-- burada: bildirim_okundu (kişi + okunan kaydın kimliği: görev hareketi ya
-- da hata bildirimi).
--
-- Önce sql/46 ve sql/47 çalışmış olmalı.
-- Nasıl çalıştırılır: Supabase → SQL Editor → yapıştır → Run.
-- İki kez çalıştırmak zarar vermez.
-- ==========================================================================

-- 1) Okunanlar ------------------------------------------------------------

create table if not exists public.bildirim_okundu (
  kullanici   uuid        not null default auth.uid()
              references auth.users (id) on delete cascade,
  kayit       uuid        not null,
  olusturuldu timestamptz not null default now(),
  primary key (kullanici, kayit)
);

alter table public.bildirim_okundu enable row level security;

drop policy if exists "okuduklarimi gorurum" on public.bildirim_okundu;
drop policy if exists "okudugumu yazarim"    on public.bildirim_okundu;

create policy "okuduklarimi gorurum"
  on public.bildirim_okundu for select
  using (kullanici = auth.uid());

create policy "okudugumu yazarim"
  on public.bildirim_okundu for insert
  with check (kullanici = auth.uid());

-- 2) Simgedeki sayı -------------------------------------------------------
--    Bildirim gönderilirken sunucu bu sayıyı alıcı için hesaplar.
--    Görev kuralı Studio'daki zil listesiyle aynı: son 30 gün, kendi
--    hareketin sayılmaz, "görev verildi" yalnız görevi alana, arşivdeki ve
--    çekirdek projelerin görevleri sayılmaz.

create or replace function public.rozet_sayisi(p_kisi uuid)
returns int
language sql
stable
security definer
set search_path = public
as $$
  select (
    (select count(*) from public.messages m
      where m.alici = p_kisi and m.okundu is null)
  + (select count(*) from public.task_events e
       join public.tasks t on t.id = e.gorev_id
       left join public.projects p on p.id = t.proje_id
      where e.olusturuldu > now() - interval '30 days'
        and e.kim is distinct from p_kisi
        and e.tip in ('olusturuldu','atandi','bitirdi','onaylandi','geri','baslandi')
        and (t.atanan = p_kisi
             or (t.olusturan = p_kisi and e.tip not in ('olusturuldu','atandi')))
        and (p.id is null
             or (coalesce(p.arsiv, false) = false
                 and coalesce(p.palet ->> 'cekirdek', '') <> 'true'))
        and not exists (select 1 from public.bildirim_okundu o
                         where o.kullanici = p_kisi and o.kayit = e.id))
  + (case when exists (select 1 from public.profiles
                        where id = p_kisi and rol = 'yonetici')
     then (select count(*) from public.hata_bildirimleri h
            where h.durum = 'yeni'
              and not exists (select 1 from public.bildirim_okundu o
                               where o.kullanici = p_kisi and o.kayit = h.id))
     else 0 end)
  )::int;
$$;

-- Yalnız sunucu çağırır (başkasının sayısını kimse soramasın).
revoke all on function public.rozet_sayisi(uuid) from public, anon, authenticated;
grant execute on function public.rozet_sayisi(uuid) to service_role;
