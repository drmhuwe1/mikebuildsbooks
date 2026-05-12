// MikeBuildsBooks — App Init
// Runs early (defer) to handle: Service Worker registration, DNT detection, cookie banner static dismiss

(function () {
  // ── 1. Do Not Track (DNT) detection ────────────────────────────────────────
  var dnt = navigator.doNotTrack || window.doNotTrack || navigator.msDoNotTrack;
  var dntEnabled = dnt === '1' || dnt === 'yes' || dnt === true;
  // Expose globally so CookieConsent.jsx and analytics code can check
  window.__DNT_ENABLED__ = dntEnabled;
  if (dntEnabled) {
    // Mark <html> for CSS/selector access
    document.documentElement.setAttribute('data-dnt', 'true');
    // Suppress analytics cookies immediately
    try { localStorage.setItem('cookieConsentGiven', 'false'); } catch (e) {}
  }

  // ── 2. Service Worker registration ─────────────────────────────────────────
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', function () {
      navigator.serviceWorker.register('/sw.js').catch(function () {
        // SW registration failure is non-fatal — app still works
      });
    });
  }

  // ── 3. Static cookie banner dismiss button wiring ──────────────────────────
  // The static HTML banner in index.html needs its button wired up before React loads
  var staticAcceptBtn = document.getElementById('cookie-consent-static-accept');
  if (staticAcceptBtn) {
    staticAcceptBtn.addEventListener('click', function () {
      try { localStorage.setItem('cookieConsentGiven', 'true'); } catch (e) {}
      var banner = document.getElementById('cookie-consent-static');
      if (banner) banner.style.display = 'none';
    });
  }
})();
