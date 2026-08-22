/* ==========================================================================
   NIZAM | Studio — Yapılandırma
   Bu dosya her sürümde elle güncellenir.
   ========================================================================== */

const APP = {
  name:     'NIZAM | Studio',
  short:    'NIZAM Studio',
  owner:    'Nizam Soft',
  version: 'v0.33.0',
  build:    '2026-08-20',
  stage: 'Adım 4 · Rol katmanları',
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
  { anahtar: 'bg',      ad: 'Arka plan',        ornek: '#f4f2f0', renk: true },
  { anahtar: 'yuzey',   ad: 'Yüzey',            ornek: '#ffffff', renk: true },
  { anahtar: 'cizgi',   ad: 'Çizgi',            ornek: '#e2ddd9', renk: true },
  { anahtar: 'metin',   ad: 'Metin',            ornek: '#1d1a18', renk: true },
  { anahtar: 'metin2',  ad: 'Metin soft',       ornek: '#5f5852', renk: true },
  { anahtar: 'metin3',  ad: 'Metin silik',      ornek: '#8d857e', renk: true },
  { anahtar: 'vurgu',   ad: 'Vurgu',            ornek: '#8a6d12', renk: true },
  { anahtar: 'vurgu2',  ad: 'Vurgu koyu',       ornek: '#6b5410', renk: true,
    not: 'Üzerine gelince ve basılınca kullanılır. Vurgudan bir tık koyu.' },
  { anahtar: 'basari',  ad: 'Başarı',           ornek: '#3d9970', renk: true },
  { anahtar: 'uyari',   ad: 'Uyarı',            ornek: '#d0a13c', renk: true },
  { anahtar: 'tehlike', ad: 'Tehlike',          ornek: '#d14b3f', renk: true,
    not: 'Silme ve geri alınamaz işlemler. Vurgu kırmızıysa ondan ayrışsın.' },
  { anahtar: 'baslik',  ad: 'Başlık yazı tipi', ornek: 'Space Grotesk' },
  { anahtar: 'govde',   ad: 'Metin yazı tipi',  ornek: 'IBM Plex Sans' },
  { anahtar: 'simgeKit',ad: 'Simge seti',       ornek: 'Lucide' },
  { anahtar: 'ton',     ad: 'Ton',              ornek: 'sıcak, kurumsal, sade' },
];

/* Birlikte olmayacak seçimler. Prompt bunları yasaklar, Studio yapıştırınca
   denetler. Her satır: [alan, değer] + [alan, değer] + neden. */
const CELISKI = [
  [['ustcubuk', 'Yok'], ['kullanicimenu', 'Sağ üstte çip'],   'Üst çubuk yokken çip nereye konacak?'],
  [['ustcubuk', 'Yok'], ['kullanicimenu', 'Sağ üstte avatar'],'Üst çubuk yokken avatar nereye konacak?'],
  [['ustcubuk', 'Yok'], ['destek', 'Üst çubukta'],            'Üst çubuk yok.'],
  [['ustcubuk', 'Yok'], ['guncelleme', 'Üstte rozet'],        'Üst çubuk yok.'],
  [['ustcubuk', 'Yok'], ['anaeylem', 'Sağ üstte'],            'Üst çubuk yok.'],
  [['ustcubuk', 'Yok'], ['arama', 'Simgeden açılan'],         'Simge üst çubukta durur, üst çubuk yok.'],
  [['ustcubuk', 'Yok'], ['yoliz', 'Geri oku + başlık'],       'Geri oku üst çubukta durur.'],
  [['ustcubuk', 'Yok'], ['donem', 'Başlıkta açılır'],         'Başlık yok.'],
  [['gezinme', 'Sabit yan menü'],   ['anaeylem', 'Alt çubukta orta'], 'Alt çubuk yok.'],
  [['gezinme', 'Açılır yan menü'],  ['anaeylem', 'Alt çubukta orta'], 'Alt çubuk yok.'],
  [['gezinme', 'Üst menü'],         ['anaeylem', 'Alt çubukta orta'], 'Alt çubuk yok.'],
  [['gezinme', 'Alt sekme'],        ['kullanicimenu', 'Yan menü altında'], 'Yan menü yok.'],
  [['gezinme', 'Alt + orta +'],     ['kullanicimenu', 'Yan menü altında'], 'Yan menü yok.'],
  [['gezinme', 'Üst menü'],         ['kullanicimenu', 'Yan menü altında'], 'Yan menü yok.'],
  [['hareketMiktari', 'Yok'], ['gecis', 'Sağdan kayma'],      'Hareket kapalıyken geçiş animasyonu olmaz.'],
  [['hareketMiktari', 'Yok'], ['gecis', 'Yukarı kayma'],      'Hareket kapalıyken geçiş animasyonu olmaz.'],
  [['hareketMiktari', 'Yok'], ['listeGirisi', 'Sırayla belirme'], 'Hareket kapalı.'],
  [['hareketMiktari', 'Yok'], ['listeGirisi', 'Aşağıdan kayma'],  'Hareket kapalı.'],
  [['hareketMiktari', 'Yok'], ['sayiHareketi', 'Sayarak'],    'Hareket kapalı.'],
  [['hareketMiktari', 'Yok'], ['dokunma', 'Dalga'],           'Hareket kapalı.'],
  [['hareketMiktari', 'Yok'], ['acilma', 'Yükseklik animasyonu'], 'Hareket kapalı.'],
  [['arama', 'Yok'], ['tablosayfa', 'Üstte filtre'],          'Filtre satırı aramayı da barındırır; arama yok deniyor.'],
  [['iceaktarma', 'Yok'], ['yedek', 'Yedek + değişiklik kaydı'], 'Dosya girişi yokken dosya yedeği tutarsız kalır.'],
  [['tablomobil', 'Yana kaydır'], ['tablo', 'Kartlı satır'],  'Kartlı satır zaten kaydırılmaz.'],
];

/* Arayüz biçimi — Tasarımı belirleme durağında görselli seçilir.
   Değerler projenin `palet` alanında saklanır; ayrı sütun gerekmez.
   `tarif` doğrudan prompta ve NIZAM.md'ye yazılır: AI ne yapacağını buradan okur.
   `coklu` olanlarda birden fazla seçilebilir, seçimler birbirine karışır. */
const TASARIM_ALAN = [
  {
    anahtar: 'kart', ad: 'Kart', alt: 'Uygulamadaki her kutu böyle görünecek.',
    varsayilan: 'Yükseltilmiş', ekran: 'panel',
    secim: [
      { ad: 'Düz',          tarif: 'Gölge yok. Kart yalnızca dolgu farkıyla zeminden ayrılır.' },
      { ad: 'Yükseltilmiş', tarif: 'Yumuşak gölge ve üstte ince ışık çizgisi; kart zeminden kalkık durur.' },
      { ad: 'Çizgili',      tarif: 'Dolgu yok, yalnız 1px çerçeve. En sade ve en hafif görünüm.' },
      { ad: 'Buzlu cam',    tarif: 'Yarı saydam dolgu + backdrop-filter bulanıklık + ince açık çerçeve.' },
      { ad: 'Kağıt',        tarif: 'Neredeyse keskin köşe, kaymış sert gölge; basılı kağıt hissi.' },
      { ad: 'Oyulmuş',      tarif: 'Kart zemine gömülü: içte üstten koyu, alttan açık gölge. Kabartmanın tersi.' },
      { ad: 'Degrade',      tarif: 'Dolgu üstten alta yumuşak renk geçişi; üst kenar bir tık açık.' },
    ],
  },
  {
    anahtar: 'kartek', ad: 'Karta ekle', alt: 'Kartın üstüne binen katmanlar. Hiçbiri seçilmeyebilir.',
    varsayilan: '', coklu: true, bos: true, ekran: 'panel',
    secim: [
      { ad: 'Şerit vurgu',  tarif: 'Sol kenarda 3px vurgu renginde dikey şerit.' },
      { ad: 'Işıklı kenar', tarif: 'Kenarda vurgu renginde 1px ışıyan çerçeve ve dışa hafif renkli parıltı.' },
      { ad: 'Dokulu',       tarif: 'Dolgunun üzerinde çok ince gren dokusu; matbaa kağıdı hissi.' },
    ],
  },
  {
    anahtar: 'vurgukart', ad: 'Vurgu kartı', alt: 'Önemli seçim ya da özet alanı nasıl öne çıksın?',
    varsayilan: 'Degrade hero', ekran: 'panel',
    secim: [
      { ad: 'Yok',          tarif: 'Ayrı bir vurgu kartı kullanılmaz; her kutu eşit ağırlıkta.', tel: ['blok'] },
      { ad: 'Degrade hero', tarif: 'Vurgu renginden koyusuna 135° degrade, büyük köşe, yumuşak renkli gölge.', tel: ['hero', 'liste'] },
      { ad: 'Sade başlık',  tarif: 'Kart yerine büyük başlık ve altında ince ayraç.', tel: ['buyukBaslik', 'liste'] },
      { ad: 'Şeritli',      tarif: 'Normal yüzey kartı ama üstünde vurgu renginde 4px şerit.', tel: ['seritKart', 'liste'] },
    ],
  },
  {
    anahtar: 'kose', ad: 'Köşe', alt: 'Kutuların ve düğmelerin köşesi.',
    varsayilan: 'Yuvarlak', ekran: 'panel',
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
    varsayilan: 'Normal', ekran: 'yogunluk',
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
    anahtar: 'tablo', ad: 'Tablo satırı', alt: 'En çok bakılan ekran. Satırlar nasıl ayrılsın?',
    varsayilan: 'Zebra', ekran: 'liste',
    secim: [
      { ad: 'Çizgisiz',      tarif: 'Ayraç yok; satırlar yalnız boşlukla ayrılır. Kısa listeler için.' },
      { ad: 'Zebra',         tarif: 'Tek sıradaki satırlar hafif açık zeminli. Uzun listede göz kaymaz.' },
      { ad: 'Yatay çizgi',   tarif: 'Her satırın altında 1px çizgi; dikey çizgi yok.' },
      { ad: 'Tam ızgara',    tarif: 'Yatay ve dikey çizgiler. Muhasebe tablosu görünümü.' },
      { ad: 'Kartlı satır',  tarif: 'Her satır kendi mini kartı; aralarında 6px boşluk, ortak çizgi yok.' },
    ],
  },
  {
    anahtar: 'tabloek', ad: 'Tabloya ekle', alt: 'Satır biçiminin üstüne binen kurallar.',
    varsayilan: '', coklu: true, bos: true, ekran: 'liste',
    secim: [
      { ad: 'Gruplu',        tarif: 'Satırlar başlık altında öbeklenir (tarih, kategori); grup başlığı yapışkan.' },
      { ad: 'Rakam hizalı',  tarif: 'Sayısal sütunlar sağa yaslı, mono rakamlı ve binlik ayraçlı.' },
      { ad: 'Vurgulu sütun', tarif: 'İlk sütun kalın yazılır ve yatay kaydırmada yapışık kalır.' },
    ],
  },
  {
    anahtar: 'tablomobil', ad: 'Tablo · telefonda', alt: 'Dar ekranda tablo ne olsun?',
    varsayilan: 'Karta dönüş', ekran: 'liste', cihaz: 'telefon',
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
    varsayilan: 'Dolu', ekran: 'form',
    secim: [
      { ad: 'Dolu',    tarif: 'Ana buton vurgu rengiyle dolu, yazı beyaz/koyu kontrast.' },
      { ad: 'Çizgili', tarif: 'Saydam zemin, vurgu renginde çerçeve ve yazı.' },
      { ad: 'Yumuşak', tarif: 'Vurgu renginin %12 saydam hâliyle dolu, yazı vurgu renginde.' },
      { ad: 'Gölgeli', tarif: 'Dolu düğmenin altında vurgu renginden yumuşak renkli gölge; düğme havada durur.' },
      { ad: 'Degrade', tarif: 'Dolgu vurgu renginden koyusuna 135° geçiş.' },
    ],
  },
  {
    anahtar: 'dugmeek', ad: 'Düğmeye ekle', alt: 'Ana butonun üstüne binen kurallar.',
    varsayilan: '', coklu: true, bos: true, ekran: 'form',
    secim: [
      { ad: 'Yazı',   tarif: 'İkincil eylemler çerçevesiz, yalnız vurgu renginde yazı olur.' },
      { ad: 'İkonlu', tarif: 'Her düğmede solda 16px simge, sağında yazı; arada 8px boşluk.' },
    ],
  },
  {
    anahtar: 'simge', ad: 'Simge', alt: 'Tek karar, her ekranı etkiler.',
    varsayilan: 'Çizgi', ekran: 'panel',
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
    varsayilan: 'İnce başlık', ekran: 'panel',
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
    varsayilan: 'Alt sekme', ekran: 'panel',
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
    varsayilan: 'Üst sekme', ekran: 'sayfalar',
    secim: [
      { ad: 'Yan liste',     tarif: 'Modül seçilince solda o modülün sayfaları listelenir.', tel: ['yanInce', 'liste'] },
      { ad: 'Üst sekme',     tarif: 'Modülün sayfaları üstte yatay sekme olur.', tel: ['sekme', 'liste'] },
      { ad: 'Açılır seçici', tarif: 'Başlığa dokununca sayfa listesi açılır. Az yer kaplar.', tel: ['ustSecici', 'liste'] },
      { ad: 'Kart ızgarası', tarif: 'Modüle girince sayfalar kart ızgarası olarak karşılar.', tel: ['izgara'] },
    ],
  },
  {
    anahtar: 'yoliz', ad: 'Yol izi', alt: 'Kullanıcı nerede olduğunu nereden anlasın?',
    varsayilan: 'Geri oku + başlık', ekran: 'detay',
    secim: [
      { ad: 'Yok',               tarif: 'Yol izi yok; başlık yeterli sayılır.', tel: ['ust', 'blok'] },
      { ad: 'Üstte metin',       tarif: 'Başlığın üstünde "Ana Sayfa › Raporlar" biçiminde ince yazı.', tel: ['yolMetin', 'ust', 'blok'] },
      { ad: 'Geri oku + başlık', tarif: 'Solda geri oku, yanında sayfa adı. Telefonda en anlaşılır olan.', tel: ['ustGeri', 'blok'] },
      { ad: 'Sekmeyle',          tarif: 'Yol izi yerine üst sekmeler konumu gösterir.', tel: ['ust', 'sekme', 'blok'] },
    ],
  },
  {
    anahtar: 'kullanicimenu', ad: 'Kullanıcı menüsü', alt: 'Kullanıcı kendi hesabına nereden ulaşsın?',
    varsayilan: 'Sağ üstte çip', ekran: 'panel',
    secim: [
      { ad: 'Sağ üstte çip',   tarif: 'Avatar + ad + rol bir arada; dokununca menü açılır.', tel: ['ustCip', 'blok'] },
      { ad: 'Sağ üstte avatar',tarif: 'Yalnız yuvarlak fotoğraf; ad yok.', tel: ['ustAvatar', 'blok'] },
      { ad: 'Yan menü altında',tarif: 'Menünün en altında kullanıcı satırı.', tel: ['yanKisi'] },
      { ad: 'Ayarlar içinde',  tarif: 'Üst çubukta hiç yok; hesap işleri Ayarlar ekranında.', tel: ['ust', 'grupluListe'] },
    ],
  },
  {
    anahtar: 'destek', ad: 'Destek ve istek', alt: 'Kullanıcı sorununu nereden iletsin?',
    varsayilan: 'Üst çubukta', ekran: 'panel',
    secim: [
      { ad: 'Yok',            tarif: 'Uygulama içinden destek yolu yok.', tel: ['ust', 'blok'] },
      { ad: 'Üst çubukta',    tarif: 'Üst çubukta soru işareti düğmesi; basınca istek penceresi.', tel: ['ustSoru', 'blok'] },
      { ad: 'Ayarlar içinde', tarif: 'Ayarlar listesinde "İstek ve öneri" satırı.', tel: ['grupluListe'] },
      { ad: 'Sağ altta yüzen',tarif: 'Sağ altta küçük yüzen destek düğmesi.', tel: ['blok', 'fab'] },
    ],
  },
  {
    anahtar: 'sayacduzen', ad: 'Sayaç düzeni', alt: 'Panel sayaçları nasıl dizilsin?',
    varsayilan: '2\'li', ekran: 'panel',
    secim: [
      { ad: '2\'li',        tarif: 'Yan yana iki sayaç; geniş ve okunaklı.', tel: ['kart2', 'liste'] },
      { ad: '3\'lü ızgara', tarif: 'Üçlü ızgara: üstte küçük gri etiket, altta büyük kalın sayı.', tel: ['kart3', 'liste'] },
      { ad: 'Yatay şerit',  tarif: 'Tek satırda yana kayan sayaç şeridi; sayı çoksa.', tel: ['kartSerit', 'liste'] },
      { ad: 'Dikey liste',  tarif: 'Alt alta satırlar, değer sağda.', tel: ['kartDikey', 'liste'] },
    ],
  },
  {
    anahtar: 'donem', ad: 'Dönem seçici', alt: 'Ay ya da tarih aralığı nereden seçilsin?',
    varsayilan: 'Filtre içinde', ekran: 'liste',
    secim: [
      { ad: 'Yok',            tarif: 'Dönem seçimi yok; her şey güncel gösterilir.', tel: ['liste'] },
      { ad: 'Üstte ay çubuğu',tarif: 'Oklarla ay değiştirilen şerit; ay adı büyük, yıl altında.', tel: ['ayCubugu', 'liste'] },
      { ad: 'Filtre içinde',  tarif: 'Tarih aralığı diğer filtrelerle birlikte.', tel: ['ara', 'liste'] },
      { ad: 'Başlıkta açılır',tarif: 'Sayfa başlığına dokununca dönem listesi açılır.', tel: ['ustSecici', 'liste'] },
    ],
  },
  {
    anahtar: 'tablosayfa', ad: 'Tablolu sayfa', alt: 'Liste ekranının iskeleti.',
    varsayilan: 'Üstte filtre', ekran: 'liste',
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
    varsayilan: 'Sayaç + son hareketler', ekran: 'panel',
    secim: [
      { ad: 'Sayaç + büyük grafik', tarif: 'Üstte sayaç şeridi, altında tek büyük grafik.', tel: ['kart2', 'grafik'] },
      { ad: '2×2 ızgara',           tarif: 'Dört eşit kart. Her biri bir gösterge.', tel: ['izgara'] },
      { ad: 'Sol büyük + sağ kolon',tarif: 'Solda büyük grafik, sağda dar kolonda küçük kartlar.', tel: ['ikiliKolon'] },
      { ad: 'Sayaç + son hareketler', tarif: 'Üstte sayaçlar, altında son kayıtlar listesi.', tel: ['kart2', 'liste'] },
    ],
  },
  {
    anahtar: 'verigirisi', ad: 'Veri girişi', alt: 'Kayıt eklerken ekran nasıl açılsın?',
    varsayilan: 'Sağdan çekmece', ekran: 'form',
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
    varsayilan: 'Gruplu liste', ekran: 'ayarlar',
    secim: [
      { ad: 'Tek liste',    tarif: 'Bütün ayarlar tek bir listede, başlıksız.', tel: ['liste'] },
      { ad: 'Gruplu liste', tarif: 'Ayarlar başlıklı öbeklere ayrılır.', tel: ['grupluListe'] },
      { ad: 'Sol sekmeli',  tarif: 'Solda ayar bölümleri, sağda o bölümün içeriği.', tel: ['yanInce', 'liste'] },
      { ad: 'Arama + gruplu', tarif: 'Tepede ayar araması, altında gruplu liste.', tel: ['ara', 'grupluListe'] },
    ],
  },
  {
    anahtar: 'detay', ad: 'Detay ekranı', alt: 'Bir kaydın kendi sayfası nasıl kurulsun?',
    varsayilan: 'Katlanır bölümler', ekran: 'detay',
    secim: [
      { ad: 'Sekmeli',            tarif: 'Bilgi · Hareketler · Belgeler gibi sekmeler.', tel: ['ust', 'sekme', 'blok'] },
      { ad: 'Tek uzun akış',      tarif: 'Her şey alt alta tek sayfada; kaydırarak gezilir.', tel: ['ust', 'akis'] },
      { ad: 'Sol özet + sağ içerik', tarif: 'Solda kaydın künyesi sabit, sağda değişen içerik.', tel: ['solPanel', 'blok'] },
      { ad: 'Katlanır bölümler',  tarif: 'Bölümler kapalı gelir, dokununca açılır.', tel: ['ust', 'katlanir'] },
    ],
  },
  {
    anahtar: 'anaeylem', ad: 'Ana eylem yeri', alt: 'Ekleme düğmesi nerede dursun?',
    varsayilan: 'Sağ altta yüzen', ekran: 'liste',
    secim: [
      { ad: 'Sağ üstte',       tarif: 'Başlık çubuğunun sağında. Masaüstünde alışılmış yer.', tel: ['ustEylem', 'liste'] },
      { ad: 'Sağ altta yüzen', tarif: 'İçeriğin üzerinde yüzen yuvarlak düğme. Telefonda kolay erişim.', tel: ['liste', 'fab'] },
      { ad: 'Alt çubukta orta',tarif: 'Alt sekme şeridinin ortasında yükseltilmiş düğme.', tel: ['liste', 'altArti'] },
      { ad: 'Sayfa sonunda',   tarif: 'Listenin altında tam genişlikte düğme. Kısa listeler için.', tel: ['liste', 'sonDugme'] },
    ],
  },
  {
    anahtar: 'arama', ad: 'Arama', alt: 'Aramaya nasıl ulaşılsın?',
    varsayilan: 'Üstte sabit', ekran: 'liste',
    secim: [
      { ad: 'Üstte sabit',     tarif: 'Her liste ekranının tepesinde açık arama kutusu.', tel: ['ara', 'liste'] },
      { ad: 'Simgeden açılan', tarif: 'Büyüteç simgesi; dokununca arama çubuğu açılır.', tel: ['ustAra', 'liste'] },
      { ad: 'Ayrı sayfa',      tarif: 'Arama kendi ekranı; tüm modüllerde birden arar.', tel: ['ust', 'ara', 'liste'] },
      { ad: 'Yok',             tarif: 'Arama yok; filtreler yeterli.', tel: ['liste'] },
    ],
  },
  {
    anahtar: 'filtre', ad: 'Filtre', alt: 'Filtreler nerede dursun?',
    varsayilan: 'Üstte çip sırası', ekran: 'liste',
    secim: [
      { ad: 'Üstte çip sırası', tarif: 'Yatay kayan çipler; seçili olan dolu görünür.', tel: ['cip', 'liste'] },
      { ad: 'Açılır panel',     tarif: 'Filtre düğmesi; basınca üstten panel iner.', tel: ['ustEylem', 'liste'] },
      { ad: 'Yan panel',        tarif: 'Solda kalıcı filtre paneli. Çok ölçütlü aramalar için.', tel: ['solPanel', 'liste'] },
      { ad: 'Alttan sayfa',     tarif: 'Alttan yarım sayfa açılır; telefonda rahat.', tel: ['liste', 'altSayfa'] },
    ],
  },
  {
    anahtar: 'iceaktarma', ad: 'İçe aktarma', alt: 'Excel ya da dosyadan toplu veri nasıl alınsın?',
    varsayilan: 'Önizlemeli', ekran: 'ice',
    secim: [
      { ad: 'Yok',          tarif: 'Toplu içe aktarma yok; kayıtlar tek tek girilir.', tel: ['blok'] },
      { ad: 'Basit yükleme',tarif: 'Dosya seç, yükle, biter. Ara ekran yok.', tel: ['dosya', 'sonDugme'] },
      { ad: 'Önizlemeli',   tarif: 'Yüklemeden önce "N yeni · M mevcut" özeti ve satır listesi gösterilir.', tel: ['dosya', 'ozetSatir', 'liste'] },
      { ad: 'Eşleştirmeli', tarif: 'Dosyadaki sütunlar alanlarla elle eşleştirilir, sonra önizleme gelir.', tel: ['eslestir', 'sonDugme'] },
    ],
  },
  {
    anahtar: 'genislik', ad: 'Genişlik', alt: 'Masaüstünde içerik ne kadar yayılsın?',
    varsayilan: 'Ortada sınırlı', ekran: 'panel', genis: true,
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
    varsayilan: 'Simge + yazı + düğme', ekran: 'bos',
    secim: [
      { ad: 'Sade yazı',            tarif: 'Ortada tek satır gri yazı.', tel: ['bosYazi'] },
      { ad: 'Simge + yazı',         tarif: 'Soluk bir simge ve altında açıklama.', tel: ['bosSimge'] },
      { ad: 'Simge + yazı + düğme', tarif: 'Simge, ne yapılacağını anlatan cümle ve ilk kaydı ekleyen düğme.', tel: ['bosDugme'] },
      { ad: 'Çizim',                tarif: 'Markaya uygun küçük bir çizim ve açıklama.', tel: ['bosCizim'] },
    ],
  },
  {
    anahtar: 'yukleme', ad: 'Yükleme', alt: 'Veri beklenirken ne görünsün?',
    varsayilan: 'İskelet', ekran: 'yukleme',
    secim: [
      { ad: 'Dönen çark',      tarif: 'Ortada dönen halka. En basiti.', tel: ['cark'] },
      { ad: 'İskelet',         tarif: 'Gelecek içeriğin gri taslağı; sayfa zıplamaz.', tel: ['iskelet'] },
      { ad: 'İlerleme çubuğu', tarif: 'Üstte ince çubuk; içerik yerinde kalır.', tel: ['ilerleme', 'liste'] },
    ],
  },
  {
    anahtar: 'hata', ad: 'Hata ekranı', alt: 'Bir şey ters gidince ne görünsün?',
    varsayilan: 'Simge + tekrar dene', ekran: 'hata',
    secim: [
      { ad: 'Sade yazı',           tarif: 'Ortada tek satır hata metni.', tel: ['bosYazi'] },
      { ad: 'Simge + tekrar dene', tarif: 'Uyarı simgesi, ne olduğunu anlatan cümle ve "Tekrar dene" düğmesi.', tel: ['hataSimge'] },
      { ad: 'Tam sayfa',           tarif: 'Büyük simge, açıklama, "Tekrar dene" ve "Geri dön" düğmeleri.', tel: ['hataTam'] },
    ],
  },
  {
    anahtar: 'islemsonuc', ad: 'İşlem sonucu', alt: 'Kaydetme ya da gönderme bitince ne olsun?',
    varsayilan: 'Toast', ekran: 'form',
    secim: [
      { ad: 'Toast',           tarif: 'Kısa bir mesaj belirir, birkaç saniyede kaybolur.', tel: ['form', 'seritAlt'] },
      { ad: 'Tik animasyonu',  tarif: 'Ortada büyüyen onay işareti, sonra ekran kapanır.', tel: ['tik'] },
      { ad: 'İlerleme çubuğu', tarif: 'Uzun işlemde yüzdeli çubuk ve adım yazısı.', tel: ['ilerleme', 'form'] },
      { ad: 'Sonuç ekranı',    tarif: 'Tam sayfa "Gönderildi" ekranı; ne yapıldığını özetler.', tel: ['bosDugme'] },
    ],
  },
  {
    anahtar: 'bildirim', ad: 'Bildirim', alt: 'Uyarı ve onay mesajları nerede çıksın?',
    varsayilan: 'Alttan kart', ekran: 'liste',
    secim: [
      { ad: 'Üstte şerit',    tarif: 'Sayfanın tepesinde tam genişlik şerit; kalıcı uyarılar için.', tel: ['seritUst', 'liste'] },
      { ad: 'Alttan kart',    tarif: 'Alttan kayan kart, birkaç saniyede kaybolur.', tel: ['liste', 'seritAlt'] },
      { ad: 'Sağ üstte',      tarif: 'Sağ üst köşede yığılan kartlar. Masaüstü alışkanlığı.', tel: ['liste', 'sagUst'] },
      { ad: 'Ortada pencere', tarif: 'Ekranı durduran pencere. Yalnız kritik uyarılar için.', tel: ['liste', 'pencere'] },
    ],
  },
  {
    anahtar: 'onaysil', ad: 'Onay & silme', alt: 'Silme nasıl olsun?',
    varsayilan: 'Geri al şeridi', ekran: 'liste',
    secim: [
      { ad: 'Pencere ile onay', tarif: '"Emin misin?" penceresi; silmeden önce durdurur.', tel: ['liste', 'pencere'] },
      { ad: 'Kaydırarak sil',   tarif: 'Satırı yana kaydırınca kırmızı sil düğmesi çıkar.', tel: ['listeKaydir'] },
      { ad: 'Geri al şeridi',   tarif: 'Hemen siler, altta "Geri al" şeridi çıkar. Soru sormaz.', tel: ['liste', 'geriAl'] },
    ],
  },
  {
    anahtar: 'listesonu', ad: 'Liste sonu', alt: 'Kayıt çoksa nasıl devam edilsin?',
    varsayilan: 'Daha fazla düğmesi', ekran: 'liste',
    secim: [
      { ad: 'Sayfa numarası',     tarif: 'Altta 1 2 3 … numaraları. Kaçıncı sayfada olduğun belli.', tel: ['liste', 'sayfaNo'] },
      { ad: 'Daha fazla düğmesi', tarif: 'Altta "Daha fazla" düğmesi; kontrol kullanıcıda.', tel: ['liste', 'sonDugme'] },
      { ad: 'Sonsuz kaydırma',    tarif: 'Aşağı indikçe kendiliğinden yüklenir.', tel: ['liste', 'sonsuz'] },
    ],
  },
];

/* ---- Açılış ve geçiş: uygulamaya girmeden önce ---- */
const ACILIS_ALAN = [
  {
    anahtar: 'acilis', ad: 'Açılış ekranı', alt: 'Uygulama açılırken ne görünsün?',
    varsayilan: 'Logo + ilerleme', ekran: 'acilis',
    secim: [
      { ad: 'Yok',                  tarif: 'Açılış ekranı yok; doğrudan uygulama gelir.', tel: ['blok'] },
      { ad: 'Logo',                 tarif: 'Ortada logo, arka plan marka rengi. Kısa ve sade.', tel: ['acilisLogo'] },
      { ad: 'Logo + ilerleme',      tarif: 'Logonun altında ince ilerleme çubuğu.', tel: ['acilisLogo', 'ilerleme'] },
      { ad: 'Logo + yüzde + mesaj', tarif: 'Çubuk, yüzde ve "Veriler alınıyor…" gibi durum yazısı.', tel: ['acilisLogo', 'ilerleme', 'ikiCizgi'] },
    ],
  },
  {
    anahtar: 'giris', ad: 'Giriş ekranı', alt: 'Kullanıcı nasıl karşılansın?',
    varsayilan: 'Ortada kart', ekran: 'giris',
    secim: [
      { ad: 'Ortada kart', tarif: 'Ortada tek kart: logo, e-posta, şifre, giriş düğmesi.', tel: ['girisKart'] },
      { ad: 'Tam ekran',   tarif: 'Kart yok; alanlar sayfaya yayılır. Telefonda ferah durur.', tel: ['girisTam'] },
      { ad: 'İki kolon',   tarif: 'Masaüstünde solda marka görseli, sağda form.', tel: ['girisIki'] },
      { ad: 'Sade',        tarif: 'Logo üstte, alanlar altında, çerçeve ve gölge yok.', tel: ['girisSade'] },
    ],
  },
];

/* ---- Hareket: uygulamayı canlandıran katman. Kodda en son yazılır. ---- */
const HAREKET_ALAN = [
  {
    anahtar: 'gecis', ad: 'Sayfa geçişi', alt: 'Sayfadan sayfaya nasıl geçilsin?',
    varsayilan: 'Soluk', ekran: 'liste',
    secim: [
      { ad: 'Yok',           tarif: 'Geçiş animasyonu yok; sayfa anında değişir. En hızlı hissi.', tel: ['gecisYok'] },
      { ad: 'Soluk',         tarif: 'Yeni sayfa 160ms içinde belirir.', tel: ['gecisSoluk'] },
      { ad: 'Sağdan kayma',  tarif: 'İçeri girilen sayfa sağdan kayar, geri dönerken sola. Hiyerarşi hissi verir.', tel: ['gecisSag'] },
      { ad: 'Yukarı kayma',  tarif: 'Yeni sayfa alttan yukarı kayarak gelir.', tel: ['gecisYukari'] },
    ],
  },
  {
    anahtar: 'dokunma', ad: 'Dokunma tepkisi', alt: 'Bir şeye basınca ne olsun?',
    varsayilan: 'Hafif küçülme', ekran: 'liste',
    secim: [
      { ad: 'Yok',           tarif: 'Basınca görsel tepki yok.', tel: ['liste'] },
      { ad: 'Hafif küçülme', tarif: 'Basılan öğe %98,5 küçülür, bırakınca geri döner. En sessiz tepki.', tel: ['dokKucul'] },
      { ad: 'Dalga',         tarif: 'Dokunulan noktadan yayılan halka (ripple).', tel: ['dokDalga'] },
      { ad: 'Zemin koyulaşır', tarif: 'Basılı tutulduğu sürece öğenin zemini bir ton koyulaşır.', tel: ['dokKoyu'] },
    ],
  },
  {
    anahtar: 'secimVurgu', ad: 'Seçim vurgusu', alt: 'Bir şey seçilince ötekiler ne olsun?',
    varsayilan: 'Yalnız seçili vurgulanır', ekran: 'liste',
    secim: [
      { ad: 'Yalnız seçili vurgulanır', tarif: 'Seçili öğe vurgulanır, ötekiler olduğu gibi kalır.', tel: ['svNormal'] },
      { ad: 'Ötekiler soluklaşır',      tarif: 'Seçili olmayanlar %55 saydamlığa iner; odak seçilene toplanır.', tel: ['svSoluk'] },
      { ad: 'Ötekiler küçülür',         tarif: 'Seçili öğe büyür, ötekiler hafifçe küçülür.', tel: ['svKucuk'] },
      { ad: 'Ötekiler bulanıklaşır',    tarif: 'Seçili olmayanlara 2px bulanıklık; en güçlü odak.', tel: ['svBulanik'] },
    ],
  },
  {
    anahtar: 'acilma', ad: 'Açılma ve kapanma', alt: 'Katlanan bölümler ve paneller nasıl açılsın?',
    varsayilan: 'Yükseklik animasyonu', ekran: 'ayarlar',
    secim: [
      { ad: 'Anında',               tarif: 'Animasyon yok; içerik bir anda görünür.', tel: ['grupluListe'] },
      { ad: 'Yükseklik animasyonu', tarif: 'Bölüm yüksekliği 220ms içinde açılır; içerik yerinden oynamaz.', tel: ['acKatla'] },
      { ad: 'Kayarak',              tarif: 'İçerik yukarıdan aşağı kayarak girer.', tel: ['acKay'] },
      { ad: 'Soluk + kayma',        tarif: 'Hem belirir hem 8px kayar. En yumuşak olanı.', tel: ['acSoluk'] },
    ],
  },
  {
    anahtar: 'bekleme', ad: 'Bekleme göstergesi', alt: 'Bir düğmeye basıldıktan sonra işlem sürerken?',
    varsayilan: 'Düğmede dönen halka', ekran: 'form',
    secim: [
      { ad: 'Yok',                  tarif: 'Düğme değişmez; kullanıcı bekler.', tel: ['sonDugme'] },
      { ad: 'Düğmede dönen halka',  tarif: 'Düğmenin içindeki yazı dönen halkaya dönüşür, düğme pasifleşir.', tel: ['bekHalka'] },
      { ad: 'Yazı değişir',         tarif: '"Kaydet" → "Kaydediliyor…" olur; düğme pasifleşir.', tel: ['bekYazi'] },
      { ad: 'Üstte ince çubuk',     tarif: 'Sayfanın tepesinde belirsiz ilerleme çubuğu akar.', tel: ['ilerleme', 'form'] },
    ],
  },
  {
    anahtar: 'listeGirisi', ad: 'Liste girişi', alt: 'Kayıtlar ekrana nasıl gelsin?',
    varsayilan: 'Yok', ekran: 'liste',
    secim: [
      { ad: 'Yok',              tarif: 'Liste hazır gelir; animasyon yok. En hızlı hissi.', tel: ['liste'] },
      { ad: 'Sırayla belirme',  tarif: 'Satırlar 40ms arayla tek tek belirir.', tel: ['lgSira'] },
      { ad: 'Aşağıdan kayma',   tarif: 'Satırlar 10px aşağıdan yukarı kayarak girer.', tel: ['lgKay'] },
    ],
  },
  {
    anahtar: 'sayiHareketi', ad: 'Sayı değişimi', alt: 'Sayaçlardaki rakam değişince?',
    varsayilan: 'Anında', ekran: 'panel',
    secim: [
      { ad: 'Anında',      tarif: 'Yeni değer doğrudan yazılır.', tel: ['kart2'] },
      { ad: 'Sayarak',     tarif: 'Rakam eski değerden yenisine 600ms içinde sayarak çıkar.', tel: ['syArt'] },
      { ad: 'Kısa parlama',tarif: 'Değişen sayı bir an vurgu renginde parlar.', tel: ['syParla'] },
    ],
  },
  {
    anahtar: 'hareketMiktari', ad: 'Hareket miktarı', alt: 'Genel olarak ne kadar hareket olsun?',
    varsayilan: 'Az', ekran: 'liste',
    secim: [
      { ad: 'Yok',    tarif: 'Bütün animasyonlar kapalı. Eski cihazlar ve erişilebilirlik için.', tel: ['hmYok'] },
      { ad: 'Az',     tarif: 'Yalnız geçiş ve dokunma tepkisi; süreler 160-220ms.', tel: ['hmAz'] },
      { ad: 'Normal', tarif: 'Liste girişi ve açılmalar da animasyonlu; süreler 220-320ms.', tel: ['hmNormal'] },
      { ad: 'Bol',    tarif: 'Sayı sayma, parlama ve yaylanma dahil. Gösterişli ama yorabilir.', tel: ['hmBol'] },
    ],
  },
];

/* ---- Sistem: uygulamanın kendi bakımı ---- */
const SISTEM_ALAN = [
  {
    anahtar: 'guncelleme', ad: 'Güncelleme', alt: 'Yeni sürüm kullanıcıya nasıl ulaşsın?',
    varsayilan: 'Güncelle düğmesi', ekran: 'ayarlar',
    secim: [
      { ad: 'Yok',              tarif: 'Kullanıcı sayfayı kendi yeniler.', tel: ['ust', 'blok'] },
      { ad: 'Üstte rozet',      tarif: 'Yeni sürüm varsa üst çubukta küçük nokta belirir.', tel: ['ustRozet', 'blok'] },
      { ad: 'Güncelle düğmesi', tarif: 'Ayarlarda "Uygulamayı güncelle" düğmesi ve altında sürüm etiketi.', tel: ['grupluListe', 'sonDugme'] },
      { ad: 'Sürüm ekranı',     tarif: 'Ayrı ekran: güncel sürüm, yayın durumu ve sürüm geçmişi.', tel: ['ust', 'kart3', 'liste'] },
    ],
  },
  {
    anahtar: 'yedek', ad: 'Yedek ve kayıt geçmişi', alt: 'Veri güvenliği ve iz sürme.',
    varsayilan: 'Yedek al / yükle', ekran: 'ayarlar',
    secim: [
      { ad: 'Yok',                    tarif: 'Yedekleme ekranı yok; veritabanı yedeği yeterli sayılır.', tel: ['grupluListe'] },
      { ad: 'Yedek al / yükle',       tarif: 'Ayarlarda dosyaya yedek alma ve geri yükleme.', tel: ['ikiDugme', 'grupluListe'] },
      { ad: 'Yedek + değişiklik kaydı', tarif: 'Ayrıca kimin neyi ne zaman değiştirdiğini gösteren liste.', tel: ['ikiDugme', 'liste'] },
    ],
  },
];

/* Üç öbek, üç sekme. Hepsi projenin `palet` alanında saklanır. */
const TASARIM_GRUP = [
  { anahtar: 'yerlesim', ad: 'Yerleşim', alanlar: YERLESIM_ALAN },
  { anahtar: 'bicim',    ad: 'Biçim',    alanlar: TASARIM_ALAN },
  { anahtar: 'acilis',   ad: 'Açılış',   alanlar: ACILIS_ALAN },
  { anahtar: 'durum',    ad: 'Durumlar', alanlar: DURUM_ALAN },
  { anahtar: 'hareket',  ad: 'Hareket',  alanlar: HAREKET_ALAN },
  { anahtar: 'sistem',   ad: 'Sistem',   alanlar: SISTEM_ALAN },
];

/* Bütün başlıklar tek dizide — prompt ve çözümleyici bunu gezer. */
const TUM_TASARIM = YERLESIM_ALAN.concat(TASARIM_ALAN, ACILIS_ALAN, DURUM_ALAN, HAREKET_ALAN, SISTEM_ALAN);

/* ---- Tasarım akışı ----
   Bir ekranda tek karar. Kaydırma yok.
   Öbekler dıştan içe: önce malzeme, sonra çatı, sonra ekran ekran, en sonda
   uç durumlar ve sistem işleri. Bir öbek içinde önizleme ekranı olabildiğince
   sabit kalır — boşuna zıplamasın. */
const AKIS_OBEK = [
  /* Kodlama sırası: ne önce yazılıyorsa o önce sorulur. */
  { ad: 'Renk ve bileşen', not: 'Önce malzeme: her ekranda kullanılacak kutu, düğme, simge.',
    alanlar: ['kart', 'kartek', 'vurgukart', 'kose', 'yogunluk', 'dugme', 'dugmeek', 'simge'] },
  { ad: 'Uygulama kabuğu', not: 'Her ekranı saran çatı: üst çubuk, gezinme, genişlik.',
    alanlar: ['ustcubuk', 'gezinme', 'sayfalistesi', 'yoliz', 'genislik', 'kullanicimenu', 'destek'] },
  { ad: 'Giriş kapısı', not: 'Uygulamaya girerken görülen ilk iki ekran.',
    alanlar: ['acilis', 'giris'] },
  { ad: 'Panel ekranı', not: 'Açılışta karşılayan ekran.',
    alanlar: ['dashboard', 'sayacduzen'] },
  { ad: 'Liste ekranı', not: 'En çok bakılan ekran ve içindeki her şey.',
    alanlar: ['tablosayfa', 'tablo', 'tabloek', 'arama', 'filtre', 'donem',
              'listesonu', 'anaeylem', 'tablomobil'] },
  { ad: 'Diğer ekranlar', not: 'Kayıt girme, detay, ayarlar ve toplu aktarım.',
    alanlar: ['verigirisi', 'detay', 'ayarlar', 'iceaktarma'] },
  { ad: 'Uç durumlar', not: 'Ekran boşken, beklerken ve iş ters gittiğinde.',
    alanlar: ['bosdurum', 'yukleme', 'hata', 'islemsonuc', 'bildirim', 'onaysil'] },
  { ad: 'Hareket', not: 'Uygulamayı canlandıran katman. Kodda da en son yazılır.',
    alanlar: ['gecis', 'dokunma', 'secimVurgu', 'acilma', 'bekleme',
              'listeGirisi', 'sayiHareketi', 'hareketMiktari'] },
  { ad: 'Sistem', not: 'Güncelleme, tema ve yedek — uygulamanın kendi bakımı.',
    alanlar: ['guncelleme', 'yedek'] },
];

const TASARIM_ADIM = [
  /* Logo ve firma bilgileri sihirbazda alındı; burada tekrar sorulmaz.
     Akış doğrudan paletle başlar — tasarımın gerçek ilk kararı odur. */
  { anahtar: 'palet', ad: 'Palet', tur: 'palet', ekran: 'panel', obek: 'Başlangıç',
    obekNot: 'Rengin ve yazının kaynağı. Kodda ilk yazılan satırlar.',
    aciklama: 'Promptu Claude\'a logoyla ver, dönen cevabı yapıştır.' },
].concat([].concat(...AKIS_OBEK.map(o => o.alanlar.map(k => {
  const a = TUM_TASARIM.find(x => x.anahtar === k);
  if (!a) throw new Error('Akışta tanımsız başlık: ' + k);
  return { anahtar: k, ad: a.ad, alan: a, ekran: a.ekran || 'panel',
           cihaz: a.cihaz, genis: a.genis, obek: o.ad, obekNot: o.not, aciklama: a.alt };
})))).concat([
  { anahtar: 'ozet', ad: 'Özet', tur: 'ozet', ekran: 'panel', obek: 'Bitiş',
    obekNot: 'Verilen bütün kararlar tek listede.',
    aciklama: 'Verilen bütün kararlar. Prompta bu yazılacak.' },
]);

/* ---- Nizam teknik standardı ----
   Her projede aynı. Sorulmaz; prompta ve NIZAM.md'ye olduğu gibi yazılır.
   Amaç: AI her projede yeniden karar vermesin, hep aynı yerden çıksın. */
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
   'Kayıt ekranı yok; hesabı yönetici açar.'],
  ['Paketler', 'Yalnız Supabase istemcisi',
   'Excel gerekiyorsa xlsx. Başka paket eklemeden önce sor.'],
  ['Para birimi', '₺ TRY', 'Binlik nokta, ondalık virgül: 12.400,00'],
  ['Tarih ve saat', '22.05.2025 · 14:30', 'Gün.Ay.Yıl ve 24 saatlik saat.'],
  ['Sürümleme', 'YIL.SAYAÇ', 'Örnek 2026.14. Ayarlar ekranında görünür.'],
  ['Arayüz dili', 'Türkçe', 'Tek dil. Metinler koda yazılır, sözlük dosyası yok.'],
  ['Erişilebilirlik', '44px · 4.5:1',
   'Dokunma hedefi en az 44×44px, metin kontrastı en az 4.5:1.'],
];

/* Projeye özel teknik alanlar — sihirbazda ve Firma durağında sorulur.
   Projenin `palet` alanında saklanır; ayrı sütun gerekmez. */
const TEKNIK_ALAN = [
  { anahtar: 'roller', ad: 'Roller', tur: 'katman', ornek: 'Personel · Amir · Yönetici',
    alt: 'Kaç katman var ve en alttan en üste hangi sırayla? Üstteki, alttakinin '
       + 'gördüğü her şeyi görür. Veritabanı güvenlik kuralları buna göre yazılır.' },
  { anahtar: 'terim', ad: 'Terminoloji', ornek: 'cari → müşteri, hakediş → ödeme',
    alt: 'Müşterinin kendi sözcükleri. Yanlış sözcük kullanıcıyı yabancılaştırır.' },
  { anahtar: 'kayitNo', ad: 'Kayıt numarası', ornek: 'F-20418 · yıl başında sıfırlanır',
    alt: 'Kayıtlara numara verilecek mi, hangi biçimde? Sonradan değiştirilemez.' },
  { anahtar: 'alanAdi', ad: 'Alan adı', ornek: 'kubban.nizamsoft.com',
    alt: 'Müşteri hangi adresten girecek? Yayın ayarı ve PWA manifesti buna bağlı.' },
];

/* Rol katmanları: en alttan en üste. Üstteki, alttakinin yetkilerini de alır.
   Virgüllü liste yerine merdiven — çünkü yetki sırası kodu belirliyor. */
const ROL_ORNEK = {
  2: ['Personel', 'Yönetici'],
  3: ['Personel', 'Amir', 'Yönetici'],
  4: ['Personel', 'Amir', 'Yönetici', 'İşveren'],
  5: ['Personel', 'Amir', 'Müdür', 'Yönetici', 'İşveren'],
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

/* Bir alanın seçili değerleri — her zaman dizi döner.
   Tek seçimliler tek elemanlı; hiç seçilmemişse varsayılan. */
function bicimSecim(palet, alan) {
  const d = (palet || {})[alan.anahtar];
  /* Tek seçimlide bölmüyoruz: "Sayaç + büyük grafik" gibi adlar artı içeriyor
     ve bölünürse hiçbir seçeneğe uymayıp varsayılana düşüyordu. */
  const dizi = Array.isArray(d) ? d
    : !d ? []
    : alan.coklu ? String(d).split(/\s*[+,]\s*/)
    : [String(d)];
  const gecerli = dizi.filter(x => alan.secim.some(y => y.ad === x));
  if (!gecerli.length) return alan.bos ? [] : [alan.varsayilan];
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
