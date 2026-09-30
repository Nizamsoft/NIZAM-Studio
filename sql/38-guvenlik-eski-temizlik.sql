-- ============================================================================
-- 38 · NIZAM Security — eski şablon güvenlik kolonlarının kaldırılması
-- ============================================================================
-- sql/20-sablon-guvenlik-testi.sql eski "şablon saldırı testi"ni üç metin
-- kolonunda tutuyordu: guvenlik1, guvenlik2, guvenlik3. Bu akış kaldırıldı;
-- uygulama artık bu kolonları OKUMUYOR da YAZMIYOR da (kurulum SQL'i yalnız
-- metin/metin2/metin3 kullanıyor, bkz. data.js sablonSqlMetniOku/Yaz).
--
-- Canlı ön kontrol (salt-okunur, Faz 8D-B) üç kolonun da BOŞ olduğunu
-- doğruladı — veri kaybı yok. Yeni NIZAM Security'nin bu kolonlara hiçbir
-- bağımlılığı yok (o sistem guvenlik_* tablolarında; bkz. sql/36, sql/37).
--
-- Yalnız bu üç kolonu düşürür; başka hiçbir şeye dokunmaz. IF EXISTS ile
-- tekrar çalıştırmak zarar vermez.
--
-- Supabase → SQL Editor → yapıştır → Run.
-- ============================================================================

alter table public.sablon_sql_metinleri
  drop column if exists guvenlik1,
  drop column if exists guvenlik2,
  drop column if exists guvenlik3;

-- ============================================================================
-- BİTTİ
-- Not: sql/20 (eski migration) BİLEREK olduğu gibi bırakıldı — geçmiş
-- migration'lar değiştirilmez. Bu dosya onun eklediği kolonları geri alır.
-- ============================================================================
