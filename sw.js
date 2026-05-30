const CACHE = 'miprestamo-v1';
const ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './icon-192.png',
  './icon-512.png',
  'https://fonts.googleapis.com/css2?family=Syne:wght@400;500;600;700&family=Instrument+Sans:wght@400;500;600&display=swap',
  'https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js',
  'https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js',
  'https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js'
];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(cache => {
      // Cache local assets only (Firebase URLs pueden fallar offline)
      return cache.addAll(['./', './index.html', './manifest.json', './icon-192.png', './icon-512.png'])
        .catch(() => {});
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', e => {
  // Solo cachea requests GET
  if (e.request.method !== 'GET') return;

  // Para Firebase, siempre red primero
  if (e.request.url.includes('firebase') || e.request.url.includes('google')) {
    e.respondWith(
      fetch(e.request).catch(() => caches.match(e.request))
    );
    return;
  }

  // Para el resto: cache first, luego red
  e.respondWith(
    caches.match(e.request).then(cached => {
      if (cached) return cached;
      return fetch(e.request).then(res => {
        if (res && res.status === 200) {
          const clone = res.clone();
          caches.open(CACHE).then(cache => cache.put(e.request, clone));
        }
        return res;
      });
    })
  );
});
