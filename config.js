/* ==========================================================================
   NIZAM | Studio — Yapılandırma
   Bu dosya her sürümde elle güncellenir.
   ========================================================================== */

const APP = {
  name:     'NIZAM | Studio',
  short:    'NIZAM Studio',
  owner:    'Nizam Soft',
  version: 'v0.111.0',
  build:    '2026-08-28',
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


/* Birlikte olmayacak seçimler. Prompt bunları yasaklar, Studio yapıştırınca
   denetler. Her satır: [alan, değer] + [alan, değer] + neden. */
/* Birlikte olmayacak seçimler. Prompt bunları yasaklar, Studio yapıştırınca
   denetler. Her satır: [alan, değer] + [alan, değer] + neden.
   Görünüşe dair çelişkiler kalktı — onlara artık tarif karar veriyor. */
const CELISKI = [
  [['iceaktarma', 'Yok'], ['yedek', 'Yedek + değişiklik kaydı'], 'Dosya girişi yokken dosya yedeği tutarsız kalır.'],
];


/* Arayüz biçimi — Tasarımı belirleme durağında görselli seçilir.
   Değerler projenin `palet` alanında saklanır; ayrı sütun gerekmez.
   `tarif` doğrudan prompta ve NIZAM.md'ye yazılır: AI ne yapacağını buradan okur.
   `coklu` olanlarda birden fazla seçilebilir, seçimler birbirine karışır. */
const TASARIM_ALAN = [
];

/* ---- Yerleşim: ekranın iskeleti. Neyin nerede durduğu. ---- */
const YERLESIM_ALAN = [
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
    varsayilan: 'Ortada sınırlı', ekran: 'panel', genis: true, masaustu: true,
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
      { ad: 'Sağ üstte',      tarif: 'Sağ üst köşede yığılan kartlar. Masaüstü alışkanlığı.', tel: ['liste', 'sagUst'], masaustu: true },
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
];

/* ---- Açılış ve geçiş: uygulamaya girmeden önce ---- */
const ACILIS_ALAN = [
];

/* ---- Hareket: uygulamayı canlandıran katman. Kodda en son yazılır. ---- */
const HAREKET_ALAN = [
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
/* Bütün başlıklar tek dizide — prompt ve çözümleyici bunu gezer. */
const TUM_TASARIM = YERLESIM_ALAN.concat(TASARIM_ALAN, ACILIS_ALAN, DURUM_ALAN, HAREKET_ALAN, SISTEM_ALAN);

/* ---- Tasarım akışı ----
   Bir ekranda tek karar. Kaydırma yok.
   Öbekler dıştan içe: önce malzeme, sonra çatı, sonra ekran ekran, en sonda
   uç durumlar ve sistem işleri. Bir öbek içinde önizleme ekranı olabildiğince
   sabit kalır — boşuna zıplamasın. */
const AKIS_OBEK = [
  /* Görünüşe dair her şeye Görsel dünya adasındaki tarif karar veriyor.
     Burada kalanların ortak özelliği: bir ekran görüntüsünde görünmezler.
     Masaüstü genişliği telefon tasarımında yok, hareket miktarı durağan
     resimde yok, bildirimin nereye çıktığı davranıştır. */
  { ad: 'Kabuk', not: 'Ekranı saran çatı. Telefon tasarımında görünmeyen kısmı.',
    alanlar: ['genislik', 'sayfalistesi', 'yoliz', 'kullanicimenu', 'destek'] },
  { ad: 'Davranış', not: 'İş ters gittiğinde ve kullanıcı bir şey yaptığında ne olur.',
    alanlar: ['bildirim', 'islemsonuc', 'hata', 'onaysil', 'iceaktarma'] },
  { ad: 'Sistem', not: 'Uygulamanın kendi bakımı ve hareket miktarı.',
    alanlar: ['guncelleme', 'yedek', 'hareketMiktari'] },
];


/* Özet ve prompt aynı öbeklemeyi kullansın diye akıştan türetiliyor;
   eskiden ayrı bir liste vardı ve ikisi birbirinden kaçıyordu. */
const TASARIM_GRUP = AKIS_OBEK.map(o => ({
  anahtar: o.ad.toLowerCase(),
  ad: o.ad,
  alanlar: o.alanlar.map(k => TUM_TASARIM.find(a => a.anahtar === k)).filter(Boolean),
}));

const TASARIM_ADIM = [
  /* Uygulamanın bütün görünüşü bu adadan çıkıyor: logo ve işletme görseli
     ChatGPT'ye gidiyor, dönen tarif renk, yüzey, simge, tipografi ve hangi
     görselin nerede duracağını söylüyor. Studio karar vermiyor, taşıyor. */
  { anahtar: 'gorsel', ad: 'Görsel dünya', tur: 'gorsel', ekran: 'panel',
    obek: 'Görsel dünya',
    obekNot: 'Logo ve işletme görselinden çıkan tarif. Bütün ekranlar buna uyar.',
    aciklama: 'Promptu ChatGPT\'ye ver, dönen tarifi yapıştır, görselleri yerine koy.' },
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
   'Kayıt ekranı yok; hesabı yönetici açar.'],
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
  { anahtar: 'roller', ad: 'Roller', tur: 'katman', ornek: 'Personel · Amir · Yönetici',
    alt: 'Kaç katman var ve en alttan en üste hangi sırayla? Üstteki, alttakinin '
       + 'gördüğü her şeyi görür. Veritabanı güvenlik kuralları buna göre yazılır.' },
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
  'Değişiklik kaydı': ['Yerelde tutulur',
    'Ne, ne zaman değişti cihazda kaydedilir ve Ayarlar\'da listelenir. '
    + '"Kim" yok — uygulamayı tek kişi kullanıyor.'],
  'Dosya saklama': ['Yerel (IndexedDB)',
    'Eklenen dosyalar da cihazda durur; yedeğe dahil edilir.'],
  'Giriş': ['Yerel PIN',
    'Açılışta PIN sorulur, PIN cihazda saklanır. Bu gerçek kimlik doğrulama '
    + 'değil — meraklı gözlere karşı. Verinin kendisi şifrelenmez.'],
  'Paketler': ['Yok',
    'Dış paket kullanılmaz. Excel gerekiyorsa xlsx. Başka paket eklemeden önce sor.'],
  'Yedek': ['Dosyaya dışa/içe aktarma',
    'Ayarlar\'dan tek dosya olarak indirilir ve geri yüklenir. Sunucu olmadığı '
    + 'için yedeği almak kullanıcının sorumluluğunda; uygulama düzenli olarak hatırlatır.'],
};

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

/* Bir alanın seçili değerleri — her zaman dizi döner.
   Tek seçimliler tek elemanlı; hiç seçilmemişse varsayılan. */
/* ---- Sonradan eklenen kararlar ----
   Yeni bir karar eklendiğinde eski projeler onu fark etmiyordu: 51 adımın
   içinde kayboluyordu. Karara `eklendi` damgası, projeye de görülen sürüm
   yazılıyor; ikisi karşılaştırılıp rozet çıkarılıyor. */

function surumSayi(s) {
  return String(s || 'v0').replace(/^v/, '').split('.')
    .map(n => parseInt(n, 10) || 0)
    .reduce((t, n) => t * 1000 + n, 0);
}

/* Bu proje için henüz görülmemiş yeni kararlar.
   Yeni açılan projede boş döner: kurulurken görülen sürüm damgalanıyor. */
function yeniKararlar(palet) {
  const pl  = palet || {};
  const tab = surumSayi(pl.gorulenSurum);
  const gor = Array.isArray(pl.gorulenler) ? pl.gorulenler : [];
  return TUM_TASARIM.filter(a => a.eklendi
    && surumSayi(a.eklendi) > tab
    && !pl[a.anahtar]
    && gor.indexOf(a.anahtar) < 0);
}

/* Standardın yaşayan listesi: tablo doluysa o, boşsa koddaki tohum. */
function standartListesi() {
  const t = (typeof DB !== 'undefined' && Array.isArray(DB.standartlar)) ? DB.standartlar : [];
  return t.length ? t : standartTohum();
}

/* Bu proje için henüz duyurulmamış standartlar.
   Tasarım kararlarından farkı: standardın palette bir değeri yok, seçimi de
   yok — susturmanın tek yolu "Gördüm" (palet.gorulenStandart).
   Susturma kaydı satırın id'sini tutar; eski kayıtlar ad tuttuğu için
   alan ve başlık da eşleşme sayılır, yoksa bir kez "gördüm" denenler
   geri gelirdi. */
function yeniStandartlar(palet) {
  const pl  = palet || {};
  const tab = surumSayi(pl.gorulenSurum);
  const gor = Array.isArray(pl.gorulenStandart) ? pl.gorulenStandart : [];
  const susturuldu = st => gor.indexOf(st.id) >= 0
    || gor.indexOf(st.alan) >= 0 || gor.indexOf(st.ad) >= 0;

  return standartListesi().filter(st => st.eklendi
    && surumSayi(st.eklendi) > tab
    && !susturuldu(st));
}

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

const SAYFA_EYLEM = ['Ekle', 'Düzenle', 'Sil', 'Onayla', 'Ara', 'Filtrele',
                     'Dışa aktar', 'Yazdır', 'Kopyala', 'İçe aktar', 'Toplu güncelle'];

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
