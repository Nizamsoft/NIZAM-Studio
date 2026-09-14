-- ==========================================================================
-- NIZAM | Studio — Şablon SQL metni
-- Supabase → SQL Editor'e yapıştır, bir kez çalıştır.
--
-- Şablon projelerin (ör. Muhasebe) kurulum SQL'i artık bir GitHub linkine
-- muhtaç değil — doğrudan metin olarak burada tutulabilir. Sebep: şablon
-- deposu private olabiliyor, o zaman link müşteri tarafında açılmıyor;
-- SQL'in kendisi burada durursa hem depo görünürlüğüne bağlı kalınmaz hem
-- de yönetici e-postası SQL'e otomatik yerleştirilip kopyalanabilir (bkz.
-- app.js: sablonSqlMetniHazirla, eylem sablon-sql-metin-kopyala).
--
-- palet (jsonb) sütununa konmuyor: o sütun her küçük işlemde okunup
-- yazılıyor, birkaç yüz KB'lık bir SQL metnini oraya koymak her adımı
-- yavaşlatır. Ayrı, kendi başına bir tabloda duruyor; palette yalnız
-- "var mı yok mu" bayrağı (cekirdek.sqlMetinVar) taşınıyor.
-- ==========================================================================

create table if not exists public.sablon_sql_metinleri (
  proje_id    uuid primary key references public.projects(id) on delete cascade,
  metin       text not null,
  guncelleme  timestamptz not null default now()
);

alter table public.sablon_sql_metinleri enable row level security;

drop policy if exists "sablon sql okuma" on public.sablon_sql_metinleri;
drop policy if exists "sablon sql yazma" on public.sablon_sql_metinleri;

create policy "sablon sql okuma" on public.sablon_sql_metinleri for select
  using (public.rolum() is not null);

create policy "sablon sql yazma" on public.sablon_sql_metinleri for all
  using (public.rolum() = 'yonetici')
  with check (public.rolum() = 'yonetici');

-- ==========================================================================
-- BİTTİ
-- Uygulamada dene: Ayarlar → Templateler → (bir template) → kurulum
-- sihirbazı → SQL adımı → "SQL metni" kutusuna yapıştır, Kaydet.
-- ==========================================================================
