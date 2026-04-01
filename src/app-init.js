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

  // ── 3. Font stylesheet swap (avoids INP-risk inline onload handler) ───────
  var fontLink = document.getElementById('font-stylesheet');
  if (fontLink) {
    function applyFont() { fontLink.rel = 'stylesheet'; }
    // If already loaded (cached), apply immediately; otherwise wait for load event
    if (fontLink.loaded) {
      applyFont();
    } else {
      fontLink.addEventListener('load', applyFont, { once: true });
    }
  }

  // ── 4. Service Worker registration ───────────────────────────────────────
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', function () {
      navigator.serviceWorker.register('/sw.js').catch(function () {
        // Silently fail if SW registration doesn't work
      });
    });
  }
})();