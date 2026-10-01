-- ============================================================================
-- 39 · NIZAM Standart — Canonical geçiş · YALNIZCA ŞEMA HAZIRLIĞI
-- ============================================================================
-- Migration Phase 39 — yalnızca şema hazırlığı.
--
-- Bu dosya 77 → 66 canonical taşımasına ZEMİN hazırlar; VERİ TAŞIMAZ,
-- mevcut satırları DEĞİŞTİRMEZ, benzersizlik kısıtı KURMAZ. Yalnız:
--   1) standards tablosuna additive (eklemeli) yeni kolonlar,
--   2) rollback/audit için standart_gecmisi snapshot tablosu + RLS.
--
-- Taşımanın kendisi (survivor UPDATE, task_standards re-point, legacy pasifleme,
-- unique(kanonik_id) ve partial unique(alan,ad)) sonraki dosyalarda yapılır:
--   40 = snapshot alma · 41 = taşıma · 42 = rollback.
--
-- GÜVENLİK/UYUMLULUK:
--   - Tüm kolonlar "add column if not exists" ile eklenir → iki kez çalışmak
--     zarar vermez, mevcut 77 kayıt bozulmaz.
--   - Kimlik/anlam alanları (kanonik_id, tip, kategori, aile) NULL kalır:
--     henüz taşınmamış (legacy) satır böylece ayırt edilir.
--   - standards ve task_standards'ın MEVCUT RLS politikalarına DOKUNULMAZ.
--
-- Supabase → SQL Editor → yapıştır → Run. İki kez çalıştırmak güvenlidir.
-- ============================================================================

-- 1) standards tablosuna additive canonical kolonları --------------------------
--    Mevcut kolonlar (id, ad, grup, alan, ozet, tarif, yerel, sira, aktif,
--    eklendi, olusturuldu) KORUNUR; hiçbirine dokunulmaz.

alter table public.standards add column if not exists kanonik_id      text;          -- canonical kimlik (ST-001…), taşımada dolar
alter table public.standards add column if not exists tip             text;          -- KURAL | VARSAYILAN | KOŞULLU
alter table public.standards add column if not exists kategori        text;          -- TECH | DATA | SECURITY | FORMAT | A11Y | PERF | UI
alter table public.standards add column if not exists aile            text;          -- APP_HEADER | LIST | … | NULL
alter table public.standards add column if not exists kosul           text    not null default '';
alter table public.standards add column if not exists istisna         text    not null default '';
alter table public.standards add column if not exists neden           text    not null default '';
alter table public.standards add column if not exists kapsam          text    not null default 'nizam';
alter table public.standards add column if not exists kaynak          text    not null default '';
alter table public.standards add column if not exists versiyon        int     not null default 1;
alter table public.standards add column if not exists a11y            boolean not null default false;
alter table public.standards add column if not exists eski_standartlar jsonb   not null default '[]'::jsonb;

-- 2) Snapshot / geçmiş tablosu ------------------------------------------------
--    Migration öncesi standards + task_standards'ın birebir kopyasını tutar.
--    Canonical sisteme FK ile BAĞLANMAZ; tek amacı rollback ve denetimdir.
--    Veri JSONB dizisi olarak saklanır → rollback'te birebir geri yüklenebilir.

create table if not exists public.standart_gecmisi (
  id                   uuid        primary key default gen_random_uuid(),
  alindi               timestamptz not null default now(),
  etiket               text        not null default '',   -- ör. 'faz-41-oncesi'
  standards_veri       jsonb       not null default '[]'::jsonb,  -- tüm standards satırları
  task_standards_veri  jsonb       not null default '[]'::jsonb,  -- tüm task_standards satırları
  aciklama             text        not null default ''
);

-- 3) Snapshot tablosu için RLS: yalnız yönetici -------------------------------
--    standards/task_standards RLS'ine DOKUNULMAZ; bu yalnız yeni tablo içindir.

alter table public.standart_gecmisi enable row level security;

drop policy if exists "gecmis okuma" on public.standart_gecmisi;
drop policy if exists "gecmis yazma" on public.standart_gecmisi;

create policy "gecmis okuma" on public.standart_gecmisi for select
  using (public.rolum() = 'yonetici');

create policy "gecmis yazma" on public.standart_gecmisi for all
  using (public.rolum() = 'yonetici')
  with check (public.rolum() = 'yonetici');

-- ============================================================================
-- BİTTİ — Phase 39 (şema hazırlığı)
-- Bu dosya hiçbir mevcut satırı değiştirmedi, veri taşımadı, benzersizlik
-- kısıtı kurmadı. Sıradaki: 40 (snapshot) — ayrı ve onaylı gelecek.
-- ============================================================================
