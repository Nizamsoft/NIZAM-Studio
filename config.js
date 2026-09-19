/* ==========================================================================
   NIZAM | Studio — Yapılandırma
   Bu dosya her sürümde elle güncellenir.
   ========================================================================== */

const APP = {
  name:     'NIZAM | Studio',
  short:    'NIZAM Studio',
  owner:    'Nizam Soft',
  version: 'v0.137.4',
  build:    '2026-09-17',
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
   Yerine 5 sabit ChatGPT promptu geldi: her biri projenin gerçek ekran
   görüntüsünü girdi alıp yalnız görsel dili değiştiriyor, içerik aynı
   kalıyor. Müşteri beğendiğini seçiyor; gerisi (gerçek renk/tipografi
   uygulaması) artık Studio dışında, doğrudan Claude Code sohbetiyle yapılıyor. */
const TASARIM_YON = [
  { anahtar: 'marka', ad: 'Editoryal / Fotoğraflı', renk: '#c9753c',
    ozet: 'Dergi düzeni: iri serif başlık, gerçek fotoğraf, bol boşluk, tek vurgu.',
    prompt: 'Ekteki mobil ve masaüstü ekran görüntüleri {FIRMA}\'nin gerçek '
      + 'uygulaması. İçeriği, kartları, menüyü olduğu gibi koru, hiçbir öğeyi '
      + 'ekleme/çıkarma — yalnız görsel dili değiştir. Yön: bir dergi kapağı '
      + 'gibi editoryal bir kabuk. Başlıkları iri, oturaklı bir **serif** '
      + 'yazı tipiyle yaz (İnter/Roboto gibi standart bir gövde yazısıyla '
      + 'birlikte kullan). Gerçek fotoğrafı kahraman alanında büyük ve kesintisiz '
      + 'göster, üstüne gradyan bindirme; {SEKTOR} uygun **tek** doygun bir '
      + 'vurgu rengi seç ve bunu yalnız bir-iki küçük vurgulu öğede kullan '
      + '(altı çizili başlık, tek bir rakam, tek bir ikon) — geri kalan her '
      + 'şey kırık beyaz/krem zemin ve siyaha yakın metin. Kartlarda gölge '
      + 'kullanma; bunun yerine üstte ince renkli bir şerit kenarlık olsun, '
      + 'köşeler hafif yuvarlak (6-8px), gradyan ve camsı efekt yok. Bolca boş '
      + 'alan bırak, sıkışık durmasın. Hem mobil hem masaüstü versiyonunu ayrı '
      + 'ayrı çiz.' },
  { anahtar: 'minimal', ad: 'İsviçre Usulü / Sıfır Süs', renk: '#8fae4a',
    ozet: 'Fotoğraf yok, keskin köşe, gölgesiz, ızgara temelli, tek renk.',
    prompt: 'Ekteki mobil ve masaüstü ekran görüntüleri {FIRMA}\'nin gerçek '
      + 'uygulaması. İçeriği, kartları, menüyü olduğu gibi koru, hiçbir öğeyi '
      + 'ekleme/çıkarma — yalnız görsel dili değiştir. Yön: katı İsviçre/Bauhaus '
      + 'usulü minimalizm. **Fotoğrafı tamamen kaldır** — kahraman alanının '
      + 'yerine yalnız düz bir renk bloğu ve iri, kalın bir sayı ya da geometrik '
      + 'bir şekil koy. Geometrik, dar aralıklı bir grotesk yazı tipi kullan '
      + '(Helvetica/Inter tarzı). Renk paleti: bir nötr (siyah/beyaz/gri) ve '
      + 'yalnız **en önemli tek rakam veya düğme** için kullanılan tek bir '
      + 'vurgu rengi — başka hiçbir yerde vurgu rengi tekrarlanmasın. **Hiçbir '
      + 'kartta gölge, gradyan ya da yuvarlatılmış büyük köşe olmasın**; köşeler '
      + 'keskin ya da en fazla 2px. Kartları ayırmak için gölge yerine ince '
      + '1px çizgi kullan. Sıkı bir ızgara hizasına otur, boşluklar matematik '
      + 'gibi eşit. Hem mobil hem masaüstü versiyonunu ayrı ayrı çiz.' },
  { anahtar: 'koyu', ad: 'Camsı / Karanlık Mod', renk: '#5f86c4',
    ozet: 'Koyu zemin, buzlu cam kartlar, neon gradyan kenarlık, mono yazı.',
    prompt: 'Ekteki mobil ve masaüstü ekran görüntüleri {FIRMA}\'nin gerçek '
      + 'uygulaması. İçeriği, kartları, menüyü olduğu gibi koru, hiçbir öğeyi '
      + 'ekleme/çıkarma — yalnız görsel dili değiştir. Yön: gerçek '
      + '**camsı (glassmorphism) karanlık mod**. Zemin neredeyse siyah/çok koyu '
      + 'lacivert. Her kart yarı saydam, arkası bulanık (buzlu cam) bir yüzey '
      + 'olsun, kenarında ince, parlayan bir gradyan çerçeve olsun (ör. '
      + 'mor→camgöbeği ya da pembe→turuncu). Kahraman görselinin arkasına '
      + 'yumuşak, ışıldayan bir gradyan hâle koy. Bütün sayıları/istatistikleri '
      + '**tek aralıklı (monospace)** bir yazı tipiyle yaz, sanki bir bilgi '
      + 'ekranı gibi. İkonlar ince çizgili ve hafif parlayan konturlu olsun, '
      + 'dolu/siyah ikon kullanma. Köşeler geniş yuvarlak (16-20px). İki '
      + 'kontrast neon vurgu rengini birlikte kullan, tek renk yetmesin. Hem '
      + 'mobil hem masaüstü versiyonunu ayrı ayrı çiz.' },
  { anahtar: 'sicak', ad: 'Yumuşak / Oyunbaz', renk: '#c4a05c',
    ozet: 'Neumorfik kabartma kartlar, pastel, blob şekiller, düz illüstrasyon.',
    prompt: 'Ekteki mobil ve masaüstü ekran görüntüleri {FIRMA}\'nin gerçek '
      + 'uygulaması. İçeriği, kartları, menüyü olduğu gibi koru, hiçbir öğeyi '
      + 'ekleme/çıkarma — yalnız görsel dili değiştir. Yön: yumuşak ve oyunbaz, '
      + '**neumorfik (soft-UI)** bir his. Tek renkli sıcak pastel bir zemin '
      + 'üzerinde her kart kendi zemininden **kabartma gibi** yükseliyormuş '
      + 'hissi versin — bunu iki yönlü yumuşak gölgeyle (bir açık, bir koyu) '
      + 'yap, sert kenar çizgisi kullanma. Düğmeler tam yuvarlak (hap biçimi). '
      + 'Zemine dekoratif, bulanık kenarlı büyük "blob" (amorf damla) şekiller '
      + 'serpiştir. Gerçek fotoğraf yerine **düz vektör illüstrasyon** kullan: '
      + 'basit, birkaç renkli, gölgesiz, karikatürsü bir karakter ya da nesne '
      + 'çizimi — fotogerçekçi görsel değil. Yuvarlak hatlı, kalın, samimi bir '
      + 'başlık yazı tipi seç (köşeli hiçbir font kullanma). Bütün köşeler çok '
      + 'yuvarlak, hiçbir yerde keskin çizgi olmasın. Hem mobil hem masaüstü '
      + 'versiyonunu ayrı ayrı çiz.' },
  { anahtar: 'kurumsal', ad: 'Kurumsal / Yoğun Panel', renk: '#6b7178',
    ozet: 'Fotoğraf yok, KPI şeridi, ince çizgili sıkı tablo, koyu lacivert.',
    prompt: 'Ekteki mobil ve masaüstü ekran görüntüleri {FIRMA}\'nin gerçek '
      + 'uygulaması. İçeriği, kartları, menüyü olduğu gibi koru, hiçbir öğeyi '
      + 'ekleme/çıkarma — yalnız görsel dili değiştir. Yön: ciddi bir kurumsal '
      + '**yönetim paneli** (Bloomberg/ERP tarzı), tüketici uygulaması gibi '
      + 'durmasın. **Kahraman fotoğrafını tamamen kaldır**; yerine ince '
      + 'çizgilerle ayrılmış, küçük mini-grafik (sparkline) içeren dar bir KPI '
      + 'şeridi koy. Bütün kartlar dikdörtgen, **köşeler keskin ya da en fazla '
      + '4px**, gölge yok — yalnız 1px ince gri kenarlık. Palet: lacivert/gri '
      + 'tonları ve yalnız tek, soluk bir vurgu rengi; hiçbir yerde canlı/parlak '
      + 'renk kullanma. Yazı boyutlarını küçük ve sıkı tut (gövde 12-13px), '
      + 'satır aralarını dar yap — amaç bol beyaz alan değil, çok bilgiyi düzenli '
      + 'sığdırmak. Sade, dar (condensed) bir kurumsal sans-serif kullan, '
      + 'yuvarlak/samimi hiçbir öğe olmasın. Hem mobil hem masaüstü versiyonunu '
      + 'ayrı ayrı çiz.' },
];

/* ---- Nizam teknik standardı — TOHUM ve YEDEK ----
   Standardın yaşadığı yer artık Supabase'deki `standards` tablosu; oraya
   ekleme kod değiştirmeden, prompt-yapıştır ile yapılıyor. Bu dizi iki iş
   görüyor:
     1. `sql/17-standart.sql` bu içeriği tabloya tohumluyor.
     2. Tablo boşsa (SQL henüz çalıştırılmadıysa ya da erişilemiyorsa)
        prompt teknik standartsız çıkmasın diye buraya düşülüyor.
   Tohumlandıktan sonra doğruluk kaynağı tablodur; buradaki metni
   değiştirmek kurulmuş bir Studio'yu etkilemez.

   Satır biçimi: [ad, değer, not] — dördüncü eleman isteğe bağlı `eklendi`
   damgasıdır. */
const TEKNIK_STANDART = [
  ['Dil ve çatı', 'Vanilla JS · HTML · CSS',
   'Hazır çatı (React, Vue) yok. Bağımlılık az, ömrü uzun.'],
  ['Derleme', 'Yok',
   'Dosyalar doğrudan çalışır. Build adımı, paket yöneticisi, node_modules yok.'],
  ['Dosya düzeni', 'Ekran başına ayrı dosya',
   'Tek dosyada 1500 satırı geçme. Büyük dosyada bir yeri düzeltirken başka yer bozulur.'],
  ['Barındırma', 'GitHub Pages',
   'Depoya gönderilen kod kendiliğinden yayınlanır.'],
  ['Depo', 'GitHub · main dalı', 'Commit başına [NS-x] etiketi.'],
  ['PWA', 'Var',
   'Ana ekrana eklenebilir. Servis işçisi kabuğu önbelleğe alır, sürüm değişince günceller.'],
  ['Veri', 'Supabase',
   'Postgres + Auth + Realtime + Storage. Satır güvenliği (RLS) her tabloda açık.'],
  ['Gerçek zamanlı', 'Her zaman açık',
   'Başkası bir kaydı değiştirince ekran kendiliğinden tazelenir.'],
  ['Çevrimdışı', 'Her zaman çalışır',
   'Okuma yerelden: son görülen veri tarayıcıda durur. Yazma kuyruğa girer, '
   + 'internet gelince gönderilir. Çakışırsa son yazan kazanır ve kullanıcıya söylenir.'],
  ['Değişiklik kaydı', 'Her zaman tutulur',
   'Her yazma işleminde kim, ne, ne zaman kaydedilir. Ayarlarda listelenir.'],
  ['Dosya saklama', 'Supabase Storage',
   'Belge ve logolar özel klasörde, imzalı adresle sunulur. Profil fotoğrafı genel olabilir.'],
  ['Giriş', 'E-posta + şifre',
   'Kayıt ekranı yok; hesabı yönetici açar. Perde arkasında yeni hesap '
   + 'Supabase\'in anon-key ile açık kayıt ucundan açılır ama yetki oradan '
   + 'gelmez — `kullanicilar` tablosundaki satırdan gelir. Satırı olmayan biri '
   + 'boş ekran değil, net bir "hesabın tanımlı değil" mesajı görür.'],
  ['Paketler', 'Yalnız Supabase istemcisi',
   'Excel gerekiyorsa xlsx. Başka paket eklemeden önce sor.'],
  ['Para birimi', '₺ TRY', 'Binlik nokta, ondalık virgül: 12.400,00'],
  ['Tarih ve saat', '22.05.2025 · 14:30', 'Gün.Ay.Yıl ve 24 saatlik saat.'],
  ['Kayıt numarası', 'HARF-SIRA',
   'Kaydın türünü gösteren kısa harf, tire, sıra numarası: F-1042 (fatura), '
   + 'S-1001 (sipariş). Sayaç 1\'den başlar, yıl başında sıfırlanmaz, boşluk bırakmaz.'],
  ['Sürümleme', 'YIL.SAYAÇ', 'Örnek 2026.14. Ayarlar ekranında görünür.'],
  ['Arayüz dili', 'Türkçe', 'Tek dil. Metinler koda yazılır, sözlük dosyası yok.'],
  ['Masaüstü gezinme', 'Alt çubuk yok — solda panel',
   '900px ve üstünde alt sekme çubuğu gizlenir; gezinme solda dikey panele döner. '
   + 'Alt çubuk yalnız telefon ve tablette görünür. Seçilen çubuk dokusu ikisinde de aynıdır.'],
  ['Erişilebilirlik', '44px · 4.5:1',
   'Dokunma hedefi en az 44×44px, metin kontrastı en az 4.5:1.'],
  ['Yakınlaştırma', 'Kapalı',
   'Çift dokunma ve iki parmakla yakınlaştırma kapalı: viewport etiketinde '
   + 'maximum-scale=1, user-scalable=no. Yazı boyutu ayarlardan değişir, '
   + 'sayfa esnetilerek değil.', 'v0.67.0'],
  ['Geliştirme istekleri', 'Ayarlarda toplanır',
   'Ayarlar\'da "Geliştirme istekleri" ekranı olur: kullanıcı isteğini yazar, '
   + 'liste cihazda birikir, "Hepsini kopyala" ile tek metin olarak alınır. '
   + 'Sunucuya gitmez, kimseye gönderilmez.', 'v0.67.0'],
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
function standartTohum() {
  return TEKNIK_STANDART.map(([alan, deger, not, eklendi]) => {
    const y = YEREL_STANDART[alan];
    return {
      id: 'tohum:' + alan,
      grup: TEKNIK_GRUP[alan] || 'Altyapı',
      alan: alan,
      ad: deger,
      ozet: '',
      tarif: not || '',
      yerel: y ? (y[0] + (y[1] ? '. ' + y[1] : '')) : '',
      eklendi: eklendi || '',
      sira: 0,
      tohum: true,
    };
  }).concat(
    /* Yalnız sunucusuz projede anlamı olan satırlar (Yedek gibi) teknik
       standartta karşılığı olmadığı için burada ayrıca ekleniyor. Tarifi
       boş: sunuculu projede hiç yazılmaz. */
    Object.keys(YEREL_STANDART)
      .filter(alan => !TEKNIK_STANDART.some(([a]) => a === alan))
      .map(alan => ({
        id: 'tohum:' + alan, grup: TEKNIK_GRUP[alan] || 'Veri', alan: alan,
        ad: YEREL_STANDART[alan][0], ozet: '', tarif: '',
        yerel: YEREL_STANDART[alan][0]
             + (YEREL_STANDART[alan][1] ? '. ' + YEREL_STANDART[alan][1] : ''),
        eklendi: '', sira: 0, tohum: true,
      })));
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
const CEKIRDEK_TUR_LISTESI = [
  { anahtar: 'muhasebe', ad: 'Muhasebe' },
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
};

/* ==========================================================================
   Menü — HTML'e gömülü değil, veri.
   Yeni bir bölüm eklemek için buraya bir satır yazmak yeter;
   yan menü ve mobil sekme çubuğu kendiliğinden oluşur.
   ========================================================================== */

const MENU = [
  { id: 'panel',       ad: 'Panel',              ikon: 'panel',  tab: true },
  { id: 'projeler',    ad: 'Projeler',           ikon: 'folder', tab: true,  sayac: 'projeler' },
  { id: 'gorevler',    ad: 'Bana Atananlar',     ikon: 'check',  tab: true,  sayac: 'gorevler', tabAd: 'Görevler' },
  /* Standartlar alt çubukta değil — Ayarlar'ın içinden açılıyor. */
  { id: 'sektorler',   ad: 'Sektörler',          ikon: 'folder', sadeceYonetici: true },
  { id: 'sablonlar',   ad: 'Modül Şablonları',   ikon: 'katman', sadeceYonetici: true },
  { id: 'standartlar', ad: 'Nizam Standartları', ikon: 'katman' },
  { id: 'ekip',        ad: 'Ekip',               ikon: 'kisi', sadeceYonetici: true },
  { id: 'ayarlar',     ad: 'Ayarlar',            ikon: 'ayar',   tab: true },
];
