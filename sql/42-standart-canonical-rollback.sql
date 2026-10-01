-- ============================================================================
-- 42 · NIZAM Standart — Canonical ROLLBACK (41 öncesine dönüş)
-- ============================================================================
-- Migration Phase 42 — KONTROLLÜ GERİ ALMA. sql/40'ın aldığı
-- 'standart-canonical-v1' snapshot'ını TEK KAYNAK kabul eder ve standards +
-- task_standards'ı 41 ÖNCESİ (yani 39+40 sonrası) duruma döndürür.
--
-- HEDEF:
--   - standards satırları snapshot'taki haline döner (ST-066 kalkar; 41'in
--     değiştirdiği canonical alanlar ve aktiflikler snapshot değerine döner).
--   - task_standards snapshot'taki haline döner (re-point/dedupe geri alınır;
--     eski UUID ilişkileri tekrar oluşur).
--   - 41'in oluşturduğu unique/index'ler kaldırılır; 41'in kaldırdığı
--     unique(alan,ad) kısıtı yeniden kurulur.
--
-- KORUNUR (SİLİNMEZ):
--   - 39'un eklediği canonical kolonlar (snapshot değerleriyle geri yazılır).
--   - standart_gecmisi tablosu ve içindeki snapshot.
--
-- Snapshot, 39 sonrası alındığı için yeni kolonları da içerir; bu yüzden geri
-- yüklenen değerler tam olarak "41 öncesi" durumdur (kanonik_id=NULL vb.).
--
-- Tek transaction; sonda validation, hata olursa RAISE → ROLLBACK.
-- İki kez çalıştırmak güvenlidir (idempotent no-op).
-- Constraint/index isimleri varsayılmadan katalogdan tespit edilir.
-- ============================================================================

begin;

-- 0) Snapshot zorunlu
do $$ begin
  if not exists (select 1 from public.standart_gecmisi where etiket='standart-canonical-v1') then
    raise exception 'Snapshot yok (standart-canonical-v1). Rollback baslatilamaz.';
  end if;
end $$;

-- Snapshot yükünü tek yerde tut (en erken alınan)
create temporary table _snap on commit drop as
select standards_veri, task_standards_veri
from public.standart_gecmisi
where etiket='standart-canonical-v1'
order by alindi asc
limit 1;

-- 1) 41'in oluşturduğu unique/index'leri kaldır + (alan,ad) üzerindeki HER unique
--    yapıyı (kısıt ya da indeks) katalogdan bulup kaldır (sonra orijinali kuracağız)
do $$
declare r record;
begin
  -- kanonik_id unique indeksi (41)
  if exists (select 1 from pg_class where relname='standards_kanonik_id_key' and relkind='i') then
    execute 'drop index if exists public.standards_kanonik_id_key';
  end if;
  -- (alan,ad) üzerindeki unique KISITLAR (partial dahil; sütun sırasından bağımsız)
  for r in
    select con.conname from pg_constraint con
    join pg_class c on c.oid=con.conrelid
    join pg_namespace n on n.oid=c.relnamespace
    where n.nspname='public' and c.relname='standards' and con.contype='u'
      and coalesce(array_length(con.conkey,1),0)=2
      and 2=(select count(*) from unnest(con.conkey) k
             join pg_attribute a on a.attrelid=con.conrelid and a.attnum=k
             where a.attname in ('alan','ad'))
  loop execute format('alter table public.standards drop constraint %I', r.conname); end loop;
  -- (alan,ad) üzerindeki unique INDEX'ler (kısıt-destekli olmayanlar; 41'in partial'ı dahil)
  for r in
    select i.indexname from pg_indexes i
    where i.schemaname='public' and i.tablename='standards'
      and i.indexdef ilike '%UNIQUE%(alan, ad)%'
      and not exists (select 1 from pg_constraint con where con.conname=i.indexname
                      and con.conrelid='public.standards'::regclass)
  loop execute format('drop index if exists public.%I', r.indexname); end loop;
end $$;

-- 2) Bağımlıları temizle (FK), sonra standards'ı snapshot'a göre geri kur
delete from public.task_standards;

-- Snapshot'ta olmayan standards satırlarını sil (ör. 41'in eklediği ST-066)
delete from public.standards s
where s.id not in (
  select (jsonb_populate_recordset(null::public.standards, (select standards_veri from _snap))).id
);

-- Snapshot satırlarını birebir geri yaz (tüm kolonlar; yeni kolonlar dahil)
insert into public.standards
  (id, ad, grup, alan, ozet, tarif, yerel, sira, aktif, eklendi, olusturuldu,
   kanonik_id, tip, kategori, aile, kosul, istisna, neden, kapsam, kaynak,
   versiyon, a11y, eski_standartlar)
select
   id, ad, grup, alan, ozet, tarif, yerel, sira, aktif, eklendi, olusturuldu,
   kanonik_id, tip, kategori, aile, kosul, istisna, neden, kapsam, kaynak,
   versiyon, a11y, eski_standartlar
from jsonb_populate_recordset(null::public.standards, (select standards_veri from _snap))
on conflict (id) do update set
  ad=excluded.ad, grup=excluded.grup, alan=excluded.alan, ozet=excluded.ozet,
  tarif=excluded.tarif, yerel=excluded.yerel, sira=excluded.sira, aktif=excluded.aktif,
  eklendi=excluded.eklendi, olusturuldu=excluded.olusturuldu,
  kanonik_id=excluded.kanonik_id, tip=excluded.tip, kategori=excluded.kategori,
  aile=excluded.aile, kosul=excluded.kosul, istisna=excluded.istisna,
  neden=excluded.neden, kapsam=excluded.kapsam, kaynak=excluded.kaynak,
  versiyon=excluded.versiyon, a11y=excluded.a11y, eski_standartlar=excluded.eski_standartlar;

-- 3) task_standards'ı snapshot'tan geri yükle
insert into public.task_standards (gorev_id, standart_id)
select gorev_id, standart_id
from jsonb_populate_recordset(null::public.task_standards, (select task_standards_veri from _snap))
on conflict do nothing;

-- 4) Orijinal unique(alan,ad) kısıtını geri kur (41 kaldırmıştı); yoksa ekle
do $$ begin
  if not exists (
    select 1 from pg_constraint con
    join pg_class c on c.oid=con.conrelid
    join pg_namespace n on n.oid=c.relnamespace
    where n.nspname='public' and c.relname='standards' and con.contype='u'
      and coalesce(array_length(con.conkey,1),0)=2
      and 2=(select count(*) from unnest(con.conkey) k
             join pg_attribute a on a.attrelid=con.conrelid and a.attnum=k
             where a.attname in ('alan','ad'))
  ) then
    alter table public.standards add constraint standards_alan_ad_key unique (alan, ad);
  end if;
end $$;

-- ---------------- VALIDATION ----------------
do $$
declare
  v_snap_std int; v_snap_task int; v_std int; v_task int;
  v_std_fark int; v_task_fark int; v_066 int; v_kol int; v_snap_var int;
begin
  select jsonb_array_length(standards_veri), jsonb_array_length(task_standards_veri)
    into v_snap_std, v_snap_task from _snap;
  select count(*) into v_std  from public.standards;
  select count(*) into v_task from public.task_standards;

  -- 3) standards id kümesi snapshot ile aynı (iki yönlü fark = 0)
  select
    (select count(*) from (
       select id from public.standards
       except
       select (jsonb_populate_recordset(null::public.standards,(select standards_veri from _snap))).id) a)
  + (select count(*) from (
       select (jsonb_populate_recordset(null::public.standards,(select standards_veri from _snap))).id
       except
       select id from public.standards) b)
  into v_std_fark;

  -- 4) task_standards (gorev,standart) kümesi snapshot ile aynı
  select
    (select count(*) from (
       select gorev_id,standart_id from public.task_standards
       except
       select gorev_id,standart_id from jsonb_populate_recordset(null::public.task_standards,(select task_standards_veri from _snap))) a)
  + (select count(*) from (
       select gorev_id,standart_id from jsonb_populate_recordset(null::public.task_standards,(select task_standards_veri from _snap))
       except
       select gorev_id,standart_id from public.task_standards) b)
  into v_task_fark;

  select count(*) into v_066 from public.standards where kanonik_id='ST-066';          -- 5
  select count(*) into v_kol from information_schema.columns
    where table_schema='public' and table_name='standards'
      and column_name in ('kanonik_id','tip','kategori','aile','kosul','istisna',
                          'neden','kapsam','kaynak','versiyon','a11y','eski_standartlar'); -- 10
  select count(*) into v_snap_var from public.standart_gecmisi where etiket='standart-canonical-v1'; -- 11

  if v_std<>v_snap_std   then raise exception '1: standards %, snapshot %', v_std, v_snap_std; end if;
  if v_task<>v_snap_task then raise exception '2: task %, snapshot %', v_task, v_snap_task; end if;
  if v_std_fark<>0  then raise exception '3/6/8: standards id kumesi farkli (%)', v_std_fark; end if;
  if v_task_fark<>0 then raise exception '4/7/9: task_standards kumesi farkli (%)', v_task_fark; end if;
  if v_066<>0 then raise exception '5: ST-066 hala var (%)', v_066; end if;
  if v_kol<>12 then raise exception '10: canonical kolon sayisi % (beklenen 12)', v_kol; end if;
  if v_snap_var<1 then raise exception '11: snapshot kaybolmus'; end if;

  raise notice 'ROLLBACK OK: standards=% task=% (snapshot std=% task=%), ST-066=0, canonical kolon=12, snapshot korunuyor',
    v_std, v_task, v_snap_std, v_snap_task;
end $$;

commit;

-- ============================================================================
-- BİTTİ — Phase 42 (rollback). standards/task_standards 41 öncesine döndü;
-- 39 kolonları ve standart_gecmisi korundu.
-- ============================================================================
