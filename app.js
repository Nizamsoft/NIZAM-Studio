/* ==========================================================================
   NIZAM | Studio — Uygulama
   Adım 4: prompt motoru, Nizam Standartları ve proje kimlik dosyası.
   ========================================================================== */

'use strict';

const $  = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));

/* ---------- Rotalar ---------- */

/* kisa = üst çubukta firma adının altında görünen ad. */
const ROUTES = {
  panel:       { title: 'Panel',              kisa: 'Panel',       sub: () => todayLabel() },
  projeler:    { title: 'Projeler',           kisa: 'Projeler',    sub: () => projelerAltBaslik() },
  gorevler:    { title: 'Bana Atananlar',     kisa: 'Görevler',    sub: () => gorevlerAltBaslik() },
  standartlar: { title: 'Nizam Standartları', kisa: 'Standartlar', sub: () => standartAltBaslik() },
  sektorler:   { title: 'Sektörler',           kisa: 'Sektörler',   sub: () => sektorAltBaslik() },
  paketler:    { title: 'Paketler',            kisa: 'Paketler',    sub: () => paketAltBaslik() },
  kilitler:    { title: 'Kilitli Projeler',    kisa: 'Kilit',       sub: () => kilitAltBaslik() },
  templateler: { title: 'Templateler',         kisa: 'Template',    sub: () => cekirdekAltBaslik() },
  tasarimlar:  { title: 'Tasarımlar',          kisa: 'Tasarım',     sub: () => TASARIM_YON.length + ' hazır tasarım' },
  ekip:        { title: 'Ekip',               kisa: 'Ekip',        sub: () => ekipAltBaslik() },
  sohbet:      { title: 'Sohbet',             kisa: 'Sohbet',      sub: () => 'Ekip ile iletişimde kal' },
  guvenlik:    { title: 'Güvenlik Testi',     kisa: 'Güvenlik',    sub: () => 'anon key ve istersen personel girişiyle test et' },
  ayarlar:     { title: 'Ayarlar',            kisa: 'Ayarlar',     sub: () => APP.version + ' · ' + APP.stage },
};

const DEFAULT_ROUTE = 'panel';

/* Bir proje bitmiş sayılır mı: final verildiyse evet — görev yüzdesi
   %100 olmasa da (görev hiç kullanılmayan bir projede yüzde hep sıfır
   kalıyordu, final verilse bile "Başlamış" kovasından hiç çıkmıyordu). */
/* Projenin ilerlemesi ADIMLARA göre: bitmiş aşama / sayılan aşama.
   (Eskiden biten görev / toplam görevdi; aynı proje sıfır görevle %0,
   tek görevle %100 görünüyordu — gerçek durumu anlatmıyordu.)
   Gizli ve "sayilmaz" adımlar hesaba girmiyor. */
/* Her kelimenin baş harfi büyük — "güllüoğlu kübban" kartta "Güllüoğlu
   Kübban" görünsün. Kelimenin geri kalanına dokunulmuyor: "QR Menu" gibi
   bilerek büyük yazılmış kısaltmalar bozulmasın. Türkçe kuralı: i → İ. */
function basHarfleriBuyuk(metin) {
  return String(metin || '').replace(/(^|[\s\-\/(])([\p{L}])/gu,
    (_, once, harf) => once + harf.toLocaleUpperCase('tr'));
}

function projeAsamaYuzde(p) {
  if (!p) return 0;
  const sayilan = projeDuraklari(p).filter(d => !d.gizli && !d.sayilmaz);
  if (!sayilan.length) return 0;
  return Math.round(sayilan.filter(d => d.bitti).length / sayilan.length * 100);
}

function projeBittiMi(p) {
  if (!p) return false;
  return !!(p.palet && p.palet.finalVerildi)
      || p.durum === 'tamamlandi'
      || projeAsamaYuzde(p) >= 100;
}

/* Projeler ekranının iki kovası. Adres `#/projeler/basmis` — proje kimlikleri
   uuid olduğu için bu iki kelimeyle asla çakışmaz.

   İki kova var, üç değil: bu yüzden "başlamış" bitmiş OLMAMAYA bakıyor. */
const PROJE_KOVASI = {
  basmis: { ad: 'Başlamış Projeler', ikon: 'saat', sinif: 'k-basmis',
            sec: p => !projeBittiMi(p) },
  bitmis: { ad: 'Bitmiş Projeler',   ikon: 'bitti', sinif: 'k-bitmis',
            sec: p => projeBittiMi(p) },
};

/* Template — müşteri işi değil, yeniden kullanılacak bir çekirdek proje.
   ("cekirdek" ismi bilerek: "iskelet" adı zaten yükleme placeholder'ı
   iskeletler()'de kullanılıyor, karışmasın.) Normal Projeler'den (kova
   sayımı, kaynak seçimi, sayaçlar) her yerde gizli tutuluyor; kendi
   "Templateler" bölümünde ayrıca yönetiliyor. */
function cekirdekMi(p) {
  return !!((p && p.palet) || {}).cekirdek;
}

function rota() {
  const p = (location.hash || '').replace(/^#\/?/, '').split('/').filter(Boolean);
  const key = ROUTES[p[0]] ? p[0] : DEFAULT_ROUTE;
  /* Üçüncü parça proje içindeki durak sayfası: #/projeler/<id>/firma */
  return { key, id: p[1] || null, durak: p[2] || null };
}

/* ---------- Durum ---------- */

let YUKLENIYOR     = false;
let GOREV_FILTRE   = '';
/* Projeler ekranının araçları. Arama DOM üstünde çalışıyor (her harfte
   ekranı yeniden çizmek yazarken imleci kaçırıyor), diğerleri yeniden
   çizdiriyor. Görünüm tercihi kalıcı: kullanıcı her girişte seçmesin. */
let PROJE_ARAMA  = '';
/* Ekip ekranının araçları — Projeler'dekiyle aynı mantık. */
let SEKTOR_ARAMA = '';
let TEMPLATE_ARAMA = '';
let SEKTOR_SIRA  = 'sira';
let EKIP_ARAMA = '';
let SOHBET_ARAMA = '';
let EKIP_SUZ   = 'tumu';
let EKIP_SIRA  = 'aktiflik';
let SON_EKRAN      = '';
/* Tamamlanmış bir aşamaya dönünce form değil özet görünüyor; "Düzenle"
   denince o aşama bu değişkende tutuluyor ve alanlar yeniden açılıyor.
   Başka bir aşamaya geçilince kendiliğinden sıfırlanıyor (bkz. render). */
/* Bağlantılar aşamasında açık duran bağlantı (kullanıcı başlığa dokununca). */
let ACIK_BAGLANTI = null;
/* Beta durağındaki ilk kurulum zincirinde açık duran adım — aynı mekanik. */
let ACIK_KURULUM = null;
let DUZENLENEN_DURAK = null;
/* Düzenlemeye girerken alınan kopya: "İptal" bu hâle geri döndürüyor.
   (Logo ve işletme görseli ayrı yüklendiği için geri alınmıyor.) */
let DUZENLEME_YEDEK = null;
const ACIK_STANDART = new Set();
/* Gruplar akordeon: aynı anda yalnızca biri açık kalır. */
let ACIK_GRUP = null;
let LOGO_ZAMANLAYICI = null;

/* ---------- İkonlar ---------- */

/* İkonlar iki katmanlı: altta soluk dolgu, üstte ince çizgi.
   Koyu zeminde tek çizgi silinip gidiyordu; dolgu her simgeye gövde veriyor.
   `d` = dolgu şekli (kapalı), `c` = çizgi. Sade işaretler (ok, artı, tik)
   tek katman kalır — onlar simge değil, yön gösterir. */

const ICON = {
  /* Yıldız — "varsayılan" işareti. */
  yildiz: {
    d: '<path d="M12 3.6l2.6 5.3 5.9.9-4.3 4.1 1 5.8-5.2-2.8-5.2 2.8 1-5.8-4.3-4.1 5.9-.9z"></path>',
    c: '<path d="M12 3.6l2.6 5.3 5.9.9-4.3 4.1 1 5.8-5.2-2.8-5.2 2.8 1-5.8-4.3-4.1 5.9-.9z"></path>',
  },
  /* Paket — kapaklı kutu. */
  paket: {
    d: '<path d="M12 3l8 4.2v9.6L12 21l-8-4.2V7.2z"></path>',
    c: '<path d="M12 3l8 4.2v9.6L12 21l-8-4.2V7.2z"></path>'
     + '<path d="M4 7.2l8 4.2 8-4.2M12 11.4V21"></path>',
  },
  /* Sıralama düğmesi — üstte uzun, altta kısa çizgi ve aşağı ok. */
  suzgecSira: '<path fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round"'
    + ' d="M4 7h13M4 12h9M4 17h5M17 13v7M17 20l-2.6-2.6M17 20l2.6-2.6"></path>',
  /* Kütüphane kartları: pasta dilimi, doküman ve dört kutulu ızgara. */
  pasta: {
    d: '<path d="M12 3a9 9 0 0 1 9 9h-9z"></path>',
    c: '<circle cx="12" cy="12" r="9"></circle><path d="M12 3v9h9"></path>',
  },
  dokuman: {
    d: '<rect x="5" y="3" width="14" height="18" rx="2.5"></rect>',
    c: '<rect x="5" y="3" width="14" height="18" rx="2.5"></rect>'
     + '<path d="M9 8h6M9 12h6M9 16h3.5"></path>',
  },
  izgaraDort: {
    d: '<rect x="4" y="4" width="7" height="7" rx="2"></rect>'
     + '<rect x="13" y="13" width="7" height="7" rx="2"></rect>',
    c: '<rect x="4" y="4" width="7" height="7" rx="2"></rect>'
     + '<rect x="13" y="4" width="7" height="7" rx="2"></rect>'
     + '<rect x="4" y="13" width="7" height="7" rx="2"></rect>'
     + '<rect x="13" y="13" width="7" height="7" rx="2"></rect>',
  },
  /* Hesap ekranı: fotoğraf rozeti, kaydet düğmesi ve rol satırı. */
  kamera: {
    d: '<circle cx="12" cy="13" r="3.4"></circle>',
    c: '<path d="M4 8h3l1.6-2h6.8L17 8h3a1 1 0 0 1 1 1v9a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9a1 1 0 0 1 1-1z"></path>'
     + '<circle cx="12" cy="13" r="3.4"></circle>',
  },
  kaydet: {
    d: '<rect x="8" y="4" width="8" height="5" rx="1"></rect>',
    c: '<path d="M5 4h11l4 4v12a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1z"></path>'
     + '<path d="M8 4v5h8V4"></path><rect x="8" y="13" width="8" height="6" rx="1"></rect>',
  },
  kisiler: {
    d: '<circle cx="9.5" cy="8" r="3.2"></circle>',
    c: '<circle cx="9.5" cy="8" r="3.2"></circle>'
     + '<path d="M3.5 19a6 6 0 0 1 12 0"></path>'
     + '<path d="M16.5 5.4a3.2 3.2 0 0 1 0 5.2M18 13.4a6 6 0 0 1 2.5 4.6"></path>',
  },
  /* Yayın: ortadan dışarı açılan dalga. Ayarlar'daki "Yayın" başlığı için. */
  yayin: {
    d: '<circle cx="12" cy="12" r="2.2"></circle>',
    c: '<circle cx="12" cy="12" r="2.2"></circle>'
     + '<path d="M7.8 7.8a6 6 0 0 0 0 8.4M16.2 16.2a6 6 0 0 0 0-8.4"></path>'
     + '<path d="M4.9 4.9a10 10 0 0 0 0 14.2M19.1 19.1a10 10 0 0 0 0-14.2"></path>',
  },
  /* Dişli — "ayar" ikonu sürgü çizgileri; başlık kartında dişli isteniyor. */
  disli: {
    d: '<circle cx="12" cy="12" r="3.2"></circle>',
    c: '<circle cx="12" cy="12" r="3.2"></circle>'
     + '<path d="M19.4 14.6a1.7 1.7 0 0 0 .3 1.9l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0'
     + ' -1.9-.3 1.7 1.7 0 0 0-1 1.5v.3a2 2 0 1 1-4 0v-.2a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0'
     + ' -1.9.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.9 1.7 1.7 0 0 0-1.5-1H3.7a2 2'
     + ' 0 1 1 0-4h.2a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.9l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7'
     + ' 1.7 0 0 0 1.9.3h.1a1.7 1.7 0 0 0 1-1.5V3.7a2 2 0 1 1 4 0v.2a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0'
     + ' 0 0 1.9-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.9v.1a1.7 1.7 0 0 0 1.5 1h.3a2'
     + ' 2 0 1 1 0 4h-.2a1.7 1.7 0 0 0-1.5 1z"></path>',
  },
  folder: {
    d: '<path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>',
    c: '<path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>',
  },
  check: {
    d: '<rect x="4" y="4" width="16" height="16" rx="3"></rect>',
    c: '<path d="M20 12v7a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h9"></path><path d="M9 11l3 3 8-8"></path>',
  },
  info: {
    d: '<circle cx="12" cy="12" r="9"></circle>',
    c: '<circle cx="12" cy="12" r="9"></circle><path d="M12 11v5M12 7.5v.01"></path>',
  },
  uyari: {
    d: '<path d="M12 4l9 16H3z"></path>',
    c: '<path d="M12 4l9 16H3z"></path><path d="M12 10v4M12 17.5v.01"></path>',
  },
  cop: {
    d: '<path d="M6 7h12l-1 13H7z"></path>',
    c: '<path d="M4 7h16M9 7V5h6v2M6 7l1 13h10l1-13"></path>',
  },
  kalem: {
    d: '<path d="M4 20h4L20 8l-4-4L4 16z"></path>',
    c: '<path d="M4 20h4L20 8l-4-4L4 16z"></path>',
  },
  kova: {
    d: '<circle cx="12" cy="12" r="9"></circle>',
    c: '<circle cx="12" cy="12" r="9"></circle><path d="M12 8v8M8 12h8"></path>',
  },
  katman: {
    d: '<path d="M20 7l-8-4-8 4 8 4z"></path>',
    c: '<path d="M20 7l-8-4-8 4 8 4z"></path><path d="M4 12l8 4 8-4M4 17l8 4 8-4"></path>',
  },
  geriAl: {
    d: '',
    c: '<path d="M3.5 9.5A9 9 0 1 1 3 13.2"></path><path d="M3 4.5v5h5"></path>',
  },
  goz: {
    d: '<path d="M2 12s3.6-6 10-6 10 6 10 6-3.6 6-10 6-10-6-10-6z"></path>',
    c: '<path d="M2 12s3.6-6 10-6 10 6 10 6-3.6 6-10 6-10-6-10-6z"></path><circle cx="12" cy="12" r="3"></circle>',
  },
  kisi: {
    d: '<circle cx="12" cy="8" r="4"></circle><path d="M4 21v-1a6 6 0 0 1 6-6h4a6 6 0 0 1 6 6v1z"></path>',
    c: '<circle cx="12" cy="8" r="4"></circle><path d="M4 21v-1a6 6 0 0 1 6-6h4a6 6 0 0 1 6 6v1"></path>',
  },
  kopya: {
    d: '<rect x="9" y="9" width="12" height="12" rx="2"></rect>',
    c: '<rect x="9" y="9" width="12" height="12" rx="2"></rect><path d="M5 15V5a2 2 0 0 1 2-2h10"></path>',
  },
  zil: {
    d: '<path d="M12 3a6 6 0 0 0-6 6v3.6L4.5 15a1 1 0 0 0 .9 1.5h13.2a1 1 0 0 0 .9-1.5L18 12.6V9a6 6 0 0 0-6-6z"></path>',
    c: '<path d="M12 3a6 6 0 0 0-6 6v3.6L4.5 15a1 1 0 0 0 .9 1.5h13.2a1 1 0 0 0 .9-1.5L18 12.6V9a6 6 0 0 0-6-6zM9.8 19.5a2.4 2.4 0 0 0 4.4 0"></path>',
  },
  destek: {
    d: '<path d="M4 14.5h2.2a1 1 0 0 1 1 1v3a1 1 0 0 1-1 1H5.2a1.2 1.2 0 0 1-1.2-1.2zM20 14.5h-2.2a1 1 0 0 0-1 1v3a1 1 0 0 0 1 1h1a1.2 1.2 0 0 0 1.2-1.2z"></path>',
    c: '<path d="M4 15.5v-3a8 8 0 0 1 16 0v3M4 14.5h2.2a1 1 0 0 1 1 1v3a1 1 0 0 1-1 1H5.2a1.2 1.2 0 0 1-1.2-1.2zM20 14.5h-2.2a1 1 0 0 0-1 1v3a1 1 0 0 0 1 1h1a1.2 1.2 0 0 0 1.2-1.2z"></path>',
  },
  cikis: '<path d="M15 4h3a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-3M10 16l4-4-4-4M14 12H3"></path>',
  telefon: {
    d: '<path d="M6.5 3.5h3l1.5 4-2 1.4a12 12 0 0 0 6.1 6.1l1.4-2 4 1.5v3a2 2 0 0 1-2.2 2A17.5 17.5 0 0 1 4.5 5.7 2 2 0 0 1 6.5 3.5z"></path>',
    c: '<path d="M6.5 3.5h3l1.5 4-2 1.4a12 12 0 0 0 6.1 6.1l1.4-2 4 1.5v3a2 2 0 0 1-2.2 2A17.5 17.5 0 0 1 4.5 5.7 2 2 0 0 1 6.5 3.5z"></path>',
  },
  mail: {
    d: '<rect x="3" y="5.5" width="18" height="13" rx="2.5"></rect>',
    c: '<rect x="3" y="5.5" width="18" height="13" rx="2.5"></rect><path d="M3.6 7l8.4 6 8.4-6"></path>',
  },

  /* İçe aktar: kutuya inen ok */
  ice: {
    d: '<path d="M4 15v3a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-3"></path>',
    c: '<path d="M4 15v3a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-3M12 4v10M8 10l4 4 4-4"></path>',
  },

  panel: {
    d: '<rect x="3" y="3" width="7" height="7" rx="1.8"></rect><rect x="14" y="3" width="7" height="7" rx="1.8"></rect><rect x="3" y="14" width="7" height="7" rx="1.8"></rect><rect x="14" y="14" width="7" height="7" rx="1.8"></rect>',
    c: '<rect x="3" y="3" width="7" height="7" rx="1.8"></rect><rect x="14" y="3" width="7" height="7" rx="1.8"></rect><rect x="3" y="14" width="7" height="7" rx="1.8"></rect><rect x="14" y="14" width="7" height="7" rx="1.8"></rect>',
  },
  ayar: {
    d: '<circle cx="9" cy="7" r="2.7"></circle><circle cx="15" cy="17" r="2.7"></circle>',
    c: '<path d="M4 7h16M4 17h16"></path><circle cx="9" cy="7" r="2.7"></circle><circle cx="15" cy="17" r="2.7"></circle>',
  },

  nokta: {
    d: '<circle cx="5" cy="12" r="1.9"></circle><circle cx="12" cy="12" r="1.9"></circle><circle cx="19" cy="12" r="1.9"></circle>',
    c: '<circle cx="5" cy="12" r="1.9"></circle><circle cx="12" cy="12" r="1.9"></circle><circle cx="19" cy="12" r="1.9"></circle>',
  },

  /* tek katman işaretler */
  chevron: '<path d="M9 6l6 6-6 6"></path>',

  /* Final durağı: teslim bayrağı. */
  bayrak: {
    d: '<path d="M5 4h11l-2 3.5L16 11H5z"></path>',
    c: '<path d="M5 21V4h11l-2 3.5L16 11H5"></path>',
  },

  /* Proje kovaları: süren iş ve bitmiş iş. */
  saat: {
    d: '<circle cx="12" cy="12" r="9"></circle>',
    c: '<circle cx="12" cy="12" r="9"></circle><path d="M12 7.2V12l3.2 2"></path>',
  },
  bitti: {
    d: '<circle cx="12" cy="12" r="9"></circle>',
    c: '<circle cx="12" cy="12" r="9"></circle><path d="M8.2 12.3l2.6 2.6 5-5.4"></path>',
  },

  /* Kum saati — güncelleme denetlenirken devriliyor. */
  kum: {
    d: '<path d="M7.5 3.6h9v2.2L12 12l4.5 6.2v2.2h-9v-2.2L12 12 7.5 5.8z"></path>',
    c: '<path d="M6.5 3.6h11M6.5 20.4h11"></path><path d="M7.5 3.6v2.2L12 12l-4.5 6.2v2.2M16.5 3.6v2.2L12 12l4.5 6.2v2.2"></path>',
  },

  /* --- Standart grupları. Sekiz grubun her birine kendi simgesi:
     hepsi aynı katman simgesiyken kartlar birbirinden ayırt edilemiyordu.
     Renkleri style.css'te, burada yalnız biçim var. --- */
  gAltyapi: {
    d: '<path d="M20 7l-8-4-8 4 8 4z"></path>',
    c: '<path d="M20 7l-8-4-8 4 8 4z"></path><path d="M4 12l8 4 8-4M4 17l8 4 8-4"></path>',
  },
  gVeri: {
    d: '<ellipse cx="12" cy="6" rx="7" ry="3"></ellipse>',
    c: '<ellipse cx="12" cy="6" rx="7" ry="3"></ellipse><path d="M5 6v12c0 1.7 3.1 3 7 3s7-1.3 7-3V6M5 12c0 1.7 3.1 3 7 3s7-1.3 7-3"></path>',
  },
  gGuvenlik: {
    d: '<path d="M12 3l7 3v5.5c0 4.4-2.9 8-7 9.5-4.1-1.5-7-5.1-7-9.5V6z"></path>',
    c: '<path d="M12 3l7 3v5.5c0 4.4-2.9 8-7 9.5-4.1-1.5-7-5.1-7-9.5V6z"></path><path d="M9 12l2 2 4-4"></path>',
  },
  gTasarim: {
    d: '<path d="M12 3a9 9 0 0 0 0 18c1.1 0 1.7-.8 1.7-1.6 0-1.3-1-1.7-1-2.7 0-.8.6-1.4 1.5-1.4H16a5 5 0 0 0 5-5c0-4-4-7.3-9-7.3z"></path>',
    c: '<path d="M12 3a9 9 0 0 0 0 18c1.1 0 1.7-.8 1.7-1.6 0-1.3-1-1.7-1-2.7 0-.8.6-1.4 1.5-1.4H16a5 5 0 0 0 5-5c0-4-4-7.3-9-7.3z"></path><path d="M7.5 12v.01M10 8.5v.01M14.5 7.5v.01M17.5 11v.01"></path>',
  },
  gAnimasyon: {
    d: '<circle cx="12" cy="12" r="9"></circle>',
    c: '<path d="M3 14c2.2 0 2.2-4 4.5-4S9.7 14 12 14s2.2-4 4.5-4 2.3 4 4.5 4"></path><path d="M3 19h18"></path>',
  },
  gOptimizasyon: {
    d: '<path d="M13 2L4.5 13.5H11l-1 8.5 8.5-11.5H12z"></path>',
    c: '<path d="M13 2L4.5 13.5H11l-1 8.5 8.5-11.5H12z"></path>',
  },
  gBicim: {
    d: '<rect x="3.5" y="4" width="17" height="16" rx="2.5"></rect>',
    c: '<rect x="3.5" y="4" width="17" height="16" rx="2.5"></rect><path d="M7.5 9h9M7.5 12.5h9M7.5 16h5"></path>',
  },
  gErisim: {
    d: '<circle cx="12" cy="12" r="9"></circle>',
    c: '<circle cx="12" cy="12" r="9"></circle><path d="M12 7.5v.01"></path><path d="M8 10.2c2.6.7 5.4.7 8 0M12 10.6V15m0 0l-2.2 3.6M12 15l2.2 3.6"></path>',
  },
  /* --- Firma bilgileri künyesi. Her satırın kendi simgesi olsun diye:
     hepsi aynı simgeyken ızgara yazı listesine dönüyordu. --- */
  etiket: {
    d: '<path d="M11 3H4v7l10 10 7-7z"></path>',
    c: '<path d="M11 3H4v7l10 10 7-7L11 3z"></path><circle cx="7.6" cy="6.6" r="1.2"></circle>',
  },
  dil: {
    d: '<circle cx="12" cy="12" r="9"></circle>',
    c: '<circle cx="12" cy="12" r="9"></circle><path d="M3 12h18M12 3a15 15 0 0 1 0 18 15 15 0 0 1 0-18z"></path>',
  },
  para: {
    d: '<circle cx="12" cy="12" r="9"></circle>',
    c: '<circle cx="12" cy="12" r="9"></circle><path d="M14.5 9a3 3 0 1 0-2.5 6M9.5 10.5h5M9.5 13.5h5"></path>',
  },
  bulut: {
    d: '<path d="M7.5 18h9.2a3.8 3.8 0 0 0 .4-7.6A5.4 5.4 0 0 0 6.9 10a4 4 0 0 0 .6 8z"></path>',
    c: '<path d="M7.5 18h9.2a3.8 3.8 0 0 0 .4-7.6A5.4 5.4 0 0 0 6.9 10a4 4 0 0 0 .6 8z"></path>',
  },
  takvim: {
    d: '<rect x="3.5" y="5" width="17" height="15" rx="2.4"></rect>',
    c: '<rect x="3.5" y="5" width="17" height="15" rx="2.4"></rect><path d="M3.5 9.6h17M8 3v3.6M16 3v3.6"></path>',
  },
  dukkan: {
    d: '<path d="M4 9.5h16V20H4z"></path>',
    c: '<path d="M3 9.5 4.8 4h14.4L21 9.5M4.5 9.5V20h15V9.5M9.5 20v-4.6h5V20"></path>',
  },
  dal: {
    d: '<circle cx="6.5" cy="6" r="2.2"></circle><circle cx="6.5" cy="18" r="2.2"></circle><circle cx="17.5" cy="7.5" r="2.2"></circle>',
    c: '<circle cx="6.5" cy="6" r="2.2"></circle><circle cx="6.5" cy="18" r="2.2"></circle><circle cx="17.5" cy="7.5" r="2.2"></circle><path d="M6.5 8.2v7.6M17.5 9.7c0 3.4-2.6 4.6-6.2 5.4"></path>',
  },
  dosya: {
    d: '<path d="M13 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V9z"></path>',
    c: '<path d="M13 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V9l-6-6z"></path><path d="M13 3v6h6"></path>',
  },
  anahtar: {
    d: '<circle cx="8" cy="12" r="3.4"></circle>',
    c: '<circle cx="8" cy="12" r="3.4"></circle><path d="M11.4 12H21M18 12v3M15 12v2.2"></path>',
  },
  /* Renk seçimi. İki yerde kullanılıyordu ama tanımı yoktu — karo boş çıkıyordu. */
  boya: {
    d: '<path d="M12 3a9 9 0 0 0 0 18c1.1 0 1.7-.8 1.7-1.6 0-1.3-1-1.7-1-2.7 0-.8.6-1.4 1.5-1.4H16a5 5 0 0 0 5-5c0-4-4-7.3-9-7.3z"></path>',
    c: '<path d="M12 3a9 9 0 0 0 0 18c1.1 0 1.7-.8 1.7-1.6 0-1.3-1-1.7-1-2.7 0-.8.6-1.4 1.5-1.4H16a5 5 0 0 0 5-5c0-4-4-7.3-9-7.3z"></path><path d="M7.5 12v.01M10 8.5v.01M14.5 7.5v.01M17.5 11v.01"></path>',
  },
  arti:    '<path d="M12 5v14M5 12h14"></path>',
  tik:     '<path d="M5 12l5 5L20 7"></path>',
  kapat:   '<path d="M6 6l12 12M18 6L6 18"></path>',
  ev:      '<path d="M3 10.5 12 4l9 6.5V20a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1z"></path>',
  kilit:   '<rect x="5" y="10" width="14" height="10" rx="2"></rect>'
         + '<path d="M8 10V7a4 4 0 0 1 8 0v3"></path>',
  /* Dışarı açılan bağlantı: Supabase, GitHub, Namecheap. */
  disari:  '<path d="M14 4h6v6M20 4l-9 9"></path>'
         + '<path d="M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5"></path>',
  /* İhtiyaç çözümlemesi: bakıp anlama işi — büyüteç. */
  arama:   '<circle cx="11" cy="11" r="6.4"></circle><path d="M15.8 15.8L20.5 20.5"></path>',
  resim:   '<rect x="3" y="5" width="18" height="14" rx="2"></rect>'
         + '<circle cx="8.5" cy="10" r="1.6"></circle>'
         + '<path d="M4 17l5-4.5 4 3.5 3-2.5 4 3.5"></path>',
};

let notDefteriAc = () => {};

/* ---------- Not defteri ----------
   Tepeden açılan geçici karalama alanı. Hiçbir yere kaydedilmiyor: bilerek,
   kullanıcı "kayıt etmesine gerek yok" dedi. Sekmeler arasında duruyor,
   sayfa yenilenince gidiyor. */
function notDefteriKur() {
  const kutu = $('#notluk');
  if (!kutu || kutu.dataset.kuruldu) return;
  kutu.dataset.kuruldu = '1';

  const ac = (acik) => {
    kutu.classList.toggle('kapali', !acik);
    kutu.setAttribute('aria-hidden', acik ? 'false' : 'true');
    if (acik) setTimeout(() => $('#nt-metin').focus(), 220);
  };
  /* Açma düğmesi artık üst çubukta değil, hesap panelinde. */
  notDefteriAc = ac;
  $('#nt-kapat').addEventListener('click', () => ac(false));
  $('#nt-temizle').addEventListener('click', () => {
    $('#nt-metin').value = ''; $('#nt-metin').focus();
  });
  $('#nt-kopya').addEventListener('click', async () => {
    const m = $('#nt-metin').value;
    if (!m.trim()) return toast('Not boş.', 'hata');
    try { await navigator.clipboard.writeText(m); toast('Not kopyalandı.'); }
    catch (h) { $('#nt-metin').select(); toast('Kopyalanamadı, elle seç.', 'hata'); }
  });

  /* Boyu alt kenardan çekerek ayarlanır. */
  const tut = $('#nt-tut');
  let bas = 0, ilk = 0;
  const y = e => (e.touches ? e.touches[0].clientY : e.clientY);
  const basla = e => {
    bas = y(e); ilk = kutu.getBoundingClientRect().height;
    kutu.classList.add('tasima');
    document.addEventListener('pointermove', surukle);
    document.addEventListener('pointerup', bitir);
    e.preventDefault();
  };
  const surukle = e => {
    const boy = Math.max(160, Math.min(innerHeight - 90, ilk + (y(e) - bas)));
    kutu.style.height = boy + 'px';
  };
  const bitir = () => {
    kutu.classList.remove('tasima');
    document.removeEventListener('pointermove', surukle);
    document.removeEventListener('pointerup', bitir);
  };
  tut.addEventListener('pointerdown', basla);
}

function svg(ikon, boy = 16) {
  const cift  = ikon && typeof ikon === 'object';
  const dolgu = cift ? `<g class="dolgu">${ikon.d}</g>` : '';
  const cizgi = cift ? ikon.c : ikon;
  return `<svg viewBox="0 0 24 24" style="width:${boy}px;height:${boy}px">${dolgu}${cizgi}</svg>`;
}

/* Gerçek servis logoları — GitHub/Claude/Supabase/Namecheap. Kendi renkleriyle
   basılıyorlar, tek renge boyanan aşama ikonlarından (mask-image) farklı
   teknik: düz `<img>`. Bağlantılar sihirbazında VE Program temeli'ndeki
   karar kartlarında (Veriler nerede, Alan adı) aynı dosyalar kullanılıyor —
   "hangi servisi seçtin" hep aynı görselle anlatılsın diye. */
const SERVIS_LOGO = {
  github: 'ikon/asama/github.png', claude: 'ikon/asama/claude.png',
  supabase: 'ikon/asama/supabase.png', namecheap: 'ikon/asama/namecheap.png',
};

function servisIkon(ad, boy) {
  return `<img class="servis-ikon" src="${SERVIS_LOGO[ad]}" alt="" width="${boy}" height="${boy}">`;
}

/* ==========================================================================
   GÖRÜNÜMLER
   ========================================================================== */

const VIEWS = {

  /* ---------- Panel ---------- */

  panel: () => {
    if (YUKLENIYOR) return iskeletler(4);
    if (DB.hata)    return hataKutusu(DB.hata);

    const p = DB.projeler.filter(x => !cekirdekMi(x));

    /* Panelin dört katmanı, yukarıdan aşağı:
         hero    · selam ve marka anı,
         sayılar · devam eden proje ve açık görev,
         projeler· en son dokunulan üç proje,
         ekip    · kim şu an uygulamada.
       Sıra bilinçli: önce "kim olduğun", sonra "ne durumda", sonra
       "neye dokunacaksın", en sonda "kim yanında". */
    return `
      ${panelHero()}
      ${panelSayilar(p)}
      ${panelProjeler(p)}
      <div class="pz-ikili">
        ${panelEkip()}
        ${panelAktivite()}
      </div>
    `;
  },

  /* ---------- Projeler ---------- */

  projeler: () => {
    if (YUKLENIYOR) return iskeletler(6);
    if (DB.hata)    return hataKutusu(DB.hata);
    /* Kovasız adres devam eden projelere düşer. */
    return projelerEkrani('basmis');
  },

  /* Aynı ekran, sekmesi seçili hâlde: #/projeler/basmis · #/projeler/bitmis */
  projeKovasi: (k) => {
    if (YUKLENIYOR) return iskeletler(6);
    if (DB.hata)    return hataKutusu(DB.hata);
    return projelerEkrani(PROJE_KOVASI[k] ? k : 'basmis');
  },

  /* ---------- Proje detayı ---------- */

  projeDetay: (id) => {
    if (YUKLENIYOR) return iskeletler(4);
    if (DB.hata)    return hataKutusu(DB.hata);

    const proje = DB.proje(id);
    if (!proje) {
      return `<div class="card">${empty(ICON.uyari, 'Proje bulunamadı',
        'Silinmiş veya arşive alınmış olabilir.', 'Projelere dön', 'projelere')}</div>`;
    }

    return projeYolu(proje);
  },

  /* ---------- Diğerleri ---------- */

  gorevler: () => {
    if (YUKLENIYOR) return iskeletler(4);
    if (DB.hata)    return hataKutusu(DB.hata);

    const benim = AUTH.user ? DB.gorevleri({ kisi: AUTH.user.id }) : [];
    const acik  = benim.filter(g => g.durum !== 'tamamlandi');

    if (!benim.length) {
      return `<div class="card">${empty(ICON.check, 'Sana atanmış iş yok',
        'Bir görev sana atandığında burada projesi, sayfası ve promptu ile birlikte listelenecek.')}</div>`;
    }

    const listelenen = GOREV_FILTRE
      ? benim.filter(g => g.durum === GOREV_FILTRE)
      : acik;

    const say = d => benim.filter(g => g.durum === d).length;

    return `
      <div class="filtre">
        ${filtreDugmesi('', 'Açık işler', acik.length)}
        ${DURUMLAR.map(d => filtreDugmesi(d.anahtar, d.ad, say(d.anahtar))).join('')}
      </div>

      ${listelenen.length
        ? `<div class="card liste">${listelenen.map(gorevKarti).join('')}</div>`
        : `<div class="card">${empty(ICON.check, 'Bu bölümde iş yok', 'Başka bir filtre dene.')}</div>`}
    `;
  },

  standartlar: () => {
    if (YUKLENIYOR) return iskeletler(4);
    if (DB.hata)    return hataKutusu(DB.hata);

    /* İki kart, tek akış: promptu al → Claude'a yapıştır → cevabı geri
       yapıştır. Standart yazmak için forma oturmak gerekmiyor. */
    const araclar = AUTH.yonetici ? stdAracKartlari() : '';

    if (!DB.standartlar.length) {
      return `
        <div class="card">${empty(ICON.katman, 'Standart yok',
          'Supabase\'de önce sql/05-standartlar.sql, sonra sql/17-standart.sql '
          + 'dosyasını çalıştır — hazır standartlar kurulur.',
          AUTH.yonetici ? 'Elle ekle' : null, 'standart-ekle')}</div>
        ${araclar}`;
    }

    /* Açıklama şeridi kalktı: liste zaten kendini anlatıyor, her açılışta
       aynı üç satırı okumak yalnız yer kaplıyordu. */
    return araclar + DB.standartGruplari().map(grupKarti).join('');
  },

  /* ---------- Sektörler ---------- */

  sektorler: () => {
    if (YUKLENIYOR) return iskeletler(3);
    if (DB.hata)    return hataKutusu(DB.hata);

    const liste = skSirala(DB.sektorler);

    return `
      <div class="pj-tepe">
        <div class="pj-tepe-yz">
          <h1>Sektörler</h1>
          <p>Projene uygun sektörü seç, hazır içerikleri keşfet.</p>
        </div>
      </div>

      <div class="pj-araclar ekip sk-arac">
        <label class="pj-ara">
          <svg viewBox="0 0 24 24"><circle cx="11" cy="11" r="6.4"></circle><path d="M15.8 15.8L20.5 20.5"></path></svg>
          <input id="sk-ara" type="search" autocomplete="off" placeholder="Sektör ara…"
            value="${esc(SEKTOR_ARAMA)}">
        </label>
        <button class="pj-arac tekil" type="button" data-eylem="sektor-sirala"
                aria-label="Sıralama: ${esc(skSiraAdi())}" title="Sıralama: ${esc(skSiraAdi())}">
          ${svg(ICON.suzgecSira, 17)}
        </button>
        ${AUTH.yonetici ? `<button class="pj-yeni" type="button" data-eylem="sektor-ekle">
          ${svg(ICON.arti, 16)}<span>Yeni</span></button>` : ''}
      </div>

      ${liste.length
        ? `<div class="lk-liste">${liste.map(sektorKarti).join('')}
             <div class="pj-bos-arama">Aramana uyan sektör yok.</div>
           </div>`
        : `<div class="card">${empty(ICON.folder, 'Sektör yok',
            'Sektör eklersen sihirbazda çıkar ve modülleri önden işaretler.',
            AUTH.yonetici ? 'Yeni Sektör' : null, 'sektor-ekle')}</div>`}
    `;
  },

  /* ---------- Tasarımlar (kütüphane) ----------
     Yönlerin adı, özeti ve promptu kodda sabit; buradan değiştirilmiyor.
     Değişen tek şey her yönün temsili karesi — projeye değil uygulamaya
     ait olduğu için tasarım durağında bütün projelerde aynı görünüyor. */

  tasarimlar: () => {
    if (YUKLENIYOR) return iskeletler(3);
    if (DB.hata)    return hataKutusu(DB.hata);

    const harita = DB.tasarimGorsel || {};
    const satir = (y, i) => {
      const resim = harita[y.anahtar] || '';
      return `
        <div class="tk">
          <span class="tk-kare ${resim ? 'var' : ''}"
                ${resim ? `style="background-image:url('${esc(resim)}')"` : ''}>
            ${resim ? '' : yonOnizlemesi(y)}
          </span>
          <span class="tk-yz">
            <b>${esc(y.ad)}</b>
            <i>${esc(y.ozet || '')}</i>
          </span>
          <span class="tk-no mono">#${i + 1}</span>
          ${AUTH.yonetici ? `
            <span class="tk-dug">
              <button class="tk-btn" type="button" data-eylem="tasarim-kare-yukle"
                      data-alan="${esc(y.anahtar)}">
                ${svg(ICON.folder, 14)} ${resim ? 'Değiştir' : 'Görsel yükle'}</button>
              ${resim ? `<button class="tk-btn sil" type="button" data-eylem="tasarim-kare-sil"
                      data-alan="${esc(y.anahtar)}">${svg(ICON.cop, 14)}</button>` : ''}
            </span>` : ''}
        </div>`;
    };

    return `
      <div class="pj-tepe">
        <div class="pj-tepe-yz">
          <h1>Tasarımlar</h1>
          <p>Hazır tasarım promptlarının örnek görselleri. Buraya yüklediğin
             kare, bütün projelerin «Profesyonel tasarım» adımında görünür.</p>
        </div>
      </div>
      <div class="tk-liste">${TASARIM_YON.map(satir).join('')}</div>`;
  },

  /* ---------- Paketler ---------- */

  paketler: () => {
    if (YUKLENIYOR) return iskeletler(3);
    if (DB.hata)    return hataKutusu(DB.hata);

    const liste = DB.paketler || [];
    /* Sütun yoksa okunan satırda anahtar hiç bulunmuyor. Kaydederken çıkan
       uyarı kayboluyordu; burada kalıcı duruyor. */
    const tanimYok = paketYeniAlanlarKapali();

    return `
      <div class="pj-tepe">
        <div class="pj-tepe-yz">
          <h1>Paketler</h1>
          <p>Yeni projenin hangi yol haritasından geçeceğini paket belirler.</p>
        </div>
      </div>

      ${tanimYok ? `<div class="note" style="margin-bottom:14px">
        ${svg(ICON.uyari, 15)}
        <span><b>"Promptda nasıl anlatılsın?"</b> ve <b>varsayılan işareti</b>
        kaydedilemiyor — <b class="mono">sql/27-paket-varsayilan.sql</b> dosyası
        Supabase'de çalıştırılmamış. Paketin diğer alanları normal
        kaydediliyor.</span>
      </div>` : ''}

      ${liste.length
        ? `<div class="lk-liste">${liste.map(paketKarti).join('')}</div>`
        : `<div class="card">${empty(ICON.paket, 'Paket yok',
            'Paket listesi için sql/25-paketler.sql dosyasını Supabase\'de çalıştır.')}</div>`}
    `;
  },

  /* ---------- Modül şablonları ---------- */

  /* ---------- Kilitli projeler ---------- */

  kilitler: () => {
    if (YUKLENIYOR) return iskeletler(3);
    if (DB.hata)    return hataKutusu(DB.hata);

    /* Template'ler kendi "Templateler" bölümünde ayrıca yönetiliyor —
       burada tekrar göstermeye gerek yok. */
    const liste = DB.projeler.filter(p => !p.arsiv && !cekirdekMi(p));

    return `
      <div class="note" style="margin-bottom:12px">
        ${svg(ICON.info, 15)}
        <span>Kilitlediğin proje yanlışlıkla silinemez — "Projeyi sil" desen
        bile önce buradan kilidi açman istenir.</span>
      </div>

      ${liste.length
        ? `<div class="card liste">${liste.map(kilitSatiri).join('')}</div>`
        : `<div class="card">${empty(ICON.folder, 'Proje yok', 'Kilitlenecek proje bulunmuyor.')}</div>`}
    `;
  },

  /* ---------- Templateler ---------- */

  templateler: () => {
    if (YUKLENIYOR) return iskeletler(3);
    if (DB.hata)    return hataKutusu(DB.hata);

    const liste = DB.projeler.filter(p => !p.arsiv && cekirdekMi(p));

    return `
      <div class="pj-tepe">
        <div class="pj-tepe-yz">
          <h1>Templateler</h1>
          <p>Projelerinde kullanabileceğin hazır yazılım şablonlarını keşfet.</p>
        </div>
      </div>

      <div class="pj-araclar ekip sk-arac">
        <label class="pj-ara">
          <svg viewBox="0 0 24 24"><circle cx="11" cy="11" r="6.4"></circle><path d="M15.8 15.8L20.5 20.5"></path></svg>
          <input id="tp-ara" type="search" autocomplete="off" placeholder="Template ara…"
            value="${esc(TEMPLATE_ARAMA)}">
        </label>
        ${AUTH.yonetici ? `<button class="pj-yeni" type="button" data-eylem="template-olustur-ac">
          ${svg(ICON.arti, 16)}<span>Yeni</span></button>` : ''}
      </div>

      ${liste.length
        ? `<div class="tp-liste">${liste.map(templateKarti).join('')}
             <div class="pj-bos-arama">Aramana uyan template yok.</div>
           </div>`
        : `<div class="card">${empty(ICON.katman, 'Template yok',
            'Bitmiş bir müşteri projesinden temizlenmiş bir taban oluşturabilirsin.',
            AUTH.yonetici ? 'Template oluştur' : null, 'template-olustur-ac')}</div>`}

    `;
  },

  /* ---------- Ekip ---------- */

  ekip: () => {
    if (YUKLENIYOR) return iskeletler(3);
    if (DB.hata)    return hataKutusu(DB.hata);
    if (!AUTH.yonetici) {
      return `<div class="card">${empty(ICON.kisi, 'Bu ekran yöneticiye ait',
        'Ekip yönetimini yalnızca yönetici görebilir.')}</div>`;
    }
    return ekipEkrani();
  },

  sohbet: () => {
    if (YUKLENIYOR) return iskeletler(4);
    if (DB.hata)    return hataKutusu(DB.hata);
    const kisi = rota().id;
    return kisi ? yazismaEkrani(kisi) : sohbetEkrani();
  },

  /* ---------- Güvenlik Testi ---------- */

  guvenlik: () => {
    if (!AUTH.yonetici) {
      return `<div class="card">${empty(ICON.gGuvenlik, 'Bu ekran yöneticiye ait',
        'Güvenlik testini yalnızca yönetici çalıştırabilir.')}</div>`;
    }
    const g = GUVENLIK_SAYFA;
    return `
      <div class="note" style="margin-bottom:14px">${svg(ICON.info, 15)}
        <span>Herhangi bir Supabase projesinin (Studio'da kayıtlı olması
        gerekmez) önce ziyaretçi, sonra girdiğin hesapla giriş yapmış bir
        personelin ne yapabildiğini REST üzerinden dener. Veri bozmaz —
        yazdığı her şeyi hemen siler. En iyisi: test için açılmış,
        yetkisiz, ayrı bir personel hesabı kullan.</span></div>

      <div class="section" style="margin-top:0">
        <span class="label">Bağlantı</span>
        <div class="card" style="padding:14px">
          <label class="field"><span>Supabase adresi</span>
            <input type="text" id="gv-url" value="${esc(g.url)}"
                   placeholder="https://xxxx.supabase.co" autocomplete="off"
                   spellcheck="false" autocapitalize="off"></label>
          <label class="field" style="margin-top:10px"><span>anon key</span>
            <input type="text" id="gv-anon" value="${esc(g.anon)}"
                   placeholder="sb_publishable_… ya da eyJhbG…" autocomplete="off"
                   spellcheck="false" autocapitalize="off"></label>
        </div>
      </div>

      <div class="section">
        <span class="label">Personel girişi</span>
        <div class="card" style="padding:14px">
          <p class="ipucu" style="margin:0 0 10px">Test edilecek projedeki bir
            hesabın e-postası ve şifresi — dördü de gerekli. Giriş
            başarısız olursa test hiç başlamaz. Şifre hiçbir yerde
            saklanmıyor.</p>
          <label class="field"><span>E-posta</span>
            <input type="text" id="gv-eposta" value="${esc(g.eposta)}"
                   placeholder="personel@firma.com" autocomplete="off"
                   spellcheck="false" autocapitalize="off"></label>
          <label class="field" style="margin-top:10px"><span>Şifre</span>
            <input type="password" id="gv-sifre" placeholder="••••••••" autocomplete="off"></label>
        </div>
      </div>

      <div class="section">
        <span class="label">guvenlik.json adresi (opsiyonel)</span>
        <div class="card" style="padding:14px">
          <p class="ipucu" style="margin:0 0 10px">Tablo listesi önce otomatik keşfedilir; olmazsa
            programın <code>guvenlik.json</code>'undan okunur — bu yedek için gerekli. Depo GİZLİYSE
            (github.com/… adresi 401/404 verir) dosyanın yayında olduğu doğrudan adresi gir (ör.
            GitHub Pages). Depo PUBLIC'se github.com/sahip/depo yazman yeterli.</p>
          <label class="field"><span>Adres</span>
            <input type="text" id="gv-depo" value="${esc(g.depo)}"
                   placeholder="https://.../guvenlik.json ya da github.com/sahip/depo" autocomplete="off"
                   spellcheck="false" autocapitalize="off"></label>
        </div>
      </div>

      <div class="kur-dug">
        <button class="sayfa-dug" type="button" data-eylem="guvenlik-test-calistir"
                ${g.calisiyor ? 'disabled' : ''}>
          ${svg(ICON.gGuvenlik, 15)} ${g.calisiyor ? 'Test ediliyor…' : 'Test Et'}
        </button>
      </div>

      ${guvenlikSonucTablosu(g.sonuc, g.ustKatmanUyarisi, g.kalintilar, g.harita, g.tabloKaynagi)}

      <div class="section">
        <span class="label">2. Aşama · B, C ve Sunucu işlevi testleri (bir kere kurulur)</span>
        <div class="card" style="padding:14px">
          <p class="ipucu" style="margin:0 0 10px">Yapısal (B), programa özel (C) ve sunucu işlevi
            saldırıları denetimi bir Supabase erişim jetonu (personal access token) ister. Bir kere kur,
            sonrası otomatik: <b>Test Et</b> her çalıştığında üçünü de dener; fonksiyon kurulu değilse
            sessizce atlar. Fonksiyon kodu güncellendiyse (yeni sürüm çıktığında) mevcut
            <code>guvenlik-sql</code> fonksiyonunun <b>Code</b> sekmesinden kodu yeniden yapıştırıp
            deploy etmen yeterli — Secrets'a dokunman gerekmez.</p>
          <p class="ipucu" style="margin:0 0 10px"><b>1) Jetonu ŞURADAN AL</b> — test edeceğin projelerin
            bulunduğu Supabase HESABI (jeton projeye değil hesaba aittir; template/müşteri projeleri
            Studio'nun kendi hesabından ayrı bir hesaptaysa oradan alınır) → <code>supabase.com/dashboard/
            account/tokens</code> → <b>Generate new token</b> → <b>Create legacy token</b> (scoped/granular
            değil, Management API'nin SQL ucu onu istiyor). Değer <code>sbp_</code> ile başlar.</p>
          <p class="ipucu" style="margin:0 0 10px"><b>2) Jetonu ŞURAYA KOY</b> — Studio'nun kendi Supabase'i
            (bu jeton nereden alındığından bağımsız, yalnız KASA görevi görür) → <b>Edge Functions →
            New Function</b>, adı <code>guvenlik-sql</code>, kodu yapıştır, deploy et. Sonra o fonksiyonun
            <b>Settings → Secrets</b> bölümüne <code>NS_SUPABASE_JETON</code> ekle. Kaydettikten sonra hata
            hemen devam ederse fonksiyonu bir kere yeniden dağıt (redeploy) ya da bir dakika bekleyip
            tekrar dene — eski değer bir süre takılı kalabiliyor.</p>
          <div class="kur-dug">
            <button class="sayfa-dug ikincil" type="button" data-eylem="guvenlik-sql-kopyala">
              ${svg(ICON.kopya, 15)} Fonksiyon kodunu kopyala</button>
          </div>
        </div>
      </div>
    `;
  },

  /* Ayarlar iki katlı: önce başlıklar, başlığa basınca kendi sayfası.
     Telefon ayarları gibi. Adres #/ayarlar/<grup>; geri oku listeye döner. */
  ayarlar: () => {
    const g = AYAR_GRUP[rota().id];
    return g ? ayarSayfasi(g) : ayarListesi();
  },
};

/* ==========================================================================
   AYARLAR
   ========================================================================== */

/* Başlıklar tek yerde: listedeki kart da, açılan sayfa da buradan okunuyor.
   `goster` false dönen başlık listede hiç çıkmaz — boş sayfaya girilmesin. */
const AYAR_GRUP = {
  hesap: {
    ad: 'Hesap', renk: 'kirmizi', ikon: 'kisi',
    aciklama: 'Profil bilgilerini yönet.',
    goster: () => true,
    ciz: () => {
      /* Veritabanında tek "ad" alanı var; ekranda Ad ve Soyad ayrı duruyor.
         Son sözcük soyad, kalanı ad — kaydederken yine birleşiyor. */
      const parca = String(AUTH.ad || '').trim().split(/\s+/).filter(Boolean);
      const soyad = parca.length > 1 ? parca.pop() : '';
      const ad    = parca.join(' ');

      return `
        <div class="hs-kart hs-foto">
          <span class="hs-foto-yz">
            <b>Profil Fotoğrafı</b>
            <i>JPG, PNG veya WEBP. Maks. 4 MB.</i>
          </span>
          <button class="hs-foto-kutu" type="button" data-eylem="foto-degistir"
                  aria-label="Fotoğrafı değiştir">
            ${fotoKutu('hs')}
            <u class="hs-kamera">${svg(ICON.kamera, 16)}</u>
          </button>
        </div>

        ${hesapAlani('kisi', 'Ad', `
          <input class="hs-giris" id="hs-ad" type="text" autocomplete="given-name"
                 value="${esc(ad)}" placeholder="Adın">`)}

        ${hesapAlani('kisi', 'Soyad', `
          <input class="hs-giris" id="hs-soyad" type="text" autocomplete="family-name"
                 value="${esc(soyad)}" placeholder="Soyadın">`)}

        ${hesapAlani('mail', 'E-posta', `
          <input class="hs-giris" id="hs-mail" type="email" autocomplete="email"
                 value="${esc(AUTH.mail || '')}" placeholder="ornek@nizam.studio">`,
          'Değiştirirsen yeni adrese doğrulama bağlantısı gider.')}

        ${hesapAlani('telefon', 'Telefon', `
          <input class="hs-giris" id="hs-tel" type="tel" autocomplete="tel"
                 value="${esc(AUTH.telefon)}" placeholder="0500 000 00 00">`)}

        ${hesapAlani('kilit', 'Şifre', `
          <span class="hs-sifre">
            <input class="hs-giris" id="hs-sifre" type="password" autocomplete="new-password"
                   placeholder="Yeni şifre" value="">
            <button class="hs-goz" type="button" data-eylem="hesap-goz"
                    aria-label="Şifreyi göster">${svg(ICON.goz, 17)}</button>
          </span>
          <button class="hs-degistir" type="button" data-eylem="sifre-degistir">Değiştir</button>`,
          'Şifreni güvenliğin için düzenli olarak değiştir.')}

        ${/* Kendi rolüne kimse dokunamıyor — yönetici bile. Veritabanındaki
              kilit (sql/10-ekip.sql) bilerek böyle: son yönetici kendini
              geliştirici yapıp sistemi kilitleyemesin diye. Açık bir kutu
              koymak yalan olurdu; sessizce eski değere dönüyordu. */''}
        ${hesapAlani('kisiler', 'Rol', `
          <span class="hs-secim">
            <select class="hs-giris" id="hs-rol" disabled>
              <option>${esc(AUTH.rolAdi)}</option>
            </select>
            ${svg(ICON.chevron, 16)}
          </span>`,
          'Ekip içerisindeki yetki seviyeni belirler. Kendi rolünü '
          + 'değiştiremezsin; bunu başka bir yönetici yapar.')}

        <button class="hs-kaydet" type="button" data-eylem="hesap-kaydet">
          ${svg(ICON.kaydet, 18)}<span>Değişiklikleri Kaydet</span>
        </button>`;
    },
  },

  kutuphane: {
    ad: 'Kütüphane', renk: 'mavi', ikon: 'folder',
    aciklama: 'Projelerinde kullanabileceğin tüm kaynaklar.',
    goster: () => true,
    ciz: () => `<div class="kt-liste">${KUTUPHANE.map(kutuphaneKarti).join('')}</div>`,
  },

  guvenlik: {
    ad: 'Güvenlik', renk: 'yesil', ikon: 'gGuvenlik',
    aciklama: 'Projelerin satır güvenliğini dışarıdan dene.',
    goster: () => AUTH.yonetici,
    ciz: () => `<div class="kt-liste">${ayarKarti({
      ad: 'Güvenlik Testi', adres: '#/guvenlik', renk: 'yesil', ikon: 'gGuvenlik',
      aciklama: 'Herhangi bir Supabase projesini ziyaretçi ve personel kimliğiyle dener.',
      deger: 'ziyaretçi · personel · sunucu işlevi', degerIkon: 'gGuvenlik',
      susCizgi: true,
      sus: '<path d="M30 3l24 9v18c0 15-10 25-24 30C16 55 6 45 6 30V12z"></path>'
         + '<path d="M20 30l7 7 14-14"></path>',
    })}</div>`,
  },

  yayin: {
    ad: 'Yayın', renk: 'turuncu', ikon: 'yayin',
    aciklama: 'Alan adı, Supabase ve dış bağlantılar.',
    goster: () => AUTH.yonetici,
    ciz: () => `<div class="kt-liste">
      ${ayarKarti({
        ad: 'Kök alan adı', eylem: 'kok-alan', renk: 'turuncu', ikon: 'bulut',
        aciklama: kokAlan()
          ? 'Her projeye firma adından bir alt alan türetilir.'
          : 'Yazılmazsa alan adı adımı kullanıcıyı Ayarlar\'a yollar.',
        deger: kokAlan() ? esc(kokAlan()) : '<b class="eksik">yazılmadı</b>',
        degerIkon: 'bulut', susCizgi: true,
        sus: '<circle cx="30" cy="30" r="26"></circle>'
           + '<path d="M4 30h52M30 4c9 8 9 44 0 52M30 4c-9 8-9 44 0 52"></path>',
      })}
      ${ayarKarti({
        ad: 'Supabase organizasyonu', eylem: 'supabase-org', renk: 'yesil', ikon: 'gVeri',
        aciklama: supabaseOrg()
          ? '"Supabase\'de proje aç" doğrudan bu organizasyona gider.'
          : 'Yazılmazsa Supabase önce yeni bir organizasyon kurdurur.',
        deger: supabaseOrg() ? esc(supabaseOrg()) : '<b class="eksik">yazılmadı</b>',
        degerIkon: 'gVeri', susCizgi: true,
        sus: '<ellipse cx="30" cy="14" rx="22" ry="8"></ellipse>'
           + '<path d="M8 14v32c0 4 10 8 22 8s22-4 22-8V14"></path>'
           + '<path d="M8 30c0 4 10 8 22 8s22-4 22-8"></path>',
      })}
      ${ayarKarti({
        ad: 'Bağlantılar', renk: 'mavi', ikon: 'dal',
        aciklama: 'Studio hangi servislere bağlı, bir bakışta.',
        deger: 'Supabase: ' + (AUTH.bagli ? 'bağlı' : 'demo modu'),
        degerIkon: 'dal', susCizgi: true,
        sus: '<circle cx="16" cy="14" r="8"></circle><circle cx="16" cy="46" r="8"></circle>'
           + '<circle cx="46" cy="30" r="8"></circle><path d="M22 18l18 8M22 42l18-8"></path>',
      })}
    </div>`,
  },

  uygulama: {
    ad: 'Uygulama ve bakım', renk: 'mor', ikon: 'disli',
    aciklama: 'Sürüm bilgisi, güncelleme ve yedekleme.',
    goster: () => true,
    ciz: () => `<div class="kt-liste">
      ${ayarKarti({
        ad: 'Sürüm', eylem: 'guncelle', renk: 'mor', ikon: 'ayar',
        aciklama: 'Yeni sürüm varsa uygulama kendini yeniler.',
        deger: esc(APP.version + ' · ' + APP.stage),
        degerIkon: 'ayar', dugme: 'Denetle', susCizgi: true,
        sus: '<circle cx="30" cy="30" r="12"></circle>'
           + '<path d="M30 2v10M30 48v10M2 30h10M48 30h10M10 10l7 7M43 43l7 7M50 10l-7 7M17 43l-7 7"></path>',
      })}
      ${ayarKarti({
        ad: 'Projeleri kilitle', adres: '#/kilitler', renk: 'kirmizi', ikon: 'kilit',
        aciklama: 'Kilitli proje yanlışlıkla silinemez.',
        deger: kilitAltBaslik(), degerIkon: 'kilit', susCizgi: true,
        sus: '<rect x="12" y="26" width="36" height="28" rx="6"></rect>'
           + '<path d="M20 26v-8a10 10 0 0120 0v8"></path>',
      })}
      ${ayarKarti({
        ad: 'Yedek al', eylem: 'yedek-al', renk: 'mavi', ikon: 'kaydet',
        aciklama: 'Tüm projeler, görevler ve standartlar tek dosyada iner.',
        dugme: 'İndir', susCizgi: true,
        sus: '<path d="M30 6v32M18 28l12 12 12-12"></path>'
           + '<path d="M8 44v6a4 4 0 004 4h36a4 4 0 004-4v-6"></path>',
      })}
      ${ayarKarti({
        ad: 'Yedeği incele', eylem: 'yedek-oku', renk: 'turuncu', ikon: 'dosya',
        aciklama: 'Dosyanın içinde ne var, geri yüklemeden gösterir.',
        dugme: 'Dosya seç', susCizgi: true,
        sus: '<rect x="12" y="6" width="36" height="48" rx="5"></rect>'
           + '<path d="M20 20h20M20 30h20M20 40h12"></path>',
      })}
    </div>`,
  },
};

/* ---------- Kütüphane ----------
   Dört büyük kart. Sağdaki soluk çizim süs: kartın ne olduğunu bir bakışta
   anlatıyor, tıklanmıyor ve okunacak bir bilgi taşımıyor. */
const KUTUPHANE = [
  {
    ad: 'Sektörler', adres: '#/sektorler', renk: 'kirmizi', ikon: 'pasta',
    aciklama: 'Sektöre özel çözümler, örnek projeler ve referans içerikler.',
    sayi: () => DB.sektorler.length + ' sektör',
    sus: '<rect x="4" y="34" width="13" height="22" rx="4"></rect>'
       + '<rect x="23" y="16" width="13" height="40" rx="4"></rect>'
       + '<rect x="42" y="2" width="13" height="54" rx="4"></rect>',
  },
  {
    ad: 'Paketler', adres: '#/paketler', renk: 'turuncu', ikon: 'paket',
    aciklama: 'Yeni projenin hangi yol haritasından geçeceği.',
    sayi: () => (DB.paketler || []).length + ' paket',
    susCizgi: true,
    sus: '<rect x="6" y="20" width="48" height="34" rx="6"></rect>'
       + '<path d="M6 30h48M24 20v-8h12v8"></path>',
  },
  {
    ad: 'Templateler', adres: '#/templateler', renk: 'mor', ikon: 'izgaraDort',
    aciklama: 'Kurulmaya hazır tabanlar — sektörüne ve paketine bağlı.',
    sayi: () => DB.projeler.filter(p => !p.arsiv && cekirdekMi(p)).length + ' template',
    susCizgi: true,
    sus: '<rect x="20" y="2" width="38" height="38" rx="8"></rect>'
       + '<rect x="4" y="18" width="38" height="38" rx="8"></rect>'
       + '<path d="M17 31l-4 6 4 6M29 31l4 6-4 6"></path>',
  },
  {
    /* Tasarım yönlerinin kendisi kodda sabit (config.js · TASARIM_YON);
       buradan yalnız her yönün temsili karesi yükleniyor. */
    ad: 'Tasarımlar', adres: '#/tasarimlar', renk: 'mavi', ikon: 'gTasarim',
    aciklama: 'Hazır tasarım promptlarının örnek görselleri.',
    sayi: () => TASARIM_YON.filter(y => (DB.tasarimGorsel || {})[y.anahtar]).length
      + ' / ' + TASARIM_YON.length + ' görsel',
    susCizgi: true,
    sus: '<rect x="4" y="6" width="24" height="24" rx="5"></rect>'
       + '<rect x="32" y="6" width="24" height="24" rx="5"></rect>'
       + '<rect x="4" y="34" width="24" height="24" rx="5"></rect>'
       + '<rect x="32" y="34" width="24" height="24" rx="5"></rect>',
  },
  {
    ad: 'Nizam Standartları', adres: '#/standartlar', renk: 'yesil', ikon: 'gGuvenlik',
    aciklama: 'Geliştirme süreçlerimizde uyduğumuz standartlar ve kurallar.',
    sayi: () => DB.standartlar.length + ' tarif',
    susCizgi: true,
    sus: '<rect x="4" y="2" width="38" height="50" rx="6"></rect>'
       + '<path d="M13 15h20M13 25h20M13 35h12"></path>'
       + '<circle cx="45" cy="44" r="13"></circle>',
  },
];

function kutuphaneKarti(k) {
  return `
    <a class="kt kt-${k.renk}" href="${k.adres}" draggable="false">
      <span class="kt-sus ${k.susCizgi ? 'cizgi' : ''}"><svg viewBox="0 0 60 60">${k.sus}</svg></span>
      <span class="kt-ikon">${svg(ICON[k.ikon], 30)}</span>
      <span class="kt-yz">
        <b>${esc(k.ad)}</b>
        <i>${esc(k.aciklama)}</i>
        <em>${svg(ICON.katman, 15)}${esc(YUKLENIYOR ? 'yükleniyor…' : k.sayi())}</em>
      </span>
      <span class="kt-ok">${svg(ICON.chevron, 20)}</span>
    </a>`;
}

/* Hesap ekranındaki tek alan kartı: solda ikon+etiket, altında kutu. */
function hesapAlani(ikon, etiket, icerik, ipucu = '') {
  return `
    <div class="hs-kart">
      <span class="hs-etiket">${svg(ICON[ikon], 19)}<b>${esc(etiket)}</b></span>
      <span class="hs-alan">${icerik}</span>
      ${ipucu ? `<i class="hs-ipucu">${esc(ipucu)}</i>` : ''}
    </div>`;
}

/* Sağ oklu, bir yere götüren ayar satırı. */
/* Kütüphane kartının ayarlar için genel hâli. Aynı biçim: solda renkli
   ikon, ortada ad + açıklama + tek satır değer, sağda ok. Tıklanınca ya
   bir adrese gider (adres) ya da bir eylem çalıştırır (eylem). */
function ayarKarti(k) {
  const govde = `
    <span class="kt-sus ${k.susCizgi ? 'cizgi' : ''}"><svg viewBox="0 0 60 60">${k.sus || ''}</svg></span>
    <span class="kt-ikon">${svg(ICON[k.ikon], 30)}</span>
    <span class="kt-yz">
      <b>${esc(k.ad)}</b>
      <i>${esc(k.aciklama)}</i>
      ${k.deger ? `<em>${svg(ICON[k.degerIkon || 'katman'], 15)}${k.deger}</em>` : ''}
    </span>
    ${k.dugme ? `<span class="kt-dug">${esc(k.dugme)}</span>`
      : (k.adres || k.eylem) ? `<span class="kt-ok">${svg(ICON.chevron, 20)}</span>` : ''}`;

  if (k.adres) return `<a class="kt kt-${k.renk}" href="${k.adres}" draggable="false">${govde}</a>`;
  if (k.eylem) return `<button class="kt kt-${k.renk}" type="button" data-eylem="${k.eylem}">${govde}</button>`;
  return `<div class="kt kt-${k.renk} duz">${govde}</div>`;
}

function ayarSatir(eylem, baslik, alt) {
  return `
    <div class="row" data-eylem="${eylem}" role="button" tabindex="0">
      <div class="row-main">
        <span class="row-title">${esc(baslik)}</span>
        <span class="row-sub">${esc(alt)}</span>
      </div>
      <span class="row-val">${svg(ICON.chevron, 15)}</span>
    </div>`;
}

/* Ayarların ilk katı: hesap kartı + başlıklar. */
function ayarListesi() {
  const anahtarlar = Object.keys(AYAR_GRUP)
    .filter(k => k !== 'hesap' && AYAR_GRUP[k].goster());

  return `
    <div class="pj-tepe">
      <div class="pj-tepe-yz">
        <h1>Ayarlar</h1>
        <p>Uygulama tercihlerini buradan yönetebilirsin.</p>
      </div>
    </div>

    <a class="ay-hesap" href="#/ayarlar/hesap" draggable="false">
      <span class="ay-foto">${fotoKutu('ay')}<u class="ay-kalem">${svg(ICON.kalem, 12)}</u></span>
      <span class="ay-hesap-yz">
        <b>${esc(AUTH.ad)}</b>
        <i>${esc(AUTH.mail || '')}</i>
        <em>${esc(AUTH.rolAdi)}</em>
      </span>
      <span class="ay-ok">${svg(ICON.chevron, 18)}</span>
    </a>

    <div class="ay-liste">
      ${anahtarlar.map(k => {
        const g = AYAR_GRUP[k];
        return `
          <a class="ay-grup" href="#/ayarlar/${k}" draggable="false">
            <span class="ay-ikon ${g.renk}">${svg(ICON[g.ikon], 24)}</span>
            <span class="ay-grup-yz">
              <b>${esc(g.ad)}</b>
              <i>${esc(g.aciklama)}</i>
            </span>
            <span class="ay-ok">${svg(ICON.chevron, 18)}</span>
          </a>`;
      }).join('')}
    </div>

    <div class="section ay-cikis">
      <button class="btn btn-ghost" id="btn-logout" type="button">Çıkış Yap</button>
    </div>`;
}

/* Bir başlığın kendi sayfası. */
function ayarSayfasi(g) {
  if (!g.goster()) {
    return `<div class="card">${empty(ICON.kilit, 'Bu ekran yöneticiye ait',
      'Bu ayarları yalnızca yönetici görebilir.')}</div>`;
  }
  return `
    <div class="pj-tepe">
      <div class="pj-tepe-yz">
        <h1>${esc(g.ad)}</h1>
        <p>${esc(g.aciklama)}</p>
      </div>
    </div>
    ${g.ciz()}`;
}

/* ==========================================================================
   PARÇA ÜRETİCİLER
   ========================================================================== */

/* Logolar private kovadan geliyor; indirmesi bir saniye sürebiliyor.
   Zemine doğrudan basmak yerine önce arka planda indirip sonra gösteriyoruz —
   arada dönen gösterge duruyor, kutu boş kalmıyor.

   Adres bir saatlik imzalıdır; süresi dolmuşsa indirme patlar ve baş harfe
   düşeriz, kırık resim simgesi çıkmaz. */
function logolariGoster() {
  $$('[data-logo]').forEach(el => {
    const adres = el.dataset.logo;
    delete el.dataset.logo;

    /* Gösterge işi bitince DOM'dan çıkarılıyor; yalnızca gizlemek yetmez,
       animasyon arkada dönmeye devam eder. */
    const bitir = sinif => {
      el.classList.remove('yukleniyor');
      el.classList.add(sinif);
      const gosterge = $('.donen', el);
      if (gosterge) gosterge.remove();
    };

    const resim = new Image();
    resim.onload = () => {
      el.style.backgroundImage = `url('${adres}')`;
      /* Avatarda baş harfleri gizleyen sınıf ayrı — ikisini de veriyoruz. */
      bitir(el.classList.contains('foto') ? 'resimli' : 'dolu');
    };
    resim.onerror = () => bitir('yuklenemedi');
    resim.src = adres;
  });
}

/* Proje içindeki durak dizisi. Adres, ad ve içeriği tek yerde tanımlı.
   Sıra önemli: projeDuraklari() dizisi bununla indeks indeks eşleşiyor.

   8 durak: program eskiden "Kurulum ve yapı"nın içindeydi (paket adı+roller+
   veri katmanı), ayrı durağa taşındı. Bağlantılar, eski "Nizam kurulum
   paketi"ni (sabit iskelet onayı) içine aldı. Beta, eski "Geliştirme"yi
   (görev/kontrol sistemi) içine aldı — kontroller artık beta aşamasında. */
/* Proje bir şablon kopyasıysa ("Muhasebe şablonu" vb.) DURAKLAR.yapi ve
   DURAKLAR.beta yerlerini "Temel tanımlar" ve "Değişim"e bırakıyor. */
/* ---------- Paket ----------
   Paket, projenin hangi yol haritasından geçeceğini söyler. Henüz projeye
   yazmıyoruz: eski `palet.sablon` işaretinden türetiyoruz, böylece kurulmuş
   hiçbir projenin yolu değişmiyor. Proje paketi kendi alanında tutmaya
   yeni proje akışı geldiğinde geçilecek. */
function paketAnahtari(p) {
  const pl = (p && p.palet) || {};
  return pl.paket || (pl.sablon ? 'muhasebe-1' : 'ozel');
}

function projePaketi(p) {
  const anahtar = paketAnahtari(p);
  return (DB.paketler || []).find(x => x.anahtar === anahtar) || null;
}

/* Hangi akış çizilecek — paketin VARSAYILAN işaretinden türüyor:
   varsayılan paket sıfırdan kurulan projelerin paketi, orada değiştirilecek
   hazır bir program yok → normal akış. Varsayılan olmayan bir pakete ancak
   bir template üzerinden geliniyor → hazır programın kurulumu akışı.
   Ayrı bir "yol haritası" seçimi vardı, gereksizdi: bu iki durumun dışında
   bir hâl yok.

   `varsayilan` sütunu kurulmadıysa (sql/27 çalışmadı) eski `akis` alanına,
   paket tablosu hiç yoksa (sql/25) projenin eski şablon işaretine düşüyoruz —
   ekran yine de doğru yol haritasını çiziyor. */
function paketAkisi(p) {
  const pl = (p && p.palet) || {};
  /* Yol haritası projeye KURULDUĞU AN donuyor. Paketten her seferinde
     türetseydik, bugün paketin işaretini değiştirmek aylar önce teslim
     edilmiş bir müşterinin adımlarını da değiştirirdi. Paket ileriye
     dönüktür: yalnız bundan sonra kurulacak projeleri etkiler. */
  if (pl.akis) return pl.akis;

  /* Donmamış eski projeler (bu sürümden önce kurulanlar) paketten türer. */
  const k = projePaketi(p);
  if (k) {
    if ('varsayilan' in k) return k.varsayilan ? 'ozel' : 'muhasebe';
    return k.akis || 'ozel';
  }
  return pl.sablon ? 'muhasebe' : 'ozel';
}

/* Bir paketin akışı — projesiz de sorulabilsin diye ayrı. */
function paketinAkisi(k) {
  if (!k) return 'ozel';
  if ('varsayilan' in k) return k.varsayilan ? 'ozel' : 'muhasebe';
  return k.akis || 'ozel';
}

function sablonMu(p) {
  return paketAkisi(p) === 'muhasebe';
}

/* Claude'a giden promptlarda bu paketi anlatan metin. Serbest bir paragraf:
   cümlenin içine gömülmüyor, "Bu paket nedir" başlığıyla olduğu gibi
   giriyor — böylece Türkçe ek uyumu derdi olmuyor ve istediğin kadar
   uzun yazabiliyorsun. Boşsa o başlık hiç basılmıyor; eskiden buralarda
   "muhasebe programı" düz yazı duruyordu ve ikinci bir paket eklendiğinde
   Claude'a yanlış şey anlatıyordu. */
function paketTanimi(p) {
  const k = projePaketi(p);
  return (k && String(k.tanim || '').trim()) || '';
}

/* Promptun içine düşen blok — tanım yoksa hiçbir şey eklemiyor. */
function paketTanimBloku(p) {
  const t = paketTanimi(p);
  return t ? ['## Bu paket nedir', '', t, ''] : [];
}

/* DURAKLAR'daki statik durak nesnesinin (ad/aciklama) şablon durumuna göre
   değişen bir kopyası — sayfa başlığı (adimBasligi) bunu okuyor. */
function sablonD(d, ad, aciklama) {
  return Object.assign({}, d, { ad, aciklama });
}

const DURAKLAR = {
  /* Aşamalar konuşulan yere göre bölündü: 1'i müşteriyle konuşarak
     dolduruyorsun (marka, iletişim, sektör, logo), 2'yi klavye başında
     (ürün, roller, depo, modüller). İkisi karışıkken hangi kafayla
     oturulacağı belli olmuyordu. */
  firma:       { no: 1, ad: 'Firma bilgileri',       ciz: firmaSayfasi,
                 renk: '#c4a05c', ikon: 'etiket', resim: 'firma',
                 aciklama: 'İşletme ve marka bilgilerinizi girin.' },
  program:     { no: 2, ad: 'Program temeli',        ciz: programSayfasi,
                 renk: '#4fa8c9', ikon: 'katman', resim: 'program',
                 aciklama: 'Programın amacı ve temel özellikleri.' },
  baglantilar: { no: 3, ad: 'Bağlantılar ve temel',  ciz: baglantilarSayfasi,
                 renk: '#b8926b', ikon: 'dal', resim: 'baglantilar',
                 aciklama: 'Gerekli bağlantıları ayarlayın.' },
  /* Yapı tasarımdan önce: ChatGPT ekranları çizerken hangi modüllerin ve
     sayfaların olduğunu bilmeli. Bilmezse altı genel ekran çiziyor; künye
     elindeyken gerçek modülleri, gerçek alanları ve o işe ait simgeleri
     çiziyor. Bağımlılık bu yönde. */
  /* Muhasebe şablonu kopyasında bu iki durağın yerini tek bir "Değişim"
     durağı alıyor — "yapi" slotu (bkz. projeDuraklari) o kopyalarda gizli,
     her şey "beta" slotunda toplanıyor. Sıra ve numaralar aynı kalıyor,
     yalnız şablon kopyasında bir durak daha az görünüyor. Bkz. sablonD(),
     sablonDegisimSayfasi(). */
  yapi:        { no: 4, ad: 'Yapı planlama',
                 ciz: (p, d) => sablonMu(p)
                   ? sayfaHero(p, sablonD(d, 'Değişim', '')) + `<div class="card">${empty(ICON.check,
                       'Bu aşama Değişim\'e taşındı', 'Temel tanımlar artık "Değişim" durağının içinde.')}</div>`
                   : yapiSayfasi(p, d),
                 renk: '#8fae4a', ikon: 'gAltyapi', resim: 'yapi',
                 aciklama: p => sablonMu(p) ? 'Bu aşama Değişim\'e taşındı.'
                   : 'Modüller, sayfalar ve proje yapısı.' },
  /* Kurulum ile Beta bilerek ayrı iki durak: ilki "kodu yazdır" (plan +
     beş aşama, sırayla ilerleyen kapalı bir liste), ikincisi "deneyip
     eksikleri anlat" (bitiş tarihi olmayan bir döngü). Tek durakta
     dururken adım şeridi yediyi bitirdiğin anda bambaşka bir ekrana
     dönüşüyordu — nerede olduğun kaybolmuştu. */
  kurulum:     { no: 5, ad: 'Kurulum',
                 ciz: (p, d) => sablonMu(p) ? sablonDegisimSayfasi(p,
                     sablonD(d, 'Değişim', 'Temel tanımlar, veri/format ve giriş kurulumu burada.'))
                   : betaKurulumOzeti(p, d, kurulumSihirbazListesi(p)),
                 renk: '#5b8def', ikon: 'gAltyapi', resim: 'beta',
                 aciklama: p => sablonMu(p) ? 'Temel tanımlar, veri/format ve giriş kurulumu burada.'
                   : 'Plan depoya yazılır, kod aşama aşama kurulur.' },
  beta:        { no: 6, ad: 'Beta ve geliştirme',
                 ciz: (p, d) => sablonMu(p)
                   ? sayfaHero(p, sablonD(d, 'Değişim', '')) + `<div class="card">${empty(ICON.check,
                       'Bu aşama Değişim\'e taşındı', 'Bu akış "Değişim" durağının içinde.')}</div>`
                   : betaGelistirmeEkrani(p, d),
                 renk: '#c9753c', ikon: 'gOptimizasyon', resim: 'beta',
                 aciklama: p => sablonMu(p) ? 'Bu aşama Değişim\'e taşındı.'
                   : 'Uygulamayı dene, eksikleri Claude\'a yazdır.' },
  /* Yalnız şablon kopyalarında anlamlı: normal projede bu döngü zaten Beta
     ve geliştirme'nin içinde. Slot her projede var (sıra bozulmasın diye,
     bkz. projeDuraklari), normal projede otomatik geçilmiş sayılıyor. */
  deneme:      { no: 7, ad: 'Test ve Güncelle',       ciz: denemeSayfasi,
                 renk: '#5a9b8f', ikon: 'gOptimizasyon', resim: 'deneme',
                 aciklama: p => sablonMu(p) ? 'Uygulamayı dene, eksikleri Claude\'a yazdır.'
                   : 'Bu proje için geçerli değil.' },
  tasarim:     { no: 8, ad: 'Profesyonel tasarım',   ciz: tasarimSayfasi,
                 renk: '#5f86c4', ikon: 'gTasarim', resim: 'tasarim',
                 aciklama: 'Arayüz ve kullanıcı deneyimi.' },
  /* Finalden bir önceki durak. Katmanlar (Program temeli) ve kullanıcı
     ekleme (Bağlantılar ve temel'deki ilk kurulum promptu) zaten kurulu —
     başlangıçta her katman her şeyi yapabiliyor. Burada yalnız gerçek
     kısıtlamalar ("kim ne yapabilir") tanımlanıp koda işleniyor. */
  yetki:       { no: 9, ad: 'Yetkilendirme',         ciz: yetkiSayfasi,
                 renk: '#a15fc4', ikon: 'gGuvenlik', resim: 'yetki',
                 aciklama: 'Her katman ne yapabilir?' },
  /* Yetkilendirme kuralları yazdı — burada ÖLÇÜLÜYOR. Ayrı bir durak olması
     bilerek: "kuruldu" demek bir iddiadır, açık olup olmadığını ancak
     saldırarak anlarsın. Final bu ölçüm temiz çıkmadan açılmıyor. */
  guvenlik:    { no: 10, ad: 'Güvenlik kontrolü',    ciz: guvenlikDurakSayfasi,
                 renk: '#3f9d7a', ikon: 'gGuvenlik', resim: 'guvenlik',
                 aciklama: 'Kurulan kurallar gerçekten tutuyor mu?' },
  final:       { no: 11, ad: 'Final',                ciz: finalSayfasi,
                 renk: '#5a6169', ikon: 'bayrak', resim: 'final',
                 aciklama: 'Son kontroller ve yayına hazırlık.' },
  guncelleme:  { no: 12, ad: 'Geliştirme',           ciz: guncellemeSayfasi,
                 resim: 'gelistirme', aciklama: 'Yayın sonrası yeni özellikler.' },
};

/* Henüz içi kurulmamış aşamalar için geçici sayfa — yalnız akışta yerini
   göstermek için var. */
function yakindaSayfasi(p, d) {
  return sayfaHero(p, d)
    + `<div class="bos-kutu">${svg(ICON.kalem, 18)}
        <span><b>${esc(d.ad)}</b> — bu aşamanın içeriği henüz kurulmadı,
        şimdilik sadece akışta yerini gösteriyor.</span></div>`;
}

function durakSayfasi(projeId, anahtar) {
  if (YUKLENIYOR) return iskeletler(4);
  if (DB.hata)    return hataKutusu(DB.hata);

  const p = DB.proje(projeId);
  if (!p) {
    return `<div class="card">${empty(ICON.uyari, 'Proje bulunamadı',
      'Silinmiş veya arşive alınmış olabilir.', 'Projelere dön', 'projelere')}</div>`;
  }
  const ic = DURAKLAR[anahtar].ciz(p, DURAKLAR[anahtar]);
  return `
    <div class="dsh">
      <div class="dsh-ana">
        ${durakSerit(p, anahtar)}
        <div class="dsh-govde">${ic}</div>
        ${durakAyak(p, anahtar)}
      </div>
      ${durakOzetPaneli(p)}
    </div>
    ${durakAsamaSayfasi(p, anahtar)}`;
}

/* ---------- Durak kabuğu ----------
   Sekiz durak ayrı ayrı sayfa gibi duruyordu; kullanıcı hangi adımda
   olduğunu ancak geri dönüp listeye bakarak anlıyordu. Artık hepsi tek bir
   akışın adımı: tepede şerit, geniş ekranda sağda projenin künyesi, altta
   Geri / Devam Et. Durakların kendi içerikleri hiç değişmedi — bu kabuk
   onları sarıyor, yerlerini almıyor. */

/* Görünür duraklar; anahtarı, sırası ve kilit durumu üstünde.
   Kilit kuralı tek yerde: bitmemiş ilk duraktan
   sonrası kapalı, Güvenlik kontrolü hariç (o bir görev değil, ölçü aleti). */
function durakAkisi(p) {
  const tum   = Object.keys(DURAKLAR);
  const liste = projeDuraklari(p)
    .map((d, i) => Object.assign({}, d, { anahtar: tum[i] }))
    .filter(d => !d.gizli);
  const simdi = liste.findIndex(d => !d.bitti);
  return liste.map((d, i) => Object.assign(d, {
    sira: i,
    kilitli: d.anahtar !== 'guvenlik' && simdi !== -1 && i > simdi,
  }));
}

/* Adım şeridi. Geniş ekranda numaralı halkalar ve adları; dar ekranda tek
   satır — kaç adımdan kaçıncısı, adı ve listeyi açan düğme. Sekiz adı yan
   yana dizmek telefonda okunmuyordu, o yüzden orada liste ayrı sayfada. */
function durakSerit(p, anahtar) {
  const liste = durakAkisi(p);
  const su    = liste.findIndex(d => d.anahtar === anahtar);
  const simdi = liste[su] || {};

  /* Bulunduğun aşama tamamlandıysa şerit yeşile dönüyor: "buradaki iş
     bitti" bilgisini sayfanın en tepesinde de vermek gerekiyor. */
  const suBitti = !!(liste[su] && liste[su].bitti);

  const halkalar = liste.map((d, i) => {
    const hal = i === su ? ('su' + (suBitti ? ' tamam' : '')) : d.bitti ? 'bitti' : d.kilitli ? 'kilitli' : 'acik';
    /* Halkaları birleştiren çizgi ÖNCEKİ adımın durumunu gösteriyor: yeşil
       çizgi "buraya kadar tamam" demek. Kendi durumuna bakarsa aradaki
       bitmemiş adım gizleniyordu. */
    const bagli = i > 0 && liste[i - 1].bitti ? ' bagli' : '';
    const ic  = `
      <span class="dsr-yuv">${
        d.bitti && i !== su ? svg(ICON.tik, 13)
        : d.kilitli         ? svg(ICON.kilit, 12)
        : `<b class="mono">${i + 1}</b>`}</span>
      <span class="dsr-ad">${esc(d.ad)}</span>`;
    return (d.kilitli || i === su)
      ? `<span class="dsr-a ${hal}${bagli}">${ic}</span>`
      : `<a class="dsr-a ${hal}${bagli}" href="#/projeler/${p.id}/${d.anahtar}">${ic}</a>`;
  }).join('');

  /* Telefonda adım adlarını yan yana dizmek okunmuyordu: orada şerit iki
     satır — üstte bağlı noktalar, altta sayaç, durağın adı ve listeyi açan
     düğme. */
  /* Nokta şeridi: tamamlanmış adımlar yeşil, bulunduğun adım kırmızı
     (kendisi de bittiyse yeşil), sırası gelmemişler gri. */
  const noktalar = liste.map((d, i) => `<i class="${
    i === su ? (d.bitti ? 'su tamam' : 'su') : d.bitti ? 'bitti' : ''}"></i>`).join('');

  return `
    <div class="dsr only-desktop">${halkalar}</div>
    <div class="dsm ${suBitti ? 'tamam' : ''}">
      <span class="dsm-sol">
        <i>Kurulum adımı</i>
        <b class="mono">${su + 1} / ${liste.length}</b>
      </span>
      <span class="dsm-nk" style="--ilerleme:${
        liste.length > 1 ? Math.round((su / (liste.length - 1)) * 100) : 0}%">${noktalar}</span>
      <button class="dsm-liste" type="button" data-eylem="asamalar-ac"
              aria-label="Aşamalar">${svg(ICON.panel, 17)}</button>
    </div>`;
}

/* Projeye basınca ara bir liste ekranı açılmıyor: kalınan aşama doğrudan
   geliyor. Aşama değiştirmek için şeritteki liste düğmesi var. */
function projeAdresi(projeId) {
  const p = DB.proje(projeId);
  if (!p) return '#/projeler/' + projeId;
  const liste = durakAkisi(p);
  const su = liste.find(d => !d.bitti) || liste[liste.length - 1];
  return '#/projeler/' + projeId + (su ? '/' + su.anahtar : '');
}

/* Alt çubuk yüzdüğü için sayfanın son satırı onun arkasında kalabiliyor.
   Payı sabit bir sayıyla yazmak yetmedi: ana ekran çizgisi (safe-area),
   yazı boyu ve tarayıcı çubuğu telefondan telefona değişiyor, içerik
   çubuğun altında kalınca "Devam Et" düğmesine basılamıyordu. Çubuğun
   gerçek yüksekliği ölçülüp sayfanın alt payına yazılıyor. */
function altCubukOlc() {
  const kok = document.documentElement;
  const t = $('#tabbar');
  if (!t || !t.offsetHeight) { kok.style.removeProperty('--alt-cubuk'); return; }
  const cs = getComputedStyle(t);
  const pay = t.offsetHeight + (parseFloat(cs.marginBottom) || 0) + 20;
  kok.style.setProperty('--alt-cubuk', Math.round(pay) + 'px');
}
addEventListener('resize', altCubukOlc);
addEventListener('orientationchange', altCubukOlc);

/* Şerit sığmayınca (on duraklı projede) bulunduğun adım ekranın dışında
   kalıyordu — açılışta ortaya getiriyoruz. */
function duraklariOrtala() {
  const serit = $('.dsr');
  if (!serit || serit.scrollWidth <= serit.clientWidth) return;
  const su = $('.dsr-a.su', serit);
  if (!su) return;
  serit.scrollLeft = su.offsetLeft - (serit.clientWidth - su.offsetWidth) / 2;
}

/* Geniş ekranda sağda duran künye. Adımın içinde çalışırken "hangi
   projedeyim, neresi eksik" sorusu için geri dönmek gerekmesin diye. */
function durakOzetPaneli(p) {
  const liste   = durakAkisi(p);
  const sayilan = liste.filter(d => !d.sayilmaz);
  const biten   = sayilan.filter(d => d.bitti).length;
  const yuzde   = projeAsamaYuzde(p);
  const paket   = projePaketi(p);
  const pl      = p.palet || {};
  const adres   = DB.logoAdres[p.id];

  const satirlar = [
    ['Firma',    p.firma],
    ['Sektör',   p.sektor],
    ['Paket',    paket ? paket.ad : ''],
    ['Platform', PLATFORM_ADI[p.platform]],
    ['Veri',     VERI_ADI[p.veri]],
    ['Adres',    pl.alanAdi],
  ].filter(x => x[1]).map(x => `
    <span class="dso-s"><i>${esc(x[0])}</i><b>${esc(x[1])}</b></span>`).join('');

  /* Sıradaki iş: bitmemiş ilk durak. Hepsi bittiyse satır hiç çıkmıyor. */
  const sirada = liste.find(d => !d.bitti && !d.sayilmaz);

  return `
    <aside class="dso" style="${renkDegiskenleri(p.renk)}">
      <div class="dso-kart">
        <div class="dso-bas">
          <span class="dso-logo ${adres ? 'yukleniyor' : ''}"
                ${adres ? `data-logo="${esc(adres)}"` : ''}>
            <span class="logo-harf">${esc(basHarf(p.firma))}</span>
          </span>
          <span class="dso-bas-yz">
            <b>${esc(projeAdi(p))}</b>
            <i>Proje özeti</i>
          </span>
        </div>

        <div class="dso-ilerleme">
          <span class="dso-il-ust"><i>Tamamlanan</i><u class="mono">%${yuzde}</u></span>
          <span class="dso-ray"><i style="width:${yuzde}%"></i></span>
          <span class="dso-il-alt mono">${biten} / ${sayilan.length} aşama</span>
        </div>

        <div class="dso-liste">${satirlar}</div>

        ${sirada ? `
          <div class="dso-sirada">
            <i>Sıradaki</i>
            <b>${esc(sirada.ad)}</b>
            <em>${esc(sirada.ozet || '')}</em>
          </div>` : ''}

      </div>
    </aside>`;
}

/* Alt çubuk: Geri / Devam Et. Sıradaki durak kilitliyse düğme sönük —
   kilit kuralı tek yerden (durakAkisi) geliyor, burada ikinci bir mantık yok. */
function durakAyak(p, anahtar) {
  const liste   = durakAkisi(p);
  const i       = liste.findIndex(d => d.anahtar === anahtar);
  const onceki  = i > 0 ? liste[i - 1] : null;
  const sonraki = (i >= 0 && i < liste.length - 1) ? liste[i + 1] : null;
  const ok      = svg(ICON.chevron, 15);

  const geri = onceki
    ? `<a class="dsa-btn geri" href="#/projeler/${p.id}/${onceki.anahtar}">${ok} Geri</a>`
    : `<a class="dsa-btn geri" href="#/projeler">${ok} Projeler</a>`;

  /* Düzenleme kipindeyken ileri gitmek yerine kaydedip kipten çıkılıyor:
     alanlar zaten yazdıkça kaydediliyor, düğme "işim bitti" demek. */
  if (durakDuzenlemede(p, anahtar)) {
    return `
      <div class="dsa">
        <button class="dsa-btn" type="button" data-eylem="durak-iptal">
          ${svg(ICON.kapat, 14)} İptal</button>
        <span class="dsa-orta mono">${i + 1} / ${liste.length}</span>
        <button class="dsa-btn ana yesil" type="button" data-eylem="durak-kaydet">
          ${svg(ICON.tik, 15)} Kaydet</button>
      </div>`;
  }

  const kilit = !!(sonraki && sonraki.kilitli);
  const ileri = !sonraki
    ? `<a class="dsa-btn ana" href="#/projeler">Projelere dön ${ok}</a>`
    : kilit
      ? `<span class="dsa-btn ana pasif">Devam Et ${svg(ICON.kilit, 14)}</span>`
      : `<a class="dsa-btn ana" href="#/projeler/${p.id}/${sonraki.anahtar}">Devam Et ${ok}</a>`;

  return `
    <div class="dsa">
      ${geri}
      <span class="dsa-orta mono">${i + 1} / ${liste.length}</span>
      ${ileri}
    </div>
    ${kilit ? `<p class="dsa-ipucu">Bu aşamayı tamamlayınca «${esc(sonraki.ad)}» açılır.</p>` : ''}`;
}

/* Telefonda aşama listesi: alttan çıkan sayfa. Şeritteki düğme açıyor,
   perdeye ya da kapatmaya dokunmak kapatıyor; bir adıma dokununca adres
   değiştiği için ekran zaten kapalı olarak yeniden çiziliyor. */
function durakAsamaSayfasi(p, anahtar) {
  const liste = durakAkisi(p);

  const satirlar = liste.map((d, i) => {
    const su  = d.anahtar === anahtar;
    /* "Şimdiki" ve "bitti" birlikte olabilir: üstünde durduğun aşama zaten
       tamamlanmışsa satır kırmızı değil yeşil görünüyor. */
    const hal = (su ? 'su ' : '') + (d.bitti ? 'bitti' : d.kilitli ? 'kilitli' : '');
    const def = DURAKLAR[d.anahtar] || {};
    const acik = typeof def.aciklama === 'function' ? def.aciklama(p) : def.aciklama;
    const ic  = `
      <span class="dsl-no">${i + 1}</span>
      <span class="dsl-yz">
        <b>${esc(d.ad)}</b>
        <i>${esc(acik || d.ozet || '')}</i>
      </span>
      <span class="dsl-durum">${
        d.bitti ? svg(ICON.tik, 22)
        : su    ? svg(ICON.nokta, 22)
        : ''}</span>`;
    return (d.kilitli || su)
      ? `<span class="dsl ${hal}">${ic}</span>`
      : `<a class="dsl ${hal}" href="#/projeler/${p.id}/${d.anahtar}">${ic}</a>`;
  }).join('');

  return `
    <div class="dsp" id="asama-sayfasi">
      <span class="dsp-perde" data-eylem="asamalar-kapat"></span>
      <div class="dsp-kagit">
        <span class="dsp-tut"></span>
        <div class="dsp-bas">
          <b>Aşamalar</b>
          <button class="dsp-kapat" type="button" data-eylem="asamalar-kapat"
                  aria-label="Kapat">${svg(ICON.kapat, 17)}</button>
        </div>
        <div class="dsp-liste">${satirlar}</div>
        <button class="dsp-dug" type="button" data-eylem="asamalar-kapat">Kapat</button>
      </div>
    </div>`;
}

/* Her durak sayfasının tepesi: logo, firma adı, rozetler.
   Zemine projenin kendi rengi vuruyor — hangi müşteride olduğun bir bakışta belli. */
function sayfaHero(p, d) {
  const adres = DB.logoAdres[p.id];

  const rozet = [
    p.sektor,
    PLATFORM_ADI[p.platform],
    VERI_ADI[p.veri],
  ].filter(Boolean);

  return `
    <div class="hero" style="${renkDegiskenleri(p.renk)}">
      <span class="hero-zemin"></span>
      <span class="hero-no">${d.no}</span>
      <span class="hero-logo ${adres ? 'yukleniyor' : ''}"
            ${adres ? `data-logo="${esc(adres)}"` : ''}>
        <span class="logo-harf">${esc(basHarf(p.firma))}</span>
        ${adres ? '<span class="donen"></span>' : ''}
      </span>
      <h1>${esc(projeAdi(p))}</h1>
      <span class="hero-rozetler">
        ${rozet.map((x, i) => `<span class="rz ${i === 0 && p.sektor ? 'marka' : ''}">${esc(x)}</span>`).join('')}
      </span>
    </div>`;
}

function bolumBas(ad) {
  return `<div class="bl"><span>${esc(ad)}</span><i></i></div>`;
}

/* ---------- 1 · Firma bilgileri ----------
   Bu durak bir dashboard: tepede işletme görseli, altında aşama şeridi,
   sonra üç kart. Önceki hâlinde yedi ayrı kutu vardı; aynı bilgi tek
   ızgaraya sığıyor ve her satırın kendi simgesi var. */

/* Adım başlığı — sayfanın tepesi. Eskiden burada işletme görseli vardı ama
   o görsel marka kartının içinde zaten duruyor; tepede ikinci kez göstermek
   ekranın en değerli yerini tekrara harcıyordu.

   Kart ötekilerden bilerek daha iri: 56 piksellik renkli karo, 19 puntoluk
   başlık ve zeminde adımın rengiyle yayılan hafif ışık. Ötekiler 28 piksel
   karo ve 12,5 punto — sayfanın neyle ilgili olduğu ilk bakışta okunuyor. */
function adimBasligi(p, d, sayac) {
  const renk = d.renk || 'var(--metal-2)';
  const ikon = ICON[d.ikon] || ICON.bayrak;
  const acik = typeof d.aciklama === 'function' ? d.aciklama(p) : d.aciklama;

  /* Aşamanın kapağı: kendi renginde zemin, iri simge, adı ve ne iş yaptığı.
     Proje adı ve adım sayacı buradan kalktı — proje adı üst çubukta, sıra
     bilgisi şeritte zaten yazıyor; aynı şeyi üç kez söylemek yer israfıydı. */
  return `
    <div class="ab" style="--kr:${renk}">
      <span class="ab-ik">${svg(ikon, 26)}</span>
      <span class="ab-yz">
        <b>${esc(d.ad)}</b>
        ${acik ? `<i>${esc(acik)}</i>` : ''}
      </span>
      ${sayac ? `<span class="ab-say mono">${esc(sayac)}</span>` : ''}
    </div>`;
}

/* ---------- Aşama formu ----------
   Alanlar artık ayrı bir sihirbaz penceresinde değil, aşamanın kendi
   sayfasında: etiket üstte, simgeli kutu altında. Yazıp alandan çıkınca
   kaydediliyor — ayrı "Kaydet" düğmesi yok, unutulacak bir adım da yok. */
function fmAlan(o) {
  const cok = !!o.coksatir;
  const ortak = `class="fm-gir" data-fm="${o.alan}" data-fmk="${o.kap || 'proje'}"
    data-proje="${o.proje}" placeholder="${esc(o.ipucu || '')}"
    autocomplete="off" spellcheck="false"
    ${o.maxlength ? `maxlength="${o.maxlength}"` : ''}`;

  return `
    <label class="fm">
      <span class="fm-et">${esc(o.etiket)}${
        o.opsiyonel ? ' <i>(Opsiyonel)</i>' : ''}</span>
      <span class="fm-kutu ${cok ? 'cok' : ''}">
        ${o.ikon ? `<span class="fm-ik">${svg(o.ikon, 17)}</span>` : ''}
        ${cok
          ? `<textarea ${ortak} rows="3">${esc(o.deger || '')}</textarea>`
          : `<input type="${o.tip || 'text'}" ${ortak} value="${esc(o.deger || '')}">`}
        <span class="fm-tik">${svg(ICON.tik, 14)}</span>
      </span>
      ${o.not ? `<span class="fm-not">${o.not}</span>` : ''}
    </label>`;
}

/* Seçmeli alan: etiket + çipler. Seçim anında kaydediliyor. */
function fmSecim(etiket, secenekler, ipucu) {
  return `
    <div class="fm">
      <span class="fm-et">${esc(etiket)}</span>
      <div class="fm-cipler">${secenekler.map(x => `
        <button class="fm-cip ${x.secili ? 'on' : ''}" type="button"
                data-eylem="${x.eylem}" data-proje="${x.proje}" data-deger="${esc(x.deger)}">
          ${x.secili ? svg(ICON.tik, 12) : ''}${esc(x.ad)}
        </button>`).join('')}</div>
      ${ipucu ? `<span class="fm-not">${ipucu}</span>` : ''}
    </div>`;
}

/* Tamamlanmış aşamanın tepesindeki yeşil şerit + "Düzenle". */
function fmTamamBar(p, anahtar, mesaj, dugmeAd) {
  return `
    <div class="fm-tamam">
      <span class="fm-tamam-ik">${svg(ICON.tik, 17)}</span>
      <span class="fm-tamam-yz">
        <b>Bu adım tamamlandı</b>
        <i>${esc(mesaj || 'Zorunlu bilgiler dolduruldu.')}</i>
      </span>
      ${dugmeAd === false ? '' : `<button class="fm-duzenle" type="button"
              data-eylem="durak-duzenle" data-proje="${p.id}" data-durak="${anahtar}">
        ${svg(ICON.kalem, 14)} ${esc(dugmeAd || 'Düzenle')}</button>`}
    </div>`;
}

/* Salt okunur alan: yazılamaz, yeşil zeminli, sağında tik. */
function fmOkuma(etiket, ikon, deger) {
  return `
    <div class="fm">
      <span class="fm-et">${esc(etiket)}</span>
      <span class="fm-kutu dolu">
        ${ikon ? `<span class="fm-ik">${svg(ikon, 17)}</span>` : ''}
        <span class="fm-oku">${esc(deger)}</span>
        <span class="fm-tik">${svg(ICON.tik, 14)}</span>
      </span>
    </div>`;
}

/* Bu aşama şu an düzenleme kipinde mi? */
function durakDuzenlemede(p, anahtar) {
  return DUZENLENEN_DURAK === p.id + '/' + anahtar;
}

/* Yazılan değeri kaydet. Ekranı hemen yeniden çizmiyoruz: kullanıcı bir
   sonraki alana geçtiyse imleç kaçardı. Odak formdan çıkmışsa çiziyoruz ki
   şerit ve "Devam Et" güncel kalsın. */
async function fmKaydet(el) {
  const p = DB.proje(el.dataset.proje);
  if (!p) return;
  const ad   = el.dataset.fm;
  const kap  = el.dataset.fmk || 'proje';
  const yeni = String(el.value || '').trim();
  const eski = kap === 'palet'
    ? String((p.palet || {})[ad] || '')
    : String(p[ad] || '');
  if (yeni === eski) return;

  const kutu = el.closest('.fm-kutu');
  if (kutu) kutu.classList.add('yaziyor');
  try {
    if (kap === 'palet') {
      await DB.paletKaydet(p.id, Object.assign({}, p.palet || {}, { [ad]: yeni }));
    } else {
      await DB.projeGuncelle(p.id, { [ad]: yeni });
    }
    if (kutu) { kutu.classList.remove('yaziyor'); kutu.classList.add('kayitli'); }
    /* Odak hâlâ formdaysa çizme — yazmaya devam ediyor. */
    setTimeout(() => {
      const od = document.activeElement;
      if (!od || !od.closest || !od.closest('.fm-gir, [data-rol]')) render();
    }, 30);
  } catch (h) {
    if (kutu) kutu.classList.remove('yaziyor');
    toast(h.message || 'Kaydedilemedi.', 'hata');
  }
}

/* Künye satırı: renkli simge, üstte etiket, altta değer. Değer yoksa
   satır kaybolmuyor — sarı "girilmedi" yazıyor ki eksik göze çarpsın. */
function kunyeSatiri(renk, ikon, etiket, deger, eylem, projeId, pasif, bosYazi) {
  const etiketler = eylem && !pasif
    ? `class="fb-s dokun" style="--ki:${renk}" data-eylem="${eylem}" data-proje="${projeId}"
       role="button" tabindex="0"`
    : `class="fb-s ${pasif ? 'pasif' : ''}" style="--ki:${renk}"`;
  return `
    <span ${etiketler}>
      <span class="fb-si">${svg(ikon, 13)}</span>
      <span class="fb-syazi">
        <i>${esc(etiket)}</i>
        <b class="${deger ? '' : pasif ? 'bos' : 'eksik'}">${esc(deger || bosYazi
          || (pasif ? 'promptu kopyalayınca' : eylem ? 'dokun, yaz' : 'girilmedi'))}</b>
      </span>
    </span>`;
}

/* Boş kartın davet hâli. Üç parçası var: ne olduğu, NEDEN gerektiği ve
   doldur düğmesi. Gerekçe önemli — "sektör" diye sorunca kullanıcı
   geçiştiriyor, "promptun ilk satırları bundan çıkıyor" deyince dolduruyor.
   Sırası gelmemiş kart soluk ama kilitli değil: sıra önerisi, yasak değil. */
function fbBosKart(renk, ikon, baslik, sayac, gerekce, eylem, projeId, sirada) {
  return `
    <div class="fb-kart fb-bos ${sirada ? '' : 'sonra'}" style="--kr:${renk}">
      <div class="fb-ust">
        <span class="fb-ik">${svg(ikon, 14)}</span>
        <span class="fb-bas">${esc(baslik)}</span>
        <span class="fbd-say">${esc(sayac)}</span>
      </div>
      <p class="fb-neden">${gerekce}</p>
      <button class="fb-doldur ${sirada ? '' : 'sonra'}" type="button"
              data-eylem="${eylem}" data-proje="${projeId}">
        ${svg(sirada ? ICON.kalem : ICON.saat, 14)} ${sirada ? 'Doldur' : 'Sırada'}</button>
    </div>`;
}

function fbKart(renk, ikon, baslik, eylem, projeId, ic, sayac) {
  return `
    <div class="fb-kart" style="--kr:${renk}">
      <div class="fb-ust">
        <span class="fb-ik">${svg(ikon, 14)}</span>
        <span class="fb-bas">${esc(baslik)}</span>
        ${sayac ? `<span class="fbd-say tam">${esc(sayac)}</span>` : ''}
        ${AUTH.yonetici && eylem ? `<button class="fb-kalem" type="button"
          data-eylem="${eylem}" data-proje="${projeId}"
          aria-label="${esc(baslik)} düzenle">${svg(ICON.kalem, 13)}</button>` : ''}
      </div>
      ${ic}
    </div>`;
}

/* Takvim kendi ince şeridinde: "ne zaman" ayrı bir soru, künyenin dibinde
   saklanacak bir alt satır değil. Ayrı kart açmaya da değmiyor — iki tarih
   ve bir çubuktan ibaret. */
function fbTakvimSeridi(p) {
  const bas   = p.baslangic ? new Date(p.baslangic) : null;
  const son   = p.teslim ? new Date(p.teslim) : null;
  const bugun = new Date(bugunTarih());

  let yuzde = 0, sayi = '', birim = 'gün kaldı', gecikti = false;
  if (bas && son && son > bas) {
    yuzde = Math.max(0, Math.min(100, Math.round((bugun - bas) / (son - bas) * 100)));
    const kalan = Math.round((son - bugun) / 86400000);
    gecikti = kalan < 0;
    sayi = String(Math.abs(kalan));
    birim = gecikti ? 'gün geçti' : 'gün kaldı';
  }

  return `
    <div class="fb-tks ${gecikti ? 'gecikti' : ''}" data-eylem="adim-takvim"
         data-proje="${p.id}" role="button" tabindex="0">
      <span class="fb-tsi">${svg(ICON.saat, 13)}</span>
      <span class="fb-torta">
        ${bas && son ? `<span class="fb-tray"><i style="width:${yuzde}%"></i></span>` : ''}
        <span class="fb-tuc">
          <span>${bas ? esc(gunYaz(p.baslangic)) : 'başlangıç girilmedi'}</span>
          <span>${son ? esc(gunYaz(p.teslim)) : 'teslim girilmedi'}</span>
        </span>
      </span>
      ${sayi ? `<span class="fb-tkalan"><b>${sayi}</b><i>${birim}</i></span>` : ''}
    </div>`;
}

function fbCip(renk, ikon, ic, eylem, projeId, adres) {
  const govde = `${svg(ikon, 12)}${ic}`;
  if (adres) return `<a class="fb-cp" style="--ci:${renk}" href="${esc(adres)}">${govde}</a>`;
  if (eylem) return `<button class="fb-cp" style="--ci:${renk}" type="button"
    data-eylem="${eylem}" data-proje="${projeId}">${govde}</button>`;
  return `<span class="fb-cp" style="--ci:${renk}">${govde}</span>`;
}

/* Kartlar soruya göre gruplanıyor: İş ne yapıyoruz, Kişiler kim, Yer nerede
   duruyor. Takvim "ne zaman" olduğu için künyeden çıkıp kendi şeridine geçti;
   Durum silindi — kahramandaki yüzdeyle aynı şeyi söylüyordu. */
/* 1 · Firma bilgileri — müşteriyle konuşurken öğrendiklerin. Teknik karar yok:
   firma kim, kime ulaşacağız, hangi işi yapıyor, markası neye benziyor. */
function firmaSayfasi(p, d) {
  const dolu   = [p.firma, p.telefon, p.eposta, p.sektor].filter(Boolean).length;
  const logo   = DB.logoAdres[p.id];

  const sektorler = (DB.sektorler || []).map(x => ({
    ad: x.ad, deger: x.ad, secili: p.sektor === x.ad,
    eylem: 'durak-sektor', proje: p.id,
  }));
  /* Listede olmayan bir sektör elle yazılmışsa kaybolmasın. */
  if (p.sektor && !sektorler.some(x => x.secili)) {
    sektorler.push({ ad: p.sektor, deger: p.sektor, secili: true, eylem: 'durak-sektor', proje: p.id });
  }
  sektorler.push({ ad: 'Diğer…', deger: '', secili: false, eylem: 'durak-sektor-yeni', proje: p.id });

  /* Aşama bitmişse ve kullanıcı "Düzenle" demediyse: form yerine özet.
     Dolu bir formu yeniden doldurulacakmış gibi göstermek, geri dönen
     kullanıcıya "burada bir işim mi kaldı?" dedirtiyordu. */
  if (dolu === 4 && !durakDuzenlemede(p, 'firma')) {
    return `<div class="fb-govde">`
      + adimBasligi(p, d, dolu + '/4')
      + fmTamamBar(p, 'firma')
      + `<div class="fm-liste">`
      + fmOkuma('Firma adı', ICON.etiket, p.firma)
      + fmOkuma('Telefon', ICON.telefon, p.telefon)
      + fmOkuma('E-posta', ICON.mail, p.eposta)
      + fmOkuma('Sektör', ICON.dukkan, p.sektor)
      + fmLogoAlani(p, logo, true)
      + `</div></div>`;
  }

  return `<div class="fb-govde">`
    + adimBasligi(p, d, dolu + '/4')
    + `<div class="fm-liste">`
    + fmAlan({ etiket: 'Firma adı', ikon: ICON.etiket, alan: 'firma', proje: p.id,
               deger: p.firma, ipucu: 'Örn. Egz Yapı', maxlength: 80 })
    + fmAlan({ etiket: 'Telefon', tip: 'tel', ikon: ICON.telefon, alan: 'telefon', proje: p.id,
               deger: p.telefon, ipucu: 'Örn. 0538 956 88 59', maxlength: 30 })
    + fmAlan({ etiket: 'E-posta', tip: 'email', ikon: ICON.mail, alan: 'eposta', proje: p.id,
               deger: p.eposta, ipucu: 'Örn. bilgi@firma.com', maxlength: 120 })
    + fmSecim('Sektör', sektorler)
    + fmLogoAlani(p, logo)
    + `</div></div>`;
}

/* Logo alanı: isteğe bağlı ama her zaman görünür — aşama tamamlandıktan
   sonra da duruyor. */
function fmLogoAlani(p, logo, salt) {
  /* İki hâlde de aynı satır: solda küçük kare önizleme, ortada "Logo" ve
     altında adı, sağda yeşil tik. Tamamlanmış aşamada satır biraz daha iri
     ve tıklanmıyor — değiştirmek için "Düzenle" gerekiyor. */
  const deger = logo ? projeAdi(p) : (salt ? 'Eklenmedi' : 'Seçmek için dokun');
  const ic = `
    <span class="fm-lk ${logo ? '' : 'bos'}"
          ${logo ? `style="background-image:url('${esc(logo)}')"` : ''}>
      ${logo ? '' : svg(ICON.resim, 16)}
    </span>
    <span class="fm-lyz">
      <b>Logo</b>
      <i class="${logo ? '' : 'bos'}">${esc(deger)}</i>
    </span>
    ${logo ? `<span class="fm-tik">${svg(ICON.tik, 14)}</span>` : ''}`;

  return `
    <div class="fm">
      ${salt
        ? `<span class="fm-lsatir buyuk ${logo ? 'dolu' : ''}">${ic}</span>`
        : `<button class="fm-lsatir ${logo ? 'dolu' : ''}" type="button"
             data-eylem="logo-yukle" data-proje="${p.id}">${ic}</button>`}
    </div>`;
}/* 2 · Program temeli — bu paketin adı, kim kullanacak, verisi nerede
   duracak. Eskiden "Kurulum ve yapı" durağının içindeydi (Yer + Kim
   kullanacak? ayrı ayrı); tek karar oldukları için tek karta indi. */
function programSayfasi(p, d) {
  const pl     = p.palet || {};
  const roller = rolListesi(pl.roller);
  const dolu   = [!!pl.modulAdi, roller.length > 0, !!pl.veriKatmani].filter(Boolean).length;
  const veri   = pl.veriKatmani
    || (TEKNIK_ALAN.find(x => x.anahtar === 'veriKatmani') || {}).varsayilan;

  if (dolu === 3 && !durakDuzenlemede(p, 'program')) {
    const alanKarti = ALAN_TURU_KARTI[pl.alanTuru || 'githubio'] || {};
    return `<div class="fb-govde">`
      + adimBasligi(p, d, dolu + '/3')
      + fmTamamBar(p, 'program')
      + `<div class="fm-liste">`
      + fmOkuma('Program adı', ICON.katman, pl.modulAdi)
      + fmOkuma('Katmanlar', ICON.gGuvenlik, roller.slice().reverse().join(' · '))
      + fmOkuma('Veriler nerede duracak', ICON.gVeri, veri)
      + fmOkuma('Alan adı', ICON.dil, alanKarti.ad || pl.alanTuru || '')
      + `</div></div>`;
  }

  return `<div class="fb-govde">`
    + adimBasligi(p, d, dolu + '/3')
    + `<div class="fm-liste">`
    + fmAlan({ etiket: 'Program adı', ikon: ICON.katman, alan: 'modulAdi', kap: 'palet',
               proje: p.id, deger: pl.modulAdi, ipucu: 'Örn. Muhasebe', maxlength: 60 })
    + `<div class="fm">
        <span class="fm-et">Katmanlar</span>
        ${rolMerdiveni(roller, 'durak', true)}
      </div>`
    + fmKartSecim('Veriler nerede duracak', VERI_KATMANI_KARTI, veri, 'durak-veri', p.id)
    + fmKartSecim('Alan adı', ALAN_TURU_KARTI, pl.alanTuru || 'githubio', 'durak-alanturu', p.id)
    + `</div></div>`;
}

/* Kart biçiminde seçim — Program temeli'ndeki "veriler nerede" ve "alan adı"
   kararları. Görünüm eski sihirbazdaki kartların aynısı (.pa-veri-*), yalnız
   tıklama artık genel eylem dağıtıcısından geçiyor. */
function fmKartSecim(etiket, kartlar, secili, eylem, projeId) {
  return `
    <div class="fm">
      <span class="fm-et">${esc(etiket)}</span>
      <div class="pa-veri-liste">
        ${Object.keys(kartlar).map(k => {
          const kart = kartlar[k];
          return `
          <label class="pa-veri-kart ${secili === k ? 'on' : ''}" style="--ki:${kart.renk}"
                 data-eylem="${eylem}" data-proje="${projeId}" data-deger="${esc(k)}">
            <span class="pa-veri-ust">
              <span class="pa-veri-ik${kart.servis ? ' servis' : ''}">${
                kart.servis ? servisIkon(kart.servis, 20) : svg(ICON[kart.ikon], 18)}</span>
              <span class="pa-veri-ad">${esc(kart.ad || k)}</span>
              ${kart.onerilen ? '<span class="pa-veri-rozet">Önerilen</span>' : ''}
              <span class="pa-veri-radyo"></span>
            </span>
            <span class="pa-veri-oz-liste">
              ${kart.ozellikler.map(o => `<span class="pa-veri-oz ${o.iyi ? 'iyi' : 'kotu'}">
                ${svg(o.iyi ? ICON.tik : ICON.kapat, 11)} ${esc(o.yazi)}</span>`).join('')}
            </span>
          </label>`;
        }).join('')}
      </div>
    </div>`;
}/* 3 · Bağlantılar ve temel — GitHub, Claude, (seçiliyse) Supabase ve
   Namecheap + sabit iskelet onayı. Kaç bağlantı gerektiği Program
   temeli'ndeki iki karara bağlı (veri katmanı, alan adı türü) — karar
   orada, bağlantı burada. Her bağlantı artık kendi tam ekran adımında:
   `baglantiDuzenleAc` sihirbazı açıyor. GitHub ve Yayın adımlarında sekmeden
   dönünce bir onay kutusu çıkıyor (bkz. DEPO_BEKLIYOR/PAGES_BEKLIYOR) —
   yeşile dönmesi kullanıcının "Bağlandı" demesine bağlı, otomatik değil;
   Supabase/Namecheap adımlarında zaten gerçek veri elle giriliyor.
   Sabit iskelet (eski "Nizam kurulum paketi" durağı) buraya katlandı:
   tanışma promptu Claude adımıyla zaten gidiyor, geriye Claude'un
   kurduğunu işaretlemek kalıyor. */
function baglantilarSayfasi(p, d) {
  const liste = baglantiAdimListesi(p);
  const biten = liste.filter(k => baglantiAdimBittiMi(k, p)).length;
  const pl    = p.palet || {};

  /* Açık duran bağlantı: kullanıcı elle açtıysa o, yoksa sıradaki (bitmemiş
     ilk) bağlantı. "Düzenle" kipinde hepsi açık. */
  const hepsiAcik = durakDuzenlemede(p, 'baglantilar');
  const sirada    = liste.find(k => !baglantiAdimBittiMi(k, p));
  /* '-' = kullanıcı açık kartı kapattı; hiçbiri açık değil. */
  const acik      = baglantiAcik(liste, sirada);

  /* Bitmiş bağlantının kartında görünen değer — ne bağlandığı bir bakışta
     okunsun diye. */
  const deger = k => k === 'github' ? (depoSlug(p.repo) || p.repo || '')
    : k === 'claude'    ? (String(pl.sohbetAdi || '').trim() || 'Bağlandı')
    : k === 'pages'     ? (pl.alanAdi || 'Yayında')
    : k === 'supabase'  ? String(pl.supabaseUrl || '').trim()
    : k === 'sql'       ? 'Veritabanı yüklendi'
    : (pl.alanAdi || 'Bağlandı');

  const satirlar = liste.map((k, i) => {
    const tamam = baglantiAdimBittiMi(k, p);
    const acikMi = hepsiAcik || k === acik;
    const hal = tamam ? 'bitti' : acikMi ? 'acik' : '';
    const dg = tamam ? deger(k) : '';

    return `
      <div class="bgz-s ${hal} ${i === liste.length - 1 ? 'son' : ''}">
        <span class="bgz-no">${tamam ? svg(ICON.tik, 14) : i + 1}</span>
        <div class="bgz-kart">
          <button class="bgz-bas" type="button"
                  data-eylem="baglanti-ac" data-anahtar="${k}">
            <span class="bgz-logo">${servisIkon(BAGLANTI_SERVIS[k], 22)}</span>
            <span class="bgz-yz">
              <b>${esc(BAGLANTI_ETIKET[k])}</b>
              <i>${esc(BAGLANTI_ALT[k] || '')}</i>
            </span>
            <span class="bgz-durum ${tamam ? 'tamam' : ''}">${
              tamam ? svg(ICON.tik, 14) : 'Bekliyor'}</span>
            <span class="bgz-ok ${acikMi ? 'acik' : ''}">${svg(ICON.chevron, 14)}</span>
          </button>
          ${tamam && dg && !acikMi ? `<span class="bgz-deger">${esc(dg)}</span>` : ''}
          ${acikMi ? `
            <div class="bgz-ic">
              ${(BAGLANTI_ADIMLARI[k] || []).length ? `
                <ol class="bgz-adimlar">
                  ${BAGLANTI_ADIMLARI[k].map(x => `<li>${esc(x)}</li>`).join('')}
                </ol>` : ''}
              ${baglantiGovdesi(k, p)}
            </div>` : ''}
        </div>
      </div>`;
  }).join('');

  return `<div class="fb-govde">`
    + adimBasligi(p, d, biten + '/' + liste.length)
    + (biten === liste.length
        ? fmTamamBar(p, 'baglantilar', 'Bütün bağlantılar kuruldu.') : '')
    /* Sayfanın altındaki "Kod deposu / Proje kimliği" satırları kalktı:
       depo adresi zaten GitHub kartında ve proje menüsünde. */
    + `<div class="bgz">${satirlar}</div>`
    + `</div>`;
}

/* Şu an hangi bağlantı açık: kullanıcı elle açtıysa o, kapattıysa hiçbiri,
   dokunmadıysa sıradaki. */
function baglantiAcik(liste, sirada) {
  if (ACIK_BAGLANTI === '-') return '';
  return (ACIK_BAGLANTI && liste.indexOf(ACIK_BAGLANTI) !== -1) ? ACIK_BAGLANTI : sirada;
}

/* Her bağlantının tek satırlık tanımı ve yapılacak işlerin kısa listesi.
   Uzun "neden iyi" listelerinin yerini bunlar aldı: kullanıcı ne yapacağını
   okusun, servisin reklamını değil. */
const BAGLANTI_ALT = {
  github: 'Kodun durduğu yer.',
  claude: 'Kurulumu yapan asistan.',
  pages: 'Siteyi canlıya al.',
  supabase: 'Veritabanı bağlantısı.',
  sql: 'Hazır veritabanı.',
  namecheap: 'Kendi alan adın.',
};

const BAGLANTI_ADIMLARI = {
  github: ['GitHub\'da yeni depo açın.',
           'Depo oluştuktan sonra buradan bağlandığını işaretleyin.'],
  claude: ['Düğmeye basın: metin kopyalanır, Claude açılır.',
           'Yeni sohbet açıp yapıştırın.',
           'Dönünce "Bağlandı olarak işaretle" deyin.'],
  pages: ['Yayın ayarlarını açın.', 'Dönünce yayına alındığını işaretleyin.'],
  supabase: ['Supabase\'de proje açın.',
             'Proje adresi ile anon key\'i yapıştırıp işaretleyin.'],
  sql: ['Üç parçayı sırayla kopyalayın.', 'Supabase\'in SQL ekranında çalıştırın.',
        '"Yüklendi" diye işaretleyin.'],
  namecheap: ['DNS kayıtlarını kopyalayın.', 'Alan adı sağlayıcınıza girin.',
              '"Bağlandı" diye işaretleyin.'],
};
/* Bir bağlantının gövdesi. Eski sihirbazın adım gövdeleri olduğu gibi
   kullanılıyor — içerikleri değişmedi, yalnız yerleri değişti. */
function baglantiGovdesi(k, p) {
  return k === 'github'   ? baglantiAdimGithub(p)
    : k === 'claude'      ? baglantiAdimClaude(p)
    : k === 'pages'       ? baglantiAdimPages(p)
    : k === 'supabase'    ? baglantiAdimSupabase(p)
    : k === 'sql'         ? baglantiAdimSql(p)
    : baglantiAdimNamecheap(p);
}
/* ---------- Rol merdiveni ----------
   En altta en dar yetki, en üstte en geniş. Sayıyı değiştirince adlar
   korunur; azaltınca üsttekiler düşer, artırınca örnek adla gelir.

   Program temeli bunu çağırıyor (bkz. programAdimKatman) — roller yalnız
   orada tanımlanıp değiştiriliyor. Yetkilendirme durağı (yetkiSayfasi)
   rolleri yalnız salt-okunur gösteriyor, bu bileşeni tekrar çağırmıyor. */
function rolMerdiveni(roller, onek, sade) {
  const liste = rolListesi(roller);
  const n = liste.length || 2;
  return `
    <div class="rol-kat" data-rol-onek="${onek}">
      <span class="fbd-et">Katman sayısı</span>
      <div class="rol-sayi">
        ${[2, 3, 4, 5].map(k => `
          <button class="rol-sayi-cp ${k === n ? 'on' : ''}" type="button"
                  data-rol-sayi="${k}">${k} katman</button>`).join('')}
      </div>
      ${sade ? '' : `<span class="fbd-et" style="margin-top:14px">Katmanlar</span>`}
      <div class="rol-liste">
        ${Array.from({ length: n }, (_, i) => {
          const sira = n - 1 - i;                      /* üstten alta çiz */
          const ust  = sira === n - 1;
          const dar  = sira === 0;
          /* En üstteki katman her zaman "Admin": ilk kullanıcı hesabı bu
             adla açılıyor (bkz. Bağlantılar ve temel / ilk kurulum promptu),
             o yüzden burada sabit ve salt okunur — silinemez, değiştirilemez. */
          const ad = ust ? 'Admin' : (liste[sira] || (ROL_ORNEK[n] || [])[sira] || '');
          /* Her katmanın ne demek olduğu tek satırda: en geniş kalkan,
             en dar kilit, aradakiler kişi. */
          const alt = ust ? 'Tüm yetkilere sahiptir.'
            : dar ? 'Sınırlı erişim yetkileri.'
            : 'Yönetim ve düzenleme yetkileri.';
          return `
            <label class="rol-satir ${ust ? 'ust' : ''}"
                   style="--ki:${ust ? '#d8a63f' : dar ? '#7d93b8' : '#3fa694'}">
              <span class="rol-no mono">${sira + 1}</span>
              <span class="rol-ik">${svg(ust ? ICON.gGuvenlik : dar ? ICON.kilit : ICON.kisi, 16)}</span>
              <span class="rol-orta">
                <input type="text" data-rol="${sira}" value="${esc(ad)}"
                       ${ust ? 'readonly' : ''}
                       placeholder="${esc((ROL_ORNEK[n] || [])[sira] || 'Rol adı')}"
                       maxlength="40" autocomplete="off">
                <i>${esc(alt)}</i>
              </span>
              ${ust ? '<span class="rol-rozet">Sabit</span>' : dar ? '<span class="rol-rozet">En dar</span>' : ''}
            </label>`;
        }).join('')}
      </div>
    </div>`;
}
/* Merdiveni canlı tut: sayı değişince yeniden çiz, adları koru. */
function rolBagla(kutu) {
  const kat = $('.rol-kat', kutu);
  if (!kat) return;
  kat.addEventListener('click', ev => {
    const b = ev.target.closest('[data-rol-sayi]');
    if (!b) return;
    const n = Number(b.dataset.rol_sayi || b.dataset.rolSayi);
    /* En üstteki "Admin" satırı sabit — sayı hesabına gerçek bir kullanıcı
       girdisi gibi karışmasın, yoksa sayı artınca ortaya sızabilir. */
    const simdi = rolOku(kutu).slice(0, -1);
    const ornek = (ROL_ORNEK[n] || []).slice(0, -1);
    /* Elle yazılmadıysa doğrudan yeni örneğe geç; yazıldıysa adları koru ve
       eksik satırları kullanılmamış örnek adlarıyla doldur. */
    const eskiOrnek = (ROL_ORNEK[simdi.length + 1] || []).slice(0, -1);
    const dokunulmus = simdi.some((x, i) => x !== eskiOrnek[i]);
    const yeni = [];
    for (let i = 0; i < n - 1; i++) {
      let ad = dokunulmus ? (simdi[i] || '') : (ornek[i] || '');
      if (!ad || yeni.includes(ad)) ad = ornek.find(x => !yeni.includes(x) && !simdi.includes(x)) || '';
      yeni.push(ad);
    }
    yeni.push('Admin');
    kat.outerHTML = rolMerdiveni(yeni, kat.dataset.rolOnek);
    rolBagla(kutu);
  });
}

function rolOku(kutu) {
  return $$('[data-rol]', kutu)
    .sort((a, b) => Number(a.dataset.rol) - Number(b.dataset.rol))
    .map(x => x.value.trim())
    .filter(Boolean);
}

/* Bir görsel yuvasının imzalı adresi. G0 = proje kartının zemin görseli;
   tasarım yönü yuvaları 'Y_' önekiyle aynı mekanizmayı paylaşıyor. */
function gorselAdresi(p, no) {
  const harita = DB.gorselAdres || {};
  const dogrudan = harita[p.id + '/' + no];
  if (dogrudan) return dogrudan;
  /* İki yuva aynı dosyayı gösterebilir. Kendi anahtarında adres yoksa aynı
     yolu gösterenden al, kutu boş görünmesin. */
  const yuvalar = (p.palet || {}).gorseller || [];
  const ben = yuvalar.find(y => y.no === no);
  if (!ben || !ben.yol) return '';
  const es = yuvalar.find(y => y.yol === ben.yol && harita[p.id + '/' + y.no]);
  return es ? harita[p.id + '/' + es.no] : '';
}

/* ---------- 6 · Profesyonel tasarım ----------
   5 sabit ChatGPT promptu — her biri projenin gerçek ekran görüntüsünü
   girdi alıp yalnız görsel dili değiştiriyor. Müşteri hangisini beğendiyse
   onu işaretliyoruz; gerçek uygulama Studio dışında (Claude Code sohbetiyle)
   yapılıyor — burada iş yalnız yön seçmek ve tamamlandığını işaretlemekte. */
/* ---- Yönün büyük örnek ekranı ----------------------------------------
   Küçük önizleme yönün rengini ve biçimini gösteriyor; bu ise o dilin
   GERÇEK BİR EKRANDA nasıl duracağını gösteriyor. Düzen Nizam Studio'nun
   kendi panelinden alındı: solda menü, üstte başlık, içeride sayı
   kartları ve bir liste.

   İçerik on iki yönde birebir aynı — değişen tek şey görsel dil. Amaç
   bu: müşteri iki yönü yan yana koyduğunda farkın nereden geldiğini
   görsün.

   Çizim yine tarifin kendisinden (TASARIM_YON.onizleme) besleniyor;
   ayrı bir resim ya da ayrı bir renk listesi tutulmuyor. */

function yonStilDegiskenleri(o) {
  return [
    `--o-zemin:${o.zemin}`, `--o-kart:${o.kart}`, `--o-metin:${o.metin}`,
    `--o-soluk:${o.soluk}`, `--o-vurgu:${o.vurgu}`, `--o-kenar:${o.kenar}`,
    `--o-ust:${o.ust}`, `--o-kose:${o.kose}`, `--o-golge:${o.golge}`,
    `--o-yazi:${o.yazi}`, `--o-doku:${o.doku}`,
    `--o-dugme-yazi:${o.dugmeYazi || o.kart}`,
  ].join(';');
}

const OE_MENU  = ['Panel', 'Projeler', 'Görevler', 'Şablonlar', 'Ayarlar'];
const OE_SAYI  = [['Açık görev', '18'], ['Bu ay', '7'], ['Bekleyen', '3']];
const OE_SATIR = [
  ['Muhasebe Modülü', 'Kontrolde'],
  ['Gün sonu aktarımı', 'Geliştiriliyor'],
  ['Banka eşleştirme', 'Tamamlandı'],
  ['Kullanıcı yetkileri', 'Yapılacak'],
];

function oeSayiKarti([etiket, sayi]) {
  return `<div class="oe-kart">
    <span class="oe-etiket">${esc(etiket)}</span>
    <span class="oe-sayi">${esc(sayi)}</span>
  </div>`;
}

function oeListe() {
  return `<div class="oe-kart oe-liste">
    <span class="oe-etiket">Son görevler</span>
    ${OE_SATIR.map(([ad, durum]) => `
      <div class="oe-satir">
        <span class="oe-satir-ad">${esc(ad)}</span>
        <span class="oe-rozet">${esc(durum)}</span>
      </div>`).join('')}
  </div>`;
}

function yonOrnekEkran(yon, kip) {
  const o = yon.onizleme;
  if (!o) return '';
  const stil = yonStilDegiskenleri(o);

  if (kip === 'mobil') {
    return `<div class="oe oe-mobil" style="${esc(stil)}">
      <div class="oe-tepe">
        <span class="oe-marka">Panel</span>
        <span class="oe-avatar">EG</span>
      </div>
      <div class="oe-govde">
        <div class="oe-sayilar oe-iki">${OE_SAYI.slice(0, 2).map(oeSayiKarti).join('')}</div>
        ${oeListe()}
        <div class="oe-dugme">Yeni görev</div>
      </div>
      <div class="oe-alt-menu">
        ${OE_MENU.slice(0, 4).map((m, i) => `
          <span class="oe-alt-oge ${i === 0 ? 'etkin' : ''}">
            <span class="oe-alt-nokta"></span>${esc(m)}</span>`).join('')}
      </div>
    </div>`;
  }

  return `<div class="oe oe-masaustu" style="${esc(stil)}">
    <div class="oe-yan">
      <span class="oe-marka">NIZAM</span>
      ${OE_MENU.map((m, i) => `
        <span class="oe-menu-oge ${i === 0 ? 'etkin' : ''}">
          <span class="oe-menu-nokta"></span>${esc(m)}</span>`).join('')}
    </div>
    <div class="oe-sag">
      <div class="oe-tepe">
        <span class="oe-baslik">Panel</span>
        <span class="oe-avatar">EG</span>
      </div>
      <div class="oe-govde">
        <div class="oe-sayilar">${OE_SAYI.map(oeSayiKarti).join('')}</div>
        ${oeListe()}
        <div class="oe-dugme">Yeni görev</div>
      </div>
    </div>
  </div>`;
}

/* Pencere · iki düğme bir görüntüyü değiştiriyor, pencere yeniden
   açılmıyor: karşılaştırma tek dokunuşla olsun. */
/* Kütüphaneden yüklenen örnek kare — tam boy. */
function tasarimKaresiAc(anahtar, adres) {
  const yon = TASARIM_YON.find(y => y.anahtar === anahtar) || {};
  modalAc(`
    <div class="modal-bas">
      <span class="modal-baslik">${esc(yon.ad || 'Tasarım')}</span>
      <p class="modal-alt-yazi">${esc(yon.ozet || '')}</p>
    </div>
    <img class="tk-buyuk" src="${esc(adres)}" alt="${esc(yon.ad || '')}">
    <div class="modal-alt">
      <button class="btn btn-ghost" data-m="kapat" type="button">Kapat</button>
    </div>`);
}

function yonOrnekAc(anahtar) {
  const yon = TASARIM_YON.find(y => y.anahtar === anahtar);
  if (!yon || !yon.onizleme) { toast('Bu yönün örnek ekranı yok.', 'uyari'); return; }

  modalAc(`
    <div class="modal-bas">
      <span class="modal-baslik">${esc(yon.ad)}</span>
      <p class="modal-alt-yazi">${esc(yon.ozet)}</p>
    </div>
    <div class="oe-secim">
      <button class="btn btn-ghost etkin" data-oe="masaustu" type="button">Masaüstü</button>
      <button class="btn btn-ghost" data-oe="mobil" type="button">Mobil</button>
    </div>
    <div class="oe-sahne" data-oe-sahne>${yonOrnekEkran(yon, 'masaustu')}</div>
    <p class="oe-not">Örnek düzen Nizam Studio panelinden alındı. İçerik on
      iki yönde aynı; değişen yalnız görsel dil.</p>
    <div class="modal-alt">
      <button class="btn btn-ghost" data-m="kapat" type="button">Kapat</button>
    </div>`, kutu => {
    const sahne = $('[data-oe-sahne]', kutu);
    kutu.querySelectorAll('[data-oe]').forEach(d => {
      d.addEventListener('click', () => {
        kutu.querySelectorAll('[data-oe]').forEach(x => x.classList.remove('etkin'));
        d.classList.add('etkin');
        sahne.innerHTML = yonOrnekEkran(yon, d.dataset.oe);
      });
    });
    $('[data-m="kapat"]', kutu).addEventListener('click', modalKapat);
  }, 'genis');
}

/* Yön önizlemesi · küçük bir ekran taklidi.

   NİYE ÇİZİM, NİYE RESİM DEĞİL
   Her yön için on iki resim dosyası tutmak demek, yön eklendiğinde ya da
   bir renk değiştiğinde resimleri elde yeniden üretmek demekti. Önizleme
   bunun yerine yönün kendi tarifinden (config.js · TASARIM_YON.onizleme)
   canlı çiziliyor: dosya yok, çevrimdışı çalışıyor, tarif değişince
   kendiliğinden güncelleniyor.

   Gösterdiği şey gerçek uygulama ekranı DEĞİL, yönün görsel dilidir:
   zemin, kart, çerçeve, köşe, gölge, vurgu rengi ve yazı tipi. Müşteri
   promptu çalıştırmadan önce "bu yön kabaca böyle duruyor" diyebilsin.

   Yüklenmiş gerçek bir mockup varsa o kazanır — çizim yalnız boşluğu
   doldurur. */
function yonOnizlemesi(yon) {
  const o = yon.onizleme;
  if (!o) return '';
  const stil = yonStilDegiskenleri(o);
  return `
    <div class="ty-mini" style="${esc(stil)}" aria-hidden="true">
      <div class="ty-mini-ust">
        <span class="ty-mini-nokta"></span>
        <span class="ty-mini-baslik">Kasa</span>
      </div>
      <div class="ty-mini-kart">
        <span class="ty-mini-etiket">Bugünkü bakiye</span>
        <span class="ty-mini-sayi">24.860</span>
        <span class="ty-mini-cizgi"></span>
        <span class="ty-mini-cizgi kisa"></span>
      </div>
      <div class="ty-mini-dug">Devam</div>
    </div>`;
}

function tasarimYonKarti(p, pl, yon) {
  const resim = gorselAdresi(p, 'Y_' + yon.anahtar);
  const secili = pl.secilenYon === yon.anahtar;
  return fbKart(yon.renk, ICON.gTasarim, yon.ad, null, p.id, `
    <p class="fb-neden">${esc(yon.ozet)}</p>
    <div class="ty-gorsel ${resim ? 'var' : ''}"
         data-eylem="tasarim-yon-ornek" data-alan="${yon.anahtar}"
         role="button" tabindex="0" title="Örnek ekranı büyük gör"
         ${resim ? `style="background-image:url('${esc(resim)}')"` : ''}>
      ${resim ? '' : yonOnizlemesi(yon)}
      <i class="ty-mini-not">dokun · örnek ekranı gör</i>
      ${GORSEL_YUKLENIYOR[p.id] && GORSEL_YUKLENIYOR[p.id].no === 'Y_' + yon.anahtar
        ? gorselYuklemeKatmani(p.id) : ''}
    </div>
    <p class="ty-ipucu">İki prompt: biri ekteki yerleşimi bozmadan yalnız
      görünüşü değiştirir, diğeri sayfayı baştan kurar. İkisi de projenin
      firmasını, sektörünü ve marka rengini prompta yazar — içerik uydurulmaz,
      iş başka bir sektörün uygulamasına dönmez. Yalnız eklediğin ekranı çizer.</p>
    <div class="ty-dug">
      <div class="ty-cift">
        <button class="sayfa-dug ikincil" type="button" data-eylem="tasarim-yon-kopyala"
                data-proje="${p.id}" data-alan="${yon.anahtar}" data-kip="ayni"
                title="Ekrandaki yerleşim aynı kalır, yalnız görünüş değişir">
          ${svg(ICON.kopya, 15)} Yerleşim aynı</button>
        <button class="sayfa-dug ikincil" type="button" data-eylem="tasarim-yon-kopyala"
                data-proje="${p.id}" data-alan="${yon.anahtar}" data-kip="yeniden"
                title="Yerleşim de sıfırdan kurulur — bir web sitesi gibi">
          ${svg(ICON.kopya, 15)} Yerleşim de yeni</button>
      </div>
      ${AUTH.yonetici ? `
        <button class="sayfa-dug ikincil" type="button" data-eylem="tasarim-yon-gorsel"
                data-proje="${p.id}" data-alan="${yon.anahtar}">
          ${svg(ICON.folder, 15)} ${resim ? 'Mockup\'ı değiştir' : 'Gerçek mockup yükle'}</button>` : ''}
      ${AUTH.yonetici ? `
        <button class="sayfa-dug ${secili ? '' : 'ikincil'}" type="button"
                data-eylem="tasarim-yon-sec" data-proje="${p.id}" data-alan="${yon.anahtar}">
          ${secili ? svg(ICON.tik, 15) : ''} Müşteri bunu seçti</button>` : ''}
    </div>`);
}

/* Son seçenek: 12 sabit yön kendi mockup'ını ChatGPT'den üretiyor, bu ise
   müşterinin ZATEN elinde olan bir referans görseli kullanıyor — ChatGPT'den
   mockup istemeye gerek yok, tek promptla hem tasarım dili çıkarılıp
   uygulanıyor hem eksik görseller için ChatGPT istekleri veriliyor (bkz.
   PROMPT.serbestTasarim). O yüzden bu kartta "Promptu kopyala" düğmesi yok —
   kopyalanacak sabit bir yön promptu değil, doğrudan "Sıradaki adım" kartı. */
function serbestTasarimKarti(p, pl) {
  const resim = gorselAdresi(p, 'Y_serbest');
  const secili = pl.secilenYon === 'serbest';
  return fbKart('var(--metal-2)', ICON.gTasarim, 'Serbest tasarım', null, p.id, `
    <p class="fb-neden">Müşterinin kendi getirdiği bir referans görsel varsa —
      buraya yükle, tek promptla bütün uygulama ona uyarlanır.</p>
    <div class="ty-gorsel ${resim ? 'var' : ''}"
         ${AUTH.yonetici ? `data-eylem="tasarim-yon-gorsel" data-proje="${p.id}"
           data-alan="serbest" role="button" tabindex="0"` : ''}
         ${resim ? `style="background-image:url('${esc(resim)}')"` : ''}>
      ${resim ? '' : svg(ICON.folder, 22)}
      ${resim ? '' : `<i>${AUTH.yonetici ? 'dokun, referans görseli yükle' : 'görsel yok'}</i>`}
      ${GORSEL_YUKLENIYOR[p.id] && GORSEL_YUKLENIYOR[p.id].no === 'Y_serbest'
        ? gorselYuklemeKatmani(p.id) : ''}
    </div>
    ${AUTH.yonetici ? `
      <div class="ty-dug">
        <button class="sayfa-dug ${secili ? '' : 'ikincil'}" type="button"
                data-eylem="tasarim-yon-sec" data-proje="${p.id}" data-alan="serbest">
          ${secili ? svg(ICON.tik, 15) : ''} Müşteri bunu seçti</button>
      </div>` : ''}`);
}

/* ---------- 7 · Profesyonel tasarım ----------
   İki sekme. Solda hazır tasarım promptları: her yönün örnek karesi
   (Kütüphane > Tasarımlar'dan yüklenir, bütün projelerde ortak) ve tek
   promptu. Sağda uygulanmış tasarımlar: ChatGPT'ye promptu verip ürettiğin
   görselleri her yön için ayrı ayrı (bir masaüstü, bir mobil) yüklüyorsun,
   müşteri bakıp birini seçiyor. */
let TASARIM_SEKME = 'promptlar';
/* Uygulanmış sekmesinde hangi yöne bakılıyor — seçili yön yoksa ilki. */
let TASARIM_ODAK = null;

function tasarimOdagi(p) {
  const istek = TASARIM_ODAK || (p.palet || {}).secilenYon;
  return TASARIM_YON.find(y => y.anahtar === istek) || TASARIM_YON[0];
}

function tasarimSayfasi(p, d) {
  const pl = p.palet || {};
  const sekme = TASARIM_SEKME === 'uygulanmis' ? 'uygulanmis' : 'promptlar';

  return `<div class="fb-govde">`
    + adimBasligi(p, d, pl.secilenYon ? '1/1' : '0/1')
    + (pl.tasarimTamamlandi
        ? fmTamamBar(p, 'tasarim', 'Müşteri tasarımını seçti.', false) : '')
    + `<div class="tsk">
        <button class="tsk-s ${sekme === 'promptlar' ? 'on' : ''}" type="button"
                data-eylem="tasarim-sekme" data-deger="promptlar">
          ${svg(ICON.dokuman, 16)} Tasarım promptları</button>
        <button class="tsk-s ${sekme === 'uygulanmis' ? 'on' : ''}" type="button"
                data-eylem="tasarim-sekme" data-deger="uygulanmis">
          ${svg(ICON.resim, 16)} Uygulanmış tasarımlar</button>
      </div>`
    + (sekme === 'promptlar' ? tasarimPromptListesi(p) : tasarimUygulanmisEkrani(p))
    + `</div>`;
}

function tasarimPromptListesi(p) {
  const harita = DB.tasarimGorsel || {};
  return `<div class="tp-liste">` + TASARIM_YON.map((y, i) => {
    const resim = harita[y.anahtar] || '';
    return `
      <div class="tp">
        <span class="tp-kare ${resim ? 'var' : ''}" data-eylem="tasarim-yon-ornek"
              data-alan="${esc(y.anahtar)}" role="button" tabindex="0"
              ${resim ? `style="background-image:url('${esc(resim)}')"` : ''}>
          ${resim ? '' : yonOnizlemesi(y)}
        </span>
        <span class="tp-yz">
          <span class="tp-bas"><b>${esc(y.ad)}</b><em class="mono">#${i + 1}</em></span>
          <button class="tp-kop" type="button" data-eylem="tasarim-yon-kopyala"
                  data-proje="${p.id}" data-alan="${esc(y.anahtar)}" data-kip="ayni">
            ${svg(ICON.kopya, 14)} Prompt kopyala</button>
        </span>
        <span class="tp-ok" data-eylem="tasarim-yon-ornek" data-alan="${esc(y.anahtar)}"
              role="button" tabindex="0">${svg(ICON.chevron, 16)}</span>
      </div>`;
  }).join('') + `</div>`;
}

function tasarimUygulanmisEkrani(p) {
  const pl     = p.palet || {};
  const odak   = tasarimOdagi(p);
  const kare   = (DB.tasarimGorsel || {})[odak.anahtar] || '';
  const secili = pl.secilenYon === odak.anahtar;
  const sira   = TASARIM_YON.indexOf(odak);

  /* Her yönün kendi çifti var: bir masaüstü, bir mobil. Yuva adı yönün
     anahtarından türüyor, böylece yönler birbirinin görselini ezmiyor. */
  const kutu = (tur, etiket, ikon) => {
    const no = 'Y_' + odak.anahtar + '_' + tur;
    const resim = gorselAdresi(p, no);
    return `
      <div class="tu-blok">
        <span class="tu-bas">${svg(ikon, 15)} ${esc(etiket)}</span>
        <div class="tu-kutu ${resim ? 'var' : ''} ${tur}"
             ${AUTH.yonetici ? `data-eylem="tasarim-uygulanmis-yukle" data-proje="${p.id}"
               data-alan="${esc(odak.anahtar)}" data-tur="${tur}" role="button" tabindex="0"` : ''}
             ${resim ? `style="background-image:url('${esc(resim)}')"` : ''}>
          ${resim ? '' : `${svg(ICON.folder, 22)}<i>${AUTH.yonetici
            ? 'dokun, görseli yükle' : 'görsel yok'}</i>`}
          ${GORSEL_YUKLENIYOR[p.id] && GORSEL_YUKLENIYOR[p.id].no === no
            ? gorselYuklemeKatmani(p.id) : ''}
        </div>
        ${resim && AUTH.yonetici ? `
          <button class="tu-degis" type="button" data-eylem="tasarim-uygulanmis-yukle"
                  data-proje="${p.id}" data-alan="${esc(odak.anahtar)}" data-tur="${tur}">
            ${svg(ICON.folder, 13)} Değiştir</button>` : ''}
      </div>`;
  };

  /* Seçim yapıldıysa sekmenin en üstünde duruyor: hangi tasarımda
     kaldığını hatırlamak için okları gezdirmek gerekmesin. */
  const secilen = TASARIM_YON.find(y => y.anahtar === pl.secilenYon);
  const secimSeridi = secilen ? `
    <div class="tu-secim">
      <span class="tu-secim-ik">${svg(ICON.tik, 16)}</span>
      <span class="tu-secim-yz">
        <b>Müşteri ${TASARIM_YON.indexOf(secilen) + 1}. tasarımı seçti</b>
        <i>${esc(secilen.ad)}</i>
      </span>
    </div>` : '';

  return secimSeridi + `
    <div class="tu-tepe">
      <button class="tu-ok" type="button" data-eylem="tasarim-odak-git"
              data-proje="${p.id}" data-yon="-1" aria-label="Önceki tasarım">
        ${svg(ICON.chevron, 16)}</button>
      <span class="tu-kare ${kare ? 'var' : ''}"
            ${kare ? `style="background-image:url('${esc(kare)}')"` : ''}>
        ${kare ? '' : yonOnizlemesi(odak)}
      </span>
      <span class="tu-yz"><b>${esc(odak.ad)}</b>
        <i class="mono">${sira + 1} / ${TASARIM_YON.length}</i></span>
      <button class="tu-ok ileri" type="button" data-eylem="tasarim-odak-git"
              data-proje="${p.id}" data-yon="1" aria-label="Sonraki tasarım">
        ${svg(ICON.chevron, 16)}</button>
    </div>
    ${kutu('masa', 'Masaüstü tasarımı', ICON.panel)}
    ${kutu('mobil', 'Mobil tasarım', ICON.telefon)}
    ${AUTH.yonetici ? `
      <button class="sayfa-dug ${secili ? 'ikincil' : 'bitir'}" type="button"
              data-eylem="tasarim-yon-sec" data-proje="${p.id}"
              data-alan="${esc(odak.anahtar)}">
        ${svg(ICON.tik, 15)} ${secili ? 'Seçildi — kaldır' : 'Müşteri bunu seçti'}</button>` : ''}`;
}

/* ---------- Önizleme: seçimlerin bir arada nasıl durduğu ----------
   Sahte bir müşteri uygulaması. Projenin kendi paleti, kendi logosu ve
   yedi biçim kararıyla çiziliyor. Veri uydurma değil, örnek — boş kutulara
   bakıp hayal etmek zor oluyor. */

let ONIZLEME_CIHAZ = 'web';
let ONIZLEME_EKRAN = 'panel';
let ONIZLEME_ADIM  = null;
let ONIZLEME_GENIS = false;
/* Yapı akışı önizlemeyi gerçek modül ve sayfa adlarıyla çizer; tasarım
   akışında boş kalır ve örnek adlar kullanılır. */
let ONIZLEME_MENU  = null;
let ONIZLEME_SAYFA = null;
let ONIZLEME_KUNYE = null;


/* Form alanının türü kutunun görünüşünden anlaşılsın: seçenekte ok,
   tarihte takvim işareti, evet/hayırda anahtar. */
const TUR_SINIF = {
  'Seçenek': 'oa-sec', 'Tarih': 'oa-tarih', 'Tarih-saat': 'oa-tarih',
  'Evet/Hayır': 'oa-anahtar', 'Dosya': 'oa-dosya', 'Para': 'oa-para',
  'Sayı': 'oa-sayi', 'İlişki': 'oa-iliski',
};

/* ---- Künyeden örnek veri ----
   Önizleme kullanıcının kendi alanlarını, kendi seçenek değerlerini ve
   kendi eylemlerini göstermeli. Genel örnek satırlar ("Masa 4 · 1.240,00")
   künye adımında mantıksız duruyordu: sütun adı Durum, içeriği tutar. */

const ORNEK_DEGER = {
  'Metin':      (i, ad) => metinOrnegi(ad)[i % 4],
  'Uzun metin': i => ['Kapıda ödeme', 'Acele', 'Not yok', 'İkinci kat'][i % 4],
  'Sayı':       i => String([12, 3, 24, 7][i % 4]),
  'Para':       i => ['1.240,00', '380,50', '2.190,00', '640,00'][i % 4],
  'Tarih':      i => ['22.05.2025', '21.05.2025', '19.05.2025', '18.05.2025'][i % 4],
  'Tarih-saat': i => ['22.05.2025 · 14:30', '22.05.2025 · 12:05',
                      '21.05.2025 · 19:40', '21.05.2025 · 13:15'][i % 4],
  'Evet/Hayır': i => i % 2 ? '—' : '✓',
  'Dosya':      i => ['fis-1042.pdf', 'foto.jpg', '—', 'irsaliye.pdf'][i % 4],
};

/* Örnek metin alan adına uysun: "İşlem Adı" sütununda kişi adı yazması
   önizlemeyi mantıksız gösteriyordu. */
function metinOrnegi(ad) {
  const x = String(ad || '').toLocaleLowerCase('tr');
  const gecer = (...k) => k.some(y => x.includes(y));
  if (gecer('işlem', 'islem', 'açıklama', 'aciklama', 'konu', 'not'))
    return ['Nakit tahsilat', 'Fatura ödemesi', 'Devir', 'Masraf fişi'];
  if (gecer('müşteri', 'musteri', 'cari', 'kişi', 'kisi', 'personel', 'yetkili',
            'ad', 'isim', 'unvan'))
    return ['Ali Demir', 'Selin Kaya', 'Mehmet Ak', 'Zeynep Er'];
  if (gecer('ürün', 'urun', 'mal', 'stok', 'hizmet'))
    return ['Lahmacun', 'Ayran', 'Baklava', 'Çay'];
  if (gecer('adres', 'şehir', 'sehir', 'il'))
    return ['Gaziantep', 'Ankara', 'İstanbul', 'İzmir'];
  return ['Kayıt 1', 'Kayıt 2', 'Kayıt 3', 'Kayıt 4'];
}

function alanDegeri(a, i) {
  if (a.tur === 'Seçenek') {
    const d = (a.degerler || []).filter(Boolean);
    return d.length ? d[i % d.length] : ['Bekliyor', 'Tamam'][i % 2];
  }
  if (a.tur === 'İlişki') return a.ad + ' ' + [4, 7, 2, 9][i % 4];
  const f = ORNEK_DEGER[a.tur];
  return f ? f(i, a.ad) : a.ad + ' ' + (i + 1);
}

/* "Sipariş Listesi" → "sipariş": düğme yazısı buradan çıkıyor. */
function tekilAd(sayfa) {
  return String(sayfa || 'kayıt')
    .replace(/\s*(listesi|listeleri|oluştur|ekle|detayı|detay|paneli|ekranı)\s*$/i, '')
    .trim().toLocaleLowerCase('tr') || 'kayıt';
}

function kunyeOrneklem(sayfa, k) {
  const alanlar = (k.alanlar || []).filter(a => a && a.ad);
  const bul = (...turler) => alanlar.find(a => turler.includes(a.tur));
  const sol = bul('Metin', 'İlişki') || alanlar[0];
  /* Sağ sütun için sıra önemli: para varsa o, yoksa sayı, sonra seçenek.
     Tek listede aramak "Tarih | Tarih" gibi iki aynı sütun çıkarıyordu. */
  const sag = [bul('Para'), bul('Sayı'), bul('Seçenek'), bul('Tarih', 'Tarih-saat')]
    .find(a => a && a !== sol) || alanlar.filter(a => a !== sol).pop() || sol;
  const alt = alanlar.find(a => a !== sol && a !== sag) || null;

  const satir = [0, 1, 2, 3].map(i => [
    sol ? alanDegeri(sol, i) : 'Kayıt ' + (i + 1),
    alt ? alanDegeri(alt, i) : '',
    sag ? alanDegeri(sag, i) : '',
  ]);

  const para = bul('Para');
  const stat = [
    ['Kayıt', '42'],
    para ? ['Toplam ' + para.ad.toLocaleLowerCase('tr'), '18.400'] : ['Bugün', '9'],
  ];

  const tekil = tekilAd(sayfa);
  return {
    stat, baslik: sayfa,
    sutun: [sol ? sol.ad : 'Kayıt', sag ? sag.ad : ''],
    dugme: ['Yeni ' + tekil, 'Rapor'],
    satir, alanlar,
  };
}

/* Sektöre göre örnek veri. Eşleşme yoksa nötr bir kayıt listesi. */
function orneklem(p) {
  const sk = (p.sektor || '').toLocaleLowerCase('tr');
  const bul = par => par.some(x => sk.includes(x));

  if (bul(['restoran', 'kafe', 'cafe', 'lokanta', 'yeme'])) return {
    stat: [['Bugün', '42'], ['Ciro', '18.400']], baslik: 'Son siparişler',
    sutun: ['Masa', 'Tutar'], dugme: ['Sipariş ekle', 'Rapor'],
    satir: [['Masa 4 · Ali Demir', '12:40 · 6 ürün', '1.240,00'],
            ['Masa 7 · Paket', '12:31 · 2 ürün', '380,50'],
            ['Masa 2 · Selin K.', '12:18 · 9 ürün', '2.190,00'],
            ['Masa 9 · Paket', '12:02 · 3 ürün', '640,00']] };

  if (bul(['inşaat', 'insaat', 'yapı', 'yapi', 'müteahhit'])) return {
    stat: [['Aktif şantiye', '7'], ['Hakediş', '1,2M']], baslik: 'Son hakedişler',
    sutun: ['Şantiye', 'Tutar'], dugme: ['Hakediş ekle', 'Rapor'],
    satir: [['Bahçelievler · No 12', '18 Ağu · onaylandı', '412.000'],
            ['Yenimahalle · No 8', '14 Ağu · beklemede', '186.500'],
            ['Ostim Depo · No 3', '09 Ağu · onaylandı', '298.750'],
            ['Sincan Blok B · No 5', '02 Ağu · onaylandı', '74.200']] };

  if (bul(['market', 'perakende', 'mağaza', 'magaza', 'ticaret', 'toptan'])) return {
    stat: [['Bugün satış', '318'], ['Ciro', '54.900']], baslik: 'Son satışlar',
    sutun: ['Fiş', 'Tutar'], dugme: ['Satış ekle', 'Rapor'],
    satir: [['F-20418 · Kasa 2', '13:04 · 11 kalem', '842,90'],
            ['F-20417 · Kasa 1', '12:58 · 3 kalem', '176,40'],
            ['F-20416 · Kasa 3', '12:51 · 24 kalem', '1.930,00'],
            ['F-20415 · Kasa 1', '12:44 · 6 kalem', '388,25']] };

  if (bul(['otel', 'konaklama', 'pansiyon', 'turizm'])) return {
    stat: [['Dolu oda', '86'], ['Doluluk', '%74']], baslik: 'Bugünkü girişler',
    sutun: ['Oda', 'Tutar'], dugme: ['Rezervasyon', 'Rapor'],
    satir: [['304 · Ali Demir', '3 gece · 2 kişi', '9.600,00'],
            ['211 · Selin Kaya', '1 gece · 1 kişi', '2.400,00'],
            ['518 · M. Yılmaz', '5 gece · 2 kişi', '16.000,00'],
            ['102 · E. Şahin', '2 gece · 3 kişi', '7.200,00']] };

  if (bul(['sağlık', 'saglik', 'klinik', 'hastane', 'diş', 'dis', 'doktor'])) return {
    stat: [['Bugün randevu', '31'], ['Bekleyen', '4']], baslik: 'Bugünkü randevular',
    sutun: ['Hasta', 'Saat'], dugme: ['Randevu ekle', 'Rapor'],
    satir: [['Ali Demir', 'Kontrol · Dr. Kaya', '09:30'],
            ['Selin Kaya', 'İlk muayene · Dr. Ak', '10:15'],
            ['Mehmet Yılmaz', 'Kontrol · Dr. Kaya', '11:00'],
            ['Elif Şahin', 'Dolgu · Dr. Ak', '11:45']] };

  return {
    stat: [['Bu ay', '128'], ['Bekleyen', '9']], baslik: 'Son kayıtlar',
    sutun: ['Kayıt', 'Tutar'], dugme: ['Yeni kayıt', 'Rapor'],
    satir: [['K-1042 · Ali Demir', '18 Ağu · onaylandı', '12.400,00'],
            ['K-1041 · Selin Kaya', '17 Ağu · beklemede', '3.805,00'],
            ['K-1040 · M. Yılmaz', '16 Ağu · onaylandı', '21.900,00'],
            ['K-1039 · Elif Şahin', '15 Ağu · onaylandı', '6.400,00']] };
}

/* Asıl çizim. `pl` dışarıdan geliyor: bir seçeneğe dokunulduğunda kayıt
   beklenmeden yeni palet ile yeniden çiziliyor. */
function onizlemeIc(p, pl) {
  pl = pl || {};

  /* Künye adımındaysak örnek veri kullanıcının kendi künyesinden üretilir. */
  const ky   = ONIZLEME_KUNYE;
  const v    = ky ? kunyeOrneklem(ky.sayfa, ky) : orneklem(p);
  /* Seçilmemiş eylem önizlemede düğme olarak görünmemeli. */
  const eyv  = ad => !ky || (ky.eylemler || []).includes(ad);
  const tel  = ONIZLEME_CIHAZ === 'telefon';
  const ekr  = ONIZLEME_EKRAN;
  /* Hangi adımdayız: o adımın kararı önizlemede öne çıkar, çakışan örtüler
     kapanır. İki örtü aynı anda açılırsa hangi kararı verdiğin kaybolur. */
  const odak = ONIZLEME_ADIM;

  /* Müşteri uygulamaları hep açık tema. */
  const varsayilan = { bg: '#f4f2f0', yuzey: '#ffffff', cizgi: '#e2ddd9',
                       metin: '#1d1a18', metin2: '#5f5852', metin3: '#8d857e' };
  const r = k => pl[k] || varsayilan[k];
  const vurgu = pl.vurgu || (PROJE_RENK[p.renk] || PROJE_RENK.metal)[0];

  /* Görünüşe dair kararlar artık tasarım durağında sorulmuyor — onlara
     ChatGPT'nin tarifi karar veriyor. Önizleme künye ekranında hâlâ
     kullanılıyor; her başlık boş dizi dönüp aşağıdaki varsayılana düşsün. */
  const bic = new Proxy({}, { get: () => [] });

  const koseler = {
    'Keskin': ['0', '0'], 'Hafif': ['6px', '6px'], 'Yuvarlak': ['14px', '12px'],
    'Hap': ['18px', '999px'], 'Kesik': ['0', '0'],
    'Yaprak': ['16px 0 16px 0', '14px 0 14px 0'], 'Kaş': ['14px 14px 0 0', '12px 12px 0 0'],
  }[bic.kose[0]] || ['14px', '12px'];

  const yog = {
    'Sıkışık': ['34px', '10px'], 'Normal': ['44px', '14px'], 'Ferah': ['56px', '20px'],
    'Karma': ['34px', '18px'], 'Nefesli': ['36px', '14px'], 'Kart dizisi': ['44px', '12px'],
  }[bic.yogunluk[0]] || ['44px', '14px'];

  /* ---- Hareket katmanı: durdurulmuş kare olarak gösterilir ---- */
  const hm = bic.hareketMiktari[0];
  const hareketSinif = [
    'oh-' + { 'Yok': 'yok', 'Az': 'az', 'Normal': 'normal', 'Bol': 'bol' }[hm],
    odak === 'dokunma'    ? 'od-' + { 'Yok': 'yok', 'Hafif küçülme': 'kucul',
                              'Dalga': 'dalga', 'Zemin koyulaşır': 'koyu' }[bic.dokunma[0]] : '',
    odak === 'secimVurgu' ? 'sv-' + { 'Yalnız seçili vurgulanır': 'normal',
                              'Ötekiler soluklaşır': 'soluk', 'Ötekiler küçülür': 'kucuk',
                              'Ötekiler bulanıklaşır': 'bulanik' }[bic.secimVurgu[0]] : '',
    odak === 'listeGirisi' ? 'lg-' + { 'Yok': 'yok', 'Sırayla belirme': 'sira',
                              'Aşağıdan kayma': 'kay' }[bic.listeGirisi[0]] : '',
    odak === 'acilma'     ? 'ac-' + { 'Anında': 'yok', 'Yükseklik animasyonu': 'yuk',
                              'Kayarak': 'kay', 'Soluk + kayma': 'soluk' }[bic.acilma[0]] : '',
    odak === 'sayiHareketi' ? 'sy-' + { 'Anında': 'yok', 'Sayarak': 'say',
                              'Kısa parlama': 'parla' }[bic.sayiHareketi[0]] : '',
  ].filter(Boolean).join(' ');

  const bekleyenDugme = odak === 'bekleme' ? bic.bekleme[0] : '';

  const sinif = ['o-app']
    .concat(bic.kart.concat(bic.kartek).map(x => 'ok-' + ({ 'Düz': 'duz', 'Yükseltilmiş': 'yuksek', 'Çizgili': 'cizgi',
      'Buzlu cam': 'cam', 'Şerit vurgu': 'serit', 'Kağıt': 'kagit', 'Oyulmuş': 'oyuk',
      'Işıklı kenar': 'isik', 'Degrade': 'degrade', 'Dokulu': 'doku' }[x])))
    .concat(bic.tablo.concat(bic.tabloek).map(x => 'ot-' + ({ 'Çizgisiz': 'yok', 'Zebra': 'zebra', 'Yatay çizgi': 'yatay',
      'Tam ızgara': 'izgara', 'Kartlı satır': 'kartli', 'Gruplu': 'gruplu',
      'Rakam hizalı': 'rakam', 'Vurgulu sütun': 'vurgulu' }[x])))
    .concat('ocd-' + ({ 'Dolu zemin': 'dolu', 'Buzlu cam': 'cam', 'Çizgiyle ayrık': 'cizgi',
      'Yüzen hap': 'hap', 'Koyu kontrast': 'koyu' }[bic.cubukDoku[0]] || 'dolu'))
    .concat(bic.kose[0] === 'Kesik' ? ['o-kesik'] : [])
    .concat(bic.yogunluk[0] === 'Nefesli' ? ['o-nefesli'] : [])
    .concat('oe-' + ekr)
    .concat(hareketSinif ? hareketSinif.split(' ') : [])
    .concat(ONIZLEME_GENIS ? ['o-genisAdim'] : [])
    .concat(tel ? ['o-tel', 'om-' + ({ 'Karta dönüş': 'kart', 'Yana kaydır': 'kaydir',
      'Sütun gizle': 'gizle', 'Aç-kapa satır': 'ackapa', 'İki satır': 'iki',
      'Tam ekran': 'tam' }[bic.tablomobil[0]])] : ['o-genis-' +
      ({ 'Tam genişlik': 'tam', 'Ortada sınırlı': 'orta', 'Sol hizalı': 'sol' }[bic.genislik[0]])])
    .join(' ');

  /* Düğme: ilk dolu-tipi ana butonu belirler, "Yazı" ikinciyi, "İkonlu" simge ekler. */
  const dg   = bic.dugme.concat(bic.dugmeek);
  const ana  = ['Dolu', 'Gölgeli', 'Degrade', 'Çizgili', 'Yumuşak'].find(x => dg.includes(x)) || 'Dolu';
  const anaS = { 'Dolu': 'od-dolu', 'Gölgeli': 'od-golge', 'Degrade': 'od-degrade',
                 'Çizgili': 'od-cizgi', 'Yumuşak': 'od-yumusak' }[ana];
  const ikinci = dg.includes('Yazı') ? 'od-yazi' : 'od-ikincil';
  const tik = dg.includes('İkonlu')
    ? '<svg viewBox="0 0 24 24" class="od-ik"><path d="M12 5v14M5 12h14"/></svg>' : '';
  const anaDugme = (yazi) => {
    if (bekleyenDugme === 'Düğmede dönen halka')
      return `<span class="o-dg ${anaS} bekliyor"><em class="o-halka"></em></span>`;
    if (bekleyenDugme === 'Yazı değişir')
      return `<span class="o-dg ${anaS} bekliyor">${esc(yazi)}iliyor…</span>`;
    return `<span class="o-dg ${anaS}">${tik}${esc(yazi)}</span>`;
  };

  /* Simge: biçim ilk seçenekten, "Zeminli" üstüne biner. */
  const smAd = ['Çizgi', 'Dolu', 'İki katman', 'Kalın çizgi', 'Elle çizim']
    .find(x => bic.simge.includes(x)) || 'Çizgi';
  const smS = 'os-' + { 'Çizgi': 'cizgi', 'Dolu': 'dolu', 'İki katman': 'katman',
                        'Kalın çizgi': 'kalin', 'Elle çizim': 'elle' }[smAd]
            + (bic.simge.includes('Zeminli') ? ' os-zemin' : '');
  const YOL = {
    ev:  ['<path d="M3 10.5 12 4l9 6.5V20a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1z"/>',
          '<path d="M3 10.5 12 4l9 6.5V20a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1z"/>'],
    ara: ['<circle cx="11" cy="11" r="6.4"/><path d="M16 16l4.5 4.5"/>',
          '<path fill-rule="evenodd" d="M11 3.6a7.4 7.4 0 1 0 4.3 13.4l3.4 3.4a1.5 1.5 0 0 0 2.1-2.1l-3.4-3.4A7.4 7.4 0 0 0 11 3.6zm0 3a4.4 4.4 0 1 1 0 8.8 4.4 4.4 0 0 1 0-8.8z"/>'],
    kisi:['<circle cx="12" cy="8" r="3.5"/><path d="M4.5 20c1-4 4-5.6 7.5-5.6S18.5 16 19.5 20"/>',
          '<circle cx="12" cy="8" r="4"/><path d="M4 20.6c.8-4.5 4-6.4 8-6.4s7.2 1.9 8 6.4z"/>'],
    ayar:['<circle cx="12" cy="12" r="3"/><path d="M12 3v3M12 18v3M3 12h3M18 12h3"/>',
          '<circle cx="12" cy="12" r="4"/><path d="M12 2h0M12 22h0"/>'],
  };
  const ik = ad => `<svg viewBox="0 0 24 24">${YOL[ad][smAd === 'Dolu' ? 1 : 0]}</svg>`;

  const adres = DB.logoAdres[p.id];

  /* Logo görünümü kararı: kutulu mu, zeminsiz mi, adı yanında mı. */
  const logoBic  = bic.logo[0];
  const logoAcik = logoBic !== 'Kutu içinde';
  const logoAdli = logoBic === 'Zeminsiz, altında ad';
  const logoYan  = logoBic === 'Yanında ad';
  const logoIsik = logoAdli ? `<i class="o-isik" style="background:linear-gradient(90deg,transparent,${
    esc(vurgu)},transparent)"></i>` : '';

  const logoIc = (ek) => adres
    ? `<span class="o-logo ${ek} ${logoAcik ? 'acik' : 'dolu'}" data-logo="${esc(adres)}"></span>`
    : `<span class="o-logo ${ek} ${logoAcik ? 'acik' : ''}" style="${logoAcik ? `color:${esc(vurgu)}`
        : `background:linear-gradient(160deg,${esc(vurgu)},${esc(saydam(vurgu, .55))})`}">${
        esc(basHarf(p.firma))}</span>`;

  const logo = logoYan
    ? `<span class="o-markaYan">${logoIc('')}<b>${esc(p.firma)}</b></span>`
    : logoIc('');

  /* ---- Üst çubuk ---- */
  const ekranAdi = { panel: 'Panel', liste: v.baslik, form: v.dugme[0],
                     ayarlar: 'Ayarlar', bos: v.baslik, yukleme: v.baslik,
                     sayfalar: 'Modül', detay: v.satir[0][0], yogunluk: 'Panel',
                     ice: 'İçe aktar', hata: v.baslik }[ekr] || 'Panel';
  const menuAdlari = (ONIZLEME_MENU && ONIZLEME_MENU.length
    ? ONIZLEME_MENU : ['Panel', 'Kayıt', 'Rapor', 'Ayar']).slice(0, 5);
  const ucSec = bic.ustcubuk[0];
  const menuli = bic.gezinme[0] === 'Açılır yan menü';
  const yatayMenu = bic.gezinme[0] === 'Üst menü';
  const ustCubuk = ucSec === 'Yok' ? '' : `
    <div class="o-ust">
      ${menuli ? '<span class="o-ham"></span>' : logo}
      <b>${esc(ekranAdi)}${
        ekr === 'liste' && bic.donem[0] === 'Başlıkta açılır' ? ' <u class="o-ok">Ağustos ▾</u>' : ''}</b>
      ${ucSec === 'Logo + arama' ? '<span class="o-ustAra">Ara…</span>' : ''}
      ${yatayMenu ? `<span class="o-yatay">${menuAdlari.slice(0, 3).map((x, i) =>
        `<i class="${i ? '' : 'a'}">${x}</i>`).join('')}</span>` : ''}
      ${bic.destek[0] === 'Üst çubukta' ? '<span class="o-soru">?</span>' : ''}
      ${bic.guncelleme[0] === 'Üstte rozet' ? '<span class="o-nokta"></span>' : ''}
      ${ucSec === 'Eylemli' || (ekr === 'liste' && bic.anaeylem[0] === 'Sağ üstte')
        ? `<span class="o-ustDug ${anaS}">${esc(v.dugme[0])}</span>`
        : `<span class="o-ik ${smS}">${odak === 'simge' ? ik('ev') + ik('kisi') : ''}${ik('ara')}</span>`}
      ${kullaniciCipi(bic, tel)}
    </div>
    ${ucSec === 'Sekmeli' ? `<div class="o-sekme">${['Tümü', 'Bekleyen', 'Kapalı']
        .map((x, i) => `<i class="${i ? '' : 'a'}">${x}</i>`).join('')}</div>` : ''}`;

  /* ---- Kullanıcı: üst çubuğun sağ ucu ---- */
  function kullaniciCipi(bic, dar) {
    const k = bic.kullanicimenu[0];
    if (k === 'Ayarlar içinde') return '';
    if (k === 'Yan menü altında') return '';
    if (k === 'Sağ üstte avatar' || dar) return '<span class="o-av"></span>';
    return '<span class="o-kcip"><em></em><i>Kerem G.<u>Yönetici</u></i></span>';
  }

  /* ---- Gezinme ---- */
  const gz = bic.gezinme[0];
  const ortaArti = gz === 'Alt + orta +'
    || (ekr === 'liste' && bic.anaeylem[0] === 'Alt çubukta orta');
  const altSekme = ['Alt sekme', 'Alt + orta +'].includes(gz) || ortaArti;
  /* Kendi adımındayken kararın yeri görünür olsun: yan menüde duran kullanıcı
     satırı ancak yan menü açıkken görülür. */
  const yanMenu  = gz === 'Sabit yan menü'
    || (odak === 'kullanicimenu' && bic.kullanicimenu[0] === 'Yan menü altında');
  const gezinme = !altSekme ? '' : `
    <div class="o-nav${ortaArti ? ' arti' : ''}">
      ${menuAdlari.map((x, i) =>
        `<span class="${i ? '' : 'a'}">${esc(x)}</span>`).join('')}
      ${ortaArti ? '<em></em>' : ''}
    </div>`;

  /* ---- Ekran gövdeleri ---- */
  const kart = (ic, ek = '') => `<div class="o-kutu ${ek}">${ic}</div>`;
  const sy = bic.sayacduzen[0];
  const uc = v.stat.concat([['Bekleyen', '9']]).slice(0, 3);
  const statlar =
      sy === "3'lü ızgara" ? `<div class="o-ucKart">${uc.map(x =>
          kart(`<i>${esc(x[0])}</i><b>${esc(x[1])}</b>`, 'o-stat')).join('')}</div>`
    : sy === 'Yatay şerit' ? `<div class="o-serit">${uc.concat([['Ortalama', '480']]).map(x =>
          kart(`<i>${esc(x[0])}</i><b>${esc(x[1])}</b>`, 'o-stat')).join('')}</div>`
    : sy === 'Dikey liste' ? `<div class="o-kutu o-tbl dikeySayac">${uc.map(x =>
          `<div class="o-r"><span>${esc(x[0])}</span><u>${esc(x[1])}</u></div>`).join('')}</div>`
    : `<div class="o-ikili">${v.stat.map(x =>
          kart(`<i>${esc(x[0])}</i><b>${esc(x[1])}</b>`, 'o-stat')).join('')}</div>`;

  const vk = bic.vurgukart[0];
  const vurguKarti =
      vk === 'Degrade hero' ? `<div class="o-hero"><i>${esc(v.stat[1][0])}</i><b>${esc(v.stat[1][1])}</b></div>`
    : vk === 'Sade başlık'  ? `<div class="o-sadeBaslik">${esc(v.baslik)}</div>`
    : vk === 'Şeritli'      ? kart(`<i>${esc(v.stat[0][0])}</i><b>${esc(v.stat[0][1])}</b>`, 'o-stat o-ustSerit')
    : '';

  /* Kalıplar önizlemeye yansır: seçtiğin yapı tabloda görünmezse kalıbı
     seçmenin ne yaptığı anlaşılmıyor. */
  const kal   = (ky && ky.kalip) || [];
  const kalVar = a => kal.includes(a);
  const bakiyeli = kalVar('bakiye') || kalVar('stok');
  const bakAd = kalVar('stok') ? 'Kalan' : 'Bakiye';
  const bakDeger = ['18.400', '18.020', '15.830', '15.190'];

  const tabloKutusu = (satirSayi = 4) => {
    const kartaDonus = tel && ['Karta dönüş', 'Tam ekran'].includes(bic.tablomobil[0]);
    if (kartaDonus) return `<div class="o-kartlar">${v.satir.slice(0, 3).map(x =>
      kart(`<div class="o-kk-ust"><b>${esc(x[0])}</b><u>${esc(x[2])}</u></div><i>${esc(x[1])}</i>`, 'o-kk')
    ).join('')}</div>`;
    const kaydir = odak === 'onaysil' && eyv('Sil') && bic.onaysil[0] === 'Kaydırarak sil';
    const ackapa = tel && bic.tablomobil[0] === 'Aç-kapa satır';
    /* Ağaç kalıbı: ana kayıt açılır, altındakiler girintili. */
    const agacli = kalVar('agac');
    const tarihli = kalVar('takvim');

    return `<div class="o-kutu o-tbl${bakiyeli ? ' o-bakiyeli' : ''}">
      <div class="o-r o-h"><span>${esc(v.sutun[0])}</span>
        ${bakiyeli ? `<em>${esc(bakAd)}</em>` : ''}<u>${esc(v.sutun[1])}</u></div>
      ${v.satir.slice(0, satirSayi).map((x, i) => `
        ${tarihli && i % 2 === 0
          ? `<div class="o-grupBas ic">${esc(['22 Mayıs', '21 Mayıs'][i / 2] || '20 Mayıs')}</div>`
          : ''}
        <div class="o-r${kaydir && i === 1 ? ' kaydirildi' : ''}${
          agacli ? (i % 2 ? ' o-alt' : ' o-ana') : ''}"><span>${
          agacli ? `<i class="o-chev">${i % 2 ? '' : '›'}</i>` : ''}${esc(x[0])}${
          tel && bic.tablomobil[0] === 'İki satır' ? `<i>${esc(x[1])}</i>` : ''
        }</span>${bakiyeli ? `<em>${esc(bakDeger[i] || '—')}</em>` : ''
        }<u>${esc(x[2])}</u>${kaydir && i === 1 ? '<b class="o-sil">Sil</b>' : ''}</div>
        ${kalVar('bacak') && i === 0 ? `<div class="o-bacak">${
          ['100 Kasa', '320 Tedarikçi', '760 Gider'].map(y =>
            `<span>${y}</span>`).join('')}</div>` : ''}
        ${kalVar('satir') && i === 0 ? `<div class="o-satirlar">${
          [['Lahmacun', '2 × 90,00'], ['Ayran', '3 × 25,00']].map(y =>
            `<i><b>${y[0]}</b><u>${y[1]}</u></i>`).join('')}</div>` : ''}
        ${ackapa && i === 0 ? `<div class="o-acilan"><i>Tarih<u>18 Ağu</u></i>
          <i>Durum<u>Onaylı</u></i><i>Not<u>—</u></i></div>` : ''}`).join('')}
    </div>`;
  };

  /* Durum akışı ve bağlama göre sütun: tablonun üstünde şerit olarak. */
  const kalipSeridi = (() => {
    const p2 = [];
    if (kalVar('akis')) {
      const ad = ((ky.kalipCevap || {})['akis.adimlar'] || []).filter(Boolean);
      const liste = ad.length ? ad : ['Talep', 'Onay', 'Teslim'];
      p2.push(`<div class="o-akisSerit">${liste.slice(0, 4).map((x, i) =>
        `<span class="${i ? '' : 'a'}">${esc(x)}</span>`).join('<em>›</em>')}</div>`);
    }
    if (kalVar('sutun')) {
      const st = setListesi((ky.kalipCevap || {})['sutun.setler'])
        .map(x => x.ad).filter(Boolean);
      const liste = st.length ? ['Varsayılan'].concat(st) : ['Varsayılan', '320', '108'];
      p2.push(`<div class="o-sekme ic">${liste.slice(0, 4).map((x, i) =>
        `<i class="${i ? '' : 'a'}">${esc(x)}</i>`).join('')}</div>`);
    }
    return p2.join('');
  })();

  const ar = eyv('Ara') ? bic.arama[0] : '';
  const aramaSatiri =
      ar === 'Üstte sabit'     ? `<div class="o-arama"><span>Ara…</span>${
                                    bic.filtre[0] === 'Açılır panel' ? '<em>Filtre ▾</em>' : ''}</div>`
    : ar === 'Simgeden açılan' ? `<div class="o-arama acik"><u>‹</u><span>mas|</span><em>✕</em></div>`
    : ar === 'Ayrı sayfa'      ? `<div class="o-arama ayri"><span>Tüm modüllerde ara…</span></div>
                                  <div class="o-tblbas">Sonuçlar</div>`
    : '';
  const fl = (odak === 'onaysil' || !eyv('Filtrele')) ? '' : bic.filtre[0];
  /* "Filtre içinde" seçilince filtre satırına tarih aralığı çipi eklenir. */
  const donemCipi = bic.donem[0] === 'Filtre içinde'
    ? '<span class="o-tarihCip">01 – 31 Ağu</span>' : '';

  const cipler = fl === 'Üstte çip sırası'
    ? `<div class="o-cip">${donemCipi}${['Tümü', 'Bugün', 'Bu ay'].map((x, i) =>
        `<span class="${i ? '' : 'a'}">${x}</span>`).join('')}</div>`
    : donemCipi ? `<div class="o-cip">${donemCipi}</div>` : '';
  /* Filtre başlıkları künyedeki alanlardan: "Durum · Tarih · Tutar" her
     projede doğru olmuyor. */
  const filtreAdlari = ky && ky.alanlar && ky.alanlar.length
    ? ky.alanlar.slice(0, 3).map(a => a.ad) : ['Durum', 'Tarih', 'Tutar'];
  const filtrePanel =
      fl === 'Açılır panel' ? `<div class="o-inpanel">${filtreAdlari.map(x =>
          `<i>${x}<u>▾</u></i>`).join('')}<span class="o-dg ${anaS} kucuk">Uygula</span></div>`
    : fl === 'Alttan sayfa' ? `<div class="o-perde"></div><div class="o-altSayfa">
          <b>Filtreler</b>${filtreAdlari.map(x =>
          `<i>${x}<u>▾</u></i>`).join('')}<span class="o-dg ${anaS} kucuk">Uygula</span></div>`
    : '';

  const listeSonu = {
    'Sayfa numarası':     `<div class="o-sayfano">${[1, 2, 3].map((n, i) =>
                            `<span class="${i ? '' : 'a'}">${n}</span>`).join('')}</div>`,
    'Daha fazla düğmesi': `<div class="o-dugmeler tek"><span class="o-dg ${ikinci} tam">Daha fazla</span></div>`,
    'Sonsuz kaydırma':    '<div class="o-sonsuz"><i></i></div>',
  }[bic.listesonu[0]] || '';

  const dn = bic.donem[0];
  const donemSatiri =
      dn === 'Üstte ay çubuğu' ? `<div class="o-ay"><u>‹</u><b>Ağustos<i>2026</i></b><u>›</u></div>`
    : '';

  const gc2 = bic.gecis[0];
  const gecisKatmani = (ekr === 'liste' && odak === 'gecis' && gc2 !== 'Yok')
    ? `<div class="o-gecis ${{ 'Soluk': 'soluk', 'Sağdan kayma': 'sag',
        'Yukarı kayma': 'yukari' }[gc2]}"></div>` : '';

  const listeGovde = `
    ${donemSatiri}
    ${filtrePanel}
    ${bic.tablosayfa.includes('Özet kartları') ? statlar : ''}
    ${bic.tablosayfa.includes('Sekmeli liste') ? `<div class="o-sekme ic">${
      ['Bekleyen', 'Onaylı', 'Kapalı'].map((x, i) => `<i class="${i ? '' : 'a'}">${x}</i>`).join('')}</div>` : ''}
    ${aramaSatiri}${cipler}${kalipSeridi}
    <div class="o-tblbas">${esc(v.baslik)}</div>
    <div class="o-ikiBolme">
      ${bic.tablosayfa.includes('Solda filtre') || bic.filtre[0] === 'Yan panel'
        ? `<div class="o-yanFiltre">${['Durum', 'Tarih', 'Tutar'].map(x =>
            `<i>${x}</i>`).join('')}</div>` : ''}
      <div class="o-akan">${tabloKutusu()}${listeSonu}</div>
      ${bic.tablosayfa.includes('Sağda detay')
        ? `<div class="o-detayBolme">${kart(
            `<b>${esc(v.satir[0][0])}</b><i>${esc(v.satir[0][1])}</i><u>${esc(v.satir[0][2])}</u>`, 'o-dk')}</div>` : ''}
    </div>`;

  const ayarIpucu =
      (odak === 'kullanicimenu' && bic.kullanicimenu[0] === 'Ayarlar içinde')
        ? `<div class="o-kutu o-tbl ipucuKutu"><div class="o-r"><span>Hesabım</span><u>Kerem G.</u></div>
           <div class="o-r"><span>Çıkış yap</span><u>›</u></div></div>`
    : (odak === 'destek' && bic.destek[0] === 'Ayarlar içinde')
        ? `<div class="o-kutu o-tbl ipucuKutu"><div class="o-r"><span>İstek ve öneri</span><u>›</u></div>
           <div class="o-r"><span>Yardım</span><u>›</u></div></div>`
    : '';

  /* Genişlik adımında uygulama tam genişlik çizilir; küçültülürse
     "tam genişlik" ile "ortada sınırlı" arasındaki fark kaybolur. */
  /* Parantez şart: `a + b + {…}[k] || varsayilan` toplamı önce yapar ve
     anahtar bulunamayınca "undefined" metnini üretip varsayılana hiç
     düşmez. Kararların çoğu kalkınca bu tuzak ortaya çıktı. */
  const panelGovde = vurguKarti + ayarIpucu + ({
    'Sayaç + büyük grafik': statlar + kart('<span class="o-grafik"></span>', 'o-buyuk'),
    '2×2 ızgara': `<div class="o-izgara ${sy === "3'lü ızgara" ? 'uc' : ''}">${
      ['Sipariş', 'Ciro', 'Ürün', 'İptal'].slice(0, sy === "3'lü ızgara" ? 3 : 4).map((x, i) =>
      kart(`<i>${x}</i><b>${['42', '18.400', '316', '3'][i]}</b>`, 'o-stat')).join('')}</div>`,
    'Sol büyük + sağ kolon': `<div class="o-ikiBolme">
      <div class="o-akan">${kart('<span class="o-grafik"></span>', 'o-buyuk')}</div>
      <div class="o-sagKolon ${sy === 'Dikey liste' ? 'dikey' : ''}">${uc.slice(0, 2).map(x =>
        kart(`<i>${esc(x[0])}</i><b>${esc(x[1])}</b>`, 'o-stat')).join('')}</div></div>`,
    'Sayaç + son hareketler': statlar
      + `<div class="o-tblbas">${esc(v.baslik)}</div>` + tabloKutusu(),
  }[bic.dashboard[0]] || statlar);

  const formAlan = (etiket, boy = '', tur = '', zorunlu = false) =>
    `<label class="o-alan"><i>${esc(etiket)}${zorunlu ? '<em>*</em>' : ''}</i>
       <span class="${TUR_SINIF[tur] || ''}" style="${boy}"></span></label>`;
  /* Form alanları künyeden: adı, türü ve zorunluluğu ile. */
  const kyAlan = (a) => formAlan(a.ad.toLocaleUpperCase('tr'),
    a.tur === 'Uzun metin' ? 'height:34px' : '', a.tur, a.zorunlu);
  const formIcKisa = () => ky && v.alanlar && v.alanlar.length
    ? v.alanlar.slice(0, 2).map(kyAlan).join('')
    : `${formAlan('AD')}${formAlan('TUTAR')}`;
  const formIc = ky && v.alanlar && v.alanlar.length
    ? v.alanlar.slice(0, 4).map(kyAlan).join('')
    : `${formAlan(v.sutun[0].toLocaleUpperCase('tr'))}
       ${formAlan('TARİH')}${formAlan('NOT', 'height:34px')}`;
  const formDugmeleri = `<div class="o-dugmeler">${anaDugme('Kaydet')}
    <span class="o-dg ${ikinci}">Vazgeç</span></div>`;

  const isn = bic.islemsonuc[0];
  const beklemeCubugu = bekleyenDugme === 'Üstte ince çubuk'
    ? '<div class="o-ilerleme ust belirsiz"><i></i></div>' : '';
  const sonucKatmani = ekr !== 'form' ? '' :
      isn === 'Tik animasyonu'  ? '<div class="o-perde"></div><div class="o-tikKutu"><span></span></div>'
    : isn === 'İlerleme çubuğu' ? '<div class="o-ilerleme ust"><i></i></div>'
    : isn === 'Sonuç ekranı'    ? ''
    : odak === 'islemsonuc'     ? '<div class="o-toast alt">Kaydedildi</div>' : '';

  const vg = bic.verigirisi;
  /* "Sonuç ekranı" formun yerine geçer: tam sayfa "gönderildi". */
  const formGovde = (ekr === 'form' && bic.islemsonuc[0] === 'Sonuç ekranı' && odak === 'islemsonuc')
    ? `<div class="o-bos genis"><span class="o-tikBuyuk"></span>
        <b>Kaydedildi</b><i>${esc(v.dugme[0])} işlemi tamamlandı.</i>
        <div class="o-dugmeler">${anaDugme('Listeye dön')}
          <span class="o-dg ${ikinci}">Yeni ekle</span></div></div>`
    :
    vg.includes('Sağdan çekmece') ? `<div class="o-arka">${tabloKutusu(3)}</div>
        <div class="o-cekmece${tel ? ' alttan' : ''}">
          <div class="o-cekBas"><b>${esc(v.dugme[0])}</b><u>✕</u></div>
          ${formIc}${formDugmeleri}</div>`
    : vg.includes('Ortada pencere') ? `<div class="o-arka">${tabloKutusu(3)}</div>
        <div class="o-perde"></div><div class="o-pencere">
          <div class="o-cekBas"><b>${esc(v.dugme[0])}</b><u>✕</u></div>
          ${formIc}${formDugmeleri}</div>`
    : vg.includes('Satırda düzenleme') ? `${tabloKutusu(4)}
        <div class="o-ipucu">Hücreye dokunup yerinde değiştirirsin</div>`
    : vg.includes('Adım adım sihirbaz') ? `<div class="o-adim">${[1, 2, 3, 4].map((n, i) =>
          `<i class="${i < 2 ? 'a' : ''}"></i>`).join('')}</div>
        <div class="o-tblbas">Adım 2 · Bilgiler</div>${formIc}${formDugmeleri}`
    : `${formIc}${formDugmeleri}`;

  const ayarSatir = (ad, deger) => `<div class="o-r"><span>${ad}</span><u>${deger}</u></div>`;
  const ayarListe = `<div class="o-kutu o-tbl">
    ${ayarSatir('Dil', 'Türkçe')}${ayarSatir('Para birimi', '₺ TRY')}
    ${ayarSatir('Bildirimler', 'Açık')}${ayarSatir('Yedekleme', 'Günlük')}</div>`;
  const destekSatiri = bic.destek[0] === 'Ayarlar içinde' ? ayarSatir('İstek ve öneri', '›') : '';
  const hesapSatiri = bic.kullanicimenu[0] === 'Ayarlar içinde' ? ayarSatir('Hesabım', 'Kerem G.') : '';
  const gc = bic.guncelleme[0];
  const yd = bic.yedek[0];
  const sistemBolumu = (gc === 'Yok' && yd === 'Yok') ? '' : `
    <div class="o-grupBas">Sistem</div>
    ${gc === 'Sürüm ekranı' ? `<div class="o-kutu o-tbl">${ayarSatir('Güncelleme', 'Sürüm 2026.14 ›')}</div>`
      : gc === 'Güncelle düğmesi' ? `<div class="o-kutu o-guncelle">
          <span class="o-dg ${anaS} tam">Uygulamayı güncelle</span><i>Sürüm 2026.14</i></div>`
      : gc === 'Üstte rozet' ? `<div class="o-kutu o-tbl">${ayarSatir('Sürüm', '2026.14')}</div>` : ''}
    ${yd === 'Yok' ? '' : `<div class="o-kutu o-tbl">
      ${ayarSatir('Yedek al', '›')}${ayarSatir('Yedeği yükle', '›')}
      ${yd === 'Yedek + değişiklik kaydı' ? ayarSatir('Değişiklik kaydı', '›') : ''}</div>`}`;

  const acikBolum = odak === 'acilma' && bic.acilma[0] !== 'Anında'
    ? `<div class="o-katlanir"><i class="acik">Bildirim ayarları<u>▾</u></i>
        <span class="o-katIc">${ayarSatir('E-posta', 'Açık')}${ayarSatir('Anlık', 'Kapalı')}</span>
        <i>Güvenlik<u>›</u></i></div>` : '';

  const ayarGrup = acikBolum + `
    <div class="o-grupBas">Genel</div>
    <div class="o-kutu o-tbl">${ayarSatir('Dil', 'Türkçe')}${ayarSatir('Para birimi', '₺ TRY')}</div>
    <div class="o-grupBas">Bildirim</div>
    <div class="o-kutu o-tbl">${ayarSatir('E-posta', 'Açık')}${destekSatiri}${hesapSatiri}</div>
    ${sistemBolumu}`;
  const ayarGovde = {
    'Tek liste':     ayarListe,
    'Gruplu liste':  ayarGrup,
    'Sol sekmeli':   `<div class="o-ikiBolme"><div class="o-yanFiltre">${
      ['Genel', 'Bildirim', 'Güvenlik'].map((x, i) => `<i class="${i ? '' : 'a'}">${x}</i>`).join('')
      }</div><div class="o-akan">${ayarListe}</div></div>`,
    'Arama + gruplu': `<div class="o-arama"><span>Ayarlarda ara…</span></div>${ayarGrup}`,
  }[bic.ayarlar[0]] || ayarGrup;

  const bosGovde = {
    'Sade yazı':            '<div class="o-bos"><i>Henüz kayıt yok.</i></div>',
    'Simge + yazı':         `<div class="o-bos"><span class="o-bosSimge ${smS}">${ik('ev')}</span>
                              <i>Henüz kayıt yok.</i></div>`,
    'Simge + yazı + düğme': `<div class="o-bos"><span class="o-bosSimge ${smS}">${ik('ev')}</span>
                              <i>İlk kaydını ekle, buradan takip et.</i>${anaDugme(v.dugme[0])}</div>`,
    'Çizim':                `<div class="o-bos"><span class="o-bosCizim"></span>
                              <i>Burası şimdilik boş.</i></div>`,
  }[bic.bosdurum[0]] || '';

  const yuklemeGovde = {
    'Dönen çark':      '<div class="o-bos"><span class="o-cark"></span></div>',
    'İskelet':         `<div class="o-iskelet">${'<i></i>'.repeat(5)}</div>`,
    'İlerleme çubuğu': `<div class="o-ilerleme"><i></i></div>${tabloKutusu(3)}`,
  }[bic.yukleme[0]] || '';

  /* Sayfa listesi */
  const sayfaAdlari = (ONIZLEME_SAYFA && ONIZLEME_SAYFA.length ? ONIZLEME_SAYFA
    : ['Siparişler', 'Ürünler', 'Masalar', 'Raporlar']).slice(0, 4);
  const sayfaGovde = {
    'Yan liste': `<div class="o-ikiBolme"><div class="o-yanFiltre">${
        sayfaAdlari.map((x, i) => `<i class="${i ? '' : 'a'}">${x}</i>`).join('')
      }</div><div class="o-akan">${tabloKutusu(3)}</div></div>`,
    'Üst sekme': `<div class="o-sekme ic">${sayfaAdlari.slice(0, 3).map((x, i) =>
        `<i class="${i ? '' : 'a'}">${x}</i>`).join('')}</div>${tabloKutusu(3)}`,
    'Açılır seçici': `<div class="o-secici"><b>${sayfaAdlari[0]}</b><u>▾</u></div>
      <div class="o-acilanListe">${sayfaAdlari.slice(1).map(x => `<i>${x}</i>`).join('')}</div>
      ${tabloKutusu(2)}`,
    'Kart ızgarası': `<div class="o-izgara">${sayfaAdlari.map(x =>
        kart(`<span class="o-mIk ${smS}">${ik('ev')}</span><i>${x}</i>`, 'o-modul')).join('')}</div>`,
  }[bic.sayfalistesi[0]] || '';

  /* Detay ekranı */
  const yi = bic.yoliz[0];
  const yolIzi =
      yi === 'Üstte metin' ? `<div class="o-yol">${esc(v.baslik)} › ${esc(v.satir[0][0])}</div>`
    : yi === 'Geri oku + başlık' ? `<div class="o-geriBas"><u>‹</u><b>${esc(v.satir[0][0])}</b></div>`
    : yi === 'Sekmeyle' ? `<div class="o-sekme ic">${['Bilgi', 'Hareket', 'Belge'].map((x, i) =>
        `<i class="${i ? '' : 'a'}">${x}</i>`).join('')}</div>` : '';

  const kunye = `<b>${esc(v.satir[0][0])}</b><i>${esc(v.satir[0][1])}</i><u>${esc(v.satir[0][2])}</u>`;
  /* Detayda kaydın bütün alanları: künye varsa etiket-değer olarak. */
  const detayAlanlari = ky && v.alanlar && v.alanlar.length
    ? `<div class="o-kutu o-tbl">${v.alanlar.slice(0, 5).map((a, i) =>
        `<div class="o-r"><span>${esc(a.ad)}</span><u>${esc(alanDegeri(a, 0))}</u></div>`).join('')}</div>`
    : '';
  const detayGovde = yolIzi + ({
    'Sekmeli': `<div class="o-sekme ic">${['Bilgi', 'Hareket', 'Belge'].map((x, i) =>
        `<i class="${i ? '' : 'a'}">${x}</i>`).join('')}</div>${kart(kunye, 'o-dk')}${
          detayAlanlari || formIcKisa()}`,
    'Tek uzun akış': kart(kunye, 'o-dk') + detayAlanlari + `<div class="o-tblbas">Hareketler</div>`
        + tabloKutusu(2) + `<div class="o-tblbas">Belgeler</div>` + tabloKutusu(2),
    'Sol özet + sağ içerik': `<div class="o-ikiBolme">
        <div class="o-ozetBolme">${kart(kunye, 'o-dk')}</div>
        <div class="o-akan">${tabloKutusu(3)}</div></div>`,
    'Katlanır bölümler': kart(kunye, 'o-dk')
        + `<div class="o-katlanir"><i class="acik">Bilgiler<u>▾</u></i>
             <span class="o-katIc">${formIcKisa()}</span>
             <i>Hareketler<u>›</u></i><i>Belgeler<u>›</u></i></div>`,
  }[bic.detay[0]] || '');

  /* Yoğunluk: liste ve form aynı karede — "Karma" ancak böyle görünür. */
  const yogGovde = `
    <div class="o-tblbas">Liste</div>${tabloKutusu(3)}
    <div class="o-tblbas ${bic.yogunluk[0] === 'Karma' ? 'ferah' : ''}">Form</div>
    <div class="o-formKutu ${bic.yogunluk[0] === 'Karma' ? 'ferah' : ''}">${formIcKisa()}</div>`;

  /* Açılış ekranı */
  const ac = bic.acilis[0];
  const acilisGovde = ac === 'Yok'
    ? `<div class="o-bos"><i>Açılış ekranı yok — uygulama doğrudan gelir.</i></div>`
    : `<div class="o-acilis${logoYan ? ' yan' : ''}">
        ${adres ? `<span class="o-aLogo ${logoAcik ? 'acik' : 'dolu'}" data-logo="${esc(adres)}"></span>`
                : `<span class="o-aLogo ${logoAcik ? 'acik' : ''}" style="${logoAcik ? `color:${esc(vurgu)}`
                    : `background:linear-gradient(160deg,${esc(vurgu)},${esc(saydam(vurgu, .55))})`}">${
                    esc(basHarf(p.firma))}</span>`}
        ${logoIsik}
        ${logoBic === 'Zeminsiz' ? '' : `<b>${esc(p.firma)}</b>`}
        ${ac !== 'Logo' ? '<div class="o-aCubuk"><i></i></div>' : ''}
        ${ac === 'Logo + yüzde + mesaj' ? '<u>%64 · Veriler alınıyor…</u>' : ''}
      </div>`;

  /* Giriş ekranı */
  const gr = bic.giris[0];
  const girisAlan = `${formAlan('E-POSTA')}${formAlan('ŞİFRE')}`;
  const girisIc = `${girisAlan}<div class="o-dugmeler tek">${anaDugme('Giriş yap')}</div>`;
  const girisMarka = `${adres
      ? `<span class="o-aLogo kucuk ${logoAcik ? 'acik' : 'dolu'}" data-logo="${esc(adres)}"></span>`
      : `<span class="o-aLogo kucuk ${logoAcik ? 'acik' : ''}" style="${logoAcik ? `color:${esc(vurgu)}`
          : `background:linear-gradient(160deg,${esc(vurgu)},${esc(saydam(vurgu, .55))})`}">${
          esc(basHarf(p.firma))}</span>`}
    ${logoIsik}
    ${logoBic === 'Zeminsiz' ? '' : `<b>${esc(p.firma)}</b>`}`;
  const girisGovde = {
    'Ortada kart': `<div class="o-girisOrta">${kart(
        `<div class="o-gMarka${logoYan ? ' yan' : ''}">${girisMarka}</div>${girisIc}`, 'o-gKart')}</div>`,
    'Tam ekran':   `<div class="o-girisTam"><div class="o-gMarka${logoYan ? ' yan' : ''}">${girisMarka}</div>${girisIc}</div>`,
    'İki kolon':   `<div class="o-girisIki"><div class="o-gGorsel"></div>
        <div class="o-gSag"><div class="o-gMarka${logoYan ? ' yan' : ''}">${girisMarka}</div>${girisIc}</div></div>`,
    'Sade':        `<div class="o-girisSade"><div class="o-gMarka${logoYan ? ' yan' : ''}">${girisMarka}</div>${girisIc}</div>`,
  }[gr] || '';

  /* İçe aktarma */
  const ia = bic.iceaktarma[0];
  const dosyaKutusu = '<div class="o-dosya"><b>Dosya seç</b><i>xlsx · csv</i></div>';
  const iceGovde = {
    'Yok':          '<div class="o-bos"><i>Toplu içe aktarma yok; kayıtlar tek tek girilir.</i></div>',
    'Basit yükleme': dosyaKutusu + `<div class="o-dugmeler tek">${anaDugme('Yükle')}</div>`,
    'Önizlemeli':   dosyaKutusu + `<div class="o-ozetSatir"><b>128 yeni</b><i>14 mevcut · 2 kodsuz</i></div>`
                    + tabloKutusu(3) + `<div class="o-dugmeler tek">${anaDugme('Aktar')}</div>`,
    'Eşleştirmeli': dosyaKutusu + `<div class="o-esles">${
        [['A sütunu', 'Ad'], ['B sütunu', 'Tutar'], ['C sütunu', 'Tarih']].map(([a, b]) =>
        `<div class="o-eslesSat"><span>${a}</span><u>→</u><em>${b}</em></div>`).join('')
      }</div><div class="o-dugmeler tek">${anaDugme('Devam')}</div>`,
  }[ia] || '';

  /* Hata ekranı */
  const ht = bic.hata[0];
  const hataGovde = {
    'Sade yazı':           '<div class="o-bos"><i>Bir şeyler ters gitti.</i></div>',
    'Simge + tekrar dene': `<div class="o-bos"><span class="o-uyari">!</span>
        <i>Bağlantı kurulamadı. İnternetini kontrol et.</i>${anaDugme('Tekrar dene')}</div>`,
    'Tam sayfa':           `<div class="o-bos genis"><span class="o-uyari buyuk">!</span>
        <b>Bağlantı kurulamadı</b><i>Sunucuya ulaşılamıyor. Birazdan tekrar dene ya da geri dön.</i>
        <div class="o-dugmeler">${anaDugme('Tekrar dene')}
          <span class="o-dg ${ikinci}">Geri dön</span></div></div>`,
  }[ht] || '';

  const govde = { panel: panelGovde, liste: listeGovde, form: formGovde,
                  ayarlar: ayarGovde, bos: bosGovde, yukleme: yuklemeGovde,
                  sayfalar: sayfaGovde, detay: detayGovde, yogunluk: yogGovde,
                  acilis: acilisGovde, giris: girisGovde, ice: iceGovde,
                  hata: hataGovde }[ekr] || panelGovde;

  /* ---- Ekran üstü katmanlar ---- */
  const ortuVar = !!filtrePanel.includes('o-altSayfa') || bic.onaysil[0] === 'Pencere ile onay';
  const bildirim = odak === 'bildirim' && !ortuVar ? {
    'Üstte şerit':    '<div class="o-bildirimUst">3 sipariş onay bekliyor</div>',
    'Alttan kart':    '<div class="o-toast alt">Kaydedildi</div>',
    'Sağ üstte':      '<div class="o-toast sag">Kaydedildi</div>',
    'Ortada pencere': '<div class="o-perde"></div><div class="o-pencere kucuk"><b>Uyarı</b>'
                      + `<i>3 sipariş onay bekliyor.</i>${anaDugme('Tamam')}</div>`,
  }[bic.bildirim[0]] || '' : '';

  const os = bic.onaysil[0];
  const silme = odak !== 'onaysil' ? '' :
      os === 'Geri al şeridi'   ? '<div class="o-geriSerit">Kayıt silindi<em>Geri al</em></div>'
    : os === 'Pencere ile onay' ? `<div class="o-perde"></div><div class="o-pencere kucuk">
        <b>Kayıt silinsin mi?</b><i>Bu işlem geri alınamaz.</i>
        <div class="o-dugmeler"><span class="o-dg od-sil">Sil</span>
          <span class="o-dg ${ikinci}">Vazgeç</span></div></div>`
    : '';

  const ae = bic.anaeylem[0];
  const fab = ekr === 'liste' && !ortuVar && eyv('Ekle') && ae === 'Sağ altta yüzen'
    ? `<span class="o-fab" style="background:${esc(vurgu)}">+</span>` : '';
  const sonDugme = ekr === 'liste' && eyv('Ekle') && ae === 'Sayfa sonunda'
    ? `<div class="o-dugmeler tek">${anaDugme(v.dugme[0])}</div>` : '';

  const stil = [
    `--o-bg:${r('bg')}`, `--o-yuzey:${r('yuzey')}`, `--o-cizgi:${r('cizgi')}`,
    `--o-metin:${r('metin')}`, `--o-metin2:${r('metin2')}`, `--o-metin3:${r('metin3')}`,
    `--o-vurgu:${vurgu}`, `--o-vurgu-soft:${saydam(hexMi(vurgu) ? vurgu : '#888888', .14)}`,
    `--o-vurgu-ink:${vurgu}`,
    `--o-uzeri:#ffffff`,
    `--o-r:${koseler[0]}`, `--o-rb:${koseler[1]}`,
    `--o-satir:${yog[0]}`, `--o-pad:${yog[1]}`,
    `--o-baslik:${pl.baslik ? `'${pl.baslik.replace(/'/g, '')}', ` : ''}var(--yazi-baslik)`,
    `--o-govde:${pl.govde ? `'${pl.govde.replace(/'/g, '')}', ` : ''}var(--yazi-govde)`,
  ].join(';');

  /* Palet adımında renge bakılır, yerleşime değil: kısa gövde çiz ki
     önizleme küçültülmek zorunda kalmasın. Genişlik adımında da öyle. */
  if (ONIZLEME_GENIS || odak === 'palet') return onizlemeKisaIc();
  function onizlemeKisaIc() {
    return `<div class="${sinif}" style="${esc(stil)}">
      ${ustCubuk}
      <div class="o-alt2"><div class="o-gov">
        <div class="o-ikili">${v.stat.map(x =>
          kart(`<i>${esc(x[0])}</i><b>${esc(x[1])}</b>`, 'o-stat')).join('')}</div>
        ${tabloKutusu(2)}
      </div></div>
    </div>${onizlemeNotu(bic, tel, ekr)}`;
  }

  const ciplak = ['acilis', 'giris'].includes(ekr);
  return `<div class="${sinif}" style="${esc(stil)}">
    ${ciplak ? '' : ustCubuk}
    <div class="o-alt2">
      ${yanMenu || menuli ? `<div class="o-yanMenu${menuli ? ' acilir' : ''}">${
        menuAdlari.map((x, i) =>
        `<i class="${i ? '' : 'a'}">${esc(x)}</i>`).join('')}${
        bic.kullanicimenu[0] === 'Yan menü altında'
          ? '<span class="o-yanKisi"><em></em>Kerem G.</span>' : ''}</div>` : ''}
      <div class="o-gov">${[beklemeCubugu, govde, silme, sonDugme, bildirim, fab,
        sonucKatmani, gecisKatmani].map(x => x == null ? '' : x).join('')}${
        bic.destek[0] === 'Sağ altta yüzen' && !ciplak ? '<span class="o-destekFab">?</span>' : ''}</div>
    </div>
    ${ciplak ? '' : gezinme}
  </div>
  ${onizlemeNotu(bic, tel, ekr)}`;
}

function onizlemeNotu(bic, tel, ekr) {
  const not = [];
  /* Bu başlıkların çoğu kalktı; görünüşe artık ChatGPT'nin tarifi karar
     veriyor. Kalanları okurken var mı diye bakıyoruz. */
  const bs = k => (bic[k] && bic[k][0]) || '';
  if (ekr === 'liste' && !tel) not.push(`Telefonda: ${(bs('tablomobil') || '—').toLocaleLowerCase('tr')}`);
  if (ekr === 'liste' && tel && bs('tablomobil') === 'Aç-kapa satır')
    not.push('Satıra dokununca kalan sütunlar altında açılır');
  if (ekr === 'liste' && tel && bs('tablomobil') === 'Tam ekran')
    not.push('Kayıttan kayda yatay kaydırarak geçilir');
  if (ekr === 'liste' && bs('onaysil') === 'Kaydırarak sil')
    not.push('Satırı yana kaydırınca sil düğmesi çıkar');
  if (ekr === 'liste' && bs('onaysil') === 'Pencere ile onay')
    not.push('Silmeden önce onay penceresi çıkar');
  if (ekr === 'liste' && bs('arama') === 'Simgeden açılan')
    not.push('Arama büyüteç simgesinden açılır');
  if (ekr === 'liste' && bs('filtre') === 'Alttan sayfa')
    not.push('Filtreler alttan yarım sayfa olarak açılır');
  if (ekr === 'liste' && bic.tablo.includes('Gruplu'))
    not.push('Satırlar tarih ya da kategoriye göre öbeklenir');
  if (ekr === 'panel' && bs('yogunluk') === 'Karma')
    not.push('Form ve detay sayfaları bundan daha ferah olur');
  if (ekr === 'ayarlar' && bs('detay'))
    not.push(`Kayıt detayı: ${bs('detay').toLocaleLowerCase('tr')}`);
  if (bs('gezinme') === 'Açılır yan menü')
    not.push('Menü hamburger simgesinden soldan kayarak açılır');
  if (['Alt sekme', 'Alt + orta +'].includes(bs('gezinme')))
    not.push('Bilgisayarda alt çubuk yok: gezinme solda panele döner');
  if (bs('cubukDoku') === 'Buzlu cam')
    not.push('İçerik çubuğun altından bulanıklaşarak geçer');
  if (!not.length) return '';
  return `<div class="onk-not">${svg(ICON.info, 13)}<span>${esc(not.slice(0, 2).join(' · '))}</span></div>`;
}

function hexMi(x) { return /^#[0-9a-f]{6}$/i.test(String(x || '')); }

/* Seçim değişince: kayıt beklemeden yeniden çiz. */
/* Önizleme kırpılmasın: uygulama kutuya sığmıyorsa küçülterek sığdır. */
/* Kutu boyu sonradan değişebiliyor (ray kayarken, yazı tipi geç gelince,
   alt liste uzayınca). Tek seferlik ölçüm yetmiyordu: önizleme kırpılmış
   kalıyordu. Kutuyu izleyip her değişimde yeniden sığdırıyoruz. */
let ONIZLEME_GOZCU = null;
function onizlemeGozcu() {
  if (!window.ResizeObserver) return null;
  if (!ONIZLEME_GOZCU) {
    ONIZLEME_GOZCU = new ResizeObserver(() => {
      if (ONIZLEME_GOZCU.bekliyor) return;
      ONIZLEME_GOZCU.bekliyor = true;
      requestAnimationFrame(() => {
        ONIZLEME_GOZCU.bekliyor = false;
        onizlemeSigdir(true);
      });
    });
  }
  return ONIZLEME_GOZCU;
}

function onizlemeSigdir(izlemeden) {
  const gozcu = izlemeden ? null : onizlemeGozcu();
  if (gozcu) gozcu.disconnect();
  $$('.onz-goz').forEach(goz => {
    if (gozcu) gozcu.observe(goz);
    const app = goz.firstElementChild;
    if (!app || !app.classList.contains('o-app')) return;
    /* Ölçüm dönüşümden bağımsız olmalı: getBoundingClientRect ölçeklenmiş
       (üstelik geçiş animasyonu sürerken yarı yolda olan) boyu veriyor,
       o boyla yeni ölçek hesaplanınca önizleme her adımda biraz daha
       küçülüyordu. offsetHeight yerleşim boyudur, ölçekten etkilenmez. */
    const kh = goz.clientHeight, kw = goz.clientWidth;
    const ah = app.offsetHeight, aw = app.offsetWidth;
    if (!ah || !kh) return;
    /* Bir yere kadar küçültürüz; altına inince okunmaz olur. Kutu alçaldıkça
       taban da iner: kırpılmış bir ekran, küçük ekrandan kötüdür. */
    const taban = kh < 190 ? .24 : innerHeight <= 700 ? .4 : .5;
    const oran = Math.max(taban, Math.min(1, (kh - 18) / ah, (kw - 18) / aw));
    app.style.transform = oran < .999 ? `scale(${oran.toFixed(3)})` : '';
  });
}

function onizlemeTazele(p, pl) {
  /* Sayfadaki küçük ve panelde açık büyük önizleme aynı şeyi gösterir;
     ikisi de aynı anda tazelenir. */
  const kutular = $$('.onz-goz');
  if (!kutular.length) return;
  const ic = onizlemeIc(p, pl);
  kutular.forEach(k => { k.innerHTML = ic; });
  logolariGoster();
  onizlemeSigdir();
}

/* ---- Tel çizim: yerleşim ve durum seçeneklerinin küçük iskeleti ----
   Yüzey çizimleriyle karışmasın diye bilerek başka bir dil: kutu değil,
   ekranın planı. Her seçenek config'te bir parça listesi veriyor. */

const TEL_PARCA = {
  /* akış parçaları — alt alta dizilir */
  ust:          '<u class="w-ust"><i style="width:46%"></i></u>',
  ustAra:       '<u class="w-ust"><i style="width:12%"></i><i class="w-ara"></i><i style="width:12%"></i></u>',
  ustEylem:     '<u class="w-ust"><i style="width:40%"></i><i class="w-dug"></i></u>',
  ustMenu:      '<u class="w-ust"><i class="w-ham"></i><i style="width:40%"></i></u>',
  ustMenuYatay: '<u class="w-ust"><i style="width:18%"></i><i style="width:18%"></i><i style="width:18%"></i></u>',
  ustSecici:    '<u class="w-ust"><i style="width:46%"></i><i class="w-ok"></i></u>',
  sekme:        '<u class="w-sekme"><i class="a"></i><i></i><i></i></u>',
  adim:         '<u class="w-adim"><i class="a"></i><i class="a"></i><i></i><i></i></u>',
  ara:          '<u class="w-satir"></u>',
  cip:          '<u class="w-cip"><i class="a"></i><i></i><i></i><i></i></u>',
  ilerleme:     '<u class="w-ilerleme"><i></i></u>',
  seritUst:     '<u class="w-serit"></u>',
  alt:          '<u class="w-alt"><i></i><i></i><i></i><i></i></u>',
  altArti:      '<u class="w-alt"><i></i><i></i><i class="bos"></i><i></i><i></i></u><span class="w-fab alt"></span>',
  sonDugme:     '<u class="w-sonDug"></u>',
  sayfaNo:      '<u class="w-sayfa"><i class="a"></i><i></i><i></i></u>',

  /* Çubuk dokusu: aynı iskelet, farklı yüzey. Üst ve alt birlikte gösterilir. */
  /* Camda gövde renkli: çubuğun altından geçtiği kartta görünsün. */
  blokGecen:    '<u class="w-govde"><i class="w-blk gecen"></i></u>',
  dokuDoluUst:  '<u class="w-ust wd-dolu"><i style="width:46%"></i></u>',
  dokuCamUst:   '<u class="w-ust wd-cam"><i style="width:46%"></i></u>',
  dokuCizgiUst: '<u class="w-ust wd-cizgi"><i style="width:46%"></i></u>',
  dokuHapUst:   '<u class="w-ust wd-hap"><i style="width:46%"></i></u>',
  dokuKoyuUst:  '<u class="w-ust wd-koyu"><i style="width:46%"></i></u>',
  dokuDoluAlt:  '<u class="w-alt wd-dolu"><i></i><i></i><i></i><i></i></u>',
  dokuCamAlt:   '<u class="w-alt wd-cam"><i></i><i></i><i></i><i></i></u>',
  dokuCizgiAlt: '<u class="w-alt wd-cizgi"><i></i><i></i><i></i><i></i></u>',
  dokuHapAlt:   '<u class="w-alt wd-hap"><i></i><i></i><i></i><i></i></u>',
  dokuKoyuAlt:  '<u class="w-alt wd-koyu"><i></i><i></i><i></i><i></i></u>',

  /* gövde parçaları — kalan yeri paylaşır */
  blok:       '<u class="w-govde"><i class="w-blk"></i></u>',
  blokTam:    '<u class="w-govde"><i class="w-blk"></i></u>',
  blokOrta:   '<u class="w-govde"><i class="w-bos"></i><i class="w-blk" style="flex:3"></i><i class="w-bos"></i></u>',
  blokSol:    '<u class="w-govde"><i class="w-blk" style="flex:3"></i><i class="w-bos" style="flex:2"></i></u>',
  liste:      '<u class="w-govde"><i class="w-liste"><b></b><b></b><b></b><b></b></i></u>',
  listeDuzen: '<u class="w-govde"><i class="w-liste"><b></b><b class="duzen"></b><b></b><b></b></i></u>',
  listeKaydir:'<u class="w-govde"><i class="w-liste"><b></b><b class="kaydir"></b><b></b><b></b></i></u>',
  grupluListe:'<u class="w-govde"><i class="w-liste grup"><b class="bas"></b><b></b><b></b><b class="bas"></b><b></b></i></u>',
  izgara:     '<u class="w-govde"><i class="w-izgara"><b></b><b></b><b></b><b></b></i></u>',
  grafik:     '<u class="w-govde"><i class="w-grafik"></i></u>',
  ikiliKolon: '<u class="w-govde"><i class="w-grafik" style="flex:2"></i><i class="w-liste"><b></b><b></b><b></b></i></u>',
  form:       '<u class="w-govde"><i class="w-form"><b></b><b></b><b></b></i></u>',
  akis:       '<u class="w-govde"><i class="w-liste"><b style="flex:2"></b><b style="flex:3"></b><b style="flex:2"></b></i></u>',
  katlanir:   '<u class="w-govde"><i class="w-liste katlanir"><b class="bas"></b><b class="acik"></b><b class="bas"></b><b class="bas"></b></i></u>',
  kart2:      '<u class="w-kart2"><i></i><i></i></u>',
  solPanel:   '<u class="w-govde"><i class="w-panel"></i><i class="w-liste"><b></b><b></b><b></b><b></b></i></u>',
  yan:        '<u class="w-govde"><i class="w-yan"></i><i class="w-blk"></i></u>',
  yanInce:    '<u class="w-govde"><i class="w-panel ince"></i><i class="w-liste"><b></b><b></b><b></b></i></u>',

  /* boş ve bekleme durumları */
  bosYazi:  '<u class="w-govde bos"><i class="w-cizgi"></i></u>',
  bosSimge: '<u class="w-govde bos"><i class="w-halka"></i><i class="w-cizgi"></i></u>',
  bosDugme: '<u class="w-govde bos"><i class="w-halka"></i><i class="w-cizgi"></i><i class="w-minidug"></i></u>',
  bosCizim: '<u class="w-govde bos"><i class="w-cizim"></i><i class="w-cizgi"></i></u>',
  cark:     '<u class="w-govde bos"><i class="w-cark"></i></u>',
  iskelet:  '<u class="w-govde"><i class="w-liste iskelet"><b></b><b></b><b></b><b></b></i></u>',

  /* hareket kararları */
  dokKucul: '<u class="w-govde"><i class="w-liste dok"><b></b><b class="kucul"></b><b></b></i></u>',
  dokDalga: '<u class="w-govde"><i class="w-liste dok"><b></b><b class="dalga"></b><b></b></i></u>',
  dokKoyu:  '<u class="w-govde"><i class="w-liste dok"><b></b><b class="koyu"></b><b></b></i></u>',
  svNormal: '<u class="w-govde"><i class="w-liste sv"><b></b><b class="sec"></b><b></b></i></u>',
  svSoluk:  '<u class="w-govde"><i class="w-liste sv soluk"><b></b><b class="sec"></b><b></b></i></u>',
  svKucuk:  '<u class="w-govde"><i class="w-liste sv kucuk"><b></b><b class="sec"></b><b></b></i></u>',
  svBulanik:'<u class="w-govde"><i class="w-liste sv bulanik"><b></b><b class="sec"></b><b></b></i></u>',
  acKatla:  '<u class="w-govde"><i class="w-liste kat"><b class="bas"></b><b class="acik"></b><b class="bas"></b></i></u>',
  acKay:    '<u class="w-govde"><i class="w-liste kat kay"><b class="bas"></b><b class="acik"></b><b class="bas"></b></i></u>',
  acSoluk:  '<u class="w-govde"><i class="w-liste kat soluk"><b class="bas"></b><b class="acik"></b><b class="bas"></b></i></u>',
  bekHalka: '<u class="w-govde bos"><i class="w-bekDug"><b class="w-donen"></b></i></u>',
  bekYazi:  '<u class="w-govde bos"><i class="w-bekDug yazi"></i></u>',
  lgSira:   '<u class="w-govde"><i class="w-liste lg"><b></b><b></b><b></b><b></b></i></u>',
  lgKay:    '<u class="w-govde"><i class="w-liste lg kay"><b></b><b></b><b></b><b></b></i></u>',
  syArt:    '<u class="w-govde bos"><i class="w-sayi"><b></b><b class="ok"></b></i></u>',
  syParla:  '<u class="w-govde bos"><i class="w-sayi parla"><b></b></i></u>',
  hmYok:    '<u class="w-govde bos"><i class="w-hm"><b></b></i></u>',
  hmAz:     '<u class="w-govde bos"><i class="w-hm"><b></b><b></b></i></u>',
  hmNormal: '<u class="w-govde bos"><i class="w-hm"><b></b><b></b><b></b></i></u>',
  hmBol:    '<u class="w-govde bos"><i class="w-hm"><b></b><b></b><b></b><b></b></i></u>',

  /* üst çubuk çeşitleri — çatı kararları */
  ustCip:    '<u class="w-ust"><i style="width:34%"></i><b class="w-cip2"></b></u>',
  ustAvatar: '<u class="w-ust"><i style="width:40%"></i><b class="w-av"></b></u>',
  ustSoru:   '<u class="w-ust"><i style="width:40%"></i><b class="w-soru"></b></u>',
  ustRozet:  '<u class="w-ust"><i style="width:40%"></i><b class="w-nokta"></b></u>',
  ustGeri:   '<u class="w-ust"><b class="w-geri"></b><i style="width:40%"></i></u>',
  yolMetin:  '<u class="w-yol"><i></i><i class="k"></i></u>',
  yanKisi:   '<u class="w-govde"><i class="w-yan kisi"></i><i class="w-blk"></i></u>',

  /* genel görünüm */
  hero:        '<u class="w-hero"></u>',
  buyukBaslik: '<u class="w-bb"><i></i></u>',
  seritKart:   '<u class="w-seritK"></u>',

  /* sayaç düzenleri */
  kart3:      '<u class="w-kart2 uc"><i></i><i></i><i></i></u>',
  kartSerit:  '<u class="w-kartS"><i></i><i></i><i></i><i></i></u>',
  kartDikey:  '<u class="w-govde"><i class="w-liste dikey"><b></b><b></b><b></b></i></u>',

  /* dönem, dosya, eşleştirme */
  ayCubugu:   '<u class="w-ay"><b>‹</b><i></i><b>›</b></u>',
  dosya:      '<u class="w-dosya"></u>',
  ozetSatir:  '<u class="w-ozet"><i></i><i></i></u>',
  eslestir:   '<u class="w-govde"><i class="w-esles"><b></b><b></b><b></b></i></u>',

  /* logo görünümü */
  logoAd:    '<u class="w-govde bos"><i class="w-alogo"></i><i class="w-isik"></i><b class="w-ad"></b></u>',
  logoYalin: '<u class="w-govde bos"><i class="w-alogo"></i></u>',
  logoKutu:  '<u class="w-govde bos"><i class="w-alogo kutulu"></i></u>',
  logoYan:   '<u class="w-govde bos yan"><i class="w-alogo kucuk"></i><b class="w-ad"></b></u>',

  /* açılış ve giriş */
  acilisLogo: '<u class="w-govde bos"><i class="w-alogo"></i></u>',
  ikiCizgi:   '<u class="w-iki"><i></i><i class="k"></i></u>',
  girisKart:  '<u class="w-govde bos"><i class="w-gkart"><b></b><b></b><b class="d"></b></i></u>',
  girisTam:   '<u class="w-govde bos gtam"><i class="w-alogo kucuk"></i><b></b><b></b><b class="d"></b></u>',
  girisIki:   '<u class="w-govde"><i class="w-gsol"></i><i class="w-gkart yalin"><b></b><b></b><b class="d"></b></i></u>',
  girisSade:  '<u class="w-govde bos gsade"><i class="w-alogo kucuk"></i><b></b><b></b></u>',

  /* geçiş */
  gecisYok:    '<u class="w-govde"><i class="w-blk"></i></u>',
  gecisSoluk:  '<u class="w-govde"><i class="w-blk" style="opacity:.45"></i></u>',
  gecisSag:    '<u class="w-govde gec"><i class="w-blk eski"></i><i class="w-blk yeni"></i></u>',
  gecisYukari: '<u class="w-govde gec yukari"><i class="w-blk eski"></i><i class="w-blk yeni"></i></u>',

  /* sistem */
  temaAnahtar: '<u class="w-tema"><i></i><b></b></u>',
  temaIki:     '<u class="w-tema iki"><i></i><b></b></u>',
  ikiDugme:    '<u class="w-ikiDug"><i></i><i></i></u>',

  /* durumlar */
  hataSimge: '<u class="w-govde bos"><i class="w-uyari"></i><i class="w-cizgi"></i><i class="w-minidug"></i></u>',
  hataTam:   '<u class="w-govde bos"><i class="w-uyari buyuk"></i><i class="w-cizgi"></i><i class="w-ikiDug kucuk"><b></b><b></b></i></u>',
  tik:       '<u class="w-govde bos"><i class="w-tik"></i></u>',

  /* üstte yüzenler */
  sagPanel: { son: '<i class="w-sagPanel"></i>' },
  cekmece:  { ustu: '<span class="w-cekmece"></span>' },
  pencere:  { ustu: '<span class="w-pencere"></span>' },
  fab:      { ustu: '<span class="w-fab"></span>' },
  altSayfa: { ustu: '<span class="w-altSayfa"></span>' },
  seritAlt: { ustu: '<span class="w-seritAlt"></span>' },
  geriAl:   { ustu: '<span class="w-seritAlt geri"></span>' },
  sagUst:   { ustu: '<span class="w-sagUst"></span>' },
  sonsuz:   { ustu: '<span class="w-sonsuz"></span>' },
};

function telCizim(parcalar) {
  const akis = [];
  const ustu = [];
  parcalar.forEach(ad => {
    const p = TEL_PARCA[ad];
    if (!p) return;
    if (typeof p === 'string') { akis.push(p); return; }
    if (p.ustu) ustu.push(p.ustu);
    /* Sağ bölme, son gövdenin içine girer. */
    if (p.son && akis.length) {
      akis[akis.length - 1] = akis[akis.length - 1].replace(/<\/u>$/, p.son + '</u>');
    }
  });
  return `<span class="tel-wf">${akis.join('')}${ustu.join('')}</span>`;
}

/* 4 · Yapıyı kurma */
/* 4 · Kurulum ve yapı — klavye başında doldurulan taraf.
   Beş adım, kurulum sırasına dizili. Boş adım şeritte küçük kart; dolan adım
   bilgileri anlatan tam genişlikte karta dönüşüyor ve yukarı geçiyor. Böylece
   üst taraf "yapılanlar", alt taraf "yapılacaklar" oluyor.

   Başlıklar soru, terimler gündelik: "platform" değil "nerede çalışacak",
   "alan adı" değil "internet adresi". Bu ekranı yazılım bilmeyen biri de
   baştan sona götürebilmeli. */

/* Kurulum adımı da yol haritasındaki kare kartın aynısı: numara, durum,
   ad ve tek satır özet. Basınca o adımın penceresi açılıyor — bilgiler
   orada. Sırası gelmemiş adım basılamıyor: atlamalı doldurunca sonraki
   adımın sorusu havada kalıyor. */
function kurulumAdimi(p, a, sirada) {
  const hal  = a.bitti ? 'bitti' : sirada ? 'simdi' : 'kilitli';
  const ikon = a.bitti ? ICON.tik : sirada ? ICON.goz : ICON.kilit;

  return `
    <button class="ya ${hal}" type="button" data-eylem="${a.eylem}" data-proje="${p.id}"
            ${a.bitti || sirada ? '' : 'disabled'}>
      <span class="ya-ust">
        <span class="ya-no mono">${a.no}</span>
        <span class="ya-dur">${svg(ikon, 13)}</span>
      </span>
      <span class="ya-yz">
        <span class="ya-ad">${esc(a.ad)}</span>
        <span class="ya-alt">${esc(a.bitti ? a.deger : a.ozet)}</span>
      </span>
    </button>`;
}

function yapiSayfasi(p, d) {
  /* Yönetici için ara ekran yok: girer girmez ağaç açılıyor. Eskiden burada
     tek kartlık bir özet duruyordu ve ağacı açmak için ona bir kez daha
     dokunmak gerekiyordu — gereksiz bir tık. */
  if (AUTH.yonetici) { YAPI_ACIK[p.id] = true; return yapiAkisi(p, d); }

  const moduller = DB.modulleri(p.id);
  const gercek   = moduller.filter(m => m.ad !== GENEL_MODUL);
  const s  = DB.sayim(p.id);

  /* "Ne yapıyoruz?", "Kim kullanacak?" ve "Bağlantılar" kalktı — sırasıyla
     sabit değerlere döndü, "Program temeli"ye taşındı ve kendi durağını
     aldı. Burada tek adım kaldı: modüller. */
  const adimlar = [
    { no: '01', eylem: 'yapi-akis-ac', ad: 'Modüller',
      ozet: 'Hangi bölümler olacak',
      bitti: gercek.length > 0 && s.sayfa > 0,
      deger: gercek.length + ' modül · ' + s.sayfa + ' sayfa' },
  ];

  const simdi = adimlar.findIndex(a => !a.bitti);
  const biten = adimlar.filter(a => a.bitti).length;
  const kart  = i => kurulumAdimi(p, adimlar[i], i === simdi);

  return `<div class="fb-govde">`
    + adimBasligi(p, d, biten + '/' + adimlar.length)
    + fbTakvimSeridi(p)
    + `<div class="ya-harita">
        <div class="ya-satir">${adimlar.map((_, i) => kart(i)).join('')}</div>
      </div>`
    + `</div>`;
}

/* ---------- 3 · Yapıyı kurma: adım adım akış ----------
   Bir firmaya çoğunlukla tek modül kuruluyor; sonradan eklenen de tek
   oluyor. Akış buna göre: bir modül, sayfaları, her sayfanın künyesi.
   Taslak bellekte durur; veritabanına ancak "Kur" ile yazılır. */
const YAPI_TASLAK = {};

/* Modül ağacı açık mı. Taslaktan ayrı tutuluyor: taslak yarım kalan işi
   saklıyor, bu bayrak yalnız "şu an ağaç ekranındayım" diyor. Aynı şey
   olsalardı bir kez modül kuran kullanıcı aşamaya her girişinde kurulum
   ızgarasını değil ağacı görürdü. */
const YAPI_ACIK = {};

function yapiTaslak(p) {
  if (!YAPI_TASLAK[p.id]) {
    YAPI_TASLAK[p.id] = { yer: 0, modul: '', anlat: '', kararlar: [],
                          baglantilar: [], hazirVeri: [], ciktilar: [],
                          mod: 'agac', odak: null, dal: null, duzelt: null,
                          mk: { kural: '' },
                          sayfalar: [], kunye: {} };
  }
  const t = YAPI_TASLAK[p.id];
  /* İlk açılışta modül sayısına göre yönlen: hiç modül yoksa haritanın
     gösterecek bir şeyi yok, direkt anlatma ekranına düş. Tek modül varsa
     kullanıcı hiçbir zaman "hangi modül" diye seçmesin diye otomatik
     seçilip sayfaları gösterilir. İkiden fazlaysa (Claude öyle kurmayı
     uygun gördüyse) seçim gerçekten gerekli, o zaman harita kalır. */
  /* Aşamaya her girişte "anlat" ekranı açılıyor; kurulu yapıya bakmak
     ayrı bir adım (bkz. yapi-moduller). */
  if (!t.acildi && DB.yuklendi) { t.acildi = true; t.mod = 'anlat'; }
  return t;
}

/* Modülün sayfalarını ve künyelerini taslağa yükler. */
function modulYukle(p, t, ad) {
  t.modul = ad;
  const kurulu = DB.modulleri(p.id).find(m => m.ad === ad);
  if (kurulu) {
    t.sayfalar = DB.sayfalari(kurulu.id).map(x => x.ad);
    const eski = (p.palet || {}).kunye || {};
    t.kunye = {};
    t.sayfalar.forEach(sf => {
      const k = eski[ad + ' · ' + sf];
      if (k) t.kunye[sf] = JSON.parse(JSON.stringify(k));
    });
    /* Anlatım yoksa bile alanlar sıfırlanmalı — yoksa başka bir modülden
       kalan anlat/karar/baglanti/hazirVeri/çıktı burada kalırdı (t tek
       nesne, projedeki bütün modüller arasında paylaşılıyor). */
    const an = ((p.palet || {}).anlatim || {})[ad];
    t.anlat       = (an && an.metin) || '';
    t.kararlar    = (an && an.sorular) || [];
    t.baglantilar = (an && an.baglantilar) || [];
    t.hazirVeri   = (an && an.hazirVeri) || [];
    t.ciktilar    = (an && an.ciktilar) || [];
    const mk = ((p.palet || {}).modulKunye || {})[ad];
    t.mk = mk ? JSON.parse(JSON.stringify(mk)) : { kural: '' };
  } else {
    /* Modül şablonları kalktı: yeni modülün sayfalarını kullanıcı yazıyor. */
    t.sayfalar = [];
    t.kunye = {};
    t.anlat = ''; t.kararlar = []; t.baglantilar = []; t.hazirVeri = []; t.ciktilar = [];
    t.mk = { kural: '' };
  }
}

/* Taslağı DB'ye yazar: modül yoksa açılır, varsa yalnız eksik sayfalar
   eklenir (kopya olmasın), künye/anlatım/modül kuralı palete kaydedilir.
   İlk kurulumda "Kur" düğmesinden, "Modülü güncelle" akışında yapıştırma
   sonrası kendiliğinden çağrılıyor — ikisi de aynı yazma mantığını kullanır. */
async function yapiTaslagiKur(pr, t) {
  const kurulu = DB.modulleri(pr.id).find(m => m.ad === t.modul);
  if (kurulu) {
    const varOlan = DB.sayfalari(kurulu.id).map(x => x.ad);
    for (const sf of t.sayfalar) {
      if (!varOlan.includes(sf)) await DB.sayfaEkle(kurulu.id, sf);
    }
  } else {
    await DB.modulEkle(pr.id, t.modul, t.sayfalar);
  }
  /* Künyeler projenin palet torbasında: ayrı sütun gerekmiyor ve
     prompt üretilirken oradan okunuyor. */
  const eski = (pr.palet || {}).kunye || {};
  const yeni = Object.assign({}, eski);
  t.sayfalar.forEach(sf => { yeni[t.modul + ' · ' + sf] = t.kunye[sf]; });
  /* Anlatım ve açık soruların cevapları da saklanır: prompt bunları
     AI'a aynen veriyor, ikinci kez anlatmaya gerek kalmıyor. */
  const anlatim = Object.assign({}, (pr.palet || {}).anlatim || {});
  if ((t.anlat || '').trim() || (t.kararlar || []).length
      || (t.baglantilar || []).length) {
    anlatim[t.modul] = {
      metin: (t.anlat || '').trim(),
      sorular: (t.kararlar || []).filter(x => x.soru && x.cevap),
      baglantilar: t.baglantilar || [],
      hazirVeri: t.hazirVeri || [],
      ciktilar: t.ciktilar || [],
    };
  }
  const modulKunye = Object.assign({}, (pr.palet || {}).modulKunye || {});
  modulKunye[t.modul] = JSON.parse(JSON.stringify(t.mk || {}));
  await DB.paletKaydet(pr.id, Object.assign({}, pr.palet || {},
    { kunye: yeni, anlatim, modulKunye }));
}

function yapiKunye(t, sayfa) {
  if (!t.kunye[sayfa]) {
    t.kunye[sayfa] = { amac: '', tur: '', olcek: '', kalip: [], kalipCevap: {},
                       grup: '', ayniKayit: '', alanlar: [],
                       /* Yalnız modül kuralından ayrılıyorsa dolar. */
                       fark: { kural: '' } };
  }
  return t.kunye[sayfa];
}

/* Sayfa üç soruya indi; her sayfada tekrar eden şeyler (kim görür, kim ne
   yapar, ortak kural) modül düzeyinde bir kez soruluyor. */
const KUNYE_ADIM = [
  { anahtar: 'amac',    ad: 'Ne işe yarar?',    soru: 'Bu sayfa ne işe yarıyor?' },
  { anahtar: 'ekran',   ad: 'Nasıl bir ekran?', soru: 'Türü, büyüklüğü ve yapısı.' },
  { anahtar: 'alanlar', ad: 'Neler yazılacak?', soru: 'Her kayıtta hangi bilgiler duracak?' },
  { anahtar: 'fark',    ad: 'Farklı mı?',       soru: 'Bu sayfa modül kuralından ayrılıyor mu?' },
];

/* Yetki soruları buradan kalktı: kim görür ve kim ne yapar artık tasarım
   anında değil, teslim edilen uygulamanın kendi Yetkiler ekranından
   belirleniyor. Sebebi basit — müşterinin ekibi zamanla değişiyor, her
   değişiklikte Studio'ya dönüp yeniden kod yazdırmak anlamsız. Studio
   yalnız katmanların ne olduğunu söylüyor (02. adım), kimin hangi katmanda
   olacağını uygulamadaki admin belirliyor.

   Geriye modülün iş kuralı kaldı; onun yetkiyle ilgisi yok. */
const MODUL_ADIM = [
  { anahtar: 'kural', ad: 'Ortak kural', soru: 'Bütün modülde geçerli bir kural var mı?' },
];

function kunyeAdimlari() { return KUNYE_ADIM; }

function kunyeAdimTam(k, anahtar) {
  if (anahtar === 'amac')    return !!(k.amac || '').trim();
  if (anahtar === 'ekran')   return !!k.tur && kalipTam(k);
  if (anahtar === 'alanlar') return (k.alanlar || []).length > 0
    && k.alanlar.every(a => a.tur !== 'Seçenek' || (a.degerler || []).filter(Boolean).length);
  return true;   /* "farklı mı" isteğe bağlı */
}

function yapiAkisi(p, d) {
  const t = yapiTaslak(p);
  /* Aşamanın kendisi "anlat" ekranı: yeni bir bölüm her zaman buradan
     anlatılıyor. Kurulmuş yapıya bakmak için alttaki "Modülleri incele". */
  if (t.mod !== 'agac') return anlatEkrani(p, t, d);
  if (t.mod === 'mkural' && t.modul) return modulKuralEkrani(p, t);
  if (t.mod === 'onizle' && t.odak) return onizlemeEkrani(p, t);
  if (t.dal && t.odak && t.sayfalar.includes(t.odak)) return duzenEkrani(p, t);
  t.mod = 'agac';
  t.dal = null;
  return agacEkrani(p, t);
}

/* ---- Ağaç ----
   Dikey: tepede firma, altında oklarla modüller. Modül seçilince modül
   tepeye çıkar, sayfaları altına dizilir. Bir sayfaya dokununca künyesi
   hemen altında dallanır. Düzenleme ayrı ekranda açılır. */

const DAL_RENK = {
  amac: '#c9ced6', ekran: '#8d8378', alanlar: '#3d9970', fark: '#d0a13c',
  roller: '#5b8def', yetki: '#5b8def', kural: '#c9a227',
};

function dalOzeti(k, anahtar) {
  if (anahtar === 'amac') return k.amac || 'yazılmadı';
  if (anahtar === 'ekran') {
    const p = [];
    if (k.tur) p.push(k.tur === 'Liste' ? 'Alt alta liste' : k.tur);
    if (k.olcek) p.push({ 'Az': 'yüzlerce kayıt', 'Orta': 'birkaç bin kayıt',
                          'Çok': 'on binlerce kayıt' }[k.olcek] || k.olcek);
    (k.kalip || []).forEach(a => {
      const kl = KALIP.find(x => x.anahtar === a);
      if (kl) p.push(kl.ozet.replace(/\.$/, '').toLocaleLowerCase('tr'));
    });
    if (k.ayniKayit) p.push('kaydı ' + k.ayniKayit + ' ile ortak');
    return p.length ? p.join(' · ') : 'seçilmedi';
  }
  if (anahtar === 'alanlar') return (k.alanlar || []).length
    ? k.alanlar.map(a => a.ad).join(' · ') : 'daha yazılmadı';
  const f = (k && k.fark) || {};
  return (f.kural || '').trim() ? 'kendi kuralı var' : 'hayır, modül kuralı geçerli';
}

/* Modül kuralları satırının özeti. */
function modulOzeti(mk) {
  return ((mk || {}).kural || '').trim() || 'yok';
}

/* Sayfa modül kuralından ayrılıyor mu? */
function farkVar(k) {
  return !!((k && k.fark && k.fark.kural) || '').trim();
}

function agacSayfaAlt(k) {
  const p = [];
  if (k.tur) p.push(k.tur.toLocaleLowerCase('tr'));
  (k.kalip || []).slice(0, 1).forEach(a =>
    p.push(((KALIP.find(x => x.anahtar === a) || {}).ad || a).toLocaleLowerCase('tr')));
  if ((k.alanlar || []).length) p.push(k.alanlar.length + ' alan');
  return p.join(' · ') || 'künye boş';
}

function agacKabuk(p, yol, govde, dugmeler) {
  return `<div class="dk" style="${renkDegiskenleri(p.renk)}">
    <div class="dk-yol">${yol}</div>
    <div class="dk-govde">${govde}</div>
    ${dugmeler ? `<div class="dk-alt">${dugmeler}</div>` : ''}
  </div>`;
}

function yolCipleri(basamak) {
  return basamak.map((b, i) => `
    ${i ? '<s>›</s>' : ''}
    <button class="yi ${i === basamak.length - 1 ? 'son' : ''}" type="button"
            ${b.eylem ? `data-eylem="${b.eylem}" data-proje="${b.proje}"` : 'disabled'}
      >${esc(b.ad)}</button>`).join('');
}

/* Ağaç üç kademeye ayrıldı: modüller → bir modülün sayfaları → bir sayfanın
   künyesi. Eskiden hepsi tek ekranda iç içe açılıyordu; dikey çizgiler ve
   girintiler derinlik arttıkça okunmaz oluyordu. Artık her kademe kendi
   ekranı ve tepesinde nereden geldiğini söyleyen kart duruyor — sayfanın
   geri kalanıyla aynı dil.

   Roller kartı buradan kalktı: 02. adımda zaten soruluyor, iki yerde
   durması hangisinin geçerli olduğunu belirsiz bırakıyordu. */

/* Kademelerin ortak başlığı: sol karo, iki satır yazı, sağda sayı.
   Ölçüsü proje künyesiyle aynı — sayfanın her tepesi aynı yükseklikte. */
function agacBaslik(renk, ikon, ust, ad, sag, saget) {
  return `
    <div class="bs2" style="--kr:${renk}">
      <span class="bs2-ik">${svg(ikon, 26)}</span>
      <span class="bs2-yz">
        <span class="bs2-firma"><span class="bs2-ad2">${esc(ust)}</span></span>
        <span class="bs2-ad">${esc(ad)}</span>
      </span>
      <span class="bs2-sag"><b class="mono">${esc(sag)}</b><i>${esc(saget)}</i></span>
    </div>`;
}

/* Kare kart — yol haritasındakiyle aynı ölçü ve durum dili. */
function agacKare(no, hal, ad, alt, eylem, veri) {
  const ikon = hal === 'bitti' ? ICON.tik
             : hal === 'kesik' ? ICON.arti
             : hal === 'simdi' ? ICON.goz
             : ICON.kalem;
  return `
    <button class="ya ${hal === 'kesik' ? 'kesik' : hal}" type="button" ${veri || ''}
            data-eylem="${eylem}">
      <span class="ya-ust">
        <span class="ya-no mono">${esc(no)}</span>
        <span class="ya-dur">${svg(ikon, 13)}</span>
      </span>
      <span class="ya-yz">
        <span class="ya-ad">${esc(ad)}</span>
        <span class="ya-alt">${esc(alt)}</span>
      </span>
    </button>`;
}

/* Öbek başlığı. Eski küçük gri etiket sayfa yığınının içinde kayboluyordu:
   adı büyüttük, sayıyı rozete aldık, sağa da ince bir çizgi çektik —
   öbeğin nerede başladığı bir bakışta belli olsun. */
function sayfaObekBasligi(ad, sayi) {
  return `
    <div class="obk">
      <span class="obk-ad">${esc(ad)}</span>
      ${sayi ? `<span class="obk-say mono">${sayi}</span>` : ''}
      <i class="obk-cizgi"></i>
    </div>`;
}

/* Satır kart — modül kuralları ve künye dalları gibi kısa bilgiler için.
   Kare israf olurdu: iki kelimelik başlık ve bir satır özet. */
function agacSatir(renk, ikon, ad, alt, eksik, eylem, veri) {
  return `
    <button class="ags ${eksik ? 'eksik' : ''}" style="--ki:${renk}" type="button"
            ${veri || ''} data-eylem="${eylem}">
      <span class="ags-ik">${svg(ikon, 14)}</span>
      <span class="ags-yz"><b>${esc(ad)}</b><i>${esc(alt)}</i></span>
      <span class="ags-ok">${svg(ICON.chevron, 13)}</span>
    </button>`;
}

function agacEkrani(p, t) {
  const moduller = DB.modulleri(p.id).filter(m => m.ad !== GENEL_MODUL);
  const kunyeler = (p.palet || {}).kunye || {};
  const mkler    = (p.palet || {}).modulKunye || {};

  /* ---------- 3 · Bir sayfanın künyesi ---------- */
  if (t.modul && t.odak) return kunyeEkrani(p, t.modul, t.odak, kunyeler);

  /* ---------- 2 · Bir modülün sayfaları ---------- */
  if (t.modul) {
    const m      = moduller.find(x => x.ad === t.modul);
    const sayfa  = m ? DB.sayfalari(m.id).map(x => x.ad) : (t.sayfalar || []);
    const kural  = ((mkler[t.modul] || {}).kural || '').trim();

    /* Öbekler Claude'un verdiği sıradan geliyor; "Diğer" hep sonda. */
    const sira = [];
    const obek = {};
    sayfa.forEach((sf, i) => {
      const g = ((kunyeler[t.modul + ' · ' + sf] || {}).grup || '').trim() || 'Diğer';
      if (!obek[g]) { obek[g] = []; sira.push(g); }
      obek[g].push({ sf, i });
    });
    sira.sort((a, b) => (a === 'Diğer') - (b === 'Diğer'));

    return `<div class="fb-govde">`
      + `<button class="md-yol" type="button" data-eylem="agac-modul-ac"
                 data-proje="${p.id}" data-ad="${esc(t.modul)}">
          ${svg(ICON.chevron, 14)} Modüller</button>`
      + `<div class="md-bas">
          <span class="md-bas-ik">${svg(ICON.katman, 22)}</span>
          <span class="md-bas-yz"><b>${esc(t.modul)}</b><i>${sayfa.length} sayfa</i></span>
        </div>`
      + (kural ? `<div class="md-not">
          ${svg(ICON.info, 16)}
          <span><b>Ortak kural</b>${esc(kural)}</span>
        </div>` : '')
      + sira.map(g => `
          <div class="md-grup">${esc(g)} <u>${obek[g].length}</u></div>
          <div class="md-liste">
            ${obek[g].map(({ sf, i }) => {
              const k = kunyeler[t.modul + ' · ' + sf] || {};
              return `
              <button class="md-satir" type="button" data-eylem="agac-sayfa"
                      data-proje="${p.id}" data-ad="${esc(sf)}">
                <span class="md-no">${i + 1}</span>
                <span class="md-ik">${svg(ICON.dosya, 17)}</span>
                <span class="md-yz">
                  <b>${esc(sf)}</b>
                  <i>${esc(kisaOzet(k.amac))}</i>
                </span>
                <span class="md-ok">${svg(ICON.chevron, 15)}</span>
              </button>`;
            }).join('')}
          </div>`).join('')
      + `</div>`;
  }

  /* ---------- 1 · Modüller ---------- */
  return `<div class="fb-govde">`
    + `<button class="md-yol" type="button" data-eylem="yapi-anlat" data-proje="${p.id}">
        ${svg(ICON.chevron, 14)} Yapı planlama</button>`
    + `<div class="md-bas">
        <span class="md-bas-ik">${svg(ICON.izgaraDort, 22)}</span>
        <span class="md-bas-yz"><b>Modüller</b><i>Programın bölümleri ve sayfaları.</i></span>
      </div>`
    /* Önce modüllerin kendisi; işlemler aşağıda, ayraçla ayrılmış — yoksa
       "güncelle" satırları da bir modülmüş gibi okunuyordu. */
    + (moduller.length ? `<div class="md-liste">
        ${moduller.map((m, i) => `
          <button class="md-satir" type="button" data-eylem="agac-modul-ac"
                  data-proje="${p.id}" data-ad="${esc(m.ad)}">
            <span class="md-no">${i + 1}</span>
            <span class="md-ik">${svg(ICON.katman, 17)}</span>
            <span class="md-yz">
              <b>${esc(m.ad)}</b>
              <i>${DB.sayfalari(m.id).length} sayfa</i>
            </span>
            <span class="md-ok">${svg(ICON.chevron, 15)}</span>
          </button>`).join('')}
      </div>` : `<div class="md-not">${svg(ICON.info, 16)}
        <span><b>Henüz modül yok</b>Claude'un verdiği bloğu yapıştırınca burada görünecek.</span>
      </div>`)

    + `</div>`;
}

/* Güncelleme işleri: promptu al, cevabı kur. Aşamanın en altında duruyor —
   modül listesinin içinde dururken modülmüş gibi okunuyordu. */
function yapiGuncellemeIsleri(p) {
  const ilk = (DB.modulleri(p.id).find(m => m.ad !== GENEL_MODUL) || {}).ad || '';
  return `
    <div class="md-ayrac"></div>
    <div class="md-grup">Güncelleme</div>
    <a class="md-is" target="_blank" rel="noopener"
       data-pano="modulGuncelle:${encodeURIComponent(ilk)}"
       data-proje="${p.id}" data-hedef="Claude Code"
       href="${esc(claudeAdresi(depoSlug(p.repo)))}">
      <span class="md-is-ik">${svg(ICON.kopya, 18)}</span>
      <span class="md-yz">
        <b>Güncelleme promptu</b>
        <i>Koddaki yapıyla buradaki kaydı karşılaştırır, eksikleri bulur.</i>
      </span>
      <span class="md-ok">${svg(ICON.chevron, 15)}</span>
    </a>
    <button class="md-is ikincil" type="button" data-eylem="yapi-kur-pano" data-proje="${p.id}">
      <span class="md-is-ik">${svg(ICON.ice, 18)}</span>
      <span class="md-yz">
        <b>Güncelle</b>
        <i>Claude'un verdiği blok panodayken bas.</i>
      </span>
      <span class="md-ok">${svg(ICON.chevron, 15)}</span>
    </button>`;
}

/* Sayfa satırının altındaki tek satır: amacın ilk cümlesi. */
function kisaOzet(metin) {
  const x = String(metin || '').trim().replace(/\s+/g, ' ');
  if (!x) return 'açıklama yok';
  const nokta = x.indexOf('. ');
  const ilk = nokta > 10 ? x.slice(0, nokta) : x;
  return ilk.length > 70 ? ilk.slice(0, 68) + '…' : ilk;
}

/* Bir sayfanın künyesi — yalnız gösterim. Dört başlık, tablolar, düzenleme
   yok: yapıda değişiklik gerekiyorsa "Modülleri güncelle" var. */
function kunyeEkrani(p, modul, sayfa, kunyeler) {
  const k    = kunyeler[modul + ' · ' + sayfa] || {};
  const kl   = KALIP.find(x => x.anahtar === (k.kalip || [])[0]);
  const olcek = { 'Az': 'Az (yüzlerce kayıt)', 'Orta': 'Orta (birkaç bin)',
                  'Çok': 'Çok (on binlerce)' }[k.olcek] || k.olcek || '—';

  /* Kalıbın kendi cevapları "Ayrıntılar" satırında toplanıyor. */
  const ayrinti = kl
    ? (kl.sorular || []).map(so => (k.kalipCevap || {})[so.anahtar])
        .filter(Boolean).join(' · ')
    : '';

  const satir = (et, dg) => `
    <div class="kn-s"><span class="kn-et">${esc(et)}</span>
      <span class="kn-dg">${esc(dg || '—')}</span></div>`;

  const alanlar = (k.alanlar || []);
  const bolum = (no, ikon, ad, ic) => `
    <div class="kn-bolum">
      <div class="kn-bas">
        <span class="kn-bas-ik">${svg(ikon, 16)}</span>
        <span class="kn-no">${no}</span>
        <b>${esc(ad)}</b>
      </div>
      ${ic}
    </div>`;

  return `<div class="fb-govde">`
    + `<button class="md-yol" type="button" data-eylem="agac-sayfa"
               data-proje="${p.id}" data-ad="${esc(sayfa)}">
        ${svg(ICON.chevron, 14)} ${esc(modul)}</button>`
    + `<div class="md-bas">
        <span class="md-bas-ik">${svg(ICON.dosya, 22)}</span>
        <span class="md-bas-yz"><b>${esc(sayfa)}</b><i>${esc(kisaOzet(k.amac))}</i></span>
      </div>`
    + bolum(1, ICON.info, 'Ne işe yarar?',
        `<p class="kn-metin">${esc(k.amac || 'Henüz yazılmadı.')}</p>`)
    + bolum(2, ICON.panel, 'Nasıl bir ekran?', `
        <div class="kn-tablo">
          ${satir('Ekran türü', k.tur)}
          ${satir('Kayıt ölçeği', olcek)}
          ${satir('Kalıp', kl ? kl.ad : 'Basit liste')}
          ${ayrinti ? satir('Ayrıntılar', ayrinti) : ''}
          ${satir('Aynı kaydı yazan', k.ayniKayit || 'Yok')}
        </div>`)
    + bolum(3, ICON.katman, 'Neler yazılacak?', alanlar.length ? `
        <div class="kn-tablo alan">
          <div class="kn-s bas">
            <span>Alan adı</span><span>Türü</span><span>Zorunlu</span><span>Seçenekler</span>
          </div>
          ${alanlar.map(x => `
            <div class="kn-s">
              <span><b>${esc(x.ad)}</b></span>
              <span>${esc(x.tur || '')}</span>
              <span class="kn-z">${x.zorunlu ? svg(ICON.tik, 13) : '–'}</span>
              <span>${esc((x.degerler || []).filter(Boolean).join(', ') || (x.kaynak || '–'))}</span>
            </div>`).join('')}
        </div>` : `<p class="kn-metin">Henüz alan yazılmadı.</p>`)
    + bolum(4, ICON.etiket, 'Farklı mı?',
        `<p class="kn-metin">${esc(((k.fark || {}).kural || '').trim()
          || 'Hayır, modülün ortak kuralı geçerli.')}</p>`)
    + `</div>`;
}
/* Ağaçta bir kat yukarı: dal → sayfa → modül → firma. */
function yapiGeri(t, projeId) {
  if (t.mod === 'anlat') {
    /* Anlattan vazgeçildi. Hiç bölüm yoksa gösterecek harita da yok —
       aşamadan tamamen çık. Bir bölüm varsa ona, ikiden fazlaysa haritaya
       dön; "yarım kalan yeni bölüm" denemesi hiçbirini bozmasın. */
    const gercek = DB.modulleri(projeId).filter(m => m.ad !== GENEL_MODUL);
    if (!gercek.length) return false;
    t.mod = 'agac';
    if (gercek.length === 1) modulYukle(DB.proje(projeId), t, gercek[0].ad);
    else t.modul = '';
    return true;
  }
  if (t.mod === 'mkural') { t.mod = 'agac'; t.dal = null; return true; }
  if (t.mod === 'onizle') { t.mod = 'agac'; return true; }
  if (t.dal)   { t.dal = null; return true; }
  if (t.odak)  { t.odak = null; return true; }
  if (t.modul) {
    /* Tek modül varken haritayı göstermenin anlamı yok — kullanıcı zaten
       "hangi modül" diye bir seçim yapmadı, göstersek de yapmayacak. */
    const cokMi = DB.modulleri(projeId).filter(m => m.ad !== GENEL_MODUL).length > 1;
    t.modul = ''; t.sayfalar = []; t.kunye = {};
    return cokMi;
  }
  return false;
}

/* Sayfanın önizlemesi kendi ekranında. Künye satırlarının altına küçük bir
   kutu olarak koymak yerine tam ekran: müşteriye gösterirken telefonu
   uzatabilmek lazım, minik kutuda hiçbir şey okunmuyor. */
function onizlemeEkrani(p, t) {
  const sayfa = t.odak;
  const k     = yapiKunye(t, sayfa);
  const tp    = SAYFA_TURU.find(x => x.ad === k.tur);

  ONIZLEME_MENU  = t.modul ? [t.modul, 'Rapor', 'Ayar'] : null;
  ONIZLEME_SAYFA = t.sayfalar.length ? t.sayfalar : null;
  ONIZLEME_EKRAN = tp ? tp.ekran : 'liste';
  ONIZLEME_ADIM  = 'kunye';
  ONIZLEME_KUNYE = (k.tur || (k.alanlar || []).length)
    ? Object.assign({ sayfa }, k) : null;

  const tel = ONIZLEME_CIHAZ === 'telefon';
  const govde = agacBaslik('#4fa8c9', ICON.goz, t.modul, sayfa,
                           tp ? tp.ad : '—', 'ekran')
    + `<div class="onz-cihaz">
        ${['web', 'telefon'].map(c => `
          <button class="onz-c ${ONIZLEME_CIHAZ === c ? 'sec' : ''}" type="button"
                  data-eylem="onizle-cihaz" data-proje="${p.id}" data-deger="${c}"
            >${c === 'web' ? 'Bilgisayar' : 'Telefon'}</button>`).join('')}
      </div>`
    + (ONIZLEME_KUNYE
        ? `<div class="onz-tam ${tel ? 'telefon' : ''}"><div class="onz-goz">
            ${onizlemeIc(p, p.palet)}</div></div>
           ${(k.alanlar || []).length ? '' :
             '<p class="dz-ipucu">Sütunlar örnek — alanları girince kendi adların gelir</p>'}`
        : `<div class="dz-onizleme bos"><span class="dz-bos">${svg(ICON.katman, 20)}
            <i>Önce ekranın türünü ya da alanlarını gir — önizleme o zaman canlanır.</i>
          </span></div>`);

  return agacKabuk(p, yolCipleri([{ ad: p.firma }, { ad: t.modul }, { ad: sayfa }]),
                   govde, '');
}

/* Anlat: önizleme yok, yalnız metin ve iki düğme. Modül adı hiç sorulmuyor —
   Claude soru-cevabın sonunda kendi karar veriyor: tek bölüm mü yeter, yoksa
   gerçekten ayrı iki alan mı var. Studio yalnız gelen bloğu kuruyor. */
function anlatEkrani(p, t, d) {
  const metin = t.anlat || '';
  const dolu  = metin.trim().length > 20;
  const moduller = DB.modulleri(p.id).filter(m => m.ad !== GENEL_MODUL);
  const sayfaSayisi = moduller.reduce((n, m) => n + DB.sayfalari(m.id).length, 0);

  /* Öteki aşamalarla aynı dil: numaralı iki kart. Birincisi ne istediğini
     yazdırıp promptu veriyor, ikincisi Claude'un cevabını alıp yapıyı
     kuruyor. Modül ağacı ikinci adımdan sonra açılıyor. */
  const kart1 = `
    <div class="bgz-s acik">
      <span class="bgz-no">1</span>
      <div class="bgz-kart">
        <div class="bgz-bas sabit">
          <span class="bgz-yz">
            <b>Ne yapmak istediğini yaz</b>
            <i>Hangi ekranlar, hangi özellikler olsun?</i>
          </span>
          <span class="bgz-durum ${dolu ? 'tamam' : ''}">${
            dolu ? svg(ICON.tik, 14) : 'Şimdi'}</span>
        </div>
        <div class="bgz-ic">
          <textarea class="anl-kutu" data-anlat="${p.id}" maxlength="2000"
            placeholder="Örn. Bir muhasebe programı istiyorum. Hesaplar sayfası olacak. 100-Kasa, 102-Banka gibi ana hesaplar, altlarında 102.01 gibi alt hesaplar…">${esc(metin)}</textarea>
          <span class="anl-say mono" id="anlat-say">${metin.length} / 2000</span>
          ${dolu
            ? `<a class="sayfa-dug" target="_blank" rel="noopener"
                 data-pano="cozumleme" data-proje="${p.id}" data-hedef="Claude Code"
                 href="${esc(claudeAdresi(depoSlug(p.repo)))}">
                ${svg(ICON.kopya, 15)} Prompt oluştur ve Claude'u aç</a>`
            : `<button class="sayfa-dug" type="button" disabled>
                ${svg(ICON.kopya, 15)} Prompt oluştur</button>`}
        </div>
      </div>
    </div>`;

  const kart2 = `
    <div class="bgz-s son ${dolu ? 'acik' : ''}">
      <span class="bgz-no">2</span>
      <div class="bgz-kart">
        <div class="bgz-bas sabit">
          <span class="bgz-yz">
            <b>Yapıyı kur</b>
            <i>Claude'un verdiği blok panodayken bas.</i>
          </span>
          <span class="bgz-durum">${dolu ? 'Şimdi' : 'Bekliyor'}</span>
        </div>
        <div class="bgz-ic">
          ${dolu
            ? `<button class="sayfa-dug" type="button" data-eylem="yapi-kur-pano" data-proje="${p.id}">
                ${svg(ICON.ice, 15)} Yapıyı kur</button>`
            : `<div class="bgz-bos">
                <span class="bgz-bos-ik">${svg(ICON.dokuman, 20)}</span>
                <span class="bgz-bos-yz">
                  <b>Önce bir prompt oluştur.</b>
                  <i>Claude'un vereceği blok burada kurulacak.</i>
                </span>
              </div>`}
        </div>
      </div>
    </div>`;

  /* Kurulu yapıya bakmak için tek kapı: modül sayısı burada da görünüyor
     ki kullanıcı bir şeyin kurulu olduğunu ekrandan anlasın. */
  const incele = `
    <button class="md-is" type="button" data-eylem="yapi-moduller" data-proje="${p.id}">
      <span class="md-is-ik">${svg(ICON.izgaraDort, 18)}</span>
      <span class="md-yz">
        <b>Modülleri incele</b>
        <i>${moduller.length
          ? `${moduller.length} modül · ${sayfaSayisi} sayfa`
          : 'Henüz kurulu bir modül yok.'}</i>
      </span>
      <span class="md-ok">${svg(ICON.chevron, 15)}</span>
    </button>`;

  /* Modül kurulduysa aşama bitti: iki kart "şimdi/bekliyor" diye açık
     kalmasın. Yeni bir bölüm anlatmak isteyen yeşil şeritteki düğmeyle
     kartları geri açıyor. */
  if (moduller.length && !durakDuzenlemede(p, 'yapi')) {
    return `<div class="fb-govde">`
      + adimBasligi(p, d, '2/2')
      + fmTamamBar(p, 'yapi', 'Programın yapısı kuruldu.', false)
      + incele
      + yapiGuncellemeIsleri(p)
      + `</div>`;
  }

  return `<div class="fb-govde">`
    + adimBasligi(p, d, (dolu ? 1 : 0) + '/2')
    + `<div class="bgz">${kart1}${kart2}</div>`
    + `<div class="md-ayrac"></div>`
    + incele
    + `</div>`;
}
/* Önizleme ancak gösterecek bir şey varken çizilir. Boşken uydurma veri
   göstermek yerine ne yapılması gerektiğini söylüyoruz. */
function onizlemeAlani(p, k, dal, gost) {
  if (!gost) return '';
  const eksik =
      !k.tur ? 'Önce ekranın türünü seç — önizleme o zaman canlanır.'
    : dal === 'alanlar' && !(k.alanlar || []).length
        ? 'Alan ekle: her alan tabloda bir sütun olur, önizlemede görürsün.'
    : '';
  if (eksik) return `<div class="dz-onizleme bos">
    <span class="dz-bos">${svg(ICON.katman, 20)}<i>${esc(eksik)}</i></span></div>`;
  return `<div class="dz-onizleme"><div class="onz-goz">
    ${onizlemeIc(p, p.palet)}</div></div>
    ${(k.alanlar || []).length ? '' :
      '<p class="dz-ipucu">Sütunlar örnek — alanları girince kendi adların gelir</p>'}`;
}

/* Düzenleme: dalın kendi ekranı — üstte önizleme, altta düzenleyici. */
function duzenEkrani(p, t) {
  if (t.mod === 'mkural') return modulKuralEkrani(p, t);
  const sayfa  = t.odak;
  const k      = yapiKunye(t, sayfa);
  const dallar = kunyeAdimlari();
  const dal    = dallar.find(a => a.anahtar === t.dal) || dallar[0];
  const gost   = ['ekran', 'alanlar'].includes(t.dal);

  const tp = SAYFA_TURU.find(x => x.ad === k.tur);
  const yapisal = ['agac', 'bakiye', 'bacak', 'satir', 'sutun', 'stok', 'takvim']
    .some(x => (k.kalip || []).includes(x));
  ONIZLEME_MENU  = t.modul ? [t.modul, 'Rapor', 'Ayar'] : null;
  ONIZLEME_SAYFA = t.sayfalar.length ? t.sayfalar : null;
  ONIZLEME_EKRAN = (t.dal === 'kalip' && yapisal) ? 'liste' : (tp ? tp.ekran : 'liste');
  ONIZLEME_ADIM  = 'kunye';
  ONIZLEME_CIHAZ = 'web';
  ONIZLEME_KUNYE = (k.tur || (k.alanlar || []).length)
    ? Object.assign({ sayfa }, k) : null;

  const i = dallar.findIndex(a => a.anahtar === t.dal);
  const sonraki = dallar[i + 1];

  const govde = `
    <div class="dz-bas" style="--dr:${DAL_RENK[t.dal] || '#8d8378'}">
      <span class="dz-rk"></span>
      <span class="dz-yaz"><b>${esc(dal.ad)}</b><i>${esc(dal.soru || '')}</i></span>
    </div>
    <div class="dz-onz">${onizlemeAlani(p, k, t.dal, gost)}</div>
    <div class="dz-govde">${kunyeGovde(p, t, { tur: 'kunye', sayfa, alt: t.dal })}</div>`;

  const dugmeler = sonraki
    ? `<button class="ag-dug geri" type="button" data-eylem="agac-sayfaya" data-proje="${p.id}">
         ${svg(ICON.chevron, 14)} Ağaç</button>
       <button class="ag-dug guclu" type="button" data-eylem="agac-dal" data-proje="${p.id}"
               data-sayfa="${esc(sayfa)}" data-ad="${sonraki.anahtar}">
         Sıradaki: ${esc(sonraki.ad)} ${svg(ICON.chevron, 14)}</button>`
    : `<button class="ag-dug guclu tek geri" type="button" data-eylem="agac-sayfaya"
               data-proje="${p.id}">${svg(ICON.tik, 14)} Bitti, ağaca dön</button>`;

  return agacKabuk(p, yolCipleri([
    { ad: t.modul, eylem: 'agac-koke', proje: p.id },
    { ad: sayfa, eylem: 'agac-sayfaya', proje: p.id },
    { ad: dal.ad },
  ]), govde, dugmeler);
}

/* Sohbet baloncuğu: soruyu soran ve niye sorduğunu söyleyen satır. */
function balon(metin, alt) {
  return `<div class="sohbet"><span class="av">N</span><span class="bal">${metin}
    ${alt ? `<i>${alt}</i>` : ''}</span></div>`;
}

/* ---- Künyenin alt adımları: üç soru + farklı mı ---- */
function kunyeGovde(p, t, adim) {
  const k    = yapiKunye(t, adim.sayfa);
  const sf   = adim.sayfa;
  const veri = `data-proje="${p.id}" data-sayfa="${esc(sf)}"`;

  if (adim.alt === 'amac') {
    const ornek = ['Günlük kayıtlar buradan görülür.',
                   'Yeni kayıt buradan girilir.',
                   'Tek kaydın bütün bilgileri burada.'];
    return `<div class="kunye-kaydir">
      ${balon('<em>' + esc(sf) + '</em> ne işe yarıyor? Kendi cümlenle söyle.')}
      <label class="field ky-alan">
        <input type="text" data-ky="amac" ${veri} value="${esc(k.amac)}"
               maxlength="160" autocomplete="off"
               placeholder="Örn. Günün siparişleri görülür ve masaya atanır.">
      </label>
      <div class="ky-bas">Örnekler</div>
      <div class="ornekler">${ornek.map(x => `
        <button type="button" data-eylem="yapi-ky-ornek" ${veri}
                data-ad="${esc(x)}">${esc(x)}</button>`).join('')}</div>
    </div>`;
  }

  /* Tür + büyüklük + kalıp tek ekranda. */
  if (adim.alt === 'ekran') {
    const secili = (k.kalip || [])[0] || '';
    return `<div class="kunye-kaydir">
      ${balon('Bu sayfa nasıl bir ekran olacak?', 'Seçtiğin şey üstte canlanır.')}
      <div class="raf">${SAYFA_TURU.map(x => `
        <button class="bsc ${k.tur === x.ad ? 'on' : ''}" type="button"
                data-eylem="yapi-ky-tur" ${veri} data-ad="${esc(x.ad)}"
                title="${esc(x.alt)}">
          <span class="bon"><span class="tel-wf">${telCizim(x.tel)}</span></span>
          <span class="bsc-ad">${esc(x.ad)}</span></button>`).join('')}
      </div>

      <div class="ky-bas">Kaç kayıt olur?</div>
      <div class="ky-cipler">${OLCEK.map(x => `
        <button class="cip-sec ${k.olcek === x.ad ? 'on' : ''}" type="button"
                data-eylem="yapi-ky-olcek" ${veri} data-ad="${esc(x.ad)}">
          ${esc(x.ad)} <em class="cs-alt">${esc(x.alt)}</em></button>`).join('')}
      </div>

      <div class="ky-bas">Özel bir yapısı var mı?</div>
      <p class="ak-ozet">Benziyorsa seç — yapıyı ben kurarım.</p>
      <div class="raf">${KALIP.map(kl => `
        <button class="bsc ${secili === kl.anahtar ? 'on' : ''}" type="button"
                data-eylem="yapi-ky-kalip" ${veri} data-ad="${kl.anahtar}">
          <span class="bon"><span class="tel-wf">${telCizim(kl.tel)}</span></span>
          <span class="bsc-ad">${esc(kl.ad)}</span></button>`).join('')}
      </div>
      ${secili ? kalipKarti(p, sf, k, secili, veri) : ''}

      <div class="ky-bas">Aynı kaydı başka bir sayfa da yazıyor mu?</div>
      <div class="ky-cipler">
        ${t.sayfalar.filter(x => x !== sf).map(x => `
          <button class="cip-sec ${k.ayniKayit === x ? 'on' : ''}" type="button"
                  data-eylem="yapi-ky-ayni" ${veri} data-ad="${esc(x)}">${esc(x)}</button>`).join('')}
        <button class="cip-sec ${k.ayniKayit ? '' : 'on'}" type="button"
                data-eylem="yapi-ky-ayni" ${veri} data-ad="">Kendi kaydı</button>
      </div>
    </div>`;
  }

  if (adim.alt === 'alanlar') {
    return `<div class="kunye-kaydir">
      ${balon('Bu sayfada her kayıtta hangi bilgiler tutulacak?',
              'Yazdığın her bilgi hem ekranda bir sütun hem veritabanında bir alan olur.')}
      ${k.alanlar.length ? '' : `<div class="bos-kutu">${svg(ICON.folder, 18)}
        <span>"Alan ekle" ile başla: adını yaz, türünü seç. Üstteki önizlemede
        anında görürsün.</span></div>`}
      ${k.alanlar.map((a, i) => alanKarti(p, sf, a, i)).join('')}
      <button class="as2 ekle" type="button" data-eylem="yapi-ky-alan-ekle" ${veri}>
        ${svg(ICON.arti, 13)} Alan ekle</button>
    </div>`;
  }

  /* Farklı mı: modül kuralından ayrılan yerler. Kimin görebileceği/
     yapabileceği artık burada sorulmuyor — o, deploy edilen uygulamanın
     kendi Yetkiler ekranından, admin tarafından, runtime'da yönetiliyor. */
  const mk = t.mk || {};
  const f  = k.fark || {};

  return `<div class="kunye-kaydir">
    ${balon('Bu sayfa modülün ortak kuralından ayrılıyor mu?',
            'Dokunmazsan modülün kuralı geçerli: ' + esc(modulOzeti(mk)) + '.')}

    <div class="ky-bas">Bu sayfada kural farklı mı?</div>
    <label class="field ky-alan">
      <input type="text" data-ky="farkKural" ${veri} value="${esc(f.kural || '')}"
             maxlength="200" autocomplete="off"
             placeholder="Boş bırak — modülün kuralı geçerli olsun">
    </label>
    ${farkVar(k) ? `<button class="as2 ekle" type="button"
        data-eylem="yapi-ky-fark-sil" ${veri}>
        ${svg(ICON.geriAl, 13)} Farkı kaldır, modül kuralına dön</button>` : ''}
  </div>`;
}

/* Seçilen kalıbın kendi soruları. */
function kalipKarti(p, sf, k, a, veri) {
  const kl = KALIP.find(x => x.anahtar === a);
  if (!kl) return '';
  return `<div class="alan-kart">
    <div class="ak-ust kalip"><b>${esc(kl.ad)}</b></div>
    <p class="ak-ozet">${esc(kl.ozet)} <i>${esc(kl.ornek)}</i></p>
    ${kl.sorular.map(sr => {
      const deger = (k.kalipCevap || {})[a + '.' + sr.anahtar];
      if (sr.tur === 'set') {
        const setler = setListesi(deger);
        return `<p class="ak-soru">${esc(sr.soru)}</p>
          ${setler.map((st, si) => `
            <div class="kset">
              <div class="kset-ust"><b>${esc(st.ad)}</b>
                <button type="button" data-eylem="yapi-ky-set-sil" ${veri}
                        data-ad="${a}.${sr.anahtar}" data-deger2="${si}"
                        title="Kaldır">${svg(ICON.kapat, 11)}</button></div>
              <div class="ak-degerler">
                ${st.alanlar.map(x => `<span data-eylem="yapi-ky-setalan-sil" ${veri}
                      data-ad="${a}.${sr.anahtar}" data-deger2="${si}"
                      data-deger3="${esc(x)}" role="button" tabindex="0">
                      ${esc(x)} <em>×</em></span>`).join('')}
                <span class="ekle" data-eylem="yapi-ky-setalan-ekle" ${veri}
                      data-ad="${a}.${sr.anahtar}" data-deger2="${si}"
                      role="button" tabindex="0">+ sütun</span>
              </div>
            </div>`).join('')}
          <button class="as2 ekle" type="button" data-eylem="yapi-ky-set-ekle"
                  ${veri} data-ad="${a}.${sr.anahtar}">
            ${svg(ICON.arti, 13)} Yer ekle</button>`;
      }
      if (sr.tur === 'liste') {
        const liste = deger || [];
        return `<p class="ak-soru">${esc(sr.soru)}</p>
          <div class="ak-degerler">
            ${liste.map(x => `<span data-eylem="yapi-ky-kset-sil" ${veri}
                  data-ad="${a}.${sr.anahtar}" data-deger2="${esc(x)}"
                  role="button" tabindex="0">${esc(x)} <em>×</em></span>`).join('')}
            <span class="ekle" data-eylem="yapi-ky-kset-ekle" ${veri}
                  data-ad="${a}.${sr.anahtar}" role="button" tabindex="0">+ ekle</span>
          </div>`;
      }
      return `<p class="ak-soru">${esc(sr.soru)}</p>
        <div class="ky-cipler">${sr.secim.map(x => `
          <button class="cip-sec ${deger === x ? 'on' : ''}" type="button"
                  data-eylem="yapi-ky-kcevap" ${veri}
                  data-ad="${a}.${sr.anahtar}" data-deger2="${esc(x)}">${esc(x)}</button>`).join('')}
        </div>`;
    }).join('')}
  </div>`;
}

/* Modül kuralları ekranı — üç soru, bir kez. */
function modulKuralEkrani(p, t) {
  const mk = t.mk || (t.mk = { kural: '' });
  const veri = `data-proje="${p.id}"`;

  const govde = `
    <div class="bslk"><b>Modül kuralları</b><em>her sayfada geçerli</em></div>

    <div class="ky-bas">Ortak kural</div>
    <label class="field ky-alan">
      <input type="text" data-mk="kural" ${veri} value="${esc(mk.kural || '')}"
             maxlength="200" autocomplete="off"
             placeholder="Örn. Onaylanan kayıt değiştirilemez.">
    </label>
    <p class="anl-not">Modülün bütün sayfalarında geçerli. Bir sayfa
      ayrılıyorsa o sayfanın "Farklı mı?" satırından yazarsın.</p>`;

  return agacKabuk(p, yolCipleri([
    { ad: t.modul, eylem: 'agac-koke', proje: p.id },
    { ad: 'Modül kuralları' },
  ]), `<div class="kunye-kaydir">${govde}</div>`, `
    <button class="ag-dug guclu tek geri" type="button" data-eylem="agac-sayfaya"
            data-proje="${p.id}">${svg(ICON.tik, 14)} Bitti, ağaca dön</button>`);
}

/* Alan kartı — türüne göre kendi sorusunu da soruyor. */
function alanKarti(p, sf, a, i) {
  const veri = `data-proje="${p.id}" data-sayfa="${esc(sf)}" data-deger="${i}"`;
  const secenek = a.tur === 'Seçenek';
  const iliski  = a.tur === 'İlişki';
  return `<div class="alan-kart ${secenek && !(a.degerler || []).length ? 'eksik' : ''}">
    <div class="ak-ust">
      <b>${esc(a.ad)}</b><u>${esc(a.tur)}</u>
      <button class="ak-sil" type="button" data-eylem="yapi-ky-alan-sil" ${veri}
              title="Kaldır">${svg(ICON.kapat, 11)}</button>
    </div>
    ${secenek ? `
      <p class="ak-soru">Hangi değerleri alabilir?</p>
      <div class="ak-degerler">
        ${(a.degerler || []).map((d, j) => `
          <span data-eylem="yapi-ky-deger-sil" ${veri} data-ad="${esc(d)}"
                role="button" tabindex="0">${esc(d)} <em>×</em></span>`).join('')}
        <span class="ekle" data-eylem="yapi-ky-deger-ekle" ${veri}
              role="button" tabindex="0">+ değer ekle</span>
      </div>` : ''}
    ${iliski ? `
      <p class="ak-soru">Hangi sayfadan seçilecek?</p>
      <div class="ak-degerler">
        ${a.kaynak ? `<span>${esc(a.kaynak)}</span>` : ''}
        <span class="ekle" data-eylem="yapi-ky-kaynak" ${veri}
              role="button" tabindex="0">${a.kaynak ? 'değiştir' : '+ sayfa seç'}</span>
      </div>` : ''}
    <button class="ak-anahtar ${a.zorunlu ? 'on' : ''}" type="button"
            data-eylem="yapi-ky-zorunlu" ${veri}>
      <span></span> Boş bırakılamaz</button>
  </div>`;
}

function tabloAdi(sf) {
  return sutunAdi(sf).replace(/_(listesi|olustur|detayi|paneli|ekrani)$/, '') || 'kayitlar';
}

/* Türkçe adı veritabanı adına çevirir: "Sipariş Listesi" → "siparis_listesi" */
function sutunAdi(ad) {
  const harf = { 'ç': 'c', 'ğ': 'g', 'ı': 'i', 'ö': 'o', 'ş': 's', 'ü': 'u',
                 'Ç': 'c', 'Ğ': 'g', 'İ': 'i', 'Ö': 'o', 'Ş': 's', 'Ü': 'u' };
  return String(ad || '').split('').map(c => harf[c] || c).join('')
    .toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '');
}

/* Künyedeki yazı alanları: her tuşta yeniden çizersek imleç kaçar.
   Değer taslağa yazılır, ekran olduğu gibi kalır. */
function yapiBaglari() {
  const mkKural = $('[data-mk="kural"]');
  if (mkKural && !mkKural.dataset.bagli) {
    mkKural.dataset.bagli = '1';
    mkKural.addEventListener('input', () => {
      const pr = DB.proje(mkKural.dataset.proje);
      if (pr) yapiTaslak(pr).mk.kural = mkKural.value;
    });
  }
  const anlat = $('[data-anlat]');
  if (anlat && !anlat.dataset.bagli) {
    anlat.dataset.bagli = '1';
    anlat.addEventListener('input', () => {
      const pr = DB.proje(anlat.dataset.anlat);
      if (!pr) return;
      yapiTaslak(pr).anlat = anlat.value;
      const say = $('#anlat-say');
      if (say) say.textContent = anlat.value.length + ' / 2000';
      /* Düğme artık gerçek bir bağlantı; açık/kapalı hâli çizimde belirleniyor.
         Eşiği geçtiğimiz anda bir kez yeniden çiziyoruz, her tuşta değil. */
      const acik = anlat.value.trim().length > 20;
      if (acik !== !!$('[data-pano="cozumleme"]')) {
        const yer = anlat.selectionStart;
        render();
        const yeni = $('[data-anlat]');
        if (yeni) { yeni.focus(); try { yeni.setSelectionRange(yer, yer); } catch (h) {} }
      }
    });
  }
  /* Beta ve geliştirme'deki "anlat" kutusu — aynı imleç-koruma mantığı. */
  const betaIstek = $('[data-beta-istek]');
  if (betaIstek && !betaIstek.dataset.bagli) {
    betaIstek.dataset.bagli = '1';
    betaIstek.addEventListener('input', () => {
      const projeId = betaIstek.dataset.betaIstek;
      BETA_ISTEK[projeId] = betaIstek.value;
      const acik = betaIstek.value.trim().length > 20;
      if (acik !== !!$('[data-pano="betaIstek"]')) {
        const yer = betaIstek.selectionStart;
        render();
        const yeni = $('[data-beta-istek]');
        if (yeni) { yeni.focus(); try { yeni.setSelectionRange(yer, yer); } catch (h) {} }
      }
    });
  }
  /* Geliştirme durağındaki güncelleme kutusu — aynı imleç-koruma mantığı. */
  const guncellemeIstek = $('[data-guncelleme-istek]');
  if (guncellemeIstek && !guncellemeIstek.dataset.bagli) {
    guncellemeIstek.dataset.bagli = '1';
    guncellemeIstek.addEventListener('input', () => {
      const projeId = guncellemeIstek.dataset.guncellemeIstek;
      GUNCELLEME_ISTEK[projeId] = guncellemeIstek.value;
      const acik = guncellemeIstek.value.trim().length > 20;
      if (acik !== !!$('[data-pano="guncellemeIstek"]')) {
        const yer = guncellemeIstek.selectionStart;
        render();
        const yeni = $('[data-guncelleme-istek]');
        if (yeni) { yeni.focus(); try { yeni.setSelectionRange(yer, yer); } catch (h) {} }
      }
    });
  }
  /* Test ve Güncelle durağındaki kutu — aynı imleç-koruma mantığı. */
  const denemeIstek = $('[data-deneme-istek]');
  if (denemeIstek && !denemeIstek.dataset.bagli) {
    denemeIstek.dataset.bagli = '1';
    denemeIstek.addEventListener('input', () => {
      const projeId = denemeIstek.dataset.denemeIstek;
      DENEME_ISTEK[projeId] = denemeIstek.value;
      const acik = denemeIstek.value.trim().length > 20;
      if (acik !== !!$('[data-pano="denemeIstek"]')) {
        const yer = denemeIstek.selectionStart;
        render();
        const yeni = $('[data-deneme-istek]');
        if (yeni) { yeni.focus(); try { yeni.setSelectionRange(yer, yer); } catch (h) {} }
      }
    });
  }
  /* Yetkilendirme kutuları: yazarken sayaç canlı, odak çıkınca kaydediliyor
     — ayrı bir "Kaydet" düğmesi yoktu, yazıp geçilen satır kaybolurdu. */
  $$('[data-yk-gorev]').forEach(el => {
    if (el.dataset.bagli) return;
    el.dataset.bagli = '1';
    const say = $(`[data-yk-say="${el.dataset.ykGorev.replace(/"/g, '\\"')}"]`);
    el.addEventListener('input', () => {
      if (say) say.textContent = el.value.length + ' karakter';
    });
    el.addEventListener('change', () => {
      const pr = DB.proje(el.dataset.proje);
      if (!pr) return;
      const pl = pr.palet || {};
      const eski = String((pl.rolGorev || {})[el.dataset.ykGorev] || '');
      if (eski === el.value.trim()) return;
      const rolGorev = Object.assign({}, pl.rolGorev || {});
      rolGorev[el.dataset.ykGorev] = el.value.trim();
      isYap(() => DB.paletKaydet(pr.id, Object.assign({}, pl, { rolGorev })));
    });
  });

  $$('[data-ky]').forEach(el => {
    if (el.dataset.bagli) return;
    el.dataset.bagli = '1';
    el.addEventListener('input', () => {
      const pr = DB.proje(el.dataset.proje);
      if (!pr) return;
      const t = yapiTaslak(pr);
      if (el.dataset.ky === 'farkKural') {
        const k = yapiKunye(t, el.dataset.sayfa);
        k.fark = k.fark || { kural: '' };
        k.fark.kural = el.value;
      } else {
        yapiKunye(t, el.dataset.sayfa)[el.dataset.ky] = el.value;
      }
      yapiIleriTazele(pr);
    });
  });
}

/* Çipe basınca bütün sayfayı yeniden çizmiyoruz: kaydırma yerinden
   oynuyor, ray da baştan kayıyordu. Yalnız önizleme tazelenir. */
function yapiOnizlemeTazele(pr) {
  const t = yapiTaslak(pr);
  if (!t.odak || !t.dal) return;
  const k  = yapiKunye(t, t.odak);
  const tp = SAYFA_TURU.find(x => x.ad === k.tur);
  const yapisal = ['agac', 'bakiye', 'bacak', 'satir', 'sutun', 'stok', 'takvim']
    .some(x => (k.kalip || []).includes(x));
  ONIZLEME_EKRAN = (t.dal === 'kalip' && yapisal) ? 'liste' : (tp ? tp.ekran : 'liste');
  ONIZLEME_KUNYE = (k.tur || (k.alanlar || []).length)
    ? Object.assign({ sayfa: t.odak }, k) : null;
  /* Bütün alanı yeniden kuruyoruz: yer tutucudan uygulamaya (ya da tersine)
     geçiş yalnız içeriği tazeleyince olmuyordu. */
  const kutu = $('.dz-onz');
  if (!kutu) return;
  const gost = ['tur', 'alanlar', 'eylemler', 'kalip', 'kural'].includes(t.dal);
  kutu.innerHTML = onizlemeAlani(pr, k, t.dal, gost);
  logolariGoster();
  onizlemeSigdir();
}

/* Yol izi uzayınca bulunduğun basamak ekrandan çıkıyordu. */
function yolIziKaydir() {
  const yol = $('.dk-yol');
  if (!yol || yol.scrollWidth <= yol.clientWidth) return;
  requestAnimationFrame(() => {
    yol.scrollTo({ left: yol.scrollWidth, behavior: 'smooth' });
  });
}

/* Dal düğümünün özeti ve durumu anında güncellensin. */
function yapiIleriTazele(pr) {
  const t = yapiTaslak(pr);
  if (!t.odak || !t.dal) return;
  const k = yapiKunye(t, t.odak);
  const dug = $(`.dal2 .d[data-ad="${t.dal}"]`);
  if (!dug) return;
  const durum = !kunyeAdimTam(k, t.dal) ? 'eksik'
    : (t.dal === 'fark' && !farkVar(k)) ? 'bos' : 'tamam';
  dug.classList.remove('eksik', 'tamam', 'bos');
  dug.classList.add(durum);
  const alt = $('.yz i', dug);
  if (alt) alt.textContent = dalOzeti(k, t.dal);
}


/* Yeni sekmede aç. Üçüncü argüman (windowFeatures) verilirse Safari bunu
   "popup pencere" talebi sayıp engelliyor; _blank zaten noopener demek.
   Dış http adresleri için bunu kullanma — gerçek <a target="_blank"> yaz;
   iOS'ta ana ekrandan açılan uygulamada window.open sessizce çalışmıyor. */
function disariAc(url) {
  window.open(url, '_blank');
}

/* Türkçe harfleri ASCII'ye indirir — GitHub depo adı ASCII ister. */
function asciiye(metin) {
  const tr = { 'ç':'c','Ç':'C','ğ':'g','Ğ':'G','ı':'i','İ':'I',
               'ö':'o','Ö':'O','ş':'s','Ş':'S','ü':'u','Ü':'U' };
  return String(metin || '').replace(/[çÇğĞıİöÖşŞüÜ]/g, x => tr[x]);
}

/* Depo adı: firma tamamen büyük ve bitişik, modül her kelimenin ilk harfi
   büyük ve bitişik, aralarında tek tire.
   "Nizam Soft" + "Kişisel Bütçe" → "NIZAMSOFT-KisiselButce" */
function depoAdi(p) {
  const kelimeler = ad => asciiye(ad).split(/[^A-Za-z0-9]+/).filter(Boolean);
  const firma = kelimeler(p && p.firma).join('').toUpperCase();
  const modul = kelimeler(modulAdi(p))
    .map(k => k[0].toUpperCase() + k.slice(1).toLowerCase()).join('');
  return [firma, modul].filter(Boolean).join('-').slice(0, 80) || 'YeniProje';
}

/* Kaydedilen depo adresinden GitHub owner/repo çıkarır.
   "github.com/nizamsoft/NIZAMSOFT-KisiselButce" → "nizamsoft/NIZAMSOFT-KisiselButce"
   Adres eksik ya da tanınmıyorsa boş döner. */
function depoSlug(repo) {
  const m = String(repo || '').trim()
    .replace(/^https?:\/\//, '').replace(/^www\./, '')
    .replace(/^github\.com\//, '').replace(/\.git$/, '').replace(/\/+$/, '')
    .match(/^([A-Za-z0-9._-]+)\/([A-Za-z0-9._-]+)$/);
  return m ? m[1] + '/' + m[2] : '';
}

/* GitHub kullanıcı/organizasyon adı. Depo adını zaten biz üretiyoruz;
   eksik olan tek parça sahibi. Bir kez öğrenip hatırlıyoruz — gizli bir
   şey değil, herkese açık bir ad. */
/* Kök alan adı ayarda bir kere yazılıyor: her projede tekrar sormak yerine
   alt alanı firma adından türetiyoruz. Depo sahibiyle aynı mantık. */
const KOK_ALAN_ANAHTAR = 'ns.kokAlan';

function kokAlan() {
  try { return localStorage.getItem(KOK_ALAN_ANAHTAR) || ''; }
  catch (h) { return ''; }
}

function kokAlanYaz(deger) {
  const temiz = String(deger || '').trim().toLowerCase()
    .replace(/^https?:\/\//, '').replace(/^www\./, '').replace(/\/.*$/, '');
  try {
    if (temiz) localStorage.setItem(KOK_ALAN_ANAHTAR, temiz);
    else localStorage.removeItem(KOK_ALAN_ANAHTAR);
  } catch (h) { /* önemsiz */ }
}

/* Supabase organizasyon kodu ayarda bir kere yazılıyor — yazılmazsa
   "Supabase'de proje aç" düğmesi Supabase'in genel /new adresine gider ve
   Supabase önce "yeni organizasyon kur" diye sorar. Kod yazılınca doğrudan
   o organizasyonun içinde proje açma ekranına düşüyor. Kök alan adıyla
   aynı mantık: depoSahibi/kokAlan gibi bir kere sorulur, hep hatırlanır. */
const SUPABASE_ORG_ANAHTAR = 'ns.supabaseOrg';

function supabaseOrg() {
  try { return localStorage.getItem(SUPABASE_ORG_ANAHTAR) || ''; }
  catch (h) { return ''; }
}

function supabaseOrgYaz(deger) {
  const temiz = String(deger || '').trim();
  try {
    if (temiz) localStorage.setItem(SUPABASE_ORG_ANAHTAR, temiz);
    else localStorage.removeItem(SUPABASE_ORG_ANAHTAR);
  } catch (h) { /* önemsiz */ }
}

/* Şablon türü → template proje id eşlemesi. Her türe en fazla bir template
   atanabiliyor (bkz. Ayarlar > Templateler); "Bir Template'ten Başla" akışı
   artık hangi template olduğunu tek tek sormuyor, buradan okuyor. */
/* Şablon kopyasının hangi şablon türünden geldiği — Temel tanımlar'daki
   "öğrenen liste" (bkz. sablonSecenekleri) bu türe göre paylaşılıyor: bir
   müşteride öğrenilen banka/fatura/POS formatı, aynı türden başka her
   müşteride hazır seçenek olarak çıkıyor. */
function sablonProjeTuru(p) {
  return paketAnahtari(p);
}

/* Öğrenen seçenekler: bir şablon türü + kategori (banka/fatura/gunsonu)
   için, herhangi bir müşteride bir kez anlatılmış format tarifleri.
   localStorage'da tutuluyor — paket atamasıyla aynı gerekçe: yeni bir
   Supabase tablosu, kullanıcının canlı projesine SQL migration'ı elle
   çalıştırmasını gerektirir, test sırasında gereksiz sürtünme olur. */
const SABLON_SECENEK_ANAHTAR = 'ns.sablonSecenekleri';
function sablonSecenekHepsi() {
  try { return JSON.parse(localStorage.getItem(SABLON_SECENEK_ANAHTAR) || '{}') || {}; }
  catch (h) { return {}; }
}
function sablonSecenekYazHepsi(hepsi) {
  try { localStorage.setItem(SABLON_SECENEK_ANAHTAR, JSON.stringify(hepsi)); }
  catch (h) { /* önemsiz */ }
}
function sablonSecenekleri(tur, kategori) {
  if (!tur) return [];
  return ((sablonSecenekHepsi()[tur] || {})[kategori] || []);
}
function sablonSecenekEkle(tur, kategori, ad, tarif) {
  const adTrim = (ad || '').trim();
  if (!tur || !adTrim || !(tarif || '').trim()) return;
  const hepsi = sablonSecenekHepsi();
  hepsi[tur] = hepsi[tur] || {};
  const liste = (hepsi[tur][kategori] || []).slice();
  const id = asciiye(adTrim).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || 'secenek';
  const i = liste.findIndex(x => x.id === id);
  const kayit = { id, ad: adTrim, tarif: tarif.trim() };
  if (i > -1) liste[i] = kayit; else liste.push(kayit);
  hepsi[tur][kategori] = liste;
  sablonSecenekYazHepsi(hepsi);
}

/* Projenin alt alanı. Firma adının tamamı uzun ve okunmaz çıkıyor
   ("merkezefendikoftecisi"); ilk iki kelime hem ayırt edici hem kısa. */
function altAlan(p) {
  const kelimeler = asciiye(p && p.firma).split(/[^A-Za-z0-9]+/).filter(Boolean);
  return kelimeler.slice(0, 2).join('').toLowerCase().slice(0, 30);
}

/* Önerilen tam adres. Kök alan adı yazılmamışsa boş döner — o zaman
   kullanıcıyı Ayarlar'a yolluyoruz. */
function onerilenAlanAdi(p) {
  const kok = kokAlan();
  const alt = altAlan(p);
  return kok && alt ? alt + '.' + kok : '';
}

const DEPO_SAHIBI_ANAHTAR = 'ns.depoSahibi';

function depoSahibi() {
  try {
    const kayit = localStorage.getItem(DEPO_SAHIBI_ANAHTAR);
    if (kayit) return kayit;
  } catch (h) { /* gizli sekmede localStorage kapalı olabilir */ }
  /* Hiç kaydedilmemişse en son adres girilen projeden öğren. */
  const v = DB.projeler.map(x => depoSlug(x.repo)).filter(Boolean).pop();
  return v ? v.split('/')[0] : '';
}

function depoSahibiYaz(slug) {
  const sahip = String(slug || '').split('/')[0];
  if (!sahip) return;
  try { localStorage.setItem(DEPO_SAHIBI_ANAHTAR, sahip); } catch (h) { /* önemsiz */ }
}

/* "GitHub'da aç"a dokunulan projeler. Kullanıcı dönünce adresi kendimiz
   yazıyoruz — depo adı bizden çıktığı için tahmin değil. */
const DEPO_BEKLIYOR = {};

/* GitHub Pages'in bu depo için üreteceği adres.
   "nizamsoft/NIZAMSOFT-KisiselButce" → "nizamsoft.github.io/NIZAMSOFT-KisiselButce" */
function pagesAdresi(p) {
  const slug = depoSlug(p && p.repo);
  if (!slug) return '';
  const [sahip, depo] = slug.split('/');
  return sahip.toLowerCase() + '.github.io/' + depo;
}

/* "Pages'i aç"a dokunulan projeler — dönünce adresi kendimiz yazıyoruz. */
const PAGES_BEKLIYOR = {};

/* "Template repository ayarını açayım"a dokunulan kopya kaynakları —
   dönünce ayarı açtığını varsaymıyoruz, templateDonusOnaySor ile aynı
   soruyu bir daha soruyoruz. Anahtar kaynak proje id'si, değer o an
   seçili tur ve şablon ('gercek'/'test', 'muhasebe'/null). */
const TEMPLATE_BEKLIYOR = {};

async function yayinAdresiTamamla(p) {
  const adres = pagesAdresi(p);
  if (!adres) return;
  await isYap(() => DB.paletKaydet(p.id,
    Object.assign({}, p.palet || {}, { alanAdi: adres })),
    'Yayın adresi yazıldı: ' + adres);
}

/* Kullanıcı "Yayında, devam et" deyince — GitHub Pages'in kendisi otomatik
   algılanamıyor, bu yüzden buraya kadar bekletiliyor. Namecheap seçiliyse
   adres oradan gelecek, burada yalnız "yayinda" işaretleniyor. */
async function pagesBaglandiOnayla(p) {
  const pl = p.palet || {};
  if (!pl.alanAdi && pl.alanTuru !== 'namecheap') return yayinAdresiTamamla(p);
  if (!pl.yayinda) {
    return isYap(() => DB.paletKaydet(p.id,
      Object.assign({}, pl, { yayinda: true })), 'Yayın onaylandı.');
  }
}

/* GitHub'dan dönünce adresi yaz. Sahibi biliniyorsa doğrudan kaydediyoruz;
   bilinmiyorsa (ilk proje) bir kez soruyoruz ve bir daha sormuyoruz. */
async function depoAdresiTamamla(p) {
  let sahip = depoSahibi();
  if (!sahip) {
    sahip = await metinSor({
      baslik: 'GitHub kullanıcı adın',
      aciklama: 'Depo adresini kendimiz yazabilmek için bir kez soruyoruz.',
      yerTutucu: 'nizamsoft',
      buton: 'Kaydet',
    });
    if (!sahip) return;
    sahip = String(sahip).trim().replace(/^.*\//, '');
    depoSahibiYaz(sahip);
  }
  const adres = 'github.com/' + sahip + '/' + depoAdi(p);
  await isYap(() => DB.projeGuncelle(p.id, { repo: adres }),
    'Depo adresi yazıldı: ' + adres);
}

/* 5 · Beta ve geliştirme — iki bölüm.
   A) İlk kurulum: Kurulum ve yapı'da toplanan plan gerçek koda dönüşüyor —
      3. blok (plan depoya yazılır) + beş aşama (gerçek kod, sırayla). Bir
      sihirbaz olarak akıyor: kopyala, Claude'a yapıştır, bitince Studio'dan
      sıradakine geç. Tek seferlik.
   B) Sürekli geliştirme: ilk kurulum bitince ekran buna döner. Görev/aşama
      takibi yok — dene, eksik gördüğünü anlat, prompt oluştur, Claude'a
      yapıştır; yapıyı da etkiliyorsa döndüğü JSON'u yükle. */
/* İlk kurulum zinciri — Bağlantılar ve temel'deki kalıbın aynısı: adımlar
   tek sayfada alt alta, sıradaki kendiliğinden açık. Eskiden "Doldur"
   düğmesi tam ekran bir sihirbaz açıyordu; yedi adımı görmeden içeri
   girmek gerekiyordu. */
function betaKurulumOzeti(p, d, liste) {
  const biten  = liste.filter(k => kurulumSihirbazAdimBittiMi(k, p)).length;
  const sirada = liste.find(k => !kurulumSihirbazAdimBittiMi(k, p));
  const acik   = kurulumAcik(liste, sirada);

  const satirlar = liste.map((k, i) => {
    const tamam  = kurulumSihirbazAdimBittiMi(k, p);
    const acikMi = k === acik;
    const servis = k === 'sql' ? 'supabase' : 'claude';

    return `
      <div class="bgz-s ${tamam ? 'bitti' : acikMi ? 'acik' : ''} ${
        i === liste.length - 1 ? 'son' : ''}">
        <span class="bgz-no">${tamam ? svg(ICON.tik, 14) : i + 1}</span>
        <div class="bgz-kart">
          <button class="bgz-bas" type="button"
                  data-eylem="kurulum-ac" data-anahtar="${k}">
            <span class="bgz-logo">${servisIkon(servis, 22)}</span>
            <span class="bgz-yz">
              <b>${esc(kurulumSihirbazEtiket(k))}</b>
              <i>${esc(kurulumAdimAlt(k, p))}</i>
            </span>
            <span class="bgz-durum ${tamam ? 'tamam' : ''}">${
              tamam ? svg(ICON.tik, 14) : 'Bekliyor'}</span>
            <span class="bgz-ok ${acikMi ? 'acik' : ''}">${svg(ICON.chevron, 14)}</span>
          </button>
          ${acikMi ? `
            <div class="bgz-ic">
              <ol class="bgz-adimlar">
                ${kurulumYapilacaklar(k, p).map(x => `<li>${esc(x)}</li>`).join('')}
              </ol>
              ${kurulumGovdesi(k, p)}
            </div>` : ''}
        </div>
      </div>`;
  }).join('');

  return `<div class="fb-govde">`
    + adimBasligi(p, d, biten + '/' + liste.length)
    + `<p class="bgz-not">Yapı planlama'da hazırlanan plan burada gerçek koda
        dönüşüyor. <b>Adımlar sırayla ilerlenir.</b></p>`
    + `<div class="bgz">${satirlar}</div>`
    + `</div>`;
}

/* Şu an hangi adım açık: kullanıcı elle açtıysa o, kapattıysa hiçbiri,
   dokunmadıysa sıradaki. ('-' = kullanıcı açık kartı kapattı.) */
function kurulumAcik(liste, sirada) {
  if (ACIK_KURULUM === '-') return '';
  return (ACIK_KURULUM && liste.indexOf(ACIK_KURULUM) !== -1) ? ACIK_KURULUM : sirada;
}

/* Satır başlığının altındaki tek cümle — ne yapılacağını söylüyor. */
const KURULUM_ALT = {
  blok: 'Plan depoya yazılır.',
  sql:  'Tabloları kur.',
};
const KURULUM_ASAMA_ALT = [
  'Kabuk ve tema.',
  'Tablolar ve listeler.',
  'Ekle, düzenle, sil.',
  'Uç durumlar, ayarlar.',
  'Animasyon ve hız.',
];

/* Adımın içindeki kısa yapılacaklar listesi — bağlantı zincirindeki
   BAGLANTI_ADIMLARI'nın karşılığı. Beş kod aşamasında liste projeye göre
   değişiyor (rolsüz/sunucusuz projede bazı maddeler düşüyor), o yüzden
   sabit değil, hesaplanıyor. */
const KURULUM_YAPILACAK = {
  blok: ['Düğmeye basın: plan kopyalanır, Claude Code açılır.',
         'Claude dosyaları yazsın.',
         'Dönünce "Dosyalar yazıldı" diye işaretleyin.'],
  sql:  ['SQL dosyasını açıp metni kopyalayın.',
         'SQL editörünü açın, yapıştırın ve Run\'a basın.',
         'Tabloların geldiğini görün.',
         'Dönünce "Tabloları kurdum" diye işaretleyin.'],
};
function kurulumYapilacaklar(k, p) {
  if (KURULUM_YAPILACAK[k]) return KURULUM_YAPILACAK[k];
  const a = kurulumAdimListesi(p)[Number(k.slice(6))] || { yap: [], test: '' };
  return a.yap.concat('Bitince dene: ' + a.test);
}
function kurulumAdimAlt(k, p) {
  if (KURULUM_ALT[k]) return KURULUM_ALT[k];
  return KURULUM_ASAMA_ALT[Number(k.slice(6))] || '';
}

function kurulumGovdesi(k, p) {
  return k === 'blok' ? kurulumAdimBlokGovde(p)
    : k === 'sql'     ? kurulumAdimSqlGovde(p)
    : kurulumAdimAsamaGovde(p, Number(k.slice(6)));
}

/* Sürekli geliştirme: yayın adresine gir, dene, eksik gördüğünü anlat,
   prompt oluştur, Claude'a yapıştır. Yapıyı da etkiliyorsa Claude sonunda
   bir JSON bloğu verir — "Modülü güncelle" ile aynı yapıştırma yolunu
   (anlat-aktar) kullanıyor, ikisi de yalnız eksik olanı ekliyor. */
const BETA_ISTEK = {};

function betaGelistirmeEkrani(p, d) {
  const pl    = p.palet || {};
  const yayin = pl.alanAdi || '';
  const istek = BETA_ISTEK[p.id] || '';
  const dolu  = istek.trim().length > 20;

  /* 1 · Siteyi incele — kartın tamamı bağlantı, dokunan doğrudan siteye
     gidiyor; araya bir ekran girmiyor. */
  const site = yayin ? `
    <a class="btk" target="_blank" rel="noopener" href="https://${esc(yayin)}">
      <div class="btk-ust">
        <span class="btk-ik">${svg(ICON.disari, 22)}</span>
        <span class="btk-yz"><b>Siteyi incele</b>
          <i>Canlı siteyi açıp mevcut durumu incele.</i></span>
      </div>
      <span class="btk-adres">${svg(ICON.bulut, 15)}
        <b>${esc(yayin)}</b>${svg(ICON.disari, 15)}</span>
    </a>` : `
    <div class="bos-kutu">${svg(ICON.bulut, 18)}
      <span>Yayın adresi yok. <b>Bağlantılar ve temel</b> durağındaki
      <b>Yayın</b> adımını tamamla.</span></div>`;

  /* 2 · Güncelleme yap — ne istediğini yaz, prompt Claude'a gitsin. */
  const guncelle = `
    <div class="btk">
      <div class="btk-ust">
        <span class="btk-ik">${svg(ICON.kalem, 22)}</span>
        <span class="btk-yz"><b>Güncelleme yap</b>
          <i>Yapılacak değişikliği yaz, prompt oluştur ve Claude ile güncelleme yap.</i></span>
      </div>
      <textarea class="anl-kutu btk-yazi" data-beta-istek="${p.id}"
        placeholder="Yapılacak güncellemeyi detaylı şekilde yazın…">${esc(istek)}</textarea>
      ${dolu
        ? `<a class="sayfa-dug" target="_blank" rel="noopener" data-pano="betaIstek"
             data-proje="${p.id}" data-hedef="Claude Code"
             href="${esc(claudeAdresi(depoSlug(p.repo)))}">
             ${svg(ICON.yildiz, 15)} Prompt oluştur</a>`
        : `<button class="sayfa-dug" type="button" disabled>
             ${svg(ICON.yildiz, 15)} Prompt oluştur</button>`}
    </div>`;

  /* 3 · JSON yükle — Claude'un verdiği blok panodayken tek dokunuş yetiyor:
     düğme panoyu kendisi okuyup kuruyor, yapıştırma ekranı açılmıyor.
     Pano okunamazsa (tarayıcı izin vermezse) eski elle yapıştırma ekranına
     düşüyor — bkz. yapi-kur-pano. */
  const json = `
    <div class="btk">
      <div class="btk-ust">
        <span class="btk-ik">${svg(ICON.dosya, 22)}</span>
        <span class="btk-yz"><b>JSON yükle</b>
          <i>Claude yapıyı da değiştirdiyse verdiği bloğu kopyala, buraya bas.</i></span>
        <button class="btk-dug" type="button" data-eylem="yapi-kur-pano"
                data-proje="${p.id}">${svg(ICON.ice, 15)} JSON yükle</button>
      </div>
    </div>`;

  /* Bitince öteki duraklardaki yeşil "Bu adım tamamlandı" barı çıkıyor —
     küçük bir satır yazı, aşamanın bittiğini yeterince söylemiyordu.
     Kartlar kaybolmuyor: yayına çıkmış uygulama işaretlendikten sonra da
     güncelleniyor. */
  return `<div class="fb-govde">`
    + adimBasligi(p, d, '')
    + (pl.betaTamamlandi
        ? fmTamamBar(p, 'beta', 'Deneme ve geliştirme bitti.', false) : '')
    + site + guncelle + json
    + (pl.betaTamamlandi ? '' : `
      <button class="sayfa-dug bitir" type="button" data-eylem="beta-tamamlandi"
              data-proje="${p.id}">${svg(ICON.bayrak, 15)} Geliştirme bitti</button>`)
    + `</div>`;
}

/* ---------- İlk kurulum sihirbazı ----------
   Bağlantılar ve temel'deki sihirbazla aynı kalıp: yüzen tam ekran katman,
   üstte adım şeridi, altta Geri/Devam Et. Adımlar: 3. blok, (sunuculuysa)
   veritabanı, sonra beş aşama — hepsi kopyala/yapıştır, Studio depoya
   bakamadığı için ilerlemeyi sen işaretliyorsun. */
const KURULUM_SIHIRBAZ = { adim: 1, projeId: null, liste: [] };

function kurulumSihirbazListesi(p) {
  const liste = ['blok'];
  if (sunuculuMu(p)) liste.push('sql');
  KURULUM_ADIM.forEach((a, i) => liste.push('asama:' + i));
  return liste;
}

function kurulumSihirbazAdimBittiMi(k, p) {
  const pl = p.palet || {};
  if (k === 'blok') return !!pl.blokVerildi;
  if (k === 'sql')  return !!pl.sqlKuruldu;
  return (Array.isArray(pl.asama) ? pl.asama : []).indexOf(Number(k.slice(6))) > -1;
}

function kurulumSihirbazEtiket(k) {
  if (k === 'blok') return 'Plan';
  if (k === 'sql')  return 'Veritabanı';
  return (KURULUM_ADIM[Number(k.slice(6))] || {}).ad || '';
}

function kurulumSihirbaziAc(projeId) {
  modalHepsiniKapat();
  const p = DB.proje(projeId);
  if (!p) return;
  const liste = kurulumSihirbazListesi(p);
  const ilkEksik = liste.findIndex(k => !kurulumSihirbazAdimBittiMi(k, p));
  Object.assign(KURULUM_SIHIRBAZ,
    { adim: ilkEksik > -1 ? ilkEksik + 1 : liste.length, projeId, liste });
  const el = document.createElement('div');
  el.id = 'kurulum-sihirbaz';
  el.className = 'sihirbaz';
  document.body.appendChild(el);
  kurulumSihirbaziCiz();
}

function kurulumSihirbaziKapat() {
  const el = $('#kurulum-sihirbaz');
  if (!el) return;
  el.classList.remove('acik');
  setTimeout(() => el.remove(), 260);
}

/* Kimlik: pencere açıkken arkadaki veri değişirse (onay kutusu, prompt
   kopyalama) bu fonksiyon çağrılıp adım yerinde yenileniyor. */
function kurulumSihirbaziCiz() {
  const el = $('#kurulum-sihirbaz');
  if (!el) return;
  const p = DB.proje(KURULUM_SIHIRBAZ.projeId);
  if (!p) return kurulumSihirbaziKapat();
  if (KURULUM_SIHIRBAZ.adim > KURULUM_SIHIRBAZ.liste.length) {
    KURULUM_SIHIRBAZ.adim = KURULUM_SIHIRBAZ.liste.length;
  }
  el.innerHTML = kurulumSihirbaziHtml(p);
  kurulumSihirbaziBagla(el, p);
  requestAnimationFrame(() => el.classList.add('acik'));
}

function kurulumSihirbaziSerit(liste, simdi, p) {
  return `<div class="sh-adimlar">${liste.map((k, i) => {
    const n = i + 1;
    const bitti = kurulumSihirbazAdimBittiMi(k, p);
    const hal = bitti ? 'done' : n === simdi ? 'simdi' : '';
    const ikon = bitti ? `<span class="sh-adim-no">${svg(ICON.tik, 13)}</span>`
                        : `<span class="sh-adim-no">${n}</span>`;
    return (i ? '<span class="sh-adim-cizgi"></span>' : '')
      + `<span class="sh-adim ${hal}">${ikon}<i>${esc(kurulumSihirbazEtiket(k))}</i></span>`;
  }).join('')}</div>`;
}

function kurulumSihirbaziHtml(p) {
  const liste = KURULUM_SIHIRBAZ.liste;
  const k = liste[KURULUM_SIHIRBAZ.adim - 1];
  const govde = k === 'blok' ? kurulumAdimBlokGovde(p)
    : k === 'sql' ? kurulumAdimSqlGovde(p)
    : kurulumAdimAsamaGovde(p, Number(k.slice(6)));

  const geri = KURULUM_SIHIRBAZ.adim > 1
    ? `<button class="btn btn-ghost" data-ks="geri" type="button">← Geri</button>`
    : `<button class="btn btn-ghost" data-ks="kapat" type="button">Kapat</button>`;
  const ileri = KURULUM_SIHIRBAZ.adim < liste.length
    ? `<button class="btn btn-primary" data-ks="ileri" type="button"><span>Sıradaki →</span></button>`
    : `<button class="btn btn-primary" data-ks="kapat" type="button"><span>Bitti ✓</span></button>`;

  return `
    <div class="sh-tepe">
      <button class="sh-kapat" data-ks="kapat" type="button" aria-label="Kapat">
        ${svg(ICON.kapat, 15)}
      </button>
      <span class="sh-ad">İlk kurulum</span>
    </div>

    <div class="sh-sayfa">
      <div class="sh-icerik">
        ${kurulumSihirbaziSerit(liste, KURULUM_SIHIRBAZ.adim, p)}
        ${govde}
      </div>

      <div class="sh-dip">${geri}${ileri}</div>
    </div>`;
}

function kurulumSihirbaziBagla(kutu, p) {
  $$('[data-ks]', kutu).forEach(el => {
    el.addEventListener('click', () => {
      const t = el.dataset.ks;
      if (t === 'kapat') return kurulumSihirbaziKapat();
      if (t === 'geri')  { KURULUM_SIHIRBAZ.adim--; return kurulumSihirbaziCiz(); }
      if (t === 'ileri') { KURULUM_SIHIRBAZ.adim++; return kurulumSihirbaziCiz(); }
    });
  });
}

/* 1 · Plan depoya yazılsın — eski "3. blok". */
function kurulumAdimBlokGovde(p) {
  const pl = p.palet || {};
  const kunyeVar = Object.keys(pl.kunye || {}).length > 0;
  const yayin = pl.alanAdi || '';
  const durum = pl.blokVerildi ? baDurum('Verildi', 'Dosyalar depoya yazıldı') : '';

  return durum
    + (kunyeVar ? '' : `<div class="note uyari">${svg(ICON.uyari, 15)}
        <span><b>Sayfa künyesi yok.</b> Önce <b>Yapı planlama</b> durağında
        modülü kur.</span></div>`)
    + (yayin ? '' : `<div class="note uyari">${svg(ICON.uyari, 15)}
        <span><b>Yayın adresi yok.</b> Claude uygulamayı hangi adrese
        kuracağını bilmeli.</span></div>`)
    + `<div class="kur-dug">
        ${promptBaglantisi({ tur: 'yapi', proje: p.id, slug: depoSlug(p.repo),
          ikincil: !(kunyeVar && yayin),
          yazi: 'Kopyala ve Claude Code\'da aç', kapali: !yayin || !kunyeVar })}
      </div>`
    + (pl.blokVerildi ? '' : `
      <button class="sayfa-dug ikincil" type="button" data-eylem="beta-blok-onay"
              data-proje="${p.id}">
        ${svg(ICON.tik, 15)} Dosyalar yazıldı olarak işaretle</button>`);
}

/* 2 · Veritabanı — sunuculu projede SQL'i Supabase'e çalıştırma rehberi.
   Claude'a giden bir prompt değil: Claude Code Supabase'e bağlanamıyor,
   bu adımı sen kendi panelinde yapıyorsun. */
function kurulumAdimSqlGovde(p) {
  const pl = p.palet || {};
  const bagli = !!String(pl.supabaseUrl || '').trim() && !!String(pl.supabaseAnon || '').trim();
  const slug = depoSlug(p.repo);
  const sqlAdres = slug ? 'https://github.com/' + slug + '/raw/main/' + SQL_DOSYA : '';
  const adres = sqlEditorAdresi(pl.supabaseUrl);

  return (pl.sqlKuruldu ? baDurum('Kuruldu', 'Tablolar Supabase\'de') : '')
    + (bagli ? '' : `<div class="note uyari">${svg(ICON.uyari, 15)}
        <span><b>Supabase bağlantısı girilmemiş.</b> <b>Bağlantılar ve temel</b>
        durağına proje adresini ve anon anahtarını yaz.</span></div>`)
    + `<div class="kur-dug">
        ${sqlAdres ? `<a class="sayfa-dug" target="_blank" rel="noopener" href="${esc(sqlAdres)}">
              ${svg(ICON.dosya, 15)} 1 · SQL dosyasını aç</a>`
          : `<button class="sayfa-dug ikincil" type="button" disabled>
              ${svg(ICON.dosya, 15)} Depo adresi yok</button>`}
      </div>
      <div class="kur-dug">
        <a class="sayfa-dug ${bagli ? '' : 'ikincil'}" target="_blank" rel="noopener"
           href="${esc(adres)}">${svg(ICON.disari, 15)} 2 · SQL editörünü aç</a>
      </div>`
    + (pl.sqlKuruldu ? '' : `
      <button class="sayfa-dug ikincil" type="button" data-eylem="sql-onay"
              data-proje="${p.id}">
        ${svg(ICON.tik, 15)} Tabloları kurdum olarak işaretle</button>`);
}

/* 3-7 · Beş aşamadan biri — gerçek uygulama kodu burada yazılır. Hangi
   sohbette devam edileceğine geliştirici karar verir; prompt konuşma
   geçmişine değil depodaki dosyalara güvenecek şekilde yazılıyor, o yüzden
   ister aynı sohbette ister yeni bir sohbette sorun çıkarmaz. */
function kurulumAdimAsamaGovde(p, i) {
  const pl = p.palet || {};
  const bitti = (Array.isArray(pl.asama) ? pl.asama : []).indexOf(i) > -1;

  return (bitti ? baDurum('Bitti', 'Bu aşamanın kodu yazıldı') : '')
    + `<div class="kur-dug">
        ${promptBaglantisi({ tur: 'asama:' + i, proje: p.id, hedef: 'claude-yeni',
          slug: depoSlug(p.repo), yazi: 'Kopyala ve Claude\'u aç' })}
      </div>`
    + (bitti ? '' : `
      <button class="sayfa-dug ikincil" type="button" data-eylem="asama-onay"
              data-proje="${p.id}" data-deger="${i}">
        ${svg(ICON.tik, 15)} Bu aşama bitti olarak işaretle</button>`);
}

/* Şema dosyasının depodaki yeri. 3. blok bu adı söylüyor; Studio da aynı
   adı gösteriyor — iki yerde yazılmasın diye tek sabit. */
const SQL_DOSYA = 'sql/01-tablolar.sql';

/* Proje adresinden SQL editörünün adresi. Adres `https://xxxx.supabase.co`
   biçiminde; panel adresi proje kimliğiyle kuruluyor. */
function sqlEditorAdresi(url) {
  const es = String(url || '').match(/https?:\/\/([a-z0-9-]+)\.supabase\.co/i);
  return es ? 'https://supabase.com/dashboard/project/' + es[1] + '/sql/new'
            : 'https://supabase.com/dashboard';
}

/* Supabase URL'inden proje referansı (alt alan adı) — Edge Function
   deploy promptunda `supabase link --project-ref` için kullanılıyor. */
function supabaseProjeRef(url) {
  const es = String(url || '').match(/https?:\/\/([a-z0-9-]+)\.supabase\.co/i);
  return es ? es[1] : '';
}


/* ---------- Muhasebe şablonu: Temel tanımlar sihirbazı ----------
   Kurulum sihirbazıyla aynı kalıp (yüzen tam ekran katman, adım şeridi,
   Geri/Devam Et). Dört adımı var: temel bilgi, POS, bankalar, fatura&kart.
   Üçü aynı işi yapıyor: örnek Excel'i Claude'a öğret, cevabı yapıştır —
   gerçek koda işleme burada değil, "Değişim" durağında tek promptla oluyor. */
const SABLON_SIHIRBAZ = { adim: 1, projeId: null };

/* Bir ekstra banka/fatura/gunsonu satırı "kaydedildi" hâlden "düzenleniyor"
   hâline elle geçirilince burada işaretleniyor — yalnız görüntü, veriye
   yazılmıyor. Anahtar: "<kategori>:<ekstra index>". */
const SABLON_EKSTRA_DUZEN = {};

function sablonTanimlarListesi() { return ['gunsonu', 'banka', 'fatura', 'temel']; }

function sablonTanimlarOku(p) {
  const t = (p.palet || {}).sablonTanimlar || {};
  return {
    temel:   Object.assign({ metin: '' }, t.temel),
    /* Gün Sonu iki katmanlı: "secili/ekstra" POS sistemi — öğrenen liste,
       başka müşterilerle paylaşılıyor; "ozel" ise platform/ısmarlama/yetkili
       gibi yalnız bu firmaya ait serbest metin, hiçbir yere kaydedilmiyor. */
    gunsonu: Object.assign({ secili: [], ekstra: [], ozel: '' }, t.gunsonu),
    banka:   Object.assign({ secili: [], ekstra: [] }, t.banka),
    fatura:  Object.assign({ secili: [], ekstra: [] }, t.fatura),
  };
}

function sablonTanimlarYaz(pr, kismi) {
  const t = sablonTanimlarOku(pr);
  return DB.paletKaydet(pr.id, Object.assign({}, pr.palet || {}, {
    sablonTanimlar: Object.assign({}, t, kismi),
  }));
}

/* Banka/fatura/gunsonu üçü de aynı "en az bir seçenek" kuralına uyuyor —
   ister hazır/öğrenilen bir kutu işaretlensin, ister yeni bir tane anlatılıp
   kaydedilsin. */
function sablonOgrenenBittiMi(t) {
  return t.secili.length > 0 || t.ekstra.some(b => (b.cevap || '').trim());
}

/* "temel" isteğe bağlı — bir katalog seçeneği değil, "eğer varsa" eklenen
   serbest bir not. O yüzden her zaman "bitti" sayılıyor: ne durağın
   ilerlemesini kilitliyor ne de sihirbazı boşken oraya yapıştırıyor. Yazıp
   yazmamak tamamen kullanıcının kararı. */
function sablonTanimlarAdimBittiMi(k, p) {
  const t = sablonTanimlarOku(p);
  if (k === 'temel')   return true;
  if (k === 'gunsonu') return sablonOgrenenBittiMi(t.gunsonu);
  if (k === 'banka')   return sablonOgrenenBittiMi(t.banka);
  if (k === 'fatura')  return sablonOgrenenBittiMi(t.fatura);
  return false;
}

function sablonTanimlarBittiMi(p) {
  return sablonTanimlarListesi().every(k => sablonTanimlarAdimBittiMi(k, p));
}

function sablonTanimlarEtiket(k) {
  return { gunsonu: 'Gün Sonu', banka: 'Bankalar', fatura: 'Fatura & kart',
           temel: 'Serbest güncelleme' }[k] || '';
}

function sablonSihirbaziAc(projeId) {
  modalHepsiniKapat();
  const p = DB.proje(projeId);
  if (!p) return;
  const liste = sablonTanimlarListesi();
  const ilkEksik = liste.findIndex(k => !sablonTanimlarAdimBittiMi(k, p));
  Object.assign(SABLON_SIHIRBAZ, { adim: ilkEksik > -1 ? ilkEksik + 1 : liste.length, projeId });
  const el = document.createElement('div');
  el.id = 'sablon-sihirbaz';
  el.className = 'sihirbaz';
  document.body.appendChild(el);
  sablonSihirbaziCiz();
}

function sablonSihirbaziKapat() {
  const el = $('#sablon-sihirbaz');
  if (!el) return;
  el.classList.remove('acik');
  setTimeout(() => el.remove(), 260);
}

function sablonSihirbaziCiz() {
  const el = $('#sablon-sihirbaz');
  if (!el) return;
  const p = DB.proje(SABLON_SIHIRBAZ.projeId);
  if (!p) return sablonSihirbaziKapat();
  const liste = sablonTanimlarListesi();
  if (SABLON_SIHIRBAZ.adim > liste.length) SABLON_SIHIRBAZ.adim = liste.length;
  el.innerHTML = sablonSihirbaziHtml(p, liste);
  sablonSihirbaziBagla(el, p);
  requestAnimationFrame(() => el.classList.add('acik'));
}

function sablonSihirbaziSerit(liste, simdi, p) {
  return `<div class="sh-adimlar">${liste.map((k, i) => {
    const n = i + 1;
    const bitti = sablonTanimlarAdimBittiMi(k, p);
    const hal = bitti ? 'done' : n === simdi ? 'simdi' : '';
    const ikon = bitti ? `<span class="sh-adim-no">${svg(ICON.tik, 13)}</span>`
                        : `<span class="sh-adim-no">${n}</span>`;
    return (i ? '<span class="sh-adim-cizgi"></span>' : '')
      + `<span class="sh-adim ${hal}">${ikon}<i>${esc(sablonTanimlarEtiket(k))}</i></span>`;
  }).join('')}</div>`;
}

function sablonSihirbaziHtml(p, liste) {
  const k = liste[SABLON_SIHIRBAZ.adim - 1];
  const govde = k === 'temel'   ? sablonAdimTemelGovde(p)
    : k === 'gunsonu' ? sablonAdimGunSonuGovde(p)
    : k === 'banka'   ? sablonAdimBankaGovde(p)
    : sablonAdimFaturaGovde(p);

  const geri = SABLON_SIHIRBAZ.adim > 1
    ? `<button class="btn btn-ghost" data-ss2="geri" type="button">← Geri</button>`
    : `<button class="btn btn-ghost" data-ss2="kapat" type="button">Kapat</button>`;
  const ileri = SABLON_SIHIRBAZ.adim < liste.length
    ? `<button class="btn btn-primary" data-ss2="ileri" type="button"><span>Sıradaki →</span></button>`
    : `<button class="btn btn-primary" data-ss2="kapat" type="button"><span>Bitti ✓</span></button>`;

  return `
    <div class="sh-tepe">
      <button class="sh-kapat" data-ss2="kapat" type="button" aria-label="Kapat">
        ${svg(ICON.kapat, 15)}
      </button>
      <span class="sh-ad">Temel tanımlar</span>
    </div>

    <div class="sh-sayfa">
      <div class="sh-icerik">
        ${sablonSihirbaziSerit(liste, SABLON_SIHIRBAZ.adim, p)}
        ${govde}
      </div>

      <div class="sh-dip">${geri}${ileri}</div>
    </div>`;
}

function sablonSihirbaziBagla(kutu, p) {
  $$('[data-ss2]', kutu).forEach(el => {
    el.addEventListener('click', () => {
      const t = el.dataset.ss2;
      if (t === 'kapat') return sablonSihirbaziKapat();
      if (t === 'geri')  { SABLON_SIHIRBAZ.adim--; return sablonSihirbaziCiz(); }
      if (t === 'ileri') { SABLON_SIHIRBAZ.adim++; return sablonSihirbaziCiz(); }
    });
  });
}

/* 4 · Serbest güncelleme — isteğe bağlı, en sonda. Şube, kullanıcı, hesap
   planı, gider grupları vb. — buraya kadar sorulmayan, bu firmaya özel
   bir şey varsa düz metin, konuşur gibi yazılıyor. Yazılmasa da olur; kod
   tarafı Değişim'de, yazıldıysa. */
function sablonAdimTemelGovde(p) {
  const t = sablonTanimlarOku(p);
  return shBaslik(ICON.etiket, 'Serbest güncelleme',
      'Buraya kadar sormadığımız, bu firmaya özel bir şey varsa yaz — şube, '
      + 'kullanıcı, hesap planı, gider grupları gibi. İstersen boş bırak.')
    + `<textarea class="anl-kutu" id="sb-temel-metin" rows="6"
         placeholder="Örn. 2 şube var: Merkez ve Fabrika. Kullanıcılar: ...">${esc(t.temel.metin)}</textarea>`
    + `<div class="kur-dug">
        <button class="sayfa-dug" type="button" data-eylem="sablon-temel-kaydet" data-proje="${p.id}">
          ${svg(ICON.check, 15)} Kaydet</button>
      </div>`
    + (t.temel.metin.trim() ? `<div class="kur-deger duz">${svg(ICON.tik, 13)} Kaydedildi</div>` : '');
}

/* Ortak "öğrenen liste" gövdesi — banka, fatura ve Gün Sonu'ndaki POS
   sistemi hepsi aynı kalıbı kullanıyor: kodda zaten hazır olanlar + başka
   müşterilerden öğrenilenler onay kutusu, altında "yeni bir tane anlat"
   akışı. Bir öğrenilen kutu işaretlenince tarifi zaten hazır — Claude'a
   yeniden anlatmaya gerek kalmıyor. Kod yazmıyoruz burada — yalnız tarif
   topluyoruz; gerçek koda işleme her zaman "Değişim" promptunda. */
function sablonOgrenenListesiGovde(p, kategori, ikon, baslik, aciklama, hazirListe, ekleEtiket, ekleYerTutucu) {
  const t = sablonTanimlarOku(p)[kategori];
  const tur = sablonProjeTuru(p);
  const ogrenilen = sablonSecenekleri(tur, kategori)
    .filter(o => !hazirListe.some(h => h.anahtar === o.id));

  /* `yapiMetni`: hazır seçeneklerde gerçek koddan çıkarılmış yapı özeti,
     öğrenilenlerde daha önce Claude'un yazdığı tarif — ikisi de "Yapıyı gör"
     ile açılıyor. Amaç kod üretmek değil: yeni bir format anlatılırken aynı
     ayrıntı seviyesinde yazmaya yardımcı olacak bir referans. */
  const kutu = (anahtar, ad, not, yapiMetni) => `
    <label class="kur-onay ${t.secili.indexOf(anahtar) > -1 ? 'on' : ''}"
           data-eylem="sablon-secenek-sec" data-proje="${p.id}" data-kategori="${kategori}"
           data-deger="${anahtar}" role="button" tabindex="0">
      <span class="kur-kutu">${svg(ICON.tik, 12)}</span> ${esc(ad)}
      <i style="margin-left:4px;opacity:.6">— ${not}</i></label>`
    + ((yapiMetni || '').trim() ? `
    <details class="note" style="margin-top:-4px;margin-bottom:8px;display:block">
      <summary style="cursor:pointer">Yapıyı gör</summary>
      <div style="margin-top:8px;white-space:pre-wrap">${esc(yapiMetni.trim())}</div>
    </details>` : '');

  /* Bir ekstra kaydedilince (cevabı dolunca) artık hazır/öğrenilen kutularla
     aynı kompakt görünüme dönüyor — tik + "Yapıyı gör". Düzenle'ye basılana
     kadar tekrar açık form olarak durmuyor, ekranı şişirmesin diye. Bu
     yalnız görüntü durumu, veriye yazılmıyor. */
  const ekstraGovde = t.ekstra.map((x, i) => {
    const anahtarEk = kategori + ':' + i;
    const cevapVar = !!(x.cevap || '').trim();
    const duzenleniyor = !cevapVar || !!SABLON_EKSTRA_DUZEN[anahtarEk];

    if (!duzenleniyor) {
      return `
        <label class="kur-onay on" role="button" tabindex="0" data-eylem="sablon-ekstra-duzenle-ac"
               data-proje="${p.id}" data-kategori="${kategori}" data-deger="${i}">
          <span class="kur-kutu">${svg(ICON.tik, 12)}</span> ${esc(x.ad)}
          <i style="margin-left:4px;opacity:.6">— eklendi</i></label>
        <details class="note" style="margin-top:-4px;margin-bottom:8px;display:block">
          <summary style="cursor:pointer">Yapıyı gör</summary>
          <div style="margin-top:8px;white-space:pre-wrap">${esc(x.cevap.trim())}</div>
          <div class="kur-dug" style="margin-top:8px">
            <button class="sayfa-dug ikincil" type="button" data-eylem="sablon-ekstra-duzenle-ac"
                    data-proje="${p.id}" data-kategori="${kategori}" data-deger="${i}">
              ${svg(ICON.kalem, 15)} Düzenle</button>
            <button class="sayfa-dug ikincil" type="button" data-eylem="sablon-secenek-sil"
                    data-proje="${p.id}" data-kategori="${kategori}" data-deger="${i}">
              ${svg(ICON.cop, 15)} Sil</button>
          </div>
        </details>`;
    }

    return `
      <div class="note" style="margin-top:10px;display:block">
        <b>${esc(x.ad)}</b>
        <div class="kur-dug" style="margin-top:8px">
          ${promptBaglantisi({ tur: 'sablonEkstra:' + kategori + ':' + i, proje: p.id, slug: depoSlug(p.repo),
            hedef: 'claude-yeni', yazi: 'Prompt oluştur ve Claude\'u aç' })}
        </div>
        <textarea class="anl-kutu" id="sb-${kategori}-cevap-${i}" rows="4"
          placeholder="Claude'un cevabını buraya yapıştır…">${esc(x.cevap || '')}</textarea>
        <div class="kur-dug" style="margin-top:8px">
          <button class="sayfa-dug" type="button" data-eylem="sablon-secenek-cevap-kaydet"
                  data-proje="${p.id}" data-kategori="${kategori}" data-deger="${i}">${svg(ICON.check, 15)} Kaydet</button>
          <button class="sayfa-dug ikincil" type="button" data-eylem="sablon-secenek-sil"
                  data-proje="${p.id}" data-kategori="${kategori}" data-deger="${i}">${svg(ICON.cop, 15)} Sil</button>
        </div>
      </div>`;
  }).join('');

  return shBaslik(ikon, baslik, aciklama)
    + hazirListe.map(h => kutu(h.anahtar, h.ad, 'zaten hazır', h.yapi)).join('')
    + ogrenilen.map(o => kutu(o.id, o.ad, 'başka bir projeden öğrenildi', o.tarif)).join('')
    + ekstraGovde
    + `<div class="kur-dug" style="margin-top:10px">
        <button class="sayfa-dug ikincil" type="button" data-eylem="sablon-secenek-ekle"
                data-proje="${p.id}" data-kategori="${kategori}" data-etiket="${esc(ekleEtiket)}"
                data-yertutucu="${esc(ekleYerTutucu)}">
          ${svg(ICON.arti, 15)} ${esc(ekleEtiket)}</button>
      </div>`;
}

/* 2 · Gün Sonu: POS sistemi öğrenen liste (paylaşılıyor) + bu firmaya özel
   platform/ısmarlama/yetkili serbest metni (paylaşılmıyor). */
function sablonAdimGunSonuGovde(p) {
  const t = sablonTanimlarOku(p);
  const ozel = t.gunsonu.ozel;
  return sablonOgrenenListesiGovde(p, 'gunsonu', ICON.gOptimizasyon, 'Gün Sonu — POS sistemi',
      'POS cihazından çıkan örnek Excel dosyasının yapısını Claude\'a öğreteceğiz. Bir daha '
      + 'başka bir firmada aynı POS çıkarsa yeniden anlatmana gerek kalmaz.',
      SABLON_GUNSONU_HAZIR, 'POS ekle', 'Örn. Aloha')
    + `<div style="margin-top:18px">`
    + shBaslik(ICON.etiket, 'Bu firmaya özel',
        'Platform/ısmarlama isimleri, yetkili adları gibi yalnız bu firmaya ait ayrıntılar — '
        + 'başka firmalara taşınmaz, burada kalır.')
    + `<textarea class="anl-kutu" id="sb-gunsonu-ozel" rows="4"
         placeholder="Örn. Yemeksepeti, Getir, Trendyol üzerinden gelen siparişler ayrı satırda…">${esc(ozel)}</textarea>`
    + `<div class="kur-dug">
        <button class="sayfa-dug" type="button" data-eylem="sablon-gunsonu-ozel-kaydet" data-proje="${p.id}">
          ${svg(ICON.check, 15)} Kaydet</button>
      </div>`
    + (ozel.trim() ? `<div class="kur-deger duz">${svg(ICON.tik, 13)} Kaydedildi</div>` : '')
    + `</div>`;
}

/* 3 · Bankalar: üçü hazır (excel yapısı zaten kayıtlı), öğrenilenler +
   yeni ekleme yine excel-öğret akışı. */
function sablonAdimBankaGovde(p) {
  return sablonOgrenenListesiGovde(p, 'banka', ICON.gAltyapi, 'Bankalar',
      'Hangi bankalar kullanılacak? Garanti, Kuveyt Türk ve Ziraat için excel yapısı zaten '
      + 'sistemde kayıtlı — seçmen yeter. Listede yoksa ekle; bir daha başka bir firmada aynı '
      + 'banka çıkarsa yeniden anlatmana gerek kalmaz.',
      SABLON_BANKA_HAZIR, 'Banka ekle', 'Örn. Akbank');
}

/* 4 · Fatura & kart hareketleri — Paraşüt hazır, geri kalanı öğrenen liste. */
function sablonAdimFaturaGovde(p) {
  return sablonOgrenenListesiGovde(p, 'fatura', ICON.etiket, 'Fatura ve kart hareketleri',
      'Firma hangi sistemi kullanıyor? Paraşüt için entegrasyon zaten sistemde kayıtlı — '
      + 'seçmen yeter. Listede yoksa ekle.',
      SABLON_FATURA_HAZIR, 'Sistem ekle', 'Örn. Logo');
}

/* Program temeli'nde katman tanımlanmış ve proje sunuculuysa giriş/kullanıcı
   ekleme sistemi anlamlı — aksi halde (tek kullanıcılık proje) o iş hiç
   yok, ikinci adım otomatik tamamlanmış sayılır (bkz. sablonDegisimBittiMi). */
function sablonGirisGerekliMi(p) {
  return rolListesi((p.palet || {}).roller).length > 0 && sunuculuMu(p);
}

/* Giriş ve Kullanıcı ekle artık kod yazdırmıyor — MUHASEBETEMPLATE göç 90
   ile mekanizmayı kendi içinde hazır getiriyor (auth_id, trigger, Kullanıcı
   ekle ekranı, Edge Function). Tek eksik veri: bu firmanın katman isimleri
   — onlar `katmanlar` tablosuna yazılır, koda değil. Bu yüzden burada
   Claude'a gönderilecek bir prompt değil, doğrudan çalıştırılabilir bir
   SQL metni üretiliyor. Seviye sırası `rolListesi`nin kendi sırasıyla
   aynı: dar yetkiden genişe (bkz. yetkiKur, cozumleme). */
/* Bir birleşik kurulum SQL metninin hangi göçe kadar geldiğini bulup toast'ta
   gösterir. Tam metni ekrana dökmez (20 bin+ satır, telefonda kasar).
   Kullanan iki yer: Templateler'deki kayıt kutusu ve müşteri kopyasının
   "Bağlantılar ve temel" durağındaki "SQL'i kopyala" adımı — ikisi de aynı
   şüpheyi (kayıtlı/kopyalanacak metin güncel mi) farklı yerden soruyor.
   Metin artık üç parça (bkz. sql/19-sablon-sql-parca.sql, DB.sablonSqlMetniOku)
   — üçü birleştirilip tek numara aranıyor, eksik parça ayrıca uyarılıyor. */
function sqlMetniGocBildir(parcalar) {
  const p = parcalar || {};
  const eksik = [1, 2, 3].filter(no => !(p[no === 1 ? 'metin' : 'metin' + no] || '').trim());
  const tumu = [p.metin, p.metin2, p.metin3].filter(Boolean).join('\n');
  if (!tumu.trim()) { toast('Henüz kayıtlı bir SQL metni yok.', 'uyari'); return; }
  /* Göç başlığı TAM OLARAK "-- NN · ..." biçiminde (tek boşluklu). `\s*`
     kullanılamaz: SQL gövdesinde hesap kodu açıklamaları da "--     331 ·
     ..." gibi birden çok boşlukla yazılıyor ve gerçek göç numarasından
     büyük çıkıp yanlış sonuç veriyordu. */
  const numaralar = [...tumu.matchAll(/^-- (\d{1,3}) · /gm)].map(m => Number(m[1]));
  if (!numaralar.length) { toast('Göç numarası bulunamadı — metin farklı biçimde olabilir.', 'uyari'); return; }
  let mesaj = 'Kayıtlı SQL şu an göç ' + Math.max(...numaralar) + '\'e kadar.';
  if (eksik.length) mesaj += ' (Parça ' + eksik.join(', ') + ' boş!)';
  toast(mesaj, eksik.length ? 'uyari' : 'basari');
}

function sablonKatmanSqlMetni(p) {
  const roller = rolListesi((p.palet || {}).roller);
  if (!roller.length) return '';
  const satirlar = roller.map((ad, i) => `  (${i + 1}, '${ad.replace(/'/g, "''")}')`).join(',\n');
  return `insert into katmanlar (seviye, ad) values\n${satirlar}\non conflict do nothing;`;
}

/* Şablonun "Giriş ve Kullanıcı ekle" Edge Function'ı (7-sunucu/kullanici-
   yonetimi/index.ts) — her şablon kopyasında birebir aynı, müşteriye özel
   hiçbir şey içermiyor. Bu yüzden GitHub'a gidip kopyalatmak yerine
   Studio'nun kendi kaynağına gömülü: buton doğrudan bunu panoya kopyalar. */
const SABLON_EDGE_FONKSIYON = `/* Kullanıcı yönetimi · Supabase Edge Function.

   NİYE SUNUCUDA
     Hesap açmak, şifre koymak ve hesabı kapatmak \`service_role\`
     anahtarını gerektirir. O anahtar bütün satır güvenliği kurallarını
     atlar; tarayıcıya, depoya ya da herhangi bir istemci koduna HİÇBİR
     KOŞULDA inmez (6-belgeler/NIZAM.md). Bu dosya sunucuda çalışır ve
     anahtarı yalnız burada okur.

     İkinci sebep: \`auth.admin.createUser\` çağıran kişinin oturumunu
     bozmaz. İstemciden \`signUp\` çağrılsaydı admin kendi oturumundan
     düşer, yeni açtığı kullanıcı olarak devam ederdi.

   KAPIDA DURAN İKİ KONTROL
     1 · Çağıran giriş yapmış mı? (Authorization başlığındaki belirteç)
     2 · Çağıran EN ÜST KATMANDA mı? Katman adları müşteriye özeldir, o
         yüzden ada değil SEVİYEYE bakılır: katmanlar tablosundaki en
         büyük seviye. Kod hiçbir katman adı bilmez.

   İŞLEMLER
     ekle          · hesap açar, kullanicilar satırını auth_id ile upsert eder
     durum         · Aktif / Pasif — Pasif auth hesabını da kapatır
     girisi-kaldir · auth hesabını siler, personel satırı ADIYLA KALIR

   KURULUM
     supabase functions deploy kullanici-yonetimi
     Ayrıntı: 7-sunucu/OKUBENI.md
*/

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";

/* İzin verilen yayın adresi · CORS. Müşteri kopyasında Studio bunu
   uygulamanın gerçek adresiyle değiştirir. Şablonda GitHub Pages adresi
   durur; yanlış adres bırakılırsa Kullanıcı ekle ekranı çalışmaz ve bu
   sessiz bir güvenlik açığından iyidir. */
const IZINLI_ADRES = Deno.env.get("NS_IZINLI_ADRES")
  || "https://nizamsoft.github.io";

const CORS = {
  /* Yalnız uygulamanın kendi adresi çağırabilir. "*" idi: herhangi bir
     site tarayıcıdan bu uca istek atabiliyordu. Geçerli bir oturum
     belirteci şart olduğu için sömürülmesi kolay değildi, ama açık kapıyı
     açık bırakmanın sebebi yok.

     KURULUMDA GÜNCELLENİR: müşteri kopyasının yayın adresi buraya yazılır
     (Studio · "Bağlantılar ve temel"). Liste boş bırakılırsa hiçbir
     tarayıcı çağrısı geçmez. */
  "Access-Control-Allow-Origin": IZINLI_ADRES,
  "Access-Control-Allow-Headers": "authorization, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

/* Hata cümleleri Türkçe ve ne yapılacağını söyler
   (6-belgeler/NIZAM.md · "Hata · Hata metni Türkçe ve anlaşılırdır").
   Hata kodu, SQL cümlesi ya da İngilizce kütüphane metni dışarı çıkmaz. */
function cevap(govde: unknown, durum = 200): Response {
  return new Response(JSON.stringify(govde), {
    status: durum,
    headers: { ...CORS, "Content-Type": "application/json" },
  });
}

function hata(mesaj: string, durum = 400): Response {
  return cevap({ hata: mesaj }, durum);
}

Deno.serve(async (istek: Request) => {
  if (istek.method === "OPTIONS") return new Response("ok", { headers: CORS });
  if (istek.method !== "POST") return hata("Yalnız POST kabul edilir.", 405);

  const adres = Deno.env.get("SUPABASE_URL");
  const servis = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  const anon = Deno.env.get("SUPABASE_ANON_KEY");
  if (!adres || !servis || !anon) {
    return hata("Sunucu yapılandırması eksik. Yöneticinize bildirin.", 500);
  }

  const belirtec = (istek.headers.get("Authorization") || "").replace(/^Bearer\\s+/i, "");
  if (!belirtec) return hata("Oturum bulunamadı. Çıkış yapıp tekrar girin.", 401);

  /* service_role istemcisi · bütün kuralları atlar, yalnız bu dosyada. */
  const yonetim = createClient(adres, servis, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  /* ---- 1 · Çağıran kim? ---- */
  const { data: kimVeri, error: kimHata } = await yonetim.auth.getUser(belirtec);
  if (kimHata || !kimVeri?.user) {
    return hata("Oturum geçersiz ya da süresi dolmuş. Tekrar giriş yapın.", 401);
  }
  const cagiranAuthId = kimVeri.user.id;

  /* ---- 2 · Çağıran en üst katmanda mı? ---- */
  const { data: katmanlar, error: katmanHata } = await yonetim
    .from("katmanlar").select("id,seviye,ad").order("seviye", { ascending: false });

  if (katmanHata) return hata("Katmanlar okunamadı. Tekrar deneyin.", 500);
  if (!katmanlar || !katmanlar.length) {
    return hata(
      "Katmanlar tanımlanmamış. Önce katmanlar tablosuna rolleri yazın " +
      "(5-veritabani/2-guncellemeler/90).", 409);
  }

  const ustKatman = katmanlar[0];
  const altKatman = katmanlar[katmanlar.length - 1];

  const { data: cagiran } = await yonetim
    .from("kullanicilar").select("id,katman_id,durum")
    .eq("auth_id", cagiranAuthId).maybeSingle();

  if (!cagiran || cagiran.katman_id !== ustKatman.id || cagiran.durum !== "Aktif") {
    return hata("Bu işlem için en üst katman yetkisi gerekir.", 403);
  }

  let govde: Record<string, unknown>;
  try {
    govde = await istek.json();
  } catch {
    return hata("İstek okunamadı.", 400);
  }

  const islem = String(govde.islem || "");

  /* Bir katmanda kaç AKTİF ve GİRİŞİ OLAN kişi var. "Son admini silme"
     kuralı buna bakar: sayı 1'ken o kişiye dokunulmaz, yoksa kimse
     kullanıcı ekleyemez hâle gelir ve kapı kilitlenir. */
  async function katmandakiSayi(katmanId: string): Promise<number> {
    const { count } = await yonetim
      .from("kullanicilar")
      .select("id", { count: "exact", head: true })
      .eq("katman_id", katmanId).eq("durum", "Aktif").not("auth_id", "is", null);
    return count || 0;
  }

  /* ------------------------------------------------------------------
     ekle · hesap aç + kullanicilar satırını auth_id ile upsert et
     ------------------------------------------------------------------ */
  if (islem === "ekle") {
    const eposta = String(govde.eposta || "").trim().toLowerCase();
    const sifre = String(govde.sifre || "");
    const adSoyad = String(govde.ad_soyad || "").trim();
    const katmanId = String(govde.katman_id || "");
    const subeler: string[] = Array.isArray(govde.sube_idler)
      ? (govde.sube_idler as string[]) : [];

    if (!eposta || eposta.indexOf("@") < 1) return hata("Geçerli bir e-posta yazın.");
    if (sifre.length < 8) return hata("Şifre en az 8 karakter olmalı.");
    if (!adSoyad) return hata("Ad soyad boş bırakılamaz.");
    if (!katmanlar.some((k) => k.id === katmanId)) return hata("Katman seçin.");

    /* Hesap açılır. E-posta doğrulaması istenmez: kullanıcıyı admin
       açıyor, şifreyi de admin veriyor — posta kutusu beklemenin bir
       anlamı yok ve kullanıcı kapıda kalır. */
    const { data: yeni, error: acmaHatasi } = await yonetim.auth.admin.createUser({
      email: eposta,
      password: sifre,
      email_confirm: true,
      user_metadata: { ad_soyad: adSoyad },
    });

    if (acmaHatasi || !yeni?.user) {
      const m = String(acmaHatasi?.message || "");
      if (/already|registered|exists/i.test(m)) {
        return hata("Bu e-posta ile bir hesap zaten var.", 409);
      }
      if (/password/i.test(m)) return hata("Şifre kabul edilmedi. Daha uzun bir şifre deneyin.");
      return hata("Hesap açılamadı. Tekrar deneyin.", 500);
    }

    /* Göç 90'daki tetik bu satırı zaten açmış olabilir (en düşük katman +
       Pasif). Upsert onun üstüne yazar: admin'in seçtiği katman ve Aktif
       durum geçerlidir. Çakışma anahtarı auth_id'dir. */
    const { data: satir, error: yazmaHatasi } = await yonetim
      .from("kullanicilar")
      .upsert({
        auth_id: yeni.user.id,
        ad_soyad: adSoyad,
        eposta: eposta,
        katman_id: katmanId,
        durum: "Aktif",
      }, { onConflict: "auth_id" })
      .select("id").single();

    if (yazmaHatasi || !satir) {
      /* Kullanıcı satırı yazılamadıysa auth hesabı da geri alınır:
         yoksa giriş yapabilen ama uygulamada karşılığı olmayan bir
         hesap kalır ve sebebi hiçbir ekranda görünmez. */
      await yonetim.auth.admin.deleteUser(yeni.user.id);
      return hata("Kullanıcı kaydedilemedi. Tekrar deneyin.", 500);
    }

    if (subeler.length) {
      await yonetim.from("kullanici_subeleri").delete().eq("kullanici_id", satir.id);
      await yonetim.from("kullanici_subeleri").insert(
        subeler.map((s) => ({ kullanici_id: satir.id, sube_id: s })));
    }

    return cevap({ tamam: true, id: satir.id });
  }

  /* ------------------------------------------------------------------
     durum · Aktif / Pasif. Pasif auth hesabını da kapatır.
     ------------------------------------------------------------------ */
  if (islem === "durum") {
    const id = String(govde.kullanici_id || "");
    const durum = String(govde.durum || "");
    if (durum !== "Aktif" && durum !== "Pasif") return hata("Durum Aktif ya da Pasif olmalı.");

    const { data: kisi } = await yonetim
      .from("kullanicilar").select("id,auth_id,katman_id,ad_soyad")
      .eq("id", id).maybeSingle();
    if (!kisi) return hata("Kullanıcı bulunamadı.", 404);

    if (durum === "Pasif") {
      if (kisi.id === cagiran.id) return hata("Kendi hesabınızı pasife alamazsınız.");
      if (kisi.katman_id === ustKatman.id && await katmandakiSayi(ustKatman.id) <= 1) {
        return hata("Son " + ustKatman.ad + " pasife alınamaz.");
      }
    }

    const { error: guncelHata } = await yonetim
      .from("kullanicilar").update({ durum }).eq("id", id);
    if (guncelHata) return hata("Durum değiştirilemedi. Tekrar deneyin.", 500);

    /* Arayüzde pasife almak yetmez: hesap açık kalırsa işten çıkan kişi
       girmeye devam eder. Auth tarafında da yasaklanır.
       "none" yasağı kaldırır, uzun bir süre fiilen kapatır. */
    if (kisi.auth_id) {
      await yonetim.auth.admin.updateUserById(kisi.auth_id, {
        ban_duration: durum === "Pasif" ? "876000h" : "none",
      });
    }

    return cevap({ tamam: true });
  }

  /* ------------------------------------------------------------------
     girisi-kaldir · auth hesabı silinir, PERSONEL SATIRI KALIR
     Satır silinseydi kişinin işlem geçmişindeki imzası "kim bu" olurdu.
     ------------------------------------------------------------------ */
  if (islem === "girisi-kaldir") {
    const id = String(govde.kullanici_id || "");

    const { data: kisi } = await yonetim
      .from("kullanicilar").select("id,auth_id,katman_id,ad_soyad")
      .eq("id", id).maybeSingle();
    if (!kisi) return hata("Kullanıcı bulunamadı.", 404);
    if (kisi.id === cagiran.id) return hata("Kendi girişinizi kaldıramazsınız.");
    if (kisi.katman_id === ustKatman.id && await katmandakiSayi(ustKatman.id) <= 1) {
      return hata("Son " + ustKatman.ad + " kaldırılamaz.");
    }

    if (kisi.auth_id) await yonetim.auth.admin.deleteUser(kisi.auth_id);

    const { error: temizleHatasi } = await yonetim
      .from("kullanicilar")
      .update({ auth_id: null, katman_id: null, durum: "Pasif" })
      .eq("id", id);
    if (temizleHatasi) return hata("Kayıt güncellenemedi. Tekrar deneyin.", 500);

    return cevap({ tamam: true });
  }

  /* ------------------------------------------------------------------
     katman · başka birinin katmanını değiştir
     ------------------------------------------------------------------ */
  if (islem === "katman") {
    const id = String(govde.kullanici_id || "");
    const katmanId = String(govde.katman_id || "");
    if (!katmanlar.some((k) => k.id === katmanId)) return hata("Katman seçin.");

    const { data: kisi } = await yonetim
      .from("kullanicilar").select("id,katman_id").eq("id", id).maybeSingle();
    if (!kisi) return hata("Kullanıcı bulunamadı.", 404);

    /* Kendi katmanını düşüremez: düşürdüğü an bu ekranın kapısı kapanır
       ve geri açacak yer kalmaz. */
    if (kisi.id === cagiran.id && katmanId !== ustKatman.id) {
      return hata("Kendi katmanınızı düşüremezsiniz.");
    }
    if (kisi.katman_id === ustKatman.id && katmanId !== ustKatman.id &&
        await katmandakiSayi(ustKatman.id) <= 1) {
      return hata("Son " + ustKatman.ad + " katmanı değiştirilemez.");
    }

    const { error: kHata } = await yonetim
      .from("kullanicilar").update({ katman_id: katmanId }).eq("id", id);
    if (kHata) return hata("Katman değiştirilemedi. Tekrar deneyin.", 500);

    return cevap({ tamam: true });
  }

  /* ------------------------------------------------------------------
     sifre · başka birinin şifresini değiştir
     ------------------------------------------------------------------ */
  if (islem === "sifre") {
    const id = String(govde.kullanici_id || "");
    const sifre = String(govde.sifre || "");
    if (sifre.length < 8) return hata("Şifre en az 8 karakter olmalı.");

    const { data: kisi } = await yonetim
      .from("kullanicilar").select("auth_id").eq("id", id).maybeSingle();
    if (!kisi || !kisi.auth_id) return hata("Bu kişinin girişi yok.", 404);

    const { error: sHata } = await yonetim.auth.admin
      .updateUserById(kisi.auth_id, { password: sifre });
    if (sHata) return hata("Şifre değiştirilemedi. Tekrar deneyin.", 500);

    return cevap({ tamam: true });
  }

  /* Bilinmeyen işlem. Alt katman bilgisi cevapta durur: arayüz katman
     listesini kendisi okur, buradaki değer yalnız arıza ararken işe yarar. */
  return hata("Bilinmeyen işlem: " + (islem || "—") +
    " (beklenen: ekle · durum · katman · sifre · girisi-kaldir, " +
    "en düşük katman: " + altKatman.ad + ")");
});
`;

/* "Değişim" durağı üç ayrı iş: (1) Temel tanımlar (Gün Sonu/Banka/Fatura
   verisi topla — eskiden ayrı bir durak olan "Temel tanımlar" buraya
   katlandı, bkz. DURAKLAR.yapi), (2) veri/format bilgisini koda işlemek,
   (3) giriş ekranı ve Kullanıcı ekle özelliğini kurmak. Üçü ayrı ayrı
   ilerliyor — tek kutuda toplanınca "giriş hiç yapılmadı" gibi bir
   durum fark edilmiyordu. */
function sablonDegisimBittiMi(p) {
  const pl = p.palet || {};
  return sablonTanimlarBittiMi(p) && !!pl.sablonDegisimTamamlandi
    && (!sablonGirisGerekliMi(p) || !!pl.sablonGirisTamamlandi);
}

/* Bir "Değişim" adımının dış kabuğu — numaralı daire + bağlayan dikey
   çizgi (bkz. .dg-* stilleri). `hal`: 'bitti' | 'aktif' | '' (henüz sırası
   gelmedi). Sıradaki üç adım (Giriş, Temel tanımlar, Veri ve format)
   birbirinden bağımsız görsel dille anlatılsın diye ortak bir kalıba
   alındı; içerikleri sablonDegisimSayfasi'nda ayrı ayrı üretiliyor. */
function sablonDegisimAdim(no, hal, baslik, rozetHtml, aciklama, icerikHtml) {
  return `<div class="dg-adim ${hal}">
      <div class="dg-cizgi"></div>
      <div class="dg-no">${hal === 'bitti' ? svg(ICON.tik, 15) : no}</div>
      <div class="dg-ic">
        <div class="dg-baslik-satir">
          <span class="dg-baslik">${esc(baslik)}</span>
          ${rozetHtml || ''}
        </div>
        ${aciklama ? `<p class="dg-aciklama">${aciklama}</p>` : ''}
        ${icerikHtml || ''}
      </div>
    </div>`;
}

/* 4 · Değişim — Temel tanımlar'ı toplayıp koda işleyen ve giriş sistemini
   kuran birleşik durak. Eskiden "Temel tanımlar" ve "Değişim" diye iki
   ayrı durak olan bu iş, akışı sadeleştirmek için tek durakta toplandı.
   Adım sırası bilerek Giriş ve Kullanıcı ekle ile başlıyor — o, Temel
   tanımlar/Veri ve format'tan bağımsız, hızlı biten bir iş; en sona
   bırakmanın bir gerekçesi yoktu. Tek gerçek sıra kuralı Temel tanımlar
   → Veri ve format arasında (ikincisinin promptu birincinin verisini
   okuyor), o yüzden yalnız bu ikisi arasında kilit var. */
function sablonDegisimSayfasi(p, d) {
  const pl = p.palet || {};
  const liste = sablonTanimlarListesi();
  const tanimBiten = liste.filter(k => sablonTanimlarAdimBittiMi(k, p)).length;
  const tanimlarBitti = tanimBiten >= liste.length;
  const veriTamam = !!pl.sablonDegisimTamamlandi;
  const girisGerekli = sablonGirisGerekliMi(p);
  const girisTamam = !girisGerekli || !!pl.sablonGirisTamamlandi;
  const biten = [girisTamam, tanimlarBitti, veriTamam].filter(Boolean).length;

  /* Hangi adım "aktif" (sırada): tamamlanmamış ilk adım. Ondan öncekiler
     yeşil/bitti, sonrakiler nötr — kilitli olup olmaması ayrı bir konu. */
  const durum = [girisTamam, tanimlarBitti, veriTamam];
  const aktifIdx = durum.findIndex(x => !x);
  const hal = i => (aktifIdx === -1 || i < aktifIdx) ? 'bitti' : i === aktifIdx ? 'aktif' : '';

  const fonksiyonlarAdres = supabaseProjeRef(pl.supabaseUrl)
    ? `https://supabase.com/dashboard/project/${supabaseProjeRef(pl.supabaseUrl)}/functions` : '';

  const girisIcerik = !girisGerekli
    ? `<div class="dg-kilitli">${svg(ICON.info, 14)} Rol katmanı yok ya da sunucusuz — bu adım gerekmiyor</div>`
    : `<ol class="dg-mini">
        <li><span>Katmanlar tablosuna bu firmanın rollerini yaz
          <div class="kur-dug" style="margin:8px 0 0 0">
            <button class="sayfa-dug ikincil" type="button" data-eylem="sablon-katman-sql-kopyala"
                    data-proje="${p.id}">${svg(ICON.kopya, 15)} SQL'i kopyala</button>
          </div></span></li>
        <li><span>Supabase panelinden ilk admin hesabını aç (Authentication → Users → Add user)</span></li>
        <li><span>Edge Function'ı yayınla — kod çalıştırmadan, kopyala-yapıştır:
          <ol class="dg-mini" style="margin-top:8px">
            <li><span>Fonksiyon kodunu kopyala
              <div class="kur-dug" style="margin:8px 0 0 0">
                <button class="sayfa-dug ikincil" type="button" data-eylem="sablon-fonksiyon-kopyala"
                        data-proje="${p.id}">${svg(ICON.kopya, 15)} Fonksiyon kodunu kopyala</button>
              </div></span></li>
            <li><span>Supabase paneli${fonksiyonlarAdres
                ? ` — <a class="mini-link" target="_blank" rel="noopener" href="${esc(fonksiyonlarAdres)}">
                    ${svg(ICON.disari, 13)} Edge Functions'ı aç</a>` : ''}
              → Deploy a new function → <b>via Editor</b></span></li>
            <li><span>İsim kutusuna tam olarak <code>kullanici-yonetimi</code> yaz (tire dahil)</span></li>
            <li><span>Örnek kodu tamamen sil, panodakini yapıştır</span></li>
            <li><span><b>Verify JWT açık kalsın</b> — kapatma</span></li>
            <li><span>Deploy</span></li>
            <li><span>Ortam değişkeni ekle: fonksiyonun <b>Secrets</b> (ya da
              Ayarlar) bölümüne yeni değişken — <code>NS_IZINLI_ADRES</code>
              = <code>https://${esc(String(pl.alanAdi || '').trim())}</code>.
              Yazılmazsa Kullanıcı ekle ekranı çalışmaz (adres izinli
              listede değil demektir).
              <div class="kur-dug" style="margin:8px 0 0 0">
                <button class="sayfa-dug ikincil" type="button" data-eylem="sablon-ortam-degiskeni-kopyala"
                        data-proje="${p.id}">${svg(ICON.kopya, 15)} Değeri kopyala</button>
              </div></span></li>
          </ol></span></li>
      </ol>`
      + (girisTamam
          ? `<div class="kur-deger duz">${svg(ICON.tik, 13)} Bu aşama tamamlandı</div>`
          : `<label class="kur-onay" data-eylem="sablon-giris-onay" data-proje="${p.id}"
                    role="button" tabindex="0">
              <span class="kur-kutu">${svg(ICON.tik, 12)}</span> Giriş ve kullanıcı ekleme
              yapıldı, kontrol ettim</label>`);

  const tanimIcerik = `<div class="kur-dug">
      <button class="sayfa-dug" type="button" data-eylem="sablon-sihirbazi-ac" data-proje="${p.id}">
        ${svg(ICON.kalem, 15)} Doldur</button>
    </div>`;

  const veriIcerik = !tanimlarBitti
    ? `<div class="dg-kilitli">${svg(ICON.kilit, 14)} Önce 2. adımı bitir</div>`
    : `<div class="kur-dug">
        ${promptBaglantisi({ tur: 'sablonDegisim', proje: p.id, slug: depoSlug(p.repo),
          hedef: 'claude-yeni', yazi: 'Kopyala ve Claude\'u aç' })}
      </div>`
      + (veriTamam
          ? `<div class="kur-deger duz">${svg(ICON.tik, 13)} Bu aşama tamamlandı</div>`
          : `<label class="kur-onay" data-eylem="sablon-degisim-onay" data-proje="${p.id}"
                    role="button" tabindex="0">
              <span class="kur-kutu">${svg(ICON.tik, 12)}</span> Değişim yapıldı, kontrol ettim</label>`);

  return `<div class="fb-govde">`
    + adimBasligi(p, d, biten + '/3')
    + shBaslikServis('claude', 'Değişim',
        'Firmaya özel her şey burada üç adımda toplanıp koda işleniyor.')
    + `<div class="dg-stepper">`
    + sablonDegisimAdim(1, hal(0), 'Giriş ve Kullanıcı ekle',
        girisGerekli ? `<span class="dg-rozet bilgi">şablonda hazır</span>` : '',
        girisGerekli ? 'Kod yazdırmana gerek yok — sırayla üç adım (sıra önemli), hızlı biter:' : '',
        girisIcerik)
    + sablonDegisimAdim(2, hal(1), 'Temel tanımlar',
        `<span class="dg-rozet beklet">${tanimBiten}/${liste.length}</span>`,
        'Gün Sonu, banka, fatura &amp; kart yapılarını topla — istersen sonunda serbest bir güncelleme de eklersin.',
        tanimIcerik)
    + sablonDegisimAdim(3, hal(2), 'Veri ve format', '',
        'Toplanan tanımları tek promptla koda işle.',
        veriIcerik)
    + `</div></div>`;
}

/* ---------- 6 · Test ve Güncelle ----------
   Yalnız şablon kopyalarında anlamlı: normal projede bu döngü zaten Beta
   ve geliştirme'nin kendi içinde (bkz. betaSayfasi). Şablon kopyası
   "Kurulum ve yapı"/"Beta ve geliştirme" yerine "Temel tanımlar"/"Değişim"
   sihirbazlarından geçtiği için bu döngüyü hiç görmüyordu — burada
   guncellemeSayfasi'yle aynı iskelet (serbest metin → prompt → Claude),
   yalnız daha sade: depo/sürüm notu bölümleri yok, bu durağa özgü değil. */
const DENEME_ISTEK = {};

function denemeSayfasi(p, d) {
  if (!sablonMu(p)) {
    return sayfaHero(p, d) + `<div class="card">${empty(ICON.check, 'Bu aşama geçerli değil',
      'Bu durak yalnızca şablon kopyalarında kullanılıyor — normal projelerde test/güncelleme döngüsü zaten Beta ve geliştirme içinde.')}</div>`;
  }

  const pl = p.palet || {};
  const istek = DENEME_ISTEK[p.id] || '';
  const dolu = istek.trim().length > 20;
  const tamam = !!pl.denemeTamamlandi;
  const gorevler = DB.gorevleri({ proje: p.id }).filter(g => g.durum !== 'tamamlandi');
  const yayinAdres = String(pl.alanAdi || '').trim();

  return `<div class="fb-govde">`
    + adimBasligi(p, d, tamam ? '1/1' : '0/1')
    + (yayinAdres ? `<div class="kur-dug" style="margin-top:-6px;margin-bottom:14px">
        <a class="mini-link" target="_blank" rel="noopener" href="https://${esc(yayinAdres)}">
          ${svg(ICON.disari, 13)} Uygulamayı aç — ${esc(yayinAdres)}</a>
      </div>` : '')
    + balon('Uygulama artık gerçek verilerle çalışıyor.',
        'Dene, eksik ya da hatalı gördüğün her şeyi buraya yaz — Claude düzeltsin.')
    + `<div class="card">
        <textarea class="anl-kutu" data-deneme-istek="${p.id}"
          placeholder="Örn. Fatura listesinde tarih sıralaması ters">${esc(istek)}</textarea>
        <div class="anl-dug">
          ${dolu
            ? promptBaglantisi({ tur: 'denemeIstek', proje: p.id, slug: depoSlug(p.repo),
                hedef: 'claude-yeni', yazi: 'Prompt oluştur ve Claude\'u aç' })
            : `<button type="button" disabled>${svg(ICON.kopya, 15)} Prompt oluştur</button>`}
          <button class="ana" type="button" data-eylem="anlat-aktar" data-proje="${p.id}">
            ${svg(ICON.ice, 15)} JSON varsa yükle</button>
        </div>
      </div>`
    + (gorevler.length ? bolumBas('Açık istekler')
        + `<div class="card liste">${gorevler.slice(0, 12).map(gorevKarti).join('')}</div>` : '')
    + (AUTH.yonetici ? (tamam
        ? `<div class="kur-deger duz">${svg(ICON.tik, 13)} Bu aşama tamamlandı</div>`
        : `<button class="sayfa-dug ikincil" type="button" data-eylem="deneme-tamamlandi"
                    data-proje="${p.id}">${svg(ICON.check, 15)} Test ve Güncelle tamamlandı</button>`) : '')
    + `</div>`;
}

/* ---------- 8 · Yetkilendirme ----------
   Finalden bir önceki durak. Katmanlar (Program temeli) ve kullanıcı ekleme
   (ilk kurulum promptu) zaten kurulu, başlangıçta her katman her şeyi
   yapabiliyor. Üç parça: her katmanın görevi (serbest metin), promptu
   Claude'a yazdırma, Claude'un cevabını aktarma. */

function yetkiGorevKarti(p, pl) {
  const roller = rolListesi(pl.roller);
  if (!roller.length) return '';
  const gorev = pl.rolGorev || {};
  return fbKart('#a15fc4', ICON.kisi, 'Her katman ne yapabilir', null, p.id, `
    <p class="fb-neden">Kısaca yaz — Claude\'a giden promptun içine bu satırlar
      birebir girecek.</p>
    <div class="yk-gorevler">
      ${roller.slice().reverse().map(ad => `
        <label class="field">
          <span>${esc(ad)}</span>
          <textarea data-yk-gorev="${esc(ad)}" rows="2"
            placeholder="Örn. her şeyi görür ve onaylar">${esc(gorev[ad] || '')}</textarea>
        </label>`).join('')}
    </div>
    ${AUTH.yonetici ? `<div class="kur-dug">
      <button class="sayfa-dug ikincil" type="button" data-eylem="yetki-gorev-kaydet"
              data-proje="${p.id}">${svg(ICON.check, 15)} Kaydet</button>
    </div>` : ''}`);
}

function yetkiPromptKarti(p, pl) {
  const hazir = rolListesi(pl.roller).length > 0;
  return fbKart('#a15fc4', ICON.kopya, 'Kodu yazdır', null, p.id, `
    <p class="fb-neden">Kullanıcı ekleme ve katmanlar zaten kurulu — şu ana kadar
      herkes her şeyi yapabiliyordu. Bu prompt yukarıdaki tarife göre gerçek
      kısıtlamaları uygular.</p>
    <div class="kur-dug">
      ${hazir
        ? promptBaglantisi({ tur: 'yetkiKur', proje: p.id, slug: depoSlug(p.repo),
            hedef: 'claude-yeni', yazi: 'Prompt oluştur ve Claude\'u aç' })
        : promptBaglantisi({ tur: 'yetkiKur', proje: p.id,
            yazi: 'Önce katmanları belirle', kapali: true })}
    </div>`);
}

function yetkiKoduOku(metin) {
  return jsonBlokOku(metin, x => !!x && x.kuruldu === true);
}

function yetkiKoduKarti(p, pl) {
  if (!rolListesi(pl.roller).length) return '';
  if (pl.yetkiKodTamamlandi) {
    return fbKart('#a15fc4', ICON.check, 'Kod hazır', null, p.id, `
      <div class="kur-deger duz">${svg(ICON.tik, 13)} Claude\'un cevabı aktarıldı</div>`);
  }
  if (!AUTH.yonetici) {
    return fbKart('#a15fc4', ICON.check, 'Kod hazır mı?', null, p.id,
      `<p class="fb-neden">Claude işini bitirdiğinde yönetici burayı onaylayacak.</p>`);
  }
  return fbKart('#a15fc4', ICON.check, 'Kod hazır mı?', null, p.id, `
    <p class="fb-neden">Claude işi bitirince sana bir JSON bloğu verecek —
      olduğu gibi buraya yapıştır.</p>
    <textarea class="anl-kutu" id="yk-json-${p.id}" rows="4"
      placeholder='{ "kuruldu": true }'></textarea>
    <div class="kur-dug">
      <button class="sayfa-dug ikincil" type="button" data-eylem="yetki-kod-onayla"
              data-proje="${p.id}">${svg(ICON.check, 15)} Aktar</button>
    </div>`);
}

function yetkiBilgiKarti() {
  return `<div class="card">
    <p class="fb-neden">${svg(ICON.info, 14)} Bundan sonra yeni kullanıcı eklemek
      artık burada değil — uygulamanın kendi <b>Ayarlar → Yetkiler</b> ekranından,
      admin tarafından yapılacak.</p>
  </div>`;
}

/* ---------- 9 · Yetkilendirme ----------
   Her katman için bir kart: ne yapabileceğini kendi kutusuna yazıyorsun,
   yazdıkların promptun içine birebir giriyor. Eski hâlinde katman listesi,
   görev kartı, prompt kartı ve kod kartı ayrı ayrı duruyordu — aynı işin
   dört kutuya bölünmüş hâliydi. */
function yetkiSayfasi(p, d) {
  const pl     = p.palet || {};
  const roller = rolListesi(pl.roller).slice().reverse();   /* geniş → dar */
  const gorev  = pl.rolGorev || {};
  const dolu   = roller.filter(ad => String(gorev[ad] || '').trim()).length;
  const tamam  = !!pl.yetkiTamamlandi;

  if (!roller.length) {
    return `<div class="fb-govde">`
      + adimBasligi(p, d, '0/0')
      + `<div class="bos-kutu">${svg(ICON.uyari, 18)}
          <span><b>Katman yok.</b> <b>Program temeli</b> durağında kaç katman
          olacağını belirle, sonra buraya dön.</span></div>`
      + `</div>`;
  }

  /* Katmanın adı projeye özel (Admin, Kasiyer, Garson…) — açıklamayı
     merdivendeki yerinden türetiyoruz, uydurmuyoruz. */
  const alt = i => i === 0 ? 'En geniş yetki — her şeyi görür ve yönetir.'
    : i === roller.length - 1 ? 'En dar yetki — yalnız günlük işler.'
    : 'Ara katman — kendi işinin tamamı.';
  const tint = i => i === 0 ? 'kirmizi' : i === roller.length - 1 ? 'yesil' : 'mavi';

  const rolKarti = (ad, i) => {
    const metin = gorev[ad] || '';
    return `
      <div class="btk">
        <div class="btk-ust">
          <span class="btk-ik ${tint(i)}">${svg(i === 0 ? ICON.anahtar : ICON.kisi, 22)}</span>
          <span class="btk-yz"><b>${esc(ad)}</b><i>${alt(i)}</i></span>
          <em class="btk-no mono ${tint(i)}">${i + 1}/${roller.length}</em>
        </div>
        <textarea class="anl-kutu btk-yazi" data-yk-gorev="${esc(ad)}"
          data-proje="${p.id}"
          placeholder="Bu rolün sahip olacağı yetkileri detaylı olarak yazın…">${esc(metin)}</textarea>
        <span class="anl-say" data-yk-say="${esc(ad)}">${metin.length} karakter</span>
      </div>`;
  };

  const hepsiDolu = dolu === roller.length;
  const jsonKart = pl.yetkiKodTamamlandi ? `
    <div class="btk">
      <div class="btk-ust">
        <span class="btk-ik yesil">${svg(ICON.tik, 22)}</span>
        <span class="btk-yz"><b>Kod hazır</b>
          <i>Claude'un verdiği JSON aktarıldı, kısıtlamalar koda işlendi.</i></span>
      </div>
    </div>` : `
    <div class="btk">
      <div class="btk-ust">
        <span class="btk-ik mavi">${svg(ICON.dosya, 22)}</span>
        <span class="btk-yz"><b>Claude'un verdiği JSON'u aktar</b>
          <i>Claude işi bitirince bir JSON bloğu verir — olduğu gibi buraya yapıştır.</i></span>
      </div>
      <textarea class="anl-kutu btk-yazi" id="yk-json-${p.id}"
        placeholder="Claude'un verdiği JSON verisini buraya yapıştırın…"></textarea>
      <button class="sayfa-dug bitir" type="button" data-eylem="yetki-kod-onayla"
              data-proje="${p.id}">${svg(ICON.dosya, 15)} JSON aktar</button>
    </div>`;

  return `<div class="fb-govde">`
    + adimBasligi(p, d, dolu + '/' + roller.length)
    + (tamam ? fmTamamBar(p, 'yetki', 'Katman yetkileri koda işlendi.', false) : '')
    + roller.map(rolKarti).join('')
    + (hepsiDolu
        ? promptBaglantisi({ tur: 'yetkiKur', proje: p.id, slug: depoSlug(p.repo),
            hedef: 'claude-yeni', yazi: 'Prompt oluştur' })
        : `<button class="sayfa-dug" type="button" disabled>
             ${svg(ICON.yildiz, 15)} Önce her katmanı doldur</button>`)
    + jsonKart
    + `</div>`;
}

/* ---------- 9 · Güvenlik kontrolü ----------
   Ayarlar > Güvenlik Testi ile AYNI motor (guvenlikTestiCalistir). Tek fark:
   Supabase adresi ve anon key projeden geliyor — "Bağlantılar ve temel"de
   zaten girilmişti, bir daha sorulmuyor. Kullanıcı yalnız test hesabını
   yazıyor.

   Bu durak bilerek kendi kendini onaylatmıyor: ölçüm sonucu palete yazılıyor
   (guvenlikOlcum) ve "tamamlandı" düğmesi ancak SIFIR AÇIK varken açılıyor.
   "Kuruldu" demek bir iddiadır; açık olup olmadığı ancak saldırarak bilinir. */

/* Ekranda yaşayan, kaydedilmeyen durum — proje başına. Sonucun kalıcı özeti
   palete yazılıyor, tam tablo yalnız o oturumda duruyor. */
const DURAK_GUVENLIK = {};

/* "19.09.2026 14:32 · 109 deneme · sıfır açık" — durak listesinde de,
   aşamanın içinde de aynı cümle. Tarihi bilerek başa koyuyoruz: bir ölçümün
   ne zaman yapıldığı, sonucu kadar önemli. */
function olcumTarihi(olcum) {
  const t = new Date((olcum || {}).tarih);
  if (isNaN(t)) return '';
  return t.toLocaleDateString('tr-TR') + ' '
    + t.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });
}

function olcumOzeti(olcum) {
  if (!olcum) return 'Henüz test edilmedi.';
  const tarih = olcumTarihi(olcum);
  const sonuc = olcum.acik
    ? olcum.acik + ' açık bulundu'
    : 'sıfır açık';
  return [tarih, olcum.toplam + ' deneme', sonuc].filter(Boolean).join(' · ');
}

function durakGuvenlikDurum(projeId) {
  if (!DURAK_GUVENLIK[projeId]) {
    DURAK_GUVENLIK[projeId] = { calisiyor: false, sonuc: null, harita: null,
      ustKatmanUyarisi: false, kalintilar: [], tabloKaynagi: '' };
  }
  return DURAK_GUVENLIK[projeId];
}

/* anon key gizli bir şey değil (tarayıcıya zaten iniyor) ama ekranda tam
   görünmesinin bir faydası da yok — ortasını kısaltıyoruz. */
function anahtarKisalt(a) {
  const x = String(a || '').trim();
  return x.length > 22 ? x.slice(0, 12) + '…' + x.slice(-6) : x;
}

function guvenlikBaglantiKarti(p, pl) {
  const url = String(pl.supabaseUrl || '').trim();
  const anon = String(pl.supabaseAnon || '').trim();
  if (!url || !anon) {
    return fbKart('#3f9d7a', ICON.uyari, 'Bağlantı eksik', null, p.id, `
      <p class="fb-neden">Bu projenin Supabase adresi ya da anon key'i kayıtlı
        değil. <b>Bağlantılar ve temel</b> durağına dönüp gir — test onlarsız
        başlamaz.</p>`);
  }
  return fbKart('#3f9d7a', ICON.gGuvenlik, 'Bağlantı', null, p.id, `
    <p class="fb-neden">Bağlantılar ve temel'den geldi, tekrar girmene gerek yok.</p>
    <div class="kur-deger duz">${esc(url)}</div>
    <div class="kur-deger duz" style="margin-top:6px">${esc(anahtarKisalt(anon))}</div>`);
}

/* Jeton ve guvenlik-sql fonksiyonu HESAP bazında bir kere kurulur; her
   projede tekrar kurulmaz. Burada yalnız hatırlatılıyor, kod kopyalama
   düğmesi Ayarlar'dakiyle aynı eylemi kullanıyor. */
function guvenlikHazirlikKarti(p) {
  return fbKart('#3f9d7a', ICON.info, 'Bir kere kurulur · jeton ve köprü', null, p.id, `
    <p class="fb-neden">Dış denetimler (A) hiçbir şey istemez, hemen çalışır.
      Yapısal (B), programa özel (C) ve sunucu işlevi (Ç) denetimleri ise
      veritabanının içine bakabilmek için bir köprü ister. <b>Bir kere kur,
      bütün projelerde geçerli</b> — kuruluysa bu kartı geç.</p>
    <p class="ipucu"><b>1 · Jetonu al.</b> Test edilecek projelerin bulunduğu
      Supabase <b>hesabından</b> (projeden değil) →
      <code>supabase.com/dashboard/account/tokens</code> → Generate new token →
      <b>Create legacy token</b>. Değer <code>sbp_</code> ile başlar.</p>
    <p class="ipucu"><b>2 · Köprüyü kur.</b> Studio'nun kendi Supabase'inde
      Edge Functions → New Function, adı <code>guvenlik-sql</code>, aşağıdaki
      kodu yapıştır, deploy et. Sonra o fonksiyonun Settings → Secrets bölümüne
      <code>NS_SUPABASE_JETON</code> adıyla jetonu ekle.</p>
    <p class="ipucu"><b>3 · Kod güncellenince.</b> Studio yeni sürüm çıkarınca
      aynı fonksiyonun <b>Code</b> sekmesine kodu yeniden yapıştırıp deploy et.
      Secrets'a dokunma. Bunu atlarsan yeni denetimler sessizce çalışmaz.</p>
    <div class="kur-dug">
      <button class="sayfa-dug ikincil" type="button" data-eylem="guvenlik-sql-kopyala">
        ${svg(ICON.kopya, 15)} Fonksiyon kodunu kopyala</button>
    </div>`);
}

function guvenlikTestKarti(p, pl, g) {
  const hazir = !!String(pl.supabaseUrl || '').trim() && !!String(pl.supabaseAnon || '').trim();
  const depo = String(pl.guvenlikDepoAdresi || p.repo || '').trim();
  return fbKart('#3f9d7a', ICON.kisi, 'Test hesabı', null, p.id, `
    <p class="fb-neden">Bu projedeki bir hesabın e-postası ve şifresi. <b>Yönetici
      olmayan</b> bir hesap ver — üst katman zaten her şeyi yapabilir, onunla
      ölçüm anlamsız olur. Şifre hiçbir yere kaydedilmiyor.</p>
    <label class="field"><span>E-posta</span>
      <input type="text" id="gvd-eposta-${p.id}" value="${esc(g.eposta || '')}"
             placeholder="personel@firma.com" autocomplete="off"
             spellcheck="false" autocapitalize="off"></label>
    <label class="field" style="margin-top:10px"><span>Şifre</span>
      <input type="password" id="gvd-sifre-${p.id}" placeholder="••••••••"
             autocomplete="off"></label>
    <label class="field" style="margin-top:10px"><span>guvenlik.json adresi</span>
      <input type="text" id="gvd-depo-${p.id}" value="${esc(depo)}"
             placeholder="github.com/sahip/depo ya da https://.../guvenlik.json"
             autocomplete="off" spellcheck="false" autocapitalize="off"></label>
    <p class="ipucu">Depo gizliyse github.com adresi okunamaz — dosyanın yayında
      olduğu doğrudan adresi yaz (ör. GitHub Pages). Programa özel denetimler
      bu dosyadan geliyor.</p>
    <div class="kur-dug">
      <button class="sayfa-dug" type="button" data-eylem="guvenlik-durak-test"
              data-proje="${p.id}" ${g.calisiyor || !hazir ? 'disabled' : ''}>
        ${svg(ICON.gGuvenlik, 15)} ${g.calisiyor ? 'Test ediliyor…' : 'Test Et'}
      </button>
    </div>`);
}

function guvenlikSonTestKarti(p, pl) {
  const o = pl.guvenlikOlcum;
  if (!o) {
    return fbKart('#3f9d7a', ICON.gGuvenlik, 'Son test', null, p.id, `
      <div class="kur-deger duz">Henüz test edilmedi</div>
      <p class="ipucu" style="margin-top:8px">Aşağıdaki hesapla giriş yapıp
        <b>Test Et</b>'e bas — sonuç burada duracak.</p>`);
  }
  return fbKart('#3f9d7a', ICON.gGuvenlik, 'Son test', null, p.id, `
    <div class="kur-deger duz">${o.acik
      ? `${svg(ICON.uyari, 13)} ${o.acik} açık bulundu`
      : `${svg(ICON.tik, 13)} sıfır açık`}</div>
    <p class="ipucu" style="margin-top:8px">${esc(olcumTarihi(o))} · ${o.toplam} deneme</p>
    <p class="ipucu">Bu satır o testin yapıldığı andaki hâli gösterir. Kodda ya
      da SQL'de bir şey değiştiyse yeniden ölç — eski sonuç yeni hâli anlatmaz.</p>`);
}

/* Kurulum artık projeye yazılıyor, tarayıcıya değil: jeton hesaba ait ve
   her müşterinin Supabase hesabı ayrı olabiliyor — yeni projede jeton da
   secret de yeniden yapılıyor. Edge Function maddesi kalktı; o gerçekten
   tek seferlik ve Studio'nun kendi Supabase'inde duruyor. */
let GUVENLIK_KURULUM_ACIK = false;

const GUVENLIK_KURULUM_ADIM = [
  { no: 'jeton', ikon: 'anahtar', ad: 'Jetonu oluşturdum',
    alt: p => (projeAdi(p) || 'Bu proje') + ' projesinin Supabase hesabında '
       + 'Account → Access Tokens → Generate new token → Create legacy token '
       + 'yaptım. Değer sbp_ ile başlıyor.',
    adres: 'https://supabase.com/dashboard/account/tokens', adresAd: 'Jeton sayfasını aç' },
  { no: 'secret', ikon: 'kilit', ad: 'Jetonu Studio\'ya tanıttım',
    alt: () => 'Studio\'nun Supabase\'inde guvenlik-sql fonksiyonu → Settings → '
       + 'Secrets → NS_SUPABASE_JETON değerini bu jetonla değiştirdim. '
       + 'Aynı adla kaydetmek üzerine yazıyor, silmeye gerek yok.' },
];

function guvenlikKurulumBolumu(p) {
  const durum = (p.palet || {}).guvenlikKurulum || {};
  const hepsi = GUVENLIK_KURULUM_ADIM.every(a => durum[a.no]);

  if (hepsi && !GUVENLIK_KURULUM_ACIK) {
    return `
      <div class="gk-ozet">
        <span class="gk-ozet-ik">${svg(ICON.tik, 15)}</span>
        <span class="gk-ozet-yz"><b>Jeton hazır</b>
          <i>Bu projenin hesabından alınan jeton Studio'ya tanıtıldı.</i></span>
        <button class="gk-ozet-btn" type="button" data-eylem="guvenlik-kurulum-ac">Düzenle</button>
      </div>`;
  }

  return `
    <div class="gk-kart">
      ${GUVENLIK_KURULUM_ADIM.map(a => `
        <div class="gk ${durum[a.no] ? 'on' : ''}">
          <span class="gk-ik">${svg(ICON[a.ikon], 20)}</span>
          <span class="gk-yz">
            <b>${esc(a.ad)}</b>
            <i>${esc(a.alt(p))}</i>
            ${durum[a.no] || !a.adres ? '' : `
              <a class="gk-btn" target="_blank" rel="noopener" href="${a.adres}">
                ${svg(ICON.disari, 13)} ${esc(a.adresAd)}</a>`}
          </span>
          <button class="gk-tik" type="button" data-eylem="guvenlik-kurulum-tik"
                  data-proje="${p.id}" data-no="${a.no}"
                  aria-label="${esc(a.ad)}">${svg(ICON.tik, 15)}</button>
        </div>`).join('')}
    </div>
    <p class="gk-not">${svg(ICON.info, 13)}
      <span>Köprü fonksiyonu (<b>guvenlik-sql</b>) Studio'nun Supabase'inde bir
      kere kuruldu, projeye göre değişmiyor. Yalnız «fonksiyon kodu güncellendi»
      dediğimde yeniden yapıştır:
      <button class="gk-ic-btn" type="button" data-eylem="guvenlik-sql-kopyala">
        kodu kopyala</button></span></p>`;
}

/* ---------- 10 · Güvenlik kontrolü ----------
   Ekranda üç şey var: bir kerelik köprü kurulumu (bitince tek satıra
   iniyor), test hesabı ve sonuç. Supabase adresi/anon key kartı kalktı —
   Bağlantılar ve temel'de zaten girildi, burada göstermenin faydası yoktu. */
function guvenlikDurakSayfasi(p, d) {
  const pl = p.palet || {};
  if (!sunuculuMu(p)) {
    return `<div class="fb-govde">`
      + adimBasligi(p, d, '')
      + `<div class="bos-kutu">${svg(ICON.gGuvenlik, 18)}
          <span>Bu projenin verisi tarayıcıda duruyor. Sunucu tarafı olmadığı
          için saldırılacak bir kapı da yok — bu aşama atlandı.</span></div>`
      + `</div>`;
  }

  const g = durakGuvenlikDurum(p.id);
  const hazir = !!String(pl.supabaseUrl || '').trim() && !!String(pl.supabaseAnon || '').trim();
  const depo = String(pl.guvenlikDepoAdresi || p.repo || '').trim();
  const o = pl.guvenlikOlcum;

  return `<div class="fb-govde">`
    + adimBasligi(p, d, '')
    + guvenlikKurulumBolumu(p)
    + (o ? `
      <div class="gk-son ${o.acik ? 'acik' : 'temiz'}">
        <span class="gk-son-ik">${svg(o.acik ? ICON.uyari : ICON.tik, 16)}</span>
        <span class="gk-son-yz">
          <b>${o.acik ? o.acik + ' açık bulundu' : 'Son ölçüm temiz'}</b>
          <i>${esc(olcumTarihi(o))} · ${o.toplam} deneme</i>
        </span>
      </div>` : '')
    + `<div class="btk">
        <div class="btk-ust">
          <span class="btk-ik kirmizi">${svg(ICON.anahtar, 22)}</span>
          <span class="btk-yz"><b>Erişim bilgileri</b>
            <i>Bu projedeki yönetici olmayan bir hesap. Şifre kaydedilmiyor.</i></span>
        </div>
        <label class="gf">
          <span class="gf-et">E-posta</span>
          <span class="gf-kutu">${svg(ICON.mail, 17)}
            <input type="text" id="gvd-eposta-${p.id}" value="${esc(g.eposta || '')}"
                   placeholder="personel@firma.com" autocomplete="off"
                   spellcheck="false" autocapitalize="off"></span>
        </label>
        <label class="gf">
          <span class="gf-et">Şifre</span>
          <span class="gf-kutu">${svg(ICON.kilit, 17)}
            <input type="password" id="gvd-sifre-${p.id}" placeholder="Hesabın şifresi"
                   autocomplete="off">
            <button class="gf-goz" type="button" data-eylem="guvenlik-sifre-goster"
                    data-hedef="gvd-sifre-${p.id}" aria-label="Şifreyi göster">
              ${svg(ICON.goz, 16)}</button></span>
        </label>
        <label class="gf">
          <span class="gf-et">guvenlik.json adresi</span>
          <span class="gf-kutu">${svg(ICON.dal, 17)}
            <input type="text" id="gvd-depo-${p.id}" value="${esc(depo)}"
                   placeholder="github.com/sahip/depo" autocomplete="off"
                   spellcheck="false" autocapitalize="off"></span>
        </label>
        ${pl.guvenlikJsonVar === false ? `<p class="ipucu">Yetkilendirme adımında
          <code>guvenlik.json</code> yazılmadı — programa özel denetimler atlanacak.</p>` : ''}
        ${hazir ? '' : `<p class="ipucu">Supabase adresi ya da anon key kayıtlı değil —
          <b>Bağlantılar ve temel</b> durağına dön.</p>`}
      </div>`
    + `<button class="sayfa-dug bitir" type="button" data-eylem="guvenlik-durak-test"
               data-proje="${p.id}" ${g.calisiyor || !hazir ? 'disabled' : ''}>
        ${svg(ICON.gGuvenlik, 16)} ${g.calisiyor ? 'Test ediliyor…' : 'Test Et'}</button>`
    + guvenlikSonucTablosu(g.sonuc, g.ustKatmanUyarisi, g.kalintilar, g.harita, g.tabloKaynagi, p.id)
    + (o && o.acik ? `<div class="note uyari" style="margin-top:14px">${svg(ICON.uyari, 15)}
        <span><b>Açık varken Final açılmaz.</b> Bulguları Claude'a ver, düzeltmeyi
        <b>yeni numaralı bir göç</b> olarak yazsın — yazılmış SQL düzeltilmez.
        Sonra burada yeniden ölç.</span></div>` : '')
    + `</div>`;
}

/* Final notları — eski kayıtlarda düz metindi; obje biçimine ({metin, tamam})
   burada düşülüyor ki eski projelerde de çökmesin. */
function finalNotlariOku(pl) {
  return (Array.isArray(pl.finalNotlar) ? pl.finalNotlar : [])
    .map(n => typeof n === 'string' ? { metin: n, tamam: false } : n);
}

/* 9 · Final — görevler bitti, incele, ya final ver ya da bulduğunu not et. */
/* ---------- 11 · Final ----------
   Öteki duraklarla aynı kalıp: başlık kartı, yeşil tamamlandı şeridi,
   kartlar ve altta tek kırmızı düğme. Eski hero + takvim çubuğu kalktı —
   çubuk projenin kaldırılan renginden besleniyordu ve sayıyı zaten
   başlıktaki rozet söylüyor. */
function finalSayfasi(p, d) {
  const pl      = p.palet || {};
  const verildi = !!pl.finalVerildi;
  const notlar  = finalNotlariOku(pl);
  const s       = DB.sayim(p.id);
  const hazir   = gelistirmeBitti(p);
  const bitmis  = notlar.filter(n => n.tamam).length;

  const notListesi = !notlar.length ? '' : `
    <div class="btk">
      <div class="btk-ust">
        <span class="btk-ik kirmizi">${svg(ICON.uyari, 22)}</span>
        <span class="btk-yz"><b>Bildirilen notlar</b>
          <i>Final vermeden önce kapanması gerekenler.</i></span>
        <em class="btk-no mono">${bitmis}/${notlar.length}</em>
      </div>
      <div class="fn-liste">
        ${notlar.map((n, i) => `
          <div class="fn ${n.tamam ? 'on' : ''}">
            <button class="fn-tik" type="button" data-eylem="final-not-tamam"
                    data-proje="${p.id}" data-deger="${i}"
                    aria-label="Tamamlandı">${svg(ICON.tik, 13)}</button>
            <span class="fn-yz">${esc(n.metin)}</span>
            ${n.tamam ? '' : `
              <a class="fn-btn" target="_blank" rel="noopener" data-pano="finalNot:${i}"
                 data-proje="${p.id}" data-hedef="Claude Code"
                 href="${esc(claudeAdresi(depoSlug(p.repo)))}">
                ${svg(ICON.kopya, 13)} Prompt</a>`}
            <button class="fn-btn sil" type="button" data-eylem="final-not-sil"
                    data-proje="${p.id}" data-deger="${i}" aria-label="Notu sil">
              ${svg(ICON.cop, 13)}</button>
          </div>`).join('')}
      </div>
    </div>`;

  return `<div class="fb-govde">`
    + adimBasligi(p, d, notlar.length ? bitmis + '/' + notlar.length : '')
    + (verildi ? fmTamamBar(p, 'final', 'Final sürüm teslim edildi.', false) : '')
    + `<div class="btk">
        <div class="btk-ust">
          <span class="btk-ik ${hazir ? 'yesil' : 'mavi'}">${svg(ICON.bayrak, 22)}</span>
          <span class="btk-yz"><b>Son kontrol</b>
            <i>${hazir || verildi
              ? (s.gorev > 0 ? 'Bütün görevler bitti. ' : 'Geliştirmeye ihtiyaç yoktu. ')
                + 'Uygulamayı son bir kez dene — sorunsuzsa final ver.'
              : 'Final, <b>' + (sablonMu(p) ? 'Değişim' : 'Beta ve geliştirme')
                + '</b> durağı tamamlandığında verilebilir.'}</i></span>
        </div>
      </div>`
    + `<div class="btk">
        <div class="btk-ust">
          <span class="btk-ik mavi">${svg(ICON.kalem, 22)}</span>
          <span class="btk-yz"><b>Hata veya güncelleme bildir</b>
            <i>Denerken bir şey bulduysan not düş — notlar kapanmadan final verme.</i></span>
          <button class="btk-dug" type="button" data-eylem="final-not-ekle"
                  data-proje="${p.id}">${svg(ICON.arti, 15)} Not ekle</button>
        </div>
      </div>`
    + notListesi
    + (verildi ? '' : `
      <button class="sayfa-dug bitir" type="button" data-eylem="final-onay"
              data-proje="${p.id}" ${hazir ? '' : 'disabled'}>
        ${svg(ICON.bayrak, 16)} Final ver</button>`)
    + `<p class="gk-not">${svg(ICON.info, 13)}
        <span>Finalden sonra gelen istekler <b>Geliştirme</b> durağında yürür.</span></p>`
    + `</div>`;
}

/* 8 · Geliştirme (eski Güncellemeler) — proje yaşadıkça açık kalan durak.
   Final verildikten sonra buraya düşülür. Beta'daki "anlat, prompt oluştur,
   Claude'a yapıştır" akışının aynısı — yalnız artık canlı bir uygulama
   olduğu için prompt ekstra bir dikkat uyarısı taşıyor (bkz. guncellemeIstek). */
const GUNCELLEME_ISTEK = {};

function guncellemeSayfasi(p, d) {
  const gorevler = DB.gorevleri({ proje: p.id }).filter(g => g.durum !== 'tamamlandi');
  const istek = GUNCELLEME_ISTEK[p.id] || '';
  const dolu = istek.trim().length > 20;

  return sayfaHero(p, d)
    + bolumBas('Depo') + `
      <div class="satirlar">
        <div class="sr" data-eylem="repo" data-proje="${p.id}" role="button" tabindex="0">
          ${svg(ICON.katman, 15)} Adres
          ${p.repo ? `<b class="mono">${esc(p.repo)}</b>` : '<b class="eksik">eklenmedi</b>'}</div>
      </div>`
    + bolumBas('Güncelleme isteği') + `
      <div class="card">
        <textarea class="anl-kutu" data-guncelleme-istek="${p.id}"
           placeholder="Örn. Stok listesine tarih filtresi ekle">${esc(istek)}</textarea>
        <div class="anl-dug">
          ${dolu
            ? `<a target="_blank" rel="noopener" data-pano="guncellemeIstek" data-proje="${p.id}"
                 data-hedef="Claude Code" href="${esc(claudeAdresi(depoSlug(p.repo)))}">
                 ${svg(ICON.kopya, 15)} Kopyala ve aç</a>`
            : `<button type="button" disabled>${svg(ICON.kopya, 15)} Prompt oluştur</button>`}
          <button class="ana" type="button" data-eylem="anlat-aktar" data-proje="${p.id}">
            ${svg(ICON.ice, 15)} JSON varsa yükle</button>
        </div>
        <p class="anl-not">Claude güncellemeyi yapar. Bu değişiklik yapıyı da (yeni
          sayfa ya da alan) etkiliyorsa sonunda bir JSON bloğu verir — onu
          yukarıdaki <b>JSON varsa yükle</b> ile yapıştır.</p>
      </div>`
    + bolumBas('Açık istekler')
    + (gorevler.length
        ? `<div class="card liste">${gorevler.slice(0, 12).map(gorevKarti).join('')}</div>`
        : `<div class="bos-kutu">${svg(ICON.check, 18)}
            <span>Açık istek yok. Yeni bir şey istendiğinde görev olarak aç;
            burada listelenir.</span></div>`)
    + bolumBas('Sürüm notları') + `
      <div class="bos-kutu">
        ${svg(ICON.info, 18)}
        <span>GitHub bağlanınca commit'ler buraya düşecek. Görev numarası
        <b class="mono">[${TASK_PREFIX}-142]</b> biçiminde yazıldığında Studio görevi
        kendiliğinden Kontrolde'ye çeker. Adım 5'te geliyor.</span>
      </div>`;
}

/* Ekranın tepesi: logo, firma adı, platform ve tek ilerleme çubuğu.
   Dört ayrı istatistik kartının yerini aldı — rakamlar zaten durakların içinde. */
/* Proje sayfasının tepesi. Aşama sayfalarındaki başlık kartıyla aynı
   ölçüde: iki sayfanın tek farkı kartın içeriği olsun, düzeni değil.
   Aşamaya basınca o kartın yerini aşamanın kendi kartı alıyor. */
function projeKunyesi(p) {
  const s = DB.sayim(p.id);
  const adres = DB.logoAdres[p.id];
  const alt = [p.sektor, PLATFORM_ADI[p.platform] || p.platform,
               VERI_ADI[p.veri] || p.veri].filter(Boolean).map(esc).join(' · ');

  return `
    <div class="pk">
      <span class="pk-logo ${adres ? 'yukleniyor' : ''}"
            ${adres ? `data-logo="${esc(adres)}"` : ''}>
        <span class="logo-harf">${esc(basHarf(p.firma))}</span>
        ${adres ? '<span class="donen"></span>' : ''}
      </span>
      <span class="pk-yz">
        <span class="pk-ad">${esc(basHarfleriBuyuk(projeAdi(p)))}
          ${(p.palet || {}).projeTuru === 'test' ? '<span class="pill dev">Test</span>' : ''}</span>
        <span class="pk-alt">${alt}</span>
      </span>
      <span class="pk-yuz"><b>%${projeAsamaYuzde(p)}</b><i>tamam</i></span>
    </div>`;
}

/* Geliştirme durağı bitti mi: kullanıcı "Beta ve geliştirme bitti" deyip
   onayladıysa. Final sayfası da aynı şartı soruyor — tek yerde tutulmazsa
   ikisi ayrı düşer (biri güncellenir, öteki unutulur). */
function gelistirmeBitti(p) {
  const pl = p.palet || {};
  /* Şablon kopyasında "Beta ve geliştirme" yerine "Değişim" durağı var —
     o durağın kendi bitti bayrağı ayrı bir alanda tutuluyor. Bunu
     kontrol etmezsek Final'in "hazır mı" kontrolü şablon projelerinde
     hiç doğru olmaz, "Final ver" düğmesi hep kilitli kalır. */
  return sablonMu(p) ? sablonDegisimBittiMi(p) : !!pl.betaTamamlandi;
}

/* Projenin beş durağı. Durum veriden okunur, elle girilmez. */
function projeDuraklari(p) {
  const s        = DB.sayim(p.id);
  const moduller = DB.modulleri(p.id);
  const gercek   = moduller.filter(m => m.ad !== GENEL_MODUL).length;
  const pl0 = p.palet || {};
  /* Hangi yol haritası çizilecek — projenin paketi söylüyor. */
  const paketli = sablonMu(p);

  return [
    {
      /* Logo isteğe bağlı: markanın kendisi ad, iletişim ve sektörle kuruluyor. */
      ad: 'Firma bilgileri',
      bitti: !!p.firma && !!p.telefon && !!p.eposta && !!p.sektor,
      ozet: [p.sektor, p.telefon, p.eposta].filter(Boolean).join(' · ')
        || 'Firma kim, kime ulaşacağız, hangi işi yapıyor?',
    },
    {
      ad: 'Program temeli',
      bitti: yerDolu(p),
      ozet: pl0.modulAdi
        ? [pl0.modulAdi, pl0.veriKatmani].filter(Boolean).join(' · ')
        : 'Bu paketin adı, katmanları, verisi nerede duracak?',
    },
    {
      /* Eski "Nizam kurulum paketi" durağı buraya katlandı. Supabase
         seçiliyse gerçek bağlantı (adres+anon key) de burada — karar
         Program temeli'nde, bağlantı burada. Sabit iskelet onayı (eski
         "Kuruldu" kutusu) kalktı: Studio depoya bakamadığı için elle
         onaylatmak gereksiz bir sürtünmeydi, sihirbazı bitirmek yetiyor. */
      ad: 'Bağlantılar ve temel',
      bitti: !!p.repo && claudeBaglandiMi(p)
             && !!pl0.alanAdi && !!pl0.yayinda
             && (!sunuculuMu(p) || (!!String(pl0.supabaseUrl || '').trim()
                                     && !!String(pl0.supabaseAnon || '').trim()))
             && (pl0.alanTuru !== 'namecheap' || !!pl0.namecheapBaglandi)
             /* Template'in SQL'i (link ya da metin) varsa yükleme de burada
                bitmiş olmalı — bkz. baglantiAdimListesi. */
             && (!pl0.sablonSqlMetinVar || !!pl0.sqlYuklendi),
      ozet: !p.repo
        ? 'Depo, sohbet, adres ve yayın burada kurulacak.'
        : !pl0.yayinda
          ? (pl0.alanAdi ? 'Depo, sohbet ve adres hazır. Sıra yayında.' : 'Depo hazır. Sıra adres ve yayında.')
          : 'Bağlantılar hazır.',
    },
    paketli ? {
      /* Eskiden ayrı bir "Temel tanımlar" durağıydı — artık "Değişim"in
         içine katlandı (bkz. sablonDegisimSayfasi). Slot sırayı bozmasın
         diye duruyor, tamamen gizli — bkz. "Test ve Güncelle" örneği. */
      ad: 'Değişim',
      bitti: true,
      sayilmaz: true,
      gizli: true,
      ozet: 'Değişim durağına taşındı.',
    } : {
      /* Sıra kilitli olduğu için bu durağa gelindiğinde Bağlantılar zaten
         bitmiş oluyor — burada tekrar depo/sohbet kontrolü gerekmiyor. */
      ad: 'Yapı planlama',
      bitti: gercek > 0 && s.sayfa > 0,
      ozet: gercek && s.sayfa
        ? `${gercek} modül · ${s.sayfa} sayfa`
        : 'Hangi modüller ve sayfalar olacak?',
    },
    paketli ? {
      ad: 'Değişim',
      bitti: sablonDegisimBittiMi(p),
      ozet: (() => {
        if (sablonDegisimBittiMi(p)) return 'Tamamlandı.';
        if (!sablonTanimlarBittiMi(p)) {
          const liste = sablonTanimlarListesi();
          const biten = liste.filter(k => sablonTanimlarAdimBittiMi(k, p)).length;
          return `Temel tanımlar: ${biten}/${liste.length} adım`;
        }
        if (!pl0.sablonDegisimTamamlandi) return 'Toplanan tanımlar hazır — veri/format promptunu ver.';
        return 'Veri ve format hazır — sıra giriş ve kullanıcı eklemede.';
      })(),
    } : {
      /* Plan + (varsa) veritabanı + beş kod aşaması. Hepsi bitmeden Beta
         açılmıyor — denenecek bir uygulama yok. */
      ad: 'Kurulum',
      bitti: kurulumSihirbazListesi(p).every(k => kurulumSihirbazAdimBittiMi(k, p)),
      ozet: (() => {
        const liste = kurulumSihirbazListesi(p);
        const biten = liste.filter(k => kurulumSihirbazAdimBittiMi(k, p)).length;
        return biten < liste.length
          ? `${biten}/${liste.length} adım` : 'Kurulum tamamlandı.';
      })(),
    },
    paketli ? {
      /* Şablon kopyasında bu döngü "Değişim" durağının içinde — slot sırayı
         bozmasın diye duruyor, tamamen gizli. */
      ad: 'Beta ve geliştirme',
      bitti: true,
      sayilmaz: true,
      gizli: true,
      ozet: 'Değişim durağına taşındı.',
    } : {
      /* "Bitti" kullanıcının elle "Beta ve geliştirme bitti" demesine bağlı:
         denemenin kendiliğinden biteceği bir an yok. */
      ad: 'Beta ve geliştirme',
      bitti: gelistirmeBitti(p),
      ozet: gelistirmeBitti(p)
        ? 'Tamamlandı.' : 'Yayında — dene, eksik gördüğünü anlat.',
    },
    paketli ? {
      /* Yalnız şablon kopyalarında görünür: normal projede bu döngü zaten
         Beta ve geliştirme'nin içinde, ayrı bir durak gerekmiyor. */
      ad: 'Test ve Güncelle',
      bitti: !!pl0.denemeTamamlandi,
      ozet: pl0.denemeTamamlandi
        ? 'Tamamlandı.'
        : 'Uygulamayı dene, eksik ya da hatalı gördüğünü Claude\'a yazdır.',
    } : {
      /* Normal projede bu durağın hiç karşılığı yok — sayaçtan (sayilmaz)
         hariç tutmak yetmiyordu, satır yine de listede görünüp "kilitli"
         ya da "bitti" gibi durmaya devam ediyordu. `gizli` ile projeYolu
         bu satırı tamamen listeden çıkarıyor. */
      ad: 'Test ve Güncelle',
      bitti: true,
      sayilmaz: true,
      gizli: true,
      ozet: 'Bu proje şablon kopyası değil — bu aşama geçerli değil.',
    },
    {
      ad: 'Profesyonel tasarım',
      bitti: !!pl0.tasarimTamamlandi,
      ozet: pl0.tasarimTamamlandi
        ? 'Tamamlandı.'
        : pl0.secilenYon
          ? 'Yön seçildi — uygulanınca tamamlandı diye işaretle.'
          : 'Yönleri ChatGPT\'ye ver ya da müşterinin kendi görselini yükle, seçsin.',
    },
    {
      ad: 'Yetkilendirme',
      bitti: !!pl0.yetkiTamamlandi,
      ozet: pl0.yetkiTamamlandi
        ? 'Tamamlandı.'
        : !pl0.yetkiKodTamamlandi
          ? 'Her katman ne yapabilecek — promptu Claude\'a ver.'
          : 'Son onayı bekliyor.',
    },
    sunuculuMu(p) ? {
      /* Bu durak "tamamlandı" işareti taşımıyor: elle onaylanan bir görev
         değil, her çalıştırıldığında o anki hâli söyleyen bir ölçü aleti.
         Listede duran şey son testin tarihi ve sonucu. */
      ad: 'Güvenlik kontrolü',
      bitti: !!(pl0.guvenlikOlcum && !pl0.guvenlikOlcum.acik),
      ozet: !pl0.guvenlikOlcum
        ? 'Henüz test edilmedi.'
        : olcumOzeti(pl0.guvenlikOlcum),
    } : {
      /* Verisi tarayıcıda duran projede sunucu tarafı yok: saldırılacak bir
         kapı da yok. Gizlenmezse Final sonsuza kadar kilitli kalırdı. */
      ad: 'Güvenlik kontrolü',
      bitti: true,
      sayilmaz: true,
      gizli: true,
      ozet: 'Bu projenin verisi tarayıcıda duruyor — sunucu tarafı yok.',
    },
    {
      ad: 'Final',
      bitti: !!(p.palet && p.palet.finalVerildi),
      ozet: (p.palet && p.palet.finalVerildi)
        ? 'Final sürüm verildi.'
        : 'Bütün görevler bitince final sürümü teslim et.',
    },
  ].concat(pl0.finalVerildi ? [{
    /* Final verilmeden önce hiç görünmez — henüz sırası gelmemiş bir durak
       değil, finalden sonra doğan ayrı bir aşama. Bilerek hiç bitmiyor:
       proje yaşadıkça yeni istek gelir. `sayilmaz` "Adımlar" yüzdesine hiç
       girmesin diye — final verilince proje zaten %100 tamamlanmış sayılır. */
    ad: 'Geliştirme',
    bitti: false,
    sayilmaz: true,
    ozet: 'Finalden sonra gelen istekler burada yürür.',
  }] : []);
}

/* Her durağın simgesi. Hepsi aynı simgeyle dururken kartlar birbirinden
   ayırt edilemiyordu. */
/* Bir durak kilitli mi: kendinden önceki bitmemiş bir durak varsa evet. */
function durakKilitli(projeId, anahtar) {
  const p = DB.proje(projeId);
  if (!p) return false;
  /* Güvenlik kontrolü hiç kilitlenmez: bir görev değil, ölçü aleti.
     Kurulumun her anında "şu an açık var mı" diye bakabilmek gerekir —
     sırasını beklemek ölçümü geciktirmekten başka işe yaramaz. */
  if (anahtar === 'guvenlik') return false;
  const sira = Object.keys(DURAKLAR).indexOf(anahtar);
  if (sira < 1) return false;
  const duraklar = projeDuraklari(p);
  const simdi = duraklar.findIndex(d => !d.bitti);
  return simdi !== -1 && sira > simdi;
}

/* İki satır arasındaki dirsek: üst satırın sonundan alt satırın başına.
   Izgara sabit olduğu için ok da sabit — ölçmeye gerek yok. Beta ve karar
   ızgaralarında (`.ya` kareleri) hâlâ kullanılıyor. */
function yolOku(yesil) {
  return `
    <div class="ya-bosluk">
      <svg viewBox="0 0 300 34" preserveAspectRatio="none" aria-hidden="true"
           class="ya-ok ${yesil ? 'gecti' : ''}">
        <path d="M250 0 L250 12 Q250 17 245 17 L55 17 Q50 17 50 22 L50 30"></path>
        <path class="uc" d="M45 25 L50 31 L55 25"></path>
      </svg>
    </div>`;
}


function projeYolu(p) {
  const liste   = durakAkisi(p);
  const sayilan = liste.filter(d => !d.sayilmaz);
  const biten   = sayilan.filter(d => d.bitti).length;
  const yuzde   = projeAsamaYuzde(p);
  /* Kaldığın aşama: bitmemiş ilk durak. Hepsi bittiyse sonuncusu. */
  const su      = liste.find(d => !d.bitti) || liste[liste.length - 1];

  /* Uzun aşama listesi buradan kalktı: aşamalar arasında gezinmek artık
     durak sayfasının kendi şeridiyle ve alttan çıkan "Aşamalar" sayfasıyla
     oluyor. Bu ekranda projenin künyesi, takvimi ve nerede kaldığın var. */
  return projeKunyesi(p)
    + fbTakvimSeridi(p)
    + (su ? `
      <a class="pyd" href="#/projeler/${p.id}/${su.anahtar}">
        <span class="pyd-yz">
          <i>Kaldığın aşama</i>
          <b>${esc(su.ad)}</b>
        </span>
        <span class="pyd-ok">${svg(ICON.chevron, 16)}</span>
      </a>` : '')

    + `<div class="genel">
      <div class="genel-ust"><b>Adımlar</b><u class="mono">%${yuzde}</u></div>
      <div class="genel-ray"><i style="width:${yuzde}%"></i></div>
      <div class="genel-alt mono">${biten} / ${sayilan.length} tamamlandı</div>
    </div>`;
}

/* ---------- Yapıştırılan cevabı okumak ----------
   Model adı harfi harfine yazmayabilir: eğik tırnak, farklı orta nokta,
   fazladan boşluk, madde imi. Bu yüzden karşılaştırmadan önce hepsini
   sadeleştiriyoruz — yoksa seçim sessizce varsayılana düşüyor. */
function adSadelestir(x) {
  return String(x || '')
    .replace(/[‘’ʼ´`]/g, "'")   /* eğik tırnaklar */
    .replace(/[·•∙・]/g, '·')     /* orta nokta çeşitleri */
    .replace(/[–—]/g, '-')                 /* uzun tireler */
    .replace(/\s+/g, ' ')
    .trim()
    .toLocaleLowerCase('tr');
}


function renkYakin(a, b) {
  if (!/^#[0-9a-f]{6}$/i.test(a || '') || !/^#[0-9a-f]{6}$/i.test(b || '')) return false;
  const [r1, g1, b1] = hexRgb(a), [r2, g2, b2] = hexRgb(b);
  return Math.abs(r1 - r2) + Math.abs(g1 - g2) + Math.abs(b1 - b2) < 90;
}

function projeKarti(p, i = 0) {
  const s   = DB.sayim(p.id);
  const gor = gorselAdresi(p, 'G0');

  /* Görsel varsa kartın üst yarısı ona bırakılıyor, bilgiler alta iniyor.
     Sebebi ölçüldü: bilgiler üstteyken firma adının kontrastı 2.8, alt bilgi
     satırınınki 1.2 çıkıyordu — çizimlerin en parlak yeri tam oraya denk
     geliyor. Kartın dibi zaten koyu; aşağı almak oranları sekizin üstüne
     çıkarıyor ve görselin en iyi kısmını da serbest bırakıyor. */
  return `
    <div class="card proje tilt ${gor ? 'gorselli' : ''} ${GORSEL_YUKLENIYOR[p.id] ? 'yukluyor' : ''}"
         data-eylem="proje-ac" data-id="${p.id}"
         role="button" tabindex="0" style="${renkDegiskenleri(p.renk)};--i:${i}">
      <span class="parlama"></span>
      ${gor ? `<span class="proje-gorsel"><img src="${esc(gor)}" alt=""
                 decoding="async" fetchpriority="high"></span>
               <span class="proje-tepe"></span>
               <span class="proje-ray"><i style="width:${s.yuzde}%"></i></span>` : ''}
      ${AUTH.yonetici ? `<button class="proje-bilgi" data-eylem="proje-gorsel" data-id="${p.id}"
        type="button" aria-label="${gor ? 'Görseli değiştir' : 'Görsel ekle'}">i</button>` : ''}
      ${GORSEL_YUKLENIYOR[p.id] ? gorselYuklemeKatmani(p.id) : ''}

      <div class="proje-govde">
        <div class="proje-ust">
          <span class="proje-rozet" style="${renkStil(p.renk)}">${esc(basHarf(p.firma))}</span>
          <span class="proje-ad-kutu">
            <span class="proje-ad">${esc(projeAdi(p))}</span>
            <span class="proje-meta">${PLATFORM_ADI[p.platform] || p.platform}</span>
          </span>
          ${(p.palet || {}).projeTuru === 'test' ? '<span class="pill dev">Test</span>' : ''}
          <span class="pill ${durumSinif(p.durum)}">${DURUM_ADI[p.durum] || p.durum}</span>
        </div>
        <div class="proje-orta">
          <div class="bar"><i style="width:${s.yuzde}%"></i></div>
          <span class="proje-pct mono" data-sayac="${s.yuzde}" data-on="%">%${s.yuzde}</span>
        </div>
        <div class="proje-alt">
          <span><b class="mono">${s.modul}</b> modül</span>
          <span><b class="mono">${s.sayfa}</b> sayfa</span>
          <span><b class="mono">${s.bitmis}/${s.gorev}</b> görev</span>
          ${AUTH.yonetici ? `<button class="mini-btn proje-menu" data-eylem="proje-menu" data-id="${p.id}"
            type="button" aria-label="Proje seçenekleri">${svg(ICON.nokta, 15)}</button>` : ''}
        </div>
      </div>
    </div>`;
}

/* ---------- Projeler ekranı ----------
   Onaylanan tasarım: üstte başlık ve "Yeni Proje", altında iki sekme
   (devam eden / tamamlanan), sonra arama-filtre-sıralama-görünüm satırı,
   en altta kartlar.

   Kartta yazan her şey gerçek veriden geliyor: logo yüklenmişse logo,
   yoksa firmanın baş harfi; ad; sektör; platform ve durum etiketi;
   görev sayısı; o projede görevi olan kişi sayısı; teslim tarihi. Olmayan
   alan satırı hiç çıkmıyor — boş yer tutulmuyor. */
const AY_KISA = ['Oca','Şub','Mar','Nis','May','Haz','Tem','Ağu','Eyl','Eki','Kas','Ara'];

function pjTarih(iso) {
  if (!iso) return '';
  const t = new Date(iso);
  if (isNaN(t)) return '';
  return `${t.getDate()} ${AY_KISA[t.getMonth()]} ${t.getFullYear()}`;
}

/* O projede görevi olan kaç ayrı kişi var. */
function pjKisiSayisi(pid) {
  const kisiler = new Set();
  DB.gorevleri({ proje: pid }).forEach(g => { if (g.atanan) kisiler.add(g.atanan); });
  return kisiler.size;
}

function pjKarti(p) {
  const adres  = DB.logoAdres[p.id];
  const yuzde  = projeAsamaYuzde(p);
  const bitti  = projeBittiMi(p);
  /* Kartta yalnız kalıcı bilgi duruyor: kim, hangi iş, ne zaman başladı,
     nerede. Görev/kişi sayısı ve platform/durum etiketleri kalktı —
     projelerin çoğunda "0 görev" ve "yeni" yazıyordu, ikisi de bir şey
     anlatmıyordu. */
  const baslangic = pjTarih(p.olusturuldu);

  return `
    <div class="pj ${bitti ? 'bitti' : ''}" data-eylem="proje-ac" data-id="${p.id}"
         role="button" tabindex="0" data-ara="${esc((projeAdi(p) + ' ' + (p.sektor || '') + ' ' + (p.firma || '')).toLowerCase())}">
      <span class="pj-logo ${adres ? 'yukleniyor' : ''}" ${adres ? `data-logo="${esc(adres)}"` : ''}>
        <b class="logo-harf">${esc(basHarf(p.firma))}</b>
        ${adres ? '<span class="donen"></span>' : ''}
      </span>
      ${AUTH.yonetici ? `<button class="pj-menu" data-eylem="proje-menu" data-id="${p.id}"
        type="button" aria-label="Projeyi sil">
        <svg viewBox="0 0 24 24"><circle cx="12" cy="5" r="1.7"></circle><circle cx="12" cy="12" r="1.7"></circle><circle cx="12" cy="19" r="1.7"></circle></svg>
      </button>` : ''}
      <b class="pj-ad">${esc(basHarfleriBuyuk(projeAdi(p)))}</b>
      ${p.sektor ? `<i class="pj-aciklama">${esc(p.sektor)}</i>` : '<i class="pj-aciklama bos"></i>'}
      <span class="pj-halka">${pzHalka(yuzde, 58, 5)}<u>${yuzde}%</u></span>
      <span class="pj-ok">${svg(ICON.chevron, 16)}</span>
      <span class="pj-ayak">${baslangic
        ? `<span>${svg(ICON.takvim, 14)}${esc(baslangic)}</span>` : ''}</span>
    </div>`;
}

/* Arama yazılırken ekran yeniden çizilmiyor: her harfte çizmek imleci
   kutudan kaçırıyor. Kartlar yerinde duruyor, uymayanlar gizleniyor. */
function pjAramaUygula() {
  const izgara = $('.pj-izgara');
  if (!izgara) return;
  let gorunen = 0;
  $$('.pj', izgara).forEach(k => {
    const uyar = !PROJE_ARAMA || (k.dataset.ara || '').indexOf(PROJE_ARAMA) >= 0;
    k.classList.toggle('gizli', !uyar);
    if (uyar) gorunen++;
  });
  izgara.classList.toggle('bos', gorunen === 0);
}

/* Sıra sabit: en son dokunulan proje üstte. Filtre, sıralama ve ızgara/liste
   seçimi vardı; sekmeler ve arama yetiyor, kaldırıldı. */
function pjSirala(liste) {
  return liste.slice()
    .sort((a, b) => (pzSonDokunus(b.id) || '').localeCompare(pzSonDokunus(a.id) || ''));
}

function projelerEkrani(kova) {
  const hepsi  = DB.projeler.filter(p => !cekirdekMi(p));
  const sayi   = { basmis: 0, bitmis: 0 };
  hepsi.forEach(p => { sayi[projeBittiMi(p) ? 'bitmis' : 'basmis']++; });

  const liste = pjSirala(hepsi.filter(p => PROJE_KOVASI[kova].sec(p)));

  /* "Projeler" sözcüğü telefonda gizleniyor: iki sekme tek satıra sığsın,
     yazı üç noktayla kesilmesin. */
  const sekme = (k, ikon, ad) => `
    <a class="pj-sekme ${k === kova ? 'acik' : ''}" href="#/projeler/${k}">
      ${svg(ICON[ikon], 17)}<span>${ad}<u> Projeler</u> (${sayi[k]})</span>
    </a>`;

  const govde = liste.length
    ? `<div class="pj-izgara">${liste.map(pjKarti).join('')}
         <div class="pj-bos-arama">Aramana uyan proje yok.</div>
       </div>`
    : `<div class="card">${empty(ICON[PROJE_KOVASI[kova].ikon],
        PROJE_KOVASI[kova].ad + ' yok',
        kova === 'bitmis'
          ? 'Final verilen ya da bütün görevleri biten projeler buraya düşer.'
          : 'Yeni Proje sihirbazı firma, renk, platform, veritabanı ve modülleri sorar.',
        AUTH.yonetici && kova === 'basmis' ? 'Yeni Proje' : null, 'sihirbaz')}</div>`;

  return `
    <div class="pj-tepe">
      <div class="pj-tepe-yz">
        <h1>Projeler</h1>
        <p>Tüm projeleri görüntüle, ilerlemeleri takip et.</p>
      </div>
      ${AUTH.yonetici ? `<button class="pj-yeni" type="button" data-eylem="sihirbaz">
        ${svg(ICON.arti, 16)}<span>Yeni Proje</span></button>` : ''}
    </div>

    <div class="pj-sekmeler">
      ${sekme('basmis', 'saat', 'Devam Eden')}
      ${sekme('bitmis', 'bitti', 'Tamamlanan')}
    </div>

    <div class="pj-araclar">
      <label class="pj-ara">
        <svg viewBox="0 0 24 24"><circle cx="11" cy="11" r="6.4"></circle><path d="M15.8 15.8L20.5 20.5"></path></svg>
        <input id="pj-ara" type="search" autocomplete="off" placeholder="Proje adı, firma veya sektör ile ara…"
          value="${esc(PROJE_ARAMA)}">
      </label>
    </div>

    ${govde}`;
}

/* Ağaç içindeki tek satırlık görev */
function gorevSatiri(g) {
  return `
    <div class="gorev" data-eylem="gorev-ac" data-id="${g.id}" role="button" tabindex="0">
      <span class="gorev-no mono">${gorevNo(g)}</span>
      <span class="gorev-baslik">${esc(g.baslik)}</span>
      ${g.oncelik === 'acil' ? '<span class="acil">Acil</span>' : ''}
      ${g.atanan ? avatar(g.atanan) : ''}
      ${durumRozeti(g.durum)}
    </div>`;
}

/* Bana Atananlar listesindeki geniş görev satırı */
function gorevKarti(g, i = 0) {
  return `
    <div class="gsatir" data-eylem="gorev-ac" data-id="${g.id}" role="button" tabindex="0" style="--i:${i}">
      <span class="gsol" style="background:var(--st-${DURUM_SINIF[g.durum]})"></span>
      <span class="gorta">
        <span class="gust">
          <span class="gorev-no mono">${gorevNo(g)}</span>
          <span class="gbaslik">${esc(g.baslik)}</span>
          ${g.oncelik === 'acil' ? '<span class="acil">Acil</span>' : ''}
        </span>
        <span class="gyol">${gorevYolu(g)}</span>
      </span>
      ${durumRozeti(g.durum)}
    </div>`;
}

function durumRozeti(d) {
  return `<span class="durum d-${DURUM_SINIF[d]}"><i></i>${DURUM_GOREV_ADI[d]}</span>`;
}

function avatar(kisiId, boy = '') {
  const ad = DB.kisiAdi(kisiId);
  return `<span class="gav ${boy}" title="${esc(ad)}"
    style="background:${kisiRengi(kisiId)}">${esc(basHarf(ad))}</span>`;
}

function filtreDugmesi(deger, ad, sayi) {
  return `<button class="f ${GOREV_FILTRE === deger ? 'on' : ''}" data-eylem="filtre"
    data-deger="${deger}" type="button">${ad}<em class="mono">${sayi}</em></button>`;
}

function ozKutu(label, num, sub, i = 0) {
  return `<div class="card oz" style="--i:${i}">
    <span class="oz-label">${label}</span>
    <span class="oz-num" data-sayac="${num}">${num}</span>
    <span class="oz-sub">${sub}</span>
  </div>`;
}

function stat(label, num, note, cls = '', i = 0, ikon = null) {
  return `<div class="card stat ${cls ? 'k-' + cls.replace('c-', '') : 'k-metal'}" style="--i:${i}">
    ${ikon ? `<span class="stat-ikon">${svg(ICON[ikon], 16)}</span>` : ''}
    <span class="stat-label">${label}</span>
    <span class="stat-num ${cls}" data-sayac="${num}">${num}</span>
    <span class="stat-note">${note}</span>
  </div>`;
}

function empty(icon, title, text, butonYazi = null, eylem = null) {
  return `<div class="empty">
    <div class="empty-icon">${svg(icon, 24)}</div>
    <h3>${title}</h3>
    <p>${text}</p>
    ${butonYazi ? `<button class="btn btn-primary" data-eylem="${eylem}" type="button" style="margin-top:16px">
      ${svg(ICON.arti, 15)}<span>${butonYazi}</span></button>` : ''}
  </div>`;
}

/* Çizim hatası — boş ekran yerine ne olduğunu söyleyen kutu. Mesaj ve
   yığın izinin ilk satırı yeter: hangi fonksiyonda patladığını gösteriyor. */
function cizimHatasi(h, nerede) {
  const iz = String((h && h.stack) || '').split('\n').slice(0, 3)
    .map(x => x.trim()).filter(Boolean).join('\n');
  return `
    <div class="card">
      <div class="note uyari">${svg(ICON.uyari, 15)}
        <span><b>Bu ekran çizilemedi.</b> Uygulamanın geri kalanı çalışıyor —
        alt çubuktan başka bir sayfaya geçebilirsin.</span></div>
      <div class="hata-iz">
        <b>${esc(String(nerede || '—'))}</b>
        <pre>${esc(String((h && h.message) || h))}</pre>
        ${iz ? `<pre class="soluk">${esc(iz)}</pre>` : ''}
      </div>
      <button class="sayfa-dug ikincil" type="button" data-eylem="hata-kopyala"
              data-metin="${esc(String((h && h.message) || h) + '\n' + iz)}">
        ${svg(ICON.kopya, 15)} Hatayı kopyala</button>
    </div>`;
}

function hataKutusu(mesaj) {
  return `<div class="card">
    <div class="empty">
      <div class="empty-icon uyari">${svg(ICON.uyari, 24)}</div>
      <h3>Veri yüklenemedi</h3>
      <p>${esc(mesaj)}</p>
      <button class="btn btn-ghost" data-eylem="tazele" type="button" style="margin-top:16px">Tekrar dene</button>
    </div>
  </div>`;
}

function iskeletler(n) {
  return `<div class="proje-grid">${Array.from({ length: n }, () =>
    `<div class="card iskelet"><span class="i-satir k"></span><span class="i-satir"></span><span class="i-satir o"></span></div>`
  ).join('')}</div>`;
}

function stageNote(text) {
  return `<div class="section"><div class="note">
    ${svg(ICON.info, 15)}<span>${text}</span>
  </div></div>`;
}

/* Yapıştırılan metni standart kayıtlarına çevirir.

   Beklenen biçim (Kural satırı çok satırlı olabilir):

     Grup: Tasarım
     Alan: Üst çubuk
     Başlık: Araç düğmeleri profil panelinde
     Kural: Üst çubukta yalnız marka, sayfa adı ve kullanıcı kutusu durur...

   Birden fazla kural alt alta yapıştırılabilir; "Grup:" ya da "Ad:" satırı
   yeni bir kaydı başlatır. Araya "---" konabilir, zorunlu değil.

   Eski biçim (Ad / Grup / Özet / Tarif) da çalışmaya devam ediyor: elde
   yazılmış blokların bir gün geri yapıştırılması gerekebilir. */
function standartCozumle(metin) {
  const ANAHTAR = {
    grup: 'grup', alan: 'alan',
    'başlık': 'ad', baslik: 'ad', ad: 'ad',
    'özet': 'ozet', ozet: 'ozet',
    kural: 'tarif', tarif: 'tarif', 'açıklama': 'tarif', aciklama: 'tarif',
  };

  /* "Bu değişiklikten standart çıkmaz" cevabı. Hata değil, boş sonuç. */
  if (/^\s*YOK\s*$/i.test(String(metin || ''))) return { kayitlar: [], hatalar: [] };

  const kayitlar = [];
  const hatalar  = [];
  let simdiki = null;
  let sonAlan = null;

  const kapat = () => {
    if (!simdiki) return;
    ['grup', 'alan', 'ad', 'ozet', 'tarif'].forEach(a => {
      simdiki[a] = (simdiki[a] || '').trim();
    });
    /* Alan yazılmamışsa başlık hem alan hem başlık olur — eski biçimde
       "Ad" tek başına geliyordu. */
    if (!simdiki.alan) simdiki.alan = simdiki.ad;
    if (!simdiki.ad)   simdiki.ad   = simdiki.alan;

    if (!simdiki.alan)       hatalar.push('Alanı ve başlığı olmayan bir blok atlandı.');
    else if (!simdiki.tarif) hatalar.push(`"${simdiki.alan}" için kural yazılmamış, atlandı.`);
    else {
      if (!simdiki.grup) simdiki.grup = VARSAYILAN_GRUP;
      /* Uydurulmuş grup adı listeyi dağıtır: bilinen sekizden biri değilse
         varsayılana çekilir. */
      if (STANDART_GRUPLARI.indexOf(simdiki.grup) === -1) {
        const denk = STANDART_GRUPLARI.find(g =>
          g.toLocaleLowerCase('tr') === simdiki.grup.toLocaleLowerCase('tr'));
        if (denk) simdiki.grup = denk;
        else {
          hatalar.push(`"${simdiki.grup}" diye bir grup yok, "${VARSAYILAN_GRUP}" sayıldı.`);
          simdiki.grup = VARSAYILAN_GRUP;
        }
      }
      kayitlar.push(simdiki);
    }
    simdiki = null; sonAlan = null;
  };

  String(metin || '').split(/\r?\n/).forEach(satir => {
    if (/^\s*-{3,}\s*$/.test(satir)) { kapat(); return; }
    /* Claude bloğu kod çiti içinde verirse çitleri yut. */
    if (/^\s*```/.test(satir)) return;

    const es = satir.match(/^\s*([A-Za-zÇĞİÖŞÜçğıöşü]+)\s*:\s*([\s\S]*)$/);
    const alan = es ? ANAHTAR[es[1].toLocaleLowerCase('tr')] : null;

    /* Zaten dolu bir alan ikinci kez geliyorsa yeni kayıt başlamıştır.
       Böylece hem yeni biçim (Grup ile başlar) hem eski biçim (Ad ile
       başlar) çalışıyor ve bloklar arasına "---" koymak zorunlu olmuyor. */
    if (alan && simdiki && simdiki[alan]) kapat();

    if (alan) {
      if (!simdiki) simdiki = { grup: '', alan: '', ad: '', ozet: '', tarif: '' };
      simdiki[alan] = es[2];
      sonAlan = alan;
      return;
    }

    /* Anahtar yoksa satır, son alanın devamıdır — çok satırlı kurallar
       böyle çalışıyor. */
    if (simdiki && sonAlan) simdiki[sonAlan] += '\n' + satir;
  });

  kapat();
  return { kayitlar, hatalar };
}

/* Düzenleme penceresindeki alan önerileri: veride geçen alan adları.
   Grup sabit sekiz kova olduğu için orada öneri gerekmiyor, seçim var. */
function alanSecenekleri() {
  return [...new Set(standartListesi()
    .map(st => (st.alan || st.ad || '').trim()).filter(Boolean))]
    .sort((a, b) => a.localeCompare(b, 'tr'));
}

/* Standartlar ekranının iki adımlık aracı: promptu al → Claude'a yapıştır →
   cevabı geri yapıştır.

   Kopyalandı bilgisi burada duruyor, kartın sınıfında değil: ekran yeniden
   çizilse de kart hâlini koruyor. Kural kaydedilince sıfırlanıyor. */
let STD_KOPYALANDI = false;

function stdAracKartlari() {
  const k = STD_KOPYALANDI;
  return `
    <div class="std-arac ${k ? 'adim2' : ''}">
      <button class="sa-kart ana ${k ? 'kopyalandi' : ''}" type="button" data-eylem="std-prompt">
        <span class="sa-ust">
          <span class="sa-ikon">${svg(ICON.kopya, 18)}${svg(ICON.tik, 18)}</span>
          <span class="sa-adim">1</span>
        </span>
        <span class="sa-yazi">
          <span class="sa-ad">${k ? 'Prompt panoda' : 'Standart ekleme promptu'}</span>
          <span class="sa-alt">${k ? 'Claude\'a yapıştır' : 'Panoya kopyalar'}</span>
        </span>
      </button>

      <span class="sa-bag"><i></i><em>${svg(ICON.chevron, 13)}</em></span>

      <button class="sa-kart ${k ? 'sirada' : 'bekliyor'}" type="button" data-eylem="standart-ice-aktar">
        <span class="sa-ust">
          <span class="sa-ikon">${svg(ICON.ice, 18)}</span>
          <span class="sa-adim">2</span>
        </span>
        <span class="sa-yazi">
          <span class="sa-ad">Kuralı yapıştır</span>
          <span class="sa-alt">Claude'un bloğunu bırak</span>
        </span>
      </button>
    </div>`;
}

/* Grubun simgesi ve rengi. Tanınmayan grup adı metal kalır. */
function grupSimgesi(ad) {
  const kisa = GRUP_SIMGE[ad];
  if (!kisa) return { ikon: ICON.katman, sinif: '' };
  const anahtar = 'g' + kisa.charAt(0).toUpperCase() + kisa.slice(1);
  return { ikon: ICON[anahtar] || ICON.katman, sinif: 'gr-' + kisa };
}

/* Bir standart grubu. Başlığa basınca açılır; başka bir grup açılınca kapanır.
   İçeride alan adları ara başlık — ayrı bir açılır katman değil, çünkü üç
   kademe açıp kapamak telefonda yoruyor. */
function grupKarti(g, i = 0) {
  const acik = ACIK_GRUP === g.ad;
  const kac  = g.liste.length;
  const sim  = grupSimgesi(g.ad);

  return `
    <div class="card modul standart-grup" style="--i:${i}">
      <div class="modul-bas ${acik ? 'acik' : ''}" data-eylem="standart-grup-ac" data-ad="${esc(g.ad)}"
           role="button" tabindex="0" aria-expanded="${acik}">
        <span class="chev">${svg(ICON.chevron, 15)}</span>
        <span class="modul-ikon grup-ikon ${sim.sinif}">${svg(sim.ikon, 16)}</span>
        <span class="modul-yazi">
          <span class="modul-ad">${esc(g.ad)}</span>
          <span class="modul-alt">${g.alanlar.length} alan · ${kac} kural</span>
        </span>
      </div>

      ${acik ? `<div class="grup-govde ${sim.sinif}">
        ${g.alanlar.map(a => `
          <div class="std-alan">
            <div class="std-alan-bas">${esc(a.ad)}<em>${a.liste.length}</em></div>
            ${a.liste.map(standartKarti).join('')}
          </div>`).join('')}
      </div>` : ''}
    </div>`;
}

function standartKarti(st, i = 0) {
  const acik = ACIK_STANDART.has(st.id);
  const kac  = DB.standartKullanimi(st.id);
  /* Özet alanı artık doldurulmuyor: başlık zaten kuralın ne dediğini
     söylüyor, altına kuralın ilk cümlesi düşüyor. */
  const alt  = st.ozet || String(st.tarif || '').split(/(?<=\.)\s/)[0] || '';

  return `
    <div class="card standart" style="--i:${i}">
      <div class="standart-bas ${acik ? 'acik' : ''}" data-eylem="standart-ac" data-id="${st.id}"
           role="button" tabindex="0">
        <span class="chev">${svg(ICON.chevron, 15)}</span>
        <span class="modul-ikon">${svg(ICON.katman, 16)}</span>
        <span class="modul-yazi">
          <span class="modul-ad">${esc(st.ad)}</span>
          <span class="modul-alt">${esc(alt)}</span>
        </span>
        ${kac ? `<span class="kullanim mono">${kac} projede</span>` : ''}
      </div>

      ${acik ? `
        <div class="standart-govde">
          <p class="standart-tarif">${st.tarif ? esc(st.tarif) : '<em class="ipucu">Kural henüz yazılmadı.</em>'}</p>
          ${st.yerel ? `<p class="standart-tarif yerel">
            <b>Sunucusuz projede:</b> ${esc(st.yerel)}</p>` : ''}
          ${AUTH.yonetici ? `
            <div class="modul-araclar" style="padding-left:0;margin-top:12px">
              <button class="mini-link" data-eylem="standart-duzenle" data-id="${st.id}" type="button">
                ${svg(ICON.kalem, 13)} Düzenle</button>
              <button class="mini-link" data-eylem="standart-kopyala" data-id="${st.id}" type="button">
                ${svg(ICON.kopya, 13)} Kuralı kopyala</button>
              <button class="mini-link tehlike" data-eylem="standart-sil" data-id="${st.id}"
                      data-ad="${esc(st.ad)}" type="button">${svg(ICON.cop, 13)} Kaldır</button>
            </div>` : ''}
        </div>` : ''}
    </div>`;
}

/* Yükleme katmanı: dolan halka, durum yazısı ve bitince tik.
   Halkanın dolduğu oran gerçek — gönderilen bayttan geliyor, sayaçtan değil. */
function gorselYuklemeKatmani(projeId) {
  const d = GORSEL_YUKLENIYOR[projeId] || { oran: 0, boyut: 0 };
  const CEVRE = 157;
  return `
    <div class="proje-yukleme ${d.bitti ? 'bitti' : ''}" data-proje="${projeId}">
      <span class="py-halka">
        <svg viewBox="0 0 60 60" aria-hidden="true">
          <circle class="py-iz"   cx="30" cy="30" r="25"></circle>
          <circle class="py-dolu" cx="30" cy="30" r="25"
                  stroke-dasharray="${CEVRE}" stroke-dashoffset="${CEVRE * (1 - d.oran)}"></circle>
        </svg>
        <span class="py-tik">${svg(ICON.tik, 26)}</span>
      </span>
      <span class="py-yazi">${d.bitti ? 'Görsel gönderildi' : 'Görsel yükleniyor'}</span>
      <span class="py-alt">%${Math.round(d.oran * 100)} · ${kb(d.giden || 0)}/${kb(d.boyut)}</span>
    </div>`;
}

/* Fotoğraf kutusu. Yüklenmiş fotoğraf varsa onu, yoksa baş harfleri gösterir. */
function fotoKutu(sinif = '') {
  const adres = AUTH.foto;
  return `<span class="foto ${sinif}"${adres ? ` style="background-image:url('${esc(adres)}')"` : ''}>
    ${adres ? '' : `<b>${esc(AUTH.basHarfler)}</b>`}
  </span>`;
}

function infoRow(k, v, mono = false) {
  return `<div class="row">
    <div class="row-main"><span class="row-title">${k}</span></div>
    <span class="row-val ${mono ? 'mono' : ''}">${esc(String(v))}</span>
  </div>`;
}

function connRow(k, v, ok) {
  return `<div class="row">
    <div class="row-main"><span class="row-title">${k}</span></div>
    <span class="pill ${ok ? 'done' : ''}">${v}</span>
  </div>`;
}

/* ==========================================================================
   ÇİZİM
   ========================================================================== */

/* Adres değiştirip HEMEN çiziyoruz. `hashchange` olayı tarayıcıda bir
   sonraki tura kalıyor; beklemek dokunuşla ekranın açılması arasına
   gözle görülür bir boşluk koyuyordu.

   Çizdiğimiz adresi not ediyoruz: olay arkadan geldiğinde ekran İKİNCİ kez
   çiziliyordu. İkinci çizim listeyi sıfırdan kuruyor, avatarlar yeniden
   yükleniyor ve dokunuşun hemen ardına gözle görülür bir takılma düşüyordu.
   Sekmelerde tek çizim var; burada da tek olsun. */
let CIZILEN_ADRES = null;

function gitVeCiz(hash) {
  if (location.hash === hash) { render(); return; }
  CIZILEN_ADRES = hash;
  location.hash = hash;
  render();
}

function render() {
  /* Kaydırma yeri: akış içindeki bir seçim sonrası liste başa dönmesin. */
  const kaydiran = $('.dk-govde, .kunye-kaydir, .ozet-kaydir, .palet-kaydir');
  const kaydirmaYeri = kaydiran ? kaydiran.scrollTop : null;

  const { key, id, durak } = rota();
  /* Kova sayfası proje detayı DEĞİL: üst çubuktaki artı "Yeni Görev"e
     dönmemeli, proje rengi yayılmamalı — ortada bir proje yok. */
  const kova  = key === 'projeler' && PROJE_KOVASI[id] ? id : null;
  const detay = key === 'projeler' && id && !kova;
  let sayfa = detay && DURAKLAR[durak] ? durak : null;
  /* Kilit sıkı: adres çubuğuna elle yazılsa da kilitli durak açılmıyor,
     projenin kalınan aşamasına düşülüyor. */
  if (sayfa && durakKilitli(id, sayfa)) {
    location.replace(projeAdresi(id));
    sayfa = rota().durak && DURAKLAR[rota().durak] ? rota().durak : null;
  }

  /* Ayrı bir "proje ekranı" yok: projeye girmek, kalınan aşamayı açmak
     demek. Eski adres (#/projeler/<id>) hâlâ çalışıyor, oradan aşamaya
     yönleniyor. Veri henüz gelmediyse yönlendirme beklenir. */
  if (detay && !sayfa && !YUKLENIYOR) {
    const hedef = DB.proje(id) ? projeAdresi(id) : '#/projeler';
    if (hedef !== location.hash) {
      location.replace(hedef);
      const y = rota();
      sayfa = (y.id === id && DURAKLAR[y.durak]) ? y.durak : null;
      if (!sayfa) return render();
    }
  }

  /* Başka bir aşamaya geçildiyse düzenleme kipi kapanır. */
  if (DUZENLENEN_DURAK && DUZENLENEN_DURAK !== id + '/' + sayfa) {
    DUZENLENEN_DURAK = null; DUZENLEME_YEDEK = null;
  }
  /* Bağlantılar aşamasından çıkınca açık kart hatırlanmasın. */
  if (sayfa !== 'baglantilar') ACIK_BAGLANTI = null;
  if (sayfa !== 'kurulum') ACIK_KURULUM = null;
  if (sayfa !== 'tasarim') { TASARIM_SEKME = 'promptlar'; TASARIM_ODAK = null; }
  if (sayfa !== 'guvenlik') GUVENLIK_KURULUM_ACIK = false;

  /* Kurulum durağından çıkıldıysa modül ağacı kapanır — aynı sebeple:
     geri gelindiğinde ağacın içine değil kurulum ızgarasına düşülsün.
     Taslak silinmiyor, yarım kalan iş duruyor. */
  if (sayfa !== 'yapi') {
    Object.keys(YAPI_ACIK).forEach(k => { delete YAPI_ACIK[k]; });
  }

  /* Üstte iki satır: firma adı sabit, altında bulunduğun sayfanın adı. */
  const baslik = $('#page-title');
  if (sayfa) {
    baslik.textContent = DURAKLAR[sayfa].ad;
  } else if (kova) {
    baslik.textContent = PROJE_KOVASI[kova].ad;
  } else if (detay) {
    const p = DB.proje(id);
    baslik.textContent = p ? projeAdi(p) : 'Proje';
  } else if (key === 'ayarlar' && AYAR_GRUP[id]) {
    baslik.textContent = AYAR_GRUP[id].ad;
  } else {
    baslik.textContent = ROUTES[key].kisa || ROUTES[key].title;
  }

  hesapMenusuKapat();
  /* Zemin fotoğrafı yalnızca Panel'de. Sayfa değişince koyuluk sıfırlanır,
     yoksa panele döndüğünde fotoğraf kararmış geliyor. */
  $('#main').classList.toggle('susulu', key === 'panel' && !detay);
  /* Yazışma tam ekran: kendi başlığı ve alttaki yazma çubuğu var,
     uygulamanın üst çubuğu ve sekmeleri gizleniyor. */
  const yazisma = key === 'sohbet' && !!id;
  $('#app').classList.toggle('yazisma', yazisma);
  /* Sohbet ve yazışmada geçiş animasyonu yok: anında açılsın. */
  $('#app').classList.toggle('sohbette', key === 'sohbet');
  /* Kaydırılmayan tek ekran yazışma: yazma çubuğu altta sabit duruyor.
     Tasarım/Yapı/Beta durakları da eskiden buradaydı — üç parçaya bölünen
     akış ekranlarıydılar. O akışlar kalktı, yerlerine normal form sayfaları
     geldi; sınıf kalınca sayfa kaydırılamıyor, «Devam Et» alt çubuğun
     arkasında kalıyordu. */
  $('#view').classList.toggle('sabit', yazisma);
  ustEylemYaz(key, detay, id);
  artiYaz(key, detay, id);
  /* Geri oku hiç kaybolmuyor: gidilecek bir yer yoksa yalnız soluyor ve
     basılamaz oluyor. Gizleseydik belirip kaybolurken üst çubuk her seferinde
     kayardı — logo, marka ve sayfa adı sağa sola oynardı.

     Ok yalnız açılış ekranında pasif. Panelin dışındaki her yerden geri
     gidilecek bir yer vardır: Standartlar'a, Ekip'e ya da Ayarlar'a girip de
     okun sönük kalması "buradan çıkamıyorum" gibi okunuyordu. */
  const geri = $('#btn-back');
  const geriVar = key !== DEFAULT_ROUTE;
  geri.classList.toggle('pasif', !geriVar);
  geri.disabled = !geriVar;
  projeRengiYay(detay ? DB.proje(id) : null);

  /* Aynı ekranda kalıp bir şeyi açıp kapatınca her şey yeniden uçuşmasın:
     giriş hareketi yalnızca gerçekten başka bir ekrana geçince oynar. */
  const izi   = key + '/' + (id || '') + '/' + (durak || '');
  const gecis = izi !== SON_EKRAN;
  SON_EKRAN = izi;

  const view = $('#view');

  /* Aynı ekran yeniden çizilirken kullanıcı bulunduğu yerde kalsın:
     tepeye fırlamak, yarıda bir seçim yaparken can sıkıcı. */
  const dikey = gecis ? 0 : view.scrollTop;
  /* Yazışmada yarım kalan mesaj kaybolmasın: karşıdan mesaj gelince ekran
     yeniden çiziliyor, kutudaki yazı silinirdi. */
  const yarim = (!gecis && $('#yz-metin')) ? $('#yz-metin').value : null;
  const yatay = gecis ? [] : $$('.raf', view).map(r => r.scrollLeft);

  /* Çizim patlarsa ekran boş kalıyor ve altındaki satırlar hiç çalışmıyordu:
     alt çubuk ölüyor, artı düğmesi kayboluyor, kullanıcı bomboş bir sayfaya
     bakıyordu. Telefonda konsol da yok. Artık hata ekrana yazılıyor. */
  try {
    view.innerHTML = sayfa ? durakSayfasi(id, sayfa)
                   : kova  ? VIEWS.projeKovasi(kova)
                   : detay ? VIEWS.projeDetay(id)
                   : VIEWS[key]();
  } catch (h) {
    view.innerHTML = cizimHatasi(h, sayfa || kova || key);
  }
  view.scrollTop = dikey;
  if (yarim !== null && $('#yz-metin')) $('#yz-metin').value = yarim;
  if (yatay.length) $$('.raf', view).forEach((r, i) => { r.scrollLeft = yatay[i] || 0; });

  view.classList.remove('swap');

  if (gecis) {
    void view.offsetWidth;
    view.classList.add('swap');
    sayaclariCanlandir(view);
  }

  $$('[data-route]').forEach(el => el.classList.toggle('active', el.dataset.route === key));

  logolariGoster();
  duraklariOrtala();
  altCubukOlc();
  /* Katman merdiveninin "kaç katman" düğmeleri her çizimde yeniden bağlanır. */
  if ($('.rol-kat', view)) rolBagla(view);
  /* Yazışma açıldığında en alta in ve gelen mesajları okundu say. */
  if (yazisma) {
    const govde = $('#yz-govde');
    if (govde) govde.scrollTop = govde.scrollHeight;
    if (id !== 'studio') DB.okunduIsaretle(id).then(d => { if (d) zilNoktasi(); });
  }
  /* Arama kutusundaki yazı ekran yeniden çizilince de geçerli kalsın. */
  pjAramaUygula();
  ekipAramaUygula();
  sohbetAramaUygula();
  skAramaUygula();
  tpAramaUygula();
  if (kaydirmaYeri) {
    const yeni = $('.dk-govde, .kunye-kaydir, .ozet-kaydir, .palet-kaydir');
    if (yeni) yeni.scrollTop = kaydirmaYeri;
  }
  /* Aşağıdakiler ekranın görünmesini beklemesin: ölçüm ve bağlama işleri
     ilk boyamadan sonra yapılıyor. Önce sayfa çıkıyor, sonra ayarlanıyor. */
  requestAnimationFrame(() => {
    onizlemeSigdir();
    yapiBaglari();
    yolIziKaydir();
    requestAnimationFrame(onizlemeSigdir);
  });
  /* Bir kare sonra bir daha: sayfa geçiş animasyonu sürerken ölçülen kutu
     gerçek boyunda olmuyor, dirsekler yanlış yere düşüyordu. */

  const logout = $('#btn-logout');
  if (logout) logout.addEventListener('click', signOut);
}

/* Sağ üstteki ana buton — role ve ekrana göre değişir */
function ustEylemYaz(key, detay, id) {
  const btn = $('#topbar-action');

  if (!AUTH.yonetici || YUKLENIYOR || DB.hata) { ustEylemGizle(btn); return; }

  btn.classList.remove('hidden');

  if (detay) {
    btn.classList.remove('hidden');
    btn.querySelector('span').textContent = 'Yeni Görev';
    btn.dataset.eylem = 'gorev-ekle';
    btn.dataset.proje = id;
  } else if (key === 'standartlar') {
    btn.classList.remove('hidden');
    btn.querySelector('span').textContent = 'Yeni Standart';
    btn.dataset.eylem = 'standart-ekle';
    delete btn.dataset.proje;
  } else {
    /* Görevler ve Ayarlar'da da artı dursun — kaybolmasın.
       Bu ekranlarda kendine ait bir eylem yok, en sık işi yapar: yeni proje. */
    btn.querySelector('span').textContent = 'Yeni Proje';
    btn.dataset.eylem = 'sihirbaz';
    delete btn.dataset.proje;
  }
}

/* Alt çubuğun ortasındaki artı, üstteki ana butonla aynı işi yapar.
   Masaüstünde üstteki buton, mobilde bu görünür. */
function artiYaz(key, detay, id) {
  const btn = $('#arti');
  if (!btn) return;
  const ust = $('#topbar-action');

  if (ust.classList.contains('hidden')) {
    btn.classList.add('hidden');
    delete btn.dataset.eylem;
    delete btn.dataset.proje;
    btn.removeAttribute('title');
    return;
  }

  btn.classList.remove('hidden');
  btn.dataset.eylem = ust.dataset.eylem;
  btn.title = ust.querySelector('span').textContent;
  if (ust.dataset.proje) btn.dataset.proje = ust.dataset.proje;
  else delete btn.dataset.proje;
}

/* Gizlerken eylemi de sil — görünmeyen buton eski işi taşımasın. */
function ustEylemGizle(btn) {
  btn.classList.add('hidden');
  delete btn.dataset.eylem;
  delete btn.dataset.proje;
}

/* Açık projenin rengini uygulamanın tamamına verir: üst çubuk, modül ikonları… */
function projeRengiYay(proje) {
  const kok = $('#app');
  if (!kok) return;

  if (!proje) {
    ['--p1', '--p2', '--pl', '--pg', '--pk'].forEach(d => kok.style.removeProperty(d));
    return;
  }
  renkDegiskenleri(proje.renk).split(';').forEach(par => {
    const [ad, deger] = par.split(':');
    kok.style.setProperty(ad, deger);
  });
}

/* Sayılar sıfırdan hedefe sayarak gelir — yalnızca ekran değişiminde */
function sayaclariCanlandir(kok) {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  $$('[data-sayac]', kok).forEach(el => {
    const hedef = Number(el.dataset.sayac);
    if (!hedef || hedef > 9999) return;

    const on   = el.dataset.on || '';
    const sure = 620;
    const bas  = performance.now();

    const adim = t => {
      const o = Math.min(1, (t - bas) / sure);
      const e = 1 - Math.pow(1 - o, 3);
      el.textContent = on + Math.round(hedef * e);
      if (o < 1) requestAnimationFrame(adim);
    };
    el.textContent = on + '0';
    requestAnimationFrame(adim);
  });
}

/* Fareyle kartların hafifçe eğilmesi. Yalnızca gerçek fare varken çalışır,
   dokunmatikte hiç devreye girmez. Tek bir kare isteği kullanır. */
function egilmeyiBagla() {
  const view = $('#view');
  if (!view) return;

  const fareVar = () => window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  let sonKart = null, bekleyen = null;

  const sifirla = kart => {
    if (!kart) return;
    kart.style.removeProperty('--rx');
    kart.style.removeProperty('--ry');
  };

  view.addEventListener('pointermove', e => {
    if (!fareVar()) return;

    const kart = e.target.closest('.tilt');
    if (kart !== sonKart) { sifirla(sonKart); sonKart = kart; }
    if (!kart) return;

    if (bekleyen) cancelAnimationFrame(bekleyen);
    bekleyen = requestAnimationFrame(() => {
      const r = kart.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width  - .5;
      const y = (e.clientY - r.top)  / r.height - .5;
      kart.style.setProperty('--rx', (-y * 5).toFixed(2) + 'deg');
      kart.style.setProperty('--ry', ( x * 6).toFixed(2) + 'deg');
      kart.style.setProperty('--mx', ((x + .5) * 100).toFixed(1) + '%');
      kart.style.setProperty('--my', ((y + .5) * 100).toFixed(1) + '%');
    });
  }, { passive: true });

  view.addEventListener('pointerleave', () => { sifirla(sonKart); sonKart = null; }, { passive: true });
}

/* Yan menü ve mobil sekme çubuğu MENU listesinden üretilir. */
function menuyuCiz() {
  const gorunur = MENU.filter(m => !m.sadeceYonetici || AUTH.yonetici);

  const satir = m => `
    <a class="nav-item" href="#/${m.id}" data-route="${m.id}" draggable="false">
      ${svg(ICON[m.ikon], 18)}
      <span>${esc(m.ad)}</span>
      ${m.sayac ? `<em class="nav-count" data-count="${m.sayac}">0</em>` : ''}
    </a>`;

  /* Yan menü iki grup: üstte her gün girilen ekranlar, ayırıcının altında
     ayar ve arşiv niteliğinde olanlar. Profil bir ekran değil, üstten açılan
     hesap paneli — o yüzden bağlantı değil düğme. */
  $('#sidebar .nav').innerHTML = `
    <div class="nav-grup">
      ${gorunur.filter(m => !m.alt).map(satir).join('')}
      <button class="nav-item" id="nav-profil" type="button">
        ${svg(ICON.kisi, 18)}<span>Profil</span>
      </button>
    </div>
    <span class="nav-ayrac"></span>
    <div class="nav-grup sonik">
      ${gorunur.filter(m => m.alt).map(satir).join('')}
      <button class="nav-item" id="nav-cikis" type="button">
        ${svg(ICON.cikis, 18)}<span>Çıkış Yap</span>
      </button>
    </div>`;

  $('#nav-profil').addEventListener('click', () => hesapMenusu());
  $('#nav-cikis').addEventListener('click', () => signOut());

  /* Alt çubuk: beş sekme, ortada artı yok. Artı kaldırıldı çünkü onaylanan
     tasarımda yok; yerine "Yeni Proje" Projeler ekranının kendi başlığında
     duruyor (bkz. ROUTES.projeler). */
  const sekmeler = gorunur.filter(m => m.tab).map(m => `
    <a class="tab" href="#/${m.id}" data-route="${m.id}" draggable="false">
      ${svg(ICON[m.ikon], 23)}
      <span>${esc(m.tabAd || m.ad)}</span>
    </a>`);

  $('#tabbar').innerHTML = sekmeler.join('');
}

/* Zilin kırmızı noktası — bekleyen işin var mı?
   Yöneticide onay bekleyen (Kontrolde) görevler, geliştiricide kendine
   atanmış bitmemiş işler. Sayı yazmıyoruz: nokta "bir şey var" demek
   için yeter, sayı zaten Görevler ekranında. */
/* İki kırmızı nokta var: zilde bekleyen iş, sohbette okunmamış mesaj.
   Aynı sınıfı taşıdıkları için ikisi de kendi düğmesinin içinden
   seçiliyor; yoksa biri ötekinin yerine yazılıyordu. */
function zilNoktasi() {
  const zilN = $('#btn-zil .zil-nokta');
  if (zilN) {
    const bekleyen = AUTH.yonetici
      ? DB.gorevleri({ durum: 'kontrolde' }).length
      : DB.gorevleri({ kisi: AUTH.user ? AUTH.user.id : '' })
          .filter(g => g.durum !== 'tamamlandi').length;
    zilN.classList.toggle('hidden', !bekleyen);
  }

  const sohbetN = $('#btn-sohbet .zil-nokta');
  if (sohbetN) sohbetN.classList.toggle('hidden', !DB.okunmamis());
}

function sayaclariYaz() {
  zilNoktasi();
  const pr = $('[data-count="projeler"]');
  if (pr) pr.textContent = DB.projeler.filter(p => !cekirdekMi(p)).length;

  const gv = $('[data-count="gorevler"]');
  if (gv) {
    const acik = AUTH.user
      ? DB.gorevleri({ kisi: AUTH.user.id }).filter(g => g.durum !== 'tamamlandi').length
      : 0;
    gv.textContent = acik;
  }
}

function sektorAltBaslik() {
  if (YUKLENIYOR) return 'yükleniyor…';
  return (DB.sektorler || []).length + ' sektör';
}

/* Bir sektöre kaç template bağlı. */
function sektorTemplateSayisi(sektorId) {
  return (DB.projeler || []).filter(p =>
    !p.arsiv && cekirdekMi(p) && templateSektorIdleri(p).includes(sektorId)).length;
}

/* Sektör kartı. Açıklama alanı yok — kartta ad ve template sayısı duruyor. */
function sektorKarti(x) {
  const n = sektorTemplateSayisi(x.id);
  return `
    <button class="lk" type="button" data-eylem="sektor-duzenle" data-id="${esc(x.id)}"
            data-ara="${esc(String(x.ad || '').toLocaleLowerCase('tr'))}">
      <span class="lk-ikon">${svg(ICON.katman, 26)}</span>
      <span class="lk-yz">
        <b>${esc(x.ad)}</b>
        <em>${svg(ICON.katman, 15)}${n ? n + ' template' : 'template yok'}</em>
      </span>
      <span class="lk-ok">${svg(ICON.chevron, 18)}</span>
    </button>`;
}

function paketAltBaslik() {
  if (YUKLENIYOR) return 'yükleniyor…';
  return (DB.paketler || []).length + ' paket';
}

function paketAkisAdi(akis) {
  return (PAKET_AKISLARI.find(x => x.anahtar === akis) || PAKET_AKISLARI[0]).ad;
}

/* Bir pakete kaç proje bağlı — template'ler ve arşiv sayılmıyor. */
function paketProjeSayisi(anahtar) {
  return (DB.projeler || []).filter(p =>
    !p.arsiv && !cekirdekMi(p) && paketAnahtari(p) === anahtar).length;
}

function paketKarti(x) {
  const n = paketProjeSayisi(x.anahtar);
  return `
    <button class="lk" type="button" data-eylem="paket-duzenle" data-id="${esc(x.id)}">
      <span class="lk-ikon turuncu">${svg(ICON.paket, 26)}</span>
      <span class="lk-yz">
        <b>${esc(x.ad)}${x.varsayilan ? '<u class="lk-rozet">Varsayılan</u>' : ''}</b>
        <i>${esc(x.aciklama || paketAkisAdi(paketinAkisi(x)))}</i>
        <em>${svg(ICON.folder, 15)}${n ? n + ' proje' : 'proje yok'}</em>
      </span>
      <span class="lk-ok">${svg(ICON.chevron, 18)}</span>
    </button>`;
}

/* Paket penceresi. Akış kodda tanımlı; burada yalnız hangisinin
   kullanılacağı seçiliyor — o alan tasarımda yoktu ama olmazsa ikinci bir
   "hazır program" paketi hiç kurulamıyor. */
function paketDuzenle(id) {
  modalHepsiniKapat();
  const x = id ? (DB.paketler || []).find(k => k.id === id) : null;
  let varsayilan = x ? paketinAkisi(x) === 'ozel' : false;
  /* Sütunlar kurulmadıysa kutular görünür ama neden kaydedilmediği yazılır. */
  const yeniKapali = paketYeniAlanlarKapali();

  const sayac = (deger, sinir) => `${String(deger || '').length}/${sinir}`;

  modalAc(`
    <div class="pd-tepe">
      <span class="pd-ikon">${svg(ICON.paket, 26)}</span>
      <span class="pd-yz">
        <b>${esc(x ? x.ad : 'Yeni paket')}</b>
        <i>Paket bilgilerini düzenleyin.</i>
      </span>
      <button class="pd-kapat" type="button" data-pk="iptal" aria-label="Kapat">
        ${svg(ICON.kapat, 18)}
      </button>
    </div>

    <label class="pd-alan">
      <span class="pd-et">Paket Adı</span>
      <input class="pd-giris" type="text" id="pk-ad" value="${esc(x ? x.ad : '')}"
             placeholder="Örn. Muhasebe-2" maxlength="40" autocomplete="off">
    </label>

    <label class="pd-alan">
      <span class="pd-et">Açıklama</span>
      <span class="pd-kutu">
        <textarea class="pd-giris" id="pk-aciklama" rows="3" maxlength="500"
          placeholder="Bu paket kısaca ne?">${esc(x ? (x.aciklama || '') : '')}</textarea>
        <em class="pd-sayac" data-sayac="pk-aciklama" data-sinir="500">${
          sayac(x && x.aciklama, 500)}</em>
      </span>
    </label>

    <label class="pd-alan">
      <span class="pd-et">Promptda nasıl anlatılsın?
        <button class="pd-info" type="button" data-eylem="paket-tanim-bilgi"
                aria-label="Bu alan ne işe yarar?">${svg(ICON.info, 16)}</button>
      </span>
      <span class="pd-kutu">
        <textarea class="pd-giris" id="pk-tanim" rows="4" maxlength="1000"
          placeholder="Claude'a bu paketi anlatan birkaç cümle…">${
            esc(x ? (x.tanim || '') : '')}</textarea>
        <em class="pd-sayac" data-sayac="pk-tanim" data-sinir="1000">${
          sayac(x && x.tanim, 1000)}</em>
      </span>
      ${yeniKapali ? `<i class="pd-ipucu uyari">Bu alan için
        <b class="mono">sql/27-paket-varsayilan.sql</b> çalıştırılmalı.</i>` : ''}
    </label>

    <button class="pd-anahtar ${varsayilan ? 'acik' : ''}" type="button" data-pk="varsayilan"
            role="switch" aria-checked="${varsayilan}">
      <span class="pd-anahtar-ikon">${svg(ICON.yildiz, 20)}</span>
      <span class="pd-anahtar-yz">
        <b>Varsayılan olarak işaretle</b>
        <i>Yeni proje oluştururken bu paket seçili olsun.</i>
      </span>
      <span class="pd-anahtar-kol"><u></u></span>
    </button>

    ${x ? `<button class="pd-kaldir" type="button" data-pk="sil">
      ${svg(ICON.cop, 17)}<span>Kaldır</span></button>` : ''}

    <div class="modal-alt">
      <button class="btn btn-ghost" data-pk="iptal" type="button">Vazgeç</button>
      <button class="btn btn-primary pd-kaydet" data-pk="kaydet" type="button"><span>Kaydet</span></button>
    </div>`, kutu => {
    setTimeout(() => $('#pk-ad', kutu).focus(), 40);
    $$('[data-pk="iptal"]', kutu).forEach(b => b.addEventListener('click', modalKapat));

    /* Sayaçlar yazdıkça güncelleniyor. Kutu da içeriğe göre uzuyor: sabit
       yükseklikte kalsaydı uzun metin kayar ve sayacın altına girerdi. */
    const buyut = t => {
      t.style.height = 'auto';
      t.style.height = Math.min(t.scrollHeight, 280) + 'px';
    };
    $$('[data-sayac]', kutu).forEach(em => {
      const alan = $('#' + em.dataset.sayac, kutu);
      if (!alan) return;
      buyut(alan);
      alan.addEventListener('input', () => {
        em.textContent = alan.value.length + '/' + em.dataset.sinir;
        buyut(alan);
      });
    });

    const anahtar = $('[data-pk="varsayilan"]', kutu);
    anahtar.addEventListener('click', () => {
      varsayilan = !varsayilan;
      anahtar.classList.toggle('acik', varsayilan);
      anahtar.setAttribute('aria-checked', String(varsayilan));
    });

    const silDug = $('[data-pk="sil"]', kutu);
    if (silDug) silDug.addEventListener('click', async () => {
      const n = paketProjeSayisi(x.anahtar);
      if (n) {
        toast(`"${x.ad}" paketi ${n} projede kullanılıyor — kaldırılamaz.`, 'hata');
        return;
      }
      const ok = await onaySor({
        baslik: 'Paket kaldırılsın mı?',
        mesaj: `"${x.ad}" listeden çıkacak. Hiçbir projede kullanılmıyor.`,
      });
      if (!ok) return;
      try {
        await DB.paketSil(x.id);
        modalKapat();
        render();
        toast('Paket kaldırıldı.', 'basari');
      } catch (h) { toast(h.message, 'hata'); }
    });

    $('[data-pk="kaydet"]', kutu).addEventListener('click', async () => {
      const ad = $('#pk-ad', kutu).value.trim();
      if (!ad) { toast('Paket adını yaz.'); return; }

      const yazi = $('[data-pk="kaydet"] span', kutu);
      yazi.textContent = 'Kaydediliyor…';
      try {
        /* Anahtar adres gibi: bir kez kurulur, sonra değişmez. Değişseydi
           o pakete bağlı projeler paketini kaybederdi. */
        const alanlar = {
          ad,
          aciklama: $('#pk-aciklama', kutu).value.trim() || null,
          /* `akis` artık işareti izliyor; sütun eski kurulumlarda hâlâ
             okunduğu için tutarlı yazıyoruz. */
          akis: varsayilan ? 'ozel' : 'muhasebe',
          tanim: $('#pk-tanim', kutu).value.trim() || null,
          varsayilan,
        };
        if (!id) alanlar.anahtar = paketAnahtariUret(ad);
        const sonuc = await DB.paketKaydet(id, alanlar);
        modalKapat();
        render();
        toast((sonuc && sonuc.uyari) || (id ? 'Paket güncellendi.' : 'Paket eklendi.'),
          sonuc && sonuc.uyari ? 'uyari' : 'basari');
      } catch (h) {
        yazi.textContent = 'Kaydet';
        toast(h.message, 'hata');
      }
    });
  });
}

/* Yeni sütunlar kurulmuş mu — okunan satırda anahtar hiç yoksa kurulmamıştır. */
function paketYeniAlanlarKapali() {
  const l = DB.paketler || [];
  return !!l.length && (!('tanim' in l[0]) || !('varsayilan' in l[0]));
}

/* Sıfırdan kurulan proje hangi pakete bağlanacak. */
function varsayilanPaket() {
  const l = DB.paketler || [];
  return l.find(k => k.varsayilan) || l.find(k => k.anahtar === 'ozel') || null;
}

/* Addan adres üretir: "Muhasebe-2" → "muhasebe-2". Çakışırsa sonuna sayı. */
function paketAnahtariUret(ad) {
  const harf = { 'ç': 'c', 'ğ': 'g', 'ı': 'i', 'ö': 'o', 'ş': 's', 'ü': 'u' };
  let kok = String(ad).toLocaleLowerCase('tr')
    .replace(/[çğıöşü]/g, h => harf[h] || h)
    .replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || 'paket';
  const var_ = a => (DB.paketler || []).some(p => p.anahtar === a);
  if (!var_(kok)) return kok;
  let i = 2;
  while (var_(kok + '-' + i)) i++;
  return kok + '-' + i;
}

const SK_SIRA = [
  { anahtar: 'sira',  ad: 'Kendi sırası' },
  { anahtar: 'ad',    ad: 'Ada göre' },
  { anahtar: 'modul', ad: 'Modül sayısına göre' },
];

function skSiraAdi() {
  return (SK_SIRA.find(x => x.anahtar === SEKTOR_SIRA) || SK_SIRA[0]).ad;
}

function skSirala(liste) {
  const l = (liste || []).slice();
  if (SEKTOR_SIRA === 'ad') {
    return l.sort((a, b) => String(a.ad || '').localeCompare(String(b.ad || ''), 'tr'));
  }
  if (SEKTOR_SIRA === 'modul') {
    return l.sort((a, b) => (b.moduller || []).length - (a.moduller || []).length);
  }
  return l;
}

/* Arama yazarken ekran yeniden çizilmiyor: kartlar yerinde, uymayan gizleniyor. */
function skAramaUygula() {
  const liste = $('.lk-liste');
  if (!liste) return;
  let gorunen = 0;
  $$('.lk', liste).forEach(k => {
    const uyar = !SEKTOR_ARAMA || (k.dataset.ara || '').indexOf(SEKTOR_ARAMA) >= 0;
    k.classList.toggle('gizli', !uyar);
    if (uyar) gorunen++;
  });
  liste.classList.toggle('bos', gorunen === 0);
}

function kilitAltBaslik() {
  if (YUKLENIYOR) return 'yükleniyor…';
  const n = DB.projeler.filter(p => !p.arsiv && !cekirdekMi(p) && (p.palet || {}).kilitli).length;
  return n ? n + ' kilitli' : 'kilitli proje yok';
}

function kilitSatiri(p) {
  const kilitli = !!(p.palet || {}).kilitli;
  return `
    <div class="row">
      <div class="row-main">
        <span class="row-title">${esc(projeAdi(p))}</span>
        <span class="row-sub">${kilitli ? 'Kilitli — silinemez' : 'Kilitli değil'}</span>
      </div>
      <label class="kur-onay ${kilitli ? 'on' : ''}" data-eylem="proje-kilit-degistir"
             data-proje="${p.id}" role="button" tabindex="0">
        <span class="kur-kutu">${svg(ICON.kilit, 12)}</span></label>
    </div>`;
}

function cekirdekAltBaslik() {
  if (YUKLENIYOR) return 'yükleniyor…';
  const n = DB.projeler.filter(p => !p.arsiv && cekirdekMi(p)).length;
  return n ? n + ' template' : 'template yok';
}



/* Template'in kaç modülü var — "Proje Geneli" sayılmıyor. */
function templateModulSayisi(p) {
  return DB.modulleri(p.id).filter(m => m.ad !== GENEL_MODUL).length;
}

/* Template'in kapağı: hazır görsellerden biri + arka plan rengi. İkisi de
   paletindeki cekirdek nesnesinde; dosya yüklenmiyor, seçiliyor. */
function templateKapagi(p) {
  const cek = ((p || {}).palet || {}).cekirdek || {};
  return KAPAK_GORSELLERI.find(x => x.anahtar === cek.kapak) || null;
}

/* Arka plan rengi seçilmiyor, sıraya göre dönüyor: listedeki her template
   bir öncekinden farklı renk alıyor, renkler bitince başa dönüyor.
   Saklanmıyor — sırayla hesaplanıyor, hep tutarlı çıkıyor. */
function templateKapakRengi(p) {
  const liste = (DB.projeler || []).filter(x => !x.arsiv && cekirdekMi(x));
  const i = liste.findIndex(x => x.id === (p || {}).id);
  const r = KAPAK_RENKLERI[(i < 0 ? 0 : i) % KAPAK_RENKLERI.length];
  return r ? r.deger : 'var(--yuva)';
}

/* Template'in açıklaması — paletinde duruyor, ayrı sütun gerekmiyor. */
function templateAciklamasi(p) {
  return String(((((p || {}).palet) || {}).cekirdek || {}).aciklama || '').trim();
}

/* Templateler listesindeki kart. Kapak görseli projenin logo alanını
   kullanıyor: template zaten bir proje, kova ve imzalı adres hazır.
   Müşteri kopyasına taşınmıyor (bkz. DB.projeKopyala). */
function templateKarti(p) {
  const n = templateModulSayisi(p);
  const hazir = !!(p.palet || {}).cekirdekTemizlendi;
  const kapak = templateKapagi(p);
  const aciklama = templateAciklamasi(p);

  return `
    <button class="tp" type="button" data-eylem="template-ayar" data-proje="${p.id}"
            data-ara="${esc(((p.firma || '') + ' ' + aciklama).toLocaleLowerCase('tr'))}">
      <span class="tp-kapak" style="background-color:${templateKapakRengi(p)}">
        ${kapak ? `<img src="${esc(kapak.dosya)}" alt="" loading="lazy">`
                : svg(ICON.resim, 26)}
      </span>
      <span class="tp-yz">
        <b>${esc(p.firma || 'Template')}</b>
        <i>${esc(aciklama || 'Açıklama yazılmadı.')}</i>
        <em>${svg(ICON.katman, 15)}${n ? n + ' modül' : 'modül yok'}${
          hazir ? '' : ' · kuruluyor'}</em>
      </span>
      <span class="tp-ok">${svg(ICON.chevron, 18)}</span>
    </button>`;
}

function tpAramaUygula() {
  const liste = $('.tp-liste');
  if (!liste) return;
  let gorunen = 0;
  $$('.tp', liste).forEach(k => {
    const uyar = !TEMPLATE_ARAMA || (k.dataset.ara || '').indexOf(TEMPLATE_ARAMA) >= 0;
    k.classList.toggle('gizli', !uyar);
    if (uyar) gorunen++;
  });
  liste.classList.toggle('bos', gorunen === 0);
}

/* ---------- Template'in sektörü ve paketi ----------
   İkisi de template'in paletinde, `cekirdek` nesnesinin içinde duruyor.
   Sektör ÇOKLU: aynı taban birden çok sektöre uyabiliyor ("Cari + Stok"
   hem markete hem toptancıya). Kimlikle bağlanıyor, adla değil — sektörün
   adı değişince bağ kopmasın. */
function templateSektorIdleri(p) {
  const cek = ((p && p.palet) || {}).cekirdek || {};
  return Array.isArray(cek.sektorler) ? cek.sektorler : [];
}

function templateSektorleri(p) {
  const idler = templateSektorIdleri(p);
  return (DB.sektorler || []).filter(x => idler.includes(x.id));
}

/* Paket anahtarı. Eski template'lerde yok — o zaman kurulum türünden
   ("muhasebe") türetiyoruz ki hiçbiri paketsiz kalmasın. */
function templatePaketAnahtari(p) {
  const cek = ((p && p.palet) || {}).cekirdek || {};
  if (cek.paket) return cek.paket;
  return cek.tur === 'muhasebe' ? 'muhasebe-1' : 'ozel';
}

function templatePaketi(p) {
  const anahtar = templatePaketAnahtari(p);
  return (DB.paketler || []).find(x => x.anahtar === anahtar) || null;
}

/* Satırda görünen özet: paket · sektörler. */
function templateOzeti(p) {
  const paket = templatePaketi(p);
  const sk = templateSektorleri(p);
  return [
    paket ? paket.ad : templatePaketAnahtari(p),
    sk.length ? sk.map(x => x.ad).join(', ') : 'sektör seçilmedi',
  ].join(' · ');
}

/* Template'in tek yönetim ekranı: kapak, açıklama, paket, sektörler ve
   kurulum/kilit/silme işleri. Liste kartına dokununca burası açılıyor. */
function templateAyarlari(projeId) {
  modalHepsiniKapat();
  const p = DB.proje(projeId);
  if (!p) return;

  const pl = p.palet || {};
  let secili = templateSektorIdleri(p).slice();
  let paket  = templatePaketAnahtari(p);
  const cek0 = pl.cekirdek || {};
  let kapak = cek0.kapak || '';
  const paketler  = (DB.paketler || []).filter(k => paketinAkisi(k) !== 'ozel');
  const sektorler = DB.sektorler || [];
  const yayinAdres = String(pl.alanAdi || '').trim();
  /* Hangi parçalar kaydedilmiş — metnin kendisi ayrı tabloda, burada
     yalnız işaretleri tutuyoruz ki 20 bin satırı okumadan tik gösterelim. */
  const sqlKayitli = [1, 2, 3].map(no => !!(cek0.sqlParca || {})[no]);

  modalAc(`
    <div class="pd-tepe">
      <span class="pd-ikon kirmizi">${svg(ICON.izgaraDort, 26)}</span>
      <span class="pd-yz">
        <b>${esc(p.firma || 'Template')}</b>
        <i>${esc(templateAciklamasi(p) || 'Template bilgilerini düzenleyin.')}</i>
      </span>
      <button class="pd-kapat" type="button" data-ta="iptal" aria-label="Kapat">
        ${svg(ICON.kapat, 18)}
      </button>
    </div>

    <div class="pd-alan">
      <span class="pd-et">Kapak Fotoğrafı Seç
        <em class="pd-sag" id="ta-sayac">${
          (KAPAK_GORSELLERI.findIndex(g => g.anahtar === kapak) + 1)} / ${KAPAK_GORSELLERI.length}</em>
      </span>
      <div class="kp-serit" id="ta-kapak">
        ${KAPAK_GORSELLERI.map(g => `
          <button class="kp ${kapak === g.anahtar ? 'sec' : ''}" type="button"
                  data-ta-kapak="${esc(g.anahtar)}" aria-label="${esc(g.ad)}">
            <img src="${esc(g.dosya)}" alt="" loading="lazy">
            <u class="kp-tik">${svg(ICON.tik, 12)}</u>
          </button>`).join('')}
      </div>
      <i class="pd-ipucu">Arka plan rengi kendiliğinden veriliyor; her
      template bir öncekinden farklı renk alıyor.</i>
    </div>

    <label class="pd-alan">
      <span class="pd-et">Açıklama</span>
      <span class="pd-kutu">
        <textarea class="pd-giris" id="ta-aciklama" rows="3" maxlength="300"
          placeholder="Bu template ne işe yarar?">${esc(templateAciklamasi(p))}</textarea>
        <em class="pd-sayac" data-sayac="ta-aciklama" data-sinir="300">${
          templateAciklamasi(p).length}/300</em>
      </span>
    </label>

    <div class="pd-alan">
      <span class="pd-et">Paket Seç</span>
      ${paketler.length ? `<div class="rd-izgara" id="ta-paket">
        ${paketler.map(k => `
          <button class="rd ${paket === k.anahtar ? 'sec' : ''}" type="button"
                  data-ta-paket="${esc(k.anahtar)}">
            <u class="rd-nokta"></u><span>${esc(k.ad)}</span>
          </button>`).join('')}
      </div>` : '<i class="pd-ipucu">Varsayılan olmayan bir paket yok — önce Paketler\'den ekle.</i>'}
    </div>

    <div class="pd-alan">
      <span class="pd-et">Sektör Seç
        <em class="pd-sag">Çoklu seçim</em>
      </span>
      ${sektorler.length ? `<div class="sb-izgara" id="ta-sektor">
        ${sektorler.map(x => `
          <button class="sb ${secili.includes(x.id) ? 'sec' : ''}" type="button"
                  data-ta-sektor="${esc(x.id)}">
            <span>${esc(x.ad)}</span>
          </button>`).join('')}
      </div>` : '<i class="pd-ipucu">Önce Kütüphane > Sektörler\'den sektör ekle.</i>'}
      <i class="pd-ipucu">Sektör seçmezsen bu template yeni proje akışında
      hiçbir sektörün altında çıkmaz.</i>
    </div>

    <div class="pd-alan">
      <span class="pd-et">Kurulum SQL'i
        <em class="pd-sag" id="ta-sql-sayac">${sqlKayitli.filter(Boolean).length} / 3</em>
      </span>
      <div class="sq-liste">
        ${[1, 2, 3].map(no => `
          <label class="sq ${sqlKayitli[no - 1] ? 'sec' : ''}" data-sq="${no}">
            <span class="sq-et">
              <b>Parça ${no}</b>
              <u class="sq-tik">${svg(ICON.tik, 11)}<i>kayıtlı</i></u>
            </span>
            <textarea class="sq-alan" id="ta-sql-${no}" rows="2" spellcheck="false"
              placeholder="${no}. parçayı buraya yapıştır…"></textarea>
          </label>`).join('')}
      </div>
      <i class="pd-ipucu">Yapıştırınca kendiliğinden kaydedilir. Müşteri projesi
      kurulurken bu SQL Supabase'e yapıştırılacak.</i>
    </div>

    <div class="tp-isler">
      ${yayinAdres ? `<button class="tp-is" type="button" data-ta="yayin">
        <span class="tp-is-ik">${svg(ICON.disari, 19)}</span>
        <span class="tp-is-yz"><b>Uygulamayı Aç</b>
          <i>${esc(yayinAdres)}</i></span>
        ${svg(ICON.chevron, 16)}
      </button>` : ''}
    </div>

    <button class="pd-kaldir" type="button" data-ta="sil">
      ${svg(ICON.cop, 17)}<span>Template'i sil</span></button>

    <div class="modal-alt">
      <button class="btn btn-ghost" data-ta="iptal" type="button">Vazgeç</button>
      <button class="btn btn-primary pd-kaydet" data-ta="kaydet" type="button"><span>Kaydet</span></button>
    </div>`, kutu => {
    $$('[data-ta="iptal"]', kutu).forEach(b => b.addEventListener('click', modalKapat));

    const buyut = t => { t.style.height = 'auto'; t.style.height = Math.min(t.scrollHeight, 220) + 'px'; };
    $$('[data-sayac]', kutu).forEach(em => {
      const alan = $('#' + em.dataset.sayac, kutu);
      if (!alan) return;
      buyut(alan);
      alan.addEventListener('input', () => {
        em.textContent = alan.value.length + '/' + em.dataset.sinir;
        buyut(alan);
      });
    });

    /* Görsel ve renk: seçim, yükleme yok. Seçilen renk küçük görsellerin
       de zeminine vuruyor ki kartta nasıl duracağı burada görünsün. */
    /* Küçük görsellerin zemini kartta çıkacak renkle aynı. */
    $$('[data-ta-kapak]', kutu).forEach(b => {
      b.style.background = templateKapakRengi(p);
    });
    const kapakYaz = () => {
      $$('[data-ta-kapak]', kutu).forEach(o =>
        o.classList.toggle('sec', o.dataset.taKapak === kapak));
      const sayac = $('#ta-sayac', kutu);
      if (sayac) {
        sayac.textContent = (KAPAK_GORSELLERI.findIndex(g => g.anahtar === kapak) + 1)
          + ' / ' + KAPAK_GORSELLERI.length;
      }
    };
    kapakYaz();

    $$('[data-ta-kapak]', kutu).forEach(b => b.addEventListener('click', () => {
      kapak = kapak === b.dataset.taKapak ? '' : b.dataset.taKapak;
      kapakYaz();
    }));

    $$('[data-ta-paket]', kutu).forEach(b => b.addEventListener('click', () => {
      paket = b.dataset.taPaket;
      $$('[data-ta-paket]', kutu).forEach(o => o.classList.toggle('sec', o === b));
    }));

    /* Başlıktaki alt yazı açıklamayı gösteriyor; yazdıkça güncelleniyor. */
    const ustAlt = $('.pd-yz i', kutu);
    const acAlan = $('#ta-aciklama', kutu);
    if (ustAlt && acAlan) acAlan.addEventListener('input', () => {
      ustAlt.textContent = acAlan.value.trim() || 'Template bilgilerini düzenleyin.';
    });

    $$('[data-ta-sektor]', kutu).forEach(kutucuk => kutucuk.addEventListener('click', () => {
      const id = kutucuk.dataset.taSektor;
      const i = secili.indexOf(id);
      i === -1 ? secili.push(id) : secili.splice(i, 1);
      kutucuk.classList.toggle('sec', i === -1);
    }));

    /* Yapıştırınca kaydediyoruz: parça 20 bin satır olabiliyor, ayrı bir
       "kaydet" düğmesine basmayı beklemek gereksiz bir adım. */
    [1, 2, 3].forEach(no => {
      const alan = $('#ta-sql-' + no, kutu);
      if (!alan) return;
      const kaydet = async () => {
        const metin = alan.value.trim();
        if (!metin) return;
        const kutucuk = alan.closest('.sq');
        kutucuk.classList.add('yaziliyor');
        try {
          await DB.sablonSqlParcaYaz(p.id, no, metin);
          alan.value = '';
          kutucuk.classList.remove('yaziliyor');
          kutucuk.classList.add('sec');
          sqlKayitli[no - 1] = true;
          const sayac = $('#ta-sql-sayac', kutu);
          if (sayac) sayac.textContent = sqlKayitli.filter(Boolean).length + ' / 3';
          toast(no + '. parça kaydedildi.', 'basari');
        } catch (h) {
          kutucuk.classList.remove('yaziliyor');
          toast(h.message, 'hata');
        }
      };
      /* `paste` olayında kutunun içi henüz dolmamış oluyor — bir tur bekle. */
      alan.addEventListener('paste', () => setTimeout(kaydet, 0));
      alan.addEventListener('change', kaydet);
    });

    const yayinDug = $('[data-ta="yayin"]', kutu);
    if (yayinDug) yayinDug.addEventListener('click', () => {
      window.open(/^https?:/.test(yayinAdres) ? yayinAdres : 'https://' + yayinAdres, '_blank');
    });

    $('[data-ta="sil"]', kutu).addEventListener('click', () => {
      modalKapat();
      /* Silme kuralları (kilit kontrolü, onay, depoda kalanlar) tek yerde
         duruyor; burada aynı eylemi çağırıyoruz. */
      const sahte = document.createElement('div');
      sahte.dataset.eylem = 'template-sil';
      sahte.dataset.proje = p.id;
      eylemCalistir(sahte);
    });

    $('[data-ta="kaydet"]', kutu).addEventListener('click', async () => {
      const yazi = $('[data-ta="kaydet"] span', kutu);
      yazi.textContent = 'Kaydediliyor…';
      try {
        const guncel = DB.proje(p.id) || p;
        const eskiPalet = guncel.palet || {};
        const cek = Object.assign({}, eskiPalet.cekirdek || {}, {
          paket,
          sektorler: secili,
          aciklama: $('#ta-aciklama', kutu).value.trim() || null,
          kapak: kapak || null,
        });
        await DB.paletKaydet(p.id, Object.assign({}, eskiPalet, { cekirdek: cek }));
        modalKapat();
        render();
        toast('Template kaydedildi.', 'basari');
      } catch (h) {
        yazi.textContent = 'Kaydet';
        toast(h.message, 'hata');
      }
    });
  });
}


function ekipAltBaslik() {
  if (YUKLENIYOR) return 'yükleniyor…';
  const t = DB.kisilerHepsi.length;
  const p = DB.kisilerHepsi.filter(k => !k.aktif).length;
  return p ? `${t} kişi · ${p} pasif` : `${t} kişi`;
}

/* Ekip listesindeki bir satır. Kendi satırında rol ve aktiflik kilitli —
   son yönetici kendini geliştirici yapıp sistemi kilitleyemesin. */
function kisiSatiri(k, i = 0) {
  const ben  = AUTH.user && k.id === AUTH.user.id;
  const foto = k.foto
    ? `<span class="foto kucuk resimli" style="background-image:url('${esc(k.foto)}')"></span>`
    : `<span class="foto kucuk"><b>${esc(basHarf(k.ad || '?'))}</b></span>`;

  return `
    <div class="row kisi-satir ${k.aktif ? '' : 'pasif'}" style="--i:${i}"
         data-eylem="kisi-duzenle" data-id="${k.id}" role="button" tabindex="0">
      ${foto}
      <div class="row-main">
        <span class="row-title">${esc(k.ad || '—')}${ben ? ' <em class="ipucu">(sen)</em>' : ''}</span>
        <span class="row-sub">${k.rol === 'yonetici' ? 'Yönetici' : 'Geliştirici'}${k.aktif ? '' : ' · pasif'}</span>
      </div>
      <span class="row-val">${svg(ICON.chevron, 15)}</span>
    </div>`;
}

/* ---------- Ekip ekranı ----------
   Onaylanan tasarım: üstte başlık ve "Ekip Üyesi Ekle", altında üç sayı
   hapı (aynı zamanda filtre), arama ve sıralama, sonra kişi kartları.

   Karttaki her şey gerçek: fotoğraf, ad, rol, hesap durumu, canlı çevrimiçi
   bilgisi, son hareket saati, kişinin görevi olan proje sayısı, görev
   sayısı ve hesabın açıldığı günden beri geçen süre. Mockup'taki kişisel
   söz satırı Studio'da yok, o yüzden konmadı. */
/* Kıdem hep AY olarak yuvarlanıyor, gün yazılmıyor. Bir aydan azsa
   "1 ay" diyor; on iki ayı geçince yıla dönüyor. */
function ekipKidem(k) {
  if (k && k.kurucu) return 'Kurucu';
  const iso = (k && (k.katilim || k.olusturuldu)) || '';
  if (!iso) return '';
  const t = new Date(iso);
  if (isNaN(t)) return '';

  const bugun = new Date();
  let ay = (bugun.getFullYear() - t.getFullYear()) * 12 + (bugun.getMonth() - t.getMonth());
  if (bugun.getDate() < t.getDate()) ay--;          /* ayı doldurmadıysa sayma */
  if (ay < 1) ay = 1;                                /* gün yazmıyoruz */

  if (ay < 12) return ay + ' ay';
  return Math.floor(ay / 12) + ' yıl';
}

/* Hayalet görevler (silinmiş projeden kalan satırlar) DB.gorevleri'nde
   zaten süzülüyor — bkz. data.js · gorevGecerli. */
function ekipProjeSayisi(kisiId) {
  const p = new Set();
  DB.gorevleri({ kisi: kisiId }).forEach(g => { if (g.proje_id) p.add(g.proje_id); });
  return p.size;
}

function ekipKarti(k) {
  const ad   = k.ad || 'İsimsiz';
  const acik = DB.cevrimicimi(k.id);
  const son  = ekipSonGorulme(k);
  const kidem = ekipKidem(k);
  const gorev = DB.gorevleri({ kisi: k.id }).length;

  const durumYazi = acik ? 'Şu an aktif.'
    : (son ? esc(pzZaman(son)) : 'Henüz girmedi');

  return `
    <div class="ek2 ${acik ? 'cevrimici' : ''} ${k.aktif ? '' : 'pasif'}"
         data-ara="${esc(ad.toLocaleLowerCase('tr'))}">
      <button class="ek2-menu" type="button" data-eylem="kisi-menu" data-id="${k.id}"
              aria-label="${esc(ad)} seçenekleri">
        <svg viewBox="0 0 24 24"><circle cx="12" cy="5" r="1.7"></circle><circle cx="12" cy="12" r="1.7"></circle><circle cx="12" cy="19" r="1.7"></circle></svg>
      </button>
      <span class="ek2-foto ${k.foto ? 'resimli' : ''}"
            ${k.foto ? `style="background-image:url('${esc(k.foto)}')"` : ''}>
        <b>${esc(basHarf(ad))}</b><u class="${acik ? 'acik' : ''}"></u>
      </span>
      <b class="ek2-ad">${esc(ad)}</b>
      <span class="ek2-rol ${k.rol === 'yonetici' ? 'yon' : ''}">${k.rol === 'yonetici' ? 'Yönetici' : 'Üye'}</span>
      <span class="ek2-durum">
        <i class="${acik ? 'acik' : ''}"></i>
        <span><em>Son aktiflik</em><b>${durumYazi}</b></span>
      </span>
      <span class="ek2-sayilar">
        <span><b>${svg(ICON.folder, 14)}${ekipProjeSayisi(k.id)}</b><i>Proje</i></span>
        <span><b>${svg(ICON.check, 14)}${gorev}</b><i>Görev</i></span>
        <span>${k.kurucu
          /* Kurucuda süre yok: simge üstte, "Kurucu" onun altında — yan yana
             yazınca kartın dışına taşıyordu. */
          ? `<b>${svg(ICON.kisi, 14)}</b><i>Kurucu</i>`
          : `<b>${svg(ICON.kisi, 14)}${kidem || '—'}</b><i>Ekipte</i>`}</span>
      </span>
      <button class="ek2-dug" type="button" data-eylem="mesaj-gonder" data-id="${k.id}">
        ${svg(ICON.mail, 15)}<span>Mesaj Gönder</span>
      </button>
    </div>`;
}

const EK_SIRA = [
  { anahtar: 'aktiflik', ad: 'Son aktiflik' },
  { anahtar: 'ad',       ad: 'Ada göre' },
  { anahtar: 'rol',      ad: 'Role göre' },
];

function ekSiraAdi() {
  const s = EK_SIRA.find(x => x.anahtar === EKIP_SIRA);
  return s ? s.ad : 'Son aktiflik';
}

/* Arama Projeler'deki gibi: ekran yeniden çizilmiyor, uymayan kart gizleniyor. */
function ekipAramaUygula() {
  const izgara = $('.ek2-izgara');
  if (!izgara) return;
  let gorunen = 0;
  $$('.ek2', izgara).forEach(k => {
    const uyar = !EKIP_ARAMA || (k.dataset.ara || '').indexOf(EKIP_ARAMA) >= 0;
    k.classList.toggle('gizli', !uyar);
    if (uyar) gorunen++;
  });
  izgara.classList.toggle('bos', gorunen === 0);
}

function ekipEkrani() {
  const hepsi = DB.kisilerHepsi || [];
  /* "Aktif" = şu an uygulamada olan. Canlı varlık kanalından geliyor,
     hesabın açık/kapalı olmasıyla ilgisi yok. Çevrimiçi olmayan herkes
     pasif sayılıyor. */
  const online = hepsi.filter(k => DB.cevrimicimi(k.id)).length;
  const sayi  = { tumu: hepsi.length, aktif: online, pasif: hepsi.length - online };

  let liste = hepsi.filter(k => EKIP_SUZ === 'aktif' ? DB.cevrimicimi(k.id)
    : EKIP_SUZ === 'pasif' ? !DB.cevrimicimi(k.id) : true);

  if (EKIP_SIRA === 'ad')       liste = liste.slice().sort((a, b) => (a.ad || '').localeCompare(b.ad || '', 'tr'));
  else if (EKIP_SIRA === 'rol') liste = liste.slice().sort((a, b) => (a.rol === 'yonetici' ? 0 : 1) - (b.rol === 'yonetici' ? 0 : 1));
  else liste = liste.slice().sort((a, b) => {
    const fa = DB.cevrimicimi(a.id) ? 1 : 0, fb = DB.cevrimicimi(b.id) ? 1 : 0;
    if (fa !== fb) return fb - fa;
    return (ekipSonGorulme(b) || '').localeCompare(ekipSonGorulme(a) || '');
  });

  /* Toplam'da iki kişi simgesi, diğer ikisinde renkli nokta. */
  const ikiKisi = '<svg viewBox="0 0 24 24"><circle cx="9.5" cy="8" r="3.3"></circle>'
    + '<path d="M3.5 19c0-3.1 2.7-5 6-5s6 1.9 6 5"></path>'
    + '<path d="M16.2 6.2a3 3 0 0 1 0 5.6M17.5 14.4c2 .6 3.5 2.1 3.5 4.6"></path></svg>';

  const hap = (k, ad, ic) => `
    <button class="ek2-hap ${EKIP_SUZ === k ? 'secili' : ''} h-${k}" type="button"
            data-eylem="ekip-suz" data-deger="${k}">
      <i>${ic || ''}</i><span><em>${ad}</em><b>${sayi[k]}</b></span>
    </button>`;

  const okIkili = '<svg viewBox="0 0 24 24" style="width:15px;height:15px"><path fill="none" stroke="currentColor"'
    + ' stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"'
    + ' d="M7 4v16M7 20l-3-3M17 20V4M17 4l3 3"></path></svg>';

  return `
    <div class="pj-tepe">
      <div class="pj-tepe-yz">
        <h1>Tüm Ekip</h1>
        <p>Ekibini yönet, rollerini gör ve son aktifliklerini takip et.</p>
      </div>
      <button class="pj-yeni" type="button" data-eylem="kullanici-ekle">
        ${svg(ICON.arti, 16)}<span>Ekip Üyesi Ekle</span></button>
    </div>

    <div class="ek2-haplar">
      ${hap('tumu', 'Toplam Üye', ikiKisi)}
      ${hap('aktif', 'Aktif Üye')}
      ${hap('pasif', 'Pasif Üye')}
    </div>

    <div class="pj-araclar ekip">
      <label class="pj-ara">
        <svg viewBox="0 0 24 24"><circle cx="11" cy="11" r="6.4"></circle><path d="M15.8 15.8L20.5 20.5"></path></svg>
        <input id="ek-ara" type="search" autocomplete="off" placeholder="Ekip üyesi ara…"
          value="${esc(EKIP_ARAMA)}">
      </label>
      <button class="pj-arac" type="button" data-eylem="ekip-sirala">
        ${okIkili}<span>Sıralama: ${esc(ekSiraAdi())}</span>
      </button>
    </div>

    ${liste.length
      ? `<div class="ek2-izgara">${liste.map(ekipKarti).join('')}
           <div class="pj-bos-arama">Aramana uyan kişi yok.</div>
         </div>`
      : `<div class="card">${empty(ICON.kisi,
          EKIP_SUZ === 'pasif' ? 'Pasif üye yok' : 'Kimse yok',
          'Yeni kullanıcı açtığında geçici şifreyi kendin belirlersin.',
          EKIP_SUZ === 'tumu' ? 'Ekip Üyesi Ekle' : null, 'kullanici-ekle')}</div>`}

    <div class="ek2-afis">
      <span class="ek2-afis-ikon">${svg(ICON.kisi, 26)}</span>
      <span class="ek2-afis-yz">
        <b>Daha Güçlü Bir Ekip</b>
        <i>İyi fikirler, doğru insanlarla gerçeğe dönüşür.</i>
      </span>
      <img class="ek2-afis-n" src="logo.png" alt="" draggable="false">
      <span class="ek2-afis-soz"><u></u>Birlikte<br>daha büyük<br>projeler.</span>
    </div>`;
}

/* ---------- Sohbet ----------
   Şimdilik yalnız liste: ekip üyeleri ve Nizam Studio duyuru satırı.
   Mesajlaşmanın kendisi henüz yazılmadı; satıra basınca haber veriyor.
   Yazılınca son mesaj, saat ve okunmamış rozeti bu satırlara girecek. */
function sohbetSatiri({ id, ad, alt, avatar, foto, acik, marka, saat, sayi }) {
  return `
    <button class="sh2 ${sayi ? 'yeni' : ''}" type="button" data-eylem="sohbet-ac" data-id="${esc(id)}"
            data-ara="${esc(String(ad).toLocaleLowerCase('tr'))}">
      <span class="sh2-foto ${foto ? 'resimli' : ''} ${marka ? 'marka' : ''}"
            ${foto ? `style="background-image:url('${esc(foto)}')"` : ''}>
        ${marka ? '<img src="logo.png" alt="">' : `<b>${esc(avatar)}</b>`}
        ${acik === undefined ? '' : `<u class="${acik ? 'acik' : ''}"></u>`}
      </span>
      <span class="sh2-orta">
        <b>${esc(ad)}</b>
        <i>${esc(alt)}</i>
      </span>
      <span class="sh2-sag">
        ${saat ? `<i>${esc(saat)}</i>` : ''}
        ${sayi ? `<em>${sayi > 99 ? '99+' : sayi}</em>` : ''}
      </span>
    </button>`;
}

function sohbetAramaUygula() {
  const liste = $('.sh2-liste');
  if (!liste) return;
  let gorunen = 0;
  $$('.sh2', liste).forEach(s => {
    const uyar = !SOHBET_ARAMA || (s.dataset.ara || '').indexOf(SOHBET_ARAMA) >= 0;
    s.classList.toggle('gizli', !uyar);
    if (uyar) gorunen++;
  });
  liste.classList.toggle('bos', gorunen === 0);
}

function sohbetEkrani() {
  /* Sıra: son yazışılan en üstte; hiç yazışılmamışlarda çevrimiçi olan önde. */
  const kisiler = (DB.kisiler || [])
    .filter(k => !(AUTH.user && k.id === AUTH.user.id))
    .sort((a, b) => {
      const sa = DB.sonMesaj(a.id), sb = DB.sonMesaj(b.id);
      if (sa && sb) return (sb.olusturuldu || '').localeCompare(sa.olusturuldu || '');
      if (sa || sb) return sa ? -1 : 1;
      return (DB.cevrimicimi(b.id) ? 1 : 0) - (DB.cevrimicimi(a.id) ? 1 : 0);
    });

  const ben = AUTH.user && AUTH.user.id;
  const satirlar = kisiler.map(k => {
    const son = DB.sonMesaj(k.id);
    return sohbetSatiri({
      id: k.id,
      ad: k.ad || 'İsimsiz',
      alt: son
        ? (son.gonderen === ben ? 'Sen: ' : '') + son.metin
        : (DB.cevrimicimi(k.id) ? 'Şu an aktif.' : 'Henüz mesaj yok'),
      avatar: basHarf(k.ad || '?'),
      foto: k.foto,
      acik: DB.cevrimicimi(k.id),
      saat: son ? pzZamanKisa(son.olusturuldu) : '',
      sayi: DB.okunmamis(k.id),
    });
  }).join('') + sohbetSatiri({
    id: 'studio',
    ad: 'Nizam Studio',
    alt: 'Duyurular burada görünecek',
    avatar: 'NS',
    marka: true,
  });

  return `
    <div class="pj-tepe">
      <div class="pj-tepe-yz">
        <h1>Sohbet</h1>
        <p>Ekip ile iletişimde kal.</p>
      </div>
    </div>

    <div class="pj-araclar ekip">
      <label class="pj-ara">
        <svg viewBox="0 0 24 24"><circle cx="11" cy="11" r="6.4"></circle><path d="M15.8 15.8L20.5 20.5"></path></svg>
        <input id="sh-ara" type="search" autocomplete="off" placeholder="Kişi ara…"
          value="${esc(SOHBET_ARAMA)}">
      </label>
    </div>

    <div class="sh2-liste">${satirlar}
      <div class="pj-bos-arama">Aramana uyan kişi yok.</div>
    </div>`;
}

/* ---------- Yazışma ekranı ----------
   Tasarım hazır, mesajlaşmanın kendisi henüz yazılmadı: gövde boş
   duruyor, yazıp göndermek şimdilik haber veriyor. Mesaj kaydı geldiğinde
   yalnız .yz-govde'nin içi dolacak. */
/* Mesaj saati ve gün ayracı. */
function mesajSaat(iso) {
  const t = new Date(iso);
  const p = n => String(n).padStart(2, '0');
  return p(t.getHours()) + ':' + p(t.getMinutes());
}

function mesajGunu(iso) {
  const t = new Date(iso);
  const bugun = new Date();
  const dun = new Date(bugun.getTime() - 86400000);
  const ayni = (a, b) => a.toDateString() === b.toDateString();
  if (ayni(t, bugun)) return 'Bugün';
  if (ayni(t, dun))   return 'Dün';
  const aylar = ['Ocak','Şubat','Mart','Nisan','Mayıs','Haziran','Temmuz',
                 'Ağustos','Eylül','Ekim','Kasım','Aralık'];
  return `${t.getDate()} ${aylar[t.getMonth()]}${
    t.getFullYear() === bugun.getFullYear() ? '' : ' ' + t.getFullYear()}`;
}

/* Çift tik: gönderdiğim mesaj karşı tarafça okunduysa dolu. */
const CIFT_TIK = '<svg viewBox="0 0 24 24" class="yz-tik"><path d="M1.5 12.5l3.5 3.5 7-7.5"></path>'
  + '<path d="M8 12.5l3.5 3.5 10-10.5"></path></svg>';

function mesajBalonu(m, benimMi, foto, harf) {
  return `
    <div class="yz-sat ${benimMi ? 'benim' : ''}">
      ${benimMi ? '' : `<span class="yz-av ${foto ? 'resimli' : ''}"
        ${foto ? `style="background-image:url('${esc(foto)}')"` : ''}><b>${esc(harf)}</b></span>`}
      <div class="yz-balon">
        <p>${esc(m.metin)}</p>
        <span class="yz-saat">${mesajSaat(m.olusturuldu)}${benimMi
          ? `<em class="${m.okundu ? 'okundu' : ''}">${CIFT_TIK}</em>` : ''}</span>
      </div>
    </div>`;
}

function yazismaGovdesi(kisiId) {
  const k = (DB.kisilerHepsi || []).find(x => x.id === kisiId);
  const ben = AUTH.user && AUTH.user.id;
  const liste = DB.yazisma(kisiId);

  if (!liste.length) {
    return `<div class="yz-bos">
      <span>${svg(ICON.kisi, 26)}</span>
      <b>Henüz mesaj yok</b>
      <i>İlk mesajı sen yaz.</i>
    </div>`;
  }

  let gun = '';
  return liste.map(m => {
    const g = mesajGunu(m.olusturuldu);
    const ayrac = g === gun ? '' : `<div class="yz-gun"><span>${esc(g)}</span></div>`;
    gun = g;
    return ayrac + mesajBalonu(m, m.gonderen === ben,
      k && k.foto, basHarf((k && k.ad) || '?'));
  }).join('');
}

/* Gönderme: kutuyu hemen boşaltıp mesajı ekrana koyuyoruz, sunucu
   cevabını beklemiyoruz — yazışma akıcı hissetsin. Hata olursa yazı geri
   kutuya dönüyor. */
async function mesajYolla(kisiId) {
  const kutu = $('#yz-metin');
  if (!kutu) return;
  const metin = kutu.value.trim();
  if (!metin) return;

  kutu.value = '';
  kutu.focus();
  try {
    await DB.mesajGonder(kisiId, metin);
    yazismayiTazele(kisiId);
  } catch (h) {
    kutu.value = metin;
    toast(h.message, 'hata');
  }
}

/* Yalnız mesaj gövdesini yeniden çiziyoruz: bütün ekranı çizmek yazma
   kutusundaki imleci ve klavyeyi kapatıyor. */
function yazismayiTazele(kisiId) {
  const govde = $('#yz-govde');
  if (!govde) return;
  govde.innerHTML = yazismaGovdesi(kisiId);
  govde.scrollTop = govde.scrollHeight;
}

function yazismaEkrani(kisiId) {
  const k = (DB.kisilerHepsi || []).find(x => x.id === kisiId);
  const marka = kisiId === 'studio';
  if (!k && !marka) {
    return `<div class="card">${empty(ICON.kisi, 'Kişi bulunamadı',
      'Sohbet listesine dön.', 'Sohbet', 'sohbete')}</div>`;
  }

  const ad   = marka ? 'Nizam Studio' : (k.ad || 'İsimsiz');
  const acik = marka ? false : DB.cevrimicimi(k.id);
  const son  = marka ? '' : ekipSonGorulme(k);
  const alt  = marka ? 'Duyurular' : (acik ? 'Çevrimiçi' : (son ? esc(pzZaman(son)) : 'Çevrimdışı'));

  const ikon = (ad2, yol) => `<button class="yz-ik" type="button" data-eylem="sohbet-yakinda"
    aria-label="${ad2}"><svg viewBox="0 0 24 24">${yol}</svg></button>`;

  return `
    <div class="yz">
      <div class="yz-ust">
        <button class="yz-geri" type="button" data-eylem="sohbete" aria-label="Geri">
          <svg viewBox="0 0 24 24"><path d="M15 6l-6 6 6 6"></path></svg>
        </button>
        <span class="yz-foto ${!marka && k.foto ? 'resimli' : ''} ${marka ? 'marka' : ''}"
              ${!marka && k.foto ? `style="background-image:url('${esc(k.foto)}')"` : ''}>
          ${marka ? '<img src="logo.png" alt="">' : `<b>${esc(basHarf(ad))}</b>`}
        </span>
        <span class="yz-kim">
          <b>${esc(ad)}</b>
          <i class="${acik ? 'acik' : ''}">${acik ? '<u></u>' : ''}${alt}</i>
        </span>
        ${ikon('Sesli ara', '<path d="M6.5 3.5h3l1.5 4-2 1.5a12 12 0 0 0 6 6l1.5-2 4 1.5v3a2 2 0 0 1-2.2 2C11.8 22.2 1.8 12.2 1.3 5.7A2 2 0 0 1 3.3 3.5z"></path>')}
        ${ikon('Görüntülü ara', '<rect x="2.5" y="6" width="13" height="12" rx="3"></rect><path d="M15.5 11l6-3.5v9l-6-3.5z"></path>')}
        ${ikon('Seçenekler', '<circle cx="12" cy="5" r="1.4"></circle><circle cx="12" cy="12" r="1.4"></circle><circle cx="12" cy="19" r="1.4"></circle>')}
      </div>

      <div class="yz-govde" id="yz-govde">${marka
        ? `<div class="yz-bos"><span>${svg(ICON.bayrak, 26)}</span>
             <b>Duyuru yok</b><i>Studio duyuruları burada görünecek.</i></div>`
        : yazismaGovdesi(kisiId)}</div>

      <div class="yz-alt ${marka ? 'kapali' : ''}">
        <button class="yz-ek" type="button" data-eylem="sohbet-yakinda" aria-label="Dosya ekle">
          <svg viewBox="0 0 24 24"><path d="M20 11.5l-8.2 8.2a4.6 4.6 0 0 1-6.5-6.5l8.4-8.4a3 3 0 0 1 4.3 4.3l-8.3 8.3a1.5 1.5 0 0 1-2.1-2.1l7.6-7.6"></path></svg>
        </button>
        <label class="yz-kutu">
          <input type="text" id="yz-metin" placeholder="Mesaj yaz…" autocomplete="off">
          <button class="yz-emoji" type="button" data-eylem="sohbet-yakinda" aria-label="Emoji">
            <svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"></circle><path d="M9 10v.01M15 10v.01M8.5 14.5a4.5 4.5 0 0 0 7 0"></path></svg>
          </button>
        </label>
        <button class="yz-gonder" type="button" data-eylem="mesaj-yolla"
                data-id="${esc(kisiId)}" aria-label="Gönder">
          <svg viewBox="0 0 24 24"><path d="M21 3L3 10.5l7 3 3 7z"></path><path d="M10 13.5L21 3"></path></svg>
        </button>
      </div>
    </div>`;
}

function standartAltBaslik() {
  if (YUKLENIYOR) return 'yükleniyor…';
  const n = DB.standartlar.length;
  return n ? `${n} tarif · prompta kendiliğinden eklenir` : 'Ortak bileşen kütüphanesi';
}

function gorevlerAltBaslik() {
  if (YUKLENIYOR || !AUTH.user) return 'Açık işlerin';
  const benim = DB.gorevleri({ kisi: AUTH.user.id });
  const acik  = benim.filter(g => g.durum !== 'tamamlandi').length;
  const acil  = benim.filter(g => g.oncelik === 'acil' && g.durum !== 'tamamlandi').length;
  if (!benim.length) return 'Açık işlerin';
  return `${acik} açık iş` + (acil ? ` · ${acil} acil` : '');
}

function projelerAltBaslik() {
  if (YUKLENIYOR) return 'yükleniyor…';
  const n = DB.projeler.filter(p => !cekirdekMi(p)).length;
  return n ? `${n} aktif proje` : 'Müşteri projeleri';
}

/* ==========================================================================
   VERİ
   ========================================================================== */

async function veriTazele() {
  YUKLENIYOR = true;
  render();
  try {
    await DB.yukle();
  } catch (e) {
    /* hata DB.hata içinde tutuluyor, ekranda gösterilecek */
  }
  YUKLENIYOR = false;
  sayaclariYaz();
  render();
}

/* ==========================================================================
   SİHİRBAZ — Yeni Proje
   ========================================================================== */

const SIHIRBAZ = {
  adim: 1,
  /* duzenle+projeId: mevcut projenin Firma bilgileri durağını düzenlerken
     dolu. O zaman proje kurulmuyor, güncelleniyor. */
  duzenle: false,
  projeId: null,
  firma: '',
  sektor: '',
  renk: 'yesil',
  /* Logo ve işletme görseli bellekte tutuluyor; proje kurulduktan sonra
     yükleniyor, çünkü dosya adı projenin kimliği. */
  logo: null,
  logoOnizleme: '',
  gorsel: null,
  gorselOnizleme: '',
  yetkili: '',
  telefon: '',
  eposta: '',
  platform: 'ikisi',
  veri: 'sifirdan',
  dil: 'tr',
  para: 'TRY',
  baslangic: '',
  teslim: '',
  moduller: [],
  kaydediyor: false,
};

/* Sihirbaz üç adımda tam olarak Firma bilgileri durağının sorduklarını
   soruyor: proje kurulurken ayrıca "proje adı" sormuyoruz — firma adı zaten
   bu üçünün ilk sorusu. Sonunda proje bu bilgilerle kuruluyor, Firma
   bilgileri durağı ekstra bir şey yapmadan tamamlanmış oluyor. */

/* "+" ile önce ne kuracağını soruyoruz: gerçek proje mi, test güncelleme
   mi. İkisi de şu an birebir aynı akıştan geçiyor — tek fark, projenin
   üstüne yapıştırılan etiket. Test'i gerçeğin yerine geçirme mekanizması
   henüz yok, o ayrı bir iş; burada sadece işaretleniyor. */
function sihirbaziAc() {
  modalHepsiniKapat();
  modalAc(`
    ${modalBaslik(ICON.katman, 'Nereye kuralım?', 'Bu projeyi ne için açıyorsun?')}
    <div class="secim">
      <div class="satir sec-satir" data-sb0-tur="gercek" role="button" tabindex="0">
        <span class="sec-yazi"><b>Gerçek proje</b><i>Müşteriye teslim edilecek asıl proje</i></span>
      </div>
      <div class="satir sec-satir" data-sb0-tur="test" role="button" tabindex="0">
        <span class="sec-yazi"><b>Test güncelleme</b>
          <i>Denemeler için — şimdilik gerçek projeyle birebir aynı kurulur</i></span>
      </div>
    </div>
    <div class="modal-alt">
      <button class="btn btn-ghost" data-sb0="kapat" type="button">Vazgeç</button>
    </div>`, kutu => {
    $('[data-sb0="kapat"]', kutu).addEventListener('click', modalKapat);
    kutu.addEventListener('click', ev => {
      const t = ev.target.closest('[data-sb0-tur]');
      if (!t) return;
      modalKapat();
      sektorSecAc(t.dataset.sb0Tur);
    });
  });
}

/* İkinci soru: müşteri ne iş yapıyor. Sektör burada soruluyor çünkü bir
   sonraki adımda hazır template'ler buna göre süzülüyor — ayrıca sıfırdan
   gidilirse sihirbazın Firma bilgileri adımı da dolu başlıyor. */
function sektorSecAc(tur) {
  modalHepsiniKapat();
  const liste = DB.sektorler || [];

  modalAc(`
    ${modalBaslik(ICON.dukkan, 'Müşteri ne iş yapıyor?',
      'Sektöre göre hazır template\'ler süzülecek.')}
    <div class="secim">
      ${liste.map(x => `
        <div class="satir sec-satir" data-sks="${esc(x.id)}" role="button" tabindex="0">
          <span class="sec-yazi"><b>${esc(x.ad)}</b></span>
        </div>`).join('')}
      <div class="satir sec-satir" data-sks="" role="button" tabindex="0">
        <span class="sec-yazi"><b>Sektör seçmeden devam et</b>
          <i>Sonradan Firma bilgileri adımından da yazabilirsin</i></span>
      </div>
    </div>
    <div class="modal-alt">
      <button class="btn btn-ghost" data-sks-kapat type="button">Vazgeç</button>
    </div>`, kutu => {
    $('[data-sks-kapat]', kutu).addEventListener('click', modalKapat);
    kutu.addEventListener('click', ev => {
      const t = ev.target.closest('[data-sks]');
      if (!t) return;
      modalKapat();
      baslangicTuruSec(tur, t.dataset.sks || '');
    });
  });
}

/* Üçüncü soru: sıfırdan mı kuruluyor, yoksa bitmiş bir projenin birebir
   kopyası mı? Kopya şimdilik yalnız ham veriyi taşıyor — firma bilgileri,
   depo, Supabase gibi kişiye özel alanların değiştirilmesi ayrı bir iş,
   henüz burada değil (bkz. `DB.projeKopyala` yorumu). */
function baslangicTuruSec(tur, sektorId) {
  modalHepsiniKapat();
  modalAc(`
    ${modalBaslik(ICON.katman, 'Nasıl başlayalım?',
      'Sıfırdan mı kuracağız, var olan bir projeyi mi kopyalayacağız, yoksa bir template\'ten mi başlayacağız?')}
    <div class="secim">
      <div class="satir sec-satir" data-bt="sifirdan" role="button" tabindex="0">
        <span class="sec-yazi"><b>Sıfırdan Proje</b><i>Firma bilgileriyle baştan kur</i></span>
      </div>
      <div class="satir sec-satir" data-bt="kopya" role="button" tabindex="0">
        <span class="sec-yazi"><b>Kopya Proje</b><i>Bitmiş bir projenin birebir aynısıyla başla</i></span>
      </div>
      <div class="satir sec-satir" data-bt="template" role="button" tabindex="0">
        <span class="sec-yazi"><b>Bir Template'ten Başla</b><i>Temizlenmiş, hazır bir tabandan hızlıca kur</i></span>
      </div>
    </div>
    <div class="modal-alt">
      <button class="btn btn-ghost" data-bt="kapat" type="button">Vazgeç</button>
    </div>`, kutu => {
    $('[data-bt="kapat"]', kutu).addEventListener('click', modalKapat);
    kutu.addEventListener('click', ev => {
      const t = ev.target.closest('[data-bt]');
      if (!t || t.dataset.bt === 'kapat') return;
      modalKapat();
      if (t.dataset.bt === 'kopya')    return kopyaKaynagiSec(tur);
      if (t.dataset.bt === 'template') return cekirdekKaynakSec(tur, sektorId);
      sihirbaziBaslat(tur, sektorId);
    });
  });
}



/* Kurulmaya hazır template'ler — istenirse tek bir sektörünkiler. */
function hazirTemplateler(sektorId) {
  return (DB.projeler || []).filter(p =>
    !p.arsiv && cekirdekMi(p) && (p.palet || {}).cekirdekTemizlendi
    && (!sektorId || templateSektorIdleri(p).includes(sektorId)));
}

/* Template'ten başlatma. Seçilen sektörün template'leri listeleniyor;
   hangi yol haritasının geleceği template'in paketinden okunuyor. */
function cekirdekKaynakSec(tur, sektorId) {
  modalHepsiniKapat();
  const liste = hazirTemplateler(sektorId);
  if (!liste.length) {
    toast('Bu sektörde hazır template yok.', 'uyari');
    return;
  }

  modalAc(`
    ${modalBaslik(ICON.katman, 'Hangi template?',
      'Yeni proje bu template\'in birebir kopyasıyla kurulacak.')}
    <div class="secim">
      ${liste.map(p => {
        const paket = templatePaketi(p);
        return `
        <div class="satir sec-satir" data-tp="${esc(p.id)}" role="button" tabindex="0">
          <span class="sec-yazi"><b>${esc(projeAdi(p))}</b>
            <i>${esc(paket ? paket.ad : templatePaketAnahtari(p))}</i></span>
        </div>`;
      }).join('')}
    </div>
    <div class="modal-alt">
      <button class="btn btn-ghost" data-bt="kapat" type="button">Vazgeç</button>
    </div>`, kutu => {
    $('[data-bt="kapat"]', kutu).addEventListener('click', modalKapat);
    kutu.addEventListener('click', ev => {
      const t = ev.target.closest('[data-tp]');
      if (!t) return;
      modalKapat();
      const p = DB.proje(t.dataset.tp);
      templateOnaySor(t.dataset.tp, tur, templatePaketAnahtari(p));
    });
  }, 'genis');
}

/* Kopya kaynağı seçimi — arşivlenmemiş tüm projeler listelenir. Seçilince
   proje doğrudan kopyalanıp yol haritasına düşülüyor; Firma bilgileri
   sihirbazından geçmiyor çünkü zaten dolu geliyor. */
function kopyaKaynagiSec(tur) {
  modalHepsiniKapat();
  const liste = DB.projeler.filter(p => !p.arsiv && !cekirdekMi(p));
  if (!liste.length) { toast('Kopyalanacak proje yok.', 'uyari'); return; }

  modalAc(`
    ${modalBaslik(ICON.kopya, 'Hangi projeden kopyalayalım?',
      'Yeni proje bunun birebir aynısıyla kurulacak.')}
    <div class="secim">
      ${liste.map(p => `
        <div class="satir sec-satir" data-proje="${p.id}" role="button" tabindex="0">
          <span class="sec-yazi"><b>${esc(p.firma)}</b><i>${esc(p.sektor || 'Sektör girilmedi')}</i></span>
        </div>`).join('')}
    </div>
    <div class="modal-alt">
      <button class="btn btn-ghost" data-bt="kapat" type="button">Vazgeç</button>
    </div>`, kutu => {
    $('[data-bt="kapat"]', kutu).addEventListener('click', modalKapat);
    kutu.addEventListener('click', ev => {
      const t = ev.target.closest('[data-proje]');
      if (!t) return;
      modalKapat();
      sablonSec(t.dataset.proje, tur);
    });
  }, 'genis');
}

/* Kaynak seçildikten sonra: bu kopya bir şablon dönüşümü mü? Muhasebe
   şablonu seçilirse proje "Kurulum ve yapı" ve "Beta ve geliştirme"
   duraklarını değil, o iki durağın yerine geçen "Temel tanımlar" ve
   "Değişim" sihirbazını gösterir — bkz. DURAKLAR.yapi/beta ve
   projeDuraklari(). Firma bilgisi de bilerek boş kopyalanır (DB.projeKopyala). */
function sablonSec(kaynakId, tur) {
  modalHepsiniKapat();
  /* Varsayılan paket burada çıkmaz: o, sıfırdan kurulan projelerin paketi. */
  const paketler = (DB.paketler || []).filter(k => paketinAkisi(k) !== 'ozel');

  modalAc(`
    ${modalBaslik(ICON.paket, 'Bu bir paket kurulumu mu?',
      'Paket seçilirse firma bilgileri boş gelir ve o paketin yol haritası açılır.')}
    <div class="secim">
      ${paketler.map(k => `
        <div class="satir sec-satir" data-ss="${esc(k.anahtar)}" role="button" tabindex="0">
          <span class="sec-yazi"><b>${esc(k.ad)}</b>
            <i>${esc(k.aciklama || paketAkisAdi(paketinAkisi(k)))}</i></span>
        </div>`).join('')}
      <div class="satir sec-satir" data-ss="hayir" role="button" tabindex="0">
        <span class="sec-yazi"><b>Hayır, normal kopya</b><i>Bugüne kadar olduğu gibi</i></span>
      </div>
    </div>
    <div class="modal-alt">
      <button class="btn btn-ghost" data-ss="kapat" type="button">Vazgeç</button>
    </div>`, kutu => {
    $('[data-ss="kapat"]', kutu).addEventListener('click', modalKapat);
    kutu.addEventListener('click', ev => {
      const t = ev.target.closest('[data-ss]');
      if (!t || t.dataset.ss === 'kapat') return;
      modalKapat();
      templateOnaySor(kaynakId, tur, t.dataset.ss === 'hayir' ? null : t.dataset.ss);
    });
  });
}

/* Kaynak seçildikten hemen sonra: GitHub'da bu deponun "Template
   repository" işaretli olup olmadığını Studio bilemez (API'ye bağlı
   değiliz) — o yüzden doğrudan soruyoruz. Kapalıysa Settings sayfasını
   açıyoruz, pencere açık kalıyor; işaretleyip döndüğünde "Açık, devam et"
   diyor. Kaynağın hiç deposu yoksa soru anlamsız, direkt kopyalıyoruz. */
function templateOnaySor(kaynakId, tur, sablon) {
  const kaynak = DB.proje(kaynakId);
  const slug = kaynak ? depoSlug(kaynak.repo) : '';
  if (!slug) return templateSonrakiAdim(kaynakId, tur, sablon);

  modalHepsiniKapat();
  modalAc(`
    ${modalBaslik(ICON.dal, 'GitHub deposu şablon mu?',
      `${esc(slug)} deposunda "Template repository" kapalıysa GitHub adımında kopyalama çalışmaz.`)}
    <div class="secim">
      <div class="satir sec-satir" data-tp="ac" role="button" tabindex="0">
        <span class="sec-yazi"><b>Kapalı, önce açayım</b><i>GitHub'da o deponun Ayarlar sayfasını aç</i></span>
      </div>
      <div class="satir sec-satir" data-tp="devam" role="button" tabindex="0">
        <span class="sec-yazi"><b>Açık, devam et</b><i>Zaten işaretlemiştim</i></span>
      </div>
    </div>
    <div class="modal-alt">
      <button class="btn btn-ghost" data-tp="kapat" type="button">Vazgeç</button>
    </div>`, kutu => {
    $('[data-tp="kapat"]', kutu).addEventListener('click', modalKapat);
    kutu.addEventListener('click', ev => {
      const t = ev.target.closest('[data-tp]');
      if (!t || t.dataset.tp === 'kapat') return;
      if (t.dataset.tp === 'ac') {
        TEMPLATE_BEKLIYOR[kaynakId] = { tur, sablon };
        window.open('https://github.com/' + slug + '/settings', '_blank', 'noopener');
        modalKapat();
        return;
      }
      modalKapat();
      templateSonrakiAdim(kaynakId, tur, sablon);
    });
  });
}

/* Ayarlar sekmesinden dönünce: işaretlemeyi gerçekten yaptı mı, yoksa
   sekmeye göz atıp mı döndü, Studio bilemez — kopyalamayı otomatik
   başlatmak yerine aynı soruyu bir daha soruyor. */
function templateDonusOnaySor(kaynakId, tur, sablon) {
  const kaynak = DB.proje(kaynakId);
  if (!kaynak) return;

  modalHepsiniKapat();
  modalAc(`
    ${modalBaslik(ICON.dal, 'İşaretlemeyi yaptın mı?',
      '"Template repository" kutusunu işaretlediysen kopyalama başlasın.')}
    <div class="secim">
      <div class="satir sec-satir" data-tp2="evet" role="button" tabindex="0">
        <span class="sec-yazi"><b>Evet, işaretledim</b><i>Kopyalamayı şimdi başlat</i></span>
      </div>
      <div class="satir sec-satir" data-tp2="hayir" role="button" tabindex="0">
        <span class="sec-yazi"><b>Henüz yapmadım</b><i>Kopyalamayı başlatma</i></span>
      </div>
    </div>
    <div class="modal-alt">
      <button class="btn btn-ghost" data-tp2="kapat" type="button">Vazgeç</button>
    </div>`, kutu => {
    $('[data-tp2="kapat"]', kutu).addEventListener('click', modalKapat);
    kutu.addEventListener('click', ev => {
      const t = ev.target.closest('[data-tp2]');
      if (!t || t.dataset.tp2 !== 'evet') return modalKapat();
      modalKapat();
      templateSonrakiAdim(kaynakId, tur, sablon);
    });
  });
}

/* GitHub "Template repository" onayından sonra müşteri kopyası kuruluyor.
   Template oluşturma artık kendi sihirbazından geçiyor (templateSihirbaziAc). */
function templateSonrakiAdim(kaynakId, tur, sablon) {
  return projeKopyalaVeAc(kaynakId, tur, sablon);
}

async function projeKopyalaVeAc(kaynakId, tur, sablon) {
  try {
    const id = await DB.projeKopyala(kaynakId, { tur, sablon });
    sayaclariYaz();
    toast('Proje kopyalandı.', 'basari');
    location.hash = projeAdresi(id);
    render();
  } catch (h) {
    toast(h.message, 'hata');
  }
}

/* Template oluşturma: proje kopyalanır ama normal proje detayına değil,
   Templateler'e ve oradaki 2 adımlık kurulum sihirbazına (GitHub + Claude
   temizleme) düşülür. */
/* ==========================================================================
   Yeni Template Oluştur — yedi adım
   1 Kaynak proje · 2 Ad ve açıklama · 3 Paket ve sektörler · 4 Kapak
   5 Depo · 6 Kurulum SQL'i · 7 Claude ile temizlik

   Template kaydı 4. adımdan sonra gerçekten oluşuyor: ilk dört adım bilgi
   topluyor, son üç adım o kaydın üstünde çalışıyor (depo bağlama ve SQL
   yazma proje kimliği istiyor).
   ========================================================================== */

const TS = {
  adim: 1, kaynakId: '', ad: '', aciklama: '', paket: '',
  sektorler: [], kapak: '', projeId: '', kuruluyor: false,
};

const TS_ADIMLAR = [
  { ad: 'Yeni Template Oluştur', alt: 'Hangi proje üzerinden yeni template oluşturmak istiyorsun?' },
  { ad: 'Ad ve açıklama',        alt: 'Template listesinde nasıl görünecek?' },
  { ad: 'Paket ve sektörler',    alt: 'Bu template hangi yol haritasını getirecek, hangi sektörlerde çıkacak?' },
  { ad: 'Kapak görseli',         alt: 'Listede kartın solunda çıkacak görsel.' },
  { ad: 'Depo',                  alt: 'Template\'in GitHub deposu — müşteri kopyaları buradan üretiliyor.' },
  { ad: 'Kurulum SQL\'i',        alt: 'Müşteri projesi kurulurken Supabase\'e yapıştırılacak SQL.' },
  { ad: 'Claude ile temizlik',   alt: 'Firma izini kaldırıp template\'i yayına hazır hâle getir.' },
];

function templateSihirbaziAc() {
  modalHepsiniKapat();
  const liste = DB.projeler.filter(p => !p.arsiv && !cekirdekMi(p));
  if (!liste.length) { toast('Template yapılacak proje yok.', 'uyari'); return; }

  Object.assign(TS, {
    adim: 1, kaynakId: '', ad: '', aciklama: '', paket: '',
    sektorler: [], kapak: KAPAK_GORSELLERI[0].anahtar, projeId: '', kuruluyor: false,
  });
  const varsayilanDisi = (DB.paketler || []).filter(k => paketinAkisi(k) !== 'ozel');
  TS.paket = varsayilanDisi.length ? varsayilanDisi[0].anahtar : '';

  const el = document.createElement('div');
  el.id = 'template-sihirbaz';
  el.className = 'sihirbaz';
  document.body.appendChild(el);
  templateSihirbaziCiz();
}

function templateSihirbaziKapat() {
  const el = $('#template-sihirbaz');
  if (!el) return;
  el.classList.remove('acik');
  setTimeout(() => el.remove(), 260);
}

function templateSihirbaziCiz() {
  const el = $('#template-sihirbaz');
  if (!el) return;
  el.innerHTML = templateSihirbaziHtml();
  templateSihirbaziBagla(el);
  requestAnimationFrame(() => el.classList.add('acik'));
}

/* Adım geçilebilir mi — "Devam Et" buna göre sönük duruyor. */
function tsGecilir() {
  if (TS.adim === 1) return !!TS.kaynakId;
  if (TS.adim === 2) return !!TS.ad.trim();
  if (TS.adim === 3) return !!TS.paket;
  return true;
}

function templateSihirbaziHtml() {
  const a = TS_ADIMLAR[TS.adim - 1];
  const oran = Math.round(TS.adim / TS_ADIMLAR.length * 100);
  const son = TS.adim === TS_ADIMLAR.length;

  const govde = [tsAdimKaynak, tsAdimKimlik, tsAdimPaket, tsAdimKapak,
                 tsAdimDepo, tsAdimSql, tsAdimTemizlik][TS.adim - 1]();

  return `
    <div class="sh-tepe">
      <button class="sh-kapat" data-ts="kapat" type="button" aria-label="Kapat">
        ${svg(ICON.kapat, 15)}
      </button>
      <span class="sh-ad">Template</span>
    </div>

    <div class="sh-sayfa">
      <div class="sh-icerik">
        <div class="ts-serit">
          <span class="ts-cubuk"><u style="width:${oran}%"></u></span>
          <em>${TS.adim} / ${TS_ADIMLAR.length}</em>
        </div>
        <h2 class="ts-baslik">${esc(a.ad)}</h2>
        <p class="ts-alt">${esc(a.alt)}</p>
        ${govde}
      </div>

      <div class="sh-dip">
        ${TS.adim > 1 ? '<button class="btn btn-ghost" data-ts="geri" type="button">← Geri</button>' : ''}
        <button class="btn btn-primary ts-ileri ${tsGecilir() ? '' : 'pasif'}"
                data-ts="${son ? 'bitir' : 'ileri'}" type="button">
          <span>${son ? 'Bitir ✓' : 'Devam Et →'}</span>
        </button>
      </div>
    </div>`;
}

/* 1 · Kaynak proje */
function tsAdimKaynak() {
  const liste = DB.projeler.filter(p => !p.arsiv && !cekirdekMi(p));
  return `
    <label class="pj-ara ts-ara">
      <svg viewBox="0 0 24 24"><circle cx="11" cy="11" r="6.4"></circle><path d="M15.8 15.8L20.5 20.5"></path></svg>
      <input id="ts-ara" type="search" autocomplete="off" placeholder="Proje ara…">
    </label>
    <div class="ts-liste" id="ts-projeler">
      ${liste.map(p => {
        const adres = DB.logoAdres[p.id];
        const son = pzSonDokunus(p.id);
        return `
        <button class="ts-sec ${TS.kaynakId === p.id ? 'sec' : ''}" type="button"
                data-ts-proje="${p.id}"
                data-ara="${esc((p.firma + ' ' + (modulAdi(p) || '')).toLocaleLowerCase('tr'))}">
          <span class="ts-logo ${adres ? 'yukleniyor' : ''}"
                ${adres ? `data-logo="${esc(adres)}"` : ''}
                style="${renkDegiskenleri(p.renk)}">
            ${adres ? '<span class="donen"></span>' : `<b>${esc(basHarf(p.firma))}</b>`}
          </span>
          <span class="ts-sec-yz">
            <b>${esc(p.firma)}</b>
            <i>${esc(modulAdi(p) || 'Ürün adı yok')}</i>
            <em>Son güncelleme: ${son ? pjTarih(son) : '—'}</em>
          </span>
          <u class="ts-radyo"></u>
        </button>`;
      }).join('')}
      <div class="pj-bos-arama">Aramana uyan proje yok.</div>
    </div>`;
}

/* 2 · Ad ve açıklama */
function tsAdimKimlik() {
  return `
    <label class="pd-alan">
      <span class="pd-et">Template Adı</span>
      <input class="pd-giris" type="text" id="ts-ad" value="${esc(TS.ad)}"
             placeholder="Örn. Muhasebe Programı" maxlength="60" autocomplete="off">
    </label>

    <label class="pd-alan">
      <span class="pd-et">Açıklama</span>
      <span class="pd-kutu">
        <textarea class="pd-giris" id="ts-aciklama" rows="4" maxlength="300"
          placeholder="Bu template ne işe yarar?">${esc(TS.aciklama)}</textarea>
        <em class="pd-sayac" data-sayac="ts-aciklama" data-sinir="300">${TS.aciklama.length}/300</em>
      </span>
    </label>`;
}

/* 3 · Paket ve sektörler */
function tsAdimPaket() {
  const paketler = (DB.paketler || []).filter(k => paketinAkisi(k) !== 'ozel');
  const sektorler = DB.sektorler || [];
  return `
    <div class="pd-alan">
      <span class="pd-et">Paket Seç</span>
      ${paketler.length ? `<div class="rd-izgara">
        ${paketler.map(k => `
          <button class="rd ${TS.paket === k.anahtar ? 'sec' : ''}" type="button"
                  data-ts-paket="${esc(k.anahtar)}">
            <u class="rd-nokta"></u><span>${esc(k.ad)}</span>
          </button>`).join('')}
      </div>` : '<i class="pd-ipucu">Varsayılan olmayan bir paket yok — önce Paketler\'den ekle.</i>'}
    </div>

    <div class="pd-alan">
      <span class="pd-et">Sektör Seç <em class="pd-sag">Çoklu seçim</em></span>
      ${sektorler.length ? `<div class="sb-izgara">
        ${sektorler.map(x => `
          <button class="sb ${TS.sektorler.includes(x.id) ? 'sec' : ''}" type="button"
                  data-ts-sektor="${esc(x.id)}"><span>${esc(x.ad)}</span></button>`).join('')}
      </div>` : '<i class="pd-ipucu">Önce Kütüphane > Sektörler\'den sektör ekle.</i>'}
      <i class="pd-ipucu">Sektör seçmezsen bu template yeni proje akışında
      hiçbir sektörün altında çıkmaz. Sonradan da seçebilirsin.</i>
    </div>`;
}

/* 4 · Kapak görseli */
function tsAdimKapak() {
  return `
    <div class="kp-serit">
      ${KAPAK_GORSELLERI.map(g => `
        <button class="kp ${TS.kapak === g.anahtar ? 'sec' : ''}" type="button"
                data-ts-kapak="${esc(g.anahtar)}" aria-label="${esc(g.ad)}">
          <img src="${esc(g.dosya)}" alt="" loading="lazy">
          <u class="kp-tik">${svg(ICON.tik, 12)}</u>
        </button>`).join('')}
    </div>
    <i class="pd-ipucu">Arka plan rengi kendiliğinden veriliyor; her template
    bir öncekinden farklı renk alıyor.</i>`;
}

/* 5 · Depo — template kaydı burada hazır, bileşen normal projeyle aynı. */
function tsAdimDepo() {
  const p = DB.proje(TS.projeId);
  if (!p) return '<i class="pd-ipucu">Template henüz oluşturulmadı.</i>';
  return baglantiAdimGithub(p);
}

/* 6 · Kurulum SQL'i */
function tsAdimSql() {
  const p = DB.proje(TS.projeId);
  const cek = ((p || {}).palet || {}).cekirdek || {};
  const kayitli = [1, 2, 3].map(no => !!(cek.sqlParca || {})[no]);
  return `
    <div class="sq-liste">
      ${[1, 2, 3].map(no => `
        <label class="sq ${kayitli[no - 1] ? 'sec' : ''}">
          <span class="sq-et">
            <b>Parça ${no}</b>
            <u class="sq-tik">${svg(ICON.tik, 11)}<i>kayıtlı</i></u>
          </span>
          <textarea class="sq-alan" id="ts-sql-${no}" rows="3" spellcheck="false"
            placeholder="${no}. parçayı buraya yapıştır…"></textarea>
        </label>`).join('')}
    </div>
    <i class="pd-ipucu">Yapıştırınca kendiliğinden kaydedilir. SQL zorunlu
    değil — veritabanı gerekmiyorsa boş bırakabilirsin.</i>`;
}

/* 7 · Claude ile temizlik */
function tsAdimTemizlik() {
  const p = DB.proje(TS.projeId);
  if (!p) return '<i class="pd-ipucu">Template henüz oluşturulmadı.</i>';
  const pl = p.palet || {};
  const hazir = !!pl.cekirdekTemizlendi;

  return `
    <div class="ts-bilgi">${svg(ICON.info, 15)}
      <span>Bu prompt firma izini kaldırır, tasarımı standarda döndürür ve
      Supabase gibi gerçek bağlantıları koparır.</span></div>

    ${p.repo ? `<div class="kur-dug">
        ${promptBaglantisi({ tur: 'cekirdekTemizle', proje: p.id, slug: depoSlug(p.repo),
          hedef: 'claude-yeni', yazi: 'Prompt oluştur ve Claude\'u aç' })}
      </div>` : '<i class="pd-ipucu">Önce Depo adımından bir depo bağlanmalı.</i>'}

    ${hazir
      ? `<div class="kur-deger duz">${svg(ICON.tik, 13)} Temizlendi — template hazır ve kilitli</div>`
      : `<label class="kur-onay" data-ts="temizlendi" role="button" tabindex="0"
                ${p.repo ? '' : 'style="opacity:.5;pointer-events:none"'}>
          <span class="kur-kutu">${svg(ICON.tik, 12)}</span>
          Temizlendi, template olarak kaydet</label>`}`;
}

function templateSihirbaziBagla(el) {
  const ileri = $('.ts-ileri', el);

  const tazele = () => { if (ileri) ileri.classList.toggle('pasif', !tsGecilir()); };

  /* 1 · kaynak seçimi + arama */
  $$('[data-ts-proje]', el).forEach(b => b.addEventListener('click', () => {
    TS.kaynakId = b.dataset.tsProje;
    $$('[data-ts-proje]', el).forEach(o => o.classList.toggle('sec', o === b));
    /* Ad boşsa kaynağın adından öneri: çoğu zaman aynen kullanılıyor. */
    const p = DB.proje(TS.kaynakId);
    if (p && !TS.ad.trim()) TS.ad = (modulAdi(p) || p.firma || '') + ' Template';
    tazele();
  }));
  const ara = $('#ts-ara', el);
  if (ara) ara.addEventListener('input', () => {
    const q = ara.value.trim().toLocaleLowerCase('tr');
    const liste = $('#ts-projeler', el);
    let gorunen = 0;
    $$('.ts-sec', liste).forEach(x => {
      const uyar = !q || (x.dataset.ara || '').indexOf(q) >= 0;
      x.classList.toggle('gizli', !uyar);
      if (uyar) gorunen++;
    });
    liste.classList.toggle('bos', gorunen === 0);
  });

  /* 2 · ad ve açıklama */
  const adAlan = $('#ts-ad', el);
  if (adAlan) adAlan.addEventListener('input', () => { TS.ad = adAlan.value; tazele(); });
  const acAlan = $('#ts-aciklama', el);
  if (acAlan) {
    const sayac = $('[data-sayac="ts-aciklama"]', el);
    acAlan.addEventListener('input', () => {
      TS.aciklama = acAlan.value;
      if (sayac) sayac.textContent = acAlan.value.length + '/300';
    });
  }

  /* 3 · paket ve sektörler */
  $$('[data-ts-paket]', el).forEach(b => b.addEventListener('click', () => {
    TS.paket = b.dataset.tsPaket;
    $$('[data-ts-paket]', el).forEach(o => o.classList.toggle('sec', o === b));
    tazele();
  }));
  $$('[data-ts-sektor]', el).forEach(b => b.addEventListener('click', () => {
    const id = b.dataset.tsSektor;
    const i = TS.sektorler.indexOf(id);
    i === -1 ? TS.sektorler.push(id) : TS.sektorler.splice(i, 1);
    b.classList.toggle('sec', i === -1);
  }));

  /* 4 · kapak */
  $$('[data-ts-kapak]', el).forEach(b => b.addEventListener('click', () => {
    TS.kapak = b.dataset.tsKapak;
    $$('[data-ts-kapak]', el).forEach(o => o.classList.toggle('sec', o === b));
  }));

  /* 6 · SQL parçaları — yapıştırınca kaydediliyor */
  [1, 2, 3].forEach(no => {
    const alan = $('#ts-sql-' + no, el);
    if (!alan) return;
    const kaydet = async () => {
      const metin = alan.value.trim();
      if (!metin || !TS.projeId) return;
      const kutucuk = alan.closest('.sq');
      kutucuk.classList.add('yaziliyor');
      try {
        await DB.sablonSqlParcaYaz(TS.projeId, no, metin);
        alan.value = '';
        kutucuk.classList.remove('yaziliyor');
        kutucuk.classList.add('sec');
        toast(no + '. parça kaydedildi.', 'basari');
      } catch (h) {
        kutucuk.classList.remove('yaziliyor');
        toast(h.message, 'hata');
      }
    };
    alan.addEventListener('paste', () => setTimeout(kaydet, 0));
    alan.addEventListener('change', kaydet);
  });

  /* 7 · temizlendi onayı */
  const onay = $('[data-ts="temizlendi"]', el);
  if (onay) onay.addEventListener('click', async () => {
    const p = DB.proje(TS.projeId);
    if (!p) return;
    if (!await onaySor({
      baslik: 'Template olarak kaydedilsin mi?',
      mesaj: 'Claude temizleme promptunu çalıştırıp kontrol ettiysen onayla — '
           + 'template otomatik kilitlenecek.',
      buton: 'Eminim',
    })) return;
    const pl = p.palet || {};
    try {
      await DB.paletKaydet(p.id, Object.assign({}, pl,
        { cekirdekTemizlendi: true, kilitli: true }));
      templateSihirbaziCiz();
      toast('Template hazır ve kilitlendi.', 'basari');
    } catch (h) { toast(h.message, 'hata'); }
  });

  /* Alt düğmeler */
  $$('[data-ts]', el).forEach(b => {
    const t = b.dataset.ts;
    if (!['kapat', 'geri', 'ileri', 'bitir'].includes(t)) return;
    b.addEventListener('click', async () => {
      if (t === 'kapat' || t === 'bitir') {
        templateSihirbaziKapat();
        render();
        return;
      }
      if (t === 'geri') {
        /* Template kurulduktan sonra kimlik adımlarına dönülmüyor: orası
           artık template'in kendi ayar penceresinin işi. */
        if (TS.projeId && TS.adim <= 5) return;
        TS.adim--;
        return templateSihirbaziCiz();
      }
      if (!tsGecilir()) return;

      /* 4. adımdan çıkarken template gerçekten oluşuyor. */
      if (TS.adim === 4 && !TS.projeId) {
        if (TS.kuruluyor) return;
        TS.kuruluyor = true;
        b.classList.add('pasif');
        try {
          const id = await DB.projeKopyala(TS.kaynakId, {
            tur: 'gercek',
            cekirdek: {
              ad: TS.ad.trim(),
              paket: TS.paket,
              sektorler: TS.sektorler.slice(),
              kapak: TS.kapak,
              aciklama: TS.aciklama.trim() || null,
            },
          });
          TS.projeId = id;
          sayaclariYaz();
        } catch (h) {
          TS.kuruluyor = false;
          b.classList.remove('pasif');
          toast(h.message, 'hata');
          return;
        }
        TS.kuruluyor = false;
      }
      TS.adim++;
      templateSihirbaziCiz();
    });
  });

  requestAnimationFrame(() => logolariGoster());
}

/* ==========================================================================
   Ayarlar > Güvenlik Testi — üç katman:
     A · Dış     — kapılar, dışarıdan kim ne yapabiliyor (anon key)
     B · Evrensel iç — her Supabase projesinde aynı yapısal kurallar (erişim
                  jetonu ister — AŞAMA 2, henüz yok)
     C · Programa özel iç — guvenlik.json'daki saldırı testi (jeton + depo
                  ister — AŞAMA 2, henüz yok)
   Bu sürümde yalnız A ve D (personel yetki haritası) var — ikisi de anon
   key + personel girişiyle, tarayıcıdan, jeton istemeden çalışır.

   SABİT TABLO LİSTESİ YOK: hangi tabloların/fonksiyonların var olduğu
   PostgREST'in kendi OpenAPI belgesinden okunuyor (bkz. guvenlikSemaKesfet)
   — bu yüzden herhangi bir Supabase projesinde çalışır, yalnız muhasebe
   şablonunda değil. Kendi katmanını öğrenme (0.2 adımı) hâlâ muhasebe
   şablonunun katmanlar/kullanicilar tablolarına bakıyor — en iyi çaba
   (best effort): o tablolar yoksa üst katman kontrolü atlanır, testler
   normal çalışır.

   D bölümü HÜKÜM VERMEZ (bkz. guvenlikPersonelHaritasi) — okur/ekler/
   değiştirir/siler durumunu gösterir, "AÇIK/KAPALI" demez; bir programda
   serbest olan başka programda yasak olabilir, motor bunu bilemez.

   Test hesabının şifresi tarayıcıda olur (A ve D testleri zaten o hesapla
   giriş yapıyor, sıradan bir giriş formundan farkı yok) — yalnız günlüğe
   ve sonuç ekranına yazılmaz, saklanmaz. Gerçek tehlike Supabase erişim
   jetonudur (bütün projelerde SQL çalıştırır); o da AŞAMA 2'de tarayıcıya
   hiç inmeyecek, tek bir Edge Function'ın gizli değişkeni olarak duracak. */
const GUVENLIK_SAYFA = { url: '', anon: '', eposta: '', calisiyor: false,
  sonuc: null, harita: null, ustKatmanUyarisi: false, kalintilar: [], tabloKaynagi: '', depo: '' };

function guvenlikUuid() {
  if (window.crypto && crypto.randomUUID) return crypto.randomUUID();
  /* Eski tarayıcı yedeği — yalnız test verisini etiketlemek için, kriptografik
     güç gerekmiyor. */
  return 'ns-' + Date.now().toString(16) + '-' + Math.random().toString(16).slice(2);
}

/* ==========================================================================
   AŞAMA 2 · B (evrensel iç), C (programa özel iç) ve Sunucu işlevi
   saldırıları — B ve C Supabase erişim jetonu ister. O jeton Studio'nun
   kendi Supabase'inde tek bir Edge Function'ın (guvenlik-sql, bkz.
   GUVENLIK_SQL_FONKSIYON) gizli değişkeni olarak duruyor — tarayıcıya hiç
   inmiyor, şifreli saklama katmanı yok, çünkü jeton kullanıcı başına
   değil, Nizam'ın kendi hesabının tek değeri. Sunucu işlevi testi jeton
   İSTEMEZ — aynı guvenlik-sql fonksiyonunu, hedefin KENDİ Edge Function'ına
   (ör. kullanici-yonetimi) sunucudan sunucuya istek attırmak için kullanır;
   o fonksiyonun CORS'u yalnız uygulamanın kendi adresine izin verdiği için
   bu istekler tarayıcıdan hiç atılamıyor (bkz. guvenlikSunucuIslevTesti).

   Tarayıcı {islem:'sql',ref,sql} ya da {islem:'istek',ref,fonksiyon,anon,
   belirtec,govde} gönderiyor; fonksiyon çağıranın Studio'da yönetici
   olduğunu doğruluyor, isteğe göre Management API'ye ya da hedefin kendi
   Edge Function'ına iletiyor, sonucu olduğu gibi döndürüyor. B'nin SQL'i
   sabit (aşağıda); C'nin SQL'i guvenlik.json'dan ve onun yanındaki
   dosyalardan gelir — GitHub Pages gibi açık bir adresten, jetonsuz (bkz.
   guvenlikUrlIndir).

   SINIR (şimdilik bilinçli, ileride büyütülecek): NS_SUPABASE_JETON tek
   bir değer, tek bir Supabase HESABININ projelerinde çalışır — o hesabın
   SAHİP OLMADIĞI bir projede (ör. müşteri kendi Supabase hesabını
   kullanmaya başlarsa) B/C "Your account does not have the necessary
   privileges" ile başarısız olur. O zaman çözüm jeton başına proje/hesap
   saklamaya geçmek olur; bugün için tek jeton yeterli. */

/* Studio'nun kendi Supabase'ine BİR KERE deploy edilecek Edge Function.
   "Fonksiyon kodunu kopyala" düğmesiyle (bkz. eylem guvenlik-sql-kopyala)
   Ayarlar > Güvenlik Testi ekranından kopyalanır.

   JETON NEREDEN ALINIR / NEREYE KONUR — bunlar İKİ AYRI HESAP olabilir:
     AL: test edilecek projelerin SAHİBİ olan Supabase hesabından —
         https://supabase.com/dashboard/account/tokens → Generate new
         token → Create legacy token (scoped/granular değil). sbp_ ile
         başlar. Jeton PROJEYE değil HESABA aittir.
     KOY: Studio'nun kendi Supabase'i, Edge Functions → New Function →
         adı "guvenlik-sql" → kodu yapıştır, deploy et → o fonksiyonun
         Settings → Secrets → NS_SUPABASE_JETON. Studio'nun Supabase'i
         burada yalnız KASA — jetonun hangi hesaba ait olduğuyla ilgisi
         yok, iki hesabın birbiriyle ilişkili olması gerekmez.
   Kaydettikten sonra hata hemen devam ederse fonksiyonu bir kere yeniden
   dağıt ya da bir dakika bekleyip tekrar dene (eski değer takılı kalabilir).

   SUPABASE_URL/SERVICE_ROLE_KEY/ANON_KEY'i Supabase her fonksiyona zaten
   kendisi veriyor — ayrıca girilmez. */
const GUVENLIK_SQL_FONKSIYON = `/* Güvenlik testi · SQL çalıştırma köprüsü · Supabase Edge Function.

   NİYE SUNUCUDA
     Supabase erişim jetonu (personal access token) hesaptaki BÜTÜN
     projelerde SQL çalıştırabilir. Tarayıcıya, depoya ya da herhangi bir
     istemci koduna HİÇBİR KOŞULDA inmez — yalnız bu fonksiyonun gizli
     değişkeni (NS_SUPABASE_JETON) olarak durur.

   KAPIDA DURAN KONTROL
     Çağıran Studio'da giriş yapmış VE yönetici mi? (profiles.rol)
     Değilse istek reddedilir — jeton yalnız yönetici için çalışır.

   İKİ İŞLEM
     islem: "sql" — { ref, sql }: SQL Management API'ye iletilir, jeton
       (NS_SUPABASE_JETON) burada kullanılır.
     islem: "istek" — { ref, fonksiyon, anon, belirtec, govde }: hedef
       projenin KENDİ Edge Function'ına (ör. kullanici-yonetimi) sunucudan
       sunucuya bir istek atar — jeton YOK, hedefin kendi anon key'i ve
       (varsa) personel belirteciyle. Bu, o fonksiyonun CORS ayarı yalnız
       uygulamanın kendi adresine izin verdiği için tarayıcıdan hiç
       denenemiyor (bkz. guvenlikSunucuIslevTesti) — sunucudan sunucuya
       çağrıda CORS yok.

   KURULUM
     Studio'nun kendi Supabase'inde: Edge Functions → New Function →
     "guvenlik-sql" → bu kodu yapıştır, deploy et. Sonra Secrets'a
     NS_SUPABASE_JETON ekle — supabase.com/dashboard/account/tokens →
     Generate new token, sbp_ ile başlar. ÖNEMLİ: bu jeton PROJEYE değil
     HESABA aittir; test edilecek projelerin SAHİBİ OLDUĞUN hesaptan
     alınmalı, yoksa Management API o projelere erişim vermez.
*/

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";

const IZINLI_ADRES = Deno.env.get("NS_IZINLI_ADRES") || "https://nizamsoft.github.io";

const CORS = {
  "Access-Control-Allow-Origin": IZINLI_ADRES,
  "Access-Control-Allow-Headers": "authorization, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function cevap(govde: unknown, durum = 200): Response {
  return new Response(JSON.stringify(govde), {
    status: durum,
    headers: { ...CORS, "Content-Type": "application/json" },
  });
}

function hata(mesaj: string, durum = 400): Response {
  return cevap({ hata: mesaj }, durum);
}

Deno.serve(async (istek: Request) => {
  if (istek.method === "OPTIONS") return new Response("ok", { headers: CORS });
  if (istek.method !== "POST") return hata("Yalnız POST kabul edilir.", 405);

  const adres = Deno.env.get("SUPABASE_URL");
  const servis = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!adres || !servis) return hata("Sunucu yapılandırması eksik.", 500);

  const belirtec = (istek.headers.get("Authorization") || "").replace(/^Bearer\\s+/i, "");
  if (!belirtec) return hata("Oturum bulunamadı. Çıkış yapıp tekrar girin.", 401);

  /* service_role istemcisi · Studio'nun KENDİ veritabanı, bütün kuralları
     atlar, yalnız bu dosyada. */
  const yonetim = createClient(adres, servis, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  /* ---- 1 · Çağıran kim? ---- */
  const { data: kimVeri, error: kimHata } = await yonetim.auth.getUser(belirtec);
  if (kimHata || !kimVeri?.user) {
    return hata("Oturum geçersiz ya da süresi dolmuş. Tekrar giriş yapın.", 401);
  }

  /* ---- 2 · Yönetici mi? ---- */
  const { data: profil } = await yonetim
    .from("profiles").select("rol,aktif").eq("id", kimVeri.user.id).maybeSingle();
  if (!profil || profil.rol !== "yonetici" || !profil.aktif) {
    return hata("Bu işlem yalnız yöneticiye açık.", 403);
  }

  /* ---- 3 · Gövde ---- */
  let govde: {
    islem?: string; ref?: string; sql?: string;
    fonksiyon?: string; anon?: string; belirtec?: string; govde?: unknown;
  };
  try { govde = await istek.json(); } catch { return hata("Gövde okunamadı."); }
  const islem = String(govde?.islem || "sql");
  const ref = String(govde?.ref || "").trim();
  if (!/^[a-z0-9]+$/i.test(ref)) return hata("Geçersiz proje kimliği (ref).");

  /* ---- 4a · islem: istek — hedefin KENDİ Edge Function'ına sunucudan
     sunucuya ilet. Jeton YOK; yalnız SSRF'yi daraltmak için hedef adres
     bir Supabase Edge Function kalıbına ({ref}.supabase.co/functions/v1/…)
     zorlanıyor, gövdeden gelen serbest bir URL'e değil. */
  if (islem === "istek") {
    const fonksiyon = String(govde?.fonksiyon || "").trim();
    const anon = String(govde?.anon || "").trim();
    const belirtecHedef = String(govde?.belirtec || "");
    if (!/^[a-z0-9_-]+$/i.test(fonksiyon)) return hata("Geçersiz fonksiyon adı.");
    if (!anon) return hata("Hedef projenin anon anahtarı boş.");
    try {
      const hedefHeaders: Record<string, string> = { apikey: anon, "Content-Type": "application/json" };
      if (belirtecHedef) hedefHeaders["Authorization"] = \`Bearer \${belirtecHedef}\`;
      const r = await fetch(\`https://\${ref}.supabase.co/functions/v1/\${fonksiyon}\`, {
        method: "POST", headers: hedefHeaders, body: JSON.stringify(govde?.govde || {}),
      });
      const sonuc = await r.json().catch(() => null);
      return cevap({ durum: r.status, govde: sonuc });
    } catch (e) {
      return hata("Hedef fonksiyona ulaşılamadı: " + (e as Error).message, 502);
    }
  }

  /* ---- 4b · islem: sql — Management API'ye ilet ---- */
  const sql = String(govde?.sql || "").trim();
  if (!sql) return hata("Çalıştırılacak SQL boş.");

  const jeton = Deno.env.get("NS_SUPABASE_JETON");
  if (!jeton) return hata("NS_SUPABASE_JETON tanımlı değil — bu fonksiyonun Secrets bölümüne eklenmeli.", 500);
  if (!jeton.startsWith("sbp_")) {
    return hata("NS_SUPABASE_JETON yanlış türde görünüyor — bu bir proje API anahtarına benziyor. " +
      "Gereken şey hesap düzeyindeki kişisel erişim jetonu (personal access token): " +
      "supabase.com/dashboard/account/tokens → Generate new token, sbp_ ile başlar.", 500);
  }

  try {
    const r = await fetch(\`https://api.supabase.com/v1/projects/\${ref}/database/query\`, {
      method: "POST",
      headers: { Authorization: \`Bearer \${jeton}\`, "Content-Type": "application/json" },
      body: JSON.stringify({ query: sql }),
    });
    const sonuc = await r.json().catch(() => null);
    if (!r.ok) {
      const mesaj = (sonuc && (sonuc.message || sonuc.error)) || ("HTTP " + r.status);
      return hata(String(mesaj), r.status);
    }
    return cevap({ satirlar: Array.isArray(sonuc) ? sonuc : (sonuc ? [sonuc] : []) });
  } catch (e) {
    return hata("Management API'ye ulaşılamadı: " + (e as Error).message, 502);
  }
});
`;

/* Hedef projenin ref'ini URL'den çıkarır: https://<ref>.supabase.co */
function guvenlikProjeRef(url) {
  const m = String(url || '').trim().match(/^https?:\/\/([a-z0-9-]+)\.supabase\.co/i);
  return m ? m[1] : '';
}

/* Studio'nun kendi Edge Function'ını çağırır — Studio'nun kendi oturum
   belirteciyle (AUTH.db, yönetici olduğu fonksiyon tarafından doğrulanır).
   Fonksiyon kurulu değilse (404) ya da jeton tanımlı değilse (500) BULGU
   DEĞİL, "çalışmadı" bilgisi döner — çağıran bunu BİLGİ olarak yazar. */
async function guvenlikEdgeCagir(istekGovdesi) {
  if (!AUTH.db) return { hata: 'Studio oturumu yok.' };
  let oturum;
  try { oturum = (await AUTH.db.auth.getSession()).data.session; }
  catch (h) { return { hata: 'Oturum okunamadı: ' + h.message }; }
  if (!oturum) return { hata: 'Studio oturumu yok — çıkış yapılmış olabilir.' };
  try {
    const r = await fetch(SUPABASE.url + '/functions/v1/guvenlik-sql', {
      method: 'POST',
      headers: { apikey: SUPABASE.key, Authorization: 'Bearer ' + oturum.access_token, 'Content-Type': 'application/json' },
      body: JSON.stringify(istekGovdesi),
    });
    let govde = null;
    try { govde = await r.json(); } catch (h) { /* boş gövde olabilir */ }
    if (!r.ok) return { hata: (govde && govde.hata) || ('HTTP ' + r.status) };
    return { govde };
  } catch (h) {
    return { hata: 'Bağlantı kurulamadı: ' + h.message };
  }
}

async function guvenlikEdgeCalistir(ref, sql) {
  const { govde, hata } = await guvenlikEdgeCagir({ islem: 'sql', ref, sql });
  if (hata) return { hata };
  return { satirlar: (govde && govde.satirlar) || [] };
}

/* Hedef projenin KENDİ Edge Function'ına (ör. kullanici-yonetimi) sunucudan
   sunucuya bir istek attırır — bkz. guvenlikSunucuIslevTesti. Jeton İSTEMEZ;
   yalnız hedefin kendi anon key'i ve (varsa) bir personel belirteci kullanır.
   `belirtec` boş bırakılırsa Authorization başlığı hiç gönderilmez (kimliksiz
   çağrı testi için). */
async function guvenlikEdgeIstekAt(ref, fonksiyon, anon, belirtec, govdeIstek) {
  const { govde, hata } = await guvenlikEdgeCagir({ islem: 'istek', ref, fonksiyon, anon, belirtec: belirtec || '', govde: govdeIstek });
  if (hata) return { hata };
  return { durum: govde && govde.durum, govde: govde && govde.govde };
}

/* ---------- B · Evrensel iç test — her Supabase projesinde aynı SQL ----------
   Studio'nun kendi içinde sabit durur, hiçbir programdan gelmez. Her satırın
   sonuc sütunu zaten 'AÇIK'/'KAPALI' olarak dönüyor — motor yalnız taşıyor. */
const GUVENLIK_B_SQL = `select d.sira,
       d.deneme,
       case when d.sayi > 0 then 'AÇIK' else 'KAPALI' end as sonuc,
       d.sayi,
       d.ayrinti
from (
  select 1, 'Satır güvenliği kapalı tablo var mı',
    (select count(*) from pg_class c join pg_namespace n on n.oid = c.relnamespace
      where n.nspname = 'public' and c.relkind in ('r','p') and not c.relrowsecurity),
    coalesce((select string_agg(c.relname, ', ' order by c.relname)
      from pg_class c join pg_namespace n on n.oid = c.relnamespace
      where n.nspname = 'public' and c.relkind in ('r','p') and not c.relrowsecurity), '-')
  union all select 2, '"Giriş yapmış herkese serbest" kural kaldı mı',
    (select count(*) from pg_policy p join pg_class c on c.oid = p.polrelid
       join pg_namespace n on n.oid = c.relnamespace
      where n.nspname = 'public'
        and (pg_get_expr(p.polqual, p.polrelid) = 'true'
          or pg_get_expr(p.polwithcheck, p.polrelid) = 'true')),
    coalesce((select string_agg(c.relname || '.' || p.polname, ', ')
      from pg_policy p join pg_class c on c.oid = p.polrelid
       join pg_namespace n on n.oid = c.relnamespace
      where n.nspname = 'public'
        and (pg_get_expr(p.polqual, p.polrelid) = 'true'
          or pg_get_expr(p.polwithcheck, p.polrelid) = 'true')), '-')
  union all select 3, 'Ziyaretçi fonksiyon çağırabiliyor mu',
    (select count(*) from pg_proc p join pg_namespace n on n.oid = p.pronamespace
      where n.nspname = 'public' and has_function_privilege('anon', p.oid, 'execute')),
    coalesce((select string_agg(p.proname, ', ' order by p.proname)
      from pg_proc p join pg_namespace n on n.oid = p.pronamespace
      where n.nspname = 'public' and has_function_privilege('anon', p.oid, 'execute')), '-')
  union all select 4, 'Ziyaretçinin tablo izni var mı',
    (select count(*) from information_schema.role_table_grants
      where grantee = 'anon' and table_schema = 'public'),
    coalesce((select string_agg(distinct table_name, ', ')
      from information_schema.role_table_grants
      where grantee = 'anon' and table_schema = 'public'), '-')
  -- Postgres mantıksal ayarı YAZILDIĞI GİBİ saklar: set (security_invoker
  -- = on) diyen bir göç 'on' bırakır, elle = true yazan 'true'. Dördü de
  -- (on, true, yes, 1) aynı şeydir. Önceden yalnız 'true' aranıyordu ve
  -- korunan görünümler AÇIK diye raporlanıyordu — görünümü olan ilk
  -- programda ortaya çıktı (v0.140.4).
  union all select 5, 'Satır güvenliğini atlayan görünüm var mı',
    (select count(*) from pg_class c join pg_namespace n on n.oid = c.relnamespace
      where n.nspname = 'public' and c.relkind = 'v'
        and coalesce((select option_value from pg_options_to_table(c.reloptions)
                       where option_name = 'security_invoker'), 'false')
            not in ('true', 'on', 'yes', '1')),
    coalesce((select string_agg(c.relname, ', ')
      from pg_class c join pg_namespace n on n.oid = c.relnamespace
      where n.nspname = 'public' and c.relkind = 'v'
        and coalesce((select option_value from pg_options_to_table(c.reloptions)
                       where option_name = 'security_invoker'), 'false')
            not in ('true', 'on', 'yes', '1')), '-')
  union all select 6, 'Arama yolu sabitlenmemiş güçlü fonksiyon var mı',
    (select count(*) from pg_proc p join pg_namespace n on n.oid = p.pronamespace
      where n.nspname = 'public' and p.prosecdef
        and not exists (select 1 from unnest(coalesce(p.proconfig,'{}')) x
                         where x like 'search\\_path=%')),
    coalesce((select string_agg(p.proname, ', ' order by p.proname)
      from pg_proc p join pg_namespace n on n.oid = p.pronamespace
      where n.nspname = 'public' and p.prosecdef
        and not exists (select 1 from unnest(coalesce(p.proconfig,'{}')) x
                         where x like 'search\\_path=%')), '-')
  union all select 7, 'Ziyaretçinin dizi (sequence) izni var mı',
    (select count(*) from pg_sequences s
      where s.schemaname = 'public'
        and (has_sequence_privilege('anon', quote_ident(s.schemaname) || '.' ||
                                            quote_ident(s.sequencename), 'usage')
          or has_sequence_privilege('anon', quote_ident(s.schemaname) || '.' ||
                                            quote_ident(s.sequencename), 'select'))),
    coalesce((select string_agg(s.sequencename, ', ' order by s.sequencename)
      from pg_sequences s
      where s.schemaname = 'public'
        and (has_sequence_privilege('anon', quote_ident(s.schemaname) || '.' ||
                                            quote_ident(s.sequencename), 'usage')
          or has_sequence_privilege('anon', quote_ident(s.schemaname) || '.' ||
                                            quote_ident(s.sequencename), 'select'))), '-')
) as d(sira, deneme, sayi, ayrinti)
order by case when d.sayi > 0 then 0 else 1 end, d.sira;`;

async function guvenlikYapisalTest(ekle, ref) {
  const { satirlar, hata } = await guvenlikEdgeCalistir(ref, GUVENLIK_B_SQL);
  if (hata) { ekle('Yapısal', 'B katmanı', 'BİLGİ', 'Çalışmadı — ' + hata + '. Edge Function kurulu mu, ' +
    'NS_SUPABASE_JETON tanımlı mı kontrol edin — jeton bu projenin SAHİBİ OLDUĞU hesaptan mı alındı?'); return; }
  if (!satirlar.length) { ekle('Yapısal', 'B katmanı', 'BİLGİ', 'Sonuç dönmedi.'); return; }
  satirlar.forEach(s => ekle('Yapısal', s.deneme, s.sonuc, s.ayrinti));
}

/* ---------- C · Programa özel iç test — guvenlik.json'dan ----------
   sql_testi.parcalar listesindeki dosyalar AYRI AYRI, sırayla çalıştırılır
   (aynı istekte gönderilmez — bir parçanın yarattığı tabloyu bir sonraki
   ancak ayrı bir istekte görür). Sonuç sonuc_tablosu'ndan okunur, hangi
   sütunun/hangi değerin "AÇIK" sayılacağını yine guvenlik.json söyler.
   Bir parça hata verirse dur, sonraki parçaları çalıştırma — ama temizlik
   parçasını (sonuncu) yine de dene. */
async function guvenlikProgramaOzelTest(ekle, ref, guvenlikJson, tabanUrl, kalintilar) {
  const sqlTesti = guvenlikJson && guvenlikJson.sql_testi;
  const parcalar = sqlTesti && Array.isArray(sqlTesti.parcalar) ? sqlTesti.parcalar : null;
  if (!parcalar || !parcalar.length) {
    ekle('Programa özel', 'C katmanı', 'ATLANDI', 'guvenlik.json yok ya da sql_testi.parcalar tanımlı değil');
    return;
  }
  if (!tabanUrl) {
    ekle('Programa özel', 'C katmanı', 'ATLANDI', 'guvenlik.json doğrudan bir adresten okunmadı — SQL parçalarının nereden indirileceği bilinmiyor');
    return;
  }
  const kok = tabanUrl.replace(/\/[^/]*$/, '');
  const sonPar = parcalar.length - 1;

  let dur = false;
  for (let i = 0; i < parcalar.length; i++) {
    if (dur && i !== sonPar) continue; /* durunca yalnız son (temizlik) parça yine de denenir */
    const { metin, hata: indirmeHatasi } = await guvenlikUrlIndir(kok + '/' + parcalar[i]);
    if (indirmeHatasi || !metin) {
      ekle('Programa özel', 'C parça ' + (i + 1), 'BİLGİ', 'İndirilemedi — ' + (indirmeHatasi || 'boş dosya'));
      dur = true;
      continue;
    }
    const { hata: calismaHatasi } = await guvenlikEdgeCalistir(ref, metin);
    if (calismaHatasi) {
      ekle('Programa özel', 'C parça ' + (i + 1), 'BİLGİ', 'Çalıştırılamadı — ' + calismaHatasi);
      dur = true;
      continue;
    }
    /* Ara sonuç: son parçadan (temizlik) önceki parça sonuç tablosunu
       yaratmış olabilir — hemen sonrasında okunur. */
    if (i === sonPar - 1 && sqlTesti.sonuc_tablosu) {
      const sutunlar = Array.isArray(sqlTesti.sonuc_sutunlari) && sqlTesti.sonuc_sutunlari.length
        ? sqlTesti.sonuc_sutunlari.join(',') : '*';
      const { satirlar, hata: okumaHatasi } = await guvenlikEdgeCalistir(ref,
        'select ' + sutunlar + ' from ' + sqlTesti.sonuc_tablosu + ';');
      if (okumaHatasi) {
        ekle('Programa özel', 'C sonuç', 'BİLGİ', 'Sonuç tablosu okunamadı — ' + okumaHatasi);
      } else if (!satirlar.length) {
        ekle('Programa özel', 'C sonuç', 'BİLGİ', 'Sonuç tablosu boş.');
      } else {
        const ozetAlan = sqlTesti.ozet_satiri;
        const acikDeger = sqlTesti.acik_degeri;
        satirlar.forEach((satir, k) => {
          /* Satırın kendisi zaten bir "sonuc" sütunu taşıyorsa (bazı
             programların C SQL'i kendi hükmünü kendi veriyor — bkz.
             GUVENLIK_B_SQL'deki gibi) onu OLDUĞU GİBİ kullan; tahmin
             yürütüp AÇIK/KAPALI'ya sıkıştırma, zengin ayrımı (BİLGİ,
             ATLANDI, vb.) at kaybetme. */
          if (satir && satir.sonuc !== undefined) {
            const deneme = 'C · ' + (satir.kim ? satir.kim + ' · ' : '') + (satir.deneme || ('satır ' + (k + 1)));
            ekle('Programa özel', deneme, String(satir.sonuc),
              satir.ayrinti !== undefined && satir.ayrinti !== null ? String(satir.ayrinti) : '');
            return;
          }
          /* Sütun adı vermeyen bir program için yedek: acik_degeri'nin
             satırın herhangi bir sütununda görünüp görünmediğine bakar. */
          const deneme = 'C · ' + (ozetAlan && satir[ozetAlan] ? satir[ozetAlan] : 'satır ' + (k + 1));
          const acikMi = acikDeger !== undefined && Object.values(satir).some(v => v === acikDeger);
          ekle('Programa özel', deneme, acikMi ? 'AÇIK' : 'KAPALI', JSON.stringify(satir));
        });
      }
    }
  }
}

/* ---------- Sunucu işlevi saldırıları — programın Edge Function'ı ----------
   Bu bileşen (bizde kullanici-yonetimi) service_role ile çalışır — satır
   güvenliğinin BÜTÜN kurallarını atlayan tek yer. Kapısında iki kontrol
   olması gerekir: giriş yapmış mı, en üst katman mı. Fonksiyonun CORS'u
   yalnız uygulamanın kendi adresine izin verdiği için bu istekler
   TARAYICIDAN ATILAMAZ — Studio'nun guvenlik-sql'i üzerinden, sunucudan
   sunucuya gönderiliyor (bkz. guvenlikEdgeIstekAt).

   VERİ GÜVENLİĞİ: 2-5. denemelerde kullanici_id hep sabit, VAR OLMAYAN bir
   uuid — böyle bir kullanıcı olmadığı için kapı çalışmasa bile gerçek
   kimseye dokunulmaz. 1. denemede e-posta her seferinde rastgele. */
async function guvenlikSunucuIslevTesti(ekle, ref, anon, belirtec, ustKatmanId, guvenlikJson) {
  const fonksiyon = guvenlikJson && guvenlikJson.sunucu_islevi && guvenlikJson.sunucu_islevi.ad;
  if (!fonksiyon) {
    ekle('Sunucu işlevi', 'sunucu işlevi', 'ATLANDI', 'guvenlik.json yok ya da sunucu_islevi.ad tanımlı değil');
    return;
  }

  const bosId = '00000000-0000-0000-0000-000000000000';
  const rastgeleSifre = () => (Math.random().toString(36) + Math.random().toString(36)).replace(/[^a-z0-9]/g, '').slice(0, 16);

  /* Hüküm ortak: 401/403 KAPALI, 404 fonksiyon dağıtılmamış (ATLANDI),
     2xx AÇIK (ÇOK CİDDİ — istek gerçekten işlendi), başka bir hata
     (ör. "Kullanıcı bulunamadı") AÇIK — KAPI YOK: fonksiyon yetkiye
     bakmadan işe girişmiş demektir, kapıda durması gereken kontrolü
     hiç yapmamıştır. */
  const yorumla = async (deneme, govdeIstek, belirtecOverride) => {
    const kullanilacakBelirtec = belirtecOverride === undefined ? belirtec : belirtecOverride;
    const { durum, govde, hata } = await guvenlikEdgeIstekAt(ref, fonksiyon, anon, kullanilacakBelirtec, govdeIstek);
    if (hata) { ekle('Sunucu işlevi', deneme, 'BİLGİ', hata); return; }
    const ayrinti = guvenlikAyrinti(durum, govde);
    if (durum === 401 || durum === 403) ekle('Sunucu işlevi', deneme, 'KAPALI', ayrinti);
    else if (durum === 404) ekle('Sunucu işlevi', deneme, 'ATLANDI', 'Fonksiyon dağıtılmamış · ' + ayrinti);
    else if (durum >= 200 && durum < 300) ekle('Sunucu işlevi', deneme, 'AÇIK', 'ÇOK CİDDİ · ' + ayrinti);
    else ekle('Sunucu işlevi', deneme, 'AÇIK', 'KAPI YOK — fonksiyon yetkiye bakmadan işe girişti · ' + ayrinti);
  };

  /* 1 · hesap açar — yalnız en üst katmanın id'si biliniyorsa (katmanlar/
     kullanicilar keşfedilebildiyse). Bilinmiyorsa test anlamsız, ATLANDI. */
  if (ustKatmanId) {
    const rastgele = Math.random().toString(36).slice(2) + Date.now().toString(36);
    const eposta = 'ns-islev-testi-' + rastgele + '@ornek.gecici';
    const { durum, govde, hata } = await guvenlikEdgeIstekAt(ref, fonksiyon, anon, belirtec,
      { islem: 'ekle', eposta, sifre: rastgeleSifre(), ad_soyad: 'NS Test', katman_id: ustKatmanId });
    if (hata) ekle('Sunucu işlevi', 'hesap açar', 'BİLGİ', hata);
    else {
      const ayrinti = guvenlikAyrinti(durum, govde);
      if (durum === 401 || durum === 403) ekle('Sunucu işlevi', 'hesap açar', 'KAPALI', ayrinti);
      else if (durum === 404) ekle('Sunucu işlevi', 'hesap açar', 'ATLANDI', 'Fonksiyon dağıtılmamış · ' + ayrinti);
      else if (durum >= 200 && durum < 300) ekle('Sunucu işlevi', 'hesap açar', 'AÇIK',
        'ÇOK CİDDİ — Authentication → Users listesinden ' + eposta + ' ile başlayan hesabı silin. · ' + ayrinti);
      else ekle('Sunucu işlevi', 'hesap açar', 'AÇIK', 'KAPI YOK — fonksiyon yetkiye bakmadan işe girişti · ' + ayrinti);
    }
    /* 2 · katman değiştirir — var olmayan kullanıcıyı en üst katmana taşımayı dener. */
    await yorumla('katman değiştirir', { islem: 'katman', kullanici_id: bosId, katman_id: ustKatmanId });
  } else {
    const not = 'En üst katmanın id\'si bilinmiyor (katmanlar/kullanicilar tabloları keşfedilemedi)';
    ekle('Sunucu işlevi', 'hesap açar', 'ATLANDI', not);
    ekle('Sunucu işlevi', 'katman değiştirir', 'ATLANDI', not);
  }

  /* 3-5 · var olmayan kullanıcı üzerinde şifre/durum/girişi kaldır. */
  await yorumla('şifre değiştirir', { islem: 'sifre', kullanici_id: bosId, sifre: rastgeleSifre() });
  await yorumla('hesap kapatır', { islem: 'durum', kullanici_id: bosId, durum: 'Pasif' });
  await yorumla('girişi kaldırır', { islem: 'girisi-kaldir', kullanici_id: bosId });

  /* 6 · kimliksiz çağrı — Authorization başlığı hiç yok, yalnız apikey. */
  await yorumla('kimliksiz çağrı', { islem: 'durum', kullanici_id: bosId, durum: 'Pasif' }, '');
  /* 7 · uydurma kimlik — imzası geçersiz bir belirteçle. */
  await yorumla('uydurma kimlik', { islem: 'durum', kullanici_id: bosId, durum: 'Pasif' },
    'eyJhbGciOiJIUzI1NiJ9.uydurma.imza');
}

/* `istek` üreticisi: taban adres + anon key sabit, Authorization her
   çağrıda değişebilir (ziyaretçi → anon, personel → giriş sonrası belirteç). */
function guvenlikIstekYap(taban, anon) {
  return async function istek(yol, secenek) {
    secenek = secenek || {};
    const headers = Object.assign({
      apikey: anon,
      Authorization: 'Bearer ' + (secenek.belirtec || anon),
      'Content-Type': 'application/json',
    }, secenek.headers || {});
    try {
      const r = await fetch(taban + yol, { method: secenek.method || 'GET', headers, body: secenek.body });
      let govde = null;
      try { govde = await r.json(); } catch (h) { /* boş gövde olabilir */ }
      return { durum: r.status, govde };
    } catch (h) {
      return { durum: 0, govde: null, hata: h.message || 'Bağlantı kurulamadı' };
    }
  };
}

/* Her satırın Ayrıntı sütunu HTTP kodu + sunucunun kendi hata metnini
   OLDUĞU GİBİ taşır — açık çıkarsa teşhis buradan yapılır. */
function guvenlikAyrinti(durum, govde, hata, ekNot) {
  const parcalar = [];
  if (ekNot) parcalar.push(ekNot);
  if (hata) parcalar.push('Bağlantı hatası: ' + hata);
  else {
    parcalar.push('HTTP ' + durum);
    const mesaj = govde && (govde.message || govde.hint || govde.details || govde.error_description);
    if (mesaj) parcalar.push(String(mesaj));
  }
  return parcalar.join(' · ');
}

/* Şema keşfi — sabit tablo listesi YOK. PostgREST'in kendi OpenAPI
   belgesini (Swagger 2.0 biçiminde) okuyup projedeki gerçek tabloları
   çıkarır. Giriş yapmış kimlikle çekiliyor (bkz. çağıran) — ziyaretçiden
   daha çok tablo görebilir, test listesi en geniş haliyle kurulsun diye.
   Sütun bilgisi artık kullanılmıyor (bkz. guvenlikBosGovdeIleEkle,
   guvenlikMetinAlaniSatirdan) — ekleme/değiştirme testleri şemaya değil,
   gerçek denemeye ve okunan satırın kendi anahtarlarına bakıyor. */
async function guvenlikSemaKesfet(istek, belirtec) {
  const { durum, govde, hata } = await istek('/rest/v1/',
    { belirtec, headers: { Accept: 'application/openapi+json' } });
  if (hata || durum !== 200 || !govde || !govde.definitions) {
    return { hata: hata || ('HTTP ' + durum), tablolar: [] };
  }
  return { tablolar: Object.keys(govde.definitions) };
}

/* Bir adresten JSON metni indirir — hem guvenlik.json'un kendisi hem
   (aşama 2'de) sql_testi.parcalar için ortak. 404 ile "tarayıcı engelledi
   (CORS)/bağlantı sorunu" ayrı mesajlarla döner: ikisi aynı şey değil,
   çözümleri farklı. fetch ikisini de aynı jenerik hatayla fırlatır (tarayıcı
   ayrıntı vermez), o yüzden network/CORS ikisi tek mesajda birleşti. */
async function guvenlikUrlIndir(url) {
  try {
    const r = await fetch(url);
    if (r.status === 404) return { metin: null, hata: 'Adreste dosya bulunamadı (404).' };
    if (!r.ok) return { metin: null, hata: 'Okunamadı (HTTP ' + r.status + ').' };
    return { metin: await r.text(), hata: '' };
  } catch (h) {
    return { metin: null, hata: 'İndirilemedi — tarayıcı engellemiş olabilir (CORS) ya da bağlantı sorunu.' };
  }
}

/* guvenlik.json'u okur — yalnız tablolar.liste ve fonksiyonlar.deneme_guvenli
   alanları kullanılıyor (bkz. guvenlikTabloListesiKesfet, guvenlikDisTest).
   `depo` iki biçimde girilebilir:
     - "http(s)://..." → OLDUĞU GİBİ indirilir (ör. GitHub Pages adresi) —
       github.com'a hiç gidilmez, jeton istenmez. Depo gizliyse tek çalışan
       yol budur (dosyanın yayında olduğu gerçek adres).
     - "github.com/sahip/depo" → GitHub API'den ham içerik denenir; depo
       gizliyse 401/404 döner, bu durumda kullanıcıya doğrudan adres girmesi
       söylenir.
   Alan boşsa ya da hiçbir şey bulunamazsa SESSİZCE {json:null} döner —
   çağıran yalnız gerektiğinde (üç kaynak da boşsa) hatayı gösterir. */
async function guvenlikJsonOku(depo) {
  const deger = String(depo || '').trim();
  if (!deger) return { json: null, hata: '', kaynakUrl: null };

  let metin, hata;
  /* kaynakUrl yalnız DOĞRUDAN adres girildiğinde biliniyor — C katmanının
     SQL parçalarını aynı klasörden indirebilmesi için (bkz.
     guvenlikProgramaOzelTest). GitHub API'den (owner/repo kısayolu)
     okunduğunda genel/açık bir taban adres bilinmiyor. */
  let kaynakUrl = null;
  if (/^https?:\/\//i.test(deger)) {
    ({ metin, hata } = await guvenlikUrlIndir(deger));
    if (metin) kaynakUrl = deger;
  } else {
    const slug = depoSlug(deger);
    if (!slug) return { json: null, hata: 'Adres anlaşılamadı — bir URL ya da github.com/sahip/depo girin.', kaynakUrl: null };
    const sonuc = await guvenlikUrlIndir('https://api.github.com/repos/' + slug + '/contents/guvenlik.json');
    metin = sonuc.metin; hata = sonuc.hata;
    if (!metin && /404/.test(hata || '')) {
      hata = 'Depo gizli görünüyor. guvenlik.json\'un doğrudan adresini girin (ör. GitHub Pages adresi).';
    }
  }
  if (!metin) return { json: null, hata, kaynakUrl: null };
  try { return { json: JSON.parse(metin), hata: '', kaynakUrl }; }
  catch (h) { return { json: null, hata: 'guvenlik.json geçerli bir JSON değil.', kaynakUrl: null }; }
}

/* Tablo listesi — ÜÇ KAYNAKTAN, SIRAYLA:
   3.1 OpenAPI keşfi — en iyisi, sütun şeması da gelir. Supabase'in yeni
       anahtar düzeninde bu uç nokta GİZLİ anahtar isteyebilir (401 "Secret
       API key required") — yayınlanabilir/anon anahtarla bu beklenir,
       HATA gösterilmez, sessizce 3.2'ye geçilir.
   3.2 guvenlik.json → tablolar.liste — yalnız tablo adları, sütun şeması
       YOK. Koda hiçbir tablo adı yazılmıyor, liste programın kendi
       dosyasından geliyor. `json`: guvenlikJsonOku'dan gelen, çağıran
       tarafından bir kez okunmuş sonuç (fonksiyon A4 için de kullanıyor).
   3.3 hiçbiri yoksa boş liste döner — bu BULGU değil, EKSİK ÖLÇÜM
       (çağıran ekranda böyle göstermeli). */
async function guvenlikTabloListesiKesfet(istek, belirtec, json) {
  const sema = await guvenlikSemaKesfet(istek, belirtec);
  if (sema.tablolar.length) return { tablolar: sema.tablolar, kaynak: 'openapi' };

  const liste = json && json.tablolar && Array.isArray(json.tablolar.liste) ? json.tablolar.liste : null;
  if (liste && liste.length) return { tablolar: liste, kaynak: 'guvenlik.json' };

  return { tablolar: [], kaynak: null, hata: sema.hata };
}

/* "Değiştirir" testi için uygun bir metin sütunu seçer — ŞEMAYA GEREK YOK:
   okuma testinin döndürdüğü GERÇEK satırın kendi anahtarları zaten o
   tablonun sütunlarıdır. id, *_id ve UUID/ISO-tarih GÖRÜNÜMLÜ değerler
   elenir (tip bilgisi yok, yalnız çalışma zamanı değerine bakılabiliyor);
   ilk düz metin değerli sütun kullanılır. */
const GUVENLIK_UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const GUVENLIK_TARIH_RE = /^\d{4}-\d{2}-\d{2}/;
function guvenlikMetinAlaniSatirdan(satir) {
  const adaylar = Object.keys(satir || {}).filter(ad => {
    if (ad === 'id' || /_id$/.test(ad)) return false;
    const deger = satir[ad];
    return typeof deger === 'string' && !GUVENLIK_UUID_RE.test(deger) && !GUVENLIK_TARIH_RE.test(deger);
  });
  return adaylar[0] || null;
}

/* Satır güvenliği (RLS) engeliyle uygulamanın kendi iş kuralı/tetik
   engelini AYIRT EDER — ikisi farklı mesajla gelir, farklı anlama gelir:
     "row-level security" içeren hata → izin KESİN yok (RLS engelledi)
     "yetki" ya da "yalnız" içeren hata → izin KESİN yok (uygulamanın
       kendi yetki kontrolü — bir tetik)
   Başka bir hata (zorunlu alan, iş kuralı, foreign key) belirsizdir:
   BEFORE tetikleri satır güvenliğinden ÖNCE çalışabildiği için, geçerli
   bir gövdeyle gönderilse arkasından yine reddedilmiş olabilirdi — bu
   yüzden çağıran "ölçülemedi" yazar, "ekler" YAZMAZ (bkz. guvenlikBosGovdeIleEkle). */
function guvenlikEklemeKesinReddedildiMi(mesaj) {
  const m = (mesaj || '').toLocaleLowerCase('tr');
  /* "permission denied for table/function" — GRANT düzeyinde ret (rol o
     tabloda/fonksiyonda hiç yetkiye sahip değil). RLS'ten önce, ondan
     bağımsız bir engel — o da en az "row-level security" kadar kesin. */
  return m.indexOf('row-level security') >= 0 || m.indexOf('yetki') >= 0 || m.indexOf('yalnız') >= 0
    || m.indexOf('permission denied') >= 0;
}

/* Ekleme testi — ŞEMA GEREKMEZ: BOŞ gövde (`{}`) gönderilir, hata metni
   yorumlanır. Bu TEK YÖNLÜ bir testtir: kesin ret güvenilirdir ("ekleyemez"),
   ama kesin ret DIŞINDAKİ bir hata "izin var" anlamına gelmez — yalnız
   "ölçülemedi" denir (bkz. guvenlikEklemeKesinReddedildiMi). 2xx ise zaten
   satır oluşmuş demektir, dönen satır (varsa) id'siyle birlikte taşınır. */
async function guvenlikBosGovdeIleEkle(istek, tablo, secenek) {
  const { durum, govde, hata } = await istek('/rest/v1/' + tablo,
    Object.assign({ method: 'POST', headers: { Prefer: 'return=representation' }, body: '{}' }, secenek || {}));
  if (hata) return { sonuc: 'olcumsuz', mesaj: 'Bağlantı hatası: ' + hata, satir: null };
  if (durum >= 200 && durum < 300) return { sonuc: 'ekler', satir: (Array.isArray(govde) && govde[0]) || null };
  const mesaj = (govde && govde.message) || ('HTTP ' + durum);
  if (guvenlikEklemeKesinReddedildiMi(mesaj)) return { sonuc: 'ekleyemez', mesaj };
  return { sonuc: 'olcumsuz', mesaj };
}

/* Tek bir yazma/silme denemesini çalıştırıp yorumlar.
   ÖNEMLİ (Düzeltme 1): PostgreSQL'in satır güvenliği yasak bir işlemi hata
   vererek değil, SATIRLARI SÜZEREK engeller. 200 dönmesi hiçbir şey
   kanıtlamaz — asıl kanıt dönen dizinin DOLU mu BOŞ mu olduğu:
     200 + dolu dizi  → AÇIK (gerçekten dokunabildi)
     200 + boş dizi   → KAPALI (satır güvenliği süzdü, ya da satır hiç yoktu)
     401 / 403        → KAPALI
     başka bir hata   → sunucu bir mesajla reddettiyse (ör. "yetki gerekir",
                        "Hesabın yalnız adı değiştirilebilir…" gibi bir
                        tetik/iş kuralı engeli) KAPALI, mesaj yoksa BİLGİ
   `ekle` artık pushladığı satırı geri döndürüyor ki çağıran (ör. "kural
   gereği serbest" istisnası) sonradan üzerine yazabilsin. */
async function guvenlikYazDeneVeYorumla(istek, ekle, kim, deneme, yol, secenek, acikNot) {
  const { durum, govde, hata } = await istek(yol, secenek);
  const ayrinti = guvenlikAyrinti(durum, govde, hata);
  let sonuc;
  if (hata) sonuc = 'BİLGİ';
  else if (durum === 401 || durum === 403) sonuc = 'KAPALI';
  else if (durum >= 200 && durum < 300) sonuc = (!Array.isArray(govde) || govde.length > 0) ? 'AÇIK' : 'KAPALI';
  else if (govde && govde.message) sonuc = 'KAPALI';
  else sonuc = 'BİLGİ';
  const satir = ekle(kim, deneme, sonuc, sonuc === 'AÇIK' && acikNot ? acikNot + ' · ' + ayrinti : ayrinti);
  return { durum, govde, sonuc, satir };
}

/* ---------- A · Dış test (ziyaretçi — oturumsuz, yalnız anon key) ----------
   `sema`: guvenlikSemaKesfet'ten gelen keşif sonucu.
   `guvenlikJson`: programın deposundaki guvenlik.json (yoksa null). */
async function guvenlikDisTest(istek, ekle, sema, guvenlikJson) {
  /* A1 · Hangi tablolar dışarıdan görünüyor — yalnız anon anahtarıyla.
     Supabase'in yeni anahtar düzeninde kök uç ("/rest/v1/") yayınlanabilir
     anahtarla hiç açılmayabilir ("Secret API key required", HTTP 401) —
     bu bir PLATFORM kuralıdır, projenin ayarı değil. Böyle bir 401'i
     KAPALI göstermek "ölçüm yaptık, güvenli" demek olurdu; oysa hiç
     ölçemedik. O yüzden BİLGİ yazılır. Asıl "ziyaretçi veri okuyabiliyor
     mu" sorusu zaten A2'de, tablo uçlarına gidilerek ölçülüyor — onlar
     yayınlanabilir anahtarla normal çalışıyor. */
  {
    const { durum, govde, hata } = await istek('/rest/v1/');
    const ayrinti = guvenlikAyrinti(durum, govde, hata);
    const gizliAnahtarGerekli = durum === 401 && /secret api key/i.test((govde && govde.message) || '');
    if (hata) ekle('Dış', 'şema listesi', 'BİLGİ', ayrinti);
    else if (gizliAnahtarGerekli) ekle('Dış', 'şema listesi', 'BİLGİ',
      'Kök uç yayınlanabilir anahtarla açılmıyor (platform kuralı) — ölçülemedi · ' + ayrinti);
    else {
      const tabloYollari = (durum === 200 && govde && govde.paths)
        ? Object.keys(govde.paths).filter(p => p !== '/' && p.indexOf('/rpc/') !== 0) : [];
      if (tabloYollari.length) ekle('Dış', 'şema listesi', 'AÇIK',
        tabloYollari.length + ' tablo görünüyor: ' + tabloYollari.map(p => p.slice(1)).join(', '));
      else if (durum === 401 || durum === 403) ekle('Dış', 'şema listesi', 'KAPALI', ayrinti);
      else ekle('Dış', 'şema listesi', 'BİLGİ', ayrinti);
    }
  }

  const tablolar = sema.tablolar || [];

  /* A2 · Okuma denemeleri — keşfedilen HER tabloda, sabit liste yok. */
  for (const tablo of tablolar) {
    const { durum, govde, hata } = await istek('/rest/v1/' + tablo + '?select=*&limit=1');
    const ayrinti = guvenlikAyrinti(durum, govde, hata);
    const deneme = tablo + ' okuma';
    if (hata) ekle('Dış', deneme, 'BİLGİ', ayrinti);
    else if (durum === 200 && Array.isArray(govde) && govde.length > 0)
      ekle('Dış', deneme, 'AÇIK', 'Ziyaretçi veri okuyabiliyor · ' + ayrinti);
    else if (durum === 200 || durum === 401 || durum === 403 || durum === 404)
      ekle('Dış', deneme, 'KAPALI', ayrinti);
    else ekle('Dış', deneme, 'BİLGİ', ayrinti);
  }

  /* A3 · Yazma ve silme — ilk keşfedilen tabloda, BOŞ GÖVDE ile (şema
     gerekmez, bkz. guvenlikBosGovdeIleEkle). Satır güvenliği/yetki hatası
     KESİN "KAPALI"; başka bir hata (zorunlu alan, iş kuralı, FK) BEFORE
     tetikleri satır güvenliğinden önce çalışabildiği için belirsizdir —
     "BİLGİ" yazılır, "AÇIK" denmez. Silme yalnız ekleme BAŞARILI olduysa,
     kendi eklediği gerçek satırda denenir — hüküm dönen diziye bakar
     (bkz. guvenlikYazDeneVeYorumla). */
  if (tablolar[0]) {
    const tablo = tablolar[0];
    const eklemeSonucu = await guvenlikBosGovdeIleEkle(istek, tablo);
    if (eklemeSonucu.sonuc === 'ekler') {
      ekle('Dış', tablo + ' yazma', 'AÇIK', 'Ziyaretçi kayıt ekleyebiliyor');
      const id = eklemeSonucu.satir && eklemeSonucu.satir.id;
      if (id) {
        await guvenlikYazDeneVeYorumla(istek, ekle, 'Dış', tablo + ' silme',
          '/rest/v1/' + tablo + '?id=eq.' + encodeURIComponent(id),
          { method: 'DELETE', headers: { Prefer: 'return=representation' } }, 'Ziyaretçi silebiliyor');
      } else {
        ekle('Dış', tablo + ' silme', 'ATLANDI', 'Eklenen satırın id\'si okunamadı');
      }
    } else if (eklemeSonucu.sonuc === 'ekleyemez') {
      ekle('Dış', tablo + ' yazma', 'KAPALI', eklemeSonucu.mesaj || '');
      ekle('Dış', tablo + ' silme', 'ATLANDI', 'Yazma kapalı olduğu için gerçek bir satırla denenemedi');
    } else {
      ekle('Dış', tablo + ' yazma', 'BİLGİ', 'Ölçülemedi' + (eklemeSonucu.mesaj ? ' · ' + eklemeSonucu.mesaj : ''));
      ekle('Dış', tablo + ' silme', 'ATLANDI', 'Yazma ölçülemediği için gerçek bir satırla denenemedi');
    }
  }

  /* A4 · Fonksiyon çağırma — OpenAPI'den fonksiyon listesi de keşfedilemiyor
     (aynı platform kısıtı). Bunun yerine programın guvenlik.json'unda
     bildirdiği TEK güvenli deneme fonksiyonunu (fonksiyonlar.deneme_guvenli)
     çağırır — RASTGELE FONKSİYON DENENMEZ. O alana yalnız okuyan,
     argümansız, yan etkisiz bir fonksiyon adı konması beklenir (muhasebe
     şablonunda: ns_katman). "En iyi çaba" ölçümüdür; tam ölçüm ("anon hangi
     fonksiyonları çağırabiliyor") B katmanında doğrudan veritabanından
     sorulacak. */
  {
    const deneme = guvenlikJson && guvenlikJson.fonksiyonlar && guvenlikJson.fonksiyonlar.deneme_guvenli;
    if (!deneme) {
      ekle('Dış', 'fonksiyon çağırma', 'ATLANDI', 'guvenlik.json yok ya da fonksiyonlar.deneme_guvenli tanımlı değil');
    } else {
      const { durum, govde, hata } = await istek('/rest/v1/rpc/' + deneme, { method: 'POST', body: '{}' });
      const ayrinti = guvenlikAyrinti(durum, govde, hata);
      if (hata) ekle('Dış', 'fonksiyon çağırma', 'BİLGİ', ayrinti);
      else if (durum >= 200 && durum < 300) ekle('Dış', 'fonksiyon çağırma', 'AÇIK', 'rpc/' + deneme + ' · ' + ayrinti);
      else if (durum === 404) ekle('Dış', 'fonksiyon çağırma', 'ATLANDI', 'rpc/' + deneme + ' bulunamadı · ' + ayrinti);
      else if (durum === 401 || durum === 403) ekle('Dış', 'fonksiyon çağırma', 'KAPALI', ayrinti);
      else ekle('Dış', 'fonksiyon çağırma', 'BİLGİ', ayrinti);
    }
  }

  /* A5 · Uydurma kimlik — imzası geçersiz bir belirteçle, ilk keşfedilen tabloya. */
  if (tablolar[0]) {
    const uydurma = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyb2xlIjoiYXV0aGVudGljYXRlZCJ9.' +
      'ns-guvenlik-testi-gecersiz-imza';
    const { durum, govde, hata } = await istek('/rest/v1/' + tablolar[0] + '?select=*&limit=1', { belirtec: uydurma });
    const ayrinti = guvenlikAyrinti(durum, govde, hata);
    if (hata) ekle('Dış', 'uydurma kimlik', 'BİLGİ', ayrinti);
    else if (durum === 401) ekle('Dış', 'uydurma kimlik', 'KAPALI', ayrinti);
    else if (durum >= 200 && durum < 300)
      ekle('Dış', 'uydurma kimlik', 'AÇIK', 'ÇOK CİDDİ — geçersiz kimlik kabul edildi · ' + ayrinti);
    else ekle('Dış', 'uydurma kimlik', 'BİLGİ', ayrinti);
  }

  /* A6 · Kendi kendine kayıt açık mı — Supabase'de e-posta ile kayıt
     varsayılan olarak AÇIKTIR ve anon key zaten herkesin elinde; açık
     kalırsa yabancı biri kendine hesap açıp authenticated rolüne geçebilir.
     Her çalıştırmada RASTGELE bir e-posta kullanılır — aynısını tekrar
     denemek "zaten var" hatasını yanlışlıkla KAPALI diye okutur. */
  {
    const rastgele = Math.random().toString(36).slice(2) + Date.now().toString(36);
    const eposta = 'ns-kayit-testi-' + rastgele + '@ornek.gecici';
    const sifre = (Math.random().toString(36) + Math.random().toString(36)).replace(/[^a-z0-9]/g, '').slice(0, 16);
    const { durum, govde, hata } = await istek('/auth/v1/signup', {
      method: 'POST', body: JSON.stringify({ email: eposta, password: sifre }),
    });
    const ayrinti = guvenlikAyrinti(durum, govde, hata);
    if (hata) ekle('Dış', 'kendi kendine kayıt', 'BİLGİ', ayrinti);
    else if (durum === 200 || durum === 201)
      ekle('Dış', 'kendi kendine kayıt', 'AÇIK',
        'Yabancılar hesap açabiliyor — Supabase → Authentication → Sign In / Providers → ' +
        'User Signups → "Allow new users to sign up" kapatın, Save changes deyin. ' +
        '"Enable email provider"a DOKUNMAYIN, o giriş yapmayı sağlar. Açılan ' + eposta +
        ' hesabını Authentication → Users listesinden silin. · ' + ayrinti);
    /* 429: çok deneme yapıldığı için Supabase kendisi reddetti — bu bir
       hız sınırı, kayıt kapalı olduğu anlamına gelmez. KAPALI SAYILMAZ. */
    else if (durum === 429)
      ekle('Dış', 'kendi kendine kayıt', 'BİLGİ', 'Çok deneme yapıldı, ölçülemedi — biraz sonra tekrar deneyin. · ' + ayrinti);
    else if (durum === 422 || durum === 400 || durum === 403)
      ekle('Dış', 'kendi kendine kayıt', 'KAPALI', ayrinti);
    else ekle('Dış', 'kendi kendine kayıt', 'BİLGİ', ayrinti);
  }
}

/* JWT'nin orta bölümünü (payload) çözer — imza doğrulamaz, yalnız exp/iat
   okumak için. Base64url (standart base64'ten farklı: +/  yerine -_, dolgu
   yok) çözülüp JSON'a çevrilir. */
function guvenlikJwtCoz(token) {
  try {
    const parca = (token || '').split('.')[1];
    if (!parca) return null;
    const b64 = parca.replace(/-/g, '+').replace(/_/g, '/');
    const dolgulu = b64 + '==='.slice((b64.length + 3) % 4);
    return JSON.parse(atob(dolgulu));
  } catch (h) { return null; }
}

/* A7 · Belirteç ömrü — "çıkış yap, aynı belirteçle dene" testi kaldırıldı:
   Supabase'in erişim belirteci (JWT) durum bilgisizdir, çıkış yalnız
   yenileme belirtecini iptal eder, erişim belirteci kendi süresi dolana
   kadar geçerli kalmaya devam eder — bu her zaman "hâlâ geçerli" çıkıp
   yanlış alarm verirdi. Asıl soru: ÇALINAN bir belirteç ne kadar süre
   geçerli kalır? Giriş cevabındaki access_token'ın exp - iat farkına
   bakılır; hiçbir şey çağrılmaz. */
function guvenlikBelirtecOmruTesti(ekle, girisGovdesi) {
  const yuk = guvenlikJwtCoz(girisGovdesi && girisGovdesi.access_token);
  if (!yuk || !yuk.exp || !yuk.iat) {
    ekle('Dış', 'belirteç ömrü', 'BİLGİ', 'Belirteç çözülemedi — exp/iat alanı yok');
    return;
  }
  const saniye = yuk.exp - yuk.iat;
  const saat = saniye / 3600;
  const ayrinti = 'Belirteç ömrü ' + Math.round(saniye) + ' saniye (~' + (Math.round(saat * 10) / 10) + ' saat)';
  if (saat <= 1) ekle('Dış', 'belirteç ömrü', 'KAPALI', ayrinti);
  else if (saat <= 24) ekle('Dış', 'belirteç ömrü', 'BİLGİ', ayrinti + ' — 1 saatten uzun, sebebi olmalı');
  else ekle('Dış', 'belirteç ömrü', 'AÇIK',
    'Çalınan bir belirteç günlerce geçerli kalır — Supabase → Authentication → Sessions → ' +
    'Access token (JWT) expiry değerini 3600 saniyeye (1 saat) indirin. · ' + ayrinti);
}

/* ---------- 0.2 · Giriş yapan hesabın katmanını öğren ----------
   BEST EFFORT: yalnız muhasebe şablonunun katmanlar/kullanicilar
   tabloları varsa çalışır — sabit şema bilgisi burada kalıyor çünkü
   "en üst yetki kimde" sorusunu genel şemadan çıkarmanın güvenilir bir
   yolu yok. Bu tablolar keşifte yoksa üst katman kontrolü atlanır,
   testler normal çalışır (yanlışlıkla KAPALI/güvenli göstermez, sadece
   bu uyarıyı veremez). */
async function guvenlikKendiKatmanim(istek, belirtec, ownAuthId, tablolar) {
  if (tablolar.indexOf('katmanlar') === -1 || tablolar.indexOf('kullanicilar') === -1) {
    return { own: null, ust: null, ustKatmandaMi: false };
  }
  const { govde: katmanlar } = await istek('/rest/v1/katmanlar?select=id,ad,seviye&order=seviye.desc', { belirtec });
  const { govde: kullanicilar } = await istek('/rest/v1/kullanicilar?select=id,auth_id,katman_id', { belirtec });
  const ust = katmanlar && katmanlar[0];
  const own = (kullanicilar || []).find(k => k.auth_id === ownAuthId);
  return { own, ust, ustKatmandaMi: !!(own && ust && own.katman_id === ust.id) };
}

/* ---------- D · Personel yetki haritası — HÜKÜM VERİLMEZ ----------
   Keşfedilen her tablo için dört soru: okur · ekler · değiştirir · siler.
   AÇIK/KAPALI denmez — bir programda serbest olan başka programda yasak
   olabilir, motor bunu bilemez; yalnız durum gösterilir.

   VERİ GÜVENLİĞİ: süzgeçsiz DELETE/PATCH atılmaz (her istek id=eq.<id>),
   değiştirme testinde yeni değer yazılmaz (sütun kendi değeriyle geri
   yazılır), silme yalnız testin kendi eklediği kayıtta denenir. Eklenen
   kayıt silinemezse veritabanında kalır — `kalintilar`'a SQL olarak yazılır. */
async function guvenlikPersonelHaritasi(istek, belirtec, sema, kalintilar) {
  const satirlar = [];
  for (const tablo of sema.tablolar) {
    const satir = { tablo, okur: 'ölçülemedi', ekler: 'ölçülemedi', degistirir: 'ölçülemedi', siler: 'ölçülemedi' };

    /* Okuma — sütun şeması gerekmez, yalnız tablo adı yeterli. Bulunan
       satırın kendi ANAHTARLARI aynı zamanda o tablonun sütunlarıdır —
       değiştirme testi ayrı bir şemaya değil, bu satıra bakar. */
    const { durum: oDurum, govde: oGovde } = await istek('/rest/v1/' + tablo + '?select=*&limit=1', { belirtec });
    let ornekSatir = null;
    if (oDurum === 401 || oDurum === 403) satir.okur = 'okuyamaz';
    else if (oDurum >= 200 && oDurum < 300 && Array.isArray(oGovde) && oGovde.length > 0) {
      satir.okur = 'okur';
      ornekSatir = oGovde[0];
    }

    /* Değiştirme — okunan gerçek satırın bir metin sütunu, KENDİ değeriyle
       geri yazılıyor. Sütun adı satırın kendi anahtarlarından seçiliyor
       (bkz. guvenlikMetinAlaniSatirdan) — tablo boşsa zaten ornekSatir yok. */
    if (ornekSatir && ornekSatir.id !== undefined) {
      const metinAlan = guvenlikMetinAlaniSatirdan(ornekSatir);
      if (metinAlan) {
        const govdeYaz = {}; govdeYaz[metinAlan] = ornekSatir[metinAlan];
        const { durum: dDurum, govde: dGovde } = await istek('/rest/v1/' + tablo + '?id=eq.' + encodeURIComponent(ornekSatir.id), {
          belirtec, method: 'PATCH', headers: { Prefer: 'return=representation' }, body: JSON.stringify(govdeYaz) });
        if (dDurum === 401 || dDurum === 403) satir.degistirir = 'değiştiremez';
        else if (dDurum >= 200 && dDurum < 300) satir.degistirir = (Array.isArray(dGovde) && dGovde.length > 0) ? 'değiştirir' : 'değiştiremez';
      }
    }

    /* Ekleme — BOŞ GÖVDE ile (şema gerekmez, bkz. guvenlikBosGovdeIleEkle).
       Satır güvenliği/yetki hatası KESİN "ekleyemez"; başka bir hata
       (zorunlu alan, iş kuralı, FK) belirsizdir — BEFORE tetikleri satır
       güvenliğinden önce çalışabildiği için geçerli bir gövdeyle de
       reddedilmiş olabilirdi, bu yüzden "ölçülemedi" yazılır, "ekler" YAZILMAZ. */
    const eklemeSonucu = await guvenlikBosGovdeIleEkle(istek, tablo, { belirtec });
    let eklenenSatir = null;
    if (eklemeSonucu.sonuc === 'ekler') { satir.ekler = 'ekler'; eklenenSatir = eklemeSonucu.satir; }
    else if (eklemeSonucu.sonuc === 'ekleyemez') satir.ekler = 'ekleyemez';
    else satir.ekler = 'ölçülemedi' + (eklemeSonucu.mesaj ? ' · ' + eklemeSonucu.mesaj : '');

    /* Silme — yalnız EKLEME BAŞARILI olduysa, kendi eklediği kayıtta.
       Ekleme yapılamadıysa dışarıdan güvenle ölçmenin başka yolu yok
       (eşleşmeyen süzgeç izin ölçmez, gerçek satırda deneme veriyi siler)
       — o zaman B katmanına bırakılır. */
    if (eklenenSatir && eklenenSatir.id !== undefined) {
      const { durum: sDurum, govde: sGovde } = await istek('/rest/v1/' + tablo + '?id=eq.' + encodeURIComponent(eklenenSatir.id),
        { belirtec, method: 'DELETE', headers: { Prefer: 'return=representation' } });
      if (sDurum >= 200 && sDurum < 300 && Array.isArray(sGovde) && sGovde.length > 0) satir.siler = 'siler';
      else { satir.siler = 'silemez'; kalintilar.push('delete from ' + tablo + ' where id = \'' + eklenenSatir.id + '\';'); }
    } else {
      satir.siler = 'ölçülemedi · B katmanında ölçülür';
    }

    satirlar.push(satir);
  }
  return satirlar;
}

async function guvenlikTestiCalistir({ url, anon, eposta, sifre, depo }) {
  const taban = String(url || '').trim().replace(/\/+$/, '');
  const istek = guvenlikIstekYap(taban, anon);
  const sonuclar = [];
  const kalintilar = [];
  const ekle = (kim, deneme, sonuc, ayrinti) => {
    const satir = { kim, deneme, sonuc, ayrinti: ayrinti || '' };
    sonuclar.push(satir);
    return satir;
  };

  /* 0.1 · Giriş — başarısızsa hiçbir şey çalıştırma, tek satırla dur. */
  const gSonuc = await istek('/auth/v1/token?grant_type=password', {
    belirtec: anon, method: 'POST', body: JSON.stringify({ email: eposta, password: sifre }),
  });
  const belirtec = !gSonuc.hata && gSonuc.durum === 200 && gSonuc.govde && gSonuc.govde.access_token;
  const ownAuthId = belirtec && gSonuc.govde.user && gSonuc.govde.user.id;

  if (!belirtec) {
    ekle('Personel', 'giriş', 'BİLGİ',
      gSonuc.hata ? 'Bağlantı hatası: ' + gSonuc.hata : 'Bu hesapla giriş yapılamadı — ' + guvenlikAyrinti(gSonuc.durum, gSonuc.govde));
    return { sonuc: sonuclar, harita: null, ustKatmanUyarisi: false, kalintilar, tabloKaynagi: '' };
  }

  /* guvenlik.json bir kez okunur — hem tablo listesi yedeği (3.2) hem A4'ün
     güvenli deneme fonksiyonu (fonksiyonlar.deneme_guvenli) hem de C
     katmanının SQL parçaları (sql_testi.parcalar) için kullanılır. */
  const { json: guvenlikJson, hata: guvenlikJsonHata, kaynakUrl: guvenlikJsonUrl } = await guvenlikJsonOku(depo);

  /* 1 · Tablo listesi — üç kaynaktan sırayla (bkz. guvenlikTabloListesiKesfet):
     OpenAPI keşfi (sütun şemasıyla birlikte) → guvenlik.json (yalnız
     adlar) → hiçbiri yoksa boş. OpenAPI başarısız oldu diye hata
     GÖSTERİLMEZ (Supabase'in yeni anahtar düzeninde bu uç nokta gizli
     anahtar isteyebilir) — yalnız üçü de boşsa aşağıda bilgi satırı yazılır. */
  const sema = await guvenlikTabloListesiKesfet(istek, belirtec, guvenlikJson);
  if (!sema.tablolar.length) {
    ekle('Dış', 'tablo listesi', 'BİLGİ',
      'Tablo listesi bulunamadı — yalnız oturumsuz denemeler çalıştı (okuma/yazma ve yetki haritası atlandı). ' +
      (depo ? 'guvenlik.json: ' + (guvenlikJsonHata || 'tablolar.liste yok') : 'Denemek için guvenlik.json adresi de girilebilir.'));
  }

  /* 0.2 · Hesabın katmanı (best effort) — B/C/D ve sunucu işlevi testinden
     önce hesaplanır, "en üst katmanın id'si" ikisinde de lazım. */
  const katman = await guvenlikKendiKatmanim(istek, belirtec, ownAuthId, sema.tablolar || []);

  /* A · Dış test (anon, oturumsuz). */
  await guvenlikDisTest(istek, ekle, sema, guvenlikJson);

  /* A7 · belirteç ömrü — hiçbir şey çağırmaz, giriş cevabını okur. */
  guvenlikBelirtecOmruTesti(ekle, gSonuc.govde);

  /* B, C ve Sunucu işlevi · yalnız Studio'nun kendi Edge Function'ı
     (guvenlik-sql) kuruluysa çalışır — kurulu değilse guvenlikYapisalTest
     tek bir BİLGİ satırıyla bunu söyler, testi durdurmaz. */
  const ref = guvenlikProjeRef(url);
  if (ref) {
    await guvenlikYapisalTest(ekle, ref);
    await guvenlikProgramaOzelTest(ekle, ref, guvenlikJson, guvenlikJsonUrl, kalintilar);
    await guvenlikSunucuIslevTesti(ekle, ref, anon, belirtec, katman.ust ? katman.ust.id : null, guvenlikJson);
  }

  /* D · personel yetki haritası. */
  let harita = null;
  if (!katman.ustKatmandaMi && sema.tablolar && sema.tablolar.length) {
    harita = await guvenlikPersonelHaritasi(istek, belirtec, sema, kalintilar);
  }

  return { sonuc: sonuclar, harita, ustKatmanUyarisi: katman.ustKatmandaMi, kalintilar,
    tabloKaynagi: sema.kaynak || '' };
}

/* Düz metin rapor — sohbete ya da nota tek tıkla yapıştırılabilsin diye.
   Tablo görünümüyle aynı sırayı (AÇIK'lar üstte) kullanır. */
function guvenlikRaporMetni(sonuc, ustKatmanUyarisi, kalintilar, harita, tabloKaynagi) {
  if (!sonuc || !sonuc.length) return '';
  const acik = sonuc.filter(s => s.sonuc === 'AÇIK').length;
  const s = [];
  s.push('# Güvenlik Testi Sonucu');
  if (ustKatmanUyarisi) s.push('⚠ Verilen hesap en üst katmanda — yetki haritası ATLANDI.');
  if (acik >= 3) s.push('⚠ Bu kadar çok bulgu genelde güvenlik ayarlarının eksik ya da veritabanının ' +
    'güncellenmemiş olduğu anlamına gelir.');
  if (tabloKaynagi === 'guvenlik.json') s.push('ℹ Tablo listesi guvenlik.json\'dan okundu (OpenAPI keşfi çalışmadı).');
  s.push(acik ? acik + ' GÜVENLİK AÇIĞI BULUNDU' : 'Güvenli · ' + sonuc.length + ' deneme yapıldı, hiçbiri işe yaramadı');
  if (kalintilar && kalintilar.length) {
    s.push('');
    s.push('⚠ Veritabanında temizlenmemiş test kaydı kaldı:');
    kalintilar.forEach(k => s.push('  ' + k));
  }
  s.push('');
  const oncelikMetin = r => (r.kim === 'Sunucu işlevi' && r.sonuc === 'AÇIK') ? -1 : (r.sonuc === 'AÇIK' ? 0 : 1);
  sonuc.slice()
    .sort((a, b) => oncelikMetin(a) - oncelikMetin(b))
    .forEach(r => {
      const isaret = r.sonuc === 'AÇIK' ? '⚠️ ' : '';
      s.push(isaret + r.kim + ' · ' + r.deneme + ' · ' + r.sonuc + (r.ayrinti ? ' · ' + r.ayrinti : ''));
    });
  if (harita && harita.length) {
    s.push('');
    s.push('## Personel yetki haritası (hüküm yok — durum gösterir)');
    harita.forEach(h => s.push(h.tablo + ' · okur:' + h.okur + ' · ekler:' + h.ekler +
      ' · değiştirir:' + h.degistirir + ' · siler:' + h.siler));
  }
  return s.join('\n');
}

function guvenlikSonucTablosu(sonuc, ustKatmanUyarisi, kalintilar, harita, tabloKaynagi, projeId) {
  if (!sonuc) return '';
  if (!sonuc.length) return `<p class="ipucu" style="margin-top:10px">Sonuç yok.</p>`;
  const acik = sonuc.filter(s => s.sonuc === 'AÇIK').length;
  const uyari = ustKatmanUyarisi ? `<div class="note uyari" style="margin-top:14px">${svg(ICON.uyari, 15)}
      <span><b>Verdiğiniz hesap EN ÜST KATMANDA.</b> Üst katman zaten her şeyi
      yapabilir, o yüzden yetki haritası anlamsız olurdu (atlandı). Gerçek
      sonuç için YÖNETİCİ OLMAYAN bir personel hesabı verin.</span></div>` : '';
  const semaUyarisi = tabloKaynagi === 'guvenlik.json' ? `<div class="note" style="margin-top:14px">${svg(ICON.info, 15)}
      <span>Tablo listesi <b>guvenlik.json</b>'dan okundu (OpenAPI keşfi çalışmadı).</span></div>` : '';
  const gocUyarisi = acik >= 3 ? `<div class="note uyari" style="margin-top:14px">${svg(ICON.uyari, 15)}
      <span><b>Bu kadar çok bulgu genelde şu demektir: güvenlik ayarları eksik
      ya da veritabanı güncellenmemiş.</b> Projenin kurulum/göç dosyalarını
      sırayla gözden geçirip testi tekrarlayın.</span></div>` : '';
  const ozet = acik
    ? `<div class="note uyari" style="margin-top:14px">${svg(ICON.uyari, 15)}
        <span><b>${acik} GÜVENLİK AÇIĞI BULUNDU</b></span></div>`
    : `<div class="kur-deger duz" style="margin-top:14px">${svg(ICON.tik, 13)}
        Güvenli · ${sonuc.length} deneme yapıldı, hiçbiri işe yaramadı</div>`;
  const kalintiUyarisi = (kalintilar && kalintilar.length) ? `<div class="note uyari" style="margin-top:14px">
      ${svg(ICON.uyari, 15)}
      <span><b>Veritabanında temizlenmemiş test kaydı kaldı.</b> Şu SQL'i
      Supabase SQL Editör'de çalıştırıp temizle:<br>
      ${kalintilar.map(k => `<code>${esc(k)}</code>`).join('<br>')}</span></div>` : '';
  const kopyalaDugmesi = `<div class="kur-dug" style="margin-top:10px">
      <button class="sayfa-dug ikincil" type="button" data-eylem="guvenlik-rapor-kopyala"
              ${projeId ? `data-proje="${esc(projeId)}"` : ''}>
        ${svg(ICON.kopya, 15)} Raporu kopyala</button>
    </div>`;
  const oncelik = { 'AÇIK': 0, 'BİLGİ': 1, 'KAPALI': 2, 'SERBEST': 2, 'ATLANDI': 3 };
  /* Sunucu işlevi AÇIK çıkarsa en ciddi bulgu odur (service_role, satır
     güvenliğinin tamamını atlayan tek yer) — diğer bütün AÇIK'ların da üstünde. */
  const oncelikDegeri = s => (s.kim === 'Sunucu işlevi' && s.sonuc === 'AÇIK') ? -1 : (oncelik[s.sonuc] ?? 4);
  const sirali = sonuc.slice().sort((a, b) => oncelikDegeri(a) - oncelikDegeri(b));
  const satirlar = sirali.map(s => {
    const acikMi = s.sonuc === 'AÇIK';
    return `<tr ${acikMi ? 'style="background:var(--red-soft)"' : ''}>
        <td style="padding:6px 8px">${esc(s.kim)}</td>
        <td style="padding:6px 8px">${esc(s.deneme)}</td>
        <td style="padding:6px 8px;${acikMi ? 'color:var(--red);font-weight:600' : ''}">${esc(s.sonuc)}</td>
        <td style="padding:6px 8px;color:var(--ink-soft)">${esc(s.ayrinti || '')}</td>
      </tr>`;
  }).join('');
  const sunucuIslevVar = sonuc.some(s => s.kim === 'Sunucu işlevi');
  const sunucuIslevNotu = sunucuIslevVar ? `<div class="note" style="margin-top:14px">${svg(ICON.info, 15)}
      <span><b>Sunucu işlevi:</b> bu bileşen service_role ile çalışır, yani bütün satır güvenliği
      kurallarını atlar. Buradaki tek koruma fonksiyonun kendi kapısıdır.</span></div>` : '';

  const aTablosu = `<div style="overflow-x:auto;margin-top:10px">
      <table style="width:100%;border-collapse:collapse;font-size:13px">
        <thead><tr style="text-align:left;border-bottom:1px solid var(--line)">
          <th style="padding:6px 8px">Kim</th><th style="padding:6px 8px">Deneme</th>
          <th style="padding:6px 8px">Sonuç</th><th style="padding:6px 8px">Ayrıntı</th></tr></thead>
        <tbody>${satirlar}</tbody>
      </table></div>`;

  let dBolumu = '';
  if (harita && harita.length) {
    const isaret = v => v.indexOf('ölçülemedi') === 0 ? '<span style="color:var(--ink-soft)">—</span> ' + esc(v.replace(/^ölçülemedi\s*[·—]?\s*/, ''))
      : /^(okur|ekler|değiştirir|siler)$/.test(v) ? '<span style="color:var(--basari,#3d9970)">✓</span> ' + esc(v)
      : '<span style="color:var(--ink-soft)">✗</span> ' + esc(v);
    const hSatirlar = harita.map(h => `<tr>
        <td style="padding:6px 8px">${esc(h.tablo)}</td>
        <td style="padding:6px 8px">${isaret(h.okur)}</td>
        <td style="padding:6px 8px">${isaret(h.ekler)}</td>
        <td style="padding:6px 8px">${isaret(h.degistirir)}</td>
        <td style="padding:6px 8px">${isaret(h.siler)}</td>
      </tr>`).join('');
    dBolumu = `<div class="section" style="margin-top:18px"><span class="label">Personel yetki haritası</span>
      <p class="ipucu" style="margin:0 0 10px">Bu bölüm hüküm vermez, durumu gösterir. Programın
        kurallarına göre bazı satırların ✓ olması normaldir. Beklemediğiniz bir ✓ görürseniz bildirin.</p>
      <div style="overflow-x:auto">
        <table style="width:100%;border-collapse:collapse;font-size:13px">
          <thead><tr style="text-align:left;border-bottom:1px solid var(--line)">
            <th style="padding:6px 8px">Tablo</th><th style="padding:6px 8px">Okur</th>
            <th style="padding:6px 8px">Ekler</th><th style="padding:6px 8px">Değiştirir</th>
            <th style="padding:6px 8px">Siler</th></tr></thead>
          <tbody>${hSatirlar}</tbody>
        </table></div></div>`;
  }

  return uyari + semaUyarisi + gocUyarisi + ozet + kalintiUyarisi + kopyalaDugmesi + sunucuIslevNotu + aTablosu + dBolumu;
}

function sihirbaziBaslat(tur, sektorId) {
  /* Sektör bir önceki adımda soruldu; sihirbaz onunla dolu başlıyor.
     Projede sektör metin olarak duruyor, o yüzden adını yazıyoruz. */
  const sk = (DB.sektorler || []).find(x => x.id === sektorId);
  Object.assign(SIHIRBAZ, {
    adim: 1, duzenle: false, projeId: null,
    firma: '', sektor: sk ? sk.ad : '', renk: 'yesil',
    logo: null, logoOnizleme: '',
    gorsel: null, gorselOnizleme: '',
    yetkili: '', telefon: '', eposta: '',
    platform: 'ikisi', veri: 'sifirdan',
    dil: 'tr', para: 'TRY',
    baslangic: bugunTarih(), teslim: '',
    moduller: [], kaydediyor: false,
    tur: tur === 'test' ? 'test' : 'gercek',
  });
  sihirbazAc();
}

/* Firma bilgileri durağına "Düzenle" ile girildiğinde açılan aynı ekran —
   tek fark: proje zaten var, "kaydet" oluşturmuyor, güncelliyor. */
function firmaDuzenleAc(projeId) {
  modalHepsiniKapat();
  const p = DB.proje(projeId);
  if (!p) return;
  Object.assign(SIHIRBAZ, {
    adim: 1, duzenle: true, projeId,
    firma: p.firma || '', telefon: p.telefon || '', eposta: p.eposta || '',
    sektor: p.sektor || '',
    logo: null, logoOnizleme: DB.logoAdres[p.id] || '',
    gorsel: null, gorselOnizleme: gorselAdresi(p, 'G0') || '',
    moduller: [], kaydediyor: false,
  });
  sihirbazAc();
}

/* Sihirbaz tam ekran: alt sayfa değil, kendi ekranı. Uzun formu adımlara
   böldüğümüz için her adım kısa; ekranın dibinde düğmeler sabit duruyor. */
function sihirbazAc() {
  const el = document.createElement('div');
  el.id = 'sihirbaz';
  el.className = 'sihirbaz';
  document.body.appendChild(el);
  sihirbazCiz();
}

function sihirbazKapat() {
  const el = $('#sihirbaz');
  if (!el) return;
  if (SIHIRBAZ.logoOnizleme) URL.revokeObjectURL(SIHIRBAZ.logoOnizleme);
  if (SIHIRBAZ.gorselOnizleme) URL.revokeObjectURL(SIHIRBAZ.gorselOnizleme);
  SIHIRBAZ.logo = null; SIHIRBAZ.logoOnizleme = '';
  SIHIRBAZ.gorsel = null; SIHIRBAZ.gorselOnizleme = '';
  el.classList.remove('acik');
  setTimeout(() => el.remove(), 260);
}

function sihirbazCiz() {
  const el = $('#sihirbaz');
  if (!el) return;
  el.innerHTML = sihirbazHtml();
  sihirbazBagla(el);
  requestAnimationFrame(() => el.classList.add('acik'));
}

const SIHIRBAZ_ADIMLAR = ['Firma', 'Sektör', 'Marka'];

function sihirbazHtml() {
  const govde = SIHIRBAZ.adim === 1 ? sihirbazAdimFirma()
    : SIHIRBAZ.adim === 2 ? sihirbazAdimSektor()
    : sihirbazAdimMarka();

  const geri = SIHIRBAZ.adim > 1
    ? `<button class="btn btn-ghost" data-sb="geri" type="button">← Geri</button>`
    : `<button class="btn btn-ghost" data-sb="kapat" type="button">Vazgeç</button>`;
  const ileri = SIHIRBAZ.adim < SIHIRBAZ_ADIMLAR.length
    ? `<button class="btn btn-primary" data-sb="ileri" type="button"><span>Devam Et →</span></button>`
    : `<button class="btn btn-primary" data-sb="kaydet" type="button">
        <span>${SIHIRBAZ.duzenle ? 'Kaydet ✓' : 'Projeyi Tamamla ✓'}</span></button>`;

  return `
    <div class="sh-tepe">
      <button class="sh-kapat" data-sb="kapat" type="button" aria-label="Kapat">
        ${svg(ICON.kapat, 15)}
      </button>
      <span class="sh-ad">${SIHIRBAZ.duzenle ? 'Firma bilgileri' : 'Yeni Proje'}</span>
    </div>

    <div class="sh-sayfa">
      <div class="sh-icerik">
        ${sihirbazAdimlar(SIHIRBAZ_ADIMLAR, SIHIRBAZ.adim)}
        ${govde}
      </div>

      <div class="sh-dip">${geri}${ileri}</div>
    </div>`;
}

/* Sayaçlı adım göstergesi: geçilen adım tik, şimdiki adım numarasıyla
   dolu, sıradaki soluk. Aynı renk dili "Beta ve geliştirme"deki durum
   rengiyle (sarı) — henüz bitmemiş ama sürüyor. Firma ve Program
   sihirbazları aynı bileşeni kendi adım listesi ve şimdiki adımıyla
   çağırıyor. */
function sihirbazAdimlar(adimlar, simdi) {
  return `<div class="sh-adimlar">${adimlar.map((ad, i) => {
    const n = i + 1;
    const hal = n < simdi ? 'done' : n === simdi ? 'simdi' : '';
    return (i ? '<span class="sh-adim-cizgi"></span>' : '')
      + `<span class="sh-adim ${hal}">
          <span class="sh-adim-no">${hal === 'done' ? svg(ICON.tik, 13) : n}</span>
          <i>${esc(ad)}</i>
        </span>`;
  }).join('')}</div>`;
}

function shBaslik(ikon, baslik, alt) {
  return `
    <div class="sh-bas">
      <span class="sh-rozet">${svg(ikon, 22)}</span>
      <span><h2>${esc(baslik)}</h2><p>${alt}</p></span>
    </div>`;
}

/* shBaslik'in gerçek logolu hâli: rozet kırmızı değil beyaz zeminli —
   logolar kendi rengiyle geliyor, siyah GitHub gibi bir logo kırmızı
   zeminde kaybolurdu. */
function shBaslikServis(servisAd, baslik, alt) {
  return `
    <div class="sh-bas">
      <span class="sh-rozet sh-rozet-servis">${servisIkon(servisAd, 26)}</span>
      <span><h2>${esc(baslik)}</h2><p>${alt}</p></span>
    </div>`;
}

/* 1 · Firma bilgileri — proje kurulurken ayrıca "proje adı" sormuyoruz,
   firma adı burada zaten soruluyor. */
function sihirbazAdimFirma() {
  return shBaslik(ICON.etiket, 'Firma bilgileri',
    'Projenizi oluşturmak için temel bilgileri girelim.') + `
    <label class="field">
      <span>Firma adı</span>
      <input type="text" id="sb-firma" value="${esc(SIHIRBAZ.firma)}"
             placeholder="Örn. Aydın Yapı" autocomplete="off" maxlength="60">
    </label>
    <label class="field">
      <span>Telefon</span>
      <input type="tel" id="sb-telefon" value="${esc(SIHIRBAZ.telefon)}"
             placeholder="0532 000 00 00" autocomplete="off" maxlength="24">
    </label>
    <label class="field">
      <span>E-posta</span>
      <input type="email" id="sb-eposta" value="${esc(SIHIRBAZ.eposta)}"
             placeholder="ornek@firma.com" autocomplete="off" maxlength="80">
    </label>
    <p class="ipucu">Bu bilgiler daha sonra da düzenlenebilir.</p>`;
}

/* 2 · Sektör seçimi — sektöre göre önerilen modüller SIHIRBAZ.moduller'e
   düşüyor, proje o modüllerle kuruluyor. */
function sihirbazAdimSektor() {
  const sektorler = DB.sektorler;
  return shBaslik(ICON.dukkan, 'Sektör seçimi', 'Firmanız hangi sektörde hizmet veriyor?') + `
    <div class="sh-sektor-izgara">
      ${sektorler.map(s => `
        <button type="button" class="sh-sektor ${SIHIRBAZ.sektor === s.ad ? 'on' : ''}"
                data-sb="sektor" data-deger="${esc(s.ad)}">
          ${SIHIRBAZ.sektor === s.ad ? `<span class="sh-sektor-tik">${svg(ICON.tik, 11)}</span>` : ''}
          <span class="sh-sektor-ik">${svg(ICON.dukkan, 17)}</span>
          <span>${esc(s.ad)}</span>
        </button>`).join('')}
      <button type="button" class="sh-sektor sh-sektor-ekle" data-sb="sektor-ekle">
        <span class="sh-sektor-ik">${svg(ICON.arti, 17)}</span>
        <span>Diğer</span>
      </button>
    </div>
    <p class="ipucu">Sektör seçimi, proje şablonlarını ve önerileri size özel hale getirir.</p>`;
}

/* 3 · Marka ve görseller — ikisi de bellekte bekliyor, proje kurulunca
   yükleniyor (dosya adı projenin kimliği, önce id gerekiyor). */
function sihirbazAdimMarka() {
  return shBaslik(ICON.resim, 'Marka ve görseller',
    'Marka kimliğinizi ekleyerek projenizi tamamlayın.') + `
    <span class="fbd-et">Logo</span>
    <button type="button" class="sb-yukle ${SIHIRBAZ.logoOnizleme ? 'dolu' : ''}" data-sb="logo"
      ${SIHIRBAZ.logoOnizleme ? `style="background-image:url('${esc(SIHIRBAZ.logoOnizleme)}')"` : ''}>
      ${SIHIRBAZ.logoOnizleme ? '' : `${svg(ICON.bulut, 20)}<b>Logo yükle</b><i>PNG, JPG (Maks. 5MB)</i>`}
    </button>
    <span class="fbd-et" style="margin-top:16px">İşletme görseli</span>
    <button type="button" class="sb-yukle genis ${SIHIRBAZ.gorselOnizleme ? 'dolu' : ''}" data-sb="gorsel"
      ${SIHIRBAZ.gorselOnizleme ? `style="background-image:url('${esc(SIHIRBAZ.gorselOnizleme)}')"` : ''}>
      ${SIHIRBAZ.gorselOnizleme ? '' : `${svg(ICON.bulut, 20)}<b>İşletme görseli ekle</b><i>Restoran görselleri, menü, vitrin vb.</i>`}
    </button>
    <p class="ipucu">Görseller, projenizin ön yüzünde ve paylaşım alanlarında kullanılacaktır.</p>`;
}

function sihirbazBagla(kutu) {
  const yaz = () => {
    const al = id => { const e = $('#' + id, kutu); return e ? e.value : null; };
    if (al('sb-firma')     !== null) SIHIRBAZ.firma     = al('sb-firma');
    if (al('sb-yetkili')   !== null) SIHIRBAZ.yetkili   = al('sb-yetkili');
    if (al('sb-telefon')   !== null) SIHIRBAZ.telefon   = al('sb-telefon');
    if (al('sb-eposta')    !== null) SIHIRBAZ.eposta    = al('sb-eposta');
    if (al('sb-baslangic') !== null) SIHIRBAZ.baslangic = al('sb-baslangic');
    if (al('sb-teslim')    !== null) SIHIRBAZ.teslim    = al('sb-teslim');
  };

  const ilk = $('#sb-firma', kutu) || $('#sb-yetkili', kutu);
  if (ilk) setTimeout(() => ilk.focus(), 60);

  $$('[data-sb]', kutu).forEach(el => {
    el.addEventListener('click', async () => {
      const t = el.dataset.sb;
      const d = el.dataset.deger;

      if (t === 'kapat') return sihirbazKapat();
      if (t === 'geri')  { yaz(); SIHIRBAZ.adim--; return sihirbazCiz(); }
      if (t === 'ileri') { yaz(); if (!sihirbazDenetle()) return; SIHIRBAZ.adim++; return sihirbazCiz(); }
      if (t === 'kaydet') { yaz(); return sihirbazKaydet(); }
      if (t === 'logo')   return sihirbazLogoSec();
      if (t === 'gorsel') return sihirbazGorselSec();
      if (t === 'sektor-ekle') { yaz(); return sihirbazSektorEkle(); }

      yaz();
      if (t === 'renk')     SIHIRBAZ.renk = d;
      if (t === 'platform') SIHIRBAZ.platform = d;
      if (t === 'veri')     SIHIRBAZ.veri = d;
      if (t === 'sektor') {
        SIHIRBAZ.sektor = SIHIRBAZ.sektor === d ? '' : d;
        /* Sektör değişince önerilen modülleri işaretle — dokunulmamışsa. */
        const s = DB.sektorler.find(x => x.ad === SIHIRBAZ.sektor);
        SIHIRBAZ.moduller = (s && s.moduller) ? s.moduller.slice() : [];
      }
      if (t === 'modul') {
        const i = SIHIRBAZ.moduller.indexOf(d);
        i === -1 ? SIHIRBAZ.moduller.push(d) : SIHIRBAZ.moduller.splice(i, 1);
      }
      sihirbazCiz();
    });
  });
}

/* Adım geçilebilir mi? Yalnızca gerçekten şart olanı soruyoruz. */
function sihirbazDenetle() {
  if (SIHIRBAZ.adim === 1 && !SIHIRBAZ.firma.trim()) {
    toast('Firma adını yaz.');
    return false;
  }
  return true;
}

function sihirbazLogoSec() {
  const alan = document.createElement('input');
  alan.type = 'file';
  alan.accept = 'image/*';
  alan.style.display = 'none';
  document.body.appendChild(alan);

  alan.addEventListener('change', () => {
    const dosya = alan.files && alan.files[0];
    alan.remove();
    if (!dosya) return;
    if (dosya.size > 4 * 1024 * 1024) { toast('Dosya 4 MB\'ı geçmesin.', 'hata'); return; }

    if (SIHIRBAZ.logoOnizleme) URL.revokeObjectURL(SIHIRBAZ.logoOnizleme);
    SIHIRBAZ.logo = dosya;
    SIHIRBAZ.logoOnizleme = URL.createObjectURL(dosya);
    sihirbazCiz();
  });

  alan.click();
}

function sihirbazGorselSec() {
  const alan = document.createElement('input');
  alan.type = 'file';
  alan.accept = 'image/*';
  alan.style.display = 'none';
  document.body.appendChild(alan);

  alan.addEventListener('change', () => {
    const dosya = alan.files && alan.files[0];
    alan.remove();
    if (!dosya) return;
    if (dosya.size > 4 * 1024 * 1024) { toast('Dosya 4 MB\'ı geçmesin.', 'hata'); return; }

    if (SIHIRBAZ.gorselOnizleme) URL.revokeObjectURL(SIHIRBAZ.gorselOnizleme);
    SIHIRBAZ.gorsel = dosya;
    SIHIRBAZ.gorselOnizleme = URL.createObjectURL(dosya);
    sihirbazCiz();
  });

  alan.click();
}

/* Sihirbazın içinden sektör eklemek: listeye girer ve seçili olur. */
async function sihirbazSektorEkle() {
  const ad = await metinSor({
    baslik: 'Yeni sektör',
    aciklama: 'Listeye eklenir; bundan sonraki projelerde de çıkar.',
    yerTutucu: 'Örn. Restoran',
    buton: 'Ekle',
  });
  if (!ad) return;

  try {
    await DB.sektorKaydet(null, { ad: ad.trim() });
    SIHIRBAZ.sektor = ad.trim();
    sihirbazCiz();
    toast(ad.trim() + ' eklendi.', 'basari');
  } catch (h) {
    toast(h.message, 'hata');
  }
}

async function sihirbazKaydet() {
  if (SIHIRBAZ.kaydediyor) return;
  SIHIRBAZ.kaydediyor = true;

  const btn = $('[data-sb="kaydet"] span');
  if (btn) btn.textContent = SIHIRBAZ.duzenle ? 'Kaydediliyor…' : 'Kuruluyor…';

  if (SIHIRBAZ.duzenle) {
    try {
      await DB.projeGuncelle(SIHIRBAZ.projeId, {
        firma:   SIHIRBAZ.firma.trim(),
        telefon: SIHIRBAZ.telefon.trim() || null,
        eposta:  SIHIRBAZ.eposta.trim() || null,
        sektor:  SIHIRBAZ.sektor || null,
      });
      if (SIHIRBAZ.logo) {
        try { await DB.logoYukle(SIHIRBAZ.projeId, SIHIRBAZ.logo); }
        catch (h) { toast('Bilgiler kaydedildi ama logo yüklenemedi — ' + h.message, 'uyari'); }
      }
      if (SIHIRBAZ.gorsel) {
        try {
          const pr = DB.proje(SIHIRBAZ.projeId);
          const pl = (pr && pr.palet) || {};
          /* Eski G0 kaydı varsa üstüne değil, yerine yazılıyor — yoksa
             künyede aynı görsel iki kez listelenirdi. */
          const gorseller = (pl.gorseller || []).filter(g => g.no !== 'G0').concat([{
            no: 'G0', ad: 'İşletme görseli',
            tarif: 'İşletmeyi anlatan görsel — konseptin kaynağı.',
            dosya: 'isletme.jpg', yol: '', boyut: 0, tur: '',
          }]);
          await DB.paletKaydet(SIHIRBAZ.projeId, Object.assign({}, pl, { gorseller }));
          await DB.gorselYukle(SIHIRBAZ.projeId, 'G0', SIHIRBAZ.gorsel);
        } catch (h) {
          toast('Bilgiler kaydedildi ama işletme görseli yüklenemedi — ' + h.message, 'uyari');
        }
      }
      const projeId = SIHIRBAZ.projeId;
      sihirbazKapat();
      toast('Firma bilgileri güncellendi.', 'basari');
      /* Bu durakta tek ekran var; kaydedince burada kalmanın anlamı yok —
         bir sonraki durağın kilidi açılmış olabilir, ana harita dönsün. */
      location.hash = '#/projeler/' + projeId;
      render();
    } catch (e) {
      toast(e.message, 'hata');
      if (btn) btn.textContent = 'Kaydet ✓';
    } finally {
      SIHIRBAZ.kaydediyor = false;
    }
    return;
  }

  try {
    /* Proje modülsüz kuruluyor; modüller "Kurulum ve yapı" durağında
       elle ekleniyor. Modül şablonları kavramı kaldırıldı. */
    const moduller = [];

    const id = await DB.projeOlustur({
      firma: SIHIRBAZ.firma,
      renk: SIHIRBAZ.renk,
      platform: SIHIRBAZ.platform,
      veri: SIHIRBAZ.veri,
      moduller,
      ek: {
        sektor:    SIHIRBAZ.sektor || null,
        yetkili:   SIHIRBAZ.yetkili.trim() || null,
        telefon:   SIHIRBAZ.telefon.trim() || null,
        eposta:    SIHIRBAZ.eposta.trim() || null,
        /* Dil ve para sihirbazda sorulmuyor: varsayılan yazarsak Ürün kartı
           dolu görünür ve kullanıcı hiç bakmaz. Boş kalsın, kart sorsun. */
        dil:       null,
        para:      null,
        baslangic: SIHIRBAZ.baslangic || null,
        teslim:    SIHIRBAZ.teslim || null,
      },
    });

    /* Görülen sürüm burada damgalanıyor: yeni proje bugünün kararlarıyla
       kuruluyor, "yeni karar" rozeti yalnız eski projelerde çıksın.
       Roller artık ne sihirbazda ne Program temeli'nde sorulmuyor —
       "Kullanıcı ekleme ve Yetkilendirme" durağı kurulana kadar hiçbir
       yerde sorulmayacak, o durak gelene kadar proje tek kullanıcılık
       davranır (bkz. PROMPT.yetkiBlogu). */
    try {
      const vp = varsayilanPaket();
      await DB.paletKaydet(id, Object.assign(
        { gorulenSurum: APP.version, projeTuru: SIHIRBAZ.tur || 'gercek' },
        /* Yol haritası burada donuyor — bkz. paketAkisi. */
        vp ? { paket: vp.anahtar, akis: paketinAkisi(vp) } : { akis: 'ozel' }));
    } catch (h) { /* kritik değil, Firma durağından sonra girilebilir */ }

    /* Logo ve işletme görseli ancak proje kurulduktan sonra yüklenebilir:
       dosya adı projenin kimliği. Yükleme patlarsa proje yine duruyor,
       görseller sonradan Firma bilgileri durağından eklenir. */
    if (SIHIRBAZ.logo) {
      try { await DB.logoYukle(id, SIHIRBAZ.logo); }
      catch (h) { toast('Proje kuruldu ama logo yüklenemedi — ' + h.message, 'uyari'); }
    }
    if (SIHIRBAZ.gorsel) {
      try {
        const pr = DB.proje(id);
        const pl = (pr && pr.palet) || {};
        const gorseller = (pl.gorseller || []).concat([{
          no: 'G0', ad: 'İşletme görseli',
          tarif: 'İşletmeyi anlatan görsel — konseptin kaynağı.',
          dosya: 'isletme.jpg', yol: '', boyut: 0, tur: '',
        }]);
        await DB.paletKaydet(id, Object.assign({}, pl, { gorseller }));
        await DB.gorselYukle(id, 'G0', SIHIRBAZ.gorsel);
      } catch (h) { toast('Proje kuruldu ama işletme görseli yüklenemedi — ' + h.message, 'uyari'); }
    }

    sihirbazKapat();
    sayaclariYaz();
    toast(SIHIRBAZ.firma.trim() + ' kuruldu.');
    /* Yeni proje doğrudan kalınan aşamasında açılıyor — ayrı bir proje
       ekranı yok. */
    location.hash = projeAdresi(id);
    render();
  } catch (e) {
    toast(e.message, 'hata');
    if (btn) btn.textContent = 'Projeyi Oluştur';
  } finally {
    SIHIRBAZ.kaydediyor = false;
  }
}

/* ==========================================================================
   PROGRAM TEMELİ — Firma bilgileri sihirbazıyla aynı tam ekran dil, aynı
   `.sihirbaz`/`.sh-*` kalıbı. Kendi durumu ve iskeleti var çünkü soruları
   (paket adı, roller, veri katmanı) SIHIRBAZ'ınkiyle hiç örtüşmüyor.
   ========================================================================== */

const PROGRAM_ADIM = {
  adim: 1, projeId: null,
  modulAdi: '', roller: [], veriKatmani: '', alanTuru: 'githubio',
  kaydediyor: false,
};

const PROGRAM_ADIMLAR = ['Program', 'Katmanlar', 'Veriler', 'Alan adı'];

function programDuzenleAc(projeId) {
  modalHepsiniKapat();
  const p = DB.proje(projeId);
  if (!p) return;
  const pl = p.palet || {};
  const varsayilan = (TEKNIK_ALAN.find(x => x.anahtar === 'veriKatmani') || {}).varsayilan;
  Object.assign(PROGRAM_ADIM, {
    adim: 1, projeId,
    modulAdi: pl.modulAdi || '',
    roller: rolListesi(pl.roller),
    veriKatmani: pl.veriKatmani || varsayilan,
    alanTuru: pl.alanTuru === 'namecheap' ? 'namecheap' : 'githubio',
    kaydediyor: false,
  });
  const el = document.createElement('div');
  el.id = 'program-adim';
  el.className = 'sihirbaz';
  document.body.appendChild(el);
  programAdimCiz();
}

function programAdimKapat() {
  const el = $('#program-adim');
  if (!el) return;
  el.classList.remove('acik');
  setTimeout(() => el.remove(), 260);
}

function programAdimCiz() {
  const el = $('#program-adim');
  if (!el) return;
  el.innerHTML = programAdimHtml();
  programAdimBagla(el);
  requestAnimationFrame(() => el.classList.add('acik'));
}

function programAdimHtml() {
  const govde = PROGRAM_ADIM.adim === 1 ? programAdim1()
    : PROGRAM_ADIM.adim === 2 ? programAdimKatman()
    : PROGRAM_ADIM.adim === 3 ? programAdim3()
    : programAdim4();

  const geri = PROGRAM_ADIM.adim > 1
    ? `<button class="btn btn-ghost" data-pa="geri" type="button">← Geri</button>`
    : `<button class="btn btn-ghost" data-pa="kapat" type="button">Vazgeç</button>`;
  const ileri = PROGRAM_ADIM.adim < PROGRAM_ADIMLAR.length
    ? `<button class="btn btn-primary" data-pa="ileri" type="button"><span>Devam Et →</span></button>`
    : `<button class="btn btn-primary" data-pa="kaydet" type="button"><span>Kaydet ✓</span></button>`;

  return `
    <div class="sh-tepe">
      <button class="sh-kapat" data-pa="kapat" type="button" aria-label="Kapat">
        ${svg(ICON.kapat, 15)}
      </button>
      <span class="sh-ad">Program temeli</span>
    </div>

    <div class="sh-sayfa">
      <div class="sh-icerik">
        ${sihirbazAdimlar(PROGRAM_ADIMLAR, PROGRAM_ADIM.adim)}
        ${govde}
      </div>

      <div class="sh-dip">${geri}${ileri}</div>
    </div>`;
}

/* 1 · Program adı */
function programAdim1() {
  return shBaslik(ICON.katman, 'Program adı', 'Bu paketin/uygulamanın adı ne olacak?') + `
    <label class="field">
      <span>Program adı</span>
      <input type="text" id="pa-modul" value="${esc(PROGRAM_ADIM.modulAdi)}"
             placeholder="Örn. Muhasebe" autocomplete="off" maxlength="60">
    </label>
    <p class="ipucu">Bu ad prompt ve kimlik dosyasında kullanılacak.</p>`;
}

/* 2 · Katmanlar — kaç katman olacak, isimleri ne. En üstteki her zaman
   "Admin": ilk kullanıcı hesabı bu adla açılacak (bkz. Bağlantılar ve
   temel), o yüzden burada da sabit ve salt okunur (bkz. rolMerdiveni). */
function programAdimKatman() {
  return shBaslik(ICON.gGuvenlik, 'Kaç katman olacak?',
      'Kim kullanacak? İlk kullanıcı hesabı en üstteki (Admin) katmanla açılacak.')
    + rolMerdiveni(PROGRAM_ADIM.roller, 'program');
}

/* 3 · Veriler nerede — yalnız karar. Supabase seçilirse gerçek bağlantı
   (adres+anon key) Bağlantılar ve temel durağında giriliyor; ikisini aynı
   yerde sormak "Bağlantılar" durağının işini burada tekrarlamak olurdu. */
/* Seçeneklerin artı/eksileri sabit metin: TEKNIK_ALAN'daki veriKatmani
   seçimi zaten yalnız bu iki değeri veriyor (config.js'de tanımlı, kullanıcı
   ekleyip çıkaramıyor), o yüzden burada elle yazmak kırılgan değil. */
const VERI_KATMANI_KARTI = {
  'Supabase (bulut)': {
    servis: 'supabase', ikon: 'bulut', renk: '#3ecf8e', onerilen: true,
    ozellikler: [
      { iyi: true, yazi: 'Her yerden erişim' },
      { iyi: true, yazi: 'Gerçek zamanlı veri' },
      { iyi: true, yazi: 'Yedekleme ve güvenlik' },
      { iyi: true, yazi: 'Bağlantılar ve temel\'de otomatik kurulum' },
    ],
  },
  'Yerel tarayıcı': {
    ikon: 'katman', renk: '#7d93b8', onerilen: false,
    ozellikler: [
      { iyi: false, yazi: 'Sadece bu cihazda çalışır' },
      { iyi: false, yazi: 'Gerçek zamanlı yok' },
      { iyi: false, yazi: 'Sunucu gerektirmez' },
      { iyi: false, yazi: 'Teknik kurulum gerekebilir' },
    ],
  },
};

function programAdim3() {
  const alan = TEKNIK_ALAN.find(x => x.anahtar === 'veriKatmani') || {};
  const secili = PROGRAM_ADIM.veriKatmani;
  return shBaslik(ICON.gVeri, 'Veriler nerede duracak?', alan.alt || '') + `
    <div class="pa-veri-liste">
      ${(alan.secim || []).map(x => {
        const k = VERI_KATMANI_KARTI[x] || { ikon: 'katman', renk: '#7d93b8', ozellikler: [] };
        return `
        <label class="pa-veri-kart ${secili === x ? 'on' : ''}" style="--ki:${k.renk}"
               data-pa="veri" data-deger="${esc(x)}">
          <span class="pa-veri-ust">
            <span class="pa-veri-ik${k.servis ? ' servis' : ''}">${
              k.servis ? servisIkon(k.servis, 20) : svg(ICON[k.ikon], 18)}</span>
            <span class="pa-veri-ad">${esc(x)}</span>
            ${k.onerilen ? '<span class="pa-veri-rozet">Önerilen</span>' : ''}
            <span class="pa-veri-radyo"></span>
          </span>
          <span class="pa-veri-oz-liste">
            ${k.ozellikler.map(o => `<span class="pa-veri-oz ${o.iyi ? 'iyi' : 'kotu'}">
              ${svg(o.iyi ? ICON.tik : ICON.kapat, 11)} ${esc(o.yazi)}</span>`).join('')}
          </span>
        </label>`;
      }).join('')}
    </div>
    ${secili !== 'Yerel tarayıcı' ? `<p class="ipucu">Supabase bağlantısını (proje adresi, anon key)
      bir sonraki durakta — <b>Bağlantılar ve temel</b>'de — gireceksin.</p>` : ''}`;
}

/* 3 · Alan adı — yalnız karar. Namecheap seçilirse gerçek DNS kaydı ve alan
   adı Bağlantılar ve temel durağındaki Namecheap karesinde giriliyor; bu
   karar olmadan Bağlantılar kaç kare göstereceğini bilemiyor. */
const ALAN_TURU_KARTI = {
  githubio: {
    ad: 'Sadece github.io', servis: 'github', ikon: 'bulut', renk: '#3ecf8e', onerilen: true,
    ozellikler: [
      { iyi: true, yazi: 'Hiç kurulum gerektirmez' },
      { iyi: true, yazi: 'Testler için hızlı' },
      { iyi: false, yazi: 'Adres uzun (...github.io/proje)' },
    ],
  },
  namecheap: {
    ad: 'Namecheap ile özel alan adı', servis: 'namecheap', ikon: 'dil', renk: '#c48a5c', onerilen: false,
    ozellikler: [
      { iyi: true, yazi: 'Kendi alan adın (örn. firma.com)' },
      { iyi: true, yazi: 'Müşteriye teslimde daha profesyonel' },
      { iyi: false, yazi: 'DNS kaydı gerekir, 10-30 dk sürebilir' },
    ],
  },
};

function programAdim4() {
  const secili = PROGRAM_ADIM.alanTuru;
  return shBaslik(ICON.dil, 'Alan adı nasıl olacak?',
    'Uygulama hangi adresten açılacak? Sonra istersen değiştirebilirsin.') + `
    <div class="pa-veri-liste">
      ${Object.keys(ALAN_TURU_KARTI).map(k => {
        const kart = ALAN_TURU_KARTI[k];
        return `
        <label class="pa-veri-kart ${secili === k ? 'on' : ''}" style="--ki:${kart.renk}"
               data-pa="alan-turu" data-deger="${esc(k)}">
          <span class="pa-veri-ust">
            <span class="pa-veri-ik${kart.servis ? ' servis' : ''}">${
              kart.servis ? servisIkon(kart.servis, 20) : svg(ICON[kart.ikon], 18)}</span>
            <span class="pa-veri-ad">${esc(kart.ad)}</span>
            ${kart.onerilen ? '<span class="pa-veri-rozet">Önerilen</span>' : ''}
            <span class="pa-veri-radyo"></span>
          </span>
          <span class="pa-veri-oz-liste">
            ${kart.ozellikler.map(o => `<span class="pa-veri-oz ${o.iyi ? 'iyi' : 'kotu'}">
              ${svg(o.iyi ? ICON.tik : ICON.kapat, 11)} ${esc(o.yazi)}</span>`).join('')}
          </span>
        </label>`;
      }).join('')}
    </div>
    <p class="ipucu">${secili === 'namecheap'
      ? 'Namecheap DNS kaydını bir sonraki durakta — Bağlantılar ve temel\'de — gireceksin.'
      : 'Adres depo bağlanınca kendiliğinden yazılacak, ayrıca bir şey girmene gerek yok.'}</p>`;
}

function programAdimBagla(kutu) {
  const yaz = () => {
    const al = id => { const e = $('#' + id, kutu); return e ? e.value : null; };
    if (al('pa-modul') !== null) PROGRAM_ADIM.modulAdi = al('pa-modul');
    if ($('.rol-kat', kutu)) PROGRAM_ADIM.roller = rolOku(kutu);
  };

  rolBagla(kutu);

  const ilk = $('#pa-modul', kutu);
  if (ilk) setTimeout(() => ilk.focus(), 60);

  $$('[data-pa]', kutu).forEach(el => {
    el.addEventListener('click', () => {
      const t = el.dataset.pa;
      const d = el.dataset.deger;

      if (t === 'kapat')  return programAdimKapat();
      if (t === 'geri')   { yaz(); PROGRAM_ADIM.adim--; return programAdimCiz(); }
      if (t === 'ileri')  { yaz(); if (!programAdimDenetle()) return; PROGRAM_ADIM.adim++; return programAdimCiz(); }
      if (t === 'kaydet') { yaz(); return programAdimKaydet(); }

      yaz();
      if (t === 'veri')      PROGRAM_ADIM.veriKatmani = d;
      if (t === 'alan-turu') PROGRAM_ADIM.alanTuru     = d;
      programAdimCiz();
    });
  });
}

/* Adım geçilebilir mi? Yalnızca gerçekten şart olanı soruyoruz. */
function programAdimDenetle() {
  if (PROGRAM_ADIM.adim === 1 && !PROGRAM_ADIM.modulAdi.trim()) {
    toast('Program adını yaz.');
    return false;
  }
  return true;
}

async function programAdimKaydet() {
  if (PROGRAM_ADIM.kaydediyor) return;
  PROGRAM_ADIM.kaydediyor = true;

  const btn = $('[data-pa="kaydet"] span');
  if (btn) btn.textContent = 'Kaydediliyor…';

  try {
    /* Pencere açık dururken arka planda başka bir kayıt olabilir; projenin
       o anki hâlini tazeleyip üzerine yazıyoruz, açılış anının görüntüsünü
       değil. */
    const guncel = DB.proje(PROGRAM_ADIM.projeId);
    const palet = Object.assign({}, (guncel && guncel.palet) || {});
    palet.modulAdi = PROGRAM_ADIM.modulAdi.trim();
    palet.roller = PROGRAM_ADIM.roller;
    palet.veriKatmani = PROGRAM_ADIM.veriKatmani;
    /* Yerel'e dönülünce eski Supabase bağlantısı da anlamsızlaşıyor —
       kararı burada değiştirdik, kalıntı bağlantıyı da burada temizliyoruz.
       Supabase seçilirse bağlantı Bağlantılar ve temel durağında giriliyor. */
    if (PROGRAM_ADIM.veriKatmani === 'Yerel tarayıcı') {
      delete palet.supabaseUrl;
      delete palet.supabaseAnon;
    }
    /* github.io'ya dönülünce eski Namecheap bağlantısı da anlamsızlaşıyor —
       adres depo bağlanınca kendiliğinden yeniden yazılacak. */
    if (PROGRAM_ADIM.alanTuru !== 'namecheap' && palet.namecheapBaglandi) {
      delete palet.alanAdi;
      delete palet.namecheapBaglandi;
    }
    palet.alanTuru = PROGRAM_ADIM.alanTuru;

    const projeId = PROGRAM_ADIM.projeId;
    await DB.paletKaydet(projeId, palet);
    programAdimKapat();
    toast('Program temeli kaydedildi.', 'basari');
    /* Bu durakta tek ekran var; kaydedince burada kalmanın anlamı yok —
       bir sonraki durağın kilidi açılmış olabilir, ana harita dönsün. */
    location.hash = '#/projeler/' + projeId;
    render();
  } catch (h) {
    toast(h.message, 'hata');
    if (btn) btn.textContent = 'Kaydet ✓';
  } finally {
    PROGRAM_ADIM.kaydediyor = false;
  }
}

/* ==========================================================================
   BAĞLANTILAR VE TEMEL — her bağlantı kendi tam ekran adımında. Aynı
   `.sihirbaz`/`.sh-*` kalıbı, ama adım şeridi sayı değil servis ikonu
   gösteriyor (bilerek ayrı bir çizim — sihirbazAdimlar'ı genelleştirmek
   risk, bu ayrı ve küçük). GitHub/Yayın adımları DEPO_BEKLIYOR/
   PAGES_BEKLIYOR ile çalışıyor: sekmeden dönünce yeşile hemen dönmüyor,
   önce bir onay kutusu çıkıyor — "Bağlandı/Yayında" demek kullanıcıya
   kalıyor, Studio depoya bakıp doğrulayamıyor çünkü. Supabase/Namecheap
   gerçek veri istediği için kendi alanları ve "Kaydet" düğmesiyle burada
   duruyor.
   ========================================================================== */

const BAGLANTI_ADIM = { adim: 1, projeId: null, liste: [] };

const BAGLANTI_ETIKET = { github: 'GitHub', claude: 'Claude', pages: 'Yayın', supabase: 'Supabase',
  sql: 'Veritabanı', namecheap: 'Namecheap' };
/* Yayın adımının kendi servisi yok — hâlâ GitHub, o yüzden aynı logo.
   SQL adımı da Supabase logosunu paylaşıyor. */
const BAGLANTI_SERVIS = { github: 'github', claude: 'claude', pages: 'github', supabase: 'supabase',
  sql: 'supabase', namecheap: 'namecheap' };

/* Yayın (GitHub Pages) bilerek Claude'dan SONRA geliyor: Claude görevini
   bitirmeden siteyi yayına almanın anlamı yok. Depo bağlama ile yayın
   eskiden aynı adımdaydı, sıra yüzünden ayrıldı. */
function baglantiAdimListesi(p) {
  const pl = p.palet || {};
  /* Şablon kopyasında Claude BİLEREK EN SONA alınıyor: GitHub/Yayın/(varsa)
     Supabase/Namecheap bilgisi önce toplanmalı ki Claude'a bağlanınca
     "tanışma" promptu (bkz. PROMPT.sablonTanisma) bu bilgilerin hepsini
     tek seferde ortama yazsın. Normal projede sıra tersi: Claude erken
     bağlanır, Yayın ise kod yazılmadan anlamsız olduğu için sonra gelir. */
  if (sablonMu(p)) {
    const liste = ['github', 'pages'];
    if (sunuculuMu(p)) {
      liste.push('supabase');
      /* Template'e bir SQL tanımlıysa (link ya da metin, bkz. Templateler >
         kurulum sihirbazı) Supabase bağlanır bağlanmaz burada çalıştırılıyor.
         Template'in SQL'inde auth/kullanıcı hiç yok (bkz. göç 89 —
         "giriş ve yetki kaldırıldı") — ilk giriş, normal projelerdeki gibi
         ilk kurulum promptunun kendi bootstrap girişinden geliyor (bkz.
         yetkiBlogu), ayrı bir "İlk kullanıcı" adımına gerek yok. */
      if (pl.sablonSqlMetinVar) liste.push('sql');
    }
    if (pl.alanTuru === 'namecheap') liste.push('namecheap');
    liste.push('claude');
    return liste;
  }
  const liste = ['github', 'claude', 'pages'];
  if (sunuculuMu(p)) liste.push('supabase');
  if (pl.alanTuru === 'namecheap') liste.push('namecheap');
  return liste;
}

function baglantiAdimBittiMi(k, p) {
  const pl = p.palet || {};
  if (k === 'github')       return !!p.repo;
  if (k === 'claude')       return claudeBaglandiMi(p);
  if (k === 'pages')        return !!pl.yayinda;
  if (k === 'supabase')     return !!String(pl.supabaseUrl || '').trim() && !!String(pl.supabaseAnon || '').trim();
  if (k === 'sql')          return !!pl.sqlYuklendi;
  if (k === 'namecheap')    return !!pl.namecheapBaglandi;
  return false;
}

function baglantiDuzenleAc(projeId) {
  modalHepsiniKapat();
  const p = DB.proje(projeId);
  if (!p) return;
  Object.assign(BAGLANTI_ADIM, { adim: 1, projeId, liste: baglantiAdimListesi(p) });
  const el = document.createElement('div');
  el.id = 'baglanti-adim';
  el.className = 'sihirbaz';
  document.body.appendChild(el);
  baglantiAdimCiz();
}

function baglantiAdimKapat() {
  const el = $('#baglanti-adim');
  if (!el) return;
  el.classList.remove('acik');
  setTimeout(() => el.remove(), 260);
}

/* Kimlik: pencere açıkken arkadaki veri değişirse (GitHub'dan dönüş, prompt
   kopyalama, Supabase/Namecheap kaydı) bu fonksiyon çağrılıp adım yerinde
   yenileniyor — `render()` yalnız `#view`'i çiziyor, pencere ayrı katmanda. */
function baglantiAdimCiz() {
  const el = $('#baglanti-adim');
  if (!el) return;
  const p = DB.proje(BAGLANTI_ADIM.projeId);
  if (!p) return baglantiAdimKapat();
  if (BAGLANTI_ADIM.adim > BAGLANTI_ADIM.liste.length) BAGLANTI_ADIM.adim = BAGLANTI_ADIM.liste.length;
  el.innerHTML = baglantiAdimHtml(p);
  baglantiAdimBagla(el, p);
  requestAnimationFrame(() => el.classList.add('acik'));
}

function baglantiAdimlarSerit(liste, simdi, p) {
  return `<div class="sh-adimlar">${liste.map((k, i) => {
    const n = i + 1;
    const bitti = baglantiAdimBittiMi(k, p);
    const hal = bitti ? 'done' : n === simdi ? 'simdi' : '';
    const ikon = bitti
      ? `<span class="sh-adim-no">${svg(ICON.tik, 13)}</span>`
      : `<span class="sh-adim-no servis">${servisIkon(BAGLANTI_SERVIS[k], 18)}</span>`;
    return (i ? '<span class="sh-adim-cizgi"></span>' : '')
      + `<span class="sh-adim ${hal}">${ikon}<i>${esc(BAGLANTI_ETIKET[k])}</i></span>`;
  }).join('')}</div>`;
}

function baglantiAdimHtml(p) {
  const liste = BAGLANTI_ADIM.liste;
  const k = liste[BAGLANTI_ADIM.adim - 1];
  const govde = k === 'github' ? baglantiAdimGithub(p)
    : k === 'claude' ? baglantiAdimClaude(p)
    : k === 'pages' ? baglantiAdimPages(p)
    : k === 'supabase' ? baglantiAdimSupabase(p)
    : k === 'sql' ? baglantiAdimSql(p)
    : baglantiAdimNamecheap(p);

  const geri = BAGLANTI_ADIM.adim > 1
    ? `<button class="btn btn-ghost" data-ba="geri" type="button">← Geri</button>`
    : `<button class="btn btn-ghost" data-ba="kapat" type="button">Vazgeç</button>`;
  const ileri = BAGLANTI_ADIM.adim < liste.length
    ? `<button class="btn btn-primary" data-ba="ileri" type="button"><span>Devam Et →</span></button>`
    : `<button class="btn btn-primary" data-ba="kapat" type="button"><span>Bitti ✓</span></button>`;

  return `
    <div class="sh-tepe">
      <button class="sh-kapat" data-ba="kapat" type="button" aria-label="Kapat">
        ${svg(ICON.kapat, 15)}
      </button>
      <span class="sh-ad">Bağlantılar ve temel</span>
    </div>

    <div class="sh-sayfa">
      <div class="sh-icerik">
        ${baglantiAdimlarSerit(liste, BAGLANTI_ADIM.adim, p)}
        ${govde}
      </div>

      <div class="sh-dip">${geri}${ileri}</div>
    </div>`;
}

/* Küçük yeşil tik listesi — mockup'taki gibi ama artı/eksi ayrımı yok,
   burada hepsi zaten avantaj. */
function baOzellikler(liste) {
  return `<div class="ba-oz-liste">${liste.map(x =>
    `<span class="ba-oz">${svg(ICON.tik, 12)} ${esc(x)}</span>`).join('')}</div>`;
}

function baDurum(baslik, alt) {
  return `
    <div class="ba-durum">
      <span class="ba-durum-ik">${svg(ICON.tik, 15)}</span>
      <span><b>${esc(baslik)}</b>${alt ? `<i>${esc(alt)}</i>` : ''}</span>
    </div>`;
}

/* 1 · GitHub — yalnız depo bağlama. Yayına alma (Pages) eskiden aynı
   adımdaydı; Claude'dan sonraya alınınca ayrı adım oldu (bkz. aşağıdaki
   Yayın adımı). Sekmeden dönünce DEPO_BEKLIYOR üzerinden bir onay kutusu
   çıkıyor — depo adresi ancak kullanıcı "Bağlandı" deyince yazılıyor. */
function baglantiAdimGithub(p) {
  const pl   = p.palet || {};
  const slug = depoSlug(p.repo);
  const depo = !!p.repo;

  /* Kopya projede depo de "aynısından" kurulmalı. GitHub'ın "generate"
     (şablon) yolu en hızlısı — token istemez — ama kaynak depo GitHub'da
     "Template repository" işaretli olmalı (Settings → General, kalıcı ve
     zararsız bir ayar, bir kere yapılır). İşaretli değilse GitHub sessizce
     boş bir "New repository" ekranına düşürür; o durumda çıkış yolu İçe
     Aktar (Import) — ama o bir erişim token'ı ister. İkisinde de "Repository
     name" alanı boş geliyor (GitHub `name=` parametresini bu sayfada kabul
     etmiyor) — isim buradan kopyalanıp elle yapıştırılmalı. */
  const kaynak     = pl.kopyaKaynagi ? DB.proje(pl.kopyaKaynagi) : null;
  const kaynakSlug = kaynak ? depoSlug(kaynak.repo) : '';
  const kopyaMi    = !depo && !!kaynakSlug;
  const yeniAd     = depoAdi(p);

  const depoAdresi = depo
    ? 'https://github.com/' + esc(slug)
    : kopyaMi
      ? 'https://github.com/' + esc(kaynakSlug) + '/generate'
      : 'https://github.com/new?name=' + encodeURIComponent(yeniAd)
        + '&description=' + encodeURIComponent(projeAdi(p) + ' · NIZAM Studio')
        + '&visibility=private';

  const durum = depo ? baDurum('Bağlantı kuruldu', slug) : '';
  const buton = depo ? '' : `<a class="sayfa-dug" target="_blank" rel="noopener" data-depo-ac="${p.id}" href="${depoAdresi}">
      ${svg(ICON.dal, 15)} ${kopyaMi ? 'GitHub\'a bağlan ve kopyala' : 'GitHub\'da depo aç'}</a>`;

  /* Studio depoya bakamıyor: depo gerçekten açıldı mı, kullanıcı söylüyor.
     Tek düğme — "oldu mu?" diye sormak, iki seçenek koymak ve sekmeden
     dönmeyi beklemek fazlalıktı; işaretlemeyen zaten devam edemiyor. */
  const onayKutusu = depo ? '' : `
    <button class="sayfa-dug ikincil" type="button"
            data-eylem="depo-baglandi-onay" data-proje="${p.id}">
      ${svg(ICON.tik, 15)} Bağlandı olarak işaretle</button>`;

  const kopyaSatir = (etiket, deger) => `
    <div class="ak-s">
      <span class="ak-et">${esc(etiket)}</span>
      <span class="ak-dg mono">${esc(deger)}</span>
      <button class="ak-kop" type="button" data-ak-kopya="${esc(deger)}"
              aria-label="${esc(etiket)} kopyala">${svg(ICON.kopya, 12)}</button>
    </div>`;

  const kopyaRehberi = !kopyaMi ? '' : `
    <div class="fb-kart" style="--kr:#5fb37f">
      ${kopyaSatir('Yeni depo adı', yeniAd)}
      ${kopyaSatir('Kaynak depo', kaynakSlug)}
    </div>
    <div class="fbd-not">${svg(ICON.info, 13)}
      <span>Açılan sayfada <b>Repository name</b> alanına yukarıdaki <b>yeni depo adı</b>nı
      yapıştır (GitHub kendisi doldurmuyor), sonra <b>Create repository</b> de. GitHub
      template kabul etmezse (kaynak depo işaretli değildir) boş bir sayfa açar; o zaman
      kaynak depo adresini kopyalayıp GitHub'daki
      <a href="https://github.com/new/import" target="_blank" rel="noopener">İçe Aktar</a>
      ekranına yapıştır (bu bir erişim token'ı ister).</span></div>`;

  return shBaslikServis('github', kopyaMi ? 'GitHub\'a bağlan ve kopyala' : 'GitHub\'a bağlan',
    'Kodun barındığı yer. Depo bağlanınca Claude Code buradan görev alır.')
    + durum + buton + kopyaRehberi + onayKutusu
    + baOzellikler([
      'Kod güvenle, sürüm geçmişiyle saklanır',
      'Claude Code görevleri buradan alır',
      'Yayına alma, Claude görevi bitirince bir sonraki adımlarda',
    ]);
}

/* 2 · Claude — düğme tanışma promptunu panoya yazıp Claude'u aynı anda
   açıyor (data-pano + gerçek bağlantı), araya pencere girmiyor. */
function baglantiAdimClaude(p) {
  if (!p.repo) {
    return shBaslikServis('claude', 'Claude\'a bağlan', '')
      + `<p class="ipucu">Önce GitHub adımından depo bağlanmalı.</p>`;
  }

  /* Tek düğme metni panoya yazıp Claude'u açıyor, ikincisi "yaptım" diyor.
     Sohbete ad verme kutusu kalktı: ad hiçbir yerde kullanılmıyordu, yalnız
     bir adım daha ekliyordu. */
  return shBaslikServis('claude', 'Claude\'a bağlan', '')
    + `<a class="sayfa-dug" target="_blank" rel="noopener"
         href="${esc(claudeAdresi(depoSlug(p.repo)))}"
         data-pano="tanisma" data-proje="${p.id}">
        ${svg(ICON.kopya, 15)} Kopyala ve Claude'u aç</a>
      <button class="sayfa-dug ikincil" type="button" style="margin-top:10px"
              data-eylem="claude-baglandi" data-proje="${p.id}">
        ${svg(ICON.tik, 15)} Bağlandı olarak işaretle</button>`;
}

/* Claude bağlantısı kuruldu mu? Eskiden sohbet adına bakıyordu; ad kalkınca
   kullanıcının işaretine bakıyor. Eski projelerde ad varsa o da sayılıyor. */
function claudeBaglandiMi(p) {
  const pl = (p && p.palet) || {};
  return !!pl.claudeBaglandi || !!String(pl.sohbetAdi || '').trim();
}/* 3 · Yayın (GitHub Pages) — bilerek Claude'dan sonra: kod daha
   yazılmadan siteyi yayına almanın anlamı yok. Sekmeden dönünce
   PAGES_BEKLIYOR üzerinden bir onay kutusu çıkıyor — "yayında" ancak
   kullanıcı onaylayınca yazılıyor (bkz. pagesBaglandiOnayla). */
function baglantiAdimPages(p) {
  const pl   = p.palet || {};
  const slug = depoSlug(p.repo);
  const alan = String(pl.alanAdi || '').trim();

  if (!p.repo) {
    return shBaslikServis('github', 'Yayına al', '')
      + `<p class="ipucu">Önce GitHub adımından depo bağlanmalı.</p>`;
  }

  /* GitHub ve Claude adımlarıyla aynı kalıp: bir koyu düğme işi açıyor,
     altındaki açık düğme "yaptım" diyor. */
  return shBaslikServis('github', 'Yayına al', '')
    + `<a class="sayfa-dug" target="_blank" rel="noopener" data-pages-ac="${p.id}"
         ${alan ? `data-alan-kopya="${esc(alan)}"` : ''}
         href="https://github.com/${esc(slug)}/settings/pages">
        ${svg(ICON.dal, 15)} Yayın ayarlarını aç</a>
      <button class="sayfa-dug ikincil" type="button" style="margin-top:10px"
              data-eylem="pages-baglandi-onay" data-proje="${p.id}">
        ${svg(ICON.tik, 15)} Yayına alındı olarak işaretle</button>`;
}
/* 4 · Supabase — gerçek adres ve anahtar, otomatik algılanamaz; alanlar
   burada, "Kaydet" `supabase-baglan` eylemine gidiyor. */
function baglantiAdimSupabase(p) {
  const pl  = p.palet || {};
  const url = String(pl.supabaseUrl || '').trim();
  const key = String(pl.supabaseAnon || '').trim();
  const org = supabaseOrg();

  /* Organizasyon kodu Ayarlar'da yazılıysa doğrudan o organizasyonda proje
     açma ekranına düşüyoruz. */
  const acHref = org
    ? 'https://supabase.com/dashboard/new/' + encodeURIComponent(org)
    : 'https://supabase.com/dashboard/new';

  return shBaslikServis('supabase', 'Supabase\'e bağlan', '')
    + `<a class="sayfa-dug" target="_blank" rel="noopener" href="${esc(acHref)}">
        ${svg(ICON.bulut, 15)} Supabase'de proje aç</a>
      <span class="fm-kutu" style="margin:10px 0 8px">
        <span class="fm-ik">${svg(ICON.bulut, 16)}</span>
        <input class="fm-gir" type="text" id="ba-sb-url" value="${esc(url)}"
               placeholder="Proje adresi (https://xxxx.supabase.co)"
               autocomplete="off" spellcheck="false" autocapitalize="off">
      </span>
      <span class="fm-kutu" style="margin-bottom:10px">
        <span class="fm-ik">${svg(ICON.anahtar, 16)}</span>
        <input class="fm-gir" type="text" id="ba-sb-key" value="${esc(key)}"
               placeholder="anon key" autocomplete="off" spellcheck="false"
               autocapitalize="off">
      </span>
      <button class="sayfa-dug ikincil" type="button"
              data-eylem="supabase-baglan" data-proje="${p.id}">
        ${svg(ICON.tik, 15)} Bağlandı olarak işaretle</button>`;
}
/* Şablon kopyalarına özel ara adım: template'in hazır SQL'i (bkz. Templateler
   > Kurulum SQL'i) yeni Supabase projesine yükleniyor. Metin üç parça
   halinde template'in kaydından okunuyor. */
function baglantiAdimSql(p) {
  const pl = p.palet || {};
  const metinVar = !!pl.sablonSqlMetinVar;
  const yuklendi = !!pl.sqlYuklendi;

  /* SQL metin olarak saklanıyor; depolarımız private olduğu için
     "GitHub'daki dosyayı aç" yolu kaldırıldı. Metin üç parça halinde
     (bkz. sql/19-sablon-sql-parca.sql) — sırayla kopyalanıp çalıştırılır. */
  const parcaSirasi = ['1.', '2.', '3.'];
  const govde = metinVar ? `
      ${parcaSirasi.map((etiket, i) => `
      <div class="kur-dug" style="margin-top:${i === 0 ? 0 : 8}px">
        <button class="sayfa-dug ${i === 2 ? '' : 'ikincil'}" type="button"
                data-eylem="sablon-sql-metin-kopyala" data-parca="${i + 1}" data-proje="${p.id}">
          ${svg(ICON.kopya, 15)} ${etiket} parçayı kopyala</button>
        ${i === 2 ? `<button class="sayfa-dug ikincil" type="button" data-eylem="sablon-sql-metin-kontrol"
                data-proje="${p.id}">${svg(ICON.info, 15)} Kayıtlı göç kaç?</button>` : ''}
      </div>`).join('')}
      <div class="fbd-not">${svg(ICON.info, 13)}
        <span>Her parça panoya kopyalanır — Supabase projendeki <b>SQL Editor</b>'e
        sırayla yapıştır ve çalıştır (Run): önce 1., bitince 2., sonra 3.</span></div>`
    : `<div class="note uyari">${svg(ICON.uyari, 15)}
        <span>Bu template için SQL tanımlanmamış — Templateler'den ekleyebilirsin.</span></div>`;

  return shBaslikServis('supabase', 'Veritabanını kur',
      'Template\'in hazır tablo ve kurallarını yeni Supabase projene yükle.')
    + govde
    + ((metinVar || link) ? `
        <label class="kur-onay ${yuklendi ? 'on' : ''}" data-eylem="sql-yuklendi-onay"
               data-proje="${p.id}" role="button" tabindex="0">
          <span class="kur-kutu">${svg(ICON.tik, 12)}</span> ${metinVar ? 'Üç parçayı da yükledim' : 'SQL\'i yükledim'}</label>` : '');
}

/* 5 · Namecheap — DNS kaydı + alan adı, eskiden ayrı bir pencereydi
   (`alanKaydiPenceresi`), şimdi adımın kendisi. "Alan adını yaz"
   `namecheap-baglan` eylemine gidiyor. */
function baglantiAdimNamecheap(p) {
  const pl  = p.palet || {};
  const kok = kokAlan();

  if (!kok) {
    return shBaslikServis('namecheap', 'Namecheap ile alan adı',
      'Programın kendi adresinden açılması için DNS kaydı ve alan adı.')
      + `<div class="note uyari">${svg(ICON.uyari, 15)}
          <span>Önce <a href="#/ayarlar">Ayarlar</a>'da kök alan adını yaz.</span></div>`;
  }

  const alt    = altAlan(p);
  const tam    = onerilenAlanAdi(p);
  const hedef  = (depoSahibi() || 'kullaniciadin').toLowerCase() + '.github.io';
  const alanAdi = String(pl.alanAdi || '').trim();
  const baglandi = !!pl.namecheapBaglandi;

  const satir = (etiket, deger) => `
    <div class="ak-s">
      <span class="ak-et">${esc(etiket)}</span>
      <span class="ak-dg mono">${esc(deger)}</span>
      <button class="ak-kop" type="button" data-ak-kopya="${esc(deger)}"
              aria-label="${esc(etiket)} kopyala">${svg(ICON.kopya, 12)}</button>
    </div>`;

  const durum = baglandi ? baDurum('Bağlantı kuruldu', alanAdi) : '';

  const govde = baglandi ? '' : `
    <div class="fb-kart" style="--kr:#5fb37f">
      ${satir('Type',  'CNAME Record')}
      ${satir('Host',  alt)}
      ${satir('Value', hedef)}
      ${satir('TTL',   'Automatic')}
    </div>
    <a class="sayfa-dug ikincil" target="_blank" rel="noopener"
       href="https://ap.www.namecheap.com/domains/domaincontrolpanel/${esc(kok)}/advancedns">
      ${svg(ICON.dil, 15)} Namecheap'te aç</a>
    <button class="sayfa-dug" type="button" data-eylem="namecheap-baglan" data-proje="${p.id}">
      ${svg(ICON.tik, 15)} Alan adını yaz</button>
    <div class="fbd-not">${svg(ICON.info, 13)}
      <span>Kaydı Namecheap'te oluşturduktan sonra <b>Alan adını yaz</b>'a dokun ve
      <b class="mono">${esc(tam)}</b> yaz. DNS'in yayılması 10–30 dakika sürebilir.</span></div>`;

  return shBaslikServis('namecheap', 'Namecheap ile alan adı',
    'Programın kendi adresinden açılması için DNS kaydı ve alan adı.')
    + durum + govde
    + baOzellikler([
      'Müşteriye kendi alan adından teslim edilir',
      'github.io yerine kısa, akılda kalan adres',
      'Kayıt bir kez yapılır, bundan sonra kendiliğinden çalışır',
    ]);
}

function baglantiAdimBagla(kutu, p) {
  $$('[data-ak-kopya]', kutu).forEach(b => b.addEventListener('click', async () => {
    const ok = await panoyaKopyala(b.dataset.akKopya);
    b.classList.toggle('oldu', ok);
    toast(ok ? 'Kopyalandı.' : 'Kopyalanamadı.', ok ? 'basari' : 'hata');
  }));

  $$('[data-ba]', kutu).forEach(el => {
    el.addEventListener('click', () => {
      const t = el.dataset.ba;
      if (t === 'kapat') return baglantiAdimKapat();
      if (t === 'geri')  { BAGLANTI_ADIM.adim--; return baglantiAdimCiz(); }
      if (t === 'ileri') { BAGLANTI_ADIM.adim++; return baglantiAdimCiz(); }
    });
  });
}

/* ==========================================================================
   MODAL
   ========================================================================== */

/* Modal başlığı: solda vurgu rozeti, sağda başlık ve tek satır açıklama. */
function modalBaslik(ikon, baslik, alt = '') {
  return `<div class="modal-bas">
    <span class="modal-rozet">${svg(ikon, 17)}</span>
    <span class="modal-bas-yazi">
      <span class="modal-h">${esc(baslik)}</span>
      ${alt ? `<span class="modal-s">${esc(alt)}</span>` : ''}
    </span>
  </div>`;
}

/* Pencereler üst üste açılabilir. Onay kutusu görev kartının üstünde belirir,
   kapanınca kart yerinde durur. En üstteki pencere kapanır, hepsi değil. */
function modalAc(html, bagla, ekSinif = '') {
  const kat = $$('.modal-perde').length;

  const perde = document.createElement('div');
  perde.className = 'modal-perde';
  perde.style.zIndex = String(600 + kat * 10);
  perde.innerHTML = `<div class="modal-kutu ${ekSinif}" role="dialog" aria-modal="true">${html}</div>`;
  document.body.appendChild(perde);

  perde.addEventListener('mousedown', e => { if (e.target === perde) modalKapat(); });
  document.addEventListener('keydown', kacTusu);

  if (bagla) bagla($('.modal-kutu', perde));
  return perde;
}

/* En üstteki pencereyi kapatır. */
function modalKapat() {
  const hepsi = $$('.modal-perde');
  const son = hepsi[hepsi.length - 1];
  if (son) son.remove();
  if (hepsi.length <= 1) document.removeEventListener('keydown', kacTusu);
}

/* Bütün pencereleri kapatır — ekran değişince ya da yeni bir akış başlarken. */
function modalHepsiniKapat() {
  $$('.modal-perde').forEach(p => p.remove());
  document.removeEventListener('keydown', kacTusu);
}

function kacTusu(e) { if (e.key === 'Escape') modalKapat(); }

/* Tek alanlı soru — sayfa/modül adı gibi kısa girdiler için */
function metinSor({ baslik, aciklama, deger = '', yerTutucu = '',
                   buton = 'Kaydet', cok = false }) {
  return new Promise(resolve => {
    modalAc(`
      ${modalBaslik(ICON.kalem, baslik, aciklama || '')}
      <label class="field">
        ${cok
          ? `<textarea id="modal-metin" rows="4" placeholder="${esc(yerTutucu)}"
                       maxlength="600">${esc(deger)}</textarea>`
          : `<input type="text" id="modal-metin" value="${esc(deger)}" placeholder="${esc(yerTutucu)}"
               autocomplete="off" maxlength="80">`}
      </label>
      <div class="modal-alt">
        <button class="btn btn-ghost" data-m="iptal" type="button">Vazgeç</button>
        <button class="btn btn-primary" data-m="tamam" type="button"><span>${esc(buton)}</span></button>
      </div>`, kutu => {
      const alan = $('#modal-metin', kutu);
      setTimeout(() => { alan.focus(); alan.select(); }, 40);

      const bitir = v => { modalKapat(); resolve(v); };
      alan.addEventListener('keydown', e => {
        /* Çok satırlıda Enter satır atlar; kaydetmek düğmeyle. */
        if (e.key === 'Enter' && !cok) { e.preventDefault(); bitir(alan.value.trim() || null); }
        if (e.key === 'Escape') bitir(null);
      });
      $('[data-m="iptal"]', kutu).addEventListener('click', () => bitir(null));
      $('[data-m="tamam"]', kutu).addEventListener('click', () => bitir(alan.value.trim() || null));
    });
  });
}

/* Alan sorusu — ad ve tür birlikte. Tür veritabanı sütununu belirliyor,
   ayrı ayrı sormak akışı uzatıyordu. */
function alanSor() {
  return new Promise(resolve => {
    modalAc(`
      ${modalBaslik(ICON.kalem, 'Yeni alan', 'Bu sayfada tutulacak bir bilgi.')}
      <label class="field">
        <span>Alan adı</span>
        <input type="text" id="al-ad" placeholder="Örn. Tutar" autocomplete="off" maxlength="60">
      </label>
      <div class="field">
        <span>Türü</span>
        <div class="ky-cipler" id="al-tur">
          ${ALAN_TURU.map((x, i) => `
            <button class="cip-sec ${i ? '' : 'on'}" type="button"
                    data-alt="${esc(x.ad)}" title="${esc(x.alt)}">${esc(x.ad)}</button>`).join('')}
        </div>
      </div>
      <div class="modal-alt">
        <button class="btn btn-ghost" data-m="iptal" type="button">Vazgeç</button>
        <button class="btn btn-primary" data-m="tamam" type="button"><span>Ekle</span></button>
      </div>`, kutu => {
      const adAlan = $('#al-ad', kutu);
      let tur = ALAN_TURU[0].ad;
      setTimeout(() => adAlan.focus(), 40);

      $$('#al-tur .cip-sec', kutu).forEach(b => b.addEventListener('click', () => {
        tur = b.dataset.alt;
        $$('#al-tur .cip-sec', kutu).forEach(x => x.classList.toggle('on', x === b));
      }));

      const bitir = v => { modalKapat(); resolve(v); };
      const ekle  = () => bitir(adAlan.value.trim() ? { ad: adAlan.value.trim(), tur } : null);
      adAlan.addEventListener('keydown', e => {
        if (e.key === 'Enter')  { e.preventDefault(); ekle(); }
        if (e.key === 'Escape') bitir(null);
      });
      $('[data-m="iptal"]', kutu).addEventListener('click', () => bitir(null));
      $('[data-m="tamam"]', kutu).addEventListener('click', ekle);
    });
  });
}

/* Listeden seçme — hazır seçenekler + kendi yazma. */
function listeSor(baslik, secenekler, yazAd) {
  return new Promise(resolve => {
    modalAc(`
      ${modalBaslik(ICON.folder, baslik, '')}
      <div class="ky-cipler" id="ls-liste">
        ${secenekler.map(x => `
          <button class="cip-sec" type="button" data-ls="${esc(x)}">${esc(x)}</button>`).join('')}
        <button class="cip-sec ekle" type="button" data-ls-yaz="1">
          ${svg(ICON.arti, 12)} ${esc(yazAd || 'Kendim yazayım')}</button>
      </div>
      <div class="modal-alt">
        <button class="btn btn-ghost" data-m="iptal" type="button">Vazgeç</button>
      </div>`, kutu => {
      const bitir = v => { modalKapat(); resolve(v); };
      $$('[data-ls]', kutu).forEach(b =>
        b.addEventListener('click', () => bitir(b.dataset.ls)));
      $('[data-ls-yaz]', kutu).addEventListener('click', async () => {
        modalKapat();
        resolve(await metinSor({ baslik, buton: 'Seç' }));
      });
      $('[data-m="iptal"]', kutu).addEventListener('click', () => bitir(null));
    });
  });
}

/* Onay kutusu — silme gibi geri alınamaz işler için */
/* Yazarak onay — geri alınamayan silmelerde. Kullanıcı istenen sözü
   harfi harfine yazmadan düğme açılmıyor; "yanlışlıkla bastım" olmuyor. */
function yazarakOnaySor({ baslik, mesaj, kelime, buton = 'Sil' }) {
  return new Promise(resolve => {
    modalAc(`
      <div class="onay">
        <span class="onay-ikon">${svg(ICON.uyari, 22)}</span>
        <p class="onay-soru">${esc(baslik)}</p>
        <p class="onay-alt">${esc(mesaj)}</p>
      </div>
      <label class="field yo-alan">
        <span>Onaylamak için <b>${esc(kelime)}</b> yaz</span>
        <input type="text" id="yo-metin" placeholder="${esc(kelime)}" autocomplete="off"
               autocapitalize="off" spellcheck="false">
      </label>
      <div class="modal-alt">
        <button class="btn btn-ghost" data-m="hayir" type="button">Vazgeç</button>
        <button class="btn btn-tehlike" data-m="evet" type="button" disabled><span>${esc(buton)}</span></button>
      </div>`, kutu => {
      const alan = $('#yo-metin', kutu);
      const dug  = $('[data-m="evet"]', kutu);
      const uyar = () => alan.value.trim().toLocaleLowerCase('tr') === kelime.toLocaleLowerCase('tr');

      setTimeout(() => alan.focus(), 40);
      alan.addEventListener('input', () => { dug.disabled = !uyar(); });

      const bitir = v => { modalKapat(); resolve(v); };
      alan.addEventListener('keydown', e => {
        if (e.key === 'Enter' && uyar()) { e.preventDefault(); bitir(true); }
        if (e.key === 'Escape') bitir(false);
      });
      $('[data-m="hayir"]', kutu).addEventListener('click', () => bitir(false));
      dug.addEventListener('click', () => { if (uyar()) bitir(true); });
    }, 'kucuk');
  });
}

function onaySor({ baslik, mesaj, buton = 'Sil' }) {
  return new Promise(resolve => {
    modalAc(`
      <div class="onay">
        <span class="onay-ikon">${svg(ICON.uyari, 22)}</span>
        <p class="onay-soru">${esc(baslik)}</p>
        <p class="onay-alt">${esc(mesaj)}</p>
      </div>
      <div class="modal-alt">
        <button class="btn btn-ghost" data-m="hayir" type="button">Vazgeç</button>
        <button class="btn btn-tehlike" data-m="evet" type="button"><span>${esc(buton)}</span></button>
      </div>`, kutu => {
      const bitir = v => { modalKapat(); resolve(v); };
      $('[data-m="hayir"]', kutu).addEventListener('click', () => bitir(false));
      $('[data-m="evet"]',  kutu).addEventListener('click', () => bitir(true));
    }, 'kucuk');
  });
}

/* ==========================================================================
   GÖREV KARTI
   ========================================================================== */

function gorevKartiAc(id) {
  modalHepsiniKapat();
  const g = DB.gorev(id);
  if (!g) { toast('Görev bulunamadı.'); return; }
  modalAc(gorevKartiHtml(g), kutu => gorevKartiBagla(kutu, g.id), 'genis');
}

function gorevKartiHtml(g) {
  const benim   = AUTH.user && g.atanan === AUTH.user.id;
  const yon     = AUTH.yonetici;
  const sira    = DURUM_SIRA.indexOf(g.durum);
  const hareket = DB.hareketleri(g.id);

  const serit = DURUMLAR.map((d, i) => {
    const gecti = i < sira, simdi = i === sira;
    const tiklanir = yon;
    return `<button class="st ${gecti ? 'gecti' : ''} ${simdi ? 'simdi ' + d.sinif : ''}"
      ${tiklanir ? `data-gk="durum" data-deger="${d.anahtar}"` : 'disabled'}
      type="button">${d.ad}</button>`;
  }).join('');

  return `
    <div class="gk-ust">
      <span class="gk-no mono">${gorevNo(g)}</span>
      ${g.oncelik === 'acil' ? '<span class="acil">Acil</span>' : ''}
      <button class="gk-x" data-gk="kapat" type="button" aria-label="Kapat">${svg(ICON.kapat, 15)}</button>
    </div>

    <h3 class="gk-baslik">${esc(g.baslik)}</h3>
    <p class="gk-yol">${gorevYolu(g)}</p>

    <div class="serit">${serit}</div>
    <p class="serit-not">${seritNotu(g, benim, yon)}</p>

    <div class="gk-meta">
      <div class="mi">
        <span class="mil">Atanan</span>
        <span class="miv">
          ${g.atanan ? avatar(g.atanan, 'kucuk') : ''}${esc(DB.kisiAdi(g.atanan))}
          ${yon ? `<button class="mini-link" data-gk="ata" type="button">değiştir</button>` : ''}
        </span>
      </div>
      <div class="mi">
        <span class="mil">Öncelik</span>
        <span class="miv">
          ${g.oncelik === 'acil' ? '<span class="acil">Acil</span>' : 'Normal'}
          ${yon ? `<button class="mini-link" data-gk="oncelik" type="button">değiştir</button>` : ''}
        </span>
      </div>
    </div>

    ${g.aciklama ? `
      <div class="gk-blok">
        <span class="gk-cap">Ne yapılacak</span>
        <div class="gk-aciklama">${esc(g.aciklama)}</div>
      </div>` : ''}

    <div class="gk-blok">
      <span class="gk-cap">Nizam Standartları</span>
      ${DB.gorevinStandartlari(g.id).length
        ? `<div class="std-etiketler">${DB.gorevinStandartlari(g.id)
            .map(st => `<span class="std-etiket">${esc(st.ad)}</span>`).join('')}
           ${yon ? `<button class="std-etiket ekle" data-gk="standart" type="button">${svg(ICON.kalem, 12)} değiştir</button>` : ''}</div>`
        : `<div class="std-etiketler">
             <span class="ipucu">Bu göreve standart bağlanmamış.</span>
             ${yon ? `<button class="std-etiket ekle" data-gk="standart" type="button">${svg(ICON.arti, 12)} ekle</button>` : ''}
           </div>`}
    </div>

    ${hareket.length ? `
      <div class="gk-blok">
        <span class="gk-cap">Hareketler</span>
        <div class="iz">${hareket.map((h, i) => hareketSatiri(h, i === hareket.length - 1)).join('')}</div>
      </div>` : ''}

    <div class="modal-alt">${gorevButonlari(g, benim, yon)}</div>`;
}

function seritNotu(g, benim, yon) {
  if (g.durum === 'kontrolde' && yon)    return 'Onayla ya da not yazarak geliştiriciye geri gönder.';
  if (g.durum === 'kontrolde')           return 'Yöneticinin onayı bekleniyor.';
  if (g.durum === 'gelistiriliyor' && benim) return 'Bitirince "Kontrole Gönder" de — onaya düşer.';
  if (g.durum === 'yapilacak' && benim)  return 'Başladığında işaretle ki ekip görsün.';
  if (g.durum === 'tamamlandi')          return 'Bu iş onaylandı ve kapandı.';
  return 'Görev henüz başlamadı.';
}

function hareketSatiri(h, sonMu) {
  const renk = { revize: 'var(--red)', kontrole: 'var(--st-check)',
                 onaylandi: 'var(--st-done)', baslandi: 'var(--st-dev)' }[h.tip] || '#3a3f45';
  return `
    <div class="izs">
      <span class="izn"><span class="izd" style="background:${renk}"></span>${sonMu ? '' : '<span class="izl"></span>'}</span>
      <span class="izy">
        ${esc(DB.kisiAdi(h.kim))} ${HAREKET_ADI[h.tip] || h.tip}
        ${h.notu ? `<span class="revize">${esc(h.notu)}</span>` : ''}
        <em>${tarihYaz(h.olusturuldu)}</em>
      </span>
    </div>`;
}

function gorevButonlari(g, benim, yon) {
  const prompt = `<button class="btn" data-gk="prompt" type="button">
    ${svg(ICON.kopya, 15)}<span>Prompt Kopyala</span></button>`;

  if (g.durum === 'kontrolde' && yon) {
    return `<button class="btn btn-red" data-gk="revize" type="button"><span>Revize İste</span></button>
            <button class="btn btn-onay" data-gk="onayla" type="button"><span>Onayla</span></button>`;
  }
  if (g.durum === 'yapilacak' && (benim || yon)) {
    return prompt + `<button class="btn btn-primary" data-gk="basla" type="button"><span>Başla</span></button>`;
  }
  if (g.durum === 'gelistiriliyor' && (benim || yon)) {
    return prompt + `<button class="btn btn-primary" data-gk="kontrole" type="button"><span>Kontrole Gönder</span></button>`;
  }
  if (yon) {
    return prompt + `<button class="btn btn-red" data-gk="sil" type="button"><span>Görevi Sil</span></button>`;
  }
  return prompt;
}

function gorevKartiBagla(kutu, id) {
  $$('[data-gk]', kutu).forEach(el => {
    el.addEventListener('click', () => gorevEylemi(el.dataset.gk, id, el.dataset.deger));
  });
}

async function gorevEylemi(tip, id, deger) {
  const g = DB.gorev(id);
  if (!g && tip !== 'kapat') { modalKapat(); return; }

  if (tip === 'kapat')  return modalKapat();

  if (tip === 'prompt') {
    const g = DB.gorev(id);
    const gp = g ? DB.proje(g.proje_id) : null;
    return metinPenceresi({
      baslik: 'Hazır prompt',
      aciklama: 'Kopyala, Claude Code\'a yapıştır. Başka bir şey yazmana gerek yok.',
      metin: PROMPT.gorev(id),
      dosya: null,
      geri: () => gorevKartiAc(id),
      ac: { adres: claudeAdresi(gp ? depoSlug(gp.repo) : ''),
            yazi: 'Kopyala ve Claude Code\'da aç' },
    });
  }

  if (tip === 'standart') {
    const secilen = await standartSor(DB.gorevinStandartlari(id).map(x => x.id));
    if (!secilen) { gorevKartiAc(id); return; }
    try {
      await DB.gorevStandartYaz(id, secilen);
      sonrasi(id, 'Standartlar güncellendi.');
    } catch (e) { toast(e.message, 'hata'); gorevKartiAc(id); }
    return;
  }

  if (tip === 'basla')    return gorevDurum(id, 'gelistiriliyor');
  if (tip === 'kontrole') return gorevDurum(id, 'kontrolde');
  if (tip === 'onayla')   return gorevDurum(id, 'tamamlandi');
  if (tip === 'durum')    return gorevDurum(id, deger);

  if (tip === 'revize') {
    const notu = await metinSor({
      baslik: 'Neyi düzeltsin?',
      aciklama: 'Not geliştiriciye gider, görev Geliştiriliyor\'a düşer.',
      yerTutucu: 'Örn. Tarih aralığı seçilince liste yenilenmiyor.',
      buton: 'Geri Gönder',
    });
    if (!notu) { gorevKartiAc(id); return; }
    return gorevDurum(id, 'gelistiriliyor', notu);
  }

  if (tip === 'ata') {
    const kisiId = await kisiSor(g.atanan);
    if (kisiId === undefined) { gorevKartiAc(id); return; }
    try {
      await DB.gorevGuncelle(id, { atanan: kisiId });
      if (kisiId) await DB.hareketEkle(id, 'atandi', DB.kisiAdi(kisiId));
      sonrasi(id, 'Atama güncellendi.');
    } catch (e) { toast(e.message, 'hata'); }
    return;
  }

  if (tip === 'oncelik') {
    try {
      await DB.gorevGuncelle(id, { oncelik: g.oncelik === 'acil' ? 'normal' : 'acil' });
      sonrasi(id, g.oncelik === 'acil' ? 'Öncelik normale alındı.' : 'Acil olarak işaretlendi.');
    } catch (e) { toast(e.message, 'hata'); }
    return;
  }

  if (tip === 'sil') {
    const ok = await onaySor({
      baslik: 'Görev silinsin mi?',
      mesaj: `${gorevNo(g)} — "${g.baslik}" kalıcı olarak silinecek.`,
    });
    if (!ok) { gorevKartiAc(id); return; }
    try {
      await DB.gorevSil(id);
      modalKapat(); sayaclariYaz(); render(); toast('Görev silindi.', 'basari');
    } catch (e) { toast(e.message, 'hata'); }
  }
}

async function gorevDurum(id, durum, notu = '') {
  try {
    await DB.durumDegistir(id, durum, notu);
    sonrasi(id, durum === 'tamamlandi' ? 'Onaylandı.' :
                durum === 'kontrolde'  ? 'Kontrole gönderildi.' : 'Durum güncellendi.');
  } catch (e) {
    toast(e.message, 'hata');
    gorevKartiAc(id);
  }
}

/* Bir işlemden sonra: arka planı yenile, kartı taze veriyle tekrar aç */
function sonrasi(id, mesaj) {
  sayaclariYaz();
  render();
  if (DB.gorev(id)) gorevKartiAc(id); else modalKapat();
  if (mesaj) toast(mesaj);
}

/* ==========================================================================
   YENİ GÖREV
   ========================================================================== */

const YENI = { proje: null, modul: null, sayfa: null, oncelik: 'normal',
               atanan: null, standartlar: [], kaydediyor: false };

function yeniGorevAc({ proje, modul, sayfa }) {
  modalHepsiniKapat();
  Object.assign(YENI, {
    proje: proje || null, modul: modul || null, sayfa: sayfa || null,
    oncelik: 'normal', atanan: null, standartlar: [], kaydediyor: false,
  });

  if (!YENI.proje && YENI.modul) {
    const m = DB.moduller.find(x => x.id === YENI.modul);
    if (m) YENI.proje = m.proje_id;
  }
  if (!YENI.proje) { toast('Önce bir proje aç.'); return; }

  modalAc(yeniGorevHtml(), yeniGorevBagla, 'genis');
}

function yeniGorevHtml() {
  const moduller = DB.modulleri(YENI.proje);
  const sayfalar = YENI.modul ? DB.sayfalari(YENI.modul) : [];
  const proje    = DB.proje(YENI.proje);

  return `
    ${modalBaslik(ICON.check, 'Yeni görev', (proje ? projeAdi(proje) : '') + ' · nereye bağlanacağını seç.')}

    <label class="field">
      <span>Başlık</span>
      <input type="text" id="yg-baslik" placeholder="Örn. Stok hareketlerine tarih filtresi"
             autocomplete="off" maxlength="120">
    </label>

    <label class="field">
      <span>Ne yapılacak</span>
      <textarea id="yg-aciklama" rows="3"
        placeholder="Kısa ve net yaz. Bu metin Adım 4'te AI promptuna girecek."></textarea>
    </label>

    <div class="field">
      <span>Modül</span>
      <div class="secenek-serit">
        ${moduller.map(m => `<button class="ss ${YENI.modul === m.id ? 'sec' : ''}"
          data-yg="modul" data-deger="${m.id}" type="button">${esc(m.ad)}</button>`).join('')}
      </div>
    </div>

    ${YENI.modul && sayfalar.length ? `
      <div class="field">
        <span>Sayfa <em class="ipucu">boş bırakırsan modüle bağlanır</em></span>
        <div class="secenek-serit">
          ${sayfalar.map(sf => `<button class="ss ${YENI.sayfa === sf.id ? 'sec' : ''}"
            data-yg="sayfa" data-deger="${sf.id}" type="button">${esc(sf.ad)}</button>`).join('')}
        </div>
      </div>` : ''}

    ${DB.standartlar.length ? `
      <div class="field">
        <span>Nizam Standartları <em class="ipucu">tikledigin standardın tarifi prompta girer</em></span>
        ${DB.standartGruplari().map(g => `
          <span class="grup-etiket">${esc(g.ad)}</span>
          <div class="secenek-serit">
            ${g.liste.map(st => `<button class="ss ${YENI.standartlar.includes(st.id) ? 'sec' : ''}"
              data-yg="standart" data-deger="${st.id}" type="button">${esc(st.ad)}</button>`).join('')}
          </div>`).join('')}
      </div>` : ''}

    <div class="gk-meta">
      <div class="field" style="margin:0">
        <span>Atanan</span>
        <div class="secenek-serit">
          ${DB.kisiler.map(k => `<button class="ss ${YENI.atanan === k.id ? 'sec' : ''}"
            data-yg="atanan" data-deger="${k.id}" type="button">${esc(k.ad || 'Kişi')}</button>`).join('')
            || '<span class="ipucu">Kişi listesi boş.</span>'}
        </div>
      </div>
      <div class="field" style="margin:0">
        <span>Öncelik</span>
        <div class="secenek-serit">
          <button class="ss ${YENI.oncelik === 'normal' ? 'sec' : ''}" data-yg="oncelik" data-deger="normal" type="button">Normal</button>
          <button class="ss acil-ss ${YENI.oncelik === 'acil' ? 'sec' : ''}" data-yg="oncelik" data-deger="acil" type="button">Acil</button>
        </div>
      </div>
    </div>

    <div class="modal-alt">
      <button class="btn btn-ghost" data-yg="kapat" type="button">Vazgeç</button>
      <button class="btn btn-primary" data-yg="kaydet" type="button"><span>Görevi Oluştur</span></button>
    </div>`;
}

function yeniGorevBagla(kutu) {
  const baslik = $('#yg-baslik', kutu);
  if (baslik) setTimeout(() => baslik.focus(), 40);

  $$('[data-yg]', kutu).forEach(el => {
    el.addEventListener('click', () => {
      const t = el.dataset.yg, d = el.dataset.deger;

      if (t === 'kapat')  return modalKapat();
      if (t === 'kaydet') return yeniGorevKaydet();

      /* metin alanları yeniden çizimde kaybolmasın */
      YENI._baslik   = $('#yg-baslik', kutu).value;
      YENI._aciklama = $('#yg-aciklama', kutu).value;

      if (t === 'modul')   { YENI.modul = d; YENI.sayfa = null; }
      if (t === 'sayfa')   { YENI.sayfa = YENI.sayfa === d ? null : d; }
      if (t === 'atanan')  { YENI.atanan = YENI.atanan === d ? null : d; }
      if (t === 'oncelik') { YENI.oncelik = d; }
      if (t === 'standart') {
        const i = YENI.standartlar.indexOf(d);
        i === -1 ? YENI.standartlar.push(d) : YENI.standartlar.splice(i, 1);
      }

      yeniGorevCiz();
    });
  });

  if (YENI._baslik)   baslik.value = YENI._baslik;
  if (YENI._aciklama) $('#yg-aciklama', kutu).value = YENI._aciklama;
}

function yeniGorevCiz() {
  const kutu = $('.modal-kutu');
  if (!kutu) return;
  kutu.innerHTML = yeniGorevHtml();
  yeniGorevBagla(kutu);
}

async function yeniGorevKaydet() {
  if (YENI.kaydediyor) return;

  const baslik   = $('#yg-baslik').value.trim();
  const aciklama = $('#yg-aciklama').value.trim();

  if (!baslik) { toast('Görev başlığı yaz.'); $('#yg-baslik').focus(); return; }
  if (!YENI.modul) { toast('Bir modül seç.'); return; }

  YENI.kaydediyor = true;
  const btn = $('[data-yg="kaydet"] span');
  if (btn) btn.textContent = 'Oluşturuluyor…';

  try {
    await DB.gorevOlustur({
      proje_id: YENI.proje,
      modul_id: YENI.modul,
      sayfa_id: YENI.sayfa,
      baslik, aciklama,
      oncelik: YENI.oncelik,
      atanan: YENI.atanan,
      standartlar: YENI.standartlar,
    });
    YENI._baslik = YENI._aciklama = '';
    modalKapat(); sayaclariYaz(); render(); toast('Görev oluşturuldu.', 'basari');
  } catch (e) {
    toast(e.message, 'hata');
    if (btn) btn.textContent = 'Görevi Oluştur';
  } finally {
    YENI.kaydediyor = false;
  }
}

/* Kişi seçtiren küçük pencere. Vazgeçilirse undefined döner. */
function kisiSor(mevcut) {
  return new Promise(resolve => {
    const liste = DB.kisiler.map(k => `
      <button class="sc ${mevcut === k.id ? 'sec' : ''}" data-k="${k.id}" type="button">
        <span class="sc-yazi"><span class="sc-ad">${esc(k.ad || 'Kişi')}</span>
        <span class="sc-alt">${k.rol === 'yonetici' ? 'Yönetici' : 'Geliştirici'}</span></span>
        <span class="tik">${mevcut === k.id ? svg(ICON.tik, 13) : ''}</span>
      </button>`).join('');

    modalAc(`
      ${modalBaslik(ICON.kisi, 'Kime atansın?', 'Kişiler Supabase panelinden eklenir.')}
      <div class="secim">
        ${liste || '<span class="ipucu">Kişi listesi boş.</span>'}
        <button class="sc" data-k="" type="button">
          <span class="sc-yazi"><span class="sc-ad">Kimseye atama</span>
          <span class="sc-alt">Havuzda bekletir</span></span><span class="tik"></span>
        </button>
      </div>
      <div class="modal-alt">
        <button class="btn btn-ghost" data-k-iptal="1" type="button">Vazgeç</button>
      </div>`, kutu => {
      $$('[data-k]', kutu).forEach(el =>
        el.addEventListener('click', () => { modalKapat(); resolve(el.dataset.k || null); }));
      $('[data-k-iptal]', kutu).addEventListener('click', () => { modalKapat(); resolve(undefined); });
    });
  });
}

/* ==========================================================================
   METİN PENCERESİ — prompt ve kimlik dosyası
   ========================================================================== */

function metinPenceresi({ baslik, aciklama, metin, dosya, geri, ac }) {
  modalAc(`
    ${modalBaslik(ICON.kopya, baslik, aciklama)}
    <pre class="kod">${esc(metin)}</pre>
    <div class="modal-alt">
      <button class="btn btn-ghost" data-mp="kapat" type="button">${geri ? 'Geri' : 'Kapat'}</button>
      ${dosya ? `<button class="btn btn-ghost" data-mp="indir" type="button">İndir</button>` : ''}
      ${ac
        /* Gerçek bağlantı: kopyalama dokunma jestinin içinde başlıyor,
           await beklemiyor — iOS'ta aksi hâlde sekme açılmıyor. */
        ? `<a class="btn btn-primary" target="_blank" rel="noopener"
             data-mp="ac" href="${esc(ac.adres)}"><span>${esc(ac.yazi)}</span></a>`
        : `<button class="btn btn-primary" data-mp="kopyala" type="button"><span>Panoya Kopyala</span></button>`}
    </div>`, kutu => {
    $('[data-mp="kapat"]', kutu).addEventListener('click', () => {
      modalKapat();
      if (geri) geri();
    });

    const indir = $('[data-mp="indir"]', kutu);
    if (indir) indir.addEventListener('click', () => {
      dosyaIndir(dosya, metin);
      toast(dosya + ' indirildi.');
    });

    const acBag = $('[data-mp="ac"]', kutu);
    if (acBag) acBag.addEventListener('click', () => {
      panoyaKopyala(metin);
      uygulamayiDene(ac.yazi.includes('ChatGPT') ? 'ChatGPT' : 'Claude Code');
      toast('Kopyalandı — ' + ac.yazi.replace(/^.*ve /, '') + '…', 'basari');
    });

    const kopyaDug = $('[data-mp="kopyala"]', kutu);
    if (kopyaDug) kopyaDug.addEventListener('click', async () => {
      const yazi = $('[data-mp="kopyala"] span', kutu);
      const ok = await panoyaKopyala(metin);
      if (ok) {
        yazi.textContent = 'Kopyalandı ✓';
        setTimeout(() => { if (yazi.isConnected) yazi.textContent = 'Panoya Kopyala'; }, 1800);
      } else {
        toast('Kopyalanamadı. Metni seçip elle kopyala.');
      }
    });
  }, 'genis');
}

/* ==========================================================================
   STANDARTLAR
   ========================================================================== */

/* Göreve standart bağlarken açılan tik listesi. Vazgeçilirse null döner. */
function standartSor(mevcut) {
  return new Promise(resolve => {
    let secili = mevcut.slice();

    const ciz = () => `
      ${modalBaslik(ICON.katman, 'Hangi standartlar kullanılacak?', 'Tiklediklerinin tarifi promptun içine girer.')}
      ${DB.standartGruplari().map(g => `
        <span class="grup-etiket">${esc(g.ad)}</span>
        <div class="mod-grid">
          ${g.liste.map(st => `
            <button class="mod ${secili.includes(st.id) ? 'sec' : ''}" data-st="${st.id}" type="button">
              <span>${esc(st.ad)}</span>
              <span class="tik">${secili.includes(st.id) ? svg(ICON.tik, 13) : ''}</span>
            </button>`).join('')}
        </div>`).join('')}
      <div class="modal-alt">
        <button class="btn btn-ghost" data-st-iptal="1" type="button">Vazgeç</button>
        <button class="btn btn-primary" data-st-tamam="1" type="button"><span>Kaydet</span></button>
      </div>`;

    const bagla = kutu => {
      $$('[data-st]', kutu).forEach(el => el.addEventListener('click', () => {
        const id = el.dataset.st;
        const i = secili.indexOf(id);
        i === -1 ? secili.push(id) : secili.splice(i, 1);
        kutu.innerHTML = ciz();
        bagla(kutu);
      }));
      $('[data-st-iptal]', kutu).addEventListener('click', () => { modalKapat(); resolve(null); });
      $('[data-st-tamam]', kutu).addEventListener('click', () => { modalKapat(); resolve(secili); });
    };

    modalAc(ciz(), bagla, 'genis');
  });
}

/* ==========================================================================
   MODÜL ŞABLONLARI
   ========================================================================== */

/* Sektör: yalnızca ad. Modül önerisi kavramı kalktı — sektör artık hazır
   template'leri süzmeye ve prompta girmeye yarıyor. */
function sektorDuzenle(id) {
  modalHepsiniKapat();
  const x = id ? DB.sektorler.find(s => s.id === id) : null;

  modalAc(`
    ${modalBaslik(ICON.folder, x ? 'Sektörü düzenle' : 'Yeni sektör',
      'Yeni proje kurarken hazır template\'ler bu sektöre göre süzülür.')}

    <label class="field">
      <span>Sektör adı</span>
      <input type="text" id="sk-ad" value="${esc(x ? x.ad : '')}"
             placeholder="Örn. Restoran" maxlength="40" autocomplete="off">
    </label>

    <div class="modal-alt">
      ${x ? `<button class="btn btn-ghost tehlike" data-sk="sil" type="button">Kaldır</button>` : ''}
      <button class="btn btn-ghost" data-sk="iptal" type="button">Vazgeç</button>
      <button class="btn btn-primary" data-sk="kaydet" type="button"><span>Kaydet</span></button>
    </div>`, kutu => {
    setTimeout(() => $('#sk-ad', kutu).focus(), 40);

    $('[data-sk="iptal"]', kutu).addEventListener('click', modalKapat);

    const silDug = $('[data-sk="sil"]', kutu);
    if (silDug) silDug.addEventListener('click', async () => {
      const ok = await onaySor({
        baslik: 'Sektör kaldırılsın mı?',
        mesaj: `"${x.ad}" listeden çıkacak. Bu sektörle kurulmuş projelere dokunulmaz.`,
      });
      if (!ok) return;
      try {
        await DB.sektorSil(x.id);
        modalKapat();
        render();
        toast('Sektör kaldırıldı.', 'basari');
      } catch (h) { toast(h.message, 'hata'); }
    });

    $('[data-sk="kaydet"]', kutu).addEventListener('click', async () => {
      const ad = $('#sk-ad', kutu).value.trim();
      if (!ad) { toast('Sektör adını yaz.'); return; }

      const yazi = $('[data-sk="kaydet"] span', kutu);
      yazi.textContent = 'Kaydediliyor…';
      try {
        await DB.sektorKaydet(id, { ad });
        modalKapat();
        render();
        toast(id ? 'Sektör güncellendi.' : 'Sektör eklendi.', 'basari');
      } catch (h) {
        yazi.textContent = 'Kaydet';
        toast(h.message, 'hata');
      }
    });
  }, 'genis');
}

/* Firma bilgilerini sonradan düzenleme.
   Sihirbazda girilen bilgiler ilk kurulumda kaybolmuş olabilir (sütunlar
   sonradan eklendi) ya da zamanla değişir — yetkili kişi ayrılır, tarih kayar. */
/* Düzenleme penceresi sayfanın kendisiyle aynı dili konuşuyor: aynı kartlar,
   aynı renkli simgeler. Gri kutular yerine ikon + etiket + alt çizgi —
   odaklanınca çizgi ve simge o alanın rengine dönüyor. */

/* Yazılan alan. `mono` tarih ve adres gibi sabit genişlik isteyenler için,
   `ek` de gizli anahtar (data-tk) gibi fazladan öznitelikler için. */
function fdAlan(renk, ikon, etiket, id, deger, yer, tur, uzunluk, mono, ek) {
  return `
    <label class="fbd-al" style="--ki:${renk}">
      <span class="fbd-si">${svg(ikon, 13)}</span>
      <span class="fbd-yz">
        <i>${esc(etiket)}</i>
        <input class="${mono ? 'mono' : ''}" type="${tur || 'text'}" id="${id}"
               value="${esc(deger || '')}" placeholder="${esc(yer || '')}"
               maxlength="${uzunluk || 80}" autocomplete="off" ${ek || ''}
               ${tur === 'email' ? 'autocapitalize="off" spellcheck="false"' : ''}>
      </span>
      <span class="fbd-cizgi"></span>
    </label>`;
}

/* Kart dibindeki açıklama. Uzun metinler etiketin yanına sığmıyor, satırı
   şişiriyordu; buraya inince alan sırası dar ve okunur kalıyor. */
function fdNot(yazi) {
  return `<div class="fbd-not">${svg(ICON.info, 13)}<span>${esc(yazi)}</span></div>`;
}

/* Seçim satırı: ikon + etiket, altında rozetler. Seçili olan metal —
   kırmızı yalnız Kaydet'te kalsın diye. */
function fdSecim(renk, ikon, etiket, tur, liste, secili) {
  return `
    <div class="fbd-sec" style="--ki:${renk}">
      <span class="fbd-set"><span class="fbd-si">${svg(ikon, 12)}</span>
        <span>${esc(etiket)}</span></span>
      <div class="fbd-cipler">
        ${liste.map(x => `<button class="fbd-cp ${secili === x.kod ? 'on' : ''}" type="button"
          data-fd="${tur}" data-deger="${esc(x.kod)}">${esc(x.ad)}</button>`).join('')}
      </div>
    </div>`;
}

function fdKart(renk, ikon, baslik, ic) {
  return `
    <div class="fb-kart fbd-kart" style="--kr:${renk}">
      <div class="fb-ust">
        <span class="fb-ik">${svg(ikon, 14)}</span>
        <span class="fb-bas">${esc(baslik)}</span>
        <span class="fbd-say" data-fdsay="${esc(baslik)}"></span>
      </div>
      ${ic}
    </div>`;
}

/* Kurulum adımlarının pencereleri. Tek büyük pencere yerine küçük
   pencereler: adım kartına basınca yalnız o adımın soruları çıkıyor.
   Yazılım bilmeyen biri için tek soruya odaklanmak, uzun formu
   taramaktan kolay. */

/* Tanışma promptu panoya alındıktan sonraki adımları gösteren küçük
   pencere. Bağlantılar aşamasında artık kullanılmıyor (düğme Claude'u
   doğrudan açıyor); eski çağrı yolları için duruyor. */
function sohbetYonlendir(p) {
  const adim = (no, ic) => `<div class="adm"><b>${no}</b><span>${ic}</span></div>`;
  modalAc(`
    ${modalBaslik(ICON.dosya, 'Prompt panoda', 'Sırada Claude Code var.')}
    <div class="adm-l">
      ${adim(1, '<b>Claude Code\'u aç</b> — aşağıdaki düğmeyle.')}
      ${adim(2, '<b>Yapıştır ve gönder.</b> Claude depoyu kurup kodu yazacak.')}
      ${adim(3, 'Sohbet başlayınca <b>Studio\'ya dön</b>, aynı kareye tekrar '
        + 'bas — bu kez sohbete verdiğin adı soracak.')}
    </div>
    <div class="kur-dug">
      <a class="sayfa-dug" target="_blank" rel="noopener"
         href="${esc(claudeAdresi(depoSlug(p.repo)))}">
        ${svg(ICON.disari, 15)} Claude Code'u aç</a>
    </div>
    <div class="modal-alt">
      <button class="btn btn-primary" data-sy="kapat" type="button"><span>Tamam</span></button>
    </div>`, kutu => {
    $('[data-sy="kapat"]', kutu).addEventListener('click', modalKapat);
  });
}

/* Program temeli yarısı bitti mi: paket adı ve veri katmanı kararı.
   Supabase'in gerçek bağlantısı (adres+anon key) artık Bağlantılar ve
   temel durağının işi — karar burada, bağlantı orada. */
function yerDolu(p) {
  const pl = p.palet || {};
  return !!pl.modulAdi && !!pl.veriKatmani && rolListesi(pl.roller).length > 0;
}

/* Takvim şeridinin kendi küçük penceresi. */
function adimTakvim(projeId) {
  modalHepsiniKapat();
  const p = DB.proje(projeId);
  if (!p) return;

  modalAc(`
    ${modalBaslik(ICON.takvim, 'Takvim', 'İş ne zaman başladı, ne zaman teslim edilecek?')}
    ${fdKart('#c8973f', ICON.takvim, 'Tarihler',
      fdAlan('#c8973f', ICON.takvim, 'Başlangıç', 'at-baslangic', p.baslangic,
             '', 'date', 10, true)
      + fdAlan('#5fb37f', ICON.bayrak, 'Teslim hedefi', 'at-teslim', p.teslim,
             'isteğe bağlı', 'date', 10, true)
      + fdNot('Teslim tarihi girilirse geciken projeler listede ayrı gösteriliyor.'))}
    <div class="modal-alt">
      <button class="btn btn-ghost" data-at="iptal" type="button">Vazgeç</button>
      <button class="btn btn-primary" data-at="kaydet" type="button"><span>Kaydet</span></button>
    </div>`, kutu => {
    const deger = id => { const e = $('#' + id, kutu); return e ? e.value.trim() : ''; };
    const tazele = () => {
      const t = $('[data-fdsay="Tarihler"]', kutu);
      if (t) t.textContent = ['at-baslangic', 'at-teslim'].filter(deger).length + '/2';
    };
    kutu.addEventListener('input', tazele);
    tazele();
    $('[data-at="iptal"]', kutu).addEventListener('click', modalKapat);
    $('[data-at="kaydet"]', kutu).addEventListener('click', async () => {
      const yazi = $('[data-at="kaydet"] span', kutu);
      yazi.textContent = 'Kaydediliyor…';
      try {
        await DB.projeGuncelle(projeId, {
          baslangic: deger('at-baslangic') || null,
          teslim:    deger('at-teslim') || null,
        });
        modalKapat(); render(); toast('Takvim güncellendi.', 'basari');
      } catch (h) { yazi.textContent = 'Kaydet'; toast(h.message, 'hata'); }
    });
  }, 'genis');
}

/* ==========================================================================
   MARKA — logo ve palet
   ========================================================================== */

function logoSec(projeId) {
  const alan = document.createElement('input');
  alan.type = 'file';
  alan.accept = 'image/*';
  alan.style.display = 'none';
  document.body.appendChild(alan);

  alan.addEventListener('change', async () => {
    const dosya = alan.files && alan.files[0];
    alan.remove();
    if (!dosya) return;

    toast('Logo yükleniyor…');
    try {
      await DB.logoYukle(projeId, dosya);
      render();
      toast('Logo yüklendi.', 'basari');
    } catch (h) { toast(h.message, 'hata'); }
  });

  alan.click();
}


/* Adres değişince hashchange bütün pencereleri kapatıyor. Silme sonrası
   pencereyi ondan SONRA açmalıyız, yoksa açılır açılmaz kapanıyor. */
function adreseGit(hash) {
  return new Promise(coz => {
    if (location.hash === hash) return coz();
    let bitti = false;
    const bitir = () => {
      if (bitti) return;
      bitti = true;
      window.removeEventListener('hashchange', bitir);
      coz();
    };
    window.addEventListener('hashchange', bitir);
    location.hash = hash;
    /* Olay gelmezse (aynı adres, eski tarayıcı) takılıp kalmayalım. */
    setTimeout(bitir, 300);
  });
}

/* ---------- Silmenin dışarıda kalan ayağı ----------
   Studio yalnız kendi verisini silebiliyor. GitHub deposunu ve sohbetleri
   silmek için jeton saklamak gerekirdi; bilerek saklamıyoruz. Onun yerine
   ne kaldığını sayıp doğrudan oraya götüren bağlantıları veriyoruz. */
function disaridaKalanlar(ad, slug) {
  modalAc(`
    ${modalBaslik(ICON.cop, 'Studio\'dan silindi',
      esc(ad) + ' ve bütün verisi gitti. Dışarıda üç iz kaldı.')}

    <div class="sk-liste">
      <div class="sk">
        <span class="sk-n">1</span>
        <div class="sk-yz">
          <b>GitHub deposu</b>
          <i>${slug
            ? 'Kod ve geçmiş orada duruyor. Silmek için deponun <b>Settings</b> '
              + 'sayfasını aç, en alttaki <b>Danger Zone</b> bölümünden sil.'
            : 'Bu projeye depo adresi kaydedilmemişti. Açtıysan GitHub\'dan elle sil.'}</i>
          ${slug ? `<span class="sk-ad mono">${esc(slug)}</span>` : ''}
        </div>
      </div>
      ${slug ? `
        <a class="sayfa-dug ikincil" target="_blank" rel="noopener"
           href="https://github.com/${esc(slug)}/settings">
          ${svg(ICON.katman, 15)} Depo ayarlarını aç</a>` : ''}

      <div class="sk">
        <span class="sk-n">2</span>
        <div class="sk-yz">
          <b>Claude Code oturumu</b>
          <i>Silme yok, arşivleme var. claude.ai/code listesinde oturumun
             üstüne gel, arşiv simgesine dokun.</i>
        </div>
      </div>
      <a class="sayfa-dug ikincil" target="_blank" rel="noopener"
         href="https://claude.ai/code">${svg(ICON.katman, 15)} Oturum listesini aç</a>

      <div class="sk">
        <span class="sk-n">3</span>
        <div class="sk-yz">
          <b>ChatGPT sohbeti</b>
          <i>Tasarımı yaptığın sohbet duruyor. Gerekmiyorsa sohbet listesinden sil.</i>
        </div>
      </div>
    </div>

    <div class="note note-kucuk">${svg(ICON.info, 15)}
      <span>Studio bunları kendi silemiyor: jeton saklamıyor. Depo silme geri
      alınamaz — adı iki kez oku.</span></div>

    <div class="modal-alt">
      <button class="btn btn-primary" data-m="kapat" type="button"><span>Tamam</span></button>
    </div>`, kutu => {
    $('[data-m="kapat"]', kutu).addEventListener('click', modalKapat);
  }, 'genis');
}

/* ---------- Prompt bağlantıları ----------
   Prompt düğmeleri gerçek `<a target="_blank">` — dokununca panoya yazar ve
   hedef yapay zekâyı açar. Neden düğme değil: iOS'ta ana ekrandan açılan
   uygulamada `window.open` sessizce çalışmıyor, üstelik genel `data-eylem`
   dinleyicisi preventDefault çağırıp bağlantıyı öldürüyor. Bu yüzden ayrı
   `data-pano` dinleyicisi var ve kopyalama `await` beklemeden, dokunma
   jestinin içinde başlıyor. */

const CHATGPT_ADRES = 'https://chatgpt.com/';

/* Telefonda uygulamanın kendisini açmayı deniyoruz. Bu şemalar resmî
   belgelenmiş değil; kuruluysa uygulama devralır, kurulu değilse hiçbir
   şey olmaz ve bağlantı normal seyrinde web'e gider. Kayıp yok. */
const UYGULAMA_SEMA = {
  'ChatGPT': 'chatgpt://',
  'Claude Code': 'claude://',
};

function uygulamayiDene(ad) {
  const sema = UYGULAMA_SEMA[ad];
  /* Yalnız telefon ve tablette: masaüstünde kurulu uygulama yok, üstelik
     tarayıcı "bilinmeyen adres" uyarısı çıkarıyor. */
  if (!sema || !matchMedia('(max-width: 900px)').matches) return;
  try {
    const cerceve = document.createElement('iframe');
    cerceve.style.display = 'none';
    cerceve.src = sema;
    document.body.appendChild(cerceve);
    setTimeout(() => cerceve.remove(), 1200);
  } catch (h) { /* şema tanınmıyorsa sessizce web'e devam */ }
}

/* Hangi düğme hangi promptu üretir. */
const PANO_PROMPT = {
  tanisma:       p => PROMPT.tanisma(p.id),
  cozumleme:     p => PROMPT.cozumleme(p, yapiTaslak(p)),
  modulGuncelle: p => PROMPT.modulGuncelle(p.id),
  betaIstek:     p => PROMPT.betaIstek(p.id, BETA_ISTEK[p.id] || ''),
  guncellemeIstek: p => PROMPT.guncellemeIstek(p.id, GUNCELLEME_ISTEK[p.id] || ''),
  denemeIstek:   p => PROMPT.denemeIstek(p.id, DENEME_ISTEK[p.id] || ''),
  sablonDegisim: p => PROMPT.sablonDegisim(p.id),
  cekirdekTemizle: p => PROMPT.cekirdekTemizle(p.id),
  yapi:          p => PROMPT.yapi(p.id),
  yetkiKur:      p => PROMPT.yetkiKur(p.id),
  /* Projesiz: bir programda doğan kuralı standarda çeviren prompt. */
  standartEkle:  () => PROMPT.standartEkle(),
};

/* Claude Code adresi. Depo adresi olmadan (`https://claude.ai/code`) hiçbir
   depo seçili gelmiyordu ve kullanıcı elle seçmek zorunda kalıyordu; artık
   depo bilgisi varsa her bağlantı `/new?repositories=` ile doğru depoyu
   önceden seçiyor. Studio zaten her promptu kendi başına yeterli (nizam/
   dosyalarını okuyarak) yazıyor — ayrı oturumlar açmak sorun değil, aksine
   her promptun "bu oturum yalnız bu depoya bağlı olmalı" uyarısıyla da
   tutarlı. */
function claudeAdresi(slug) {
  return 'https://claude.ai/code/new'
    + (slug ? '?repositories=' + encodeURIComponent(slug) : '');
}

/* Kopyala-ve-aç bağlantısı. hedef: 'chatgpt' · 'claude' · 'claude-yeni'
   ya da doğrudan bir adres. */
function promptBaglantisi({ tur, proje, yazi, hedef = 'claude', ikincil, kapali, slug }) {
  const adres = hedef === 'chatgpt' ? CHATGPT_ADRES
    : hedef === 'claude'      ? claudeAdresi(slug)
    : hedef === 'claude-yeni' ? claudeAdresi(slug)
    : hedef;
  const ad = hedef === 'chatgpt' ? 'ChatGPT' : 'Claude Code';
  if (kapali) {
    return `<button class="sayfa-dug ikincil" type="button" disabled>
      ${svg(ICON.kopya, 15)} ${esc(yazi)}</button>`;
  }
  return `<a class="sayfa-dug pano-dug ${ikincil ? 'ikincil' : ''}" target="_blank"
     rel="noopener" data-pano="${esc(tur)}" data-proje="${esc(proje || '')}"
     data-hedef="${esc(ad)}" href="${esc(adres)}">
    <span class="kd-ikon">${svg(ICON.kopya, 15)}${svg(ICON.tik, 15)}</span>
    <span class="kd-yazi">${esc(yazi)}</span></a>`;
}

/* ---------- Görsel dünya eylemleri ---------- */

/* Hangi projenin görseli yükleniyor ve ne kadarı gitti.
   Ekranda tutuluyor ki kart yeniden çizilse de gösterge kaybolmasın. */
const GORSEL_YUKLENIYOR = {};

/* İşletme görseli — G0 yuvası. Tarif değişse de silinmiyor. */
function isletmeGorseliSec(projeId) {
  gorselSecVeYukle(projeId, 'G0', 'İşletme görseli');
}

/* Halkayı ve yazıyı yerinde günceller. Bütün ekranı yeniden çizmiyoruz:
   yükleme boyunca saniyede onlarca kez gelen bir olay bu. */
function gorselGostergesiTazele(projeId) {
  const kat = document.querySelector('.proje-yukleme[data-proje="' + projeId + '"]');
  const d   = GORSEL_YUKLENIYOR[projeId];
  if (!kat || !d) return;

  const halka = $('.py-dolu', kat);
  const yazi  = $('.py-alt', kat);
  const bas   = $('.py-yazi', kat);
  /* Baytlar gitti ama imzalı adres ve palet kaydı sürüyor. "Yüklendi" demek
     erken olur; tik doluyken başlık da buna göre değişiyor. */
  if (bas) bas.textContent = d.bitti ? 'Görsel gönderildi' : 'Görsel yükleniyor';
  const CEVRE = 157;                       /* 2πr, r = 25 */
  if (halka) halka.setAttribute('stroke-dashoffset', String(CEVRE * (1 - d.oran)));
  if (yazi) {
    yazi.textContent = d.bitti
      ? 'bitiriliyor…'
      : '%' + Math.round(d.oran * 100) + ' · ' + kb(d.giden || 0) + '/' + kb(d.boyut);
  }
  kat.classList.toggle('bitti', !!d.bitti);
}

function kb(bayt) { return Math.round(bayt / 1024) + ' KB'; }

/* Görseli göstermeden önce tarayıcıya indirtir.

   Yükleme bitince yeni imzalı adres hazır oluyor ama dosya henüz inmemiş
   oluyor: katmanı hemen kaldırınca kart bir an görselsiz kalıyor, sonra
   görsel patlayarak geliyor. Önce indiriyoruz, sonra kaldırıyoruz.

   Ağ takılırsa sonsuza kadar beklemiyoruz — süre dolunca yine de devam
   ediyor; kullanıcıyı dolu bir halkanın karşısında bırakmak daha kötü. */
function gorseliOnyukle(adres, sure = 5000) {
  return new Promise(coz => {
    if (!adres) { coz(); return; }
    const im = new Image();
    let bitti = false;
    const tamam = () => { if (!bitti) { bitti = true; coz(); } };
    im.onload = tamam;
    im.onerror = tamam;
    setTimeout(tamam, sure);
    im.src = adres;
  });
}

function gorselSecVeYukle(projeId, no, ad) {
  const alan = document.createElement('input');
  alan.type = 'file';
  alan.accept = 'image/*,.svg';
  alan.style.display = 'none';
  document.body.appendChild(alan);

  alan.addEventListener('change', async () => {
    const dosya = alan.files && alan.files[0];
    alan.remove();
    if (!dosya) return;

    /* Yuva tarifle gelmiyor; ilk yüklemede kendimiz açıyoruz. Dosya adı
       `no`'dan türüyor — sabit "isletme.jpg" kullanınca birden çok yuva
       (5 tasarım yönü gibi) aynı depolama yoluna yazıp birbirinin üstüne
       geçiyordu; hangisi son yüklenirse hepsinde o görünüyordu. G0'ın adı
       geriye dönük uyum için aynı kalıyor, ötekiler kendi adını alıyor —
       ad uyuşmuyorsa (eski bozuk kayıt) yuva burada onarılıyor. */
    const pr = DB.proje(projeId);
    const pl = (pr && pr.palet) || {};
    const dosyaAdi = no === 'G0' ? 'isletme.jpg'
      : no.toLowerCase().replace(/[^a-z0-9]+/g, '-') + '.jpg';
    const mevcut = (pl.gorseller || []).find(y => y.no === no);
    if (!mevcut || mevcut.dosya !== dosyaAdi) {
      const yeni = (pl.gorseller || []).filter(y => y.no !== no).concat([{
        no, ad: ad || 'Görsel', tarif: 'İşletmeyi anlatan görsel — konseptin kaynağı.',
        dosya: dosyaAdi, yol: '', boyut: 0, tur: '',
      }]);
      try {
        await DB.paletKaydet(projeId, Object.assign({}, pl, { gorseller: yeni }));
      } catch (h) { toast(h.message, 'hata'); return; }
    }

    /* Gösterge kartın üstünde: bildirim balonu ekranın dibinde açılıp
       kayboluyor, oysa beklenen şey kartın kendisi. `no` hangi kartın
       yüklediğini ayırt etmek için — birden çok yuva aynı ekranda olabilir. */
    GORSEL_YUKLENIYOR[projeId] = { oran: 0, boyut: dosya.size, no };
    render();

    try {
      await DB.gorselYukle(projeId, no, dosya, (giden, toplam) => {
        const d = GORSEL_YUKLENIYOR[projeId];
        if (!d) return;
        d.oran   = toplam ? giden / toplam : 0;
        d.boyut  = toplam || d.boyut;
        d.giden  = giden;
        gorselGostergesiTazele(projeId);
      });
      /* Yükleme bitti ama imzalı adres ve palet kaydı hâlâ gidiyor: halka
         dolu kalsın, iş gerçekten bitmeden "bitti" demesin. */
      GORSEL_YUKLENIYOR[projeId] = { oran: 1, boyut: dosya.size, giden: dosya.size, bitti: true, no };
      gorselGostergesiTazele(projeId);

      /* Katman, yeni görsel inene kadar duruyor. Eski dosya zaten silinmiyor;
         aynı yolun üstüne yazılıyor. Kötü görünen şey silme değil, katman
         kalkınca yeni görselin daha inmemiş olmasıydı. */
      const pr = DB.proje(projeId);
      await gorseliOnyukle(pr ? gorselAdresi(pr, no) : '');

      delete GORSEL_YUKLENIYOR[projeId];
      render();
      toast('Görsel yüklendi.', 'basari');
    } catch (h) {
      delete GORSEL_YUKLENIYOR[projeId];
      render();
      toast(h.message, 'hata');
    }
  });

  alan.click();
}

/* Bir ekranın blok listesi. */
function ekranOku(metin) {
  const o = jsonBlokOku(metin, x => Array.isArray(x.bloklar) && x.bloklar.length);
  if (!o) return null;
  const kis = (v, n) => String(v == null ? '' : v).trim().slice(0, n);
  const bloklar = o.bloklar.filter(b => b && b.ad).slice(0, 12).map(b => ({
    ad: kis(b.ad, 50), tur: kis(b.tur, 20).toLowerCase(), not: kis(b.not, 200),
  }));
  if (!bloklar.length) return null;
  return { ekran: kis(o.ekran, 60), bloklar, onay: false,
           zaman: new Date().toISOString() };
}

function kb(n) {
  return n > 1024 * 1024
    ? (n / 1024 / 1024).toFixed(1) + ' MB'
    : Math.round(n / 1024) + ' KB';
}

/* Çözümleme cevabını okur: sayfalar, künyeler ve açık sorular. */
/* Okunan bloğu taslağa işleyip yapıyı kurar. Hem panodan doğrudan kurmada
   hem de yapıştırma penceresinde aynı yol kullanılıyor. */
async function cozumKur(p, t, cozum, guncelleMi) {
  cozumlemeUygula(t, cozum, p);
  if (!t.modul) {
    const digerVarMi = DB.modulleri(p.id).some(m => m.ad !== GENEL_MODUL);
    if (!digerVarMi) {
      /* İlk ve tek bölüm: adını Program temeli'nde zaten almıştı. */
      t.modul = modulAdi(p) || 'Program';
    } else {
      await new Promise(r => setTimeout(r, 260));
      t.modul = await metinSor({ baslik: 'Bu bölümün adı',
        aciklama: 'Blokta yazmıyordu, sen yaz.', yerTutucu: 'Örn. İnsan Kaynakları',
        buton: 'Tamam', deger: '' }) || 'Yeni bölüm';
    }
  }
  try {
    await yapiTaslagiKur(p, t);
    delete YAPI_TASLAK[p.id];
    toast(cozum.sayfalar.length + ' sayfa ' + (guncelleMi ? 'güncellendi.' : 'kuruldu.'));
    render();
  } catch (err) { toast(err.message, 'hata'); }
}

function anlatAktarAc(projeId) {
  modalHepsiniKapat();
  const p = DB.proje(projeId);
  if (!p) return;
  const t = yapiTaslak(p);

  modalAc(`
    ${modalBaslik(ICON.ice, 'Çözümlemeyi yapıştır',
      'Claude\'un döndürdüğü bloğu olduğu gibi yapıştır.')}
    <label class="field">
      <span>Yapıştır</span>
      <textarea id="cz-metin" rows="10" spellcheck="false"
        placeholder='{ "sayfalar": [ … ], "sorular": [ … ] }'></textarea>
    </label>
    <div id="cz-onizleme"></div>
    <div class="modal-alt">
      <button class="btn btn-ghost" data-cz="iptal" type="button">Vazgeç</button>
      <button class="btn btn-primary" data-cz="kaydet" type="button" disabled>
        <span>Aktar</span></button>
    </div>`, kutu => {
    const alan  = $('#cz-metin', kutu);
    const on    = $('#cz-onizleme', kutu);
    const dugme = $('[data-cz="kaydet"]', kutu);
    let cozum = null;

    const tazele = () => {
      cozum = cozumlemeOku(alan.value);
      if (!alan.value.trim()) { on.innerHTML = ''; dugme.disabled = true; return; }
      if (!cozum) {
        on.innerHTML = `<div class="pa-denetim hata">${svg(ICON.uyari, 13)}
          <span>Blok okunamadı. Claude\'un verdiği <b>{ … }</b> parçasını
          olduğu gibi yapıştır.</span></div>`;
        dugme.disabled = true; return;
      }
      on.innerHTML = `<div class="pa-denetim">${svg(ICON.tik, 13)}
        <span><b>${cozum.sayfalar.length} sayfa</b> okundu${
          cozum.kararlar.length ? ` · <b>${cozum.kararlar.length} karar</b> kaydedilecek` : ''
        }.</span></div>
        <div class="satirlar">${cozum.sayfalar.map(sf => `
          <div class="sr"><b>${esc(sf.ad)}</b>
            <span class="ipucu">${esc([sf.tur, (sf.alanlar || []).length + ' alan',
              (sf.kalip || []).map(x => (KALIP.find(k => k.anahtar === x) || {}).ad)
                .filter(Boolean).join(', ')].filter(Boolean).join(' · '))}</span></div>`).join('')}
        </div>`;
      dugme.disabled = false;
    };

    alan.addEventListener('input', tazele);
    $('[data-cz="iptal"]', kutu).addEventListener('click', modalKapat);
    $('[data-cz="kaydet"]', kutu).addEventListener('click', async () => {
      if (!cozum) return;
      /* Modül zaten kuruluysa bu bir "Modülü güncelle" yapıştırması: elle
         "Kur" adımı yok, yapıştırınca doğrudan kaydedilir. */
      const guncelleMi = t.modul && DB.modulleri(p.id).some(m => m.ad === t.modul);
      modalKapat();
      await cozumKur(p, t, cozum, guncelleMi);
    });
  });
}

/* JSON bloğunu metnin içinden çekip okur — Claude çoğu zaman önüne
   arkasına açıklama yazıyor, kod çiti koyuyor. */
/* ---------- Yapıştırılan JSON bloğu ----------
   Üç sürüm boyunca ayıklanan onarımlar burada: telefondan yapıştırılan blok
   kıvrık tırnaklı geliyor, dış süslü parantez ile ilk anahtarın açılış
   tırnağı seçime girmiyor, kapanış parantezi kimi zaman var kimi zaman yok.
   İki okuyucu da (modül çözümlemesi ve ihtiyaç çözümlemesi) bunu kullanıyor;
   birinde düzelen ötekinde de düzelsin. */
function jsonBlokOku(metin, gecerli) {
  const ham = String(metin || '');
  const cit = ham.match(/```(?:json)?\s*([\s\S]*?)```/);
  let govde = (cit ? cit[1] : ham)
    .replace(/[\u201C\u201D\u201E\u00AB\u00BB]/g, '"')   /* kıvrık çift tırnak */
    .replace(/[\u2018\u2019\u201A]/g, "'")                 /* kıvrık tek tırnak */
    .replace(/[\u00A0\u2007\u202F]/g, ' ')                 /* bölünmez boşluk */
    .replace(/[\u2013\u2014]/g, '-');                       /* uzun tire */

  const dene = m => { try { return JSON.parse(m); } catch (h) { return null; } };

  const bas = govde.indexOf('{'), son = govde.lastIndexOf('}');
  let o = (bas >= 0 && son > bas) ? dene(govde.slice(bas, son + 1)) : null;

  /* `o` dolu ama beklenen alan yoksa yanlış parçayı okumuşuz demektir: dış
     parantez düştüğünde ilk iç nesne tek başına geçerli JSON oluyor ve
     ayrıştırma "başarılı" görünüyor. Onarımı o durumda da deniyoruz. */
  if ((!o || !gecerli(o)) && /^\s*"?\w+"\s*:/.test(govde)) {
    const govdeIc = govde.replace(/^\s*(\w+)"\s*:/, '"$1":').replace(/[,\s]+$/, '');
    o = dene('{' + govdeIc) || dene('{' + govdeIc + '}');
  }
  return o && gecerli(o) ? o : null;
}

function cozumlemeOku(metin) {
  const o = jsonBlokOku(metin, x => Array.isArray(x.sayfalar) && x.sayfalar.length);
  if (!o) return null;
  return {
    modul: typeof o.modul === 'string' ? o.modul.trim() : '',
    modulKurallari: o.modulKurallari && typeof o.modulKurallari === 'object'
      ? o.modulKurallari : {},
    sayfalar: o.sayfalar.filter(x => x && x.ad),
    kararlar: Array.isArray(o.kararlar)
      ? o.kararlar.filter(x => x && x.soru).map(x => ({ soru: x.soru, cevap: x.cevap || '' }))
      : [],
    baglantilar: Array.isArray(o.baglantilar)
      ? o.baglantilar.filter(x => x && x.nereden && x.nereye) : [],
    hazirVeri: Array.isArray(o.hazirVeri) ? o.hazirVeri.filter(x => x && x.kaynak) : [],
    ciktilar: Array.isArray(o.ciktilar) ? o.ciktilar.filter(x => x && x.ad) : [],
  };
}

/* Okunan çözümlemeyi taslağa yazar. Kullanıcının elle girdiği bir şey
   varsa üstüne yazmıyoruz: soru sormadan veri kaybettirmek olur. */
function cozumlemeUygula(t, cozum, p) {
  /* Modül düzeyinde yalnız ortak iş kuralı okunuyor: yetki artık tasarım
     anında değil, uygulamanın Yetkiler ekranından belirleniyor. */
  const mkg = cozum.modulKurallari || {};
  /* Modül adı Claude'dan geldiyse ve gerçek, kurulu başka bir modülü
     gösteriyorsa ona geç — "t" proje başına tek nesne, ekranda en son
     hangi modül açık kaldıysa o kalıyor (ör. Kurulum ve yapı'da bir modül
     açık kalmış, Beta'da başka modül için gelen cevap yapıştırılmış).
     Geçerken o modülün kendi künyesi/anlatımı da yeniden yüklenir; yoksa
     yeni sayfalar yanlış modülün üstüne yazılırdı. */
  if (cozum.modul && cozum.modul !== t.modul) {
    const gercekMi = DB.modulleri(p.id).some(m => m.ad === cozum.modul && m.ad !== GENEL_MODUL);
    if (gercekMi) modulYukle(p, t, cozum.modul);
    else if (!t.modul) t.modul = cozum.modul;
  }
  t.mk = t.mk || { kural: '' };
  if (!t.mk.kural && mkg.kural) t.mk.kural = mkg.kural;
  /* Bu dördü modül güncelleme/beta promptlarında hiç istenmiyor — boş
     gelirse üstüne yazıp ilk kurulumda kaydedileni silmesin. */
  if (cozum.kararlar.length)    t.kararlar    = cozum.kararlar;
  if (cozum.baglantilar.length) t.baglantilar = cozum.baglantilar;
  if (cozum.hazirVeri.length)   t.hazirVeri   = cozum.hazirVeri;
  if (cozum.ciktilar.length)    t.ciktilar    = cozum.ciktilar;
  cozum.sayfalar.forEach(sf => {
    if (!t.sayfalar.includes(sf.ad)) t.sayfalar.push(sf.ad);
    const k = yapiKunye(t, sf.ad);
    if (!k.amac) k.amac = sf.amac || '';
    if (!k.tur)  k.tur  = (SAYFA_TURU.find(x => x.ad === sf.tur) || {}).ad || '';
    /* Öbeği Claude belirliyor: "Raporlar", "Ayarlar", "Panolar" gibi. Sayfa
       türünden (Liste/Form) daha anlamlı, çünkü işe göre ayırıyor. */
    if (!k.grup && typeof sf.grup === 'string') k.grup = sf.grup.trim().slice(0, 40);
    /* Var olan alan adına dokunulmuyor — yalnız hiç olmayan eklenir. "Modül
       güncelle" akışı zaten kurulu bir sayfaya sonradan bulunan bir alanı
       ekleyebilsin diye "hepsi boşsa doldur" değil, alan alan bakılıyor. */
    if (Array.isArray(sf.alanlar)) {
      const varOlanAdlar = k.alanlar.map(a => a.ad);
      sf.alanlar.filter(a => a && a.ad && !varOlanAdlar.includes(a.ad)).forEach(a => {
        k.alanlar.push({
          ad: a.ad,
          tur: (ALAN_TURU.find(x => x.ad === a.tur) || ALAN_TURU[0]).ad,
          zorunlu: !!a.zorunlu,
          degerler: Array.isArray(a.degerler) ? a.degerler.filter(Boolean) : [],
          kaynak: a.kaynak || '',
        });
      });
    }

    if (!(k.kalip || []).length && Array.isArray(sf.kalip)) {
      /* Tek kalıp: blok birkaç tane yollarsa ilki alınır. */
      k.kalip = sf.kalip.filter(x => KALIP.some(kl => kl.anahtar === x)).slice(0, 1);
    }
    if (sf.kalipCevap && typeof sf.kalipCevap === 'object') {
      k.kalipCevap = Object.assign({}, sf.kalipCevap, k.kalipCevap || {});
    }
    if (!k.olcek && sf.olcek) {
      k.olcek = (OLCEK.find(x => x.ad === sf.olcek) || {}).ad || '';
    }
    if (!k.ayniKayit && sf.ayniKayit) k.ayniKayit = sf.ayniKayit;
    /* Sayfaya özel ayrım yalnız blok öyle diyorsa. Kimin görebileceği artık
       burada okunmuyor — Yetkiler ekranının işi, admin runtime'da yönetiyor. */
    const fk = sf.fark || {};
    k.fark = k.fark || { kural: '' };
    if (!k.fark.kural && fk.kural) k.fark.kural = fk.kural;
  });
}


/* ==========================================================================
   EKİP
   ========================================================================== */

/* Yeni kullanıcı penceresi. Şifreyi yönetici belirler, kişiye kendisi iletir. */
function kullaniciEkleAc() {
  modalHepsiniKapat();

  modalAc(`
    ${modalBaslik(ICON.kisi, 'Yeni Kullanıcı', 'Geçici şifreyi sen belirle, kişiye ilet. Girdikten sonra değiştirebilir.')}

    <label class="field">
      <span>Ad Soyad</span>
      <input type="text" id="ke-ad" placeholder="Örn. Ahmet Yılmaz" maxlength="60" autocomplete="off">
    </label>
    <label class="field">
      <span>E-posta</span>
      <input type="email" id="ke-mail" placeholder="ad@firma.com" autocomplete="off"
             autocapitalize="off" spellcheck="false">
    </label>
    <label class="field">
      <span>Geçici şifre <em class="ipucu">en az 8 karakter</em></span>
      <input type="text" id="ke-sifre" placeholder="Örn. Nizam2026!" autocomplete="off"
             autocapitalize="off" spellcheck="false">
    </label>
    <div class="field">
      <span>Rol</span>
      <div class="secenek-serit">
        <button class="ss sec" data-rol="gelistirici" type="button">Geliştirici</button>
        <button class="ss" data-rol="yonetici" type="button">Yönetici</button>
      </div>
    </div>

    <div class="note note-kucuk">
      ${svg(ICON.info, 15)}
      <span><b>Geliştirici</b> yalnızca kendine atanan görevleri görür.
      <b>Yönetici</b> her şeyi görür ve onaylar.</span>
    </div>

    <div class="modal-alt">
      <button class="btn btn-ghost" data-ke="iptal" type="button">Vazgeç</button>
      <button class="btn btn-primary" data-ke="kaydet" type="button"><span>Kullanıcıyı Aç</span></button>
    </div>`, kutu => {
    let rol = 'gelistirici';

    $$('[data-rol]', kutu).forEach(b => b.addEventListener('click', () => {
      rol = b.dataset.rol;
      $$('[data-rol]', kutu).forEach(x => x.classList.toggle('sec', x === b));
    }));

    setTimeout(() => $('#ke-ad', kutu).focus(), 40);
    $('[data-ke="iptal"]', kutu).addEventListener('click', modalKapat);

    $('[data-ke="kaydet"]', kutu).addEventListener('click', async () => {
      const ad    = $('#ke-ad', kutu).value.trim();
      const mail  = $('#ke-mail', kutu).value.trim().toLowerCase();
      const sifre = $('#ke-sifre', kutu).value;

      if (ad.length < 2)   { toast('Ad soyad yaz.'); return; }
      if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(mail)) { toast('Geçerli bir e-posta yaz.'); return; }
      if (sifre.length < 8) { toast('Şifre en az 8 karakter olmalı.'); return; }

      const yazi = $('[data-ke="kaydet"] span', kutu);
      yazi.textContent = 'Açılıyor…';
      try {
        await DB.kullaniciEkle({ mail, ad, rol, sifre });
        modalKapat();
        render();
        toast(ad + ' eklendi.', 'basari');
      } catch (h) {
        yazi.textContent = 'Kullanıcıyı Aç';
        toast(h.message, 'hata');
      }
    });
  });
}

/* Bir kişiyi düzenler: ad, rol, aktiflik. Kendi satırında rol ve aktiflik
   kapalı — son yönetici kendini kilitleyemesin. */
function kisiDuzenle(id) {
  const k = DB.kisilerHepsi.find(x => x.id === id);
  if (!k) return;
  const ben = AUTH.user && k.id === AUTH.user.id;

  /* Veritabanında tek "ad" alanı var. Ekranda ikiye bölünüyor: son
     sözcük soyad, kalanı ad. Kaydederken yine birleşiyor. */
  const parca = String(k.ad || '').trim().split(/\s+/).filter(Boolean);
  const soyad = parca.length > 1 ? parca.pop() : '';
  const adi   = parca.join(' ');

  const epostaVar = k.eposta || (ben && AUTH.user ? AUTH.user.email : '') || '';
  /* Tarih kutusu YYYY-AA-GG ister. Kayıtlı tarih yoksa hesabın açıldığı gün. */
  const katilimGun = String(k.katilim || k.olusturuldu || '').slice(0, 10);

  const goz = '<svg viewBox="0 0 24 24"><path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12z"></path>'
    + '<circle cx="12" cy="12" r="3.2"></circle></svg>';

  modalHepsiniKapat();
  modalAc(`
    <h3 class="modal-h">Ekip Üyesini Düzenle</h3>
    <p class="modal-s">Ekip üyesinin bilgilerini güncelle.</p>

    <div class="kd-ust">
      <span class="kd-foto ${k.foto ? 'resimli' : ''}"
            ${k.foto ? `style="background-image:url('${esc(k.foto)}')"` : ''}>
        <b>${esc(basHarf(k.ad || '?'))}</b>
        ${ben ? `<button class="kd-kamera" data-kd="foto" type="button" aria-label="Fotoğrafı değiştir">
          ${svg(ICON.resim, 14)}</button>` : ''}
      </span>
      <label class="field"><span>Ad</span>
        <input type="text" id="kd-ad" value="${esc(adi)}" maxlength="40" autocomplete="off"></label>
      <label class="field"><span>Soyad</span>
        <input type="text" id="kd-soyad" value="${esc(soyad)}" maxlength="30" autocomplete="off"></label>
    </div>

    <div class="kd-cift">
      <label class="field"><span>E-posta</span>
        <input type="email" id="kd-mail" value="${esc(epostaVar)}" placeholder="ad@firma.com"
               autocomplete="off" autocapitalize="off" spellcheck="false"></label>
      <label class="field"><span>Şifre</span>
        <span class="kd-sifre">
          <input type="password" id="kd-sifre" placeholder="Yeni şifre" autocomplete="new-password"
                 autocapitalize="off" spellcheck="false">
          <button class="kd-goz" data-kd="goz" type="button" aria-label="Şifreyi göster">${goz}</button>
        </span></label>
    </div>

    <div class="kd-cift">
      <label class="field"><span>Telefon</span>
        <input type="tel" id="kd-tel" value="${esc(k.telefon || '')}" placeholder="+90 555 123 45 67"
               autocomplete="off"></label>
      <label class="field"><span>Rol</span>
        <span class="kd-secim">
          <select id="kd-rol" ${ben ? 'disabled' : ''}>
            <option value="gelistirici" ${k.rol === 'gelistirici' ? 'selected' : ''}>Geliştirici</option>
            <option value="yonetici" ${k.rol === 'yonetici' ? 'selected' : ''}>Yönetici</option>
          </select>
          <svg viewBox="0 0 24 24"><path d="M6 9l6 6 6-6"></path></svg>
        </span></label>
    </div>

    <div class="field kd-tek"><span>Ekibe katılım</span>
      <div class="kd-katilim">
        <div class="secenek-serit">
          <button class="ss ${k.kurucu ? '' : 'sec'}" data-kur="0" type="button">Tarih</button>
          <button class="ss ${k.kurucu ? 'sec' : ''}" data-kur="1" type="button">Kurucu</button>
        </div>
        <input type="date" id="kd-katilim" class="kd-tarih ${k.kurucu ? 'gizli' : ''}"
               value="${esc(katilimGun)}" max="${esc(bugunTarih())}">
      </div>
    </div>

    <p class="kd-ipucu">Şifre boş bırakılırsa değişmez. Kurucunun katılım tarihi olmaz.</p>

    <div class="modal-alt kd-alt">
      <button class="btn btn-primary kd-guncelle" data-kd="kaydet" type="button">
        ${svg(ICON.tik, 16)}<span>Güncelle</span></button>
      <button class="btn btn-ghost" data-kd="iptal" type="button">İptal</button>
    </div>`, kutu => {
    /* Kurucu seçilince tarih kutusu gizleniyor: kurucunun katılım tarihi yok. */
    let kurucu = !!k.kurucu;
    $$('[data-kur]', kutu).forEach(b => b.addEventListener('click', () => {
      kurucu = b.dataset.kur === '1';
      $$('[data-kur]', kutu).forEach(x => x.classList.toggle('sec', x === b));
      $('#kd-katilim', kutu).classList.toggle('gizli', kurucu);
    }));

    const fotoDug = $('[data-kd="foto"]', kutu);
    if (fotoDug) fotoDug.addEventListener('click', () => { modalKapat(); fotoSec(); });

    $('[data-kd="goz"]', kutu).addEventListener('click', () => {
      const alan = $('#kd-sifre', kutu);
      alan.type = alan.type === 'password' ? 'text' : 'password';
      $('[data-kd="goz"]', kutu).classList.toggle('acik', alan.type === 'text');
    });

    $('[data-kd="iptal"]', kutu).addEventListener('click', modalKapat);
    $('[data-kd="kaydet"]', kutu).addEventListener('click', async () => {
      const ad = ($('#kd-ad', kutu).value.trim() + ' ' + $('#kd-soyad', kutu).value.trim()).trim();
      const mail = $('#kd-mail', kutu).value.trim().toLowerCase();
      const tel = $('#kd-tel', kutu).value.trim();
      const sifre = $('#kd-sifre', kutu).value;

      if (ad.length < 2) { toast('Ad yaz.'); return; }
      if (mail && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(mail)) { toast('Geçerli bir e-posta yaz.'); return; }
      if (sifre && sifre.length < 8) { toast('Şifre en az 8 karakter olmalı.'); return; }

      const yazi = $('[data-kd="kaydet"] span', kutu);
      yazi.textContent = 'Kaydediliyor…';
      try {
        const sonuc = await DB.kullaniciGuncelle({
          id: k.id, ad, telefon: tel, eposta: mail, sifre,
          kurucu, katilim: kurucu ? null : $('#kd-katilim', kutu).value,
          epostaDegisti: !!mail && mail !== String(epostaVar || '').toLowerCase(),
          rol: ben ? undefined : $('#kd-rol', kutu).value,
        });
        if (ben) await AUTH.profilOku();
        modalKapat();
        kullaniciYaz();
        render();
        toast(sonuc && sonuc.uyari ? sonuc.uyari : 'Kaydedildi.', sonuc && sonuc.uyari ? 'bilgi' : 'basari');
      } catch (h) {
        yazi.textContent = 'Güncelle';
        toast(h.message, 'hata');
      }
    });
  });
}

/* Telefondan resim seçtirir, yükler. Gizli bir dosya alanı kullanılıyor:
   görünür bir <input type="file"> tasarımı bozuyor. */
function fotoSec() {
  const alan = document.createElement('input');
  alan.type = 'file';
  alan.accept = 'image/*';
  alan.style.display = 'none';
  document.body.appendChild(alan);

  alan.addEventListener('change', async () => {
    const dosya = alan.files && alan.files[0];
    alan.remove();
    if (!dosya) return;

    toast('Fotoğraf yükleniyor…');
    try {
      await DB.fotoYukle(dosya);
      kullaniciYaz();
      render();
      toast('Fotoğraf güncellendi.', 'basari');
    } catch (h) {
      toast(h.message, 'hata');
    }
  });

  alan.click();
}

/* Hesap paneli: ayrı bir kart değil — üst çubuğun aşağı doğru uzayan parçası.

   Panel içeriği AŞAĞI İTMİYOR, üstüne biniyor. İtseydi her karede sayfanın
   yerleşimi baştan hesaplanırdı.

   Panel BİR KEZ kuruluyor, sonra yalnız gösterilip gizleniyor. Eskiden her
   açılışta sıfırdan yaratılıyordu: beş satır, beş satır içi simge ve
   dinleyiciler kuruluyor, ardından AYNI karede hareket başlıyordu. İlk kare
   hem yeni düğümleri çizmek hem hareketi başlatmak zorunda kalıyor, açılış
   orada takılıyordu. Artık ilk kare yalnız hareketi taşıyor. */
function hesapPaneliKur() {
  const destekYazi = DESTEK.tip === 'wa' ? 'WhatsApp' : DESTEK.deger;

  const el = document.createElement('div');
  el.id = 'hesap-panel';
  el.className = 'hesap-panel';
  el.innerHTML = `
    <button class="hp-sat" data-hs="ayarlar" type="button">
      <span class="hp-ikon">${svg(ICON.ayar, 16)}</span>
      <span class="hp-ad">Ayarlar</span>
    </button>
    <button class="hp-sat" data-hs="not" type="button">
      <span class="hp-ikon">${svg(ICON.kalem, 16)}</span>
      <span class="hp-ad">Not defteri</span>
    </button>
    <button class="hp-sat" data-hs="bildirim" type="button">
      <span class="hp-ikon">${svg(ICON.zil, 16)}</span>
      <span class="hp-ad">Bildirimler</span>
      <span class="hp-deger">Adım 5'te</span>
    </button>
    <button class="hp-sat" data-hs="destek" type="button">
      <span class="hp-ikon">${svg(ICON.destek, 16)}</span>
      <span class="hp-ad">Destek</span>
      <span class="hp-deger">${esc(destekYazi)}</span>
    </button>
    <button class="hp-sat" data-hs="guncelle" type="button">
      <span class="hp-ikon">${svg(ICON.kum, 16)}</span>
      <span class="hp-ad">Güncellemeleri denetle</span>
      <span class="hp-deger">${esc(APP.version)}</span>
    </button>
    <button class="hp-sat tehlike-satir" data-hs="cikis" type="button">
      <span class="hp-ikon">${svg(ICON.cikis, 16)}</span>
      <span class="hp-ad">Çıkış yap</span>
    </button>`;

  /* Ayarlar alt çubuktan çıkarıldı (onaylanan tasarımda beş sekme var);
     mobilde tek kapısı burası. */
  $('[data-hs="ayarlar"]', el).addEventListener('click', () => {
    hesapMenusuKapat();
    location.hash = '#/ayarlar';
  });
  $('[data-hs="not"]', el).addEventListener('click', () => {
    hesapMenusuKapat();
    notDefteriAc(true);
  });
  $('[data-hs="bildirim"]', el).addEventListener('click', () => {
    hesapMenusuKapat();
    toast('Bildirimler Adım 5\'te gelecek.');
  });
  $('[data-hs="destek"]', el).addEventListener('click', () => {
    hesapMenusuKapat();
    const yer = DESTEK.tip === 'wa'
      ? 'https://wa.me/' + String(DESTEK.deger).replace(/\D/g, '')
      : 'mailto:' + DESTEK.deger;
    disariAc(yer);
  });
  /* Denetleme sürerken panel açık kalıyor: kum saati orada dönüyor, sonucu
     kullanıcı satırın kendisinde görüyor. Panel kapansaydı dönen bir şey
     kalmaz, sonuç yalnız bildirim balonunda görünürdü. */
  $('[data-hs="guncelle"]', el).addEventListener('click', async ev => {
    const dug = ev.currentTarget;
    if (dug.classList.contains('deneniyor')) return;
    const ad    = $('.hp-ad', dug);
    const ilkAd = ad.textContent;
    dug.classList.add('deneniyor');
    ad.textContent = 'Denetleniyor…';

    const sonuc = await GUNCELLEME.elleDenetle();
    /* Yeni sürüm bulunduysa sayfa birazdan kendini yeniliyor: kum saati
       dönmeye devam etsin, iş bitmiş gibi durmasın. */
    if (sonuc === 'yeni') return;
    dug.classList.remove('deneniyor');
    ad.textContent = ilkAd;
  });

  $('[data-hs="cikis"]', el).addEventListener('click', () => { hesapMenusuKapat(); signOut(); });

  $('#topbar').appendChild(el);
  return el;
}

function hesapMenusu() {
  const el = $('#hesap-panel') || hesapPaneliKur();
  if (el.classList.contains('acik')) { hesapMenusuKapat(); return; }

  $('#topbar').classList.add('panel-acik');

  /* Sınıfı eklemeden önce başlangıç stilinin gerçekten işlendiğinden emin
     ol. Tek `requestAnimationFrame` yetmiyor: tarayıcı ilk stili ve `.acik`
     stilini aynı karede birleştirirse geçiş hiç başlamıyor, panel zıplayarak
     geliyordu. Düzeni bir kez okumak (`offsetHeight`) stili zorluyor. */
  void el.offsetHeight;
  requestAnimationFrame(() => requestAnimationFrame(() => el.classList.add('acik')));

  setTimeout(() => {
    document.addEventListener('click', disariBasinca);
    document.addEventListener('keydown', escBasinca);
  }, 0);
}

function disariBasinca(e) {
  if (e.target.closest('#hesap-panel') || e.target.closest('#user-tile')) return;
  hesapMenusuKapat();
}
function escBasinca(e) { if (e.key === 'Escape') hesapMenusuKapat(); }

function hesapMenusuKapat() {
  const el = $('#hesap-panel');
  document.removeEventListener('click', disariBasinca);
  document.removeEventListener('keydown', escBasinca);
  $('#topbar').classList.remove('panel-acik');
  if (!el) return;
  /* Panel silinmiyor, yalnız kapanıyor: bir dahaki açılışta yeniden
     kurulmasın. Kapalıyken `visibility: hidden` olduğu için tıklamayı da
     yutmuyor. */
  el.classList.remove('acik');
}

/* Standart yazma / düzenleme penceresi */
/* Claude'un verdiği kural bloğunu standarda çevirir. Önizleme, yazmadan
   önce neyin nereye düşeceğini gösteriyor: yanlış grup ya da okunamayan
   blok en çok burada yakalanıyor. */
function standartIceAktar() {
  modalHepsiniKapat();

  modalAc(`
    ${modalBaslik(ICON.ice, 'Kuralı yapıştır',
      'Claude\'un verdiği bloğu olduğu gibi yapıştır. Birden fazlaysa aralarına --- koy.')}
    <label class="field">
      <span>Yapıştır</span>
      <textarea id="si-metin" rows="11" spellcheck="false"
        placeholder="Grup: Tasarım&#10;Alan: Üst çubuk&#10;Başlık: Araç düğmeleri profil panelinde&#10;Kural: Üst çubukta yalnız marka, sayfa adı ve kullanıcı kutusu durur…"></textarea>
    </label>
    <div id="si-onizleme"></div>
    <div class="modal-alt">
      <button class="btn btn-ghost" data-si="iptal" type="button">Vazgeç</button>
      <button class="btn btn-primary" data-si="kaydet" type="button" disabled><span>Kaydet</span></button>
    </div>`, kutu => {
    const alan  = $('#si-metin', kutu);
    const on    = $('#si-onizleme', kutu);
    const dugme = $('[data-si="kaydet"]', kutu);
    let cozum = { kayitlar: [], hatalar: [] };

    const tazele = () => {
      const metin = alan.value.trim();
      if (!metin) { on.innerHTML = ''; dugme.disabled = true; return; }

      cozum = standartCozumle(metin);
      dugme.disabled = !cozum.kayitlar.length;

      const yeni = k => !DB.standartlar.some(st => (st.alan || st.ad) === k.alan && st.ad === k.ad);

      on.innerHTML = (cozum.kayitlar.length
        ? `<span class="label">${cozum.kayitlar.length} kural</span>
           <div class="card"><div class="row-list">
             ${cozum.kayitlar.map(k => `<div class="row">
               <div class="row-main">
                 <span class="row-title">${esc(k.alan)} · ${esc(k.ad)}</span>
                 <span class="row-sub">${esc(k.grup)}</span>
               </div>
               <span class="row-val">${yeni(k) ? 'yeni' : 'güncellenecek'}</span>
             </div>`).join('')}
           </div></div>`
        : `<div class="note uyari">${svg(ICON.uyari, 15)}
            <span>Blok okunamadı. Satırlar <b class="mono">Grup:</b>,
            <b class="mono">Alan:</b>, <b class="mono">Başlık:</b> ve
            <b class="mono">Kural:</b> ile başlamalı.</span></div>`)
        + (cozum.hatalar.length
          ? `<div class="note uyari" style="margin-top:8px">${svg(ICON.uyari, 15)}
              <span>${cozum.hatalar.map(esc).join(' ')}</span></div>` : '');
    };

    alan.addEventListener('input', tazele);
    setTimeout(() => alan.focus(), 40);

    $('[data-si="iptal"]', kutu).addEventListener('click', modalKapat);
    $('[data-si="kaydet"]', kutu).addEventListener('click', async () => {
      if (!cozum.kayitlar.length) return;
      const btn = $('[data-si="kaydet"] span', kutu);
      btn.textContent = 'Kaydediliyor…';
      try {
        const sonuc = await DB.standartlarIceAktar(cozum.kayitlar);
        modalKapat();
        ACIK_GRUP = cozum.kayitlar[0].grup;
        /* Tur bitti: birinci kart ilk hâline dönüyor, bir sonraki standart
           için hazır. Vazgeçilirse dokunulmuyor — prompt panoda duruyor. */
        STD_KOPYALANDI = false;
        render();
        toast(`${sonuc.eklenen} eklendi, ${sonuc.guncellenen} güncellendi.`);
      } catch (e) {
        toast(e.message, 'hata');
        btn.textContent = 'Kaydet';
      }
    });
  }, 'genis');
}

function standartDuzenle(id) {
  modalHepsiniKapat();
  const st = id ? DB.standart(id) : null;

  modalAc(`
    ${modalBaslik(ICON.katman, st ? 'Standardı düzenle' : 'Yeni standart', 'Kural prompta olduğu gibi girer — net ve emir kipinde yaz.')}

    <label class="field">
      <span>Grup <em class="ipucu">işin cinsi</em></span>
      <select id="sd-grup">
        ${STANDART_GRUPLARI.map(g => `<option value="${esc(g)}"${
          (st ? st.grup : VARSAYILAN_GRUP) === g ? ' selected' : ''}>${esc(g)}</option>`).join('')}
      </select>
    </label>
    <label class="field">
      <span>Alan <em class="ipucu">ekranın hangi parçası</em></span>
      <input type="text" id="sd-alan" list="sd-alanlar" maxlength="60" autocomplete="off"
             value="${esc(st ? (st.alan || st.ad) : '')}" placeholder="Örn. Üst çubuk">
      <datalist id="sd-alanlar">
        ${alanSecenekleri().map(a => `<option value="${esc(a)}"></option>`).join('')}
      </datalist>
    </label>
    <label class="field">
      <span>Başlık <em class="ipucu">kural ne diyor, iki üç kelime</em></span>
      <input type="text" id="sd-ad" value="${esc(st ? st.ad : '')}"
             placeholder="Örn. Araç düğmeleri profil panelinde" maxlength="80" autocomplete="off">
    </label>
    <label class="field">
      <span>Kural <em class="ipucu">prompta giren metin</em></span>
      <textarea id="sd-tarif" rows="7"
        placeholder="Üst çubukta yalnız marka, sayfa adı ve kullanıcı kutusu durur…">${esc(st ? st.tarif : '')}</textarea>
    </label>
    <label class="field">
      <span>Sunucusuz projede <em class="ipucu">boş bırakılabilir</em></span>
      <textarea id="sd-yerel" rows="3"
        placeholder="Veri kullanıcının cihazında kalan projelerde bu kuralın karşılığı ne? Yoksa boş bırak.">${esc(st ? (st.yerel || '') : '')}</textarea>
    </label>

    <div class="modal-alt">
      <button class="btn btn-ghost" data-sd="iptal" type="button">Vazgeç</button>
      <button class="btn btn-primary" data-sd="kaydet" type="button"><span>Kaydet</span></button>
    </div>`, kutu => {
    setTimeout(() => $('#sd-alan', kutu).focus(), 40);

    $('[data-sd="iptal"]', kutu).addEventListener('click', modalKapat);
    $('[data-sd="kaydet"]', kutu).addEventListener('click', async () => {
      const ad    = $('#sd-ad', kutu).value.trim();
      const alan  = $('#sd-alan', kutu).value.trim();
      const grup  = $('#sd-grup', kutu).value.trim() || VARSAYILAN_GRUP;
      const tarif = $('#sd-tarif', kutu).value.trim();
      const yerel = $('#sd-yerel', kutu).value.trim();

      if (!alan)  { toast('Alanı yaz — ekranın hangi parçası?'); return; }
      if (!ad)    { toast('Başlığı yaz — kural ne diyor?'); return; }
      if (!tarif) { toast('Kuralı yaz — prompta bu metin giriyor.'); return; }

      const btn = $('[data-sd="kaydet"] span', kutu);
      btn.textContent = 'Kaydediliyor…';
      try {
        await DB.standartKaydet(id, { ad, alan, grup, tarif, yerel,
          eklendi: APP.version });
        modalKapat();
        ACIK_GRUP = grup;
        if (id) ACIK_STANDART.add(id);
        render();
        toast(id ? 'Standart güncellendi.' : 'Standart eklendi.');
      } catch (e) {
        toast(e.message, 'hata');
        btn.textContent = 'Kaydet';
      }
    });
  }, 'genis');
}

/* ==========================================================================
   SEÇENEK PENCERESİ
   ========================================================================== */

/* Küçük bir eylem listesi gösterir. Vazgeçilirse null döner.
   Açılır menü yerine pencere: mobilde parmakla da rahat kullanılır. */
function secenekSor(baslik, secenekler) {
  return new Promise(resolve => {
    modalAc(`
      <h3 class="modal-h">${esc(baslik)}</h3>
      <div class="secim" style="margin-top:16px">
        ${secenekler.map(o => `
          <button class="sc ${o.tehlike ? 'tehlikeli' : ''}" data-o="${o.anahtar}" type="button">
            <span class="sc-ikon">${svg(o.ikon, 16)}</span>
            <span class="sc-yazi"><span class="sc-ad">${esc(o.ad)}</span>
            ${o.alt ? `<span class="sc-alt">${esc(o.alt)}</span>` : ''}</span>
          </button>`).join('')}
      </div>
      <div class="modal-alt">
        <button class="btn btn-ghost" data-o-iptal="1" type="button">Vazgeç</button>
      </div>`, kutu => {
      $$('[data-o]', kutu).forEach(el =>
        el.addEventListener('click', () => { modalKapat(); resolve(el.dataset.o); }));
      $('[data-o-iptal]', kutu).addEventListener('click', () => { modalKapat(); resolve(null); });
    });
  });
}

/* Proje rengi seçtiren pencere */
function renkSor(mevcut) {
  return new Promise(resolve => {
    modalAc(`
      ${modalBaslik(ICON.folder, 'Proje rengi')}
      <p class="modal-s">Listede ve proje başlığında bu renk kullanılır.</p>
      <div class="renkler renkler-buyuk">
        ${Object.keys(PROJE_RENK).map(k => `
          <button class="renk ${mevcut === k ? 'sec' : ''}" data-r="${k}"
                  style="${renkStil(k)}" type="button" aria-label="${k}"></button>`).join('')}
      </div>
      <div class="modal-alt">
        <button class="btn btn-ghost" data-r-iptal="1" type="button">Vazgeç</button>
      </div>`, kutu => {
      $$('[data-r]', kutu).forEach(el =>
        el.addEventListener('click', () => { modalKapat(); resolve(el.dataset.r); }));
      $('[data-r-iptal]', kutu).addEventListener('click', () => { modalKapat(); resolve(null); });
    });
  });
}

/* ==========================================================================
   EYLEMLER
   ========================================================================== */

async function eylemCalistir(el) {
  const e  = el.dataset.eylem;
  const id = el.dataset.id;

  if (e === 'sihirbaz')  return sihirbaziAc();
  if (e === 'tazele')    return veriTazele();
  if (e === 'projelere') { location.hash = '#/projeler'; return; }
  if (e === 'proje-ac')  { location.hash = projeAdresi(id); return; }

  if (e === 'gorev-ac')   return gorevKartiAc(id);

  /* Düzenleme kipinden çık. Odaktaki alan varsa önce onu kaydettiriyoruz:
     blur, change dinleyicisini tetikliyor. */
  if (e === 'durak-kaydet') {
    const od = document.activeElement;
    if (od && od.blur) od.blur();
    setTimeout(() => { DUZENLENEN_DURAK = null; DUZENLEME_YEDEK = null; render(); }, 60);
    return;
  }

  /* Bağlantı kartını aç/kapat. */
  if (e === 'baglanti-ac') {
    const pr = DB.proje(rota().id);
    const lst = pr ? baglantiAdimListesi(pr) : [];
    const sir = pr ? lst.find(x => !baglantiAdimBittiMi(x, pr)) : '';
    /* Açık olana tekrar dokunmak kapatıyor. */
    ACIK_BAGLANTI = baglantiAcik(lst, sir) === el.dataset.anahtar
      ? '-' : el.dataset.anahtar;
    return render();
  }

  /* Kurulum adımını aç/kapat — bağlantı kartlarıyla aynı mekanik. */
  if (e === 'kurulum-ac') {
    const pr = DB.proje(rota().id);
    const lst = pr ? kurulumSihirbazListesi(pr) : [];
    const sir = pr ? lst.find(x => !kurulumSihirbazAdimBittiMi(x, pr)) : '';
    ACIK_KURULUM = kurulumAcik(lst, sir) === el.dataset.anahtar
      ? '-' : el.dataset.anahtar;
    return render();
  }

  /* Tamamlanmış aşamayı yeniden aç — girerken bir kopya alınıyor ki
     "İptal" gerçekten eski hâle dönebilsin. */
  if (e === 'durak-duzenle') {
    const pr = DB.proje(el.dataset.proje);
    DUZENLENEN_DURAK = el.dataset.proje + '/' + el.dataset.durak;
    DUZENLEME_YEDEK = pr ? {
      firma: pr.firma || '', telefon: pr.telefon || '',
      eposta: pr.eposta || '', sektor: pr.sektor || '',
      palet: JSON.parse(JSON.stringify(pr.palet || {})),
    } : null;
    return render();
  }

  /* İptal: yazılanları geri al ve düzenleme kipini kapat. */
  if (e === 'durak-iptal') {
    const od = document.activeElement;
    if (od && od.blur) od.blur();
    const pr = DB.proje((DUZENLENEN_DURAK || '').split('/')[0]);
    const y  = DUZENLEME_YEDEK;
    DUZENLENEN_DURAK = null; DUZENLEME_YEDEK = null;
    if (!pr || !y) return render();

    const alanlar = {};
    ['firma', 'telefon', 'eposta', 'sektor'].forEach(k => {
      if (String(pr[k] || '') !== y[k]) alanlar[k] = y[k];
    });
    const paletDegisti = JSON.stringify(pr.palet || {}) !== JSON.stringify(y.palet);
    if (!Object.keys(alanlar).length && !paletDegisti) return render();

    return isYap(async () => {
      if (Object.keys(alanlar).length) await DB.projeGuncelle(pr.id, alanlar);
      if (paletDegisti) await DB.paletKaydet(pr.id, y.palet);
    }, 'Değişiklikler geri alındı.');
  }

  /* --- Aşama formlarının seçmeli alanları --- */
  if (e === 'durak-sektor') {
    const pr = DB.proje(el.dataset.proje);
    if (!pr) return;
    if (pr.sektor === el.dataset.deger) return;
    return isYap(() => DB.projeGuncelle(pr.id, { sektor: el.dataset.deger }), '');
  }

  if (e === 'durak-sektor-yeni') {
    const pr = DB.proje(el.dataset.proje);
    if (!pr) return;
    const ad = await metinSor({ baslik: 'Sektör', aciklama: 'Firma hangi işi yapıyor?',
      deger: pr.sektor || '', yerTutucu: 'Örn. Kuruyemiş' });
    if (ad === null) return;
    return isYap(() => DB.projeGuncelle(pr.id, { sektor: String(ad).trim() }), '');
  }

  if (e === 'durak-veri' || e === 'durak-alanturu') {
    const pr = DB.proje(el.dataset.proje);
    if (!pr) return;
    const alan = e === 'durak-veri' ? 'veriKatmani' : 'alanTuru';
    const pl   = pr.palet || {};
    if ((pl[alan] || '') === el.dataset.deger) return;
    return isYap(() => DB.paletKaydet(pr.id,
      Object.assign({}, pl, { [alan]: el.dataset.deger })), '');
  }

  /* Katman merdiveni: adlar ve sayı değişince palete yazılıyor. */
  if (e === 'durak-roller') {
    const pr = DB.proje(el.dataset.proje);
    if (!pr) return;
    const yeni = rolOku($('#view'));
    const eski = rolListesi((pr.palet || {}).roller);
    if (yeni.join('|') === eski.join('|')) return;
    return isYap(() => DB.paletKaydet(pr.id,
      Object.assign({}, pr.palet || {}, { roller: yeni })), '');
  }

  /* Aşama sayfası (telefonda alttan çıkan liste) — ekranı yeniden çizmeden
     açılıp kapanıyor; yeniden çizim yarım kalmış yazıyı ve kaydırmayı
     kaybettiriyordu. */
  if (e === 'asamalar-ac' || e === 'asamalar-kapat') {
    const s = $('#asama-sayfasi');
    if (s) s.classList.toggle('acik', e === 'asamalar-ac');
    return;
  }

  /* Mesajlaşma henüz yazılmadı; düğmenin yeri tasarımda hazır. */
  if (e === 'mesaj-gonder') { gitVeCiz('#/sohbet'); return; }
  if (e === 'sohbet-ac')      { gitVeCiz('#/sohbet/' + id); return; }
  /* Yazışmadan çıkış GERİ gitmeli: yeni adres atamak geçmişe bir kayıt
     daha ekliyor, sonra üst çubuktaki geri oku yazışmaya dönüyordu. */
  if (e === 'sohbete') {
    if (history.length > 1) history.back();
    else location.hash = '#/sohbet';
    return;
  }
  if (e === 'sohbet-yakinda') { toast('Bu kısım yakında gelecek.'); return; }

  if (e === 'mesaj-yolla') return mesajYolla(id);

  if (e === 'ekip-suz') {
    EKIP_SUZ = el.dataset.deger;
    return render();
  }

  if (e === 'ekip-sirala') {
    const sec = await secenekSor('Sıralama', EK_SIRA);
    if (!sec) return;
    EKIP_SIRA = sec;
    return render();
  }

  /* Proje şeridini bir kart boyu sağa kaydırır; sona gelince başa döner. */
  if (e === 'serit-kaydir') {
    const serit = el.parentElement.querySelector('.pk2-serit');
    if (!serit) return;
    const kart = serit.querySelector('.pk2');
    const adim = kart ? kart.offsetWidth + 11 : 200;
    const son  = serit.scrollWidth - serit.clientWidth - 4;
    serit.scrollTo({ left: serit.scrollLeft >= son ? 0 : serit.scrollLeft + adim, behavior: 'smooth' });
    return;
  }

  if (e === 'gorev-ekle') return yeniGorevAc({
    proje: el.dataset.proje || rota().id,
    modul: el.dataset.modul,
    sayfa: el.dataset.sayfa,
  });

  if (e === 'filtre') {
    GOREV_FILTRE = el.dataset.deger;
    return render();
  }

  /* Kütüphane · Tasarımlar — yönün temsili karesi (uygulama geneli). */
  if (e === 'tasarim-kare-yukle') {
    const anahtar = el.dataset.alan;
    const alan = document.createElement('input');
    alan.type = 'file'; alan.accept = 'image/*'; alan.style.display = 'none';
    document.body.appendChild(alan);
    alan.addEventListener('change', async () => {
      const dosya = alan.files && alan.files[0];
      alan.remove();
      if (!dosya) return;
      await isYap(() => DB.tasarimGorselYukle(anahtar, dosya), 'Görsel yüklendi.');
    });
    alan.click();
    return;
  }

  if (e === 'tasarim-kare-sil') {
    const anahtar = el.dataset.alan;
    if (!await onaySor({ baslik: 'Görsel silinsin mi?',
      mesaj: 'Bu tasarımın örnek karesi kaldırılacak.', buton: 'Sil' })) return;
    return isYap(() => DB.tasarimGorselSil(anahtar), 'Görsel silindi.');
  }

  if (e === 'tasarim-yon-gorsel') {
    const alan = el.dataset.alan;
    if (alan === 'serbest') { gorselSecVeYukle(el.dataset.proje, 'Y_serbest', 'Serbest tasarım'); return; }
    const yon = TASARIM_YON.find(y => y.anahtar === alan);
    if (!yon) return;
    gorselSecVeYukle(el.dataset.proje, 'Y_' + yon.anahtar, yon.ad);
    return;
  }

  if (e === 'tasarim-sekme') {
    TASARIM_SEKME = el.dataset.deger === 'uygulanmis' ? 'uygulanmis' : 'promptlar';
    return render();
  }

  /* Uygulanmış sekmesinde tasarımlar arasında ileri/geri gezinme — açılır
     liste yerine ok: on iki yön için liste açmak fazla adımdı. */
  if (e === 'tasarim-odak-git') {
    const pr = DB.proje(el.dataset.proje);
    if (!pr) return;
    const n = TASARIM_YON.length;
    const su = TASARIM_YON.indexOf(tasarimOdagi(pr));
    const adim = Number(el.dataset.yon) < 0 ? -1 : 1;
    TASARIM_ODAK = TASARIM_YON[(su + adim + n) % n].anahtar;
    return render();
  }

  if (e === 'tasarim-uygulanmis-yukle') {
    const yon = TASARIM_YON.find(y => y.anahtar === el.dataset.alan);
    if (!yon) return;
    const tur = el.dataset.tur === 'mobil' ? 'mobil' : 'masa';
    gorselSecVeYukle(el.dataset.proje, 'Y_' + yon.anahtar + '_' + tur,
      yon.ad + ' · ' + (tur === 'mobil' ? 'mobil' : 'masaüstü'));
    return;
  }

  if (e === 'tasarim-yon-ornek') {
    const kare = (DB.tasarimGorsel || {})[el.dataset.alan];
    if (kare) return tasarimKaresiAc(el.dataset.alan, kare);
    yonOrnekAc(el.dataset.alan);
    return;
  }

  if (e === 'tasarim-yon-kopyala') {
    const kip = el.dataset.kip || 'ayni';
    const metin = PROMPT.tasarimYonu(el.dataset.proje, el.dataset.alan, kip);
    if (!metin) { toast('Prompt oluşturulamadı.', 'hata'); return; }
    const oldu = await panoyaKopyala(metin);
    const etiket = kip === 'yeniden' ? 'Yerleşimi de değiştiren prompt' : 'Yerleşimi koruyan prompt';
    toast(oldu ? etiket + ' panoda — ChatGPT\'ye yapıştır.' : 'Kopyalanamadı.', oldu ? 'basari' : 'hata');
    return;
  }

  if (e === 'tasarim-varlik-kopyala') {
    const metin = el.dataset.alan === 'serbest'
      ? PROMPT.serbestTasarim(el.dataset.proje)
      : PROMPT.tasarimVarlikIstek(el.dataset.proje, el.dataset.alan);
    if (!metin) { toast('Prompt oluşturulamadı.', 'hata'); return; }
    const oldu = await panoyaKopyala(metin);
    toast(oldu ? 'Prompt panoda — referans görselle Claude Code\'a yapıştır.' : 'Kopyalanamadı.',
      oldu ? 'basari' : 'hata');
    return;
  }

  if (e === 'tasarim-yon-sec') {
    const pr = DB.proje(el.dataset.proje);
    if (!pr) return;
    const pl = pr.palet || {};
    const secili = pl.secilenYon === el.dataset.alan ? null : el.dataset.alan;
    /* Müşteri seçtiği anda aşama biter: ayrıca bir "tamamlandı" düğmesine
       basmak fazlalıktı, seçimden sonra yapılacak bir iş kalmıyor. */
    return isYap(() => DB.paletKaydet(pr.id, Object.assign({}, pl,
      { secilenYon: secili, tasarimTamamlandi: !!secili })),
      secili ? 'Seçildi.' : 'Seçim kaldırıldı.');
  }

  if (e === 'tasarim-tamamlandi') {
    const pr = DB.proje(el.dataset.proje);
    if (!pr) return;
    const pl = pr.palet || {};
    if (pl.tasarimTamamlandi) {
      return isYap(() => DB.paletKaydet(pr.id,
        Object.assign({}, pl, { tasarimTamamlandi: false })), 'İşaret kaldırıldı.');
    }
    if (!pl.secilenYon) return;
    if (!await onaySor({
      baslik: 'Profesyonel tasarım tamamlandı mı?',
      mesaj: 'Müşterinin seçtiği yön uygulandığında ve son hâlden emin olduğunda onayla.',
      buton: 'Eminim',
    })) return;
    return isYap(() => DB.paletKaydet(pr.id,
      Object.assign({}, pl, { tasarimTamamlandi: true })), 'Profesyonel tasarım tamamlandı.');
  }

  if (e === 'yetki-gorev-kaydet') {
    const pr = DB.proje(el.dataset.proje);
    if (!pr) return;
    const pl = pr.palet || {};
    const kart = el.closest('.fb-kart');
    const rolGorev = Object.assign({}, pl.rolGorev || {});
    $$('[data-yk-gorev]', kart).forEach(t => { rolGorev[t.dataset.ykGorev] = t.value.trim(); });
    return isYap(() => DB.paletKaydet(pr.id, Object.assign({}, pl, { rolGorev })), 'Kaydedildi.');
  }

  if (e === 'yetki-kod-onayla') {
    const pr = DB.proje(el.dataset.proje);
    if (!pr) return;
    const alan = document.getElementById('yk-json-' + pr.id);
    const o = alan && yetkiKoduOku(alan.value);
    if (!o) {
      toast('Blok okunamadı. Claude\'un verdiği { … } parçasını olduğu gibi yapıştır.', 'hata');
      return;
    }
    const pl = pr.palet || {};
    /* JSON geldiyse kısıtlamalar koda işlenmiş demektir; ayrıca bir
       "tamamlandı" düğmesine basmak fazlalıktı. Claude aynı blokta
       guvenlik.json'u yazıp yazmadığını da söylüyor — Güvenlik kontrolü
       durağı dosyayı boşuna aramasın. */
    return isYap(() => DB.paletKaydet(pr.id, Object.assign({}, pl, {
      yetkiKodTamamlandi: true,
      yetkiTamamlandi: true,
      guvenlikJsonVar: o.guvenlik_json === true,
    })), o.guvenlik_json === true
      ? 'Yetkiler kuruldu, guvenlik.json hazır.'
      : 'Yetkiler kuruldu.');
  }

  if (e === 'yetki-tamamlandi') {
    const pr = DB.proje(el.dataset.proje);
    if (!pr) return;
    const pl = pr.palet || {};
    if (pl.yetkiTamamlandi) {
      return isYap(() => DB.paletKaydet(pr.id,
        Object.assign({}, pl, { yetkiTamamlandi: false })), 'İşaret kaldırıldı.');
    }
    if (!rolListesi(pl.roller).length || !pl.yetkiKodTamamlandi) return;
    if (!await onaySor({
      baslik: 'Yetkilendirme tamamlandı mı?',
      mesaj: 'Kısıtlamalar koda işlendiğinde onayla — Güvenlik kontrolü açılacak.',
      buton: 'Eminim',
    })) return;
    return isYap(() => DB.paletKaydet(pr.id,
      Object.assign({}, pl, { yetkiTamamlandi: true })), 'Yetkilendirme tamamlandı.');
  }

  if (e === 'yetkili-kopyala') {
    const pr = DB.proje(el.dataset.proje);
    if (!pr) return;
    const metin = [pr.yetkili, pr.telefon, pr.eposta].filter(Boolean).join('\n');
    const oldu = await panoyaKopyala(metin);
    toast(oldu ? 'Yetkili bilgileri kopyalandı.' : 'Kopyalanamadı.', oldu ? 'basari' : 'hata');
    return;
  }

  if (e === 'marka-duzenle')    return firmaDuzenleAc(el.dataset.proje);
  if (e === 'program-duzenle')  return programDuzenleAc(el.dataset.proje);
  if (e === 'baglanti-duzenle') return baglantiDuzenleAc(el.dataset.proje);
  if (e === 'adim-takvim')      return adimTakvim(el.dataset.proje);

  if (e === 'marka-renk') {
    const pr = DB.proje(el.dataset.proje);
    if (!pr) return;
    const renk = await renkSor(pr.renk);
    if (!renk || renk === pr.renk) return;
    return isYap(() => DB.projeGuncelle(pr.id, { renk }), 'Renk güncellendi.');
  }

  if (e === 'logo-yukle')    return logoSec(el.dataset.proje);
  if (e === 'isletme-gorseli') return isletmeGorseliSec(el.dataset.proje);
  /* Kartın sağ üstündeki "i": aynı G0 yuvasına yüklüyor. Ayrı bir kart
     görseli tutmuyoruz — ikinci bir görseli her proje için ayrıca üretip
     yönetmek, kazandırdığı kadrajdan pahalı. */
  if (e === 'proje-gorsel') return isletmeGorseliSec(id);

  if (e === 'kurulum-sihirbazi-ac') return kurulumSihirbaziAc(el.dataset.proje);

  if (e === 'beta-blok-onay') {
    const pr = DB.proje(el.dataset.proje);
    if (!pr) return;
    const pl = pr.palet || {};
    modalKapat();
    return isYap(() => DB.paletKaydet(pr.id,
      Object.assign({}, pl, { blokVerildi: !pl.blokVerildi })),
      pl.blokVerildi ? 'İşaret kaldırıldı.' : 'Blok verildi.');
  }

  if (e === 'hata-kopyala') {
    panoyaKopyala(el.dataset.metin || '');
    toast('Hata panoya alındı.', 'basari');
    return;
  }

  if (e === 'sql-onay') {
    const pr = DB.proje(el.dataset.proje);
    if (!pr) return;
    const pl = pr.palet || {};
    modalKapat();
    return isYap(() => DB.paletKaydet(pr.id,
      Object.assign({}, pl, { sqlKuruldu: !pl.sqlKuruldu })),
      pl.sqlKuruldu ? 'İşaret kaldırıldı.' : 'Veritabanı kuruldu.');
  }

  if (e === 'asama-onay') {
    const pr = DB.proje(el.dataset.proje);
    if (!pr) return;
    const pl = pr.palet || {};
    const i = Number(el.dataset.deger);
    const biten = Array.isArray(pl.asama) ? pl.asama : [];
    const bitti = biten.indexOf(i) > -1;
    const yeni = bitti ? biten.filter(x => x !== i) : biten.concat(i);
    return isYap(() => DB.paletKaydet(pr.id, Object.assign({}, pl, { asama: yeni })),
      bitti ? 'İşaret kaldırıldı.' : (i + 1) + '. aşama bitti.');
  }

  if (e === 'beta-tamamlandi') {
    const pr = DB.proje(el.dataset.proje);
    if (!pr) return;
    const pl = pr.palet || {};
    if (pl.betaTamamlandi) {
      return isYap(() => DB.paletKaydet(pr.id,
        Object.assign({}, pl, { betaTamamlandi: false })), 'İşaret kaldırıldı.');
    }
    if (!await onaySor({
      baslik: 'Beta ve geliştirme bitti mi?',
      mesaj: 'Yayındaki uygulamayı deneyip her şeyden emin olduğunda onayla.',
      buton: 'Eminim',
    })) return;
    return isYap(() => DB.paletKaydet(pr.id,
      Object.assign({}, pl, { betaTamamlandi: true })), 'Beta ve geliştirme tamamlandı.');
  }

  if (e === 'sablon-sihirbazi-ac') return sablonSihirbaziAc(el.dataset.proje);

  if (e === 'sablon-temel-kaydet') {
    const pr = DB.proje(el.dataset.proje);
    if (!pr) return;
    const metin = ($('#sb-temel-metin') || {}).value || '';
    if (!metin.trim()) return toast('Önce bir şey yaz.', 'uyari');
    return isYap(() => sablonTanimlarYaz(pr, { temel: { metin: metin.trim() } }), 'Kaydedildi.');
  }

  if (e === 'sablon-gunsonu-ozel-kaydet') {
    const pr = DB.proje(el.dataset.proje);
    if (!pr) return;
    const ozel = ($('#sb-gunsonu-ozel') || {}).value || '';
    const t = sablonTanimlarOku(pr).gunsonu;
    return isYap(() => sablonTanimlarYaz(pr, { gunsonu: Object.assign({}, t, { ozel: ozel.trim() }) }), 'Kaydedildi.');
  }

  /* Banka/fatura/gunsonu — dördü de aynı "öğrenen liste" kalıbını paylaşıyor,
     bkz. sablonOgrenenListesiGovde. Kategoriye göre dallanmak yerine
     `data-kategori` ile tek kod yolundan geçiyorlar. */
  if (e === 'sablon-secenek-sec') {
    const pr = DB.proje(el.dataset.proje);
    if (!pr) return;
    const kategori = el.dataset.kategori;
    const t = sablonTanimlarOku(pr)[kategori];
    const anahtar = el.dataset.deger;
    const secili = t.secili.indexOf(anahtar) > -1
      ? t.secili.filter(x => x !== anahtar)
      : t.secili.concat(anahtar);
    return isYap(() => sablonTanimlarYaz(pr, { [kategori]: Object.assign({}, t, { secili }) }));
  }

  if (e === 'sablon-secenek-ekle') {
    const pr = DB.proje(el.dataset.proje);
    if (!pr) return;
    const kategori = el.dataset.kategori;
    const ad = await metinSor({ baslik: el.dataset.etiket || 'Ad', buton: 'Ekle',
      yerTutucu: el.dataset.yertutucu || '' });
    if (!ad || !ad.trim()) return;
    const t = sablonTanimlarOku(pr)[kategori];
    return isYap(() => sablonTanimlarYaz(pr, { [kategori]: Object.assign({}, t,
      { ekstra: t.ekstra.concat({ ad: ad.trim(), cevap: '' }) }) }), 'Eklendi.');
  }

  if (e === 'sablon-ekstra-duzenle-ac') {
    SABLON_EKSTRA_DUZEN[el.dataset.kategori + ':' + el.dataset.deger] = true;
    render();
    if ($('#sablon-sihirbaz')) sablonSihirbaziCiz();
    return;
  }

  if (e === 'sablon-secenek-cevap-kaydet') {
    const pr = DB.proje(el.dataset.proje);
    if (!pr) return;
    const kategori = el.dataset.kategori;
    const i = Number(el.dataset.deger);
    const cevap = ($('#sb-' + kategori + '-cevap-' + i) || {}).value || '';
    const t = sablonTanimlarOku(pr)[kategori];
    const ekstra = t.ekstra.map((x, j) => j === i ? Object.assign({}, x, { cevap: cevap.trim() }) : x);
    return isYap(() => {
      const kayit = ekstra[i];
      const tur = sablonProjeTuru(pr);
      /* Bu tarif başka müşteriler için de öğrenilmiş olsun — aynı kategori
         için sonraki her proje bunu hazır seçenek olarak görecek. */
      if (tur && kayit && (kayit.cevap || '').trim()) sablonSecenekEkle(tur, kategori, kayit.ad, kayit.cevap);
      return sablonTanimlarYaz(pr, { [kategori]: Object.assign({}, t, { ekstra }) });
    }, 'Kaydedildi.', () => {
      /* Kaydedince kompakt (tik + Yapıyı gör) görünüme dönsün. */
      delete SABLON_EKSTRA_DUZEN[kategori + ':' + i];
    });
  }

  if (e === 'sablon-secenek-sil') {
    const pr = DB.proje(el.dataset.proje);
    if (!pr) return;
    const kategori = el.dataset.kategori;
    const i = Number(el.dataset.deger);
    const t = sablonTanimlarOku(pr)[kategori];
    return isYap(() => sablonTanimlarYaz(pr, { [kategori]: Object.assign({}, t,
      { ekstra: t.ekstra.filter((_, j) => j !== i) }) }), 'Kaldırıldı.', () => {
        /* Silinince indexler kayıyor — o kategori için tuttuğumuz "düzenleniyor"
           bayrakları artık yanlış satırı işaret edebilir, hepsini temizle. */
        Object.keys(SABLON_EKSTRA_DUZEN).forEach(k => {
          if (k.indexOf(kategori + ':') === 0) delete SABLON_EKSTRA_DUZEN[k];
        });
      });
  }

  if (e === 'sablon-degisim-onay') {
    const pr = DB.proje(el.dataset.proje);
    if (!pr) return;
    const pl = pr.palet || {};
    if (pl.sablonDegisimTamamlandi) {
      return isYap(() => DB.paletKaydet(pr.id,
        Object.assign({}, pl, { sablonDegisimTamamlandi: false })), 'İşaret kaldırıldı.');
    }
    if (!await onaySor({
      baslik: 'Değişim tamamlandı mı?',
      mesaj: 'Claude kodu güncelledikten sonra kontrol ettiysen onayla.',
      buton: 'Eminim',
    })) return;
    return isYap(() => DB.paletKaydet(pr.id,
      Object.assign({}, pl, { sablonDegisimTamamlandi: true })), 'Değişim tamamlandı.');
  }

  if (e === 'sablon-katman-sql-kopyala') {
    const pr = DB.proje(el.dataset.proje);
    if (!pr) return;
    const metin = sablonKatmanSqlMetni(pr);
    if (!metin) { toast('SQL üretilemedi — rol tanımlı değil.', 'hata'); return; }
    const ok = await panoyaKopyala(metin);
    toast(ok ? 'SQL kopyalandı — SQL Editör\'e yapıştır.' : 'Kopyalanamadı, tarayıcı izin vermedi.',
      ok ? 'basari' : 'hata');
    return;
  }

  if (e === 'sablon-fonksiyon-kopyala') {
    const ok = await panoyaKopyala(SABLON_EDGE_FONKSIYON);
    toast(ok ? 'Kod kopyalandı — Supabase Editör\'e yapıştır.' : 'Kopyalanamadı, tarayıcı izin vermedi.',
      ok ? 'basari' : 'hata');
    return;
  }

  if (e === 'sablon-ortam-degiskeni-kopyala') {
    const pr = DB.proje(el.dataset.proje);
    if (!pr) return;
    const pl = pr.palet || {};
    const deger = 'https://' + String(pl.alanAdi || '').trim();
    const ok = await panoyaKopyala(deger);
    toast(ok ? 'Değer kopyalandı.' : 'Kopyalanamadı, tarayıcı izin vermedi.', ok ? 'basari' : 'hata');
    return;
  }

  if (e === 'sablon-giris-onay') {
    const pr = DB.proje(el.dataset.proje);
    if (!pr) return;
    const pl = pr.palet || {};
    if (pl.sablonGirisTamamlandi) {
      return isYap(() => DB.paletKaydet(pr.id,
        Object.assign({}, pl, { sablonGirisTamamlandi: false })), 'İşaret kaldırıldı.');
    }
    if (!await onaySor({
      baslik: 'Giriş ve kullanıcı ekleme tamamlandı mı?',
      mesaj: 'Claude giriş ekranını ve Kullanıcı ekle özelliğini kurduktan sonra kontrol ettiysen onayla.',
      buton: 'Eminim',
    })) return;
    return isYap(() => DB.paletKaydet(pr.id,
      Object.assign({}, pl, { sablonGirisTamamlandi: true })), 'Giriş ve kullanıcı ekleme tamamlandı.');
  }

  if (e === 'deneme-tamamlandi') {
    const pr = DB.proje(el.dataset.proje);
    if (!pr) return;
    const pl = pr.palet || {};
    if (pl.denemeTamamlandi) {
      return isYap(() => DB.paletKaydet(pr.id,
        Object.assign({}, pl, { denemeTamamlandi: false })), 'İşaret kaldırıldı.');
    }
    if (!await onaySor({
      baslik: 'Test ve Güncelle tamamlandı mı?',
      mesaj: 'Uygulamayı yeterince denedin ve bulduklarını Claude\'a yazdırdıysan onayla.',
      buton: 'Eminim',
    })) return;
    return isYap(() => DB.paletKaydet(pr.id,
      Object.assign({}, pl, { denemeTamamlandi: true })), 'Test ve Güncelle tamamlandı.');
  }

  if (e === 'supabase-baglan') {
    const pr = DB.proje(el.dataset.proje);
    if (!pr) return;
    const url = ($('#ba-sb-url') || {}).value || '';
    const key = ($('#ba-sb-key') || {}).value || '';
    if (!url.trim() || !key.trim()) return toast('İkisini de yaz.', 'uyari');
    return isYap(() => DB.paletKaydet(pr.id, Object.assign({}, pr.palet || {},
      { supabaseUrl: url.trim(), supabaseAnon: key.trim() })), 'Supabase bağlantısı kaydedildi.');
  }

  if (e === 'sql-yuklendi-onay') {
    const pr = DB.proje(el.dataset.proje);
    if (!pr) return;
    const pl = pr.palet || {};
    return isYap(() => DB.paletKaydet(pr.id, Object.assign({}, pl, { sqlYuklendi: !pl.sqlYuklendi })),
      pl.sqlYuklendi ? 'İşaret kaldırıldı.' : 'Kaydedildi.');
  }

  if (e === 'sablon-sql-metin-kopyala') {
    const pr = DB.proje(el.dataset.proje);
    if (!pr) return;
    const pl = pr.palet || {};
    const parca = Number(el.dataset.parca) || 1;
    let parcalar;
    try { parcalar = await DB.sablonSqlMetniOku(pl.kopyaKaynagi); }
    catch (h) { toast('SQL metni okunamadı: ' + h.message, 'hata'); return; }
    const metin = parca === 2 ? parcalar.metin2 : parca === 3 ? parcalar.metin3 : parcalar.metin;
    if (!metin) { toast(parca + '. parça bulunamadı — template\'te henüz kayıtlı değil.', 'hata'); return; }
    const ok = await panoyaKopyala(metin);
    toast(ok ? parca + '. parça kopyalandı.' : 'Kopyalanamadı, tarayıcı izin vermedi.', ok ? 'basari' : 'hata');
    return;
  }

  if (e === 'ekibe') { location.hash = '#/ekip'; return; }
  if (e === 'kullanici-ekle') return kullaniciEkleAc();
  if (e === 'kisi-duzenle')   return kisiDuzenle(id);

  /* Karttaki üç nokta: önce ne yapılacağı soruluyor. */
  if (e === 'kisi-menu') {
    const k = DB.kisilerHepsi.find(x => x.id === id);
    if (!k) return;
    const ben = AUTH.user && k.id === AUTH.user.id;

    const sec = await secenekSor(k.ad || 'Ekip üyesi', [
      { anahtar: 'duzenle', ad: 'Düzenle', ikon: ICON.kalem },
      ben
        ? { anahtar: 'yok', ad: 'Kendini silemezsin', ikon: ICON.kilit, alt: 'Başka bir yönetici silebilir' }
        : { anahtar: 'sil', ad: 'Üyeyi sil', ikon: ICON.cop, tehlike: true, alt: 'Geri alınamaz' },
    ]);
    if (!sec || sec === 'yok') return;
    if (sec === 'duzenle') return kisiDuzenle(id);

    const onay = await yazarakOnaySor({
      baslik: (k.ad || 'Bu üye') + ' silinsin mi?',
      mesaj: 'Hesabı tamamen silinir ve geri gelmez. Görevleri silinmez, atanmamış olarak kalır.',
      kelime: 'üyeyi sil',
    });
    if (!onay) return;

    return isYap(() => DB.kullaniciSil(id), (k.ad || 'Üye') + ' silindi.');
  }

  if (e === 'foto-degistir') return fotoSec();

  /* Hesap ekranı: şifre kutusunun gözü. */
  if (e === 'hesap-goz') {
    const alan = $('#hs-sifre');
    if (!alan) return;
    alan.type = alan.type === 'password' ? 'text' : 'password';
    el.classList.toggle('acik', alan.type === 'text');
    return;
  }

  /* Şifre kutusunun yanındaki "Değiştir". Kaydet düğmesini beklemiyor:
     şifre tek başına duran bir iş, ad/rol ile birlikte gitmesi gerekmiyor. */
  if (e === 'sifre-degistir') {
    const alan = $('#hs-sifre');
    const sifre = alan ? alan.value : '';
    if (!sifre) { toast('Önce yeni şifreni yaz.', 'hata'); if (alan) alan.focus(); return; }
    try {
      await DB.sifremiDegistir(sifre);
      alan.value = '';
      alan.type = 'password';
      toast('Şifren değişti.', 'basari');
    } catch (h) { toast(h.message, 'hata'); }
    return;
  }

  /* Ad, e-posta ve (yöneticide) rol tek düğmeyle kaydediliyor. Hangi alan
     gerçekten değiştiyse yalnız o yazılıyor — dokunulmamış alan için
     sunucuya gitmenin anlamı yok. */
  if (e === 'hesap-kaydet') {
    const ad   = ($('#hs-ad').value.trim() + ' ' + $('#hs-soyad').value.trim()).trim();
    const mail = $('#hs-mail').value.trim().toLowerCase();
    const tel  = $('#hs-tel').value.trim();
    if (!ad) { toast('Ad boş kalamaz.', 'hata'); return; }

    const epostaDegisti = !!mail && mail !== String(AUTH.mail || '').toLowerCase();
    /* Kaydettikten sonra AUTH tazeleniyor; karşılaştırmayı şimdi yapıyoruz. */
    const adDegisti     = ad !== AUTH.ad;
    const telDegisti    = tel !== AUTH.telefon;

    try {
      if (adDegisti)     await DB.adKaydet(ad);
      if (telDegisti)    await DB.telefonumuKaydet(tel);
      if (epostaDegisti) await DB.epostamiDegistir(mail);

      kullaniciYaz();
      menuyuCiz();
      render();

      toast(epostaDegisti
        ? 'Kaydedildi. Yeni adrese doğrulama bağlantısı gönderildi.'
        : (adDegisti || telDegisti) ? 'Kaydedildi.' : 'Değişen bir şey yok.',
        'basari');
    } catch (h) { toast(h.message, 'hata'); }
    return;
  }

  if (e === 'ad-degistir') {
    const ad = await metinSor({
      baslik: 'Ad Soyad',
      aciklama: 'Karşılama ekranında ve üst çubukta bu ad görünür.',
      deger: AUTH.ad,
      yerTutucu: 'Örn. Nizam Güllü',
    });
    if (!ad) return;
    try {
      await DB.adKaydet(ad.trim());
      kullaniciYaz();
      render();
      toast('Ad güncellendi.', 'basari');
    } catch (h) { toast(h.message, 'hata'); }
    return;
  }

  if (e === 'standartlara') { location.hash = '#/standartlar'; return; }

  /* Standart ekleme promptu. Claude sekmesi AÇILMIYOR — istenen tek şey
     promptun panoya girmesi; sekme açmak kullanıcıyı uygulamadan çıkarıyor
     ve geri döndüğünde kart hâlini kaybediyordu. */
  if (e === 'std-prompt') {
    let metin;
    try { metin = PROMPT.standartEkle(); }
    catch (h) { toast('Prompt üretilemedi: ' + h.message, 'hata'); return; }
    const oldu = await panoyaKopyala(metin);
    if (!oldu) { toast('Kopyalanamadı.', 'hata'); return; }
    STD_KOPYALANDI = true;
    render();
    toast('Prompt panoda — Claude\'a yapıştır.', 'basari');
    return;
  }

  /* Kopyalamak yeterli değildi: toast göz ardı edilince kullanıcı panoda
     ne olduğunu, nereye yapıştıracağını unutuyordu. Kopyalandıktan sonra
     üç adımı gösteren küçük bir pencereyle yönlendiriyoruz. */
  if (e === 'tanisma-prompt') {
    const pr = DB.proje(el.dataset.proje);
    if (!pr) return;
    let metin;
    try { metin = PROMPT.tanisma(pr.id); }
    catch (h) { toast('Prompt üretilemedi: ' + h.message, 'hata'); return; }
    if (!metin || !metin.trim()) {
      toast('Prompt boş çıktı — önce depo adresini kaydet.', 'uyari');
      return;
    }
    const oldu = await panoyaKopyala(metin);
    if (!oldu) { toast('Kopyalanamadı.', 'hata'); return; }
    /* Kopyalama aynı zamanda aşamayı bitiriyor: bundan sonrası Claude Code'da
       geçiyor, Studio'nun bekleyeceği başka bir işaret yok. */
    try {
      await DB.paletKaydet(pr.id, Object.assign({}, pr.palet || {}, { sohbetAcildi: true }));
    } catch (h) { /* kritik değil, kare tekrar basılabilir */ }
    render();
    if ($('#baglanti-adim')) baglantiAdimCiz();
    return sohbetYonlendir(pr);
  }

  if (e === 'standart-ice-aktar') return standartIceAktar();

  if (e === 'standart-grup-ac') {
    const ad = el.dataset.ad;
    /* Akordeon: açık olana basınca kapanır, başkasına basınca öteki kapanır. */
    ACIK_GRUP = ACIK_GRUP === ad ? null : ad;
    ACIK_STANDART.clear();
    return render();
  }

  if (e === 'standart-ac') {
    ACIK_STANDART.has(id) ? ACIK_STANDART.delete(id) : ACIK_STANDART.add(id);
    return render();
  }

  if (e === 'guncelle') {
    if (el.classList.contains('deneniyor')) return;
    const ilkIc = el.innerHTML;
    el.classList.add('deneniyor');
    el.disabled = true;
    el.innerHTML = `<span class="kum-don">${svg(ICON.kum, 15)}</span> Denetleniyor…`;

    const sonuc = await GUNCELLEME.elleDenetle();
    if (sonuc === 'yeni') return;   /* sayfa yenilenecek, dönmeye devam */
    el.classList.remove('deneniyor');
    el.disabled = false;
    el.innerHTML = ilkIc;
    return;
  }

  if (e === 'yedek-al') {
    const ad = 'nizam-studio-yedek-' + bugunTarih() + '.json';
    dosyaIndir(ad, DB.yedekAl());
    return toast(ad + ' indirildi.', 'basari');
  }

  if (e === 'yedek-oku') return yedekSec();


  if (e === 'standart-ekle')    return standartDuzenle(null);
  if (e === 'standart-duzenle') return standartDuzenle(id);

  if (e === 'standart-kopyala') {
    const st = DB.standart(id);
    if (!st) return;
    const ok = await panoyaKopyala(`### ${st.ad}\n${st.tarif}`);
    return toast(ok ? 'Tarif kopyalandı.' : 'Kopyalanamadı.');
  }

  if (e === 'standart-sil') {
    const ok = await onaySor({
      baslik: 'Standart kaldırılsın mı?',
      mesaj: `"${el.dataset.ad}" listeden kalkar. Bağlı görevlerdeki kayıt bozulmaz.`,
      buton: 'Kaldır',
    });
    if (!ok) return;
    return isYap(() => DB.standartSil(id), 'Standart kaldırıldı.');
  }

  if (e === 'kimlik') {
    const projeId = el.dataset.proje || rota().id;
    const proje = DB.proje(projeId);
    if (!proje) return;
    return metinPenceresi({
      baslik: 'NIZAM.md',
      aciklama: 'Müşteri deposunun köküne konur. AI projeyi buradan tanır.',
      metin: PROMPT.kimlik(projeId),
      dosya: 'NIZAM.md',
    });
  }

  /* Namecheap'e yazılacak kayıt hazır duruyor: satır satır kopyalanıyor ve
     düğme doğrudan o alan adının Advanced DNS sayfasını açıyor. Studio kaydı
     kendi yazamıyor — Namecheap API'si sunucu ve anahtar istiyor. */
  if (e === 'namecheap-baglan') {
    const pr = DB.proje(el.dataset.proje);
    if (!pr) return;
    const adres = await metinSor({
      baslik: 'Alan adı',
      aciklama: 'Namecheap kaydını açtıysan bu adres birazdan çalışmaya başlar.',
      deger: onerilenAlanAdi(pr),
      yerTutucu: 'merkezefendi.nizamsoftware.com',
      buton: 'Kaydet',
    });
    if (adres === null) return;
    const guncel = DB.proje(pr.id);
    return isYap(() => DB.paletKaydet(pr.id,
      Object.assign({}, (guncel && guncel.palet) || {}, { alanAdi: adres, namecheapBaglandi: true })),
      'Alan adı kaydedildi.');
  }

  if (e === 'kok-alan') {
    const deger = await metinSor({
      baslik: 'Kök alan adı',
      aciklama: 'Projelerin alt alan alacağı adres. Studio her projeye firma '
              + 'adından bir alt alan türetiyor: örneğin kofte.' + (kokAlan() || 'alanadin.com') + '.',
      deger: kokAlan(),
      yerTutucu: 'nizamsoftware.com',
      buton: 'Kaydet',
    });
    if (deger === null) return;
    kokAlanYaz(deger);
    render();
    return toast(deger.trim() ? 'Kök alan adı kaydedildi.' : 'Kök alan adı silindi.');
  }

  if (e === 'supabase-org') {
    const deger = await metinSor({
      baslik: 'Supabase organizasyonu',
      aciklama: 'Supabase\'de sol üstten organizasyonuna tıkla; adres çubuğundaki '
              + 'dashboard/org/ sonrasındaki kodu buraya yapıştır.',
      deger: supabaseOrg(),
      yerTutucu: 'örn. abcdefghijklmnopqrst',
      buton: 'Kaydet',
    });
    if (deger === null) return;
    supabaseOrgYaz(deger);
    render();
    return toast(deger.trim() ? 'Supabase organizasyonu kaydedildi.' : 'Supabase organizasyonu silindi.');
  }

  if (e === 'claude-baglandi') {
    const pr = DB.proje(el.dataset.proje);
    if (!pr) return;
    return isYap(() => DB.paletKaydet(pr.id, Object.assign({}, pr.palet || {},
      { claudeBaglandi: true, sohbetAcildi: true })), 'Claude bağlantısı kuruldu.');
  }

  if (e === 'final-onay') {
    const pr = DB.proje(el.dataset.proje);
    if (!pr) return;
    const pl = pr.palet || {};
    if (pl.finalVerildi) {
      return isYap(() => DB.paletKaydet(pr.id,
        Object.assign({}, pl, { finalVerildi: false })), 'İşaret kaldırıldı.');
    }
    if (!await onaySor({
      baslik: 'Final verilsin mi?',
      mesaj: 'Uygulamayı denedin ve sorunsuz bulduğunda onayla. Bundan sonraki '
           + 'istekler Geliştirme durağında yürür.',
      buton: 'Eminim',
    })) return;
    return isYap(() => DB.paletKaydet(pr.id,
      Object.assign({}, pl, { finalVerildi: true })), 'Final sürüm verildi.');
  }

  if (e === 'final-not-ekle') {
    const pr = DB.proje(el.dataset.proje);
    if (!pr) return;
    const not = await metinSor({
      baslik: 'Hata ya da güncelleme bildir',
      aciklama: 'Ne değişmesi gerektiğini yaz — liste hâlinde burada kalacak.',
      yerTutucu: 'Örn. Stok listesinde tarih filtresi çalışmıyor.',
      buton: 'Ekle', cok: true,
    });
    if (!not) return;
    const pl = pr.palet || {};
    const notlar = finalNotlariOku(pl).concat({ metin: not, tamam: false });
    return isYap(() => DB.paletKaydet(pr.id,
      Object.assign({}, pl, { finalNotlar: notlar })), 'Not eklendi.');
  }

  if (e === 'final-not-sil') {
    const pr = DB.proje(el.dataset.proje);
    if (!pr) return;
    const pl = pr.palet || {};
    const notlar = finalNotlariOku(pl).filter((_, i) => i !== Number(el.dataset.deger));
    return isYap(() => DB.paletKaydet(pr.id,
      Object.assign({}, pl, { finalNotlar: notlar })), 'Not kaldırıldı.');
  }

  if (e === 'final-not-tamam') {
    const pr = DB.proje(el.dataset.proje);
    if (!pr) return;
    const pl = pr.palet || {};
    const i = Number(el.dataset.deger);
    const eski = finalNotlariOku(pl)[i];
    const notlar = finalNotlariOku(pl).map((n, k) =>
      k === i ? Object.assign({}, n, { tamam: !n.tamam }) : n);
    return isYap(() => DB.paletKaydet(pr.id, Object.assign({}, pl, { finalNotlar: notlar })),
      eski && !eski.tamam ? 'Güncelleme tamamlandı.' : 'İşaret kaldırıldı.');
  }

  if (e === 'repo') {
    const projeId = el.dataset.proje || rota().id;
    const proje = DB.proje(projeId);
    if (!proje) return;
    const adres = await metinSor({
      baslik: 'Depo adresi',
      aciklama: 'Prompt hangi depoda çalışılacağını buradan söyler.',
      deger: proje.repo || '',
      yerTutucu: 'github.com/nizamsoft/musteri-projesi',
      buton: 'Kaydet',
    });
    if (adres === null) return;
    depoSahibiYaz(depoSlug(adres));
    delete DEPO_BEKLIYOR[projeId];
    return isYap(() => DB.projeGuncelle(projeId, { repo: adres }), 'Depo adresi kaydedildi.');
  }

  if (e === 'proje-menu') {
    const proje = DB.proje(id);
    if (!proje) return;

    /* Menüde yalnız silme var: ad, renk ve depo adresi artık aşamaların
       kendi içinde düzenleniyor, arşiv de kullanılmıyordu. */
    const sec = await secenekSor(projeAdi(proje), [
      { anahtar: 'sil', ad: 'Projeyi sil', ikon: ICON.cop,
        alt: 'Her şeyi siler, geri gelmez', tehlike: true },
    ]);
    if (!sec) return;

    if (sec === 'sil') {
      if ((proje.palet || {}).kilitli) {
        toast('Bu proje kilitli — önce Ayarlar > Projeleri kilitle\'den kilidi aç.', 'uyari');
        return;
      }
      const s = DB.sayim(id);
      const gorsel = ((proje.palet || {}).gorseller || []).filter(y => y.yol).length;
      const kayip = [
        s.modul ? s.modul + ' modül' : '',
        s.sayfa ? s.sayfa + ' sayfa' : '',
        s.gorev ? s.gorev + ' görev' : '',
        gorsel ? gorsel + ' görsel' : '',
      ].filter(Boolean).join(', ');

      const ok = await onaySor({
        baslik: 'Proje tamamen silinsin mi?',
        mesaj: `"${projeAdi(proje)}"${kayip ? ` ve içindeki ${kayip}` : ''} silinecek. `
             + 'Logo, görseller ve tasarım tarifi de gidecek. Bu işlem geri alınamaz.',
        buton: 'Kalıcı olarak sil',
      });
      if (!ok) return;

      /* Depo adresi silinmeden önce alınıyor: sonrasında proje kaydı yok,
         GitHub bağlantısını üretemeyiz. */
      const slug = depoSlug(proje.repo);
      const ad   = projeAdi(proje);
      if (rota().id === id) await adreseGit('#/projeler');
      await isYap(() => DB.projeSil(id), 'Proje silindi.');
      return disaridaKalanlar(ad, slug);
    }
    return;
  }

  /* ---- Yapı ağacı ---- */
  /* Kurulu yapıyı incele / anlat ekranına dön. */
  if (e === 'yapi-moduller' || e === 'yapi-anlat') {
    const pr = DB.proje(el.dataset.proje);
    if (!pr) return;
    const t = yapiTaslak(pr);
    t.mod = e === 'yapi-moduller' ? 'agac' : 'anlat';
    t.modul = ''; t.odak = null; t.dal = null; t.sayfalar = []; t.kunye = {};
    render();
    return;
  }

  if (e === 'agac-modul-ac') {
    const pr = DB.proje(el.dataset.proje);
    if (!pr) return;
    const t = yapiTaslak(pr);
    t.odak = null; t.dal = null;
    /* Aynı modüle ikinci dokunuş kapatır. */
    if (t.modul === el.dataset.ad) { t.modul = ''; t.sayfalar = []; t.kunye = {}; }
    else modulYukle(pr, t, el.dataset.ad);
    render();
    return;
  }


  if (e === 'agac-modul-ad') {
    const pr = DB.proje(el.dataset.proje);
    if (!pr) return;
    const t = yapiTaslak(pr);
    const kurulu = DB.modulleri(pr.id).some(m => m.ad === t.modul);
    if (kurulu) return toast('Kurulmuş modülün adı buradan değişmiyor.', 'hata');
    const ad = await metinSor({ baslik: 'Modülün adı',
      aciklama: 'Ağaçta ve promptta bu ad görünür.',
      deger: t.modul === 'Yeni Modül' ? '' : t.modul,
      yerTutucu: 'Örn. Muhasebe Modülü', buton: 'Kaydet' });
    if (!ad) return;
    t.modul = ad;
    render();
    return;
  }

  if (e === 'agac-koke') {
    const pr = DB.proje(el.dataset.proje);
    if (!pr) return;
    const t = yapiTaslak(pr);
    /* Firma çipi: modülden çıkıp modül listesine döner — ama tek (ya da
       hiç) modül varken haritanın gösterecek bir şeyi yok, o zaman
       modülde (ya da anlatta) kal. */
    if (t.mod === 'anlat') {
      const gercek = DB.modulleri(pr.id).filter(m => m.ad !== GENEL_MODUL);
      if (gercek.length) {
        t.mod = 'agac';
        if (gercek.length === 1) modulYukle(pr, t, gercek[0].ad); else t.modul = '';
      }
    }
    else if (t.dal) { t.dal = null; }
    else {
      const cokMi = DB.modulleri(pr.id).filter(m => m.ad !== GENEL_MODUL).length > 1;
      t.odak = null;
      if (cokMi) t.modul = '';
    }
    render();
    return;
  }

  if (e === 'agac-sayfaya') {
    const pr = DB.proje(el.dataset.proje);
    if (!pr) return;
    const t = yapiTaslak(pr);
    t.dal = null;
    if (t.mod === 'mkural') t.mod = 'agac';
    render();
    $('#view').scrollTop = 0;
    return;
  }

  if (e === 'agac-sayfa') {
    const pr = DB.proje(el.dataset.proje);
    if (!pr) return;
    const t = yapiTaslak(pr);
    /* Aynı sayfaya ikinci dokunuş künyeyi kapatır. */
    t.odak = t.odak === el.dataset.ad ? null : el.dataset.ad;
    t.dal = null;
    render();
    return;
  }

  if (e === 'agac-dal') {
    const pr = DB.proje(el.dataset.proje);
    if (!pr) return;
    const t = yapiTaslak(pr);
    t.odak = el.dataset.sayfa;
    t.dal = el.dataset.ad;
    render();
    return;
  }

  if (e === 'agac-anlat') {
    const pr = DB.proje(el.dataset.proje);
    if (!pr) return;
    yapiTaslak(pr).mod = 'anlat';
    render();
    return;
  }

  /* ---- Yapı akışı ---- */
  if (e === 'agac-onizle') {
    const pr = DB.proje(el.dataset.proje);
    if (pr) { yapiTaslak(pr).mod = 'onizle'; render(); }
    return;
  }

  if (e === 'onizle-cihaz') {
    ONIZLEME_CIHAZ = el.dataset.deger === 'telefon' ? 'telefon' : 'web';
    render();
    return;
  }

  if (e === 'yapi-akis-ac') {
    const pr = DB.proje(el.dataset.proje);
    if (pr) { yapiTaslak(pr); YAPI_ACIK[pr.id] = true; render(); }
    return;
  }

  /* ---- Sayfa künyesi ----
     Çip eylemleri render() çağırmıyor: tam çizim kaydırmayı başa alıyordu. */
  if (e === 'yapi-ky-tur') {
    const pr = DB.proje(el.dataset.proje);
    if (!pr) return;
    const k = yapiKunye(yapiTaslak(pr), el.dataset.sayfa);
    k.tur = k.tur === el.dataset.ad ? '' : el.dataset.ad;
    $$('.raf .bsc').forEach(b => b.classList.toggle('on', b.dataset.ad === k.tur));
    const not = $('.ky-not');
    const tp = SAYFA_TURU.find(x => x.ad === k.tur);
    if (not) not.textContent = tp ? tp.alt : '';
    yapiOnizlemeTazele(pr); yapiIleriTazele(pr);
    return;
  }

  /* ---- Modül kuralları ---- */
  if (e === 'agac-modul-kural') {
    const pr = DB.proje(el.dataset.proje);
    if (!pr) return;
    const t = yapiTaslak(pr);
    t.mod = 'mkural'; t.odak = null; t.dal = 'mkural';
    render();
    $('#view').scrollTop = 0;
    return;
  }

  /* ---- Sayfaya özel fark ---- */
  if (e === 'yapi-ky-fark-sil') {
    const pr = DB.proje(el.dataset.proje);
    if (!pr) return;
    const k = yapiKunye(yapiTaslak(pr), el.dataset.sayfa);
    k.fark = { kural: '' };
    render();
    return;
  }

  if (e === 'yapi-ky-ornek') {
    const pr = DB.proje(el.dataset.proje);
    if (!pr) return;
    yapiKunye(yapiTaslak(pr), el.dataset.sayfa).amac = el.dataset.ad;
    const kutu = $('[data-ky="amac"]');
    if (kutu) { kutu.value = el.dataset.ad; kutu.focus(); }
    yapiIleriTazele(pr);
    return;
  }

  if (e === 'yapi-ky-kalip') {
    const pr = DB.proje(el.dataset.proje);
    if (!pr) return;
    const t = yapiTaslak(pr);
    const k = yapiKunye(t, el.dataset.sayfa);
    /* Kalıp tek seçim: ikincisine dokununca öncekinin yerini alır. */
    const eski = (k.kalip || [])[0];
    const yeni = eski === el.dataset.ad ? '' : el.dataset.ad;
    k.kalipCevap = k.kalipCevap || {};
    Object.keys(k.kalipCevap).forEach(x => {
      if (!yeni || !x.startsWith(yeni + '.')) delete k.kalipCevap[x];
    });
    k.kalip = yeni ? [yeni] : [];
    /* Kaydırma yeri korunsun diye tam çizim yapıyoruz ama önizleme de
       kalıba göre değişmeli. */
    render();
    return;
  }

  if (e === 'yapi-ky-kcevap') {
    const pr = DB.proje(el.dataset.proje);
    if (!pr) return;
    const k = yapiKunye(yapiTaslak(pr), el.dataset.sayfa);
    k.kalipCevap = k.kalipCevap || {};
    const su = k.kalipCevap[el.dataset.ad];
    k.kalipCevap[el.dataset.ad] = su === el.dataset.deger2 ? '' : el.dataset.deger2;
    $$('button', el.parentElement).forEach(b => b.classList.toggle('on',
      b.dataset.deger2 === k.kalipCevap[el.dataset.ad]));
    yapiIleriTazele(pr);
    return;
  }

  if (e === 'yapi-ky-olcek' || e === 'yapi-ky-ayni') {
    const pr = DB.proje(el.dataset.proje);
    if (!pr) return;
    const k = yapiKunye(yapiTaslak(pr), el.dataset.sayfa);
    const alan = e === 'yapi-ky-olcek' ? 'olcek' : 'ayniKayit';
    k[alan] = k[alan] === el.dataset.ad ? '' : el.dataset.ad;
    $$('button', el.parentElement).forEach(b => b.classList.toggle('on',
      (b.dataset.ad || '') === (k[alan] || '')));
    yapiIleriTazele(pr);
    return;
  }

  /* Sütun setleri: yerin adı + o yere eklenen sütunlar. */
  if (e === 'yapi-ky-set-ekle') {
    const pr = DB.proje(el.dataset.proje);
    if (!pr) return;
    const ad = await metinSor({ baslik: 'Yer', buton: 'Ekle',
      aciklama: 'Hangi hesapta / bağlamda farklı sütunlar olacak?',
      yerTutucu: 'Örn. 320 Tedarikçiler' });
    if (!ad) return;
    const k = yapiKunye(yapiTaslak(pr), el.dataset.sayfa);
    k.kalipCevap = k.kalipCevap || {};
    k.kalipCevap[el.dataset.ad] = setListesi(k.kalipCevap[el.dataset.ad])
      .concat([{ ad, alanlar: [] }]);
    render();
    return;
  }

  if (e === 'yapi-ky-set-sil') {
    const pr = DB.proje(el.dataset.proje);
    if (!pr) return;
    const k = yapiKunye(yapiTaslak(pr), el.dataset.sayfa);
    const liste = setListesi(k.kalipCevap[el.dataset.ad]);
    liste.splice(Number(el.dataset.deger2), 1);
    k.kalipCevap[el.dataset.ad] = liste;
    render();
    return;
  }

  if (e === 'yapi-ky-setalan-ekle') {
    const pr = DB.proje(el.dataset.proje);
    if (!pr) return;
    const ad = await metinSor({ baslik: 'Sütun', buton: 'Ekle',
      aciklama: 'Bu yerde fazladan görünecek sütun.', yerTutucu: 'Örn. Fatura No' });
    if (!ad) return;
    const k = yapiKunye(yapiTaslak(pr), el.dataset.sayfa);
    const liste = setListesi(k.kalipCevap[el.dataset.ad]);
    const st = liste[Number(el.dataset.deger2)];
    if (st && !st.alanlar.includes(ad)) st.alanlar.push(ad);
    k.kalipCevap[el.dataset.ad] = liste;
    render();
    return;
  }

  if (e === 'yapi-ky-setalan-sil') {
    const pr = DB.proje(el.dataset.proje);
    if (!pr) return;
    const k = yapiKunye(yapiTaslak(pr), el.dataset.sayfa);
    const liste = setListesi(k.kalipCevap[el.dataset.ad]);
    const st = liste[Number(el.dataset.deger2)];
    if (st) st.alanlar = st.alanlar.filter(x => x !== el.dataset.deger3);
    k.kalipCevap[el.dataset.ad] = liste;
    render();
    return;
  }

  if (e === 'yapi-ky-kset-ekle') {
    const pr = DB.proje(el.dataset.proje);
    if (!pr) return;
    const deger = await metinSor({ baslik: 'Ekle', buton: 'Ekle',
      yerTutucu: 'Örn. 320 Tedarikçiler' });
    if (!deger) return;
    const k = yapiKunye(yapiTaslak(pr), el.dataset.sayfa);
    k.kalipCevap = k.kalipCevap || {};
    const liste = k.kalipCevap[el.dataset.ad] || [];
    if (!liste.includes(deger)) liste.push(deger);
    k.kalipCevap[el.dataset.ad] = liste;
    render();
    return;
  }

  if (e === 'yapi-ky-kset-sil') {
    const pr = DB.proje(el.dataset.proje);
    if (!pr) return;
    const k = yapiKunye(yapiTaslak(pr), el.dataset.sayfa);
    k.kalipCevap[el.dataset.ad] = (k.kalipCevap[el.dataset.ad] || [])
      .filter(x => x !== el.dataset.deger2);
    render();
    return;
  }

  /* ---- Anlat: çözümleme döngüsü ---- */
  /* "Yapıyı kur": pencere açmadan doğrudan panodaki bloğu okur. Pano
     okunamazsa (tarayıcı izin vermedi) eski yapıştırma penceresine düşer. */
  if (e === 'yapi-kur-pano') {
    const pr = DB.proje(el.dataset.proje);
    if (!pr) return;
    let metin = '';
    try { metin = await navigator.clipboard.readText(); } catch (h) { metin = ''; }
    const cozum = metin ? cozumlemeOku(metin) : null;
    if (!cozum) {
      if (metin && metin.trim()) toast('Panodaki metin blok değil — elle yapıştır.', 'uyari');
      return anlatAktarAc(pr.id);
    }
    const t = yapiTaslak(pr);
    const guncelleMi = t.modul && DB.modulleri(pr.id).some(m => m.ad === t.modul);
    return cozumKur(pr, t, cozum, guncelleMi);
  }

  if (e === 'anlat-aktar') {
    const pr = DB.proje(el.dataset.proje);
    if (!pr) return;
    return anlatAktarAc(pr.id);
  }

  if (e === 'yapi-ky-alan-ekle') {
    const pr = DB.proje(el.dataset.proje);
    if (!pr) return;
    const alan = await alanSor();
    if (!alan) return;
    const k = yapiKunye(yapiTaslak(pr), el.dataset.sayfa);
    if (!k.alanlar.some(a => a.ad === alan.ad)) k.alanlar.push(alan);
    render();
    return;
  }

  if (e === 'yapi-ky-alan-sil') {
    const pr = DB.proje(el.dataset.proje);
    if (!pr) return;
    yapiKunye(yapiTaslak(pr), el.dataset.sayfa).alanlar.splice(Number(el.dataset.deger), 1);
    render();
    return;
  }

  if (e === 'yapi-ky-zorunlu') {
    const pr = DB.proje(el.dataset.proje);
    if (!pr) return;
    const a = yapiKunye(yapiTaslak(pr), el.dataset.sayfa).alanlar[Number(el.dataset.deger)];
    if (!a) return;
    a.zorunlu = !a.zorunlu;
    el.classList.toggle('on', a.zorunlu);
    yapiOnizlemeTazele(pr);
    return;
  }

  if (e === 'yapi-ky-deger-ekle') {
    const pr = DB.proje(el.dataset.proje);
    if (!pr) return;
    const deger = await metinSor({ baslik: 'Değer', buton: 'Ekle',
      aciklama: 'Bu alanın alabileceği hâllerden biri.', yerTutucu: 'Örn. Bekliyor' });
    if (!deger) return;
    const a = yapiKunye(yapiTaslak(pr), el.dataset.sayfa).alanlar[Number(el.dataset.deger)];
    if (!a) return;
    a.degerler = (a.degerler || []).concat(
      (a.degerler || []).includes(deger) ? [] : [deger]);
    render();
    return;
  }

  if (e === 'yapi-ky-deger-sil') {
    const pr = DB.proje(el.dataset.proje);
    if (!pr) return;
    const a = yapiKunye(yapiTaslak(pr), el.dataset.sayfa).alanlar[Number(el.dataset.deger)];
    if (!a) return;
    a.degerler = (a.degerler || []).filter(d => d !== el.dataset.ad);
    render();
    return;
  }

  if (e === 'yapi-ky-kaynak') {
    const pr = DB.proje(el.dataset.proje);
    if (!pr) return;
    const t = yapiTaslak(pr);
    const secenekler = t.sayfalar.filter(x => x !== el.dataset.sayfa)
      .concat(DB.modulleri(pr.id).filter(m => m.ad !== GENEL_MODUL)
        .flatMap(m => DB.sayfalari(m.id).map(x => x.ad)));
    const secim = await listeSor('Hangi sayfadan seçilecek?',
      [...new Set(secenekler)], 'Başka sayfa yaz');
    if (!secim) return;
    const a = yapiKunye(t, el.dataset.sayfa).alanlar[Number(el.dataset.deger)];
    if (a) a.kaynak = secim;
    render();
    return;
  }

  if (e === 'yapi-kur') {
    const pr = DB.proje(el.dataset.proje);
    if (!pr) return;
    const t = yapiTaslak(pr);
    if (!t.modul || !t.sayfalar.length) return;

    el.disabled = true;
    try {
      await yapiTaslagiKur(pr, t);
      delete YAPI_TASLAK[pr.id];
      ONIZLEME_MENU = ONIZLEME_SAYFA = ONIZLEME_KUNYE = null;
      toast(t.modul + ' hazır · ' + t.sayfalar.length + ' sayfa');
      render();
    } catch (err) {
      el.disabled = false;
      toast(err.message, 'hata');
    }
    return;
  }

  if (e === 'sektorlere')     { location.hash = '#/sektorler'; return; }
  if (e === 'paket-tanim-bilgi') {
    toast('Bu metin Claude\'a giden promptlara "Bu paket nedir" başlığıyla '
        + 'olduğu gibi giriyor.');
    return;
  }

  if (e === 'template-ayar')  return templateAyarlari(el.dataset.proje);

  if (e === 'paketlere')      { location.hash = '#/paketler'; return; }
  if (e === 'paket-duzenle')  return paketDuzenle(id);

  if (e === 'sektor-ekle')    return sektorDuzenle(null);
  if (e === 'sektor-sirala') {
    const sec = await secenekSor('Sıralama', SK_SIRA);
    if (!sec) return;
    SEKTOR_SIRA = sec;
    return render();
  }

  if (e === 'sektor-duzenle') return sektorDuzenle(id);


  if (e === 'depo-baglandi-onay') {
    const pr = DB.proje(el.dataset.proje);
    if (!pr) return;
    delete DEPO_BEKLIYOR[pr.id];
    return depoAdresiTamamla(pr);
  }

  if (e === 'depo-baglandi-vazgec') {
    delete DEPO_BEKLIYOR[el.dataset.proje];
    render();
    if ($('#baglanti-adim')) baglantiAdimCiz();
    return;
  }

  if (e === 'pages-baglandi-onay') {
    const pr = DB.proje(el.dataset.proje);
    if (!pr) return;
    delete PAGES_BEKLIYOR[pr.id];
    return pagesBaglandiOnayla(pr);
  }

  if (e === 'pages-baglandi-vazgec') {
    delete PAGES_BEKLIYOR[el.dataset.proje];
    render();
    if ($('#baglanti-adim')) baglantiAdimCiz();
    return;
  }

  if (e === 'kilitlere') { location.hash = '#/kilitler'; return; }

  if (e === 'proje-kilit-degistir') {
    const pr = DB.proje(el.dataset.proje);
    if (!pr) return;
    const pl = pr.palet || {};
    return isYap(() => DB.paletKaydet(pr.id, Object.assign({}, pl, { kilitli: !pl.kilitli })),
      pl.kilitli ? 'Kilit açıldı.' : 'Proje kilitlendi.');
  }

  if (e === 'templatelere')       { location.hash = '#/templateler'; return; }
  if (e === 'guvenlige')          { location.hash = '#/guvenlik'; return; }
  if (e === 'template-olustur-ac') return templateSihirbaziAc();
  if (e === 'template-kur-ac')     return templateAyarlari(el.dataset.proje);

  /* Satırın kendisi template-kur-ac'ı açıyor — bu düğme ayrı bir data-eylem
     taşıdığı için closest() önce bunu buluyor, satırın tıklaması tetiklenmiyor.
     window.open kullanıyoruz: delegasyon dinleyicisi her data-eylem'de
     preventDefault çağırıyor, düz bir <a> burada işe yaramazdı. */
  if (e === 'sablon-yayina-git') {
    const adres = el.dataset.adres;
    if (adres) window.open('https://' + adres, '_blank', 'noopener');
    return;
  }

  if (e === 'sablon-sql-metin-kontrol') {
    const pr = DB.proje(el.dataset.proje);
    if (!pr) return;
    const pl = pr.palet || {};
    let parcalar;
    try { parcalar = await DB.sablonSqlMetniOku(pl.kopyaKaynagi); }
    catch (h) { toast('Okunamadı: ' + h.message, 'hata'); return; }
    sqlMetniGocBildir(parcalar);
    return;
  }

  if (e === 'guvenlik-test-calistir') {
    const al = id => { const el2 = $('#' + id); return el2 ? el2.value.trim() : ''; };
    const url = al('gv-url'), anon = al('gv-anon'), eposta = al('gv-eposta'), sifre = al('gv-sifre'), depo = al('gv-depo');
    if (!url || !anon || !eposta || !sifre) { toast('Dört alan da gerekli.', 'uyari'); return; }
    Object.assign(GUVENLIK_SAYFA, { url, anon, eposta, depo, calisiyor: true, sonuc: null, harita: null,
      ustKatmanUyarisi: false, kalintilar: [], tabloKaynagi: '' });
    render();
    try {
      const { sonuc, harita, ustKatmanUyarisi, kalintilar, tabloKaynagi } = await guvenlikTestiCalistir({ url, anon, eposta, sifre, depo });
      GUVENLIK_SAYFA.sonuc = sonuc;
      GUVENLIK_SAYFA.harita = harita;
      GUVENLIK_SAYFA.ustKatmanUyarisi = ustKatmanUyarisi;
      GUVENLIK_SAYFA.kalintilar = kalintilar || [];
      GUVENLIK_SAYFA.tabloKaynagi = tabloKaynagi || '';
    } catch (h) {
      toast('Test çalıştırılamadı: ' + h.message, 'hata');
    }
    GUVENLIK_SAYFA.calisiyor = false;
    render();
    return;
  }

  /* Güvenlik kontrolü durağı — Ayarlar'daki testin aynısı, bağlantı
     projeden. Sonucun özeti palete yazılıyor ki sayfa yenilenince de
     "ölçüldü mü, temiz mi" bilgisi kaybolmasın. */
  if (e === 'guvenlik-durak-test') {
    const pr = DB.proje(el.dataset.proje);
    if (!pr) return;
    const pl = pr.palet || {};
    const url = String(pl.supabaseUrl || '').trim();
    const anon = String(pl.supabaseAnon || '').trim();
    if (!url || !anon) { toast('Supabase adresi ve anon key eksik.', 'uyari'); return; }
    const al = son => { const x = $('#gvd-' + son + '-' + pr.id); return x ? x.value.trim() : ''; };
    const eposta = al('eposta'), sifre = al('sifre'), depo = al('depo');
    if (!eposta || !sifre) { toast('E-posta ve şifre gerekli.', 'uyari'); return; }

    const g = durakGuvenlikDurum(pr.id);
    Object.assign(g, { eposta, calisiyor: true, sonuc: null, harita: null,
      ustKatmanUyarisi: false, kalintilar: [], tabloKaynagi: '' });
    render();
    try {
      const r = await guvenlikTestiCalistir({ url, anon, eposta, sifre, depo });
      g.sonuc = r.sonuc;
      g.harita = r.harita;
      g.ustKatmanUyarisi = r.ustKatmanUyarisi;
      g.kalintilar = r.kalintilar || [];
      g.tabloKaynagi = r.tabloKaynagi || '';
      const toplam = (r.sonuc || []).length;
      const acik = (r.sonuc || []).filter(x => x.sonuc === 'AÇIK').length;
      /* Üst katman hesabıyla yapılan ölçüm geçerli sayılmaz — yetki haritası
         atlanıyor, "sıfır açık" yanıltıcı olur. Ölçüm kaydedilmiyor. */
      if (r.ustKatmanUyarisi) {
        toast('Üst katman hesabıyla ölçüm geçerli değil — personel hesabı ver.', 'uyari');
      } else {
        await DB.paletKaydet(pr.id, Object.assign({}, pr.palet || {},
          { guvenlikOlcum: { tarih: Date.now(), toplam, acik },
            guvenlikDepoAdresi: depo,
            /* Eski sürümlerden kalan elle onay işareti — artık kullanılmıyor,
               duruyorsa temizleniyor ki iki ayrı doğruluk kaynağı olmasın. */
            guvenlikTamamlandi: undefined }));
      }
    } catch (h) {
      toast('Test çalıştırılamadı: ' + h.message, 'hata');
    }
    g.calisiyor = false;
    render();
    return;
  }

  if (e === 'guvenlik-rapor-kopyala') {
    /* Aynı tablo iki yerde çiziliyor: Ayarlar > Güvenlik Testi ve proje
       durağı. data-proje varsa durağın kendi sonucu kopyalanır. */
    const kaynak = el.dataset.proje ? durakGuvenlikDurum(el.dataset.proje) : GUVENLIK_SAYFA;
    const metin = guvenlikRaporMetni(kaynak.sonuc, kaynak.ustKatmanUyarisi, kaynak.kalintilar,
      kaynak.harita, kaynak.tabloKaynagi);
    if (!metin) { toast('Kopyalanacak sonuç yok.', 'uyari'); return; }
    const ok = await panoyaKopyala(metin);
    toast(ok ? 'Rapor kopyalandı.' : 'Kopyalanamadı, tarayıcı izin vermedi.', ok ? 'basari' : 'hata');
    return;
  }

  if (e === 'guvenlik-kurulum-tik') {
    const pr = DB.proje(el.dataset.proje);
    if (!pr) return;
    const pl = pr.palet || {};
    const durum = Object.assign({}, pl.guvenlikKurulum || {});
    durum[el.dataset.no] = !durum[el.dataset.no];
    /* Hepsi işaretlenince liste kendiliğinden kapanıyor. */
    if (GUVENLIK_KURULUM_ADIM.every(a => durum[a.no])) GUVENLIK_KURULUM_ACIK = false;
    return isYap(() => DB.paletKaydet(pr.id,
      Object.assign({}, pl, { guvenlikKurulum: durum })));
  }

  if (e === 'guvenlik-sifre-goster') {
    const alan = document.getElementById(el.dataset.hedef);
    if (!alan) return;
    alan.type = alan.type === 'password' ? 'text' : 'password';
    el.classList.toggle('on', alan.type === 'text');
    return;
  }

  if (e === 'guvenlik-kurulum-ac') {
    GUVENLIK_KURULUM_ACIK = true;
    return render();
  }

  if (e === 'guvenlik-sql-kopyala') {
    const ok = await panoyaKopyala(GUVENLIK_SQL_FONKSIYON);
    toast(ok ? 'Kod kopyalandı — Supabase Edge Functions\'a yapıştır.' : 'Kopyalanamadı, tarayıcı izin vermedi.',
      ok ? 'basari' : 'hata');
    return;
  }

  /* Template'i listeden silme · Templateler ekranındaki çöp düğmesi.
     Kurulum panelindeki silmeyle AYNI kuralları uygular: kilitliyse
     durur, onay ister, silinince GitHub ve Supabase'de kalanları
     hatırlatır. İki yerde iki farklı davranış olmasın diye metinler de
     birebir aynı. */
  if (e === 'template-sil') {
    const pr = DB.proje(el.dataset.proje);
    if (!pr) return;
    if ((pr.palet || {}).kilitli) {
      toast('Bu template kilitli — önce yanındaki kilit simgesinden aç.', 'uyari');
      return;
    }
    const ok = await onaySor({
      baslik: 'Bu template silinsin mi?',
      mesaj: `"${projeAdi(pr)}" ve içindeki her şey kalıcı olarak silinecek. Bu işlem geri alınamaz.`,
      buton: 'Kalıcı olarak sil',
    });
    if (!ok) return;
    /* Depo adresi silinmeden önce alınıyor: sonrasında proje kaydı yok. */
    const slug = depoSlug(pr.repo);
    const ad   = projeAdi(pr);
    await isYap(() => DB.projeSil(pr.id), 'Template silindi.');
    return disaridaKalanlar(ad, slug);
  }
}

/* Veri değiştiren işleri tek yerden çalıştır: hata olursa bildir, olmazsa yenile. */
async function isYap(fn, basariMesaji, sonra) {
  try {
    await fn();
    /* Yazma bittikten sonra, çizimden önce çalışan kanca: ekran durumunu
       değiştirip aynı turda çizdirmek için. */
    if (sonra) sonra();
    sayaclariYaz();
    render();
    /* Bağlantılar ve kurulum sihirbazları ayrı bir katmanda duruyor,
       `render()` onları yenilemez — açıksa elle yeniden çizdiriyoruz. */
    if ($('#baglanti-adim')) baglantiAdimCiz();
    if ($('#kurulum-sihirbaz')) kurulumSihirbaziCiz();
    if ($('#sablon-sihirbaz')) sablonSihirbaziCiz();
    if (basariMesaji) toast(basariMesaji);
  } catch (err) {
    toast(err.message, 'hata');
  }
}

/* Yedek dosyasını okur ve içinde ne olduğunu gösterir. Geri yükleme yapmaz —
   üzerine yazmak veriyi silmek demek; onu ayrıca ve bilerek yapmak gerekir. */
function yedekSec() {
  const alan = document.createElement('input');
  alan.type = 'file';
  alan.accept = 'application/json,.json';

  alan.addEventListener('change', () => {
    const dosya = alan.files && alan.files[0];
    if (!dosya) return;

    const okuyucu = new FileReader();
    okuyucu.onload = () => {
      let bilgi;
      try { bilgi = DB.yedekOku(String(okuyucu.result)); }
      catch (err) { toast(err.message, 'hata'); return; }

      const satir = (ad, n) => `<div class="row"><div class="row-main">
        <span class="row-title">${ad}</span></div><span class="row-val mono">${n}</span></div>`;

      modalAc(`
        ${modalBaslik(ICON.kopya, 'Yedek dosyası', bilgi.surum + ' · ' + tarihYaz(bilgi.tarih))}
        <div class="card"><div class="row-list">
          ${satir('Proje', bilgi.sayim.projeler)}
          ${satir('Modül', bilgi.sayim.moduller)}
          ${satir('Sayfa', bilgi.sayim.sayfalar)}
          ${satir('Görev', bilgi.sayim.gorevler)}
          ${satir('Standart', bilgi.sayim.standartlar)}
        </div></div>
        <div class="note note-kucuk">
          ${svg(ICON.info, 14)}
          <span>Dosya sağlam görünüyor. Geri yükleme henüz açık değil — üzerine yazmak
          mevcut veriyi siler, bunu bilerek yapmak gerekir.</span>
        </div>
        <div class="modal-alt">
          <button class="btn btn-primary" data-y="kapat" type="button"><span>Tamam</span></button>
        </div>`, kutu => {
        $('[data-y="kapat"]', kutu).addEventListener('click', modalKapat);
      });
    };
    okuyucu.readAsText(dosya);
  });

  alan.click();
}

/* ==========================================================================
   YARDIMCILAR
   ========================================================================== */

function esc(s) {
  return String(s == null ? '' : s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

/* Projenin ekranlarda görünen adı: "Nizam Soft - Kişisel Bütçe".
   Modül henüz kurulmadıysa Depo durağında yazılan ad kullanılıyor;
   o da yoksa sade firma adı döner. */
function modulAdi(p) {
  const pl = (p && p.palet) || {};
  if (pl.modulAdi) return pl.modulAdi;
  const m = DB.modulleri(p.id).filter(x => !x.genel)[0];
  return m ? m.ad : '';
}

function projeAdi(p) {
  if (!p) return '';
  const m = modulAdi(p);
  return m ? p.firma + ' - ' + m : p.firma;
}

function basHarf(ad) {
  const p = String(ad || '').trim().split(/\s+/).filter(Boolean);
  if (!p.length) return '—';
  if (p.length === 1) return p[0].slice(0, 2).toLocaleUpperCase('tr');
  return (p[0][0] + p[1][0]).toLocaleUpperCase('tr');
}

function renkStil(anahtar) {
  const r = PROJE_RENK[anahtar] || PROJE_RENK.metal;
  return `background:linear-gradient(140deg, ${r[0]}, ${r[1]})`;
}

function hexRgb(h) {
  const t = String(h).replace('#', '');
  return [0, 2, 4].map(i => parseInt(t.slice(i, i + 2), 16));
}

/* Rengi beyaza doğru açar — ilerleme çubuğunun parlak ucu için */
function acikla(hex, oran) {
  const [r, g, b] = hexRgb(hex);
  const k = v => Math.round(v + (255 - v) * oran);
  return `rgb(${k(r)},${k(g)},${k(b)})`;
}

function saydam(hex, a) {
  const [r, g, b] = hexRgb(hex);
  return `rgba(${r},${g},${b},${a})`;
}

/* Bir projenin renk değişkenleri. Kartın ve üst çubuğun rengi buradan gelir. */
const RENK_ADI = {
  metal: 'Metal', yesil: 'Yeşil', mor: 'Mor', altin: 'Altın',
  mavi: 'Mavi', gul: 'Gül', lacive: 'Lacivert',
};

function renkAdi(anahtar) {
  return RENK_ADI[anahtar] || 'Metal';
}

function renkDegiskenleri(anahtar) {
  const [k, d] = PROJE_RENK[anahtar] || PROJE_RENK.metal;
  return `--p1:${k};--p2:${d};--pl:${acikla(k, .38)};--pg:${saydam(k, .15)};--pk:${saydam(k, .45)}`;
}

function durumSinif(d) {
  return { gelistiriliyor: 'dev', kontrolde: 'check', tamamlandi: 'done' }[d] || '';
}

function gorevNo(g) { return TASK_PREFIX + '-' + g.no; }

/* Görevin ağaçtaki yeri: Proje › Modül › Sayfa */
function gorevYolu(g) {
  const proje = DB.proje(g.proje_id);
  const modul = g.modul_id ? DB.moduller.find(m => m.id === g.modul_id) : null;
  const sayfa = g.sayfa_id ? DB.sayfalar.find(s => s.id === g.sayfa_id) : null;

  const parcalar = [
    proje ? `<b>${esc(projeAdi(proje))}</b>` : 'Proje',
    modul ? esc(modul.ad) : null,
    sayfa ? esc(sayfa.ad) : null,
  ].filter(Boolean);

  return parcalar.join(' › ');
}

/* Sayfa noktasının rengi: en geride kalan görevin durumu */
function sayfaRengi(gorevler) {
  if (!gorevler.length) return 'var(--st-todo)';
  for (const d of DURUM_SIRA) {
    if (gorevler.some(g => g.durum === d)) return `var(--st-${DURUM_SINIF[d]})`;
  }
  return 'var(--st-todo)';
}

/* Kişi rengi — kimliğinden türetilir, hep aynı kalır */
function kisiRengi(id) {
  const paletler = ['#3a5f8a', '#6b4a86', '#7a5a2e', '#2f6f4f', '#7a3a4a', '#3f5a6b'];
  let t = 0;
  String(id || '').split('').forEach(c => { t = (t + c.charCodeAt(0)) % 997; });
  return paletler[t % paletler.length];
}

function bugunTarih() {
  const d = new Date();
  const p = n => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

function tarihYaz(iso) {
  if (!iso) return '';
  const a = ['Ocak','Şubat','Mart','Nisan','Mayıs','Haziran','Temmuz','Ağustos','Eylül','Ekim','Kasım','Aralık'];
  const d = new Date(iso);
  const p = n => String(n).padStart(2, '0');
  return `${d.getDate()} ${a[d.getMonth()]} ${p(d.getHours())}:${p(d.getMinutes())}`;
}

/* Panelin tepesi: ilerleme halkasının içinde profil fotoğrafı,
   altında saate göre selam ve tek satır özet. */
function karsilama(ilerleme, projeSayi, acikIs) {
  const r = 66, cevre = 2 * Math.PI * r;
  const bos = cevre * (1 - ilerleme.yuzde / 100);

  const ozet = [
    projeSayi ? `<b>${projeSayi} proje</b>` : 'henüz proje yok',
    acikIs ? `<b>${acikIs} açık iş</b>` : 'açık iş yok',
  ].join(' · ');

  return `
    <div class="karsilama">
      <div class="halka">
        <svg viewBox="0 0 150 150" aria-hidden="true">
          <circle class="halka-iz"   cx="75" cy="75" r="${r}"></circle>
          <circle class="halka-dolu" cx="75" cy="75" r="${r}"
                  stroke-dasharray="${cevre.toFixed(1)}" stroke-dashoffset="${bos.toFixed(1)}"></circle>
        </svg>
        ${AUTH.foto
          ? `<span class="halka-foto" style="background-image:url('${esc(AUTH.foto)}')"></span>`
          : `<span class="halka-foto"><b>${esc(AUTH.basHarfler)}</b></span>`}
        <span class="halka-rozet">%${ilerleme.yuzde}</span>
      </div>
      <h2 class="selam">${esc(selamla())}, ${esc(AUTH.ad)}</h2>
      <p class="selam-alt">${esc(todayLabel())} · ${ozet}</p>
    </div>`;
}

/* Panelin hero bloğu — editoryal dilin açılışı.
   Fotoğraf eskiden bütün panelin zeminiydi; kartlar onun üstünde yüzmek
   zorunda kalıyor, her biri yarı saydam cam olmak durumunda kalıyordu.
   Şimdi fotoğraf sınırlı bir blok: selam onun koyu perdesinin üstüne
   düşüyor, kartlar kağıdın üstünde rahat ediyor.

   Görsel gorseller/panel-ofis.webp. Dosya yoksa onerror ile eski ofis
   fotoğrafına, o da yoksa düz mürekkep zemine düşüyor — yani görsel
   eklenene kadar panel çirkinleşmiyor, yalnız sadeleşiyor. */
/* Projeye en son ne zaman dokunuldu — o projenin görevleri içindeki en
   yeni değişiklik. Ayrı bir "güncellendi" alanı tutmuyoruz; tutulsaydı
   iki kaynak olur ve biri eskirdi. */
function pzSonDokunus(pid) {
  let enYeni = '';
  DB.gorevleri({ proje: pid }).forEach(g => {
    if ((g.guncellendi || '') > enYeni) enYeni = g.guncellendi || '';
  });
  return enYeni;
}
/* Tarihi insan diline çevirir: bugün ve dün saatle, öncesi tam tarihle. */
function pzZaman(iso) {
  if (!iso) return 'henüz hareket yok';
  const d = new Date(iso);
  const p = n => String(n).padStart(2, '0');
  const saat = `${p(d.getHours())}:${p(d.getMinutes())}`;
  const gun = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const bugun = new Date();
  const b0 = new Date(bugun.getFullYear(), bugun.getMonth(), bugun.getDate());
  const fark = Math.round((b0 - gun) / 86400000);
  if (fark === 0) return 'Bugün · ' + saat;
  if (fark === 1) return 'Dün · ' + saat;
  return tarihYaz(iso);
}

/* ---------- Panelin hero'su ----------
   Koyu bir pano: solda selam, sağda markanın "N"i ve kırmızı ışık
   çizgileri. Ofis fotoğrafı kalktı — tasarım kararı: hero artık markanın
   kendisini taşıyor, bir mekânı değil.

   Etekte yalnız tarih var. */
function panelHero() {
  const ad = String(AUTH.ad || '').split(' ')[0];
  const d = new Date();
  const aylar = ['Ocak','Şubat','Mart','Nisan','Mayıs','Haziran','Temmuz',
                 'Ağustos','Eylül','Ekim','Kasım','Aralık'];
  const gunler = ['Pazar','Pazartesi','Salı','Çarşamba','Perşembe','Cuma','Cumartesi'];
  const p = n => String(n).padStart(2, '0');

  return `
    <section class="ph">
      <span class="ph-isik" aria-hidden="true"></span>
      <img class="ph-n" src="logo.png" alt="" draggable="false">
      <div class="ph-yazi">
        <h1>Merhaba,${ad ? ` <em>${esc(ad)}</em>` : ''}</h1>
        <p class="ph-slogan">Planla. Geliştir. Teslim et.</p>
        <blockquote class="ph-soz">Fikirleri gerçeğe dönüştüren<br>bir çalışma alanı.</blockquote>
      </div>
      <span class="ph-etek">
        <i class="ph-tarih">${svg(ICON.takvim, 14)}${gunler[d.getDay()]}, ${d.getDate()} ${aylar[d.getMonth()]} ${d.getFullYear()}, ${p(d.getHours())}:${p(d.getMinutes())}</i>
      </span>
      <!-- Sağ kenardaki dikey söz: yalnız masaüstünde, geniş hero'nun sağ
           ucu boş kalmasın diye. Altındaki ok Projeler'e götürüyor. -->
      <span class="ph-sag" aria-hidden="true">
        <u></u>
        <i>Daha<br>iyi fikirler<br>daha büyük<br>projeler</i>
      </span>
      <a class="ph-ok" href="#/projeler" aria-label="Projeler">${svg(ICON.chevron, 16)}</a>
    </section>`;
}

/* Proje kartında yer dar: bugünkü saat tek başına yeter, "Bugün ·"
   öneki satırı ikiye kırıyordu. */
function pzZamanKisa(iso) {
  const t = pzZaman(iso);
  return t.indexOf('Bugün · ') === 0 ? t.slice(8) : t.replace(' · ', ' ');
}

/* Yüzde halkası. Tek yerde duruyor: panelde üç ayrı boyda kullanılıyor
   ve her seferinde yeniden yazmak üç ayrı yuvarlama hatası demekti. */
function pzHalka(yuzde, boy, kalin) {
  boy = boy || 74; kalin = kalin || 8;
  const y = Math.max(0, Math.min(100, Math.round(yuzde || 0)));
  const r = (boy - kalin) / 2;
  const cevre = 2 * Math.PI * r;
  const dolu = cevre * y / 100;
  const o = boy / 2;
  return `<svg class="hlk" viewBox="0 0 ${boy} ${boy}" width="${boy}" height="${boy}" aria-hidden="true">
    <circle cx="${o}" cy="${o}" r="${r.toFixed(2)}" fill="none"
            stroke="var(--hlk-bos)" stroke-width="${kalin}"></circle>
    <circle cx="${o}" cy="${o}" r="${r.toFixed(2)}" fill="none"
            stroke="var(--hlk-dolu)" stroke-width="${kalin}" stroke-linecap="round"
            stroke-dasharray="${dolu.toFixed(1)} ${(cevre - dolu).toFixed(1)}"
            transform="rotate(-90 ${o} ${o})"></circle>
  </svg>`;
}

/* ---------- İki sayı kartı ----------
   Solda halka: devam eden projelerin ortalama ilerlemesi.
   Sağda en yakın teslim tarihi: projelerin `teslim` alanından, bugünden
   sonraki en yakın olanı. Tarihi olan proje yoksa satır hiç çıkmıyor —
   uydurma bir tarih yazmaktansa kart sade kalsın. */
function enYakinTeslim(projeler) {
  const bugun = new Date(bugunTarih());
  const gelecek = projeler
    .filter(p => p.teslim && p.durum !== 'tamamlandi')
    .map(p => ({ p, t: new Date(p.teslim) }))
    .filter(x => x.t >= bugun)
    .sort((x, y) => x.t - y.t);
  return gelecek.length ? gelecek[0] : null;
}

function panelSayilar(projeler) {
  /* Şeritteki "Aktif Projeler" ile aynı ölçü: biten proje sayılmıyor. */
  const devam = projeler.filter(p => !projeBittiMi(p));

  /* Açık görev YALNIZ devam eden projelerden sayılıyor. Eskiden bütün
     görevler sayılıyordu: arşivlenmiş projenin, şablonun ve bitmiş projenin
     görevleri de panele "açık iş" gibi yansıyordu. */
  const devamIds = devam.map(p => p.id);
  const acik = (DB.gorevler || []).filter(g =>
    g.durum !== 'tamamlandi' && devamIds.includes(g.proje_id)).length;
  const yuzdeler = devam.map(p => projeAsamaYuzde(p));
  const ortalama = yuzdeler.length
    ? Math.round(yuzdeler.reduce((t, x) => t + x, 0) / yuzdeler.length) : 0;

  const aylar = ['Ocak','Şubat','Mart','Nisan','Mayıs','Haziran','Temmuz',
                 'Ağustos','Eylül','Ekim','Kasım','Aralık'];
  /* En yakın bitiş. Açık görev yoksa tarih de yok — uydurma tarih yazmıyoruz.
     Görev varsa projelerin teslim tarihlerinden bugünden sonraki en yakını.
     Görev sistemi baştan yazılınca bu satırın kaynağı da değişecek. */
  const yakin = acik ? enYakinTeslim(projeler) : null;
  const tarihYazi = !acik ? 'Görev yok'
    : yakin ? `${yakin.t.getDate()} ${aylar[yakin.t.getMonth()]} ${yakin.t.getFullYear()}`
            : 'Tarih yok';

  const klasorDolu = '<svg viewBox="0 0 24 24" style="width:19px;height:19px">'
    + '<path fill="#fff" stroke="none" d="M3 7.5A2.5 2.5 0 0 1 5.5 5h3.2l2 2h8.8A2.5 2.5 0 0 1 22 9.5v8A2.5 2.5 0 0 1 19.5 20h-15A2.5 2.5 0 0 1 2 17.5z"></path></svg>';
  const onayDolu = '<svg viewBox="0 0 24 24" style="width:19px;height:19px">'
    + '<rect x="3.5" y="3.5" width="17" height="17" rx="4.5" fill="none" stroke="#fff" stroke-width="1.8"></rect>'
    + '<path d="M8 12.3l2.7 2.7L16.3 9.2" fill="none" stroke="#fff" stroke-width="2.2"'
    + ' stroke-linecap="round" stroke-linejoin="round"></path></svg>';

  /* Sağ alttaki soluk çizim: üst üste binmiş üç kart ve bir onay. */
  const gorevCizimi = '<svg viewBox="0 0 120 120" aria-hidden="true">'
    + '<rect x="46" y="10" width="62" height="62" rx="16" fill="currentColor" opacity=".30"></rect>'
    + '<rect x="30" y="30" width="68" height="68" rx="18" fill="currentColor" opacity=".45"></rect>'
    + '<rect x="40" y="46" width="72" height="72" rx="20" fill="currentColor" opacity=".70"></rect>'
    + '<path d="M60 84l10 10 20-22" fill="none" stroke="#fff" stroke-width="7"'
    + ' stroke-linecap="round" stroke-linejoin="round" opacity=".7"></path></svg>';

  return `<div class="ps-izgara">
    <a class="ps ps-proje" href="#/projeler">
      <span class="ps-ok" aria-hidden="true">${svg(ICON.chevron, 14)}</span>
      <span class="ps-ikon">${klasorDolu}</span>
      <b class="ps-bas">Devam Eden Proje</b>
      <i class="ps-aciklama">Aktif olarak ilerleyen proje</i>
      <b class="ps-sayi">${devam.length}</b>
      <span class="ps-halka">
        ${pzHalka(ortalama, 80, 8)}
        <span class="ps-halka-ic"><b>%${ortalama}</b><i>tamamlandı</i></span>
      </span>
    </a>
    <a class="ps ps-gorev" href="#/gorevler">
      <span class="ps-cizim" aria-hidden="true">${gorevCizimi}</span>
      <span class="ps-ok" aria-hidden="true">${svg(ICON.chevron, 14)}</span>
      <span class="ps-ikon">${onayDolu}</span>
      <b class="ps-bas">Açık Görev</b>
      <i class="ps-aciklama">Tamamlanmayı bekleyen</i>
      <b class="ps-sayi">${acik}</b>
      <span class="ps-bitis">
        ${svg(ICON.takvim, 14)}
        <span><i>En yakın bitiş</i><b>${esc(tarihYazi)}</b></span>
      </span>
    </a>
  </div>`;
}

/* ---------- Aktif projeler ----------
   Koyu kartlar, yan yana kayan bir şerit. Her kartta halka içinde yüzde,
   altında durum ve son güncelleme. Bitmiş projede yeşil onay rozeti. */
function pzProjeKarti(p, i = 0) {
  const yuzde = projeAsamaYuzde(p);
  const adres = DB.logoAdres[p.id];
  /* Ad kutuya sığsın: "Firma - Modül" uzun geliyorsa yalnız firma adı. */
  const tam = basHarfleriBuyuk(projeAdi(p));
  const ad  = tam.length > 18 ? basHarfleriBuyuk(p.firma || tam) : tam;

  return `
    <div class="pk2 ${i === 0 ? 'son' : ''} ${yuzde >= 75 ? 'iyi' : ''}"
         data-eylem="proje-ac" data-id="${p.id}" role="button" tabindex="0">
      ${AUTH.yonetici ? `<button class="pk2-menu only-desktop" data-eylem="proje-menu"
        data-id="${p.id}" type="button" aria-label="Proje menüsü">
        <svg viewBox="0 0 24 24"><circle cx="12" cy="5" r="1.6"></circle><circle cx="12" cy="12" r="1.6"></circle><circle cx="12" cy="19" r="1.6"></circle></svg>
      </button>` : ''}
      <span class="pk2-logo ${adres ? 'yukleniyor' : ''}" ${adres ? `data-logo="${esc(adres)}"` : ''}>
        <b class="logo-harf">${esc(basHarf(p.firma))}</b>
        ${adres ? '<span class="donen"></span>' : ''}
      </span>
      <span class="pk2-halka">${pzHalka(yuzde, 46, 5)}<u>${yuzde}%</u></span>
      <b class="pk2-ad" title="${esc(tam)}">${esc(ad)}</b>
    </div>`;
}

function panelProjeler(projeler) {
  if (!projeler.filter(p => !projeBittiMi(p)).length) {
    return `<div class="pz-bolum">
      <span class="pz-bas"><b>Aktif Projeler</b><u></u></span>
      <div class="card">${empty(ICON.folder, 'Devam eden proje yok',
        AUTH.yonetici ? 'Yeni Proje sihirbazı firma, platform ve modülleri sorar; gerisini kendisi kurar.'
                      : 'Sana bir proje atandığında burada görünecek.',
        AUTH.yonetici ? 'Yeni Proje' : null, 'sihirbaz')}</div>
    </div>`;
  }
  /* Panelde yalnız devam edenler: biten proje "aktif" değil. */
  const sirali = projeler.filter(p => !projeBittiMi(p)).sort((a, b) =>
    (pzSonDokunus(b.id) || '').localeCompare(pzSonDokunus(a.id) || ''));
  return `<div class="pz-bolum">
    <span class="pz-bas">
      <b>Aktif Projeler</b><u></u>
      <a class="pz-tum" href="#/projeler">Tüm Projeler ${svg(ICON.chevron, 13)}</a>
    </span>
    <div class="pk2-sarma">
      <div class="pk2-serit"><div class="pk2-sira">${sirali.slice(0, 6).map((p, i) => pzProjeKarti(p, i)).join('')}</div></div>
      <button class="pk2-kaydir only-desktop" data-eylem="serit-kaydir" type="button"
        aria-label="Sonraki projeler">${svg(ICON.chevron, 16)}</button>
    </div>
    <a class="pk2-dug" href="#/projeler">Tüm Projeleri Görüntüle ${svg(ICON.chevron, 15)}</a>
  </div>`;
}

/* ---------- Ekip ----------
   Çevrimiçi bilgisi canlı kanaldan geliyor ve ANLIK: kanal yalnız şu anı
   bilir. Çevrimdışı satırda yazan saat o kişinin son görev hareketidir;
   hiç hareketi yoksa satır sessiz kalır, uydurma saat yazılmaz. */
/* Son aktiflik: uygulamayı en son ne zaman açtığı. Damga yoksa (SQL
   çalıştırılmamışsa) en son görev hareketine düşüyor. */
function ekipSonGorulme(k) {
  const damga = (k && k.son_gorulme) || '';
  const hareket = ekipSonHareket(k && k.id);
  return damga > hareket ? damga : hareket;
}

function ekipSonHareket(kisiId) {
  let enYeni = '';
  (DB.hareketler || []).forEach(h => {
    if (h.kim === kisiId && (h.olusturuldu || '') > enYeni) enYeni = h.olusturuldu || '';
  });
  return enYeni;
}

function ekipSatiri(k) {
  const ad = k.ad_soyad || k.ad || 'İsimsiz';
  const cevrimici = DB.cevrimicimi(k.id);
  const son = ekipSonGorulme(k);
  return `
    <div class="ek ${cevrimici ? 'acik' : ''}">
      <span class="ek-av">${k.foto
        ? `<img src="${esc(k.foto)}" alt="" loading="lazy">`
        : esc(basHarf(ad))}<u></u></span>
      <span class="ek-orta">
        <b>${esc(ad.split(' ')[0])}</b>
        <i class="ek-dur">${cevrimici ? 'Şu an aktif.' : (son ? 'Son hareket: ' + esc(pzZaman(son)) : 'Çevrimdışı')}</i>
      </span>
      <span class="ek-rol">${k.rol === 'yonetici' ? 'Yönetici' : 'Geliştirici'}</span>
    </div>`;
}

function panelEkip() {
  const kisiler = (DB.kisiler || []).slice()
    .sort((a, b) => (DB.cevrimicimi(b.id) ? 1 : 0) - (DB.cevrimicimi(a.id) ? 1 : 0));
  if (!kisiler.length) return '';
  return `<div class="pz-bolum" id="ekip-blok">
    <span class="pz-bas">
      <b>Ekip</b><u></u>
      ${AUTH.yonetici ? `<a class="pz-tum" href="#/ekip">Tüm Ekip ${svg(ICON.chevron, 13)}</a>` : ''}
    </span>
    <div class="ek-liste">${kisiler.slice(0, 5).map(ekipSatiri).join('')}</div>
  </div>`;
}

/* ---------- Son Aktiviteler ----------
   Görev hareketlerinin son beşi. Hepsi gerçek kayıt: kim, ne yaptı, hangi
   göreve, saat kaçta. Hiç hareket yoksa bölüm hiç çıkmıyor — boş kutu
   göstermektense yer kaplamasın. */
const AKTIVITE_IKON = {
  olusturuldu: 'folder', atandi: 'kisi', baslandi: 'kalem',
  kontrole: 'saat', revize: 'uyari', onaylandi: 'tik', geri: 'geriAl',
};

function aktiviteSatiri(h) {
  const gorev = (DB.gorevler || []).find(g => g.id === h.gorev_id);
  const ikon  = ICON[AKTIVITE_IKON[h.tip]] || ICON.check;
  const alt   = h.notu || (gorev && gorev.baslik) || '';
  const t     = new Date(h.olusturuldu || Date.now());
  const p     = n => String(n).padStart(2, '0');
  return `
    <div class="ak2 ${h.tip === 'revize' ? 'uyari' : ''}">
      <span class="ak2-ikon">${svg(ikon, 15)}</span>
      <span class="ak2-orta">
        <b>${esc(DB.kisiAdi(h.kim) || 'Biri')}</b>
        <span>${esc(HAREKET_ADI[h.tip] || h.tip)}</span>
        ${alt ? `<i>${esc(alt)}</i>` : ''}
      </span>
      <span class="ak2-saat">${p(t.getHours())}:${p(t.getMinutes())}</span>
    </div>`;
}

function panelAktivite() {
  const hepsi = (DB.hareketler || []).slice()
    .sort((a, b) => (b.olusturuldu || '').localeCompare(a.olusturuldu || ''))
    .slice(0, 5);
  if (!hepsi.length) return '';
  return `<div class="pz-bolum">
    <span class="pz-bas"><b>Son Aktiviteler</b><u></u></span>
    <div class="ak2-liste">${hepsi.map(aktiviteSatiri).join('')}</div>
  </div>`;
}

/* Biri girip çıkınca yalnız bu blok yeniden çiziliyor. */
function ekipBlogunuTazele() {
  const eski = document.getElementById('ekip-blok');
  if (!eski) return;
  const kap = document.createElement('div');
  kap.innerHTML = panelEkip();
  const yeni = kap.firstElementChild;
  if (yeni) eski.replaceWith(yeni);
}

/* ---------- Bugünkü durum ----------
   Üç sayı ve altında son projeler. Sayılar artık ekranın tepesini kaplamıyor;
   gidilecek yerlerden sonra, tek kartın içinde duruyor. */
/* Saate göre selam. */
function selamla() {
  const s = new Date().getHours();
  if (s < 5)  return 'İyi geceler';
  if (s < 11) return 'Günaydın';
  if (s < 18) return 'İyi günler';
  if (s < 22) return 'İyi akşamlar';
  return 'İyi geceler';
}

function todayLabel() {
  const g = ['Pazar','Pazartesi','Salı','Çarşamba','Perşembe','Cuma','Cumartesi'];
  const a = ['Ocak','Şubat','Mart','Nisan','Mayıs','Haziran','Temmuz','Ağustos','Eylül','Ekim','Kasım','Aralık'];
  const d = new Date();
  return `${d.getDate()} ${a[d.getMonth()]}, ${g[d.getDay()]}`;
}

let toastTimer = null;

/* tip: 'bilgi' | 'basari' | 'hata' | 'uyari' */
function toast(msg, tip = 'bilgi') {
  const t = $('#toast');
  t.textContent = msg;
  t.className = 't-' + tip;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.add('hidden'), 2800);
}

/* ==========================================================================
   OTURUM
   ========================================================================== */

async function girisGonder(e) {
  e.preventDefault();

  const buton = $('#login-form button[type=submit]');
  const yazi  = buton.querySelector('span') || buton;
  const eski  = yazi.textContent;

  hataGizle();
  buton.disabled = true;
  yazi.textContent = 'Giriş yapılıyor…';

  try {
    await AUTH.signIn($('#login-mail').value, $('#login-pass').value);
    $('#login-pass').value = '';
    await uygulamayiAc();
  } catch (err) {
    hataGoster(err.message);
    $('#login-pass').select();
  } finally {
    buton.disabled = false;
    yazi.textContent = eski;
  }
}

async function signOut() {
  await AUTH.signOut();
  DB.projeler = []; DB.moduller = []; DB.sayfalar = [];
  DB.gorevler = []; DB.hareketler = []; DB.kisiler = [];
  DB.yuklendi = false; DB.hata = null;
  DB.standartlar = []; DB.gorevStandart = [];
  ACIK_STANDART.clear();
  DB.canliDur();
  DB.onbellekSil();
  document.removeEventListener('visibilitychange', geriDonunce);
  clearInterval(LOGO_ZAMANLAYICI);
  GOREV_FILTRE = '';
  modalHepsiniKapat();

  $('#app').classList.add('hidden');
  $('#login').classList.remove('hidden');
  hataGizle();
  $('#login-mail').value = '';
  $('#login-pass').value = '';
}

async function uygulamayiAc() {
  if (AUTH.pasif) {
    await AUTH.signOut();
    $('#app').classList.add('hidden');
    $('#login').classList.remove('hidden');
    hataGoster('Erişimin kapatılmış. Yöneticiye başvur.');
    return;
  }

  $('#login').classList.add('hidden');
  $('#app').classList.remove('hidden');
  notDefteriKur();
  menuyuCiz();
  kullaniciYaz();
  /* Açılışta zaten indi; ikinci kez çekmiyoruz. */
  if (DB.yuklendi) { sayaclariYaz(); render(); }
  else await veriTazele();

  /* Logo adresleri bir saat geçerli. Uygulama uzun süre açık kalırsa
     yarım saatte bir yenile ki logolar kaybolmasın. */
  clearInterval(LOGO_ZAMANLAYICI);
  LOGO_ZAMANLAYICI = setInterval(async () => {
    try { await DB.logolariTazele(true); } catch (e) { return; }
    if (!$('.modal-perde')) render();
  }, 30 * 60 * 1000);

  /* Başka biri bir şey değiştirdiğinde ekran kendiliğinden tazelensin */
  DB.canliBasla(async adlar => {
    try {
      if (adlar && adlar.length) await DB.tazele(...adlar);
      else await DB.yukle();
    } catch (e) { return; }
    sayaclariYaz();
    if (!$('.modal-perde') && !$('#sihirbaz') && !$('#program-adim') && !$('#onizleme')) render();
  });

  /* Kim şu an uygulamada — panelin ekip bloğu bunu gösteriyor.
     Biri girip çıkınca yalnız o blok yeniden çiziliyor; bütün sayfayı
     tazelemek kaydırmayı başa alıyor ve göz yoruyordu. */
  /* Biri girip çıkınca panelin ekip bloğu ve Ekip ekranı tazeleniyor:
     sayılar ve yeşil kartlar anında doğru olsun. */
  DB.varlikBasla(() => {
    ekipBlogunuTazele();
    /* Biri çıktığında onun "son görülme"si değişmiş olur; Ekip ekranı
       açıksa kişileri tazeleyip yeniden çiziyoruz. */
    if (rota().key === 'ekip') DB.tazele('kisiler').then(render, render);
  });

  /* Son görülme damgası: açılışta bir kez, sonra beş dakikada bir. */
  DB.goruldu(true);
  clearInterval(GORULDU_SAAT);
  GORULDU_SAAT = setInterval(() => DB.goruldu(), 5 * 60 * 1000);

  /* Telefon uygulamayı arka planda dondurunca canlı bağlantı kopuyor ve
     aradaki değişiklikler kaçıyor. Geri dönünce sessizce tazele. */
  document.removeEventListener('visibilitychange', geriDonunce);
  document.addEventListener('visibilitychange', geriDonunce);
}

/* Uygulamaya geri dönüldüğünde sessiz tazeleme — en fazla dakikada bir. */
let SON_TAZELEME = 0;
let GORULDU_SAAT = null;
async function geriDonunce() {
  if (document.hidden || !AUTH.bagli) return;
  DB.goruldu();                      /* geri döndü: hâlâ buradayım */
  if (Date.now() - SON_TAZELEME < 60 * 1000) return;
  SON_TAZELEME = Date.now();

  try { await DB.yukle(); } catch (e) { return; }
  sayaclariYaz();
  if (!$('.modal-perde') && !$('#sihirbaz') && !$('#program-adim') && !$('#baglanti-adim')) render();
}

function hataGoster(mesaj) {
  const kutu = $('#login-error');
  kutu.textContent = mesaj;
  kutu.classList.remove('hidden');
}

function hataGizle() { $('#login-error').classList.add('hidden'); }

function kullaniciYaz() {
  /* Fotoğraf logolarla aynı yoldan geçiyor: logolariGoster() indirir,
     bitince yerine koyar. Tek mekanizma, tek davranış. */
  $$('#user-tile .foto, #user-chip .foto').forEach(el => {
    if (!AUTH.foto) {
      el.style.backgroundImage = '';
      el.classList.remove('resimli', 'yukleniyor');
      return;
    }
    if (el.dataset.hazir === AUTH.foto) return;   /* aynı resim, tekrar indirme */

    el.dataset.hazir = AUTH.foto;
    el.dataset.logo = AUTH.foto;
    el.classList.add('yukleniyor');
    if (!$('.donen', el)) el.insertAdjacentHTML('beforeend', '<span class="donen"></span>');
  });
  $$('#user-chip .avatar, #user-tile .avatar').forEach(e => e.textContent = AUTH.basHarfler);
  $$('#user-chip .user-name, #user-tile .user-name').forEach(e => e.textContent = AUTH.ad);
  $$('#user-chip .user-role, #user-tile .user-role').forEach(e => e.textContent = AUTH.rolAdi);

  logolariGoster();

  const surum = $('#rail-surum');
  if (surum) surum.textContent = APP.version + ' · ' + APP.stage;
}

/* ==========================================================================
   AÇILIŞ
   ========================================================================== */

/* Açılış çubuğu. Veri sözü verilirse son adımda onu bekler — çubuk gerçekten
   bir şey beklemiş olur. Veri erken gelirse animasyon yine de tamamlanır. */
function runLoader(veri) {
  const fill = $('.loader-fill');
  const msg  = $('.loader-msg');
  if (!fill || !msg) return Promise.resolve();
  const steps = [
    [25, 'Tema yükleniyor…'],
    [50, 'Oturum denetleniyor…'],
    [80, veri ? 'Projeler geliyor…' : 'Arayüz hazırlanıyor…'],
  ];

  return new Promise(resolve => {
    let i = 0;
    const tick = async () => {
      if (i < steps.length) {
        const [pct, text] = steps[i++];
        fill.style.width = pct + '%';
        msg.textContent  = text;
        setTimeout(tick, 190);
        return;
      }

      if (veri) {
        msg.textContent = 'Projeler geliyor…';
        /* Bağlantı kötüyse açılışta takılıp kalmayalım: üç saniyeden fazla
           bekletmiyoruz, kalanı uygulama açıkken tamamlanır. */
        await Promise.race([veri, new Promise(r => setTimeout(r, 3000))]);
      }
      fill.style.width = '100%';
      msg.textContent  = 'Hazır';
      setTimeout(resolve, 160);
    };
    setTimeout(tick, 220);
  });
}

async function boot() {
  eskileriTemizle();

  /* Sunucuda daha yeni sürüm varsa burada kendini yeniler ve geri dönmez */
  if (await GUNCELLEME.acilistaDenetle()) return;

  AUTH.init();

  const oturumVar = await AUTH.restore();

  /* Veri, açılış animasyonu oynarken iniyor. Eskiden animasyon bitince
     başlıyordu; o süre boşa gidiyordu. */
  let veri = null;
  if (oturumVar) {
    DB.onbellekOku();                 /* varsa kayıtlı sayılarla ekran hemen dolsun */
    /* Resimler de burada iniyor: veri gelince ısıtma sözü zincire ekleniyor,
       açılış çubuğu ikisini birden bekliyor. Uygulama açıldıktan sonra
       hiçbir ekranda resim beklenmesin diye. */
    veri = DB.yukle().then(() => DB.isitma).catch(() => {});
  }

  await runLoader(veri);

  const loader = $('#loader');
  loader.classList.add('fade-out');
  setTimeout(() => loader.remove(), 400);

  if (oturumVar) {
    await uygulamayiAc();
  } else {
    $('#login').classList.remove('hidden');
    $('#login-mail').focus();
  }
}

/* ==========================================================================
   OLAYLAR
   ========================================================================== */

/* ---------- Sayfa geçişi ----------
   Yeni ekran soluk gelir, eskisi anında gider. Tarayıcının geçiş motoru
   (startViewTransition) daha zengin bir çapraz geçiş yapabiliyor ama her
   seferinde tüm sayfanın iki tam ekran görüntüsünü alıyor — telefonda
   bunun bedeli animasyonun kendisinden büyük. Düz bir `opacity` ise
   ekran kartında bedava sayılır. */
window.addEventListener('hashchange', () => {
  /* Bu adresi gitVeCiz zaten çizdi; aynı ekranı bir daha kurmayalım. */
  if (CIZILEN_ADRES === location.hash) { CIZILEN_ADRES = null; return; }
  CIZILEN_ADRES = null;
  if (!$('#app').classList.contains('hidden')) { modalHepsiniKapat(); render(); }
});

/* Ana ekrandan mı, tarayıcı sekmesinden mi açıldı? Alt çubuğun payı buna göre
   değişiyor: tarayıcının kendi çubuğu varsa biz ayrıca pay bırakmıyoruz. */
function acilisBicimi() {
  const uygulama =
    (window.matchMedia && window.matchMedia('(display-mode: standalone)').matches) ||
    window.navigator.standalone === true;
  document.documentElement.classList.toggle('tarayici', !uygulama);
  document.documentElement.classList.toggle('uygulama', !!uygulama);
}

acilisBicimi();

document.addEventListener('DOMContentLoaded', () => {
  document.title = APP.name;
  acilisBicimi();

  $('#login-form').addEventListener('submit', girisGonder);
  $('#login-mail').addEventListener('input', hataGizle);
  $('#login-pass').addEventListener('input', hataGizle);

  /* Tüm eylemler tek dinleyiciden geçer — ekran her çizildiğinde yeniden bağlamak gerekmez */
  document.addEventListener('click', e => {
    const el = e.target.closest('[data-eylem]');
    if (el) { e.preventDefault(); eylemCalistir(el); }
  });

  /* Aşama formundaki alanlar: yazıp çıkınca kaydediliyor. */
  document.addEventListener('change', e => {
    const el = e.target.closest('[data-fm]');
    if (el) fmKaydet(el);
  });

  /* Katmanlar: ad değişince ya da katman sayısı değişince palete yaz.
     Sayı düğmesi merdiveni yeniden çiziyor (rolBagla); bu dinleyici ondan
     sonra çalıştığı için yeni adları okuyor. */
  const rolYaz = () => {
    if (!$('[data-rol-onek="durak"]', $('#view'))) return;
    const p = DB.proje(rota().id);
    if (!p) return;
    const yeni = rolOku($('#view'));
    if (!yeni.length) return;
    if (yeni.join('|') === rolListesi((p.palet || {}).roller).join('|')) return;
    isYap(() => DB.paletKaydet(p.id, Object.assign({}, p.palet || {}, { roller: yeni })), '');
  };
  document.addEventListener('change', e => {
    if (e.target.closest('[data-rol]')) rolYaz();
  });
  document.addEventListener('click', e => {
    if (e.target.closest('[data-rol-sayi]')) setTimeout(rolYaz, 0);
  });

  /* Küçük kopyala düğmeleri (depo adı, kaynak depo…) artık sayfanın
     içinde de çalışıyor — eskiden yalnız sihirbaz penceresinde bağlıydı. */
  document.addEventListener('click', async e => {
    const b = e.target.closest('[data-ak-kopya]');
    if (!b || b.closest('#baglanti-adim, #template-sihirbaz')) return;
    const ok = await panoyaKopyala(b.dataset.akKopya);
    b.classList.toggle('oldu', ok);
    toast(ok ? 'Kopyalandı.' : 'Kopyalanamadı.', ok ? 'basari' : 'hata');
  });

  /* Dışarı açılan bağlantılar panoya da yazıyor. Ayrı dinleyici, çünkü
     eylem dinleyicisi preventDefault çağırıyor ve bağlantıyı öldürürdü.
     await yok: kopyalama jestin içinde başlar, gezinme beklemez. */
  document.addEventListener('click', e => {
    const el = e.target.closest('[data-pano]');
    if (!el) return;
    const pr = DB.proje(el.dataset.proje);
    /* Ekran promptları rol adıyla birlikte geliyor: `gorselEkran:panel`.
       Altı ayrı anahtar tanımlamak yerine önekten ayırıyoruz. */
    const pano = el.dataset.pano || '';
    /* Aşama promptları sıra numarasıyla geliyor: `asama:2`. */
    const uret = pano.indexOf('asama:') === 0
      ? (proje => PROMPT.asama(proje.id, Number(pano.slice(6))))
      : pano.indexOf('modulGuncelle:') === 0
      ? (proje => PROMPT.modulGuncelle(proje.id, decodeURIComponent(pano.slice(14))))
      /* Final notundan doğan prompt: notun kendi metni Beta/Geliştirme'yle
         aynı güncelleme promptunu üretiyor, ayrı bir metin motoru gerekmiyor. */
      : pano.indexOf('finalNot:') === 0
      ? (proje => PROMPT.guncellemeIstek(proje.id,
          (finalNotlariOku(proje.palet || {})[Number(pano.slice(9))] || {}).metin || ''))
      /* Ekstra banka/fatura/gunsonu promptu: seçeneğin adı görünsün diye
         ayrı, PANO_PROMPT sabit anahtarlarla çalışıyor, seçenek sayısı
         değişken. `sablonEkstra:<kategori>:<i>` biçiminde geliyor. */
      : pano.indexOf('sablonEkstra:') === 0
      ? (proje => {
          const parcalar = pano.split(':');
          const kategori = parcalar[1];
          const x = (sablonTanimlarOku(proje)[kategori] || {}).ekstra[Number(parcalar[2])] || {};
          const konu = { banka: (x.ad || 'Banka') + ' ekstresi',
                         fatura: (x.ad || 'Sistem') + ' — fatura ve kart hareketi',
                         gunsonu: (x.ad || 'POS') + ' — gün sonu' }[kategori] || (x.ad || 'Yapı');
          return PROMPT.sablonOgren(proje.id, konu, '');
        })
      : PANO_PROMPT[pano];
    /* Projesiz prompt da var (standart ekleme) — o zaman data-proje boş. */
    if (!uret || (el.dataset.proje && !pr)) return;

    let metin;
    try { metin = uret(pr); } catch (h) { toast('Prompt üretilemedi: ' + h.message, 'hata'); return; }
    if (!metin || !metin.trim()) {
      /* Boş prompt sessizce gitmesin: sekme açılır ama panoda bir şey olmaz. */
      e.preventDefault();
      toast('Prompt boş çıktı — önceki adımları tamamla.', 'uyari');
      return;
    }
    panoyaKopyala(metin);
    uygulamayiDene(el.dataset.hedef);

    const yazi = $('.kd-yazi', el);
    el.classList.add('kopyalandi');
    if (yazi) yazi.textContent = (el.dataset.hedef || 'Sohbet') + ' açılıyor…';
    toast('Prompt panoda — ' + (el.dataset.hedef || 'sohbet') + '\'e yapıştır.', 'basari');
  });

  /* "GitHub'da aç"a dokunuldu: kullanıcı dönünce adresi kendimiz yazacağız. */
  document.addEventListener('click', e => {
    const el = e.target.closest('[data-depo-ac]');
    if (el) DEPO_BEKLIYOR[el.dataset.depoAc] = true;
    const pg = e.target.closest('[data-pages-ac]');
    if (pg) {
      PAGES_BEKLIYOR[pg.dataset.pagesAc] = true;
      /* Custom domain kutusuna yapıştırılacak adres hazır olsun. */
      if (pg.dataset.alanKopya) {
        panoyaKopyala(pg.dataset.alanKopya);
        toast('Adres panoda — Custom domain kutusuna yapıştır.', 'basari');
      }
    }
  });

  /* Uygulamaya dönüldüğünde bekleyen depo varsa onay kutusunu göster.
     Otomatik "bağlandı" YAZMIYORUZ artık: sekmeye dönüş, GitHub'ın gerçekten
     başarılı olduğu anlamına gelmiyor — hata verip boş sayfa açmış olabilir.
     Kullanıcı baglantiAdimGithub'daki "Bağlandı, devam et" düğmesiyle kendi
     onaylıyor (bkz. depo-baglandi-onay). */
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState !== 'visible') return;
    const beklenen = Object.keys(DEPO_BEKLIYOR).filter(pid => {
      const pr = DB.proje(pid);
      if (!pr || pr.repo) { delete DEPO_BEKLIYOR[pid]; return false; }
      return true;
    });
    if (beklenen.length) {
      render();
      if ($('#baglanti-adim')) baglantiAdimCiz();
    }
    /* Yayın (GitHub Pages) da artık otomatik yazmıyor — GitHub'ın Pages
       adımı hata verip açılmamış olabilir. Sekmeye dönüş yalnız onay
       kutusunu gösteriyor, "yayında" ancak pagesBaglandiOnayla ile
       kullanıcı onaylayınca yazılıyor. */
    const pagesBeklenen = Object.keys(PAGES_BEKLIYOR).filter(pid => {
      const pr = DB.proje(pid);
      if (!pr || (pr.palet || {}).yayinda) { delete PAGES_BEKLIYOR[pid]; return false; }
      return true;
    });
    if (pagesBeklenen.length) {
      render();
      if ($('#baglanti-adim')) baglantiAdimCiz();
    }
    /* Burada da otomatik kopyalamıyoruz — GitHub Ayarlar sekmesine gidip
       işaretlemeden dönmüş olabilir. Aynı soru bir daha soruluyor. */
    Object.keys(TEMPLATE_BEKLIYOR).forEach(kaynakId => {
      const { tur, sablon } = TEMPLATE_BEKLIYOR[kaynakId];
      delete TEMPLATE_BEKLIYOR[kaynakId];
      templateDonusOnaySor(kaynakId, tur, sablon);
    });
  });

  document.addEventListener('keydown', e => {
    if (e.key !== 'Enter' && e.key !== ' ') return;
    const el = e.target.closest('[data-eylem][tabindex]');
    if (el) { e.preventDefault(); eylemCalistir(el); }
  });

  $('#btn-back').addEventListener('click', async () => {
    /* Yapı ağacında bir kat yukarı çıkar; başka yerde tarayıcı geçmişinde
       bir adım geri gider. Sabit bir hedefe atlamak "geri" değil. */
    const { key, id, durak } = rota();
    if (durak === 'yapi' && YAPI_ACIK[id] && yapiGeri(YAPI_TASLAK[id], id)) {
      render();
      return;
    }
    if (history.length > 1) { history.back(); return; }
    /* Geçmiş yoksa bir kat yukarı çıkıyoruz. Eskiden burada her yerden
       Projeler'e atlanıyordu; ok artık Ayarlar ve Ekip'te de çalıştığı için
       oradan Projeler'e düşmek "geri" olmazdı. */
    location.hash = durak                     ? '#/projeler/' + id
                  : (key === 'projeler' && id) ? '#/projeler'
                  : '#/' + DEFAULT_ROUTE;
  });

  egilmeyiBagla();

  $$('#user-chip, #user-tile').forEach(el =>
    el.addEventListener('click', hesapMenusu));

  /* Profil sekmesi menüde değil, hesap panelini açıyor. */
  document.addEventListener('click', e => {
  });

  /* Yazma kutusunda Enter gönderiyor. */
  document.addEventListener('keydown', e => {
    if (e.key !== 'Enter' || !e.target.matches('#yz-metin')) return;
    e.preventDefault();
    const dug = $('.yz-gonder');
    if (dug) mesajYolla(dug.dataset.id);
  });

  /* Projeler ekranındaki arama. Kutu her çizimde yeniden doğduğu için
     dinleyici belgeye bağlı. */
  document.addEventListener('input', e => {
    if (e.target.matches('#pj-ara')) {
      PROJE_ARAMA = e.target.value.trim().toLocaleLowerCase('tr');
      pjAramaUygula();
    } else if (e.target.matches('#ek-ara')) {
      EKIP_ARAMA = e.target.value.trim().toLocaleLowerCase('tr');
      ekipAramaUygula();
    } else if (e.target.matches('#sk-ara')) {
      SEKTOR_ARAMA = e.target.value.trim().toLocaleLowerCase('tr');
      skAramaUygula();
    } else if (e.target.matches('#tp-ara')) {
      TEMPLATE_ARAMA = e.target.value.trim().toLocaleLowerCase('tr');
      tpAramaUygula();
    } else if (e.target.matches('#sh-ara')) {
      SOHBET_ARAMA = e.target.value.trim().toLocaleLowerCase('tr');
      sohbetAramaUygula();
    }
  });

  /* Üstteki arama kutusu henüz çalışmıyor: tasarımda yeri hazır, arama
     özelliği yazılınca burası açılır. Sessiz kalmasın diye haber veriyor. */
  const ara = $('#ust-ara');
  if (ara) ara.addEventListener('click', () => toast('Arama yakında gelecek.'));

  /* Sohbet henüz yazılmadı; düğmenin yeri tasarımda hazır. */
  const sohbet = $('#btn-sohbet');
  if (sohbet) sohbet.addEventListener('click', () => gitVeCiz('#/sohbet'));

  /* Zil bekleyen işlere götürüyor. */
  const zil = $('#btn-zil');
  if (zil) zil.addEventListener('click', () => { location.hash = '#/gorevler'; });

  boot();
});

/* ---------- PWA ---------- */

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('sw.js').catch(() => {});
  });
}
