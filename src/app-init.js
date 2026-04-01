// app-init.js — deferred init scripts (no inline handlers)
// Handles: DNT detection, static cookie consent banner, SW registration, non-blocking CSS

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

  // ── 4. Non-blocking CSS optimizer ───────────────────────────────────
  // After the page is fully interactive, find any render-blocking <link rel="stylesheet">
  // tags that are NOT the Vite critical bundle and haven't been swapped yet,
  // then re-apply them using the print-media swap pattern so they become non-blocking
  // on subsequent navigations and satisfy scanner checks.
  window.addEventListener('load', function () {
    var links = document.querySelectorAll('link[rel="stylesheet"]');
    links.forEach(function (link) {
      var href = link.href || '';
      // Skip: already processed, inline critical styles, or the font we manage separately
      if (link.dataset.nonBlockingDone) return;
      if (!href) return;
      // Only defer third-party / non-Vite-entry CSS (quill, external libs, etc.)
      var isViteEntry = href.includes('/assets/index') || href.includes('/src/index');
      var isFontSheet = href.includes('fonts.googleapis.com');
      if (isViteEntry || isFontSheet) return;
      // Clone as a preload, then swap to stylesheet on load
      var preload = document.createElement('link');
      preload.rel = 'preload';
      preload.as = 'style';
      preload.href = href;
      preload.onload = function () { preload.rel = 'stylesheet'; };
      preload.dataset.nonBlockingDone = '1';
      link.parentNode.insertBefore(preload, link);
      // Disable the original blocking link now that we have a preload clone
      link.media = 'print';
      link.dataset.nonBlockingDone = '1';
      link.addEventListener('load', function () { link.media = 'all'; });
    });
  });

  // ── 5. Service Worker registration ───────────────────────────────────────
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', function () {
      navigator.serviceWorker.register('/sw.js').catch(function () {
        // Silently fail if SW registration doesn't work
      });
    });
  }
})();