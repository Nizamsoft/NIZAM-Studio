/* ==========================================================================
   NIZAM | Studio — Uygulama
   Adım 3: görevler, dört durum, atama ve revize akışı.
   ========================================================================== */

'use strict';

const $  = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));

/* ---------- Rotalar ---------- */

const ROUTES = {
  panel:       { title: 'Panel',              sub: () => todayLabel() },
  projeler:    { title: 'Projeler',           sub: () => projelerAltBaslik() },
  gorevler:    { title: 'Bana Atananlar',     sub: () => gorevlerAltBaslik() },
  standartlar: { title: 'Nizam Standartları', sub: () => 'Ortak bileşen kütüphanesi' },
  ayarlar:     { title: 'Ayarlar',            sub: () => APP.version + ' · ' + APP.stage },
};

const DEFAULT_ROUTE = 'panel';

function rota() {
  const p = (location.hash || '').replace(/^#\/?/, '').split('/').filter(Boolean);
  const key = ROUTES[p[0]] ? p[0] : DEFAULT_ROUTE;
  return { key, id: p[1] || null };
}

/* ---------- Durum ---------- */

let YUKLENIYOR     = false;
let GOREV_FILTRE   = '';
const ACIK_MODUL   = new Set();
const ACIK_SAYFA   = new Set();

/* ---------- İkonlar ---------- */

const ICON = {
  folder:  '<path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>',
  check:   '<path d="M9 11l3 3 8-8"></path><path d="M20 12v7a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h9"></path>',
  info:    '<circle cx="12" cy="12" r="9"></circle><path d="M12 11v5M12 7.5v.01"></path>',
  uyari:   '<path d="M12 4l9 16H3z"></path><path d="M12 10v4M12 17.5v.01"></path>',
  chevron: '<path d="M9 6l6 6-6 6"></path>',
  arti:    '<path d="M12 5v14M5 12h14"></path>',
  cop:     '<path d="M4 7h16M9 7V5h6v2M6 7l1 13h10l1-13"></path>',
  kalem:   '<path d="M4 20h4L20 8l-4-4L4 16z"></path>',
  kova:    '<circle cx="12" cy="12" r="9"></circle><path d="M12 8v8M8 12h8"></path>',
  katman:  '<path d="M20 7l-8-4-8 4 8 4z"></path><path d="M4 12l8 4 8-4M4 17l8 4 8-4"></path>',
  tik:     '<path d="M5 12l5 5L20 7"></path>',
  kapat:   '<path d="M6 6l12 12M18 6L6 18"></path>',
  kisi:    '<circle cx="12" cy="8" r="4"></circle><path d="M4 21v-1a6 6 0 0 1 6-6h4a6 6 0 0 1 6 6v1"></path>',
  kopya:   '<rect x="9" y="9" width="12" height="12" rx="2"></rect><path d="M5 15V5a2 2 0 0 1 2-2h10"></path>',
};

function svg(yol, boy = 16) {
  return `<svg viewBox="0 0 24 24" style="width:${boy}px;height:${boy}px">${yol}</svg>`;
}

/* ==========================================================================
   GÖRÜNÜMLER
   ========================================================================== */

const VIEWS = {

  /* ---------- Panel ---------- */

  panel: () => {
    if (YUKLENIYOR) return iskeletler(4);
    if (DB.hata)    return hataKutusu(DB.hata);

    const p    = DB.projeler;
    const dev  = DB.gorevleri({ durum: 'gelistiriliyor' }).length;
    const kont = DB.gorevleri({ durum: 'kontrolde' }).length;
    const bugun = DB.gorevleri({ durum: 'tamamlandi' })
      .filter(g => (g.guncellendi || '').slice(0, 10) === bugunTarih()).length;

    return `
      <div class="stat-grid">
        ${stat('Aktif Proje', p.length, p.length ? 'devam ediyor' : 'henüz proje yok')}
        ${stat('Geliştiriliyor', dev, dev ? 'kodlanıyor' : 'açık iş yok', 'c-dev')}
        ${stat('Kontrolde', kont, kont ? 'onayını bekliyor' : 'onayını bekleyen yok', 'c-check')}
        ${stat('Bugün Biten', bugun, bugun ? 'onaylandı' : 'gün yeni başladı', 'c-done')}
      </div>

      <div class="section">
        <span class="label">Son projeler</span>
        ${p.length
          ? `<div class="proje-grid">${p.slice(0, 6).map(projeKarti).join('')}</div>`
          : `<div class="card">${empty(ICON.folder, 'Henüz proje yok',
               'İlk müşteri projeni oluştur; modülleri ve sayfalarıyla birlikte kurulsun.',
               AUTH.yonetici ? 'Yeni Proje' : null, 'sihirbaz')}</div>`}
      </div>

      ${stageNote('Görevler ve ilerleme yüzdeleri Adım 3\'te canlanacak.')}
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

    return `
      <span class="label">Devam eden</span>
      <div class="proje-grid">${DB.projeler.map(projeKarti).join('')}</div>
    `;
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

    const s        = DB.sayim(id);
    const moduller = DB.modulleri(id);

    return `
      <div class="ozet-grid">
        <div class="card oz">
          <span class="oz-label">İlerleme</span>
          <span class="oz-num">%${s.yuzde}</span>
          <div class="bar" style="margin-top:9px"><i style="width:${s.yuzde}%"></i></div>
        </div>
        ${ozKutu('Modül', s.modul, '+ Proje Geneli')}
        ${ozKutu('Sayfa', s.sayfa, 'tanımlı ekran')}
        <div class="card oz">
          <span class="oz-label">Görev</span>
          <span class="oz-num">${s.bitmis}<em>/${s.gorev}</em></span>
          <span class="oz-sub">Adım 3'te gelecek</span>
        </div>
      </div>

      <span class="label">Modüller ve sayfalar</span>
      ${moduller.map(m => modulKarti(m)).join('')}

      ${AUTH.yonetici ? `
        <button class="btn btn-ghost btn-wide" data-eylem="modul-ekle" data-proje="${proje.id}" type="button">
          ${svg(ICON.arti, 15)}<span>Modül Ekle</span>
        </button>` : ''}

      ${stageNote('Sayfalara görev bağlamak Adım 3\'te açılacak.')}
    `;
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

  standartlar: () => `
    <div class="card">
      <div class="row-list">
        ${stdRow('Açılış Ekranı', 'Nizam Standard 1 · Minimal · Animasyonsuz')}
        ${stdRow('Login', 'Standard · Split Screen · Minimal')}
        ${stdRow('Menü', 'Sidebar · Floating Sidebar · Üst Menü')}
        ${stdRow('Ayarlar', 'Nizam Standard Settings')}
        ${stdRow('Bildirim Merkezi', 'Uygulama içi bildirim listesi')}
        ${stdRow('Excel / PDF Çıktı', 'Tablo dışa aktarma')}
        ${stdRow('Tarih Filtresi', 'Gün · Hafta · Ay · Aralık')}
        ${stdRow('Dosya Yükleme', 'Görsel ve belge yükleme')}
      </div>
    </div>
    ${stageNote('Standartlar yazılı tarif olarak tutulacak ve prompta otomatik eklenecek.')}
  `,

  ayarlar: () => `
    <div class="section" style="margin-top:0">
      <span class="label">Hesap</span>
      <div class="card">
        <div class="row-list">
          ${infoRow('Ad', AUTH.ad)}
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
          ${stepRow('Adım 4', 'Prompt motoru ve kimlik dosyası', false)}
          ${stepRow('Adım 5', 'GitHub okuma ve sürüm notları', false)}
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

function projeKarti(p) {
  const s = DB.sayim(p.id);
  return `
    <div class="card proje" data-eylem="proje-ac" data-id="${p.id}" role="button" tabindex="0">
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
        <span class="proje-pct mono">%${s.yuzde}</span>
      </div>
      <div class="proje-alt">
        <span><b class="mono">${s.modul}</b> modül</span>
        <span><b class="mono">${s.sayfa}</b> sayfa</span>
        <span><b class="mono">${s.bitmis}/${s.gorev}</b> görev</span>
      </div>
    </div>`;
}

function modulKarti(m) {
  const s     = DB.modulSayim(m.id);
  const acik  = ACIK_MODUL.has(m.id);
  const sayfalar = DB.sayfalari(m.id);

  return `
    <div class="card modul ${m.genel ? 'modul-genel' : ''}">
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

          ${AUTH.yonetici && !m.genel ? `
            <div class="modul-araclar">
              <button class="mini-link" data-eylem="modul-ad" data-id="${m.id}" data-ad="${esc(m.ad)}" type="button">
                ${svg(ICON.kalem, 13)} Adı değiştir</button>
              <button class="mini-link tehlike" data-eylem="modul-sil" data-id="${m.id}" data-ad="${esc(m.ad)}" type="button">
                ${svg(ICON.cop, 13)} Modülü sil</button>
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
function gorevKarti(g) {
  return `
    <div class="gsatir" data-eylem="gorev-ac" data-id="${g.id}" role="button" tabindex="0">
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

function ozKutu(label, num, sub) {
  return `<div class="card oz">
    <span class="oz-label">${label}</span>
    <span class="oz-num">${num}</span>
    <span class="oz-sub">${sub}</span>
  </div>`;
}

function stat(label, num, note, cls = '') {
  return `<div class="card stat">
    <span class="stat-label">${label}</span>
    <span class="stat-num ${cls}">${num}</span>
    <span class="stat-note">${note}</span>
  </div>`;
}

function empty(icon, title, text, butonYazi = null, eylem = null) {
  return `<div class="empty">
    <div class="empty-icon"><svg viewBox="0 0 24 24">${icon}</svg></div>
    <h3>${title}</h3>
    <p>${text}</p>
    ${butonYazi ? `<button class="btn btn-primary" data-eylem="${eylem}" type="button" style="margin-top:16px">
      ${svg(ICON.arti, 15)}<span>${butonYazi}</span></button>` : ''}
  </div>`;
}

function hataKutusu(mesaj) {
  return `<div class="card">
    <div class="empty">
      <div class="empty-icon uyari"><svg viewBox="0 0 24 24">${ICON.uyari}</svg></div>
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
    <svg viewBox="0 0 24 24">${ICON.info}</svg><span>${text}</span>
  </div></div>`;
}

function stdRow(title, sub) {
  return `<div class="row">
    <div class="row-main"><span class="row-title">${title}</span><span class="row-sub">${sub}</span></div>
    <span class="pill">Planlandı</span>
  </div>`;
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
  const { key, id } = rota();
  const detay = key === 'projeler' && id;

  const baslik = $('#page-title');
  const alt    = $('#page-sub');

  if (detay) {
    const p = DB.proje(id);
    baslik.textContent = p ? p.firma : 'Proje';
    alt.textContent    = p
      ? `${PLATFORM_ADI[p.platform] || ''} · ${VERI_ADI[p.veri] || ''}`
      : 'Bulunamadı';
  } else {
    baslik.textContent = ROUTES[key].title;
    alt.textContent    = ROUTES[key].sub();
  }

  ustEylemYaz(key, detay, id);
  $('#btn-back').classList.toggle('hidden', !detay);

  const view = $('#view');
  view.innerHTML = detay ? VIEWS.projeDetay(id) : VIEWS[key]();
  view.scrollTop = 0;
  view.classList.remove('swap');
  void view.offsetWidth;
  view.classList.add('swap');

  $$('[data-route]').forEach(el => el.classList.toggle('active', el.dataset.route === key));

  const logout = $('#btn-logout');
  if (logout) logout.addEventListener('click', signOut);
}

/* Sağ üstteki ana buton — role ve ekrana göre değişir */
function ustEylemYaz(key, detay, id) {
  const btn = $('#topbar-action');

  if (!AUTH.yonetici || YUKLENIYOR || DB.hata) { ustEylemGizle(btn); return; }

  if (detay) {
    btn.classList.remove('hidden');
    btn.querySelector('span').textContent = 'Yeni Görev';
    btn.dataset.eylem = 'gorev-ekle';
    btn.dataset.proje = id;
  } else if (key === 'panel' || key === 'projeler') {
    btn.classList.remove('hidden');
    btn.querySelector('span').textContent = 'Yeni Proje';
    btn.dataset.eylem = 'sihirbaz';
    delete btn.dataset.proje;
  } else {
    ustEylemGizle(btn);
  }
}

/* Gizlerken eylemi de sil — görünmeyen buton eski işi taşımasın. */
function ustEylemGizle(btn) {
  btn.classList.add('hidden');
  delete btn.dataset.eylem;
  delete btn.dataset.proje;
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
  renk: 'yesil',
  platform: 'ikisi',
  veri: 'sifirdan',
  moduller: [],
  kaydediyor: false,
};

function sihirbaziAc() {
  Object.assign(SIHIRBAZ, {
    adim: 1, firma: '', renk: 'yesil', platform: 'ikisi',
    veri: 'sifirdan', moduller: [], kaydediyor: false,
  });
  modalAc(sihirbazHtml(), sihirbazBagla);
}

function sihirbazHtml() {
  const a = SIHIRBAZ.adim;

  const cizgiler = [1, 2, 3, 4].map(i =>
    `<span class="sd ${i < a ? 'on' : ''} ${i === a ? 'cur' : ''}"></span>`).join('');

  const govde = [sihirbazAdim1, sihirbazAdim2, sihirbazAdim3, sihirbazAdim4][a - 1]();
  const son   = a === 4;

  return `
    <div class="steps">${cizgiler}</div>
    ${govde}
    <div class="modal-alt">
      <button class="btn btn-ghost" data-sb="${a === 1 ? 'kapat' : 'geri'}" type="button">
        ${a === 1 ? 'Vazgeç' : 'Geri'}
      </button>
      <button class="btn btn-primary" data-sb="${son ? 'kaydet' : 'ileri'}" type="button">
        <span>${son ? 'Projeyi Oluştur' : 'Devam'}</span>
      </button>
    </div>`;
}

function sihirbazAdim1() {
  const renkler = Object.keys(PROJE_RENK).map(k =>
    `<button class="renk ${SIHIRBAZ.renk === k ? 'sec' : ''}" data-sb="renk" data-deger="${k}"
       style="${renkStil(k)}" type="button" aria-label="${k}"></button>`).join('');

  return `
    <h3 class="modal-h">Hangi firma için?</h3>
    <p class="modal-s">Proje kimliğini belirleyelim.</p>
    <label class="field">
      <span>Firma adı</span>
      <input type="text" id="sb-firma" value="${esc(SIHIRBAZ.firma)}" placeholder="Örn. Aydın Yapı"
             autocomplete="off" maxlength="60">
    </label>
    <div class="field">
      <span>Proje rengi</span>
      <div class="renkler">${renkler}</div>
    </div>`;
}

function sihirbazAdim2() {
  const secenekler = [
    ['web',   'Web',          'Tarayıcıda çalışır'],
    ['mobil', 'Mobil',        'Telefon uygulaması'],
    ['ikisi', 'İkisi birden', 'Web + mobil, ortak veri'],
  ];
  return `
    <h3 class="modal-h">Nerede kullanılacak?</h3>
    <p class="modal-s">Bu, üretilecek sayfaları belirler.</p>
    <div class="secim">${secenekler.map(([d, ad, alt]) =>
      secimSatiri('platform', d, ad, alt, SIHIRBAZ.platform === d)).join('')}</div>`;
}

function sihirbazAdim3() {
  const secenekler = [
    ['sifirdan', 'Sıfırdan kurulacak',    'Yeni Supabase veritabanı'],
    ['mevcut',   'Mevcut veritabanı var', 'Bağlantı bilgisi sonra girilir'],
    ['excel',    "Excel'den taşınacak",   'Hazır tablolar aktarılır'],
  ];
  return `
    <h3 class="modal-h">Veritabanı durumu</h3>
    <p class="modal-s">Mevcut bir sistem var mı?</p>
    <div class="secim">${secenekler.map(([d, ad, alt]) =>
      secimSatiri('veri', d, ad, alt, SIHIRBAZ.veri === d)).join('')}</div>`;
}

function sihirbazAdim4() {
  const kutular = MODUL_SABLON.map(m => {
    const secili = SIHIRBAZ.moduller.includes(m.ad);
    return `<button class="mod ${secili ? 'sec' : ''}" data-sb="modul" data-deger="${esc(m.ad)}" type="button">
      <span>${esc(m.ad)}</span><span class="tik">${secili ? svg(ICON.tik, 13) : ''}</span></button>`;
  }).join('');

  return `
    <h3 class="modal-h">Hangi modüller olacak?</h3>
    <p class="modal-s">Seçtiklerin sayfalarıyla birlikte kurulur.</p>
    <div class="mod-grid">${kutular}</div>
    <div class="note note-kucuk">
      <svg viewBox="0 0 24 24">${ICON.info}</svg>
      <span>Her projeye ayrıca bir <b>${GENEL_MODUL}</b> kovası eklenir — modüle bağlanamayan işler oraya düşer.</span>
    </div>`;
}

function secimSatiri(alan, deger, ad, alt, secili) {
  return `<button class="sc ${secili ? 'sec' : ''}" data-sb="${alan}" data-deger="${deger}" type="button">
    <span class="sc-yazi"><span class="sc-ad">${ad}</span><span class="sc-alt">${alt}</span></span>
    <span class="tik">${secili ? svg(ICON.tik, 13) : ''}</span>
  </button>`;
}

function sihirbazBagla(kutu) {
  const firma = $('#sb-firma', kutu);
  if (firma) {
    firma.addEventListener('input', e => { SIHIRBAZ.firma = e.target.value; });
    setTimeout(() => firma.focus(), 40);
    firma.addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); sihirbazIleri(); } });
  }

  $$('[data-sb]', kutu).forEach(el => {
    el.addEventListener('click', () => {
      const t = el.dataset.sb, d = el.dataset.deger;

      if (t === 'kapat')  return modalKapat();
      if (t === 'geri')   { SIHIRBAZ.adim--; return sihirbazCiz(); }
      if (t === 'ileri')  return sihirbazIleri();
      if (t === 'kaydet') return sihirbazKaydet();

      if (t === 'renk')     SIHIRBAZ.renk = d;
      if (t === 'platform') SIHIRBAZ.platform = d;
      if (t === 'veri')     SIHIRBAZ.veri = d;
      if (t === 'modul') {
        const i = SIHIRBAZ.moduller.indexOf(d);
        i === -1 ? SIHIRBAZ.moduller.push(d) : SIHIRBAZ.moduller.splice(i, 1);
      }
      sihirbazCiz();
    });
  });
}

function sihirbazCiz() {
  const kutu = $('.modal-kutu');
  if (!kutu) return;
  kutu.innerHTML = sihirbazHtml();
  sihirbazBagla(kutu);
}

function sihirbazIleri() {
  if (SIHIRBAZ.adim === 1 && !SIHIRBAZ.firma.trim()) {
    toast('Firma adını yaz.');
    const f = $('#sb-firma'); if (f) f.focus();
    return;
  }
  SIHIRBAZ.adim++;
  sihirbazCiz();
}

async function sihirbazKaydet() {
  if (SIHIRBAZ.kaydediyor) return;
  SIHIRBAZ.kaydediyor = true;

  const btn = $('[data-sb="kaydet"] span');
  if (btn) btn.textContent = 'Kuruluyor…';

  try {
    const moduller = SIHIRBAZ.moduller.map(ad => MODUL_SABLON.find(m => m.ad === ad));
    const id = await DB.projeOlustur({
      firma: SIHIRBAZ.firma,
      renk: SIHIRBAZ.renk,
      platform: SIHIRBAZ.platform,
      veri: SIHIRBAZ.veri,
      moduller,
    });

    modalKapat();
    sayaclariYaz();
    toast(SIHIRBAZ.firma.trim() + ' kuruldu.');
    location.hash = '#/projeler/' + id;
    render();
  } catch (e) {
    toast(e.message);
    if (btn) btn.textContent = 'Projeyi Oluştur';
  } finally {
    SIHIRBAZ.kaydediyor = false;
  }
}

/* ==========================================================================
   MODAL
   ========================================================================== */

function modalAc(html, bagla, ekSinif = '') {
  modalKapat();

  const perde = document.createElement('div');
  perde.className = 'modal-perde';
  perde.innerHTML = `<div class="modal-kutu ${ekSinif}" role="dialog" aria-modal="true">${html}</div>`;
  document.body.appendChild(perde);

  perde.addEventListener('mousedown', e => { if (e.target === perde) modalKapat(); });
  document.addEventListener('keydown', kacTusu);

  if (bagla) bagla($('.modal-kutu', perde));
  return perde;
}

function modalKapat() {
  const p = $('.modal-perde');
  if (p) p.remove();
  document.removeEventListener('keydown', kacTusu);
}

function kacTusu(e) { if (e.key === 'Escape') modalKapat(); }

/* Tek alanlı soru — sayfa/modül adı gibi kısa girdiler için */
function metinSor({ baslik, aciklama, deger = '', yerTutucu = '', buton = 'Kaydet' }) {
  return new Promise(resolve => {
    modalAc(`
      <h3 class="modal-h">${esc(baslik)}</h3>
      ${aciklama ? `<p class="modal-s">${esc(aciklama)}</p>` : ''}
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
      <h3 class="modal-h">${esc(baslik)}</h3>
      <p class="modal-s">${esc(mesaj)}</p>
      <div class="modal-alt">
        <button class="btn btn-ghost" data-m="hayir" type="button">Vazgeç</button>
        <button class="btn btn-tehlike" data-m="evet" type="button"><span>${esc(buton)}</span></button>
      </div>`, kutu => {
      const bitir = v => { modalKapat(); resolve(v); };
      $('[data-m="hayir"]', kutu).addEventListener('click', () => bitir(false));
      $('[data-m="evet"]',  kutu).addEventListener('click', () => bitir(true));
    });
  });
}

/* ==========================================================================
   GÖREV KARTI
   ========================================================================== */

function gorevKartiAc(id) {
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
  if (tip === 'prompt') return toast('Prompt motoru Adım 4\'te gelecek.');

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
    } catch (e) { toast(e.message); }
    return;
  }

  if (tip === 'oncelik') {
    try {
      await DB.gorevGuncelle(id, { oncelik: g.oncelik === 'acil' ? 'normal' : 'acil' });
      sonrasi(id, g.oncelik === 'acil' ? 'Öncelik normale alındı.' : 'Acil olarak işaretlendi.');
    } catch (e) { toast(e.message); }
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
      modalKapat(); sayaclariYaz(); render(); toast('Görev silindi.');
    } catch (e) { toast(e.message); }
  }
}

async function gorevDurum(id, durum, notu = '') {
  try {
    await DB.durumDegistir(id, durum, notu);
    sonrasi(id, durum === 'tamamlandi' ? 'Onaylandı.' :
                durum === 'kontrolde'  ? 'Kontrole gönderildi.' : 'Durum güncellendi.');
  } catch (e) {
    toast(e.message);
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

const YENI = { proje: null, modul: null, sayfa: null, oncelik: 'normal', atanan: null, kaydediyor: false };

function yeniGorevAc({ proje, modul, sayfa }) {
  Object.assign(YENI, {
    proje: proje || null, modul: modul || null, sayfa: sayfa || null,
    oncelik: 'normal', atanan: null, kaydediyor: false,
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
    <h3 class="modal-h">Yeni görev</h3>
    <p class="modal-s">${esc(proje ? proje.firma : '')} · nereye bağlanacağını seç.</p>

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
    });
    YENI._baslik = YENI._aciklama = '';
    if (YENI.sayfa) ACIK_SAYFA.add(YENI.sayfa);
    if (YENI.modul) ACIK_MODUL.add(YENI.modul);
    modalKapat(); sayaclariYaz(); render(); toast('Görev oluşturuldu.');
  } catch (e) {
    toast(e.message);
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
      <h3 class="modal-h">Kime atansın?</h3>
      <p class="modal-s">Kişiler Supabase panelinden eklenir.</p>
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

  if (e === 'modul-ekle') {
    const projeId = el.dataset.proje || el.dataset.id || rota().id;
    const ad = await metinSor({
      baslik: 'Yeni modül',
      aciklama: 'Hazır bir modül adı yazarsan sayfaları da kurulur.',
      yerTutucu: 'Örn. Sipariş',
      buton: 'Ekle',
    });
    if (!ad) return;

    const sablon = MODUL_SABLON.find(m => m.ad.toLocaleLowerCase('tr') === ad.toLocaleLowerCase('tr'));
    return isYap(() => DB.modulEkle(projeId, sablon ? sablon.ad : ad, sablon ? sablon.sayfalar : []),
      sablon ? `${sablon.ad} modülü sayfalarıyla eklendi.` : 'Modül eklendi.');
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
    toast(err.message);
  }
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

function todayLabel() {
  const g = ['Pazar','Pazartesi','Salı','Çarşamba','Perşembe','Cuma','Cumartesi'];
  const a = ['Ocak','Şubat','Mart','Nisan','Mayıs','Haziran','Temmuz','Ağustos','Eylül','Ekim','Kasım','Aralık'];
  const d = new Date();
  return `${d.getDate()} ${a[d.getMonth()]}, ${g[d.getDay()]}`;
}

let toastTimer = null;
function toast(msg) {
  const t = $('#toast');
  t.textContent = msg;
  t.classList.remove('hidden');
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
  ACIK_MODUL.clear(); ACIK_SAYFA.clear();
  GOREV_FILTRE = '';
  modalKapat();

  $('#app').classList.add('hidden');
  $('#login').classList.remove('hidden');
  hataGizle();
  $('#login-mail').value = '';
  $('#login-pass').value = '';
}

async function uygulamayiAc() {
  $('#login').classList.add('hidden');
  $('#app').classList.remove('hidden');
  kullaniciYaz();
  await veriTazele();
}

function hataGoster(mesaj) {
  const kutu = $('#login-error');
  kutu.textContent = mesaj;
  kutu.classList.remove('hidden');
}

function hataGizle() { $('#login-error').classList.add('hidden'); }

function kullaniciYaz() {
  $('#user-chip .avatar').textContent    = AUTH.basHarfler;
  $('#user-chip .user-name').textContent = AUTH.ad;
  $('#user-chip .user-role').textContent = AUTH.rolAdi;
}

/* ==========================================================================
   AÇILIŞ
   ========================================================================== */

function runLoader() {
  const fill = $('.loader-fill');
  const msg  = $('.loader-msg');
  const steps = [
    [20,  'Tema yükleniyor…'],
    [45,  'Arayüz hazırlanıyor…'],
    [70,  'Oturum denetleniyor…'],
    [100, 'Hazır'],
  ];

  let i = 0;
  return new Promise(resolve => {
    const tick = () => {
      if (i >= steps.length) { resolve(); return; }
      const [pct, text] = steps[i++];
      fill.style.width = pct + '%';
      msg.textContent  = text;
      setTimeout(tick, 210);
    };
    setTimeout(tick, 260);
  });
}

async function boot() {
  AUTH.init();

  const [, oturumVar] = await Promise.all([runLoader(), AUTH.restore()]);

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
  if (!$('#app').classList.contains('hidden')) { modalKapat(); render(); }
});

document.addEventListener('DOMContentLoaded', () => {
  document.title = APP.name;

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

  $('#btn-back').addEventListener('click', () => { location.hash = '#/projeler'; });

  $('#search').addEventListener('click', () => toast('Arama Adım 3\'te gelecek.'));
  $('#user-chip').addEventListener('click', () => { location.hash = '#/ayarlar'; });

  boot();
});

/* ---------- PWA ---------- */

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('sw.js').catch(() => {});
  });
}
