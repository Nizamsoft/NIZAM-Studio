/* NIZAM | Studio — Service Worker
   Ağ öncelikli: geliştirme sırasında eski dosya takılıp kalmaz.
   Ağ yoksa önbellekten döner. */

const CACHE = 'nizam-studio-v0.36.0';
const SHELL = [
  './', './index.html', './style.css', './app.js', './config.js', './auth.js', './data.js', './prompt.js', './guncelle.js',
  './vendor/supabase.js',
  './manifest.webmanifest', './icon-192.png', './icon-512.png', './icon-180.png',
  './logo-n.png', './logo-full.png',
  './font/grotesk-600.woff2', './font/grotesk-700.woff2'
];

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

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== location.origin) return;

  e.respondWith(
    fetch(req)
      .then(res => {
        const copy = res.clone();
        caches.open(CACHE).then(c => c.put(req, copy)).catch(() => {});
        return res;
      })
      .catch(() => caches.match(req).then(r => r || caches.match('./index.html')))
  );
});
