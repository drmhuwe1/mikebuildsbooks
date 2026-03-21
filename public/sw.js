// Service Worker for offline support
const CACHE_NAME = 'mikebuildsbooks-v1';
const ASSETS_TO_CACHE = [
  '/',
  '/index.html',
  '/src/main.jsx',
  '/manifest.json',
  'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap'
];

// Install event: cache assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE).catch(() => {
        // If caching fails, continue anyway
      });
    })
  );
  self.skipWaiting();
});

// Activate event: clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((name) => {
          if (name !== CACHE_NAME) {
            return caches.delete(name);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Fetch event: network first, fallback to cache
self.addEventListener('fetch', (event) => {
  // Skip non-GET requests
  if (event.request.method !== 'GET') return;

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // Cache successful responses
        if (response.ok) {
          const cache = caches.open(CACHE_NAME);
          cache.then((c) => c.put(event.request, response.clone()));
        }
        return response;
      })
      .catch(() => {
        // Network failed; try cache
        return caches.match(event.request).then((cached) => {
          if (cached) return cached;
          // If not in cache and offline, return offline page
          if (event.request.destination === 'document') {
            return new Response(
              `<!DOCTYPE html>
              <html>
              <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Offline</title>
                <style>
                  body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: #000; color: #fff; display: flex; align-items: center; justify-content: center; min-height: 100vh; margin: 0; padding: 20px; }
                  .container { text-align: center; max-width: 400px; }
                  h1 { font-size: 28px; margin-bottom: 10px; }
                  p { font-size: 16px; color: #94a3b8; margin-bottom: 20px; }
                  button { background: #facc15; color: #000; border: none; border-radius: 8px; padding: 12px 24px; font-size: 14px; font-weight: 600; cursor: pointer; }
                  button:hover { background: #fbbf24; }
                </style>
              </head>
              <body>
                <div class="container">
                  <h1>📡 You're Offline</h1>
                  <p>It looks like you've lost your internet connection. Please check your connection and try again.</p>
                  <button onclick="location.reload()">Retry</button>
                </div>
              </body>
              </html>`,
              { status: 200, headers: { 'Content-Type': 'text/html' } }
            );
          }
          return new Response('Offline', { status: 503 });
        });
      })
  );
});
