-- ============================================================================
-- 40 · NIZAM Standart — Canonical geçiş · MIGRATION ÖNCESİ SNAPSHOT
-- ============================================================================
-- Migration Phase 40 — yalnızca snapshot (geri dönüş kopyası).
--
-- AMAÇ: 41 numaralı taşıma BAŞARISIZ olsa bile migration öncesi verinin
-- bağımsız, eksiksiz ve geri yüklenebilir bir kopyası elimizde kalsın.
-- Bu yüzden 40 AYRI çalıştırılır ve COMMIT edilir; 41'den önce koşulur.
--
-- NE YAPAR:
--   - standards tablosunun TÜM satırlarını ve TÜM kolonlarını (to_jsonb(s.*)),
--   - task_standards tablosunun TÜM satırlarını ve TÜM kolonlarını,
--   `standart_gecmisi` içine tek bir snapshot satırı olarak yazar.
--
-- NE YAPMAZ:
--   - Hiçbir satırı değiştirmez/silmez (yalnız okur + geçmişe yazar).
--   - standards / task_standards RLS'ine dokunmaz.
--   - Taşıma, benzersizlik kısıtı, canonical UPDATE/INSERT YOK (o 41'de).
--
-- IDEMPOTENCY: etiket 'standart-canonical-v1' deterministik kimliktir.
--   Snapshot zaten varsa ikinci çalıştırma yeni kopya OLUŞTURMAZ, mevcut
--   snapshot'ı KORUR, hata vermez (WHERE NOT EXISTS).
--
-- NOT (geri yükleme bütünlüğü): 40, 39'dan sonra çalıştığı için standards'ta
--   yeni canonical kolonları da vardır ama henüz NULL/default'tur (41 daha
--   çalışmadı). to_jsonb(s.*) bu hâli birebir saklar; yani snapshot tam
--   olarak "41 öncesi" durumdur ve rollback için eksiksizdir.
--
-- RLS: standart_gecmisi'ne yazma yalnız yöneticiye açıktır (bkz. sql/39).
-- Supabase → SQL Editor → yapıştır → Run. İki kez çalıştırmak güvenlidir.
-- ============================================================================

begin;

insert into public.standart_gecmisi (etiket, standards_veri, task_standards_veri, aciklama)
select
  'standart-canonical-v1',
  coalesce((select jsonb_agg(to_jsonb(s.*) order by s.id) from public.standards s),      '[]'::jsonb),
  coalesce((select jsonb_agg(to_jsonb(t.*) order by t.gorev_id, t.standart_id)
            from public.task_standards t), '[]'::jsonb),
  'Faz 41 (canonical taşıma) öncesi tam snapshot'
where not exists (
  select 1 from public.standart_gecmisi where etiket = 'standart-canonical-v1'
);

commit;

-- ============================================================================
-- DOĞRULAMA (çalıştırınca gözle kontrol et — snapshot sayıları kaynakla eşleşmeli):
--
--   select
--     (select count(*) from public.standards)                                   as canli_standart,
--     (select jsonb_array_length(standards_veri)      from public.standart_gecmisi
--        where etiket='standart-canonical-v1')                                   as snapshot_standart,
--     (select count(*) from public.task_standards)                              as canli_bag,
--     (select jsonb_array_length(task_standards_veri) from public.standart_gecmisi
--        where etiket='standart-canonical-v1')                                   as snapshot_bag,
--     (select count(*) from public.standart_gecmisi
--        where etiket='standart-canonical-v1')                                   as snapshot_adedi;  -- 1 olmalı
-- ============================================================================
-- BİTTİ — Phase 40 (snapshot). Sıradaki: 41 (taşıma) — ayrı ve onaylı gelecek.
-- ============================================================================
