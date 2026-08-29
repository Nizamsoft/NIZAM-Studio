-- ==========================================================================
-- NIZAM | Studio — Standartlar: iki eksenli yapı
-- Supabase → SQL Editor'e yapıştır, bir kez çalıştır.
-- İki kez çalıştırsan da bozulmaz; elle yazdıkların korunur.
--
-- Standart artık iki eksende duruyor:
--   grup  = işin cinsi   (Altyapı, Veri, Güvenlik, Tasarım, Animasyon,
--                         Optimizasyon, Biçim, Erişilebilirlik)
--   alan  = ekranın parçası (Alt çubuk, Panel, Sayfa geçişi, Giriş…)
--   ad    = kuralın başlığı
--   tarif = kuralın kendisi
--
-- Bir satır tek bir kuraldır. "Alt çubuk standartları" demek, alanı
-- "Alt çubuk" olan satırların tamamı demektir.
-- ==========================================================================

-- 1) Yeni sütunlar ---------------------------------------------------------
--    alan    : ekranın parçası
--    eklendi : hangi Studio sürümünde eklendi. Damgalı satır, daha eski
--              kurulmuş programların Geliştirme durağında "yeni standart"
--              olarak çıkar. Boşsa hiç duyurulmaz.
--    yerel   : proje sunucusuz kurulduysa tarifin yerine geçen metin.

alter table public.standards add column if not exists alan    text not null default '';
alter table public.standards add column if not exists eklendi text not null default '';
alter table public.standards add column if not exists yerel   text not null default '';

-- 2) Tekillik ada değil, alan+ada bağlanır ---------------------------------
--    Aynı başlık farklı alanlarda geçebilir: "Kırmızı yalnız aktif sekmede"
--    hem alt çubukta hem yan menüde anlamlıdır.

update public.standards set alan = ad where alan = '';

alter table public.standards drop constraint if exists standards_ad_key;
alter table public.standards drop constraint if exists standards_alan_ad_key;
alter table public.standards add  constraint standards_alan_ad_key unique (alan, ad);

-- 3) Tohum -----------------------------------------------------------------
--    Bunlar Studio'nun bugüne kadar kodda taşıdığı teknik standart ile
--    kütüphanedeki arayüz tarifleridir. Zaten varsa dokunulmaz.

insert into public.standards (grup, alan, ad, ozet, tarif, yerel, sira) values

-- ---- Altyapı -------------------------------------------------------------
('Altyapı', 'Dil ve çatı', 'Vanilla JS · HTML · CSS', '',
 'Hazır çatı (React, Vue) kullanılmaz. Bağımlılık az, ömrü uzun olsun.', '', 10),

('Altyapı', 'Derleme', 'Yok', '',
 'Dosyalar doğrudan çalışır. Build adımı, paket yöneticisi, node_modules yoktur.', '', 11),

('Altyapı', 'Dosya düzeni', 'Ekran başına ayrı dosya', '',
 'Tek dosyada 1500 satırı geçme. Büyük dosyada bir yeri düzeltirken başka yer bozulur.', '', 12),

('Altyapı', 'Barındırma', 'GitHub Pages', '',
 'Depoya gönderilen kod kendiliğinden yayınlanır.', '', 13),

('Altyapı', 'Depo', 'GitHub · main dalı', '',
 'Commit başına [NS-x] etiketi.', '', 14),

('Altyapı', 'PWA', 'Var', '',
 'Ana ekrana eklenebilir. Servis işçisi kabuğu önbelleğe alır, sürüm değişince günceller.', '', 15),

('Altyapı', 'Paketler', 'Yalnız Supabase istemcisi', '',
 'Excel gerekiyorsa xlsx. Başka paket eklemeden önce sor.',
 'Dış paket kullanılmaz. Excel gerekiyorsa xlsx. Başka paket eklemeden önce sor.', 16),

('Altyapı', 'Geliştirme istekleri', 'Ayarlarda toplanır', '',
 'Ayarlar''da "Geliştirme istekleri" ekranı olur: kullanıcı isteğini yazar, liste cihazda birikir, "Hepsini kopyala" ile tek metin olarak alınır. Sunucuya gitmez, kimseye gönderilmez.', '', 17),

-- ---- Veri ----------------------------------------------------------------
('Veri', 'Veri katmanı', 'Supabase', '',
 'Postgres + Auth + Realtime + Storage. Satır güvenliği (RLS) her tabloda açık.',
 'Yerel tarayıcı (IndexedDB). Sunucu yok. Bütün kayıtlar kullanıcının cihazında durur. Site verisi silinirse kayıtlar da gider — yedeği kullanıcı alır.', 20),

('Veri', 'Gerçek zamanlı', 'Her zaman açık', '',
 'Başkası bir kaydı değiştirince ekran kendiliğinden tazelenir.',
 'Yok. Tek cihaz, tek kullanıcı. Eşitlenecek başka bir yer yok.', 21),

('Veri', 'Çevrimdışı', 'Her zaman çalışır', '',
 'Okuma yerelden: son görülen veri tarayıcıda durur. Yazma kuyruğa girer, internet gelince gönderilir. Çakışırsa son yazan kazanır ve kullanıcıya söylenir.', '', 22),

('Veri', 'Değişiklik kaydı', 'Her zaman tutulur', '',
 'Her yazma işleminde kim, ne, ne zaman kaydedilir. Ayarlarda listelenir.',
 'Yerelde tutulur. Ne, ne zaman değişti cihazda kaydedilir ve Ayarlar''da listelenir. "Kim" yok — uygulamayı tek kişi kullanıyor.', 23),

('Veri', 'Dosya saklama', 'Supabase Storage', '',
 'Belge ve logolar özel klasörde, imzalı adresle sunulur. Profil fotoğrafı genel olabilir.',
 'Yerel (IndexedDB). Eklenen dosyalar da cihazda durur; yedeğe dahil edilir.', 24),

('Veri', 'Yedek', 'Dosyaya dışa/içe aktarma', '',
 'Sunucusuz projelerde geçerlidir: Ayarlar''dan tek dosya olarak indirilir ve geri yüklenir. Yedeği almak kullanıcının sorumluluğundadır; uygulama düzenli olarak hatırlatır.',
 'Ayarlar''dan tek dosya olarak indirilir ve geri yüklenir. Sunucu olmadığı için yedeği almak kullanıcının sorumluluğunda; uygulama düzenli olarak hatırlatır.', 25),

-- ---- Güvenlik ------------------------------------------------------------
('Güvenlik', 'Giriş', 'E-posta + şifre', '',
 'Kayıt ekranı yoktur; hesabı yönetici açar.',
 'Yerel PIN. Açılışta PIN sorulur, PIN cihazda saklanır. Bu gerçek kimlik doğrulama değil — meraklı gözlere karşı. Verinin kendisi şifrelenmez.', 30),

-- ---- Biçim ---------------------------------------------------------------
('Biçim', 'Para birimi', '₺ TRY', '',
 'Binlik nokta, ondalık virgül: 12.400,00', '', 40),

('Biçim', 'Tarih ve saat', '22.05.2025 · 14:30', '',
 'Gün.Ay.Yıl ve 24 saatlik saat.', '', 41),

('Biçim', 'Kayıt numarası', 'HARF-SIRA', '',
 'Kaydın türünü gösteren kısa harf, tire, sıra numarası: F-1042 (fatura), S-1001 (sipariş). Sayaç 1''den başlar, yıl başında sıfırlanmaz, boşluk bırakmaz.', '', 42),

('Biçim', 'Sürümleme', 'YIL.SAYAÇ', '',
 'Örnek 2026.14. Ayarlar ekranında görünür.', '', 43),

('Biçim', 'Arayüz dili', 'Türkçe', '',
 'Tek dil. Metinler koda yazılır, sözlük dosyası yoktur.', '', 44),

-- ---- Erişilebilirlik -----------------------------------------------------
('Erişilebilirlik', 'Dokunma ve kontrast', '44px · 4.5:1', '',
 'Dokunma hedefi en az 44×44px, metin kontrastı en az 4.5:1.', '', 50),

('Erişilebilirlik', 'Yakınlaştırma', 'Kapalı', '',
 'Çift dokunma ve iki parmakla yakınlaştırma kapalıdır: viewport etiketinde maximum-scale=1, user-scalable=no. Yazı boyutu ayarlardan değişir, sayfa esnetilerek değil.', '', 51),

-- ---- Tasarım · gezinme ---------------------------------------------------
('Tasarım', 'Gezinme', 'Masaüstünde panel, telefonda alt çubuk', '',
 '900px ve üstünde alt sekme çubuğu gizlenir; gezinme solda dikey panele döner. Alt çubuk yalnız telefon ve tablette görünür. Seçilen çubuk dokusu ikisinde de aynıdır. Aynı bölüm iki yerde birden gösterilmez.', '', 60),

('Tasarım', 'Alt çubuk', 'Buzlu cam, ekranın dibine yapışık', '',
 '900 pikselin altındaki ekranlarda yan menü gizlenir, yerine ekranın altında bir sekme çubuğu gelir; sekme sayısı beşi geçmez. Çubuk yerleşimin parçası değildir, içeriğin üstünde durur ve sayfa altından akıp geçer — bu yüzden sayfa içeriğine çubuk yüksekliği kadar alt pay verilir, son satır çubuğun altında kalmaz. Zemin buzlu camdır: yarı saydam bir katman ve arkasını bulanıklaştıran bir süzgeç; tarayıcı bunu desteklemiyorsa düz koyu zemine düşülür.', '', 61),

('Tasarım', 'Alt çubuk', 'Kırmızı yalnız aktif sekmede', '',
 'Her sekmede üstte simge, altında küçük bir yazı bulunur; aktif sekmenin arkasında yumuşak kırmızı bir hap belirir, yazısı ve simgesi kırmızıya döner. Kırmızı bu ekranda başka hiçbir yerde kullanılmaz.', '', 62),

('Tasarım', 'Alt çubuk', 'Ekranın fiziksel dibine oturur', '',
 'Ana ekran çizgisinin payı çubuğun dışına değil içine verilir; tarayıcıda ise hiç verilmez, çünkü tarayıcının kendi çubuğu zaten oradadır. iOS''ta uygulama kipinde durum çubuğu ayarı black olmalıdır; black-translucent sayfayı ekranın tepesine yapıştırıp altta erişilemeyen bir boşluk bırakır.', '', 63),

('Tasarım', 'Üst çubuk', 'Yalnız marka, sayfa adı ve profil', '',
 'Üst çubukta solda logo ve marka, altında bulunulan sayfanın adı, sağda kullanıcı kutusu bulunur. Araç düğmeleri üst çubuğa dizilmez; profil kutusuna basınca açılan panele girer. Üst çubuk sayfadan sayfaya yer değiştirmez ve geçiş sırasında solmaz.', '', 64),

-- ---- Tasarım · ekranlar --------------------------------------------------
('Tasarım', 'Açılış ekranı', 'Minimal, animasyonsuz', '',
 'Ekranın ortasında logo, altında marka adı, en altta ince bir ilerleme çubuğu ve tek satır durum yazısı bulunur. Toplam süre bir saniyeyi geçmez. Zıplayan, dönen, büyüyüp küçülen animasyon yoktur; yalnızca yumuşak bir belirme kullanılır. Açılış bittiğinde ekran silinir, geride iz bırakmaz.', '', 70),

('Tasarım', 'Giriş ekranı', 'Tek kart, kayıt yok', '',
 'Tek kart içinde logo, marka adı, e-posta ve şifre alanları, tam genişlikte bir giriş düğmesi bulunur. Kayıt olma ekranı yoktur — kullanıcıları yalnızca yönetici ekler. Hatalı girişte kartın içinde kırmızı bir uyarı satırı çıkar; bu uyarı Türkçe ve anlaşılır olmalıdır, hata kodu gösterilmez. Giriş sırasında düğme pasifleşir ve "Giriş yapılıyor…" yazar. Oturum kalıcıdır: sayfa yenilenince tekrar giriş istenmez.', '', 71),

('Tasarım', 'Panel', 'Önce nereye gidileceği', '',
 'Panel sayı dökmez, yol gösterir: bölümlere giden kısayol kartları asıl içeriktir. Aynı sayıyı hem panelde hem alt çubuğun rozetinde tekrarlama. Panel kaydırılmaz; içerik ekrana sığar.', '', 72),

('Tasarım', 'Ayarlar', 'Başlıklı bölümler, satır satır', '',
 'Ayarlar tek sütun halinde, başlıklı bölümlerden oluşur: Hesap, Uygulama, Bağlantılar. Her bölüm bir kart içinde satır satır listelenir; solda alan adı, sağda değeri. Değiştirilemeyen bilgiler düz yazı, değiştirilebilenler düğme veya anahtar olarak görünür. Çıkış düğmesi en altta ve sade durur, kırmızı değildir.', '', 73),

('Tasarım', 'Profil paneli', 'Araç düğmeleri burada toplanır', '',
 'Sağ üstteki kullanıcı kutusuna basınca aşağı açılan bir panel gelir. Not defteri, bildirimler, destek ve çıkış bu panelin satırlarıdır. Üst çubuğa ayrı simge düğmeleri eklenmez.', '', 74),

('Tasarım', 'Bildirim merkezi', 'Zil, sayı, okundu', '',
 'Üst çubukta bir zil simgesi bulunur; okunmamış bildirim varsa üzerinde sayı görünür. Tıklanınca açılan listede her satır: kısa başlık, bir cümlelik açıklama ve göreceli zaman (5 dk önce) içerir. Okunmamışlar sol kenarındaki nokta ile ayrılır. Satıra tıklanınca ilgili sayfaya gidilir ve bildirim okundu sayılır. "Tümünü okundu işaretle" seçeneği listenin üstünde durur.', '', 75),

('Tasarım', 'Tablo çıktısı', 'Excel ve PDF', '',
 'Tablonun üstünde tek bir dışa aktar düğmesi bulunur; tıklanınca Excel ve PDF seçenekleri açılır. Çıktı ekranda görünen filtreye ve sıralamaya uyar — tüm veriyi değil, kullanıcının baktığı veriyi verir. Dosya adı "musteri-tablo-YYYY-AA-GG" biçimindedir. Çıktı hazırlanırken düğme pasifleşir ve "Hazırlanıyor…" yazar. PDF çıktısında sayfa başlığı ve tarih üst bilgide yer alır.', '', 76),

('Tasarım', 'Tarih filtresi', 'Gün · Hafta · Ay · Aralık', '',
 'Dört seçenek sunulur: Gün, Hafta, Ay ve Aralık. Varsayılan "Ay". Aralık seçilirse iki tarih alanı açılır ve bitiş tarihi başlangıçtan önce seçilemez. Filtre değiştiğinde liste anında yenilenir, sayfa yeniden yüklenmez. Seçim adres çubuğunda saklanır ki sayfa yenilendiğinde ya da bağlantı paylaşıldığında aynı görünüm gelsin.', '', 77),

('Tasarım', 'Dosya yükleme', 'Tıkla veya sürükle', '',
 'Yükleme alanı hem tıklanabilir hem sürükle-bırak kabul eder. Yüklenmeden önce dosya türü ve boyutu denetlenir; sınır aşılırsa Türkçe uyarı verilir. Görseller küçük önizleme ile listelenir, belgeler simge ve dosya adı ile. Her satırda silme düğmesi bulunur. Yükleme sırasında ilerleme çubuğu görünür ve iptal edilebilir.', '', 78),

-- ---- Animasyon -----------------------------------------------------------
('Animasyon', 'Sayfa geçişi', 'Yeni ekran solarak gelir', '',
 'Sayfa değişince yeni ekran kısa bir soluklaşmayla gelir (0,25 sn), eskisi anında gider. Kayma, çevirme, büyütme yoktur. Üst çubuk ve alt çubuk geçişe katılmaz — onlar duran şeylerdir, yerlerinde kalır.', '', 80),

('Animasyon', 'Liste ve kartlar', 'Tek tek belirme yok', '',
 'Kartlar sıraya girip birer birer belirmez; sayfa bir bütün olarak gelir. Yalnızca veriyi anlatan hareketler kalır: ilerleme çubuğunun dolması, sayacın sıfırdan sayması.', '', 81),

('Animasyon', 'Dokunma tepkisi', 'Küçülme, karartma değil', '',
 'Basılan öğe hafifçe küçülür (%97 dolayında). Koyu temada zemini koyulaştırmak "sönüyor" gibi okunur, kullanılmaz. Parmakla basınca kalan odak halkası dokunmatik cihazlarda kapatılır.', '', 82),

-- ---- Optimizasyon --------------------------------------------------------
('Optimizasyon', 'Bulanıklık', 'Kaydırılan listede kullanılmaz', '',
 'backdrop-filter kaydırma sırasında her karede yeniden hesaplanır; ekranda sekiz kart varsa uygulama takılır. Kaydırılan içerikte kullanma. Bulanıklık sabit bir görselin arkasındaysa görselin kendisine pişir, çalışma anında hesaplatma. Yalnız yerinde duran tek bir yüzey (alt çubuk gibi) buzlu cam olabilir.', '', 90),

('Optimizasyon', 'Kart zemini', 'Saydam değil, düz koyu', '',
 'Arkasında görsel olan kartların zemini yarı saydam bırakılmaz: ekran solarak gelirken altındaki ışığı geçirir ve kart açıktan koyuya kayar. Zemin düz ve koyu olur.', '', 91),

('Optimizasyon', 'Görsel ağırlığı', 'Tek zemin görseli, kırpılmış', '',
 'Arka plan görseli kullanılacaksa tek tane olur, hedef ekran oranına kırpılır ve 200 KB''ı geçmez. Aynı görselin birden çok kopyası üst üste bindirilmez.', '', 92)

on conflict (alan, ad) do nothing;
