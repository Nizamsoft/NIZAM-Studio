-- ============================================================================
-- 33 · Görevin konusu: Genel · Bir proje hakkında · Nizam Studio
-- ============================================================================
-- Görev üç konudan biri hakkında olabiliyor. Proje görevlerinde zaten
-- proje_id dolu; ayrım gereken yer projesiz görevler: "Genel" mi, yoksa
-- Studio'nun kendisi hakkında mı.
--
-- Supabase → SQL Editor'da bir kez çalıştır.
-- ============================================================================

alter table public.tasks
  add column if not exists konu text not null default 'genel';

alter table public.tasks drop constraint if exists tasks_konu_check;
alter table public.tasks add constraint tasks_konu_check
  check (konu in ('genel', 'proje', 'studio'));

-- Proje görevleri geriye dönük işaretlensin.
update public.tasks set konu = 'proje' where proje_id is not null and konu <> 'proje';
