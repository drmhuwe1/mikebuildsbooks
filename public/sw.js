// Service Worker for MikeBuildsBooks — Offline Support & Caching
const CACHE_VERSION = 'v1-mikebuildsbooks';
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/src/main.jsx',
  '/manifest.json'
];

// Install event — cache essential assets
self.addEventListener('install', (event) => {
  console.log('⚙️ Service Worker installing...');
  event.waitUntil(
    caches.open(CACHE_VERSION).then((cache) => {
      console.log('📦 Caching static assets');
      return cache.addAll(STATIC_ASSETS).catch(err => {
        console.warn('⚠️ Some assets could not be cached:', err);
      });
    })
  );
  self.skipWaiting();
});

// Activate event — cleanup old caches
self.addEventListener('activate', (event) => {
  console.log('🚀 Service Worker activated');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_VERSION) {
            console.log('🗑️ Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Fetch event — network first, fallback to cache
self.addEventListener('fetch', (event) => {
  const { request } = event;

  // Skip non-GET requests
  if (request.method !== 'GET') return;

  // Skip API calls (let them fail naturally in offline mode)
  if (request.url.includes('/api/') || request.url.includes('base44')) {
    return;
  }

  event.respondWith(
    fetch(request)
      .then((response) => {
        // Cache successful responses
        if (response && response.status === 200) {
          const responseToCache = response.clone();
          caches.open(CACHE_VERSION).then((cache) => {
            cache.put(request, responseToCache);
          });
        }
        return response;
      })
      .catch(() => {
        // Fallback to cache on network failure
        return caches.match(request).then((response) => {
          if (response) {
            console.log('📦 Serving from cache:', request.url);
            return response;
          }
          // Return offline page if asset not cached
          return caches.match('/index.html');
        });
      })
  );
});

// Background sync for offline form submissions (future enhancement)
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-data') {
    event.waitUntil(
      fetch('/api/sync').then(res => {
        console.log('✅ Offline data synced');
      }).catch(err => {
        console.warn('⚠️ Sync failed, will retry:', err);
        throw err; // Retry later
      })
    );
  }
});

console.log('✅ Service Worker script loaded');
