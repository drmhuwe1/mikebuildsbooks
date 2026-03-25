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
    if (window.matchMedia("(display-mode: standalone)").matches) {
      setInstalled(true);
      return;
    }

    const platform = getOS();
    setOs(platform);

    const snoozedUntil = localStorage.getItem("pwa_install_snooze");
    if (snoozedUntil && Date.now() < Number(snoozedUntil)) return;

    const handler = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShow(true);
    };

    window.addEventListener("beforeinstallprompt", handler);

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
    localStorage.setItem("pwa_install_snooze", String(Date.now() + 7 * 24 * 60 * 60 * 1000));
  };

  const handleDismiss = () => {
    setShow(false);
    localStorage.setItem("pwa_install_snooze", String(Date.now() + 30 * 24 * 60 * 60 * 1000));
  };

  if (!show || installed) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Install MikeBuildsBooks app"
      className="fixed bottom-6 right-4 z-50 bg-gray-900 border border-yellow-400/40 rounded-2xl shadow-2xl p-4 w-64"
    >
      <button
        onClick={handleDismiss}
        className="absolute top-2 right-2 text-gray-500 hover:text-gray-300"
        aria-label="Close install prompt"
      >
        <X className="w-4 h-4" />
      </button>

      <div className="flex items-center gap-3 mb-3">
        <img
          src="https://media.base44.com/images/public/69b9774720c1d890b1162f57/e77fb292d_faviconimageMikeBuilds.png"
          alt="MikeBuildsBooks"
          className="w-10 h-10 rounded-xl shrink-0"
        />
        <div>
          <p className="text-white text-sm font-bold leading-tight">Install App</p>
          <p className="text-gray-400 text-xs leading-tight">Fast, offline-ready access</p>
        </div>
      </div>

      {os === "ios" ? (
        <>
          <p className="text-gray-300 text-xs mb-3">
            Tap <Share className="inline w-3 h-3 mx-0.5 text-blue-400" /> then <strong className="text-white">"Add to Home Screen"</strong>
          </p>
          <button onClick={handleDismiss} className="w-full text-center text-xs text-gray-500 hover:text-gray-300">Got it</button>
        </>
      ) : (
        <>
          <Button
            onClick={handleInstall}
            className="w-full bg-yellow-400 hover:bg-yellow-300 text-black font-bold text-sm py-2 h-auto gap-1.5 mb-2"
          >
            <Download className="w-3.5 h-3.5" /> Install
          </Button>
          <button onClick={handleLater} className="w-full text-center text-xs text-gray-500 hover:text-gray-300">
            Remind me later
          </button>
        </>
      )}
    </div>
  );
}