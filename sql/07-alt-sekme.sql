-- ==========================================================================
-- NIZAM | Studio — Alt Sekme Çubuğu standardı
-- Supabase → SQL Editor'e yapıştır, bir kez çalıştır.
-- İki kez çalıştırsan da bozulmaz.
-- ==========================================================================

-- 1) Yeni standart ---------------------------------------------------------

insert into public.standards (ad, grup, ozet, tarif, sira) values
(
  'Alt Sekme Çubuğu',
  'Arayüz',
  'Mobil · buzlu cam · ekranın dibine yapışık',
  '900 pikselin altındaki ekranlarda yan menü gizlenir, yerine ekranın altında bir sekme çubuğu gelir; sekme sayısı beşi geçmez. Çubuk yerleşimin parçası değildir, içeriğin üstünde durur ve sayfa altından akıp geçer — bu yüzden sayfa içeriğine çubuk yüksekliği kadar alt pay verilir, son satır çubuğun altında kalmaz. Zemin buzlu camdır: yarı saydam bir katman ve arkasını bulanıklaştıran bir süzgeç; tarayıcı bunu desteklemiyorsa düz koyu zemine düşülür. Her sekmede üstte simge, altında küçük bir yazı bulunur; aktif sekmenin arkasında yumuşak kırmızı bir hap belirir, yazısı ve simgesi kırmızıya döner. Kırmızı bu ekranda yalnızca aktif sekmede kullanılır. Çubuk ekranın fiziksel dibine oturur: ana ekran çizgisinin payı çubuğun dışına değil içine verilir, tarayıcıda ise hiç verilmez çünkü tarayıcının kendi çubuğu zaten oradadır. iOS''ta uygulama kipinde durum çubuğu ayarı black olmalıdır; black-translucent sayfayı ekranın tepesine yapıştırıp altta erişilemeyen bir boşluk bırakır.',
  9
)
on conflict (ad) do nothing;

-- 2) Menü standardındaki çakışan cümle çıkarıldı ---------------------------
--    Sekme çubuğu kuralı artık kendi standardında; aynı kural iki yerde durmasın.

update public.standards
   set tarif = 'Masaüstünde solda sabit bir yan menü bulunur: üstte logo ve marka, ortada bölüm bağlantıları, altta kullanıcı kutusu. Aktif bölüm, sol kenarında ince bir kırmızı şeritle belirtilir. Mobilde yan menü gizlenir; yerini alt sekme çubuğu alır — kuralları Alt Sekme Çubuğu standardındadır. Aynı bölüm iki yerde birden gösterilmez.'
 where ad = 'Menü';
