/* ==========================================================================
   NIZAM | Studio — Uygulama
   Adım 1: giriş Supabase'e bağlı. Veri katmanı Adım 2'de gelecek.
   ========================================================================== */

'use strict';

const $  = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));

/* ---------- Rotalar ---------- */

const ROUTES = {
  panel:       { title: 'Panel',            sub: () => todayLabel(),                 action: 'Yeni Proje' },
  projeler:    { title: 'Projeler',         sub: () => 'Müşteri projeleri',          action: 'Yeni Proje' },
  gorevler:    { title: 'Bana Atananlar',   sub: () => 'Açık işlerin',               action: null },
  standartlar: { title: 'Nizam Standartları', sub: () => 'Ortak bileşen kütüphanesi', action: null },
  ayarlar:     { title: 'Ayarlar',          sub: () => APP.version + ' · ' + APP.stage, action: null },
};

const DEFAULT_ROUTE = 'panel';

/* ---------- İkonlar ---------- */

const ICON = {
  folder: '<path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>',
  check:  '<path d="M9 11l3 3 8-8"></path><path d="M20 12v7a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h9"></path>',
  spark:  '<path d="M12 3v3M12 18v3M3 12h3M18 12h3M5.6 5.6l2.1 2.1M16.3 16.3l2.1 2.1M5.6 18.4l2.1-2.1M16.3 7.7l2.1-2.1"></path><circle cx="12" cy="12" r="3"></circle>',
  info:   '<circle cx="12" cy="12" r="9"></circle><path d="M12 11v5M12 7.5v.01"></path>',
};

/* ---------- Görünümler ---------- */

const VIEWS = {

  panel: () => `
    <div class="stat-grid">
      ${stat('Aktif Proje', '0', 'henüz proje yok')}
      ${stat('Geliştiriliyor', '0', 'açık iş yok', 'c-dev')}
      ${stat('Kontrolde', '0', 'onayını bekleyen yok', 'c-check')}
      ${stat('Bugün Biten', '0', 'gün yeni başladı', 'c-done')}
    </div>

    <div class="section">
      <div class="card">
        ${empty(ICON.folder, 'Henüz proje yok',
          'İlk müşteri projeni oluşturduğunda burada özet, ekip durumu ve son hareketler görünecek.')}
      </div>
    </div>

    ${stageNote('Panel verileri Adım 2\'de bağlanacak.')}
  `,

  projeler: () => `
    <div class="card">
      ${empty(ICON.folder, 'Proje listesi boş',
        'Yeni Proje sihirbazı Adım 2\'de gelecek. Sihirbaz firma, renk, kullanım, veritabanı ve modülleri tikleyerek soracak.')}
    </div>
    ${stageNote('Proje oluşturma Adım 2\'de açılacak.')}
  `,

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
          ${stepRow('Adım 2', 'Projeler, modül ve sayfa ağacı', false)}
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

/* ---------- Parça üreticiler ---------- */

function stat(label, num, note, cls = '') {
  return `<div class="card stat">
    <span class="stat-label">${label}</span>
    <span class="stat-num ${cls}">${num}</span>
    <span class="stat-note">${note}</span>
  </div>`;
}

function empty(icon, title, text) {
  return `<div class="empty">
    <div class="empty-icon"><svg viewBox="0 0 24 24">${icon}</svg></div>
    <h3>${title}</h3>
    <p>${text}</p>
  </div>`;
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
    <span class="row-val ${mono ? 'mono' : ''}">${v}</span>
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

/* ---------- Yönlendirme ---------- */

function currentRoute() {
  const r = (location.hash || '').replace(/^#\/?/, '').split('/')[0];
  return ROUTES[r] ? r : DEFAULT_ROUTE;
}

function render() {
  const key = currentRoute();
  const def = ROUTES[key];

  $('#page-title').textContent = def.title;
  $('#page-sub').textContent   = def.sub();

  const action = $('#topbar-action');
  if (def.action) {
    action.classList.remove('hidden');
    action.querySelector('span').textContent = def.action;
  } else {
    action.classList.add('hidden');
  }

  $('#btn-back').classList.add('hidden');

  const view = $('#view');
  view.innerHTML = VIEWS[key]();
  view.scrollTop = 0;
  view.classList.remove('swap');
  void view.offsetWidth;
  view.classList.add('swap');

  $$('[data-route]').forEach(el => {
    el.classList.toggle('active', el.dataset.route === key);
  });

  const logout = $('#btn-logout');
  if (logout) logout.addEventListener('click', signOut);
}

/* ---------- Yardımcılar ---------- */

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
  toastTimer = setTimeout(() => t.classList.add('hidden'), 2600);
}

/* ---------- Oturum ---------- */

/* Giriş formu: doğrulama AUTH içinde, burada sadece ekran yönetimi var. */
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
    uygulamayiAc();
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
  $('#app').classList.add('hidden');
  $('#login').classList.remove('hidden');
  hataGizle();
  $('#login-mail').value = '';
  $('#login-pass').value = '';
}

function uygulamayiAc() {
  $('#login').classList.add('hidden');
  $('#app').classList.remove('hidden');
  kullaniciYaz();
  render();
}

function hataGoster(mesaj) {
  const kutu = $('#login-error');
  kutu.textContent = mesaj;
  kutu.classList.remove('hidden');
}

function hataGizle() { $('#login-error').classList.add('hidden'); }

/* Yan menüdeki kullanıcı kutusuna gerçek bilgiyi yazar. */
function kullaniciYaz() {
  $('#user-chip .avatar').textContent    = AUTH.basHarfler;
  $('#user-chip .user-name').textContent = AUTH.ad;
  $('#user-chip .user-role').textContent = AUTH.rolAdi;
}

/* ---------- Açılış ---------- */

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

  /* Açılış animasyonu ile oturum kontrolü aynı anda yürür. */
  const [, oturumVar] = await Promise.all([runLoader(), AUTH.restore()]);

  const loader = $('#loader');
  loader.classList.add('fade-out');
  setTimeout(() => loader.remove(), 400);

  if (oturumVar) {
    uygulamayiAc();
  } else {
    $('#login').classList.remove('hidden');
    $('#login-mail').focus();
  }
}

/* ---------- Olaylar ---------- */

window.addEventListener('hashchange', () => {
  if (!$('#app').classList.contains('hidden')) render();
});

document.addEventListener('DOMContentLoaded', () => {
  document.title = APP.name;

  $('#login-form').addEventListener('submit', girisGonder);
  $('#login-mail').addEventListener('input', hataGizle);
  $('#login-pass').addEventListener('input', hataGizle);

  $('#topbar-action').addEventListener('click', () => {
    toast('Proje sihirbazı Adım 2\'de gelecek.');
  });

  $('#search').addEventListener('click', () => {
    toast('Arama Adım 2\'de gelecek.');
  });

  $('#user-chip').addEventListener('click', () => {
    location.hash = '#/ayarlar';
  });

  boot();
});

/* ---------- PWA ---------- */

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('sw.js').catch(() => {});
  });
}
