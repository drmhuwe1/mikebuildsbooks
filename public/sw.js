// MikeBuildsBooks Service Worker — offline support for Google Play / PWA
const CACHE_NAME = 'mbb-v1';
const OFFLINE_URL = '/offline.html';

// Assets to pre-cache on install
const PRECACHE_ASSETS = [
  '/',
  '/Landing',
  '/manifest.json',
  '/offline.html',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(PRECACHE_ASSETS)).then(() => self.skipWaiting())
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
  // Only handle GET requests
  if (event.request.method !== 'GET') return;

  const url = new URL(event.request.url);

  // Network-first for API/backend calls
  if (url.pathname.startsWith('/api/') || url.pathname.startsWith('/functions/')) {
    return; // Let browser handle normally
  }

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // Cache successful HTML navigations
        if (response.ok && event.request.mode === 'navigate') {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
        }
        return response;
      })
      .catch(() => {
        // Offline fallback for navigations
        if (event.request.mode === 'navigate') {
          return caches.match(OFFLINE_URL) || caches.match('/');
        }
        return caches.match(event.request);
      })
  );
});
