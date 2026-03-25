import React, { useState, useEffect } from "react";
import { X, Download, Share } from "lucide-react";
import { Button } from "@/components/ui/button";

function getOS() {
  const ua = navigator.userAgent;
  if (/android/i.test(ua)) return "android";
  if (/ipad|iphone|ipod/i.test(ua)) return "ios";
  return "other";
}

export default function PWAInstallBanner() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [show, setShow] = useState(false);
  const [os, setOs] = useState("other");
  const [installed, setInstalled] = useState(false);

  useEffect(() => {
    // Already installed as standalone — don't show
    if (window.matchMedia("(display-mode: standalone)").matches) {
      setInstalled(true);
      return;
    }

    const platform = getOS();
    setOs(platform);

    // Check snooze
    const snoozedUntil = localStorage.getItem("pwa_install_snooze");
    if (snoozedUntil && Date.now() < Number(snoozedUntil)) return;

    const handler = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShow(true);
    };

    window.addEventListener("beforeinstallprompt", handler);

    // iOS: show manually after 3s if not already installed
    if (platform === "ios") {
      const timer = setTimeout(() => setShow(true), 3000);
      return () => {
        clearTimeout(timer);
        window.removeEventListener("beforeinstallprompt", handler);
      };
    }

    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    setShow(false);
    setDeferredPrompt(null);
    if (outcome === "accepted") {
      localStorage.setItem("pwa_install_snooze", String(Date.now() + 365 * 24 * 60 * 60 * 1000));
    }
  };

  const handleLater = () => {
    setShow(false);
    // Snooze for 7 days
    localStorage.setItem("pwa_install_snooze", String(Date.now() + 7 * 24 * 60 * 60 * 1000));
  };

  const handleDismiss = () => {
    setShow(false);
    // Snooze for 30 days on explicit X
    localStorage.setItem("pwa_install_snooze", String(Date.now() + 30 * 24 * 60 * 60 * 1000));
  };

  if (!show || installed) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 z-[60]"
        onClick={handleDismiss}
        aria-hidden="true"
      />

      {/* Bottom sheet */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Install MikeBuildsBooks app"
        className="fixed bottom-0 left-0 right-0 z-[70] bg-gray-900 border-t border-yellow-400/30 rounded-t-2xl shadow-2xl px-6 pt-5 pb-8 animate-slide-up"
      >
        {/* Handle bar */}
        <div className="w-10 h-1 bg-gray-600 rounded-full mx-auto mb-5" />

        {/* Dismiss */}
        <button
          onClick={handleDismiss}
          className="absolute top-4 right-4 text-gray-500 hover:text-gray-300 p-1"
          aria-label="Close install prompt"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-4 mb-5">
          <img
            src="https://media.base44.com/images/public/69b9774720c1d890b1162f57/e77fb292d_faviconimageMikeBuilds.png"
            alt="MikeBuildsBooks app icon"
            className="w-16 h-16 rounded-2xl border border-gray-700 shrink-0"
          />
          <div>
            <p className="text-white text-lg font-bold leading-tight">MikeBuildsBooks</p>
            <p className="text-gray-400 text-sm">Construction Business Management</p>
            <div className="flex items-center gap-1 mt-1">
              {[1,2,3,4,5].map(s => (
                <span key={s} className="text-yellow-400 text-xs">★</span>
              ))}
              <span className="text-gray-300 text-xs ml-1">Free to install</span>
            </div>
          </div>
        </div>

        {os === "ios" ? (
          <>
            <div className="bg-gray-800 rounded-xl p-4 mb-5">
              <p className="text-white text-sm font-semibold mb-2">Add to Home Screen</p>
              <ol className="text-gray-300 text-sm space-y-2">
                <li className="flex items-start gap-2">
                  <span className="text-yellow-400 font-bold shrink-0">1.</span>
                  Tap the <Share className="inline w-4 h-4 mx-1 text-blue-400" /> Share button in Safari
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-yellow-400 font-bold shrink-0">2.</span>
                  Scroll down and tap <strong className="text-white">"Add to Home Screen"</strong>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-yellow-400 font-bold shrink-0">3.</span>
                  Tap <strong className="text-white">Add</strong> — done!
                </li>
              </ol>
            </div>
            <Button onClick={handleDismiss} variant="outline" className="w-full border-gray-700 text-gray-300">
              Got it
            </Button>
          </>
        ) : (
          <>
            <p className="text-gray-400 text-sm mb-5">
              Install the app for fast, offline-ready access to your jobs, bids, and finances — right from your home screen.
            </p>
            <div className="flex flex-col gap-3">
              <Button
                onClick={handleInstall}
                className="w-full bg-yellow-400 hover:bg-yellow-300 text-black font-bold text-base py-3 h-auto gap-2"
              >
                <Download className="w-5 h-5" /> Install App
              </Button>
              <button
                onClick={handleLater}
                className="text-gray-400 hover:text-gray-200 text-sm text-center transition-colors py-1"
              >
                Not now — remind me in 7 days
              </button>
            </div>
          </>
        )}
      </div>

      <style>{`
        @keyframes slide-up {
          from { transform: translateY(100%); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
        .animate-slide-up {
          animation: slide-up 0.3s cubic-bezier(0.32, 0.72, 0, 1) forwards;
        }
      `}</style>
    </>
  );
}