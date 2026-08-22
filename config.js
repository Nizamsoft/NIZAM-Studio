/* ==========================================================================
   NIZAM | Studio — Yapılandırma
   Bu dosya her sürümde elle güncellenir.
   ========================================================================== */

const APP = {
  name:     'NIZAM | Studio',
  short:    'NIZAM Studio',
  owner:    'Nizam Soft',
  version: 'v0.22.0',
  build:    '2026-08-20',
  stage: 'Adım 4 · Tasarım önizleme',
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

/* Standart grupları — yalnızca düzenleme penceresindeki hazır öneriler.
   Ekranda sıralama alfabetiktir, buradaki sıra değil. Yeni ad yazılabilir. */
const STANDART_GRUPLARI = ['Arayüz', 'Veri & Çıktı', 'Bildirim', 'Yedekleme', 'Güvenlik'];
const VARSAYILAN_GRUP = 'Arayüz';

/* Marka paletinin alanları — hem prompt hem içe aktarma bu sırayı kullanır. */
const PALET_ALAN = [
  { anahtar: 'tema',    ad: 'Tema',             ornek: 'Koyu', secim: ['Koyu', 'Açık'] },
  { anahtar: 'bg',      ad: 'Arka plan',        ornek: '#0f0e0d', renk: true },
  { anahtar: 'yuzey',   ad: 'Yüzey',            ornek: '#1f1d1b', renk: true },
  { anahtar: 'cizgi',   ad: 'Çizgi',            ornek: '#37322f', renk: true },
  { anahtar: 'metin',   ad: 'Metin',            ornek: '#eceae9', renk: true },
  { anahtar: 'metin2',  ad: 'Metin soft',       ornek: '#b8b2ad', renk: true },
  { anahtar: 'metin3',  ad: 'Metin silik',      ornek: '#7c746e', renk: true },
  { anahtar: 'vurgu',   ad: 'Vurgu',            ornek: '#e5342a', renk: true },
  { anahtar: 'baslik',  ad: 'Başlık yazı tipi', ornek: 'Space Grotesk' },
  { anahtar: 'govde',   ad: 'Metin yazı tipi',  ornek: 'IBM Plex Sans' },
  { anahtar: 'ton',     ad: 'Ton',              ornek: 'sıcak, kurumsal, sade' },
];

/* Arayüz biçimi — Tasarımı belirleme durağında görselli seçilir.
   Değerler projenin `palet` alanında saklanır; ayrı sütun gerekmez.
   `tarif` doğrudan prompta ve NIZAM.md'ye yazılır: AI ne yapacağını buradan okur.
   `coklu` olanlarda birden fazla seçilebilir, seçimler birbirine karışır. */
const TASARIM_ALAN = [
  {
    anahtar: 'kart', ad: 'Kart', alt: 'Uygulamadaki her kutu böyle görünecek.',
    varsayilan: 'Yükseltilmiş', coklu: true,
    secim: [
      { ad: 'Düz',          tarif: 'Gölge yok. Kart yalnızca dolgu farkıyla zeminden ayrılır.' },
      { ad: 'Yükseltilmiş', tarif: 'Yumuşak gölge ve üstte ince ışık çizgisi; kart zeminden kalkık durur.' },
      { ad: 'Çizgili',      tarif: 'Dolgu yok, yalnız 1px çerçeve. En sade ve en hafif görünüm.' },
      { ad: 'Buzlu cam',    tarif: 'Yarı saydam dolgu + backdrop-filter bulanıklık + ince açık çerçeve.' },
      { ad: 'Şerit vurgu',  tarif: 'Sol kenarda 3px vurgu renginde dikey şerit.' },
      { ad: 'Kağıt',        tarif: 'Neredeyse keskin köşe, kaymış sert gölge; basılı kağıt hissi.' },
      { ad: 'Oyulmuş',      tarif: 'Kart zemine gömülü: içte üstten koyu, alttan açık gölge. Kabartmanın tersi.' },
      { ad: 'Işıklı kenar', tarif: 'Kenarda vurgu renginde 1px ışıyan çerçeve ve dışa doğru hafif renkli parıltı.' },
      { ad: 'Degrade',      tarif: 'Dolgu üstten alta yumuşak renk geçişi; üst kenar bir tık açık.' },
      { ad: 'Dokulu',       tarif: 'Dolgunun üzerinde çok ince gren dokusu; matbaa kağıdı hissi.' },
    ],
  },
  {
    anahtar: 'kose', ad: 'Köşe', alt: 'Kutuların ve düğmelerin köşesi.',
    varsayilan: 'Yuvarlak',
    secim: [
      { ad: 'Keskin',   tarif: 'border-radius 0. Teknik ve kurumsal.' },
      { ad: 'Hafif',    tarif: 'border-radius 6px. Nötr, güvenli seçim.' },
      { ad: 'Yuvarlak', tarif: 'border-radius 14px. Modern ve yumuşak.' },
      { ad: 'Hap',      tarif: 'Düğme ve etiketler 999px, kartlar 18px. Canlı ve samimi.' },
      { ad: 'Kesik',    tarif: 'Yuvarlama yok; köşeler 10px 45° pahlı (clip-path). Endüstriyel.' },
      { ad: 'Yaprak',   tarif: 'Çapraz iki köşe 18px yuvarlak, diğer ikisi keskin. Yaprak biçimi.' },
      { ad: 'Kaş',      tarif: 'Üst iki köşe 14px yuvarlak, alt iki köşe keskin. Sekme hissi.' },
    ],
  },
  {
    anahtar: 'yogunluk', ad: 'Yoğunluk', alt: 'Bir ekrana kaç satır sığsın.',
    varsayilan: 'Normal',
    secim: [
      { ad: 'Sıkışık',     tarif: 'Satır 34px, kart içi boşluk 10px. Çok kayıtlı ekranlar için.' },
      { ad: 'Normal',      tarif: 'Satır 44px, kart içi boşluk 14px.' },
      { ad: 'Ferah',       tarif: 'Satır 56px, kart içi boşluk 20px. Az kayıtlı, gösterişli ekranlar için.' },
      { ad: 'Karma',       tarif: 'Liste ve tablolar sıkışık (34px), form ve detay sayfaları ferah (20px boşluk).' },
      { ad: 'Nefesli',     tarif: 'Satırlar sıkı (36px) ama bölümler arası boşluk geniş (32px). Ritim boşlukla kurulur.' },
      { ad: 'Kart dizisi', tarif: 'Satır yok; her kayıt kendi kartında, kartlar arası 10px boşluk.' },
    ],
  },
  {
    anahtar: 'tablo', ad: 'Tablo', alt: 'En çok bakılan ekran. Nasıl okunsun?',
    varsayilan: 'Zebra', coklu: true,
    secim: [
      { ad: 'Çizgisiz',      tarif: 'Ayraç yok; satırlar yalnız boşlukla ayrılır. Kısa listeler için.' },
      { ad: 'Zebra',         tarif: 'Tek sıradaki satırlar hafif açık zeminli. Uzun listede göz kaymaz.' },
      { ad: 'Yatay çizgi',   tarif: 'Her satırın altında 1px çizgi; dikey çizgi yok.' },
      { ad: 'Tam ızgara',    tarif: 'Yatay ve dikey çizgiler. Muhasebe tablosu görünümü.' },
      { ad: 'Kartlı satır',  tarif: 'Her satır kendi mini kartı; aralarında 6px boşluk, ortak çizgi yok.' },
      { ad: 'Gruplu',        tarif: 'Satırlar başlık altında öbeklenir (tarih, kategori); grup başlığı yapışkan.' },
      { ad: 'Rakam hizalı',  tarif: 'Sayısal sütunlar sağa yaslı, mono rakamlı ve binlik ayraçlı.' },
      { ad: 'Vurgulu sütun', tarif: 'İlk sütun kalın yazılır ve yatay kaydırmada yapışık kalır.' },
    ],
  },
  {
    anahtar: 'tablomobil', ad: 'Tablo · telefonda', alt: 'Dar ekranda tablo ne olsun?',
    varsayilan: 'Karta dönüş',
    secim: [
      { ad: 'Karta dönüş',   tarif: 'Her satır kendi kartına dönüşür; sütun adları etiket olur.' },
      { ad: 'Yana kaydır',   tarif: 'Tablo olduğu gibi kalır, yatay kaydırılır. İlk sütun yapışık durur.' },
      { ad: 'Sütun gizle',   tarif: 'Yalnız önemli 2-3 sütun görünür; kalanı hiç gösterilmez.' },
      { ad: 'Aç-kapa satır', tarif: 'Satıra dokununca kalan sütunlar altında açılır, ikinci dokunuşta kapanır.' },
      { ad: 'İki satır',     tarif: 'Her kayıt iki satır: üstte ana bilgi kalın, altta detaylar küçük ve silik.' },
      { ad: 'Tam ekran',     tarif: 'Her kayıt tam ekran bir kart; yatay kaydırarak kayıttan kayda geçilir.' },
    ],
  },
  {
    anahtar: 'dugme', ad: 'Düğme', alt: 'Ana buton nasıl dursun?',
    varsayilan: 'Dolu', coklu: true,
    secim: [
      { ad: 'Dolu',    tarif: 'Ana buton vurgu rengiyle dolu, yazı beyaz/koyu kontrast.' },
      { ad: 'Çizgili', tarif: 'Saydam zemin, vurgu renginde çerçeve ve yazı.' },
      { ad: 'Yumuşak', tarif: 'Vurgu renginin %12 saydam hâliyle dolu, yazı vurgu renginde.' },
      { ad: 'Gölgeli', tarif: 'Dolu düğmenin altında vurgu renginden yumuşak renkli gölge; düğme havada durur.' },
      { ad: 'Degrade', tarif: 'Dolgu vurgu renginden koyusuna 135° geçiş.' },
      { ad: 'Yazı',    tarif: 'Çerçevesiz ve zeminsiz; yalnız vurgu renginde yazı. İkincil eylemler için.' },
      { ad: 'İkonlu',  tarif: 'Her düğmede solda 16px simge, sağında yazı; arada 8px boşluk.' },
    ],
  },
  {
    anahtar: 'simge', ad: 'Simge', alt: 'Tek karar, her ekranı etkiler.',
    varsayilan: 'Çizgi', coklu: true,
    secim: [
      { ad: 'Çizgi',       tarif: 'Yalnız kontur, 1.7px kalınlık, yuvarlak uç. Hafif ve nötr.' },
      { ad: 'Dolu',        tarif: 'Dolgulu, konturasız simgeler. Küçük boyutta daha okunur.' },
      { ad: 'İki katman',  tarif: 'Kontur + arkada aynı rengin saydam dolgusu.' },
      { ad: 'Kalın çizgi', tarif: 'Kontur 2.4px, uçlar yuvarlak. İri ve uzaktan okunur.' },
      { ad: 'Zeminli',     tarif: 'Simge, vurgu renginin %12 saydam hâliyle dolu yuvarlak bir zemin içinde.' },
      { ad: 'Elle çizim',  tarif: 'Düzensiz, hafif titrek kontur; sıcak ve el yapımı his.' },
    ],
  },
];

/* Bir alanın seçili değerleri — her zaman dizi döner.
   Tek seçimliler tek elemanlı; hiç seçilmemişse varsayılan. */
function bicimSecim(palet, alan) {
  const d = (palet || {})[alan.anahtar];
  const dizi = Array.isArray(d) ? d : (d ? String(d).split(/\s*[+,]\s*/) : []);
  const gecerli = dizi.filter(x => alan.secim.some(y => y.ad === x));
  if (!gecerli.length) return [alan.varsayilan];
  return alan.coklu ? gecerli : [gecerli[0]];
}

const GENEL_MODUL = 'Proje Geneli';

/* Etiket karşılıkları */
const PLATFORM_ADI = { web: 'Web', mobil: 'Mobil', ikisi: 'Web · Mobil' };
const VERI_ADI     = { sifirdan: 'Sıfırdan veritabanı', mevcut: 'Mevcut veritabanı', excel: "Excel'den taşınacak" };
const DURUM_ADI    = { yeni: 'Yeni', gelistiriliyor: 'Geliştiriliyor', kontrolde: 'Kontrolde', tamamlandi: 'Tamamlandı' };

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
