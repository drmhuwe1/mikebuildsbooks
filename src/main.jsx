import React from 'react'
import ReactDOM from 'react-dom/client'
import App from '@/App.jsx'
import '@/index.css'

// Initialize DNT and normalize third-party widget tabindex
const initDNT = () => {
  const dntEnabled = navigator.doNotTrack === '1' || navigator.doNotTrack === 'yes' || window.__DNT_ENABLED__;
  if (dntEnabled) {
    document.documentElement.setAttribute('data-dnt', 'true');
    window.__DNT_ENABLED__ = true;
  }
};

// Normalize third-party widget tabindex (Stripe, etc.) to prevent positive tabindex values
const normalizeThirdPartyTabindex = () => {
  // Observe for dynamically injected third-party iframes and elements
  const observer = new MutationObserver(() => {
    document.querySelectorAll('[tabindex="1"], [tabindex="2"], [tabindex="3"], [tabindex="4"], [tabindex="5"]').forEach(el => {
      el.setAttribute('tabindex', '-1');
    });
  });
  observer.observe(document.body, { subtree: true, attributes: true, attributeFilter: ['tabindex'] });
  
  // Initial scan for existing third-party elements with positive tabindex
  document.querySelectorAll('[tabindex="1"], [tabindex="2"], [tabindex="3"], [tabindex="4"], [tabindex="5"]').forEach(el => {
    el.setAttribute('tabindex', '-1');
  });
};

initDNT();
normalizeThirdPartyTabindex();

ReactDOM.createRoot(document.getElementById('root')).render(
  <App />
)

// Service worker registration is handled in public/app-init.js (deferred external script)
// cache-bust: 2026-05-12