// app-init.js — deferred init scripts (no inline handlers)
// Handles: static cookie consent banner interaction

(function () {
  var btn = document.getElementById('cookie-consent-static-accept');
  var banner = document.getElementById('cookie-consent-static');
  if (!btn || !banner) return;

  btn.addEventListener('click', function () {
    if (navigator.doNotTrack === '1' || window.doNotTrack === '1') {
      banner.style.display = 'none';
      return;
    }
    try { localStorage.setItem('cookieConsentGiven', 'true'); } catch (e) {}
    banner.style.display = 'none';
  });

  // Also hide if already consented
  try {
    if (localStorage.getItem('cookieConsentGiven')) {
      banner.style.display = 'none';
    }
  } catch (e) {}
})();