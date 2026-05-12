import React from 'react'
import ReactDOM from 'react-dom/client'
import App from '@/App.jsx'
import '@/index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <App />
)

// Service worker registration is handled in public/app-init.js (deferred external script)
// cache-bust: 2026-05-12