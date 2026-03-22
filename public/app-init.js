// DNT (Do Not Track) detection — runs before React hydration
(function () {
  try {
    var dnt =
      navigator.doNotTrack === '1' ||
      navigator.doNotTrack === 'yes' ||
      window.doNotTrack === '1' ||
      navigator.msDoNotTrack === '1';

    if (dnt) {
      // Expose flag for CookieConsent component
      window.__DNT_ENABLED__ = true;
      // Mark on root element so CSS can react if needed
      document.documentElement.setAttribute('data-dnt', 'true');
    } else {
      window.__DNT_ENABLED__ = false;
    }
  } catch (e) {
    window.__DNT_ENABLED__ = false;
  }
})();
