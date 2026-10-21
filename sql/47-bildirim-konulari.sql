-- ==========================================================================
-- NIZAM | Studio — Bildirim konuları (Mesajlar · Görevler · Hata bildirimleri)
--
-- Ayarlar › Bildirimler'de her konu ayrı açılıp kapanır. Kapatılan konu
-- listesi burada tutulur; sunucu kapalı konuya hiç bildirim göndermez.
-- Görev bildirimi aynı hareket için iki kez gitmesin diye task_events'e
-- "bildirildi" işareti eklenir.
--
-- Önce sql/46-bildirimler.sql çalışmış olmalı.
-- Nasıl çalıştırılır: Supabase → SQL Editor → yapıştır → Run.
-- İki kez çalıştırmak zarar vermez.
-- ==========================================================================

-- 1) Konu tercihleri ------------------------------------------------------
--    Satır yoksa her konu açık sayılır. kapali: {'mesaj','gorev','hata'}

create table if not exists public.bildirim_tercih (
  kullanici   uuid primary key default auth.uid()
              references auth.users (id) on delete cascade,
  kapali      text[]      not null default '{}',
  guncellendi timestamptz not null default now()
);

alter table public.bildirim_tercih enable row level security;

drop policy if exists "tercihimi okurum"     on public.bildirim_tercih;
drop policy if exists "tercihimi eklerim"    on public.bildirim_tercih;
drop policy if exists "tercihimi guncellerim" on public.bildirim_tercih;

create policy "tercihimi okurum"
  on public.bildirim_tercih for select
  using (kullanici = auth.uid());

create policy "tercihimi eklerim"
  on public.bildirim_tercih for insert
  with check (kullanici = auth.uid());

create policy "tercihimi guncellerim"
  on public.bildirim_tercih for update
  using (kullanici = auth.uid())
  with check (kullanici = auth.uid());

-- 2) Görev hareketine "bildirildi" işareti --------------------------------

alter table public.task_events
  add column if not exists bildirildi timestamptz;
