-- ==========================================================================
-- NIZAM | Studio — Standart grupları
-- Standartlar düz liste yerine gruplar altında toplanır.
-- Supabase → SQL Editor'e yapıştır, bir kez çalıştır.
-- İki kez çalıştırsan da bozulmaz.
-- ==========================================================================

-- 1) Grup alanı ------------------------------------------------------------

alter table public.standards
  add column if not exists grup text not null default 'Arayüz';

-- 2) Mevcut sekiz standardı dağıt -----------------------------------------
--    Yalnızca dokunulmamış olanları taşır: grubu elle değiştirdiysen korunur.

update public.standards set grup = 'Arayüz'
 where grup = 'Arayüz'
   and ad in ('Açılış Ekranı', 'Login', 'Menü', 'Ayarlar');

update public.standards set grup = 'Veri & Çıktı'
 where grup = 'Arayüz'
   and ad in ('Excel / PDF Çıktı', 'Tarih Filtresi', 'Dosya Yükleme');

update public.standards set grup = 'Bildirim'
 where grup = 'Arayüz'
   and ad in ('Bildirim Merkezi');
