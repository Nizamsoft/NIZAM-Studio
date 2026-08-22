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
  arti:    '<path d="M12 5v14M5 12h14"></path>',
  tik:     '<path d="M5 12l5 5L20 7"></path>',
  kapat:   '<path d="M6 6l12 12M18 6L6 18"></path>',
};

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
    const bugun = on ? on.bugun : DB.gorevleri({ durum: 'tamamlandi' })
      .filter(g => (g.guncellendi || '').slice(0, 10) === bugunTarih()).length;

    const ilerleme = DB.ilerleme(DB.gorevler);
    const acik = dev + kont;

    return `
      ${karsilama(ilerleme, p.length, acik)}

      <div class="stat-grid">
        ${stat('Aktif Proje', p.length, p.length ? 'devam ediyor' : 'henüz proje yok', '', 0, 'folder')}
        ${stat('Geliştiriliyor', dev, dev ? 'kodlanıyor' : 'açık iş yok', 'c-dev', 1, 'kalem')}
        ${stat('Kontrolde', kont, kont ? 'onayını bekliyor' : 'onayını bekleyen yok', 'c-check', 2, 'check')}
        ${stat('Bugün Biten', bugun, bugun ? 'onaylandı' : 'gün yeni başladı', 'c-done', 3, 'tik')}
      </div>

      <div class="section">
        <span class="label">Son projeler</span>
        ${p.length
          ? `<div class="proje-grid">${p.slice(0, 6).map(projeKarti).join('')}</div>`
          : `<div class="card">${empty(ICON.folder, 'Henüz proje yok',
               'İlk müşteri projeni oluştur; modülleri ve sayfalarıyla birlikte kurulsun.',
               AUTH.yonetici ? 'Yeni Proje' : null, 'sihirbaz')}</div>`}
      </div>

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

    /* Üç kova: ilerlemeye göre. Yüzde elle girilmiyor, görevlerden hesaplanıyor. */
    const kova = { calisilan: [], baslanmamis: [], tamamlanan: [] };
    DB.projeler.forEach(p => {
      const y = DB.sayim(p.id).yuzde;
      if (y >= 100)     kova.tamamlanan.push(p);
      else if (y > 0)   kova.calisilan.push(p);
      else              kova.baslanmamis.push(p);
    });

    const bolum = (anahtar, ad, liste, varsayilanAcik) => {
      if (!liste.length) return '';
      const acik = ACIK_PROJE_BOLUM[anahtar] === undefined
        ? varsayilanAcik
        : ACIK_PROJE_BOLUM[anahtar];

      return `
        <div class="pgrup">
          <button class="pgrup-bas ${acik ? 'acik' : ''}" data-eylem="proje-bolum"
                  data-ad="${anahtar}" type="button" aria-expanded="${acik}">
            <span class="chev">${svg(ICON.chevron, 15)}</span>
            <span class="pgrup-ad">${ad}</span>
            <span class="pgrup-say">${liste.length}</span>
          </button>
          ${acik ? `<div class="proje-grid">${liste.map(projeKarti).join('')}</div>` : ''}
        </div>`;
    };

    return bolum('calisilan',   'Üstünde çalışılan', kova.calisilan,   true)
         + bolum('baslanmamis', 'Başlanmamış',       kova.baslanmamis, false)
         + bolum('tamamlanan',  'Tamamlanan',        kova.tamamlanan,  false);
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

    return projeKunyesi(proje) + projeYolu(proje);
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

    if (!DB.standartlar.length) {
      return `
        <div class="card">${empty(ICON.katman, 'Standart yok',
          'sql/05-standartlar.sql dosyasını Supabase\'de çalıştırırsan sekiz hazır standart kurulur.',
          AUTH.yonetici ? 'Yeni Standart' : null, 'standart-ekle')}</div>
        ${AUTH.yonetici ? `
          <div class="standart-arac">
            <button class="mini-link" data-eylem="standart-ice-aktar" type="button">
              ${svg(ICON.ice, 13)} Hazır blok yapıştır</button>
          </div>` : ''}`;
    }

    return `
      <div class="note" style="margin-bottom:12px">
        ${svg(ICON.info, 15)}
        <span>Bir görev bu standartlardan birine dokunuyorsa, tarifi promptun içine
        kendiliğinden yapıştırılır. Aynı şeyi her seferinde yazmazsın.</span>
      </div>
      ${AUTH.yonetici ? `
        <div class="standart-arac">
          <button class="mini-link" data-eylem="standart-ice-aktar" type="button">
            ${svg(ICON.ice, 13)} Hazır blok yapıştır</button>
        </div>` : ''}
      ${DB.standartGruplari().map(grupKarti).join('')}
    `;
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

/* Proje içindeki beş durak. Adres, ad ve içeriği tek yerde tanımlı. */
const DURAKLAR = {
  firma:      { no: 1, ad: 'Firma bilgileri',    ciz: firmaSayfasi },
  tasarim:    { no: 2, ad: 'Tasarımı belirleme', ciz: tasarimSayfasi },
  yapi:       { no: 3, ad: 'Yapıyı kurma',       ciz: yapiSayfasi },
  gelistirme: { no: 4, ad: 'Geliştirme',         ciz: gelistirmeSayfasi },
  surum:      { no: 5, ad: 'Sürüm',              ciz: surumSayfasi },
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
      <h1>${esc(p.firma)}</h1>
      <span class="hero-rozetler">
        ${rozet.map((x, i) => `<span class="rz ${i === 0 && p.sektor ? 'marka' : ''}">${esc(x)}</span>`).join('')}
      </span>
    </div>`;
}

function bolumBas(ad) {
  return `<div class="bl"><span>${esc(ad)}</span><i></i></div>`;
}

/* 1 · Firma bilgileri */
function firmaSayfasi(p, d) {
  const dil  = (DIL_SECENEK.find(x => x.kod === p.dil) || {}).ad;
  const para = (PARA_SECENEK.find(x => x.kod === p.para) || {}).ad;

  return sayfaHero(p, d)
    + yetkiliKarti(p)
    + bolumBas('Ürün') + `
      <div class="ikili">
        <div class="tkutu">
          <span class="ik">${svg(ICON.katman, 14)}</span>
          <b>Platform</b><u>${esc(PLATFORM_ADI[p.platform] || '—')}</u>
        </div>
        <div class="tkutu">
          <span class="ik">${svg(ICON.kova, 14)}</span>
          <b>Veritabanı</b><u>${esc(VERI_ADI[p.veri] || '—')}</u>
        </div>
      </div>`
    + takvimBolumu(p)
    + bolumBas('Diğer') + `
      <div class="satirlar">
        <div class="sr">${svg(ICON.info, 15)} Dil ve para
          <b>${dil || para ? esc([dil, para].filter(Boolean).join(' · ')) : '—'}</b></div>
        <div class="sr" data-eylem="repo" data-proje="${p.id}" role="button" tabindex="0">
          ${svg(ICON.katman, 15)} Depo
          ${p.repo ? `<b class="mono">${esc(p.repo)}</b>` : '<b class="eksik">eklenmedi</b>'}</div>
        <div class="sr" data-eylem="kimlik" data-proje="${p.id}" role="button" tabindex="0">
          ${svg(ICON.kopya, 15)} Kimlik dosyası <b>NIZAM.md</b></div>
      </div>`
    + (AUTH.yonetici ? `
      <button class="sayfa-dug" data-eylem="firma-duzenle" data-proje="${p.id}" type="button">
        ${svg(ICON.kalem, 15)} Bilgileri düzenle</button>` : '');
}

function yetkiliKarti(p) {
  if (!p.yetkili && !p.telefon && !p.eposta) {
    return bolumBas('Yetkili kişi') + `
      <div class="bos-kutu">
        ${svg(ICON.kisi, 18)}
        <span>Yetkili kişi girilmemiş. İş sırasında soru çıkarsa kime soracağın belli olsun.</span>
      </div>`;
  }

  const alt = [p.telefon, p.eposta].filter(Boolean).join(' · ');

  return bolumBas('Yetkili kişi') + `
    <div class="kisi-kart" style="${renkDegiskenleri(p.renk)}">
      <div class="kk-ust">
        <span class="kk-av">${esc(basHarf(p.yetkili || '?'))}</span>
        <span class="kk-ad">
          <b>${esc(p.yetkili || 'Adı girilmemiş')}</b>
          ${alt ? `<i>${esc(alt)}</i>` : ''}
        </span>
      </div>
      <div class="kk-eylem">
        ${p.telefon ? `<a class="ke" href="tel:${esc(p.telefon.replace(/\s/g, ''))}">
          ${svg(ICON.telefon, 14)} Ara</a>` : ''}
        ${p.eposta ? `<a class="ke" href="mailto:${esc(p.eposta)}">
          ${svg(ICON.mail, 14)} Mail</a>` : ''}
        <button class="ke" data-eylem="yetkili-kopyala" data-proje="${p.id}" type="button">
          ${svg(ICON.kopya, 14)} Kopyala</button>
      </div>
    </div>`;
}

/* Takvim: tarih satırı okumaktan hızlı — çubuk bugünün nerede olduğunu gösteriyor. */
function takvimBolumu(p) {
  if (!p.baslangic && !p.teslim) {
    return bolumBas('Takvim') + `
      <div class="bos-kutu">
        ${svg(ICON.info, 18)}
        <span>Tarih girilmemiş. Teslim tarihi koyarsan geciken projeler ayrı gösterilir.</span>
      </div>`;
  }

  const bas = p.baslangic ? new Date(p.baslangic) : null;
  const son = p.teslim ? new Date(p.teslim) : null;
  const bugun = new Date(bugunTarih());

  let yuzde = 0, ust = '', sag = '';
  if (bas && son && son > bas) {
    yuzde = Math.max(0, Math.min(100, Math.round((bugun - bas) / (son - bas) * 100)));
    const kalan = Math.round((son - bugun) / 86400000);
    ust = kalan >= 0 ? `${kalan} gün kaldı` : `${-kalan} gün geçti`;
    sag = `%${yuzde} geçti`;
  } else {
    ust = bas ? 'Başladı' : 'Teslim bekliyor';
  }

  return bolumBas('Takvim') + `
    <div class="takvim" style="${renkDegiskenleri(p.renk)}">
      <div class="tk-ust">
        <b class="${son && bugun > son ? 'gecikti' : ''}">${esc(ust)}</b>
        ${sag ? `<em>${esc(sag)}</em>` : ''}
      </div>
      ${bas && son ? `<div class="ray"><i style="width:${yuzde}%"></i><b style="left:${yuzde}%"></b></div>` : ''}
      <div class="tk-uc">
        <span>Başlangıç<b>${bas ? esc(gunYaz(p.baslangic)) : '—'}</b></span>
        <span>Teslim<b>${son ? esc(gunYaz(p.teslim)) : '—'}</b></span>
      </div>
    </div>`;
}

/* 2 · Tasarımı belirleme */
function tasarimSayfasi(p, d) {
  const pl = p.palet || null;
  const acikTema = PROMPT.temaAcik(p);
  const adres = DB.logoAdres[p.id];

  const serit = pl
    ? `<div class="palet-tam">${PALET_ALAN.filter(a => a.renk).map(a => {
        const renk = pl[a.anahtar] || '#333';
        return `<span style="background:${esc(renk)}"><em>${esc(renk.replace('#', ''))}</em></span>`;
      }).join('')}</div>`
    : `<div class="bos-kutu">${svg(ICON.katman, 18)}
        <span>Palet yok. Logoyu yükle, promptu kopyala, Claude'a logoyla birlikte ver;
        dönen cevabı buraya yapıştır.</span></div>`;

  return sayfaHero(p, d)
    + bolumBas('Logo') + `
      <div class="logo-bolum">
        <span class="mk-logo buyuk ${adres ? 'yukleniyor' : ''}"
              ${adres ? `data-logo="${esc(adres)}"` : ''}
              data-eylem="${AUTH.yonetici ? 'logo-yukle' : ''}" data-proje="${p.id}"
              ${AUTH.yonetici ? 'role="button" tabindex="0"' : ''}>
          <span class="logo-harf">${svg(ICON.folder, 20)}</span>
          ${adres ? '<span class="donen"></span>' : ''}
        </span>
        <span class="mk-yazi">
          <b>${adres ? 'Firma logosu' : 'Logo yok'}</b>
          <i>${AUTH.yonetici ? (adres ? 'Değiştirmek için dokun' : 'Yüklemek için dokun · en fazla 4 MB')
                             : (adres ? 'Yüklenmiş' : 'Yönetici yükleyecek')}</i>
        </span>
      </div>`
    + bolumBas('Palet') + serit
    + (pl ? `
      <div class="tip">
        <div><b>Başlık</b><u style="font-family:var(--yazi-baslik);font-weight:700">${esc(pl.baslik || '—')}</u></div>
        <div><b>Metin</b><u>${esc(pl.govde || '—')}</u></div>
      </div>` : '')
    + tasarimSecimi(p)
    + bolumBas('Ton') + `
      <div class="satirlar">
        <div class="sr">Tema
          <span class="secenek-serit ufak">
            <button class="ss ${acikTema ? '' : 'sec'}" data-eylem="tema-sec" data-proje="${p.id}"
                    data-deger="Koyu" type="button" ${AUTH.yonetici ? '' : 'disabled'}>Koyu</button>
            <button class="ss ${acikTema ? 'sec' : ''}" data-eylem="tema-sec" data-proje="${p.id}"
                    data-deger="Açık" type="button" ${AUTH.yonetici ? '' : 'disabled'}>Açık</button>
          </span>
        </div>
        ${pl && pl.ton ? `<div class="sr">Karakter <b>${esc(pl.ton)}</b></div>` : ''}
      </div>`
    + (AUTH.yonetici ? `
      <button class="sayfa-dug ikincil" data-eylem="palet-prompt" data-proje="${p.id}" type="button">
        ${svg(ICON.kopya, 15)} Prompt kopyala</button>
      <button class="sayfa-dug ikincil" data-eylem="palet-aktar" data-proje="${p.id}" type="button">
        ${svg(ICON.ice, 15)} Paleti yapıştır</button>
      ${pl ? `<button class="sayfa-dug" data-eylem="palet-duzenle" data-proje="${p.id}" type="button">
        ${svg(ICON.kalem, 15)} Elle düzenle</button>` : ''}` : '');
}

/* ---------- Arayüz biçimi: görselli seçim rafları ----------
   Her seçenek gerçek bir küçük çizim. Yazıyı okuyup hayal etmek gerekmez. */

function tasarimSecimi(p) {
  const pl = p.palet || {};
  return TASARIM_ALAN.map(a => {
    const secili = pl[a.anahtar] || a.varsayilan;
    return bolumBas(a.ad)
      + `<div class="raf-alt">${esc(a.alt)}</div>
         <div class="raf">${a.secim.map(x => `
           <button class="bsc ${x.ad === secili ? 'on' : ''}" type="button"
                   data-eylem="tasarim-sec" data-proje="${p.id}"
                   data-alan="${a.anahtar}" data-deger="${esc(x.ad)}"
                   ${AUTH.yonetici ? '' : 'disabled'} title="${esc(x.tarif)}">
             <span class="bon">${tasarimOnizleme(a.anahtar, x.ad)}</span>
             <span class="bsc-ad">${esc(x.ad)}</span>
           </button>`).join('')}</div>`;
  }).join('');
}

/* Tek bir seçeneğin küçük çizimi. Yalnız görsel — veri taşımaz. */
function tasarimOnizleme(alan, ad) {
  const satirlar = '<i class="ln b o"></i><i class="ln u"></i><i class="ln k"></i>';

  if (alan === 'kart') {
    const sinif = { 'Düz': 'duz', 'Yükseltilmiş': 'yuksek', 'Çizgili': 'cizgi',
                    'Buzlu cam': 'cam', 'Şerit vurgu': 'serit', 'Kağıt': 'kagit' }[ad];
    return `<span class="on-kart k-${sinif}">${satirlar}</span>`;
  }

  if (alan === 'kose') {
    const r = { 'Keskin': '0', 'Hafif': '5px', 'Yuvarlak': '12px', 'Hap': '999px' }[ad];
    return `<span class="on-kose" style="border-radius:${r}"></span>`;
  }

  if (alan === 'yogunluk') {
    const [say, ara] = { 'Sıkışık': [5, 3], 'Normal': [4, 7], 'Ferah': [3, 12] }[ad];
    return `<span class="on-yog" style="gap:${ara}px">${'<i></i>'.repeat(say)}</span>`;
  }

  if (alan === 'tablo') {
    const sinif = { 'Çizgisiz': '', 'Zebra': 't-zebra',
                    'Yatay çizgi': 't-yatay', 'Tam ızgara': 't-izgara' }[ad];
    const hucre = '<i></i><i></i><i></i>';
    return `<span class="on-tb ${sinif}"><u class="h">${hucre}</u>${
      `<u class="r">${hucre}</u>`.repeat(4)}</span>`;
  }

  if (alan === 'tablomobil') {
    if (ad === 'Karta dönüş') return `<span class="on-mk">${'<i></i>'.repeat(4)}</span>`;
    if (ad === 'Yana kaydır') {
      const hucre = '<i></i><i></i><i></i><i></i>';
      return `<span class="on-tb t-yatay tasan"><u class="h">${hucre}</u>${
        `<u class="r">${hucre}</u>`.repeat(4)}</span>`;
    }
    const hucre = '<i></i><i class="dar"></i>';
    return `<span class="on-tb t-yatay"><u class="h">${hucre}</u>${
      `<u class="r">${hucre}</u>`.repeat(4)}</span>`;
  }

  if (alan === 'dugme') {
    const sinif = { 'Dolu': 'd-dolu', 'Çizgili': 'd-cizgi', 'Yumuşak': 'd-yumusak' }[ad];
    return `<span class="on-dg"><em class="${sinif}">Kaydet</em></span>`;
  }

  /* simge — üç örnek: ev, kişi, arama. Dolu set kendi kapalı biçimlerini
     kullanır; kontur biçimini doldurmak çirkin sonuç veriyor. */
  const sinif = { 'Çizgi': 'cizgi', 'Dolu': 'dolu', 'İki katman': 'katman' }[ad];
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
  const yol = (sinif === 'dolu' ? dolgulu : kontur)
    .map(d => `<svg viewBox="0 0 24 24">${d}</svg>`).join('');
  return `<span class="on-sm sm-${sinif}">${yol}</span>`;
}

/* 3 · Yapıyı kurma */
function yapiSayfasi(p, d) {
  const moduller = DB.modulleri(p.id);
  const s = DB.sayim(p.id);

  return sayfaHero(p, d) + `
    <div class="ikili">
      <div class="tkutu"><span class="ik">${svg(ICON.katman, 14)}</span><b>Modül</b><u>${s.modul}</u></div>
      <div class="tkutu"><span class="ik">${svg(ICON.folder, 14)}</span><b>Sayfa</b><u>${s.sayfa}</u></div>
    </div>`
    + bolumBas('Modüller ve sayfalar')
    + (moduller.length ? moduller.map(modulKarti).join('')
        : `<div class="bos-kutu">${svg(ICON.katman, 18)}
            <span>Henüz modül yok. Modül kurduğunda sayfaları da birlikte gelir.</span></div>`)
    + (AUTH.yonetici ? `
      <button class="sayfa-dug" data-eylem="modul-ekle" data-proje="${p.id}" type="button">
        ${svg(ICON.arti, 15)} Modül Ekle</button>` : '');
}

/* 4 · Geliştirme */
function gelistirmeSayfasi(p, d) {
  const s = DB.sayim(p.id);
  const gorevler = DB.gorevleri({ proje: p.id });
  const dev  = gorevler.filter(g => g.durum === 'gelistiriliyor').length;
  const kont = gorevler.filter(g => g.durum === 'kontrolde').length;

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
    + bolumBas('Açık işler')
    + (gorevler.length
        ? `<div class="card liste">${gorevler.slice(0, 12).map(gorevKarti).join('')}</div>`
        : `<div class="bos-kutu">${svg(ICON.check, 18)}
            <span>Henüz görev yok. Yapı durağındaki sayfalara görev açtığında burada listelenir.</span></div>`);
}

/* 5 · Sürüm */
function surumSayfasi(p, d) {
  return sayfaHero(p, d)
    + bolumBas('Depo') + `
      <div class="satirlar">
        <div class="sr" data-eylem="repo" data-proje="${p.id}" role="button" tabindex="0">
          ${svg(ICON.katman, 15)} Adres
          ${p.repo ? `<b class="mono">${esc(p.repo)}</b>` : '<b class="eksik">eklenmedi</b>'}</div>
      </div>`
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
function projeKunyesi(p) {
  const s = DB.sayim(p.id);
  const adres = DB.logoAdres[p.id];

  return `
    <div class="kunye">
      <span class="kunye-logo ${adres ? 'yukleniyor' : ''}"
            ${adres ? `data-logo="${esc(adres)}"` : ''}>
        <span class="logo-harf">${esc(basHarf(p.firma))}</span>
        ${adres ? '<span class="donen"></span>' : ''}
      </span>
      <span class="kunye-yazi">
        <h2>${esc(p.firma)}</h2>
        <p>${[p.sektor, PLATFORM_ADI[p.platform] || p.platform, VERI_ADI[p.veri] || p.veri]
              .filter(Boolean).map(esc).join(' · ')}</p>
      </span>
      <span class="kunye-pct mono">%${s.yuzde}</span>
    </div>
    <div class="kunye-bar"><i style="width:${s.yuzde}%"></i></div>`;
}

/* Projenin beş durağı. Durum veriden okunur, elle girilmez. */
function projeDuraklari(p) {
  const s        = DB.sayim(p.id);
  const moduller = DB.modulleri(p.id);
  const gercek   = moduller.filter(m => m.ad !== GENEL_MODUL).length;
  const paletVar = !!(p.palet && p.palet.bg);

  return [
    {
      ad: 'Firma bilgileri',
      bitti: true,
      ozet: [p.sektor, PLATFORM_ADI[p.platform] || '—', VERI_ADI[p.veri] || '—']
        .filter(Boolean).join(' · '),
    },
    {
      ad: 'Tasarımı belirleme',
      bitti: paletVar,
      ozet: paletVar
        ? 'Logo ve palet hazır.'
        : 'Logoyu yükle, promptu kopyala, dönen paleti yapıştır.',
    },
    {
      ad: 'Yapıyı kurma',
      bitti: gercek > 0,
      ozet: gercek
        ? `${gercek} modül · ${s.sayfa} sayfa`
        : 'Henüz modül yok. Modül kurduğunda sayfaları da birlikte gelir.',
    },
    {
      ad: 'Geliştirme',
      bitti: s.gorev > 0 && s.bitmis === s.gorev,
      ozet: s.gorev
        ? `${s.bitmis}/${s.gorev} görev bitti`
        : 'Sayfalara görev açtığında burada ilerleme görünecek.',
    },
    {
      ad: 'Sürüm',
      bitti: false,
      kilitli: true,
      ozet: 'GitHub bağlanınca commit\'ler buraya düşecek.',
    },
  ];
}

function projeYolu(p) {
  const duraklar = projeDuraklari(p);
  /* Şimdiki durak: bitmemiş ilk durak. Kilitli olan sıraya girmez. */
  const simdi = duraklar.findIndex(d => !d.bitti && !d.kilitli);
  const anahtarlar = Object.keys(DURAKLAR);

  return `<div class="yol">${duraklar.map((d, i) => {
    const durum = d.bitti ? 'bitti' : (i === simdi ? 'simdi' : 'bekliyor');
    const etiket = d.bitti ? 'tamam' : (i === simdi ? 'şimdi burada' : 'bekliyor');

    return `
      <a class="durak ${durum}" href="#/projeler/${p.id}/${anahtarlar[i]}">
        <span class="durak-no">${i + 1}</span>
        <div class="durak-bas">
          <h3>${esc(d.ad)}</h3>
          <em>${etiket}</em>
          <span class="durak-chev">${svg(ICON.chevron, 14)}</span>
        </div>
        <p>${d.ozet}</p>
      </a>`;
  }).join('')}</div>`;
}





/* Yapıştırılan paleti okur. Biçim: "Arka plan: #0f0e0d" satırları. */
function paletCozumle(metin) {
  /* Palet alanları + arayüz biçimi alanları tek listede okunur. */
  const tumu = PALET_ALAN.concat(TASARIM_ALAN.map(a => ({
    anahtar: a.anahtar, ad: a.ad, secim: a.secim.map(x => x.ad), bicim: true,
  })));

  const anahtar = {};
  tumu.forEach(a => { anahtar[a.ad.toLocaleLowerCase('tr')] = a.anahtar; });

  const palet = {};
  const hatalar = [];

  String(metin || '').split(/\r?\n/).forEach(satir => {
    const es = satir.match(/^\s*\*{0,2}([A-Za-zÇĞİÖŞÜçğıöşü\s/&]+?)\*{0,2}\s*:\s*(.+?)\s*$/);
    if (!es) return;

    const k = anahtar[es[1].trim().toLocaleLowerCase('tr')];
    if (!k) return;

    let deger = es[2].replace(/^`|`$/g, '').trim();
    const alan = tumu.find(a => a.anahtar === k);

    if (alan.secim) {
      const uy = alan.secim.find(x => x.toLocaleLowerCase('tr') === deger.toLocaleLowerCase('tr'));
      if (!uy) {
        hatalar.push(alan.secim.length > 3
          ? `"${alan.ad}" listedeki adlardan biri olmalı, "${deger}" değil.`
          : `"${alan.ad}" ${alan.secim.join(' ya da ')} olmalı.`);
        return;
      }
      deger = uy;
    } else if (alan.renk) {
      const renk = deger.match(/#[0-9a-fA-F]{6}\b/);
      if (!renk) { hatalar.push(`"${alan.ad}" bir renk kodu değil: ${deger}`); return; }
      deger = renk[0].toLowerCase();
    }
    palet[k] = deger;
  });

  const eksik = PALET_ALAN.filter(a => !palet[a.anahtar]).map(a => a.ad);
  return { palet, eksik, hatalar };
}

function projeKarti(p, i = 0) {
  const s = DB.sayim(p.id);
  return `
    <div class="card proje tilt" data-eylem="proje-ac" data-id="${p.id}" role="button" tabindex="0"
         style="${renkDegiskenleri(p.renk)};--i:${i}">
      <span class="parlama"></span>
      <div class="proje-ust">
        <span class="proje-rozet" style="${renkStil(p.renk)}">${esc(basHarf(p.firma))}</span>
        <span class="proje-ad-kutu">
          <span class="proje-ad">${esc(p.firma)}</span>
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

   Beklenen biçim (Tarif satırı çok satırlı olabilir):

     Ad: Alt Sekme Çubuğu
     Grup: Arayüz
     Özet: Mobil · buzlu cam
     Tarif: 900 pikselin altındaki ekranlarda...

   Birden fazla standart alt alta yapıştırılabilir; her yeni "Ad:" satırı
   yeni bir kaydı başlatır. Araya "---" konabilir, zorunlu değil. */
function standartCozumle(metin) {
  const ANAHTAR = {
    ad: 'ad', grup: 'grup',
    'özet': 'ozet', ozet: 'ozet',
    tarif: 'tarif', 'açıklama': 'tarif', aciklama: 'tarif',
  };

  const kayitlar = [];
  const hatalar  = [];
  let simdiki = null;
  let sonAlan = null;

  const kapat = () => {
    if (!simdiki) return;
    ['ad', 'grup', 'ozet', 'tarif'].forEach(a => { simdiki[a] = (simdiki[a] || '').trim(); });
    if (!simdiki.ad)         hatalar.push('Adı olmayan bir blok atlandı.');
    else if (!simdiki.tarif) hatalar.push(`"${simdiki.ad}" için tarif yok, atlandı.`);
    else {
      if (!simdiki.grup) simdiki.grup = VARSAYILAN_GRUP;
      kayitlar.push(simdiki);
    }
    simdiki = null; sonAlan = null;
  };

  String(metin || '').split(/\r?\n/).forEach(satir => {
    if (/^\s*-{3,}\s*$/.test(satir)) { kapat(); return; }

    const es = satir.match(/^\s*([A-Za-zÇĞİÖŞÜçğıöşü]+)\s*:\s*([\s\S]*)$/);
    const alan = es ? ANAHTAR[es[1].toLocaleLowerCase('tr')] : null;

    if (alan === 'ad') kapat();

    if (alan) {
      if (!simdiki) simdiki = { ad: '', grup: '', ozet: '', tarif: '' };
      simdiki[alan] = es[2];
      sonAlan = alan;
      return;
    }

    /* Anahtar yoksa satır, son alanın devamıdır — çok satırlı tarifler böyle çalışır. */
    if (simdiki && sonAlan) simdiki[sonAlan] += '\n' + satir;
  });

  kapat();
  return { kayitlar, hatalar };
}

/* Düzenleme penceresindeki grup önerileri: sabit liste + veride geçen adlar. */
function grupSecenekleri() {
  const varOlan = DB.standartlar.map(st => (st.grup || '').trim()).filter(Boolean);
  return [...new Set([...STANDART_GRUPLARI, ...varOlan])];
}

/* Bir standart grubu. Başlığa basınca açılır; başka bir grup açılınca kapanır. */
function grupKarti(g, i = 0) {
  const acik = ACIK_GRUP === g.ad;
  const kac  = g.liste.length;

  return `
    <div class="card modul standart-grup" style="--i:${i}">
      <div class="modul-bas ${acik ? 'acik' : ''}" data-eylem="standart-grup-ac" data-ad="${esc(g.ad)}"
           role="button" tabindex="0" aria-expanded="${acik}">
        <span class="chev">${svg(ICON.chevron, 15)}</span>
        <span class="modul-ikon">${svg(ICON.katman, 16)}</span>
        <span class="modul-yazi">
          <span class="modul-ad">${esc(g.ad)}</span>
          <span class="modul-alt">${kac} standart</span>
        </span>
      </div>

      ${acik ? `<div class="grup-govde">${g.liste.map(standartKarti).join('')}</div>` : ''}
    </div>`;
}

function standartKarti(st, i = 0) {
  const acik = ACIK_STANDART.has(st.id);
  const kac  = DB.standartKullanimi(st.id);

  return `
    <div class="card standart" style="--i:${i}">
      <div class="standart-bas ${acik ? 'acik' : ''}" data-eylem="standart-ac" data-id="${st.id}"
           role="button" tabindex="0">
        <span class="chev">${svg(ICON.chevron, 15)}</span>
        <span class="modul-ikon">${svg(ICON.katman, 16)}</span>
        <span class="modul-yazi">
          <span class="modul-ad">${esc(st.ad)}</span>
          <span class="modul-alt">${esc(st.ozet)}</span>
        </span>
        <span class="kullanim mono">${kac ? kac + ' projede' : 'kullanılmadı'}</span>
      </div>

      ${acik ? `
        <div class="standart-govde">
          <p class="standart-tarif">${st.tarif ? esc(st.tarif) : '<em class="ipucu">Tarif henüz yazılmadı.</em>'}</p>
          ${AUTH.yonetici ? `
            <div class="modul-araclar" style="padding-left:0;margin-top:12px">
              <button class="mini-link" data-eylem="standart-duzenle" data-id="${st.id}" type="button">
                ${svg(ICON.kalem, 13)} Düzenle</button>
              <button class="mini-link" data-eylem="standart-kopyala" data-id="${st.id}" type="button">
                ${svg(ICON.kopya, 13)} Tarifi kopyala</button>
              <button class="mini-link tehlike" data-eylem="standart-sil" data-id="${st.id}"
                      data-ad="${esc(st.ad)}" type="button">${svg(ICON.cop, 13)} Kaldır</button>
            </div>` : ''}
        </div>` : ''}
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
  const { key, id, durak } = rota();
  const detay = key === 'projeler' && id;
  const sayfa = detay && DURAKLAR[durak] ? durak : null;

  /* Üstte iki satır: firma adı sabit, altında bulunduğun sayfanın adı. */
  const baslik = $('#page-title');
  if (sayfa) {
    baslik.textContent = DURAKLAR[sayfa].ad;
  } else if (detay) {
    const p = DB.proje(id);
    baslik.textContent = p ? p.firma : 'Proje';
  } else {
    baslik.textContent = ROUTES[key].kisa || ROUTES[key].title;
  }

  hesapMenusuKapat();
  /* Zemin süsü yalnızca Panel'de. */
  $('#main').classList.toggle('susulu', key === 'panel' && !detay);
  ustEylemYaz(key, detay, id);
  artiYaz(key, detay, id);
  $('#btn-back').classList.toggle('hidden', !detay);
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
  baslangic: '',
  teslim: '',
  moduller: [],
  kaydediyor: false,
};

const SIHIRBAZ_ADIM = 6;

function sihirbaziAc() {
  modalHepsiniKapat();
  Object.assign(SIHIRBAZ, {
    adim: 1, firma: '', sektor: '', renk: 'yesil',
    logo: null, logoOnizleme: '',
    yetkili: '', telefon: '', eposta: '',
    platform: 'ikisi', veri: 'sifirdan',
    dil: 'tr', para: 'TRY',
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
  const a   = SIHIRBAZ.adim;
  const son = a === SIHIRBAZ_ADIM;

  const govde = [
    sihirbazFirma, sihirbazYetkili, sihirbazUrun,
    sihirbazAyar, sihirbazModul, sihirbazOzet,
  ][a - 1]();

  return `
    <div class="sh-tepe">
      <button class="sh-kapat" data-sb="kapat" type="button" aria-label="Kapat">
        ${svg(ICON.kapat, 15)}
      </button>
      <span class="sh-ad">Yeni Proje</span>
      <span class="sh-say mono">${a} / ${SIHIRBAZ_ADIM}</span>
    </div>

    <div class="sh-sayfa">
      <div class="sh-serit">
        ${Array.from({ length: SIHIRBAZ_ADIM }, (_, i) =>
          `<i class="${i < a - 1 ? 'ok' : i === a - 1 ? 'simdi' : ''}"></i>`).join('')}
      </div>

      <div class="sh-icerik">${govde}</div>

      <div class="sh-dip">
        <button class="btn btn-ghost" data-sb="${a === 1 ? 'kapat' : 'geri'}" type="button">
          ${a === 1 ? 'Vazgeç' : 'Geri'}
        </button>
        <button class="btn btn-primary" data-sb="${son ? 'kaydet' : 'ileri'}" type="button">
          <span>${son ? 'Projeyi Oluştur' : 'Devam'}</span>
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

/* 1 · Firma */
function sihirbazFirma() {
  const sektorler = DB.sektorler;
  const renkler = Object.keys(PROJE_RENK).map(k =>
    `<button class="renk ${SIHIRBAZ.renk === k ? 'sec' : ''}" data-sb="renk" data-deger="${k}"
       style="${renkStil(k)}" type="button" aria-label="${k}"></button>`).join('');

  return shBaslik(ICON.folder, 'Firma', 'Projenin kimliği. Bir kez girilir, her işe taşınır.') + `
    <label class="field">
      <span>Firma adı</span>
      <input type="text" id="sb-firma" value="${esc(SIHIRBAZ.firma)}"
             placeholder="Örn. Aydın Yapı" autocomplete="off" maxlength="60">
    </label>

    <div class="field">
      <span>Sektör <em class="ipucu">modül önerisini belirler</em></span>
      <div class="pullar">
        ${sektorler.map(x => `<button class="pul ${SIHIRBAZ.sektor === x.ad ? 'sec' : ''}"
           data-sb="sektor" data-deger="${esc(x.ad)}" type="button">${esc(x.ad)}</button>`).join('')}
        ${AUTH.yonetici ? `<button class="pul yeni" data-sb="sektor-ekle" type="button">
          ${svg(ICON.arti, 12)} Yeni sektör</button>` : ''}
      </div>
      ${sektorler.length ? '' : `<p class="ipucu" style="margin-top:8px">
        Sektör listesi boş. "Yeni sektör" ile ekleyebilir ya da bu adımı boş geçebilirsin.</p>`}
    </div>

    <div class="field">
      <span>Logo <em class="ipucu">isteğe bağlı</em></span>
      <div class="mk-ust">
        <span class="mk-logo buyuk ${SIHIRBAZ.logoOnizleme ? 'dolu' : ''}"
              ${SIHIRBAZ.logoOnizleme ? `style="background-image:url('${SIHIRBAZ.logoOnizleme}')"` : ''}
              data-sb="logo" role="button" tabindex="0">
          ${SIHIRBAZ.logoOnizleme ? '' : svg(ICON.folder, 20)}
        </span>
        <span class="mk-yazi">
          <b>${SIHIRBAZ.logo ? esc(SIHIRBAZ.logo.name) : 'Logo seç'}</b>
          <i>${SIHIRBAZ.logo ? 'Değiştirmek için dokun' : 'Renk paletini bundan üreteceğiz'}</i>
        </span>
      </div>
    </div>

    <div class="field">
      <span>Proje rengi</span>
      <div class="renkler">${renkler}</div>
    </div>`;
}

/* 2 · Yetkili kişi */
function sihirbazYetkili() {
  return shBaslik(ICON.kisi, 'Yetkili kişi', 'İş sırasında soru çıkarsa kime soracağını bilelim.') + `
    <label class="field">
      <span>Ad soyad</span>
      <input type="text" id="sb-yetkili" value="${esc(SIHIRBAZ.yetkili)}"
             placeholder="Örn. Mehmet Yılmaz" autocomplete="off" maxlength="60">
    </label>
    <label class="field">
      <span>Telefon</span>
      <input type="tel" id="sb-telefon" value="${esc(SIHIRBAZ.telefon)}"
             placeholder="0532 000 00 00" autocomplete="off" maxlength="24">
    </label>
    <label class="field">
      <span>E-posta <em class="ipucu">isteğe bağlı</em></span>
      <input type="email" id="sb-eposta" value="${esc(SIHIRBAZ.eposta)}"
             placeholder="ornek@firma.com" autocomplete="off"
             autocapitalize="off" spellcheck="false" maxlength="80">
    </label>

    <div class="note note-kucuk">
      ${svg(ICON.info, 15)}
      <span>Bu bilgiler yalnızca senin görebileceğin yerde durur.
      Prompta girmez, müşteri deposuna yazılmaz.</span>
    </div>`;
}

/* 3 · Ürün */
function sihirbazUrun() {
  const platform = [
    ['web',   'Web',          'Tarayıcıda çalışır'],
    ['mobil', 'Mobil',        'Telefon uygulaması'],
    ['ikisi', 'İkisi birden', 'Web + mobil, ortak veri'],
  ];
  const veri = [
    ['sifirdan', 'Sıfırdan kurulacak',        'Şemayı biz tasarlayacağız'],
    ['bagli',    'Hazır bir yere bağlanacak', 'Müşterinin sistemi var'],
  ];

  return shBaslik(ICON.katman, 'Ne yapılacak?', 'Bu iki cevap üretilecek sayfaları belirler.') + `
    <div class="field">
      <span>Nerede kullanılacak</span>
      <div class="secim">${platform.map(([d, ad, alt]) =>
        secimSatiri('platform', d, ad, alt, SIHIRBAZ.platform === d)).join('')}</div>
    </div>
    <div class="field">
      <span>Veritabanı</span>
      <div class="secim">${veri.map(([d, ad, alt]) =>
        secimSatiri('veri', d, ad, alt, SIHIRBAZ.veri === d)).join('')}</div>
    </div>`;
}

/* 4 · Dil, para, takvim */
function sihirbazAyar() {
  const serit = (tur, liste, secili) => `
    <div class="secenek-serit">
      ${liste.map(x => `<button class="ss ${secili === x.kod ? 'sec' : ''}"
        data-sb="${tur}" data-deger="${x.kod}" type="button">${esc(x.ad)}</button>`).join('')}
    </div>`;

  return shBaslik(ICON.ayar, 'Dil, para ve takvim',
    'Tarih biçimi, kuruş ayracı ve gecikme uyarısı buradan.') + `
    <div class="field">
      <span>Dil</span>
      ${serit('dil', DIL_SECENEK, SIHIRBAZ.dil)}
    </div>
    <div class="field">
      <span>Para birimi</span>
      ${serit('para', PARA_SECENEK, SIHIRBAZ.para)}
    </div>
    <label class="field">
      <span>Başlangıç</span>
      <input type="date" id="sb-baslangic" value="${esc(SIHIRBAZ.baslangic)}">
    </label>
    <label class="field">
      <span>Teslim hedefi <em class="ipucu">isteğe bağlı</em></span>
      <input type="date" id="sb-teslim" value="${esc(SIHIRBAZ.teslim)}">
    </label>

    <div class="note note-kucuk">
      ${svg(ICON.info, 15)}
      <span>Teslim tarihi girersen Panel'de <b>geciken projeler</b> ayrı gösterilir.
      Boş bırakırsan yalnızca yüzde görünür.</span>
    </div>`;
}

/* 5 · Modüller */
function sihirbazModul() {
  const sablonlar = DB.modulSablonlari();
  const sektor = DB.sektorler.find(x => x.ad === SIHIRBAZ.sektor);
  const onerilen = (sektor && sektor.moduller) || [];

  const alt = onerilen.length
    ? `${esc(SIHIRBAZ.sektor)} seçtiğin için bazıları önden işaretlendi.`
    : 'Seçtiklerin sayfalarıyla birlikte kurulur.';

  return shBaslik(ICON.katman, 'Hangi bölümler olacak?', alt) + `
    ${sablonlar.length ? `<div class="secim">${sablonlar.map(m => {
      const secili = SIHIRBAZ.moduller.includes(m.ad);
      const oneri  = onerilen.includes(m.ad);
      return `
        <div class="satir sec-satir ${secili ? 'sec' : ''}" data-sb="modul" data-deger="${esc(m.ad)}"
             role="button" tabindex="0">
          <span class="sec-yazi">
            <b>${esc(m.ad)}</b>
            <i>${(m.sayfalar || []).length} sayfa</i>
          </span>
          ${oneri ? '<span class="onerildi">önerildi</span>' : ''}
          <span class="kare">${secili ? svg(ICON.tik, 12) : ''}</span>
        </div>`;
    }).join('')}</div>` : `
      <div class="card">${empty(ICON.katman, 'Şablon yok',
        'Ayarlar → Modül Şablonları\'ndan ekleyebilirsin. Boş geçersen proje yalnızca Proje Geneli ile kurulur.')}</div>`}

    <div class="note note-kucuk">
      ${svg(ICON.info, 15)}
      <span>Her projeye ayrıca bir <b>Proje Geneli</b> kovası eklenir —
      modüle bağlanamayan işler oraya düşer.</span>
    </div>`;
}

/* 6 · Özet */
function sihirbazOzet() {
  const sablonlar = DB.modulSablonlari();
  const sayfa = SIHIRBAZ.moduller.reduce((t, ad) => {
    const m = sablonlar.find(x => x.ad === ad);
    return t + ((m && m.sayfalar || []).length);
  }, 0);

  const dil  = (DIL_SECENEK.find(x => x.kod === SIHIRBAZ.dil) || {}).ad || '—';
  const para = (PARA_SECENEK.find(x => x.kod === SIHIRBAZ.para) || {}).ad || '—';

  const satir = (ad, deger) => deger
    ? `<div class="os">${ad} <b>${esc(deger)}</b></div>` : '';

  return shBaslik(ICON.tik, 'Her şey doğru mu?',
    'Onaylarsan proje modülleri ve sayfalarıyla kurulur.') + `
    <div class="ozet-kutu">
      ${satir('Firma', SIHIRBAZ.firma || '—')}
      ${satir('Sektör', SIHIRBAZ.sektor)}
      ${satir('Yetkili', [SIHIRBAZ.yetkili, SIHIRBAZ.telefon].filter(Boolean).join(' · '))}
      ${satir('Platform', PLATFORM_ADI[SIHIRBAZ.platform])}
      ${satir('Veri', VERI_ADI[SIHIRBAZ.veri])}
      ${satir('Dil / Para', dil + ' · ' + para)}
      ${satir('Takvim', [SIHIRBAZ.baslangic, SIHIRBAZ.teslim].filter(Boolean).map(gunYaz).join(' → '))}
      ${satir('Bölümler', SIHIRBAZ.moduller.join(' · ') || 'yok')}
      ${satir('Kurulacak', sayfa ? sayfa + ' sayfa' : 'yalnızca Proje Geneli')}
    </div>`;
}

/* Tek seçimlik satır — platform ve veritabanı adımlarında kullanılıyor. */
function secimSatiri(alan, deger, ad, alt, secili) {
  return `<button class="sc ${secili ? 'sec' : ''}" data-sb="${alan}" data-deger="${deger}" type="button">
    <span class="sc-yazi"><span class="sc-ad">${ad}</span><span class="sc-alt">${alt}</span></span>
    <span class="tik">${secili ? svg(ICON.tik, 13) : ''}</span>
  </button>`;
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
      if (t === 'sektor-ekle') { yaz(); return sihirbazSektorEkle(); }

      yaz();
      if (t === 'renk')     SIHIRBAZ.renk = d;
      if (t === 'platform') SIHIRBAZ.platform = d;
      if (t === 'veri')     SIHIRBAZ.veri = d;
      if (t === 'dil')      SIHIRBAZ.dil = d;
      if (t === 'para')     SIHIRBAZ.para = d;
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
        dil:       SIHIRBAZ.dil,
        para:      SIHIRBAZ.para,
        baslangic: SIHIRBAZ.baslangic || null,
        teslim:    SIHIRBAZ.teslim || null,
      },
    });

    /* Logo ancak proje kurulduktan sonra yüklenebilir: dosya adı projenin
       kimliği. Yükleme patlarsa proje yine duruyor, logo sonradan eklenir. */
    if (SIHIRBAZ.logo) {
      try { await DB.logoYukle(id, SIHIRBAZ.logo); }
      catch (h) { toast('Proje kuruldu ama logo yüklenemedi — ' + h.message, 'uyari'); }
    }

    sihirbazKapat();
    sayaclariYaz();
    toast(SIHIRBAZ.firma.trim() + ' kuruldu.');
    location.hash = '#/projeler/' + id;
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
function metinSor({ baslik, aciklama, deger = '', yerTutucu = '', buton = 'Kaydet' }) {
  return new Promise(resolve => {
    modalAc(`
      ${modalBaslik(ICON.kalem, baslik, aciklama || '')}
      <label class="field">
        <input type="text" id="modal-metin" value="${esc(deger)}" placeholder="${esc(yerTutucu)}"
               autocomplete="off" maxlength="80">
      </label>
      <div class="modal-alt">
        <button class="btn btn-ghost" data-m="iptal" type="button">Vazgeç</button>
        <button class="btn btn-primary" data-m="tamam" type="button"><span>${esc(buton)}</span></button>
      </div>`, kutu => {
      const alan = $('#modal-metin', kutu);
      setTimeout(() => { alan.focus(); alan.select(); }, 40);

      const bitir = v => { modalKapat(); resolve(v); };
      alan.addEventListener('keydown', e => {
        if (e.key === 'Enter')  { e.preventDefault(); bitir(alan.value.trim() || null); }
        if (e.key === 'Escape') bitir(null);
      });
      $('[data-m="iptal"]', kutu).addEventListener('click', () => bitir(null));
      $('[data-m="tamam"]', kutu).addEventListener('click', () => bitir(alan.value.trim() || null));
    });
  });
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
    return metinPenceresi({
      baslik: 'Hazır prompt',
      aciklama: 'Kopyala, Claude Code\'a yapıştır. Başka bir şey yazmana gerek yok.',
      metin: PROMPT.gorev(id),
      dosya: null,
      geri: () => gorevKartiAc(id),
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
    ${modalBaslik(ICON.check, 'Yeni görev', (proje ? proje.firma : '') + ' · nereye bağlanacağını seç.')}

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

function metinPenceresi({ baslik, aciklama, metin, dosya, geri }) {
  modalAc(`
    ${modalBaslik(ICON.kopya, baslik, aciklama)}
    <pre class="kod">${esc(metin)}</pre>
    <div class="modal-alt">
      <button class="btn btn-ghost" data-mp="kapat" type="button">${geri ? 'Geri' : 'Kapat'}</button>
      ${dosya ? `<button class="btn btn-ghost" data-mp="indir" type="button">İndir</button>` : ''}
      <button class="btn btn-primary" data-mp="kopyala" type="button"><span>Panoya Kopyala</span></button>
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

    $('[data-mp="kopyala"]', kutu).addEventListener('click', async () => {
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
function firmaDuzenle(projeId) {
  modalHepsiniKapat();
  const p = DB.proje(projeId);
  if (!p) return;

  let sektor = p.sektor || '';
  let dil    = p.dil  || 'tr';
  let para   = p.para || 'TRY';

  const serit = (tur, liste, secili) => `
    <div class="secenek-serit">
      ${liste.map(x => `<button class="ss ${secili === x.kod ? 'sec' : ''}"
        data-fd="${tur}" data-deger="${x.kod}" type="button">${esc(x.ad)}</button>`).join('')}
    </div>`;

  modalAc(`
    ${modalBaslik(ICON.folder, 'Firma bilgileri', 'Bu bilgiler promptlara ve kimlik dosyasına girer.')}

    <div class="field">
      <span>Sektör <em class="ipucu">modül önerisini belirler</em></span>
      <div class="pullar">
        ${DB.sektorler.map(x => `<button class="pul ${sektor === x.ad ? 'sec' : ''}"
           data-fd="sektor" data-deger="${esc(x.ad)}" type="button">${esc(x.ad)}</button>`).join('')}
      </div>
      ${DB.sektorler.length ? '' : '<p class="ipucu" style="margin-top:8px">Sektör listesi boş — Ayarlar → Sektörler\'den ekleyebilirsin.</p>'}
    </div>

    <label class="field">
      <span>Yetkili kişi</span>
      <input type="text" id="fd-yetkili" value="${esc(p.yetkili || '')}"
             placeholder="Örn. Mehmet Yılmaz" maxlength="60" autocomplete="off">
    </label>
    <label class="field">
      <span>Telefon</span>
      <input type="tel" id="fd-telefon" value="${esc(p.telefon || '')}"
             placeholder="0532 000 00 00" maxlength="24" autocomplete="off">
    </label>
    <label class="field">
      <span>E-posta</span>
      <input type="email" id="fd-eposta" value="${esc(p.eposta || '')}"
             placeholder="ornek@firma.com" maxlength="80"
             autocomplete="off" autocapitalize="off" spellcheck="false">
    </label>

    <div class="field"><span>Dil</span>${serit('dil', DIL_SECENEK, dil)}</div>
    <div class="field"><span>Para birimi</span>${serit('para', PARA_SECENEK, para)}</div>

    <label class="field">
      <span>Başlangıç</span>
      <input type="date" id="fd-baslangic" value="${esc(p.baslangic || '')}">
    </label>
    <label class="field">
      <span>Teslim hedefi <em class="ipucu">isteğe bağlı</em></span>
      <input type="date" id="fd-teslim" value="${esc(p.teslim || '')}">
    </label>

    <div class="modal-alt">
      <button class="btn btn-ghost" data-fd="iptal" type="button">Vazgeç</button>
      <button class="btn btn-primary" data-fd="kaydet" type="button"><span>Kaydet</span></button>
    </div>`, kutu => {
    $$('[data-fd]', kutu).forEach(el => el.addEventListener('click', () => {
      const t = el.dataset.fd;
      const d = el.dataset.deger;
      if (t === 'iptal' || t === 'kaydet') return;

      if (t === 'sektor') sektor = sektor === d ? '' : d;
      if (t === 'dil')    dil = d;
      if (t === 'para')   para = d;

      $$(`[data-fd="${t}"]`, kutu).forEach(x => x.classList.toggle('sec',
        t === 'sektor' ? x.dataset.deger === sektor : x === el));
    }));

    $('[data-fd="iptal"]', kutu).addEventListener('click', modalKapat);

    $('[data-fd="kaydet"]', kutu).addEventListener('click', async () => {
      const al = id => $('#' + id, kutu).value.trim();
      const alanlar = {
        sektor:    sektor || null,
        yetkili:   al('fd-yetkili') || null,
        telefon:   al('fd-telefon') || null,
        eposta:    al('fd-eposta') || null,
        dil, para,
        baslangic: al('fd-baslangic') || null,
        teslim:    al('fd-teslim') || null,
      };

      const yazi = $('[data-fd="kaydet"] span', kutu);
      yazi.textContent = 'Kaydediliyor…';
      try {
        await DB.projeGuncelle(projeId, alanlar);
        modalKapat();
        render();
        toast('Bilgiler güncellendi.', 'basari');
      } catch (h) {
        yazi.textContent = 'Kaydet';
        toast(h.message, 'hata');
      }
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

/* Promptu panoya alır ve ne yapılacağını yazar. */
function paletPromptu(projeId) {
  const p = DB.proje(projeId);
  if (!p) return;

  metinPenceresi({
    baslik: 'Marka Paleti Promptu',
    aciklama: 'Kopyala, Claude\'a logoyla birlikte yapıştır.',
    metin: PROMPT.marka(projeId),
  });
}

/* Claude'un döndürdüğü bloğu okur ve projeye yazar. */
function paletAktar(projeId) {
  modalHepsiniKapat();
  const p = DB.proje(projeId);
  if (!p) return;

  const ORNEK = PALET_ALAN.map(a => `${a.ad}: ${a.ornek}`).join('\n');

  modalAc(`
    ${modalBaslik(ICON.ice, 'Paleti yapıştır', 'Claude\'un döndürdüğü bloğu olduğu gibi yapıştır.')}

    <label class="field">
      <span>Yapıştır</span>
      <textarea id="pa-metin" rows="11" spellcheck="false" placeholder="${esc(ORNEK)}"></textarea>
    </label>

    <div id="pa-onizleme"></div>

    <div class="modal-alt">
      <button class="btn btn-ghost" data-pa="iptal" type="button">Vazgeç</button>
      <button class="btn btn-primary" data-pa="kaydet" type="button" disabled><span>Kaydet</span></button>
    </div>`, kutu => {
    const alan  = $('#pa-metin', kutu);
    const on    = $('#pa-onizleme', kutu);
    const dugme = $('[data-pa="kaydet"]', kutu);
    let cozum = { palet: {}, eksik: [], hatalar: [] };

    const tazele = () => {
      cozum = paletCozumle(alan.value);
      const say = Object.keys(cozum.palet).length;

      if (!alan.value.trim()) { on.innerHTML = ''; dugme.disabled = true; return; }

      if (!say) {
        on.innerHTML = `<div class="note uyari">${svg(ICON.uyari, 15)}
          <span>Hiçbir satır okunamadı. Her satır <b>Alan: değer</b> biçiminde olmalı.</span></div>`;
        dugme.disabled = true;
        return;
      }

      on.innerHTML = `
        <span class="label">Okunanlar</span>
        <div class="card"><div class="row-list">
          ${PALET_ALAN.concat(TASARIM_ALAN).map(a => {
            const d = cozum.palet[a.anahtar];
            return `<div class="row">
              <div class="row-main"><span class="row-title">${esc(a.ad)}</span></div>
              <span class="row-val ${d ? '' : 'uyari-yazi'}">
                ${d && a.renk ? `<span class="palet-kutu ufak" style="background:${esc(d)}"></span>` : ''}
                ${d ? esc(d) : 'okunamadı'}
              </span>
            </div>`;
          }).join('')}
        </div></div>
        ${cozum.hatalar.length ? `<div class="note uyari" style="margin-top:10px">${svg(ICON.uyari, 15)}
          <span>${cozum.hatalar.map(esc).join(' ')}</span></div>` : ''}`;

      dugme.disabled = false;
    };

    alan.addEventListener('input', tazele);
    setTimeout(() => alan.focus(), 40);
    $('[data-pa="iptal"]', kutu).addEventListener('click', modalKapat);

    dugme.addEventListener('click', async () => {
      const yazi = $('[data-pa="kaydet"] span', kutu);
      yazi.textContent = 'Yazılıyor…';
      dugme.disabled = true;
      try {
        await DB.paletKaydet(projeId, Object.assign({}, p.palet || {}, cozum.palet));
        modalKapat();
        render();
        toast('Palet kaydedildi.', 'basari');
      } catch (h) {
        yazi.textContent = 'Kaydet';
        dugme.disabled = false;
        toast(h.message, 'hata');
      }
    });
  }, 'genis');
}

/* Elle düzenleme: renkler için renk seçici, yazı tipleri için metin. */
function paletDuzenle(projeId) {
  modalHepsiniKapat();
  const p = DB.proje(projeId);
  if (!p) return;
  const pl = p.palet || {};

  modalAc(`
    ${modalBaslik(ICON.kalem, 'Paleti düzenle', 'Beğenmediğin rengi değiştir.')}

    ${PALET_ALAN.map(a => a.secim ? `
      <div class="field">
        <span>${esc(a.ad)}</span>
        <div class="secenek-serit">
          ${a.secim.map(d => `<button class="ss ${(pl[a.anahtar] || a.ornek) === d ? 'sec' : ''}"
             data-ps="${a.anahtar}" data-deger="${esc(d)}" type="button">${esc(d)}</button>`).join('')}
        </div>
      </div>` : a.renk ? `
      <div class="palet-satir">
        <span class="palet-ad">${esc(a.ad)}</span>
        <input type="color" class="palet-sec" data-p="${a.anahtar}"
               value="${esc(pl[a.anahtar] || a.ornek)}">
        <input type="text" class="palet-kod mono" data-pk="${a.anahtar}"
               value="${esc(pl[a.anahtar] || a.ornek)}" maxlength="7" spellcheck="false">
      </div>` : `
      <label class="field">
        <span>${esc(a.ad)}</span>
        <input type="text" data-p="${a.anahtar}" value="${esc(pl[a.anahtar] || '')}"
               placeholder="${esc(a.ornek)}" maxlength="60" autocomplete="off">
      </label>`).join('')}

    <div class="modal-alt">
      <button class="btn btn-ghost" data-pd="iptal" type="button">Vazgeç</button>
      <button class="btn btn-primary" data-pd="kaydet" type="button"><span>Kaydet</span></button>
    </div>`, kutu => {
    /* Seçmeli alanlar (tema) */
    const secilen = {};
    PALET_ALAN.filter(a => a.secim).forEach(a => { secilen[a.anahtar] = pl[a.anahtar] || a.ornek; });
    $$('[data-ps]', kutu).forEach(b => b.addEventListener('click', () => {
      const k = b.dataset.ps;
      secilen[k] = b.dataset.deger;
      $$(`[data-ps="${k}"]`, kutu).forEach(x => x.classList.toggle('sec', x === b));
    }));

    /* Renk seçici ile kod kutusu birbirini takip etsin. */
    $$('.palet-sec', kutu).forEach(sec => {
      const kod = $(`[data-pk="${sec.dataset.p}"]`, kutu);
      sec.addEventListener('input', () => { kod.value = sec.value; });
      kod.addEventListener('input', () => {
        if (/^#[0-9a-fA-F]{6}$/.test(kod.value)) sec.value = kod.value;
      });
    });

    $('[data-pd="iptal"]', kutu).addEventListener('click', modalKapat);
    $('[data-pd="kaydet"]', kutu).addEventListener('click', async () => {
      const yeni = {};
      PALET_ALAN.forEach(a => {
        if (a.secim) { yeni[a.anahtar] = secilen[a.anahtar]; return; }
        const el = a.renk ? $(`[data-pk="${a.anahtar}"]`, kutu) : $(`[data-p="${a.anahtar}"]`, kutu);
        const d = (el.value || '').trim();
        if (d) yeni[a.anahtar] = a.renk ? d.toLowerCase() : d;
      });

      const yazi = $('[data-pd="kaydet"] span', kutu);
      yazi.textContent = 'Kaydediliyor…';
      try {
        await DB.paletKaydet(projeId, yeni);
        modalKapat();
        render();
        toast('Palet güncellendi.', 'basari');
      } catch (h) {
        yazi.textContent = 'Kaydet';
        toast(h.message, 'hata');
      }
    });
  }, 'genis');
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
   yerleşimi baştan hesaplanırdı; böyle yalnızca kaydırma ve saydamlık oynuyor,
   ikisi de ekran kartında yapılıyor. Takılma olmuyor. */
function hesapMenusu() {
  const acik = $('#hesap-panel');
  if (acik && acik.classList.contains('acik')) { hesapMenusuKapat(); return; }
  if (acik) acik.remove();

  const destekYazi = DESTEK.tip === 'wa' ? 'WhatsApp' : DESTEK.deger;

  const el = document.createElement('div');
  el.id = 'hesap-panel';
  el.className = 'hesap-panel';
  el.innerHTML = `
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
    <button class="hp-sat tehlike-satir" data-hs="cikis" type="button">
      <span class="hp-ikon">${svg(ICON.cikis, 16)}</span>
      <span class="hp-ad">Çıkış yap</span>
    </button>`;

  const ust = $('#topbar');
  ust.appendChild(el);
  ust.classList.add('panel-acik');
  /* Bir kare bekle ki geçiş oynasın; sınıfı hemen eklersek animasyon atlanır. */
  requestAnimationFrame(() => el.classList.add('acik'));

  $('[data-hs="bildirim"]', el).addEventListener('click', () => {
    hesapMenusuKapat();
    toast('Bildirimler Adım 5\'te gelecek.');
  });
  $('[data-hs="destek"]', el).addEventListener('click', () => {
    hesapMenusuKapat();
    const yer = DESTEK.tip === 'wa'
      ? 'https://wa.me/' + String(DESTEK.deger).replace(/\D/g, '')
      : 'mailto:' + DESTEK.deger;
    window.open(yer, '_blank');
  });
  $('[data-hs="cikis"]', el).addEventListener('click', () => { hesapMenusuKapat(); signOut(); });

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
  el.classList.remove('acik');
  /* Geçiş 320 ms; daha erken silersek kapanış görünmüyor. */
  setTimeout(() => el.remove(), 360);
}

/* Standart yazma / düzenleme penceresi */
function standartDuzenle(id) {
  modalHepsiniKapat();
  const st = id ? DB.standart(id) : null;

  modalAc(`
    ${modalBaslik(ICON.katman, st ? 'Standardı düzenle' : 'Yeni standart', 'Tarif prompta olduğu gibi girer — net ve emir kipinde yaz.')}

    <label class="field">
      <span>Ad</span>
      <input type="text" id="sd-ad" value="${esc(st ? st.ad : '')}"
             placeholder="Örn. Tarih Filtresi" maxlength="60" autocomplete="off">
    </label>
    <label class="field">
      <span>Grup <em class="ipucu">listede hangi başlığın altında duracak</em></span>
      <input type="text" id="sd-grup" list="sd-gruplar" maxlength="40" autocomplete="off"
             value="${esc(st ? (st.grup || VARSAYILAN_GRUP) : VARSAYILAN_GRUP)}"
             placeholder="Örn. Arayüz">
      <datalist id="sd-gruplar">
        ${grupSecenekleri().map(g => `<option value="${esc(g)}"></option>`).join('')}
      </datalist>
    </label>
    <label class="field">
      <span>Kısa özet <em class="ipucu">listede görünür</em></span>
      <input type="text" id="sd-ozet" value="${esc(st ? st.ozet : '')}"
             placeholder="Örn. Gün · Hafta · Ay · Aralık" maxlength="90" autocomplete="off">
    </label>
    <label class="field">
      <span>Tarif <em class="ipucu">prompta giren metin</em></span>
      <textarea id="sd-tarif" rows="7"
        placeholder="Dört seçenek sunulur: Gün, Hafta, Ay ve Aralık…">${esc(st ? st.tarif : '')}</textarea>
    </label>

    <div class="modal-alt">
      <button class="btn btn-ghost" data-sd="iptal" type="button">Vazgeç</button>
      <button class="btn btn-primary" data-sd="kaydet" type="button"><span>Kaydet</span></button>
    </div>`, kutu => {
    setTimeout(() => $('#sd-ad', kutu).focus(), 40);

    $('[data-sd="iptal"]', kutu).addEventListener('click', modalKapat);
    $('[data-sd="kaydet"]', kutu).addEventListener('click', async () => {
      const ad    = $('#sd-ad', kutu).value.trim();
      const grup  = $('#sd-grup', kutu).value.trim() || VARSAYILAN_GRUP;
      const ozet  = $('#sd-ozet', kutu).value.trim();
      const tarif = $('#sd-tarif', kutu).value.trim();

      if (!ad)    { toast('Standardın adını yaz.'); return; }
      if (!tarif) { toast('Tarifi yaz — prompta bu metin giriyor.'); return; }

      const btn = $('[data-sd="kaydet"] span', kutu);
      btn.textContent = 'Kaydediliyor…';
      try {
        await DB.standartKaydet(id, { ad, grup, ozet, tarif });
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

  if (e === 'tema-sec') {
    const pr = DB.proje(el.dataset.proje);
    if (!pr) return;
    if (PROMPT.temaAcik(pr) === (el.dataset.deger === 'Açık')) return;
    return isYap(
      () => DB.paletKaydet(pr.id, Object.assign({}, pr.palet || {}, { tema: el.dataset.deger })),
      el.dataset.deger + ' tema seçildi.');
  }

  if (e === 'tasarim-sec') {
    const pr = DB.proje(el.dataset.proje);
    const al = TASARIM_ALAN.find(a => a.anahtar === el.dataset.alan);
    if (!pr || !al) return;
    const deger = el.dataset.deger;
    if ((pr.palet && pr.palet[al.anahtar] || al.varsayilan) === deger) return;
    /* Beklemeden işaretle: raf anında tepki versin. Yeniden çizmiyoruz,
       yoksa sayfa tepeye fırlar. Yazma tutmazsa eski işaret geri gelir. */
    const raf   = el.parentElement;
    const eskiB = $('.bsc.on', raf);
    $$('.bsc', raf).forEach(b => b.classList.toggle('on', b === el));
    try {
      await DB.paletKaydet(pr.id, Object.assign({}, pr.palet || {}, { [al.anahtar]: deger }));
    } catch (err) {
      el.classList.remove('on');
      if (eskiB) eskiB.classList.add('on');
      toast(err.message, 'hata');
    }
    return;
  }

  if (e === 'yetkili-kopyala') {
    const pr = DB.proje(el.dataset.proje);
    if (!pr) return;
    const metin = [pr.yetkili, pr.telefon, pr.eposta].filter(Boolean).join('\n');
    const oldu = await panoyaKopyala(metin);
    toast(oldu ? 'Yetkili bilgileri kopyalandı.' : 'Kopyalanamadı.', oldu ? 'basari' : 'hata');
    return;
  }

  if (e === 'firma-duzenle') return firmaDuzenle(el.dataset.proje);

  if (e === 'logo-yukle')    return logoSec(el.dataset.proje);
  if (e === 'palet-prompt')  return paletPromptu(el.dataset.proje);
  if (e === 'palet-aktar')   return paletAktar(el.dataset.proje);
  if (e === 'palet-duzenle') return paletDuzenle(el.dataset.proje);

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

  if (e === 'guncelle') return GUNCELLEME.elleDenetle();

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
    return isYap(() => DB.projeGuncelle(projeId, { repo: adres }), 'Depo adresi kaydedildi.');
  }

  if (e === 'proje-menu') {
    const proje = DB.proje(id);
    if (!proje) return;

    const sec = await secenekSor(proje.firma, [
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
        mesaj: `"${proje.firma}" listeden çıkar. Modülleri, sayfaları ve görevleri silinmez — geri getirilebilir.`,
        buton: 'Arşive kaldır',
      });
      if (!ok) return;
      if (rota().id === id) location.hash = '#/projeler';
      return isYap(() => DB.projeArsivle(id), 'Proje arşive kaldırıldı.');
    }

    if (sec === 'sil') {
      const s = DB.sayim(id);
      const kayip = [
        s.modul ? s.modul + ' modül' : '',
        s.sayfa ? s.sayfa + ' sayfa' : '',
        s.gorev ? s.gorev + ' görev' : '',
      ].filter(Boolean).join(', ');

      const ok = await onaySor({
        baslik: 'Proje tamamen silinsin mi?',
        mesaj: `"${proje.firma}"${kayip ? ` ve içindeki ${kayip}` : ''} silinecek. `
             + 'Logosu da gidecek. Bu işlem geri alınamaz. '
             + 'Sadece listeden kaldırmak istiyorsan "Arşive kaldır" kullan.',
        buton: 'Kalıcı olarak sil',
      });
      if (!ok) return;
      if (rota().id === id) location.hash = '#/projeler';
      return isYap(() => DB.projeSil(id), 'Proje silindi.');
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

    const ok = await onaySor({
      baslik: 'Modül silinsin mi?',
      mesaj: `"${el.dataset.ad}" modülü ve içindeki tüm sayfalar silinecek. Bu işlem geri alınamaz.`,
    });
    if (!ok) return;
    ACIK_MODUL.delete(id);
    return isYap(() => DB.modulSil(id), 'Modül silindi.');
  }

  if (e === 'modul-ekle') return modulEkleAc(el.dataset.proje || el.dataset.id || rota().id);

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

  if (e === 'modul-sil') {
    const ok = await onaySor({
      baslik: 'Modül silinsin mi?',
      mesaj: `"${el.dataset.ad}" modülü ve içindeki tüm sayfalar silinecek. Bu işlem geri alınamaz.`,
    });
    if (!ok) return;
    ACIK_MODUL.delete(id);
    return isYap(() => DB.modulSil(id), 'Modül silindi.');
  }

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
    proje ? `<b>${esc(proje.firma)}</b>` : 'Proje',
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
    if (!$('.modal-perde') && !$('#sihirbaz')) render();
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
    veri = DB.yukle().catch(() => {}); /* hata varsa uygulama yine açılsın */
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

  document.addEventListener('keydown', e => {
    if (e.key !== 'Enter' && e.key !== ' ') return;
    const el = e.target.closest('[data-eylem][tabindex]');
    if (el) { e.preventDefault(); eylemCalistir(el); }
  });

  $('#btn-back').addEventListener('click', () => {
    const { id, durak } = rota();
    location.hash = durak ? '#/projeler/' + id : '#/projeler';
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
