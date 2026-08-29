/* NIZAM | Studio — Service Worker

   Üç yol var, isteğin ne olduğuna göre ayrılıyor:

   1. Sürüm damgalı yerel dosya (`?v=` taşıyan)  → ÖNCE ÖNBELLEK.
      Bu dosyalar asla değişmez: sürüm değişince adresi de değişir. Ağa
      gitmenin anlamı yok. Uygulama ikinci açılıştan itibaren tamamen
      önbellekten kalkıyor.

   2. index.html ve gezinme istekleri → ÖNCE AĞ.
      Bunun adresinde sürüm yok; önbellekten verirsek yeni sürümü hiç
      göremeyiz. Ağ yoksa önbellekten dönüyor.

   3. Supabase'deki resimler (logo, profil fotoğrafı, proje görselleri)
      → ÖNCE ÖNBELLEK, ANAHTAR İMZASIZ YOL.
      Bunların adresinde 45 dakikada bir yenilenen bir imza var. İmza
      değişince adres de değişiyor ve tarayıcı aynı resmi yeniden
      indiriyordu. Önbellek anahtarından sorgu kısmını atıyoruz: imza
      değişse de aynı kayda düşüyor.

   Bir resim yeniden yüklenince eski kopya önbellekte kalırdı; uygulama
   `postMessage({ tip: 'unut', yol })` gönderiyor, o kayıt siliniyor. */

const CACHE = 'nizam-studio-v0.103.1';
const SHELL = [
  './', './index.html', './style.css', './app.js', './config.js', './auth.js', './data.js', './prompt.js', './guncelle.js',
  './vendor/supabase.js',
  './manifest.webmanifest', './icon-192.png', './icon-512.png', './icon-180.png',
  './logo.png', './ofis.webp',
  './font/grotesk-600.woff2', './font/grotesk-700.woff2'
];

/* Supabase Storage adresi mi? İmza da genel adres de buraya giriyor. */
function depoResmi(url) {
  return /\.supabase\.co$/.test(url.hostname) && url.pathname.indexOf('/storage/v1/object/') === 0;
}

/* Önbellek anahtarı: sorgu kısmı olmadan. İmza (`?token=`) ve fotoğrafın
   zaman damgası (`?t=`) atılıyor — dosya aynı dosya. */
function anahtar(url) {
  return new Request(url.origin + url.pathname, { credentials: 'omit' });
}

self.addEventListener('install', e => {
  self.skipWaiting();
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL)).catch(() => {}));
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

/* Uygulama "bu resmi unut" diyor — değiştirilen fotoğrafın eskisi kalmasın. */
self.addEventListener('message', e => {
  const veri = e.data || {};
  if (veri.tip !== 'unut' || !veri.yol) return;
  e.waitUntil(caches.open(CACHE).then(c => c.delete(new Request(veri.yol))).catch(() => {}));
});

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;

  const url = new URL(req.url);

  /* ---- 3) Supabase resmi: önce önbellek, anahtar imzasız ---- */
  if (depoResmi(url)) {
    const ana = anahtar(url);
    e.respondWith(
      caches.match(ana).then(bulunan => {
        if (bulunan) return bulunan;
        return fetch(req).then(res => {
          /* Yalnız gerçekten gelen resim saklanıyor; hata sayfası değil. */
          if (res && res.ok) {
            const kopya = res.clone();
            caches.open(CACHE).then(c => c.put(ana, kopya)).catch(() => {});
          }
          return res;
        });
      })
    );
    return;
  }

  if (url.origin !== location.origin) return;

  /* ---- 1) Sürüm damgalı dosya: önce önbellek ---- */
  if (url.searchParams.has('v')) {
    e.respondWith(
      caches.match(req).then(bulunan => bulunan || fetch(req).then(res => {
        if (res && res.ok) {
          const kopya = res.clone();
          caches.open(CACHE).then(c => c.put(req, kopya)).catch(() => {});
        }
        return res;
      }))
    );
    return;
  }

  /* ---- 2) Geri kalan (index.html, manifest, yazı tipi): önce ağ ---- */
  e.respondWith(
    fetch(req)
      .then(res => {
        const kopya = res.clone();
        caches.open(CACHE).then(c => c.put(req, kopya)).catch(() => {});
        return res;
      })
      .catch(() => caches.match(req).then(r => r || caches.match('./index.html')))
  );
});
