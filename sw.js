// The Final Radar — Service Worker
const CACHE = 'tfr-weather-v3';
const SCOPE = self.registration.scope;
const STATIC = [
  SCOPE,
  SCOPE + 'index.html',
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

// Network-first for HTML and the service worker itself. This prevents an older
// installed PWA from keeping the previous home screen forever.
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

  // Never cache navigations or this file. The document must be able to pick up
  // the current entry route and the browser must be able to update this worker.
  if (e.request.mode === 'navigate' || url.pathname.endsWith('/sw.js')) {
    e.respondWith(
      fetch(new Request(e.request, { cache: 'no-store' })).catch(() =>
        caches.match(e.request).then((cached) => cached || caches.match(SCOPE + 'index.html'))
      )
    );
    return;
  }

  // Cache-first for hashed app assets
  e.respondWith(
    caches.match(e.request).then((cached) => cached || fetch(e.request))
  );
});
