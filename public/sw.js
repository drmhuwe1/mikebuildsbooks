// MikeBuildsBooks Service Worker — offline support for PWA / Google Play
const CACHE_NAME = 'mbb-shell-v1';
const OFFLINE_URL = '/offline.html';

// App shell assets to pre-cache
const SHELL_ASSETS = [
  '/',
  '/Landing',
  '/offline.html',
  '/manifest.json',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(SHELL_ASSETS)).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  // Only handle GET requests for same-origin navigation
  if (event.request.method !== 'GET') return;

  const url = new URL(event.request.url);

  // For navigation requests: network first, fall back to offline page
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request).catch(() =>
        caches.match(OFFLINE_URL).then((r) => r || new Response('You are offline.', { headers: { 'Content-Type': 'text/html' } }))
      )
    );
    return;
  }

  // For app shell assets: cache first
  if (url.origin === self.location.origin) {
    event.respondWith(
      caches.match(event.request).then((cached) => cached || fetch(event.request))
    );
  }
});
