// TFR Weather Pro — Service Worker
const CACHE = 'tfr-weather-v1';
const STATIC = [
  '/',
  '/index.html',
];

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE).then((c) => c.addAll(STATIC))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// Network-first for API calls; cache-first for static assets
self.addEventListener('fetch', (e) => {
  const url = new URL(e.request.url);

  // Always fetch API and tile data fresh
  if (
    url.hostname.includes('rainviewer') ||
    url.hostname.includes('open-meteo') ||
    url.hostname.includes('opensky') ||
    url.hostname.includes('nominatim') ||
    url.hostname.includes('arcgisonline') ||
    url.hostname.includes('tilecache')
  ) {
    return; // let browser handle it normally
  }

  // Cache-first for app shell
  e.respondWith(
    caches.match(e.request).then((cached) => cached || fetch(e.request))
  );
});
