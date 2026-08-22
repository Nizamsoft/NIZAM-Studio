/* ==========================================================================
   NIZAM | Studio — Yapılandırma
   Bu dosya her sürümde elle güncellenir.
   ========================================================================== */

const APP = {
  name:     'NIZAM | Studio',
  short:    'NIZAM Studio',
  owner:    'Nizam Soft',
  version: 'v0.25.1',
  build:    '2026-08-20',
  stage: 'Adım 4 · Tasarım akışı',
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

/* ---- Yerleşim: ekranın iskeleti. Neyin nerede durduğu. ---- */
const YERLESIM_ALAN = [
  {
    anahtar: 'ustcubuk', ad: 'Üst çubuk', alt: 'Her ekranın tepesinde ne dursun?',
    varsayilan: 'İnce başlık',
    secim: [
      { ad: 'Yok',          tarif: 'Üst çubuk yok; sayfa başlığı içeriğin ilk satırı olarak yazılır.', tel: ['blok'] },
      { ad: 'İnce başlık',  tarif: '44px yükseklikte, yalnız sayfa adı ve geri oku.', tel: ['ust', 'blok'] },
      { ad: 'Logo + arama', tarif: 'Solda logo, ortada arama kutusu, sağda profil.', tel: ['ustAra', 'blok'] },
      { ad: 'Sekmeli',      tarif: 'Başlığın altında yatay sekme şeridi; alt sayfalar oradan.', tel: ['ust', 'sekme', 'blok'] },
      { ad: 'Eylemli',      tarif: 'Başlığın sağında o ekranın birincil eylem düğmesi.', tel: ['ustEylem', 'blok'] },
    ],
  },
  {
    anahtar: 'gezinme', ad: 'Gezinme', alt: 'Sayfalar arası nasıl geçilsin?',
    varsayilan: 'Alt sekme',
    secim: [
      { ad: 'Alt sekme',     tarif: 'Altta 4-5 sekme. Telefonda başparmak menzilinde.', tel: ['blok', 'alt'] },
      { ad: 'Alt + orta +',  tarif: 'Alt sekme şeridi, ortasında yükseltilmiş ekleme düğmesi.', tel: ['blok', 'altArti'] },
      { ad: 'Sabit yan menü',tarif: 'Solda hep açık dikey menü. Masaüstü ağırlıklı işler için.', tel: ['yan', 'blok'] },
      { ad: 'Açılır yan menü',tarif: 'Hamburger simgesiyle soldan kayan menü; ekran boşa gitmez.', tel: ['ustMenu', 'blok'] },
      { ad: 'Üst menü',      tarif: 'Üst çubukta yatay menü. Sayfa sayısı azsa yeterli.', tel: ['ustMenuYatay', 'blok'] },
    ],
  },
  {
    anahtar: 'sayfalistesi', ad: 'Sayfa listesi', alt: 'Bir modülün sayfaları nasıl listelensin?',
    varsayilan: 'Üst sekme',
    secim: [
      { ad: 'Yan liste',     tarif: 'Modül seçilince solda o modülün sayfaları listelenir.', tel: ['yanInce', 'liste'] },
      { ad: 'Üst sekme',     tarif: 'Modülün sayfaları üstte yatay sekme olur.', tel: ['sekme', 'liste'] },
      { ad: 'Açılır seçici', tarif: 'Başlığa dokununca sayfa listesi açılır. Az yer kaplar.', tel: ['ustSecici', 'liste'] },
      { ad: 'Kart ızgarası', tarif: 'Modüle girince sayfalar kart ızgarası olarak karşılar.', tel: ['izgara'] },
    ],
  },
  {
    anahtar: 'tablosayfa', ad: 'Tablolu sayfa', alt: 'Liste ekranının iskeleti.',
    varsayilan: 'Üstte filtre', coklu: true,
    secim: [
      { ad: 'Üstte filtre',  tarif: 'Tablonun üstünde arama ve filtre satırı.', tel: ['ara', 'liste'] },
      { ad: 'Solda filtre',  tarif: 'Solda kalıcı filtre paneli, sağda tablo.', tel: ['solPanel', 'liste'] },
      { ad: 'Sağda detay',   tarif: 'Satıra basınca sağdaki bölmede detay açılır; liste kaybolmaz.', tel: ['liste', 'sagPanel'] },
      { ad: 'Özet kartları', tarif: 'Tablonun üstünde o listeye ait 2-3 sayaç kartı.', tel: ['kart2', 'liste'] },
      { ad: 'Sekmeli liste', tarif: 'Durum sekmeleri (Bekleyen · Onaylı · Kapalı) tablonun üstünde.', tel: ['sekme', 'liste'] },
    ],
  },
  {
    anahtar: 'dashboard', ad: 'Dashboard', alt: 'Panel ekranı neyle karşılasın?',
    varsayilan: 'Sayaç + son hareketler',
    secim: [
      { ad: 'Sayaç + büyük grafik', tarif: 'Üstte sayaç şeridi, altında tek büyük grafik.', tel: ['kart2', 'grafik'] },
      { ad: '2×2 ızgara',           tarif: 'Dört eşit kart. Her biri bir gösterge.', tel: ['izgara'] },
      { ad: 'Sol büyük + sağ kolon',tarif: 'Solda büyük grafik, sağda dar kolonda küçük kartlar.', tel: ['ikiliKolon'] },
      { ad: 'Sayaç + son hareketler', tarif: 'Üstte sayaçlar, altında son kayıtlar listesi.', tel: ['kart2', 'liste'] },
    ],
  },
  {
    anahtar: 'verigirisi', ad: 'Veri girişi', alt: 'Kayıt eklerken ekran nasıl açılsın?',
    varsayilan: 'Sağdan çekmece', coklu: true,
    secim: [
      { ad: 'Tam sayfa form',   tarif: 'Ayrı bir sayfaya gidilir; uzun formlar için.', tel: ['ust', 'form'] },
      { ad: 'Sağdan çekmece',   tarif: 'Sağdan kayan panel; liste arkada durur. Telefonda alttan tam boy.', tel: ['liste', 'cekmece'] },
      { ad: 'Ortada pencere',   tarif: 'Ortada küçük pencere. 3-4 alanlık kısa formlar için.', tel: ['liste', 'pencere'] },
      { ad: 'Adım adım sihirbaz', tarif: 'Alanlar adımlara bölünür, üstte ilerleme göstergesi.', tel: ['adim', 'form'] },
      { ad: 'Satırda düzenleme',tarif: 'Tablodaki hücreye dokunup yerinde değiştirme.', tel: ['listeDuzen'] },
    ],
  },
  {
    anahtar: 'ayarlar', ad: 'Ayarlar', alt: 'Ayar ekranı nasıl düzenlensin?',
    varsayilan: 'Gruplu liste',
    secim: [
      { ad: 'Tek liste',    tarif: 'Bütün ayarlar tek bir listede, başlıksız.', tel: ['liste'] },
      { ad: 'Gruplu liste', tarif: 'Ayarlar başlıklı öbeklere ayrılır.', tel: ['grupluListe'] },
      { ad: 'Sol sekmeli',  tarif: 'Solda ayar bölümleri, sağda o bölümün içeriği.', tel: ['yanInce', 'liste'] },
      { ad: 'Arama + gruplu', tarif: 'Tepede ayar araması, altında gruplu liste.', tel: ['ara', 'grupluListe'] },
    ],
  },
  {
    anahtar: 'detay', ad: 'Detay ekranı', alt: 'Bir kaydın kendi sayfası nasıl kurulsun?',
    varsayilan: 'Katlanır bölümler',
    secim: [
      { ad: 'Sekmeli',            tarif: 'Bilgi · Hareketler · Belgeler gibi sekmeler.', tel: ['ust', 'sekme', 'blok'] },
      { ad: 'Tek uzun akış',      tarif: 'Her şey alt alta tek sayfada; kaydırarak gezilir.', tel: ['ust', 'akis'] },
      { ad: 'Sol özet + sağ içerik', tarif: 'Solda kaydın künyesi sabit, sağda değişen içerik.', tel: ['solPanel', 'blok'] },
      { ad: 'Katlanır bölümler',  tarif: 'Bölümler kapalı gelir, dokununca açılır.', tel: ['ust', 'katlanir'] },
    ],
  },
  {
    anahtar: 'anaeylem', ad: 'Ana eylem yeri', alt: 'Ekleme düğmesi nerede dursun?',
    varsayilan: 'Sağ altta yüzen',
    secim: [
      { ad: 'Sağ üstte',       tarif: 'Başlık çubuğunun sağında. Masaüstünde alışılmış yer.', tel: ['ustEylem', 'liste'] },
      { ad: 'Sağ altta yüzen', tarif: 'İçeriğin üzerinde yüzen yuvarlak düğme. Telefonda kolay erişim.', tel: ['liste', 'fab'] },
      { ad: 'Alt çubukta orta',tarif: 'Alt sekme şeridinin ortasında yükseltilmiş düğme.', tel: ['liste', 'altArti'] },
      { ad: 'Sayfa sonunda',   tarif: 'Listenin altında tam genişlikte düğme. Kısa listeler için.', tel: ['liste', 'sonDugme'] },
    ],
  },
  {
    anahtar: 'arama', ad: 'Arama', alt: 'Aramaya nasıl ulaşılsın?',
    varsayilan: 'Üstte sabit',
    secim: [
      { ad: 'Üstte sabit',     tarif: 'Her liste ekranının tepesinde açık arama kutusu.', tel: ['ara', 'liste'] },
      { ad: 'Simgeden açılan', tarif: 'Büyüteç simgesi; dokununca arama çubuğu açılır.', tel: ['ustAra', 'liste'] },
      { ad: 'Ayrı sayfa',      tarif: 'Arama kendi ekranı; tüm modüllerde birden arar.', tel: ['ust', 'ara', 'liste'] },
      { ad: 'Yok',             tarif: 'Arama yok; filtreler yeterli.', tel: ['liste'] },
    ],
  },
  {
    anahtar: 'filtre', ad: 'Filtre', alt: 'Filtreler nerede dursun?',
    varsayilan: 'Üstte çip sırası',
    secim: [
      { ad: 'Üstte çip sırası', tarif: 'Yatay kayan çipler; seçili olan dolu görünür.', tel: ['cip', 'liste'] },
      { ad: 'Açılır panel',     tarif: 'Filtre düğmesi; basınca üstten panel iner.', tel: ['ustEylem', 'liste'] },
      { ad: 'Yan panel',        tarif: 'Solda kalıcı filtre paneli. Çok ölçütlü aramalar için.', tel: ['solPanel', 'liste'] },
      { ad: 'Alttan sayfa',     tarif: 'Alttan yarım sayfa açılır; telefonda rahat.', tel: ['liste', 'altSayfa'] },
    ],
  },
  {
    anahtar: 'genislik', ad: 'Genişlik', alt: 'Masaüstünde içerik ne kadar yayılsın?',
    varsayilan: 'Ortada sınırlı',
    secim: [
      { ad: 'Tam genişlik',   tarif: 'İçerik ekranın tamamını kullanır. Geniş tablolar için.', tel: ['blokTam'] },
      { ad: 'Ortada sınırlı', tarif: 'En fazla 1200px, ortalanır. Uzun satırlar okunaklı kalır.', tel: ['blokOrta'] },
      { ad: 'Sol hizalı',     tarif: 'Sınırlı genişlik ama sola yaslı; sağda boşluk kalır.', tel: ['blokSol'] },
    ],
  },
];

/* ---- Durumlar: ekran doluyken değil, boşken ve beklerken. ---- */
const DURUM_ALAN = [
  {
    anahtar: 'bosdurum', ad: 'Boş durum', alt: 'Hiç kayıt yokken ne görünsün?',
    varsayilan: 'Simge + yazı + düğme',
    secim: [
      { ad: 'Sade yazı',            tarif: 'Ortada tek satır gri yazı.', tel: ['bosYazi'] },
      { ad: 'Simge + yazı',         tarif: 'Soluk bir simge ve altında açıklama.', tel: ['bosSimge'] },
      { ad: 'Simge + yazı + düğme', tarif: 'Simge, ne yapılacağını anlatan cümle ve ilk kaydı ekleyen düğme.', tel: ['bosDugme'] },
      { ad: 'Çizim',                tarif: 'Markaya uygun küçük bir çizim ve açıklama.', tel: ['bosCizim'] },
    ],
  },
  {
    anahtar: 'yukleme', ad: 'Yükleme', alt: 'Veri beklenirken ne görünsün?',
    varsayilan: 'İskelet',
    secim: [
      { ad: 'Dönen çark',      tarif: 'Ortada dönen halka. En basiti.', tel: ['cark'] },
      { ad: 'İskelet',         tarif: 'Gelecek içeriğin gri taslağı; sayfa zıplamaz.', tel: ['iskelet'] },
      { ad: 'İlerleme çubuğu', tarif: 'Üstte ince çubuk; içerik yerinde kalır.', tel: ['ilerleme', 'liste'] },
    ],
  },
  {
    anahtar: 'bildirim', ad: 'Bildirim', alt: 'Uyarı ve onay mesajları nerede çıksın?',
    varsayilan: 'Alttan kart',
    secim: [
      { ad: 'Üstte şerit',    tarif: 'Sayfanın tepesinde tam genişlik şerit; kalıcı uyarılar için.', tel: ['seritUst', 'liste'] },
      { ad: 'Alttan kart',    tarif: 'Alttan kayan kart, birkaç saniyede kaybolur.', tel: ['liste', 'seritAlt'] },
      { ad: 'Sağ üstte',      tarif: 'Sağ üst köşede yığılan kartlar. Masaüstü alışkanlığı.', tel: ['liste', 'sagUst'] },
      { ad: 'Ortada pencere', tarif: 'Ekranı durduran pencere. Yalnız kritik uyarılar için.', tel: ['liste', 'pencere'] },
    ],
  },
  {
    anahtar: 'onaysil', ad: 'Onay & silme', alt: 'Silme nasıl olsun?',
    varsayilan: 'Geri al şeridi',
    secim: [
      { ad: 'Pencere ile onay', tarif: '"Emin misin?" penceresi; silmeden önce durdurur.', tel: ['liste', 'pencere'] },
      { ad: 'Kaydırarak sil',   tarif: 'Satırı yana kaydırınca kırmızı sil düğmesi çıkar.', tel: ['listeKaydir'] },
      { ad: 'Geri al şeridi',   tarif: 'Hemen siler, altta "Geri al" şeridi çıkar. Soru sormaz.', tel: ['liste', 'geriAl'] },
    ],
  },
  {
    anahtar: 'listesonu', ad: 'Liste sonu', alt: 'Kayıt çoksa nasıl devam edilsin?',
    varsayilan: 'Daha fazla düğmesi',
    secim: [
      { ad: 'Sayfa numarası',     tarif: 'Altta 1 2 3 … numaraları. Kaçıncı sayfada olduğun belli.', tel: ['liste', 'sayfaNo'] },
      { ad: 'Daha fazla düğmesi', tarif: 'Altta "Daha fazla" düğmesi; kontrol kullanıcıda.', tel: ['liste', 'sonDugme'] },
      { ad: 'Sonsuz kaydırma',    tarif: 'Aşağı indikçe kendiliğinden yüklenir.', tel: ['liste', 'sonsuz'] },
    ],
  },
];

/* Üç öbek, üç sekme. Hepsi projenin `palet` alanında saklanır. */
const TASARIM_GRUP = [
  { anahtar: 'yerlesim', ad: 'Yerleşim', alanlar: YERLESIM_ALAN },
  { anahtar: 'bicim',    ad: 'Biçim',    alanlar: TASARIM_ALAN },
  { anahtar: 'durum',    ad: 'Durumlar', alanlar: DURUM_ALAN },
];

/* Bütün başlıklar tek dizide — prompt ve çözümleyici bunu gezer. */
const TUM_TASARIM = YERLESIM_ALAN.concat(TASARIM_ALAN, DURUM_ALAN);

/* ---- Tasarım akışı ----
   Kararlar başlık türüne göre değil, ETKİLEDİĞİ EKRANA göre gruplanır.
   Her adımda önizleme o adımın ekranını gösterir; başka sayfada ne
   değiştiğini aramak gerekmez. Sıra kabadan inceye: önce her ekranda
   ortak olan, sonra ekran ekran. */
const TASARIM_ADIM = [
  { anahtar: 'tema',     ad: 'Tema',            tur: 'tema',  ekran: 'panel',
    aciklama: 'Önce bunu seç — palet buna göre üretilecek.' },
  { anahtar: 'logo',     ad: 'Logo',            tur: 'logo',  ekran: 'panel',
    aciklama: 'Paletin kaynağı. Bu olmadan prompt anlamsız.' },
  { anahtar: 'palet',    ad: 'Palet',           tur: 'palet', ekran: 'panel',
    aciklama: 'Promptu Claude\'a logoyla ver, dönen cevabı yapıştır.' },

  { anahtar: 'iskelet',  ad: 'Genel iskelet',   ekran: 'panel',
    aciklama: 'Her ekranda ortak olan çatı.',
    alanlar: ['ustcubuk', 'gezinme', 'sayfalistesi', 'genislik'] },
  { anahtar: 'yuzey',    ad: 'Yüzey',           ekran: 'panel',
    aciklama: 'Kutuların, düğmelerin ve simgelerin görünüşü.',
    alanlar: ['kart', 'kose', 'yogunluk', 'dugme', 'simge'] },

  { anahtar: 'panel',    ad: 'Panel ekranı',    ekran: 'panel',
    aciklama: 'Uygulama açılınca ilk görülen ekran.',
    alanlar: ['dashboard'] },
  { anahtar: 'liste',    ad: 'Tablolu sayfa',   ekran: 'liste',
    aciklama: 'En çok bakılan ekran. Kayıtlar burada.',
    alanlar: ['tablosayfa', 'tablo', 'arama', 'filtre', 'listesonu', 'anaeylem'] },
  { anahtar: 'mobil',    ad: 'Telefonda tablo', ekran: 'liste', cihaz: 'telefon',
    aciklama: 'Dar ekranda tablo bozulur; ne olacağına karar ver.',
    alanlar: ['tablomobil'] },
  { anahtar: 'form',     ad: 'Veri girişi',     ekran: 'form',
    aciklama: 'Yeni kayıt eklenirken açılan ekran.',
    alanlar: ['verigirisi'] },
  { anahtar: 'detay',    ad: 'Detay ekranı',    ekran: 'liste',
    aciklama: 'Bir kaydın kendi sayfası.',
    alanlar: ['detay'] },
  { anahtar: 'ayarlar',  ad: 'Ayarlar ekranı',  ekran: 'ayarlar',
    aciklama: 'Her uygulamada var, hep sonradan düşünülür.',
    alanlar: ['ayarlar'] },
  { anahtar: 'bos',      ad: 'Boş durum',       ekran: 'bos',
    aciklama: 'Hiç kayıt yokken görünen ekran.',
    alanlar: ['bosdurum'] },
  { anahtar: 'yukleme',  ad: 'Yükleme',         ekran: 'yukleme',
    aciklama: 'Veri beklenirken görünen ekran.',
    alanlar: ['yukleme'] },
  { anahtar: 'bildirim', ad: 'Bildirim ve silme', ekran: 'liste',
    aciklama: 'Mesajlar nerede çıkar, silme nasıl olur.',
    alanlar: ['bildirim', 'onaysil'] },

  { anahtar: 'ozet',     ad: 'Özet',            tur: 'ozet',  ekran: 'panel',
    aciklama: 'Verilen bütün kararlar. Prompta bu yazılacak.' },
];

/* Adımın başlıkları — anahtarlardan gerçek alanlara çevirir. */
function adimAlanlari(adim) {
  return (adim.alanlar || []).map(k => TUM_TASARIM.find(a => a.anahtar === k)).filter(Boolean);
}

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
