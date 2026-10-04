/* ==========================================================================
   NIZAM | Studio — Yapılandırma
   Bu dosya her sürümde elle güncellenir.
   ========================================================================== */

const APP = {
  name:     'NIZAM | Studio',
  short:    'NIZAM Studio',
  owner:    'Nizam Soft',
  version: 'v0.304.0',
  build:    '2026-10-01',
  /* Studio'nun kendi deposu — "bütün programlarda geçerli olsun"
     istekleri buraya gider. */
  depo:    'Nizamsoft/NIZAM-Studio',
  stage: 'Adım 4 · Yapı ağacı',
};

/* Supabase bağlantısı.
   Bu anahtar "publishable" tiptir — tarayıcıda görünmesi normaldir ve güvenlidir.
   Veriyi koruyan şey anahtar değil, tablolardaki satır güvenliği (RLS) kurallarıdır.
   Alanlar boş bırakılırsa uygulama demo modunda çalışır. */
const SUPABASE = {
  url: 'https://whkjkaxsojkdwcehgiwj.supabase.co',
  key: 'sb_publishable_6qCgu1aJCmK9inF5xmaopg_PayG8KDP',
};

/* Hata bildirimi kanalı — müşteri programlarındaki "Hata bildir" formu buraya
   POST atar (bkz. supabase/functions/hata-al). Adres ve anahtar TÜM programlarda
   aynıdır; tek değişen her programın kendi Studio proje UUID'sidir. `anahtar`
   gerçek bir sır değildir (programın içinde durur) — Supabase'de "hata-al"
   fonksiyonunun RAPOR_ANAHTARI gizli değeri bununla BİREBİR aynı olmalıdır. */
const RAPOR = {
  url:     SUPABASE.url + '/functions/v1/hata-al',
  anahtar: 'nzmrapor_7210489390b3ad1829a41f743cdbd39f680389024ae30341',
};

/* Görev numarası öneki — commit mesajlarında bu etiket aranır: [NS-142] */
/* Kullanıcı sayfasındaki Destek satırı nereye gidecek.
   tip: 'wa' (WhatsApp) | 'mail'  ·  deger: numara ya da e-posta */
const DESTEK = { tip: 'mail', deger: 'nizamsoft@icloud.com' };

const TASK_PREFIX = 'NS';

/* ==========================================================================
   Proje renkleri — kart rozetinde ve proje başlığında kullanılır.
   Kırmızı bilerek yok: kırmızı yalnızca markanın ve "Acil"in rengidir.
   ========================================================================== */

const PROJE_RENK = {
  metal:  ['#6b7178', '#3a3f45'],
  yesil:  ['#2f6f4f', '#1d4a34'],
  mor:    ['#8a5cc4', '#5b3a86'],
  altin:  ['#c4a05c', '#8a6f38'],
  mavi:   ['#4a90c4', '#2c5c86'],
  gul:    ['#c45c72', '#86364a'],
  lacive: ['#5c8ac4', '#36527f'],
};

/* ==========================================================================
   Modül şablonları — sihirbazda tiklenen her modül bu sayfalarla kurulur.
   "Diğer" seçilirse ad sorulur, sayfası boş açılır.
   ========================================================================== */


/* Her projede kendiliğinden açılan kova */
/* Sihirbazdaki dil ve para birimi seçenekleri. */
const DIL_SECENEK  = [
  { kod: 'tr', ad: 'Türkçe' },
  { kod: 'en', ad: 'İngilizce' },
  { kod: 'ar', ad: 'Arapça' },
  { kod: 'de', ad: 'Almanca' },
];
const PARA_SECENEK = [
  { kod: 'TRY', ad: '₺ TRY' },
  { kod: 'USD', ad: '$ USD' },
  { kod: 'EUR', ad: '€ EUR' },
  { kod: 'GBP', ad: '£ GBP' },
];

/* ---- Standardın iki ekseni ----
   grup = işin cinsi. Sabit sekiz kova; yenisi açılmaz, çünkü bu liste hem
          promptun hem ekranın omurgası.
   alan = ekranın parçası. Serbest metin: "Alt çubuk", "Panel", "Sayfa geçişi".
          Yenisi kendiliğinden doğar, bir standart o alanda ilk kez yazılınca.
   Bir satır tek bir kuraldır. "Alt çubuk standartları" demek, alanı
   "Alt çubuk" olan satırların tamamı demektir. */
const STANDART_GRUPLARI = ['Altyapı', 'Veri', 'Güvenlik', 'Tasarım',
  'Animasyon', 'Optimizasyon', 'Biçim', 'Erişilebilirlik'];
const VARSAYILAN_GRUP = 'Tasarım';

/* Her grubun kendi simgesi ve rengi. Buradaki değer bir kısa addır:
   simgeyi app.js'teki ICON.g* karşılığından, rengi style.css'teki
   .gr-* kuralından alır. Listede olmayan bir grup adı doğarsa metal
   kalır — renk uydurmuyoruz. */
const GRUP_SIMGE = {
  'Altyapı':          'altyapi',
  'Veri':             'veri',
  'Güvenlik':         'guvenlik',
  'Tasarım':          'tasarim',
  'Animasyon':        'animasyon',
  'Optimizasyon':     'optimizasyon',
  'Biçim':            'bicim',
  'Erişilebilirlik':  'erisim',
};


/* Tasarım durağı: "Görsel dünya" ve onun tasarım-tarifi sistemi (dil/renk/
   bileşen bloğu) kaldırıldı — eski sistemden kalmaydı, yeni plana uymuyordu.
   Yerine sabit ChatGPT promptları geldi: her biri projenin gerçek ekran
   görüntüsünü girdi alıp yalnız görsel dili değiştiriyor, içerik aynı
   kalıyor. Başta beş yön vardı, on ikiye çıkarıldı — müşteriye gösterilen
   seçenek ne kadar farklıysa karar o kadar kolay oluyor. Liste zaman zaman
   yenileniyor: tutmayan yönler çıkarılıp yerlerine yenileri geliyor, o yüzden
   bir projede seçili kalan yön listede olmayabilir (bkz. tasarimAsamasi).

   Her yönün İKİ promptu var, çünkü müşterinin iki farklı sorusu oluyor:
     prompt        → "aynı ekran, başka görünüş". Yerleşime dokunulmaz;
                     yalnız renk, yazı tipi, gölge, köşe, doku değişir.
     promptYeniden → "bunu bir web sitesi gibi baştan tasarla". Bilgiler
                     ve işlevler aynı kalır ama düzen, ızgara, gezinme ve
                     sayfa ritmi serbesttir.
   İkisi de aynı ekran görüntülerini girdi alır. Eksik promptYeniden
   sessizce prompt'a düşer (bkz. PROMPT.tasarimYonu), ama yeni yön
   eklerken ikisini de yaz.

   Her yönün burada yalnız İKİ metni var; promptun geri kalanını
   PROMPT.tasarimYonu (prompt.js) kuruyor:
     stil     → görsel dil (renk, yazı tipi, gölge, köşe, doku, fotoğraf).
     yerlesim → yalnız "yerleşim de değişsin" kipinde eklenen düzen tarifi.
   Çatı orada duruyor çünkü asıl iş onda: işletmeyi tanıtmak, neyin
   değişmeyeceğini söylemek (içerik, marka, sektör kimliği) ve kalite
   çıtasını koymak. Yön metinleri kısa ve somut kalsın, kural yazma.

   YENİ YÖN EKLERKEN: yönler birbirinden AÇIKÇA ayrılmalı. "Biraz daha
   koyu" bir varyant değil, başka bir görsel dil olmalı — yoksa müşteri
   ikisi arasında karar veremez. Stil metni somut olsun: yazı tipi, kaç
   renk, gölge var mı, köşe kaç px, fotoğraf var mı. Benzetme kullanmak
   serbest ("dergi gibi") ama tek başına bırakma — ChatGPT benzetmenin
   klişesine kayıp uygulamayı başka bir sektörün uygulamasına çeviriyor.
   Müşteri beğendiğini seçiyor; gerçek renk/tipografi uygulaması artık
   Studio dışında, doğrudan Claude Code sohbetiyle yapılıyor. */
/* Tasarım mockup'larının sabit ölçüsü. ChatGPT promptu bunu istiyor
   (prompt.js · tasarimYonu), Studio'daki yükleme kutuları da aynı oranda
   (style.css · .tu-kutu.masa 16/10, .tu-kutu.mobil 9/16). Birini
   değiştirirsen üçünü birden değiştir, yoksa görsel kutuya oturmaz. */
const TASARIM_OLCU = { masa: '1600 x 1000', mobil: '1080 x 1920' };

const TASARIM_YON = [
  { anahtar: 'marka', ad: 'Editoryal / Fotoğraflı', renk: '#c9753c',
    ozet: 'Dergi düzeni: iri serif başlık, gerçek fotoğraf, bol boşluk, tek vurgu.',
    onizleme: { zemin:'#F6F1E8', kart:'#FFFDF8', metin:'#1A1A1A', soluk:'#8A7F70', vurgu:'#C9753C', kenar:'none', ust:'3px solid #C9753C', kose:'7px', golge:'none', yazi:'Georgia, "Times New Roman", serif', doku:'none' , dugmeYazi:'#FFFFFF' },
    stil: 'Yön: bir dergi kapağı gibi editoryal bir kabuk. Başlıkları '
      + 'iri, oturaklı bir **serif** yazı tipiyle yaz (İnter/Roboto '
      + 'gibi standart bir gövde yazısıyla birlikte kullan). Gerçek '
      + 'fotoğrafı kahraman alanında büyük ve kesintisiz göster, üstüne '
      + 'gradyan bindirme; {SEKTOR} uygun **tek** doygun bir vurgu '
      + 'rengi seç ve bunu yalnız bir-iki küçük vurgulu öğede kullan '
      + '(altı çizili başlık, tek bir rakam, tek bir ikon) — geri kalan '
      + 'her şey kırık beyaz/krem zemin ve siyaha yakın metin. '
      + 'Kartlarda gölge kullanma; bunun yerine üstte ince renkli bir '
      + 'şerit kenarlık olsun, köşeler hafif yuvarlak (6-8px), gradyan '
      + 've camsı efekt yok. Bolca boş alan bırak, sıkışık durmasın.',
    yerlesim: 'Yerleşim için dergi mantığı kur: tam genişlikte kahraman '
      + 'fotoğraf ve üstünde tek büyük serif başlık, altında asimetrik '
      + 'iki sütun (geniş içerik sütunu + dar kenar sütunu). Bölümleri '
      + 'iri numaralı ara başlıklarla ayır, sayfa uzun olsun ve nefes '
      + 'aralıkları ferah kalsın. Menüyü üstte ince bir şerit yap, '
      + 'altına bölüm bağlantılarını diz.' },
  { anahtar: 'minimal', ad: 'İsviçre Usulü / Sıfır Süs', renk: '#8fae4a',
    ozet: 'Fotoğraf yok, keskin köşe, gölgesiz, ızgara temelli, tek renk.',
    onizleme: { zemin:'#FFFFFF', kart:'#FFFFFF', metin:'#000000', soluk:'#777777', vurgu:'#E5342A', kenar:'1px solid #111111', ust:'none', kose:'0', golge:'none', yazi:'Inter, Helvetica, Arial, sans-serif', doku:'none' , dugmeYazi:'#FFFFFF' },
    stil: 'Yön: katı İsviçre/Bauhaus usulü minimalizm. **Fotoğrafı '
      + 'tamamen kaldır** — kahraman alanının yerine yalnız düz bir '
      + 'renk bloğu ve iri, kalın bir sayı ya da geometrik bir şekil '
      + 'koy. Geometrik, dar aralıklı bir grotesk yazı tipi kullan '
      + '(Helvetica/Inter tarzı). Renk paleti: bir nötr '
      + '(siyah/beyaz/gri) ve yalnız **en önemli tek rakam veya düğme** '
      + 'için kullanılan tek bir vurgu rengi — başka hiçbir yerde vurgu '
      + 'rengi tekrarlanmasın. **Hiçbir kartta gölge, gradyan ya da '
      + 'yuvarlatılmış büyük köşe olmasın**; köşeler keskin ya da en '
      + 'fazla 2px. Kartları ayırmak için gölge yerine ince 1px çizgi '
      + 'kullan. Sıkı bir ızgara hizasına otur, boşluklar matematik '
      + 'gibi eşit.',
    yerlesim: 'Yerleşim için her şeyi katı 12 sütunluk bir ızgaraya otur. '
      + 'Sayfayı eşit yükseklikte bloklara böl, hiçbir şeyi ortalama — '
      + 'hepsi sola hizalı olsun. Gezinmeyi solda dar ve sabit bir '
      + 'sütuna al, yalnız yazıdan oluşsun. Kart yerine çizgilerle '
      + 'ayrılmış bölümler kullan, başlıklar bölümün solunda dursun.' },
  { anahtar: 'sicak', ad: 'Yumuşak / Oyunbaz', renk: '#c4a05c',
    ozet: 'Neumorfik kabartma kartlar, pastel, blob şekiller, düz illüstrasyon.',
    onizleme: { zemin:'#EFE7DD', kart:'#EFE7DD', metin:'#4A3A2C', soluk:'#9C8B79', vurgu:'#C4A05C', kenar:'none', ust:'none', kose:'20px', golge:'5px 5px 11px rgba(120,95,70,.20), -5px -5px 11px rgba(255,255,255,.85)', yazi:'"Nunito", Inter, sans-serif', doku:'none' , dugmeYazi:'#3B2E22' },
    stil: 'Yön: yumuşak ve oyunbaz, **neumorfik (soft-UI)** bir his. Tek '
      + 'renkli sıcak pastel bir zemin üzerinde her kart kendi '
      + 'zemininden **kabartma gibi** yükseliyormuş hissi versin — bunu '
      + 'iki yönlü yumuşak gölgeyle (bir açık, bir koyu) yap, sert '
      + 'kenar çizgisi kullanma. Düğmeler tam yuvarlak (hap biçimi). '
      + 'Zemine dekoratif, bulanık kenarlı büyük "blob" (amorf damla) '
      + 'şekiller serpiştir. Gerçek fotoğraf yerine **düz vektör '
      + 'illüstrasyon** kullan: basit, birkaç renkli, gölgesiz, '
      + 'karikatürsü bir karakter ya da nesne çizimi — fotogerçekçi '
      + 'görsel değil. Yuvarlak hatlı, kalın, samimi bir başlık yazı '
      + 'tipi seç (köşeli hiçbir font kullanma). Bütün köşeler çok '
      + 'yuvarlak, hiçbir yerde keskin çizgi olmasın.',
    yerlesim: 'Yerleşimi rahat, tek akışlı bir sayfa olarak kur: üstte '
      + 'selamlama ve illüstrasyon, altında hap biçimli sekmeler, '
      + 'içerik iri kartlar hâlinde alt alta. Mobilde altta büyük '
      + 'yuvarlak ikonlu bir gezinme çubuğu olsun; masaüstünde kartlar '
      + 'üç sütuna yayılsın ve boşluklar bol kalsın.' },
  { anahtar: 'kurumsal', ad: 'Kurumsal / Yoğun Panel', renk: '#6b7178',
    ozet: 'Fotoğraf yok, KPI şeridi, ince çizgili sıkı tablo, koyu lacivert.',
    onizleme: { zemin:'#F2F4F7', kart:'#FFFFFF', metin:'#1E2A38', soluk:'#6B7889', vurgu:'#4A6FA5', kenar:'1px solid #D4D9E0', ust:'none', kose:'3px', golge:'none', yazi:'"Roboto Condensed", Inter, sans-serif', doku:'none' , dugmeYazi:'#FFFFFF' },
    stil: 'Yön: ciddi bir kurumsal **yönetim paneli** (Bloomberg/ERP '
      + 'tarzı), tüketici uygulaması gibi durmasın. **Kahraman '
      + 'fotoğrafını tamamen kaldır**; yerine ince çizgilerle ayrılmış, '
      + 'küçük mini-grafik (sparkline) içeren dar bir KPI şeridi koy. '
      + 'Bütün kartlar dikdörtgen, **köşeler keskin ya da en fazla '
      + '4px**, gölge yok — yalnız 1px ince gri kenarlık. Palet: '
      + 'lacivert/gri tonları ve yalnız tek, soluk bir vurgu rengi; '
      + 'hiçbir yerde canlı/parlak renk kullanma. Yazı boyutlarını '
      + 'küçük ve sıkı tut (gövde 12-13px), satır aralarını dar yap — '
      + 'amaç bol beyaz alan değil, çok bilgiyi düzenli sığdırmak. '
      + 'Sade, dar (condensed) bir kurumsal sans-serif kullan, '
      + 'yuvarlak/samimi hiçbir öğe olmasın.',
    yerlesim: 'Yerleşimi yoğun bir yönetim paneli olarak kur: solda '
      + 'katlanabilir ağaç menü, üstte iki katlı başlık (firma + sayfa '
      + 'yolu + eylemler), içerikte üstte dar KPI şeridi ve altında '
      + 'ekranı dolduran sıkı bir tablo. Filtreler tablonun hemen '
      + 'üstünde tek satırda, sayfalama ve toplam satırı altta sabit '
      + 'dursun.' },
  { anahtar: 'aurora', ad: 'Aurora / Yumuşak Degrade', renk: '#a259c4',
    ozet: 'Açık zemin, pastel degrade lekeler, yumuşak gölge, ferah modern.',
    onizleme: { zemin:'radial-gradient(120% 90% at 10% 0%, rgba(162,89,196,.30), transparent 60%), radial-gradient(110% 80% at 95% 25%, rgba(56,189,208,.28), transparent 62%), radial-gradient(110% 90% at 60% 110%, rgba(255,169,128,.28), transparent 60%), #FBFAFF', kart:'#FFFFFF', metin:'#23262B', soluk:'#7A8090', vurgu:'#A259C4', kenar:'none', ust:'none', kose:'16px', golge:'0 10px 22px rgba(90,60,150,.16)', yazi:'Inter, system-ui, sans-serif', doku:'none' , dugmeYazi:'#FFFFFF' },
    stil: 'Yön: çağdaş bir SaaS ürün sitesi — yumuşak aurora degradeleri. '
      + 'Zemin açık ve temiz; üstte geniş, bulanık, çok renkli bir ışık '
      + 'halesi (lavanta → camgöbeği → şeftali) yavaşça dağılsın. '
      + 'Kartlar beyaza yakın ve çok hafif saydam, 1px açık kenarlıklı, '
      + '16-20px yuvarlak köşeli; zeminden **çok geniş ama çok soluk** '
      + 'bir gölgeyle ayrılsın. Vurgu renkleri yalnız degradelerde ve '
      + 'tek ana düğmede görünsün, metin nötr koyu gri kalsın. '
      + 'Başlıklar modern geometrik bir sans, orta-kalın; en büyük '
      + 'başlıkta hafif degrade dolgu kullanabilirsin. İkonlar ince '
      + 'çizgili ve yuvarlak uçlu. Bölüm geçişlerinde sert ayraç '
      + 'çizgisi yerine yumuşak renk sızıntısı olsun. Hiçbir yerde sert '
      + 'gölge, keskin köşe ya da doygun blok renk kullanma.',
    yerlesim: 'Yerleşimi modern bir SaaS ürün sitesi ritminde kur: üstte '
      + 'saydam ve sabit bir gezinme, ortalanmış iri başlık ve tek ana '
      + 'düğme, altında üç sütunlu özellik kartları, ardından geniş bir '
      + 'pano görseli ve sık sorulanlar bölümü. Bölümler tam genişlikte '
      + 'şeritler hâlinde birbirini izlesin.' },
  { anahtar: 'bento', ad: 'Bento / Mozaik Izgara', renk: '#4a7dd4',
    ozet: 'Farklı boyutlarda yumuşak döşemeler, devasa sayılar, gölgesiz, ferah.',
    onizleme: { zemin:'#EFEFF3', kart:'#FFFFFF', metin:'#16181D', soluk:'#767C87', vurgu:'#4A7DD4', kenar:'none', ust:'none', kose:'22px', golge:'0 1px 3px rgba(20,24,32,.07)', yazi:'"DM Sans", Inter, system-ui, sans-serif', doku:'none', dugmeYazi:'#FFFFFF' },
    stil: 'Yön: Apple\'ın tanıtım sayfalarındaki gibi bir **bento** dili. '
      + 'Zemin açık nötr gri; her kart beyaz ve **20-24px yuvarlak '
      + 'köşeli** bir döşeme olsun. Kenarlık kullanma — ayrımı yalnız '
      + 'zemin ile kart arasındaki ton farkı ve çok hafif, geniş '
      + 'yayılan bir gölge yapsın. Her döşemede tek bir fikir olsun ve '
      + 'o döşemenin en önemli sayısını devasa yaz (gövde yazısının 5-6 '
      + 'katı), etiketini küçük ve soluk bırak. Bazı döşemelere kendi '
      + 'hafif renk tonunu ver (buz mavisi, nane, şeftali) ama metin '
      + 'her yerde koyu nötr kalsın. Modern geometrik bir sans kullan, '
      + 'başlıklarda orta-kalın ağırlık. İkonlar dolu ve yumuşak köşeli '
      + 'olsun, kendi renkli yuvarlak zemininin içinde otursun. '
      + 'Gradyan, doku, çerçeve ve sert gölge yok; his temiz, ferah ve '
      + 'tertipli olsun.',
    yerlesim: 'Yerleşimi gerçek bir bento ızgarası olarak kur: eşit sütunlu '
      + 'sıralar yerine farklı boyutlarda döşemeler — biri iki sütun '
      + 'genişliğinde, biri iki satır yüksekliğinde, yanlarında küçük '
      + 'kareler. Gezinmeyi üstte yuvarlak bir ada (pill) içinde topla. '
      + 'Her bölümün kendi bento ızgarası olsun; mobilde döşemeler tek '
      + 'sütuna inip önem sırasına göre dizilsin.' },
  { anahtar: 'gece', ad: 'Gece / Koyu Lüks', renk: '#c08457',
    ozet: 'Mürekkep siyahı zemin, tek bakır vurgu, ince çizgiler; sakin ve pahalı.',
    onizleme: { zemin:'#0C0C0E', kart:'#16161A', metin:'#F2EFEA', soluk:'#8D8A85', vurgu:'#C08457', kenar:'1px solid rgba(255,255,255,.09)', ust:'none', kose:'12px', golge:'none', yazi:'Inter, "Helvetica Neue", system-ui, sans-serif', doku:'none', dugmeYazi:'#0C0C0E' },
    stil: 'Yön: pahalı bir karanlık arayüz — neon değil, sakin ve '
      + 'ağırbaşlı. Zemin neredeyse siyah, hafif sıcağa çalan mürekkep '
      + 'siyahı; kartlar zeminden yalnız bir-iki ton açık olsun ve '
      + 'gölge yerine **%8-10 saydamlıkta 1px açık kenarlıkla** '
      + 'ayrılsın. Tek metalik vurgu rengi kullan (bakır ya da '
      + 'şampanya) ve bu renk yalnız ana düğmede, aktif menü satırında '
      + 've tek bir rakamda görünsün. Metin kırık beyaz, ikincil metin '
      + 'sıcak gri olsun — saf beyaz kullanma, göz yorulmasın. '
      + 'Başlıklarda orta kalınlık ve hafif geniş harf aralığı; sayılar '
      + 'iri ama ince ağırlıkta. İkonlar ince çizgili ve vurgunun sönük '
      + 'hâlinde. Köşeler ölçülü (10-12px). Parlama, neon, degrade ve '
      + 'camsı bulanıklık yok — derinlik yalnız ton farkından gelsin.',
    yerlesim: 'Yerleşimi sakin bir kontrol paneli gibi kur: solda yalnız ikon '
      + 've tek kelimeden oluşan ince bir menü sütunu, üstte tek '
      + 'satırlık bir başlık şeridi. İçerik çok sayıda küçük kart '
      + 'yerine az sayıda büyük ve ferah alandan oluşsun; bölümleri '
      + 'kutulara hapsetmek yerine ince yatay çizgilerle ayır. Sayfanın '
      + 'sağında dar bir özet sütunu dursun.' },
  { anahtar: 'sakin', ad: 'Sakin / Serin Pastel', renk: '#4e8c79',
    ozet: 'Nane ve adaçayı pastelleri, düz yüzeyler, bol satır aralığı, gölgesiz.',
    onizleme: { zemin:'#EAF2EE', kart:'#FFFFFF', metin:'#22332E', soluk:'#7C908A', vurgu:'#4E8C79', kenar:'1px solid #DCE8E3', ust:'none', kose:'14px', golge:'none', yazi:'"DM Sans", Inter, system-ui, sans-serif', doku:'none', dugmeYazi:'#FFFFFF' },
    stil: 'Yön: serin, ferah ve sakinleştirici bir arayüz; sakinliği '
      + 'boşluktan ve soluk renkten alan, ama ciddiyetini hiç '
      + 'bırakmayan bir kurumsal dil. Palet tamamen '
      + 'serin ve soluk: nane, adaçayı, buz mavisi, kırık beyaz; sıcak '
      + 'renk hiç kullanma. Zemin hafif renkli, kartlar saf beyaz ve '
      + '**tamamen düz** olsun — gölge yok, yalnız çok açık 1px '
      + 'kenarlık. Köşeler ölçülü yuvarlak (12-16px). Satır aralığını '
      + 'bol tut (1.7) ve her bölümün çevresinde geniş boşluk bırak; '
      + 'hiçbir yer sıkışmasın. Yazı tipi yumuşak uçlu geometrik bir '
      + 'sans olsun, başlıklarda en fazla orta kalınlık — ağır/black '
      + 'ağırlık kullanma. Durum rozetleri pastel zeminli ve koyu '
      + 'yazılı olsun, doygun renk kullanma. İkonlar ince çizgili ve '
      + 'yuvarlak uçlu. Hiçbir yerde degrade, doku, gölge ya da canlı '
      + 'renk olmasın.',
    yerlesim: 'Yerleşimi nefes alan tek bir dikey akış olarak kur: dar bir '
      + 'içerik genişliği, bölümler arasında geniş boşluklar ve her '
      + 'bölümde tek bir iş. Gezinme üstte sade ve yalnız yazıyla, '
      + 'mobilde altta yumuşak bir çubuk olsun. Sayıları yan yana üç '
      + 'sakin kart hâlinde ver; liste satırlarını çizgiyle değil '
      + 'boşlukla ayır.' },
  { anahtar: 'terra', ad: 'Toprak / Sıcak Nötr', renk: '#7a8450',
    ozet: 'Kum, kil ve zeytin tonları; geniş kavisler, doğal fotoğraf, olgun duruş.',
    onizleme: { zemin:'#E9E2D6', kart:'#F9F5EE', metin:'#332C22', soluk:'#8B7F6C', vurgu:'#7A8450', kenar:'1px solid #D8CFBF', ust:'none', kose:'16px', golge:'none', yazi:'"Work Sans", Inter, system-ui, sans-serif', doku:'none', dugmeYazi:'#F9F5EE' },
    stil: 'Yön: sıcak toprak tonlarıyla kurulmuş, olgun ve sakin bir '
      + 'modern arayüz — el yapımı ya da rustik değil, temiz ve çağdaş. '
      + 'Palet: kum, kil, kavrulmuş toprak, zeytin yeşili ve koyu '
      + 'kahve. Beyaz yerine kırık krem kullan, saf siyah hiç kullanma. '
      + 'Zemin kumlu bir nötr, kartlar bir ton daha açık olsun; ayrımı '
      + 'gölgeyle değil ince kenarlık ve ton farkıyla yap. Vurgu rengi '
      + 'zeytin ya da terracotta olsun ve yalnız düğmelerde ve aktif '
      + 'durumda görünsün. Köşeler cömertçe yuvarlak (16px) ama '
      + 'abartısız. Fotoğraf kullanılacaksa doğal ışıklı, düşük '
      + 'doygunlukta ve sıcak tonlu olsun. Yazı tipi açık ve yuvarlak '
      + 'harfli humanist bir sans; istersen başlıklarda ince bir '
      + 'serifle ikili kur. Gölge, parlaklık, degrade ve doygun renk '
      + 'yok.',
    yerlesim: 'Yerleşimi geniş ve ferah kur: en üstte tam genişlikte sıcak '
      + 'tonlu bir görsel şerit ve üstünde tek bir başlık, altında '
      + 'ikişerli kart satırları. Menü üstte yatay ve yazıyla dursun; '
      + 'bölümleri ince kum rengi çizgilerle ayır. Sayfayı geniş, koyu '
      + 'toprak renkli bir alt bilgi bloğuyla bitir.' },
  { anahtar: 'veri', ad: 'Veri Gazetesi / Grafik Öncelikli', renk: '#1b6e8c',
    ozet: 'Grafik önde, ince cetvel çizgileri, serif manşet, kenarda açıklama notu.',
    onizleme: { zemin:'#F4F6F8', kart:'#FFFFFF', metin:'#152028', soluk:'#6E7C87', vurgu:'#1B6E8C', kenar:'1px solid #DFE5EA', ust:'none', kose:'5px', golge:'none', yazi:'Georgia, "Iowan Old Style", serif', doku:'none', dugmeYazi:'#FFFFFF' },
    stil: 'Yön: ciddi bir gazetenin veri servisi — sayının kendisi değil, '
      + '**anlamı** öne çıksın. İkili tipografi kur: manşet ve '
      + 'başlıklar klasik bir serif, etiketler ve sayılar küçük bir '
      + 'sans. Zemin çok açık soğuk gri, kartlar beyaz; ayrım için '
      + 'gölge değil 1px açık kenarlık ve ince yatay cetvel çizgileri '
      + 'kullan, köşeler neredeyse keskin (4px). Her sayının yanında '
      + 'küçük bir eğilim grafiği (sparkline) ya da yatay çubuk olsun. '
      + 'Tek koyu petrol mavisi vurgu rengi kullan; iyi/kötü ayrımını '
      + 'kırmızı-yeşil yerine **koyu mavi ve kiremit** ile yap. Önemli '
      + 'rakamların yanına kısa açıklama notları ve ince ok işaretleri '
      + 'koy (ör. \'geçen aya göre iki katı\'). Grafiklerde eksen '
      + 'çizgileri çok soluk, veri çizgileri kalın olsun. Süs, gölge, '
      + 'degrade ve ikon kalabalığı yok.',
    yerlesim: 'Yerleşimi bir veri makalesi gibi kur: üstte tek cümlelik iri '
      + 'serif bir manşet, hemen altında ana grafiğin tam genişlikte '
      + 'hâli, sonra iki-üç sütunlu küçük grafik ızgarası, en altta '
      + 'ayrıntılı tablo. Menü üstte ince bir şeritte, bölüm '
      + 'bağlantıları yan yana dursun. Grafiklerin sağında dar bir '
      + 'açıklama sütunu bırak.' },
  { anahtar: 'canli', ad: 'Canlı Blok / Yüksek Kontrast', renk: '#2b4ee6',
    ozet: 'Tek doygun renk her yeri kaplar, tek asit vurgu, düz yüzey, iri manşet.',
    onizleme: { zemin:'#2B4EE6', kart:'#2440CC', metin:'#FFFFFF', soluk:'#BAC6F7', vurgu:'#C8E84B', kenar:'none', ust:'none', kose:'16px', golge:'none', yazi:'Inter, system-ui, "Helvetica Neue", sans-serif', doku:'none', dugmeYazi:'#10193F' },
    stil: 'Yön: cesur, doygun renk bloklarıyla kurulmuş çağdaş bir ürün '
      + 'sitesi (modern fintek uygulamalarının dili). Zemin nötr '
      + 'olmasın — koyu ve doygun tek bir ana renk (elektrik kobalt) '
      + 'bütün sayfayı kaplasın; kartlar bu rengin bir ton koyusu olsun '
      + 've üzerlerindeki yazı beyaz kalsın. Yalnız bir-iki blok saf '
      + 'beyaz zeminli olup koyu yazı taşısın — bu bloklar sayfanın en '
      + 'önemli yerleri olsun. İkinci renk olarak **tam zıt, çok parlak '
      + 'bir vurgu** seç (limon/asit yeşili) ve yalnız ana düğmede, '
      + 'aktif menü satırında ve tek bir rakamda kullan. Başlıklar çok '
      + 'iri ve ağır (black/extrabold), harf araları sıkı olsun; gövde '
      + 'yazısı normal kalınlıkta ve küçük kalsın — kontrast tamamen '
      + 'ölçek farkından gelsin. İkincil yazılar rengin açık tonu '
      + 'olsun, gri kullanma; hiçbir yerde okunmayan soluk gri '
      + 'kalmasın. Gölge, degrade, kenarlık ve doku kullanma, her şey '
      + 'düz renk. Köşeler yumuşak (14-18px) ama kart içindeki hizalar '
      + 'keskin. İkonlar dolu ve kalın.',
    yerlesim: 'Yerleşimi tam genişlikte renk şeritlerinin ardı ardına '
      + 'gelmesiyle kur: üstte renk bloğunun içinde duran sade bir '
      + 'menü, altında ekranın yarısını kaplayan iri bir manşet ve tek '
      + 'bir ana düğme; sonra beyaz bir blok, sonra yeniden renkli '
      + 'blok. Sayılar renkli şeritlerin üstünde az sayıda ve çok büyük '
      + 'dursun; uzun listeler beyaz bloklarda toplansın.' },
  { anahtar: 'sinema', ad: 'Sinema / Geniş Perde', renk: '#4fb0ab',
    ozet: 'Kömür zemin, turkuaz-kehribar renk verme, tam taşan görsel, ince iri yazı.',
    onizleme: { zemin:'#141719', kart:'#1D2124', metin:'#EDE7DD', soluk:'#8C9196', vurgu:'#4FB0AB', kenar:'1px solid rgba(255,255,255,.07)', ust:'none', kose:'4px', golge:'none', yazi:'Inter, "Helvetica Neue", sans-serif', doku:'none', dugmeYazi:'#0F1416' },
    stil: 'Yön: sinematik renk verme (color grading) — bir film tanıtım '
      + 'sitesi gibi. Zemin koyu kömür olsun, saf siyah değil. '
      + 'Görselleri tam taşan (full- bleed) ve geniş oranlı kullan, '
      + 'üstlerine alttan yukarı koyulaşan bir perde koy ki yazı '
      + 'okunsun. Renk verme soğuk- sıcak zıtlığı üzerine kurulsun: '
      + 'gölgeler turkuaza, ışıklar kehribara çalsın; bu iki renk '
      + 'dışında renk kullanma. Başlıkları **ince (light) ağırlıkta ama '
      + 'çok iri** yaz, harf araları geniş, gerekirse tamamı büyük '
      + 'harf; gövde yazısı küçük ve soluk kalsın. Kartların köşeleri '
      + 'neredeyse keskin (4px), kenarlık çok soluk, gölge yok. '
      + 'Görsellerin üstüne ince çizgiyle çerçevelenmiş küçük altyazı '
      + 'kutuları koy. Bütün sayfaya çok hafif bir film greni bindir. '
      + 'Parlak, doygun ya da neon hiçbir renk olmasın.',
    yerlesim: 'Yerleşimi geniş perde ritminde kur: en üstte ekranın '
      + 'yüksekliğini kaplayan tam taşan bir görsel ve üstünde '
      + 'ortalanmış ince iri başlık; aşağı indikçe tam genişlikte '
      + 'görsel şeritlerle dar metin blokları sırayla gelsin. Menü en '
      + 'üstte saydam ve ince olsun, sayfa kaydıkça koyulaşsın. '
      + 'Sayıları görselin üstünde, altyazı kutuları gibi göster.' },
];

/* Teknik standardın hangi satırı hangi gruba düşüyor. Eşleşmeyen satır
   Altyapı sayılır — orası omurga. */
const TEKNIK_GRUP = {
  'Dil ve çatı': 'Altyapı', 'Derleme': 'Altyapı', 'Dosya düzeni': 'Altyapı',
  'Barındırma': 'Altyapı', 'Depo': 'Altyapı', 'PWA': 'Altyapı',
  'Paketler': 'Altyapı', 'Geliştirme istekleri': 'Altyapı',
  'Veri': 'Veri', 'Gerçek zamanlı': 'Veri', 'Çevrimdışı': 'Veri',
  'Değişiklik kaydı': 'Veri', 'Dosya saklama': 'Veri', 'Yedek': 'Veri',
  'Giriş': 'Güvenlik',
  'Para birimi': 'Biçim', 'Tarih ve saat': 'Biçim', 'Kayıt numarası': 'Biçim',
  'Sürümleme': 'Biçim', 'Arayüz dili': 'Biçim',
  'Erişilebilirlik': 'Erişilebilirlik', 'Yakınlaştırma': 'Erişilebilirlik',
  'Masaüstü gezinme': 'Tasarım',
};

/* Koddaki teknik standardı tablo satırı biçimine çevirir: eski `ad` alana,
   eski `değer` başlığa, eski `not` tarife düşer. Yalnız tablo boşken
   kullanılır. */
/* ---------- Canonical fallback veri seti (66 standart) ----------
   Tek kaynak: sql/41 canonical taşıması (_canon + _kodmap). ELLE YAZILMADI,
   migration verisinden üretildi. Amaç: DB erişilemediğinde prompt/ekran eski
   77 standarda DÜŞMESİN, canonical 66 ile çalışsın.
   `eski_standartlar` ve DB UUID `id` burada YOK; kimlik `kanonik_id`.
   grup/alan canonical'ın survivor satırından gelir (legacy uyumluluk). */
const STANDART_CANONICAL = [
  {"kanonik_id":"ST-001","ad":"Vanilla JS · HTML · CSS","tip":"VARSAYILAN","kategori":"TECH","aile":null,"grup":"Altyapı","alan":"Dil ve çatı","kural":"Hazır çatı (React, Vue) kullanılmaz; bağımlılık az, ömrü uzun olsun.","kosul":"","istisna":"Proje gereği farklı bir yol gerekiyorsa önce sorulur.","neden":"Az bağımlılık = uzun ömür ve kolay bakım.","kapsam":"nizam","kaynak":"koken_proje","versiyon":1,"a11y":false,"yerel":""},
  {"kanonik_id":"ST-002","ad":"Derleme yok","tip":"VARSAYILAN","kategori":"TECH","aile":null,"grup":"Altyapı","alan":"Derleme","kural":"Dosyalar doğrudan çalışır; build adımı, paket yöneticisi ve node_modules yoktur.","kosul":"","istisna":"","neden":"Kurulumsuz çalışma ve basit yayın.","kapsam":"nizam","kaynak":"koken_proje","versiyon":1,"a11y":false,"yerel":""},
  {"kanonik_id":"ST-003","ad":"Ekran başına ayrı dosya","tip":"KURAL","kategori":"TECH","aile":null,"grup":"Altyapı","alan":"Dosya düzeni","kural":"Her ekran kendi dosyasındadır; tek dosyada 1500 satır aşılmaz.","kosul":"","istisna":"","neden":"Büyük dosyada bir yeri düzeltirken başka yer bozulur.","kapsam":"nizam","kaynak":"koken_proje","versiyon":1,"a11y":false,"yerel":""},
  {"kanonik_id":"ST-004","ad":"Stil sınıf adı tek bileşene aittir","tip":"KURAL","kategori":"TECH","aile":null,"grup":"Altyapı","alan":"Dosya düzeni","kural":"Bir stil sınıfı adı yalnız tek bileşene aittir; yeni ad verirken o ad ve öneki tüm stil dosyasında aranır, çakışırsa yeni önek alınır. Ortak görünüm için ad paylaşılmaz, ortak bir sınıf ikisine birden verilir.","kosul":"","istisna":"","neden":"Aynı ad iki bileşende kuralları sessizce ezer, hata yalnız bozuk hizayla görünür.","kapsam":"nizam","kaynak":"koken_proje","versiyon":1,"a11y":false,"yerel":""},
  {"kanonik_id":"ST-005","ad":"Barındırma: GitHub Pages","tip":"VARSAYILAN","kategori":"TECH","aile":null,"grup":"Altyapı","alan":"Barındırma","kural":"Depoya gönderilen kod kendiliğinden yayınlanır.","kosul":"","istisna":"","neden":"Ayrı dağıtım adımı olmadan yayın.","kapsam":"nizam","kaynak":"koken_proje","versiyon":1,"a11y":false,"yerel":""},
  {"kanonik_id":"ST-006","ad":"Depo: GitHub main dalı","tip":"VARSAYILAN","kategori":"TECH","aile":null,"grup":"Altyapı","alan":"Depo","kural":"Geliştirme main dalında yapılır.","kosul":"","istisna":"","neden":"Tek ve öngörülebilir geliştirme dalı.","kapsam":"nizam","kaynak":"koken_proje","versiyon":1,"a11y":false,"yerel":""},
  {"kanonik_id":"ST-007","ad":"PWA","tip":"VARSAYILAN","kategori":"TECH","aile":null,"grup":"Altyapı","alan":"PWA","kural":"Uygulama ana ekrana eklenebilir; servis işçisi kabuğu önbelleğe alır, sürüm değişince günceller.","kosul":"","istisna":"","neden":"Mobil-masaüstü tek kod, çevrimdışı kabuk.","kapsam":"nizam","kaynak":"koken_proje","versiyon":1,"a11y":false,"yerel":""},
  {"kanonik_id":"ST-008","ad":"Bağımlılık disiplini","tip":"KURAL","kategori":"TECH","aile":null,"grup":"Altyapı","alan":"Paketler","kural":"İstemciye yalnız Supabase istemcisi girer; Excel gerekiyorsa xlsx. Başka paket eklemeden önce sorulur.","kosul":"","istisna":"","neden":"Kontrolsüz bağımlılık ömrü ve güvenliği bozar.","kapsam":"nizam","kaynak":"koken_proje","versiyon":1,"a11y":false,"yerel":"Dış paket kullanılmaz. Excel gerekiyorsa xlsx. Başka paket eklemeden önce sor."},
  {"kanonik_id":"ST-009","ad":"Sürüm, damga ve önbellek birlikte artar","tip":"KURAL","kategori":"TECH","aile":null,"grup":"Altyapı","alan":"Sürümleme","kural":"Yayına giden her değişiklikte üçü birlikte güncellenir: sürüm numarası, dosya adreslerindeki sürüm damgası ve servis işçisi önbellek adı. Damgalı dosyalar önce önbellekten okunur; giriş sayfası damgasız ve her zaman önce ağdan okunur.","kosul":"","istisna":"","neden":"Biri unutulursa kullanıcı eski dosyayla kalır, hata hiçbir yerde görünmez.","kapsam":"nizam","kaynak":"koken_proje","versiyon":1,"a11y":false,"yerel":""},
  {"kanonik_id":"ST-010","ad":"Veri katmanı: Supabase","tip":"VARSAYILAN","kategori":"DATA","aile":null,"grup":"Veri","alan":"Veri katmanı","kural":"Veri Supabase'de durur: Postgres + Auth + Realtime + Storage.","kosul":"Sunuculu proje.","istisna":"","neden":"Tek ve tutarlı veri/oturum/dosya katmanı.","kapsam":"nizam","kaynak":"koken_proje","versiyon":1,"a11y":false,"yerel":"Yerel tarayıcı (IndexedDB). Sunucu yok; bütün kayıtlar cihazda durur, site verisi silinirse kayıtlar da gider — yedeği kullanıcı alır."},
  {"kanonik_id":"ST-011","ad":"Gerçek zamanlı","tip":"KOŞULLU","kategori":"DATA","aile":null,"grup":"Veri","alan":"Gerçek zamanlı","kural":"Başkası bir kaydı değiştirince ekran kendiliğinden tazelenir.","kosul":"Veri katmanı sunucudaysa (ör. Supabase) bu davranış geçerlidir; veri katmanı yalnızca tarayıcı/cihazdaysa `yerel` karşılığı geçerlidir.","istisna":"Gerçek zamanlı veri ihtiyacı yoksa gerekmez; Supabase kullanılması Realtime'ı zorunlu kılmaz.","neden":"Çok kullanıcılı veride tutarlı görünüm.","kapsam":"nizam","kaynak":"koken_proje","versiyon":1,"a11y":false,"yerel":"Yok. Tek cihaz, tek kullanıcı; eşitlenecek başka yer yok."},
  {"kanonik_id":"ST-012","ad":"Çevrimdışı çalışır","tip":"KURAL","kategori":"DATA","aile":null,"grup":"Veri","alan":"Çevrimdışı","kural":"Okuma yerelden yapılır (son görülen veri tarayıcıda durur); yazma kuyruğa girer, internet gelince gönderilir. Çakışırsa son yazan kazanır ve kullanıcıya söylenir.","kosul":"","istisna":"","neden":"Bağlantı kopsa da uygulama kullanılabilir kalır.","kapsam":"nizam","kaynak":"koken_proje","versiyon":1,"a11y":false,"yerel":"Yerelde tüm veri zaten cihazda durur; çevrimdışı doğası gereği çalışır, gönderilecek sunucu/kuyruk yoktur."},
  {"kanonik_id":"ST-013","ad":"Değişiklik kaydı tutulur","tip":"KURAL","kategori":"DATA","aile":null,"grup":"Veri","alan":"Değişiklik kaydı","kural":"Her yazma işleminde kim, ne, ne zaman kaydedilir ve Ayarlar'da listelenir.","kosul":"","istisna":"","neden":"İzlenebilir denetim izi.","kapsam":"nizam","kaynak":"koken_proje","versiyon":1,"a11y":false,"yerel":"Yerelde tutulur; ne ve ne zaman değişti cihazda kaydedilir ve Ayarlar'da listelenir. 'Kim' yok — uygulamayı tek kişi kullanır."},
  {"kanonik_id":"ST-014","ad":"Yedek: dosyaya dışa/içe aktarma","tip":"KOŞULLU","kategori":"DATA","aile":null,"grup":"Veri","alan":"Yedek","kural":"Ayarlar'dan tek dosya olarak indirilir ve geri yüklenir; uygulama yedeği düzenli hatırlatır.","kosul":"Veri katmanı yalnızca tarayıcı/cihazdaysa (sunucusuz) geçerlidir; yedeği almak kullanıcının sorumluluğundadır.","istisna":"","neden":"Sunucusuz veride tek koruma yedektir.","kapsam":"nizam","kaynak":"koken_proje","versiyon":1,"a11y":false,"yerel":"Ayarlar'dan tek dosya olarak indirilir ve geri yüklenir. Sunucu olmadığı için yedeği almak kullanıcının sorumluluğunda; uygulama düzenli hatırlatır."},
  {"kanonik_id":"ST-015","ad":"Yüzde ve özet sayılar hesaplanır, girilmez","tip":"KURAL","kategori":"DATA","aile":null,"grup":"Veri","alan":"Veri katmanı","kural":"İlerleme yüzdesi, doluluk oranı ve benzeri özet sayılar elle girilmez; her zaman alttaki kayıtlardan hesaplanır ve veritabanında saklanmaz, gösterileceği an hesaplanır.","kosul":"","istisna":"Sıralamanın kendisi anlam taşıyan süreç adımları hariç değil — bu kural yalnız özet sayılar içindir.","neden":"Elle girilen özet ilk günden sonra gerçeği göstermeyi bırakır.","kapsam":"nizam","kaynak":"koken_proje","versiyon":1,"a11y":false,"yerel":""},
  {"kanonik_id":"ST-016","ad":"Satır güvenliği her tabloda","tip":"KURAL","kategori":"SECURITY","aile":null,"grup":"Güvenlik","alan":"Veri katmanı","kural":"Her tabloda satır güvenliği (RLS) açıktır ve en az bir okuma, bir yazma kuralı tanımlıdır; kuralı yazılmamış tablo yayına çıkmaz.","kosul":"Veri katmanı sunucudaysa (ör. Supabase) bu davranış geçerlidir; veri katmanı yalnızca tarayıcı/cihazdaysa `yerel` karşılığı geçerlidir.","istisna":"","neden":"Güvenlik açık ama kuralsız tablo herkese kapalı görünür, geliştirici güvenliği yanlışlıkla gevşetir.","kapsam":"nizam","kaynak":"koken_proje","versiyon":1,"a11y":false,"yerel":"Gerek yok. Sunucu yok; veriye yalnız uygulamanın kendisi erişir, kural yazılacak tablo yoktur."},
  {"kanonik_id":"ST-017","ad":"Yetki sunucuda denetlenir","tip":"KURAL","kategori":"SECURITY","aile":null,"grup":"Güvenlik","alan":"Veri katmanı","kural":"Kullanıcının ne görüp değiştirebileceği sunucudaki kurallarla belirlenir. Arayüzde düğme gizlemek yetki denetimi değildir; gizlenen isteğin kendisi de sunucuda engellenir.","kosul":"Veri katmanı sunucudaysa (ör. Supabase) bu davranış geçerlidir; veri katmanı yalnızca tarayıcı/cihazdaysa `yerel` karşılığı geçerlidir.","istisna":"","neden":"Gizlenen düğmenin çağırdığı istek elle gönderilebilir.","kapsam":"nizam","kaynak":"koken_proje","versiyon":1,"a11y":false,"yerel":"Yetki yalnız arayüzde uygulanır; sunucu yok, arayüz tek katmandır."},
  {"kanonik_id":"ST-018","ad":"İstemcide yalnız yayınlanabilir anahtar","tip":"KURAL","kategori":"SECURITY","aile":null,"grup":"Güvenlik","alan":"Veri katmanı","kural":"İstemci koduna yalnız yayınlanabilir (publishable/anon) anahtar girer; veriyi koruyan şey anahtar değil satır güvenliği kurallarıdır. Tüm kuralları atlayan yönetici/service_role anahtarı istemciye, depoya ya da yapılandırmaya hiçbir koşulda yazılmaz.","kosul":"Veri katmanı sunucudaysa (ör. Supabase) bu davranış geçerlidir; veri katmanı yalnızca tarayıcı/cihazdaysa `yerel` karşılığı geçerlidir.","istisna":"","neden":"Gizli anahtar sızarsa tüm güvenlik düşer.","kapsam":"nizam","kaynak":"koken_proje","versiyon":1,"a11y":false,"yerel":"Gerek yok. İstemci-sunucu ayrımı ve anahtar yoktur."},
  {"kanonik_id":"ST-019","ad":"Giriş: e-posta + şifre, kayıt yok","tip":"VARSAYILAN","kategori":"SECURITY","aile":null,"grup":"Güvenlik","alan":"Giriş","kural":"Giriş e-posta ve şifreyledir; kayıt ekranı yoktur, hesabı yönetici açar.","kosul":"Veri katmanı sunucudaysa (ör. Supabase) bu davranış geçerlidir; veri katmanı yalnızca tarayıcı/cihazdaysa `yerel` karşılığı geçerlidir.","istisna":"","neden":"İç araçta açık kayıt istenmez.","kapsam":"nizam","kaynak":"koken_proje","versiyon":1,"a11y":false,"yerel":"Yok. Uygulama açılır açılmaz kullanılır; giriş ekranı, şifre, PIN gibi katman yoktur — cihazın sahibi zaten tek kullanıcıdır."},
  {"kanonik_id":"ST-020","ad":"Dosya saklama: Storage + imzalı adres","tip":"KURAL","kategori":"SECURITY","aile":"FILE_STORAGE","grup":"Veri","alan":"Dosya saklama","kural":"Belge ve müşteriye ait görseller Supabase Storage'da özel klasörde durur (varsayılan konum). Erişim koşulu: herkese açık klasörde tutulmaz, süreli ve imzalı adresle sunulur; adresin tahmin edilebilir olması erişimi engellemez. Profil fotoğrafı gibi zaten herkese görünenler bu erişim kısıtının dışındadır.","kosul":"Veri katmanı sunucudaysa ve dosya saklanıyorsa bu davranış geçerlidir; veri katmanı yalnızca tarayıcı/cihazdaysa `yerel` karşılığı geçerlidir.","istisna":"Profil fotoğrafı genel olabilir.","neden":"Açık klasör + tahmin edilebilir adres veri sızdırır.","kapsam":"nizam","kaynak":"koken_proje","versiyon":1,"a11y":false,"yerel":"Dosyalar cihazda (IndexedDB) durur, imzalı adres yok; tarayıcı doğrudan kendi sakladığından okur ve dosyalar yedeğe dahildir."},
  {"kanonik_id":"ST-021","ad":"Program deposunda guvenlik.json bulunur","tip":"KURAL","kategori":"SECURITY","aile":null,"grup":"Güvenlik","alan":"Güvenlik","kural":"Studio'ya eklenen her programın depo kökünde, adı birebir 'guvenlik.json' olan bir tarif dosyası bulunur; Studio güvenlik testlerini, kurulum dosyalarını ve kurulum sonrası ayarları bu dosyadan okur. Dosya yoksa Studio durmaz, yalnız evrensel denetimleri yapar. Dosya yolları ya da sürüm değişince guvenlik.json aynı commit'te güncellenir.","kosul":"","istisna":"","neden":"Sabit yol her sürümde bozulur; sabit olan tek şey dosyanın adı ve yeridir.","kapsam":"nizam","kaynak":"koken_proje","versiyon":1,"a11y":false,"yerel":""},
  {"kanonik_id":"ST-022","ad":"Para birimi: ₺ TRY","tip":"VARSAYILAN","kategori":"FORMAT","aile":null,"grup":"Biçim","alan":"Para birimi","kural":"Binlik nokta, ondalık virgül: 12.400,00.","kosul":"","istisna":"Proje farklı para birimi gerektirebilir.","neden":"Tutarlı yerel biçim.","kapsam":"nizam","kaynak":"koken_proje","versiyon":1,"a11y":false,"yerel":""},
  {"kanonik_id":"ST-023","ad":"Tarih ve saat biçimi","tip":"VARSAYILAN","kategori":"FORMAT","aile":null,"grup":"Biçim","alan":"Tarih ve saat","kural":"Gün.Ay.Yıl ve 24 saatlik saat: 22.05.2025 · 14:30.","kosul":"","istisna":"","neden":"Tutarlı yerel biçim.","kapsam":"nizam","kaynak":"koken_proje","versiyon":1,"a11y":false,"yerel":""},
  {"kanonik_id":"ST-024","ad":"Kayıt numarası: HARF-SIRA","tip":"VARSAYILAN","kategori":"FORMAT","aile":null,"grup":"Biçim","alan":"Kayıt numarası","kural":"Türü gösteren kısa harf, tire ve sıra numarası: F-1042, S-1001. Sayaç 1'den başlar, yıl başında sıfırlanmaz, boşluk bırakmaz.","kosul":"","istisna":"","neden":"Okunur, çakışmasız kayıt kimliği.","kapsam":"nizam","kaynak":"koken_proje","versiyon":1,"a11y":false,"yerel":""},
  {"kanonik_id":"ST-025","ad":"Uygulama sürüm formatı: YIL.SAYAÇ","tip":"VARSAYILAN","kategori":"FORMAT","aile":null,"grup":"Biçim","alan":"Sürümleme","kural":"Kullanıcıya gösterilen uygulama sürümü YIL.SAYAÇ biçimindedir (örn. 2026.14) ve Ayarlar ekranında görünür.","kosul":"","istisna":"","neden":"Bu, ST-009'daki teknik önbellek/damga mekanizmasından ayrıdır; o mekanik, bu kullanıcıya görünen etikettir.","kapsam":"nizam","kaynak":"koken_proje","versiyon":1,"a11y":false,"yerel":""},
  {"kanonik_id":"ST-026","ad":"Arayüz dili: Türkçe","tip":"VARSAYILAN","kategori":"FORMAT","aile":null,"grup":"Biçim","alan":"Arayüz dili","kural":"Tek dil Türkçedir; metinler koda yazılır, sözlük dosyası yoktur.","kosul":"","istisna":"","neden":"İç araçta tek dil yeterli.","kapsam":"nizam","kaynak":"koken_proje","versiyon":1,"a11y":false,"yerel":""},
  {"kanonik_id":"ST-027","ad":"Sıralama: alfabetik ve arayüz diline göre","tip":"KURAL","kategori":"FORMAT","aile":null,"grup":"Biçim","alan":"Liste ve kartlar","kural":"Kullanıcının taradığı her liste alfabetik sıralanır (menü, gruplar, alt başlıklar, kayıtlar — iç içe tüm kademeler). Sıralama arayüz dilinin harf düzeniyle yapılır: Türkçede ç, ğ, ı, i, ö, ş, ü kendi yerine oturur, sona atılmaz. Ekleme tarihi/sabit dizilim yalnız iki ad birebir aynıysa devreye girer.","kosul":"","istisna":"Sıralamanın kendisi anlam taşıyorsa (süreç adımları, tarihe göre hareket geçmişi, kullanıcının elle dizdiği liste) kendi sırasını korur.","neden":"Sabit sırada kullanıcı yeri ezberler; yanlış harf düzeni aradığını bulduramaz.","kapsam":"nizam","kaynak":"koken_proje","versiyon":1,"a11y":false,"yerel":""},
  {"kanonik_id":"ST-028","ad":"Dokunma hedefi ve kontrast","tip":"KURAL","kategori":"A11Y","aile":"TOUCH_TARGET","grup":"Erişilebilirlik","alan":"Dokunma ve kontrast","kural":"Dokunma hedefi en az 44×44px, metin kontrastı en az 4.5:1'dir. Düğmenin dokunma alanı içindeki simgeyle sınırlı tutulmaz; simge küçük olsa da basılan alan en az 44px kalır (çerçevesiz, yalnız simgeli düğmelerde en çok atlanan yer).","kosul":"","istisna":"","neden":"Küçük hedef ve düşük kontrast erişimi engeller.","kapsam":"nizam","kaynak":"koken_proje","versiyon":1,"a11y":true,"yerel":""},
  {"kanonik_id":"ST-029","ad":"backdrop-filter kaydırılan listede kullanılmaz","tip":"KURAL","kategori":"PERF","aile":null,"grup":"Optimizasyon","alan":"Bulanıklık","kural":"Bulanıklık kaydırılan içerikte kullanılmaz (her karede yeniden hesaplanır, takılma yapar). Bulanıklık sabit bir görselin arkasındaysa görselin kendisine pişirilir. Yalnız yerinde duran tek bir yüzey (alt çubuk gibi) buzlu cam olabilir.","kosul":"","istisna":"Yerinde duran tek yüzey.","neden":"Kaydırmada sürekli yeniden hesap performansı düşürür.","kapsam":"nizam","kaynak":"koken_proje","versiyon":1,"a11y":false,"yerel":""},
  {"kanonik_id":"ST-030","ad":"Görseller WebP ve tek kopya","tip":"KURAL","kategori":"PERF","aile":null,"grup":"Optimizasyon","alan":"Görsel ağırlığı","kural":"Fotoğraflar WebP saklanır; eski biçimdeki kopya işi bitince depoda bırakılmaz. Görsel ekranda kaplayacağı boyuta küçültülmüş yüklenir. Simge ve çizim işi görseller SVG'dir, fotoğraf biçimine çevrilmez.","kosul":"","istisna":"Vektör dosyalar.","neden":"Tarayıcıda küçültmek indirme süresini gizler, dosyayı küçültmez.","kapsam":"nizam","kaynak":"koken_proje","versiyon":1,"a11y":false,"yerel":""},
  {"kanonik_id":"ST-031","ad":"Arka plan görseli: tek, kırpılmış, ≤200 KB","tip":"KURAL","kategori":"PERF","aile":null,"grup":"Optimizasyon","alan":"Görsel ağırlığı","kural":"Arka plan görseli kullanılacaksa tek tane olur, hedef ekran oranına kırpılır ve 200 KB'ı geçmez; aynı görselin birden çok kopyası üst üste bindirilmez.","kosul":"","istisna":"","neden":"Ağır/çok katmanlı zemin görseli yükü artırır.","kapsam":"nizam","kaynak":"koken_proje","versiyon":1,"a11y":false,"yerel":""},
  {"kanonik_id":"ST-032","ad":"İmza önbelleği kırmaz","tip":"KOŞULLU","kategori":"PERF","aile":null,"grup":"Optimizasyon","alan":"Önbellek","kural":"İmzalı adresle gelen resimler önbelleğe adresin tamamıyla değil, sorgu kısmı atılmış yoluyla kaydedilir. Bir resim değiştirildiğinde o kaydın önbellekten silinmesi gerekir.","kosul":"İmzalı adres (signed URL) kullanılıyorsa.","istisna":"","neden":"Anahtar adresin tamamı olursa tarayıcı aynı resmi her imza yenilenişinde baştan indirir; silinmezse kullanıcı eskisini görmeye devam eder.","kapsam":"nizam","kaynak":"koken_proje","versiyon":1,"a11y":false,"yerel":""},
  {"kanonik_id":"ST-033","ad":"Kritik görseller öncelikli, gerisi tembel yüklenir","tip":"KOŞULLU","kategori":"PERF","aile":null,"grup":"Optimizasyon","alan":"Ön yükleme","kural":"İlk ekran için gerekli kritik görseller (ör. kullanıcının kendi profil fotoğrafı) öncelikli yüklenir; diğer görseller uygun olduğunda tembel (lazy) yüklenebilir.","kosul":"İlk ekranda görünmeyen ya da ilk ekran deneyimi için gerekli olmayan görseller için geçerlidir; ilk ekran için gerekli kritik görseller öncelikli yüklenir.","istisna":"","neden":"Tüm görselleri açılışta zorla indirmek yavaş bağlantıda açılışı geciktirir ve ölçeklenmez; revize edildi (eski 'hepsi açılışta iner' kuralı).","kapsam":"nizam","kaynak":"koken_proje","versiyon":2,"a11y":false,"yerel":""},
  {"kanonik_id":"ST-034","ad":"Ekran tepesinde kalıcı açıklama şeridi olmaz","tip":"KURAL","kategori":"UI","aile":null,"grup":"Tasarım","alan":"Açıklama şeridi","kural":"Bir ekranın tepesine her açılışta görünen kalıcı açıklama şeridi konmaz; ekran kendini yerleşimiyle anlatır. Açıklama gerekiyorsa üç yerden birine gider: boş durum metni, ilgili alanın altındaki ipucu ya da işlemi başlatan pencerenin başlığı.","kosul":"","istisna":"","neden":"Okunmayan tekrar metin yalnız yer kaplar, içeriği aşağı iter.","kapsam":"nizam","kaynak":"koken_proje","versiyon":1,"a11y":false,"yerel":""},
  {"kanonik_id":"ST-035","ad":"Üst çubuk kompozisyonu","tip":"KURAL","kategori":"UI","aile":"APP_HEADER","grup":"Tasarım","alan":"Üst çubuk","kural":"Üst çubukta solda logo ve marka, altında bulunulan sayfanın adı (yol izi = geri oku + başlık; ayrı 'Ana Sayfa › Raporlar' satırı olmaz), sağda kullanıcı çipi (avatar, ad ve rol bir arada, dokununca menü) bulunur. Araç düğmeleri üst çubuğa dizilmez; not defteri, bildirim, destek, çıkış gibi araçlar kullanıcı çipine basınca açılan panelin satırlarıdır.","kosul":"","istisna":"","neden":"Tek ve öngörülebilir başlık düzeni; yalnız avatar kimin girdiğini belirsiz bırakır.","kapsam":"nizam","kaynak":"koken_proje","versiyon":1,"a11y":false,"yerel":""},
  {"kanonik_id":"ST-036","ad":"Geri oku her ekranda durur","tip":"KURAL","kategori":"UI","aile":"APP_HEADER","grup":"Tasarım","alan":"Üst çubuk","kural":"Geri oku üst çubuğun solunda, açılış ekranı dışındaki her ekranda çalışır ve bir kat yukarı çıkarır (alt sayfadan üst sayfaya, oradan listeye). Sabit bir hedefe atlamak geri gitmek değildir.","kosul":"","istisna":"Açılış ekranı.","neden":"Sönük/eksik geri oku 'buradan çıkamıyorum' hissi verir.","kapsam":"nizam","kaynak":"koken_proje","versiyon":1,"a11y":false,"yerel":""},
  {"kanonik_id":"ST-037","ad":"Üst çubuk yerleşimi kaymaz","tip":"KURAL","kategori":"UI","aile":"APP_HEADER","grup":"Tasarım","alan":"Üst çubuk","kural":"Bazı ekranlarda görünüp bazılarında görünmeyen bir düğmenin yeri her ekranda ayrılır; görünmediği yerde gizlenmez, pasifleşir ve solar. Üst çubuk sayfadan sayfaya yer değiştirmez ve geçiş sırasında solmaz.","kosul":"","istisna":"","neden":"Düğme gizlenirse logo/marka/başlık kayar, çubuk her geçişte oynuyormuş gibi durur.","kapsam":"nizam","kaynak":"koken_proje","versiyon":1,"a11y":false,"yerel":""},
  {"kanonik_id":"ST-038","ad":"Gezinme: masaüstünde panel, telefonda alt çubuk","tip":"KURAL","kategori":"UI","aile":"NAV","grup":"Tasarım","alan":"Gezinme","kural":"900px ve üstünde alt sekme çubuğu gizlenir, gezinme solda dikey panele döner; alt çubuk yalnız telefon ve tablette görünür. Aynı bölüm iki yerde birden gösterilmez, seçili çubuk dokusu ikisinde de aynıdır.","kosul":"","istisna":"","neden":"Ekran boyutuna uygun tek gezinme.","kapsam":"nizam","kaynak":"koken_proje","versiyon":1,"a11y":false,"yerel":""},
  {"kanonik_id":"ST-039","ad":"Alt çubuk görünümü","tip":"VARSAYILAN","kategori":"UI","aile":"BOTTOM_NAV","grup":"Tasarım","alan":"Alt çubuk","kural":"900px altında ekranın dibinde sekme çubuğu gelir; sekme sayısı beşi geçmez. Çubuk yerleşimin parçası değildir, içeriğin üstünde durur ve sayfa altından akar — içeriğe çubuk yüksekliği kadar alt pay verilir. Zemin buzlu camdır; tarayıcı desteklemiyorsa düz koyu zemine düşülür.","kosul":"","istisna":"","neden":"Son satır çubuğun altında kalmamalı.","kapsam":"nizam","kaynak":"koken_proje","versiyon":1,"a11y":false,"yerel":""},
  {"kanonik_id":"ST-040","ad":"Alt çubukta kırmızı yalnız aktif sekmede","tip":"VARSAYILAN","kategori":"UI","aile":"BOTTOM_NAV","grup":"Tasarım","alan":"Alt çubuk","kural":"Her sekmede üstte simge, altında küçük yazı bulunur; aktif sekmenin arkasında yumuşak kırmızı bir hap belirir, yazı ve simge kırmızıya döner. Kırmızı bu ekranda başka hiçbir yerde kullanılmaz.","kosul":"","istisna":"","neden":"Vurgu nadir olduğunda vurgudur.","kapsam":"nizam","kaynak":"koken_proje","versiyon":1,"a11y":false,"yerel":""},
  {"kanonik_id":"ST-041","ad":"Alt çubuk ekranın fiziksel dibine oturur","tip":"KURAL","kategori":"UI","aile":"BOTTOM_NAV","grup":"Tasarım","alan":"Alt çubuk","kural":"Ana ekran çizgisinin payı çubuğun içine verilir; tarayıcıda hiç verilmez (tarayıcının kendi çubuğu oradadır). iOS uygulama kipinde durum çubuğu ayarı black olmalıdır.","kosul":"","istisna":"","neden":"black-translucent sayfayı tepeye yapıştırıp altta erişilemeyen boşluk bırakır.","kapsam":"nizam","kaynak":"koken_proje","versiyon":1,"a11y":false,"yerel":""},
  {"kanonik_id":"ST-042","ad":"Profil paneli sonucu kendi içinde gösterir","tip":"KURAL","kategori":"UI","aile":"PROFILE_PANEL","grup":"Tasarım","alan":"Profil paneli","kural":"Profil panelindeki bir satır bir iş başlatıyor ve başka ekran açmıyorsa panel kapanmaz; bekleme ve sonuç o satırın kendisinde görünür. Satır başka bir ekrana götürüyorsa panel kapanır.","kosul":"","istisna":"","neden":"Panel kapanırsa kullanıcı işin sürdüğünü gösteren tek şeyi kaybeder.","kapsam":"nizam","kaynak":"koken_proje","versiyon":1,"a11y":false,"yerel":""},
  {"kanonik_id":"ST-043","ad":"Açılış ekranı minimal ve animasyonsuz","tip":"VARSAYILAN","kategori":"UI","aile":"SPLASH","grup":"Tasarım","alan":"Açılış ekranı","kural":"Ortada logo, altında marka adı, en altta ince ilerleme çubuğu ve tek satır durum yazısı bulunur; toplam süre bir saniyeyi geçmez. Zıplayan/dönen/büyüyen animasyon yoktur, yalnız yumuşak belirme. Açılış bitince ekran silinir, iz bırakmaz.","kosul":"","istisna":"","neden":"Açılış hızlı ve sade olmalı.","kapsam":"nizam","kaynak":"koken_proje","versiyon":1,"a11y":false,"yerel":""},
  {"kanonik_id":"ST-044","ad":"Panel önce nereye gidileceğini gösterir","tip":"VARSAYILAN","kategori":"UI","aile":"DASHBOARD","grup":"Tasarım","alan":"Panel","kural":"Panel sayı dökmez, yol gösterir: bölümlere giden kısayol kartları asıl içeriktir. Aynı sayı hem panelde hem alt çubuk rozetinde tekrarlanmaz. Panel kaydırılmaz, içerik ekrana sığar.","kosul":"","istisna":"","neden":"Panel bir gösterge tablosu değil, yön levhasıdır.","kapsam":"nizam","kaynak":"koken_proje","versiyon":1,"a11y":false,"yerel":""},
  {"kanonik_id":"ST-045","ad":"Ayarlar başlıklı bölümler, satır satır","tip":"VARSAYILAN","kategori":"UI","aile":"SETTINGS","grup":"Tasarım","alan":"Ayarlar","kural":"Ayarlar tek sütun, başlıklı bölümlerden oluşur (Hesap, Uygulama, Bağlantılar). Her bölüm bir kartta satır satır listelenir: solda alan adı, sağda değeri. Değişmeyen bilgiler düz yazı, değişebilenler düğme/anahtar. Çıkış düğmesi en altta, sade ve kırmızı değildir.","kosul":"","istisna":"","neden":"Telefon ayarları gibi öngörülebilir düzen.","kapsam":"nizam","kaynak":"koken_proje","versiyon":1,"a11y":false,"yerel":""},
  {"kanonik_id":"ST-046","ad":"Güncelleme ayarlardaki düğmeyle yapılır","tip":"VARSAYILAN","kategori":"UI","aile":"SETTINGS","grup":"Altyapı","alan":"Ayarlar","kural":"Ayarlar ekranında 'Uygulamayı güncelle' düğmesi ve altında sürüm etiketi bulunur; kullanıcı yeni sürüme oradan geçer. Üst çubukta rozet ya da kendiliğinden yenileme olmaz.","kosul":"","istisna":"","neden":"Güncelleme kullanıcı denetiminde, sessiz değil.","kapsam":"nizam","kaynak":"koken_proje","versiyon":1,"a11y":false,"yerel":""},
  {"kanonik_id":"ST-047","ad":"Boş liste kendini anlatır","tip":"KURAL","kategori":"UI","aile":"EMPTY_STATE","grup":"Tasarım","alan":"Liste ve kartlar","kural":"Hiç kaydı olmayan liste boş bırakılmaz; yerinde üç şey durur: ne olduğu, neden boş olduğu ve buradan çıkmak için basılacak düğme. Filtre yüzünden boşalmış liste ile hiç kaydı olmayan liste aynı metni göstermez.","kosul":"","istisna":"","neden":"'Kayıt bulunamadı' kullanıcıya hata mı yaptı yoksa henüz mü başlamadı demez.","kapsam":"nizam","kaynak":"koken_proje","versiyon":1,"a11y":false,"yerel":""},
  {"kanonik_id":"ST-048","ad":"Izgara kartlarında başlığa sabit yer","tip":"KURAL","kategori":"UI","aile":"LIST","grup":"Tasarım","alan":"Liste ve kartlar","kural":"Yan yana kartlarda başlığa (ve açıklama satırına) en uzun başlığın sürdüğü kadar sabit yer ayrılır; metni kısaltmak yerine yer ayrılır.","kosul":"","istisna":"","neden":"Biri iki satıra sürerken komşusu bir satırda kalırsa ızgara kayar; kısaltma bir dilde tutar öbüründe tutmaz.","kapsam":"nizam","kaynak":"koken_proje","versiyon":1,"a11y":false,"yerel":""},
  {"kanonik_id":"ST-049","ad":"Uzun liste: Daha fazla göster","tip":"VARSAYILAN","kategori":"UI","aile":"LIST","grup":"Biçim","alan":"Uzun liste","kural":"Liste makul bir ilk grup gösterir; altta 'Daha fazla göster' düğmesi basılınca bir grup daha eklenir. Sayfa numarası ya da sonsuz kaydırma kullanılmaz; telefon ve masaüstünde aynı davranış. Grup büyüklüğüne projeye göre karar verilir.","kosul":"","istisna":"","neden":"Öngörülebilir ve tek tip sayfalama.","kapsam":"nizam","kaynak":"koken_proje","versiyon":1,"a11y":false,"yerel":""},
  {"kanonik_id":"ST-050","ad":"Kart zemini tema davranışı","tip":"KOŞULLU","kategori":"UI","aile":"CARD","grup":"Optimizasyon","alan":"Kart zemini","kural":"Arkasında görsel olan kartın zemini yarı saydam bırakılmaz; düz ve dolu bir zemin olur. Rengin açık/koyu seçimi projenin temasına göredir — koyu zemin NIZAM'ın değişmez kuralı değildir.","kosul":"Arkasında görsel olan kartlarda.","istisna":"","neden":"Saydam zemin ekran solarak gelirken altındaki ışığı geçirir ve kart renk kayması yapar; ama renk teması projeye bağlıdır.","kapsam":"nizam","kaynak":"koken_proje","versiyon":2,"a11y":false,"yerel":""},
  {"kanonik_id":"ST-051","ad":"Giriş ekranı: tek kart, kayıt yok","tip":"VARSAYILAN","kategori":"UI","aile":"FORM","grup":"Tasarım","alan":"Giriş ekranı","kural":"Tek kart içinde logo, marka adı, e-posta ve şifre alanları ve tam genişlikte giriş düğmesi bulunur; kayıt ekranı yoktur. Hatalı girişte kart içinde Türkçe kırmızı uyarı satırı çıkar, hata kodu gösterilmez. Giriş sırasında düğme pasifleşir ('Giriş yapılıyor…'). Oturum kalıcıdır.","kosul":"","istisna":"","neden":"Sade ve öngörülebilir giriş.","kapsam":"nizam","kaynak":"koken_proje","versiyon":1,"a11y":false,"yerel":""},
  {"kanonik_id":"ST-052","ad":"Silme davranışı (geri alınabilir/alınamaz)","tip":"KURAL","kategori":"UI","aile":"MODAL","grup":"Tasarım","alan":"Onay penceresi","kural":"Geri alınabilir işlemde ekranı durduran pencere açılmaz: kayıt önce ekrandan kaldırılır, altta birkaç saniyelik 'Geri al' şeridi çıkar, süre dolunca kalıcı silinir. Geri alınamaz işlemde açık onay penceresi çıkar; pencere neyin silineceğini adıyla ve kaç şeyi etkileyeceğini söyler, onay düğmesi 'Tamam' değil yapılacak işin adıdır. İşlemin geri alınabilir olup olmadığı onaydan önce belirtilir. Ekranı durduran pencere yalnız geri alınamaz işler için kullanılır.","kosul":"","istisna":"","neden":"Her silmeye modal sormak yorar; hiç sormamak veri kaybettirir — ikisi ayrılır.","kapsam":"nizam","kaynak":"koken_proje","versiyon":1,"a11y":false,"yerel":""},
  {"kanonik_id":"ST-053","ad":"Geri bildirim: alttan toast","tip":"KURAL","kategori":"UI","aile":"TOAST","grup":"Tasarım","alan":"Bildirim","kural":"Uyarı, onay ve işlem sonucu mesajları alttan kayan bir kartla belirir ve birkaç saniyede kaybolur; ayrı bir 'Gönderildi' ekranı açılmaz, kullanıcı bulunduğu yerde kalır. Ekranı durduran pencereden (modal) ayrıdır — modal yalnız geri alınamaz işler içindir.","kosul":"","istisna":"Uzun süren işte toast yerine yüzdeli ilerleme çubuğu gösterilir (bkz. ST-064).","neden":"Kısa bilgi akışı kullanıcıyı durdurmaz.","kapsam":"nizam","kaynak":"koken_proje","versiyon":1,"a11y":false,"yerel":""},
  {"kanonik_id":"ST-054","ad":"Hata metni ve hata ekranı","tip":"KURAL","kategori":"UI","aile":"ERROR_STATE","grup":"Tasarım","alan":"Uyarı metni","kural":"Gösterilen her hata metni Türkçe ve anlaşılırdır; ne olduğunu ve ne yapılacağını söyler. Sunucudan gelen ham hata ve hata kodu ekrana basılmaz, özür dilenmez, teknik terim kullanılmaz; işlem tamamlanamadıysa kullanıcının girdiği veri silinmez, formda kalır. Bir ekran tümden yüklenemediğinde uyarı simgesi, gündelik dille tek cümle ve 'Tekrar dene' düğmesi gösterilir.","kosul":"","istisna":"","neden":"Ham hata/kod kullanıcıya bir şey anlatmaz.","kapsam":"nizam","kaynak":"koken_proje","versiyon":1,"a11y":false,"yerel":""},
  {"kanonik_id":"ST-055","ad":"Bildirim merkezi","tip":"VARSAYILAN","kategori":"UI","aile":"NOTIFICATION","grup":"Tasarım","alan":"Bildirim merkezi","kural":"Üst çubukta zil simgesi bulunur; okunmamış varsa üzerinde sayı görünür. Listede her satır kısa başlık, bir cümle açıklama ve göreceli zaman içerir; okunmamışlar sol kenardaki nokta ile ayrılır. Satıra tıklanınca ilgili sayfaya gidilir ve okundu sayılır. 'Tümünü okundu işaretle' listenin üstündedir.","kosul":"","istisna":"","neden":"Tutarlı bildirim deneyimi.","kapsam":"nizam","kaynak":"koken_proje","versiyon":1,"a11y":false,"yerel":""},
  {"kanonik_id":"ST-056","ad":"Dosya yükleme deneyimi","tip":"KURAL","kategori":"UI","aile":"FILE_UPLOAD","grup":"Tasarım","alan":"Dosya yükleme","kural":"Yükleme alanı hem tıklanabilir hem sürükle-bırak kabul eder. Yüklemeden önce tür ve boyut denetlenir, sınır aşılırsa Türkçe uyarı verilir. Görseller küçük önizlemeyle, belgeler simge ve adla listelenir; her satırda silme düğmesi bulunur. Yükleme sırasında ilerleme çubuğu görünür ve iptal edilebilir.","kosul":"","istisna":"","neden":"Öngörülebilir ve denetimli yükleme.","kapsam":"nizam","kaynak":"koken_proje","versiyon":1,"a11y":false,"yerel":""},
  {"kanonik_id":"ST-057","ad":"Yükleme öncesi görsel optimizasyonu","tip":"KURAL","kategori":"PERF","aile":"FILE_UPLOAD","grup":"Optimizasyon","alan":"Dosya yükleme","kural":"Seçilen görsel sunucuya gönderilmeden önce tarayıcıda ölçeklenir ve WebP'ye çevrilir; en uzun kenar kullanıma göre sınırlanır — profil 256, logo 512, tam ekran 1600 piksel. Vektör dosyalara dokunulmaz; küçültme başarısız olursa özgün dosya yüklenir.","kosul":"","istisna":"Vektör dosyalar; küçültme başarısızsa özgün dosya.","neden":"Telefon fotoğrafı birkaç MB'tır ve küçük bir alanda gösterilmek üzere herkesçe indirilir.","kapsam":"nizam","kaynak":"koken_proje","versiyon":1,"a11y":false,"yerel":""},
  {"kanonik_id":"ST-058","ad":"Tablo çıktısı: Excel ve PDF","tip":"VARSAYILAN","kategori":"UI","aile":"EXPORT","grup":"Tasarım","alan":"Tablo çıktısı","kural":"Tablo üstünde tek dışa aktar düğmesi Excel ve PDF seçeneği açar. Çıktı ekrandaki filtre ve sıralamaya uyar (tüm veriyi değil). Dosya adı 'ad-tablo-YYYY-AA-GG' biçimindedir. Hazırlanırken düğme pasifleşir ('Hazırlanıyor…'); PDF üst bilgisinde sayfa başlığı ve tarih yer alır.","kosul":"","istisna":"","neden":"Kullanıcı baktığı veriyi dışa alır.","kapsam":"nizam","kaynak":"koken_proje","versiyon":1,"a11y":false,"yerel":""},
  {"kanonik_id":"ST-059","ad":"Tarih filtresi","tip":"VARSAYILAN","kategori":"UI","aile":"DATE_FILTER","grup":"Tasarım","alan":"Tarih filtresi","kural":"Dört seçenek sunulur: Gün, Hafta, Ay, Aralık; varsayılan Ay. Aralıkta iki tarih alanı açılır, bitiş başlangıçtan önce seçilemez. Filtre değişince liste anında yenilenir, sayfa yeniden yüklenmez. Seçim adres çubuğunda saklanır.","kosul":"","istisna":"","neden":"Yenilenince/paylaşılınca aynı görünüm gelsin.","kapsam":"nizam","kaynak":"koken_proje","versiyon":1,"a11y":false,"yerel":""},
  {"kanonik_id":"ST-060","ad":"Hareket az tutulur","tip":"KURAL","kategori":"UI","aile":"MOTION","grup":"Animasyon","alan":"Geçişler","kural":"Yalnız geçiş ve dokunma tepkisi animasyonlanır; süreler 160-220ms arasındadır. Sayı sayma, parlama ve yaylanma yoktur.","kosul":"","istisna":"Veriyi anlatan hareketler (ilerleme çubuğu dolması) hariç.","neden":"İş uygulaması gün boyu bakılır, hareket yorar.","kapsam":"nizam","kaynak":"koken_proje","versiyon":1,"a11y":false,"yerel":""},
  {"kanonik_id":"ST-061","ad":"Sayfa geçişi solarak gelir","tip":"VARSAYILAN","kategori":"UI","aile":"MOTION","grup":"Animasyon","alan":"Sayfa geçişi","kural":"Sayfa değişince yeni ekran kısa bir soluklaşmayla gelir (~0,25 sn), eskisi anında gider. Kayma, çevirme, büyütme yoktur; üst ve alt çubuk geçişe katılmaz.","kosul":"","istisna":"","neden":"Duran öğeler yerinde kalmalı.","kapsam":"nizam","kaynak":"koken_proje","versiyon":1,"a11y":false,"yerel":""},
  {"kanonik_id":"ST-062","ad":"Liste tek tek belirmez","tip":"KURAL","kategori":"UI","aile":"MOTION","grup":"Animasyon","alan":"Liste ve kartlar","kural":"Kartlar sıraya girip birer birer belirmez; sayfa bir bütün olarak gelir. Yalnızca veriyi anlatan hareketler kalır (ilerleme çubuğunun dolması, sayacın sıfırdan sayması).","kosul":"","istisna":"","neden":"Sahneleme dikkat dağıtır ve yavaş hissettirir.","kapsam":"nizam","kaynak":"koken_proje","versiyon":1,"a11y":false,"yerel":""},
  {"kanonik_id":"ST-063","ad":"Dokunma tepkisi (küçülme)","tip":"KURAL","kategori":"UI","aile":"MOTION","grup":"Animasyon","alan":"Dokunma tepkisi","kural":"Basılan öğe hafifçe küçülür; küçülme oranı sabit bir sayı değil öğenin boyuna göredir — küçük öğe daha çok küçülür, büyük öğe az. Koyu temada zemini koyulaştırmak kullanılmaz; dokunmatik cihazda kalan odak halkası kapatılır. Kullanılamaz durumdaki öğe hiç küçülmez.","kosul":"","istisna":"Kullanılamaz öğe.","neden":"Sabit oran küçük düğmede fark edilmez, dokunuş cevapsız sanılır.","kapsam":"nizam","kaynak":"koken_proje","versiyon":2,"a11y":true,"yerel":""},
  {"kanonik_id":"ST-064","ad":"Bekleme (loading) göstergesi","tip":"KURAL","kategori":"UI","aile":"MOTION","grup":"Animasyon","alan":"Dokunma tepkisi","kural":"Süren işi anlatan gösterge iş tam bitene kadar oynar; işlem başarılıysa ama ardından sayfa yenileme/yönlendirme/başka bekleme geliyorsa o da bitene kadar durmaz. Aynı işi başlatan düğme iş sürerken ikinci kez çalışmaz; uzun işte yüzdeli çubuk gösterilir. İşin sürdüğü bilgisi yalnız harekete bırakılmaz: öğenin yazısı da o an ne olduğunu söyler. Hareket azaltma (reduced-motion) açıkken animasyonlar kapanır, geriye yazı ve hareketsiz simge kalır.","kosul":"","istisna":"","neden":"Erken duran gösterge 'bitti' der, kullanıcı hâlâ beklerken başka şeye basar; hareketsiz kullanıcı yalnız animasyondan durumu anlayamaz.","kapsam":"nizam","kaynak":"koken_proje","versiyon":1,"a11y":true,"yerel":""},
  {"kanonik_id":"ST-065","ad":"Geliştirme istekleri Ayarlarda toplanır","tip":"VARSAYILAN","kategori":"UI","aile":"SETTINGS","grup":"Altyapı","alan":"Geliştirme istekleri","kural":"Ayarlar'da 'Geliştirme istekleri' ekranı bulunur: kullanıcı isteğini yazar, liste cihazda birikir, 'Hepsini kopyala' ile tek metin olarak alınır. Sunucuya gitmez, kimseye gönderilmez.","kosul":"","istisna":"","neden":"İstekler tek yerde toplansın, elle iletilsin.","kapsam":"nizam","kaynak":"koken_proje","versiyon":1,"a11y":false,"yerel":""},
  {"kanonik_id":"ST-066","ad":"Commit etiketi: [NS-x]","tip":"KURAL","kategori":"TECH","aile":null,"grup":"Altyapı","alan":"Depo","kural":"Her commit mesajı ilgili görevin [NS-x] etiketiyle başlar; Studio commit'i bu etiketten tanıyıp görevi 'Kontrolde'ye çeker.","kosul":"","istisna":"","neden":"Görev-commit bağı etiketsiz kurulamaz.","kapsam":"nizam","kaynak":"koken_proje","versiyon":1,"a11y":false,"yerel":""},
];
/* Standardın koddaki fallback'i artık canonical 66. Eski 77'lik
   TEKNIK_STANDART/YEREL_STANDART/TEKNIK_GRUP sabitleri yukarıda duruyor ama
   ARTIK KULLANILMIYOR (canonical öncesi; referans/arşiv). Fallback kayıtları
   mevcut kodun beklediği legacy alanları da taşır: `tarif`(=kural), `id`
   (tohum:ST-xxx — gerçek DB UUID'si DEĞİL), `aktif`, `sira`. */
function standartTohum() {
  return STANDART_CANONICAL.map((c, i) => Object.assign({}, c, {
    id: 'tohum:' + c.kanonik_id,
    tarif: c.kural,
    ozet: '',
    aktif: true,
    sira: i,
    tohum: true,
  }));
}

/* Projeye özel teknik alanlar — sihirbazda ve Firma durağında sorulur.
   Projenin `palet` alanında saklanır; ayrı sütun gerekmez. */
const TEKNIK_ALAN = [
  { anahtar: 'veriKatmani', ad: 'Veri katmanı', tur: 'secim',
    secim: ['Supabase (bulut)', 'Yerel tarayıcı'],
    varsayilan: 'Supabase (bulut)', ornek: 'Supabase (bulut)',
    alt: 'Veri nerede duracak? Yerel seçilirse sunucu, giriş ve gerçek zamanlı '
       + 'yok; her şey cihazda kalır ve teknik standardın altı satırı değişir.' },
  { anahtar: 'alanAdi', ad: 'Alan adı', ornek: 'kubban.nizamsoft.com',
    alt: 'Müşteri hangi adresten girecek? Yayın ayarı ve PWA manifesti buna bağlı.' },
];

/* Veri yerelde kalınca teknik standardın altı satırı anlamını yitiriyor:
   sunucu yok, kimlik doğrulama yok, paylaşım yok. Bu satırlar onların
   yerine geçiyor — geri kalan standart aynen duruyor. */
const YEREL_STANDART = {
  'Veri': ['Yerel tarayıcı (IndexedDB)',
    'Sunucu yok. Bütün kayıtlar kullanıcının cihazında durur. Site verisi '
    + 'silinirse kayıtlar da gider — yedeği kullanıcı alır.'],
  'Gerçek zamanlı': ['Yok',
    'Tek cihaz, tek kullanıcı. Eşitlenecek başka bir yer yok.'],
  'Çevrimdışı': ['Gerek yok',
    'Yazma kuyruğu ve çakışma çözümü, senkronize edilecek bir sunucu olunca '
    + 'anlam kazanır. Burada tek cihaz var — yazdığın an kalıcı, kuyruk yok.'],
  'Değişiklik kaydı': ['Yerelde tutulur',
    'Ne, ne zaman değişti cihazda kaydedilir ve Ayarlar\'da listelenir. '
    + '"Kim" yok — uygulamayı tek kişi kullanıyor.'],
  'Dosya saklama': ['Yerel (IndexedDB)',
    'Eklenen dosyalar da cihazda durur; yedeğe dahil edilir.'],
  'Giriş': ['Yok',
    'Uygulama açılır açılmaz kullanılır — giriş ekranı, şifre, PIN gibi '
    + 'hiçbir katman yok. Cihazın sahibi zaten tek kullanıcı.'],
  'Paketler': ['Yok',
    'Dış paket kullanılmaz. Excel gerekiyorsa xlsx. Başka paket eklemeden önce sor.'],
  'Yedek': ['Dosyaya dışa/içe aktarma',
    'Ayarlar\'dan tek dosya olarak indirilir ve geri yüklenir. Sunucu olmadığı '
    + 'için yedeği almak kullanıcının sorumluluğunda; uygulama düzenli olarak hatırlatır.'],
};

/* Rol katmanları: en alttan en üste. Üstteki, alttakinin yetkilerini de alır.
   Virgüllü liste yerine merdiven — çünkü yetki sırası kodu belirliyor. */
/* En üstteki katman her zaman "Admin" — ilk kullanıcı hesabı bu adla
   açılıyor, ladder'da da sabit ve değiştirilemez (bkz. rolMerdiveni). */
const ROL_ORNEK = {
  2: ['Personel', 'Admin'],
  3: ['Personel', 'Amir', 'Admin'],
  4: ['Personel', 'Amir', 'Yönetici', 'Admin'],
  5: ['Personel', 'Amir', 'Müdür', 'Yönetici', 'Admin'],
};

/* Kayıtlı değeri her zaman diziye çevirir. */
function rolListesi(deger) {
  if (Array.isArray(deger)) return deger.filter(Boolean);
  if (!deger) return [];
  return String(deger).split(/\s*[·,>→]\s*/).map(x => x.trim()).filter(Boolean);
}

/* ---- Kurulum aşamaları ----
   AI'ın hepsini bir seferde yazması işi çöpe atıyor: yanlış giden bir şey
   varsa 5000 satır sonra anlaşılıyor. Beş aşamaya bölüyoruz; her aşama
   sonunda kullanıcı deneyip onaylamadan öteki başlamıyor. */
const KURULUM_ADIM = [
  {
    ad: 'İskelet ve tema',
    yap: [
      'Renk, yazı tipi ve ölçüleri tek dosyada değişken olarak tanımla.',
      'Uygulama kabuğunu kur: üst çubuk, gezinme, sayfa genişliği.',
      'Açılış ekranı ve giriş ekranını yap.',
      'Bütün sayfaları boş olarak aç — yalnız başlık ve boş durum.',
    ],
    test: 'Giriş yapılıyor mu, menüden her sayfaya gidiliyor mu, renkler ve '
        + 'yazı tipleri doğru mu? Telefonda ve bilgisayarda ayrı bak.',
  },
  {
    ad: 'Veri ve ana ekranlar',
    yap: [
      'Veritabanı tablolarını ve bağlantıyı kur.',
      'Panel ekranını gerçek veriyle doldur.',
      'Bir liste ekranını tam yap: tablo, arama, filtre, sayfalama.',
      'Telefonda tablonun ne olacağına dair kararı uygula.',
    ],
    test: 'Veriler geliyor mu, tablo okunuyor mu, arama ve filtre çalışıyor mu? '
        + 'Telefonda tablo bozuluyor mu?',
  },
  {
    ad: 'Kayıt işlemleri',
    yap: [
      'Veri giriş ekranını yap: ekleme ve düzenleme.',
      'Detay ekranını yap.',
      'Silme ve onay akışını yap.',
      'Kalan liste ekranlarını aynı kalıpla çoğalt.',
    ],
    test: 'Kayıt ekle, düzenle, sil. Yanlış veri girince ne oluyor? '
        + 'Sildiğini geri alabiliyor musun?',
  },
  {
    ad: 'Uç durumlar ve ayarlar',
    yap: [
      'Boş durum, yükleme ve hata ekranlarını uygula.',
      'Bildirim ve işlem sonucu davranışını uygula.',
      'Ayarlar ekranını, yedeği ve varsa içe aktarmayı yap.',
      'Ayarlar\'a "Geliştirme istekleri" ekranını ekle: istek yaz, listede '
        + 'biriksin, hepsini tek metin olarak kopyala.',
      'Rolleri ve yetkileri bağla.',
    ],
    test: 'İnterneti kes, ne oluyor? Hiç kayıt yokken ekran ne diyor? '
        + 'Yetkisiz kullanıcı neyi göremiyor?',
  },
  {
    ad: 'Hareket ve cila',
    yap: [
      'Sayfa geçişi, dokunma tepkisi ve açılma animasyonlarını ekle.',
      'Güncelleme akışını ve sürüm etiketini kur.',
      'Erişilebilirliği gözden geçir: dokunma hedefleri, kontrast, odak.',
      'Performans: gereksiz yeniden çizimleri temizle.',
    ],
    test: 'Eski bir telefonda akıcı mı? Animasyonlar yorucu mu? '
        + 'Güncelleme düğmesi gerçekten yeni sürümü getiriyor mu?',
  },
];

/* Roller boşsa ya da proje sunucusuzsa (yerelde hesap sistemi kurulamaz,
   roller yazılmış olsa bile) proje tek kullanıcılıktır — yetkiBlogu()
   zaten "giriş yok" diyor. 1. aşamanın "giriş ekranı" ve 4. aşamanın
   "rolleri bağla" maddesi o zaman çelişki üretiyordu; burada projeye göre
   ayıklanıyor. Prompt da (asama/kurulumBlogu), Studio'daki aşama kartı da
   bunu kullanır — ikisi ayrı ayrı çelişkili yazmasın diye tek yerde. */
function kurulumAdimListesi(proje) {
  const rolluMu = rolListesi((proje && proje.palet || {}).roller).length > 0;
  if (rolluMu && sunuculuMu(proje)) return KURULUM_ADIM;

  return KURULUM_ADIM.map((a, i) => {
    if (i === 0) {
      return Object.assign({}, a, { yap: a.yap.map(x =>
        x === 'Açılış ekranı ve giriş ekranını yap.'
          ? 'Açılış ekranını yap — giriş ekranı yok, proje tek kullanıcılık.' : x) });
    }
    if (i === 3) {
      return Object.assign({}, a, {
        yap: a.yap.filter(x => x !== 'Rolleri ve yetkileri bağla.'),
        test: a.test.replace(/\s*Yetkisiz kullanıcı neyi göremiyor\?/, ''),
      });
    }
    return a;
  });
}

/* Bu proje için henüz görülmemiş yeni kararlar.
   Tasarım durağının kendi kararları (eskiden TUM_TASARIM) kalktığı için
   işaretleyecek bir şey kalmadı; çağıranlar bozulmasın diye boş dönüyor. */
function yeniKararlar(palet) {
  return [];
}

/* Standardın yaşayan listesi: tablo doluysa o, boşsa koddaki tohum. */
function standartListesi() {
  const t = (typeof DB !== 'undefined' && Array.isArray(DB.standartlar)) ? DB.standartlar : [];
  return t.length ? t : standartTohum();
}

const GENEL_MODUL = 'Proje Geneli';

/* Veri sunucuda mı duruyor? Seçeneğin metni "Supabase (bulut)" — üç ayrı
   yerde `=== 'Supabase'` diye kontrol edilince hiçbiri tutmuyordu. Ölçüt
   tek yerde: yerel değilse sunucu. */
function sunuculuMu(p) {
  return ((p && p.palet) || {}).veriKatmani !== 'Yerel tarayıcı';
}

/* ---- Sayfa künyesi ----
   AI'ın ekranı tahmin etmeden kurabilmesi için gereken en küçük bilgi:
   ne işe yarar, hangi tür, hangi alanlar, hangi eylemler, kim görür.
   Alan türleri veritabanı sütununu, eylemler düğmeleri, roller RLS
   kurallarını belirliyor. */

const SAYFA_TURU = [
  { ad: 'Liste',   alt: 'Kayıtlar alt alta; ara, filtrele, tıkla',  ekran: 'liste',
    tel: ['ust', 'liste'] },
  { ad: 'Form',    alt: 'Yeni kayıt girme ya da düzenleme',         ekran: 'form',
    tel: ['ust', 'form'] },
  { ad: 'Detay',   alt: 'Tek kaydın bütün bilgileri',               ekran: 'detay',
    tel: ['ustGeri', 'blok'] },
  { ad: 'Panel',   alt: 'Sayaçlar, grafik, özet',                   ekran: 'panel',
    tel: ['ust', 'ikiliKolon'] },
  { ad: 'Takvim',  alt: 'Tarihe göre yerleşim',                     ekran: 'liste',
    tel: ['ust', 'izgara'] },
  { ad: 'Ayarlar', alt: 'Tanım ve seçenek listeleri',               ekran: 'ayarlar',
    tel: ['ust', 'grupluListe'] },
];

const ALAN_TURU = [
  { ad: 'Metin',      alt: 'Kısa yazı — ad, açıklama' },
  { ad: 'Uzun metin', alt: 'Çok satırlı not' },
  { ad: 'Sayı',       alt: 'Adet, miktar' },
  { ad: 'Para',       alt: '₺ tutar' },
  { ad: 'Tarih',      alt: '22.05.2025' },
  { ad: 'Tarih-saat', alt: '22.05.2025 · 14:30' },
  { ad: 'Seçenek',    alt: 'Sabit listeden biri — durum, tür' },
  { ad: 'Evet/Hayır', alt: 'İşaretli mi değil mi' },
  { ad: 'Dosya',      alt: 'Belge ya da fotoğraf' },
  { ad: 'İlişki',     alt: 'Başka bir kayda bağlanır — müşteri, ürün' },
];

/* ---- Kalıplar ----
   Sık tekrar eden yapılar hazır dursun: kullanıcı veri modelini anlatmasın,
   "bu benim durumum" desin. Her kalıbın kendi kısa soruları var; onlar da
   çipten seçiliyor. */
const KALIP = [
  {
    anahtar: 'agac', ad: 'Ağaç liste',
    ozet: 'Klasörün içinde klasör var.',
    ornek: '100 Kasa → 100.01 Merkez Kasa',
    tel: ['ust', 'katlanir'],
    sorular: [
      { anahtar: 'kod', soru: 'Alt kaydın kodu nasıl olsun?',
        secim: ['Üstünden türesin (100 → 100.01)', 'Elle yazılsın'] },
      { anahtar: 'derinlik', soru: 'Kaç kat inebilsin?',
        secim: ['2 kat', '3 kat', 'Sınırsız'] },
      { anahtar: 'acilis', soru: 'Açılışta ne görünsün?',
        secim: ['Yalnız ana kayıtlar', 'Hepsi açık'] },
    ],
  },
  {
    anahtar: 'bacak', ad: 'Çok bacaklı kayıt',
    ozet: 'Bir işlem birden fazla yeri etkiler.',
    ornek: 'Kasadan harcama → kasa, tedarikçi, gider',
    tel: ['ust', 'akis'],
    sorular: [
      { anahtar: 'nasil', soru: 'Etkilenen yerler nasıl belirlensin?',
        secim: ['İşlem tipi seçilince kendiliğinden dolsun', 'Her seferinde elle seçilsin'] },
      { anahtar: 'denge', soru: 'Toplamı denk olmak zorunda mı?',
        secim: ['Evet, denk olmalı', 'Hayır'] },
      { anahtar: 'duzeltme', soru: 'Yanlış kayıt nasıl düzeltilsin?',
        secim: ['Ters kayıtla iptal', 'Düzeltilebilsin', 'Silinebilsin'] },
    ],
  },
  {
    anahtar: 'satir', ad: 'Ana kayıt + satırları',
    ozet: 'Bir kaydın içinde kalem kalem satırlar var.',
    ornek: 'Fatura + kalemleri, sipariş + ürünleri',
    tel: ['ust', 'grupluListe'],
    sorular: [
      { anahtar: 'toplam', soru: 'Üst kaydın tutarı nereden gelsin?',
        secim: ['Satırların toplamı olsun', 'Elle girilsin'] },
      { anahtar: 'satirAlan', tur: 'liste', soru: 'Satırda hangi bilgiler var?',
        alt: 'Örn. ürün, miktar, birim fiyat, tutar' },
      { anahtar: 'bos', soru: 'Satırsız kayıt olabilir mi?',
        secim: ['Hayır, en az bir satır', 'Olabilir'] },
    ],
  },
  {
    anahtar: 'akis', ad: 'Durum akışı',
    ozet: 'Kayıt sırayla el değiştirir.',
    ornek: 'Talep → onay → sipariş → teslim',
    tel: ['adim', 'liste'],
    sorular: [
      { anahtar: 'adimlar', tur: 'liste', soru: 'Hangi durumlardan geçiyor?',
        alt: 'Sırayla yaz: talep, onay, teslim…' },
      { anahtar: 'geri', soru: 'Geri adım atılabilir mi?',
        secim: ['Evet, geri alınabilir', 'Hayır, tek yön'] },
      { anahtar: 'kilit', soru: 'Bitince değişebilir mi?',
        secim: ['Hayır, kilitlenir', 'Değişebilir'] },
    ],
  },
  {
    anahtar: 'stok', ad: 'Stok hareketi',
    ozet: 'Giren çıkar, kalan hesaplanır.',
    ornek: 'Depoya 50 girdi, 12 çıktı, 38 kaldı',
    tel: ['ust', 'listeDuzen'],
    sorular: [
      { anahtar: 'eksi', soru: 'Stok eksiye düşebilir mi?',
        secim: ['Hayır, engellensin', 'Düşebilir ama uyarsın', 'Serbest'] },
      { anahtar: 'yer', soru: 'Birden fazla depo var mı?',
        secim: ['Tek yer', 'Birden fazla depo'] },
      { anahtar: 'maliyet', soru: 'Maliyet nasıl tutulsun?',
        secim: ['Son alış fiyatı', 'Ortalama maliyet', 'Maliyet tutulmasın'] },
    ],
  },
  {
    anahtar: 'takvim', ad: 'Takvim ve çakışma',
    ozet: 'Kayıtlar bir zaman aralığını tutar.',
    ornek: 'Rezervasyon, vardiya, randevu',
    tel: ['ust', 'izgara'],
    sorular: [
      { anahtar: 'cakisma', soru: 'Aynı anda iki kayıt olabilir mi?',
        secim: ['Hayır, çakışma engellensin', 'Olabilir'] },
      { anahtar: 'sure', soru: 'Süre nasıl tutulsun?',
        secim: ['Başlangıç ve bitiş', 'Yalnız gün', 'Başlangıç + süre'] },
    ],
  },
  {
    anahtar: 'sutun', ad: 'Bağlama göre sütun',
    ozet: 'Aynı kayıt, baktığın yere göre farklı sütunlarla.',
    ornek: "320'de fatura no, 108'de valör tarihi",
    tel: ['sekme', 'liste'],
    sorular: [
      { anahtar: 'setler', tur: 'set', soru: 'Hangi yerde hangi sütunlar eklensin?',
        alt: 'Yerin adını yaz, o yere özel sütunları ekle.' },
    ],
  },
  {
    anahtar: 'bakiye', ad: 'Yürüyen bakiye',
    ozet: 'Her satırda kalan ne kadar.',
    ornek: 'Banka ekstresindeki son sütun',
    tel: ['ust', 'listeDuzen'],
    sorular: [
      { anahtar: 'yon', soru: 'Bakiye nasıl hesaplansın?',
        secim: ['Borç − alacak', 'Alacak − borç', 'Hesap türüne göre değişsin'] },
      { anahtar: 'baslangic', soru: 'Nereden başlasın?',
        secim: ['Sıfırdan', 'Devir tutarından'] },
    ],
  },
];

/* Beklenen kayıt sayısı: sayfalama, arama ve liste tekniği buna bağlı.
   "1000 hesap olacak" bilgisi hiçbir yere yazılmıyordu. */
const OLCEK = [
  { ad: 'Az', alt: 'yüzlerce kayıt' },
  { ad: 'Orta', alt: 'birkaç bin kayıt' },
  { ad: 'Çok', alt: 'on binlerce kayıt' },
];

/* Künye eksikse akış ilerlemez: yarım künye AI'a tahmin ettiriyor. */
/* Seçilen kalıbın kendi soruları da cevaplanmalı. */
function kalipTam(k) {
  return (k.kalip || []).every(a => {
    const kl = KALIP.find(x => x.anahtar === a);
    if (!kl) return true;
    return kl.sorular.every(sr => {
      const c = (k.kalipCevap || {})[a + '.' + sr.anahtar];
      if (sr.tur === 'liste') return (c || []).length;
      if (sr.tur === 'set')   return (c || []).length
        && c.every(x => x && x.ad && (x.alanlar || []).length);
      return !!c;
    });
  });
}

/* Eski sürümde sütun setleri düz metin listesiydi; okurken nesneye çeviriyoruz. */
function setListesi(deger) {
  return (deger || []).map(x => typeof x === 'string'
    ? { ad: x, alanlar: [] } : { ad: x.ad || '', alanlar: x.alanlar || [] });
}

/* Sayfa künyesi: yalnız amaç, ekran ve alanlar. Kim görür / kim ne yapar /
   ortak kural modül düzeyinde bir kez soruluyor. */
function kunyeTam(k) {
  if (!k) return false;
  const secenekTam = (k.alanlar || []).every(a =>
    a.tur !== 'Seçenek' || (a.degerler || []).filter(Boolean).length);
  return !!((k.amac || '').trim() && k.tur && (k.alanlar || []).length
    && secenekTam && kalipTam(k));
}

/* Etiket karşılıkları */
const PLATFORM_ADI = { web: 'Web', mobil: 'Mobil', ikisi: 'Web · Mobil' };
const VERI_ADI     = { sifirdan: 'Sıfırdan veritabanı', mevcut: 'Mevcut veritabanı', excel: "Excel'den taşınacak" };
const DURUM_ADI    = { yeni: 'Yeni', gelistiriliyor: 'Geliştiriliyor', kontrolde: 'Kontrolde', tamamlandi: 'Tamamlandı' };

/* Görevin üç hâli. Bilerek üç: işi bitiren onaya gönderiyor, veren onaylıyor
   ve görev ancak o zaman kapanıyor — tek taraflı kapanan iş kontrol
   edilmeden bitmiş sayılıyordu. */
/* Görev neyle ilgili: hiçbiriyle (Genel), bir müşteri projesiyle ya da
   Studio'nun kendisiyle. Proje seçilince konu zaten 'proje' oluyor. */
const GOREV_KONU = {
  genel:  { ad: 'Genel',        kisa: 'Genel' },
  proje:  { ad: 'Bir proje hakkında', kisa: 'Proje' },
  studio: { ad: 'Nizam Studio', kisa: 'Nizam Studio' },
};

/* Görevin ekranda görünen aşaması. `durum` sütununda üç değer var
   (bekliyor · bitirdi · onaylandi); plan adımı onun içinde, `plan` ve
   `plan_onay` alanlarından türüyor — böylece durum sütununa dokunmadan
   araya bir onay basamağı girdi. */
const GOREV_ASAMA = {
  plansiz:   { ad: 'Plan bekleniyor',    sinif: 'bekliyor'  },
  planda:    { ad: 'Plan onayı bekliyor', sinif: 'bitirdi'   },
  basladi:   { ad: 'Devam ediyor',       sinif: 'bekliyor'  },
  bitirdi:   { ad: 'Onay bekliyor',      sinif: 'bitirdi'   },
  onaylandi: { ad: 'Onaylandı',          sinif: 'onaylandi' },
};

const GOREV_DURUM = {
  bekliyor:  { ad: 'Bekliyor',  sinif: 'bekliyor' },
  bitirdi:   { ad: 'Onay bekliyor', sinif: 'bitirdi' },
  onaylandi: { ad: 'Onaylandı', sinif: 'onaylandi' },
};

/* Muhasebe şablonu — proje kopyalarken seçilebilen tek şablon türü.
   Bu üç bankanın ekstre yapısı zaten programda hazır kayıtlı; başka bir
   banka gerekirse "ekle" ile aynı excel-öğret akışından geçiyor.
   `yapi`: gerçek şablon kodundan (GZNAS-GznMuhasebe) çıkarılmış, o bankanın
   ekstresinin tam olarak nasıl okunduğunu anlatan metin — Temel tanımlar'da
   "Yapıyı gör" ile açılıyor. Amacı kod üretmek değil, yeni bir banka/sistem
   anlatılırken referans olması: aynı ayrıntı seviyesinde yazmaya yardımcı. */
const SABLON_BANKA_HAZIR = [
  { anahtar: 'garanti', ad: 'Garanti BBVA', yapi:
    'Garanti ekstresi .xls uzantılı ama içeriği eski Excel (OLE2) formatında ' +
    'geliyor. Başlık satırı sabit değil, dosyada "TARİH / AÇIKLAMA / TUTAR" ' +
    'yazan satır aranarak bulunuyor (genelde 14. satır). Sütun sırası sabit: ' +
    'Tarih, Açıklama, işlem etiketi, Tutar (tek imzalı sütun — pozitif giriş, ' +
    'negatif çıkış), Bakiye, Dekont No, Terminal No, Kart Tipi, Komisyon. ' +
    'Sayılar Türkçe biçimde (nokta binlik, virgül ondalık). POS satırları ' +
    'açıklamada "PK" önekiyle tanınıyor, gün sonu tarihi açıklamadaki gün/ay ' +
    'bilgisinden çıkarılıyor; komisyon bazen ayrı sütunda bazen açıklama ' +
    'içinde "K: 21,18" şeklinde geliyor, ikisi de destekleniyor. Satırlar ' +
    'eskiden yeniye sıralı geliyor.' },
  { anahtar: 'kuveyt',  ad: 'Kuveyt Türk', yapi:
    'Kuveyt Türk dosyası .xlsx uzantılı ama içeriği aslında düz bir HTML ' +
    'tablosu. Diğer bankalardan farklı olarak sütunlar sabit numarayla değil ' +
    'başlık adından bulunuyor, çünkü Kuveyt Türk zaman zaman raporun düzenini ' +
    'değiştiriyor (bazen araya "Referans Kodu" giriyor). Aranan başlıklar: ' +
    '"İŞLEM TARİHİ/TARİH", "AÇIKLAMA", "TUTAR/İŞLEM TUTARI", isteğe bağlı ' +
    '"BAKİYE" ve bir referans/dekont sütunu. Bu bankada POS komisyonu hiç ' +
    'kesilmiyor (sıfır kabul ediliyor). Gün sonu tarihi açıklamadaki "Bloke ' +
    'Tarihi: 28-04-2026" ifadesinden okunuyor. Kendi hesaplar arası virmanlar ' +
    'açıklamadaki "Hesaplar arası" ibaresiyle tanınıyor. Satırlar yeniden ' +
    'eskiye sıralı geliyor.' },
  { anahtar: 'ziraat',  ad: 'Ziraat Bankası', yapi:
    'Ziraat gerçek .xlsx dosyası. Başlık satırı "TARİH / FİŞ NO / AÇIKLAMA" ' +
    'yazan satır aranarak bulunuyor (genelde 5. satır). Sütunlar: Tarih, Fiş ' +
    'No, Açıklama, Tutar, Bakiye. Ziraat\'e özgü nokta: POS/gün sonu bilgisi ' +
    'ayrı sütunlarda değil, tek açıklama metnine sıkıştırılmış geliyor — ' +
    '"İşyeri no:…, Komisyon:…, BT: 13/04/2026, ÇT: 28/04/2026" gibi. BT ' +
    '(satış tarihi) gün sonu tarihi olarak, Komisyon değeri POS komisyonu ' +
    'olarak metinden ayıklanıyor. Fiş No tek başına tekrarlanabildiği için ' +
    '"tarih + fiş no" birlikte tekillik anahtarı olarak kullanılıyor. ' +
    'Satırlar yeniden eskiye sıralı geliyor, sistem bunu kendisi tespit edip ' +
    'çeviriyor.' },
];

/* Aynı mantık fatura & kart tarafında: Paraşüt entegrasyonu zaten hazır. */
const SABLON_FATURA_HAZIR = [
  { anahtar: 'parasut', ad: 'Paraşüt', yapi:
    'Bu, Paraşüt\'ten indirilen "gelen fatura raporu" (.xlsx). Başlık satırı ' +
    'ilk 20 satırda "Belge Türü" hücresi aranarak bulunuyor. Aranan başlıklar ' +
    'arasında Belge Türü, Düzenleme/Vade Tarihi, Tedarikçi, Genel Toplam ' +
    '(TL sütunu varsa o esas alınıyor, yoksa tutar Döviz Kuru ile ' +
    'çarpılıyor), Fatura No, KDV tutarı, Ürün/Hizmet, Miktar, Birim Fiyatı ' +
    'var. Dosya kalem-kalem: bir faturanın başlığı ile ilk kalemi aynı ' +
    'satırda, sonraki kalemler ilk sütun boş bırakılarak devam ediyor. Cari ' +
    'eşleştirme vergi numarasıyla değil unvan birebir eşleşmesiyle yapılıyor. ' +
    'Not: bu dosyada ayrı bir "kredi kartı" bölümü yok — kredi kartı ekstresi ' +
    '(Garanti\'nin kendi kart ekstresi) tamamen ayrı, kendi sütun sırası olan ' +
    'bir dosya (Tarih | İşlem | Etiket | Bonus/Mil | Tutar); bir dosyada ' +
    'birden fazla kart bloğu olabiliyor, her biri "…Numaralı Kart TL Ekstre ' +
    'Bilgileri" satırıyla başlıyor.' },
];

/* Gün Sonu — POS sistemi. Samba'nın rapor okuma kodu zaten var, o yüzden
   hazır seçenek; ama Banka/Fatura'dan farklı olarak yapı metninde bir uyarı
   da taşıyor: raporun GENEL yapısı (bölüm tespiti, sayı formatı) her Samba
   müşterisinde aynı, fakat ikram kategori isimleri ve platform listesi bu
   müşteriye özel — yeni müşteride "Bu firmaya özel" kutusuna yazılıp
   Değişim promptunda Claude'a ayrıca söylenmesi gerekiyor. */
const SABLON_GUNSONU_HAZIR = [
  { anahtar: 'samba', ad: 'Samba', yapi:
    'Samba raporu .xlsx, BÖLÜMLERDEN oluşuyor — bir satırın ilk hücresi ' +
    'dolu, yanındaki iki hücre boşsa o satır bölüm başlığı sayılıyor (sabit ' +
    'satır numarası yok, bu kural tüm bölümlerde geçerli). "Gelirler" ' +
    'bölümünde tutar sütununda: Kredi Kartı ve Nakit kendi alanına, ' +
    '"Y.S. Online" (Yemek Sepeti) ayrı bir tahsilat alanına, kalanlar cari ' +
    'tahsilatı sayılıyor. "Açık Hesap Satışlar" bölümünde tarih, cari adı, ' +
    'tutar sırayla geliyor. Sayılar iki farklı biçimde karışık gelebiliyor ' +
    '(İngilizce "11,860.00" ya da Türkçe "2,00" — ayraç konumuna bakılarak ' +
    'otomatik ayırt ediliyor). Platform tespiti sabit bir liste ile: ' +
    '"yemek sepeti", "getir", "trendyol".\n\n' +
    'DİKKAT — bunlar bu müşteriye özel, yeni müşteride değişir: İkram ' +
    'kategorilerinde gerçek şahıs adları var ("Adem Bey", "Bülent Bey" vb. — ' +
    'bu restoranın kendi personel ikram uygulamasına özgü) ve platform ' +
    'listesi (yemek sepeti/getir/trendyol) bu işletmenin anlaştığı ' +
    'platformları yansıtıyor. Yeni müşteride bunlar tamamen farklı olacak — ' +
    'gerçek isimler ve platformlar "Bu firmaya özel" kutusuna yazılmalı. ' +
    'Raporun genel yapısı (bölüm tespiti, sayı formatı, Gelirler/Açık Hesap ' +
    'sütun düzeni) ise sabit kalıyor.' },
];

/* Template (çekirdek proje) türleri — Ayarlar > Templateler'de "Template
   oluştur" sihirbazında seçtiriliyor. Şu an tek seçenek var ama liste
   olarak sunuluyor: yarın ikinci bir şablon (ör. stok takip) eklenince tek
   satır yeter. `sablon` alanındaki değerle birebir aynı sözlük kullanılıyor
   — bir template'ten kopyalanan proje bu anahtarı `p.palet.sablon` olarak alır. */
/* ==========================================================================
   Paket akışları — bir paketin hangi yol haritasını kullanacağı.
   Akışın kendisi kodda (bkz. projeDuraklari); paket yalnızca hangisini
   seçtiğini söyler. Yeni bir akış eklemek kod işi, paket eklemek değil.
   ========================================================================== */

/* ==========================================================================
   Template kapakları — hazır laptop görselleri ve arka plan renkleri.
   Görseller `kapak/` klasöründe; yenisini eklemek için dosyayı oraya atıp
   buraya bir satır yazmak yetiyor.
   ========================================================================== */

const KAPAK_GORSELLERI = [
  { anahtar: 'muhasebe',   ad: 'Muhasebe',  dosya: 'kapak/muhasebe.webp' },
  { anahtar: 'stok',       ad: 'Stok',      dosya: 'kapak/stok.webp' },
  { anahtar: 'restaurant', ad: 'Restoran',  dosya: 'kapak/restaurant.webp' },
];

const KAPAK_RENKLERI = [
  { anahtar: 'pembe',   ad: 'Pembe',   deger: '#fdf0ef' },
  { anahtar: 'turuncu', ad: 'Turuncu', deger: '#fdf2e7' },
  { anahtar: 'mavi',    ad: 'Mavi',    deger: '#eef3fc' },
  { anahtar: 'yesil',   ad: 'Yeşil',   deger: '#ecf7f1' },
  { anahtar: 'mor',     ad: 'Mor',     deger: '#f2eefc' },
];

const PAKET_AKISLARI = [
  { anahtar: 'ozel',     ad: 'Normal kurulum',
    alt: 'Yapı planlama → Kurulum → Beta' },
  { anahtar: 'muhasebe', ad: 'Hazır programın kurulumu',
    alt: 'Değişim → Test ve Güncelle' },
];

/* ==========================================================================
   Görev durumları — dört tane, sırayla ilerler.
   "Kontrolde" yöneticinin onayını bekliyor demektir.
   Revize ayrı bir durum değil: Kontrolde'den Geliştiriliyor'a geri düşme.
   ========================================================================== */

const DURUMLAR = [
  { anahtar: 'yapilacak',      ad: 'Yapılacak',      sinif: 'todo'  },
  { anahtar: 'gelistiriliyor', ad: 'Geliştiriliyor', sinif: 'dev'   },
  { anahtar: 'kontrolde',      ad: 'Kontrolde',      sinif: 'check' },
  { anahtar: 'tamamlandi',     ad: 'Tamamlandı',     sinif: 'done'  },
];

const DURUM_SIRA = DURUMLAR.map(d => d.anahtar);
const DURUM_GOREV_ADI = Object.fromEntries(DURUMLAR.map(d => [d.anahtar, d.ad]));
const DURUM_SINIF = Object.fromEntries(DURUMLAR.map(d => [d.anahtar, d.sinif]));

/* Hareket geçmişinde gösterilen cümleler */
const HAREKET_ADI = {
  olusturuldu: 'görevi oluşturdu',
  atandi:      'görevi atadı',
  baslandi:    'geliştirmeye başladı',
  kontrole:    'kontrole gönderdi',
  revize:      'revize istedi',
  onaylandi:   'görevi onayladı',
  geri:        'görevi geri aldı',
  bitirdi:     'görevi onaya gönderdi',
};

/* Görev detayındaki geçmiş satırları — yeni görev sisteminin dili.
   HAREKET_ADI hâlâ eski akış ekranlarında kullanılıyor, ona dokunulmuyor. */
const GOREV_HAREKET = {
  olusturuldu: 'Görev verildi',
  atandi:      'Atandı',
  bitirdi:     'Onaya gönderildi',
  onaylandi:   'Onaylandı',
  geri:        'Geri gönderildi',
  baslandi:    'Yeniden açıldı',
};

/* ==========================================================================
   Menü — HTML'e gömülü değil, veri.
   Yeni bir bölüm eklemek için buraya bir satır yazmak yeter;
   yan menü ve mobil sekme çubuğu kendiliğinden oluşur.
   ========================================================================== */

/* `alt: true` olanlar yan menüde ayırıcının altındaki sönük grupta durur —
   her gün girilen yerler değil, ayar ve arşiv niteliğinde ekranlar. */
const MENU = [
  { id: 'panel',       ad: 'Panel',              ikon: 'ev',     tab: true },
  { id: 'projeler',    ad: 'Projeler',           ikon: 'folder', tab: true,  sayac: 'projeler' },
  { id: 'gorevler',    ad: 'Görevler',           ikon: 'check',  tab: true,  sayac: 'gorevler' },
  { id: 'ekip',        ad: 'Ekip',               ikon: 'kisi', sadeceYonetici: true, tab: true },
  { id: 'security',    ad: 'Nizam Security',     ikon: 'gGuvenlik', sadeceYonetici: true },
  /* Standartlar alt çubukta değil — Ayarlar'ın içinden açılıyor. */
  { id: 'sektorler',   ad: 'Sektörler',          ikon: 'folder', sadeceYonetici: true, alt: true },
  { id: 'paketler',    ad: 'Paketler',           ikon: 'paket',  sadeceYonetici: true, alt: true },
  { id: 'standartlar', ad: 'Nizam Standartları', ikon: 'katman', alt: true },
  { id: 'ayarlar',     ad: 'Ayarlar',            ikon: 'disli',  alt: true, tab: true },
];
