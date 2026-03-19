// MikeBuildsBooks Service Worker
const CACHE_NAME = "mikebuildsbooks-v1";

self.addEventListener("install", (e) => {
  self.skipWaiting();
});

self.addEventListener("activate", (e) => {
  e.waitUntil(clients.claim());
});

self.addEventListener("fetch", (e) => {
  // Network first — let the app work normally
  e.respondWith(fetch(e.request).catch(() => caches.match(e.request)));
});

// Handle badge updates from the app
self.addEventListener("message", (e) => {
  if (e.data?.type === "SET_BADGE") {
    const count = e.data.count || 0;
    if ("setAppBadge" in navigator) {
      if (count > 0) {
        navigator.setAppBadge(count);
      } else {
        navigator.clearAppBadge();
      }
    }
  }
});
