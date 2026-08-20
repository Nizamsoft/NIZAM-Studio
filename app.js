/* ==========================================================================
   NIZAM | Studio — Uygulama
   Adım 2: projeler, modül ve sayfa ağacı, Yeni Proje sihirbazı.
   ========================================================================== */

'use strict';

const $  = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));

/* ---------- Rotalar ---------- */

const ROUTES = {
  panel:       { title: 'Panel',              sub: () => todayLabel() },
  projeler:    { title: 'Projeler',           sub: () => projelerAltBaslik() },
  gorevler:    { title: 'Bana Atananlar',     sub: () => 'Açık işlerin' },
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

let YUKLENIYOR    = false;
const ACIK_MODUL  = new Set();

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

    const p     = DB.projeler;
    const dev   = p.filter(x => x.durum === 'gelistiriliyor').length;
    const kont  = p.filter(x => x.durum === 'kontrolde').length;

    return `
      <div class="stat-grid">
        ${stat('Aktif Proje', p.length, p.length ? 'devam ediyor' : 'henüz proje yok')}
        ${stat('Geliştiriliyor', dev, dev ? 'kodlanıyor' : 'açık iş yok', 'c-dev')}
        ${stat('Kontrolde', kont, kont ? 'onayını bekliyor' : 'onayını bekleyen yok', 'c-check')}
        ${stat('Bugün Biten', 0, 'gün yeni başladı', 'c-done')}
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

  gorevler: () => `
    <div class="card">
      ${empty(ICON.check, 'Sana atanmış iş yok',
        'Bir görev sana atandığında burada projesi, sayfası ve promptu ile birlikte listelenecek.')}
    </div>
    ${stageNote('Görevler ve atama Adım 3\'te gelecek.')}
  `,

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
          ${stepRow('Adım 3', 'Görevler, durumlar, atama', false)}
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
          ${sayfalar.map(sf => `
            <div class="sayfa">
              <span class="sayfa-nokta" style="background:var(--st-todo)"></span>
              <span class="sayfa-ad">${esc(sf.ad)}</span>
              <span class="sayfa-say mono">0/0</span>
              ${AUTH.yonetici ? `<button class="mini-btn" data-eylem="sayfa-sil" data-id="${sf.id}"
                 data-ad="${esc(sf.ad)}" type="button" aria-label="Sayfayı sil">${svg(ICON.cop, 14)}</button>` : ''}
            </div>`).join('')}

          ${!sayfalar.length && m.genel
            ? `<div class="sayfa-bos">Bu kova sayfa tutmaz — doğrudan görev alır.</div>` : ''}
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
    btn.querySelector('span').textContent = 'Modül Ekle';
    btn.dataset.eylem = 'modul-ekle';
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

function modalAc(html, bagla) {
  modalKapat();

  const perde = document.createElement('div');
  perde.className = 'modal-perde';
  perde.innerHTML = `<div class="modal-kutu" role="dialog" aria-modal="true">${html}</div>`;
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

  if (e === 'modul-ekle') {
    const projeId = el.dataset.proje || rota().id;
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
  DB.yuklendi = false; DB.hata = null;
  ACIK_MODUL.clear();
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
