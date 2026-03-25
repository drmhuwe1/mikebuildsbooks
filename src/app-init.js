// app-init.js — deferred init scripts (no inline handlers)
// Handles: DNT detection, static cookie consent banner, service worker registration

(function () {
  // ── 1. Do Not Track detection ─────────────────────────────────────────────
  var dnt = navigator.doNotTrack === '1' || window.doNotTrack === '1' || navigator.msDoNotTrack === '1';
  if (dnt) {
    window.__DNT_ENABLED__ = true;
    document.documentElement.setAttribute('data-dnt', 'true');
    // Suppress consent banner when DNT is active
    try { localStorage.setItem('cookieConsentGiven', 'false'); } catch (e) {}
  }

  // ── 2. Static cookie consent banner ──────────────────────────────────────
  var btn = document.getElementById('cookie-consent-static-accept');
  var banner = document.getElementById('cookie-consent-static');
  if (btn && banner) {
    btn.addEventListener('click', function () {
      if (dnt) {
        banner.style.display = 'none';
        return;
      }
      try { localStorage.setItem('cookieConsentGiven', 'true'); } catch (e) {}
      banner.style.display = 'none';
    });
    // Hide if already consented
    try {
      if (localStorage.getItem('cookieConsentGiven')) {
        banner.style.display = 'none';
      }
    } catch (e) {}
  }

  // ── 3. Service Worker registration ───────────────────────────────────────
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', function () {
      navigator.serviceWorker.register('/sw.js').catch(function () {
        // Silently fail if SW registration doesn't work
      });
    });
  }
})();