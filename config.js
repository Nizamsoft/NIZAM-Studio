/* ==========================================================================
   NIZAM | Studio — Yapılandırma
   Bu dosya her sürümde elle güncellenir.
   ========================================================================== */

const APP = {
  name:     'NIZAM | Studio',
  short:    'NIZAM Studio',
  owner:    'Nizam Soft',
  version: 'v0.18.0',
  build:    '2026-08-20',
  stage: 'Adım 4 · Hızlı açılış',
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
