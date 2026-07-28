// Basic service worker: caches the app shell so the site still loads offline.
// Live API data (rates, crypto, metals) is NOT cached here — that's handled
// separately in index.html via localStorage so users always see fresh data
// when online, and the app shell (not stale prices) when offline.

const CACHE_NAME = 'currency-suite-v1';
const APP_SHELL = [
  './index.html',
  './manifest.json'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  // Only handle same-origin GET requests for the app shell; let API calls
  // (open.er-api.com, coingecko, flagcdn, fonts, etc.) go straight to network.
  if (event.request.method !== 'GET' || !event.request.url.startsWith(self.location.origin)) {
    return;
  }
  event.respondWith(
    caches.match(event.request).then((cached) => cached || fetch(event.request))
  );
});
