const CACHE = 'tfr-weather-v2';
const BASE = '/radar/';
const STATIC = [
  BASE,
  BASE + 'the_final_radar.html',
  BASE + 'index.html',
];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(STATIC).catch(() => {})));
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

self.addEventListener('fetch', (e) => {
  const url = new URL(e.request.url);
  if (
    url.hostname.includes('rainviewer') ||
    url.hostname.includes('open-meteo') ||
    url.hostname.includes('opensky') ||
    url.hostname.includes('nominatim') ||
    url.hostname.includes('arcgisonline') ||
    url.hostname.includes('tilecache')
  ) {
    return;
  }
  e.respondWith(
    caches.match(e.request).then((cached) => cached || fetch(e.request))
  );
});
