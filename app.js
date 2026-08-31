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
  sablonlar:   { title: 'Modül Şablonları',   kisa: 'Şablonlar',   sub: () => sablonAltBaslik() },
  sektorler:   { title: 'Sektörler',           kisa: 'Sektörler',   sub: () => sektorAltBaslik() },
  ekip:        { title: 'Ekip',               kisa: 'Ekip',        sub: () => ekipAltBaslik() },
  ayarlar:     { title: 'Ayarlar',            kisa: 'Ayarlar',     sub: () => APP.version + ' · ' + APP.stage },
};

const DEFAULT_ROUTE = 'panel';

/* Projeler ekranının iki kovası. Adres `#/projeler/basmis` — proje kimlikleri
   uuid olduğu için bu iki kelimeyle asla çakışmaz.

   İki kova var, üç değil: bu yüzden "başlamış" ilerlemeye değil BİTMEMİŞ
   olmaya bakıyor. Yüzdesi sıfır olan projenin gidecek başka yeri yok;
   ">0" deseydik hiç görevi bitmemiş bir proje ekrandan tamamen kaybolurdu. */
const PROJE_KOVASI = {
  basmis: { ad: 'Başlamış Projeler', ikon: 'saat', sinif: 'k-basmis',
            sec: y => y < 100 },
  bitmis: { ad: 'Bitmiş Projeler',   ikon: 'bitti', sinif: 'k-bitmis',
            sec: y => y >= 100 },
};

function rota() {
  const p = (location.hash || '').replace(/^#\/?/, '').split('/').filter(Boolean);
  const key = ROUTES[p[0]] ? p[0] : DEFAULT_ROUTE;
  /* Üçüncü parça proje içindeki durak sayfası: #/projeler/<id>/firma */
  return { key, id: p[1] || null, durak: p[2] || null };
}

/* ---------- Durum ---------- */

let YUKLENIYOR     = false;
let GOREV_FILTRE   = '';
let SON_EKRAN      = '';
const ACIK_MODUL    = new Set();
const ACIK_SAYFA    = new Set();
const ACIK_STANDART = new Set();
/* Gruplar akordeon: aynı anda yalnızca biri açık kalır. */
let ACIK_GRUP = null;
let ACIK_SABLON = null;
let LOGO_ZAMANLAYICI = null;
/* Projeler ekranındaki bölümler. Varsayılanı kod belirler, kullanıcı değiştirir. */
const ACIK_PROJE_BOLUM = {};

/* ---------- İkonlar ---------- */

/* İkonlar iki katmanlı: altta soluk dolgu, üstte ince çizgi.
   Koyu zeminde tek çizgi silinip gidiyordu; dolgu her simgeye gövde veriyor.
   `d` = dolgu şekli (kapalı), `c` = çizgi. Sade işaretler (ok, artı, tik)
   tek katman kalır — onlar simge değil, yön gösterir. */

const ICON = {
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

/* ==========================================================================
   GÖRÜNÜMLER
   ========================================================================== */

const VIEWS = {

  /* ---------- Panel ---------- */

  panel: () => {
    if (YUKLENIYOR) return iskeletler(4);
    if (DB.hata)    return hataKutusu(DB.hata);

    const p  = DB.projeler;
    const on = (!DB.yuklendi && DB.panelOnbellek) ? DB.panelOnbellek : null;

    const dev  = on ? on.dev  : DB.gorevleri({ durum: 'gelistiriliyor' }).length;
    const kont = on ? on.kont : DB.gorevleri({ durum: 'kontrolde' }).length;
    const acik = dev + kont;

    /* Karşılama bloğu (halka + selam) kaldırıldı: zemindeki ofis fotoğrafının
       kendi logo duvarı hero'yu taşıyor, üstüne selam yazınca ikisi birbirini
       eziyordu. Üst çubuk zaten kullanıcının adını gösteriyor; halkadaki genel
       yüzde de özet kartına taşındı. */
    /* "Bugünkü durum" kartı kaldırıldı: sayılar hem alt çubuğun rozetlerinde
       hem Görevler ekranında zaten duruyordu, panel de ikinci bir liste
       taşımak zorunda kalıyordu. Panel yalnızca nereye gidileceğini söylüyor. */
    return `
      ${panelSelam()}
      ${kisayolIzgarasi(p.length, acik)}
    `;
  },

  /* ---------- Projeler ---------- */

  projeler: () => {
    if (YUKLENIYOR) return iskeletler(6);
    if (DB.hata)    return hataKutusu(DB.hata);

    if (!DB.projeler.length) {
      return `<div class="card">${empty(ICON.folder, 'Proje listesi boş',
        'Yeni Proje sihirbazı firma, renk, platform, veritabanı ve modülleri sorar; gerisini kendisi kurar.',
        AUTH.yonetici ? 'Yeni Proje' : null, 'sihirbaz')}</div>`;
    }

    /* İki kova. Yüzde elle girilmiyor, görevlerden hesaplanıyor. */
    const say = {};
    Object.keys(PROJE_KOVASI).forEach(k => { say[k] = 0; });
    DB.projeler.forEach(p => {
      const y = DB.sayim(p.id).yuzde;
      Object.keys(PROJE_KOVASI).forEach(k => { if (PROJE_KOVASI[k].sec(y)) say[k]++; });
    });

    /* Sayı sıfırdan sayarak gelmiyor. Kova sayısı bir hareket değil, bir
       gerçek: ekrana her girişte sıfırdan yukarı tırmanması kullanıcıya
       "veri henüz yüklenmedi" dedirtiyordu. Değer önbellekten geliyor,
       ilk karede doğru yazılıyor. */
    return `<div class="kovalar">${Object.keys(PROJE_KOVASI).map(k => {
      const kv = PROJE_KOVASI[k];
      return `
        <a class="kova ${kv.sinif} ${say[k] ? '' : 'bos'}" href="#/projeler/${k}">
          <span class="kv-ust">
            <span class="kv-ikon">${svg(ICON[kv.ikon], 20)}</span>
            <span class="kv-cv">${svg(ICON.chevron, 13)}</span>
          </span>
          <span class="kv-yz">
            <span class="kv-say">${say[k]}</span>
            <span class="kv-ad">${esc(kv.ad)}</span>
          </span>
        </a>`;
    }).join('')}</div>`;
  },

  /* Bir kovanın içi. Proje kartları olduğu gibi duruyor — bu sayfanın
     kendi düzeni sonraki turda ele alınacak. */
  projeKovasi: (k) => {
    if (YUKLENIYOR) return iskeletler(4);
    if (DB.hata)    return hataKutusu(DB.hata);

    const kv    = PROJE_KOVASI[k];
    const liste = DB.projeler.filter(p => kv.sec(DB.sayim(p.id).yuzde));

    if (!liste.length) {
      return `<div class="card">${empty(ICON[kv.ikon], kv.ad + ' yok',
        k === 'bitmis'
          ? 'Bir projenin bütün görevleri bitince buraya düşer.'
          : 'Yeni Proje sihirbazı firma, renk, platform, veritabanı ve modülleri sorar.',
        AUTH.yonetici && k === 'basmis' ? 'Yeni Proje' : null, 'sihirbaz')}</div>`;
    }

    return `<div class="proje-grid">${liste.map(projeKarti).join('')}</div>`;
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

    const liste = DB.sektorler;

    return `
      <div class="note" style="margin-bottom:12px">
        ${svg(ICON.info, 15)}
        <span>Sektör, yeni proje kurarken hangi modüllerin önden işaretleneceğini
        belirler. Sonradan değiştirmen kurulmuş projeleri etkilemez.</span>
      </div>

      ${AUTH.yonetici ? `
        <div class="standart-arac">
          <button class="mini-link" data-eylem="sektor-ekle" type="button">
            ${svg(ICON.arti, 13)} Yeni Sektör</button>
        </div>` : ''}

      ${liste.length
        ? `<div class="card liste">${liste.map(sektorSatiri).join('')}</div>`
        : `<div class="card">${empty(ICON.folder, 'Sektör yok',
            'Sektör eklersen sihirbazda çıkar ve modülleri önden işaretler.',
            AUTH.yonetici ? 'Yeni Sektör' : null, 'sektor-ekle')}</div>`}
    `;
  },

  /* ---------- Modül şablonları ---------- */

  sablonlar: () => {
    if (YUKLENIYOR) return iskeletler(3);
    if (DB.hata)    return hataKutusu(DB.hata);

    const liste = DB.modulSablonlari();

    return `
      <div class="note" style="margin-bottom:12px">
        ${svg(ICON.info, 15)}
        <span>Yeni proje kurarken ve modül eklerken bu liste çıkar.
        Buradaki değişiklik kurulmuş projeleri etkilemez.</span>
      </div>

      ${AUTH.yonetici ? `
        <div class="standart-arac">
          <button class="mini-link" data-eylem="sablon-ekle" type="button">
            ${svg(ICON.arti, 13)} Yeni Şablon</button>
        </div>` : ''}

      ${liste.length
        ? liste.map((m, i) => sablonKarti(m, i)).join('')
        : `<div class="card">${empty(ICON.katman, 'Şablon yok',
            'Sildiklerin geri gelmez. Yeni bir şablon eklersen burada durur.',
            AUTH.yonetici ? 'Yeni Şablon' : null, 'sablon-ekle')}</div>`}
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

    const liste = DB.kisilerHepsi;

    return `
      <div class="note" style="margin-bottom:12px">
        ${svg(ICON.info, 15)}
        <span>Yeni kullanıcı açtığında geçici şifreyi kendin belirlersin.
        Kişi girdikten sonra Ayarlar'dan adını ve fotoğrafını değiştirebilir.</span>
      </div>

      <div class="standart-arac">
        <button class="mini-link" data-eylem="kullanici-ekle" type="button">
          ${svg(ICON.arti, 13)} Yeni Kullanıcı</button>
      </div>

      ${liste.length
        ? `<div class="card liste">${liste.map(kisiSatiri).join('')}</div>`
        : `<div class="card">${empty(ICON.kisi, 'Kimse yok', 'İlk kullanıcıyı ekle.')}</div>`}
    `;
  },

  ayarlar: () => `
    <div class="section" style="margin-top:0">
      <span class="label">Hesap</span>
      <div class="card">
        <div class="row-list">
          <div class="row" data-eylem="foto-degistir" role="button" tabindex="0">
            <div class="row-main">
              <span class="row-title">Fotoğraf</span>
              <span class="row-sub">${AUTH.foto ? 'Değiştirmek için dokun' : 'Yüklemek için dokun · en fazla 4 MB'}</span>
            </div>
            <span class="row-val">${fotoKutu('kucuk')}</span>
          </div>
          <div class="row" data-eylem="ad-degistir" role="button" tabindex="0">
            <div class="row-main">
              <span class="row-title">Ad Soyad</span>
              <span class="row-sub">Karşılamada ve üst çubukta bu ad görünür</span>
            </div>
            <span class="row-val">${esc(AUTH.ad)} ${svg(ICON.kalem, 13)}</span>
          </div>
          ${infoRow('E-posta', AUTH.mail, true)}
          ${infoRow('Rol', AUTH.rolAdi)}
        </div>
      </div>
    </div>

    <div class="section">
      <span class="label">Uygulama</span>
      <div class="card">
        <div class="row-list">
          ${infoRow('Ad', APP.name)}
          ${infoRow('Sürüm', APP.version, true)}
          ${infoRow('Aşama', APP.stage)}
          ${infoRow('Derleme', APP.build, true)}
        </div>
      </div>
    </div>

    ${AUTH.yonetici ? `
      <div class="section">
        <span class="label">Ekip</span>
        <div class="card">
          <div class="row-list">
            <div class="row" data-eylem="ekibe" role="button" tabindex="0">
              <div class="row-main">
                <span class="row-title">Ekip Yönetimi</span>
                <span class="row-sub">${ekipAltBaslik()} · kullanıcı ekle, rol ve erişim ver</span>
              </div>
              <span class="row-val">${svg(ICON.chevron, 15)}</span>
            </div>
          </div>
        </div>
      </div>` : ''}

    ${AUTH.yonetici ? `
      <div class="section">
        <span class="label">Yayın</span>
        <div class="card">
          <div class="row-list">
            <div class="row" data-eylem="kok-alan" role="button" tabindex="0">
              <div class="row-main">
                <span class="row-title">Kök alan adı</span>
                <span class="row-sub">${kokAlan()
                  ? 'Her projeye firma adından alt alan türetilir'
                  : 'Yazılmazsa alan adı adımı Ayarlar\'a yollar'}</span>
              </div>
              <span class="row-val">${kokAlan()
                ? `<b class="mono">${esc(kokAlan())}</b>`
                : '<b class="eksik">yazılmadı</b>'} ${svg(ICON.kalem, 13)}</span>
            </div>
          </div>
        </div>
      </div>` : ''}

    <div class="section">
      <span class="label">Kütüphane</span>
      <div class="card">
        <div class="row-list">
          <div class="row" data-eylem="sektorlere" role="button" tabindex="0">
            <div class="row-main">
              <span class="row-title">Sektörler</span>
              <span class="row-sub">${sektorAltBaslik()} · modül önerisini belirler</span>
            </div>
            <span class="row-val">${svg(ICON.chevron, 15)}</span>
          </div>
          <div class="row" data-eylem="sablonlara" role="button" tabindex="0">
            <div class="row-main">
              <span class="row-title">Modül Şablonları</span>
              <span class="row-sub">${sablonAltBaslik()} · yeni projelerde çıkan hazır modüller</span>
            </div>
            <span class="row-val">${svg(ICON.chevron, 15)}</span>
          </div>
          <div class="row" data-eylem="standartlara" role="button" tabindex="0">
            <div class="row-main">
              <span class="row-title">Nizam Standartları</span>
              <span class="row-sub">${DB.standartlar.length} tarif · prompta kendiliğinden eklenir</span>
            </div>
            <span class="row-val">${svg(ICON.chevron, 15)}</span>
          </div>
        </div>
      </div>
    </div>

    <div class="section">
      <span class="label">Bağlantılar</span>
      <div class="card">
        <div class="row-list">
          ${connRow('Supabase', AUTH.bagli ? 'Bağlı' : 'Demo modu', AUTH.bagli)}
          ${connRow('GitHub', 'Bağlı değil', false)}
        </div>
      </div>
    </div>

    <div class="section">
      <span class="label">Yol Haritası</span>
      <div class="card">
        <div class="row-list">
          ${stepRow('Adım 0', 'İskelet, tema, açılış, menü', true)}
          ${stepRow('Adım 1', 'Supabase kurulumu ve giriş', true)}
          ${stepRow('Adım 2', 'Projeler, modül ve sayfa ağacı', true)}
          ${stepRow('Adım 3', 'Görevler, durumlar, atama', true)}
          ${stepRow('Adım 4', 'Prompt motoru ve kimlik dosyası', true)}
          ${stepRow('Adım 5', 'GitHub okuma ve sürüm notları', false)}
        </div>
      </div>
    </div>

    <div class="section">
      <span class="label">Bakım</span>
      <div class="card">
        <div class="row-list">
          <div class="row">
            <div class="row-main">
              <span class="row-title">Güncellemeleri denetle</span>
              <span class="row-sub">Yeni sürüm varsa kendini yeniler</span>
            </div>
            <button class="btn btn-ghost" data-eylem="guncelle" type="button">Denetle</button>
          </div>
          <div class="row">
            <div class="row-main">
              <span class="row-title">Yedek al</span>
              <span class="row-sub">Tüm projeler, görevler ve standartlar tek dosyada</span>
            </div>
            <button class="btn btn-ghost" data-eylem="yedek-al" type="button">İndir</button>
          </div>
          <div class="row">
            <div class="row-main">
              <span class="row-title">Yedeği incele</span>
              <span class="row-sub">Dosyanın içinde ne var, geri yüklemeden gösterir</span>
            </div>
            <button class="btn btn-ghost" data-eylem="yedek-oku" type="button">Dosya seç</button>
          </div>
        </div>
      </div>
    </div>

    <div class="section">
      <button class="btn btn-ghost" id="btn-logout" type="button">Çıkış Yap</button>
    </div>
  `,
};

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

/* Proje içindeki yedi durak. Adres, ad ve içeriği tek yerde tanımlı.
   Sıra önemli: projeDuraklari() dizisi bununla indeks indeks eşleşiyor. */
const DURAKLAR = {
  /* Aşamalar konuşulan yere göre bölündü: 1'i müşteriyle konuşarak
     dolduruyorsun (marka, iletişim, sektör, logo), 2'yi klavye başında
     (ürün, roller, depo, modüller). İkisi karışıkken hangi kafayla
     oturulacağı belli olmuyordu. */
  firma:      { no: 1, ad: 'Marka kimliği',      ciz: firmaSayfasi,
                renk: '#c4a05c', ikon: 'etiket' },
  /* Yapı tasarımdan önce: ChatGPT ekranları çizerken hangi modüllerin ve
     sayfaların olduğunu bilmeli. Bilmezse altı genel ekran çiziyor; künye
     elindeyken gerçek modülleri, gerçek alanları ve o işe ait simgeleri
     çiziyor. Bağımlılık bu yönde. */
  yapi:       { no: 2, ad: 'Kurulum ve yapı',    ciz: yapiSayfasi,
                renk: '#8fae4a', ikon: 'gAltyapi' },
  tasarim:    { no: 3, ad: 'Tasarımı belirleme', ciz: tasarimSayfasi,
                renk: '#5f86c4', ikon: 'gTasarim' },
  beta:       { no: 4, ad: 'Beta',               ciz: betaSayfasi },
  gelistirme: { no: 5, ad: 'Geliştirme',         ciz: gelistirmeSayfasi },
  final:      { no: 6, ad: 'Final',              ciz: finalSayfasi },
  guncelleme: { no: 7, ad: 'Güncellemeler',      ciz: guncellemeSayfasi },
};

function durakSayfasi(projeId, anahtar) {
  if (YUKLENIYOR) return iskeletler(4);
  if (DB.hata)    return hataKutusu(DB.hata);

  const p = DB.proje(projeId);
  if (!p) {
    return `<div class="card">${empty(ICON.uyari, 'Proje bulunamadı',
      'Silinmiş veya arşive alınmış olabilir.', 'Projelere dön', 'projelere')}</div>`;
  }
  return DURAKLAR[anahtar].ciz(p, DURAKLAR[anahtar]);
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
  const duraklar = projeDuraklari(p);
  const su   = d.no - 1;
  const renk = d.renk || 'var(--metal-2)';
  const ikon = ICON[d.ikon] || ICON.bayrak;

  /* Yapı proje künyesiyle birebir aynı: 54 piksellik karo, iki satır yazı,
     sağda değer ve etiketi. İki sayfanın tek farkı içerik olsun, ölçü değil.
     İlerleme noktaları firma adının yanına alındı — üçüncü satır kartı
     künyeden uzun yapıyordu. */
  return `
    <div class="bs2" style="--kr:${renk}">
      <span class="bs2-ik">${svg(ikon, 26)}</span>
      <span class="bs2-yz">
        <span class="bs2-firma">
          <span class="bs2-ad2">${esc(projeAdi(p))}</span>
          <span class="bs2-nk">
            ${duraklar.map((x, i) => `<i class="${
              i === su ? 'su' : x.bitti ? 'bitti' : ''}"></i>`).join('')}
          </span>
        </span>
        <span class="bs2-ad">${esc(d.ad)}</span>
      </span>
      <span class="bs2-sag">
        <b class="mono">${esc(sayac || String(d.no).padStart(2, '0'))}</b>
        <i>${sayac ? 'adım' : 'aşama'}</i>
      </span>
    </div>`;
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
/* Kurulumun iki adımı, standartlar sayfasının kart dilinde: yan yana iki kart,
   aralarında bağlantı çizgisi, sıra ilerledikçe kırmızı karo yeşile dönüyor.
   GitHub düğmesi doğrudan GitHub'ı açıyor; Claude düğmesi promptu yalnızca
   panoya alıyor — Claude'u kullanıcı kendi açıyor (standartlardaki gibi). */
/* Kurulumun dört adımı tek satırda. Eskiden iki ayrı şeritti (kurulum ve
   yayın); ikisi de aynı zincirin halkası olduğu için tek şeride indi.
   Kartlar buna göre küçüldü: 28 piksellik karo, tek kelimelik başlık,
   alt yazı yok — dördü 412 piksellik ekranda 82'şer piksele sığıyor. */
function kurulumAraclari(p) {
  const pl    = p.palet || {};
  const slug  = depoSlug(p.repo);
  const depo  = !!p.repo;
  const kopya = !!pl.sohbetAcildi;
  const isim  = String(pl.sohbetAdi || '').trim();
  const alan  = String(pl.alanAdi || '').trim();
  const yayin = !!pl.yayinda;

  const kart = (no, hal, ikon, ad, eylem, adres, ek) => {
    const ic = `
      <span class="mk2-ust">
        <span class="mk2-ik">${svg(hal === 'bitti' ? ICON.tik : ikon, 14)}</span>
        <span class="mk2-no mono">${no}</span>
      </span>
      <span class="mk2-ad">${esc(ad)}</span>`;
    if (adres) {
      return `<a class="mk2 ${hal}" target="_blank" rel="noopener" ${ek || ''}
        href="${adres}">${ic}</a>`;
    }
    return `<button class="mk2 ${hal}" type="button"
      data-eylem="${eylem}" data-proje="${p.id}"
      ${hal === 'bekliyor' ? 'disabled' : ''}>${ic}</button>`;
  };

  const bag = `<span class="s4-bag"><i></i><em>${svg(ICON.chevron, 11)}</em></span>`;

  const depoAdresi = depo
    ? 'https://github.com/' + esc(slug)
    : 'https://github.com/new?name=' + encodeURIComponent(depoAdi(p))
      + '&description=' + encodeURIComponent(projeAdi(p) + ' · NIZAM Studio')
      + '&visibility=private';

  return `
    <div class="s4 ${yayin ? 'bitti' : ''}">
      ${kart('1', depo ? 'bitti' : 'sirada', ICON.dal, 'Depo', '',
             depoAdresi, depo ? '' : `data-depo-ac="${p.id}"`)}
      ${bag}
      ${kart('2', !depo ? 'bekliyor' : isim ? 'bitti' : 'sirada',
             ICON.dosya, isim ? 'Sohbet' : kopya ? 'Sohbet adı' : 'Sohbet',
             'tanisma-prompt')}
      ${bag}
      ${kart('3', !isim ? 'bekliyor' : alan ? 'bitti' : 'sirada',
             ICON.dil, 'Adres', 'alan-kaydi')}
      ${bag}
      ${alan && !yayin
        ? `<a class="mk2 sirada" target="_blank" rel="noopener"
             data-pages-ac="${p.id}" data-alan-kopya="${esc(alan)}"
             href="https://github.com/${esc(slug)}/settings/pages">
            <span class="mk2-ust">
              <span class="mk2-ik">${svg(ICON.bulut, 14)}</span>
              <span class="mk2-no mono">4</span></span>
            <span class="mk2-ad">Yayın</span></a>`
        : yayin
        ? `<a class="mk2 bitti" target="_blank" rel="noopener" href="https://${esc(alan)}">
            <span class="mk2-ust">
              <span class="mk2-ik">${svg(ICON.tik, 14)}</span>
              <span class="mk2-no mono">4</span></span>
            <span class="mk2-ad">Yayında</span></a>`
        : `<span class="mk2 bekliyor">
            <span class="mk2-ust">
              <span class="mk2-ik">${svg(ICON.bulut, 14)}</span>
              <span class="mk2-no mono">4</span></span>
            <span class="mk2-ad">Yayın</span></span>`}
    </div>`;
}

/* 1 · Marka kimliği — müşteriyle konuşurken öğrendiklerin. Teknik karar yok:
   firma kim, kime ulaşacağız, hangi işi yapıyor, markası neye benziyor. */
function firmaSayfasi(p, d) {
  const alt   = [p.telefon, p.eposta].filter(Boolean).length;
  const logo  = DB.logoAdres[p.id];
  const gorsel = gorselAdresi(p, 'G0');
  const dolu  = [p.firma, p.telefon, p.eposta, p.sektor].filter(Boolean).length;

  const marka = dolu <= 1
    ? fbBosKart('var(--fb-kisi)', ICON.etiket, 'Marka kimliği ve bilgileri', dolu + '/4',
        'Firma kim, soru çıkarsa kime ulaşacağız, hangi işi yapıyor? '
        + '<b>Promptun ilk satırları</b> ve kimlik dosyası bunlardan çıkıyor.',
        'marka-duzenle', p.id, true)
    : fbKart('var(--fb-kisi)', ICON.etiket, 'Marka kimliği ve bilgileri',
      'marka-duzenle', p.id, `
    <div class="fb-kisi">
      <span class="fb-av" style="${renkDegiskenleri(p.renk)}">${esc(basHarf(p.firma))}</span>
      <span class="fb-kyz">
        <b>${esc(p.firma)}</b>
        <i>${p.sektor ? esc(p.sektor) : 'Sektör girilmedi'}</i>
      </span>
    </div>
    <div class="fb-kg tek" style="margin-top:10px">
      ${kunyeSatiri('#5fb37f', ICON.telefon, 'Telefon',  p.telefon)}
      ${kunyeSatiri('#4fa8c9', ICON.mail,    'E-posta',  p.eposta)}
      ${kunyeSatiri('#8fae4a', ICON.dukkan,  'Sektör',   p.sektor)}
    </div>
    ${alt ? `<div class="fb-cip" style="margin-top:10px">
      ${p.telefon ? fbCip('#5fb37f', ICON.telefon, 'Ara', '', '',
        'tel:' + p.telefon.replace(/\s/g, '')) : ''}
      ${p.eposta ? fbCip('#4fa8c9', ICON.mail, 'E-posta', '', '', 'mailto:' + p.eposta) : ''}
      ${fbCip('#b8b2ad', ICON.kopya, 'Kopyala', 'yetkili-kopyala', p.id)}
    </div>` : ''}

    ${/* Logo, renk ve işletme görseli markanın görünen yüzü — aynı ayracın
          altında duruyorlar. Tasarım görselleri (G1, G2…) 3. aşamada kalıyor:
          onlar ChatGPT'ye tarif için gidiyor, markanın parçası değil. */ ''}
    <div class="fb-ayrac">
      <span class="fb-et">Marka</span>
      <div class="fb-marka">
        <button class="fb-logo ${logo ? 'dolu' : ''}" type="button"
                data-eylem="logo-yukle" data-proje="${p.id}"
                ${logo ? `style="background-image:url('${esc(logo)}')"` : ''}>
          ${logo ? '' : svg(ICON.etiket, 17)}
        </button>
        <span class="fb-myz">
          <i>Logo</i>
          <b class="${logo ? '' : 'eksik'}">${logo ? 'Yüklendi' : 'dokun, yükle'}</b>
        </span>
        ${fbCip('#9b7fd4', ICON.boya, esc(renkAdi(p.renk)), 'marka-renk', p.id)}
      </div>
      <button class="fb-gorsel ${gorsel ? 'dolu' : ''}" type="button"
              data-eylem="proje-gorsel" data-id="${p.id}">
        ${gorsel ? `<img src="${esc(gorsel)}" alt="" decoding="async">` : ''}
        <span class="fb-gyz">${svg(gorsel ? ICON.tik : ICON.arti, 13)}
          ${gorsel ? 'İşletme görseli' : 'İşletme görseli ekle'}</span>
      </button>
    </div>`, dolu + '/4');

  return `<div class="fb-govde">`
    + adimBasligi(p, d, dolu + '/4') + marka
    + `</div>`;
}

/* ---------- Rol merdiveni ----------
   En altta en dar yetki, en üstte en geniş. Sayıyı değiştirince adlar
   korunur; azaltınca üsttekiler düşer, artırınca örnek adla gelir. */
function rolMerdiveni(roller, onek) {
  const liste = rolListesi(roller);
  const n = liste.length || 2;
  return `
    <div class="rol-kat" data-rol-onek="${onek}">
      <div class="fbd-cipler rol-sayi">
        ${[2, 3, 4, 5].map(k => `
          <button class="fbd-cp ${k === n ? 'on' : ''}" type="button"
                  data-rol-sayi="${k}">${k} katman</button>`).join('')}
      </div>
      <div class="rol-liste">
        ${Array.from({ length: n }, (_, i) => {
          const sira = n - 1 - i;                      /* üstten alta çiz */
          const ust  = sira === n - 1;
          const dar  = sira === 0;
          const ad = liste[sira] || (ROL_ORNEK[n] || [])[sira] || '';
          /* Simgeler sayfadaki rol rozetleriyle aynı: en geniş kalkan,
             en dar kilit, aradakiler kişi. */
          return `
            <label class="rol-satir ${ust ? 'ust' : ''}"
                   style="--ki:${ust ? '#d8a63f' : dar ? '#7d93b8' : '#3fa694'}">
              <span class="fbd-si">${svg(ust ? ICON.gGuvenlik : dar ? ICON.kilit : ICON.kisi, 13)}</span>
              <span class="rol-no mono">${sira + 1}</span>
              <input type="text" data-rol="${sira}" value="${esc(ad)}"
                     placeholder="${esc((ROL_ORNEK[n] || [])[sira] || 'Rol adı')}"
                     maxlength="40" autocomplete="off">
              ${ust ? '<em>en geniş</em>' : dar ? '<em>en dar</em>' : ''}
              <span class="fbd-cizgi"></span>
            </label>`;
        }).join('')}
      </div>
      ${fdNot('Üstteki katman, alttakinin gördüğü her şeyi görür.')}
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
    const simdi = rolOku(kutu);
    const ornek = ROL_ORNEK[n] || [];
    /* Elle yazılmadıysa doğrudan yeni örneğe geç; yazıldıysa adları koru ve
       eksik satırları kullanılmamış örnek adlarıyla doldur. */
    const eskiOrnek = ROL_ORNEK[simdi.length] || [];
    const dokunulmus = simdi.some((x, i) => x !== eskiOrnek[i]);
    const yeni = [];
    for (let i = 0; i < n; i++) {
      let ad = dokunulmus ? (simdi[i] || '') : (ornek[i] || '');
      if (!ad || yeni.includes(ad)) ad = ornek.find(x => !yeni.includes(x) && !simdi.includes(x)) || '';
      yeni.push(ad);
    }
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

/* 3 · Tasarımı belirleme */
/* Adım durumu proje başına hatırlanır: geri gelince kaldığın yerde açılır. */
const TASARIM_YER = {};

function adimNo(p) {
  const n = TASARIM_YER[p.id] || 0;
  return Math.max(0, Math.min(n, tasarimAdimlari(p).length - 1));
}

/* Ekranın hangi kipte olduğu: ada haritası mı, tek karar mı.
   Tasarım durağına her girişte harita açılır. */
const TASARIM_MOD = {};

/* Adımları öbek öbek grupla. Üç yerde aynı döngü yazılıydı; tek yerden.
   `kararli` verilirse palet/özet gibi kararsız adımlar dışarıda kalır. */
function obekleriKur(p, kararli) {
  const obekler = [];
  tasarimAdimlari(p).forEach((adim, i) => {
    if (kararli && !adim.alan) return;
    const son = obekler[obekler.length - 1];
    if (son && son.ad === adim.obek) son.satir.push(i);
    else obekler.push({ ad: adim.obek, not: adim.obekNot || '', satir: [i] });
  });
  return obekler;
}

/* Onaylanan adımlar önce bellekte birikir, adadan çıkarken tek yazımda
   palete gider — 52 adım için 52 ayrı yazma anlamsız. */
const ONAY_TASLAK = {};

function adimOnayla(p, i) {
  const adim = tasarimAdimlari(p)[i];
  if (!adim || !adim.alan) return;
  const pl = p.palet || {};
  const var1 = Array.isArray(pl.bitenAdim) ? pl.bitenAdim : [];
  const bek = ONAY_TASLAK[p.id] || (ONAY_TASLAK[p.id] = []);
  if (var1.indexOf(adim.anahtar) < 0 && bek.indexOf(adim.anahtar) < 0) {
    bek.push(adim.anahtar);
  }
}

async function onaylariYaz(p) {
  const bek = ONAY_TASLAK[p.id];
  delete ONAY_TASLAK[p.id];
  if (!bek || !bek.length) return;
  const pl = p.palet || {};
  const var1 = Array.isArray(pl.bitenAdim) ? pl.bitenAdim : [];
  try {
    await DB.paletKaydet(p.id, Object.assign({}, pl, { bitenAdim: var1.concat(bek) }));
  } catch (h) { /* kritik değil: seçimler zaten palete yazılıyor */ }
}

/* Bu adıma cevap verilmiş mi? `bicimSecim` cevap yokken varsayılana düştüğü,
   `bicimAyni` de bilerek seçilen varsayılanı "aynı" saydığı için ikisi de
   bu soruya cevap vermiyor. Ölçüt: palete yazılmış ya da İleri'yle onaylanmış. */
function adimBitti(p, i) {
  const adim = tasarimAdimlari(p)[i];
  if (!adim) return false;
  const pl = p.palet || {};
  /* İhtiyaç adası: çözümleme geldi mi? Kararların cevaplanması bu adanın
     işi değil — o kararlar kendi adalarında soruluyor. */
  if (adim.tur === 'ihtiyac') return !!pl.cozum;
  /* Görsel dünya adası: tarif geldi ve tarifin istediği bütün görseller
     yuvalara kondu mu? Yarım bırakılmışsa ada bitmiş sayılmıyor. */
  if (adim.tur === 'gorsel') {
    const y = pl.gorseller || [];
    return !!String(pl.tarif || '').trim() && y.length > 0 && y.every(x => x.yol);
  }
  const onaylanan = (Array.isArray(pl.bitenAdim) ? pl.bitenAdim : [])
    .concat(ONAY_TASLAK[p.id] || []);
  if (onaylanan.indexOf(adim.anahtar) > -1) return true;
  return adim.alan ? pl[adim.anahtar] !== undefined : false;
}

/* Bir adanın durumu ve sayacı. */
function adaDurumu(p, o) {
  const biten = o.satir.filter(i => adimBitti(p, i)).length;
  return { biten, toplam: o.satir.length, tam: biten >= o.satir.length };
}

/* Tasarım haritası — kurulum sayfasıyla birebir aynı ızgara.
   Her öbek bir kare: biten yeşil, sıradaki kırmızı, kalanlar sakin.
   Sıra zorunlu değil; kurulumun aksine ileri adaya da dokunulabilir,
   o yüzden kart hiç kilitlenmiyor. */
function tasarimAdasi(p, o, x, no, sirada) {
  const hal  = x.tam ? 'bitti' : sirada ? 'simdi' : 'eksik';
  const ikon = x.tam ? ICON.tik : sirada ? ICON.goz : ICON.kalem;
  /* Tek adımlık adada "0/1" gürültü: orada yalnız durum yazılıyor. */
  const tek  = o.satir.length === 1;
  const alt  = x.tam    ? (tek ? 'hazır' : x.toplam + ' karar verildi')
             : sirada   ? (tek ? 'sıradaki' : x.biten + '/' + x.toplam + ' · sıradaki')
             : tek      ? 'bekliyor'
             : x.biten + '/' + x.toplam;
  return `
    <button class="ya ${hal}" type="button" data-eylem="tasarim-ada"
            data-proje="${p.id}" data-deger="${o.satir[0]}">
      <span class="ya-ust">
        <span class="ya-no mono">${no}</span>
        <span class="ya-dur">${svg(ikon, 13)}</span>
      </span>
      <span class="ya-yz">
        <span class="ya-ad">${esc(o.ad)}</span>
        <span class="ya-alt">${esc(alt)}</span>
      </span>
    </button>`;
}

function tasarimHaritasi(p, d) {
  /* Özet bir ada değil, bitişte bir bakış. Izgarada 5. kare gibi durunca
     "daha bir ada var" hissi veriyordu; aşağıya satır olarak indi. */
  const obekler = obekleriKur(p).filter(o => o.ad !== 'Bitiş');
  const ozetNo  = tasarimAdimlari(p).findIndex(a => a.tur === 'ozet');
  const durumlar = obekler.map(o => adaDurumu(p, o));
  const simdi = durumlar.findIndex(x => !x.tam);
  const biten = durumlar.filter(x => x.tam).length;
  const karar = tasarimAdimlari(p).filter(a => a.alan).length;

  const kart = i => tasarimAdasi(p, obekler[i], durumlar[i],
                                 String(i + 1).padStart(2, '0'), i === simdi);

  /* Üç sütun, dört ada: üstte üç, dirsek, altta bir — kurulum sayfasının
     aynısı. Öbek sayısı değişirse ızgara kendi kendine sarıyor. */
  const ust  = obekler.map((o, i) => i).slice(0, 3);
  const kalan = obekler.map((o, i) => i).slice(3);

  return `<div class="fb-govde">`
    + adimBasligi(p, d, biten + '/' + obekler.length)
    + `<div class="ya-harita">
        <div class="ya-satir">${ust.map(kart).join('')}</div>
        ${kalan.length ? yolOku(durumlar[2] && durumlar[2].tam) : ''}
        ${kalan.length ? `<div class="ya-satir">${kalan.map(kart).join('')}</div>` : ''}
      </div>`
    + sayfaObekBasligi('Bitiş', karar)
    + agacSatir('var(--metal-2)', ICON.katman, 'Bütün kararları gör',
        'Prompta yazılacak kararlar tek listede', false, 'tasarim-ada',
        `data-proje="${p.id}" data-deger="${ozetNo}"`)
    + `</div>`;
}

/* Bir ekranda tek karar: üstte ada kartı, ortada önizleme, altta seçim.
   Sayfa kaydırılmaz — parçalar ekrana sığacak şekilde bölüşür. */
function tasarimSayfasi(p, d) {
  if (TASARIM_MOD[p.id] !== 'adim') return tasarimHaritasi(p, d);
  const no    = adimNo(p);
  const adim  = tasarimAdimlari(p)[no];
  const pl    = p.palet || null;
  const adres = DB.logoAdres[p.id];
  const yon   = AUTH.yonetici;

  /* İhtiyaç adası kendi ekranlarını taşıyor: kareler, kararlar listesi,
     sayfa ızgarası ve bir sayfanın notu. Dördü de aynı kabukta. */
  if (adim.tur === 'ihtiyac') return ihtiyacEkrani(p);

  let govde, gez;

  if (adim.tur === 'gorsel') {
    govde = gorselDunyaGovdesi(p);

  } else if (adim.tur === 'ozet') {
    govde = `<div class="ozet-kaydir">${tarifSeridi(p)}${tasarimOzeti(p)}</div>`;

  } else {
    govde = adimRafi(p, adim.alan);
  }

  gez = adimGezinme(p, no, adim);

  /* Görsel dünya tek adımlık bir ada: kalan 14 kararı sayan şerit ve
     ikinci kez yazılan başlık burada yalnız kafa karıştırıyordu. Kendi
     dört adımını sayan bir şerit ve tek başlık kalıyor. */
  const gorselAda = adim.tur === 'gorsel';

  return `<div class="akis ${adim.tur === 'ozet' ? 'ozet' : ''}${
      gorselAda ? ' gorsel' : ''}">
    ${gorselAda ? gorselAdaBasligi(p) : adimSeridi(p, no, adim)}
    ${['ozet', 'gorsel'].includes(adim.tur) ? '' : onizlemeSatiri(p, adim)}
    <div class="akis-alt">
      ${gorselAda ? '' : `
      <div class="adim-bas">
        <div class="ab-yazi"><b>${esc(adim.ad)}</b><i>${esc(adim.aciklama)}</i></div>
        ${yeniKararlar(p.palet).some(a => a.anahtar === adim.anahtar)
          /* Başlığın içine koyunca satır kırılıp alt satırı aşağı itiyordu:
             kendi sütununda duruyor. */
          ? `<button class="ab-yeni" type="button" data-eylem="karar-goruldu"
                     data-proje="${p.id}" data-alan="${adim.anahtar}"
                     title="Sonradan eklendi. Rozeti kaldırmak için dokun.">YENİ</button>`
          : `<span class="ab-tur">${adim.alan
              ? (adim.alan.coklu ? 'birkaçı' : 'tek seçim') : ''}</span>`}
      </div>`}
      ${govde}
      ${gez}
    </div>
  </div>`;
}

/* ==========================================================================
   İHTİYAÇ ÇÖZÜMLEMESİ
   Her projede aynı on dört kararı sormak yanlıştı. Claude künyeye bakıp
   hangi kararın bu projede gerektiğini söylüyor, eksik gördüğü başlığı
   kendi açıyor ve sayfa sayfa yerleşim notu veriyor. Studio karar
   vermiyor — soruyu daraltıyor.
   ========================================================================== */

/* Adanın içinde hangi ekrandayız: null (kareler) · 'kararlar' · 'sayfalar'
   · bir sayfanın adı. Ada değişince sıfırlanıyor. */
const IHTIYAC_EKRAN = {};

function ihtiyacDurumu(p) {
  const pl  = p.palet || {};
  const c   = pl.cozum || null;
  const kar = (c && c.kararlar) || {};
  const elenen = Object.keys(kar).filter(k => kar[k].gerek === false).length;
  const yeni   = c ? cozumYeniAlanlar(p).length : 0;
  const sayfa  = c ? Object.keys(c.sayfalar || {}).length : 0;
  const kalan  = tasarimAdimlari(p).filter(a => a.alan).length;

  const adimlar = [
    { ad: 'Promptu ver', eylem: 'ihtiyac-prompt',
      bitti: !!c, ozet: c ? 'verildi' : pl.cozumIstendi ? 'panoya alındı' : 'Claude Code' },
    { ad: 'Çözümlemeyi yapıştır', eylem: 'ihtiyac-yapistir',
      bitti: !!c, ozet: c ? 'okundu' : 'bekliyor',
      /* Prompt verilmeden yapıştırılacak bir şey yok. */
      kilit: !c && !pl.cozumIstendi },
    { ad: 'Kararlar', eylem: 'ihtiyac-kararlar', bitti: !!c, kilit: !c,
      ozet: c ? (yeni ? kalan + ' · ' + yeni + ' yeni' : kalan + ' karar') : 'bekliyor' },
    { ad: 'Sayfa tasarımları', eylem: 'ihtiyac-sayfalar', bitti: !!c && sayfa > 0,
      kilit: !c, ozet: c ? (sayfa ? sayfa + ' sayfa' : 'not verilmedi') : 'bekliyor' },
  ];
  const simdi = adimlar.findIndex(a => !a.bitti);
  return { adimlar, simdi, tam: simdi < 0, cozum: c, elenen, yeni, sayfa, kalan };
}

/* Ada başlığı — görsel dünyayla aynı kart, kendi sayacıyla. */
function ihtiyacBasligi(p, biten, toplam, simdi) {
  const d = DURAKLAR.tasarim;
  return `
    <div class="adim-serit" style="--kr:${d.renk}">
      <div class="bs2 ince">
        <button class="bs2-ik" type="button" title="Haritaya dön"
                data-eylem="tasarim-adim" data-proje="${p.id}" data-deger="-2">
          ${svg(ICON.arama, 19)}</button>
        <span class="bs2-yz">
          <span class="bs2-firma"><span class="bs2-ad2">${esc(d.ad)}</span></span>
          <span class="bs2-ad">İhtiyaç çözümlemesi</span>
        </span>
        <span class="bs2-sag"><b class="mono">${biten}/${toplam}</b><i>adım</i></span>
      </div>
      <div class="as-alt">
        <span class="as-yol">
          <button class="yi" type="button" data-eylem="tasarim-adim"
                  data-proje="${p.id}" data-deger="-2">Harita</button>
          <s>›</s>
          <button class="yi son" type="button" disabled>İhtiyaç</button>
        </span>
      </div>
      <div class="as-noktalar">${Array.from({ length: toplam }, (x, i) => `
        <span class="${i < biten ? 'gecti' : i === simdi ? 'on' : ''}"><i></i></span>`).join('')}
      </div>
    </div>`;
}

/* Adanın gövdesi — dört kare kart, kilitli zincir. Kurulum sayfasındaki
   davranışın aynısı: sırası gelmeyen kesik çerçeveli ve basılamaz. */
function ihtiyacGovdesi(p) {
  const g = ihtiyacDurumu(p);
  const kart = i => {
    const a = g.adimlar[i];
    const hal = a.bitti ? 'bitti' : a.kilit ? 'kilitli' : i === g.simdi ? 'simdi' : 'eksik';
    const ikon = a.bitti ? ICON.tik : a.kilit ? ICON.kilit
               : i === g.simdi ? ICON.goz : ICON.kalem;
    return `
      <button class="ya ${hal}" type="button" ${a.kilit ? 'disabled' : ''}
              data-eylem="${a.eylem}" data-proje="${p.id}">
        <span class="ya-ust">
          <span class="ya-no mono">${String(i + 1).padStart(2, '0')}</span>
          <span class="ya-dur">${svg(ikon, 13)}</span>
        </span>
        <span class="ya-yz">
          <span class="ya-ad">${esc(a.ad)}</span>
          <span class="ya-alt">${esc(a.ozet)}</span>
        </span>
      </button>`;
  };

  return `<div class="gd-kaydir">
    <div class="ya-harita">
      <div class="ya-satir">${[0, 1, 2].map(kart).join('')}</div>
      ${yolOku(g.adimlar[2].bitti)}
      <div class="ya-satir">${[3].map(kart).join('')}</div>
    </div>
    ${g.cozum ? ihtiyacOzetKarti(p, g) : ihtiyacBosKutu()}
  </div>`;
}

function ihtiyacBosKutu() {
  return `<div class="bos-kutu">${svg(ICON.arama, 18)}
    <span>Çözümleme yok. Bütün kararlar soruluyor, öneri gelmiyor.
      <b>Promptu ver</b> ile başla.</span></div>`;
}

/* Ne çıktığının bir bakışta özeti. Kararların tamamı 03'te, sayfa notları
   04'te; burada yalnız sayılar var. */
function ihtiyacOzetKarti(p, g) {
  const tarih = g.cozum.zaman ? String(g.cozum.zaman).slice(0, 10) : '';
  return `<div class="tarif-kart">
    <div class="tk-bas"><b>Çözümleme</b><span class="tk-rz">Claude</span></div>
    <div class="tk-satir"><b>Geçerli karar</b><span>${g.kalan}</span></div>
    <div class="tk-satir"><b>Elenen</b><span>${g.elenen}</span></div>
    <div class="tk-satir"><b>Claude'un açtığı</b><span>${g.yeni}</span></div>
    <div class="tk-satir"><b>Sayfa notu</b><span>${g.sayfa}</span></div>
    ${tarih ? `<div class="tk-satir"><b>Alındı</b><span>${esc(tarih)}</span></div>` : ''}
    <button class="promptu-gor" type="button" data-eylem="ihtiyac-yapistir"
            data-proje="${p.id}">Çözümlemeyi yenile</button>
  </div>`;
}

/* ---------- 03 · Kararlar ekranı ---------- */
function ihtiyacKararEkrani(p) {
  const c = (p.palet || {}).cozum || {};
  const kar = c.kararlar || {};
  const yeniAlan = cozumYeniAlanlar(p);
  const adimlar = tasarimAdimlari(p);

  const satir = (ad, deger, sinif, neden) => `
    <div class="coz-sat"><span>${esc(ad)}</span><u class="${sinif}">${esc(deger)}</u></div>
    ${neden ? `<p class="coz-not">${esc(neden)}</p>` : ''}`;

  const gecerli = adimlar.filter(a => a.alan).map(a => {
    const k = kar[a.anahtar];
    const y = yeniAlan.find(x => x.anahtar === a.anahtar);
    const on = cozumOnerisi(p, a.anahtar);
    return satir(a.ad, y ? 'yeni başlık' : (on ? on.oneri : '—'),
      y ? 'yeni' : on ? '' : 'yok', (k && k.neden) || (on && on.neden) || '');
  }).join('');

  const elenen = Object.keys(kar).filter(x => kar[x].gerek === false).map(x => {
    const al = TUM_TASARIM.find(a => a.anahtar === x);
    return al ? satir(al.ad, 'gerekmiyor', 'yok', kar[x].neden) : '';
  }).join('');

  return `<div class="gd-kaydir">
    <div class="coz">
      <div class="coz-bas"><b>Bu projede geçerli</b><span class="coz-rz">Claude</span></div>
      ${gecerli || '<p class="coz-not">Karar kalmadı.</p>'}
    </div>
    ${elenen ? `<div class="coz">
      <div class="coz-bas"><b>Elenenler</b></div>
      ${elenen}
    </div>` : ''}
  </div>`;
}

/* ---------- 04 · Sayfa tasarımları ---------- */
function ihtiyacSayfaListesi(p) {
  const c = (p.palet || {}).cozum || {};
  const notlar = c.sayfalar || {};
  const kunye = (p.palet || {}).kunye || {};

  /* Künyedeki öbekler burada da geçerli: iki ekran aynı sırada okunsun. */
  const sira = [], obek = {};
  Object.keys(kunye).forEach(tam => {
    const sf = tam.split(' · ').pop();
    const g = ((kunye[tam] || {}).grup || '').trim() || 'Diğer';
    if (!obek[g]) { obek[g] = []; sira.push(g); }
    obek[g].push(sf);
  });
  /* Künye yoksa yalnız Claude'un yazdığı sayfalar listelensin. */
  if (!sira.length) { sira.push('Sayfalar'); obek['Sayfalar'] = Object.keys(notlar); }
  sira.sort((a, b) => (a === 'Diğer') - (b === 'Diğer'));

  let no = 0;
  const govde = sira.map(g => {
    const kareler = obek[g].slice().sort((a, b) => a.localeCompare(b, 'tr')).map(sf => {
      const n = notlar[sf];
      no += 1;
      const say = n ? (n.bilesenler || []).length : 0;
      const gor = n ? (n.gorseller || []).length : 0;
      const alt = !n ? 'not yok'
        : [say ? say + ' bileşen' : '', gor ? gor + ' görsel' : ''].filter(Boolean).join(' · ')
          || 'not var';
      /* Notu olmayan sayfa açılmıyor: gösterilecek bir şey yok. */
      return agacKare(String(no).padStart(2, '0'), n ? 'bitti' : 'eksik', sf, alt,
        'ihtiyac-sayfa',
        `data-proje="${p.id}" data-ad="${esc(sf)}"${n ? '' : ' disabled'}`);
    }).join('');
    return sayfaObekBasligi(g, obek[g].length) + `<div class="ya-satir">${kareler}</div>`;
  }).join('');

  return `<div class="gd-kaydir">${govde}</div>`;
}

/* Bir sayfanın tasarım notu. */
function ihtiyacSayfaNotu(p, sf) {
  const n = (((p.palet || {}).cozum || {}).sayfalar || {})[sf];
  if (!n) return `<div class="gd-kaydir">${ihtiyacBosKutu()}</div>`;

  return `<div class="gd-kaydir">
    <div class="tn">
      <div class="tn-bas"><b>Yerleşim</b><span class="tn-rz">Claude</span></div>
      <p>${esc(n.yerlesim || 'Yerleşim notu verilmedi.')}</p>
      ${(n.bilesenler || []).length ? `
        <span class="tn-et">Bileşenler</span>
        <div class="tn-cip">${n.bilesenler.map(x => `<span>${esc(x)}</span>`).join('')}</div>` : ''}
      ${(n.gorseller || []).length ? `
        <span class="tn-et">Gereken görsel</span>
        ${n.gorseller.map(gg => `
          <div class="tn-g">${svg(ICON.resim, 13)}
            <span><b>${esc(gg.yer)}</b><i>${esc(gg.ne)}</i></span></div>`).join('')}` : ''}
    </div>
    ${n.not ? `<div class="tn"><div class="tn-bas"><b>Not</b></div>
      <p>${esc(n.not)}</p></div>` : ''}
  </div>`;
}

/* Alt ekranların ortak başlığı — kareler ekranıyla aynı kart, yol izi uzuyor. */
function ihtiyacAltBaslik(p, ad, sag, saget) {
  const d = DURAKLAR.tasarim;
  return `
    <div class="adim-serit" style="--kr:${d.renk}">
      <div class="bs2 ince">
        <button class="bs2-ik" type="button" title="Adaya dön"
                data-eylem="ihtiyac-geri" data-proje="${p.id}">
          ${svg(ICON.arama, 19)}</button>
        <span class="bs2-yz">
          <span class="bs2-firma"><span class="bs2-ad2">İHTİYAÇ ÇÖZÜMLEMESİ</span></span>
          <span class="bs2-ad">${esc(ad)}</span>
        </span>
        <span class="bs2-sag"><b class="mono">${esc(String(sag))}</b><i>${esc(saget)}</i></span>
      </div>
      <div class="as-alt">
        <span class="as-yol">
          <button class="yi" type="button" data-eylem="tasarim-adim"
                  data-proje="${p.id}" data-deger="-2">Harita</button>
          <s>›</s>
          <button class="yi" type="button" data-eylem="ihtiyac-geri"
                  data-proje="${p.id}">İhtiyaç</button>
          <s>›</s>
          <button class="yi son" type="button" disabled>${esc(ad)}</button>
        </span>
      </div>
    </div>`;
}

/* İhtiyaç adasının kabuğu: hangi alt ekrandaysak onu çiziyor. Alt ekranların
   kendi alt düğmesi yok — ada karelerine dönmek yol izinden ve karodan. */
function ihtiyacEkrani(p) {
  const nerede = IHTIYAC_EKRAN[p.id] || null;
  const g = ihtiyacDurumu(p);

  if (nerede === 'kararlar') {
    return `<div class="akis gorsel">
      ${ihtiyacAltBaslik(p, 'Kararlar', g.kalan, 'karar')}
      <div class="akis-alt">${ihtiyacKararEkrani(p)}</div>
    </div>`;
  }
  if (nerede === 'sayfalar') {
    return `<div class="akis gorsel">
      ${ihtiyacAltBaslik(p, 'Sayfa tasarımları', g.sayfa, 'sayfa')}
      <div class="akis-alt">${ihtiyacSayfaListesi(p)}</div>
    </div>`;
  }
  if (nerede && nerede.slice(0, 6) === 'sayfa:') {
    const sf = nerede.slice(6);
    return `<div class="akis gorsel">
      ${ihtiyacAltBaslik(p, sf, '01', 'sayfa')}
      <div class="akis-alt">${ihtiyacSayfaNotu(p, sf)}</div>
    </div>`;
  }

  const biten = g.adimlar.filter(a => a.bitti).length;
  return `<div class="akis gorsel">
    ${ihtiyacBasligi(p, biten, g.adimlar.length, g.simdi)}
    <div class="akis-alt">${ihtiyacGovdesi(p)}</div>
    ${adimGezinme(p, adimNo(p), tasarimAdimlari(p)[adimNo(p)])}
  </div>`;
}

/* Adım ekranının tepesi. Eskiden ince bir şeritti ve sayfanın geri kalanıyla
   ortak bir dili yoktu; artık aşama kartının kendisi duruyor — yalnız alçak
   kipte, çünkü bu ekran kaydırılmıyor ve 84 piksel çok yer yiyordu.
   Noktalar da bütün akışı değil yalnız bu adayı sayıyor: nerede olduğunu
   harita söylüyor, burada kaç karar kaldığı önemli. */
function adimSeridi(p, no, adim) {
  const yeniler = yeniKararlar(p.palet).map(a => a.anahtar);
  const adimlar = tasarimAdimlari(p);
  const obekler = obekleriKur(p);
  const suObek  = obekler.findIndex(o => o.satir.includes(no));
  const obek    = obekler[suObek] || { satir: [no] };
  const yer     = obek.satir.indexOf(no);
  const ozet    = adim.tur === 'ozet';
  const d       = DURAKLAR.tasarim;

  return `
    <div class="adim-serit" style="--kr:${d.renk}">
      <div class="bs2 ince">
        <button class="bs2-ik" type="button" title="Haritaya dön"
                data-eylem="tasarim-adim" data-proje="${p.id}" data-deger="-2">
          ${svg(ICON[d.ikon], 19)}</button>
        <span class="bs2-yz">
          <span class="bs2-firma"><span class="bs2-ad2">${esc(d.ad)}</span></span>
          <span class="bs2-ad">${esc(adim.obek)}</span>
        </span>
        <span class="bs2-sag">
          <b class="mono">${ozet ? adimlar.filter(a => a.alan).length
            : String(yer + 1).padStart(2, '0') + '/' + String(obek.satir.length).padStart(2, '0')}</b>
          <i>karar</i>
        </span>
      </div>
      <div class="as-alt">
        <span class="as-yol">
          <button class="yi" type="button" data-eylem="tasarim-adim"
                  data-proje="${p.id}" data-deger="-2">Harita</button>
          <s>›</s>
          <button class="yi son" type="button" disabled>${esc(adim.obek)}</button>
        </span>
        ${yeniler.length && !yeniler.includes(adim.anahtar) ? `
          <button class="as-yeni" type="button" data-eylem="yeni-karar-git"
                  data-proje="${p.id}"
                  title="Sonradan eklenen kararlara git">${yeniler.length} yeni</button>` : ''}
        <button class="ab-kararlar" type="button" data-eylem="kararlar" data-proje="${p.id}"
                title="Verilen bütün kararlar">${svg(ICON.katman, 14)}</button>
      </div>
      ${obek.satir.length < 2 ? '' : `
      <div class="as-noktalar">${obek.satir.map(i => `
        <button class="${i === no ? 'on' : i < no ? 'gecti' : ''}${
                  yeniler.includes(adimlar[i].anahtar) ? ' yeni' : ''}" type="button"
                data-eylem="tasarim-adim" data-proje="${p.id}" data-deger="${i}"
                title="${esc(adimlar[i].ad)}"><i></i></button>`).join('')}
      </div>`}
    </div>`;
}

/* "n yeni" çipiyle atlanan projeler. Bu kipteyken İleri, sıradaki adımı
   değil sıradaki yeni kararı gösterir; yenisi kalmayınca özete çıkar —
   yoksa 51 adım baştan takip ettiriliyordu. */
const YENI_KIP = {};

/* Alt satır. Tek seçimli adımda ileri düğmesi "geç" der: seçim zaten ilerletir. */
function adimGezinme(p, no, adim) {
  const adimlar = tasarimAdimlari(p);
  const son = no === adimlar.length - 1;
  /* Ada bitince akış devam etmez, haritaya döner: kullanıcı nerede olduğunu
     ve ne kaldığını görür. -2 "haritaya dön" demek. */
  const obek = obekleriKur(p).find(o => o.satir.includes(no)) || { satir: [no] };
  const adaSonu = no === obek.satir[obek.satir.length - 1];
  const adaBasi = no === obek.satir[0];

  let hedef = son ? -1 : adaSonu ? -2 : no + 1;
  let yazi  = son ? 'Bitir' : adaSonu ? 'Adayı bitir' : 'İleri';
  let kip   = '';
  /* Görsel dünya adasında dört adım bitmeden "Adayı bitir" ana düğme gibi
     duruyor ve kullanıcıyı erken çıkarıyordu: bitene kadar sönük. */
  let sonuk = '';
  if (adim.tur === 'gorsel') {
    const gd = gorselAdaDurumu(p);
    sonuk = gd.tam ? ' tam' : ' sonuk';
  }
  if (adim.tur === 'ihtiyac') {
    sonuk = ihtiyacDurumu(p).tam ? ' tam' : ' sonuk';
  }
  if (YENI_KIP[p.id] && !son) {
    const kalan = yeniKararlar(p.palet).filter(a => a.anahtar !== adim.anahtar);
    const sira  = kalan.length
      ? adimlar.findIndex(a => a.anahtar === kalan[0].anahtar)
      : adimlar.length - 1;
    if (sira > -1) {
      hedef = sira;
      yazi  = kalan.length ? 'Sıradaki yeni' : 'Özete git';
      kip   = ' data-yenikip="1"';
    }
  }

  return `
    <div class="adim-gez">
      <button class="ag geri" type="button"
              data-eylem="tasarim-adim" data-proje="${p.id}"
              data-deger="${adaBasi ? -2 : no - 1}">
        ${svg(ICON.chevron, 14)} ${adaBasi ? 'Harita' : 'Geri'}</button>
      <button class="ag ileri${kip ? ' yeni' : ''}${sonuk}" type="button"${kip}
              data-eylem="tasarim-adim" data-proje="${p.id}" data-deger="${hedef}">
        ${yazi} ${svg(ICON.chevron, 14)}</button>
    </div>`;
}

/* Tek başlığın rafı. */
function adimRafi(p, a) {
  const secili = bicimSecim(p.palet, a);
  /* Claude'un önerisi seçim yerine geçmiyor: rozet çıkıyor, gerekçe altta
     duruyor, ilerlemek için kullanıcı dokunuyor. Yanıldığında akış onun
     kararıyla sürmesin. */
  const on = cozumOnerisi(p, a.anahtar);
  return `<div class="raf" data-coklu="${a.coklu ? 1 : 0}">
    ${a.bos ? '' : `
      <button class="bsc sifir" type="button"
              data-eylem="tasarim-sifirla" data-proje="${p.id}" data-alan="${a.anahtar}"
              ${AUTH.yonetici && !bicimAyni(secili, a) ? '' : 'disabled'}
              title="${esc(a.ad)} başlığını ${esc(a.varsayilan)} hâline döndürür">
        <span class="bon"><span class="on-sifir">${svg(ICON.geriAl, 20)}</span></span>
        <span class="bsc-ad">Sıfırla</span>
      </button>`}
    ${a.secim.map(x => `
      <button class="bsc ${secili.includes(x.ad) ? 'on'
              : on && on.oneri === x.ad ? 'oner' : ''}" type="button"
              data-eylem="tasarim-sec" data-proje="${p.id}"
              data-alan="${a.anahtar}" data-deger="${esc(x.ad)}"
              ${AUTH.yonetici ? '' : 'disabled'} title="${esc(x.tarif)}">
        ${on && on.oneri === x.ad && !secili.includes(x.ad)
          ? '<span class="bsc-rz">öneri</span>' : ''}
        <span class="bon">${tasarimOnizleme(a.anahtar, x.ad)}</span>
        <span class="bsc-ad">${esc(x.ad)}</span>
      </button>`).join('')}
  </div>
  ${on && on.neden ? `<div class="oner-not">${svg(ICON.arama, 13)}
    <span><b>Claude:</b> ${esc(on.neden)}</span></div>` : ''}`;
}

/* ==========================================================================
   GÖRSEL DÜNYA
   Uygulamanın bütün görünüşü bu adadan çıkıyor. Studio hiçbir estetik karar
   vermiyor: logo ve işletme görselini toplar, promptu üretir, dönen tarifi
   yuvalara çevirir, adresleri bir sonraki bloğa taşır.
   ========================================================================== */

/* Adanın kendi durumu: dört adım, hangisi bitti, sıradaki hangisi.
   Bir yerde hesaplanıyor ki başlık, gövde ve alt düğme aynı şeyi söylesin. */
function gorselAdaDurumu(p) {
  const pl    = p.palet || {};
  const logo  = DB.logoAdres[p.id];
  const isl   = gorselAdresi(p, 'G0');
  const tarif = String(pl.tarif || '').trim();
  const yuvalar = (pl.gorseller || []).filter(y => y.no !== 'G0');
  const dolu  = yuvalar.filter(y => y.yol).length;

  const adimlar = [
    { ad: 'Malzeme', bitti: !!logo && !!isl,
      ozet: [logo ? 'logo' : '', isl ? 'işletme görseli' : ''].filter(Boolean).join(' + ') || 'iki görsel gerekiyor' },
    /* Promptun verildiğini Studio göremiyor; tarif geldiyse verilmiş demektir. */
    { ad: 'Tasarım promptu', bitti: !!tarif, ozet: tarif ? 'verildi' : 'bekliyor' },
    { ad: 'Tarifi yapıştır', bitti: !!tarif && yuvalar.length > 0,
      ozet: yuvalar.length ? yuvalar.length + ' yuva açıldı' : 'bekliyor' },
    { ad: 'Görselleri yerine koy', bitti: yuvalar.length > 0 && dolu === yuvalar.length,
      ozet: yuvalar.length ? dolu + '/' + yuvalar.length + ' dolu' : 'bekliyor' },
  ];

  /* Sıradaki: bitmemiş ilk adım. Hepsi bittiyse -1. */
  const simdi = adimlar.findIndex(a => !a.bitti);
  return { adimlar, simdi, tam: simdi < 0, logo, isl, tarif, yuvalar, dolu };
}

/* Görsel dünya adasının başlığı — kalan adımlarla aynı kart, yalnız sayacı
   kendi dört adımını sayıyor. Genel şerit burada "1 / 15" diyordu ve bu ada
   tek adım olduğu için yanıltıyordu. */
function gorselAdaBasligi(p) {
  const g = gorselAdaDurumu(p);
  const biten = g.adimlar.filter(a => a.bitti).length;
  const d = DURAKLAR.tasarim;

  return `
    <div class="adim-serit" style="--kr:${d.renk}">
      <div class="bs2 ince">
        <button class="bs2-ik" type="button" title="Haritaya dön"
                data-eylem="tasarim-adim" data-proje="${p.id}" data-deger="-2">
          ${svg(ICON[d.ikon], 19)}</button>
        <span class="bs2-yz">
          <span class="bs2-firma"><span class="bs2-ad2">${esc(d.ad)}</span></span>
          <span class="bs2-ad">Görsel dünya</span>
        </span>
        <span class="bs2-sag">
          <b class="mono">${biten}/${g.adimlar.length}</b><i>adım</i>
        </span>
      </div>
      <div class="as-alt">
        <span class="as-yol">
          <button class="yi" type="button" data-eylem="tasarim-adim"
                  data-proje="${p.id}" data-deger="-2">Harita</button>
          <s>›</s>
          <button class="yi son" type="button" disabled>Görsel dünya</button>
        </span>
        <span class="as-not">${g.tam
          ? g.yuvalar.length + ' görsel hazır'
          : 'Uygulamanın havası buradan çıkıyor'}</span>
      </div>
      <div class="as-noktalar">${g.adimlar.map((a, i) => `
        <span class="${a.bitti ? 'gecti' : i === g.simdi ? 'on' : ''}"><i></i></span>`).join('')}
      </div>
    </div>`;
}

/* Ada gövdesi — aynı anda tek kart açık. Biten adımlar özetiyle kapanır,
   bekleyenler sade satır olur. Dördü birden açıkken hangisinin sırası
   olduğu anlaşılmıyordu. */
function gorselDunyaGovdesi(p) {
  const d   = gorselAdaDurumu(p);
  const yon = AUTH.yonetici;

  /* Elle açılan adım varsa o, yoksa sıradaki. Hepsi bittiyse sonuncusu:
     `simdi` -1 dönüyor ve hiçbir kart açılmıyordu. */
  const acik = GORSEL_ADIM[p.id] != null ? GORSEL_ADIM[p.id]
             : d.simdi < 0 ? d.adimlar.length - 1 : d.simdi;

  /* Kare kart — kurulum sayfasındaki ızgaranın aynısı. Sırası gelmeyen
     kilitli: kesik çerçeve, basılamaz. Biten karta geri dönülebiliyor. */
  const kart = i => {
    const a = d.adimlar[i];
    /* Zincir: bir adım ancak kendinden öncekiler bittiyse açılır. */
    const kilit = !a.bitti && d.simdi > -1 && i > d.simdi;
    const hal = a.bitti ? 'bitti' : kilit ? 'kilitli' : i === acik ? 'simdi' : 'eksik';
    const ikon = a.bitti ? ICON.tik : kilit ? ICON.kilit
               : i === acik ? ICON.goz : ICON.kalem;
    return `
      <button class="ya ${hal}" type="button" ${kilit ? 'disabled' : ''}
              data-eylem="gorsel-adim" data-proje="${p.id}" data-deger="${i}">
        <span class="ya-ust">
          <span class="ya-no mono">${String(i + 1).padStart(2, '0')}</span>
          <span class="ya-dur">${svg(ikon, 13)}</span>
        </span>
        <span class="ya-yz">
          <span class="ya-ad">${esc(a.ad)}</span>
          <span class="ya-alt">${esc(a.ozet)}</span>
        </span>
      </button>`;
  };

  const govde = [
    () => durakKarti(1, d.adimlar[0].bitti, 'Malzeme',
      'Logo sihirbazda alındı. Bir de <b>işletmeyi anlatan görsel</b> gerekiyor — '
      + 'mekân, ürün ya da vitrin. Konseptin tek kaynağı bu.', `
      <div class="gd-iki">
        <div class="gd-kutu ${d.logo ? 'var' : ''}"
             ${yon ? `data-eylem="logo-yukle" data-proje="${p.id}" role="button" tabindex="0"` : ''}>
          <span class="gd-on ${d.logo ? 'resim' : ''}" ${d.logo ? `data-logo="${esc(d.logo)}"` : ''}>
            ${d.logo ? '' : svg(ICON.folder, 20)}</span>
          <b>Logo</b><i>${d.logo ? 'hazır · değiştir' : 'sihirbazda yüklenmedi'}</i>
        </div>
        <div class="gd-kutu ${d.isl ? 'var' : ''}"
             ${yon ? `data-eylem="isletme-gorseli" data-proje="${p.id}" role="button" tabindex="0"` : ''}>
          <span class="gd-on ${d.isl ? 'resim' : ''}" ${d.isl ? `data-logo="${esc(d.isl)}"` : ''}>
            ${d.isl ? '' : '+'}</span>
          <b>İşletme görseli</b><i>${d.isl ? 'hazır · değiştir' : 'dokun, seç'}</i>
        </div>
      </div>`),

    () => durakKarti(2, d.adimlar[1].bitti, 'Tasarım promptu',
      'Promptu kopyala, <b>iki görselle birlikte</b> ChatGPT\'ye ver. Altı ekranı '
      + 'tasarlar, gereken görselleri kendi üretir ve hangisinin nereye gideceğini '
      + 'numarasıyla yazar. Beğenene kadar orada konuş — Studio karışmaz.'
      + (d.adimlar[0].bitti ? '' : ' <b class="eksik">Önce iki görseli de yükle.</b>'), `
      <div class="kur-dug">
        ${promptBaglantisi({ tur: 'gorselTasarim', proje: p.id, hedef: 'chatgpt',
          yazi: 'Kopyala ve ChatGPT\'de aç', kapali: !d.adimlar[0].bitti })}
      </div>
      <div class="kur-dug">
        ${promptBaglantisi({ tur: 'gorselTarif', proje: p.id, hedef: 'chatgpt', ikincil: true,
          yazi: 'Beğendiğinde: tarif promptu', kapali: !d.adimlar[0].bitti })}
      </div>`),

    () => durakKarti(3, d.adimlar[2].bitti, 'Tarifi yapıştır',
      d.tarif
        ? 'Tarif alındı. Değiştirmek istersen yeniden yapıştır.'
        : 'ChatGPT\'nin verdiği tarifi bırak. Studio yerleşimi okuyup '
          + '<b>isimli görsel yuvaları</b> açar.', `
      <div class="kur-dug">
        <button class="sayfa-dug ${d.tarif ? 'ikincil' : ''}" type="button"
                data-eylem="tarif-aktar" data-proje="${p.id}">
          ${svg(ICON.ice, 15)} ${d.tarif ? 'Tarifi değiştir' : 'Tarifi yapıştır'}</button>
      </div>`),

    () => durakKarti(4, d.adimlar[3].bitti, 'Görselleri yerine koy',
      d.yuvalar.length
        ? 'ChatGPT\'nin ürettiklerini indir, yuvalara bırak. Hangisinin nereye '
          + 'gideceğini yuva söylüyor — sıra karıştıramazsın.'
        : '<b class="eksik">Önce tarifi yapıştır.</b> Yuvaları tarif açıyor.', `
      <div class="kur-dug">
        <button class="sayfa-dug ${d.yuvalar.length && d.dolu < d.yuvalar.length ? '' : 'ikincil'}"
                type="button" data-eylem="gorsel-yuvalar" data-proje="${p.id}"
                ${d.yuvalar.length ? '' : 'disabled'}>
          ${svg(ICON.katman, 15)} Yuvaları aç${d.yuvalar.length
            ? ` — ${d.dolu}/${d.yuvalar.length} dolu` : ''}</button>
      </div>`),
  ];

  return `<div class="gd-kaydir">
    <div class="ya-harita">
      <div class="ya-satir">${[0, 1, 2].map(kart).join('')}</div>
      ${yolOku(d.adimlar[2].bitti)}
      <div class="ya-satir">${[3].map(kart).join('')}</div>
    </div>
    ${govde[acik] ? `<div class="ada-acik">${
      govde[acik]().replace('>sırada<', '>şimdi<')}</div>` : ''}
    ${d.tam ? tarifKarti(p) : ''}
  </div>`;
}

/* Elle açılan adım. Kapalı satıra dokununca oraya bakılır; ada değişince
   sıfırlanır ki bir sonraki projede eski seçim yapışıp kalmasın. */
const GORSEL_ADIM = {};

/* Bir yuvanın imzalı adresi. G0 = işletme görseli (ChatGPT'ye giden, tarif
   isterse G1 olarak kullanılan). */
function gorselAdresi(p, no) {
  const harita = DB.gorselAdres || {};
  const dogrudan = harita[p.id + '/' + no];
  if (dogrudan) return dogrudan;
  /* İki yuva aynı dosyayı gösterebilir: tarif G1'i "senin verdiğin görsel"
     diye kullanınca G0 ile aynı yolu paylaşıyorlar. Kendi anahtarında adres
     yoksa aynı yolu gösterenden al, kutu boş görünmesin. */
  const yuvalar = (p.palet || {}).gorseller || [];
  const ben = yuvalar.find(y => y.no === no);
  if (!ben || !ben.yol) return '';
  const es = yuvalar.find(y => y.yol === ben.yol && harita[p.id + '/' + y.no]);
  return es ? harita[p.id + '/' + es.no] : '';
}

/* Tarifin Studio'daki görünüşü — ada içinde ve özet adımında. */
function tarifKarti(p) {
  const pl = p.palet || {};
  const dil = String(pl.tarif || '').trim();
  const yuvalar = pl.gorseller || [];
  if (!dil) return '';

  const satir = dil.split(/\r?\n/).filter(x => x.trim() && !/^#/.test(x));
  return `<div class="tarif-kart">
    <div class="tk-bas"><b>Görsel dil</b><span class="tk-rz">ChatGPT</span></div>
    ${satir.slice(0, 8).map(x => {
      const es = x.match(/^\s*([^:]{2,28}?)\s*:\s*(.+)$/);
      return es
        ? `<div class="tk-satir"><b>${esc(es[1])}</b><span>${esc(es[2])}</span></div>`
        : `<div class="tk-satir"><span>${esc(x.replace(/^[-*]\s*/, ''))}</span></div>`;
    }).join('')}
    ${satir.length > 8 ? `<button class="promptu-gor" type="button"
        data-eylem="tarif-gor" data-proje="${p.id}">Tarifin tamamını gör</button>` : ''}
    ${yuvalar.length ? `<div class="tk-yer">
      ${yuvalar.map(y => `<span class="tk-y ${y.yol ? 'dolu' : ''}">${esc(y.no)} · ${esc(y.ad)}</span>`).join('')}
    </div>` : ''}
  </div>`;
}

/* ---------- Tarif çözümleme ----------
   ChatGPT serbest metin döndürür. YERLEŞİM bölümündeki boru işaretli
   satırları yuvaya çeviriyoruz; tutturamadıysa metin yine saklanır ve
   yuvalar elle açılır — akış durmaz. */
function tarifCozumle(metin, eskiYuvalar) {
  const ham = String(metin || '').replace(/\r/g, '');
  const eski = {};
  (eskiYuvalar || []).forEach(y => { eski[y.no] = y; });

  /* Bölümler: "## YERLEŞİM" başlığından sonrası. Başlık yoksa bütün metinde
     boru işaretli satır aranır. */
  const buyuk = ham.toLocaleUpperCase('tr');
  /* Başlıkları `##` ile yazmasını istiyoruz ama her seferinde uymuyor:
     düz "YERLEŞİM" satırı da başlık sayılsın. Uymazsa bütün metin tarif
     olarak kaydediliyor ve yerleşim satırları iki kez basılıyordu. */
  const yi = buyuk.search(/(^|\n)[ \t]*#{0,4}[ \t]*YERLE[SŞ][İI]M[ \t]*(\n|:)/);
  const di = buyuk.search(/(^|\n)[ \t]*#{0,4}[ \t]*G[OÖ]RSEL[ \t]*D[İI]L[ \t]*(\n|:)/);

  let dil = ham.trim();
  let yerBolum = ham;
  if (yi > -1) {
    yerBolum = ham.slice(yi);
    dil = (di > -1 && di < yi ? ham.slice(di, yi) : ham.slice(0, yi)).trim();
  } else if (di > -1) {
    dil = ham.slice(di).trim();
  }
  dil = dil.replace(/^[ \t]*#{0,4}[ \t]*G[OÖ]RSEL[ \t]*D[İI]L[ \t]*:?[ \t]*$/im, '')
           .replace(/^```\w*$|^```$/gm, '').trim();

  const yuvalar = [];
  yerBolum.split('\n').forEach(satir => {
    const t = satir.replace(/^\s*(?:[-*•]|\d+[.)])\s*/, '').replace(/\*\*/g, '').trim();
    if (!t || t.startsWith('#') || t.startsWith('```')) return;
    const par = t.split('|').map(x => x.trim()).filter((x, i) => i < 4);
    if (par.length < 3) return;
    const no = (par[0].match(/^G\s*(\d+)$/i) || [])[1];
    if (!no) return;
    /* Markdown tablo başlığı ("--- | --- | ---") boru içerir ama G ile başlamaz. */
    const dosya = par[1].replace(/^`|`$/g, '')
      .replace(/[^A-Za-z0-9._-]/g, '-').toLowerCase() || ('gorsel-' + no);
    const anahtar = 'G' + no;
    yuvalar.push(Object.assign({ yol: '', boyut: 0, tur: '' }, eski[anahtar] || {}, {
      no: anahtar,
      dosya: /\.[a-z0-9]{2,4}$/.test(dosya) ? dosya : dosya + '.png',
      ad: par[2] || 'Görsel',
      tarif: par[3] || '',
    }));
  });

  yuvalar.sort((a, b) => parseInt(a.no.slice(1), 10) - parseInt(b.no.slice(1), 10));
  return { dil: dil || ham.trim(), yuvalar };
}

/* Tarif özeti — özet adımının tepesinde. Tam metin uzun; ilk satırlar
   ve dolu yuva sayısı yetiyor. */
function tarifSeridi(p) {
  const pl = p.palet || {};
  const t  = String(pl.tarif || '').trim();
  const yuvalar = pl.gorseller || [];
  const dolu = yuvalar.filter(y => y.yol).length;

  if (!t) {
    return `<div class="bos-kutu">${svg(ICON.katman, 18)}
      <span>Görsel dil tarifi yok. <b>Görsel dünya</b> adasına dönüp
      ChatGPT'den tarifi al — bu blok onsuz yarım çıkar.</span></div>`;
  }

  const satir = t.split(/\r?\n/).filter(x => x.trim() && !/^#/.test(x)).slice(0, 6);
  return `<div class="tarif-serit">
    <div class="ts-ust"><b>Görsel dil</b>
      <span class="ts-rz">${dolu}/${yuvalar.length} görsel</span></div>
    ${satir.map(x => `<div class="ts-satir">${esc(x.replace(/^[-*]\s*/, ''))}</div>`).join('')}
    ${t.split(/\r?\n/).length > 6 ? '<div class="ts-devam">…</div>' : ''}
  </div>`;
}

/* Son adım: bütün kararlar tek listede. */
function tasarimOzeti(p) {
  const pl = p.palet || {};
  return tasarimGruplari(p).map(g => bolumBas(g.ad) + `
    <div class="satirlar">${g.alanlar.map(a => {
      const d = bicimSecim(pl, a);
      return `<div class="sr">${esc(a.ad)} <b>${d.length ? esc(d.join(' + ')) : '—'}</b></div>`;
    }).join('')}</div>`).join('')
    + celiskiKutusu(p)
    + (AUTH.yonetici ? `
      ${promptBaglantisi({ tur: 'tasarim', proje: p.id, slug: depoSlug(p.repo),
        yazi: '2. blok — kopyala ve Claude Code\'da aç' })}
      <button class="tumSifir" type="button" data-eylem="tasarim-tum-sifirla" data-proje="${p.id}">
        ${svg(ICON.geriAl, 15)} Tüm tasarımı sıfırla</button>` : '');
}

/* Özet adımında çelişki denetimi. Kararları elle verdiğimiz için
   birbirini iptal eden ikilileri burada yakalıyoruz. */
function celiskiKutusu(p) {
  const pl = p.palet || {};
  const bulunan = [];

  CELISKI.forEach(([[a1, d1], [a2, d2], neden]) => {
    const b1 = tasarimAlani(p, a1);
    const b2 = tasarimAlani(p, a2);
    if (!b1 || !b2) return;
    if (bicimSecim(pl, b1).includes(d1) && bicimSecim(pl, b2).includes(d2)) {
      const i1 = tasarimAdimlari(p).findIndex(x => x.anahtar === a1);
      bulunan.push([`${b1.ad}: ${d1} + ${b2.ad}: ${d2}`, neden, i1]);
    }
  });

  /* Yalnız mobil bir projede masaüstü kararı seçilmişse söyle. Seçenek
     Studio'nun kendi listesinden geldi; uyarısı da Studio'dan gelmeli. */
  const masaustu = [];
  if (p.platform === 'mobil') {
    tasarimAlanlari(p).forEach(a => {
      const secili = bicimSecim(pl, a);
      if (a.masaustu && secili.length) {
        masaustu.push([a.ad + ': ' + secili.join(' + '),
          'Bu proje yalnız mobil; masaüstü kararının karşılığı yok.',
          tasarimAdimlari(p).findIndex(x => x.anahtar === a.anahtar)]);
        return;
      }
      (a.secim || []).forEach(sc => {
        if (sc.masaustu && secili.includes(sc.ad)) {
          masaustu.push([a.ad + ': ' + sc.ad,
            'Bu proje yalnız mobil; masaüstü kararının karşılığı yok.',
            tasarimAdimlari(p).findIndex(x => x.anahtar === a.anahtar)]);
        }
      });
    });
  }
  bulunan.push(...masaustu);

  if (!bulunan.length) {
    return `<div class="adim-not iyi">${svg(ICON.check, 13)}
      <span>Çelişen karar yok.</span></div>`;
  }

  return `<div class="celiski">
    <b>${svg(ICON.uyari, 14)} ${bulunan.length} uyarı</b>
    ${bulunan.map(([bas, neden, i]) => `
      <button type="button" data-eylem="tasarim-adim" data-proje="${p.id}" data-deger="${i}">
        <span>${esc(bas)}</span><i>${esc(neden)}</i></button>`).join('')}
  </div>`;
}

/* Adımın kendi ekranını gösteren önizleme. Seçim yapınca anında değişir. */
function onizlemeSatiri(p, adim) {
  ONIZLEME_EKRAN = adim.ekran;
  if (ONIZLEME_ADIM !== adim.anahtar) {
    ONIZLEME_ADIM = adim.anahtar;
    ONIZLEME_CIHAZ = adim.cihaz || 'web';
  }
  return `
    <div class="onz-satir"><div class="onz-goz">${onizlemeIc(p, p.palet)}</div></div>`;
}

/* Verdiğin bütün kararlar, adımdan çıkmadan. Satıra dokunursan o adıma gider. */
function kararlarAc(projeId) {
  const p = DB.proje(projeId);
  if (!p) return;
  const pl = p.palet || {};

  /* Öbek öbek: her satır bir karar, dokununca o adıma gider. */
  const adimlar = tasarimAdimlari(p);
  const obekler = obekleriKur(p, true);

  const govde = obekler.map(o => `
    <div class="kr-obek">
      <span class="kr-obek-ad">${esc(o.ad)}</span>
      ${o.satir.map(i => {
        const adim = adimlar[i];
        const d = bicimSecim(pl, adim.alan);
        return `<button class="kr-sat" type="button" data-kr="${i}">
          <span>${esc(adim.ad)}</span>
          <u>${d.length ? esc(d.join(' + ')) : '—'}</u>
        </button>`;
      }).join('')}
    </div>`).join('');

  const el = document.createElement('div');
  el.id = 'kararlar';
  el.className = 'onz krp';
  el.innerHTML = `
    <div class="onz-tepe">
      <button class="sh-kapat" type="button" data-kr="kapat">${svg(ICON.kapat, 15)}</button>
      <span class="onz-ad">Kararlar<u>${adimlar.filter(a => a.alan).length} başlık · ${esc(projeAdi(p))}</u></span>
    </div>
    <div class="kr-govde">${govde}</div>`;

  document.body.appendChild(el);
  document.addEventListener('keydown', kararlarKac);
  requestAnimationFrame(() => el.classList.add('acik'));

  el.addEventListener('click', ev => {
    const b = ev.target.closest('[data-kr]');
    if (!b) return;
    const d = b.dataset.kr;
    kararlarKapat();
    if (d === 'kapat') return;
    TASARIM_YER[p.id] = Number(d);
    render();
    $('#view').scrollTop = 0;
  });
}

function kararlarKac(ev) { if (ev.key === 'Escape') kararlarKapat(); }

function kararlarKapat() {
  const el = $('#kararlar');
  if (!el) return;
  document.removeEventListener('keydown', kararlarKac);
  el.classList.remove('acik');
  setTimeout(() => el.remove(), 240);
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

  const bic0 = {};
  tasarimAlanlari(p).forEach(a => { bic0[a.anahtar] = bicimSecim(pl, a); });
  /* Görünüşe dair kararların çoğu kalktı — onlara artık ChatGPT'nin tarifi
     karar veriyor. Önizleme künye ekranında hâlâ kullanılıyor; olmayan bir
     başlık sorulunca boş dizi dönüp aşağıdaki varsayılana düşsün. */
  const bic = new Proxy(bic0, { get: (t, k) => (k in t ? t[k] : []) });

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

/* ---------- Arayüz biçimi: görselli seçim rafları ----------
   Her seçenek gerçek bir küçük çizim. Yazıyı okuyup hayal etmek gerekmez.
   Çoklu alanlarda birkaçı birden seçilebilir; en az biri hep açık kalır. */

/* Seçim varsayılanla aynı mı? Aynıysa sıfırlanacak bir şey yok. */
function bicimAyni(secili, alan) {
  return secili.length === 1 && secili[0] === alan.varsayilan;
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

function tasarimOnizleme(alan, ad) {
  /* Yerleşim ve durum seçenekleri tel çizimle anlatılır. */
  const bilgi = TUM_TASARIM.find(a => a.anahtar === alan);
  const sec = bilgi && bilgi.secim.find(x => x.ad === ad);
  if (sec && sec.tel) return telCizim(sec.tel);

  /* "…ekle" başlıkları ana başlığın çizim dilini kullanır. */
  alan = { kartek: 'kart', tabloek: 'tablo', dugmeek: 'dugme' }[alan] || alan;

  const satirlar = '<i class="ln b o"></i><i class="ln u"></i><i class="ln k"></i>';

  if (alan === 'kart') {
    const sinif = {
      'Düz': 'duz', 'Yükseltilmiş': 'yuksek', 'Çizgili': 'cizgi', 'Buzlu cam': 'cam',
      'Şerit vurgu': 'serit', 'Kağıt': 'kagit', 'Oyulmuş': 'oyuk', 'Işıklı kenar': 'isik',
      'Degrade': 'degrade', 'Dokulu': 'doku',
    }[ad];
    return `<span class="on-kart k-${sinif}">${satirlar}</span>`;
  }

  if (alan === 'kose') {
    const b = {
      'Keskin':   'border-radius:0',
      'Hafif':    'border-radius:5px',
      'Yuvarlak': 'border-radius:12px',
      'Hap':      'border-radius:999px',
      'Kesik':    'clip-path:polygon(13px 0,100% 0,100% calc(100% - 13px),calc(100% - 13px) 100%,0 100%,0 13px)',
      'Yaprak':   'border-radius:16px 0 16px 0',
      'Kaş':      'border-radius:13px 13px 0 0',
    }[ad];
    return `<span class="on-kose" style="${b}"></span>`;
  }

  if (alan === 'yogunluk') {
    if (ad === 'Karma') {
      return `<span class="on-yog karma">
        <em style="gap:3px"><i></i><i></i><i></i></em>
        <em style="gap:9px"><i></i><i></i></em></span>`;
    }
    if (ad === 'Nefesli') {
      return `<span class="on-yog" style="gap:13px">
        <em style="gap:3px"><i></i><i></i></em>
        <em style="gap:3px"><i></i><i></i></em></span>`;
    }
    if (ad === 'Kart dizisi') return `<span class="on-kd">${'<i><u></u></i>'.repeat(3)}</span>`;
    const [say, ara] = { 'Sıkışık': [5, 3], 'Normal': [4, 7], 'Ferah': [3, 12] }[ad];
    return `<span class="on-yog" style="gap:${ara}px">${'<i></i>'.repeat(say)}</span>`;
  }

  if (alan === 'tablo') {
    const h3 = '<i></i><i></i><i></i>';
    if (ad === 'Kartlı satır') return `<span class="on-tb kartli">${
      `<u class="r">${h3}</u>`.repeat(4)}</span>`;
    if (ad === 'Gruplu') return `<span class="on-tb gruplu">
      <u class="g"><i></i></u><u class="r">${h3}</u><u class="r">${h3}</u>
      <u class="g"><i></i></u><u class="r">${h3}</u></span>`;
    if (ad === 'Rakam hizalı') {
      const r = '<i></i><i></i><i class="rakam"></i>';
      return `<span class="on-tb t-yatay"><u class="h">${r}</u>${
        `<u class="r">${r}</u>`.repeat(4)}</span>`;
    }
    if (ad === 'Vurgulu sütun') {
      const r = '<i class="ilk"></i><i></i><i></i>';
      return `<span class="on-tb t-yatay vurgulu"><u class="h">${r}</u>${
        `<u class="r">${r}</u>`.repeat(4)}</span>`;
    }
    const sinif = { 'Çizgisiz': '', 'Zebra': 't-zebra',
                    'Yatay çizgi': 't-yatay', 'Tam ızgara': 't-izgara' }[ad];
    return `<span class="on-tb ${sinif}"><u class="h">${h3}</u>${
      `<u class="r">${h3}</u>`.repeat(4)}</span>`;
  }

  if (alan === 'tablomobil') {
    if (ad === 'Karta dönüş') return `<span class="on-mk">${'<i></i>'.repeat(4)}</span>`;
    if (ad === 'Yana kaydır') {
      const h4 = '<i></i><i></i><i></i><i></i>';
      return `<span class="on-tb t-yatay tasan"><u class="h">${h4}</u>${
        `<u class="r">${h4}</u>`.repeat(4)}</span>`;
    }
    if (ad === 'Sütun gizle') {
      const r = '<i></i><i class="dar"></i>';
      return `<span class="on-tb t-yatay"><u class="h">${r}</u>${
        `<u class="r">${r}</u>`.repeat(4)}</span>`;
    }
    if (ad === 'Aç-kapa satır') {
      return `<span class="on-ak"><i></i><i></i><u></u><i></i></span>`;
    }
    if (ad === 'İki satır') {
      return `<span class="on-is">${'<em><i></i><b></b></em>'.repeat(3)}</span>`;
    }
    return `<span class="on-te"><i></i><u></u><i></i></span>`;
  }

  if (alan === 'dugme') {
    if (ad === 'İkonlu') {
      return `<span class="on-dg"><em class="d-dolu ikonlu">
        <svg viewBox="0 0 24 24"><path d="M5 12l5 5L20 7"/></svg>Kaydet</em></span>`;
    }
    const sinif = { 'Dolu': 'd-dolu', 'Çizgili': 'd-cizgi', 'Yumuşak': 'd-yumusak',
                    'Gölgeli': 'd-golge', 'Degrade': 'd-degrade', 'Yazı': 'd-yazi' }[ad];
    return `<span class="on-dg"><em class="${sinif}">Kaydet</em></span>`;
  }

  /* Claude'un açtığı başlığın çizimi yok: Studio o seçeneğin nasıl göründüğünü
     bilmiyor, uydurmuyor da. Seçeneğin adı okunsun diye sade bir yaprak. */
  if (String(alan).slice(0, 2) === 'x_') {
    return `<span class="on-serbest"><i></i><i></i><i></i></span>`;
  }

  /* simge — üç örnek: ev, kişi, arama. Dolu set kendi kapalı biçimlerini
     kullanır; kontur biçimini doldurmak çirkin sonuç veriyor. */
  const sinif = { 'Çizgi': 'cizgi', 'Dolu': 'dolu', 'İki katman': 'katman',
                  'Kalın çizgi': 'kalin', 'Zeminli': 'zemin', 'Elle çizim': 'elle' }[ad];
  const kontur = [
    '<path d="M3 10.5 12 4l9 6.5V20a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1z"/>',
    '<circle cx="12" cy="8" r="3.5"/><path d="M4.5 20c1-4 4-5.6 7.5-5.6S18.5 16 19.5 20"/>',
    '<circle cx="11" cy="11" r="6.4"/><path d="M16 16l4.5 4.5"/>',
  ];
  const dolgulu = [
    '<path d="M3 10.5 12 4l9 6.5V20a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1z"/>',
    '<circle cx="12" cy="8" r="4"/><path d="M4 20.6c.8-4.5 4-6.4 8-6.4s7.2 1.9 8 6.4z"/>',
    '<path fill-rule="evenodd" d="M11 3.6a7.4 7.4 0 1 0 4.3 13.4l3.4 3.4a1.5 1.5 0 0 0 2.1-2.1l-3.4-3.4A7.4 7.4 0 0 0 11 3.6zm0 3a4.4 4.4 0 1 1 0 8.8 4.4 4.4 0 0 1 0-8.8z"/>',
  ];
  /* Elle çizim: aynı yollar, hafifçe eğik. Titreklik oradan geliyor. */
  const egim = ['rotate(-6 12 12)', 'rotate(4 12 12)', 'rotate(-3 12 12)'];
  const yol = (sinif === 'dolu' ? dolgulu : kontur).map((d, i) =>
    `<svg viewBox="0 0 24 24">${sinif === 'elle' ? `<g transform="${egim[i]}">${d}</g>` : d}</svg>`
  ).join('');
  return `<span class="on-sm sm-${sinif}">${yol}</span>`;
}

/* 2 · Yapıyı kurma */
/* 2 · Kurulum ve yapı — klavye başında doldurulan taraf.
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
  /* Modül kurma akışı açıksa ekranı o alıyor; "Kapat" taslağı silince
     buradaki kurulum ızgarasına geri dönülüyor. */
  if (AUTH.yonetici && YAPI_ACIK[p.id]) return yapiAkisi(p, d);

  const moduller = DB.modulleri(p.id);
  const gercek   = moduller.filter(m => m.ad !== GENEL_MODUL);
  const s  = DB.sayim(p.id);
  const pl = p.palet || {};
  const dil  = (DIL_SECENEK.find(x => x.kod === p.dil) || {}).ad;
  const para = (PARA_SECENEK.find(x => x.kod === p.para) || {}).ad;
  const roller = rolListesi(pl.roller);

  /* Platform ve veritabanı sütunda `not null` — hep dolu geliyorlar. Adımın
     gerçekten görüldüğünü dil ve para birimi söylüyor; onları sihirbaz
     yazmıyor. Eski projelerde `urunOnay` işareti yok, oradan da bakıyoruz. */
  const urunTam = !!(dil && para) || !!pl.urunOnay;

  const adimlar = [
    { no: '01', eylem: 'adim-urun',   ad: 'Ne yapıyoruz?',
      ozet: 'Nerede çalışacak, hangi dilde',
      bitti: urunTam,
      deger: [PLATFORM_ADI[p.platform], dil].filter(Boolean).join(' · ') },

    { no: '02', eylem: 'adim-roller', ad: 'Kim kullanacak?',
      ozet: 'Yetki katmanları',
      bitti: roller.length > 0,
      deger: roller.length + ' katman yetki' },

    /* "Nereye kuralım" ile kurulum aynı sorunun iki yarısı: biri yeri
       söylüyor, öteki kuruyor. Tek adımda birleşince ızgara da 2×2 oluyor
       ve beş adımın tek sayı olmasından doğan boş yuva kapanıyor. */
    { no: '03', eylem: 'adim-yer',    ad: 'Nereye kuralım?',
      ozet: 'Adres, paket adı, kurulum',
      bitti: !!pl.modulAdi && !!pl.veriKatmani && !!pl.alanAdi
             && !!p.repo && !!String(pl.sohbetAdi || '').trim() && !!pl.yayinda,
      deger: pl.alanAdi || '' },

    { no: '04', eylem: 'yapi-akis-ac', ad: 'Modüller',
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
    /* Proje sayfasıyla birebir aynı ızgara: üç sütun, aynı kare ölçüsü.
       Dört adımda son satırda tek kart kalıyor — soldan başlıyor. */
    + `<div class="ya-harita">
        <div class="ya-satir">${[0, 1, 2].map(kart).join('')}</div>
        ${yolOku(adimlar[2].bitti)}
        <div class="ya-satir">${[3].map(kart).join('')}</div>
      </div>`
    + `</div>`;
}

/* ---------- 3 · Yapıyı kurma: adım adım akış ----------
   Bir firmaya çoğunlukla tek modül kuruluyor; sonradan eklenen de tek
   oluyor. Akış buna göre: bir modül, sayfaları, her sayfanın künyesi.
   Taslak bellekte durur; veritabanına ancak "Kur" ile yazılır. */
const YAPI_TASLAK = {};

/* Rol merdiveni taslağı: her tuşta veritabanına yazmıyoruz,
   ekrandan çıkarken bir kez kaydediliyor. */
const ROL_TASLAK = {};

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
                          mk: { roller: [], eylemler: [], yetki: {}, kural: '' },
                          sayfalar: [], kunye: {} };
  }
  const t = YAPI_TASLAK[p.id];
  /* Taslak doğarken yalnız modülün adı konuyordu; sayfaları gelmediği için
     ekran "0 sayfa" gösteriyor, geri çıkıp girince düzeliyordu. Veri hazırsa
     adı koyarken sayfaları da yükle. */
  if (!t.acildi && DB.yuklendi) {
    t.acildi = true;
    const ad = modulAdi(p);
    if (ad) modulYukle(p, t, ad);
  }
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
    const an = ((p.palet || {}).anlatim || {})[ad];
    if (an) { t.anlat = an.metin || ''; t.kararlar = an.sorular || []; }
    const mk = ((p.palet || {}).modulKunye || {})[ad];
    t.mk = mk ? JSON.parse(JSON.stringify(mk))
              : { roller: [], eylemler: [], yetki: {}, kural: '' };
  } else {
    const sb = DB.modulSablonlari().find(m => m.ad === ad);
    t.sayfalar = ((sb && sb.sayfalar) || []).slice();
    t.kunye = {};
    t.mk = { roller: [], eylemler: [], yetki: {}, kural: '' };
  }
}

function yapiKunye(t, sayfa) {
  if (!t.kunye[sayfa]) {
    t.kunye[sayfa] = { amac: '', tur: '', olcek: '', kalip: [], kalipCevap: {},
                       grup: '', ayniKayit: '', alanlar: [],
                       /* Yalnız modül kuralından ayrılıyorsa dolar. */
                       fark: { roller: [], eylemler: [], yetki: {}, kural: '' } };
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

function modulAdimTam(mk, anahtar) {
  if (anahtar === 'roller') return (mk.roller || []).length > 0;
  if (anahtar === 'yetki')  return (mk.eylemler || []).length > 0
    && mk.eylemler.every(x => ((mk.yetki || {})[x] || []).length);
  return true;
}

function modulKunyeTam(mk) {
  return !!mk && MODUL_ADIM.every(a => modulAdimTam(mk, a.anahtar));
}

function yapiAkisi(p, d) {
  const t = yapiTaslak(p);
  if (t.mod === 'anlat') return anlatEkrani(p, t);
  if (t.mod === 'roller') return rolEkrani(p, t);
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
  const p2 = [];
  if ((f.roller || []).length) p2.push(f.roller[0] + ' ve üstü görür');
  if ((f.eylemler || []).length) p2.push(f.eylemler.length + ' iş farklı');
  if ((f.kural || '').trim()) p2.push('kendi kuralı var');
  return p2.length ? p2.join(' · ') : 'hayır, modül kuralı geçerli';
}

/* Modül kuralları satırının özeti. */
function modulOzeti(mk, anahtar) {
  mk = mk || {};
  return (mk.kural || '').trim() || 'yok';
}

/* Sayfa modül kuralından ayrılıyor mu? */
function farkVar(k) {
  const f = (k && k.fark) || {};
  return !!((f.roller || []).length || (f.eylemler || []).length
    || Object.keys(f.yetki || {}).length || (f.kural || '').trim());
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
  if (!t.modul && t.sayfalar.length) t.modul = 'Yeni Modül';

  const kurulu = DB.modulleri(p.id).filter(m => m.ad !== GENEL_MODUL);
  const kunye  = (p.palet || {}).kunye || {};
  const acik   = t.odak && t.sayfalar.includes(t.odak) ? t.odak : null;

  const modeller = kurulu.map(m => m.ad);
  if (t.modul && !modeller.includes(t.modul)) modeller.push(t.modul);

  /* Ortak kural isteğe bağlı — "Kur"u ona bağlamak, kuralı olmayan modülü
     kurdurmuyordu. */
  const tam = t.modul && t.sayfalar.length
    && t.sayfalar.every(sf => kunyeTam(t.kunye[sf]));
  const dugmeler = t.modul ? `
    <button class="ag-dug" type="button" data-eylem="agac-anlat" data-proje="${p.id}">
      ${svg(ICON.kopya, 15)} Anlatım</button>
    <button class="ag-dug ana" type="button" ${tam ? '' : 'disabled'}
            data-eylem="yapi-kur" data-proje="${p.id}">
      ${svg(ICON.check, 15)} Kur</button>` : '';

  const basamak = [{ ad: p.firma }];
  if (t.modul) basamak.push({ ad: t.modul, eylem: 'agac-modul-ad', proje: p.id });
  if (acik) basamak.push({ ad: acik });

  /* ---------- 3 · Bir sayfanın künyesi ---------- */
  if (acik) {
    const k = yapiKunye(t, acik);
    const adimlar = kunyeAdimlari();
    const bitmis = adimlar.filter(a => kunyeAdimTam(k, a.anahtar)).length;

    const govde = agacBaslik('#4fa8c9', ICON.dosya, t.modul, acik,
                             bitmis + '/' + adimlar.length, 'tamam')
      + adimlar.map(a => agacSatir(
          DAL_RENK[a.anahtar] || '#8d8378', ICON.etiket, a.ad,
          dalOzeti(k, a.anahtar), !kunyeAdimTam(k, a.anahtar), 'agac-dal',
          `data-proje="${p.id}" data-sayfa="${esc(acik)}" data-ad="${a.anahtar}"`)).join('')
      + agacSatir('#4fa8c9', ICON.goz, 'Önizlemeyi aç',
          'Bu sayfa müşterinin ekranında nasıl görünecek?',
          false, 'agac-onizle', `data-proje="${p.id}"`)
      + `<button class="ags sil" type="button" data-eylem="agac-sayfa-sil"
                 data-proje="${p.id}" data-ad="${esc(acik)}">
          <span class="ags-ik">${svg(ICON.kapat, 14)}</span>
          <span class="ags-yz"><b>Bu sayfayı kaldır</b></span></button>`;
    return agacKabuk(p, yolCipleri(basamak), govde, dugmeler);
  }

  /* ---------- 2 · Bir modülün sayfaları ---------- */
  if (t.modul) {
    const m  = kurulu.find(x => x.ad === t.modul);
    const mk = t.mk || {};
    const bitmis = t.sayfalar.filter(sf => kunyeTam(t.kunye[sf])).length;

    const govde = agacBaslik('#c48a5c', ICON.katman,
                             m ? 'kurulu modül' : 'taslak modül', t.modul,
                             String(t.sayfalar.length), 'sayfa')
      + agacSatir('#d8a63f', ICON.gGuvenlik, 'Ortak kural',
          (mk.kural || '').trim()
            || 'bütün modülde geçerli bir kural varsa yaz — isteğe bağlı',
          false, 'agac-modul-kural', `data-proje="${p.id}"`)
      + (() => {
          /* Yirmi sayfa düz bir ızgarada aranmıyor. Öbekleri Claude veriyor
             ("Raporlar", "Ayarlar", "Panolar"): sayfa türünden daha anlamlı,
             çünkü işe göre ayırıyor. Öbek sırası Claude'un verdiği sıra —
             o da bir karar, alfabeye çevirip bozmuyoruz. Öbeğin içi ise
             alfabetik: yirmi sayfada gözle aramak ancak öyle mümkün.

             Kırmızı yalnız sıradaki sayfada: hepsi kırmızı olunca ekran
             uyarı tablosuna dönüyor ve "önce hangisi" kayboluyor. */
          const ilkEksik = t.sayfalar.findIndex(sf => !kunyeTam(t.kunye[sf]));

          const sira = [];
          const obek = {};
          t.sayfalar.forEach((sf, i) => {
            const g = ((t.kunye[sf] || {}).grup || '').trim() || 'Diğer';
            if (!obek[g]) { obek[g] = []; sira.push(g); }
            obek[g].push({ sf, i });
          });
          /* "Diğer" hep en sonda: adı konmamış olan aranan değil, kalan. */
          sira.sort((a, b) => (a === 'Diğer') - (b === 'Diğer'));

          return sira.map(g => `
            ${sayfaObekBasligi(g, obek[g].length)}
            <div class="ya-satir">
              ${obek[g].slice()
                .sort((a, b) => a.sf.localeCompare(b.sf, 'tr'))
                .map(({ sf, i }) => agacKare(
                  String(i + 1).padStart(2, '0'),
                  kunyeTam(t.kunye[sf]) ? 'bitti' : i === ilkEksik ? 'simdi' : 'eksik',
                  sf, agacSayfaAlt(t.kunye[sf] || {}), 'agac-sayfa',
                  `data-proje="${p.id}" data-ad="${esc(sf)}"`)).join('')}
            </div>`).join('')
            + sayfaObekBasligi('Ekle', 0)
            + `<div class="ya-satir">${agacKare('', 'kesik', 'Sayfa ekle', '',
                 'yapi-sayfa-yaz', `data-proje="${p.id}"`)}</div>`;
        })()
      + `<button class="ags sil" type="button" data-eylem="agac-modul-sil"
              data-proje="${p.id}" data-ad="${esc(t.modul)}">
        <span class="ags-ik">${svg(ICON.kapat, 14)}</span>
        <span class="ags-yz"><b>Modülü kaldır</b>
          <i>${bitmis}/${t.sayfalar.length} sayfa hazırdı</i></span></button>`;
    return agacKabuk(p, yolCipleri(basamak), govde, dugmeler);
  }

  /* ---------- 1 · Modüller ---------- */
  const govde = agacBaslik('#8fae4a', ICON.gAltyapi, projeAdi(p),
                           'Modüller', String(modeller.length), 'modül')
    + `<div class="ya-satir">
        ${(() => {
          const tamlik = modeller.map(ad => {
            const m  = kurulu.find(x => x.ad === ad);
            const sf = m ? DB.sayfalari(m.id) : [];
            return sf.length && sf.every(x => kunyeTam(kunye[ad + ' · ' + x.ad]));
          });
          const ilkEksik = tamlik.indexOf(false);
          return modeller.map((ad, i) => {
          const m  = kurulu.find(x => x.ad === ad);
          const sf = m ? DB.sayfalari(m.id) : [];
          return agacKare(String(i + 1).padStart(2, '0'),
            tamlik[i] ? 'bitti' : i === ilkEksik ? 'simdi' : 'eksik',
            ad, sf.length + ' sayfa', 'agac-modul-ac',
            `data-proje="${p.id}" data-ad="${esc(ad)}"`);
        }).join('');
        })()}
        ${agacKare('', 'kesik', 'Yeni modül', 'anlat, kursun', 'agac-yeni-modul',
          `data-proje="${p.id}"`)}
      </div>`;
  return agacKabuk(p, yolCipleri(basamak), govde, '');
}

/* Ağaçta bir kat yukarı: dal → sayfa → modül → firma. */
function yapiGeri(t) {
  if (t.mod === 'anlat') { t.mod = 'agac'; if (!t.sayfalar.length) t.modul = ''; return true; }
  if (t.mod === 'roller') { t.mod = 'agac'; rollariKaydet(DB.proje(rota().id)); return true; }
  if (t.mod === 'mkural') { t.mod = 'agac'; t.dal = null; return true; }
  if (t.mod === 'onizle') { t.mod = 'agac'; return true; }
  if (t.dal)   { t.dal = null; return true; }
  if (t.odak)  { t.odak = null; return true; }
  if (t.modul) { t.modul = ''; t.sayfalar = []; t.kunye = {}; return true; }
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

/* Anlat: önizleme yok, yalnız metin ve iki düğme. */
function anlatEkrani(p, t) {
  const dolu = (t.anlat || '').trim().length > 20;
  const govde = `
    ${balon('Bu modülde ne olacağını anlat. Konuşur gibi yaz — ekranlar, '
      + 'tutulacak bilgiler, neyin neyi etkilediği.',
      'Promptu Claude\'a ver; o sana sorar, anlaşınca bloğu verir.')}
    <textarea class="anl-kutu" data-anlat="${p.id}"
      placeholder="Örn. Muhasebe modülünde hesaplar sayfası olacak. 100-Kasa, 102-Banka gibi ana hesaplar, altlarında 102.01 gibi alt hesaplar…">${esc(t.anlat || '')}</textarea>
    <div class="anl-dug">
      ${dolu
        ? `<a target="_blank" rel="noopener" data-pano="cozumleme" data-proje="${p.id}"
             data-hedef="Claude Code" href="${esc(claudeAdresi(depoSlug(p.repo), false))}">
             ${svg(ICON.kopya, 15)} Kopyala ve aç</a>`
        : `<button type="button" disabled>${svg(ICON.kopya, 15)} Prompt oluştur</button>`}
      <button class="ana" type="button" data-eylem="anlat-aktar" data-proje="${p.id}">
        ${svg(ICON.ice, 15)} Cevabı yapıştır</button>
    </div>
    <p class="anl-not">Claude önce sana soru soracak. Anlaştıktan sonra verdiği bloğu
      buraya yapıştır — modül, sayfalar ve künyeler kendiliğinden kurulur.</p>`;

  return agacKabuk(p, yolCipleri([
    { ad: p.firma, eylem: 'agac-koke', proje: p.id },
    { ad: t.modul || 'Yeni modül' },
  ]), govde, '');
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
  if (t.mod === 'roller') return rolEkrani(p, t);
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

  /* Farklı mı: modül kuralından ayrılan yerler. */
  const mk = t.mk || {};
  const f  = k.fark || {};
  const roller = rolListesi((p.palet || {}).roller);
  const tabanRol = (dizi, liste) => dizi.length
    ? liste.findIndex(r => dizi.includes(r)) : -1;

  return `<div class="kunye-kaydir">
    ${balon('Bu sayfa modülün ortak kuralından ayrılıyor mu?',
            'Dokunmazsan modülün kuralı geçerli: ' + esc(modulOzeti(mk, 'roller'))
            + ' görür, ' + esc(modulOzeti(mk, 'yetki')) + '.')}

    <div class="ky-bas">Bu sayfayı kimler görsün?</div>
    <div class="rol-merdiven">${roller.map((r, i) => {
      const taban = tabanRol(f.roller || [], roller);
      const sec = taban > -1 && i >= taban;
      return `<button class="rm ${sec ? 'on' : ''} ${sec && i > taban ? 'oto' : ''}"
                      type="button" data-eylem="yapi-ky-fark-rol" ${veri} data-ad="${esc(r)}">
        <span class="rm-kat mono">${i + 1}</span>
        <span class="rm-ad"><b>${esc(r)}</b><i>${
          sec ? (i > taban ? 'üstü olduğu için' : 'bu sayfaya özel taban')
              : 'modül kuralı geçerli'}</i></span>
        <span class="rm-tik">${sec ? svg(ICON.tik, 11) : ''}</span></button>`;
    }).join('')}</div>

    ${(f.eylemler || []).length || Object.keys(f.yetki || {}).length ? `
      <div class="ky-bas">Bu sayfada işler farklı</div>
      <p class="anl-not">${esc((f.eylemler || []).map(ey =>
        ey.toLocaleLowerCase('tr') + ': ' + (((f.yetki || {})[ey] || [])[0] || '—')).join(' · '))}</p>` : ''}

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

/* Merdiven ekrandan çıkarken bir kez yazılır; değişmediyse dokunulmaz. */
async function rollariKaydet(p) {
  if (!p) return;
  const yeni = ROL_TASLAK[p.id];
  delete ROL_TASLAK[p.id];
  if (!yeni || !yeni.length) return;
  const eski = rolListesi((p.palet || {}).roller);
  if (eski.join('\u0001') === yeni.join('\u0001')) return;
  try {
    await DB.paletKaydet(p.id, Object.assign({}, p.palet || {}, { roller: yeni }));
  } catch (h) { toast(h.message, 'hata'); }
}

/* Roller — proje geneli, bir kez. Modül kurallarının "kimler görür"
   sorusu bu merdivenden besleniyor, o yüzden ağacın en tepesinde duruyor. */
function rolEkrani(p, t) {
  const roller = ROL_TASLAK[p.id] || rolListesi((p.palet || {}).roller);

  const govde = `
    <div class="bslk"><b>Roller</b><em>bütün modüllerde geçerli</em></div>
    ${balon('Bu programı kaç katman insan kullanacak?',
            'En altta en dar yetki, en üstte en geniş.')}
    ${rolMerdiveni(roller, 'yp')}
    <p class="anl-not">Sayfaları kimin göreceğini ve kimin ne yapabileceğini
      modül kurallarında bu listeden seçeceksin.</p>`;

  return agacKabuk(p, yolCipleri([
    { ad: p.firma, eylem: 'agac-koke', proje: p.id },
    { ad: 'Roller' },
  ]), `<div class="kunye-kaydir">${govde}</div>`, `
    <button class="ag-dug guclu tek geri" type="button" data-eylem="agac-koke"
            data-proje="${p.id}">${svg(ICON.tik, 14)} Bitti, ağaca dön</button>`);
}

/* Modül kuralları ekranı — üç soru, bir kez. */
function modulKuralEkrani(p, t) {
  const mk = t.mk || (t.mk = { roller: [], eylemler: [], yetki: {}, kural: '' });
  const roller = rolListesi((p.palet || {}).roller);
  const veri = `data-proje="${p.id}"`;
  const taban = (mk.roller || []).length
    ? roller.findIndex(r => mk.roller.includes(r)) : -1;

  const govde = `
    <div class="bslk"><b>Modül kuralları</b><em>her sayfada geçerli</em></div>

    <div class="ky-bas">1 · Kimler görür?</div>
    <p class="ak-ozet">Alttakini seçince üstündekiler kendiliğinden gelir.</p>
    <div class="rol-merdiven">${roller.map((r, i) => {
      const sec = taban > -1 && i >= taban;
      return `<button class="rm ${sec ? 'on' : ''} ${sec && i > taban ? 'oto' : ''}"
                      type="button" data-eylem="yapi-mk-rol" ${veri} data-ad="${esc(r)}">
        <span class="rm-kat mono">${i + 1}</span>
        <span class="rm-ad"><b>${esc(r)}</b><i>${
          sec ? (i > taban ? roller[i - 1] + '’i gördüğü için' : 'seçtiğin taban')
              : 'göremez'}</i></span>
        <span class="rm-tik">${sec ? svg(ICON.tik, 11) : ''}</span></button>`;
    }).join('')}</div>

    <div class="ky-bas">2 · Neler yapılabilir?</div>
    <div class="ky-cipler">${SAYFA_EYLEM
      .concat((mk.eylemler || []).filter(x => !SAYFA_EYLEM.includes(x))).map(x => `
      <button class="cip-sec ${(mk.eylemler || []).includes(x) ? 'on' : ''}" type="button"
              data-eylem="yapi-mk-eylem" ${veri} data-ad="${esc(x)}">${esc(x)}</button>`).join('')}
      <button class="cip-sec ekle" type="button" data-eylem="yapi-mk-eylem-yaz" ${veri}>
        ${svg(ICON.arti, 12)} Başka</button>
    </div>

    ${(mk.eylemler || []).length ? `
      <div class="ky-bas">Hangisini kim yapar?</div>
      <div class="yetki">${mk.eylemler.map(ey => {
        const secik = (mk.yetki || {})[ey] || [];
        const tb = secik.length ? (mk.roller || []).findIndex(r => secik.includes(r)) : -1;
        return `<div class="yt"><b>${esc(ey)}</b><div class="cipler">
          ${(mk.roller || []).map((r, i) => `
            <button class="${tb > -1 && i >= tb ? 'on' : ''}" type="button"
                    data-eylem="yapi-mk-yetki" ${veri} data-ey="${esc(ey)}"
                    data-ad="${esc(r)}">${esc(r)}</button>`).join('')}
        </div></div>`;
      }).join('')}</div>` : ''}

    <div class="ky-bas">3 · Ortak kural</div>
    <label class="field ky-alan">
      <input type="text" data-mk="kural" ${veri} value="${esc(mk.kural || '')}"
             maxlength="200" autocomplete="off"
             placeholder="Örn. Onaylanan kayıt değiştirilemez.">
    </label>
    <p class="anl-not">Bu üçü modülün bütün sayfalarında geçerli. Bir sayfa
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

/* Künyeyi düz Türkçe tek cümleye çeviren yer — özet ve onay ekranı bunu
   kullanıyor; AI'a giden metin de aynı cümleden besleniyor. */
function kunyeCumlesi(sf, k, uzun) {
  if (!k || !k.tur) return 'künye yok';
  const alan = (k.alanlar || []).map(a => a.ad.toLocaleLowerCase('tr'));
  const p = [];
  p.push('<b>' + esc(sf) + '</b> bir ' + esc(k.tur.toLocaleLowerCase('tr')) + ' ekranı.');
  if (k.amac) p.push(esc(k.amac));
  if (alan.length) p.push('Her kayıtta ' + esc(alan.join(', ')) + ' var.');
  if ((k.roller || []).length) {
    const en = k.roller[0];
    p.push('<b>' + esc(en) + '</b> ve üstü görüyor.');
    /* Aynı yetkiye sahip eylemler tek cümlede toplanır; tek tek yazınca
       "ekle işini Personel yapıyor, sil işini Personel yapıyor" oluyordu. */
    const grup = new Map();
    (k.eylemler || []).forEach(ey => {
      const r = ((k.yetki[ey] || k.roller)[0]) || en;
      grup.set(r, (grup.get(r) || []).concat(ey.toLocaleLowerCase('tr')));
    });
    if (grup.size === 1 && grup.has(en)) {
      p.push('Bütün işleri (' + esc([...grup.values()][0].join(', ')) + ') aynı kişi yapabiliyor.');
    } else if (grup.size) {
      p.push([...grup.entries()].map(([r, l]) =>
        esc(l.join(', ')) + ' → <b>' + esc(r) + '</b> ve üstü').join('; ') + '.');
    }
  }
  if (k.kural) p.push('<b>' + esc(k.kural) + '</b>');
  const metin = p.join(' ');
  return uzun ? metin : metin.replace(/<\/?b>/g, '');
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
  /* Rol merdiveni: katman sayısı düğmeleri kendi içinde yeniden çiziyor,
     yazılan adlar her tuşta palete yazılıyor. */
  const rolKat = $('.rol-kat[data-rol-onek="yp"]');
  if (rolKat && !rolKat.dataset.bagli) {
    rolKat.dataset.bagli = '1';
    const sar = rolKat.parentElement;
    const yaz = () => {
      const pr = DB.proje(rota().id);
      if (!pr) return;
      ROL_TASLAK[pr.id] = rolOku(sar);
    };
    rolBagla(sar);
    sar.addEventListener('input', yaz);
    sar.addEventListener('click', ev => {
      if (ev.target.closest('[data-rol-sayi]')) setTimeout(yaz, 0);
    });
  }

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
  $$('[data-ky]').forEach(el => {
    if (el.dataset.bagli) return;
    el.dataset.bagli = '1';
    el.addEventListener('input', () => {
      const pr = DB.proje(el.dataset.proje);
      if (!pr) return;
      const t = yapiTaslak(pr);
      if (el.dataset.ky === 'farkKural') {
        const k = yapiKunye(t, el.dataset.sayfa);
        k.fark = k.fark || { roller: [], eylemler: [], yetki: {}, kural: '' };
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
  const roller = rolListesi((pr.palet || {}).roller);
  const durum = !kunyeAdimTam(k, t.dal) ? 'eksik'
    : (t.dal === 'fark' && !farkVar(k)) ? 'bos' : 'tamam';
  dug.classList.remove('eksik', 'tamam', 'bos');
  dug.classList.add(durum);
  const alt = $('.yz i', dug);
  if (alt) alt.textContent = dalOzeti(k, t.dal);
}

/* 5 · Geliştirme — iki ayrı yön.
   Beta çıktıktan sonra gelen istekler iki türlü olur: yalnız bu programı
   ilgilendiren iş (görev açılır) ve "bütün programlarda böyle olsun" isteği
   (Studio'nun standardına girer, oradan her programa yayılır).
   Üçüncü kart o yayılımın bu programa düşen ucudur. */
function gelistirmeSayfasi(p, d) {
  const s = DB.sayim(p.id);
  const gorevler = DB.gorevleri({ proje: p.id });
  const dev  = gorevler.filter(g => g.durum === 'gelistiriliyor').length;
  const kont = gorevler.filter(g => g.durum === 'kontrolde').length;
  const yeniStd = yeniStandartlar(p.palet);

  return sayfaHero(p, d) + `
    <div class="ikili">
      <div class="tkutu"><span class="ik">${svg(ICON.kalem, 14)}</span><b>Geliştiriliyor</b>
        <u style="color:var(--st-dev-t)">${dev}</u></div>
      <div class="tkutu"><span class="ik">${svg(ICON.check, 14)}</span><b>Kontrolde</b>
        <u style="color:var(--st-check-t)">${kont}</u></div>
    </div>

    <div class="takvim" style="${renkDegiskenleri(p.renk)}">
      <div class="tk-ust"><b>${s.bitmis}/${s.gorev} görev bitti</b><em>%${s.yuzde}</em></div>
      <div class="ray"><i style="width:${s.yuzde}%"></i><b style="left:${s.yuzde}%"></b></div>
    </div>`

    + (yeniStd.length ? durakKarti('!', false,
        yeniStd.length > 1 ? `${yeniStd.length} yeni standart` : 'Yeni standart',
        'Bu program kurulduktan sonra Nizam standardına eklendi. Promptu ver, '
        + 'Claude önce <b class="mono">NIZAM.md</b>\'yi sonra kodu güncellesin.', `
      <div class="std-liste">
        ${yeniStd.map(st => `
          <div class="std-satir"><b>${esc(st.alan)}</b><span>${esc(st.ad)}</span></div>`).join('')}
      </div>
      <div class="kur-dug">
        ${promptBaglantisi({ tur: 'standart', proje: p.id, slug: depoSlug(p.repo),
          yazi: 'Kopyala ve Claude Code\'da aç' })}
      </div>
      <button class="promptu-gor" type="button" data-eylem="standart-goruldu"
              data-proje="${p.id}">Bu programda gerekmiyor, gördüm</button>`) : '')

    + durakKarti(1, false, 'Bütün programlarda olsun',
        'Gördüğün eksik yalnız bu programın değilse — "hiçbir uygulamada '
        + 'yakınlaştırma olmasın" gibi — buradan söyle. İstek Studio\'nun teknik '
        + 'standardına girer, bundan sonraki her program onunla doğar; '
        + 'mevcut programlar da bu durakta haberi alır.', `
      <div class="kur-dug">
        <button class="sayfa-dug ikincil" type="button" data-eylem="studio-istek">
          ${svg(ICON.kalem, 15)} Studio geliştirmesi yaz</button>
      </div>
      <div class="kur-deger duz">${svg(ICON.katman, 13)} Hedef depo <b class="mono">${esc(APP.depo)}</b></div>`)

    + durakKarti(2, s.gorev > 0, 'Yalnız bu programda olsun',
        'Betayı denerken gördüğün eksikler. Her biri bir görev; görevden '
        + `<b class="mono">[${TASK_PREFIX}-x]</b> etiketli prompt çıkar.`, `
      <div class="kur-dug">
        <button class="sayfa-dug ${yeniStd.length ? 'ikincil' : ''}" type="button"
                data-eylem="gorev-ekle" data-proje="${p.id}">
          ${svg(ICON.arti, 15)} Görev ekle</button>
      </div>`)

    + bolumBas('Açık işler')
    + (gorevler.length
        ? `<div class="card liste">${gorevler.slice(0, 12).map(gorevKarti).join('')}</div>`
        : `<div class="bos-kutu">${svg(ICON.check, 18)}
            <span>Henüz görev yok. Yukarıdaki <b>Görev ekle</b> ile aç ya da
            Yapı durağında sayfadan başla.</span></div>`);
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

/* Modül adı: "Kişisel Bütçe" gibi ürün adı. Depo adına ve bütün
   başlıklara firmanın yanına tireyle ekleniyor. */
function modulAdiSor(p) {
  return metinSor({
    baslik: 'Modül adı',
    aciklama: 'Firmanın yanına tireyle eklenir: ' + p.firma + ' - …',
    deger: modulAdi(p),
    yerTutucu: 'Örn. Kişisel Bütçe',
    buton: 'Kaydet',
  });
}

/* Proje ekranından modül silme. Ağaçtaki yolla aynı işi yapsın diye
   ortak: görev kontrolü, onay, palet temizliği. */
async function modulKaldir(el, id) {
  const modul = DB.moduller.find(m => m.id === id);
  const pr = modul ? DB.proje(modul.proje_id) : null;
  const ad = el.dataset.ad || (modul && modul.ad) || 'Modül';

  if (pr) {
    const gorev = modulGorevSayisi(pr, id);
    if (gorev) return toast('Bu modülde ' + gorev + ' görev var, önce onları taşı.', 'hata');
  }
  if (!await onaySor({
    baslik: 'Modül silinsin mi?',
    mesaj: `"${ad}" modülü, sayfaları ve künyeleri silinecek. Bu işlem geri alınamaz.`,
  })) return;

  ACIK_MODUL.delete(id);
  return isYap(async () => {
    await DB.modulSil(id);
    if (pr) await modulPaletTemizle(pr, ad);
  }, 'Modül silindi.');
}

/* Modül silinince palet üç yerde iz bırakıyor: sayfa künyeleri, anlatım
   ve modül kuralları. Temizlenmezse silinmiş modül prompta yazılmaya
   devam ediyor — kunyeBlogu palete bakıyor, veritabanına değil. */
async function modulPaletTemizle(pr, ad) {
  const pl = Object.assign({}, pr.palet || {});
  const kn = Object.assign({}, pl.kunye || {});
  Object.keys(kn).forEach(x => { if (x.startsWith(ad + ' · ')) delete kn[x]; });
  const an = Object.assign({}, pl.anlatim || {});
  delete an[ad];
  const mkh = Object.assign({}, pl.modulKunye || {});
  delete mkh[ad];
  await DB.paletKaydet(pr.id, Object.assign(pl, { kunye: kn, anlatim: an, modulKunye: mkh }));
}

/* Modülde görev varsa silme: görevler yetim kalır (modul_id null'a düşer). */
function modulGorevSayisi(pr, modulId) {
  return DB.gorevleri({ proje: pr.id }).filter(g => g.modul_id === modulId).length;
}

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

async function yayinAdresiTamamla(p) {
  const adres = pagesAdresi(p);
  if (!adres) return;
  await isYap(() => DB.paletKaydet(p.id,
    Object.assign({}, p.palet || {}, { alanAdi: adres })),
    'Yayın adresi yazıldı: ' + adres);
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

/* Beta, Final ve Güncellemeler kartları — kurulum kartlarıyla aynı dil. */
function durakKarti(no, bitti, ad, aciklama, govde, rozet) {
  return `
    <div class="kur-kart ${bitti ? 'bitti' : ''}">
      <div class="kur-bas">
        <span class="kur-no">${bitti ? svg(ICON.tik, 12) : no}</span>
        <b>${esc(ad)}</b>
        <span class="kur-rozet">${esc(rozet || (bitti ? 'tamam' : 'sırada'))}</span>
      </div>
      <p>${aciklama}</p>
      ${govde}
    </div>`;
}

/* 4 · Beta — ilk çalışan sürüm. Son blok gider, Claude kurar, sen denersin. */
function betaSayfasi(p, d) {
  const pl = p.palet || {};
  const cikti = !!pl.betaCikti;
  const slug = depoSlug(p.repo);
  /* Künye Yapı durağındaki "Kur" ile yazılıyor; yoksa blok yarım çıkar. */
  const kunyeVar = Object.keys(pl.kunye || {}).length > 0;

  const yayin = pl.alanAdi || '';

  return sayfaHero(p, d)
    /* Alan adı ve Pages kurulumu 1. aşamaya taşındı: DNS'in yayılması ve
       sertifikanın çıkması zaman aldığı için erken kurulması gerekiyor.
       Burada yalnız sonucu gösteriyoruz. */
    + (yayin ? `
      <div class="kur-deger duz">${svg(ICON.bulut, 13)} Yayın adresi
        <b class="mono"><a target="_blank" rel="noopener"
          href="https://${esc(yayin)}">${esc(yayin)}</a></b></div>` : `
      <div class="bos-kutu">${svg(ICON.bulut, 18)}
        <span>Yayın adresi yok. <b>Firma ve kurulum</b> durağındaki
        <b>Yayın</b> adımlarını tamamla — DNS'in yayılması zaman alıyor,
        erken kurmak lazım.</span></div>`)

    + durakKarti(1, cikti, '3. blok: modüller ve sayfalar',
        (kunyeVar
          ? 'Sayfa künyeleri, modül kuralları ve beş aşamalı kurulum talimatı '
            + 'panoya alınır. Claude Code oturumuna yapıştır — kod bu blokla başlar.'
          : '<b class="eksik">Sayfa künyesi yok.</b> Önce <b>Yapıyı kurma</b> '
            + 'durağında modülü kur; blok o zaman dolu çıkar.')
        + (yayin ? '' : ' <b class="eksik">Önce yayın adresini kaydet</b> — '
            + 'Claude uygulamayı hangi adrese kuracağını bilmeli.'), `
      <div class="kur-dug">
        ${promptBaglantisi({ tur: 'yapi', proje: p.id, slug: depoSlug(p.repo),
          ikincil: !(kunyeVar && yayin),
          yazi: '3. blok — kopyala ve Claude Code\'da aç', kapali: !yayin })}
      </div>
      <button class="promptu-gor" type="button" data-eylem="yapi-blok-gor"
              data-proje="${p.id}">Bloğu gör</button>`)

    + durakKarti(2, cikti, 'Beta çıktı',
        'Claude beş aşamayı bitirip <b class="mono">main</b> dalına gönderdiğinde '
        + 'uygulamayı dene. Gördüğün eksikleri not al — sonraki durakta görev olarak '
        + 'açacaksın.', `
      <label class="kur-onay ${cikti ? 'on' : ''}" data-eylem="beta-onay"
             data-proje="${p.id}" role="button" tabindex="0">
        <span class="kur-kutu">${svg(ICON.tik, 12)}</span> Beta çıktı, denedim</label>`)

    + `<div class="note note-kucuk">${svg(ICON.info, 15)}
        <span>Studio deponun içini göremiyor; beta çıktığını sen işaretliyorsun.</span></div>`;
}

/* 6 · Final — görevler bitti, teslim. */
function finalSayfasi(p, d) {
  const pl = p.palet || {};
  const verildi = !!pl.finalVerildi;
  const s = DB.sayim(p.id);
  const hazir = s.gorev > 0 && s.bitmis === s.gorev;

  return sayfaHero(p, d) + `
    <div class="takvim" style="${renkDegiskenleri(p.renk)}">
      <div class="tk-ust"><b>${s.bitmis}/${s.gorev} görev bitti</b><em>%${s.yuzde}</em></div>
      <div class="ray"><i style="width:${s.yuzde}%"></i><b style="left:${s.yuzde}%"></b></div>
    </div>`
    + durakKarti(1, verildi, 'Final sürüm',
        hazir || verildi
          ? 'Bütün görevler bitti. Son bir kez dene, sonra müşteriye teslim et.'
          : '<b class="eksik">Önce açık görevleri bitir.</b> Final, geliştirme '
            + 'durağındaki bütün görevler tamamlandığında verilir.', `
      <label class="kur-onay ${verildi ? 'on' : ''} ${hazir || verildi ? '' : 'pasif'}"
             ${hazir || verildi ? `data-eylem="final-onay" data-proje="${p.id}"
             role="button" tabindex="0"` : ''}>
        <span class="kur-kutu">${svg(ICON.tik, 12)}</span> Final sürüm verildi</label>`)

    + `<div class="note note-kucuk">${svg(ICON.info, 15)}
        <span>Finalden sonra gelen istekler <b>Güncellemeler</b> durağında yürür.</span></div>`;
}

/* 7 · Güncellemeler — proje yaşadıkça açık kalan durak. */
function guncellemeSayfasi(p, d) {
  const gorevler = DB.gorevleri({ proje: p.id }).filter(g => g.durum !== 'tamamlandi');

  return sayfaHero(p, d)
    + bolumBas('Depo') + `
      <div class="satirlar">
        <div class="sr" data-eylem="repo" data-proje="${p.id}" role="button" tabindex="0">
          ${svg(ICON.katman, 15)} Adres
          ${p.repo ? `<b class="mono">${esc(p.repo)}</b>` : '<b class="eksik">eklenmedi</b>'}</div>
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
        <span class="pk-ad">${esc(projeAdi(p))}</span>
        <span class="pk-alt">${alt}</span>
      </span>
      <span class="pk-yuz"><b>%${s.yuzde}</b><i>tamam</i></span>
    </div>`;
}

/* Projenin beş durağı. Durum veriden okunur, elle girilmez. */
function projeDuraklari(p) {
  const s        = DB.sayim(p.id);
  const moduller = DB.modulleri(p.id);
  const gercek   = moduller.filter(m => m.ad !== GENEL_MODUL).length;
  /* Tasarım artık paletle değil tarifle bitiyor: tarif geldi ve tarifin
     istediği bütün görseller yuvalara kondu mu? */
  const pl0     = p.palet || {};
  const yuva    = pl0.gorseller || [];
  const gorselTam = yuva.length > 0 && yuva.every(y => y.yol);
  const tarifVar = !!String(pl0.tarif || '').trim() && gorselTam;

  return [
    {
      /* Logo isteğe bağlı: markanın kendisi ad, iletişim ve sektörle kuruluyor. */
      ad: 'Marka kimliği',
      bitti: !!p.firma && !!p.telefon && !!p.eposta && !!p.sektor,
      ozet: [p.sektor, p.telefon, p.eposta].filter(Boolean).join(' · ')
        || 'Firma kim, kime ulaşacağız, hangi işi yapıyor?',
    },
    {
      /* Modül tek başına yetmez: sayfası olmayan modül boş kutudur.
         Depo ve sohbet de burada — kurulum bu durağın işi. */
      ad: 'Kurulum ve yapı',
      bitti: !!p.repo && !!String(pl0.sohbetAdi || '').trim()
             && gercek > 0 && s.sayfa > 0,
      ozet: gercek && s.sayfa
        ? `${gercek} modül · ${s.sayfa} sayfa`
        : p.repo
          ? 'Depo hazır. Sıra modülleri kurmakta.'
          : 'Ürünü tarif et, rolleri belirle, depoyu kur, modülleri ekle.',
    },
    {
      ad: 'Tasarımı belirleme',
      bitti: tarifVar,
      rozet: yeniKararlar(p.palet).length,
      ozet: tarifVar
        ? 'Görsel dil hazır · ' + yuva.length + ' görsel.'
        : String(pl0.tarif || '').trim()
          ? 'Tarif geldi. Sıra görselleri yuvalara koymakta.'
          : gercek
          ? 'İşletme görselini yükle, promptu ChatGPT\'ye ver, tarifi yapıştır.'
          : 'Önce modülü kur — ChatGPT neyi tasarlayacağını künyeden okuyor.',
    },
    {
      ad: 'Beta',
      bitti: !!(p.palet && p.palet.betaCikti),
      ozet: (p.palet && p.palet.betaCikti)
        ? 'Beta çıktı, denendi.'
        : 'Son bloğu Claude\'a ver, ilk çalışan sürümü kursun; sen dene.',
    },
    {
      ad: 'Geliştirme',
      bitti: s.gorev > 0 && s.bitmis === s.gorev,
      rozet: yeniStandartlar(p.palet).length,
      ozet: s.gorev
        ? `${s.bitmis}/${s.gorev} görev bitti`
        : 'Betayı denerken gördüğün eksikleri görev olarak aç.',
    },
    {
      ad: 'Final',
      bitti: !!(p.palet && p.palet.finalVerildi),
      ozet: (p.palet && p.palet.finalVerildi)
        ? 'Final sürüm verildi.'
        : 'Bütün görevler bitince final sürümü teslim et.',
    },
    {
      /* Bilerek hiç bitmiyor: proje yaşadıkça yeni istek gelir. */
      ad: 'Güncellemeler',
      bitti: false,
      ozet: 'Finalden sonra gelen istekler burada yürür.',
    },
  ];
}

/* Her durağın simgesi. Hepsi aynı simgeyle dururken kartlar birbirinden
   ayırt edilemiyordu. */
/* Bir durak kilitli mi: kendinden önceki bitmemiş bir durak varsa evet. */
function durakKilitli(projeId, anahtar) {
  const p = DB.proje(projeId);
  if (!p) return false;
  const sira = Object.keys(DURAKLAR).indexOf(anahtar);
  if (sira < 1) return false;
  const duraklar = projeDuraklari(p);
  const simdi = duraklar.findIndex(d => !d.bitti);
  return simdi !== -1 && sira > simdi;
}

const DURAK_IKON = ['kisi', 'gAltyapi', 'gTasarim', 'goz', 'kalem', 'bayrak', 'saat'];

/* Aşama kartı: kare, yeri sabit. Zigzag merdivende kartlar ilerledikçe yer
   değiştiriyordu; gözün aradığı aşamayı her seferinde yeniden bulmak
   gerekiyordu. Burada 01 hep sol üstte. */
function asamaKarti(p, d, i, simdi, anahtar) {
  const su      = i === simdi;
  const kilitli = simdi !== -1 && i > simdi;
  const hal     = d.bitti ? 'bitti' : su ? 'simdi' : 'kilitli';
  const ikon    = d.bitti ? ICON.tik : su ? ICON.goz : ICON.kilit;

  const ic = `
    <span class="ya-ust">
      <span class="ya-no mono">${String(i + 1).padStart(2, '0')}${
        d.rozet ? `<span class="ya-rozet">${d.rozet}</span>` : ''}</span>
      <span class="ya-dur">${svg(ikon, 13)}</span>
    </span>
    <span class="ya-yz">
      <span class="ya-ad">${esc(d.ad)}</span>
      <span class="ya-alt">${d.bitti ? 'tamam' : su ? 'şimdi burada' : 'kilitli'}</span>
    </span>`;

  /* Kilitli adım bağlantı bile değil: adresle de açılmıyor. */
  return kilitli
    ? `<span class="ya ${hal}">${ic}</span>`
    : `<a class="ya ${hal}" href="#/projeler/${p.id}/${anahtar}">${ic}</a>`;
}

/* İki satır arasındaki dirsek: üst satırın sonundan alt satırın başına.
   Izgara sabit olduğu için ok da sabit — ölçmeye gerek yok. */
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
  const duraklar = projeDuraklari(p);
  /* Şimdiki durak: bitmemiş ilk durak. Hepsi bitmişse -1. */
  const simdi = duraklar.findIndex(d => !d.bitti);
  const anahtarlar = Object.keys(DURAKLAR);
  const biten = duraklar.filter(d => d.bitti).length;
  const yuzde = Math.round(biten / duraklar.length * 100);

  const kart = i => asamaKarti(p, duraklar[i], i, simdi, anahtarlar[i]);
  const son  = duraklar.length - 1;   /* Güncellemeler: proje yaşadıkça açık */

  /* Üç sütun, kareler aynı ölçüde. Son satır tek kart: soldan başlıyor,
     yol soldan sağa akmaya devam ediyor. */
  return projeKunyesi(p)
    + fbTakvimSeridi(p)
    + `<div class="ya-harita">
      <div class="ya-satir">${[0, 1, 2].map(kart).join('')}</div>
      ${yolOku(duraklar[2] && duraklar[2].bitti)}
      <div class="ya-satir">${[3, 4, 5].map(kart).join('')}</div>
      ${yolOku(duraklar[5] && duraklar[5].bitti)}
      <div class="ya-satir">${kart(son)}</div>
    </div>

    <div class="genel">
      <div class="genel-ust"><b>Adımlar</b><u class="mono">%${yuzde}</u></div>
      <div class="genel-ray"><i style="width:${yuzde}%"></i></div>
      <div class="genel-alt mono">${biten} / ${duraklar.length} tamamlandı</div>
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

function modulKarti(m, i = 0) {
  const s     = DB.modulSayim(m.id);
  const acik  = ACIK_MODUL.has(m.id);
  const sayfalar = DB.sayfalari(m.id);

  return `
    <div class="card modul ${m.genel ? 'modul-genel' : ''}" style="--i:${i}">
      <div class="modul-bas ${acik ? 'acik' : ''}" data-eylem="modul-ac" data-id="${m.id}" role="button" tabindex="0">
        <span class="chev">${svg(ICON.chevron, 15)}</span>
        <span class="modul-ikon">${svg(m.genel ? ICON.kova : ICON.katman, 16)}</span>
        <span class="modul-yazi">
          <span class="modul-ad">${esc(m.ad)}</span>
          <span class="modul-alt">${m.genel
            ? `Modüle bağlanmayan işler · ${s.gorev} görev`
            : `${s.sayfa} sayfa · ${s.gorev} görev`}</span>
        </span>
        <span class="modul-bar">
          <span class="bar"><i style="width:${s.yuzde}%"></i></span>
          <span class="modul-pct mono">%${s.yuzde}</span>
        </span>
        ${AUTH.yonetici && !m.genel ? `<button class="mini-btn" data-eylem="modul-menu" data-id="${m.id}"
          data-ad="${esc(m.ad)}" type="button" aria-label="Modül seçenekleri">${svg(ICON.nokta, 15)}</button>` : ''}
      </div>

      ${acik ? `
        <div class="sayfalar">
          ${m.genel ? kovaGorevleri(m) : ''}
          ${sayfalar.map(sf => sayfaSatiri(sf)).join('')}

          ${!sayfalar.length && !m.genel
            ? `<div class="sayfa-bos">Henüz sayfa yok.</div>` : ''}

          ${AUTH.yonetici && !m.genel ? `
            <div class="sayfa-ekle" data-eylem="sayfa-ekle" data-id="${m.id}" role="button" tabindex="0">
              ${svg(ICON.arti, 14)}<span>Sayfa ekle</span>
            </div>` : ''}

        </div>` : ''}
    </div>`;
}

/* Bir sayfa satırı ve — açıksa — altındaki görevler */
function sayfaSatiri(sf) {
  const s     = DB.sayfaSayim(sf.id);
  const acik  = ACIK_SAYFA.has(sf.id);
  const gorevler = DB.gorevleri({ sayfa: sf.id });

  return `
    <div class="sayfa ${acik ? 'acik' : ''}" data-eylem="sayfa-ac" data-id="${sf.id}" role="button" tabindex="0">
      <span class="sayfa-chev">${svg(ICON.chevron, 12)}</span>
      <span class="sayfa-nokta" style="background:${sayfaRengi(gorevler)}"></span>
      <span class="sayfa-ad">${esc(sf.ad)}</span>
      <span class="sayfa-say mono">${s.bitmis}/${s.gorev}</span>
      ${AUTH.yonetici ? `<button class="mini-btn" data-eylem="sayfa-sil" data-id="${sf.id}"
         data-ad="${esc(sf.ad)}" type="button" aria-label="Sayfayı sil">${svg(ICON.cop, 14)}</button>` : ''}
    </div>
    ${acik ? `
      ${gorevler.map(g => gorevSatiri(g)).join('')}
      ${!gorevler.length ? `<div class="gorev-bos">Bu sayfada görev yok.</div>` : ''}
      ${AUTH.yonetici ? `
        <div class="gorev-ekle" data-eylem="gorev-ekle" data-sayfa="${sf.id}" data-modul="${sf.modul_id}"
             role="button" tabindex="0">${svg(ICON.arti, 13)}<span>Görev ekle</span></div>` : ''}
    ` : ''}`;
}

/* "Proje Geneli" kovası — sayfası yok, doğrudan görev alır */
function kovaGorevleri(m) {
  const gorevler = DB.gorevleri({ modul: m.id });
  return `
    ${gorevler.map(g => gorevSatiri(g)).join('')}
    ${!gorevler.length ? `<div class="gorev-bos">Bu kova sayfa tutmaz — modüle bağlanamayan işler buraya düşer.</div>` : ''}
    ${AUTH.yonetici ? `
      <div class="gorev-ekle" data-eylem="gorev-ekle" data-modul="${m.id}" role="button" tabindex="0">
        ${svg(ICON.arti, 13)}<span>Görev ekle</span></div>` : ''}`;
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

function stepRow(step, text, done) {
  return `<div class="row">
    <div class="row-main"><span class="row-title">${step}</span><span class="row-sub">${text}</span></div>
    <span class="pill ${done ? 'done' : ''}">${done ? 'Tamamlandı' : 'Bekliyor'}</span>
  </div>`;
}

/* ==========================================================================
   ÇİZİM
   ========================================================================== */

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
     projenin yol haritasına düşülüyor. */
  if (sayfa && durakKilitli(id, sayfa)) {
    location.replace('#/projeler/' + id);
    sayfa = null;
  }

  /* Tasarım durağından çıkıldıysa kip haritaya döner: geri gelindiğinde
     yarım kalan adımın içine değil, haritanın başına düşülsün. */
  if (sayfa !== 'tasarim') {
    Object.keys(TASARIM_MOD).forEach(k => { delete TASARIM_MOD[k]; });
    Object.keys(IHTIYAC_EKRAN).forEach(k => { delete IHTIYAC_EKRAN[k]; });
  }

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
  } else {
    baslik.textContent = ROUTES[key].kisa || ROUTES[key].title;
  }

  hesapMenusuKapat();
  /* Zemin fotoğrafı yalnızca Panel'de. Sayfa değişince koyuluk sıfırlanır,
     yoksa panele döndüğünde fotoğraf kararmış geliyor. */
  $('#main').classList.toggle('susulu', key === 'panel' && !detay);
  /* Adım akışları kaydırılmaz: üç parça ekrana bölüşür. Yapı durağı ancak
     akış açıkken sabit; kurulu modül listesi normal kaydırılan sayfadır. */
  $('#view').classList.toggle('sabit',
    sayfa === 'tasarim' || sayfa === 'yapi');
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
  const yatay = gecis ? [] : $$('.raf', view).map(r => r.scrollLeft);

  view.innerHTML = sayfa ? durakSayfasi(id, sayfa)
                 : kova  ? VIEWS.projeKovasi(kova)
                 : detay ? VIEWS.projeDetay(id)
                 : VIEWS[key]();
  view.scrollTop = dikey;
  if (yatay.length) $$('.raf', view).forEach((r, i) => { r.scrollLeft = yatay[i] || 0; });
  view.classList.remove('swap');

  if (gecis) {
    void view.offsetWidth;
    view.classList.add('swap');
    sayaclariCanlandir(view);
  }

  $$('[data-route]').forEach(el => el.classList.toggle('active', el.dataset.route === key));

  logolariGoster();
  if (kaydirmaYeri) {
    const yeni = $('.dk-govde, .kunye-kaydir, .ozet-kaydir, .palet-kaydir');
    if (yeni) yeni.scrollTop = kaydirmaYeri;
  }
  onizlemeSigdir();
  /* Bir kare sonra bir daha: sayfa geçiş animasyonu sürerken ölçülen kutu
     gerçek boyunda olmuyor, önizleme gereksiz yere küçülüyordu. */
  requestAnimationFrame(onizlemeSigdir);
  yapiBaglari();
  yolIziKaydir();
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

  $('#sidebar .nav').innerHTML = gorunur.map(m => `
    <a class="nav-item" href="#/${m.id}" data-route="${m.id}" draggable="false">
      ${svg(ICON[m.ikon], 18)}
      <span>${esc(m.ad)}</span>
      ${m.sayac ? `<em class="nav-count" data-count="${m.sayac}">0</em>` : ''}
    </a>`).join('');

  const sekmeler = gorunur.filter(m => m.tab).map(m => `
    <a class="tab" href="#/${m.id}" data-route="${m.id}" draggable="false">
      ${svg(ICON[m.ikon], 23)}
      <span>${esc(m.tabAd || m.ad)}</span>
    </a>`);

  /* Ortadaki artı sekme değil, eylem. Çift sayıda sekmede tam ortaya oturur. */
  sekmeler.splice(Math.floor(sekmeler.length / 2), 0, `
    <div class="tab-arti">
      <button id="arti" class="arti-btn hidden" type="button" aria-label="Yeni">
        <svg viewBox="0 0 24 24"><path d="M12 5v14M5 12h14"></path></svg>
      </button>
    </div>`);

  $('#tabbar').innerHTML = sekmeler.join('');
}

function sayaclariYaz() {
  const pr = $('[data-count="projeler"]');
  if (pr) pr.textContent = DB.projeler.length;

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
  return DB.sektorler.length + ' sektör';
}

function sektorSatiri(x, i = 0) {
  const m = x.moduller || [];
  return `
    <div class="row" style="--i:${i}" data-eylem="sektor-duzenle" data-id="${x.id}"
         role="button" tabindex="0">
      <div class="row-main">
        <span class="row-title">${esc(x.ad)}</span>
        <span class="row-sub">${m.length ? m.join(' · ') : 'modül önerisi yok'}</span>
      </div>
      <span class="row-val">${svg(ICON.chevron, 15)}</span>
    </div>`;
}

function sablonAltBaslik() {
  if (YUKLENIYOR) return 'yükleniyor…';
  const n = DB.modulSablonlari().length;
  const sf = DB.modulSablonlari().reduce((t, m) => t + (m.sayfalar || []).length, 0);
  return `${n} modül · ${sf} sayfa`;
}

/* Bir modül şablonu. Açılınca sayfaları listelenir. */
function sablonKarti(m, i = 0) {
  const anahtar = m.id || m.ad;
  const acik = ACIK_SABLON === anahtar;
  const sayfalar = m.sayfalar || [];

  return `
    <div class="card modul" style="--i:${i}">
      <div class="modul-bas ${acik ? 'acik' : ''}" data-eylem="sablon-ac" data-ad="${esc(anahtar)}"
           role="button" tabindex="0" aria-expanded="${acik}">
        <span class="chev">${svg(ICON.chevron, 15)}</span>
        <span class="modul-ikon">${svg(ICON.katman, 16)}</span>
        <span class="modul-yazi">
          <span class="modul-ad">${esc(m.ad)}</span>
          <span class="modul-alt">${sayfalar.length} sayfa</span>
        </span>
      </div>

      ${acik ? `
        <div class="sayfalar">
          ${sayfalar.length
            ? sayfalar.map(sf => `<div class="sayfa">${svg(ICON.nokta || ICON.chevron, 13)}
                <span class="sayfa-ad">${esc(sf)}</span></div>`).join('')
            : '<div class="sayfa"><span class="sayfa-ad ipucu">Sayfa tanımlı değil.</span></div>'}
        </div>
        ${AUTH.yonetici ? `
          <div class="modul-araclar">
            <button class="mini-link" data-eylem="sablon-duzenle" data-id="${m.id}" type="button">
              ${svg(ICON.kalem, 13)} Düzenle</button>
            <button class="mini-link tehlike" data-eylem="sablon-sil" data-id="${m.id}"
                    data-ad="${esc(m.ad)}" type="button">${svg(ICON.cop, 13)} Kaldır</button>
          </div>` : ''}` : ''}
    </div>`;
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
  const n = DB.projeler.length;
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
  firma: '',
  sektor: '',
  renk: 'yesil',
  /* Logo dosyası bellekte tutuluyor; proje kurulduktan sonra yükleniyor,
     çünkü dosya adı projenin kimliği. */
  logo: null,
  logoOnizleme: '',
  yetkili: '',
  telefon: '',
  eposta: '',
  platform: 'ikisi',
  veri: 'sifirdan',
  dil: 'tr',
  para: 'TRY',
  roller: ['Personel', 'Yönetici'],
  baslangic: '',
  teslim: '',
  moduller: [],
  kaydediyor: false,
};

/* Sihirbaz tek soru soruyor: firma adı. Beş adımlık form kullanıcıyı
   yoruyordu ve geçiştirme cevapları geliyordu — sektör "yok", takvim boş.
   Gerisi Firma sayfasında, kart kart, gerekçesiyle birlikte soruluyor. */
const SIHIRBAZ_ADIM = 1;

function sihirbaziAc() {
  modalHepsiniKapat();
  Object.assign(SIHIRBAZ, {
    adim: 1, firma: '', sektor: '', renk: 'yesil',
    logo: null, logoOnizleme: '',
    yetkili: '', telefon: '', eposta: '',
    platform: 'ikisi', veri: 'sifirdan',
    dil: 'tr', para: 'TRY',
    roller: ['Personel', 'Yönetici'],
    baslangic: bugunTarih(), teslim: '',
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
  SIHIRBAZ.logo = null;
  SIHIRBAZ.logoOnizleme = '';
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

function sihirbazHtml() {
  const govde = sihirbazFirma();

  return `
    <div class="sh-tepe">
      <button class="sh-kapat" data-sb="kapat" type="button" aria-label="Kapat">
        ${svg(ICON.kapat, 15)}
      </button>
      <span class="sh-ad">Yeni Proje</span>
    </div>

    <div class="sh-sayfa">
      <div class="sh-icerik">${govde}</div>

      <div class="sh-dip">
        <button class="btn btn-ghost" data-sb="kapat" type="button">Vazgeç</button>
        <button class="btn btn-primary" data-sb="kaydet" type="button">
          <span>Projeyi kur</span>
        </button>
      </div>
    </div>`;
}

function shBaslik(ikon, baslik, alt) {
  return `
    <div class="sh-bas">
      <span class="sh-rozet">${svg(ikon, 22)}</span>
      <span><h2>${esc(baslik)}</h2><p>${alt}</p></span>
    </div>`;
}

/* Tek soru. Sektör, logo, renk, yetkili, takvim, platform ve modüller
   Firma sayfasındaki kartlara taşındı — orada niçin sorulduğu da yazıyor. */
function sihirbazFirma() {
  return shBaslik(ICON.folder, 'Firma',
    'Tek şey soruyoruz. Gerisini proje sayfasında, adım adım dolduracaksın.') + `
    <label class="field">
      <span>Firma adı</span>
      <input type="text" id="sb-firma" value="${esc(SIHIRBAZ.firma)}"
             placeholder="Örn. Aydın Yapı" autocomplete="off" maxlength="60">
    </label>
    <p class="ipucu">Sektör, platform, yetkili ve takvim sonraki ekranda —
      her biri niçin gerektiğiyle birlikte.</p>`;
}

function sihirbazBagla(kutu) {
  const yaz = () => {
    const al = id => { const e = $('#' + id, kutu); return e ? e.value : null; };
    if (al('sb-firma')     !== null) SIHIRBAZ.firma     = al('sb-firma');
    if (al('sb-yetkili')   !== null) SIHIRBAZ.yetkili   = al('sb-yetkili');
    if (al('sb-telefon')   !== null) SIHIRBAZ.telefon   = al('sb-telefon');
    if (al('sb-eposta')    !== null) SIHIRBAZ.eposta    = al('sb-eposta');
    if ($('.rol-kat', kutu))         SIHIRBAZ.roller    = rolOku(kutu);
    if (al('sb-baslangic') !== null) SIHIRBAZ.baslangic = al('sb-baslangic');
    if (al('sb-teslim')    !== null) SIHIRBAZ.teslim    = al('sb-teslim');
  };

  rolBagla(kutu);

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
    await DB.sektorKaydet(null, { ad: ad.trim(), moduller: SIHIRBAZ.moduller.slice() });
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
  if (btn) btn.textContent = 'Kuruluyor…';

  try {
    const sablonlar = DB.modulSablonlari();
    const moduller = SIHIRBAZ.moduller.map(ad => sablonlar.find(m => m.ad === ad)).filter(Boolean);

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

    /* Roller tasarım kararlarıyla aynı yerde saklanıyor; ayrı sütun gerekmez.
       Görülen sürüm de burada damgalanıyor: yeni proje bugünün kararlarıyla
       kuruluyor, "yeni karar" rozeti yalnız eski projelerde çıksın. */
    try {
      await DB.paletKaydet(id, Object.assign({ gorulenSurum: APP.version },
        rolListesi(SIHIRBAZ.roller).length ? { roller: rolListesi(SIHIRBAZ.roller) } : {}));
    } catch (h) { /* kritik değil, Firma durağından sonra girilebilir */ }

    /* Logo ancak proje kurulduktan sonra yüklenebilir: dosya adı projenin
       kimliği. Yükleme patlarsa proje yine duruyor, logo sonradan eklenir. */
    if (SIHIRBAZ.logo) {
      try { await DB.logoYukle(id, SIHIRBAZ.logo); }
      catch (h) { toast('Proje kuruldu ama logo yüklenemedi — ' + h.message, 'uyari'); }
    }

    sihirbazKapat();
    sayaclariYaz();
    toast(SIHIRBAZ.firma.trim() + ' kuruldu.');
    location.hash = '#/projeler/' + id + '/firma';
    render();
  } catch (e) {
    toast(e.message, 'hata');
    if (btn) btn.textContent = 'Projeyi Oluştur';
  } finally {
    SIHIRBAZ.kaydediyor = false;
  }
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

/* Modül seçimi — ağaçtaki modül düğümünden açılır. */
function modulSecAc(projeId) {
  modalHepsiniKapat();
  const p = DB.proje(projeId);
  if (!p) return;
  const t = yapiTaslak(p);
  const kurulu = DB.modulleri(p.id).filter(m => m.ad !== GENEL_MODUL);
  const sablon = DB.modulSablonlari().filter(m => !kurulu.some(x => x.ad === m.ad));

  const satir = (ad, alt) => `
    <div class="satir sec-satir ${t.modul === ad ? 'sec' : ''}" data-ms="${esc(ad)}"
         role="button" tabindex="0">
      <span class="sec-yazi"><b>${esc(ad)}</b><i>${esc(alt)}</i></span>
      <span class="kare">${t.modul === ad ? svg(ICON.tik, 12) : ''}</span>
    </div>`;

  modalAc(`
    ${modalBaslik(ICON.katman, 'Modül', 'Kurulu bir modülü düzenle ya da yeni bir tane kur.')}
    <div class="secim">
      ${kurulu.map(m => satir(m.ad, DB.sayfalari(m.id).length + ' sayfa · kurulu')).join('')}
      ${sablon.map(m => satir(m.ad, (m.sayfalar || []).length + ' sayfa hazır')).join('')}
    </div>
    <div class="modal-alt">
      <button class="btn btn-ghost" data-ms-yaz="1" type="button">Kendim yazayım</button>
      <button class="btn btn-ghost" data-ms="iptal" type="button">Vazgeç</button>
    </div>`, kutu => {
    $$('[data-ms]', kutu).forEach(el => {
      if (el.dataset.ms === 'iptal') { el.addEventListener('click', modalKapat); return; }
      el.addEventListener('click', () => { modalKapat(); modulSec(p, el.dataset.ms); });
    });
    $('[data-ms-yaz]', kutu).addEventListener('click', async () => {
      modalKapat();
      const ad = await metinSor({ baslik: 'Modül adı', yerTutucu: 'Örn. Muhasebe',
                                  buton: 'Kur' });
      if (ad) modulSec(p, ad);
    });
  });
}

/* Modül seçilince sayfaları ve varsa künyeleri yüklenir. */
function modulSec(p, ad) {
  const t = yapiTaslak(p);
  t.odak = null;
  modulYukle(p, t, ad);
  render();
}

/* Onay kutusu — silme gibi geri alınamaz işler için */
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
      ac: { adres: claudeAdresi(gp ? depoSlug(gp.repo) : '', false),
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
    if (YENI.sayfa) ACIK_SAYFA.add(YENI.sayfa);
    if (YENI.modul) ACIK_MODUL.add(YENI.modul);
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

/* Namecheap kaydının hazır hâli. Dört satır, her birinin kendi kopyala
   düğmesi; altta doğrudan o alan adının DNS sayfasına giden düğme. */
function alanKaydiPenceresi(p) {
  const kok  = kokAlan();
  const alt  = altAlan(p);
  const tam  = onerilenAlanAdi(p);
  const hedef = (depoSahibi() || 'kullaniciadin').toLowerCase() + '.github.io';

  const satir = (etiket, deger) => `
    <div class="ak-s">
      <span class="ak-et">${esc(etiket)}</span>
      <span class="ak-dg mono">${esc(deger)}</span>
      <button class="ak-kop" type="button" data-ak-kopya="${esc(deger)}"
              aria-label="${esc(etiket)} kopyala">${svg(ICON.kopya, 12)}</button>
    </div>`;

  modalAc(`
    ${modalBaslik(ICON.dil, 'Alan adı kaydı',
      'Namecheap → Advanced DNS → Add New Record. Değerler hazır, kopyalayıp yapıştır.')}
    <div class="fb-kart" style="--kr:#5fb37f">
      ${satir('Type',  'CNAME Record')}
      ${satir('Host',  alt)}
      ${satir('Value', hedef)}
      ${satir('TTL',   'Automatic')}
    </div>
    <a class="sayfa-dug" target="_blank" rel="noopener"
       href="https://ap.www.namecheap.com/domains/domaincontrolpanel/${esc(kok)}/advancedns">
      ${svg(ICON.dil, 15)} Namecheap'te aç</a>
    <div class="fbd-not">${svg(ICON.info, 13)}
      <span>Kaydettikten sonra buraya dön ve <b>Alan adı</b> satırına
      <b class="mono">${esc(tam)}</b> yaz. DNS'in yayılması 10–30 dakika sürebilir.</span></div>
    <div class="modal-alt">
      <button class="btn btn-ghost" data-ak="kapat" type="button">Kapat</button>
      <button class="btn btn-primary" data-ak="yaz" type="button">
        <span>Alan adını yaz</span></button>
    </div>`, kutu => {
    $$('[data-ak-kopya]', kutu).forEach(b => b.addEventListener('click', async () => {
      const ok = await panoyaKopyala(b.dataset.akKopya);
      b.classList.toggle('oldu', ok);
      toast(ok ? 'Kopyalandı.' : 'Kopyalanamadı.', ok ? 'basari' : 'hata');
    }));
    $('[data-ak="kapat"]', kutu).addEventListener('click', modalKapat);
    $('[data-ak="yaz"]', kutu).addEventListener('click', async () => {
      modalKapat();
      const adres = await metinSor({
        baslik: 'Alan adı',
        aciklama: 'Namecheap kaydını açtıysan bu adres birazdan çalışmaya başlar.',
        deger: tam,
        yerTutucu: 'merkezefendi.nizamsoftware.com',
        buton: 'Kaydet',
      });
      if (adres === null) return;
      await isYap(() => DB.paletKaydet(p.id,
        Object.assign({}, p.palet || {}, { alanAdi: adres })), 'Alan adı kaydedildi.');
    });
  }, 'genis');
}

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

/* Projeye modül eklerken: ad, sayfalar ve istersen kütüphaneye de kaydet. */
function modulEkleAc(projeId) {
  modalHepsiniKapat();

  modalAc(`
    ${modalBaslik(ICON.katman, 'Yeni modül', 'Hazır bir şablon adı yazarsan sayfaları kendiliğinden dolar.')}

    <label class="field">
      <span>Modül adı</span>
      <input type="text" id="me-ad" placeholder="Örn. Sipariş" maxlength="60" autocomplete="off" list="me-sablonlar">
      <datalist id="me-sablonlar">
        ${DB.modulSablonlari().map(m => `<option value="${esc(m.ad)}"></option>`).join('')}
      </datalist>
    </label>

    <label class="field">
      <span>Sayfalar <em class="ipucu">her satıra bir sayfa</em></span>
      <textarea id="me-sayfalar" rows="6" spellcheck="false"
                placeholder="Sipariş Listesi&#10;Sipariş Oluştur&#10;Sipariş Detayı"></textarea>
    </label>

    <label class="onay-satir">
      <input type="checkbox" id="me-sablon">
      <span>
        <b>Nizam varsayılanlarına ekle</b>
        <i>Bundan sonraki projelerde hazır seçenek olarak çıksın</i>
      </span>
    </label>

    <div class="modal-alt">
      <button class="btn btn-ghost" data-me="iptal" type="button">Vazgeç</button>
      <button class="btn btn-primary" data-me="ekle" type="button"><span>Ekle</span></button>
    </div>`, kutu => {
    const adAlan = $('#me-ad', kutu);
    const sfAlan = $('#me-sayfalar', kutu);

    /* Ad bilinen bir şablonla eşleşirse sayfaları doldur — üstünde oynayabilir. */
    adAlan.addEventListener('input', () => {
      if (sfAlan.dataset.elle === '1') return;
      const s = DB.modulSablonlari().find(m =>
        m.ad.toLocaleLowerCase('tr') === adAlan.value.trim().toLocaleLowerCase('tr'));
      sfAlan.value = s ? (s.sayfalar || []).join('\n') : '';
    });
    sfAlan.addEventListener('input', () => { sfAlan.dataset.elle = '1'; });

    setTimeout(() => adAlan.focus(), 40);
    $('[data-me="iptal"]', kutu).addEventListener('click', modalKapat);

    $('[data-me="ekle"]', kutu).addEventListener('click', async () => {
      const ad = adAlan.value.trim();
      if (!ad) { toast('Modül adı yaz.'); return; }

      const sayfalar = sfAlan.value.split(/\r?\n/).map(x => x.trim()).filter(Boolean);
      const kutuphaneye = $('#me-sablon', kutu).checked;

      const yazi = $('[data-me="ekle"] span', kutu);
      yazi.textContent = 'Ekleniyor…';
      try {
        await DB.modulEkle(projeId, ad, sayfalar);
        if (kutuphaneye) {
          const varOlan = DB.sablonlar.find(m =>
            m.ad.toLocaleLowerCase('tr') === ad.toLocaleLowerCase('tr'));
          await DB.sablonKaydet(varOlan ? varOlan.id : null, { ad, sayfalar });
        }
        modalKapat();
        render();
        toast(kutuphaneye ? ad + ' eklendi ve varsayılanlara kaydedildi.' : ad + ' eklendi.', 'basari');
      } catch (h) {
        yazi.textContent = 'Ekle';
        toast(h.message, 'hata');
      }
    });
  });
}

/* Sektör: ad ve o sektörde önden işaretlenecek modüller. */
function sektorDuzenle(id) {
  modalHepsiniKapat();
  const x = id ? DB.sektorler.find(s => s.id === id) : null;
  let secili = (x && x.moduller) ? x.moduller.slice() : [];

  const sablonlar = DB.modulSablonlari();

  modalAc(`
    ${modalBaslik(ICON.folder, x ? 'Sektörü düzenle' : 'Yeni sektör',
      'Bu sektör seçilince aşağıdaki modüller önden işaretlenir.')}

    <label class="field">
      <span>Sektör adı</span>
      <input type="text" id="sk-ad" value="${esc(x ? x.ad : '')}"
             placeholder="Örn. Restoran" maxlength="40" autocomplete="off">
    </label>

    <div class="field">
      <span>Önerilen modüller <em class="ipucu">isteğe bağlı</em></span>
      ${sablonlar.length ? `<div class="secim" id="sk-moduller">
        ${sablonlar.map(m => `
          <div class="satir sec-satir ${secili.includes(m.ad) ? 'sec' : ''}"
               data-skm="${esc(m.ad)}" role="button" tabindex="0">
            <span class="sec-yazi"><b>${esc(m.ad)}</b><i>${(m.sayfalar || []).length} sayfa</i></span>
            <span class="kare">${secili.includes(m.ad) ? svg(ICON.tik, 12) : ''}</span>
          </div>`).join('')}
      </div>` : '<p class="ipucu">Önce Modül Şablonları\'ndan modül ekle.</p>'}
    </div>

    <div class="modal-alt">
      ${x ? `<button class="btn btn-ghost tehlike" data-sk="sil" type="button">Kaldır</button>` : ''}
      <button class="btn btn-ghost" data-sk="iptal" type="button">Vazgeç</button>
      <button class="btn btn-primary" data-sk="kaydet" type="button"><span>Kaydet</span></button>
    </div>`, kutu => {
    setTimeout(() => $('#sk-ad', kutu).focus(), 40);

    const ciz = () => {
      $$('[data-skm]', kutu).forEach(el => {
        const var_ = secili.includes(el.dataset.skm);
        el.classList.toggle('sec', var_);
        $('.kare', el).innerHTML = var_ ? svg(ICON.tik, 12) : '';
      });
    };

    $$('[data-skm]', kutu).forEach(el => el.addEventListener('click', () => {
      const ad = el.dataset.skm;
      const i = secili.indexOf(ad);
      i === -1 ? secili.push(ad) : secili.splice(i, 1);
      ciz();
    }));

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
        await DB.sektorKaydet(id, { ad, moduller: secili });
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

/* Şablon yazma / düzenleme. */
function sablonDuzenle(id) {
  modalHepsiniKapat();
  const m = id ? DB.sablonlar.find(x => x.id === id) : null;

  modalAc(`
    ${modalBaslik(ICON.katman, m ? 'Şablonu düzenle' : 'Yeni şablon',
      'Sihirbazda ve modül eklerken bu liste çıkar.')}

    <label class="field">
      <span>Modül adı</span>
      <input type="text" id="sd-mad" value="${esc(m ? m.ad : '')}"
             placeholder="Örn. Sipariş" maxlength="60" autocomplete="off">
    </label>

    <label class="field">
      <span>Sayfalar <em class="ipucu">her satıra bir sayfa</em></span>
      <textarea id="sd-msayfalar" rows="8" spellcheck="false"
        placeholder="Sipariş Listesi&#10;Sipariş Oluştur">${esc(m ? (m.sayfalar || []).join('\n') : '')}</textarea>
    </label>

    <div class="note note-kucuk">
      ${svg(ICON.info, 15)}
      <span>Şablonu değiştirmek kurulmuş projeleri etkilemez. Yalnızca bundan
      sonraki kurulumlar bu hali alır.</span>
    </div>

    <div class="modal-alt">
      <button class="btn btn-ghost" data-sd="iptal" type="button">Vazgeç</button>
      <button class="btn btn-primary" data-sd="kaydet" type="button"><span>Kaydet</span></button>
    </div>`, kutu => {
    setTimeout(() => $('#sd-mad', kutu).focus(), 40);
    $('[data-sd="iptal"]', kutu).addEventListener('click', modalKapat);

    $('[data-sd="kaydet"]', kutu).addEventListener('click', async () => {
      const ad = $('#sd-mad', kutu).value.trim();
      const sayfalar = $('#sd-msayfalar', kutu).value.split(/\r?\n/).map(x => x.trim()).filter(Boolean);

      if (!ad) { toast('Modül adı yaz.'); return; }

      const yazi = $('[data-sd="kaydet"] span', kutu);
      yazi.textContent = 'Kaydediliyor…';
      try {
        await DB.sablonKaydet(id, { ad, sayfalar });
        modalKapat();
        render();
        toast(id ? 'Şablon güncellendi.' : 'Şablon eklendi.', 'basari');
      } catch (h) {
        yazi.textContent = 'Kaydet';
        toast(h.message, 'hata');
      }
    });
  });
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

/* Düzenleme pencereleri sayfalarla aynı gruplarda. İkiye ayrıldılar çünkü
   aşamalar ayrıldı: marka müşteriyle konuşulan taraf, kurulum klavye
   başındaki taraf. */

/* 1 · Marka kimliği */
function markaDuzenle(projeId) {
  modalHepsiniKapat();
  const p = DB.proje(projeId);
  if (!p) return;

  let sektor = p.sektor || '';
  const sektorler = DB.sektorler.map(x => ({ kod: x.ad, ad: x.ad }));

  modalAc(`
    ${modalBaslik(ICON.etiket, 'Marka kimliği', 'Bu bilgiler promptlara ve kimlik dosyasına girer.')}

    ${fdKart('var(--fb-kisi)', ICON.etiket, 'Firma',
      fdAlan('#c4a05c', ICON.etiket,  'Firma adı', 'md-firma', p.firma,
             'Örn. Aydın Yapı', 'text', 60)
      + fdAlan('#5fb37f', ICON.telefon, 'Telefon', 'md-telefon', p.telefon,
             '0532 000 00 00', 'tel', 24, true)
      + fdAlan('#4fa8c9', ICON.mail,    'E-posta', 'md-eposta', p.eposta,
             'ornek@firma.com', 'email', 80, true))}

    ${fdKart('#8fae4a', ICON.dukkan, 'Sektör',
      (sektorler.length
        ? fdSecim('#8fae4a', ICON.dukkan, 'Ne işi yapıyor?', 'sektor', sektorler, sektor)
        : `<p class="ipucu">Sektör listesi boş — Ayarlar → Sektörler'den ekleyebilirsin.</p>`)
      + fdNot('Sektör modül önerisini belirliyor: aynı işi yapan firmalara '
            + 'benzer ekranlar gerekiyor.'))}

    <div class="modal-alt">
      <button class="btn btn-ghost" data-md="iptal" type="button">Vazgeç</button>
      <button class="btn btn-primary" data-md="kaydet" type="button"><span>Kaydet</span></button>
    </div>`, kutu => {
    const deger = id => { const e = $('#' + id, kutu); return e ? e.value.trim() : ''; };

    const sayaclariTazele = () => {
      const f = $('[data-fdsay="Firma"]', kutu);
      if (f) f.textContent = ['md-firma', 'md-telefon', 'md-eposta'].filter(deger).length + '/3';
      const sk = $('[data-fdsay="Sektör"]', kutu);
      if (sk) sk.textContent = sektor ? '1/1' : '0/1';
    };

    kutu.addEventListener('click', ev => {
      const t = ev.target.closest('[data-fd="sektor"]');
      if (!t) return;
      sektor = sektor === t.dataset.deger ? '' : t.dataset.deger;
      $$('[data-fd="sektor"]', kutu).forEach(x =>
        x.classList.toggle('on', x.dataset.deger === sektor));
      sayaclariTazele();
    });
    kutu.addEventListener('input', sayaclariTazele);
    sayaclariTazele();

    $('[data-md="iptal"]', kutu).addEventListener('click', modalKapat);
    $('[data-md="kaydet"]', kutu).addEventListener('click', async () => {
      const ad = deger('md-firma');
      if (!ad) return toast('Firma adı boş olamaz.', 'uyari');
      const yazi = $('[data-md="kaydet"] span', kutu);
      yazi.textContent = 'Kaydediliyor…';
      try {
        await DB.projeGuncelle(projeId, {
          firma:   ad,
          telefon: deger('md-telefon') || null,
          eposta:  deger('md-eposta') || null,
          sektor:  sektor || null,
        });
        modalKapat();
        render();
        toast('Marka bilgileri güncellendi.', 'basari');
      } catch (h) {
        yazi.textContent = 'Kaydet';
        toast(h.message, 'hata');
      }
    });
    setTimeout(() => { const i = $('#md-firma', kutu); if (i) i.focus(); }, 40);
  }, 'genis');
}

/* Kurulum adımlarının pencereleri. Tek büyük pencere yerine dört küçük:
   adım kartına basınca yalnız o adımın soruları çıkıyor. Yazılım bilmeyen
   biri için tek soruya odaklanmak, uzun formu taramaktan kolay. */

/* Etiket nesnesini seçim şeridinin beklediği biçime çevirir. */
const secimListesi = obje => Object.keys(obje).map(k => ({ kod: k, ad: obje[k] }));

/* 01 · Ne yapıyoruz? */
function adimUrun(projeId) {
  modalHepsiniKapat();
  const p = DB.proje(projeId);
  if (!p) return;

  let platform = p.platform || 'ikisi';
  let vt       = p.veri || 'sifirdan';
  let dil      = p.dil  || 'tr';
  let para     = p.para || 'TRY';

  modalAc(`
    ${modalBaslik(ICON.katman, 'Ne yapıyoruz?', 'Bu dört cevap promptun ilk satırlarına giriyor.')}
    ${fdKart('var(--fb-kunye)', ICON.katman, 'Ürün',
      fdSecim('#7d93b8', ICON.katman, 'Nerede çalışacak', 'platform', secimListesi(PLATFORM_ADI), platform)
      + fdSecim('#3fa694', ICON.gVeri, 'Veriler',        'vt',       secimListesi(VERI_ADI),     vt)
      + fdSecim('#b8926b', ICON.dil,   'Uygulama dili',  'dil',      DIL_SECENEK,         dil)
      + fdSecim('#c8973f', ICON.para,  'Para birimi',    'para',     PARA_SECENEK,        para))}
    <div class="modal-alt">
      <button class="btn btn-ghost" data-au="iptal" type="button">Vazgeç</button>
      <button class="btn btn-primary" data-au="kaydet" type="button"><span>Kaydet</span></button>
    </div>`, kutu => {
    kutu.addEventListener('click', ev => {
      const t = ev.target.closest('[data-fd]');
      if (!t) return;
      const tur = t.dataset.fd, dg = t.dataset.deger;
      if (tur === 'platform') platform = dg;
      if (tur === 'vt')       vt = dg;
      if (tur === 'dil')      dil = dg;
      if (tur === 'para')     para = dg;
      $$(`[data-fd="${tur}"]`, kutu).forEach(x => x.classList.toggle('on', x === t));
    });
    $('[data-au="iptal"]', kutu).addEventListener('click', modalKapat);
    $('[data-au="kaydet"]', kutu).addEventListener('click', async () => {
      const yazi = $('[data-au="kaydet"] span', kutu);
      yazi.textContent = 'Kaydediliyor…';
      try {
        await DB.projeGuncelle(projeId, { platform, veri: vt, dil, para });
        /* Platform ve veritabanı sütunda hep dolu; adımın görüldüğünü
           ayrıca işaretliyoruz ki kart boş görünmesin. */
        await DB.paletKaydet(projeId, Object.assign({}, p.palet || {}, { urunOnay: true }));
        modalKapat(); render(); toast('Kaydedildi.', 'basari');
      } catch (h) { yazi.textContent = 'Kaydet'; toast(h.message, 'hata'); }
    });
  }, 'genis');
}

/* 02 · Kim kullanacak? */
function adimRoller(projeId) {
  modalHepsiniKapat();
  const p = DB.proje(projeId);
  if (!p) return;
  const pl = p.palet || {};

  modalAc(`
    ${modalBaslik(ICON.gGuvenlik, 'Kim kullanacak?',
      'Uygulamayı kaç katman insan kullanacak? Veritabanı güvenlik kuralları buna göre yazılıyor.')}
    ${fdKart('#d8a63f', ICON.gGuvenlik, 'Yetki katmanları', rolMerdiveni(pl.roller, 'tk'))}
    <div class="modal-alt">
      <button class="btn btn-ghost" data-ar="iptal" type="button">Vazgeç</button>
      <button class="btn btn-primary" data-ar="kaydet" type="button"><span>Kaydet</span></button>
    </div>`, kutu => {
    rolBagla(kutu);
    const tazele = () => {
      const r = $('[data-fdsay="Yetki katmanları"]', kutu);
      if (r) r.textContent = rolOku(kutu).length + ' katman';
    };
    kutu.addEventListener('click', () => setTimeout(tazele, 0));
    kutu.addEventListener('input', tazele);
    tazele();
    $('[data-ar="iptal"]', kutu).addEventListener('click', modalKapat);
    $('[data-ar="kaydet"]', kutu).addEventListener('click', async () => {
      const roller = rolOku(kutu);
      if (!roller.length) return toast('En az bir katman yaz.', 'uyari');
      const yazi = $('[data-ar="kaydet"] span', kutu);
      yazi.textContent = 'Kaydediliyor…';
      try {
        await DB.paletKaydet(projeId, Object.assign({}, pl, { roller }));
        modalKapat(); render(); toast('Kaydedildi.', 'basari');
      } catch (h) { yazi.textContent = 'Kaydet'; toast(h.message, 'hata'); }
    });
  }, 'genis');
}

/* 03 · Nereye kuralım? */
function adimYer(projeId) {
  modalHepsiniKapat();
  const p = DB.proje(projeId);
  if (!p) return;

  const pl   = p.palet || {};
  const alan = a => TEKNIK_ALAN.find(x => x.anahtar === a) || {};
  const veri = alan('veriKatmani');
  const veriSecili = pl.veriKatmani || veri.varsayilan;

  modalAc(`
    ${modalBaslik(ICON.bulut, 'Nereye kuralım?',
      'Önce yeri söyle, sonra dört düğmeyle kur.')}
    ${fdKart('#4fa8c9', ICON.bulut, 'Yer',
      fdAlan('#c48a5c', ICON.katman, 'Bu paketin adı', 'ay-modul', pl.modulAdi,
             'Örn. Muhasebe', 'text', 60, false, 'data-tk="modulAdi"')
      + `<div class="fbd-sec" style="--ki:#4fa8c9">
        <span class="fbd-set"><span class="fbd-si">${svg(ICON.bulut, 12)}</span>
          <span>Veriler nerede duracak</span></span>
        <div class="fbd-cipler">
          ${(veri.secim || []).map(x => `<button class="fbd-cp ${veriSecili === x ? 'on' : ''}"
            type="button" data-tks="veriKatmani" data-deger="${esc(x)}">${esc(x)}</button>`).join('')}
        </div>
        <input type="hidden" data-tk="veriKatmani" value="${esc(veriSecili)}">
      </div>`
      + fdAlan('#5fb37f', ICON.anahtar, 'İnternet adresi', 'ay-alan', pl.alanAdi,
               onerilenAlanAdi(p) || 'kubban.nizamsoft.com', 'text', 200, true,
               'data-tk="alanAdi"')
      + fdNot(veri.alt)
      + `<div class="fbd-ayrac">
          <span class="fbd-et">Kurulum</span>
          ${kurulumAraclari(p)}
          <div class="fb-kg tek" style="margin-top:11px">
            ${kunyeSatiri('#b8926b', ICON.dal,   'Kod deposu',
                          depoSlug(p.repo) || p.repo, 'repo', p.id, false, 'dokun, yapıştır')}
            ${kunyeSatiri('#9b7fd4', ICON.dosya, 'Proje kimliği', 'NIZAM.md', 'kimlik', p.id)}
          </div>
        </div>`)}
    <div class="modal-alt">
      <button class="btn btn-ghost" data-ay="iptal" type="button">Vazgeç</button>
      <button class="btn btn-primary" data-ay="kaydet" type="button"><span>Kaydet</span></button>
    </div>`, kutu => {
    const tazele = () => {
      const y = $('[data-fdsay="Yer"]', kutu);
      if (!y) return;
      y.textContent = $$('[data-tk]', kutu).filter(x => x.value.trim()).length + '/3';
    };
    kutu.addEventListener('click', ev => {
      const v = ev.target.closest('[data-tks]');
      if (v) {
        const gizli = $('[data-tk="' + v.dataset.tks + '"]', kutu);
        if (gizli) gizli.value = v.dataset.deger;
        v.parentElement.querySelectorAll('.fbd-cp').forEach(x => x.classList.toggle('on', x === v));
      }
      setTimeout(tazele, 0);
    });
    kutu.addEventListener('input', tazele);
    tazele();
    $('[data-ay="iptal"]', kutu).addEventListener('click', modalKapat);
    $('[data-ay="kaydet"]', kutu).addEventListener('click', async () => {
      const palet = Object.assign({}, pl);
      $$('[data-tk]', kutu).forEach(el => {
        const v = el.value.trim();
        if (v) palet[el.dataset.tk] = v; else delete palet[el.dataset.tk];
      });
      const yazi = $('[data-ay="kaydet"] span', kutu);
      yazi.textContent = 'Kaydediliyor…';
      try {
        await DB.paletKaydet(projeId, palet);
        modalKapat(); render(); toast('Kaydedildi.', 'basari');
      } catch (h) { yazi.textContent = 'Kaydet'; toast(h.message, 'hata'); }
    });
    setTimeout(() => { const i = $('#ay-modul', kutu); if (i) i.focus(); }, 40);
  }, 'genis');
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
  ihtiyac:       p => PROMPT.ihtiyac(p.id),
  gorselTasarim: p => PROMPT.gorselTasarim(p.id),
  gorselTarif:   p => PROMPT.gorselTarif(p.id),
  tasarim:       p => PROMPT.tasarim(p.id),
  cozumleme:     p => PROMPT.cozumleme(p, yapiTaslak(p)),
  yapi:          p => PROMPT.yapi(p.id),
  standart:      p => PROMPT.programGelistirme(p.id),
  /* Projesiz: bir programda doğan kuralı standarda çeviren prompt. */
  standartEkle:  () => PROMPT.standartEkle(),
};

/* Claude Code adresi. `yeni` yalnız ilk oturumda: sonraki bloklar aynı
   sohbete yapıştırılıyor, her seferinde /new açmak gereksiz oturum yığıyor
   (bir kere yaşandı, sohbetleri tek tek arşivlemek gerekti). */
function claudeAdresi(slug, yeni) {
  if (!yeni) return 'https://claude.ai/code';
  return 'https://claude.ai/code/new'
    + (slug ? '?repositories=' + encodeURIComponent(slug) : '');
}

/* Kopyala-ve-aç bağlantısı. hedef: 'chatgpt' · 'claude' · 'claude-yeni'
   ya da doğrudan bir adres. */
function promptBaglantisi({ tur, proje, yazi, hedef = 'claude', ikincil, kapali, slug }) {
  const adres = hedef === 'chatgpt' ? CHATGPT_ADRES
    : hedef === 'claude'      ? claudeAdresi(slug, false)
    : hedef === 'claude-yeni' ? claudeAdresi(slug, true)
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

    /* G0 yuvası tarifle gelmiyor; ilk yüklemede kendimiz açıyoruz. */
    const pr = DB.proje(projeId);
    const pl = (pr && pr.palet) || {};
    if (!(pl.gorseller || []).some(y => y.no === no)) {
      const yeni = (pl.gorseller || []).concat([{
        no, ad: ad || 'Görsel', tarif: 'İşletmeyi anlatan görsel — konseptin kaynağı.',
        dosya: 'isletme.jpg', yol: '', boyut: 0, tur: '',
      }]);
      try {
        await DB.paletKaydet(projeId, Object.assign({}, pl, { gorseller: yeni }));
      } catch (h) { toast(h.message, 'hata'); return; }
    }

    /* Gösterge kartın üstünde: bildirim balonu ekranın dibinde açılıp
       kayboluyor, oysa beklenen şey kartın kendisi. */
    GORSEL_YUKLENIYOR[projeId] = { oran: 0, boyut: dosya.size };
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
      GORSEL_YUKLENIYOR[projeId] = { oran: 1, boyut: dosya.size, giden: dosya.size, bitti: true };
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

/* Tarifi yapıştır — önizlemede kaç yuva çıktığını gösterir. */
/* Promptu vermek tek düğmelik iş: kopyala ve Claude Code'da aç. Ayrı bir
   pencere açmak yerine kartın kendisi bunu yapıyor — ama kare karta
   `data-pano` koyamıyoruz (kart zaten bir eylem taşıyor), o yüzden küçük
   bir pencere ile soruyoruz. */
function ihtiyacPromptu(projeId) {
  modalHepsiniKapat();
  const p = DB.proje(projeId);
  if (!p) return;
  const kunye = Object.keys((p.palet || {}).kunye || {}).length;

  modalAc(`
    ${modalBaslik(ICON.arama, 'İhtiyaç promptu',
      'Claude künyeye bakıp hangi kararların bu projede gerektiğini söyleyecek, '
      + 'sayfa sayfa yerleşim notu verecek.')}
    ${kunye ? `<div class="note">${svg(ICON.katman, 15)}
        <span><b>${kunye} sayfanın künyesi</b> promptun içinde gidiyor.
        Claude ekranı tahmin etmiyor.</span></div>`
      : `<div class="note uyari">${svg(ICON.uyari, 15)}
        <span>Künye yok — Kurulum ve yapı aşaması tamamlanmamış. Çözümleme
        yüzeysel kalır; önce modülü kurmanı öneririm.</span></div>`}
    <div class="kur-dug">
      ${promptBaglantisi({ tur: 'ihtiyac', proje: p.id, slug: depoSlug(p.repo),
        yazi: 'Kopyala ve Claude Code\'da aç' })}
    </div>
    <div class="modal-alt">
      <button class="btn btn-ghost" data-ip="kapat" type="button">Kapat</button>
    </div>`, kutu => {
    $('[data-ip="kapat"]', kutu).addEventListener('click', modalKapat);
    /* Bağlantıya basılınca pencere kapansın: kullanıcı zaten sekme değiştirdi. */
    const bag = $('[data-pano]', kutu);
    if (bag) bag.addEventListener('click', () => setTimeout(modalKapat, 400));
  });
}

/* Dönen bloğu okuyup palete yazar. Okuma başarısızsa hiçbir şey yazılmıyor:
   yarım çözümleme, çözümlemesizlikten kötü. */
function ihtiyacAktar(projeId) {
  modalHepsiniKapat();
  const p = DB.proje(projeId);
  if (!p) return;
  const pl = p.palet || {};

  modalAc(`
    ${modalBaslik(ICON.ice, 'Çözümlemeyi yapıştır',
      'Claude\'un verdiği bloğu olduğu gibi bırak. Kıvrık tırnak ve eksik '
      + 'parantez toparlanıyor.')}
    <label class="field">
      <span>Yapıştır</span>
      <textarea id="ic-metin" rows="11" spellcheck="false"
        placeholder='{ "kararlar": [ … ], "yeni": [ … ], "sayfalar": [ … ] }'></textarea>
    </label>
    <div id="ic-onizleme"></div>
    <div class="modal-alt">
      <button class="btn btn-ghost" data-ic="iptal" type="button">Vazgeç</button>
      <button class="btn btn-primary" data-ic="kaydet" type="button" disabled><span>Aktar</span></button>
    </div>`, kutu => {
    const alan  = $('#ic-metin', kutu);
    const on    = $('#ic-onizleme', kutu);
    const dugme = $('[data-ic="kaydet"]', kutu);
    let cozum = null;

    const tazele = () => {
      if (!alan.value.trim()) { on.innerHTML = ''; dugme.disabled = true; return; }
      cozum = ihtiyacOku(alan.value);
      dugme.disabled = !cozum;
      if (!cozum) {
        on.innerHTML = `<div class="note uyari">${svg(ICON.uyari, 15)}
          <span>Blok okunamadı. <b>{</b> ile başlayıp <b>}</b> ile biten
          JSON bekleniyor; Claude\'un verdiği bloğun tamamını al.</span></div>`;
        return;
      }
      const kar = Object.keys(cozum.kararlar);
      const elenen = kar.filter(k => cozum.kararlar[k].gerek === false).length;
      on.innerHTML = `<span class="label">Okunan</span>
        <div class="card"><div class="row-list">
          <div class="row"><div class="row-main">
            <span class="row-title">Karar</span></div>
            <span class="row-val">${kar.length - elenen} geçerli · ${elenen} elendi</span></div>
          <div class="row"><div class="row-main">
            <span class="row-title">Claude\'un açtığı başlık</span></div>
            <span class="row-val">${cozum.yeni.length}</span></div>
          <div class="row"><div class="row-main">
            <span class="row-title">Sayfa notu</span></div>
            <span class="row-val">${Object.keys(cozum.sayfalar).length}</span></div>
        </div></div>`;
    };

    alan.addEventListener('input', tazele);
    setTimeout(() => alan.focus(), 40);

    $('[data-ic="iptal"]', kutu).addEventListener('click', modalKapat);
    dugme.addEventListener('click', async () => {
      if (!cozum) return;
      const yazi = $('[data-ic="kaydet"] span', kutu);
      yazi.textContent = 'Yazılıyor…';
      dugme.disabled = true;
      try {
        await DB.paletKaydet(projeId,
          Object.assign({}, pl, { cozum, cozumIstendi: true }));
        modalKapat();
        toast('Çözümleme alındı — ' + Object.keys(cozum.sayfalar).length
          + ' sayfa notu.', 'basari');
        render();
      } catch (h) {
        yazi.textContent = 'Aktar';
        dugme.disabled = false;
        toast(h.message, 'hata');
      }
    });
  });
}

function tarifAktar(projeId) {
  modalHepsiniKapat();
  const p = DB.proje(projeId);
  if (!p) return;
  const pl = p.palet || {};

  modalAc(`
    ${modalBaslik(ICON.ice, 'Tarifi yapıştır',
      'ChatGPT\'nin verdiği görsel dil ve yerleşim metnini olduğu gibi yapıştır.')}
    <label class="field">
      <span>Yapıştır</span>
      <textarea id="tf-metin" rows="11" spellcheck="false"
        placeholder="## GÖRSEL DİL&#10;Renk: ...&#10;&#10;## YERLEŞİM&#10;G1 | gorsel-1.jpg | Panel açılışı | Tam genişlik, üstüne perde">${esc(pl.tarif || '')}</textarea>
    </label>
    <div id="tf-onizleme"></div>
    <div class="modal-alt">
      <button class="btn btn-ghost" data-tf="iptal" type="button">Vazgeç</button>
      <button class="btn btn-primary" data-tf="kaydet" type="button" disabled><span>Kaydet</span></button>
    </div>`, kutu => {
    const alan  = $('#tf-metin', kutu);
    const on    = $('#tf-onizleme', kutu);
    const dugme = $('[data-tf="kaydet"]', kutu);
    let cozum = { dil: '', yuvalar: [] };

    const tazele = () => {
      if (!alan.value.trim()) { on.innerHTML = ''; dugme.disabled = true; return; }
      cozum = tarifCozumle(alan.value, pl.gorseller);
      dugme.disabled = false;

      on.innerHTML = cozum.yuvalar.length
        ? `<span class="label">Açılacak yuvalar</span>
           <div class="card"><div class="row-list">
             ${cozum.yuvalar.map(y => `<div class="row">
               <div class="row-main"><span class="row-title">${esc(y.no)} · ${esc(y.ad)}</span>
                 <span class="row-sub mono">${esc(y.dosya)}</span></div>
               <span class="row-val">${y.yol ? 'dolu' : 'boş'}</span></div>`).join('')}
           </div></div>`
        : `<div class="note uyari">${svg(ICON.uyari, 15)}
            <span>Yerleşim satırı okunamadı. Tarif yine kaydedilir; yuvaları
            elle açman gerekir. Satırlar
            <b class="mono">G1 | dosya.jpg | Yer | Nasıl</b> biçiminde olmalı.</span></div>`;
    };

    alan.addEventListener('input', tazele);
    setTimeout(() => alan.focus(), 40);
    tazele();

    $('[data-tf="iptal"]', kutu).addEventListener('click', modalKapat);
    dugme.addEventListener('click', async () => {
      const yazi = $('[data-tf="kaydet"] span', kutu);
      yazi.textContent = 'Yazılıyor…';
      dugme.disabled = true;
      try {
        /* İşletme görseli (G0) tarifte yok ama silinmemeli. */
        const g0 = (pl.gorseller || []).find(y => y.no === 'G0');
        let yuvalar = cozum.yuvalar;
        if (g0) {
          /* Tarif G1'i "senin verdiğin görsel" diye kullanmışsa dosyayı
             yeniden yükletmiyoruz — aynı dosyayı gösteriyor. */
          yuvalar = yuvalar.map(y => (y.no === 'G1' && !y.yol && g0.yol)
            ? Object.assign({}, y, { yol: g0.yol, boyut: g0.boyut, tur: g0.tur })
            : y);
          yuvalar = [g0].concat(yuvalar.filter(y => y.no !== 'G0'));
        }
        await DB.paletKaydet(projeId, Object.assign({}, pl,
          { tarif: cozum.dil, gorseller: yuvalar }));
        await DB.gorselleriTazele(true);
        modalKapat();
        render();
        toast(cozum.yuvalar.length
          ? cozum.yuvalar.length + ' yuva açıldı.' : 'Tarif kaydedildi.', 'basari');
      } catch (h) {
        yazi.textContent = 'Kaydet';
        dugme.disabled = false;
        toast(h.message, 'hata');
      }
    });
  }, 'genis');
}

/* Yuva listesi — her yuvanın adını ve ne isteneceğini tarif yazdı. */
function gorselYuvalari(projeId) {
  modalHepsiniKapat();
  const p = DB.proje(projeId);
  if (!p) return;
  const yuvalar = (p.palet || {}).gorseller || [];
  const dolu = yuvalar.filter(y => y.yol).length;

  modalAc(`
    ${modalBaslik(ICON.katman, 'Görseller',
      'Yuvaların adı da dosya adı da tariften geliyor.')}
    <div class="yuva-l">
      ${yuvalar.map(y => {
        const adres = gorselAdresi(p, y.no);
        return `<div class="yv ${y.yol ? '' : 'bos'}" data-eylem="yuva-doldur"
                     data-proje="${p.id}" data-no="${esc(y.no)}" role="button" tabindex="0">
          <span class="yv-kare ${adres ? 'resim' : ''}"
                ${adres ? `data-logo="${esc(adres)}"` : ''}>${adres ? '' : '+'}</span>
          <span class="yv-yz">
            <span class="yv-ust"><em class="mono">${esc(y.no)}</em><b>${esc(y.ad)}</b></span>
            <i>${esc(y.tarif || '')}</i>
            <u class="mono">${esc(y.dosya)}${y.boyut ? ' · ' + kb(y.boyut) : ''}</u>
          </span>
          <span class="yv-dr ${y.yol ? 'ok' : 'bek'}">${y.yol ? 'dolu' : 'bekliyor'}</span>
        </div>`;
      }).join('')}
    </div>
    ${yuvalar.length ? `
      <div class="yv-ilerle">
        <span class="mono">${dolu}/${yuvalar.length}</span>
        <span class="yv-cb"><i style="width:${Math.round(dolu / yuvalar.length * 100)}%"></i></span>
      </div>` : `<div class="bos-kutu">${svg(ICON.katman, 18)}
        <span>Yuva yok. Önce tarifi yapıştır.</span></div>`}
    <div class="modal-alt">
      <button class="btn btn-ghost" data-m="kapat" type="button">Kapat</button>
    </div>`, kutu => {
    logolariGoster();
    $('[data-m="kapat"]', kutu).addEventListener('click', modalKapat);
  }, 'genis');
}

function kb(n) {
  return n > 1024 * 1024
    ? (n / 1024 / 1024).toFixed(1) + ' MB'
    : Math.round(n / 1024) + ' KB';
}

/* Çözümleme cevabını okur: sayfalar, künyeler ve açık sorular. */
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
      cozumlemeUygula(t, cozum, p);
      modalKapat();
      /* Blokta modül adı yoksa (eski biçim) sorulur. Pencere kapanışıyla
         çakışmasın diye bir kare bekliyoruz. */
      if (!t.modul) {
        await new Promise(r => setTimeout(r, 260));
        t.modul = await metinSor({ baslik: 'Modülün adı',
          aciklama: 'Blokta yazmıyordu, sen yaz.', yerTutucu: 'Örn. Muhasebe Modülü',
          buton: 'Tamam', deger: '' }) || 'Yeni Modül';
      }
      /* Aktarımdan sonra ağaca dön: sonucu görmesi gereken yer orası. */
      t.mod = 'agac'; t.odak = null; t.dal = null;
      toast(cozum.sayfalar.length + ' sayfa aktarıldı.');
      render();
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

/* ---------- İhtiyaç çözümlemesi okuma ----------
   Claude üç bölüm döndürüyor: hangi karar gerekli, açtığı yeni başlıklar,
   sayfa sayfa tasarım notu. Üçü de eksik gelebilir; blok en az birini
   taşıyorsa okunmuş sayılıyor. */
function ihtiyacOku(metin) {
  const o = jsonBlokOku(metin, x =>
    Array.isArray(x.kararlar) || Array.isArray(x.yeni) || Array.isArray(x.sayfalar));
  if (!o) return null;

  const kis = (v, n) => String(v == null ? '' : v).trim().slice(0, n);

  const kararlar = {};
  (Array.isArray(o.kararlar) ? o.kararlar : []).forEach(k => {
    if (!k || !k.anahtar) return;
    const anahtar = kis(k.anahtar, 40);
    /* Uydurma anahtar yazmışsa yok sayılıyor: olmayan bir başlığı elemek
       ya da ona öneri vermek sessiz bir hata olurdu. */
    if (!TUM_TASARIM.some(a => a.anahtar === anahtar)) return;
    kararlar[anahtar] = {
      gerek: k.gerek !== false,
      oneri: kis(k.oneri, 60),
      neden: kis(k.neden, 300),
    };
  });

  const yeni = (Array.isArray(o.yeni) ? o.yeni : []).map(y => {
    if (!y || !y.ad || !Array.isArray(y.secim)) return null;
    const secim = y.secim.filter(x => x && x.ad)
      .slice(0, 6)
      .map(x => ({ ad: kis(x.ad, 40), tarif: kis(x.tarif, 200) }));
    if (secim.length < 2) return null;
    return {
      obek: kis(y.obek, 30), ad: kis(y.ad, 40), soru: kis(y.soru, 140),
      secim, oneri: kis(y.oneri, 40), neden: kis(y.neden, 300),
    };
  }).filter(Boolean).slice(0, 8);

  const sayfalar = {};
  (Array.isArray(o.sayfalar) ? o.sayfalar : []).forEach(sf => {
    if (!sf || !sf.sayfa) return;
    const gorseller = (Array.isArray(sf.gorseller) ? sf.gorseller : [])
      .filter(g => g && (g.yer || g.ne)).slice(0, 4)
      .map(g => ({ yer: kis(g.yer, 40) || 'Sayfada', ne: kis(g.ne, 240) }));
    const bilesenler = (Array.isArray(sf.bilesenler) ? sf.bilesenler : [])
      .filter(Boolean).slice(0, 10).map(x => kis(x, 40));
    const kayit = {
      yerlesim: kis(sf.yerlesim, 600), bilesenler, gorseller, not: kis(sf.not, 400),
    };
    if (!kayit.yerlesim && !bilesenler.length && !gorseller.length && !kayit.not) return;
    sayfalar[kis(sf.sayfa, 60)] = kayit;
  });

  if (!Object.keys(kararlar).length && !yeni.length && !Object.keys(sayfalar).length) {
    return null;
  }
  return { kararlar, yeni, sayfalar, zaman: new Date().toISOString() };
}

/* Okunan çözümlemeyi taslağa yazar. Kullanıcının elle girdiği bir şey
   varsa üstüne yazmıyoruz: soru sormadan veri kaybettirmek olur. */
function cozumlemeUygula(t, cozum, p) {
  /* Modül düzeyinde yalnız ortak iş kuralı okunuyor: yetki artık tasarım
     anında değil, uygulamanın Yetkiler ekranından belirleniyor. */
  const mkg = cozum.modulKurallari || {};
  t.mk = t.mk || { kural: '' };
  if (!t.mk.kural && mkg.kural) t.mk.kural = mkg.kural;
  if (!t.modul && cozum.modul) t.modul = cozum.modul;
  t.kararlar    = cozum.kararlar || [];
  t.baglantilar = cozum.baglantilar || [];
  t.hazirVeri   = cozum.hazirVeri || [];
  t.ciktilar    = cozum.ciktilar || [];
  cozum.sayfalar.forEach(sf => {
    if (!t.sayfalar.includes(sf.ad)) t.sayfalar.push(sf.ad);
    const k = yapiKunye(t, sf.ad);
    if (!k.amac) k.amac = sf.amac || '';
    if (!k.tur)  k.tur  = (SAYFA_TURU.find(x => x.ad === sf.tur) || {}).ad || '';
    /* Öbeği Claude belirliyor: "Raporlar", "Ayarlar", "Panolar" gibi. Sayfa
       türünden (Liste/Form) daha anlamlı, çünkü işe göre ayırıyor. */
    if (!k.grup && typeof sf.grup === 'string') k.grup = sf.grup.trim().slice(0, 40);
    if (!k.alanlar.length && Array.isArray(sf.alanlar)) {
      k.alanlar = sf.alanlar.filter(a => a && a.ad).map(a => ({
        ad: a.ad,
        tur: (ALAN_TURU.find(x => x.ad === a.tur) || ALAN_TURU[0]).ad,
        zorunlu: !!a.zorunlu,
        degerler: Array.isArray(a.degerler) ? a.degerler.filter(Boolean) : [],
        kaynak: a.kaynak || '',
      }));
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
    /* Sayfaya özel ayrım yalnız blok öyle diyorsa. */
    const fk = sf.fark || {};
    k.fark = k.fark || { roller: [], eylemler: [], yetki: {}, kural: '' };
    if (!(k.fark.roller || []).length && Array.isArray(fk.roller) && fk.roller.length) {
      const gelen = fk.roller.filter(r => roller.includes(r));
      if (gelen.length) k.fark.roller = roller.slice(Math.min(...gelen.map(r => roller.indexOf(r))));
    }
    if (!(k.fark.eylemler || []).length && Array.isArray(fk.eylemler)) {
      k.fark.eylemler = fk.eylemler.filter(x => typeof x === 'string' && x.trim());
    }
    if (!Object.keys(k.fark.yetki || {}).length && fk.yetki) k.fark.yetki = fk.yetki;
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

  modalHepsiniKapat();
  modalAc(`
    ${modalBaslik(ICON.kisi, esc(k.ad || 'Kişi'), ben ? 'Kendi rolünü ve erişimini değiştiremezsin.' : 'Ad, rol ve erişim.')}

    <label class="field">
      <span>Ad Soyad</span>
      <input type="text" id="kd-ad" value="${esc(k.ad || '')}" maxlength="60" autocomplete="off">
    </label>

    <div class="field">
      <span>Rol</span>
      <div class="secenek-serit">
        <button class="ss ${k.rol === 'gelistirici' ? 'sec' : ''}" data-rol="gelistirici"
                type="button" ${ben ? 'disabled' : ''}>Geliştirici</button>
        <button class="ss ${k.rol === 'yonetici' ? 'sec' : ''}" data-rol="yonetici"
                type="button" ${ben ? 'disabled' : ''}>Yönetici</button>
      </div>
    </div>

    <div class="field">
      <span>Erişim</span>
      <div class="secenek-serit">
        <button class="ss ${k.aktif ? 'sec' : ''}" data-aktif="1" type="button" ${ben ? 'disabled' : ''}>Aktif</button>
        <button class="ss ${k.aktif ? '' : 'sec'}" data-aktif="0" type="button" ${ben ? 'disabled' : ''}>Pasif</button>
      </div>
    </div>

    <div class="note note-kucuk">
      ${svg(ICON.info, 15)}
      <span>Pasif kullanıcı giriş yapamaz ve hiçbir veriye ulaşamaz. Kaydı silinmez.</span>
    </div>

    <div class="modal-alt">
      <button class="btn btn-ghost" data-kd="iptal" type="button">Vazgeç</button>
      <button class="btn btn-primary" data-kd="kaydet" type="button"><span>Kaydet</span></button>
    </div>`, kutu => {
    let rol = k.rol, aktif = k.aktif;

    $$('[data-rol]', kutu).forEach(b => b.addEventListener('click', () => {
      if (ben) return;
      rol = b.dataset.rol;
      $$('[data-rol]', kutu).forEach(x => x.classList.toggle('sec', x === b));
    }));
    $$('[data-aktif]', kutu).forEach(b => b.addEventListener('click', () => {
      if (ben) return;
      aktif = b.dataset.aktif === '1';
      $$('[data-aktif]', kutu).forEach(x => x.classList.toggle('sec', x === b));
    }));

    $('[data-kd="iptal"]', kutu).addEventListener('click', modalKapat);
    $('[data-kd="kaydet"]', kutu).addEventListener('click', async () => {
      const ad = $('#kd-ad', kutu).value.trim();
      if (ad.length < 2) { toast('Ad soyad yaz.'); return; }

      const alanlar = ben ? { ad } : { ad, rol, aktif };
      const yazi = $('[data-kd="kaydet"] span', kutu);
      yazi.textContent = 'Kaydediliyor…';
      try {
        await DB.kisiKaydet(k.id, alanlar);
        if (ben) await AUTH.profilOku();
        modalKapat();
        kullaniciYaz();
        render();
        toast('Kaydedildi.', 'basari');
      } catch (h) {
        yazi.textContent = 'Kaydet';
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
  if (e === 'proje-ac')  { location.hash = '#/projeler/' + id; return; }

  if (e === 'modul-ac') {
    ACIK_MODUL.has(id) ? ACIK_MODUL.delete(id) : ACIK_MODUL.add(id);
    return render();
  }

  if (e === 'sayfa-ac') {
    ACIK_SAYFA.has(id) ? ACIK_SAYFA.delete(id) : ACIK_SAYFA.add(id);
    return render();
  }

  if (e === 'gorev-ac')   return gorevKartiAc(id);

  if (e === 'gorev-ekle') return yeniGorevAc({
    proje: el.dataset.proje || rota().id,
    modul: el.dataset.modul,
    sayfa: el.dataset.sayfa,
  });

  if (e === 'filtre') {
    GOREV_FILTRE = el.dataset.deger;
    return render();
  }

  if (e === 'tasarim-sec') {
    const pr = DB.proje(el.dataset.proje);
    const al = tasarimAlani(pr, el.dataset.alan);
    if (!pr || !al) return;

    const deger = el.dataset.deger;
    const raf   = el.parentElement;
    const eski  = bicimSecim(pr.palet, al);

    let yeni;
    if (!al.coklu) {
      if (eski[0] === deger) return;
      yeni = deger;
    } else if (eski.includes(deger)) {
      /* Son seçeneği söktürmüyoruz: boş bir başlık AI'ı tahmine iter. */
      if (eski.length === 1 && !al.bos) { toast('En az bir seçenek açık kalmalı.'); return; }
      yeni = eski.filter(x => x !== deger);
    } else {
      /* Sıra listedeki sıra olsun — "Şerit + Cam" ile "Cam + Şerit" aynı şey. */
      yeni = al.secim.filter(x => eski.includes(x.ad) || x.ad === deger).map(x => x.ad);
    }

    /* Beklemeden işaretle: raf anında tepki versin. Yeniden çizmiyoruz,
       yoksa sayfa tepeye fırlar. Yazma tutmazsa eski işaretler geri gelir. */
    const isaretle = liste => {
      $$('.bsc', raf).forEach(b => {
        if (b.classList.contains('sifir')) { b.disabled = !AUTH.yonetici || bicimAyni(liste, al); return; }
        b.classList.toggle('on', liste.includes(b.dataset.deger));
      });
    };
    isaretle(Array.isArray(yeni) ? yeni : [yeni]);
    const gecici = Object.assign({}, pr.palet || {}, { [al.anahtar]: yeni });
    onizlemeTazele(pr, gecici);

    try {
      await DB.paletKaydet(pr.id, Object.assign({}, pr.palet || {}, { [al.anahtar]: yeni }));
      /* İlerlemiyoruz: kullanıcı seçtiğini önizlemede görüp karşılaştırsın.
         Geçmeye hazır olduğunu İleri düğmesiyle söyler. */
      const ileri = $('.ag.ileri');
      if (ileri) ileri.classList.add('hazir');
    } catch (err) {
      isaretle(eski);
      onizlemeTazele(pr, pr.palet);
      toast(err.message, 'hata');
    }
    return;
  }

  /* Sonradan eklenen karara atla. */
  if (e === 'yeni-karar-git') {
    const pr = DB.proje(el.dataset.proje);
    if (!pr) return;
    const ilk = yeniKararlar(pr.palet)[0];
    if (!ilk) return;
    const yer = tasarimAdimlari(pr).findIndex(a => a.anahtar === ilk.anahtar);
    if (yer < 0) return;
    YENI_KIP[pr.id] = true;
    TASARIM_YER[pr.id] = yer;
    render();
    return;
  }

  /* "Gördüm" — seçim yapmadan rozeti kaldırır. */
  if (e === 'karar-goruldu') {
    const pr = DB.proje(el.dataset.proje);
    if (!pr) return;
    const pl  = pr.palet || {};
    const gor = (Array.isArray(pl.gorulenler) ? pl.gorulenler : [])
      .concat(el.dataset.alan);
    el.remove();
    try {
      await DB.paletKaydet(pr.id, Object.assign({}, pl, { gorulenler: gor }));
    } catch (err) { toast(err.message, 'hata'); render(); }
    return;
  }

  if (e === 'tasarim-sifirla') {
    const pr = DB.proje(el.dataset.proje);
    const al = tasarimAlani(pr, el.dataset.alan);
    if (!pr || !al) return;

    const raf  = el.parentElement;
    const eski = bicimSecim(pr.palet, al);
    if (bicimAyni(eski, al)) return;

    const deger = al.coklu ? [al.varsayilan] : al.varsayilan;
    $$('.bsc', raf).forEach(b => b.classList.toggle('on', b.dataset.deger === al.varsayilan));
    el.disabled = true;
    onizlemeTazele(pr, Object.assign({}, pr.palet || {}, { [al.anahtar]: deger }));

    try {
      await DB.paletKaydet(pr.id, Object.assign({}, pr.palet || {}, { [al.anahtar]: deger }));
      toast(al.ad + ' sıfırlandı.');
    } catch (err) {
      $$('.bsc', raf).forEach(b => b.classList.toggle('on', eski.includes(b.dataset.deger)));
      el.disabled = false;
      onizlemeTazele(pr, pr.palet);
      toast(err.message, 'hata');
    }
    return;
  }

  if (e === 'tasarim-ada') {
    const pr = DB.proje(el.dataset.proje);
    if (!pr) return;
    delete GORSEL_ADIM[pr.id];
    delete IHTIYAC_EKRAN[pr.id];
    TASARIM_MOD[pr.id] = 'adim';
    TASARIM_YER[pr.id] = Number(el.dataset.deger);
    render();
    $('#view').scrollTop = 0;
    return;
  }

  if (e === 'tasarim-adim') {
    const pr = DB.proje(el.dataset.proje);
    if (!pr) return;
    const hedef = Number(el.dataset.deger);
    /* Kipten çıkış: nokta şeridine, Geri'ye ya da başka bir yere dokunan
       kullanıcı normal akışa dönmüş demektir. */
    if (!el.dataset.yenikip) delete YENI_KIP[pr.id];
    if (hedef === tasarimAdimlari(pr).length - 1) delete YENI_KIP[pr.id];

    /* İleri gidiyorsa bu adım onaylanmış sayılır — varsayılanı kabul etmek de
       bir karardır. Toplu yazılıyor, her adımda veritabanına gidilmiyor. */
    const su = adimNo(pr);
    if (hedef === -2 || hedef > su) adimOnayla(pr, su);

    if (hedef === -2) { TASARIM_MOD[pr.id] = 'harita'; await onaylariYaz(pr); render(); return; }
    if (hedef < 0) { await onaylariYaz(pr); location.hash = '#/projeler/' + pr.id; return; }
    TASARIM_YER[pr.id] = hedef;
    render();
    $('#view').scrollTop = 0;
    return;
  }

  if (e === 'tasarim-tum-sifirla') {
    const pr = DB.proje(el.dataset.proje);
    if (!pr) return;
    const tamam = await onaySor({
      baslik: 'Tüm tasarımı sıfırla?',
      mesaj: `${tasarimAlanlari(pr).length} tasarım kararı varsayılan hâline döner. `
           + 'Palet, logo ve tema dokunulmadan kalır.',
      buton: 'Sıfırla',
    });
    if (!tamam) return;
    const yeni = Object.assign({}, pr.palet || {});
    tasarimAlanlari(pr).forEach(a => { delete yeni[a.anahtar]; });
    return isYap(() => DB.paletKaydet(pr.id, yeni), 'Tasarım kararları sıfırlandı.');
  }

  if (e === 'kararlar')    return kararlarAc(el.dataset.proje);

  if (e === 'yetkili-kopyala') {
    const pr = DB.proje(el.dataset.proje);
    if (!pr) return;
    const metin = [pr.yetkili, pr.telefon, pr.eposta].filter(Boolean).join('\n');
    const oldu = await panoyaKopyala(metin);
    toast(oldu ? 'Yetkili bilgileri kopyalandı.' : 'Kopyalanamadı.', oldu ? 'basari' : 'hata');
    return;
  }

  if (e === 'marka-duzenle')   return markaDuzenle(el.dataset.proje);
  if (e === 'adim-urun')     return adimUrun(el.dataset.proje);
  if (e === 'adim-roller')   return adimRoller(el.dataset.proje);
  if (e === 'adim-yer')      return adimYer(el.dataset.proje);
  if (e === 'adim-takvim')   return adimTakvim(el.dataset.proje);

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

  /* Kapalı adım satırına dokunuldu: o kart açılsın, sıradaki kapansın. */
  if (e === 'gorsel-adim') {
    const i = Number(el.dataset.deger);
    GORSEL_ADIM[el.dataset.proje] = (GORSEL_ADIM[el.dataset.proje] === i) ? null : i;
    return render();
  }

  /* ---------- İhtiyaç çözümlemesi ---------- */
  if (e === 'ihtiyac-prompt')   return ihtiyacPromptu(el.dataset.proje);
  if (e === 'ihtiyac-yapistir') return ihtiyacAktar(el.dataset.proje);
  if (e === 'ihtiyac-kararlar') { IHTIYAC_EKRAN[el.dataset.proje] = 'kararlar';
                                  render(); $('#view').scrollTop = 0; return; }
  if (e === 'ihtiyac-sayfalar') { IHTIYAC_EKRAN[el.dataset.proje] = 'sayfalar';
                                  render(); $('#view').scrollTop = 0; return; }
  if (e === 'ihtiyac-sayfa')    { IHTIYAC_EKRAN[el.dataset.proje] = 'sayfa:' + el.dataset.ad;
                                  render(); $('#view').scrollTop = 0; return; }
  if (e === 'ihtiyac-geri') {
    /* Bir kat yukarı: sayfa notundan sayfa ızgarasına, oradan karelere. */
    const su = IHTIYAC_EKRAN[el.dataset.proje];
    IHTIYAC_EKRAN[el.dataset.proje] =
      (su && su.slice(0, 6) === 'sayfa:') ? 'sayfalar' : null;
    return render();
  }

  if (e === 'tarif-aktar')   return tarifAktar(el.dataset.proje);
  if (e === 'gorsel-yuvalar') return gorselYuvalari(el.dataset.proje);

  if (e === 'yuva-doldur') {
    const pr = DB.proje(el.dataset.proje);
    if (!pr) return;
    const y = ((pr.palet || {}).gorseller || []).find(x => x.no === el.dataset.no);
    return gorselSecVeYukle(pr.id, el.dataset.no, y ? y.ad : 'Görsel');
  }

  if (e === 'tarif-gor') {
    const pr = DB.proje(el.dataset.proje);
    if (!pr) return;
    return metinPenceresi({ baslik: 'Görsel dil tarifi',
      aciklama: 'ChatGPT yazdı; Studio değiştirmiyor.',
      metin: String((pr.palet || {}).tarif || '') });
  }

  if (e === 'ekibe') { location.hash = '#/ekip'; return; }
  if (e === 'kullanici-ekle') return kullaniciEkleAc();
  if (e === 'kisi-duzenle')   return kisiDuzenle(id);

  if (e === 'foto-degistir') return fotoSec();

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

  /* Claude açılmıyor: prompt panoya alınıp kart yeşile dönüyor, kullanıcı
     Claude Code'u kendi açıp yapıştırıyor — standartlardaki prompt kartıyla
     aynı davranış. */
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
    return isYap(() => DB.paletKaydet(pr.id,
      Object.assign({}, pr.palet || {}, { sohbetAcildi: true })),
      'Prompt panoda — Claude Code\'a yapıştır.');
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

  if (e === 'modul-adi') {
    const pr = DB.proje(el.dataset.proje);
    if (!pr) return;
    const ad = await modulAdiSor(pr);
    if (ad === null) return;
    return isYap(() => DB.paletKaydet(pr.id,
      Object.assign({}, pr.palet || {}, { modulAdi: ad })), 'Modül adı kaydedildi.');
  }

  if (e === 'alan-adi') {
    const pr = DB.proje(el.dataset.proje);
    if (!pr) return;
    const adres = await metinSor({
      baslik: 'Yayın adresi',
      aciklama: 'Uygulamanın açılacağı adres. Prompta da yazılır.',
      deger: (pr.palet || {}).alanAdi || pagesAdresi(pr),
      yerTutucu: 'nizamsoft.github.io/NIZAMSOFT-KisiselButce',
      buton: 'Kaydet',
    });
    if (adres === null) return;
    delete PAGES_BEKLIYOR[pr.id];
    return isYap(() => DB.paletKaydet(pr.id,
      Object.assign({}, pr.palet || {}, { alanAdi: adres })), 'Yayın adresi kaydedildi.');
  }

  /* Namecheap'e yazılacak kayıt hazır duruyor: satır satır kopyalanıyor ve
     düğme doğrudan o alan adının Advanced DNS sayfasını açıyor. Studio kaydı
     kendi yazamıyor — Namecheap API'si sunucu ve anahtar istiyor. */
  if (e === 'alan-kaydi') {
    const pr = DB.proje(el.dataset.proje);
    if (!pr) return;
    const kok = kokAlan();
    if (!kok) {
      toast('Önce Ayarlar\'da kök alan adını yaz.', 'uyari');
      return adreseGit('#/ayarlar');
    }
    return alanKaydiPenceresi(pr);
  }

  if (e === 'yayin-onay') {
    const pr = DB.proje(el.dataset.proje);
    if (!pr) return;
    return isYap(() => DB.paletKaydet(pr.id,
      Object.assign({}, pr.palet || {}, { yayinda: true })), 'Yayında olarak işaretlendi.');
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

  if (e === 'sohbet-adi') {
    const pr = DB.proje(el.dataset.proje);
    if (!pr) return;
    const ad = await metinSor({
      baslik: 'Claude Code sohbeti',
      aciklama: 'Oturumu hangi adla açtın? Sonra hangi sohbete döneceğini '
              + 'aramadan bulursun.',
      deger: (pr.palet || {}).sohbetAdi || '',
      yerTutucu: depoAdi(pr),
      buton: 'Kaydet',
    });
    if (ad === null) return;
    return isYap(() => DB.paletKaydet(pr.id,
      Object.assign({}, pr.palet || {}, { sohbetAdi: ad })), 'Sohbet adı kaydedildi.');
  }

  if (e === 'yapi-blok-gor') {
    const pr = DB.proje(el.dataset.proje);
    if (!pr) return;
    return metinPenceresi({ baslik: 'Modüller ve sayfalar (3/3)',
      aciklama: 'Claude Code oturumuna yapıştır.', metin: PROMPT.yapi(pr.id) });
  }


  /* Yeni standardı bu programa taşıyan prompt. */
  /* "Gördüm" — standart bu programda gerekmiyorsa rozeti susturur. */
  if (e === 'standart-goruldu') {
    const pr = DB.proje(el.dataset.proje);
    if (!pr) return;
    const pl  = pr.palet || {};
    const gor = (Array.isArray(pl.gorulenStandart) ? pl.gorulenStandart : [])
      .concat(yeniStandartlar(pl).map(st => st.id));
    return isYap(() => DB.paletKaydet(pr.id,
      Object.assign({}, pl, { gorulenStandart: gor })), 'Görüldü olarak işaretlendi.');
  }

  /* Bütün programları ilgilendiren istek — hedef depo Studio'nun kendisi. */
  if (e === 'studio-istek') {
    const istek = await metinSor({
      baslik: 'Studio geliştirmesi',
      aciklama: 'Bütün programlarda geçerli olacak istek. Tek cümle yeter.',
      yerTutucu: 'Örn. Hiçbir uygulamada telefonda yakınlaştırma olmasın.',
      buton: 'Promptu al', cok: true,
    });
    if (istek === null) return;
    /* Metin yazıldıktan sonra dokunma jesti bitmiş oluyor; doğrudan sekme
       açamayız (iOS engelliyor). Promptu pencereyle verip açma işini
       kullanıcının bir sonraki dokunuşuna bırakıyoruz. */
    return metinPenceresi({
      baslik: 'Studio geliştirmesi',
      aciklama: 'NIZAM-Studio deposunda yeni bir oturumda çalışacak.',
      metin: PROMPT.studioGelistirme(istek),
      ac: { adres: claudeAdresi(APP.depo, true),
            yazi: 'Kopyala ve Claude Code\'da aç' },
    });
  }

  if (e === 'beta-onay') {
    const pr = DB.proje(el.dataset.proje);
    if (!pr) return;
    const pl = pr.palet || {};
    return isYap(() => DB.paletKaydet(pr.id,
      Object.assign({}, pl, { betaCikti: !pl.betaCikti })),
      pl.betaCikti ? 'İşaret kaldırıldı.' : 'Beta çıktı olarak işaretlendi.');
  }

  if (e === 'final-onay') {
    const pr = DB.proje(el.dataset.proje);
    if (!pr) return;
    const pl = pr.palet || {};
    return isYap(() => DB.paletKaydet(pr.id,
      Object.assign({}, pl, { finalVerildi: !pl.finalVerildi })),
      pl.finalVerildi ? 'İşaret kaldırıldı.' : 'Final sürüm verildi.');
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

    const sec = await secenekSor(projeAdi(proje), [
      { anahtar: 'ad',    ad: 'Adı değiştir',   ikon: ICON.kalem },
      { anahtar: 'renk',  ad: 'Rengi değiştir', ikon: ICON.boya },
      { anahtar: 'repo',  ad: 'Depo adresi',    ikon: ICON.katman, alt: proje.repo || 'henüz eklenmedi' },
      { anahtar: 'arsiv', ad: 'Arşive kaldır',  ikon: ICON.arsiv, alt: 'Listeden çıkar, veriyi silmez', tehlike: true },
      { anahtar: 'sil',   ad: 'Projeyi sil',    ikon: ICON.cop,   alt: 'Her şeyi siler, geri gelmez', tehlike: true },
    ]);
    if (!sec) return;

    if (sec === 'ad') {
      const ad = await metinSor({ baslik: 'Firma adı', deger: proje.firma, buton: 'Kaydet' });
      if (!ad || ad === proje.firma) return;
      return isYap(() => DB.projeGuncelle(id, { firma: ad }), 'Ad güncellendi.');
    }

    if (sec === 'renk') {
      const renk = await renkSor(proje.renk);
      if (!renk || renk === proje.renk) return;
      return isYap(() => DB.projeGuncelle(id, { renk }), 'Renk güncellendi.');
    }

    if (sec === 'repo') {
      const adres = await metinSor({
        baslik: 'Depo adresi', aciklama: 'Prompt hangi depoda çalışılacağını buradan söyler.',
        deger: proje.repo || '', yerTutucu: 'github.com/nizamsoft/musteri-projesi', buton: 'Kaydet',
      });
      if (adres === null) return;
      return isYap(() => DB.projeGuncelle(id, { repo: adres }), 'Depo adresi kaydedildi.');
    }

    if (sec === 'arsiv') {
      const ok = await onaySor({
        baslik: 'Proje arşive kaldırılsın mı?',
        mesaj: `"${projeAdi(proje)}" listeden çıkar. Modülleri, sayfaları ve görevleri silinmez — geri getirilebilir.`,
        buton: 'Arşive kaldır',
      });
      if (!ok) return;
      if (rota().id === id) location.hash = '#/projeler';
      return isYap(() => DB.projeArsivle(id), 'Proje arşive kaldırıldı.');
    }

    if (sec === 'sil') {
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
             + 'Logo, görseller ve tasarım tarifi de gidecek. Bu işlem geri alınamaz. '
             + 'Sadece listeden kaldırmak istiyorsan "Arşive kaldır" kullan.',
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

  if (e === 'modul-menu') {
    const sec = await secenekSor(el.dataset.ad, [
      { anahtar: 'ad',  ad: 'Adı değiştir', ikon: ICON.kalem },
      { anahtar: 'sil', ad: 'Modülü sil',   ikon: ICON.cop, alt: 'Sayfaları da gider', tehlike: true },
    ]);
    if (!sec) return;

    if (sec === 'ad') {
      const ad = await metinSor({ baslik: 'Modül adı', deger: el.dataset.ad, buton: 'Kaydet' });
      if (!ad || ad === el.dataset.ad) return;
      return isYap(() => DB.adDegistir('modules', id, ad), 'Ad güncellendi.');
    }

    return modulKaldir(el, id);
  }

  if (e === 'modul-ekle') return modulEkleAc(el.dataset.proje || el.dataset.id || rota().id);

  /* ---- Yapı ağacı ---- */
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

  if (e === 'agac-yeni-modul') {
    const pr = DB.proje(el.dataset.proje);
    if (!pr) return;
    const t = yapiTaslak(pr);
    /* Yeni modül elle kurulmuyor: anlatıp Claude'un bloğunu yapıştırıyoruz. */
    t.modul = ''; t.sayfalar = []; t.kunye = {}; t.anlat = '';
    t.kararlar = []; t.baglantilar = []; t.hazirVeri = []; t.ciktilar = [];
    t.odak = null; t.dal = null; t.mod = 'anlat';
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

  if (e === 'agac-roller') {
    const pr = DB.proje(el.dataset.proje);
    if (!pr) return;
    yapiTaslak(pr).mod = 'roller';
    render();
    return;
  }

  if (e === 'agac-koke') {
    const pr = DB.proje(el.dataset.proje);
    if (!pr) return;
    const t = yapiTaslak(pr);
    if (t.mod === 'roller') { t.mod = 'agac'; await rollariKaydet(pr); render(); return; }
    /* Firma çipi: modülden çıkıp modül listesine döner. */
    if (t.mod === 'anlat') { t.mod = 'agac'; if (!t.sayfalar.length) t.modul = ''; }
    else if (t.dal) { t.dal = null; }
    else { t.modul = ''; t.odak = null; }
    render();
    return;
  }

  if (e === 'agac-sayfaya') {
    const pr = DB.proje(el.dataset.proje);
    if (!pr) return;
    const t = yapiTaslak(pr);
    t.dal = null;
    if (t.mod === 'roller') t.mod = 'agac';
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

  if (e === 'agac-modul') return modulSecAc(el.dataset.proje);

  if (e === 'agac-modul-sil') {
    const pr = DB.proje(el.dataset.proje);
    if (!pr) return;
    const t = yapiTaslak(pr);
    const kurulu = DB.modulleri(pr.id).find(m => m.ad === el.dataset.ad);
    const gorev = kurulu ? modulGorevSayisi(pr, kurulu.id) : 0;
    if (gorev) return toast('Bu modülde ' + gorev + ' görev var, önce onları taşı.', 'hata');
    if (!await onaySor({
      baslik: el.dataset.ad + ' kaldırılsın mı?',
      mesaj: kurulu
        ? 'Modül, sayfaları ve künyeleri silinir. Bu geri alınamaz.'
        : 'Henüz kurulmadı; taslak silinir.',
      buton: 'Kaldır' })) return;

    if (kurulu) {
      try {
        await DB.modulSil(kurulu.id);
        await modulPaletTemizle(pr, el.dataset.ad);
      } catch (err) { return toast(err.message, 'hata'); }
    }
    /* Taslağın tamamı sıfırlanmalı: kalan mk/bağlantı bir sonraki modüle sızıyordu. */
    t.modul = ''; t.sayfalar = []; t.kunye = {}; t.odak = null; t.dal = null;
    t.anlat = ''; t.kararlar = [];
    t.mk = { roller: [], eylemler: [], yetki: {}, kural: '' };
    t.baglantilar = []; t.hazirVeri = []; t.ciktilar = [];
    toast(el.dataset.ad + ' kaldırıldı.');
    render();
    return;
  }

  if (e === 'agac-sayfa-sil') {
    const pr = DB.proje(el.dataset.proje);
    if (!pr) return;
    const ad = el.dataset.ad;
    const t = yapiTaslak(pr);
    const kurulu = DB.modulleri(pr.id).find(m => m.ad === t.modul);
    if (kurulu && DB.sayfalari(kurulu.id).some(x => x.ad === ad))
      return toast('Kurulmuş sayfa buradan kaldırılamaz.', 'hata');
    if (!await onaySor({ baslik: ad + ' kaldırılsın mı?',
      mesaj: 'Künyesi de silinir. Henüz kurulmadığı için veri kaybı olmaz.',
      buton: 'Kaldır' })) return;
    t.sayfalar = t.sayfalar.filter(x => x !== ad);
    delete t.kunye[ad];
    t.odak = null;
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

  if (e === 'yapi-kapat') {
    delete YAPI_ACIK[el.dataset.proje];
    delete YAPI_TASLAK[el.dataset.proje];
    ONIZLEME_MENU = ONIZLEME_SAYFA = ONIZLEME_KUNYE = null;
    render();
    return;
  }

  if (e === 'yapi-modul') {
    const pr = DB.proje(el.dataset.proje);
    if (!pr) return;
    const t = yapiTaslak(pr), ad = el.dataset.ad;
    if (t.modul === ad) { t.modul = ''; t.sayfalar = []; t.kunye = {}; }
    else {
      t.modul = ad;
      /* Kurulu modülse mevcut sayfaları ve daha önce girilmiş künyeleri
         yükleriz: aynı işi ikinci kez yazdırmanın anlamı yok. */
      const kurulu = DB.modulleri(pr.id).find(m => m.ad === ad);
      if (kurulu) {
        t.sayfalar = DB.sayfalari(kurulu.id).map(x => x.ad);
        const eski = (pr.palet || {}).kunye || {};
        t.kunye = {};
        t.sayfalar.forEach(sf => {
          const k = eski[ad + ' · ' + sf];
          if (k) t.kunye[sf] = JSON.parse(JSON.stringify(k));
        });
      } else {
        const sb = DB.modulSablonlari().find(m => m.ad === ad);
        t.sayfalar = ((sb && sb.sayfalar) || []).slice();
        t.kunye = {};
      }
    }
    render();
    return;
  }

  if (e === 'yapi-modul-yaz') {
    const pr = DB.proje(el.dataset.proje);
    if (!pr) return;
    const ad = await metinSor({ baslik: 'Modül adı', yerTutucu: 'Örn. Sipariş',
                                buton: 'Ekle' });
    if (!ad) return;
    const t = yapiTaslak(pr);
    t.modul = ad;
    render();
    return;
  }

  if (e === 'yapi-sayfa') {
    const pr = DB.proje(el.dataset.proje);
    if (!pr) return;
    const t = yapiTaslak(pr), ad = el.dataset.ad;
    const i = t.sayfalar.indexOf(ad);
    if (i > -1) t.sayfalar.splice(i, 1); else t.sayfalar.push(ad);
    render();
    return;
  }

  if (e === 'yapi-sayfa-yaz') {
    const pr = DB.proje(el.dataset.proje);
    if (!pr) return;
    const ad = await metinSor({ baslik: 'Sayfa adı', yerTutucu: 'Örn. Sipariş Detayı',
                                buton: 'Ekle' });
    if (!ad) return;
    const t = yapiTaslak(pr);
    if (!t.sayfalar.includes(ad)) t.sayfalar.push(ad);
    render();
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

  if (e === 'yapi-mk-rol') {
    const pr = DB.proje(el.dataset.proje);
    if (!pr) return;
    const t = yapiTaslak(pr);
    const roller = rolListesi((pr.palet || {}).roller);
    const i2 = roller.indexOf(el.dataset.ad);
    if (i2 < 0) return;
    const taban = (t.mk.roller || []).length
      ? roller.findIndex(r => t.mk.roller.includes(r)) : -1;
    t.mk.roller = taban === i2 ? [] : roller.slice(i2);
    Object.keys(t.mk.yetki || {}).forEach(ey => {
      t.mk.yetki[ey] = (t.mk.yetki[ey] || []).filter(r => t.mk.roller.includes(r));
      if (!t.mk.yetki[ey].length) t.mk.yetki[ey] = t.mk.roller.slice();
    });
    render();
    return;
  }

  if (e === 'yapi-mk-eylem') {
    const pr = DB.proje(el.dataset.proje);
    if (!pr) return;
    const t = yapiTaslak(pr);
    const ad = el.dataset.ad;
    t.mk.eylemler = t.mk.eylemler || [];
    const i2 = t.mk.eylemler.indexOf(ad);
    if (i2 > -1) { t.mk.eylemler.splice(i2, 1); delete t.mk.yetki[ad]; }
    else { t.mk.eylemler.push(ad); t.mk.yetki[ad] = (t.mk.roller || []).slice(); }
    render();
    return;
  }

  if (e === 'yapi-mk-eylem-yaz') {
    const pr = DB.proje(el.dataset.proje);
    if (!pr) return;
    const ad = await metinSor({ baslik: 'İş', buton: 'Ekle',
      aciklama: 'Listede olmayan bir iş.', yerTutucu: 'Örn. Ters kayıt' });
    if (!ad) return;
    const t = yapiTaslak(pr);
    if (!(t.mk.eylemler || []).includes(ad)) {
      t.mk.eylemler = (t.mk.eylemler || []).concat(ad);
      t.mk.yetki[ad] = (t.mk.roller || []).slice();
    }
    render();
    return;
  }

  if (e === 'yapi-mk-yetki') {
    const pr = DB.proje(el.dataset.proje);
    if (!pr) return;
    const t = yapiTaslak(pr);
    const ey = el.dataset.ey;
    const i2 = (t.mk.roller || []).indexOf(el.dataset.ad);
    if (i2 < 0) return;
    const secik = t.mk.yetki[ey] || [];
    const taban = secik.length ? t.mk.roller.findIndex(r => secik.includes(r)) : -1;
    t.mk.yetki[ey] = taban === i2 ? [] : t.mk.roller.slice(i2);
    const satir = el.parentElement;
    $$('button', satir).forEach((b2, j2) => b2.classList.toggle('on',
      (t.mk.yetki[ey] || []).includes(t.mk.roller[j2])));
    return;
  }

  /* ---- Sayfaya özel fark ---- */
  if (e === 'yapi-ky-fark-rol') {
    const pr = DB.proje(el.dataset.proje);
    if (!pr) return;
    const t = yapiTaslak(pr);
    const k = yapiKunye(t, el.dataset.sayfa);
    const roller = rolListesi((pr.palet || {}).roller);
    const i2 = roller.indexOf(el.dataset.ad);
    if (i2 < 0) return;
    k.fark = k.fark || { roller: [], eylemler: [], yetki: {}, kural: '' };
    const taban = (k.fark.roller || []).length
      ? roller.findIndex(r => k.fark.roller.includes(r)) : -1;
    k.fark.roller = taban === i2 ? [] : roller.slice(i2);
    render();
    return;
  }

  if (e === 'yapi-ky-fark-sil') {
    const pr = DB.proje(el.dataset.proje);
    if (!pr) return;
    const k = yapiKunye(yapiTaslak(pr), el.dataset.sayfa);
    k.fark = { roller: [], eylemler: [], yetki: {}, kural: '' };
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
  if (e === 'anlat-prompt') {
    const pr = DB.proje(el.dataset.proje);
    if (!pr) return;
    const t = yapiTaslak(pr);
    return metinPenceresi({
      baslik: 'Çözümleme promptu',
      aciklama: 'Kopyala, Claude\'a yapıştır; dönen bloğu buraya geri getir.',
      metin: PROMPT.cozumleme(pr, t),
    });
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
      const kurulu = DB.modulleri(pr.id).find(m => m.ad === t.modul);
      if (kurulu) {
        /* Modül duruyorsa yalnız yeni sayfalar eklenir; kopya olmasın. */
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

  if (e === 'proje-bolum') {
    const ad = el.dataset.ad;
    const suan = el.classList.contains('acik');
    ACIK_PROJE_BOLUM[ad] = !suan;
    return render();
  }

  if (e === 'sablon-ac') {
    const ad = el.dataset.ad;
    ACIK_SABLON = ACIK_SABLON === ad ? null : ad;
    return render();
  }

  if (e === 'sektorlere')     { location.hash = '#/sektorler'; return; }
  if (e === 'sektor-ekle')    return sektorDuzenle(null);
  if (e === 'sektor-duzenle') return sektorDuzenle(id);

  if (e === 'sablonlara')     { location.hash = '#/sablonlar'; return; }
  if (e === 'sablon-ekle')    return sablonDuzenle(null);
  if (e === 'sablon-duzenle') return sablonDuzenle(id);
  if (e === 'sablon-sil') {
    const ok = await onaySor({
      baslik: 'Şablon kaldırılsın mı?',
      mesaj: `"${el.dataset.ad}" şablonu listeden çıkacak. Bu şablondan kurulmuş
              projelerdeki modüllere dokunulmaz.`,
    });
    if (!ok) return;
    return isYap(() => DB.sablonSil(id), 'Şablon kaldırıldı.');
  }

  if (e === 'modul-ad') {
    const ad = await metinSor({ baslik: 'Modül adı', deger: el.dataset.ad, buton: 'Kaydet' });
    if (!ad || ad === el.dataset.ad) return;
    return isYap(() => DB.adDegistir('modules', id, ad), 'Ad güncellendi.');
  }

  if (e === 'modul-sil') return modulKaldir(el, id);

  if (e === 'sayfa-ekle') {
    const ad = await metinSor({ baslik: 'Yeni sayfa', yerTutucu: 'Örn. Sipariş Detayı', buton: 'Ekle' });
    if (!ad) return;
    return isYap(() => DB.sayfaEkle(id, ad), 'Sayfa eklendi.');
  }

  if (e === 'sayfa-sil') {
    const ok = await onaySor({
      baslik: 'Sayfa silinsin mi?',
      mesaj: `"${el.dataset.ad}" sayfası silinecek.`,
    });
    if (!ok) return;
    return isYap(() => DB.sayfaSil(id), 'Sayfa silindi.');
  }
}

/* Veri değiştiren işleri tek yerden çalıştır: hata olursa bildir, olmazsa yenile. */
async function isYap(fn, basariMesaji) {
  try {
    await fn();
    sayaclariYaz();
    render();
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

/* Fotoğrafın tavan bandı boş kalıyordu; selam oraya oturuyor. Eski
   karşılama bloğunun halkası yok — o yüzde özet kartında. */
function panelSelam() {
  const ad = String(AUTH.ad || '').split(' ')[0];
  return `
    <div class="p-selam-yer">
      <div class="p-selam">
        <b>${esc(selamla())}${ad ? ', ' + esc(ad) : ''}</b>
        <i>${esc(todayLabel())}</i>
      </div>
    </div>`;
}

/* ---------- Panelin kısayol ızgarası ----------
   Panel eskiden dört sayaç ve proje listesiydi: ne olduğunu söylüyor ama
   nereye gidileceğini söylemiyordu — her şeye alt çubuktan ulaşılıyordu.
   Şimdi önce gidilecek yerler, sayılar altta özet kartında.
   Kırmızı yalnız "Yeni Proje"de: ızgaranın ana eylemi o. */
function kisayolIzgarasi(projeSayi, acikIs) {
  const yon = AUTH.yonetici;

  /* --i: açılıştaki sıralı beliriş için; kartlar 42ms arayla geliyor. */
  const kutu = ({ ad, alt, ikon, adres, eylem, ana, yakinda }, i) => {
    /* Standartlar ekranındaki kartın dili: karo simge sol üstte, ok sağ
       üstte, yazı altta sola hizalı. `.kk-ust` adı yetkili kartında
       kullanılıyor, o yüzden `.kk-bas`. */
    const ic = `
      <span class="kk-bas">
        <span class="kk-dr">${svg(ICON[ikon], 20)}</span>
        ${yakinda ? '' : `<span class="kk-cv">${svg(ICON.chevron, 13)}</span>`}
      </span>
      <span class="kk-yz">
        <b>${esc(ad)}</b>
        <i>${esc(alt)}</i>
      </span>`;
    /* Henüz ekranı olmayan kart: yeri tutulsun ama boşa dokundurmasın. */
    const st = `style="--i:${i + 1}"`;
    if (yakinda) return `<span class="kk yakinda" ${st}>${ic}</span>`;
    return eylem
      ? `<button class="kk ${ana ? 'ana' : ''}" type="button" ${st} data-eylem="${eylem}">${ic}</button>`
      : `<a class="kk ${ana ? 'ana' : ''}" ${st} href="${adres}">${ic}</a>`;
  };

  const kutular = [
    { ad: 'Projeler', alt: projeSayi ? projeSayi + ' aktif proje' : 'henüz yok',
      ikon: 'folder', adres: '#/projeler' },
    { ad: 'Görevler', alt: acikIs ? acikIs + ' açık iş' : 'açık iş yok',
      ikon: 'check', adres: '#/gorevler' },
    /* Ekranı henüz yok; adı duruyor, yeri ayrıldı. */
    { ad: 'Örnek Projeler', alt: 'yakında', ikon: 'goz', yakinda: true },
    { ad: 'Ekip', alt: 'kullanıcı ve yetki', ikon: 'kisi',
      adres: yon ? '#/ekip' : '#/ayarlar', yakinda: !yon },
    { ad: 'Standartlar', alt: 'ortak tarifler', ikon: 'katman', adres: '#/standartlar' },
    { ad: 'Ayarlar', alt: 'uygulama ayarı', ikon: 'ayar', adres: '#/ayarlar' },
  ];

  return `<div class="kisayol">${kutular.map(kutu).join('')}</div>`;
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
  ACIK_MODUL.clear(); ACIK_SAYFA.clear(); ACIK_STANDART.clear();
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
    if (!$('.modal-perde') && !$('#sihirbaz') && !$('#onizleme')) render();
  });

  /* Telefon uygulamayı arka planda dondurunca canlı bağlantı kopuyor ve
     aradaki değişiklikler kaçıyor. Geri dönünce sessizce tazele. */
  document.removeEventListener('visibilitychange', geriDonunce);
  document.addEventListener('visibilitychange', geriDonunce);
}

/* Uygulamaya geri dönüldüğünde sessiz tazeleme — en fazla dakikada bir. */
let SON_TAZELEME = 0;
async function geriDonunce() {
  if (document.hidden || !AUTH.bagli) return;
  if (Date.now() - SON_TAZELEME < 60 * 1000) return;
  SON_TAZELEME = Date.now();

  try { await DB.yukle(); } catch (e) { return; }
  sayaclariYaz();
  if (!$('.modal-perde') && !$('#sihirbaz')) render();
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

  /* Dışarı açılan bağlantılar panoya da yazıyor. Ayrı dinleyici, çünkü
     eylem dinleyicisi preventDefault çağırıyor ve bağlantıyı öldürürdü.
     await yok: kopyalama jestin içinde başlar, gezinme beklemez. */
  document.addEventListener('click', e => {
    const el = e.target.closest('[data-pano]');
    if (!el) return;
    const pr = DB.proje(el.dataset.proje);
    const uret = PANO_PROMPT[el.dataset.pano];
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

    /* İhtiyaç promptu verildi: adım kartı "yapıştırmayı bekliyor"a geçsin.
       Çözümleme gelene kadar Studio bunu başka türlü bilemiyor. */
    if (el.dataset.pano === 'ihtiyac' && pr && !(pr.palet || {}).cozumIstendi) {
      DB.paletKaydet(pr.id, Object.assign({}, pr.palet || {}, { cozumIstendi: true }))
        .then(render).catch(() => {});
    }

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

  /* Uygulamaya dönüldüğünde bekleyen depo varsa adresi doldur. Depo adını
     biz ürettik, sahibini hatırlıyoruz — tahmin değil, kurduğumuz ad. */
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState !== 'visible') return;
    Object.keys(DEPO_BEKLIYOR).forEach(pid => {
      const pr = DB.proje(pid);
      if (!pr) { delete DEPO_BEKLIYOR[pid]; return; }
      if (pr.repo) { delete DEPO_BEKLIYOR[pid]; return; }
      delete DEPO_BEKLIYOR[pid];
      depoAdresiTamamla(pr);
    });
    Object.keys(PAGES_BEKLIYOR).forEach(pid => {
      const pr = DB.proje(pid);
      delete PAGES_BEKLIYOR[pid];
      if (!pr) return;
      const pl = pr.palet || {};
      if (!pl.alanAdi) yayinAdresiTamamla(pr);
      /* Adres zaten yazılıysa Pages'e gidilmesinin tek sebebi custom domain'i
         kaydetmek — dönüşte durağı yayında sayıyoruz. */
      else if (!pl.yayinda) {
        DB.paletKaydet(pr.id, Object.assign({}, pl, { yayinda: true }))
          .then(() => render())
          .catch(() => { /* çevrimdışıysa bir dahaki sefere */ });
      }
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
    if (durak === 'yapi' && YAPI_ACIK[id] && yapiGeri(YAPI_TASLAK[id])) {
      render();
      return;
    }
    /* Tasarımda karar ekranı ile harita aynı adresi paylaşıyor: geçmişte iki
       ayrı giriş yok. Geri okunu doğrudan history'ye bırakınca aşamanın
       içinden çıkıp gelinen sayfaya (çoğunlukla modüller) düşülüyordu.
       Önce bir kat yukarı: karar ekranından haritaya. */
    if (durak === 'tasarim' && TASARIM_MOD[id] === 'adim') {
      TASARIM_MOD[id] = 'harita';
      const pr = DB.proje(id);
      if (pr) await onaylariYaz(pr);
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

  boot();
});

/* ---------- PWA ---------- */

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('sw.js').catch(() => {});
  });
}
