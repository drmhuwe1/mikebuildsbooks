// MikeBuildsBooks — App initialization (externalized from index.html)
// Handles: Service Worker registration, PWA install prompt, DNT awareness

(function () {
  // 1. Do Not Track awareness
  var dnt = navigator.doNotTrack || window.doNotTrack || navigator.msDoNotTrack;
  if (dnt === '1' || dnt === 'yes') {
    window.__DNT_ENABLED__ = true;
    // Signal to analytics/cookie scripts that DNT is active
    document.documentElement.setAttribute('data-dnt', 'true');
  }

  // 2. Service Worker registration
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', function () {
      navigator.serviceWorker.register('/sw.js').then(function (reg) {
        console.log('Service Worker registered');
      }).catch(function (err) {
        console.warn('Service Worker registration failed:', err);
      });
    });
  }

  // 3. PWA install prompt (Google Play / Android)
  var deferredPrompt;
  window.addEventListener('beforeinstallprompt', function (e) {
    e.preventDefault();
    deferredPrompt = e;
    window.__pwaInstallPrompt__ = deferredPrompt;
  });
})();
