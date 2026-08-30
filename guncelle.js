/* ==========================================================================
   NIZAM | Studio — Otomatik güncelleme
   Uygulama açılırken sunucudaki index.html'i tazeden çeker, sürüm numarasını
   okur. Sunucudaki sürüm daha yeniyse önbelleği ve servis çalışanını temizler,
   kendini yeniler. Kullanıcının "kapat-aç, bir daha kapat-aç" yapması gerekmez.
   ========================================================================== */

'use strict';

const GUNCELLEME = {

  /* Sürüm numaralarını karşılaştırır: v0.6.1 > v0.6.0 */
  daha_yeni(uzak, yerel) {
    const p = s => String(s || '').replace(/^v/, '').split('.').map(n => parseInt(n, 10) || 0);
    const a = p(uzak), b = p(yerel);
    for (let i = 0; i < Math.max(a.length, b.length); i++) {
      if ((a[i] || 0) > (b[i] || 0)) return true;
      if ((a[i] || 0) < (b[i] || 0)) return false;
    }
    return false;
  },

  /* Sunucudaki sürümü okur. Ulaşamazsa null döner — uygulama yine açılır. */
  async uzakSurum() {
    try {
      const c = await fetch('index.html?zaman=' + Date.now(), { cache: 'no-store' });
      if (!c.ok) return null;
      const metin = await c.text();
      const bul = metin.match(/app\.js\?v=([0-9.]+)/);
      return bul ? 'v' + bul[1] : null;
    } catch (e) {
      return null;
    }
  },

  /* Önbelleği ve servis çalışanını temizleyip sayfayı yeniler. */
  async yenile() {
    try {
      if ('serviceWorker' in navigator) {
        const kayitlar = await navigator.serviceWorker.getRegistrations();
        await Promise.all(kayitlar.map(k => k.unregister()));
      }
      if (window.caches) {
        const adlar = await caches.keys();
        await Promise.all(adlar.map(a => caches.delete(a)));
      }
    } catch (e) {}
    location.replace(location.pathname + '?y=' + Date.now() + location.hash);
  },

  /* Açılışta sessizce denetler. Yeni sürüm varsa kendini yeniler. */
  async acilistaDenetle() {
    /* Yenilenmiş sayfada tekrar denetlemeyelim, sonsuz döngü olmasın */
    if (location.search.includes('y=')) return false;

    const uzak = await this.uzakSurum();
    if (uzak && this.daha_yeni(uzak, APP.version)) {
      await this.yenile();
      return true;
    }
    return false;
  },

  /* Ayarlar'daki "Güncellemeleri denetle" düğmesi. */
  /* Sonucu döndürüyor ki çağıran kum saatini ne zaman durduracağını bilsin:
     yeni sürüm bulunduysa sayfa yenilenene kadar dönmeye devam etmeli. */
  async elleDenetle() {
    const uzak = await this.uzakSurum();

    if (!uzak) { toast('Sunucuya ulaşılamadı.', 'hata'); return 'hata'; }

    if (this.daha_yeni(uzak, APP.version)) {
      toast(uzak + ' bulundu, güncelleniyor…', 'basari');
      setTimeout(() => this.yenile(), 700);
      return 'yeni';
    }

    toast('Zaten en güncel sürümdesin (' + APP.version + ').');
    return 'guncel';
  },
};

/* --------------------------------------------------------------------------
   Migrasyon — eski sürümlerden kalan anahtarları temizler.
   Yeni bir anahtar bırakıldığında listeye eklenir.
   -------------------------------------------------------------------------- */

const ESKI_ANAHTARLAR = ['ns.session', 'ns.demo'];

function eskileriTemizle() {
  try {
    ESKI_ANAHTARLAR.forEach(a => localStorage.removeItem(a));
  } catch (e) {}
}

/* Geri tuşuyla dönülen sayfa tarayıcının bfcache'inden geliyor: betikler
   baştan çalışmıyor, dolayısıyla açılıştaki sürüm denetimi de çalışmıyor.
   Güncelledikten sonra geri basınca eski sürümün ekranı geliyordu — eski
   belge `app.js?v=<eski>` yüklediği için gerçekten eski sürüm oluyor.
   `pageshow` bfcache dönüşünde de tetikleniyor; denetimi orada tekrarlıyoruz. */
window.addEventListener('pageshow', olay => {
  if (!olay.persisted) return;   /* normal açılışta zaten boot denetliyor */
  GUNCELLEME.acilistaDenetle();
});
